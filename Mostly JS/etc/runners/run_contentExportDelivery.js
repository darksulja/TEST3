/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-15 22:24:04
* @Last Modified by:   Ray Olsen
* @Last Modified time: 2018-04-11 17:21:00
*/


load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");

print("\nRunning run_contentExportDelivery.js");

try{

	load("/opt/evertz/mediator/etc/helpers/MediatorCommons.js");
	MediatorCommons.loadScriptFile("JobHelper");
	MediatorCommons.loadScriptFile("placingHelper");
	MediatorCommons.loadScriptFile("pipelineHelper");

	var vodWorking = "NLD_WORKING_DIR"
	var jobHelper = new JobHelper();
	var jobDashboard = new jobHelper.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);

	var jobDescription = jobHelper.getJobDescription();
	var placingId = jobDescription.Properties.Mapping.domainKey.toString();
	jobDashboard.updateStatusAndProgress("Gathering Placing Details",10);

	var placingHelper = new PlacingHelper(placingId);
	var pipelineHelper = new PipelineHelper(placingHelper,vodWorking);

	var placingXml = placingHelper.getPlacingXml();

	var settings = placingHelper.getSettings();

	var sourceFiles = gmoNBCNLDFunc.createContentDistDeliveryObjects(pipelineHelper.getPackagingFolder());

	var deliveryMethod = settings.deliveryMethod;

	jobDashboard.updateStatusAndProgress("Checking if Source Files Exist",15);

	for each (var file in sourceFiles){
		if (file.exists()){
			print("Source File Path [" + file.unix_file + "]");
			print("Folder Path [" + file.unix_path + "]");
			print("File Extension [" + file.extension + "]");
			print("File Basename [" + file.basename + "]");
			print("File Size [" + file.filesize + "] Bytes");
		} else {
			throw new Error("Source File [" + file.unix_file + "] does not exist.");
		}
	}

	print ("------------- Loading Module for [" + deliveryMethod +"] -------------");
	jobDashboard.updateStatusAndProgress("Loading Transfer Module for: " +  deliveryMethod,20);

	var scriptName = deliveryMethod.replace(" ","");
	load("/opt/evertz/mediator/etc/runners/" + scriptName + "Module.js");

	if (typeof transferResult != 'undefined') {

		var transferResultExitCode = transferResult[0];
		var transferResultMessage = transferResult[1];

		print("Transfer Result Message: " + transferResultMessage);

		var sourceFilesString = "";
		for each (var sourceFile in sourceFiles){
			sourceFilesString += sourceFile.filename + "\n";
		}

		if (transferResultExitCode == 0) {
			print("Transfer was a success using [" + deliveryMethod + "]");
		} else {
			print("Transfer was a failure using [" + deliveryMethod + "]");
		}

		if (transferResultExitCode != 0){
			throw new Error(transferResultMessage);
		}else {
			gmoNBCNLDFunc.saveDeliveryRevision(placingXml);
		}
	} else {
		throw new Error("No transfer result found from module, failing delivery.");
	}
	if (settings.sendSuccessEmail  == true || settings.sendSuccessEmail  == "true"){
		MediatorCommons.sendDefaultEmailNotification("Delivery Success", "placing", placingId, settings.successEmailAddresses);
	}
	jobDashboard.updateStatusAndProgress("Success",100);

}catch(e){
	if (settings.sendFailureEmail  == true || settings.sendFailureEmail  == "true"){
		MediatorCommons.sendDefaultEmailNotification("Delivery Failure", "placing", placingId, settings.transcodeFailureEmailAddresses);
	}
	jobDashboard.updateStatusAndProgress("Failed",100);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})
	quit(1);
}
