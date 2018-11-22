importPackage(Packages.com.pharos.poxclient);
importPackage(Packages.javax.xml.stream);
importPackage(Packages.org.apache.commons.lang);
load('/opt/evertz/mediator/lib/js/shellfun.js');

/**
 *
 *
 *
 * When using this script, the classpath you need for rhino will look like this:
 * js.jar
 * log4j-1.2.15.jar
 * commons-logging.jar
 * httpclient-4.3.6.jar
 * httpcore-4.3.3.jar
 * commons-codec-1.10.jar
 * pox.jar
 *
 * To perform a point to point transfer you first of all need to create an AsperaTransferJob object, set the properties you want and then pass that in to 'submitJob()' on the AsperaTransfer object
 * The submitJob method will return a jobId which can then be used to retrieve status.
 *
 * The Aspera server will take the files we've told it about and transfer them to the remote destination. The remote destination must be running an Aspera server and the local server must have access to the files
 * we are sending in its file system.
 *
 */
function AsperaTransferJob(){
	
	this.version = "2";
	this.agent = "Evertz.Mediator";
	this.operation = "Push";

	// Specifies the transfer operation to perform, i.e. download or upload. When set to Pull, 
	// files will be downloaded from the remote location to the local location. When set to Push, files will be uploaded from the local location to the remote location.
	// Possible values: {'Pull', 'Push'}
	this.setOperation = function(operation){
		this.operation = operation;
	};	

	this.cookie = null;
	this.token = null;

	//An field used for application-specific requirements. This field can be used as a placeholder for a unique reference.
	this.setCookie = function(cookie){
		this.cookie = cookie;
	};	

	//This field is used for token-based authorization.
	this.setToken = function(token){
		this.token = token;
	};	


	// Remote location settings
	this.remoteHost = null;
	this.remotePort = null;
	this.remoteUser = null;
	this.remotePassword = null;
	this.asperaProxy = null;
	this.remoteAuthenticationMode = null;
	this.remoteKeyPath = null;
	//this.authenticationMethods = new Array() -- Just use password for now
	this.remotePaths = new Array();
	this.remoteRootPath = null;
	
	// Local location 
	this.localFiles = new Array();
	this.localUser = null;
	this.localPassword = null;
	this.localRootPath = null;

	/***********************************************************************************************************************
	 * Remote parameters
	 * Identifies the remote endpoint and file locations involved in the transfer.
	 */
	// IP address or host name of the system
	this.setRemoteHost = function(host){
		this.remoteHost = host;
	};
	// SSH port over which the transfer will be initiated
	// Default: 22.
	this.setRemotePort = function(port){
		this.remotePort = port;
	};
	this.setRemoteUser = function(username){
		this.remoteUser = username;
	};
	this.setRemotePassword = function(password){
		this.remotePassword = password;
	};
	this.setAsperaProxy = function(proxy){
		this.asperaProxy = proxy;
	};
	// A transfer file path. For user name with document root path configured, the path must expressed relative to the user document root path.
	this.addRemotePath = function(path){
		this.remotePaths.push(path);
	};
	this.setRemoteRootPath = function(rootPath){
		this.remoteRootPath = rootPath;
	};
	// Remote Authentication Mode = Password or Public Key
	this.setRemoteAuthenticationMode = function(remoteAuthenticationMode){
		this.remoteAuthenticationMode = remoteAuthenticationMode;
	};
	// If Remote Authentication Mode is Public Key then we use Public Key Path
	this.setRemoteKeyPath = function(remoteKeyPath){
		this.remoteKeyPath = remoteKeyPath;
	};

	/***********************************************************************************************************************
	 * Local parameters
	 * Identifies local file paths involved in the transfer
	 */
	this.setLocalUser = function(username){
		this.localUser = username;
	};
	this.setLocalPassword = function(password){
		this.localPassword = password;
	};
	// A transfer file path. For user name with document root path configured, the path must expressed relative to the user document root path
	this.addLocalPath = function(path){
		this.localFiles.push(path);
	};
	// Path prefix
	this.setLocalRootPath = function(path){
		this.localRootPath = path;
	};
	/***********************************************************************************************************************
	 * File parameters
	 * Specifies file-related parameters pertaining to the transfer
	 */
	this.fileParameters = new Array();
	this.exclusionPattersn = new Array();
	// Specifies whether or not destination directories should be created if they don't exist.
	// Possible values: {Yes|No} - Default No
	this.setFileCreatePath = function(createPath){
		this.fileParameters["CreatePath"] = createPath;
	};			
	// Specifies the mechanism to use when resuming partially transferred files
	// Possible values: {None|Attributes|Sparse Checksum|Full Checksum} - Default:Sparse Checksum
	this.setFileResumeCheck = function(resumeCheck){
		this.fileParameters["ResumeCheck"] = resumeCheck;
	};			
	// Manifest policy. It states if manifest files should be generated or not for transfers
	// Possible values: {None|Text} - Default: None.
	this.setFileManifestPolicy = function(manifestPolicy){
		this.fileParameters["ManifestPolicy"] = manifestPolicy;
	};			
	// Manifest file path. If this property is set, while the ManifestPolicy is not explicitly defined, the system infers that the value of the ManifestPolicy property is "Text", and will generate manifest files.
	this.setFileManifestPath = function(manifestPath){
		this.fileParameters["ManifestPath"] = manifestPath;
	};
	// Specifies if encryption at rest will be applied to the transfer. A passphrase will be set to secure the process.
	// Possible values: {None|Encrypt|Decrypt} - Default: None
	this.setFileProtection = function(protection){
		this.fileParameters["Protection"] = protection;
	}; 			
	// A passphrase to use for encryption at rest
	this.setFilePassphrase = function(passphrase){
		this.fileParameters["Passphrase"] = passphrase;
	};
	//Specifies whether the aggregate size of all files in the job is to be calculated before starting the transfer.
	// Possible values: {Yes|No} - Default: No
	this.setFilePrecalculateJobSize = function(precalculateJobSize){
		this.fileParameters["PreCalculateJobSize"] = precalculateJobSize;
	};	
	// Specifies whether the source files are deleted after the transfer. All folders in the source path will still remain. Also refer to RemoveEmptyDirectories.
	// Possible values: {Yes|No} - Default: No
	this.setFileRemoveAfterTransfer = function(removeAfterTransfer){
		this.fileParameters["RemoveAfterTransfer"] = removeAfterTransfer;
	};	
	// Specifies whether empty directories in the source path are deleted after the transfer.
	// Possible values: {Yes|No}
	this.setFileRemoveEmptyDirectories = function(removeEmptyDirectories){
		this.fileParameters["RemoveEmptyDirectories"] = removeEmptyDirectories;
	};	
	// Specifies symbolic links are handled during the transfer
	// Possible values: {Follow|Copy|Skip|Copy+Force} - Default: Follow
	this.setFileSymbolicLinks = function(symbolicLinks){
		this.fileParameters["SymbolicLinks"] = symbolicLinks;
	};			
	// Specifies whether source timestamps are preserved at the destination.
	// Possible values: {'Yes'|'No'}. - Default: No
	this.setFilePreserveTimestamps = function(preserveTimestamps){
		this.fileParameters["PreserveTimestamps"] = preserveTimestamps;
	};
	// Specifies whether the file owner UID is preserved at the destination.
	// Possible values: {'Yes'|'No'}. - Default No
	this.setFilePreserveUID = function(preserveUID){
		this.fileParameters["PreserveUID"] = preserveUID;
	};
	// Specifies whether the file owner GID is preserved at the destination.
	// Possible values: {'Yes'|'No'}. Default No
	this.setFilePreserveGID = function(preserveGID){
		this.fileParameters["PreserveGID"] = preserveGID;
	};
	// Specifies whether the file creation date is preserved at the destination.
	// Possible values: {'Yes'|'No'} - Default No
	this.setFilePreserveCreationTime = function(preserveCreationTime){
		this.fileParameters["PreserveCreationTime"] = preserveCreationTime;
	};
	// Specifies whether the file modification date is preserved at the destination.
	// Possible values: {'Yes'|'No'} - Default: No
	this.setFilePreserverModificationTime = function(preserveModificationTime){
		this.fileParameters["PreserveModificationTime"] = preserveModificationTime;
	};
	// Specifies whether the file access date is preserved at the destination.
	// Possible values: {'Yes'|'No'}. - Default: No
	this.setFilePreserveAccessTime = function(preserveAccessTime){
		this.fileParameters["PreserveAccessTime"] = preserveAccessTime;
	};
	// Specifies whether the file access time is preserved at the source.
	// Possible values: {'Yes'|'No'}. - Default: No
	this.setFilePreserveSourceAccessTime = function(preserveSourceAccessTime){
		this.fileParameters["PreserveSourceAccessTime"] = preserveSourceAccessTime;
	};
	// Specifies whether special files are skipped.
	// Possible values: {'Yes'|'No'} - Default: No
	this.setFileSkipSpecialFiles = function(skipSpecialFiles){
		this.fileParameters["SkipSpecialFiles"] = skipSpecialFiles;
	};
	// Specifies if transfer file checksum is calculated
	// Possible values: {'none'|'sha1'|'md5'} - Default: none
	this.setFileChecksum = function(fileChecksum){
		this.fileParameters["FileChecksum"] = fileChecksum;
	};
	// Exclude files from the transfer based on when the file was last changed.
	// Positive value is taken as seconds and compared directly to the file "mtime" timestamp in the source file system. 
	// Usually this value is seconds since 1970-01-01 00:00:00. Note however that if your source file system uses a different mtime reference point (other than 1970-01-01 00:00:00), 
	// then the specified positive value must be seconds relative to that reference.
	// Negative values are taken as specifying a time relative to the current time. (eg. if the value of ExcludedOlderThan is -60, then all files modified before the last minute (60 seconds) 
	// will be excluded from the transfer. Similarly, if the value of ExcludedNewerThan is -60, then all files modified during the last minute (60 seconds) will be excluded from the transfer).
	// Unit is seconds
	this.setFileExcludeOlderThan = function(excludeOlderThan){
		this.fileParameters["ExcludeOlderThan"] = excludeOlderThan;
	};
	// Same for ExcludeOlderThan.
	this.setFileExcludeNewerThan = function(excludeNewerThan){
		this.fileParameters["ExlcudeNewerThan"] = excludeNewerThan;
	};
	// Specifies the suffix used for the partial files before transfer completes.
	// Note: if both this parameter and SaveBeforeOverwrite are specified, SaveBeforeOverwrite will take precedence. 
	this.setFilePartialFileSuffix = function(partialFileSuffix){
		this.fileParameters["PartialFileSuffix"] = partialFileSuffix;
	};
	// Specifies the suffix used for partial manifest files
	this.setFileManifestInprogressSuffix = function(manifestInprogressSuffix){
		this.fileParameters["ManifestInprogressSuffix"] = manifestInprogressSuffix;
	};
	// Specifies the read block size, in bytes
	// Unsigned int
	this.setFileReadBlockSize = function(readBlockSize){
		this.fileParameters["ReadBlockSize"] = readBlockSize;
	};
	// Specifies the write block size, in bytes
	// Unsigned int
	this.setFileWriteBlockSize = function(writeBlockSize){
		this.fileParameters["WriteBlockSize"] = writeBlockSize;
	};
	// Specifies the transfer behavior if a content to transfer already exists at destination
	// Possible values: {'Always'|'Never'|'Diff'|'Older'|'DiffAndOlder'} - Default: Diff
	this.setFileOverwrite = function(overwrite){
		this.fileParameters["Overwrite"] = overwrite;
	};
	// Specifies a suffix for partial file when existing files need to be saved before overwrite. Providing a value implies that if the destination file will be saved as a backup if it already exists.
	// Note: if both this parameter and PartialFileSuffix are specified, this parameter will take precedence
	this.setFileSaveBeforeOverwrite = function(saveBeforeOverwrite){
		this.fileParameters["SaveBeforeOverwrite"] = saveBeforeOverwrite;
	};
	// Specifies path exclusion patterns. Paths that match excluded patterns are not transferred i.e. '*.pdf'
	// Up to 16patterns can be specified
	this.addExclusionPattern = function(exclusionPattern){
		this.exclusionPatterns.push(exclusionPattern);
	};


	/***********************************************************************************************************************
	 * Link parameters
	 * Specifies link-related parameters pertaining to the transfer.
	 * Link capacity can be detected automatically by using <AutoDetectCapacity> property.
	 * Link capacity can also be set manually by using <RemoteCapacity> and or <LocalCapacity>:
	 * 	- If <RemoteCapacity> is not defined, <LocalCapacity> is used as the link capacity.
	 * 	- <RemoteCapacity> is used as link capacity when its defined value is less than the value of <LocalCapacity>.
	 * 	- If none of <RemoteCapacity> and <LocalCapacity> is defined, the bandwidth cap will limit the transfer rates.
	 */
	this.linkParameters = new Array();

	// Unsigned int
	this.setLinkRemoteCapacity = function(remoteCapacity){
		this.linkParameters["RemoteCapacity"] = remoteCapacity;
	};

	this.setLinkLocalCapacity = function(localCapacity){
		this.linkParameters["LocalCapacity"] = localCapacity;
	};

	// Indicates whether or not fasp should automatically detect the link capacity during transfer. 
	// Performing automatic detection allows rates to be set at a percentage of the measured value. 
	// When automatic bandwidth discovery is enabled (<AutoDetectCapacity> set to Yes) and the rates expressed as percentage (<MinimumRateAsPercent> or <TargetRateAsPercent> set to Yes), 
	// then the rates will be a percentage of the measured bandwidth. Otherwise, rates must be specified in Kbps.
	// Possible values: {'Yes'|'No'} - Default: No
	this.setLinkAutoDetectCapacity = function(autoDetectCapacity){
		this.linkParameters["AutoDetectCapacity"] = autoDetectCapacity;
	};

	/***********************************************************************************************************************
	 * Rate parameters
	 * Specifies rate-related parameters pertaining to the transfer.
	 */
	this.rateParameters = new Array();
	
	// Specifies the rate policy the transfer should utilize
	// Possible values: {'Fixed'|'Fair'|'Trickle'}. Default: Fixed
	this.setRatePolicy = function(policy){
		this.rateParameters["Policy"] = policy;
	};
	// The target rate of data transmission, in Kbps or %. If <TargetRateAsPercent> is set to Yes, this value will be interpreted as a percentage 
	// and should be set to values between 0 and 100, inclusive. The target rate cannot exceed the link capacity and the <BandwidthCap>
	// Unsigned int. Default: 10000
	this.setRateTargetRate = function(targetRate){
		this.rateParameters["TargetRate"] = targetRate;
	};
	// Indicates whether or not the value of <TargetRate> should be interpreted as a percentage (of the link capacity, see <LinkParameters> or the measured bandwidth). 
	// When automatic bandwidth discovery is enabled (<AutoDetectCapacity> set to Yes) and the rate as percentage is enabled (<TargetRateAsPercent> set to Yes), 
	// then the target rate will be a percentage of the measured bandwidth
	// Possible values: {'Yes'|'No'}. Default: No
	this.setRateTargetRateAsPercent = function(targetRateAsPercent){
		this.rateParameters["TargetRateAsPercent"] = targetRateAsPercent;
	};
	// The minimum rate of data transmission, in Kbps or %. If <MinimumRateAsPercent> is set to Yes, this value will be interpreted as a percentage and should 
	// be set to values between 0 and 100, inclusive. The minimum rate cannot exceed the target rate, the link capacity and the <BandwidthCap>
	// Unsigned int. Default: 0
	this.setRateMinimumRate = function(minimumRate){
		this.rateParameters["MinimumRate"] = minimumRate;
	};	
	// Indicates whether or not the value of <MinimumRate> should be interpreted as a percentage (of the link capacity, see <LinkParameters> or the measured bandwidth). 
	// When automatic bandwidth discovery is enabled (<AutoDetectCapacity> set to Yes) and the rate as percentage is enabled (<MinimumRateAsPercent> set to Yes), 
	// then the minimum rate will be a percentage of the measured bandwidth
	// Possible values: {'Yes'|'No'}. Default: No
	this.setRateMinimumRateAsPercent = function(minimumRateAsPercent){
		this.rateParameters["MinimumRateAsPercent"] = minimumRateAsPercent;
	};
	// A cap on data transfer rates, in Kbps. A value of 10,000,000 indicates that no bandwidth cap will be applied
	// Unsigned int. Default: 10000000
	this.setRateBandwidthCap = function(bandwidthCap){
		this.rateParameters["BandwidthCap"] = bandwidthCap;
	};
	// Priority when sharing virtual bandwidth cap. 1 for higher priority, 2 for regular
	// Unsigned int. Possible values {1,2}. Default: 2
	this.setRatePriority = function(priority){
		this.rateParameters["Priority"] = priority;
	};


	/***********************************************************************************************************************
	 * Channel parameters
	 * Specifies channel-related parameters pertaining to the transfer.
	 */
	this.channelParameters = new Array();
	// UDP port over which data will be transported
	// unsignedShort Default: 33001
	this.setChannelPort = function(port){
		this.channelParameters["Port"] = port;
	};
	// The datagram size fasp™ will use when transmitting data. If this property is set, while the <AutoDetectPathMTU> is not explicitly defined, 
	// the system infers that the value of the <AutoDetectPathMTU> property is "No", and uses the datagram size value provided in this element
	// unsigned int. Default: 1492
	this.setChannelDatagramSize = function(datagramSize){
		this.channelParameters["DatagramSize"] = datagramSize;
	};
	// Indicates whether or not fasp should automatically detect the path MTU (maximum transmission unit).
	// Possible values: {'Yes'|'No'}. Default: Yes
	this.setChannelAutoDetectPathMTU = function(autoDetectPathMTU){
		this.channelParameters["AutoDetectPathMTU"] = autoDetectPathMTU;
	};
	// Specifies if IPv6 addresses are supported
	// Possible values: {'Yes'|'No'}. Default: No
	this.setChannelIPV6 = function(ipv6){
		this.channelParameters["IPV6"] = ipv6;
	};

	/***********************************************************************************************************************
	 * Security parameters
	 * Specifies security-related parameters pertaining to the transfer.
	 */
	this.securityParameters = new Array();
	// Specifies the encryption cipher used to encrypt data during transfer
	// Possible values: {'None'|'AES-128'}. Default: None
	this.setSecurityEncryptionCipher = function(encryptionCypher){
		this.securityParameters["EncryptionCypher"] = encryptionCypher;
	};
	// Specifies the host SSH key fingerprint
	this.setSecuritySSHFingerprint = function(sshFingerPrint){
		this.securityParameters["SSHFingerprint"] = sshFingerPrint;
	};

	/***********************************************************************************************************************
	 * Retry parameters
	 * Specifies retry-related parameters pertaining to the transfer. Retry parameters in user preferences will be applied if this element is not defined
	 */
	this.retryParameters = new Array();
	// Number of transfer attempts
	// Unsigned int
	this.setRetryCount = function(count){
		this.retryParameters["Count"] = count;
	};
	// Base time interval, in seconds. The base time interval specifies the base time that will elapse between a failed transfer and a retry attempt. 
	// After each subsequent failure, the time interval will be doubled, up to the maximum value as specified by <MaximumInterval>. 
	// Setting <BaseInterval> and <MaximumInterval> to the same value, effectively indicates a constant time interval between retry attempts.
	// Unsigned int
	this.setRetryBaseInterval = function(baseInterval){
		this.retryParameters["BaseInterval"] = baseInterval;
	};
	// Maximum time interval, in seconds. The maximum time interval limits the increasing of the time interval that occurs as a result of multiple, subsequent failures
	this.setRetryMaximumInterval = function(maximumInterval){
		this.retryParameters["MaximumInterval"] = maximumInterval;
	};

	/******************************************************************************************************************************/

	this.getRemoteLocationXml = function(){
		var pathXml = "";
		for(var i = 0; i < this.remotePaths.length; i++){
			pathXml = pathXml + "<Path>"+this.remotePaths[i]+"</Path>";
		}
		if (this.remoteRootPath != null){
			pathXml = pathXml + "<RootPath>"+this.remoteRootPath+"</RootPath>";
		}
		var portXml = "";
		if (this.remotePort != null){
			portXml = "<Port>"+this.remotePort+"</Port>";
		}

		var authenticationMethod = "";
		if(this.remoteAuthenticationMode == "Public Key"){
			authenticationMethod = 
					"<Methods>"+
						"<Method>Public Key</Method>"+
					"</Methods>"+
					"<KeyPath>"+this.remoteKeyPath+"</KeyPath>";
		}else if(this.remoteAuthenticationMode == "Token"){
			authenticationMethod = 
					"<Methods>"+
						"<Method>Token</Method>"+
					"</Methods>";
		}else {
			authenticationMethod = 
					"<Methods>"+
						"<Method>Password</Method>"+
					"</Methods>";
		}

		var credentials = "";
		if(this.remoteUser!=null){
			credentials = 
				"<UserName>"+this.remoteUser+"</UserName>";
		}
		if(this.remotePassword!=null){
			credentials = credentials+
				"<Password>"+this.remotePassword+"</Password>";
		}
		return "<RemoteLocation>"+
			"<System>"+
				"<Address>"+this.remoteHost+"</Address>"+
				portXml+
				credentials+
			"</System>"+
			"<Authentication>"+
					authenticationMethod+
			"</Authentication>"+
			"<Files>"+
				pathXml+
			"</Files>"+
			"<Proxy>"+
				"<Url>"+
				this.asperaProxy+
				"</Url>"+
			"</Proxy>"+
		"</RemoteLocation>";
	};

	this.getLocalLocationXml = function(){
		var systemXml = "";
		if (this.localUser != null || this.localPassword != null){
			systemXml = 
			"<System>"+
				"<UserName>"+this.localUser+"</UserName>"+
				"<Password>"+this.localPassword+"</Password>"+
			"</System>";
		}
		var pathXml = "";
		for(var i = 0; i < this.localFiles.length; i++){
			pathXml = pathXml + "<Path>"+this.localFiles[i]+"</Path>";
		}
		if (this.localRootPath != null){
			pathXml = pathXml + "<RootPath>"+this.localRootPath+"</RootPath>";
		}
		return "<LocalLocation>"+
			systemXml+
			"<Files>"+
				pathXml+
			"</Files>"+
		"</LocalLocation>";

	};

	this.getXmlValues = function(obj){
		// For every property set on the object, use the property name as the node and the property value as the node value
		var propXml = "";
		for(key in obj){
			if (obj.hasOwnProperty(key)){
				propXml = propXml + "<"+key+">"+obj[key]+"</"+key+">";
			}
		}
		return propXml;
	};

	this.getToken = function(){
		return (this.token == "" || this.token == null) ? "" : "<Token>"+this.token+"</Token>";
	}

	this.getFileParametersXml = function(){
		var props = this.getXmlValues(this.fileParameters);

		return props == "" ? "" : "<FileParameters>"+props+"</FileParameters>";
	};

	this.getChannelParametersXml = function(){
		var props = this.getXmlValues(this.channelParameters);

		return props == "" ? "" : "<ChannelParameters>"+props+"</ChannelParameters>";
	};

	this.getLinkParametersXml = function(){
		var props = this.getXmlValues(this.linkParameters);

		return props == "" ? "" : "<LinkParameters>"+props+"</LinkParameters>";
	};

	this.getRateParametersXml = function(){
		var props = this.getXmlValues(this.rateParameters);

		return props == "" ? "" : "<RateParameters>"+props+"</RateParameters>";
	};

	this.getSecurityParametersXml = function(){
		var props = this.getXmlValues(this.securityParameters);

		return props == "" ? "" : "<SecurityParameters>"+props+"</SecurityParameters>";
	};

	this.getRetryParametersXml = function(){
		var props = this.getXmlValues(this.retryParameters);

		return props == "" ? "" : "<RetryParameters>"+props+"</RetryParameters>";
	};

	this.getSOAPXml = function(){
		// SOAP XML that goes around the transfer object
		var soapPre = 
		
		"<job:SubmitRequest>"+
 			"<Type>Aspera.IScpTransfer</Type>"+
 			"<Definition>";
		
		var soapPost = 
			"</Definition>"+
		"</job:SubmitRequest>";
			

		// Create the Order XML
		var orderXml = 
		"<Order>"+
			"<Version>"+this.version+"</Version>"+
			"<Agent>"+this.agent+"</Agent>"+
			"<ApplicationData>"+
				"<Cookie>"+ this.cookie +"</Cookie>"+
				this.getToken()+
			"</ApplicationData>"+  
			"<Operation>"+this.operation+"</Operation>"+
			this.getRemoteLocationXml()+
			this.getLocalLocationXml()+
			this.getFileParametersXml()+
			this.getChannelParametersXml()+
			this.getLinkParametersXml()+
			this.getRateParametersXml()+
			this.getSecurityParametersXml()+
			this.getRetryParametersXml()+
		"</Order>";
		
		
		// #jeffy magic
		
		return soapPre + StringEscapeUtils.escapeXml(orderXml).toString() + soapPost;
		
		// Leave the below in just in case this is wanted for reference in the future
		
		// Use the XMLWriter to encode the characters as per the Aspera example
		/* var xof = XMLOutputFactory.newInstance();
		var s = new StringWriter();
		var xmlWriter = xof.createXMLStreamWriter(s);
		xmlWriter.writeCharacters(new java.lang.String(orderXml));
		xmlWriter.flush();
		xmlWriter.close();
		return soapPre + s.toString() + soapPost;*/

	};
}

