/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-15 13:07:48
* @Last Modified by:   Ray Olsen
* @Last Modified time: 2018-04-11 17:21:00
* @Last modified 8/20/19 
* @Last modified by: Chris Filippone
*/

load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/helpers/ContentExportHelper.js");
load("/opt/evertz/mediator/etc/runners/pipelineHelper.js");
load("/opt/evertz/mediator/etc/runners/ProfileHelper.js");	
load("/opt/evertz/mediator/etc/runners/vantage_lookup.js");	
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");	
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");	
load("/opt/evertz/mediator/etc/runners/nbcgmo_vantage_fun.js");	

print("\nRunning run_contentExportTranscode.js");

ContentExportTranscodeRunner = function(placingId){
	if ((this instanceof ContentExportTranscodeRunner) === false) {
		throw new Error("Please call constructor with new() keyword");
	}
	this.__placingId = placingId;
}

ContentExportTranscodeRunner.prototype.constructor = ContentExportTranscodeRunner;

ContentExportTranscodeRunner.prototype.log = function (functionName, message) {
	print("ContentExportTranscodeRunner # " + functionName + " : " + message);
};

ContentExportTranscodeRunner.prototype.setPlacingHelper = function(placingHelper) {
	var functionName = "setPlacingHelper";
	this.log(functionName, "Start");
	this.__placingHelper = placingHelper;
	this.log(functionName, "End");
}

ContentExportTranscodeRunner.prototype.setContentExportHelper = function(contentExportHelper) {
	var functionName = "setContentExportHelper";
	this.log(functionName, "Start");
	this.__contentExportHelper = contentExportHelper;
	this.log(functionName, "End");
}

ContentExportTranscodeRunner.prototype.setPipelineHelper = function(pipelineHelper) {
	var functionName = "setPipelineHelper";
	this.log(functionName, "Start");
	this.__pipelineHelper = pipelineHelper;
	this.log(functionName, "End");
}

ContentExportTranscodeRunner.prototype.getSourceMedia = function(matId,materialXml){
	var functionName = "getSourceMedia";
	this.log(functionName, "Start");
	this.log(functionName, "Material Id is ["+ matId +"]");
	var sourceMedia = gmoNBCFunc.getOMMedia(matId,materialXml);
	this.log(functionName, "Source Media Media is identified as ["+ sourceMedia +"]");
	this.log(functionName, "End");
	return sourceMedia;
}

ContentExportTranscodeRunner.prototype.evaluateMatchedProfile = function (matId,materialXml,omMedia,publicationDefinition)  {
	var functionName = "evaluateMatchedProfile";
	this.log(functionName, "Start");
	var matchedProfile = this.__contentExportHelper.getMatchedProfile(publicationDefinition,matId,materialXml,omMedia);
	//JSCommons.logObject(matchedProfile);
	this.log(functionName, "End");
	return matchedProfile;
};

ContentExportTranscodeRunner.prototype.getAudioSettings = function (matId,materialXml,media,profile)  {
	var functionName = "getAudioSettings";
	this.log(functionName, "Start");
	var audioSettings = this.__contentExportHelper.getContentExportAudioMapping(matId,materialXml,media,profile);
	this.log(functionName, "End");
	return audioSettings;
};

ContentExportTranscodeRunner.prototype.getTranscodeSettings = function ()  {
	var functionName = "getTranscodeSettings";
	this.log(functionName, "Start");
	var settings = {};
	var placingXml = this.__placingHelper.getPlacingXml();
	//print(placingXml);
	//print(placingId +"  : " +this.__placingId);
	var placingShortTextList = placingXml..PublicationDefinition.Presets.PresetList.Preset.ShortTextList;
	var placingTagList = placingXml..PublicationDefinition.Presets.PresetList.Preset.TagList;
	var transcodeVantageWorkflow = placingTagList.Tag.(TagType == "NLD Transcode Vantage Workflow").Value.toString();
	var transcodedExtension = placingShortTextList.ShortText.(ShortTextType == "NLD Transcoded Extension").Value.toString();
	//print("TE :" +transcodedExtension)
	var transcodeLicensee = placingShortTextList.ShortText.(ShortTextType == "NLD Licensee").Value.toString();
	var transcodeFailureEmailAddresses = placingTagList.Tag.(TagType == "NLD Transcode Failure E-Mail Addresses").Value;
	settings["transcodeVantageWorkflow"] = transcodeVantageWorkflow;
	settings["transcodedExtension"] = transcodedExtension;
	//print ("extension : "+transcodedExtension);
	settings["transcodeLicensee"] = transcodeLicensee;
	settings["transcodeFailureEmailAddresses"] = transcodeFailureEmailAddresses;
	this.log(functionName, "End");
	return settings;
};

