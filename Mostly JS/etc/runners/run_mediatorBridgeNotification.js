/*
* @Author: Karthik Rengasamy
* @Date:   2017-04-01 18:52:35
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-04-17 19:25:24
*/
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/MediatorBridgeInterface.js");
load("/opt/evertz/mediator/etc/runners/MediatorBridgeHelper.js");

print("\nRunning run_mediatorBridgeNotification.js");

try{
	var request = {
    	mediator : {}
	};
	var savepayload = "";
	var mediatorBridgeInterface = new MediatorBridgeInterface();
	var mediatorBridgeHelper = new MediatorBridgeHelper();

	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);

	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	jobDashboard.updateStatusAndProgress("Extracting Info from Job",25);

	var entityId = jobDescription..domainKey.toString();
	var entityAction = jobDescription..EntityAction.toString();
	var entityType = jobDescription..Entity.toString();
	var entityOperation = jobDescription..EntityOperation.toString(); 

	var bridgemethod = "postop";

	print("" +
		"Entity Identifier [" + entityId + "] \n" +
		"Entity Type [" + entityType + "] \n" +
		"Entity Action [" + entityAction + "] \n" +
		"Entity Operation [" + entityOperation + "]"
	);

	if(gmoNBCFunc.endsWith(entityId,"_01") && entityType == "material"){
		jobDashboard.updateStatusAndProgress("Mediator 8 Identifier.Skipping Notification",100);
		quit(0);
	}

	jobDashboard.updateStatusAndProgress("Extracting Info from Job",25);
	jobDashboard.updateStatusMap({"Script_EntityId":entityId});
	jobDashboard.updateStatusMap({"Script_EntityAction":entityAction});
	jobDashboard.updateStatusMap({"Script_EntityType":entityType});
	jobDashboard.updateStatusMap({"Script_EntityOperation":entityOperation});

	jobDashboard.updateStatusAndProgress("Initializing Mediator Bridge",40);

	mediatorBridgeInterface.initializeMediatorBridge();


	if(entityType == "material" && entityOperation == "save"){
		jobDashboard.updateStatusAndProgress("Posting Notification to Bridge",50);
		savepayload = mediatorBridgeHelper.getPayloadForMaterialRegistration(entityId);
	}

	request.mediator["system"] = "Mediator X";
	request.mediator["entity"] = "material";
	request.mediator["method"] = "save";
	request.mediator["entityKey"] = entityId;
	request.mediator["action"] = "I";
	request.mediator["payload"] = savepayload.toString();

	mediatorBridgeInterface.postMessage(request, bridgemethod);
	jobDashboard.updateStatusAndProgress("Posting Data To Bridge",75);

	jobDashboard.updateStatusAndProgress("Bridge Notification Success",100);

}catch(e){
	output("An error has occured: " + e.message);
	jobDashboard.updateStatusAndProgress("Bridge Notification Failure",100);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})
	quit(1);
}
