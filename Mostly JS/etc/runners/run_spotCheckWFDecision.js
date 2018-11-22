//run_spotCheckWFDecision.js
output("Let me tell you about a story all about how");
output("My life got flipped turned upside down");


debug = true;
load ("/usr/local/pharos/etc/scripts/nbcgmo_fun.js");

//TESTING PARTS:
/* load('/usr/local/pharos/bin/js/shellfun.js');
var host = 'localhost';
var user = 'wsuser';
var pass = 'wspass';
wsLogin(host, user, pass); */

try {
	//something is just a placeholder - please remove
	var something = true;
	var jobDesc = getJobParameter("jobDescription");
	output("Job Description: " + jobDesc);
	
	var matId = jobDesc..matId.toString();
	output("matId: " + matId);
	
	var materialXml = materialGet(matId,'trackTypeLinks');
	output("materialXml : " + materialXml);
	var trigger = "Spot Check";
	
	if (something === true) {
		var trigger = "Spot Check"; 
		for each (var trackType in materialXml..Material.TrackTypeLink.TrackTypeName) {
			gmoNBCFunc.transitionTrackTypes(matId, trigger, trackType.toString());
		}
	} else {
		var trigger = "Passed";
		for each (var trackType in materialXml..Material.TrackTypeLink.TrackTypeName) {
			gmoNBCFunc.transitionTrackTypes(matId, trigger, trackType.toString());
		}
	}
	
	output("Tracks have been transitioned to SpotCheck");
	quit(0);
	
} catch(e){
	print(e.message);
}
	
	
	
	
	