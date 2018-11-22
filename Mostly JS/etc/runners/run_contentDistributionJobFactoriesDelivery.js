load("/opt/evertz/mediator/lib/js/shellfun.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/pipelineHelper.js");
load("/opt/evertz/mediator/etc/runners/TransferHelper.js");
load("/opt/evertz/mediator/etc/helpers/ErrorHandlerHelper.js");

output("Running run_contentDistributionDelivery.js");
output("Running Delivery Test");


/**
 * Sends a webservice call to Mediator and returns the result
 * 
 * @usage       wscall(pharosCs)
 * @param       {XML}   pharosCs        PXF formatted command list
 * @return      {XML}   response        from Mediator
 * @throws      {Error} If the web service or HTTP Client fails
 */
wscall = function(pharosCs) {
	var retryCounter = 0;
	var sleepInterval = 10;
	var isInterMediatorTimeOut = true;
	var errorMessage = "";
	var result;
	
	while(isInterMediatorTimeOut && retryCounter<=10 ){
		try{
			errorMessage = "";
			result = mediatorWsCall(pharosCs);
			isInterMediatorTimeOut = false;
		}catch(e){
			errorMessage = e.message;
			print("wscall Error Message "+e.message);
			if(e.message.indexOf('Timeout')>=0){
				print("EVERTZ FLAG : Inter Mediator/Command Timeout Tracking")
				isInterMediatorTimeOut = true;
				retryCounter++;
				print("wscall sleeping for ["+sleepInterval+"] seconds");
				sleep(sleepInterval)
			}else{
				isInterMediatorTimeOut = false;
			} 
		}
	}
	if(gmoNBCFunc.isVarUsable(errorMessage)){
		throw new Error(errorMessage)
	}
	return result;
}

function mediatorWsCall(pharosCs){
	var pharosCs = new XML(pharosCs);
	// if session key needs injecting (ie. not set, and not a login method)
	if (pharosCs.CommandList.@sessionKey.toString() == "" && pharosCs.CommandList.Command.@method != "login") {
			pharosCs.CommandList.@sessionKey = _sessionKey;
	}

	if (debug) output( "XML to send to Mediator: " + pharosCs );
	var xmlStr = _httpClient.sendXml(pharosCs.toXMLString());
	if (debug) output( "XML received from Mediator: " + xmlStr );
	if (xmlStr) {
			// skip any xmjs> js> js> js>   >   >   >   >   >   >   > js>   >   >   >   >   >   >   >   >   >   >   > l processing directives as these seem to cause XML()
			// constructions a problem
			var x = xmlStr.indexOf("<Pharos");
			if( x > -1 ) {
					xmlStr = xmlStr.substr(x);
			}

			var result = new XML(xmlStr);
			// Now check the result for an Exception object
			if (result.hasOwnProperty("CommandException") || result..*.hasOwnProperty("CommandException")) {
					var sErr = "Error: Web service call failed, \nCode    = [" + result..Code + "] \nMessage = [" + result..Message + "]";
					error(sErr);
					throw new Error(sErr);
			}

			return result;
	} else {
			var sErr = "Error: HttpClient failed";
			error(sErr);
			throw new Error(sErr);
	}
}

try {

	var states = {
		delivery : "Delivery"
	};

	var requirements = {
		start : "Start"
	};

	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	if (debug) print("Job Description: " + jobDescription);
	
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();

	jobDashboard.updateStatusAndProgress("Starting Script", 5);

	var placingId = jobDescription.Properties.Mapping.domainKey.toString();


	var vodWorking = "NLD_WORKING_DIR"
	
	var placingHelper = new PlacingHelper(placingId);
	var placingXml = placingHelper.getPlacingXml();
	var pipelineHelper = new PipelineHelper(placingHelper, vodWorking);
	
	// Commented out for Content Exports
	//var previousPipelineState = pipelineHelper.getPreviousPipelineState();
	//print("\n" +"Previous Pipeline State [" + previousPipelineState + "] \n");
	//if (previousPipelineState != "Packaging") throw new Error("Failing Delivery: Previous Pipeline State [" + previousPipelineState + "] is unsupported"); 
	
	// Find what needs to be sent in UsefulFileObj() format
	var sourceFiles = gmoNBCNLDFunc.createContentDistDeliveryObjects(pipelineHelper.getPackagingFolder());
	jobDashboard.updateStatusAndProgress("Gathering Placing Details/Settings", 10);
	var settings = placingHelper.getSettings();
	var workOrderTitle = placingHelper.getShortTextValueByType("Work Order Title");
	
	var pipelineState = placingHelper.getPlacingState();
	gmoNBCNLDFunc.checkPipelineStateRequired(placingId, pipelineState);
	print("Placing Id [" + placingId + "] \n Current Pipeline State [" + pipelineState + "] \n");	

	jobDashboard.updateStatusAndProgress("Configuring Transfer Method", 15);
		
	var transferHelper = new TransferHelper();
	transferHelper.populateDeliverySettingsFromPreset(settings);
		
	for each (var file in  sourceFiles) {
		transferHelper.addFilesToTransfer(file);
	}
	
	if (debug) print("Delivery Method is: "+transferHelper.getDeliveryMethod());
	
	transferHelper.setIdentifier(placingId);
	transferHelper.setTransferTitle(workOrderTitle);
	
	// Wait on the child job to return a status
	jobDashboard.updateStatusAndProgress("Transferring [" + transferHelper.getDeliveryMethod()+"]", 20);
	try {
		var successfulDeliveries = transferHelper.buildAndSubmitJob(true, 21, 99);
		if(successfulDeliveries && !settings.deliveryAcknowledgmnetRequired){
			var sourceFilesString = "";
			for each (var sourceFile in sourceFiles){
				sourceFilesString += sourceFile.filename + "\n";
			}

			var deliverySuccessEmails = [];
			var workOrderDeliveryEmails = placingHelper.getWorkOrderDeliveryEmails();
			if(workOrderDeliveryEmails.length > 0){
				deliverySuccessEmails = workOrderDeliveryEmails.filter(function(elem, index, self){return index == self.indexOf(elem);});
			}
			
			gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml, false, sourceFilesString, "", deliverySuccessEmails);
		}
	} catch (e) {
		throw new Error(e.message);
	}
	if (debug) print("SuccessfulDeliveries is [" + successfulDeliveries + "]");

	if (successfulDeliveries == false) throw new Error("DELIVERY FAILED");
	
	if (settings.deliveryAcknowledgmnetRequired) {
		//Run an Intermediate State Transistion
		gmoNBCNLDFunc.transitionPlacing(placingId, states.delivery, requirements.start);
	} else {
		gmoNBCNLDFunc.saveDeliveryRevision(placingXml);
		gmoNBCNLDFunc.savePlacingShortText(placingId,"Rejection",false);
	}
  	
	jobDashboard.updateStatusAndProgress("Finished Transfer", 100);
	
} catch(e) {
	print("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});

	var ehh = new ErrorHandlerHelper("Delivery",placingId,"Placing");
	if (gmoNBCFunc.isVarUsable(e.code)) {
		errorMsg = ehh.getError(e.code, e.parameters).message;
		output("Error caught in Transfer: Error Code ["+e.code+"] Message ["+errorMsg+"]");
	} else {
		errorMsg = e.message;
		output("An error has occurred: " + errorMsg);
	}
	ehh.saveNote(errorMsg);
	
	if (typeof(settings) !== "undefined") {
		gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml, true, "", e.message, settings.failureEmailAddresses);
	}
	
	quit(1);
}
