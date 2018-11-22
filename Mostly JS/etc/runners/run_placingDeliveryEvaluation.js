var lookup = {};
load('/opt/evertz/mediator/etc/runners/nbcgmo_fun.js');
load('/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js');
load('/opt/evertz/mediator/etc/runners/nbcgmo_settings.js');
load('/opt/evertz/mediator/etc/runners/placingHelper.js');
load('/opt/evertz/mediator/etc/runners/TransferHelper.js');

var getPlacingsForDelivery = function(deliveryMethod, stateList, lookAhead, multihop){
    
	var cmd = 
		<PharosCs>
			<CommandList>
				<Command subsystem="report" method="runReport">
					<ParameterList>
						<Parameter name="reportName" value="placingDeliveryEvaluation"/>
						<Parameter name="reportParameters">
							<Value>
								<CustomReportRuntimeParameters>
									<Parameters>
										<StateReportParameter>
											<Name>stateList</Name>
											<Values>
												<String/>
											</Values>
										</StateReportParameter>
										<NumericReportParameter>
											<Name>lookAhead</Name>
											<Values>
												<Double>{lookAhead}</Double>
											</Values>
										</NumericReportParameter>
										<StringReportParameter>
											<Name>deliveryMethod</Name>
											<Values>
												<String>{deliveryMethod}</String>
											</Values>
										</StringReportParameter>
										<StringReportParameter>
											<Name>multihop</Name>
											<Values>
												<String>{multihop}</String>
											</Values>
										</StringReportParameter>
									</Parameters>
								</CustomReportRuntimeParameters>
							</Value>
						</Parameter>
						<Parameter name="pageSize">
							<Value>
								<Integer/>
							</Value>
						</Parameter>
						<Parameter name="page">
							<Value>
								<Integer/>
							</Value>
						</Parameter>
					</ParameterList>
				</Command>
			</CommandList>
		</PharosCs>;
 
	// Add each state from the stateList as a parameter.
	for each (var state in stateList){
		cmd..ParameterList.Parameter.(@name == "reportParameters").Value..StateReportParameter.(Name == "stateList").Values.String += state;
	}  

	// Values declared outside of the loop
	var pageSize = 1000; // Runs the report and gets 100 results at a time.
	var pageNo = 1; // Page number to start at.
	var returnedRows; // Variable to hold how many we found per run. Used to break loop when no more results.
	var placingList = []; // List of placingId's to return once the report yeilds no more results.

	// Loop until no more rows are returned.
	while (returnedRows !== 0){
		// Update the pageSize and page parameters.
		cmd..ParameterList.Parameter.(@name == "pageSize").Value.Integer = pageSize;
		cmd..ParameterList.Parameter.(@name == "page").Value.Integer = pageNo;
		
		// Run the report.
		var rtn = wscall(cmd);

		// Add each report row's placingId to the list
		for each (var reportRowResult in rtn..ResultList.PagedResults.Results.ReportRow){
			placingList.push(reportRowResult.PLACING_ID.toString());
		}

		// Work out the number of rows returned and increment the page number.
		returnedRows = parseInt(rtn..ResultList.PagedResults.Results.ReportRow.length());
		pageNo++;
	}

	return placingList;
}

// If the node is not already in the map, get the values for max/running from Mediator.
var populateNodeMap = function(nodeMap, nodeName, transferJobFactory){
	if (nodeMap[nodeName] === undefined){
		// Populate from querying Mediator for the first time.
		nodeMap[nodeName] = gmoNBCNLDFunc.numOfRemainingJobs(nodeName, transferJobFactory);
	}		
	return nodeMap;
}

var states = {
	deliveryRequired : "Delivery Required"
}

var requirements = {
	deliver : "Deliver"
}

var deliveryStatesToCheck = ['Delivery Required'];

const MAX_NUMBER_DELIVERY_JOBS = 50; // Should Match Available Delivery Job Runner Threads

try {
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);
	
	var deliveryMethod = jobDescription..DeliveryMethod.toString();
	var lookAhead = jobDescription..LookAhead.toString();
	var multihop = jobDescription..Multihop.toString() == "true" ? true : false;
	
	print("Delivery Method:" + deliveryMethod + "\n" +  
	      "Look Ahead:" +lookAhead + "\n" +
		  "Multihop:" + multihop + "\n");

	if (findNumberOfActiveDeliveryJobs() >= MAX_NUMBER_DELIVERY_JOBS) {
		throw new Error("Number of Active Delivery Jobs is At or Over Maximum [" + MAX_NUMBER_DELIVERY_JOBS + "]");
		// Update the total number of runner threads if this is a persistant issue
	}

	print("Checking delivery for [" + deliveryMethod + "] with a look ahead of [" + lookAhead + "]");

	var placingList = getPlacingsForDelivery(deliveryMethod, deliveryStatesToCheck, lookAhead, multihop);
	
	if (placingList.length != 0){
		// Need to keep a list of the max/running jobs so we can keep an internal count (first check queries the system)
		var nodeMap = {};
		for each (var placingId in placingList){
			print("===============================================================");
			// Helper objects
			var placingHelper = new PlacingHelper(placingId);
			var transferHelper = new TransferHelper();
			
			transferHelper.populateDeliverySettingsFromPreset(placingHelper.getSettings());
			var transferJobFactory = transferHelper.selectJobFactory();
			
			// Get source/target node, populate our node map if not already in there.
			var sourceNode = transferHelper.getTransferNodeByType("source");
			nodeMap = populateNodeMap(nodeMap, sourceNode, transferJobFactory);
			var targetNode = transferHelper.getTransferNodeByType("target");
			nodeMap = populateNodeMap(nodeMap, targetNode, transferJobFactory);
			
			print("Source Node [" + sourceNode + "] Available Jobs [" + nodeMap[sourceNode] + "]");
			print("Target Node [" + targetNode + "] Available Jobs [" + nodeMap[targetNode] + "]");
			
			if (nodeMap[sourceNode] > 0 && nodeMap[targetNode] > 0){
				// Increment the counters
				nodeMap[sourceNode]-- 
				nodeMap[targetNode]--
				print("Transition placing back to Delivery since there is available capacity on both source/target nodes.");
				gmoNBCNLDFunc.transitionPlacing(placingId, states.deliveryRequired, requirements.deliver);
			} else {
				print("Either the source/target node are running at max capacity.");
			}		
			
			print("===============================================================");
		}
		
		gmoNBCFunc.printObj(nodeMap);	
	} else {
		print("No placings to check currently.");
	}
	
	quit(0);
	
} catch(e) {
	print("An error occured: " + e.message);
	quit(-1);
}

function findNumberOfActiveDeliveryJobs() {
	const deliveryJobFactory = "deliveryJobFactory";

	var rtn = wscall(<PharosCs>
						<CommandList>
							<Command subsystem="job" method="findJobs">
							<ParameterList>
								<Parameter name="jobFactoryName" value={deliveryJobFactory}/>
							</ParameterList>
							</Command>
						</CommandList>
						</PharosCs>);
	var started_count = rtn..Job.(Status.toString() == "Started").length();
	var submitted_count = rtn..Job.(Status.toString() == "Submitted").length();
	var total = rtn..Job.length();

	print("findNumberOfActiveDeliveryJobs(): Started: [" + started_count + "]");
	print("findNumberOfActiveDeliveryJobs(): Submitted: [" + submitted_count + "]");
	print("findNumberOfActiveDeliveryJobs(): Total: [" + total + "]");

	return total;
}