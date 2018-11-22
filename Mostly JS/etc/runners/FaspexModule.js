load("/opt/evertz/mediator/etc/runners/nbcgmo_vantage_fun.js");
load("/opt/evertz/mediator/etc/runners/AsperaFaspex.js");

function pollStatus (link){

	while (true){
		var job;
		try{
			job = faspex.getJobStatus(link);
		}catch(e){
			continue;
		}

		print("\nStatus "+job.status);
		print("\nProgress Percent"+ job.progress);
		
		if (job.status === 'Completed') {
			print('\nTransfer completed Successfully');
			break;
		}
		
		if (job.status === 'Error' || job.status === 'Stopped') {
			print('\nTransfer ended with status ['+job.status+'] and message ['+job.errorMessage+']');
			throw new Error("Transfer Errored "+job.errorMessage);
		}
		jobDashboard.updateStatusAndProgress(job.status, parseInt(job.progress));
		print("\nWaiting to check Status Again");
		sleep(STATUS_POLL_TIME);
	}
}

const STATUS_POLL_TIME = 60;

try {
	
	output("Starting Faspex module for placing: " + placingId);
	jobDashboard.updateStatusAndProgress("Beginning Aspera Faspex", 0);
	
	
	/** ********************************************************** **/
	/** We identify the source file(s) and ensure they exist **/
	/** ********************************************************** **/
	
	output("Number of source files identified: " + sourceFiles.length);

	var sourceFolder = new gmoNBCFunc.usefulFileObj(sourceFiles[0].unix_path);
	
	if (sourceFolder.exists() == false){
		throw new Error("Source folder [" + sourceFolder.unix_path + "] does not exist, cannot continue.");
	}
	
	/** ******************************************************** **/
	/** Finally, we can build, send, and monitor the Faspex job **/
	/** ******************************************************** **/
	
	var faspexTransferHost = settings.faspexTransferHost;
	var faspexWorkgroup = settings.faspexWorkgroup;
	var faspexSourceShareName = settings.faspexSourceShareName;
	
	var user = NBCGMO.nldManagerLogins[deliveryMethod][faspexTransferHost].user;
	var password = NBCGMO.nldManagerLogins[deliveryMethod][faspexTransferHost].password;

	var proxyHost = NBCGMO.nldManagerLogins[deliveryMethod][faspexTransferHost].proxyHost;
	var proxyPort = NBCGMO.nldManagerLogins[deliveryMethod][faspexTransferHost].proxyPort;

	
	if (faspexTransferHost == "" || faspexTransferHost == null){
		throw new Error("No Faspex Transfer Server provided, cannot continue.");
	}
	
	if (faspexWorkgroup == "" || faspexWorkgroup == null){
		throw new Error("No Faspex Workgroup provided, cannot continue.");
	}
	
	if (faspexSourceShareName == "" || faspexSourceShareName == null){
		throw new Error("No Faspex Source Share Name provided, cannot continue.");
	}
	
	faspexSourceShareName = gmoNBCNLDFunc.getEndPointFromLoadBalancer('Faspex',faspexSourceShareName);
	
	
	if (user == "" || user == null){
		throw new Error("No Faspex Account Name provided, cannot continue.");
	}
	
	if (password == "" || password == null){
		throw new Error("No Faspex Account Password provided, cannot continue.");
	}
	
	
	var faspexTitle = placingId;
	var faspexNote = placingXml..ShortText.(ShortTextType.toString() == "Work Order Title").Value.toString();
	var faspex = new NBCAsperaFaspex();
	// Faspex Job Creation Required Details
	faspex.setHost(faspexTransferHost);
	faspex.setSourceShareName(faspexSourceShareName);
	faspex.setUsername(user);
	faspex.setPassword(password);
	faspex.setProxyHost(proxyHost);
	faspex.setProxyPort(proxyPort);
	
	// Faspex Job Details
	faspex.setTitle(faspexTitle);
	faspex.setNote(faspexNote);
	var recipients = [];
	recipients.push(faspexWorkgroup);
	faspex.setRecipients(recipients);
	
	paths = [];
	for each (var source in sourceFiles){
		paths.push(source.dvs_file);
	}
	
	faspex.setPaths(paths);

	var link = faspex.startTransfer();
	
	if (link == "" || link == null){
		throw new Error("Faspex Job Creation Failed, cannot continue.");
	}
	jobDashboard.updateStatusAndProgress("Faspex Job Created ", 1);
	sleep(STATUS_POLL_TIME);
	jobDashboard.updateStatusAndProgress("Faspex Job Monitoring Started ", 1);
	pollStatus(link);
	
	var transferResult = [0, "Aspera Faspex Job Completed Successfully"];
	jobDashboard.updateStatusAndProgress("Aspera Faspex Job Completed Successfully.", 100);	
	
} catch(e) {
	var transferResult = [1, e.message];
	output(e.message);
}