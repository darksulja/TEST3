load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/ProfileHelper.js");

var debug = false;

try {
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);

	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script", 5);

	var placingId = jobDescription.Properties.Mapping.domainKey.toString();
	var placingHelper = new PlacingHelper(placingId);
	var placingXml = placingHelper.getPlacingXml();

	/*
	 * Helper functions.
	 */

	var transferDecision = {
		states: {
			originalState: placingHelper.getPlacingState()
		},
		requirements: {
			toBeginCompiling: "Begin Compiling",	// old Transfer workflow
			toRestoreRequired: "Restore Required",	// new workflow; media not present
			toComplete: "Complete",					// new workflow; media present
			toError: "Error"
		}
	};

	var transitionError = function() {
		jobDashboard.updateStatusAndProgress("Script Error", 100);
		gmoNBCNLDFunc.transitionPlacing(placingId, transferDecision.states.originalState, transferDecision.requirements.toError);
	}

	/*
	 * Begin script logic.
	 */

	var parcelMaterials = placingHelper.filterUniqueMaterialsFromParcel();
	var mainMatId = placingHelper.getMainMaterial();
	if (mainMatId) jobDashboard.updateStatusMap({"ScriptMatId": mainMatId});

	// We can't proceed without any materials.
	if (parcelMaterials.length == 0) {
		transitionError();
		throw new Error("No eligible materials found in the parcel event list.");
	}

	var matsToRestore = [];
	for each(var matId in parcelMaterials) {
		var matXml = materialGet(matId, "tracks", "trackTypeLinks")..Material;
		var videoMedia = gmoNBCFunc.getOMMedia(matId,matXml);
		if (videoMedia.indexOf("DIVA") > -1) {
			print("Usable media [" + videoMedia + "] for material [" + matId + "] is a DIVA track.");
			matsToRestore.push(matId);
		} else {
			print("Usable media [" + videoMedia + "] for material [" + matId + "] is online.");
		}
	}
	
	if (matsToRestore.length == 0) {
		print("No restores necessary for [" + placingId + "]. " + parcelMaterials.length + " material(s) online.");
		print("\nTransitioning placing [" + placingId + "] with requirement [" + transferDecision.requirements.toComplete + "]");
		jobDashboard.updateStatusAndProgress("Compiling Placing", 100);
		gmoNBCNLDFunc.transitionPlacing(placingId, transferDecision.states.originalState, transferDecision.requirements.toComplete);
		quit(0);
	}
	else {
		print(matsToRestore.length + " of " + parcelMaterials.length + " materials require DIVA restore.");
		print("Restoring " + matsToRestore + ".");
		print("\nTransitioning placing [" + placingId + "] with requirement [" + transferDecision.requirements.toRestoreRequired + "]");
		jobDashboard.updateStatusAndProgress("Sent For Restore", 100);
		gmoNBCNLDFunc.transitionPlacing(placingId, transferDecision.states.originalState, transferDecision.requirements.toRestoreRequired);
		quit(0);
	}
} catch(e) {
	output("An error has occurred: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})
	quit(1);
}