/**
* Uses the Aspera Node API web connection to send Aspera SOAP payloads to the Aspera Server.
* 
*/
function AsperaTransfer(){
	this._connection = null;

	this.host = null;
	//this.port = 9091; // http
	this.port = 9091; // https
	this.scheme = "http";
	this.username = null;
	this.password = null;

	this.logInfoFunc = null;
	this.logDebugFunc = null;
	this.logErrorFunc = null;
	

	// Executor used for polling the server for status of the transfer

	this.logInfo = function(msg){
		if (this.logInfoFunc){
			this.logInfoFunc("AsperaTransfer-INFO: "+msg);
		}else if (output){
			output("AsperaTransfer: INFO: "+msg);
		}
	};

	this.logDebug = function(msg){
		if (this.logDebugFunc){
			this.logDebugFunc("AsperaTransfer-DEBUG: "+msg);
		} else if (debugOutput) {
			debugOutput("AsperaTransfer-DEBUG: "+msg);
		}
	};

	this.logError = function(msg){
		if (this.logErrorFunc) {
			this.logErrorFunc("AsperaTransfer-ERROR: "+msg);
		} else if (error) {
			error("AsperaTransfer-ERROR: "+msg)
		}
	};

	this.createSOAPPayload = function(msgXml){
		return	"<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+
					"<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:job=\"urn:Aspera:XML:JobNET:2006/01:Types\"  xmlns:sess=\"urn:Aspera:XML:FASPSessionNET:2009/11:Types\">"+
			   			"<soapenv:Header/>"+
   						"<soapenv:Body>"+
				   			msgXml+
						"</soapenv:Body>"+
					"</soapenv:Envelope>";
	};

	this.getXmlResult = function(){
		// Only if the HTTP response was okay
		var status = this._connection.getLastStatus();
		this.logDebug("Last HTTP status: "+status);

		if(status >= 200 && status <= 299){
			var response = String(this._connection.getLastBody());
			try{
				// First of all strip off the xml prolog and any leading whitespace as it can cause problems
				response = response.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, "").replace(/^\s+/,'');
				
				this.logDebug("Parsing xml result: "+response);
				var responseXml = new XML(response);

				return responseXml;
			} catch (e) {
				// TODO log out the error.
				this.logError("Error parsing result: "+e.message);
				this.logError("Returned XML: "+response);
				return null;
			}
		}
		return null;
	};

	this.initialiseConnection = function(){
		// For some reason, using the same connection to send more than one message results in an error on the server
		// that's why I'm re-creating it every time.
		//if (this._connection == null){
			this._connection = new SimpleRestClient();
			// Add some headers
			// Expect:
			// Content-Type: text/xml;charset=UTF-8
			// SOAPAction: JobNET-200601#Submit
			this._connection.setMimeType("text/xml;charset=UTF-8");
			this._connection.setScheme(this.scheme);
			this._connection.setHost(this.host);
			this._connection.setPort(this.port);
			// Set up the authentication
			this._connection.setAuthenticationType("basic");
			this._connection.setUsername(this.username);
			this._connection.setPassword(this.password);
		//}
		return this._connection;
	};

	/**
	* Takes an AsperaTransferJob and submits it to the server for processing
	* returns the job ID, or null if something went wrong
	*/
	this.submitJob = function(transferJob){
		if (transferJob){
			// Always make sure that PreCalculateJobSize is always on for status.
			transferJob.setFilePrecalculateJobSize("Yes");

			var conn = this.initialiseConnection();
			//conn.setPath("/services/soap/JobNET-200601");
			conn.setHttpHeader("SOAPAction", "JobNET-200601#Submit");
			conn.setPath("/services/soap/Transfer-201210");
			var payload = this.createSOAPPayload(transferJob.getSOAPXml());
			output("SOAP Payload: "+payload);
			conn.send("POST", payload);
			this.logDebug("Getting result for submitJob");
			var resultXml = this.getXmlResult();
		
			if (resultXml != null) {
				this.logDebug("Extracting Job Id from result");
				// Got a valid response. Get the job ID
				var jrs = resultXml..*::JobResult;
				if(jrs.length() > 0){
					var jobResult = jrs[0];
					return jobResult..*::ID.toString();
				}
			}else{
				this.logDebug("SubmitJob returned null");
			}
		}
		return null;
	};

	/**
	* Gets the FileTransferStatistics for each file transfer for the given job id, note that a job can consist of more than one file.
	* Returned object looks like
	* {
	*	jobId: <the jobid>
	*   fileTransfers:[{
	*		path: <the source file path>
	*		status: <running|completed|error>
	*		errorCode: <A number. 0 if no error>
	*		size: <Size of the file in bytes>
	*		bytesWritten: <Number of bytes written>
	*		progress: <Progress as a percentage value>
	*	}]
	* }
	*/
	this.getFileTransferStatus = function(jobId){
		var conn = this.initialiseConnection();
		conn.setHttpHeader("SOAPAction", "FASPSessionNET-200911#GetFileTransferStatistics");
		conn.setPath("/services/soap/Transfer-201210");
		var msg = this.createSOAPPayload("<sess:GetFileTransferStatisticsRequest>"+
						"<FileTransferFilter><JobId>"+jobId+"</JobId></FileTransferFilter>"+
					"</sess:GetFileTransferStatisticsRequest>");
		this.logDebug("Getting status of job: "+msg);
		conn.send("POST", msg);

		var resultXml = this.getXmlResult();
		if (resultXml != null){
			// Note: If a job consisted of many file transfers, there is the possibility that the results could be paged,
			// however, for now assuming that we won't be generating jobs with enough file transfers (100 - see MaxResults above) to warrant a paged result.
			var result = {
				jobId: jobId,
				fileTransfers: []
			};
			var fileTransfers = resultXml..*::FileTransferStatistics;
			for(var i = 0; i < fileTransfers.length(); i++){
				var fileXferStatsXml = fileTransfers[i];
				this.logDebug("Got file transfer status: "+fileXferStatsXml.toString());
				var fileSize = Number(fileXferStatsXml..*::Size.toString());
				var bytesWritten = Number(fileXferStatsXml..*::BytesWritten.toString());
				var resultXfer = {
					path: fileXferStatsXml..*::Path.toString(),
					status: fileXferStatsXml..*::Status.toString(),
					errorCode: Number(fileXferStatsXml..*::ErrorCode.toString()),
					size: fileSize,
					written: bytesWritten,
					progress: (bytesWritten == 0 ? 0 : Math.round((bytesWritten / fileSize) * 100))
				};
				this.logDebug("path="+resultXfer.path);
				this.logDebug("status="+resultXfer.status);
				this.logDebug("errorCode="+resultXfer.errorCode);
				this.logDebug("size="+resultXfer.size);
				this.logDebug("written="+resultXfer.written);
				this.logDebug("progress="+resultXfer.progress);
				result.fileTransfers.push(resultXfer);
				this.logDebug("fileTransfers.length="+result.fileTransfers.length);
			}
			return result;
		}
		return null;
	};

	/*
	*
	* Returned object looks like
	* {
	*	jobId: <the jobid>
	*	status: <running|paused|completed|cancelled|error|willretry|orphaned>
	*	errorCode: <0 if no error>
	*	errorDescription: <description if the session failed>
	*   fileCount: <total number of files to transfer>
	*	filesComplete: <number of complete files>
	*	filesFailed: <number of files failed>
	*	filesTransferring: <number of files currently transferring>
	*	totalBytes: <total number of bytes to transfer>
	*	bytesWritten: <number of bytes written>
	*	progress: <progress of bytes written as a percentage>
	* }
	*/
	this.getJobStatus = function(jobId){
		var conn = this.initialiseConnection();
		conn.setHttpHeader("SOAPAction", "FASPSessionNET-200911#GetSessionStatistics");
		conn.setPath("/services/soap/Transfer-201210");
		var msg = this.createSOAPPayload("<sess:GetSessionStatisticsRequest>"+
						"<SessionFilter><JobId>"+jobId+"</JobId></SessionFilter>"+
					"</sess:GetSessionStatisticsRequest>");
		this.logDebug("Getting status of job: "+msg);
		conn.send("POST", msg);

		var resultXml = this.getXmlResult();
		if (resultXml != null){
			this.logDebug("Got SessionStatistics: "+resultXml.toString());
			var result = {};
			result.jobId = jobId;
			result.status = resultXml..*::Status.toString();
			result.errorCode = Number(resultXml..*::ErrorCode.toString());
			if(resultXml..*::ErrorDescription != undefined){
				result.errorDescription = resultXml..*::ErrorDescription.toString();
			} else {
				result.errorDescription = "";
			}
			result.fileCount = Number(resultXml..*::ExpectedFileCount.toString());
			result.filesComplete = Number(resultXml..*::FilesComplete.toString());
			result.filesFailed = Number(resultXml..*::FilesFailed.toString());
			result.filesTransferring = Number(resultXml..*::FilesTransferring.toString());
			result.totalBytes = Number(resultXml..*::ExpectedByteCount.toString());
			result.bytesWritten = Number(resultXml..*::BytesWritten.toString());
			result.progress = result.bytesWritten == 0 ? 0 : Math.round((result.bytesWritten / result.totalBytes) * 100);
			return result;
		}
		return null;
	};
}

