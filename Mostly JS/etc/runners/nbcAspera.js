importPackage(Packages.java.io);
importPackage(Packages.com.pharos.poxclient); //Nicking the copy function, just easier.

load('/opt/evertz/mediator/etc/runners/nbcAsperaTransfer.js');

//Need wscall if we are to update job progress.
if (typeof(wscall) === 'undefined') {
	load('/opt/evertz/mediator/lib/js/shellfun.js');
};	


var nbcAspera = function() {
	//Information to log into Local Aspera at NBC.
	this.__LOCAL_ASPERA_HOST = settings.asperaSourceNode;
	this.__LOCAL_ASPERA_PORT = "40001";
	this.__LOCAL_ASPERA_USER = "";
	this.__LOCAL_ASPERA_PASS = "";
	this.__cookie = null;
	this.__token = null;

	//Required values to be set per transfer initiated
	this.__sourceFiles = [];
	this.__dstPassword = '';//Default to no password for RSA keys
	this.__dstUsername = null;
	this.__remoteHost = null;
	this.__remoteAuthenticationMode = null;
	this.__remoteKeyPath = null;

	//Optional additional values that can be set to alter functionality.
	this.__remotePath = null; 
	this.__debug = true;
	this.__statusPollTime = 10;
	this.__updateTransferManagerProgress = false;
	this.__mediatorJobId = null;
	this.__isMD5 = false;
	this.__fileProtection = null;
	this.__filePassphrase = null;
	this.__securityEncryptionCipher = null;
	this.__retryIfJobTimedOut = false;
	this.__retryTimeoutSeconds = 300;

	//Internal values used between methods
	this.__aspTransfer = null;
	this.__tempFolderId = null;
	this.__asperaProxy = null;
	this.__asperaTransferJobStartTime = null;
	this.__asperaTransferFailureMessage = '';

	/**
	 * [Sets username of the local Aspera to transfer from]
	 * @param {[String]} __user [Aspera User name]
	 */
	this.setLocalUser = function(__user) {
		this.__infoLog('Local Username set to ['+__user+']');
		this.__LOCAL_ASPERA_USER = __user;
	};

	/**
	 * [Sets password of the local Aspera to transfer from]
	 * @param {[String]} __pass [Aspera password]
	 */
	this.setLocalPassword = function(__pass) {
		this.__infoLog('Local Password set to ['+__pass+']');
		this.__LOCAL_ASPERA_PASS = __pass;
	};

	/**
	 * [Sets the local Aspera location (ip/host)]
	 * @param {[String]} __host [IP or hostname of Aspera]
	 */
	this.setLocalHost = function(__host) {
		this.__infoLog('Local Host set to ['+__host+']');
		this.__LOCAL_ASPERA_HOST = __host;
	};

	/**
	 * [__makeGuid generates a random UUID in a simplistic fashion]
	 * @return {String} [returns a UUID]
	 */
	this.__makeGuid = function() {
		var __guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
		return __guid;
	};

	/**
	 * [Internally used for setting a temporary folder used to put files in before a transfer is initiated]
	 * @param  {[String]} __tempFolderId [Folder Name without any slashes]
	 */
	this.__setTempFolderId = function(__tempFolderId) {
		this.__infoLog('Temp Folder Id Set ['+__tempFolderId+']');
		this.__tempFolderId = __tempFolderId;
	};

	/**
	 * [Info Logging]
	 * @param  {[String]} __text [Text to be logged]
	 */
	this.__infoLog = function(__text){
		print('NBCAspera-INFO: '+__text);
	};

	/**
	 * [Debug Logging]
	 * @param  {[String]} __text [Text to be logged]
	 */
	this.__debugLog = function(__text) {
		if (this.__debug) {
			print('NBCAspera-DEBUG: '+__text);
		};
	};

	/**
	 * [Error Logging, also Deletes temp files/folder(cleanup)]
	 * @param  {[String]} __text [Text to be logged]
	 */
	this.__errorLog = function(__text){
		print('NBCAspera-ERROR: '+__text);
		this.deleteTempFolder();
		throw new Error('NBCAspera-ERROR: '+__text);
	};

	/**
	 * [Makes a Directory]
	 * @param  {[String]} __path [full path of directory]
	 * @return {[Boolean]}        
	 */
	this.__makeDir = function(__path) {
		return new File(__path).mkdir();
	};

	/**
	 * [Creates the full folder path requird to be created]
	 * @param  {[String]} __folderName [folder name to be made]
	 * @return {[Boolean]}
	 */
	this.__makeAsperaTempDir = function(__folderName) {
		return this.__makeDir(this.__asperaLocalLocation+__folderName+'/');
	};

	/**
	 * [Generic File Copy]
	 * @param  {String} src [Full path and file]
	 * @param  {String} dst [Destination location, filename optional]
	 */
	this.__copyFile = function(src, dst) {
		this.__infoLog('Copying: '+src+' --> '+dst);
        FileUtils.copyFile(src, dst);
        if (fileExists(dst)) {
            this.__infoLog('Copy Completed');
        } else {
            this.__errorLog('File Failed to copy');
        }
	};

	/**
	 * [Creates the full location path required for the file transfer]
	 * @param  {[String]} src          [source file (local)]
	 * @param  {[String]} __folderName [destination folder name]
	 */
	this.__copyFileToAsperaTemp = function(src,__folderName) {
		var fileId = /[^\/]+$/.exec(src).toString();
		this.__copyFile(src,this.__asperaLocalLocation+__folderName+'/'+fileId);
	};

	/**
	 * [Generates the relative path for Aspera, gets fed to Aspera to transfer this file]
	 * @param  {[String]} src          [source file(local)]
	 * @param  {[String]} __folderName [destination folder name]
	 * @return {[String]}              [compiled relative path for Aspera]
	 */
	this.__getRelativeFile = function(src,__folderName) {
		var fileId = /[^\/]+$/.exec(src).toString();
		return this.__asperaRelativeLocation+__folderName+'/'+fileId;
	};

	/**
	 * [Adds a source file to be transferred]
	 * @param {[String]} __file [full path to filename, local.]
	 */
	this.addSourceFile = function(__file) {
		this.__infoLog('Adding Source File ['+__file+']');
		this.__sourceFiles.push(__file);
	};


	/**
	 * [Sets Cookie ]
	 * @param {[String]} __cookie [Transfer Cookie]
	 */
	this.setCookie = function(__cookie) {
		this.__infoLog('Cookie set to ['+__cookie+']');
		this.__cookie = __cookie;
	};

	/**
	 * [Sets Token ]
	 * @param {[String]} __token [Transfer Token]
	 */
	this.setToken = function(__token) {
		this.__infoLog('Token set to ['+__token+']');
		this.__token = __token;
	};

	/**
	 * [Sets username of the destination Aspera to transfer to]
	 * @param {[String]} __user [Aspera User name]
	 */
	this.setRemoteUsername = function(__user) {
		this.__infoLog('Remote Username set to ['+__user+']');
		this.__dstUsername = __user;
	};

	/**
	 * [Sets md5 to true or false]
	 * @param {[boolean]} __bool [Boolean]
	 */
	this.setIsMD5 = function(__bool) {
		this.__infoLog('MD5 set to ['+__bool+']');
		this.__isMD5 = __bool;
	};

	/**
	 * [Sets retryIfJobStuck to true or false]
	 * @param {[boolean]} __bool [Boolean]
	 */
	this.setRetryIfJobTimedOut = function(__bool) {
		this.__infoLog('retryIfJobTimedOut set to ['+__bool+']');
		this.__retryIfJobTimedOut = __bool;
	};

	/**
	 * [Sets retryStuckTime to true or false]
	 * @param {[boolean]} __bool [Boolean]
	 */
	this.setRetryTimeoutSeconds = function(__seconds) {
		this.__infoLog('retryTimeoutSeconds set to ['+__seconds+'] seconds.');
		this.__retryTimeoutSeconds = __seconds;
	};

	/**
	 * [Internally used for setting the start time of the transfer]
	 * @param  {[String]} __tempFolderId [Folder Name without any slashes]
	 */
	this.__setAsperaTransferJobStartTime= function(__startTime) {
		this.__infoLog('AsperaTransferJobStartTime Set ['+__startTime+']');
		this.__asperaTransferJobStartTime = __startTime;
	};

	this.__setAsperaTransferFailureMessage = function(_errorDescrip) {
		this.__asperaTransferFailureMessage = _errorDescrip;
	};

	this.__getAsperaTransferFailureMessage = function() {
		return this.__asperaTransferFailureMessage;
	};	

	/**
	 * [Sets password of the destination Aspera to transfer to]
	 * @param {[String]} __pass [Aspera password]
	 */
	this.setRemotePassword = function(__pass) {
		this.__infoLog('Remote Password set to ['+__pass+']');
		this.__dstPassword = __pass;
	};

	/**
	 * [Sets the remote Aspera location (ip/host)]
	 * @param {[String]} __host [IP or hostname of Aspera]
	 */
	this.setRemoteHost = function(__host) {
		this.__infoLog('Remote Host set to ['+__host+']');
		this.__remoteHost = __host;
	};

	/**
	 * [Set the location to put the files on the Destination]
	 * @param {[String]} __path [Aspera destination path]
	 */
	this.setRemotePath = function(__path) {
		this.__infoLog('Remote Path set to ['+__path+']');
		this.__remotePath = __path;
	};
	
	/**ADDED BY NATHANIEL DESHPANDE ON MARCH 31st, 2016
	 * [Set the SSH port OVER WHICH THE TRANSFER WILL BE INITIATED]
	 * @param {[Number]} __sshPort [SSH PORT]
	 */
	this.setSshPort = function(__sshPort) {
		this.__infoLog('SSH Port set to ['+__sshPort+']');
		this.__remotePort = __sshPort;
	};
	
	this.setAsperaProxy = function(__asperaProxy) {
		this.__infoLog('Aspera Proxy Port set to ['+__asperaProxy+']');
		this.__asperaProxy = __asperaProxy;
	};
	
	/**ADDED BY NATHANIEL DESHPANDE ON MARCH 31st, 2016
	 * [Set the target Bandwidth which will be used as the maximum bandwidth]
	 * @param {[Number]} __rate [Max Bandwidth in MB]
	 */
	this.setTargetBandwidth = function(__rate) {
		this.__infoLog('Target Bandwidth set to ['+__rate+']');
		this.__targetRate = __rate;
	};
	
	/**ADDED BY NATHANIEL DESHPANDE ON MARCH 31st, 2016
	 * [Set the minimum Bandwidth which will be used as the minimum bandwidth]
	 * @param {[Number]} __rate [Min Bandwidth in MB]
	 */
	this.setBandwidthMin = function(__rate) {
		this.__infoLog('Bandwidth Min set to ['+__rate+']');
		this.__minimumRate = __rate;
	};
	
	/**ADDED BY NATHANIEL DESHPANDE ON MARCH 31st, 2016
	 * [Set the UDP Port which data will be transported. Default is set to 33001.]
	 * @param {[Number]} __rate [Min Bandwidth in MB]
	 */
	this.setUdpPort = function(__port) {
		this.__infoLog('UDP Port set to ['+__port+']');
		this.__channelUdpPort = __port;
	}; 
	
	this.setRemoteAuthenticationMode = function(__remoteAuthenticationMode) {
		this.__infoLog('Remote Authentication Mode set to ['+__remoteAuthenticationMode+']');
		this.__remoteAuthenticationMode = __remoteAuthenticationMode;
	};

	this.setRemoteKeyPath = function(__remoteKeyPath) {
		this.__infoLog('Remote Key Path set to ['+__remoteKeyPath+']');
		this.__remoteKeyPath = __remoteKeyPath;
	};

	this.setFileProtection = function(__fileProtection) {
		this.__infoLog('Protection set to ['+__fileProtection+']');
		this.__fileProtection = __fileProtection;
	};

	this.setFilePassphrase = function(__filePassphrase) {
		this.__infoLog('Passphrase set to ['+__filePassphrase+']');
		this.__filePassphrase = __filePassphrase;
	};

	this.setSecurityEncryptionCipher = function(__securityEncryptionCipher) {
		this.__infoLog('SecurityEncryptionCipher set to ['+__securityEncryptionCipher+']');
		this.__securityEncryptionCipher = __securityEncryptionCipher;
	};

	/**
	 * [Set whether this runs in debug mode]
	 * @param {[Boolean]} __debug [true/false]
	 */
	this.setDebug = function(__debug) {
		if (__debug === true) {
			this.__infoLog("Debug Logging ON");
			this.__debug = true;
		} else {
			this.__infoLog("Debug Logging OFF");
			this.__debug = false;
		}
	};

	/**
	 * [Alter the default Status Poll Time for internal job queries]
	 * @param {[Number]} __statusPollTime [Number of seconds]
	 */
	this.setStatusPollTime = function(__statusPollTime) {
		this.__statusPollTime = parseInt(__statusPollTime,10);
		this.__infoLog('PollTime Set to ['+this.__statusPollTime+']');
	};

	/**
	 * [Sets up for echoing required string to update TransferManager transfer progress]
	 * @param  {[Boolean]} __bUpdateTransferProgress [true/false]
	 */
	this.updateTransferProgress = function(__bUpdateTransferProgress) {
		this.__infoLog('Update Transfer Manager Transfer Progress ['+__bUpdateTransferProgress+']');
		if (__bUpdateTransferProgress === true) {
			this.__updateTransferManagerProgress = true;
		} else {
			this.__updateTransferManagerProgress = false;
		};
	};

	/**
	 * [Sets up for updating a Mediator Job with Progress]
	 * @param {[String]} __mediatorJobId [Mediator Job Id]
	 */
	this.setMediatorJobId = function(__mediatorJobId) {
		if (typeof(_sessionKey) !== 'undefined') {
			this.__infoLog('Setting Mediator Job ID to update to ['+__mediatorJobId+']');
			this.__mediatorJobId = __mediatorJobId;
		} else {
			this.__errorLog('Need \'_sessionKey\' to be available to update Mediator Jobs');
		}	
	};

	/**
	 * [Updates a Mediator Job with the Transfer Progress]
	 * @param  {[Number]} __progressPercent [the % number to increment, set internally]
	 */
	this.__updateMediatorJobProgress = function(__progressPercent) {
        var xml = <PharosCs>
                  <CommandList>
                    <Command subsystem="job" method="updateStatusMap">
                      <ParameterList>
                        <Parameter name="jobId">
                          <Value>{this.__mediatorJobId}</Value>
                        </Parameter>
                        <Parameter name="jobInfo">
                          <Value>
                            <Mapping>
                              <JOB__PROGRESS>{__progressPercent}</JOB__PROGRESS>
                              <ScriptProgress>
				                <Integer>{__progressPercent}</Integer>
				              </ScriptProgress>
                            </Mapping>
                          </Value>
                        </Parameter>
                      </ParameterList>
                    </Command>
                  </CommandList>
                </PharosCs>;
        wscall(xml);
	};

	/**
	 * [Checks we have enough information set to begin]
	 * @return {Boolean} [true if we can start transfer, false if we need more parameters set]
	 */
	this.__hasValidConfig = function() {
		if (this.__sourceFiles.length === 0 ||
			/*!this.__dstPassword ||  //Password removed incase using RSA Keys password will not be sent*/
			!this.__dstUsername ||
			!this.__remoteHost) {
			return false;
		} else {
			return true;
		}
	};

	/**
	 * [Checks that all requested files can be sourced]
	 * @return {[Boolean]} [true/false]
	 */
	this.__checkSourceFilesExist = function() {
		for (var i=0; i<this.__sourceFiles.length; i++) {
			this.__infoLog('Checking File ['+this.__sourceFiles[i]+']...');
			var __file = new File(this.__sourceFiles[i]);
			if (!__file.exists() || !__file.isFile()) {
				return false;
			} else {
				this.__infoLog('OK!');
			}
		}
		return true;
	};

	/**
	 * [Gets Job Status from the Aspera Transfer]
	 * @param  {[String]} __jobId [Aspera Job ID]
	 * @return {[Object]}         [job object]
	 */
	this.getJobStatus = function(__jobId) {
		//generic job statistics currentlty not working		
		this.__infoLog('Getting Job Status');
        var job = this.__aspTransfer.getJobStatus(__jobId);
      	var __jobFinished = false;
        if (job) {
        	return job;
        } else {
        	this.__infoLog('No JobStatus available yet');
        	return null;
        }
	};

	/**
	 * [Simpler poller to request status at regular intervals and handle updates, cancellations, completions etc]
	 * @param  {[String]} __jobId [Aspera Job ID]
	 */
	this.__pollJobStatus = function(__jobId) {
		if (__jobId) {
			while (true) {
				sleep(this.__statusPollTime);
				var job = this.getJobStatus(__jobId);
				if (job) {
		            this.__infoLog('Job ID = '+job.jobId);
		            this.__infoLog('Job Status = '+job.status);
		            this.__infoLog('Job progress = '+job.progress);
		            this.__infoLog('=============================================');

		            //Update Transfer Manager Status
		            if (this.__updateTransferManagerProgress === true) {
		            	print('scriptprogress '+job.progress);
		            };

		            //Update Mediator Job Status if applicable - we only care to deal with 0-100% of a job at present.
		            if (this.__mediatorJobId) {
		            	this.__debugLog('Updating Mediator JobID ['+this.__mediatorJobId+'] with progress ['+job.progress+']');
		            	this.__updateMediatorJobProgress(job.progress);
		            };

		            //Job Completed, let's get out of this poll loop happily.
		            if (job.status === 'completed'){
		            	this.__infoLog('Job Finished');
		            	break;
		            };

					 if (job.status === 'error' || job.status === 'cancelled' || job.status === 'orphaned') {
						this.__errorLog('Transfer ended unexpectedly with status ['+job.status+'] ErrorDescription ['+job.errorDescription+']');
						break;
					};

		            //If errors or cancels, throw up an error.
		            if (job.status === 'error') {
		            	this.__setAsperaTransferFailureMessage(job.errorDescription);
		            	return 'error';
		            };		            

		            // If we've turned on retry after a timed interval when stuck, do the following
		            if(this.__retryIfJobTimedOut){
						var isTimeout = gmoNBCFunc.isPastThresholdTime(this.__asperaTransferJobStartTime,this.__retryTimeoutSeconds);
						if(isTimeout && parseInt(job.progress) == 0){
							this.__infoLog("Job has run for more than [" + this.__retryTimeoutSeconds + "] seconds with 0 progress. Resubmitting transfer...");
							return 'timeout';
						}
					};
		        }
			}
		}
	};

	/**
	 * [Deletes all temporary files and temporary folder created for the Aspera Transfer]
	 */
	this.deleteTempFolder = function() {
		//Make sure we have a folder id set so we don't try to delete the root or something crazy
		//Really really make sure there's some temp folder id, I dont want to be recursively deleting the main folder or any crazyness.
		if (this.__tempFolderId && this.__asperaLocalLocation !== this.__asperaLocalLocation+this.__tempFolderId) {
			var __tempFolderLocation = new File(this.__asperaLocalLocation+this.__tempFolderId+'/');
			if (__tempFolderLocation.exists() && __tempFolderLocation.isDirectory()) {
				this.__infoLog('Delete temp folder/files');
				//Delete files in folder, then folder
				var __fileList = __tempFolderLocation.listFiles();
				for (var i=0; i<__fileList.length; i++) {
					if (__fileList[i].isFile()) {
						this.__infoLog('Deleting ['+__fileList[i]+']');
						__fileList[i]['delete'](); 
						// this is just calling the delete() method on the file obj, 
						// however, rhino likes to interpret it as an operator if we do it in the standard way
					} else {
						this.__infoLog('Could not delete - this is not a file ['+__fileList[i].toString()+']');
					};
				};
				this.__infoLog('Deleting folder ['+__tempFolderLocation+']');
				__tempFolderLocation['delete']();
				// this is just calling the delete() method on the file obj, 
				// however, rhino likes to interpret it as an operator if we do it in the standard way
			} else {
				this.__infoLog('Temp folder does not exist - Nothing to do.');
			}
		};	
	};

	/**
	 * Starts the Transfer to Aspera end point, includes several stages
	 * Validate config
	 * Check source files
	 * Transfer to local Aspera
	 * Transfer to remote Aspera
	 * Status polling
	 * Deletion of temp files
	 */
	this.startTransfer = function() {
		var __filesToTransfer = [];
		this.__setAsperaTransferJobStartTime(new Date().getTime());

		this.__infoLog('Starting Transfer Process');
		//Do we have the bits we need to try to transfer?
		this.__infoLog('Checking Configuration provided');
		if (!this.__hasValidConfig()) {
			this.__errorLog('Not enough information provided.\n' +
						'Require at Minimum:\n' +
							'\tOne File to Transfer\n' +
							'\tDestination Username\n' +
							'\tDestination Hostname/IP');
		};
		
		//transfer to aspera cluster using a folder with guid
		this.__infoLog('Preparing for transfer to Aspera Storage');
				
		for (var i=0; i<this.__sourceFiles.length; i++) {
			this.__infoLog('Adding file to transfer ['+this.__sourceFiles[i]+']');
			__filesToTransfer.push(this.__sourceFiles[i]);
		}
		
		//Build up the Aspera Transfer objects
		this.__aspTransfer = new AsperaTransfer();
		// You can capture logging from the aspera transfer object if you want. If you don't then it will output to standard output
		var _atLog = function(msg) {
			print(msg);
		};
		this.__aspTransfer.logInfoFunc = _atLog;
		if (this.__debug) {
			this.__aspTransfer.logDebugFunc = _atLog;
		};	

		this.__aspTransfer.host = this.__LOCAL_ASPERA_HOST;
		this.__aspTransfer.port = this.__LOCAL_ASPERA_PORT;
		this.__aspTransfer.username = this.__LOCAL_ASPERA_USER;
		this.__aspTransfer.password = this.__LOCAL_ASPERA_PASS;

		// Create the transfer job object
		var transferJob = new AsperaTransferJob();

		//Add the files to send - this is now relative to Aspera Storage
		for each (var f in __filesToTransfer) {
			this.__infoLog("Adding file: " + f);
			transferJob.addLocalPath(f);
		};

		// Set the remote parameters - the destination of the transfer
		transferJob.setLocalUser(this.__LOCAL_ASPERA_USER);
		transferJob.setLocalPassword(this.__LOCAL_ASPERA_PASS);
		transferJob.setRemoteHost(this.__remoteHost);
		transferJob.setRemoteUser(this.__dstUsername);
		transferJob.setRemotePassword(this.__dstPassword);
		transferJob.setRateTargetRate(this.__targetRate);
		transferJob.setRateMinimumRate(this.__minimumRate);
		transferJob.setRemotePort(this.__remotePort);
		transferJob.setChannelPort(this.__channelUdpPort);
		transferJob.setAsperaProxy(this.__asperaProxy);
		transferJob.setRemoteAuthenticationMode(this.__remoteAuthenticationMode);
		transferJob.setRemoteKeyPath(this.__remoteKeyPath);
		transferJob.setRatePolicy('fair');
		transferJob.setCookie(this.__cookie);
		transferJob.setToken(this.__token);
		transferJob.setFileProtection(this.__fileProtection);
		transferJob.setFilePassphrase(this.__filePassphrase)
		transferJob.setSecurityEncryptionCipher(this.__securityEncryptionCipher);
		//transferJob.setRetryCount(3);

		if(this.__isMD5){
			transferJob.setFileChecksum('md5');
		};
		
		if (this.__remotePath) {
			transferJob.addRemotePath(this.__remotePath);
		};	

		// Some job properties
		transferJob.setFileCreatePath('Yes');
		transferJob.setFileOverwrite('Always');

		this.__debugLog('Created job with the following XML: '+transferJob.getSOAPXml());
		this.__infoLog('Sending job');

		var jobId = this.__aspTransfer.submitJob(transferJob);
		if (jobId != null && jobId != ""){
			this.__infoLog('Submitted job with id: '+jobId);
		} else {
			throw new Error("Job ID was null, stopping script and failing.");
		}

		sleep(1);
		this.__aspTransfer._connection = null;

		//Poll for Status
		this.__pollJobStatus(jobId);
	};

};