ContentExportTranscodeRunner.prototype.runTranscode = function (matId, materialXml, media, audioMappingObject)  {

	var functionName = "runTranscode";
	this.log(functionName, "Start");
	var vantageObj = new gmoNBCVantageFunc.Standard_Vantage_Object();
	var settings = this.getTranscodeSettings();
	var materialFrameRate = materialXml.FrameRate.toString();
	var extension = materialXml.Track.(MediaName.toString()==media).FileExtension.toString();

	var vantageSrcObj = new gmoNBCFunc.usefulFileObj(lookup.media[media].mount + matId + ".dir/" + matId + "." + extension);
	vantageObj.setOriginal(vantageSrcObj);
	vantageObj.setVar("Source Path", vantageSrcObj.win_file);

	vantageObj.setJobName(settings.transcodeVantageWorkflow + "-" + this.__placingId );
	vantageObj.setWorkflowName(settings.transcodeVantageWorkflow);

	vantageObj.setVar("output_framerate",  NBCGMO.frameRateLookup[materialFrameRate]);
	var vantageDstObj = new gmoNBCFunc.usefulFileObj(this.__pipelineHelper.getCurrentWorkingFolder() + this.__placingId +  ".xyz");
	// Set all required vantage variables
	vantageObj.setVar("mov_dest_filepath", vantageDstObj.win_path);
	vantageObj.setVar("output_filename", vantageDstObj.basename);

	var isWaterMarkingRequired = this.__placingHelper.isWaterMarkingRequired(this.__placingHelper.getPlacingXml(),materialXml);
	vantageObj.setVar("civolution_watermark_applied", isWaterMarkingRequired.toString());

    if(isWaterMarkingRequired && (settings.transcodeLicensee === undefined || settings.transcodeLicensee === "")) {
    	throw new Error("\n WaterMarking is required but Licensee Name is not set on the Transcode preset")
    }
	vantageObj.setVar("civolution_watermark_licensee_name", settings.transcodeLicensee);

	var audioMapping = audioMappingObject["Audio Mapping"];
	for (mapping in audioMapping){
		vantageObj.setVar(mapping, audioMapping[mapping].toString());
	}
	vantageObj.setVar("output_audio_channels", audioMappingObject["Total Audio Channels"].toString());

	// Job progress
	var jobObject = {
		"jobId" : _jobId,
		"startPercent" : 20,
		"endPercent" : 90
	};

	// Run the vantage job using the object
	var vantageJobFactory = vantageLookup.getJobFactoryByWorkflow(settings.transcodeVantageWorkflow);
	gmoNBCFunc.makeDirectory(vantageDstObj.unix_path);

	var vantageResult = gmoNBCVantageFunc.makeAndRunTranscodeJob(vantageObj);

	if (vantageResult == true) {
		this.log(functionName, "Successfully Transcoded ["+vantageSrcObj.unix_file+"]");
	} else {
		throw new Error("Vantage Transcode Failed with Error [" + vantageResult + "].");
	}
	try{

	   // If extension is provided fine the transcoded file. Else search the output folder for the file (not ideal!!)
		if (settings.transcodedExtension != "" && settings.transcodedExtension != null){
			this.log(functionName, "Transcoded File Extension provided in preset, lets use it.");
			var extension = settings.transcodedExtension.toString() ;
			print("EXT : "+extension)
			var destFilePath = vantageDstObj.unix_path + vantageDstObj.basename + "." + extension;
			print("dest File "+destFilePath);
			// If we find the file, set the boolean to true.                          
			var transcodedFileObj = new gmoNBCFunc.usefulFileObj(destFilePath);
			if (!transcodedFileObj.exists()){
				throw new Error("Could not find destination file.");
			}
		} else {
			this.log(functionName, "Transcoded File Extension not provided in preset, lets try to find the file.");
			var destFolder = new File (vantageDstObj.unix_path);
			for each (var file in destFolder.listFiles()){
				this.log(functionName, "Checking file [" + file + "]");
				var transcodedFileObj = new gmoNBCFunc.usefulFileObj(String(file.path));
				if (transcodedFileObj.basename != vantageDstObj.basename){
					throw new Error("Could not find destination file.");
				} else{
					this.log(functionName, "Transcoded Output File Found [" + file + "]");
					break;
				}
			}
		}
	}catch(e){
		if (fileExists(vantageDstObj.unix_path)){
			output("Working folder exists, cleaning up files/folder for this state [" + vantageDstObj.unix_path + "].");
			//if (!gmoNBCFunc.deleteDirectory(vantageDstObj.unix_path, true)){
			//	print("Failed to remove files.");
			//}
		} else {
			this.log(functionName, "No working folder exists, nothing to cleanup.");
		}
	}

	this.log(functionName, "End");
};

