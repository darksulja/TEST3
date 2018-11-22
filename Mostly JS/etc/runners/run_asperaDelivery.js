
if (typeof gmoNBCFunc === 'undefined') {
	var gmoNBCFuncPath = "/opt/evertz/mediator/etc/runners/nbcgmo_fun.js"

	load(gmoNBCFuncPath);
	if (typeof gmoNBCFunc === 'undefined') {
		throw new Error("\nFailed to load [" + gmoNBCFuncPath + "]");
	}
} 

load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcAspera.js");
load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js');
load("/opt/evertz/mediator/etc/runners/TransferHelper.js");
const DELIVERY_METHOD = "Aspera-P2P";

try{
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);

	var transferHelper = new TransferHelper();
	
	//Send request to Aspera to Move the File]
	jobDashboard.updateStatusAndProgress("Beginning Aspera Transfer", 25);
	output("Destination server uses Aspera");

	var asperaTargetNode = jobDescription..AsperaTargetNode.toString();
	var asperaSourceNode = jobDescription..AsperaSourceNode.toString();
	var asperaSourceUser = jobDescription..AsperaSourceUser.toString();
	var asperaTargetUser = jobDescription..AsperaTargetUser.toString();
	var isMD5FileSum = jobDescription..isMD5FileSum.toString();
	var remoteAsperaPath = jobDescription..AsperaTargetPath.toString();
	var asperaBaseJobName = jobDescription..AsperaJobName.toString();

	var remoteAsperaSshPort = jobDescription..AsperaSshPort.toString();
	var remoteAsperaUdpPort = jobDescription..AsperaUdpPort.toString();

	var targetAuthSettings = transferHelper.getAsperaCredentials(asperaTargetUser,asperaTargetNode);
	// //Load Balancer
	
	 asperaSourceNode = gmoNBCNLDFunc.getEndPointFromLoadBalancer('Aspera',asperaSourceNode);
	 asperaTargetNode = gmoNBCNLDFunc.getEndPointFromLoadBalancer('Aspera',asperaTargetNode);

	//ASPERA API
	var remoteAsperaHost = asperaTargetNode;
	var remoteAsperaUser = targetAuthSettings.remoteUser;
	var remoteSSHkeyPath = targetAuthSettings.remoteSSHkeyPath;
	var remoteAuthorization = typeof targetAuthSettings.remoteAuthorization  == "undefined" ? "" : targetAuthSettings.remoteAuthorization;
	var remoteFileProtection = typeof targetAuthSettings.remoteFileProtection == "undefined" ? "" : targetAuthSettings.remoteFileProtection;
	var remoteFilePassphrase = typeof targetAuthSettings.remoteFilePassphrase == "undefined" ? "" : targetAuthSettings.remoteFilePassphrase;
	var remoteEncryptionCipher = typeof targetAuthSettings.remoteEncryptionCipher == "undefined" ? "None" : targetAuthSettings.remoteEncryptionCipher;

	if(remoteAuthorization!=""){
		print("Generating Token")
		var remoteSSHToken = generateAsperaToken(asperaTargetNode,remoteAuthorization,remoteAsperaPath)
	}

	if(typeof targetAuthSettings.remoteSSHkeyPath != "undefined"){
		var remoteAuthenticationMode = "Public Key";
	}else if (typeof targetAuthSettings.remoteSSHToken != "undefined"){
		var remoteAuthenticationMode = "Token";
	}else{
		var remoteAuthenticationMode = "Password";
	}

	var remoteAsperaPass = (remoteAuthenticationMode == "Public Key" || remoteAuthenticationMode == "Token") ? null : targetAuthSettings.remotePassword;

	var sourceAuthSettings = transferHelper.getAsperaCredentials(asperaSourceUser,asperaSourceNode);
	var localAsperaUser = sourceAuthSettings.localUser;
	var localAsperaPass = sourceAuthSettings.localPassword;
	//Get Node Type to Determine Source Path
	var nodeType = sourceAuthSettings.nodeType;
	print("Node Type of ["+asperaSourceNode+"] is ["+ nodeType +"]");

	var asperaProxy = jobDescription..AsperaProxy.toString();
	var localAsperaBandwidthMax = jobDescription..AsperaBandwidthMax.toString();
 	var localAsperaBandwidthMin = jobDescription..AsperaBandwidthMin.toString();

	var sourceFiles = jobDescription..Files.TextList.Text;
	var filesToSend = [];
	
	for each (var file in sourceFiles){
		
		var useFulFileObj = new gmoNBCFunc.usefulFileObj(file.toString());

		print(useFulFileObj.dvs_file);

		filesToSend.push(useFulFileObj.dvs_file);
	}

	if (remoteAsperaUser && (remoteAsperaPass || remoteSSHkeyPath || remoteSSHToken)  && remoteAsperaHost && filesToSend.length > 0) {
		jobDashboard.updateStatusAndProgress("Setting up Aspera Job", 30);

		var deliveryMethod = "Aspera-P2P";
		var settings = {};
		var legacySourceSetting = asperaSourceNode;
		if(gmoNBCFunc.isVarUsable(NBCGMO.nldManagerLogins[deliveryMethod][asperaSourceUser + "-" + asperaSourceNode])){
			legacySourceSetting = asperaSourceUser + "-" + asperaSourceNode;
		}
		settings["asperaSourceNode"] = legacySourceSetting;

		var da = new nbcAspera();
		da.setLocalUser(localAsperaUser);
		da.setLocalPassword(localAsperaPass);
		da.setLocalHost(asperaSourceNode);
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
		da.setToken(remoteSSHToken);
		da.setFileProtection(remoteFileProtection);
		da.setFilePassphrase(remoteFilePassphrase);
		da.setSecurityEncryptionCipher(remoteEncryptionCipher);
		da.setRetryIfJobTimedOut(true);
		da.setRetryTimeoutSeconds(1800);
		
		da.setCookie("MED-" + asperaBaseJobName + "-" + gmoNBCFunc.guidGenerator());

		if(isMD5FileSum == "true"){
			da.setIsMD5(true);
		}

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
		var failCount = 0;
		var transferStatus = da.startTransfer();
		
		while(transferStatus == "error" || transferStatus == "timeout"){
			failCount += 1;
			if(failCount <= 3){
				output("Aspera Transfer Failed/Timeout: Retry number [" + failCount + "] starting...");
				jobDashboard.updateStatusAndProgress("Retrying Aspera Transfer", 50);
				sleep(10);
				transferStatus = da.startTransfer();
			}else{
				output("Maximum number retries attempted. Failing transfer...");
				throw new Error('NBCAspera-ERROR: '+ da.__getAsperaTransferFailureMessage());
			}
		}
		
		output("Transfer was successful");
	} else {
		throw new Error("No Details provided and/or no files to send.");
	}

	jobDashboard.updateStatusAndProgress("Job Completed Successfully", 95);

} catch(e) {
	jobDashboard.updateStatusMap({"JOB__ERROR": e.message});
	output(e.message);
	quit(-1);
}

