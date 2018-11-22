var lookup = {};
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");

output("Running run_materialRedeliverRunner.js");
var debug = true;

try {
	var states = {
		originalState : "Not available"
	}
	var requirements = {
		toRedeliver : "Redeliver"
	}
	var jobDesc = getJobParameter("jobDescription");
	if(debug) print("\nJobDesc\n"+jobDesc+"\n");
	
	var material = jobDesc..material.Material;
	var matId = material..MatId.toString();
	output("MatId [" + matId + "]");
	var materialXML = materialGet(matId,'tracktypelinks','tracks')..Material;
	
	//First Step to delete All tracks 
	for each (var mediaName in materialXML.Track.MediaName){ 
		mediaName = mediaName.toString();
		output("Deleting Tracks from Media [" + mediaName + "]" );
		gmoNBCFunc.deleteTrackWithDeleteMark(matId,mediaName);
	}
	//Second Step Reset All Track Types 
	
	
	for each (var trackTypeName in materialXML.TrackTypeLink.TrackTypeName){
		trackTypeName = trackTypeName.toString();
		output("Resetting Track Type [" + trackTypeName + "]" )
		gmoNBCFunc.resetTrackTypeLink(matId,trackTypeName);
	};
	sleep(20);
	//Third Step Transition all TTL to Order Placed , So Operations can Re Upload 
	gmoNBCFunc.transitionMaterial(matId, states.originalState, requirements.toRedeliver);
	quit(0);
} catch(e) {
	output("Ruh-roh. Something went wrong here.")
	quit(1);
}
