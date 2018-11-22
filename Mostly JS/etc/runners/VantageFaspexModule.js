load("/opt/evertz/mediator/etc/runners/nbcgmo_vantage_fun.js");
load("/opt/evertz/mediator/etc/runners/vantage_lookup.js");

try {
	
	output("Starting Faspex module for placing: " + placingId);
	jobDashboard.updateStatusAndProgress("Beginning Aspera Faspex", 25);
	
	/** ************************************************** **/
	/** First, we get the Vantage workflow and job factory **/
	/** ************************************************** **/
	
	var vantageWorkflowName = settings.faspexVantageWorkflow;
	output("Using the Vantage workflow: " + vantageWorkflowName);
	if (vantageWorkflowName == "" || vantageWorkflowName == null){
		throw new Error("No vantage workflow name provided, cannot continue.");
	}
	var vantageJobFactory = vantageLookup.getJobFactoryByWorkflow(vantageWorkflowName);
	
	/** ********************************************************** **/
	/** Next, we identify the source file(s) and ensure they exist **/
	/** ********************************************************** **/
	
	output("Number of source files identified: " + sourceFiles.length);
	/*if (sourceFiles.length > 1){
		throw new Error("Multiple source files identified, cannot continue.");
	} else {
		var sourceFile = sourceFiles[0];
	}*/
	
	// Lets just send Faspex the path, to deliver all files within that path.
	var sourceFolder = new gmoNBCFunc.usefulFileObj(sourceFiles[0].unix_path);
	
	if (sourceFolder.exists() == false){
		throw new Error("Source folder [" + sourceFolder.unix_path + "] does not exist, cannot continue.");
	}
	
	/** ******************************************************** **/
	/** Finally, we can build, send, and monitor the Vantage job **/
	/** ******************************************************** **/
	
	var vantageObj = new gmoNBCVantageFunc.Standard_Vantage_Object();
	
	vantageObj.setOriginal(sourceFolder);
	vantageObj.setWorkflowName(vantageWorkflowName);
	vantageObj.setJobName(vantageWorkflowName + "-" + placingId);
	
	vantageObj.setVar("aspera_faspex_workgroup", settings.faspexWorkgroup);
	vantageObj.setVar("aspera_faspex_note", settings.faspexNote);
	vantageObj.setVar("output_filename", settings.faspexTitle);
	
	var jobObject = {
		"jobId" : _jobId,
		"startPercent" : 30,
		"endPercent" : 90
	};
	
	var vantageResult = gmoNBCVantageFunc.makeAndRunTranscodeJob(vantageObj);
	if (vantageResult == true) {
		output("\nSuccessfully delivered ["+sourceFolder.unix_path+"] using Vantage and Faspex");
	} else {
		throw new Error("Vantage delivery failed with the following error [" + vantageResult + "]");
	}
	
	var transferResult = [0, "Aspera Faspex Job Completed Successfully"];
	jobDashboard.updateStatusAndProgress("Aspera Faspex Job Completed Successfully.", 95);	
	
} catch(e) {
	var transferResult = [1, e.message];
	output(e.message);
}