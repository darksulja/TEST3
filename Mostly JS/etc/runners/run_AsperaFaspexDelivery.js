load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/AsperaFaspex.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/helpers/JSCommons.js");

function pollStatus (link){
	while (true){
		
		var job;
		try{
			job = faspex.getJobStatus(link);
		}catch(e){
			continue;
		}
		print("Status "+job.status);
		print("Progress Percent"+ job.progress);
		
		if (job.status === 'Completed') {
			print('Transfer completed Successfully');
			break;
		}else {
			jobDashboard.updateStatusAndProgress("INPROGRESS", parseInt(job.progress));
		}

		if (job.status === 'Error' || job.status === 'Stopped') {
			print('Transfer ended with status ['+job.status+'] and message ['+job.errorMessage+']');
			throw new Error("Transfer Errored "+job.errorMessage);
		}

		print("Waiting to check Status Again");
		sleep(STATUS_POLL_TIME);
	}
}

const STATUS_POLL_TIME = 60;
const DELIVERY_METHOD = 'Faspex';

try {
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	var jobDesc = getJobParameter("jobDescription")
	output("Starting Aspera Faspex Upload for Job Description:\n" + jobDesc);
	
	jobDashboard.updateStatusAndProgress("STARTED",1);

	/** ******************************************************** **/
	/**                            FASPEX!                       **/
	/** ******************************************************** **/
	faspexTransferHost = jobDesc..FaspexTransferHost.toString();
	faspexWorkgroup =  jobDesc..FaspexWorkgroup.toString();
	faspexSourceShareName = jobDesc..FaspexSourceShareName.toString();

	output("faspexSourceShareName ["+faspexSourceShareName+"]");

	faspexSourceShareName = gmoNBCNLDFunc.getEndPointFromLoadBalancer('Faspex',faspexSourceShareName);
	output("faspexSourceShareName ["+faspexSourceShareName+"]");
	
	faspexTitle = JSCommons.escapeUnicodeXML(jobDesc..FaspexTitle.toString());
	faspexNote = JSCommons.escapeUnicodeXML(jobDesc..FaspexNote.toString());

	var user = NBCGMO.nldManagerLogins[DELIVERY_METHOD][faspexTransferHost].user;
	var password = NBCGMO.nldManagerLogins[DELIVERY_METHOD][faspexTransferHost].password;
	
	var proxyHost = NBCGMO.nldManagerLogins[DELIVERY_METHOD][faspexTransferHost].proxyHost;
	var proxyPort = NBCGMO.nldManagerLogins[DELIVERY_METHOD][faspexTransferHost].proxyPort;	
	
	if (faspexTransferHost == "" || faspexTransferHost == null){
		throw new Error("No Faspex Transfer Server provided, cannot continue.");
	}
	
	if (faspexWorkgroup == "" || faspexWorkgroup == null){
		throw new Error("No Faspex Workgroup provided, cannot continue.");
	}
	
	if (faspexSourceShareName == "" || faspexSourceShareName == null){
		throw new Error("No Faspex Source Share Name provided, cannot continue.");
	}
	
	if (user == "" || user == null){
		throw new Error("No Faspex Account Name provided, cannot continue.");
	}
	
	if (password == "" || password == null){
		throw new Error("No Faspex Account Password provided, cannot continue.");
	}

	print("Aspera Faspex Settings:\n" +
		"faspexTransferHost     : " + faspexTransferHost + "\n" +
		"faspexSourceShareName  : " + faspexSourceShareName + "\n" +
		"user                   : " + user + "\n" +
		"password               : " + password + "\n" +
		"proxyHost              : " + proxyHost + "\n" +
		"proxyPort              : " + proxyPort + "\n" +
		"faspexTitle            : " + faspexTitle + "\n" +
		"faspexNote             : " + faspexNote + "\n" +
		"faspexWorkgroup        : " + faspexWorkgroup + "\n");
	
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
	for each (var file in jobDesc..Text){
		var useFulFileObj = new gmoNBCFunc.usefulFileObj(file.toString());
		paths.push(useFulFileObj.dvs_file);
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
	
	jobDashboard.updateStatusAndProgress("Aspera Faspex Job Completed Successfully.", 100);	
	
} catch(e) {
	jobDashboard.updateStatusMap({"JOB__ERROR": e.message});
	output(e.message);
	quit(-1);
}
