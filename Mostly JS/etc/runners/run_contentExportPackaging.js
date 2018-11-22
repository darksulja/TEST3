/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-15 13:07:48
* @Last Modified by:   Ray Olsen
* @Last Modified time: 2018-04-11 17:21:00
* @Last modified 8/20/19 
* @Last modified by: Chris Filippone
*/

load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/pipelineHelper.js");

print("\nRunning run_contentExportPackaging.js");

ContentExportPackagingRunner = function(placingId){
	if ((this instanceof ContentExportPackagingRunner) === false) {
		throw new Error("Please call constructor with new() keyword");
	}
	this.__placingId = placingId;
}

ContentExportPackagingRunner.prototype.constructor = ContentExportPackagingRunner;

ContentExportPackagingRunner.prototype.log = function (functionName, message) {
	print("ContentExportPackagingRunner # " + functionName + " : " + message);
};

ContentExportPackagingRunner.prototype.setPlacingHelper = function(placingHelper) {
	var functionName = "setPlacingHelper";
	this.log(functionName, "Start");
	this.__placingHelper = placingHelper;
	this.log(functionName, "End");
}

ContentExportPackagingRunner.prototype.setPipelineHelper = function(pipelineHelper) {
	var functionName = "setPipelineHelper";
	this.log(functionName, "Start");
	this.__pipelineHelper = pipelineHelper;
	this.log(functionName, "End");
}


ContentExportPackagingRunner.prototype.runPackaging = function ()  {
	var functionName = "runPackaging";
	this.log(functionName, "Start");
	var deliveredFileNames = [];
	var packagingFolder = this.__pipelineHelper.getPackagingFolder();
	var workingPath = this.__pipelineHelper.getWorkingPath();
	var settings = this.__placingHelper.getSettings();
	var sourceFileObj = new gmoNBCFunc.usefulFileObj(workingPath + "Transcode_Exports/"  + this.__placingId + "." + settings.transcodedExtension);
	var videoDestFileDetails = gmoNBCNLDFunc.getDestFilePathDetails(this.__placingHelper.getPlacingXml(), packagingFolder, "Video", sourceFileObj.extension, settings)
	var videoDestFileObj = videoDestFileDetails.destFilePath;

	// Lets Package the video file.
	gmoNBCFunc.copyFileOnRemoteHost(lookup.storage.dvs.endpoint(),
				sourceFileObj.dvs_path,videoDestFileObj.dvs_path,
				sourceFileObj.filename,videoDestFileObj.filename,sourceFileObj.filesize);

	deliveredFileNames.push(videoDestFileObj.filename);
	gmoNBCNLDFunc.placingTagSave(this.__placingId, "Delivery File Names", deliveredFileNames);
	this.log(functionName, "End");
};

ContentExportPackagingRunner.prototype.getPackagingSettings = function ()  {
	var functionName = "getPackagingSettings";
	this.log(functionName, "Start");
	var settings = {};
	var placingXml = this.__placingHelper.getPlacingXml();
	var placingTagList = placingXml..PublicationDefinition.Presets.PresetList.Preset.TagList;
	var packagingFailureEmailAddresses = placingTagList.Tag.(TagType == "NLD Packaging Failure E-Mail Addresses").Value
	settings["packagingFailureEmailAddresses"] = packagingFailureEmailAddresses;
	this.log(functionName, "End");
	return settings;
};

try{
	var vodWorking = "NLD_WORKING_DIR"
	var job = new gmoNBCFunc.WSJobUpdateObject();
	job.updateStatusAndProgress("Starting Script",5);

	var jobDescription = getJobParameter("jobDescription");
	var placingId = jobDescription..PlacingId.toString();
	job.updateStatusAndProgress("Gathering Placing Details",10);

	var packageRunner = new ContentExportPackagingRunner(placingId);
	var placingHelper = new PlacingHelper(placingId);
	var pipelineHelper = new PipelineHelper(placingHelper,vodWorking)

	packageRunner.setPlacingHelper(placingHelper);
	packageRunner.setPipelineHelper(pipelineHelper);
	var settings = packageRunner.getPackagingSettings();

	job.updateStatusAndProgress("Packaging..",50);
	packageRunner.runPackaging();
	job.updateStatusAndProgress("Success",100);

}catch(e){
	gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml, true,	"",	"Packaging Failure", settings.failureEmailAddresses);
	job.updateStatusAndProgress("Failed",100);
	job.updateStatusMap({"JOB__ERROR" : e.message})
	quit(1);
}
