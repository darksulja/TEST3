/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-17 03:15:34
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-10-01 14:24:45
*/

load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")

function UploadHelper() {

	if((this instanceof UploadHelper) === false)	throw new Error("Please call constructor with new() keyword")
	if(typeof(MediaInfoHelper)==="undefined")  load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js")
	if(typeof(TrackHelper)==="undefined")  load("/opt/evertz/mediator/etc/helpers/TrackHelper.js")

}

UploadHelper.prototype.constructor = UploadHelper;

UploadHelper.prototype.requirements = {
	toSourceMediaReceived : NBCGMO_CONSTANTS.TRIGGERS.UPLOAD,
	toMediaValidation : NBCGMO_CONSTANTS.TRIGGERS.COMPLETE,
	toUploadFailed : NBCGMO_CONSTANTS.TRIGGERS.FAILED
}

UploadHelper.prototype.setFilePath = function(filePath){
	this._filePath = filePath;
}

UploadHelper.prototype.getFilePath = function(){
	return this._filePath;
}

UploadHelper.prototype.setFileName = function(fileName){
	this._fileName = fileName;
}

UploadHelper.prototype.getFileName = function(){
	return this._fileName;
}

UploadHelper.prototype.validateUploadParameters = function(filePath,fileName){
	output("UploadHelper validateUploadParameters - Start")
	if(!gmoNBCFunc.isVarUsable(filePath)){
		throw new Error("Unable to upload content as source location of the content is null or empty");
	}
	
	if(!gmoNBCFunc.isVarUsable(fileName)){
		throw new Error("Unable to upload content as source file name is null or empty")
	}
	output("UploadHelper validateUploadParameters - End")
}

UploadHelper.prototype.generateMatId = function(){
	output("UploadHelper generateMatId - Start")
	var _matId = gmoNBCFunc.generateMatId(NBCGMO_CONSTANTS.GENERATOR_SCRIPTS.UNTRUSTED_MAT_ID,
		NBCGMO_CONSTANTS.FREE_SEQUENCE_MAPPING.UNTRUSTED_MAT_ID);
	output("UploadHelper generateMatId - End")
	return _matId;
}

UploadHelper.prototype.getDropFolder = function(filePath){
	output("UploadHelper getDropFolder - Start")
	var dropFolderPathInParts = filePath.split("/");
	var _dropFolder = dropFolderPathInParts[dropFolderPathInParts.length-1];
	output("UploadHelper getDropFolder - End")
	return _dropFolder;
}

UploadHelper.prototype.getStagingMedia = function(dropFolder){
	output("UploadHelper getStagingMedia - Start")
	var _stagingMedia = "";
	if(gmoNBCFunc.isVarUsable(dropFolder) && 
		gmoNBCFunc.isVarUsable(lookup.dropfolder[dropFolder]) &&
		gmoNBCFunc.isVarUsable(lookup.dropfolder[dropFolder].stagingMedia)){
		_stagingMedia = lookup.dropfolder[dropFolder].stagingMedia;
	}else {
		_stagingMedia = NBCGMO.omUploadSettings.defaultVideoStagingMedia;
	}
	output("UploadHelper getStagingMedia - End")
	return _stagingMedia;
}

UploadHelper.prototype.registerMaterial = function(matId,fileName,dropFolder){
	output("UploadHelper registerMaterial - Start")
	try{	
		var mh = new gmoNBCFunc.materialHelper(matId);
		mh.addOwnerToSaveXml(NBCGMO_CONSTANTS.OWNERS.NBCU_GMO);
		mh.addTrackTypeLink(NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO, 
			NBCGMO_CONSTANTS.STATES.NOT_AVAILABLE, 
			NBCGMO_CONSTANTS.STATE_MACHINES.NBC_GMO);
		mh.addTitleToSaveXml("");
		mh.addTrackTypeLinkShortText(NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO,
			NBCGMO_CONSTANTS.SHORT_TEXTS.ORIGINAL_FILE_NAME,
			fileName);
		mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.ORIGINAL_FILE_NAME,fileName);
		mh.addTagToSaveXml(NBCGMO_CONSTANTS.TAGS.DROP_FOLDER,dropFolder);
		mh.saveUsingSaveXml();
	}catch(re){
		output("UploadHelper registerMaterial - Error - Untrusted Material Registration Failed");
		throw new Error("Untrusted Material Registration Failed");
	}
	output("UploadHelper registerMaterial - End")
}

