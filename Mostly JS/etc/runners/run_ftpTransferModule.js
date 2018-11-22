load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");

print("Running run_ftpTransferModule.js");

try {



    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();

    jobDashboard.updateStatusAndProgress("Starting Script", 5);
    print("Job Description: " + jobDescription);

	jobDashboard.updateStatusAndProgress("Starting FTP Module",25);

	var selectiveEncodeForTargetPath = function(path){
		var encodeMapping = {
			"[" : "%5B",
			"]" : "%5D"
		}
		for (var key in encodeMapping){
			path = path.split(key).join(encodeMapping[key]);
		}
		return path;
	}

    /*
     * Parameters passed in the job description (except user/pass).
     */
    var ftpHost     = jobDescription.Properties.Mapping.FTPHost.toString();
    var ftpPort     = jobDescription.Properties.Mapping.FTPPort.toString() || '21';
    var targetPath  = jobDescription.Properties.Mapping.FTPTargetPath.toString();
    var sourceFiles = jobDescription.Properties.Mapping.Files.TextList.* || [];
    var user        = NBCGMO.nldManagerLogins['FTP'][ftpHost].user;
    var password    = NBCGMO.nldManagerLogins['FTP'][ftpHost].password;
    var ftpsEnabled = jobDescription.Properties.Mapping.FtpsEnabled.toString();
    var sftpEnabled = jobDescription.Properties.Mapping.sFtpEnabled.toString();
  	var encodedTargetPath = selectiveEncodeForTargetPath(targetPath);
  	var ftp_protocol = "ftp://";

    /*
     * Optional proxy info.
     */
    var ftpProxy        = jobDescription.Properties.Mapping.FTPProxyHost;
    var ftpProxyPort    = jobDescription.Properties.Mapping.FTPProxyPort;

    // For a proxy, the user + ftpHost + path has to be URL encoded.
  	var encodedUserHostPath = Packages.java.net.URLEncoder.encode(user + "@" + ftpHost + ":" + ftpPort, "utf-8").toString();
  	var encodedPassword = Packages.java.net.URLEncoder.encode(password);

    targetPath      = targetPath[0] != "/" ? "/" + targetPath : targetPath // Need to add a forward slash if it doesn't exist.

    if (sftpEnabled.toString() == 'true') {
      ftpPort = gmoNBCFunc.isVarUsable(ftpPort) && ftpPort != '21' ? ftpPort : '22';
      ftp_protocol = "sftp://";
  	}

	// Build the ftpUrl. If a proxy and proxy port is specified we need to build it differently.
	if ( gmoNBCFunc.isVarUsable(ftpProxy) || ftpProxy == "None" || gmoNBCFunc.isVarUsable(ftpProxyPort) ) {
		// EXAMPLE FTP URL WITHOUT PROXY: ftp://{user}:{password}@{ftpHost}:{ftpPort}/{targetPath}
		var ftpUrl = ftp_protocol + user + ":" + password + "@" + ftpHost + ":" + ftpPort + encodedTargetPath;
	} else {
		// EXAMPLE FTP URL WITH PROXY: ftp://{user}@{ftpHost}:{password}@{ftpProxy}:{ftpProxyPort}{targetPath}
		var ftpUrl = ftp_protocol + encodedUserHostPath + ":" + encodedPassword + "@" + ftpProxy + ":" + ftpProxyPort + encodedTargetPath;
	}

	jobDashboard.updateStatusAndProgress("Starting FTP Transfer",35);

	// FTP Transfer happens here.

	print("FTP URL ["+ ftpUrl + "]");
	print("FTP PORT ["+ ftpPort + "]");
	print("jobDescription FTP PORT ["+ jobDescription.Properties.Mapping.FTPPort.toString() + "]");

    for each (var sourceFile in sourceFiles){
		// Build the curl command.
		var ftpCommand = [];

		ftpCommand.push('/usr/bin/ssh');
		ftpCommand.push('-i')
		ftpCommand.push('/opt/evertz/mediator/etc/mediator_x_rsa');
		ftpCommand.push('-oStrictHostKeyChecking=no');
		ftpCommand.push('-oUserKnownHostsFile=/dev/null');
		//ftpCommand.push('evertz@' + lookup.storage.dvs.endpoint());
		ftpCommand.push('evertz@100.125.141.21');
		ftpCommand.push('/usr/bin/curl');
		ftpCommand.push("-k");

		// If FTPS is required, send in the extra parameters required.
		if (ftpsEnabled === true){
			output("FTPS Enabled, adding options to curl command.");
			ftpCommand.push("--ftp-ssl");
			ftpCommand.push("-3");
		}
		ftpCommand.push("--ftp-create-dirs")
		ftpCommand.push("-T");
		ftpCommand.push(sourceFile);
		ftpCommand.push(ftpUrl);

		output("[" + ftpCommand.join(" ") + "]");
		run.apply(this, ftpCommand);
	}

	jobDashboard.updateStatusAndProgress("FTP Transfer Completed Successfully",95);

} catch(e) {
    print("Error in FTPModuleAsync.js: " + e.message);
    jobDashboard.updateStatusMap({"JOB__ERROR": e.message});
    quit(-1);
}
