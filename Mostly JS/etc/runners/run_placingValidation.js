load("/usr/local/pharos/etc/runners/nbcgmo_fun.js");
load("/usr/local/pharos/etc/runners/nbcgmo_nld_fun.js");
load("/usr/local/pharos/etc/runners/placingHelper.js");
load("/usr/local/pharos/etc/runners/pipelineHelper.js");

output("Running run_placingValidation.js");
try {
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);

	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);

	var requirements = {
		complete : "Complete",
		error: "Error",
		startPreroll: "Immediate Start",
		bypassTransfer: "Preprocessing Required"
	}

	var states = {
		placingValidation : "Placing Validation",
		placingValidated : "Placing Validated"
	}

	jobDashboard.updateStatusAndProgress("Gathering Placing Details/Settings",10);

	// Get required values from Job Description.
	var placingId = jobDescription.Properties.Mapping.domainKey.toString();
	var placingHelper = new PlacingHelper(placingId);
	var placingXml = placingHelper.getPlacingXml();
	var pubDefName = placingHelper.getPubDef();
	var contentDest = placingHelper.getContentDest();
	var prerollOffset = placingHelper.getPrerollOffset();
	var settings = placingHelper.getSettings();

	print(
		"Placing Id [" + placingId + "] \n" +
		"Publication Definition Name [" + pubDefName + "] \n" +
		"Content Destination Name [" + contentDest + "] \n" +
		"Preroll Offset [" + prerollOffset + "] \n"
	);

	// Check if there is a restore and deliver preset linked to the placing.
	var isRestoreAndDeliver = false;
	var restoreAndDeliverPresetIgnoreList = ["Preprocessing", "Conform", "Post Processing"];
	if (placingXml..PlacingPublicationList.PlacingPublication.PublicationDefinition.Presets.PresetList.Preset.(PresetType == "Restore and Deliver").length() == 1){
		output("PubDef is using a PresetType of Restore and Deliver, all preset's except Packaging and Delivery will be ignored.");
		isRestoreAndDeliver = true;
		var mainMaterialHelper = new gmoNBCFunc.materialHelper(placingHelper.getMainMaterial());
		if(!placingHelper.getWaterMarkingRequiredForRestoreDeliver() || !placingHelper.isWaterMarkingRequired(placingHelper.getPlacingXml(), mainMaterialHelper.getMaterialXml()..Material)) {
			restoreAndDeliverPresetIgnoreList.push("Transcode");
		}
		// In-case the order has already run through - reset all other data elements
		for (var iPreset = 0; iPreset < restoreAndDeliverPresetIgnoreList.length; iPreset++) {
			gmoNBCNLDFunc.updatePipelineStateDataElement(placingId, restoreAndDeliverPresetIgnoreList[iPreset], false);
		}
	} else {
		gmoNBCNLDFunc.updatePipelineStateDataElement(placingId, "Restore and Deliver", false);
	}


	// Loop through each preset and set its data element to true.
	var presetsFound = false;
	for each (var preset in placingXml..PlacingPublicationList.PlacingPublication.PublicationDefinition.Presets.PresetList.Preset){
		presetsFound = true;
        var presetType = preset.PresetType.toString();
        // Transformation is not a pipeline step, it is just stored at the same level as conform etc so it can be easily added to pub defs
        if (presetType == "Transformation") {
            print('Skipping Transformation pipeline update since it is not a pipeline step')
            break;
        }
		if (isRestoreAndDeliver == true && restoreAndDeliverPresetIgnoreList.indexOf(presetType) >= 0){
			output("Skipping Preset ["+ presetType + "] as PubDef is set to use Restore and Deliver.");
		} else {
			gmoNBCNLDFunc.updatePipelineStateDataElement(placingId, preset.PresetType.toString(), true);
		}
	}

	// check placing details to see what updates are requested in the MetadataPlacingRegistration form
	if (presetsFound == true && !isRestoreAndDeliver){
		var isUpdateMetadata = placingHelper.getShortTextValueByType("Update Metadata Package") == "true";
		var isUpdateImage = placingHelper.getShortTextValueByType("Update Image Package") == "true";
		var isUpdateSidecarAudio = placingHelper.getShortTextValueByType("Update Sidecar Audio Package") == "true";
		var isUpdateSidecarCaption = placingHelper.getShortTextValueByType("Update Sidecar Caption Package") == "true";
		var isUpdateTrailer = placingHelper.getShortTextValueByType("Update Trailer Package") == "true";
		if ((isUpdateMetadata || isUpdateImage) && !isUpdateSidecarAudio && !isUpdateSidecarCaption && !isUpdateTrailer) {
			//in the MetadataPlacingRegistration form selected either metadata and/or image, but did not select Sidecar Audio, Sidecar Caption, or Trailer
			//also checks placing is not Restore and Deliver
			var setToFalse = ["Conform", "Post Processing", "Preprocessing", "Transcode"]
			setToFalse.forEach(function (process){
				gmoNBCNLDFunc.updatePipelineStateDataElement(placingId, process, false);
			})
		}
		gmoNBCNLDFunc.transitionPlacing(placingId, states.placingValidation, requirements.complete);
	} else {
		throw new Error("No presets found on placing [" + placingId + "].");
	}

	// Evaluate whether this Placing needs to be restored
	var finalRequirement = requirements.startPreroll; // Default is to run through the 'Transfer' step
	var placingRestoreEval = placingHelper.sourceMaterialRestoreEval();
	if (placingRestoreEval.requireRestore.length === 0) {
		output("No Restore Required, Saving Fake Staging Tracks and Transitioning Directly to Pre Processing");
		placingHelper.saveFakeStagingTrackForAllMats();
		finalRequirement = requirements.bypassTransfer;
	} else if (placingRestoreEval.requireRestore.length === 0 && placingRestoreEval.noRestoreNeeded.length > 0) {
		output("Restore required for [" + placingRestoreEval.requireRestore + "]");
		output("Restore not required for [" + placingRestoreEval.noRestoreNeeded + "]");
		for (var m = 0; m < placingRestoreEval.noRestoreNeeded.length; m++) {
			placingHelper.saveFakeStagingTrackForOneMat(placingRestoreEval.noRestoreNeeded[m]);
		}
	} else {
		output("Restore required all Materials [" + placingRestoreEval.requireRestore + "]");
	}

	// To make sure everything is tidy - Delete the staging track
	for (var g = 0; g < placingRestoreEval.requireRestore.length; g++) {
		output("Deleting Staging Track For [" + placingRestoreEval.requireRestore[g] + "]");
		placingHelper.deleteStagingMedia(placingRestoreEval.requireRestore[g]);
	}
	
	sleep(10);
	gmoNBCNLDFunc.transitionPlacing(placingId, states.placingValidated, finalRequirement);

	jobDashboard.updateStatusAndProgress("Validation Complete",100);
	quit(0);

}  catch(e){
	output("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})

	placingWorkflowTransition(placingId, requirements.error);

	quit(1);
}
