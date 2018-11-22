load("/opt/evertz/mediator/lib/js/shellfun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_settings.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");

output("Running run_materialPurge.js");
var debug = true;

try {
	var states = {
		originalState : "Not available"
	}

	var jobDesc = getJobParameter("jobDescription");
	if(debug) print("\nJobDesc\n"+jobDesc+"\n");
	
	var material = jobDesc..material.Material;
	var matId = material..MatId.toString();
	output("MatId [" + matId + "]");

	var matHelper = new gmoNBCFunc.materialHelper(matId);

	for each (var trackTypeName in matHelper.getTrackTypes()){
		output("Resetting Track Type [" + trackTypeName + "]" )
		gmoNBCFunc.resetTrackTypeLink(matId,trackTypeName);
	}
	for each (var track in matHelper.getTrackList()){ 
		var mediaName = track.Media.Name.toString();
		output("Deleting Tracks from Media [" + mediaName + "]" );
		gmoNBCFunc.deleteTrackWithDeleteMark(matId,mediaName);
	}

	quit(0);
} catch(e) {
	output("Ruh-roh. Something went wrong here.")
	quit(1);
}