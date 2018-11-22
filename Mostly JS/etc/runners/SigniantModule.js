importPackage(Packages.com.pharos.poxclient.signiant.services.scheduler);	//This package is available from poxclient

const BYTES_PER_MEGABIT = 125000;

try {
	
	jobDashboard.updateStatusAndProgress("Starting Signiant Module",25);
	output("Signiant Manager Set To [" + settings.signiantManager + "]");
	var signiantManagerUrl = "http://" + settings.signiantManager + "/signiant_customizer/services";
	var user = NBCGMO.nldManagerLogins[deliveryMethod][settings.signiantManager].user;
	var password = NBCGMO.nldManagerLogins[deliveryMethod][settings.signiantManager].password;

	var sourceAgent = settings.signiantSourceAgent;
	var targetAgent = settings.signiantTargetAgent;
	var bandwidthCeiling = (settings.bandwidthCeiling * BYTES_PER_MEGABIT); // Bytes represetation of 100Mb
	var bandwidthFloor = (settings.bandwidthFloor * BYTES_PER_MEGABIT); // Bytes represetation of 100Mb
	var targetRelayAgent = settings.signiantTargetRelayAgent;
	var targetPath = settings.signiantTargetPath;
	var jobTemplateName = settings.signiantJobTemplateName;
	var jobTemplateLibraryName = settings.signiantJobTemplateLibraryName;
	var jobGroup = settings.signiantJobGroup;
	
	var jobId = placingId.replace(/[^a-zA-Z0-9]/g, "_") + "_" + gmoNBCFunc.guidGenerator();
	
	var signiantJob = new RunService(signiantManagerUrl);
	
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
		fileList.push(sourceFile.dvs_file);
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
		output("Trying to create Signaint Job, Attemt [" + retryCount + "]");
		/*
		 * Here we create the Signiant job. This does not start the job but sets all the required settings.
		 */
		var createJob = signiantJob.createShortJob(
			user,
			password,
			jobId,
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
	var startJob = signiantJob.commandForJob(user, password, jobGroup, jobId, "force");

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
		output("=============================================");
		jobState = signiantJob.getJobActiveState(user, password, jobId, jobGroup);               
		
		var requestedStats = "byte_count,files_transferred,effective_bytes,files_skipped"
		var statsString = signiantJob.getStats(user, password, jobId, jobGroup, 0, requestedStats, ",", "\n");
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
				
				output("Files Transferred [" + filesTransferred + "] Files Skipped [" + filesSkipped + "]");
				output("Total Bytes [" + totalBytes + "] Bytes Transferred [" + bytesTransferred + "]");
				
				if(totalBytes != 0){ 
					var percentComplete = Math.round(((bytesTransferred / totalBytes) * 100));
					
					var startPercent = 41;
					var endPercent = 94;
					var totalPercent = endPercent - startPercent;
					
					var returnPercent = parseInt(((percentComplete/100)*totalPercent) + startPercent);
					output("Percent Complete [" + returnPercent + "]");
					jobDashboard.updateProgress(returnPercent);
				}
			}
			sleep(45);
		} catch(e){
			output("Warning Non Fatal Occured: " + e);
		}
	}

	/*
	* Here the job should have finished so we get the result code from the job, if a non-zero exit 
	* code is returned we quit with a non zero exit code to failed the proxy transfer
	*/
	var jobExitCode = signiantJob.getLastJobResult(user, password, jobId, jobGroup);

	output("Job Exit Code [" + jobExitCode + "]");
	output("Total Files Transferred [" + filesTransferred + "]");
	if (filesTransferred != sourceFiles.length){
		throw new Error("Regardless of Signiant Exit Code, no files transferred, exiting with non-zero Exit Code.");
	}

	if (jobExitCode != 0){
		throw new Error("Job : [" + jobId + "] exited with a non-zero ExitCode");
	};
	
	jobDashboard.updateStatusAndProgress("Signiant Job Completed Successfully",95);

	var transferResult = [0, "Signiant Job Completed Successfully"];
} catch(e) {
	var transferResult = [1, e.message];
	output(e.message);
}