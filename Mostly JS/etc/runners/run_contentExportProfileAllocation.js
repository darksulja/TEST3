/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-09 21:04:34
* @Last Modified by:   Ray Olsen
* @Last Modified time: 2018-04-11 17:21:00
* @Last modified 8/20/19 
* @Last modified by: Chris Filippone
*/
//
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/DaisyIdInspector.js");
load("/opt/evertz/mediator/etc/helpers/ContentExportHelper.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");

print("\nRunning run_contentExportProfileAllocation.js");

ContentExportProfileAllocation = function(placingId){
	if ((this instanceof ContentExportProfileAllocation) === false) {
		throw new Error("Please call constructor with new() keyword");
	}
	this.__placingId = placingId;
};

ContentExportProfileAllocation.prototype.constructor = ContentExportProfileAllocation;

ContentExportProfileAllocation.prototype.states = {
	originalState : "Source Selection"
};

ContentExportProfileAllocation.prototype.requirements = {
	complete : "Complete (Exports)",
	error : "Error (Exports)"
};

ContentExportProfileAllocation.prototype.log = function (functionName, message)  {
	print("ContentExportProfileAllocation # " + functionName + " : " + message);
};

ContentExportProfileAllocation.prototype.setPlacingHelper = function(placingHelper) {
	var functionName = "setPlacingHelper";
	this.log(functionName, "Start");
	this.__placingHelper = placingHelper;
	this.log(functionName, "End");
}

ContentExportProfileAllocation.prototype.setContentExportHelper = function(contentExportHelper) {
	var functionName = "setContentExportHelper";
	this.log(functionName, "Start");
	this.__contentExportHelper = contentExportHelper;
	this.log(functionName, "End");
}

ContentExportProfileAllocation.prototype.buildMinifiedPlacingObject = function ()  {
	var functionName = "buildMinifiedPlacingObject";
	this.log(functionName, "Start");
	var obj = {};

	obj.placingId = this.__placingId;
	obj.placingXml = placingGet(this.__placingId, "shorttext", "tag" )..Output.Placing;
	obj.tvdProduction = obj.placingXml.ShortTextList.ShortText.(ShortTextType == "TVD Production #").Value.toString();
	// daisy id
	obj.daisyId = obj.placingXml.ShortTextList.ShortText.(ShortTextType == "Daisy ID").Value.toString();
	obj.publicationDefinitionName = obj.placingXml.ShortTextList.ShortText.(ShortTextType == "Profile").Value.toString();
	obj.profileAspectRatio = obj.placingXml.ShortTextList.ShortText.(ShortTextType == "Profile Aspect Ratio").Value.toString();
	obj.originalAspectRatio = obj.profileAspectRatio.indexOf("OAR")>-1 ? "true" : "false";
	if(obj.originalAspectRatio=="false"){
		var regExp = /\(([^)]+)\)/;
		var matches = regExp.exec(obj.profileAspectRatio);
		if(matches.length==2){
			obj.useableaspectratio = matches[1].replace(":", ".");
		}else {
			throw new Error("Failure to evaluate Aspect Ratio from Profile Aspect Ratio in Placing")
		}
	}
	obj.materialText = obj.placingXml.ShortTextList.ShortText.(ShortTextType == "Material Text").Value.toString();
	this.log(functionName, "End");
	return obj;
};

ContentExportProfileAllocation.prototype.getSettings = function() {
	var functionName = "getSettings";
	this.log(functionName, "Start");
	var settings = {};
	this.__placingHelper.refresh();
	var placingXml = this.__placingHelper.getPlacingXml();
	var placingTagList = placingXml..PublicationDefinition.Presets.PresetList.Preset.TagList;
	var versionPreference = placingTagList.Tag.(TagType == "NLD Texted/Textless").Value.toString();
	settings["versionPreference"] = versionPreference;
	this.log(functionName, "End");
	return settings;
}

ContentExportProfileAllocation.prototype.validatePlacingObject = function (obj)  {
	var functionName = "validatePlacingObject";
	this.log(functionName, "Start");
	for (var prop in obj){
		if(obj[prop] == false){
			this.log(functionName, "Cannot find Value in Object for Property ["+prop+"]");
		}else {
			if(typeof obj[prop] != "xml" && typeof obj[prop] != "object"){
				this.log(functionName, prop + " has value ["+obj[prop]+"]");
			}else{
				this.log(functionName, prop + " is a complex object and not printing in logs");
			}
		}
	}
	this.log(functionName, "End");
};