function generateAsperaToken(endpoint,authorization,path){
	_JRAPI = new JRAPI();
 	var endpointURL = "https://"+ endpoint + "/files/upload_setup";

 	var payload = {
	 "transfer_requests": [
	   {
	     "transfer_request": {
	      "create_dir": true,
	      "overwrite": "always",
	       "destination_root": path,
	      "paths": [
	         {
	           "source": "/"
	         }
	       ]
	     }
	   }
	 ]
	} 
	var commands = [];
	commands = commands.concat("-x: http://64.210.197.20:80");
	commands = commands.concat("--header");
	commands = commands.concat("Content-Type: application/json;charset=UTF-8");
	commands = commands.concat("--header");
	commands = commands.concat("Authorization:"+authorization)
	commands = commands.concat("--data")
	commands = commands.concat(_JRAPI.JSON.stringify(payload));
	commands = commands.concat(endpointURL);
	print(commands);
	var token ="";
	try{
		var result = run("/usr/bin/curl", commands);
		print(result.output.toString())
		result = eval("("+result.output.toString()+")")
		token  = result.transfer_specs[0].transfer_spec.token;
		print("Token is ["+token+"]")
		if(token=="" || typeof token ==="undefined"){
			throw new Error ("Token Undefined");
		}
	}catch(e){
		throw new Error ("Token Generation for Transfer Failed"+e);
	}
	return token;
}

/**
 * Returns the Kbps rate from Mbps
 * @param [bandwidth] [Bandwidth speed in Mbps]
 * @return [Bandwidth speed in Kbps]
 */
function convertMbpsToKbps(bandwidth) {
	var bandwidthInKbps = parseInt(bandwidth)*1000;
	return bandwidthInKbps.toString();
}