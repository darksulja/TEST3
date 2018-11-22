/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-09 21:08:00
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-05-17 00:29:52
*/

var NotificationTemplate = function () {

	if ((this instanceof NotificationTemplate) === false) {
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

	this.__entityId = "";
	this.__entityType = "";
}

NotificationTemplate.prototype.constructor = NotificationTemplate;

NotificationTemplate.prototype.log = function (functionName, message)  {
	print("NotificationTemplate # " + functionName + " : " + message);
}

NotificationTemplate.prototype.setEntityId = function(entityId){
	this.__entityId = entityId;
}

NotificationTemplate.prototype.setEntityType = function(entityType){
	this.__entityType = entityType
}

NotificationTemplate.prototype.setHeader = function(header){
	this.__header = header
}

NotificationTemplate.prototype.setSubHeader = function(subHeader){
	this.__subHeader = subHeader
}

NotificationTemplate.prototype.__getTemplate = function(){
	if(this.__entityType == "placing"){
		return "Placing Email Notification Template";
	}else{
		throw new error("Other Entities are Not Implemented");
	}
}

NotificationTemplate.prototype.__getEntity = function(){
	if(this.__entityType == "placing"){
		return placingGet(this.__entityId, "shorttext","fulltext","tag")..Placing;
	}else{
		throw new error("Other Entities are Not Implemented");
	}
}

NotificationTemplate.prototype.getEmailMessage = function(){

	var entity = this.__getEntity();

	// I didnt know how to access ShortTexts/Tags in Output Templates

	var metadata = new XML();

	for each (shortText in entity..ShortText){
		var elementTag = JSCommons.normalizeText(shortText.ShortTextType.toString());
		elementTag = elementTag.replace(/ /g,"");
		var element = new XML("<" + elementTag + ">" + JSCommons.encodeXML(shortText.Value.toString()) + "</" + elementTag+ ">");
		metadata+=element;
	}

	var uniqueTags = [];
	for each (tagElm in entity..Tag){
		if(uniqueTags.indexOf(tagElm.TagType.toString())<0){
			uniqueTags.push(tagElm.TagType.toString())
		}
	}

	for each (tagName in uniqueTags){
		var tags = entity..Tag.(TagType == tagName);
		var elementTag = JSCommons.normalizeText(tagName);
		elementTag = elementTag.replace(/ /g,"");
		var element = new XML("<" + elementTag + ">" + "<StringList></StringList>" + "</" + elementTag+ ">");
		for each (tag in tags){
			element.StringList.appendChild(<String>{JSCommons.encodeXML(tag.Value.toString())}</String>);
		}
		metadata+=element;
	}

	delete entity.ShortTextList;
	delete entity.TagList;

	return wscall(<PharosCs>
	  <CommandList>
	    <Command subsystem="outputTemplate" method="populate">
	      <ParameterList>
	        <Parameter name="outputTemplate" value="Placing Email Notification Template"/>
	        <Parameter name="outputData">
	          <Value>
	            <Mapping>
	              <header>{this.__header}</header>
	              <subHeader>{this.__subHeader}</subHeader>
	              <Entity>{entity}</Entity>
	              {metadata}
	            </Mapping>
	          </Value>
	        </Parameter>
	      </ParameterList>
	    </Command>
	  </CommandList>
	</PharosCs>)..PopulatedOutputTemplate.Output;
}

