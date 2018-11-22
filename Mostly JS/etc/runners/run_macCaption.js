//load("/usr/local/pharos/etc/scripts/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");

const SLEEP_DURATION = 30000;
try {
	print("Running MacCaption script");

	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);

	var jobDesc = getJobParameter("jobDescription")..Output.JobDescription;
	print("Getting MacCaption command from job description");
	var mcCommand = jobDesc.Properties.Mapping.command.toString();

	print("run() command is [" + mcCommand + "]");
	//var rtn = run(mcCommand);
	//Just Running the command will not work - The run implementation in ShellFun.js expects the library/exe as first argument and then every concatenated string as a separate argument 
	//This should have been captured in development,unit testing and code review 

	var mcCommandArguments = mcCommand.split(" ");	
	print("Arguments are ["+mcCommandArguments+"]");

	var retryIndex = 1;
	do {
		java.lang.Thread.sleep(SLEEP_DURATION);
		jobDashboard.updateStatusAndProgress("Running Command ["+retryIndex+"]",50);
		print("Attempt ["+retryIndex+"]");
		print(mcCommandArguments.join(" "));
		var rtn = run.apply(this,mcCommandArguments);
		print(rtn.output);
		retryIndex++;
	}while(rtn.output.indexOf("No closed caption data to process")>=0 && retryIndex<=5)

	if(rtn.output.indexOf("No closed caption data to process")>=0){
		jobDashboard.updateStatusAndProgress("Failed - No closed caption data to process",50);
	}else {
		jobDashboard.updateStatusAndProgress("Job Completed Successfully",100);
	}

} catch(e) {
	print("An error has occurred: " + e.message);
	jobDashboard.updateStatusAndProgress(e.message,50);
}
