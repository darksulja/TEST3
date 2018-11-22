/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-09 23:00:26
* @Last Modified by:   Ray Olsen
* @Last Modified time: 2018-04-11 17:21:00
*/

var MediatorCommons = {

	log : function (functionName, message)  {
		print("MediatorCommons # " + functionName + " : " + message);
	},

	loadScriptFile: function(scriptName) {
		var functionName = "loadScripFile";
		this.log(functionName, "Loading "+scriptName+" js ")
		load("/opt/evertz/mediator/etc/runners/" + scriptName + ".js");
		this.log(functionName, scriptName + " is Initialized" )
	},

	sendDefaultEmailNotification : function(process,entityType,entityId, addresses) {
		var functionName = "sendDefaultEmailNotification";
		this.log(functionName, "Start");

		if(typeof NotificationTemplate == "undefined"){
			this.loadScriptFile("NotificationTemplate");
		}

		if(typeof NotificationHelper == "undefined"){
			this.loadScriptFile("NotificationHelper");
		}

		var header = "Mediator" + " " + process + " " + "Notification";
		var subHeader = process + " for " + entityType + " " + entityId;
		var template = new NotificationTemplate();

		template.setEntityId(entityId);
		template.setEntityType(entityType);
		template.setHeader(header);
		template.setSubHeader(subHeader);

		messageSubject = process + " for [" + entityId + "] Notification";
		messageBody = template.getEmailMessage();

		notification = new NotificationHelper()
		for each (address in addresses){
			notification.addPrimaryRecipients(address.toString());
		}
		notification.setMessageSubject(messageSubject);
		notification.setMessageBody(messageBody);
		notification.sendNotification();
		this.log(functionName, "End");
	}
}

if(typeof(wscall)==="undefined"){
	print("Loading ShellFun js ")
	load("/opt/evertz/mediator/lib/js/shellfun.js");
}

if(typeof(JSCommons)==="undefined"){
	print("Loading JSCommons js ")
	load("/opt/evertz/mediator/etc/helpers/JSCommons.js");
}
