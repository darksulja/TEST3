importPackage(Packages.java.util);

if (typeof gmoNBCFunc === "undefined") {
	print("Loading gmoNBCFunc");
//	load('/usr/local/pharos/etc/scripts/nbcgmo_fun.js');
	load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
}

var gmoNBCCompFunc = {
	
	/**
	* subsOrAudio - Return whether this is a subtitle or an audio file
	* @param [Object] - usefulFileObj
	* @return [String] - subtitle/audio
	**/
	subsOrAudio : function(yFile) {
		var uLog = function(str) {
			logger.info("subsOrAudio(): " + str);
		};
		
		var yFileInfoXml = gmoNBCFunc.getFileInfoXml(yFile.unix_file);
		
		for each (var aud in yFileInfoXml.track) {
			if (aud.@type == "Audio") {
				return "audio";
			}
		}
		
		return "subtitle";
	},
	
	getTimeCode : function(tc,frame_rate){
		 data = tc.split('.');
		 var milliseconds = data[1];
		 //Appending 0 to milliseconds if length is 2
		 if(milliseconds.length==2)
			milliseconds = "0" + milliseconds;
		 frame = AmountOfTime.parseMillis(frame_rate,milliseconds).toString(); 
		 return (data[0] + ":" + frame.split(':')[3]).toString();
	},

	get_5_1_TrackFileMap : function(matId,destPath,trackTypeName){
		var surroundTTNPrefixes = ["Surround Front","Surround C/LFE","Surround Rear"];
		var language = "";

		for (var i = 0; i < surroundTTNPrefixes.length; i++) {
			if(gmoNBCFunc.startsWith(trackTypeName,surroundTTNPrefixes[i])){
				language = trackTypeName.substring(surroundTTNPrefixes[i].length, trackTypeName.length);
				break;
			}
		}

		var fileMap = {};
		var systemTrackTypes = gmoNBCFunc.getTrackTypes();
		
		for(var x = 0; x < surroundTTNPrefixes.length; x++){
			
			var ttn = surroundTTNPrefixes[x] + language;
			
			var fileTag = systemTrackTypes.TrackTypeList.TrackType.(Name.toString()===ttn).FileTag.toString();
			if (!fileTag){
				throw new Error("Failed to Find File Tag for Specified TrackType ["+ttn+"]");
			}
			
			var fileName = destPath + matId + "-" + fileTag + ".wav";
			fileMap[ttn] = fileName;
		}
		
		return fileMap;
	},

	generateSplitWavFromTrackFileMap : function(srcFileObj,trackFileMap){
		var commands = [];
		var channels = "";
		
		commands = commands.concat("-y");
		commands = commands.concat("-i");
		commands = commands.concat(srcFileObj.unix_file);
		
		for (var ttn in trackFileMap) {
			output("Creating surround sound audio file for track: ["+ttn+"] as file [" + trackFileMap[ttn] + "]");
			if(gmoNBCFunc.startsWith(ttn,"Surround Front")){
				channels = "c0=FL | c1=FR"
			}
			else if(gmoNBCFunc.startsWith(ttn,"Surround C/LFE")){
				channels = "c0=FC | c1=LFE"
			}
			else if(gmoNBCFunc.startsWith(ttn,"Surround Rear")){
				channels = "c0=BL | c1=BR"
			}
			else{
				throw new Error("Tracktype [" + ttn + "] is not a valid 5.1 surround TrackType.")
			}
			
			commands = commands.concat("-af");
			commands = commands.concat("pan='stereo|" + channels + "'");
			commands = commands.concat("-acodec");
			commands = commands.concat("pcm_s24le");
			commands = commands.concat("-ar");
			commands = commands.concat("48000");
			commands = commands.concat(trackFileMap[ttn]);
		}

		print("Command = "+commands.join(" "));
			
		run("/usr/bin/ffmpeg",commands);
		print("Generation complete of WAV files for 5.1 components.")
	},

	is_5_1_SurroundSoundAudio : function(srcFileObj){
		var srcFileInfoXML = gmoNBCFunc.getFileInfoXml(srcFileObj.unix_file);

		var subsOrAudio = gmoNBCCompFunc.subsOrAudio(srcFileObj);
		if(subsOrAudio != "audio") return false;

		var typeAndValue = gmoNBCFunc.getTypeAndValueMediainfoLookup("channelNum",srcFileInfoXML)
		if (typeof(typeAndValue) !== "undefined") {
			// If the file has 6 channels it should be a 5.1 component
			if(typeAndValue.value === "6"){
				return true;
			}
		}

		return false;
	},
	
	/**
	* componentSideCarXml - Class for aiding reading and getting values from component format sidecar XML
	* @param [Object] - usefulFileObj
	* Example SideCarXml: 
	*		<Delivery>
	*			<File_Name>EKARD1113AH_1313086.cap</File_Name>
	*			<Slate>
	*				<Original_Aspect_Ratio>1.78</Original_Aspect_Ratio>
	*				<File_Aspect_Ratio>1.78</File_Aspect_Ratio>
	*				<Frame_Rate>29.97</Frame_Rate>
	*				<Text_Less>
	*					<Present>OM-FTEXTED</Present>
	*					<Start_Time/>
	*				</Text_Less>
	*				<ID_List>
	*					<ID>
	*						<Type>TVD</Type>
	*						<Value>VVB05</Value>
	*					</ID>
	*				</ID_List>
	*			</Slate>
	*			<Tracks>
	*				<Track type="Caption">
	*					<Track_Type_Name>Closed Caption English</Track_Type_Name>
	*					<Format>CAP</Format>
	*				</Track>
	*			</Tracks>
	*		</Delivery>
	**/
	componentSideCarXml : function(myFileObj) {
		this.fileObj = myFileObj;
		this.sideCarXml = new XML(gmoNBCFunc.removeXmlHeader(FileUtils.readFile(this.fileObj.unix_file)));
		
		this.getSideCarXmlContents = function() {
			return this.sideCarXml;
		};
		
		this.getFileObj = function() {
			return this.fileObj;
		};
		
		this.getTvdProductionNumber = function() {
			var myRtn = this.getSideCarXmlContents().Slate.ID_List.ID.(Type.toString() === "TVD").Value.toString();
			if (!myRtn) throw new Error("\nFailed to extract File Aspect Ratio from SideCarXml [" + this.getFileObj().unix_file + "] Contents:\n" + this.getSideCarXmlContents());
			return myRtn;		
		};
		
		this.getMaterialId = function() {
			var myRtn = this.getSideCarXmlContents().Slate.ID_List.ID.(Type.toString() === "Mediator Material ID").Value.toString();
			return myRtn;		
		};
		
		this.getFileAspectRatio = function() {
			var myRtn = this.getSideCarXmlContents().Slate.File_Aspect_Ratio.toString();
			if (!myRtn) throw new Error("\nFailed to extract File Aspect Ratio from SideCarXml [" + this.getFileObj().unix_file + "] Contents:\n" + this.getSideCarXmlContents());
			return myRtn;		
		};
		
		this.getOriginalAspectRatio = function() {
			var myRtn = this.getSideCarXmlContents().Slate.Original_Aspect_Ratio.toString();
			if (!myRtn) throw new Error("\nFailed to extract Original Aspect Ratio from SideCarXml [" + this.getFileObj().unix_file + "] Contents:\n" + this.getSideCarXmlContents());
			return myRtn;
		};
		
		this.getVersionType = function() {
			var myRtn = this.getSideCarXmlContents().Slate.Text_Less.Present.toString();
			if (!myRtn) throw new Error("\nFailed to extract Version Type from SideCarXml [" + this.getFileObj().unix_file + "] Contents:\n" + this.getSideCarXmlContents());
			return myRtn;
		};
		this.getTrackTypeName = function() {
			var myRtn = this.getSideCarXmlContents().Tracks.Track.Track_Type_Name.toString();
			if (!myRtn) throw new Error("\nFailed to extract TrackTypeName from SideCarXml [" + this.getFileObj().unix_file + "] Contents:\n" + this.getSideCarXmlContents());
			return myRtn;
		};
		
	},
	/**
	* lookupSubMediaByFileType - Class to get Sub Media by file Type
	* @param [fileType] - File Type
	**/
	lookupSubMediaByFileType : function(fileType){
		var media;
		fileType = fileType.toLowerCase();
		switch(fileType) {
			case "cap":
				media = "Sub_CAP"
			break;
			case "pac":
				media = "Sub_PAC"
			break;
			case "scc":
			//TODO: need to work out which location we are running at in future to work out the correct media!!!
				media = "DC_Sub_SCC"
			break;
			case "stl":
				media = "Sub_STL"
			case "smpte-tt":
				media = "Sub_SMPTE-TT"
			break;
			default:
				throw new Error("Subtitle type ["+fileType+"] not recognised");
		}
		return media;
	},
	lookupAudioMediaByStoreMediaAndExt : function (materialXml,storeMedia,fileExt) {
		var media;
		fileExt = fileExt.toUpperCase();
		if(typeof storeMedia != undefined && storeMedia != null && storeMedia!="") {
			storeMedia = storeMedia.toUpperCase();
			media = storeMedia.substr(0,storeMedia.lastIndexOf("_"));
			media = media + "_" + fileExt;
			print("Audio Component Media is [" + media +"]");
		} else {
			print("Lets see if there is an existing WAV Media");
			for each (var track in materialXml..Track) {		
				if (parseInt(track.DeleteMark) === 0 &&
							track.Encoded.toString() === "true" && track.FileExtension.toUpperCase()==fileExt) {
					media = track.MediaName.toString();
					print("Audio Component Media set to ["+media+"]");
					break;
				}	
			}
			if(!media)
				throw new Error("Audio Media ["+storeMedia+"] is undefined");
		}
		return media;
	},
	/**
	* makeAndSaveTrackDef - Save Track Defination
	* @param [matId] - Material Identifier
	* @param [media] - Media Name
	* @param [ttl] - TrackTypeLinkName
	* @param [position] - position
	* @param [frameRate] - frameRate
	**/
	makeAndSaveTrackDef : function (matId, media, ttl, position, channels, filePosition, fileExt, frameRate, fileId) {
		print("Making track definition for material ["+matId+"] TrackTypeLink ["+ttl+"] on media ["+media+"] at position ["+position+"]");
		componentTrackSaveXml = <Material>
			<MatId>{matId}</MatId>
			<Track>
				<FrameRate>{frameRate}</FrameRate>
				<MediaName>{media}</MediaName>
				<FileId>{matId}</FileId>
				<TrackDefinition>
				 	<TrackTypeName>{ttl}</TrackTypeName>
			 		<Position>{position}</Position>
					<FilePosition>{filePosition}</FilePosition>
					<Channels>{channels}</Channels>
					<FileId>{fileId}</FileId>
				</TrackDefinition>
				<Encoded>1</Encoded>
				<FileExtension>{fileExt}</FileExtension>
			</Track>
		</Material>;
		gmoNBCFunc.createTrackFileForTrackDefs(componentTrackSaveXml);
		materialSave(componentTrackSaveXml);
	},
	
    /**
	 * sccFile - Better handling for SCC Files
	 * @augments {gmoNBCFunc.usefulFileObj}
	 * @param  {String} file - unix file path to the file
	 * @return {Object}      - usefulFileObj with SCC extensions
	 */
	sccFile 	: 	function(file) {
		
		gmoNBCFunc.usefulFileObj.apply(this, arguments);
		this.scc_header = "Scenarist_SCC V1.0";
		this.scc_data = readFile(this.unix_file);

		this.getSccData = function() {
			return this.scc_data;
		};

		this.getSccDataNoWhiteSpace = function() {
			return this.scc_data.replace(/\s/g, "");
		};

		this.getFirstTimecode = function() {
			print("sccFile.getFirstTimecode(): Getting first timecode value from [" + this.unix_file + "]");
			var nw_data = this.getSccDataNoWhiteSpace(); // SCC data with whitespace removed
			var incode = nw_data.substring(nw_data.indexOf(this.scc_header) + this.scc_header.length, (nw_data.indexOf(this.scc_header) + this.scc_header.length) + 11);
			print("sccFile.getFirstTimecode(): Got first Timecode value of [" + incode + "]");
			return incode;
		};

		this.hasContents = function() {
			if (this.getSccData().length > 18) {
				print("sccFile.hasContents(): SCC File has data");
				return true;
			} else {
				print("sccFile.hasContents(): SCC file only has header:\n" + this.getSccData());
				return false;
			}
		};

		this.updateDfTimecode = function() {
			String.prototype.replaceAt = function(index, character) {
    			return this.substr(0, index) + character + this.substr(index + character.length);
			}
			var lines = this.scc_data.split('\n');
			for (var i = 1; i < lines.length; i++) {
				if (lines[i].indexOf("0", 0) > -1) {
					var newline = lines[i].replaceAt(8, ";");
					lines[i] = newline;
				} else {
					continue;
				}
    		}
    		var lineStr = lines.toString();
    		var df30Scc = lineStr.replace(/,/gi,"\n").replace(/^,/,"");
    		overwrite(df30Scc, this.unix_file);
		};
	},

	macCaption 	: 	function() {
		
		this.ip = lookup.maccaption["MACCAPTION_INFORMATION"].ipAddress;
		this.host = lookup.maccaption["MACCAPTION_INFORMATION"].host;
		this.user = lookup.maccaption["MACCAPTION_INFORMATION"].userName;
		//we now have password
		this.pass = lookup.maccaption["MACCAPTION_INFORMATION"].password;
		this.exec = lookup.maccaption["MACCAPTION_INFORMATION"].exec;
		this.working_dir = lookup.maccaption["MACCAPTION_INFORMATION"].workingDir;
		this.project_dir = lookup.maccaption["MACCAPTION_INFORMATION"].projectDir;
		this.jobFactory = "sshCommandsJobFactory";
		this.setSourceFile = function(src) {
			if (src.extension == "scc" && typeof src.scc_header === "undefined") {
				print("macCaption.setSourceFile(): Source file is SCC file, turning usefulFileObj into sccFile");
				this.sourceFileObj = new gmoNBCCompFunc.sccFile(src.unix_file);
			} else {
				this.sourceFileObj = src;
			}
		};

		this.getSourceFile = function() {
			return this.sourceFileObj;
		};

		this.getProjectDir = function() {
			return this.project_dir;
		};

		this.makeProjectSubDir = function(dir_name) {
			this.project_dir = this.working_dir + (dir_name.endsWith('/') ? dir_name : dir_name + "/");
			print("macCaption.makeProjectDir(): Making project directory at [" + this.project_dir + "]");
			if (!fileExists(this.project_dir)) {
				gmoNBCFunc.makeDirectory(this.project_dir);
			} else {
				print("macCaption.makeProjectDir(): Directory already exists");
			}
		};
		
		/*this.getImportExportString = function(myCase) {
			switch (myCase) {
				case "cap":
					return "cheetah_cap";
				case "edl":
					return "assemblecaptions_cmx3600";
				case "scc":
					return "scc";
				case "stl":
					return "ebu_stl";
				case "srt":
					return "subrip_srt";
				case "pac":
					return "pac";
				case "xml":
					return "ttml";
				case "dfxp":
					return "generic_dfxp";
				case "itt"
					return "itt";
				default:
					return "";
			}
		};*/
		
		this.getImportExportString = function(extension, type) {
			if (type == null || type == "") type = "export";			
			
			if (extension == "xml" && type == "import") {
				return "ttml";				
			} else if (extension == "xml" && type == "export") {
				return "smpte_tt";
			} else if (extension == "cap") {
				return "cheetah_cap";
			} else if (extension == "edl") {
				return "assemblecaptions_cmx3600";
			} else if (extension == "scc") {
				return "scc";
			} else if (extension == "stl") {
				return "ebu_stl";
			} else if (extension == "srt") {
				return "subrip_srt";
			} else if (extension == "pac") {
				return "pac";
			} else if (extension == "dfxp") {
				return "generic_dfxp";
			} else if (extension == "itt") {
				return "itt";
			} else {
				return "";
			}
		};

		this.unixPathToMacCaptionPath = function(unix_path) {
			/*var mac_path;
			if (unix_path.indexOf(lookup.storage.dvs.unix_root) == 0) {
				var mac_prefix = lookup.storage.dvs.path_on_mac;
				var unix_path_to_convert = unix_path.split(lookup.storage.dvs.unix_root)[1];
				mac_path = mac_prefix + unix_path_to_convert;
			} else {
				throw new Error("Not configured to convert path ["+unix_path+"] to MAC DVS path.");			
			}*/
		
			return new gmoNBCFunc.usefulFileObj(unix_path).mac_file;
		};

		this.addReelToEdl = function(reel_filename, outputEdlFile) {
			if (typeof this.edl_file !== "undefined") {
				var edl_string = FileUtils.readFile(this.edl_file.unix_file);
				var reel_string = "\n* Reel VANTAGE_ '" + reel_filename + "'";
				print("macCaption.addReelToEdl(): EDL file is [" + this.edl_file.unix_file + "]");
				print("macCaption.addReelToEdl(): EDL is:\n" + edl_string + reel_string);
				overwrite(edl_string, outputEdlFile.unix_file);
				append(reel_string, outputEdlFile.unix_file);
				return true;
			} else {
				print("macCaption.addReelToEdl(): EDL File object has not been set, not updating Reel");
			}
		};

		this.setEdl = function(edlFile) {
			this.edl_file = edlFile;
		};

		/**
		 * setUpProject - Used to setup a project for larger mac caption jobs (requiring multiple stages etc)
		 */
		this.setUpProject = function() {
			print("macCaption.setUpProject(): Building project directory and copying current source file");
			this.makeProjectSubDir(this.sourceFileObj.basename);
			var workingFile = new gmoNBCFunc.usefulFileObj(this.project_dir + this.sourceFileObj.filename);
			gmoNBCFunc.copyFileOnRemoteHost("den-dvs.moc.net",
										this.sourceFileObj.unix_path,
										workingFile.unix_path,
										this.sourceFileObj.filename,
										workingFile.filename);

			print("macCaption.setUpProject(): Resetting source file");
			this.setSourceFile(workingFile);
		};

		this.addFileToProject = function(file) {
			var workingFile = new gmoNBCFunc.usefulFileObj(this.project_dir + file.filename);
			print("macCaption.setUpProject(): Copying [" + file.unix_file + "] to [" + workingFile.unix_file + "]");
			gmoNBCFunc.copyFileOnRemoteHost("den-dvs.moc.net",
										file.unix_path,
										workingFile.unix_path,
										file.filename,
										workingFile.filename);
			return workingFile;
		};

		/**
		 * editSccFileUsingEdl Super function that converts a caption file into an STL and performs frame rate conversion
		 * @param  {Object} outputFileObj - a usefulFileObj for the output file
		 */
		this.editSccFileUsingEdl = function(outputFileObj, frame_rate,run_mode) {
			if (typeof this.edl_file !== "undefined") {
				if (this.sourceFileObj.extension == "scc") {
					print("macCaption.editSccFileUsingEdl(): Editing file using an EDL");
					try {
						var command = [];
						
						command.push('/usr/bin/ssh');
						command.push('-i');
						command.push('/opt/evertz/mediator/etc/mediator_x_rsa');
						command.push('-oStrictHostKeyChecking=no');
						command.push('-oUserKnownHostsFile=/dev/null');
						command.push(this.user + "@" + this.ip);
						command.push(this.exec);
						command.push("-inhibit_gui");
						command.push("-tcmode=" + this.ourFRtoMacCaptionFR(frame_rate));
						command.push(this.addSemicolonInSCCFileExportOption(outputFileObj,frame_rate).replace(" ",""));
						command.push("-import=" + this.getImportExportString(this.edl_file.extension, "import"));
						command.push("-input=" +  this.unixPathToMacCaptionPath(this.edl_file.unix_file));
						command.push("-export=" + this.getImportExportString(outputFileObj.extension));
						command.push("-output=" + this.unixPathToMacCaptionPath(outputFileObj.unix_file));

						print("macCaption.editSccFileUsingEdl(): run command is ["+command.join(" ")+"]");
						rtn = run.apply(this, command);
						print("macCaption.editSccFileUsingEdl() Output:\n" + rtn.output);
						
						//below left in for possible use of sshCommandsJobFactory 
						/* if(run_mode =="async"){
							this.submitMacCaptionJob(command.join(" "));
						}else{
							rtn = run.apply(this,command);
							print("macCaption.editSccFileUsingEdl() Output:\n" + rtn.output);
						} */
						
					} catch(e) {
						throw new Error("MacCaption EDL Edit Failed: " + e.message);
					}

					print("macCaption.editSccFileUsingEdl(): Output file is [" + outputFileObj.unix_file + "]");
					return outputFileObj;
				} else {
					throw new Error("macCaption.editSccFileUsingEdl(): Not configured to handle [" + this.sourceFileObj.extension + "] files through MacCaption yet..");
				}
			} else {
				print("macCaption.editSccFileUsingEdl(): EDL File object has not been set, cannot edit");
			}
		};

		/**
		 * editSccFileUsingEdl Super function that converts a caption file into an STL and performs frame rate conversion
		 * @param  {Object} outputFileObj - a usefulFileObj for the output file
		 */
		this.simpleInOut = function(outputFileObj, frame_rate) {
			print("macCaption.simpleInOut(): Running simple format conversion");
			try {
/* 				print("macCaption.simpleInOut(): run command is [/usr/bin/ssh -t " + this.user + "@" + this.ip + " " + this.exec +
					" -inhibit_gui" +
					" -tcmode=" + this.ourFRtoMacCaptionFR(frame_rate) +
					this.addSemicolonInSCCFileExportOption(outputFileObj,frame_rate) +
					" -import=" + this.getImportExportString(this.sourceFileObj.extension, "import") +
					" -input=" + this.unixPathToMacCaptionPath(this.sourceFileObj.unix_file) +
					" -export=" + this.getImportExportString(outputFileObj.extension) +
					" -output=" + this.unixPathToMacCaptionPath(outputFileObj.unix_file));
				rtn = run("/usr/bin/ssh", "-t", this.user + "@" + this.ip, this.exec,
					"-inhibit_gui",
					"-tcmode=" + this.ourFRtoMacCaptionFR(frame_rate),
					this.addSemicolonInSCCFileExportOption(outputFileObj,frame_rate),
					"-import=" + this.getImportExportString(this.sourceFileObj.extension, "import"),
					"-input=" +  this.unixPathToMacCaptionPath(this.sourceFileObj.unix_file),
					"-export=" + this.getImportExportString(outputFileObj.extension),
					"-output=" + this.unixPathToMacCaptionPath(outputFileObj.unix_file)); */
					
					//following "editSccFileUsingEdl"format
					//Pushing the values into an array 
					//TODO: using Jeff's Python script to ssh 
					var command = [];

					command.push('/usr/bin/ssh');
					command.push('-i');
					command.push('/opt/evertz/mediator/etc/mediator_x_rsa');
					command.push('-oStrictHostKeyChecking=no');
					command.push('-oUserKnownHostsFile=/dev/null');
					command.push(this.user + "@" + this.ip);
					command.push(this.exec);
					command.push("-inhibit_gui");
					command.push("-tcmode=" + this.ourFRtoMacCaptionFR(frame_rate));
					command.push(this.addSemicolonInSCCFileExportOption(outputFileObj,frame_rate).replace(" ",""));
					command.push("-import=" + this.getImportExportString(this.sourceFileObj.extension, "import"));
					command.push("-input=" +  this.unixPathToMacCaptionPath(this.sourceFileObj.unix_file));
					//command.push("-input=" +  this.sourceFileObj.unix_file);
					command.push("-export=" + this.getImportExportString(outputFileObj.extension));
					command.push("-output=" + this.unixPathToMacCaptionPath(outputFileObj.unix_file));
				//	print("outputFileObj : " + outputFileObj);
			    //  command.push("-output=" + this.outputFileObj.unix_file);
					
					
					/* if(run_mode =="async"){
						this.submitMacCaptionJob(command.join(" "));
					}else{ */
						//if run_mode is not async, the ssh command gets pushed to the beginning of an array
						//command.unshift("/usr/bin/ssh", "-t", this.user + "@" + this.ip);
						//command.unshift("/usr/bin/ssh","-i","/opt/evertz/mediator/etc/mediator_x_rsa" ,"-o", "StrictHostKeyChecking=no" ,"-o", "UserKnownHostsFile=/dev/null", this.user + "@" + this.ip);
						print("macCaption.simpleInOut(): run command is ["+command.join(" ")+"]");
						rtn = run.apply(this,command);
						print("macCaption.simpleInOut() Output:\n" + rtn.output);
									
				
			} catch(e) {
				throw new Error("MacCaption Subtitle Format Conversion Failed: " + e.message);
			}
			print("macCaption.simpleInOut(): Output file is [" + outputFileObj.unix_file + "]");
			return outputFileObj;
		};

		this.ourFRtoMacCaptionFR = function(med_fr) {
			switch (med_fr) {
				case "DF30":
					return "29.97df";
				case "NDF25":
					return "25";
				case "P23_976":
					return "23.976";
				default:
					return "";
			}
		};
		
		this.rippleTimecodeStart = function(outputFileObj, timecode, frame_rate) {
			/*
			Increase the start time of a subtitle and ripple:
					Run the conversion
					Return the outputFileObj
			 */
			try {
					timecode = timecode.replace(/;/g,":");
					print("macCaption.rippleTimecodeIncrease(): run command is [/usr/bin/ssh -i /opt/evertz/mediator/etc/mediator_x_rsa -oStrictHostKeyChecking=no -oUserKnownHostsFile=/dev/null" +
							this.user + "@" + this.ip + " " + this.exec +
							" -inhibit_gui" +
							" -tcmode=" + this.ourFRtoMacCaptionFR(frame_rate) +
							this.addSemicolonInSCCFileExportOption(outputFileObj,frame_rate) +
							" -import=" + this.getImportExportString(this.sourceFileObj.extension, "import") +
							" -input=" + this.unixPathToMacCaptionPath(this.sourceFileObj.unix_file) +
							" -command=rippletimecode,start," + timecode +
							" -export=" + this.getImportExportString(outputFileObj.extension) +
							" -output=" + this.unixPathToMacCaptionPath(outputFileObj.unix_file));

					var rtn = run("/usr/bin/ssh", "-i", "/opt/evertz/mediator/etc/mediator_x_rsa", "-oStrictHostKeyChecking=no", "-oUserKnownHostsFile=/dev/null",
							this.user + "@" + this.ip, 
							this.exec,
							"-inhibit_gui",
							"-tcmode=" + this.ourFRtoMacCaptionFR(frame_rate),
							this.addSemicolonInSCCFileExportOption(outputFileObj,frame_rate),
							"-import=" + this.getImportExportString(this.sourceFileObj.extension, "import"),
							"-input=" + this.unixPathToMacCaptionPath(this.sourceFileObj.unix_file),
							"-command=rippletimecode,start," + timecode,
							"-export=" + this.getImportExportString(outputFileObj.extension),
							"-output=" + this.unixPathToMacCaptionPath(outputFileObj.unix_file));
					print("macCaption.rippleTimecodeIncrease(): Success:\n" + rtn.output);
			} catch(e) {
					throw new Error("MacCaption TimeCode Ripple Failed: " + e.message);
			}
			return outputFileObj;
        };

		this.convertFrameRate = function(srcFr, trgtFr, outputFileObj) {
			/*
			Convert the frame rate into a mac caption friendly frame rate
			Run the conversion
			Return the outputFileObj
			 */

			try {
				print("macCaption.convertFrameRate(): run command is [/usr/bin/ssh -i /opt/evertz/mediator/etc/mediator_x_rsa -oStrictHostKeyChecking=no -oUserKnownHostsFile=/dev/null" +
					this.user + "@" + this.ip + " " + this.exec +
					" -inhibit_gui" +
					this.addSemicolonInSCCFileExportOption(outputFileObj,trgtFr) +
					" -import=" + this.getImportExportString(this.sourceFileObj.extension, "import") +
					" -input=" + this.unixPathToMacCaptionPath(this.sourceFileObj.unix_file) +
					this.getConvertTCMode(srcFr,trgtFr) +
					" -export=" + this.getImportExportString(outputFileObj.extension) +
					" -output=" + this.unixPathToMacCaptionPath(outputFileObj.unix_file));
				var rtn = run("/usr/bin/ssh", "-i", "/opt/evertz/mediator/etc/mediator_x_rsa", "-oStrictHostKeyChecking=no", "-oUserKnownHostsFile=/dev/null",
					this.user + "@" + this.ip, 
					this.exec,
					"-inhibit_gui",
					this.addSemicolonInSCCFileExportOption(outputFileObj,trgtFr),
					"-import=" + this.getImportExportString(this.sourceFileObj.extension, "import"),
					"-input=" + this.unixPathToMacCaptionPath(this.sourceFileObj.unix_file),
					this.getConvertTCMode(srcFr,trgtFr),
					"-export=" + this.getImportExportString(outputFileObj.extension),
					"-output=" + this.unixPathToMacCaptionPath(outputFileObj.unix_file));
				print(rtn.output);

			} catch(e) {
				throw new Error("MacCaption Frame Rate Conversion Failed: " + e.message);
			}
			return outputFileObj;
		};
		
		this.getConvertTCMode = function (srcFr,trgtFr){
				var command;
				if(srcFr == "P23_976" && trgtFr=="DF30"){
					command = " -command=convert_tc_mode_maintain_clock_times,24,29.97df -command=stretchshrink,increase"; 
				}else {
					command = " -command=convert_tc_mode_maintain_clock_times," + this.ourFRtoMacCaptionFR(srcFr) + "," + this.ourFRtoMacCaptionFR(trgtFr);
				}
				return command;
			}

		this.rippleTimecodeIncrease = function(outputFileObj, timecode, frame_rate) {
			/*
			Increase the start time of a subtitle and ripple:
				Run the conversion
				Return the outputFileObj
			 */
			try {
				timecode = timecode.replace(/;/g,":");
				print("macCaption.rippleTimecodeIncrease(): run command is [/usr/bin/ssh -i /opt/evertz/mediator/etc/mediator_x_rsa -oStrictHostKeyChecking=no -oUserKnownHostsFile=/dev/null" +
					this.user + "@" + this.ip + " " + this.exec +
					" -inhibit_gui" +
					" -tcmode=" + this.ourFRtoMacCaptionFR(frame_rate) +
					this.addSemicolonInSCCFileExportOption(outputFileObj,frame_rate) +
					" -import=" + this.getImportExportString(this.sourceFileObj.extension, "import") +
					" -input=" + this.unixPathToMacCaptionPath(this.sourceFileObj.unix_file) +
					" -command=rippletimecode,increase," + timecode +
					" -export=" + this.getImportExportString(outputFileObj.extension) +
					" -output=" + this.unixPathToMacCaptionPath(outputFileObj.unix_file));

				var rtn = run("/usr/bin/ssh", "-i", "/opt/evertz/mediator/etc/mediator_x_rsa", "-oStrictHostKeyChecking=no", "-oUserKnownHostsFile=/dev/null",
					this.user + "@" + this.ip, 
					this.exec,
					"-inhibit_gui",
					"-tcmode=" + this.ourFRtoMacCaptionFR(frame_rate),
					this.addSemicolonInSCCFileExportOption(outputFileObj,frame_rate),
					"-import=" + this.getImportExportString(this.sourceFileObj.extension, "import"),
					"-input=" + this.unixPathToMacCaptionPath(this.sourceFileObj.unix_file),
					"-command=rippletimecode,increase," + timecode,
					"-export=" + this.getImportExportString(outputFileObj.extension),
					"-output=" + this.unixPathToMacCaptionPath(outputFileObj.unix_file));
				print("macCaption.rippleTimecodeIncrease(): Success:\n" + rtn.output);
			} catch(e) {
				throw new Error("MacCaption TimeCode Ripple Failed: " + e.message);
			}
			return outputFileObj;
		};
		
		this.rippleTimecodeDecrease = function(outputFileObj, timecode, frame_rate) {
			/*
			Decrease the start time of a subtitle and ripple:
				Run the conversion
				Return the outputFileObj
			 */
			try {
				timecode = timecode.replace(/;/g,":");
				print("macCaption.rippleTimecodeDecrease(): run command is [/usr/bin/ssh -i /opt/evertz/mediator/etc/mediator_x_rsa -oStrictHostKeyChecking=no -oUserKnownHostsFile=/dev/null" +
					this.user + "@" + this.ip + " " + this.exec +
					" -inhibit_gui" +
					" -tcmode=" + this.ourFRtoMacCaptionFR(frame_rate) +
					this.addSemicolonInSCCFileExportOption(outputFileObj,frame_rate) +
					" -import=" + this.getImportExportString(this.sourceFileObj.extension) +
					" -input=" + this.unixPathToMacCaptionPath(this.sourceFileObj.unix_file) +
					" -command=rippletimecode,decrease," + timecode +
					" -export=" + this.getImportExportString(outputFileObj.extension) +
					" -output=" + this.unixPathToMacCaptionPath(outputFileObj.unix_file));

				var rtn = run("/usr/bin/ssh", "-i", "/opt/evertz/mediator/etc/mediator_x_rsa", "-oStrictHostKeyChecking=no", "-oUserKnownHostsFile=/dev/null",
					this.user + "@" + this.ip, 
					this.exec,
					"-inhibit_gui",
					"-tcmode=" + this.ourFRtoMacCaptionFR(frame_rate),
					this.addSemicolonInSCCFileExportOption(outputFileObj,frame_rate),
					"-import=" + this.getImportExportString(this.sourceFileObj.extension),
					"-input=" + this.unixPathToMacCaptionPath(this.sourceFileObj.unix_file),
					"-command=rippletimecode,decrease," + timecode,
					"-export=" + this.getImportExportString(outputFileObj.extension),
					"-output=" + this.unixPathToMacCaptionPath(outputFileObj.unix_file));
				print("macCaption.rippleTimecodeDecrease(): Success:\n" + rtn.output);
			} catch(e) {
				throw new Error("MacCaption TimeCode Ripple Failed: " + e.message);
			}
			return outputFileObj;
		};
		
		this.embedScc = function(videoMaterial, frame_rate){
			try {
					print("macCaption.embed(): run command is [/usr/bin/ssh -i /opt/evertz/mediator/etc/mediator_x_rsa -oStrictHostKeyChecking=no -oUserKnownHostsFile=/dev/null" +
					this.user + "@" + this.ip + " " + this.exec +
					" -inhibit_gui" +
					" -tcmode=" + this.ourFRtoMacCaptionFR(frame_rate) +
					" -import=scc" +
					" -input=" + this.unixPathToMacCaptionPath(this.sourceFileObj.unix_file) +
					" -addtofile=quicktime708" +
					" -encode708=A1" +
					" -qtexport_position_closed_captions_using_movie_timecode=T" +
					" -addtofile_target=" + this.unixPathToMacCaptionPath(videoMaterial.unix_file))
			var rtn = run("/usr/bin/ssh", "-i", "/opt/evertz/mediator/etc/mediator_x_rsa", "-oStrictHostKeyChecking=no", "-oUserKnownHostsFile=/dev/null",
					this.user + "@" + this.ip, 
					this.exec,
					"-inhibit_gui",
					"-tcmode=" + this.ourFRtoMacCaptionFR(frame_rate),
					"-import=scc",					
					"-input=" + this.unixPathToMacCaptionPath(this.sourceFileObj.unix_file),			
					"-addtofile=quicktime708",
					"-encode708=A1",
					"-qtexport_position_closed_captions_using_movie_timecode=T",
					"-addtofile_target=" + this.unixPathToMacCaptionPath(videoMaterial.unix_file));
					print("macCaption.embed(): Success:\n" + rtn.output);
			} catch(e) {
					throw new Error("MacCaption TimeCode Ripple Failed: " + e.message);
			}

		};

		this.embedMultipleScc = function(videoMaterial, frame_rate, captionMap, vchipRating, vchipTitle){
			
			var encode708Options = "";
			var encodeCCOptions = "";
			var captionInputFileOptions = [];
			
			var cc1InputFile;
			if ("CC1" in captionMap){
				encode708Options += "A1";
				encodeCCOptions += "A1";
				captionInputFileOptions.push("-tcmode=" + this.ourFRtoMacCaptionFR(frame_rate));
				captionInputFileOptions.push("-import=scc");
				captionInputFileOptions.push("-ioptions=A1");
				captionInputFileOptions.push("-input=" + this.unixPathToMacCaptionPath(captionMap["CC1"].unix_file));
			} 
			
			var cc2InputFile;
			if ("CC2" in captionMap){
				encode708Options += "C3";
				encodeCCOptions += "C2";
				captionInputFileOptions.push("-tcmode=" + this.ourFRtoMacCaptionFR(frame_rate));
				captionInputFileOptions.push("-import=scc");
				captionInputFileOptions.push("-ioptions=C1");
				captionInputFileOptions.push("-input=" + this.unixPathToMacCaptionPath(captionMap["CC2"].unix_file));
			} 
			
			var cc3InputFile;
			if ("CC3" in captionMap){
				encode708Options += "B2";
				encodeCCOptions += "B3";
				captionInputFileOptions.push("-tcmode=" + this.ourFRtoMacCaptionFR(frame_rate));
				captionInputFileOptions.push("-import=scc");
				captionInputFileOptions.push("-ioptions=B1");
				captionInputFileOptions.push("-input=" + this.unixPathToMacCaptionPath(captionMap["CC3"].unix_file));
			} 
			
			var cc4InputFile;
			if ("CC4" in captionMap){
				encode708Options += "D4";
				encodeCCOptions += "D4";
				captionInputFileOptions.push("-tcmode=" + this.ourFRtoMacCaptionFR(frame_rate));
				captionInputFileOptions.push("-import=scc");
				captionInputFileOptions.push("-ioptions=D1");
				captionInputFileOptions.push("-input=" + this.unixPathToMacCaptionPath(captionMap["CC4"].unix_file));
			}
			
			try {					
				command = []
				command.push("/usr/bin/ssh");
				command.push('-i');
				command.push('/opt/evertz/mediator/etc/mediator_x_rsa');
				command.push('-oStrictHostKeyChecking=no');
				command.push('-oUserKnownHostsFile=/dev/null');
				command.push(this.user + "@" + this.ip);
				command.push(this.exec);
				command.push("-inhibit_gui");
				if (vchipRating != null && vchipRating != undefined && vchipTitle != null && vchipTitle != undefined){
					command.push("-content_rating=" + vchipRating);
					command.push("-set_content_advisory_program_name=" + vchipTitle);
				}
				for each (var opt in captionInputFileOptions){
					command.push(opt);
				}				
				command.push("-encode708=" + encode708Options);
				command.push("-encodecc=" + encodeCCOptions);
				//command.push("-qtexport_position_closed_captions_using_movie_timecode=T");
				command.push("-qtccusemovietimecode=F");
				command.push("-addtofile=quicktime708");
				command.push("-addtofile_target=" + this.unixPathToMacCaptionPath(videoMaterial.unix_file));
				output("macCaption.embedMultipleScc(): run command is[" + command.join(" ") + "]");
				var rtn = run.apply(this, command);
				
				print("macCaption.embedMultipleScc(): Success:\n" + rtn.output);
				
			} catch(e) {
					throw new Error("MacCaption Embed Failed: " + e.message);
			}

		};
		
		this.addSemicolonInSCCFileExportOption = function(outputFileObj,frame_rate){
			if(frame_rate=="DF30" && outputFileObj.extension=='scc'){
				return " -usesemicolonsinsccfileexport=T";
			}else{
				return "";
			}
		};

		this.submitMacCaptionJob = function(command){
			/*var jobObj = {
				command : command,
				sleepMS:5 
			}*/
			var jobObj = {
				Command : command,
				Hostname : this.ip,
				Username : this.user,
				Password : this.pass,
				sleepMS : 5 
			}
			gmoNBCFunc.makeAndRunJob(jobObj,undefined,this.jobFactory);
		};
	},
				
	makeBrowseCommentsFromSmpteTt : function(matId, xmlFile, ccTrackTypeName, importChain , frameRate) {
        output("Making comments for material " + matId + ", from XML file " + xmlFile);
				
		output("Mat Id: "+matId);
		output("XML File: "+xmlFile);
		output("CC Track Type Name: " + ccTrackTypeName);
		output("Import Chain: " + importChain);
		
        // Attempt to delete existing comments.
        try {
			var wscallResponse = wscall(<PharosCs>
			  <CommandList>
				<Command subsystem="comment" method="deleteComments">
				  <ParameterList>
					<Parameter name="matId" value={matId}/>
					<Parameter name="trackTypeName" value={ccTrackTypeName}/>
				  </ParameterList>
				</Command>
			  </CommandList>
			</PharosCs>);
        } catch (e) {
			throw new Error("ERROR: Unable to clear existing comments.");
		}

        //Translate the file to use the refincode and starttc and endtc and remove any captions that are blank
		var xmlString = gmoNBCFunc.removeXmlHeader(FileUtils.readFile(xmlFile)).toString();
		var xslParameters = new HashMap()
		xslParameters.put('matId', matId);
		xslParameters.put('frameRate', frameRate);
		xslParameters.put('ttlName', ccTrackTypeName);
	//	var pxfXml = xslTransform(xmlString, '/usr/local/pharos/etc/import/smpteTtPxfImport.xsl', xslParameters)
		var pxfXml = xslTransform(xmlString, '/opt/evertz/mediator/etc/import/smpteTtPxfImport.xsl', xslParameters)
		output("Writing PXF to file.");
		var importFile = xmlFile.replace(".itt", ".pxf");

		overwrite(pxfXml, importFile);
        
		if (importChain == null || importChain == ""){
			importChain = "None";
		}
		
		var contextRoot = wscall(<PharosCs><CommandList><Command subsystem="file" method="getContextRoot"/></CommandList></PharosCs>)..Output.toString();
		importFile = importFile.replace(contextRoot, "")
		try {
                wscall(<PharosCs>
                  <CommandList>
                    <Command subsystem="dataimport" method="doImport">
                      <ParameterList>
                        <Parameter name="importFile" value={importFile}/>
                        <Parameter name="importChain" value={importChain}/>
                      </ParameterList>
                    </Command>
                  </CommandList>
                </PharosCs>);
        } catch(e) {
			throw new Error("Unable to import captions pxf.");
		}
	},
	
    getComponentAudioMedia : function(matId,materialXml){

		if(!gmoNBCFunc.isVarUsable(materialXml)){
			materialXml = materialGet(matId,"tracks")..Material;
		}

		var audioStoreMedia = materialXml.Track.(this.contains(NBCGMO.storeAudioMedias,MediaName.toString())==true && parseInt(DeleteMark) === 0 && Encoded.toString() === "true").MediaName.toString();
		print("Store Audio Media ["+audioStoreMedia+"]");
		if(this.isVarUsable(audioStoreMedia)) return audioStoreMedia;

		var t2AudioMedia = materialXml.Track.(this.contains(NBCGMO.t2AudioMedias,MediaName.toString())==true && parseInt(DeleteMark) === 0 && Encoded.toString() === "true").MediaName.toString();
		print("T2 Audio Media ["+t2AudioMedia+"]");
		if(this.isVarUsable(t2AudioMedia)) return t2AudioMedia;

		var storeMedia = materialXml.Track.(this.contains(NBCGMO.storeMedias,MediaName.toString())==true && parseInt(DeleteMark) === 0 && Encoded.toString() === "true").MediaName.toString();
		if(this.isVarUsable(storeMedia)){
			audioStoreMedia = storeMedia.substr(0,storeMedia.lastIndexOf("_")) + "_WAV";
			print("Store Audio Media based from store media ["+audioStoreMedia+"]");
			return audioStoreMedia;
		}

		throw new Error("Could not retrieve Audio Component Media for material [" +matId + "]");
	}	

}