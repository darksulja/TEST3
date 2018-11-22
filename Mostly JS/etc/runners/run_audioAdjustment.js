// One day i will grow up to be the audio adjustment script

print("Yay i ran");

// load some useful stuf here 
load('/opt/evertz/mediator/lib/js/microtime.js');
load('/opt/evertz/mediator/etc/runners/nbcgmo_fun.js');

try {
	
	//var debug = true;
	var dot = ".";
	var hyphen = "-";
	var requirements = {
		toComponentReview : "Complete",
		toAudioAdjustment : "Start",
		error: "Error"
	}

	var states = {
			originalState : "Audio Adjustment Required",
			processingState: "Audio Adjustment"
	}
	
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",10);
	
	var jobDesc = getJobParameter("jobDescription");
	if(debug) print("\nJobDesc\n"+jobDesc+"\n");
		
	var matId = jobDesc..matId.toString();
	jobDashboard.updateStatusMap({"MATERIAL_ID":matId});
	output("matId: " + matId);

	var matXml = materialGet(matId,"trackTypeLinks","tracks","shorttext","tag")..Material;
	//output(matXml);
	
	var transitionedTTL = jobDesc..trackTypeLink.TrackTypeLink.TrackTypeName.toString();
	jobDashboard.updateStatusAndProgress("Transitioning TTL",20);
	output(transitionedTTL);
	
	materialWorkflowTransition(matId, requirements.toAudioAdjustment, transitionedTTL);
	
	//frame rate 
	var frameRate = matXml.FrameRate.toString();
	output("framerate: " + frameRate);
	
	// Pull from the track type link the number of frames we need to adjust by
	var adjustment = matXml..TrackTypeLink.(TrackTypeName == transitionedTTL).ShortTextList.ShortText.(ShortTextType == "Component Audio Adjustment").Value;
	jobDashboard.updateStatusAndProgress("Calculating Adjustment",30);
	output(adjustment);

	// Change when Component Browse is made
	for each(var track in matXml..Track){
		for each(var td in track.TrackDefinition){
			if(td.TrackTypeName.toString() == transitionedTTL){
				var mediaName = track.MediaName; 
				var fileId = track.FileId;
				var fileTag = td.TrackType.FileTag;
			}
		}
	}
			
	var fileExt = matXml.Track.(MediaName == mediaName).FileExtension.toString();
	if(lookup.media[mediaName].usesMatIdDir){
		var sourceMediaPath = lookup.media[mediaName].mount + matId + ".dir/";
	} else {
		var sourceMediaPath = lookup.media[mediaName].mount;
	}
	var filePath = sourceMediaPath + fileId + hyphen + fileTag + dot + fileExt;
	
	// run a function that will add or mnus frames 
	jobDashboard.updateStatusAndProgress("Adjusting File",40);
	gmoNBCFunc.audioAdjustment(filePath,adjustment,frameRate);	
	
	jobDashboard.updateStatusAndProgress("Transitioning Material",90);
	materialWorkflowTransition(matId, requirements.toComponentReview, transitionedTTL);
	
	jobDashboard.updateStatusAndProgress("Successfully Completed",100);

} catch(e){
	print(e.message);
	materialWorkflowTransition(matId, requirements.error, transitionedTTL);
	jobDashboard.updateStatus("Job failed with errors.");
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});
}






