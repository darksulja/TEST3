load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");

output("Running run_tlPlacingUpdateRunner.js");

try {	
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);

	var requirements = {
		updated:"Updated",
		cancel:"Cancel",
		reinstate:"Reinstate",
		repackage: "Repackage",
		retry : "Retry",
		reorder : "Re Order",
		reinitiateHidden : "Reinitiate (Hidden)"
	};
	
	var states = {
		awaitingUpdate:"Awaiting Update",
		awaitingComponents:"Awaiting Components",
		workOrderCanceled  :    "Work Order Canceled",
		delivered : "Delivered",
		notAvailable : "Not available",
		metadataApproval   :    [],
		retryMetadata : ["Packaging Error"]
	};
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);

	var placingId  = new XML(jobDescription..PlacingId.toString());
	var placingHelper = new PlacingHelper(placingId);
	var translatorAction  = new XML(jobDescription..TranslatorAction.toString());
	
	// Get the placing details, include everything so we don't need to add things later.
			
	
	if(translatorAction.toLowerCase() == "cancel")
	{
		placingHelper.workflowReset();
		sleep(3) //Some Time to Reconcile
		gmoNBCNLDFunc.transitionPlacing(placingId, states.notAvailable, requirements.cancel);	
	}
	else if(translatorAction.toLowerCase() == "update")
	{
		if(placingHelper.getPlacingState() == states.awaitingUpdate)
		{
			gmoNBCNLDFunc.transitionPlacing(placingId, placingHelper.getPlacingState(), requirements.updated);		
		}
		else if(placingHelper.getPlacingState() == states.awaitingComponents)
		{
			gmoNBCNLDFunc.transitionPlacing(placingId, placingHelper.getPlacingState(), requirements.updated);		
		}
		else if(placingCurrentState == states.awaitingDetails)
		{
			gmoNBCNLDFunc.transitionPlacing(placingId, states.awaitingDetails, requirements.reinitiateHidden);		
		}
	}
	else if(translatorAction.toLowerCase() == "uncancel")
	{
		if(placingHelper.getPlacingState() == states.workOrderCanceled)
		{
			gmoNBCNLDFunc.transitionPlacing(placingId, placingHelper.getPlacingState(), requirements.reinstate);		
		}else if(placingHelper.getPlacingState() == states.delivered)
		{
			gmoNBCNLDFunc.transitionPlacing(placingId, placingHelper.getPlacingState(), requirements.reorder);
		}
		else {
			throw new Error("Attempted to uncancel placing [" + placingId + "] from an invalid state. Placing must be at 'Work Order Canceled' to uncancel.");		
		}
	}
	else if(translatorAction.toLowerCase() == "smat approval")
	{
		if(gmoNBCFunc.contains(states.metadataApproval, placingHelper.getPlacingState()))
		{
			output("SMAT Approval: Setting Packaging Instructions for Metadata Update");
			gmoNBCNLDFunc.placingTagSave(placingId, "Packaging Instructions", "Metadata Update");
			gmoNBCNLDFunc.transitionPlacing(placingId, placingHelper.getPlacingState(), requirements.repackage);	
		} else if(gmoNBCFunc.contains(states.retryMetadata, placingHelper.getPlacingState())) {			
			output("SMAT Approval: Packaging Retry");
			gmoNBCNLDFunc.transitionPlacing(placingId, placingHelper.getPlacingState(), requirements.retry);	
		} // TODO: Add in transitions back from package QC
		else {
			output("SMAT Approval: Current Placing State does not require any action after SMAT Approval");
		}
	}
	else {
		throw new Error("Invalid placing translator-action passed.");	
	}

	// set flags to false if either are set
	var xml = <Placing>
		<PlacingId>{placingId}</PlacingId>
		<ShortTextList>
			<ShortText>
				<ShortTextType>Flagged For Update</ShortTextType>
				<Value>false</Value>
			</ShortText>
			<ShortText>
				<ShortTextType>Flagged For Cancel</ShortTextType>
				<Value>false</Value>
			</ShortText>
		</ShortTextList>
	</Placing>
	gmoNBCNLDFunc.compilePlacing(xml);

} catch(e) {
	output("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});	
	quit(1);
}
