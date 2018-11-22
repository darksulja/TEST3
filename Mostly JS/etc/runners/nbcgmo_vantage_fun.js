//this is a file to store functins used by vantage


if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")
if(typeof(MediatorBridgeTranscodeHelper)==="undefined")  load("/opt/evertz/mediator/etc/bridge/MediatorBridgeTranscodeHelper.js")

var gmoNBCVantageFunc = {
	/*
	listAndSortSingleVantageWavs:function(dirToSearch,fileNameNoExt){
		if(debug) print("\nDEBUG: In function listAndSortSingleVantageWavs()");

		// Private Vars
		var dirFiles = new File(dirToSearch).listFiles();
		var wavIndex = ".00" 
		var wavExt = "wav";
		var monoWavs = [];
			
		print("\nListing files in ["+dirToSearch+"]");
		if (dirFiles === null) throw new Error("\nFailed to List Files in directory ["+dirToSearch+"]");

		// Profile should label audios as fileName.wav (1st Audio), fileName.1.wav (2nd Audio)
		// So check that a 001.wav doesn't exist. This will be accounted for later
		// If it does the Vantage Profile has changed and an error should be thrown
		if (debug) print("\nDEBUG:Checking File ["+dirToSearch+fileNameNoExt+wavIndex+"."+wavExt+"] does not exist");
		if (fileExists(dirToSearch+fileNameNoExt+wavIndex+"."+wavExt)) {
			throw new Error("Vantage Workflow appears to have changed in how extra audios are labeled.\nReason: File found at ["+dirToSearch+fileNameNoExt+wavIndex+"."+wavExt+"]");
		}

		// Since first audio is filename.wav make it filename.001.wav for ease of sorting later
		if (fileExists(dirToSearch+fileNameNoExt+"."+wavExt)) {
			print("\nMoving \n["+dirToSearch+fileNameNoExt+"."+wavExt+"] \nto \n["+dirToSearch+fileNameNoExt+wavIndex+"."+wavExt+"]\nFor ease of Sorting()");
			move(dirToSearch+fileNameNoExt+"."+wavExt,dirToSearch+fileNameNoExt+wavIndex+"."+wavExt);
			if(!fileExists(dirToSearch+fileNameNoExt+wavIndex+"."+wavExt));
		} else {
			throw new Error("Cannot find file ["+dirToSearch+fileNameNoExt+"."+wavExt+"]");
		}

		// Since files have changed force a refresh of directory
		dirFiles = new File(dirToSearch).listFiles();

		// Add Files to Array
		for each(var file in dirFiles) {
			if (monoWavs.indexOf(String(file)) !== -1) {
				throw new Error("File ["+file+"] already exists in monoWavs Array]");
			}
			if (String(file).endsWith(".wav")) {
				monoWavs.push(file);
			}
		}
			
		// Each audio should have a pair
		if (monoWavs.length % 2 !== 0) {
			throw new Error("MonoWavs Array has an uneven length property ["+monoWavs.length+"] Therefore pairs cannot be made.");
		}

		// Alphabetise
		monoWavs.sort();
	    print(monoWavs);
	    return monoWavs;	
	}, 
*/


//THSI ONE IS FROM TEH DEV SYSTEM 
//we need them to match up the profiles atboth but ive put in a diferent one temporaryily to test onsite. 

	listAndSortSingleVantageWavs:function(dirToSearch,fileNameNoExt){
		if(debug) print("\nDEBUG: In function listAndSortSingleVantageWavs()");

		// Private Vars
		var dirFiles = new File(dirToSearch).listFiles();
		var wavIndex = ".001" 
		var wavExt = "wav";
		var monoWavs = [];
			
		print("\nListing files in ["+dirToSearch+"]");
		if (dirFiles === null) throw new Error("\nFailed to List Files in directory ["+dirToSearch+"]");

		// Profile should label audios as fileName.wav (1st Audio), fileName.002.wav (2nd Audio)
		// So check that a 001.wav doesn't exist. This will be accounted for later
		// If it does the Vantage Profile has changed and an error should be thrown
		if (debug) print("\nDEBUG:Checking File ["+dirToSearch+fileNameNoExt+wavIndex+"."+wavExt+"] does not exist");
		if (fileExists(dirToSearch+fileNameNoExt+wavIndex+"."+wavExt)) {
			throw new Error("Vantage Workflow appears to have changed in how extra audios are labeled.\nReason: File found at ["+dirToSearch+fileNameNoExt+wavIndex+"."+wavExt+"]");
		}

		// Since first audio is filename.wav make it filename.001.wav for ease of sorting later
		if (fileExists(dirToSearch+fileNameNoExt+"."+wavExt)) {
			print("\nMoving \n["+dirToSearch+fileNameNoExt+"."+wavExt+"] \nto \n["+dirToSearch+fileNameNoExt+wavIndex+"."+wavExt+"]\nFor ease of Sorting()");
			move(dirToSearch+fileNameNoExt+"."+wavExt,dirToSearch+fileNameNoExt+wavIndex+"."+wavExt);
			if(!fileExists(dirToSearch+fileNameNoExt+wavIndex+"."+wavExt));
		} else {
			throw new Error("Cannot find file ["+dirToSearch+fileNameNoExt+"."+wavExt+"]");
		}

		// Since files have changed force a refresh of directory
		dirFiles = new File(dirToSearch).listFiles();

		// Add Files to Array
		for each(var file in dirFiles) {
			if (monoWavs.indexOf(String(file)) !== -1) {
				throw new Error("File ["+file+"] already exists in monoWavs Array]");
			}
			if (String(file).endsWith(".wav")) {
				monoWavs.push(file);
			}
		}
			
		// Each audio should have a pair
		if (monoWavs.length % 2 !== 0) {
			throw new Error("MonoWavs Array has an uneven length property ["+monoWavs.length+"] Therefore pairs cannot be made.");
		}

		// Alphabetise
		monoWavs.sort();
	    print(monoWavs);
	    return monoWavs;	
	}, 

	createTwoChannelWavsFromSingles:function(materialId,singleWavFiles,fileName,audioMediaPath,sourceTrackTypes,mediaName) {
		var matId = materialId;
		var systemTrackTypes = gmoNBCFunc.getTrackTypes();
		var wavExt = "wav";
		var channels = 2;
		var bitDepth = 24; 
		var twoChannelWavs = [];
		var materialXml = materialGet(matId,"tracks","shorttext");
		var audioProfile = materialXml..Material.ShortTextList.ShortText.(ShortTextType.toString() == "Audio Profile").Value.toString();
		var storeMedia = mediaName;
		var audioMBin = ["/usr/local/bin/audiomanipulate"];
		// Validation 
		if (!fileExists(audioMBin)) throw new Error("Cannot find Audio Manipulate Binary at ["+audioMBin+"]");
		if (sourceTrackTypes[0]!=="Video") throw new Error("First Track Type in Array ["+sourceTrackTypes+"] must be Video");
		
		
		for (var i=0,j=1;i<singleWavFiles.length;j++) {
			output("============================================");

			if(sourceTrackTypes[j] != null){
				var fileTag = systemTrackTypes.TrackTypeList.TrackType.(Name.toString()===sourceTrackTypes[j]).FileTag.toString();
				if (!fileTag) throw new Error("Failed to Find File Tag for Specified Track Type ["+sourceTrackTypes[j]+"]");
			} else{
				output(i);
				output(j);
				var fileTag = "channels_" + (i) + "_and_" + (i+1);
			}
			
			var sTrackTypeName = sourceTrackTypes[j];
			var wavPairOutputFile = audioMediaPath + fileName + "-" + fileTag + "." + wavExt;
			var channels = materialXml..Material.Track.(MediaName.toString() == storeMedia).TrackDefinition[j].Channels[0].toString();
			print("\nCreating Audio Pair Using ["+audioMBin+"]\n ["+wavPairOutputFile+"]");
			print("sTrackTypeName ["+sTrackTypeName+"] has ["+channels+"] channel[s]");
			
			var firstWavInThePair = singleWavFiles[i];
			var secondWavInThePair;
			
			if (Number(channels) == 1) {		
				print("We have a single channel track, converting to dual mono");
				secondWavInThePair = singleWavFiles[i];
				i+=1;
				
			} else {			
				print("We have a dual channel track, using next two wav files"); 
				secondWavInThePair = singleWavFiles[i+1];
				i+=2;
			}
			
			if(fileExists(wavPairOutputFile)){ 
				print("An Output Wav ["+wavPairOutputFile+"] already exists. Skipping create Wav Pair");
				remove(firstWavInThePair);
				remove(secondWavInThePair);
				continue;
			}
			
			var createWavPair = run(audioMBin,"-i",firstWavInThePair,"-i",secondWavInThePair,"-o",wavPairOutputFile,"-c",channels,"-b",bitDepth,"-f",wavExt);
			if (createWavPair.exit !== 0) throw new Error("Run Command Failed for Audio Manipulate");
			
		
			if (fileExists(wavPairOutputFile)) {
				print("\nSuccesfully created ["+wavPairOutputFile+"]\nDeleting Source ["+firstWavInThePair+"]\nDeleting Source ["+secondWavInThePair+"]");
				remove(firstWavInThePair);
				remove(secondWavInThePair);
			} else {
				throw new Error("Cannot find output Wav ["+wavPairOutputFile+"]\n");	
			} 

			// Store for Track Def Saves
			if(sourceTrackTypes[j] != null){
				twoChannelWavs.push(wavPairOutputFile);
			}
		}
		print("\nTWO Channel Wavs ["+twoChannelWavs+"]");
		return twoChannelWavs;
	},
		
	 /**
	 *
	 * Submits a job to be executed
	 * @param [jobFactory] [The Job Factory name for this job]
	 * @param [jobDesc] [JobDescription XML, should have JobDescription as highest element]
	 * @return [Returns the Job Coordination ID (int)]
	 * 
	 */
	executeJob : function(jobFactory, jobDesc) {
		var cmdXml = <PharosCs>
						<CommandList>
							<Command subsystem="job" method="executeJob">
								<ParameterList>
									<Parameter name="jobFactoryName" value={jobFactory}/>
									<Parameter name="jobDescription">
										<Value>
											{jobDesc}
										</Value>
									</Parameter>
								</ParameterList>
							</Command>
						</CommandList>
					</PharosCs>;
		// Send to Mediator
		var rtn = wscall(cmdXml)..Output.Integer
		// Output the coordination ID
		return rtn;
	},
	
	/**
	 *
	 * Returns the job for a provided Job Coordination ID
	 * @param [jobId] [The Job Coordination ID for the job want]
	 * @return [Returns the Job XML]
	 * 
	 */
	getJob	: function(jobId) {
		var xml = <PharosCs>
					  <CommandList>
					    <Command subsystem="job" method="getJob">
					      <ParameterList>
					        <Parameter name="coordinationId">
					          <Value>
					            <Integer>{jobId}</Integer>
					          </Value>
					        </Parameter>
					      </ParameterList>
					    </Command>
					  </CommandList>
					</PharosCs>;
		var rtn = wscall(xml);
		return rtn
	},
	
	/**
	 *
	 * Taken from nbc_functions.js
	 *
	 * Submits a job to Vantage and Polls the status
	 * @param [vantageobj] [This object can have properties workflowname, jobname and nicknames, nicknames is an object with key:pairs that will be used for the input files]
	 * @return [Returns a boolean based on job success or failure, utilising the JOB__STATUS of Finished jobs also]
	 *
	 * Example:
	 * var vantageObj = {
	 *  	"workflowname" : "XDCAMHD_422_1080i_5994_8ch_latest_xcoder_y_locators_mediator",
	 *		"jobname" : "MediatorTestMarkers7",
	 *		"nicknames" 	: {
	 *			"Original"	: "\\\\100.125.142.15\\dvs-fs\\DVS-RT0\\Vantage_IN\\locator_source\\mediator.mxf",
	 *			"locator_xml"	: "\\\\100.125.142.15\\dvs-fs\\DVS-RT0\\Vantage_IN\\locator_source\\mediator.xml"
	 *		}
	 *	};
	 *
	 * This is for where the Vantage job being ran is a sub-job of another, and you may want to update the main job,
	 * 	as well as not use the entire main jobs progress (So where this is doing a transcode and constitutes 60% of the total uploads percent)
	 * 	It defaults to start at 0% and go to 99%
	 * var jobObj = {
	 * 		"jobId" = "VanillaRunnerJob-c22a40d0-38c8-4f1c-897a-67e8c0f76d52", //This will just be _jobId for WSRunner jobs
	 *		"startPercent" = 40,
	 *		"endPercent" = 80
	 * };
	 *
	 *	var vantageJobSuccess = NBCFunc.makeAndRunVantageJob(vantageObj, jobObj);
	 *	if (vantageJobSuccess) {
	 *		print("Vantage job was successful");
	 *	} else {
	 *		throw new Error("Vantage job failed");
	 *	}
	 * 
	 */

	makeAndRunVantageJob	: function(vantageobj, jobObj, useTransferProgress, jobFactory) {
		var statusChangesOnly = true,
		externalJobId,
		vantageJobFactory,
		startPercent = 0,
		endPercent = 99,
		updateExternalJob = false,
		lastJobStatus = "",
		lastJobProgress = 0,
		sleepMS = 30000,
		errorSleepMS = 30000,
		vantageJobName = "",
		jobDesc = 	<JobDescription>
						<Properties>
						 	<Mapping>
						    </Mapping>
						</Properties>
					</JobDescription>;


		//If we are going to update the state of an external job, that is running this vantage job
		if ((typeof(jobObj) !== "undefined") && (jobObj !== null)) {
			if (jobObj.hasOwnProperty("jobId")) {
				externalJobId = jobObj.jobId;
				updateExternalJob = true;

			}
			if (jobObj.hasOwnProperty("startPercent")) {
				startPercent = jobObj.startPercent;

			}
			if (jobObj.hasOwnProperty("endPercent")) {
				endPercent = jobObj.endPercent;

			}						
		}

		//if this is set it will print out for Proxy Transfer progress
		if ((typeof(useTransferProgress) === "undefined") || (useTransferProgress === null)) useTransferProgress = false;
		
		if (typeof(jobFactory) === "undefined") {
			vantageJobFactory = "vantageTestJobFactory";	
		} else {
			vantageJobFactory = jobFactory.toString();
		}



		for (var prop in vantageobj) {
			if (prop.toLowerCase() === "workflowname") {
				print("Adding Vantage Workflow Property ["+vantageobj[prop]+"]");
				jobDesc.Properties.Mapping.vantageWorkflowName = vantageobj[prop];
			}
			if (prop.toLowerCase() === "jobname") {
				print("Adding Vantage JobName Property ["+vantageobj[prop]+"]");
				jobDesc.Properties.Mapping.vantageJobName = vantageobj[prop];
				vantageJobName = vantageobj[prop];
			}
			if (prop.toLowerCase() === "nicknames") {
				var entries = new XMLList();
				for (var nickname in vantageobj[prop]) {
					print("Adding Nickname: Key ["+nickname+"] Value ["+vantageobj[prop][nickname]+"]");
					entries += <Entry>
									<Key>{nickname}</Key>
									<Value>{vantageobj[prop][nickname]}</Value>
								</Entry>;
				}
				jobDesc.Properties.Mapping.vantageNicknames.Map.Entry = entries;
			}
			if (prop.toLowerCase() === "variables") {
				var entries = new XMLList();
				for (var variable in vantageobj[prop]) {
					print("Adding Variable: Key ["+variable+"] Value ["+vantageobj[prop][variable]+"]");
					entries += <Entry>
									<Key>{variable}</Key>
									<Value>{vantageobj[prop][variable]}</Value>
								</Entry>;
				}
				jobDesc.Properties.Mapping.vantageVariables.Map.Entry = entries;
			}
		}				
		
		print("Vantage Job Factory is ["+vantageJobFactory+"]");
		print("Submitting Vantage Job: \n"+jobDesc);
		var jobId = this.executeJob(vantageJobFactory,jobDesc);
		print("Job Submitted - JobId Received ["+jobId+"]");
		print("Status interval is ["+String(sleepMS)+"]");
		print("Polling Job...");

		while (true) {
			try {
				var jobResponse = this.getJob(jobId);
				var error_counter = 0;
			} catch(e) {
				print("makeAndRunVantageJob: Failed to get Vantage job status");
				print(e.message);
				error_counter++
			}
			if (error_counter == 0) {
				var jobStatus = jobResponse..Output.Job.Status.toString();
				var jobProgress = jobResponse..Output.Job.StatusMap.Mapping.hasOwnProperty("JOB__PROGRESS") ? parseInt(jobResponse..Output.Job.StatusMap.Mapping.JOB__PROGRESS) : 0;
				//print(jobResponse);
				if (jobStatus === "Finished") {
					print("JobName ["+vantageJobName+"] JobId ["+jobId+"] has Finished");
					var JOB__STATUS = jobResponse..StatusMap.Mapping.JOB__STATUS.toString();
					print("JOB__STATUS ["+JOB__STATUS+"]");
					if (JOB__STATUS !== "COMPLETE") {
						var vantageError = jobResponse..StatusMap.Mapping.JOB__ERROR.toString();
						print("Job Finished with errors : "+ vantageError);
						return vantageError;	
					} else {
						java.lang.Thread.sleep(120000); // Sleep for 1min, testing this out because of problems with truncated files
						print("Job Finished without errors.");
						return true;
					}

				} else if (jobStatus === "Failed") {
					print("ERROR: JobName ["+vantageJobName+"] JobId ["+jobId+"] has Failed.");
					var vantageError = jobResponse..StatusMap.Mapping.JOB__ERROR.toString();
					print(vantageError);
					/* TODO: You can pull out the error from Vantage to add as a comment 
					var str = jobResponse..StatusMap.Mapping.JOB__ERROR.toString();
					var res = str.split("\n");
					for (var t = 0; t < res.length; t++) {
						if (res[t].indexOf('state=FAILED') > 0 && res[t].indexOf('has not been configured to operate when the previous state is:')< 0)  {
							print(res[t].substring(res[t].lastIndexOf('Error:'),res[t].length + 1))
						}
					}*/
					return vantageError;

				} else {
					if (statusChangesOnly) {
						if (jobStatus !== lastJobStatus || jobProgress !== lastJobProgress) {
							print("JobName ["+vantageJobName+"] JobId ["+jobId+"] has Status ["+jobStatus+"] Progress ["+jobProgress+"]");
						}
					} else {
						print("JobName ["+vantageJobName+"] JobId ["+jobId+"] has Status ["+jobStatus+"] Progress ["+jobProgress+"]");
					}
				}

				if (updateExternalJob) {
					//get total percent we're expected to account for
					var totalPercent = endPercent - startPercent;
					var returnPercent = parseInt(((jobProgress/100)*totalPercent) + startPercent);

					//var mappings = {"JOB__PROGRESS" : returnPercent};
					//this.updateJobStatus(externalJobId,mappings);
					this.updateJobProgressPercent(externalJobId,returnPercent);
					//print(externalJobId,returnPercent);
				}
				if (useTransferProgress) {
					print("scriptprogress "+jobProgress);
				}


				lastJobStatus = jobStatus;
				lastJobProgress = jobProgress;
				java.lang.Thread.sleep(sleepMS);
			} else {
				if (error_counter <= 60) {
					print("Holding Vantage job thread ["+error_counter+"]");
					java.lang.Thread.sleep(errorSleepMS);
				} else {
					print("Failing Vantage job polling");
					return "Failed to poll Vantage for Job status.";
				}
			}
		}
	},
	
	updateJobProgressPercent	: function(jobId, progressPercent) {

	 	var xml = <PharosCs>
					  <CommandList>
					    <Command subsystem="job" method="updateStatusMap">
					      <ParameterList>
					        <Parameter name="jobId">
					          <Value>{jobId}</Value>
					        </Parameter>
					        <Parameter name="jobInfo">
					          <Value>
					            <Mapping>
					              <JOB__PROGRESS>{progressPercent}</JOB__PROGRESS>
					              <ScriptProgress>
                                    <Integer>{progressPercent}</Integer>
                                  </ScriptProgress>
					            </Mapping>
					          </Value>
					        </Parameter>
					      </ParameterList>
					    </Command>
					  </CommandList>
					</PharosCs>;
		wscall(xml);		
		//print(xml);
	 },	 
	 
	 cleanUpAudioFilesAndTracks : function(matId, audioPath, audioMedia){
		print("Cleaning up audio files/folders from previous vantage attempt on this file.");
		if (!gmoNBCFunc.deleteDirectory(audioPath, true)){
			print("Failed to remove files.");
		}
		print("Cleaning up audio track from previous vantage attempt on this file.");
		gmoNBCFunc.deleteTrack(matId, audioMedia);		 
	 },


	Standard_Vantage_Object : function(){
		this.nicknames = {};
		this.variables = {};
		
		this.setOriginal = function(file) {
			this.nicknames.Original = file.win_file;
		};
		
		this.setVar = function(name, value) {
			this.variables[name] = value;
		};
		
		this.setJobName = function(job_name) {
			this.jobname = job_name;
		};
		
		this.setWorkflowName = function(workflow_name) {
			this.workflowname = workflow_name;
		};

	 },

	 makeAndRunTranscodeJob	: function(transcodeObj, transcoderType) {

		var startProgressPercent = 0;
		var endProgressPercent = 99;
		var pollInterval = 60;	
		
		if(!gmoNBCFunc.isVarUsable(transcoderType)){
			transcoderType = "VANTAGE";
		}
		var mbTranscodehelper = new MediatorBridgeTranscodeHelper();
		mbTranscodehelper.setTranscoderType(transcoderType);

		output("Submitting ["+transcoderType+"] Job");
		var submitJobResponse = mbTranscodehelper.submitTranscodeJob(transcodeObj.workflowname,transcodeObj.nicknames.Original,transcodeObj.variables);

		output("Job Submitted - JobId ["+submitJobResponse["id"]+"]");
		output("Job Submitted - JobName ["+submitJobResponse["jobName"]+"]");
		output("Status Poll Interval is ["+String(pollInterval)+"]");
		output("Polling Job...");

		var job = new gmoNBCFunc.WSJobUpdateObject();

		while (true) {

			try {
				var transcodeJobStatusResponse = mbTranscodehelper.getTranscodeJobStatus(submitJobResponse["id"]);
				var jobStatus = transcodeJobStatusResponse["state"];
				var jobProgress = transcodeJobStatusResponse["progress"]
				var error_counter = 0;
			} catch(TranscodeJobStatusException) {
				output("makeAndRunTranscodeJob: Failed to get Transcode Job status");
				output(TranscodeJobStatusException.message);
				error_counter++
			}

			if (error_counter == 0) {

				if(jobStatus == NBCGMO_CONSTANTS.EXT_APP_JOB_STATUS[mbTranscodehelper.getTranscoderType()].COMPLETE){
					job.updateStatusAndProgress("Complete",100);
					//Avoid Truncated Files from being picked up for next Step
					sleep(120)
					output("Transcode Job Finished without errors.");
					return true;
				}else if(jobStatus == NBCGMO_CONSTANTS.EXT_APP_JOB_STATUS[mbTranscodehelper.getTranscoderType()].FAILED || 
					jobStatus == NBCGMO_CONSTANTS.EXT_APP_JOB_STATUS[mbTranscodehelper.getTranscoderType()].CANCELLED){
					job.updateStatusAndProgress(mbTranscodehelper.getTranscoderType() + " ["+jobStatus+"]" ,parseInt(jobProgress));
					var transcodeJobErrorResponse = mbTranscodehelper.getTranscodeJobErrorMessage(submitJobResponse["id"]);
					var errorMessage = transcodeJobErrorResponse["Error"];
					if(!gmoNBCFunc.isVarUsable(errorMessage)){
						errorMessage = transcodeJobErrorResponse["error1"];
					}
					return errorMessage;
				}else {
					job.updateStatusAndProgress(mbTranscodehelper.getTranscoderType() + " ["+jobStatus+"]" ,parseInt(jobProgress));
					sleep(pollInterval);
				}

			}else if (error_counter <= 60) {
				output("Holding Transcode Job Process ["+error_counter+"]");
				sleep(pollInterval);
			} else {
				output("Failing Transcode Job Polling- Exceeded Error Counter");
				return "Unable to Get Transcode Job Status";
			}
		}
	}

}