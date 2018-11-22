load("/opt/evertz/mediator/etc/runners/nbcAspera.js");
load("/opt/evertz/mediator/etc/runners/TransferHelper.js"); 


/**
 * Returns the Kbps rate from Mbps
 * @param [bandwidth] [Bandwidth speed in Mbps]
 * @return [Bandwidth speed in Kbps]
 */
function convertMbpsToKbps(bandwidth) {
	var bandwidthInKbps = parseInt(bandwidth)*1000;
	return bandwidthInKbps.toString();
}
	
try{
	//Send request to Aspera to Move the File]
	jobDashboard.updateStatusAndProgress("Beginning Aspera Transfer", 25);
	output("Destination server uses Aspera");
	//ASPERA API
	remoteAsperaHost = settings.asperaTargetNode;
	print("Aspera Source Node ["+settings.asperaSourceNode+"]")
	print("Aspera Target Node ["+settings.asperaTargetNode+"]")
	var transferHelper = new TransferHelper(); 
	
	settings.asperaSourceNode = gmoNBCNLDFunc.getEndPointFromLoadBalancer('Aspera',settings.asperaSourceNode);
	settings.asperaTargetNode = gmoNBCNLDFunc.getEndPointFromLoadBalancer('Aspera',settings.asperaTargetNode);

	print("Getting Remote Credentials");
	remoteAsperaCred = transferHelper.getAsperaCredentials(settings.asperaTargetUser, settings.asperaTargetNode); 
	print("Getting Local Credentials");
	localAsperaCred = transferHelper.getAsperaCredentials(settings.asperaSourceUser, settings.asperaSourceNode); 
	remoteSSHkeyPath = remoteAsperaCred.remoteSSHkeyPath;
	remoteAsperaUser = remoteAsperaCred.remoteUser;
	var remoteAuthenticationMode = "Password";
	if(typeof remoteSSHkeyPath == "undefined" ){
		remoteAsperaPass = remoteAsperaCred.remotePassword;
	} else {
		remoteAsperaPass = null;
		remoteAuthenticationMode = "Public Key";
	}
	remoteAsperaPath = settings.asperaTargetPath;
	remoteAsperaSshPort = settings.asperaSshPort;
	remoteAsperaUdpPort = settings.asperaUdpPort;
		
	localAsperaHost = settings.asperaSourceNode;
	localAsperaUser = localAsperaCred.localUser;
	localAsperaPass = localAsperaCred.localPassword;
	asperaProxy = settings.asperaProxy;
	localAsperaBandwidthMax = settings.asperaBandwidthMax;
 	localAsperaBandwidthMin = settings.asperaBandwidthMin;
		
	var filesToSend = [];
	for each (var file in sourceFiles){
		filesToSend.push(file.dvs_file);
	}	
	print("Job Run Settings:\n" + 
		"remoteAsperaUser : " + remoteAsperaUser + "\n" +
		"remoteAsperaPass : " + remoteAsperaPass + "\n" +
		"remoteSSHkeyPath : " + remoteSSHkeyPath + "\n" +
		"remoteAsperaHost : " + remoteAsperaHost + "\n" +
		"\n" +
		"localAsperaUser  : " + localAsperaUser + "\n" +
		"localAsperaPass  : " + localAsperaPass + "\n" +
		"filesToSend      : " + filesToSend + "\n"			
	);
	
	if (remoteAsperaUser && (remoteAsperaPass || remoteSSHkeyPath)  && remoteAsperaHost && filesToSend.length > 0) {
		jobDashboard.updateStatusAndProgress("Setting up Aspera Job", 30);
		
		var da = new nbcAspera();
		
		da.setLocalUser(localAsperaUser);
		da.setLocalPassword(localAsperaPass);
		da.setLocalHost(localAsperaHost);
		da.setUdpPort(remoteAsperaUdpPort);
		da.setSshPort(remoteAsperaSshPort);
		da.setTargetBandwidth(convertMbpsToKbps(localAsperaBandwidthMax));
		da.setBandwidthMin(convertMbpsToKbps(localAsperaBandwidthMin));
		da.setAsperaProxy(asperaProxy);
		da.setRemoteUsername(remoteAsperaUser);
		da.setRemotePassword(remoteAsperaPass);
		da.setRemoteHost(remoteAsperaHost);
		da.setRemoteAuthenticationMode(remoteAuthenticationMode);
		da.setRemoteKeyPath(remoteSSHkeyPath);
		for (var i=0; i<filesToSend.length; i++) {
			da.addSourceFile(filesToSend[i]);
		};

		if (remoteAsperaUser) {
			da.setRemotePath(remoteAsperaPath);	
		};
		
		da.setDebug(false); //default: false
		da.setStatusPollTime(10); //default: 10
		da.updateTransferProgress(false); //update transfer manager progress, default: false
		da.setMediatorJobId(_jobId); //Give it this jobs job id so it can update it's progress
		
		jobDashboard.updateStatusAndProgress("Starting Aspera Transfer", 50);
		da.startTransfer();
		
		output("Transfer was successful");
	} else {
		throw new Error("No Details provided and/or no files to send.");
	}
	
	var transferResult = [0, "Aspera-P2P Job Completed Successfully"];
	jobDashboard.updateStatusAndProgress("Aspera-P2P Job Completed Successfully", 95);
	
} catch(e) {
	var transferResult = [1, e.message];
	output(e.message);
}

