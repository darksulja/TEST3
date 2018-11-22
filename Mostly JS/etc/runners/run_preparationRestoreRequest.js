load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/helpers/ErrorHandlerHelper.js");


var debug = false;

try {
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);

	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script", 5);

	var placingId = jobDescription.Properties.Mapping.domainKey.toString();
	var placingHelper = new PlacingHelper(placingId);
	var placingXml = placingHelper.getPlacingXml();

	var transferDecision = {
		states: {
			originalState: placingHelper.getPlacingState()
		},
		requirements: {
			toComplete: "Complete",
			toError: "Error"
		}
	};

	var transitionError = function() {
		jobDashboard.updateStatusAndProgress("Script Error", 100);
		gmoNBCNLDFunc.transitionPlacing(placingId, transferDecision.states.originalState, transferDecision.requirements.toError);
	}

	var dashboardUpdate = function(progress, progressBar, requestsInProgress) {
		var percent = Number(((progress/progressBar)*100).toFixed(0));
		jobDashboard.updateStatusAndProgress("Restoring " + requestsInProgress + " material(s)", percent);
	}

	var getCoordinationId = function(requestId) {
		var report = <PharosCs>
			<CommandList>
				<Command subsystem="report" method="runReport">
					<ParameterList>
						<Parameter name="reportName" value="getCoordinationIdFromRequestId"/>
						<Parameter name="reportParameters">
							<Value>
								<CustomReportRuntimeParameters>
									<Parameters>
										<StringReportParameter>
											<Name>requestId</Name>
											<Operator>is</Operator>
											<Values>
												<String>{requestId}</String>
											</Values>
										</StringReportParameter>
									</Parameters>
								</CustomReportRuntimeParameters>
							</Value>
						</Parameter>
					</ParameterList>
				</Command>
			</CommandList>
		</PharosCs>;

		return wscall(report)..ResultList;
	}

	var getRequestStatus = function(requestId) {
		var report = <PharosCs>
			<CommandList>
				<Command subsystem="report" method="runReport">
					<ParameterList>
						<Parameter name="reportName" value="getRequestStatus"/>
						<Parameter name="reportParameters">
							<Value>
								<CustomReportRuntimeParameters>
									<Parameters>
										<StringReportParameter>
											<Name>requestId</Name>
											<Operator>is</Operator>
											<Values>
												<String>{requestId}</String>
											</Values>
										</StringReportParameter>
									</Parameters>
								</CustomReportRuntimeParameters>
							</Value>
						</Parameter>
					</ParameterList>
				</Command>
			</CommandList>
		</PharosCs>;

		return wscall(report)..ResultList;
	}

	/*
	 * Begin script logic.
	 */

	var parcelMaterials = placingHelper.filterUniqueMaterialsFromParcel();
	if (parcelMaterials.length == 0) {
		transitionError();
		throw new Error("No eligible materials found in the parcel event list.");
	}

	// makeTransferRequest() doesn't block, so submit all the transfer requests
	// first and then poll them later in a separate loop.
	var requests = [];
	for each(var matId in parcelMaterials) {
		var matXml = materialGet(matId, "tracks", "trackTypeLinks")..Material;
		var videoMedia = gmoNBCFunc.getOMMedia(matId, matXml);
		
		if (videoMedia.indexOf("DIVA") == -1) {
			print("OM Media [" + videoMedia + "] for material [" + matId + "] is not a DIVA track. Skipping.");
			continue;
		}

		var destVideoMedia = videoMedia.replace("DIVA", "T2");
		var reqId = makeTransferRequest(matId, destVideoMedia, 1).toString();
		requests.push({reqId: reqId, matId: matId, coordId: null, dest: destVideoMedia, matXml: matXml, completed: false});
		print("Restore request for [" + matId + "] submitted, request ID: [" + reqId + "].");
	}

	jobDashboard.updateStatusAndProgress("Restoring " + requests.length + " material(s)", 10);

	// Now monitor each request.
	var requestsInProgress = requests.length;
	while(requestsInProgress > 0) {
		var progress = 0;
		var progressBar = 100 * requestsInProgress;
		for each(var req in requests) {
			if (req.completed == false && req.coordId != null) {
				var job = gmoNBCFunc.getJob(req.coordId)..Job;
				var status = job..OverallStatus.toString();
				progress += job..JOB__PROGRESS.toString();
				print("Job status: " + status + ", progress: " + progress + ".");

				if (progress == 100 || status == "Finished") {
					print("Request " + req.reqId + " finished.");
					req.completed = true;
					--requestsInProgress;
				}
				else if (status == "Failed") {
					transitionError();
					throw new Error("Failed to restore material [" + req.matId + "].")
				}
			} else if (req.coordId == null) {
				var state = getRequestStatus(req.reqId)..STATUS.toString();
				print("Transfer state: " + state + ".");
				if (state == "Calculated" || state == "Started") {
					req.coordId = getCoordinationId(reqId)..CoordinationId.toString();
				}
			}
		}
		dashboardUpdate(progress, progressBar, requestsInProgress);
		sleep(15);
	}

	// One last check to ensure that the materials have registered the T2 media.
	print("Verifying T2 medias...");
	for each(var req in requests) {
		var videoMedia = gmoNBCFunc.getOMMedia(req.matId);

		if (videoMedia.indexOf("T2") > -1) {
			print("OM Media for [" + req.matId + "] is valid: [" + videoMedia + "].");
		} else {
			transitionError();
			throw new Error("OM Media for [" + req.matId + "] failed verification. [" + videoMedia + "] is not T2. Transfer may not have succeeded. Check for the status of GMO ID [" + req.matId + "] in Material Request.");
		}
	}

	jobDashboard.updateStatusAndProgress("Compiling Placing", 100);
	gmoNBCNLDFunc.transitionPlacing(placingId, transferDecision.states.originalState, transferDecision.requirements.toComplete);
	quit(0);
} catch(e) {
	output("An error has occurred: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})
	var ehh = new ErrorHandlerHelper("Restore",placingId,"Placing");
	if (gmoNBCFunc.isVarUsable(e.code)) {
		errorMsg = ehh.getError(e.code, e.parameters).message;
		output("Error caught in Transfer: Error Code ["+e.code+"] Message ["+errorMsg+"]");
	} else {
		errorMsg = e.message;
		output("An error has occurred: " + errorMsg);
	}
	ehh.saveNote(errorMsg);
	quit(1);
}
