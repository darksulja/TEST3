/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-17 03:15:34
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-06-13 22:46:26
*/

load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/UploadHelper.js");
load("//opt/evertz/mediator/etc/runners/AudioProfileHelper.js");	

try { 

	const UPLOAD_TYPE = "VIDEO";
	var jobDescription = getJobParameter("jobDescription");
	print("\nJobDescription\n"+jobDescription+"]");

	var job = new gmoNBCFunc.WSJobUpdateObject();
	job.updateStatusAndProgress("Starting Generic Upload Script",10);

	// This could be a Job Created from a Folder Monitor or else from a Retry Job. Either way the Job Descriptions will be different so run tests to workout the Mat Id
	var matId; 
	var folderMonMatId = jobDescription..FolderMonitorMatId.toString();
	var retryMatId = jobDescription..domainKey.toString();
	var isRetry = false;
	var priority = false;
	print("\nFolderMonitor MatId [" + folderMonMatId + "] Retry MatId [" + retryMatId + "]");
		
	if (folderMonMatId && retryMatId) {
		throw new Error("Cannot decide which MatId to use. FolderMonitorMatId has value [" + folderMonMatId + "] Retry MatId has value [" + retryMatId + "]");
	} else if (folderMonMatId) {
		matId = folderMonMatId;
	} else if (retryMatId) {
		matId = retryMatId;
		isRetry = true;
	} else {
		throw new Error("Cannot find a MatId from Job Description");
	}

	var uh = new UploadHelper();

	job.updateStatusAndProgress("Initializing Variables",15);
	uh.initializeAndSetVariables(matId, UPLOAD_TYPE, isRetry, jobDescription..Path.toString());

	job.updateStatusMap({"Script_MatId":uh.getMatId()});
	job.updateStatusMap({"Script_FileName":uh.getFileName()});
	job.updateStatusMap({"Script_StagingMedia":uh.getStagingMedia()});

	job.updateStatusAndProgress("Evaluating House Profile",15);
	uh.evaluateMatchedHouseProfile();

	// Check a Profile has been found for file
	if(uh.getHouseProfile()) {
		print("\nSuccess File [" +  uh.getFileName() + "] matches Profile [" + uh.getHouseProfile() + "]");
		job.updateStatusMap({"Script_Profile":uh.getHouseProfile()});	
	}else {
		gmoNBCFunc.sendCustomEmail(NBCGMO.systemFailureEmailList, "OM Upload - Profile Validation Failure", 
				"The Material ["+uh.getMatId()+"] associated with file ["+ uh.getFileName() +"] failed Profile Validation");
		throw new Error("Failed to find a Valid Profile for file [" + uh.getFileName() +"]");
	}

	job.updateStatusAndProgress("Getting Audio Profile",20);
	var audioProfileObject = uh.getAudioProfileObject();

	job.updateStatusAndProgress("Validating Audio Stream",25);
	// Validate the Audio Streams
	print("\nValidating Audio Streams");
	var audioStreamsValidated = uh.validateAudioStreams(audioProfileObject);
	if (!audioStreamsValidated) throw new Error("Failed to Validate Audio Streams");
	print("\nAudio Streams Validated");

	var handlePotentialDuplicates = uh.unmuddlePossibleDuplicateAudios(audioProfileObject.TrackTypes);
	print("\nPossible Duplicate Audios Handled ? [" + handlePotentialDuplicates.success + "]");

	job.updateStatusAndProgress("Mapping Track Types From Profile",30);
	// Map Audio Profile TrackTypes to Mediator Track Types (A mapping will most likely be required)
	var mediatorTrackTypes = uh.getMediatorTrackTypesFromXmlTrackTypes(audioProfileObject.TrackTypes, "Video");
	print("\n######### Mediator Mapped Track Types ########\n\t["+mediatorTrackTypes+"]");

	// Ensure Material has correct Track Type links
	print("\nEnsuring Material Track Types match Side Car Track Types");
	job.updateStatusAndProgress("Harmonizing Audio Track Types On Material",35);
	var trackTypesHarmonised = uh.registerOMTrackTypeLinks(mediatorTrackTypes);
	if (!trackTypesHarmonised) throw new Error("Failed to save new Track Types Links");
	print("\nMaterial Track Types now harmonised against Side Car Track Types");

	job.updateStatusAndProgress("Transitioning Track Types To Media Received",40);
	// Transition the Track Types that have been mapped to Media Received
	gmoNBCFunc.transitionTrackTypes(uh.getMatId(), uh.UploadRequirements.toMediaReceived, mediatorTrackTypes);

	uh.saveFrameRate();
	
	// Saving Unencoded Staging Track
	job.updateStatusAndProgress("Saving Unencoded Staging Track",45);
	uh.saveUnEncodedStagingTrack();
	job.updateStatusAndProgress("Successfully Saved Unencoded Staging Track",50);

	//File Move to Staging Media
	job.updateStatusAndProgress("Moving File To Staging Media",60);
	uh.moveFileToStagingMedia();
	job.updateStatusAndProgress("Successfully Moved File To Staging Media",70);

	//Saving Encoded Staging Track
	job.updateStatusAndProgress("Saving Encoded Staging Track",80);
	uh.saveEncodedStagingTrack(mediatorTrackTypes, audioProfileObject.TrackLayout);
	job.updateStatusAndProgress("Successfully Saved Encoded Staging Track",90);

	if(priority) {
		// Transistion Track Types to Priority Transcode Queue
		gmoNBCFunc.transitionTrackTypes(uh.getMatId(),uh.UploadRequirements.toTranscodePriority,mediatorTrackTypes);
	}else {
		// Transistion Track Types to Regular Transcode Queue
		gmoNBCFunc.transitionTrackTypes(uh.getMatId(),uh.UploadRequirements.toTranscode,mediatorTrackTypes);
	}

	job.updateStatusAndProgress("Copying Metadata From Shell",95);

	uh.copyMetadataFromShell();

	job.updateStatusAndProgress("Finished Script",100);

}catch(e){

	print("Error ["+ e.message + "]");

	//STEP 1 Move File to Failed Directory & Delete Staging Track if Exists

	uh.cleanUpOnFailure();

	// STEP 2  Mark the Asset as Upload Failed

	if (typeof(mediatorTrackTypes) === "undefined") {
		print("Error CleanUp: mediatorTrackTypes is undefined. Will Only transition Video with Requirement [" + uh.UploadRequirements.toOMUploadFailed + "]");
		gmoNBCFunc.transitionTrackTypes(uh.getMatId(),uh.UploadRequirements.toOMUploadFailed,"Video");
	} else {
		print("\nError CleanUp: Transitioning [" + mediatorTrackTypes +"] with requirement [" + uh.UploadRequirements.toOMUploadFailed + "]");
		gmoNBCFunc.transitionTrackTypes(uh.getMatId(),uh.UploadRequirements.toOMUploadFailed,mediatorTrackTypes);
	}
	
	if (typeof(job) !== "undefined") {
		job.updateStatus(e.message);	
	}
	throw(e);
}