importPackage(Packages.com.pharos.poxclient.signiant.services.scheduler);	//This package is available from poxclient

load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");

if (typeof gmoNBCFunc === 'undefined') {
	
	var gmoNBCFuncPath = "/opt/evertz/mediator/etc/runners/nbcgmo_fun.js"
	
	load(gmoNBCFuncPath);
	
	if (typeof gmoNBCFunc === 'undefined') {
		throw new Error("\nFailed to load [" + gmoNBCFuncPath + "]");
	}
}
 
const BYTES_PER_MEGABIT = 125000;
const DELIVERY_METHOD = "Signiant";

try {
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);
	
	
	jobDashboard.updateStatusAndProgress("Starting Signiant Module",25);
	
	// Get required values from Job Description.
	var signiantJobName = jobDescription..SigniantJobName.toString();
	var signiantManager = jobDescription..SigniantManager.toString();
	
	var signiantManagerUrl = "http://" + signiantManager + "/signiant_customizer/services";
	print("Debug/signiantManager: "+signiantManager);
	var user = NBCGMO.nldManagerLogins[DELIVERY_METHOD][signiantManager].user;
	var password = NBCGMO.nldManagerLogins[DELIVERY_METHOD][signiantManager].password;

	var sourceAgent = jobDescription..SigniantSourceAgent.toString();
	var targetAgent = jobDescription..SigniantTargetAgent.toString();
	var bandwidthCeiling = (parseInt(jobDescription..BandwidthCeiling.toString()) * BYTES_PER_MEGABIT); // Bytes represetation of 100Mb
	var bandwidthFloor = (parseInt(jobDescription..BandwidthFloor.toString()) * BYTES_PER_MEGABIT); // Bytes represetation of 100Mb
	var targetRelayAgent = jobDescription..SigniantTargetRelayAgent.toString();
	var targetPath = jobDescription..SigniantTargetPath.toString();
	var jobTemplateName = jobDescription..SigniantJobTemplateName.toString();
	var jobTemplateLibraryName = jobDescription..SigniantJobTemplateLibraryName.toString();
	var jobGroup = jobDescription..SigniantJobGroup.toString();
	var sourceFiles = jobDescription..Files.TextList.Text;
	
	
	
	var signiantJob = new RunService(signiantManagerUrl);
	
	// add source and target node to the job exit status
	jobDashboard.updateStatusMap({"Source_Node": sourceAgent});
	jobDashboard.updateStatusMap({"Target_Node": targetAgent});
	
	var connectToSigniant = signiantJob.createService();
	if (!connectToSigniant){
		throw new Error("Connection To Signiant Manager Failed");
	}
	jobDashboard.updateStatusAndProgress("Connected to Signiant",30);

	var jobVariables = [
		jobTemplateName + ".Schedule.sourceAgent",
		jobTemplateName + ".Schedule.targetAgent",
		jobTemplateName + ".Schedule.fileList",
		jobTemplateName + ".Schedule.targetDirectory",
		jobTemplateName + ".Schedule.bandwidthCeiling",
		jobTemplateName + ".Schedule.bandwidthFloor",
		jobTemplateName + ".Schedule.targetRelayAgent"
	];

	var fileList = [];
	for each (var sourceFile in sourceFiles){
		fileList.push(sourceFile.toString());
	}
	var jobVariableValues = [
		sourceAgent,
		targetAgent,
		fileList,
		targetPath,
		bandwidthCeiling,
		bandwidthFloor,
		targetRelayAgent
	];

	
	var retryCount = 1;
	var createJob = false;
	while (retryCount <= 3 && createJob == false){
		print("Trying to create Signaint Job, Attemt [" + retryCount + "]");
		/*
		 * Here we create the Signiant job. This does not start the job but sets all the required settings.
		 */
		var createJob = signiantJob.createShortJob(
			user,
			password,
			signiantJobName,
			jobGroup,
			jobTemplateLibraryName,
			jobTemplateName,
			'UTC',
			jobVariables,
			jobVariableValues
		);		
		retryCount++;
	}

	if(!createJob){
		throw new Error("Failed to Create Signiant Job.");
	}
	
	jobDashboard.updateStatusAndProgress("Signiant Job Created",35);

	/*
	 * Here we begin the job straight away, we use the jobName that we have assigned 
	 * and the option force, this means the job occurs immediately.
	 */
	var startJob = signiantJob.commandForJob(user, password, jobGroup, signiantJobName, "force");

	if(!startJob){
		throw new Error("Failed To Start Signiant Job.");
	}
	
	jobDashboard.updateStatusAndProgress("Signiant Job Started",40);

	/*
	 * Here the status of the job is evaluated, the jobstate has a few a list of values
	 * that it can be at certain stages of the transfer, IDLE means that no job is 
	 * currently active.
	 */
	var jobState = "Unknown"; // Set to an unknown state before entering the loop.
	while(jobState != "IDLE"){
		print("=============================================");
		jobState = signiantJob.getJobActiveState(user, password, signiantJobName, jobGroup);               
		
		var requestedStats = "byte_count,files_transferred,effective_bytes,files_skipped"
		var statsString = signiantJob.getStats(user, password, signiantJobName, jobGroup, 0, requestedStats, ",", "\n");
		var statsArray = statsString.split('\n');
		statsArray = statsArray.join(",").split(',');
		
		// Need to work out the position of the FILE_TRF in the stats to get all information relative to it.
		var fileTrfIndex = statsArray.indexOf("FILE_TRF");
		try { 
			if(statsArray != null && statsArray.length > 6){
				
				var totalBytes = statsArray[3 + fileTrfIndex]; // Signiant calls this "byte_count"
				var filesTransferred = statsArray[4 + fileTrfIndex];
				var bytesTransferred = statsArray[5 + fileTrfIndex]; // Signiant calls this "effective_bytes"
				var filesSkipped = statsArray[6 + fileTrfIndex];
				
				print("Files Transferred [" + filesTransferred + "] Files Skipped [" + filesSkipped + "]");
				print("Total Bytes [" + totalBytes + "] Bytes Transferred [" + bytesTransferred + "]");
				
				if(totalBytes != 0){ 
					var percentComplete = Math.round(((bytesTransferred / totalBytes) * 100));
					
					var startPercent = 41;
					var endPercent = 94;
					var totalPercent = endPercent - startPercent;
					
					var returnPercent = parseInt(((percentComplete/100)*totalPercent) + startPercent);
					print("Percent Complete [" + returnPercent + "]");
					jobDashboard.updateProgress(returnPercent);
				}
			}
			sleep(5);
		} catch(e){
			print("Warning Non Fatal Occured: " + e);
		}
	}

	/*
	* Here the job should have finished so we get the result code from the job, if a non-zero exit 
	* code is returned we quit with a non zero exit code to failed the proxy transfer
	*/
	var jobExitCode = signiantJob.getLastJobResult(user, password, signiantJobName, jobGroup);

	print("Job Exit Code [" + jobExitCode + "]");
	print("Total Files Transferred [" + filesTransferred + "]");
	if (filesTransferred != fileList.length){
		throw new Error("Regardless of Signiant Exit Code, no files transferred, exiting with non-zero Exit Code.");
	}

	if (jobExitCode != 0){
		throw new Error("Job : [" + signiantJobName + "] exited with a non-zero ExitCode");
	};
	
	jobDashboard.updateStatusAndProgress("Signiant Job Completed Successfully",95);

} catch(e) {
	jobDashboard.updateStatusMap({"JOB__ERROR": e.message});
	print(e.message);
	quit(-1);
}