ContentExportProfileAllocation.prototype.getVersionTypeMapping = function(){

	var versionTypeObj = {
		fullyTexted : "OM-FTEXTED",
		textlessAtEnd : "OM-TATEND",
		fullyTextless : "OM-FTLESS",
		textlessElements : "OM-TELEMENTS",
		vamFullyTexted : "VAM-FTEXTED",
		vamTextlessAtEnd : "VAM-TATEND",
		vamFullyTextless : "VAM-FTLESS",
		vamTextlessElements : "VAM-TELEMENTS"
	}

	var versionTypeMap = {
		"Texted Only" : [versionTypeObj.fullyTexted],
		"Texted Preferred, but can accept Textless" : [versionTypeObj.fullyTexted, versionTypeObj.textlessAtEnd, versionTypeObj.fullyTextless],
		"Textless Only"	: [versionTypeObj.fullyTextless],
		"Textless Preferred, but can accept Texted"	: [versionTypeObj.fullyTextless, versionTypeObj.fullyTexted, versionTypeObj.textlessAtEnd],
		"Textless at End Only" : [versionTypeObj.textlessAtEnd],
		"Texted Preferred, but can accept Texted VAM" : [versionTypeObj.fullyTexted, versionTypeObj.textlessAtEnd, versionTypeObj.vamFullyTexted, versionTypeObj.vamTextlessAtEnd],
		"Textless Preferred, but can accept Textless VAM" : [versionTypeObj.fullyTextless, versionTypeObj.vamFullyTextless],
		"Textless at End Preferred, but can accept Textless at End VAM" : [versionTypeObj.textlessAtEnd, versionTypeObj.vamTextlessAtEnd]
	}
	return versionTypeMap;
}

ContentExportProfileAllocation.prototype.findSourceMaterial = function(obj){
//
var daisyID = obj.daisyId;
print("Checking for daisy id = "+daisyID);
var daisyIdInspector = new DaisyIdInspector(daisyID);
var matchingMaterialObject = daisyIdInspector.getMaterialObject();
print("Material ID : " + matchingMaterialObject.matid)
print("MatID" + gmoNBCFunc.isVarUsable(matchingMaterialObject.matid));
if (!gmoNBCFunc.isVarUsable(matchingMaterialObject.matid)){
// GMO ID
print("Looking for GMO id = "+daisyID);
	var mgetXml = materialGet(daisyID, "shorttext", "tag", "tracks", "trackTypeLinks")..Material;
	var matchingMaterialObject = {
		matid : daisyID,
		versiontype : mgetXml.VersionType.toString(),
		aspectratio : mgetXml.AspectRatio.toString(),
		tvdproductionnumber : mgetXml..ShortText.(ShortTextType.toString() === "TVD Production #").Value.toString(),
		daisyid : mgetXml..ShortText.(ShortTextType.toString() === "Daisy ID").Value.toString(),
		framerate : mgetXml.FrameRate.toString(),
		territorytype : mgetXml..Tag.(TagType.toString() === "Territory Sub-Type").Value.toString(),
		trackDefinitionList : mgetXml..TrackDefinition,
		trackTypeLinkList : mgetXml..TrackTypeLink,
		priority : 0
	}	
}
return matchingMaterialObject.matid;
}
//                                                                                                                                                           //


ContentExportProfileAllocation.prototype.savePlacing = function (matId,publicationDefinitionName)  {
	var functionName = "savePlacing";
	this.log(functionName, "Start");
	this.log(functionName, "Saving Placing with profile ["+publicationDefinitionName+"] and Main Material ["+matId+"]");

	var placingXml = <Placing>
			<PlacingId>{this.__placingId}</PlacingId>
			<MainMatId>{matId}</MainMatId>
			<PlacingPublicationList>
				<PlacingPublication>
					<PublicationDefinition>
						<Name>{publicationDefinitionName}</Name>
					</PublicationDefinition>
				</PlacingPublication>
			</PlacingPublicationList>
		</Placing>
	//	print(placingXml);
	 try{
		wscall(<PharosCs>
			<CommandList>
			  <Command subsystem="placing" method="save">
				<ParameterList>
				  <Parameter name="placing">
					<Value>
					   {placingXml}
					</Value>
				  </Parameter>
				</ParameterList>
			  </Command>
			</CommandList>
		  </PharosCs>);
	 }catch(e){
	 	throw new Error("Error in Updating Publication Definition and Material Info against Placing")
	 }

	this.log(functionName, "End");
};