try{
	//
	var vodWorking = "NLD_WORKING_DIR"
	var job = new gmoNBCFunc.WSJobUpdateObject();
	job.updateStatusAndProgress("Starting Script",5);

	var jobDescription = getJobParameter("jobDescription");
	
	var placingId = jobDescription..PlacingId.toString();
	var placingHelper = new PlacingHelper(placingId);
	var pipelineHelper = new PipelineHelper(placingHelper,vodWorking)
	job.updateStatusAndProgress("Gathering Placing Details",10);

	var transcodeRunner = new ContentExportTranscodeRunner(placingId);

	var contentExportHelper = new ContentExportHelper();
	transcodeRunner.setPlacingHelper(placingHelper);
	transcodeRunner.setPipelineHelper(pipelineHelper);
	transcodeRunner.setContentExportHelper(contentExportHelper);

	//var settings = transcodeRunner.getTranscodeSettings();

	var matId = placingHelper.getMainMaterial();
	var materialXml = materialGet(matId,"tracks")..Material;
	var sourceMedia = transcodeRunner.getSourceMedia(matId,materialXml);

	if(!gmoNBCFunc.isVarUsable(sourceMedia)){
		job.updateStatusAndProgress("No Valid Media Found to source the file as input for Transcode",100);
		throw new Error("Unable to locate the Source file in any Media");
	}
	job.updateStatusAndProgress("Located Source File in ["+sourceMedia+"]",15);

	var publicationDefinition = gmoNBCNLDFunc.getPubDef(placingHelper.getPubDef());
	var matchedProfile = transcodeRunner.evaluateMatchedProfile(matId,materialXml,sourceMedia,publicationDefinition);
	if(gmoNBCFunc.isVarUsable(matchedProfile["Name"])){
		print("Matched Profile is ["+matchedProfile+"]")
	} else{
		throw new Error("Unable to Find a Audio layout from Profile that matches with track types available in Material");
	}

	var audioMappingObject = transcodeRunner.getAudioSettings(matId,materialXml,sourceMedia,matchedProfile);
	job.updateStatusAndProgress("Transcoding..",20);
	transcodeRunner.runTranscode(matId, materialXml, sourceMedia, audioMappingObject);

	job.updateStatusAndProgress("Success",100);

}catch(e){
	var placingXml = this.__placingHelper.getPlacingXml();
	gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml, true,	"",	e.message, settings.transcodeFailureEmailAddresses);
	job.updateStatusAndProgress("Failed",100);
	job.updateStatusMap({"JOB__ERROR" : e.message})
	quit(1);
}
