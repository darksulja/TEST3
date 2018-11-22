/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-09 21:08:00
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-05-17 00:03:58
*/

var NotificationHelper = function () {

	if ((this instanceof NotificationHelper) === false) {
		throw new Error("Please call constructor with new() keyword");
	}

	if(typeof(wscall)==="undefined"){
		print("Loading ShellFun js ")
		load("/opt/evertz/mediator/lib/js/shellfun.js");	
	}

	if(typeof(JSCommons)==="undefined"){
		print("Loading JSCommons js ")
		load("/opt/evertz/mediator/etc/helpers/JSCommons.js");	
	}
	if(typeof(MediatorCommons)==="undefined"){
		print("Loading JSCommons js ")
		load("/opt/evertz/mediator/etc/helpers/MediatorCommons.js");	
	}

	this.__primaryRecipients = [];
	this.__carbonCopyRecipients = [];
	this.__blindCarbonCopyRecipients = [];
	this.__messageBody = "";
	this.__messageSubject = "";
}

NotificationHelper.prototype.constructor = NotificationHelper;

NotificationHelper.prototype.log = function (functionName, message)  {
	print("NotificationHelper # " + functionName + " : " + message);
}

NotificationHelper.prototype.setPrimaryRecipients = function(recipients){
	this.__primaryRecipients = recipients
}

NotificationHelper.prototype.setCarbonCopyRecipients = function(recipients){
	this.__carbonCopyRecipients = recipients
}

NotificationHelper.prototype.setBlindCarbonCopyRecipients = function(recipients){
	this.__blindCarbonCopyRecipients = recipients
}

NotificationHelper.prototype.addPrimaryRecipients = function(recipient){
	this.__primaryRecipients.push(recipient);
}

NotificationHelper.prototype.addCarbonCopyRecipients = function(recipient){
	this.__carbonCopyRecipients.push(recipient);
}

NotificationHelper.prototype.addBlindCarbonCopyRecipients = function(recipient){
	this.__blindCarbonCopyRecipients.push(recipient);
}

NotificationHelper.prototype.setMessageBody = function(messageBody){
	this.__messageBody = messageBody;
}

NotificationHelper.prototype.setMessageSubject = function(messageSubject){
	this.__messageSubject = messageSubject;
}

NotificationHelper.prototype.logNotificationParameters =  function (){
	var functionName = "logNotificationParameters";
	this.log(functionName, "Start");
	this.log(functionName, "PrimaryRecipients : ["+this.__primaryRecipients+"]");
	this.log(functionName, "CarbonCopyRecipients : ["+this.__carbonCopyRecipients+"]");
	this.log(functionName, "BlindCarbonCopyRecipients : ["+this.__blindCarbonCopyRecipients+"]");
	this.log(functionName, "MessageSubject  : ["+this.__messageSubject+"]");
	this.log(functionName, "End");
}

NotificationHelper.prototype.__buidNotificationJobDescription = function(){
	var messageBody = new XML("<![CDATA[" + this.__messageBody + "]]>");
	var jobDescription =   <JobDescription>
			<Properties>
				<Mapping>
					<address>{this.__primaryRecipients.join(";")}</address>
					<ccAddress>{this.__carbonCopyRecipients.join(";")}</ccAddress>
					<bccAddress>{this.__blindCarbonCopyRecipients.join(";")}</bccAddress>
					<subject>{this.__messageSubject}</subject>
					<body>{messageBody}</body>
				</Mapping>
			</Properties>
	    </JobDescription>;
	return jobDescription;
}

NotificationHelper.prototype.sendNotification =  function (){
	var functionName = "sendNotification";
	const EMAIL_JOB_FACTORY_NAME = "customEmailJobFactory"

	this.log(functionName, "Start");
	if(typeof JobHelper === "undefined"){
		MediatorCommons.loadScriptFile("JobHelper");
	}

	var jobHelper = new JobHelper();
	jobHelper.setJobFactory(EMAIL_JOB_FACTORY_NAME);
	jobHelper.setJobDescription(this.__buidNotificationJobDescription());
	jobHelper.executeJob();
	this.log(functionName, "End");
}