ContentExportProfileAllocation.prototype.isVideoFileAvailable = function (matId,materialXml)  {
	var functionName = "isVideoFileAvailable";
	this.log(functionName, "Start");
	this.log(functionName, "Material Id is ["+ matId +"]");
	var sourceMedia = gmoNBCFunc.getOMMedia(matId,materialXml);
	this.log(functionName, "Source Media Media is identified as ["+ sourceMedia +"]");
	if(gmoNBCFunc.isVarUsable(sourceMedia)){
		return sourceMedia;
	}
	this.log(functionName, "End");
	return "";
};

ContentExportProfileAllocation.prototype.evaluateMatchedProfile = function (matId,materialXml,omMedia,publicationDefinition)  {
	var functionName = "evaluateMatchedProfile";
	this.log(functionName, "Start");
	var matchedProfile = this.__contentExportHelper.getMatchedProfile(publicationDefinition,matId,materialXml,omMedia);
	//JSCommons.logObject(matchedProfile);
	this.log(functionName, "End");
	return matchedProfile;
};

try{
	var job = new gmoNBCFunc.WSJobUpdateObject();
	job.updateStatusAndProgress("Starting Script",5);

	var jobDescription = getJobParameter("jobDescription");
	var placingId = jobDescription..PlacingId.toString();
	job.updateStatusAndProgress("Gathering Placing Details",10);
	print("Placing ID " +placingId);

	var placingHelper = new PlacingHelper(placingId);
	var contentExportHelper = new ContentExportHelper();

	var profileAllocation = new ContentExportProfileAllocation(placingId);
	profileAllocation.setPlacingHelper(placingHelper);
	profileAllocation.setContentExportHelper(contentExportHelper);

	job.updateStatusAndProgress("Initialized Objects",15);

	var placingObj = profileAllocation.buildMinifiedPlacingObject();

	job.updateStatusAndProgress("Validating Info in Work Order",25);
	profileAllocation.validatePlacingObject(placingObj);

	var publicationDefinition = gmoNBCNLDFunc.getPubDef(placingObj.publicationDefinitionName);
	if(typeof publicationDefinition =="undefined"){
		throw new Error("Profile/Publication Definition [" + placingObj.publicationDefinitionName + "] is not setup or named differently in Mediator");
	}

	placingObj.publicationDefinitionName = publicationDefinition.Name.toString();

	profileAllocation.savePlacing("",placingObj.publicationDefinitionName);

	job.updateStatusAndProgress("Evaluating Source Material ",35);

	var matId = profileAllocation.findSourceMaterial(placingObj);

	if(!gmoNBCFunc.isVarUsable(matId)){
		throw new Error("No Valid Material Available to Service this Work Order");
	}

	gmoNBCNLDFunc.savePlacingShortText(placingId, "Source Material", matId);

	var materialXml = materialGet(matId,"tracks")..Material;

	job.updateStatusAndProgress("Identified Material ["+matId+"]",45);

	profileAllocation.savePlacing(matId,placingObj.publicationDefinitionName);

	var omMedia = profileAllocation.isVideoFileAvailable(matId,materialXml);

	if(gmoNBCFunc.isVarUsable(omMedia)){
		job.updateStatusAndProgress("Video File Available for Processing",75);
	}else{
		job.updateStatusAndProgress("No Video File Available for Processing",75);
		throw new Error("No Valid Media Found that can be used as Source for the Video File for Exports");
	}

	job.updateStatusAndProgress("Running Matched Profile Evaluation",85);
	var matchedProfile = profileAllocation.evaluateMatchedProfile(matId,materialXml,omMedia,publicationDefinition);
	if(matchedProfile.hasOwnProperty('Name')){
		job.updateStatusAndProgress("Matched Profile ["+matchedProfile['Name']+"]",95);
		gmoNBCNLDFunc.savePlacingShortText(placingId, "Matched Profile", matchedProfile['Name']);
	}
	job.updateStatusAndProgress("Success",100);
	gmoNBCNLDFunc.transitionPlacing(placingId, profileAllocation.states.originalState, profileAllocation.requirements.complete);

}catch(e){
	job.updateStatusAndProgress("Failed",100);
	job.updateStatusMap({"JOB__ERROR" : e.message})
	gmoNBCFunc.saveNote("Placing",placingId,"Awaiting Components","ERROR","CRITICAL",e.message);
	gmoNBCNLDFunc.transitionPlacing(placingId, profileAllocation.states.originalState, profileAllocation.requirements.error);
	quit(1);
}