UploadHelper.prototype.moveFileToStagingMedia = function(matId,stagingMedia,filePath){
	output("UploadHelper moveFileToStagingMedia - Start")
	if (lookup.media[stagingMedia].usesMatIdDir) {
		
		var dropFolderFileObj = new gmoNBCFunc.usefulFileObj(filePath);

		var stagingMediaFileObj = new gmoNBCFunc.usefulFileObj(lookup.media[stagingMedia].mount + matId + 
				NBCGMO_CONSTANTS.DOT_DIR + matId + NBCGMO_CONSTANTS.DOT + gmoNBCFunc.getFileExtension(filePath));

		output("Creating Directory [" + stagingMediaFileObj.unix_path + "]");
		gmoNBCFunc.makeDirectory(stagingMediaFileObj.unix_path);
		if (!fileExists(stagingMediaFileObj.unix_path)) throw new Error("\nFailed to create Staging Directory at [" + stagingMediaFileObj.unix_path + "]");
		gmoNBCFunc.moveFile(filePath,stagingMediaFileObj.unix_file);
		//Check File Existence
		if (fileExists(stagingMediaFileObj.unix_file)) {
			output("Move Successful");
		} else {
			throw new Error("\nError Move failed. Cannot see file at [" + stagingMediaFileObj.unix_file +"]");
		}
	}
	output("UploadHelper moveFileToStagingMedia - End")
	return stagingMediaFileObj;
}

function _main(){
	
	try { 
		output("run_untrustedOMUpload.js - Start")
		var jobDescription = getJobParameter("jobDescription");
		output("\nJobDescription\n"+jobDescription+"]");

		var job = new gmoNBCFunc.WSJobUpdateObject();
		job.updateStatusAndProgress("Starting Untrusted OM Upload Script",5);

		var uh  = new UploadHelper();
		uh.setFileName(jobDescription..Files.TextList.Text.toString());
		uh.setFilePath(jobDescription..Path.toString())
		
		output("FilePath ["+uh.getFilePath()+"]")
		output("FileName ["+uh.getFileName()+"]")

		job.updateStatusMap({"Script_FileName":uh.getFileName()});
		job.updateStatusMap({"Script_FolderPath":uh.getFilePath()});

		job.updateStatusAndProgress("Generating a MAT ID",10);

		uh.validateUploadParameters(uh.getFilePath(),uh.getFileName());

		var dropFolder = uh.getDropFolder(uh.getFilePath());

		output("Drop Folder ["+dropFolder+"]")

		job.updateStatusMap({"Script_DropFolder":dropFolder});

		job.updateStatusAndProgress("Generating a Untrusted MAT ID",15);

		var matId = uh.generateMatId()
		
		output("Material ID ["+matId+"]")
		
		job.updateStatusMap({"Script_MatId":matId});

		job.updateStatusAndProgress("Registering Untrusted Material",20);

		uh.registerMaterial(matId,uh.getFileName(),dropFolder);

		job.updateStatusAndProgress("Untrusted Material Registration Complete",25);

		var stagingMedia = uh.getStagingMedia(dropFolder);

		if(!gmoNBCFunc.isVarUsable(stagingMedia)){
			throw new Error("No Default Staging Media or Drop Folder Specific Staging Media is setup for upload")
		}

		job.updateStatusMap({"Script_StagingMedia":stagingMedia});

		job.updateStatusAndProgress("Saving UnEncoded Staging Track",30);

		var th = new TrackHelper(matId);
		th.saveUnEncodedTrack(stagingMedia);

		job.updateStatusAndProgress("Moving File To Staging Media",45);

		var stagingFileObj = uh.moveFileToStagingMedia(matId,stagingMedia,uh.getFilePath()+ File.separator +uh.getFileName());

		job.updateStatusAndProgress("Move Completed",55);

		gmoNBCFunc.transitionTrackTypes(matId,uh.requirements.toSourceMediaReceived,NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO); 

		job.updateStatusAndProgress("Updating UnEncoded Staging track to Encoded",65);

		var mediaInfoHelper = new MediaInfoHelper();
		mediaInfoHelper.setSourceFile(stagingFileObj);
		var timeCodes;
		try{
			timeCodes =  mediaInfoHelper.getTimeCodes();
		}catch(TimeCodeException){
			if(TimeCodeException.message.indexOf("Could not find timecode stream")>=0){
				output("No Time Code Track on File. Making a note against the material and continuing upload")
			}
			if(TimeCodeException.message.indexOf("Could not find video stream: ")>=0){
				throw new Error(TimeCodeException.message);
			}
		}
		
		// Have seen issues with 4K files at this point and 're-getting' the mediainfo XML - putting in a sleep to see if it helps
		sleep(30);		
		th.saveEncodedTrack(stagingMedia,timeCodes,[NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO],[stagingFileObj.unix_file]);
		gmoNBCFunc.transitionTrackTypes(matId,uh.requirements.toMediaValidation,NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO); 	
		job.updateStatusAndProgress("Completed Successfully",100);
		
	}catch(e){

		output("run_untrustedOMUpload - Error ["+e.message+"]");

		if (gmoNBCFunc.isVarUsable(job)) {
			job.updateStatus(e.message);	
		}

		if (gmoNBCFunc.isVarUsable(matId)) {
			gmoNBCFunc.transitionTrackTypes(matId,uh.requirements.toUploadFailed,NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO); 	
		}

        quit(1);

	}finally{
		output("run_untrustedOMUpload.js - End")
	}
}

if(typeof _jobId != "undefined"){
	_main();
}else{
	output("Script is Executed Without Job Information")
}
