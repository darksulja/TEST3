try {
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

	// Get the information from the Preset/Settings script.
	var ftpHost = settings.ftpHost;
	var ftpPort = settings.ftpPort || '21';
	var user = NBCGMO.nldManagerLogins[deliveryMethod][ftpHost].user;
	var password = NBCGMO.nldManagerLogins[deliveryMethod][ftpHost].password;
	var targetPath = settings.ftpTargetPath; // This path needs to be absolute in relation to the FTP Server.
	var ftpsEnabled = settings.ftpsEnabled;
	var sftpEnabled = settings.sFtpEnabled;
	var encodedTargetPath = selectiveEncodeForTargetPath(targetPath);
	var ftp_protocol = "ftp://";

	// Optional configuration options.
	var ftpProxy = settings.ftpProxy;
	var ftpProxyPort = settings.ftpProxyPort;

	// For a proxy, the user + ftpHost + path has to be URL encoded.
	var encodedUserHostPath = Packages.java.net.URLEncoder.encode(user + "@" + ftpHost + ":" + ftpPort, "utf-8").toString();
	var encodedPassword = Packages.java.net.URLEncoder.encode(password);

	targetPath = targetPath[0] != "/" ? "/" + targetPath : targetPath; // Need to add a forward slash if it doesn't exist.

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

	jobDashboard.updateStatusAndProgress("Starting FTP Transfer", 35);

	// FTP Transfer happens here.

	output("FTP URL ["+ ftpUrl + "]");
	output("FTP PORT ["+ ftpPort + "]");
	output("SETTINGS FTP PORT ["+ settings.ftpPort + "]");

	for each (var sourceFile in sourceFiles){
		// Build the curl command.
		command = [];

		command.push('/usr/bin/ssh');
		command.push('-i')
		command.push('/opt/evertz/mediator/etc/mediator_x_rsa');
		command.push('-oStrictHostKeyChecking=no');
		command.push('-oUserKnownHostsFile=/dev/null');
		command.push('evertz@' + lookup.storage.dvs.host);
		command.push('/usr/bin/curl');
		command.push("-k");

		// If FTPS is required, send in the extra parameters required.
		if (settings.ftpsEnabled === true){
			output("FTPS Enabled, adding options to curl command.");
			command.push("--ftp-ssl");
			command.push("-3");
		}
		command.push("--ftp-create-dirs")
		command.push("-T");
		command.push(sourceFile.dvs_file);
		command.push(ftpUrl);

		output("[" + command.join(" ") + "]");
		run.apply(this, command);
	}

	jobDashboard.updateStatusAndProgress("FTP Transfer Completed Successfully",95);

	var transferResult = [0, "FTP Transfer Completed Successfully"];
} catch(e) {
	var transferResult = [1, e.message];
	output(e.message);
}
