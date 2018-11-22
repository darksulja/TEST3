
var FolderMonitorHelper = function() {
	this.__fileObj;
	this.__javaFile;
	this.__runenv = "FOLDERMONITOR";
	this.__uploadableStates = [];
	this.__videoStates = [];
	this.__extensionTypes = [];
	this.__sidecarRequired = false;
	this.__ignoreHidden = true;
	this.__identifier = "";
	
	/**
	 *	setFile - Set the File we are interested in
	 *	@param [Object] - usefulFileObj
	 **/
	this.setFile = function(o) {
		this.__fileObj = o;
		this.__javaFile = new File(this.__fileObj.unix_file);
	}
	
	this.getFile = function() {
		return this.__fileObj;
	}
	
	this.setRunEnv = function(env) {
		if (env === "FOLDERMONITOR" || env === "WSRUNNER") {
			this.__runenv = env;
		} else {
			throw new Error("Runtime Environment [" + env + "] not recognised");
		}
	}
	
	this.setUploadableStates = function(arr) {
		this.__uploadableStates = arr;
	}
	
	this.getUploadableStates = function() {
		return this.__uploadableStates;
	}
	
	this.myLog = function(str, func) {
		if (typeof func === "undefined" || func == "" || func == null) {
			func = "";
		} else {
			func = func + ": ";
		}
		
		if (this.__runenv == "FOLDERMONITOR") {
			logger.info(func + str);
		} else {
			output(func + str);
		}
	}
	
	this.searchForTrackTypeByShortTextAndState = function(filename, state) {
		const FUNCNAME = "searchForTrackTypeByShortTextAndState";
		var reportwscall = <PharosCs>
								<CommandList>
									<Command method="runReport" subsystem="report">
										<ParameterList>
											<Parameter name="reportName" value="getMatIdFromFilenameTTLReportWithState"/>
											<Parameter name="reportParameters">
												<Value>
													<CustomReportRuntimeParameters>
														<Parameters>
															<StringReportParameter>
																<Values>
																	<String>{filename}</String>
																</Values>
																<Name>fileName</Name>
																<Operator>is</Operator>
																<Editable>true</Editable>
																<Visible>true</Visible>																
															</StringReportParameter>
															<StringReportParameter>
																<Values>
																	<String>{state}</String>
																</Values>
																<Operator>is</Operator>
																<Editable>true</Editable>
																<Visible>true</Visible>	
																<Name>stateName</Name>
															</StringReportParameter>
														</Parameters>
													</CustomReportRuntimeParameters>
												</Value>
											</Parameter>
										</ParameterList>
									</Command>
								</CommandList>
							</PharosCs>;
	
		var rtn = wscall(reportwscall);
		var rtnCount = parseInt(rtn..ResultList.PagedResults.Count);

		if (rtnCount > 1) {
			var str = "Number of returned results is [" + rtnCount + "]. Expecting only 1";
			this.myLog(str, FUNCNAME);
			throw new Error(str);
		} else if (rtnCount == 0) {
			this.myLog("No Material Id matching for FileName [" + fileName + "]", FUNCNAME);
			return false;
		}
		
		var rtnMatId = rtn..ResultList.PagedResults..MATERIAL__ID.toString();
		var rtnTtl = rtn..ResultList.PagedResults..TRACK_TYPE__TYPE_NAME.toString();
		this.myLog("Have Found MatId [" + rtnMatId + "], TrackType [" + rtnTtl + "]", FUNCNAME);
		
		return {
			matId: 		rtnMatId,
			ttl: 		rtnTtl
		}
	}
	
	
	this.setExtensionTypes = function(arr) {
		this.__extensionTypes = arr;
	}
	
	this.fileExtensionIsValid = function() {
		const MYNAME = "fileExtensionIsValid";
		if (this.__extensionTypes.length > 0) {
			this.myLog("Checking Against Valid Extension Types [" + this.__extensionTypes + "]", MYNAME);
			for (var e = 0; e < this.__extensionTypes.length; e++) {
				if (this.__extensionTypes[e].toLowerCase() === this.__fileObj.extension.toLowerCase()) {
					this.myLog("Extension [" + this.__fileObj.extension + "] is Valid");
					return true;
				}
			}
		} else {
			this.myLog("No Configured Extension Type Filter, Therefore Extension [" + this.__fileObj.extension + "] is Valid");
			return true;
		}
		this.myLog("Extension Type [" + this.__fileObj.extension + "] is Not Valid");
		return false;
	}
	
	this.setIdentifier = function() {
		var sIdentifier = "";
		const MYNAME = "makeMyIdentifier";
		
		if (this.__fileObj.filename != null) {
			if ( this.__fileObj.filename.match(/vamc$/i) == null ) {
				this.myLog("Examining File [" + this.__fileObj.unix_file + "]", MYNAME);

				var lastModifiedId = new File(this.__fileObj.unix_file).lastModified();
				this.myLog("Last modified time is ["+lastModifiedId+"]", MYNAME);
				//Check the Extension is valid
				var addnl_str = "@(" + lastModifiedId + ")" + this.__fileObj.unix_path;
	
				if (this.__ignoreHidden && !this.__javaFile.isHidden()) { // File is Not Hidden
					if (this.fileExtensionIsValid()) {	// File Extension is OK
						sIdentifier = this.__fileObj.filename + " - " + addnl_str;
					}
				}
			} else {
				this.myLog("found a 'vamc' file ["+this.__fileObj.filename+"]", MYNAME);
			}
		}
		this.myLog("Using Identifier [" + sIdentifier + "]", MYNAME);
		this.__identifier = sIdentifier;
	}
	
	this.getIdentifier = function() {
		return this.__identifier;
	}
	
	this.setSidecarRequired = function(bool) {
		this.__sidecarRequired = bool;
	}
	
	// Not really needed for now (we don't upload hidden files)
	this.setOverrideHiddenFilesOk = function() {
		this.__ignoreHidden = true;
	}
	
	
	/**
	 *	runChecksOnFileForTTL - Run Checks to see if there is a trackTypeLink that matches this filename
	 *	@param [Bool] - allow_basename_search - whether to allow the search to be carried out on a file basename (don't waste resources if not);
	 *
	 **/
	this.runChecksOnFileForTTL = function(allow_basename_search) {
		const FUNCNAME = "runChecksOnFileForTTL";
		var search_arr = [];
		search_arr.push(this.__fileObj.filename);
		if (allow_basename_search) {
			search_arr.push(this.__fileObj.basename);
		}
		
		this.myLog("File [" + this.__fileObj.unix_file + "], Total search attempts [" + search_arr.length + "]", FUNCNAME);
		for (var yu = 0; yu < search_arr.length; yu++) {
			this.myLog("Searching for [" + search_arr[yu] + "] (Search [" + (yu + 1) + "] of [" + search_arr.length + "]) possible search terms", FUNCNAME);
			for (var ab = 0; ab < this.__uploadableStates.length; ab++) {
				this.myLog("Trying to match state [" + this.__uploadableStates[ab] + "] (Search [" + (ab + 1) + "] of [" + this.__uploadableStates.length + "]) possible states", FUNCNAME);
				try {
					var trgt = this.searchForTrackTypeByShortTextAndState(search_arr[yu], this.__uploadableStates[ab]);
				} catch (e) {
					this.myLog("Error when checking for TrackTypeLink matching Term [" + search_arr[yu] + "]", FUNCNAME);
				}
			}
		}
		
		if (trgt) {
			this.myLog("Success!", FUNCNAME);
			return trgt;
		} else {
			this.myLog("Could Not Find Matching Record", FUNCNAME);
			return null;
		}
	}
	
	this.replaceFilenameCharacters = function(charsToReplace, replaceWith) {
		if (typeof String.prototype.replaceAll !== 'function') {
			String.prototype.replaceAll = function (target, replacement) {
			   return this.split(target).join(replacement);
			}
		}
		
		return this.__fileObj.basename.replaceAll(charsToReplace, replaceWith);
	}
	
	this.splitAndConcatFilename = function(charToSplitOn, indexesToJoin) {
		var tmpFilenameSplit = this.__fileObj.basename.split(charToSplitOn);
		var tmpFilename = "";
		for (var i = 0; i < indexesToJoin; i++) {
			tmpFilename += tmpFilenameSplit[indexesToJoin[i]];
		}
		return tmpFilename;
	}
	
	this.tidyUpFilesOutsidePurgePolicy = function(purge_policy) {
		const NAME = "tidyUpFilesOutsidePurgePolicy";
		this.myLog("Setting Purge Policy to [" + purge_policy + "] Days", NAME);
		var diff = new Date().getTime() - new File(this.__fileObj.unix_file).lastModified();
		this.myLog("File is [" + Math.round(diff / 24 / 60 / 60 / 1000) + "] Days Old", NAME);
		if (diff > (purge_policy * 24 * 60 * 60 * 1000)) {
			this.myLog("Deleting File", NAME);
			remove(this.__fileObj.unix_file);
		} else {
			this.myLog("Not Deleting File", NAME);
		}
	}
	
	this.checkVideoIsOkToUploadAgainst = function(matId, states) {
		const FUNCNAME = "checkVideoIsOkToUploadAgainst";
		var vid_state = materialGet(matId, 'trackTypeLinks')..TrackTypeLink.(TrackTypeName.toString() == "Video").StateName.toString();
		for (var ty = 0; ty < states.length; ty++) {
			if (vid_state == states[ty]) {
				this.myLog("Video TrackType is in State [" + vid_state + "], OK to Upload Against", FUNCNAME);
				return true;
			}
		}
		this.myLog("Video TrackType is in State [" + vid_state + "], NOT OK to Upload Against", FUNCNAME);
		return false;
	}
	
	this.isFileUploadable = function() {
		output("TBC: Check to see if file is uploadable given the current requirements");
	}
	
	this.saveUploadPathAgainstMaterial = function() { 
		output("TBC: Save the file source directory against a material entity");
	}
	
	this.saveUploadPathAgainstTrackType = function() {
		output("TBC: Save the file source directory against a track type link");
	}
	
	this.isWorkingFile = function() {
		if(this.__fileObj.filename.indexOf("#work") > -1) return true;
		if(this.__fileObj.filename.indexOf("#chpt") > -1) return true;
		if(this.__fileObj.extension.toLowerCase() == "partial") return true;
		if(this.__fileObj.extension.toLowerCase() == "aspx") return true;

		return false;
	}
}