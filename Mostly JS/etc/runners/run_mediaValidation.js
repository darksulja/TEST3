/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-17 03:15:34
* @Last Modified by:   karthikrengasamy
* @Last Modified time: 2017-09-11 23:37:53
*/

if(typeof(gmoNBCFunc)==="undefined") load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
if(typeof(gmoNBCNLDFunc)==="undefined") load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
if(typeof(UploadHelper)==="undefined") load("/opt/evertz/mediator/etc/runners/UploadHelper.js");
if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")
if(typeof(HouseSpecValidator)==="undefined") load("/opt/evertz/mediator/etc/helpers/HouseSpecValidator.js");

function MediaValidation(utsId) {

    if((this instanceof MediaValidation) === false)  throw new Error("Please call constructor with new() keyword")

    if(gmoNBCFunc.isVarUsable(utsId)){
        this.setUTSId(utsId);
        this.setUTSMaterialHelper(new gmoNBCFunc.materialHelper(this.getUTSId()));
    }else{
        throw new Error ("Unrusted Source Material Id is required.")
    }
}

MediaValidation.prototype.constructor = MediaValidation;

MediaValidation.prototype.setUTSId = function(matId){
    this.__UTSId = matId;
}

MediaValidation.prototype.getUTSId = function(){
    return this.__UTSId;
}

MediaValidation.prototype.setUTSMaterialHelper = function(utsHelper){
    this.__UTSMaterialHelper = utsHelper;
}

MediaValidation.prototype.getUTSMaterialHelper = function(){
    return this.__UTSMaterialHelper;
}

MediaValidation.prototype.validate = function(){
	var stagingMedia = lookup.dropfolder[this.getUTSMaterialHelper().getTagValue("Drop Folder")].stagingMedia;

	if(this.getUTSMaterialHelper().getTrackList().(MediaName.toString() === NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING && parseInt(DeleteMark) === 0 && Encoded.toString() === "true").length() > 0){
		output("Using existing [" + NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING + "] track from previous transcode for Media Validation.");
		var videoFilePath =  this.getUTSMaterialHelper().getPathAndFileOfTrackTypeOnMedia(NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING,NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO,false)
	}else{
		var videoFilePath = gmoNBCNLDFunc.getStagingVideoFile(stagingMedia, this.getUTSId());
	}

	output("Validating file [" + videoFilePath + "]");
	var hsv = new HouseSpecValidator();
	hsv.setFileNameWithPath(videoFilePath);

	var results = hsv.validateSpecAgainstProfiles();
	output(JSON.stringify(results));
	var mediaValidationString = results.length > 0 ? "" : "Failed to find any matching House Profiles.";
	for each (var profile in results){
		mediaValidationString += profile.name + "\n" + profile.details + "\n";
	}
	this.getUTSMaterialHelper().addFullTextToSaveXml("Media Validation Details",mediaValidationString);
	this.getUTSMaterialHelper().saveUsingSaveXml();

	var matchingProfile = _.where(results, {"passed": true});
	if(!gmoNBCFunc.isVarUsable(matchingProfile)|| matchingProfile.length == 0) throw new Error("Could not match file to a valid House Profile Specfication.");

	var matchedProfileName = matchingProfile[0].name;
	output("File matched to House Profile [" + matchedProfileName + "]");
	this.getUTSMaterialHelper().saveShortTextValue("Matched Profile",matchedProfileName);
}

function _main(){
	
	try { 
		output("run_mediaValidation.js - Start")
		var jobDescription = getJobParameter("jobDescription");
		output("\nJobDescription\n"+jobDescription+"]");
		
		var job = new gmoNBCFunc.WSJobUpdateObject();
		job.updateStatusAndProgress("Starting Media Validation Script",5);
		var matId = jobDescription..MatId.toString();
		var mv = new MediaValidation(matId);
		mv.validate();
		
		gmoNBCFunc.transitionTrackTypes(matId,NBCGMO_CONSTANTS.TRIGGERS.COMPLETE,NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO); 	
		job.updateStatusAndProgress("Completed Successfully",100);
		
	}catch(e){

		output("run_mediaValidation - Error ["+e.message+"]");

		if (gmoNBCFunc.isVarUsable(job)) {
			job.updateStatus(e.message);	
		}
		if (gmoNBCFunc.isVarUsable(matId)) {
			gmoNBCFunc.transitionTrackTypes(matId,NBCGMO_CONSTANTS.TRIGGERS.FAILED,NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO); 	
		}
        quit(1);

	}finally{
		output("run_mediaValidation.js - End")
	}
}

if(typeof _jobId != "undefined"){
	_main();
}else{
	output("Script is Executed Without Job Information")
}
