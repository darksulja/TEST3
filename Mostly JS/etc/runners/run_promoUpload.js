load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");

try {
	print("\nStarting run_promoUpload.js");
	
	// House Script in Variable to stop global Bleeding
	var promoUpload = {};
	
	// "Constant" Variables
	promoUpload.jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	promoUpload.stagingMedia = NBCGMO.omUploadSettings.defaultVideoStagingMedia;
	promoUpload.dropFolderTag = "PromoUpload";
	promoUpload.dropFolderPath = lookup.dropfolder[promoUpload.dropFolderTag].mount;
	promoUpload.failedFolderDir = promoUpload.dropFolderPath + "failed/PromoUploadRunner/";
	promoUpload.mov = "mov";
	promoUpload.xml = "xml";
	promoUpload.videoExtensions = [promoUpload.mov]
	promoUpload.xmlExtensions = [promoUpload.xml];
	promoUpload.videoTrackType = "Video";
	promoUpload.failedEmailTitle = "Promo Upload - Profile Validation Failure";
	promoUpload.uploadCommentType = "Upload";
	promoUpload.dotDir = ".dir/";
	promoUpload.isRetryJob = false;
	promoUpload.promoMaterialType = "Promo";
	
	// Used when extracting values from the Media Info Xml
	promoUpload.mediaInfoTrackTypes = {
		audio : "Audio"
	}
	
	// Used when extracting Track Types from SideCar Xml to decide if the Track Type is pertinent
	promoUpload.sideCarXmlTypes = {
		video : "Video",
		audio : "Audio",
		captioning : "Captioning",
		subtitle : "Subtitle",
		component : "Component"
	}
	
	// List of States
	promoUpload.states = {
		orderPlaced : "Order Placed"
	}
	
	// House a List of Requirements
	promoUpload.requirements = {
		toMediaReceived : "Upload",
		toOMUploadFailed : "Failed (Promo)",
		toTranscode : "Transcode"
	}
	
	// Used in case script fails
	promoUpload.cleanUpBooleans = {
		deleteTrack : false
	}
	
	// List of MetaData Components
	promoUpload.metaData = {
		shortText : {
			originalFileName : "Original File Name"
		},
		fullText: {
			mediaInfoXml : "Media Info Xml"
		},
		tag : {
			dropFolder : "Drop Folder",
			validPromoVersionTypes : "Valid Promo Version Types" 
		}
	}
	
	// Methods
	promoUpload.getMatIdFromJobDescription = function () {
		
		if (debug) print("\nDEBUG: promoUpload.getMatIdFromJobDescription()");
		
		var rtnFile = this.jobDescription..MatId.toString();
		if (rtnFile === "") throw new Error("Failed to extract Mat Id (Identifier) from [" + this.jobDescription + "]");
		return rtnFile;
	
	}
	
	// Function to map the TrackTypes in the SideCar Xml to Track Types in Mediator
	// *** Optional @param [string/array] (ensureTrackTypes) *** - If used the return array must contain those Track Types
	// @return [array]
	// @error - If the Track Type Group is Blank - I.e. if the Track Type Group doesn't exist
	// @error - If ensureTrackTypes is true and those Track Types aren't found
	// @error - If 0 Track Types are found
	promoUpload.getMediatorTrackTypesFromXmlTrackTypes = function(ensureTrackTypes){
		
		if (debug) print("\nDEBUG: In getMediatorTrackTypesFromXmlTrackTypes() with XmlTrackType Array [" + this.sideCarXmlTrackTypes + "]");
		
		// Return
		var trackTypes = [];

		// Loop through Input Array Getting TrackTypeGroup Xml 
		for (var i=0; i < this.sideCarXmlTrackTypes.length; i++) {
			
			var trackTypeGroupName = this.sideCarXmlTrackTypes[i];
			print("\nMapping Xml Track Type [" + trackTypeGroupName + "] to Mediator Track Types");
			
			var trackTypeGroupXml = gmoNBCFunc.trackTypeGroupGet(trackTypeGroupName);
			if (trackTypeGroupXml.TrackType.length()===0) throw new Error("No TrackTypes Defined for Track Type Group [" + trackTypeGroupName + "]");
				
			// Extract the Track Type Names from each TrackTypeGroup Get
			for (var j=0; j<trackTypeGroupXml.TrackType.length(); j++) {
				print("\tFound Mediator TrackType [" + trackTypeGroupXml.TrackType[j].Name.toString() + "]");
				trackTypes.push(trackTypeGroupXml.TrackType[j].Name.toString());
			}
			
		}
		// Check if the optional arg was used.
		if (ensureTrackTypes) {
			//If they pass in one item or a string comma seperated list, make it into an array
			if (typeof(ensureTrackTypes) === "string") ensureTrackTypes = ensureTrackTypes.split(",");
			for each (var trackType in ensureTrackTypes) {
				if (trackTypes.indexOf(trackType) === -1) throw new Error("\nCould not find Track Type in final Mediator TrackTypes [" + trackType + "]");
			}

		}
		if (trackTypes.length === 0) throw new Error("Unable to find any Track from Xml Track Types [" + this.sideCarXmlTrackTypes + "]");
		return trackTypes;
	}
	
	// Extract the Track Type from Side Car Xml
	// @return [array] - _trackTypes (Containing the Track Types extracted)
	// @error - If the Track Type in the XML file cannot be parsed.
	promoUpload.extractTrackTypesFromSideCarXml = function() {
		
		if (debug) print("\nDEBUG: promoUpload.extractTrackTypesFromSideCarXml()");
			
		var trackTypes = []; // Return
		var sideCarXml = this.parsedXml;
		var videoType = this.sideCarXmlTypes.video;
		var audioType = this.sideCarXmlTypes.audio;
		var captionType = this.sideCarXmlTypes.captioning;
		var subtitleType = this.sideCarXmlTypes.subtitle;
		var componentType = this.sideCarXmlTypes.component;
				
		
		for (var i=0; i< sideCarXml.Tracks.Track.length(); i++) {
			
			var trackTypeName = sideCarXml.Tracks.Track[i].Track_Type_Name.toString();
			var xmlTrackType  = sideCarXml.Tracks.Track[i].@type.toString();
				
			switch (xmlTrackType) {
				case videoType:
					print("\t" + xmlTrackType + "[" + this.videoTrackType + "]"); 
					trackTypes.push(this.videoTrackType);
					break;
				case audioType:
					print("\t" + xmlTrackType + " [" + trackTypeName + "]");
					trackTypes.push(trackTypeName);
					break;
				// Ignoring anything besides Video and Audio for the moment
				case captionType:
				case subtitleType:
				case componentType:
					break;
			  default:
					throw new Error("\nUnsure how to parse [" + xmlTrackType + "] Track Type Name [" + trackTypeName + "]");
			}
		}
		return trackTypes;
	}
	
	promoUpload.updateMaterialWithExtractedTrackTypeLinks = function() {
		
		if (debug) print("\nDEBUG: promoUpload.updateMaterialWithExtractedTrackTypeLinks()");
			
		var materialHelper = this.materialHelper;
		var trackTypes = this.mediatorTrackTypes;
		var orderPlaced = this.states.orderPlaced;
		var stateMachine = NBCGMO.contentPrepDefaultStateMachine;
		var addedNewTrackTypeLinks = false;
			
		for each(var trackType in trackTypes) {
			
			if (materialHelper.trackTypeLinkExists(trackType) === false) {
				addedNewTrackTypeLinks = true;
				if (debug) print("\nAdding Track Type [" + trackType + "] to Material Save");
				materialHelper.addTrackTypeLink(trackType, orderPlaced, stateMachine);
			} 
		}
		
		if (addedNewTrackTypeLinks === false) {
			print("\nNo new Track Type Links Added");
			return true;
		}
		
		print("\nNew Track Type Links");
		materialHelper.printSaveXml();
		
		return materialHelper.saveUsingSaveXml();
	}
	
	promoUpload.attemptProfileMatch = function() {
		
		if (debug) print("\nDEBUG: promoUpload.attemptProfileMatch ()");
		
		for (var i=0; i<NBCGMO.contributionProfileGroups.HouseProfiles.length; i++) {
			
			var profile = NBCGMO.contributionProfileGroups.HouseProfiles[i];
			var profileObj = NBCGMO.contributionProfiles[profile]; 
			print("\nChecking to see if file [" + this.videoFileAndPath + "] matches the following profile [" + profile + "]");
			
			if (gmoNBCFunc.runProfileValidation(this.mediaInfoXml, profile)) {
				return profile;
			}
		}
		
		gmoNBCFunc.sendCustomEmail(NBCGMO.systemFailureEmailList, this.failedEmailTitle, "The Material failed [" + this.matId + "] Profile Validation");
		throw new Error("File  [" + this.videoFileAndPath+ "] does not match a Valid Profile");
	}
	
	promoUpload.countAudioXmlChannels = function (mediaInfoXml) {
		
		if (debug) print("\nDEBUG: promoUpload.countAudioXmlChannels()");
		
		var audCnt = 0;
		
		// Go through each track, add up the number of channels specified
		for (var i = 0; i < mediaInfoXml..Tracks.Track.length(); i++) {
			var currAudCnt = mediaInfoXml..Tracks.Track[i].Channels.toString();
			audCnt = audCnt + Number(currAudCnt);
		}
		
		return audCnt;
	}
	
	
	// Functions Specific to Script
	promoUpload.validateAudioStreams = function() {
		
		if (debug) print("\nDEBUG: promoUpload.validateAudioStreams()");
			
		// Get our audio channel count from XML
		var xmlAudioChannels = this.countAudioXmlChannels(this.mediaInfoXml);
		
		// Grab the Contrbution Profile Audio Settings
		if (NBCGMO.contributionProfilesAudioSettings[this.profileMatch]) {
			var audioSettings = NBCGMO.contributionProfilesAudioSettings[this.profileMatch];
			print("\nFound Audio Settings from Profile:");
			for (prop in audioSettings){
				print("[" + prop + "] : [" + audioSettings[prop] + "]");
			}
			if (debug) show(audioSettings);
		} else {
			throw new Error("Unable to find Audio Settings for Profile [" + this.profileMatch + "]");
		}
		
		var mediaInfoAudioType = this.mediaInfoTrackTypes.audio;
		var audioChannels = 0;
		
		// Check that each Audio Stream is good
		for (var i=0; i<this.mediaInfoXml.track.(@type.toString() === mediaInfoAudioType).length(); i++) {
			// Increments
			audioChannels ++;
			
			var audioTrack = this.mediaInfoXml.track.(@type.toString() === mediaInfoAudioType)[i];
			print("\nValidating Audio Stream [" + (i+1) + "] out of [" + this.mediaInfoXml.track.(@type.toString() === mediaInfoAudioType).length()+"]");
			
			if (audioTrack.Codec[0].toString() !== audioSettings.Codec) throw new Error("Codec Mismatch Expected [" + audioSettings.Codec + "] Actual [" + audioTrack.Codec[0].toString() + "]\n" + audioTrack);
			print("\tSuccess Codec is [" + audioSettings.Codec + "]");	
			
			if (parseInt(audioTrack.Bit_rate[0].toString()) != audioSettings.BitRate){
				if(audioSettings.minBitRate!="" && typeof audioSettings.minBitRate!='undefined'){
					print("Min Bit Rate Defined - Running Checks ");
					if (parseInt(audioTrack.Bit_rate[0].toString()) < audioSettings.minBitRate || parseInt(audioTrack.Bit_rate[0].toString()) > audioSettings.BitRate){
						print("Min Bit Rate Defined - Out Of Range - Throwing Error ");
						throw new Error ("Bit Rate Mismatch Expected Range  ["+audioSettings.minBitRate+"] - ["+audioSettings.BitRate+"] Actual ["+audioTrack.Bit_rate[0].toString()+"]\n"+audioTrack);
					}
				}else {
					throw new Error ("Bit Rate Mismatch Expected ["+audioSettings.BitRate+"] Actual ["+audioTrack.Bit_rate[0].toString()+"]\n"+audioTrack);
				}
				
			} 
			print("\tSuccess Bit Rate is [" + audioSettings.BitRate + "]");
			
			if (parseInt(audioTrack.Sampling_rate[0].toString()) !== audioSettings.SamplingRate) throw new Error("Sampling Rate MisMatch Expected [" + audioSettings.SamplingRate + "] Actual [" + audioTrack.Sampling_rate[0].toString() + "]\n" + audioTrack);
			print("\tSuccess Sampling Rate is ["+audioSettings.SamplingRate+"]")
			
			if (parseInt(audioTrack.Resolution[0].toString()) !== audioSettings.Resolution) throw new Error("Resolution MisMatch Excpected [" + audioSettings.Resolution + "] Actual [" + audioTrack.Resolution[0].toString() + "]");
			print("\tSuccess Resolution/Bit Depth is ["+audioSettings.Resolution+"]");
			
			if (parseInt(audioTrack.Channel_s_[0].toString()) !== audioSettings.ChannelsPerStream) throw new Error("Stream / Channel error Expected [" + audioSettings.ChannelsPerStream + "] Actual [" + audioTrack.Channel_s_[0].toString() + "]");
			print("\tSuccess Stream has ["+ audioTrack.Channel_s_[0].toString() + "] channel(s)");
		}
		
		print("File Audio Channel Number [" + audioChannels + "]");
		print("Expected Number of Audio Channels from Xml [" + xmlAudioChannels + "]");
		
		if(xmlAudioChannels > audioChannels){
			throw new Error("More Track types defines in xml than in the file"); // We cannot have more track types in mediator than we have on the file 
		}else if(xmlAudioChannels < audioChannels){
			print("\nWe have more audio tracks in he file than specified in the xml");// we can have more track types on the file than in mediator but we should log a comment
			gmoNBCFunc.addComment(this.matId, this.uploadCommentType, "File has more audio tracks than what has been specified in the sidecar xml");
		}else if(xmlAudioChannels == audioChannels){
			print("\nSidecar and XML match"); // xml and file match 
			
		}
		return true;
	}
	
	promoUpload.createStagingMediaDir = function () {
		
		if (debug) print("\nDEBUG: promoUpload.createStagingMediaDir()");
	
		var stagingDirPath = this.stagingMediaDir + this.safeMatId + this.dotDir;
		
		print("\nCreating Directory [" + stagingDirPath + "]");
		makedir(stagingDirPath);
		
		if (!fileExists(stagingDirPath)) throw new Error("\nFailed to create Staging Directory at [" + stagingDirPath + "]");
		
	}
	
	// Not written by Evertz but believe this is used for Getting the correct Audio Track Type Channels in the Complex Encoded Track Save	
	promoUpload.getSideCarXmlTrackTypeList = function()	{
		
		if (debug) print("\nDEBUG: in promoUpload.getSideCarXmlTrackTypeList()");
		
		var sourceTrackTypes = <TrackTypes></TrackTypes>;
		var sourceTracks = new XMLList(<TrackType><TrackTypeName>Video</TrackTypeName></TrackType>);
		var sideCarXml = this.parsedXml;
		
		// Build up an Xml List of the Track Types, Channels, and Positions. 
		for each (var track in sideCarXml..Tracks.Track){
			
			var trackTypeGroupXml = gmoNBCFunc.trackTypeGroupGet(track.Track_Type_Name.toString());
			
			if (trackTypeGroupXml.TrackType.length()===1){
				sourceTracks += 
					<TrackType>
						<TrackTypeName>{track.Track_Type_Name.toString()}</TrackTypeName>
						<Channels>{track.Channels.toString()}</Channels>
						<Position>{track.Position.toString()}</Position>
					</TrackType>
			}else {
				for (var j=0; j<trackTypeGroupXml.TrackType.length();j++) {
					if (debug) print("\tFound Mediator TrackType ["+trackTypeGroupXml.TrackType[j].Name.toString()+"]");
					sourceTracks += 
						<TrackType>
							<TrackTypeName>{track.Track_Type_Name.toString()}</TrackTypeName>
							<Channels>2</Channels>
							<Position></Position>
						</TrackType>
				}
			}
		} 	
		sourceTrackTypes.TrackTypes = sourceTracks;
		if(debug) print(sourceTracks);
		
		return sourceTrackTypes;
	}
	
	promoUpload.findMatId = function () {
		
		if (debug) print("\nDEBUG: promoUpload.findMatId()");
		
		// This could be a Job Created from a Folder Monitor or else from a Retry Job. Either way the Job Descriptions will be different so run tests to workout the Mat Id
		var matId;
		var folderMonMatId = this.jobDescription..FolderMonitorMatId.toString();
		var retryMatId = this.jobDescription..domainKey.toString();
		print("\nFolderMonitor MatId [" + folderMonMatId + "] Retry MatId [" + retryMatId + "]\nNote only one should be populated.");
		
		if (folderMonMatId && retryMatId) {
			throw new Error("Cannot decide which MatId to use. FolderMonitorMatId has value [" + folderMonMatId + "] Retry MatId has value [" + retryMatId + "]");
		} else if (folderMonMatId) {
			matId = folderMonMatId;
		} else if (retryMatId) {
			matId = retryMatId;
			print("\nNote this is a retry Job")
			this.isRetryJob = true;
		} else {
			throw new Error("Cannot find a MatId from Job Description");
		}
		
		return matId.toUpperCase();
	}
	
	promoUpload.saveMetaData = function() {
		
		if (debug) print("\nDEBUG: promoUpload.saveMetaData()");
			
		// Use Material Helper
		var materialHelper = this.materialHelper;
		materialHelper.resetSaveXml();  // Clear down Xml
		
		// Short Texts go Here
		
		// Full Texts
		materialHelper.addFullTextToSaveXml(this.metaData.fullText.mediaInfoXml, this.mediaInfoXml.toString());
		
		//Tags 
		materialHelper.addTagToSaveXml(this.metaData.tag.dropFolder, this.dropFolderTag);
		
		if (debug) materialHelper.printSaveXml(); 
		return materialHelper.saveUsingSaveXml();
		
	}
	
	promoUpload.cleanUpVideo = function () {
		
		if (debug) print("\nDEBUG: promoUpload.cleanUpVideo()");
		
		if (this.videoFile && fileExists(this.dropFolderPath + this.videoFile)) { // Case 1 File is in drop Folder
				
			var srcFileVideo = this.dropFolderPath + this.videoFile;
			var dstFileVideo = this.failedFolderDir + this.videoFile;
				
			print("\nError CleanUp: Moving  [" + srcFileVideo + "] to [" + dstFileVideo + "]");
			move(srcFileVideo, dstFileVideo);
				
			if (fileExists(dstFileVideo)) {
				print("File Moved Successfully to [" + dstFileVideo + "]");
			} else {
				print("Error File cannot be found at [" + dstFileVideo + "]");
			}
			
		} else if (this.videoFile && fileExists(this.stagingMediaFileandPath)) { // Case 2: File is in Staging Folder
				
			var srcFileVideo = this.stagingMediaFileandPath;
			var dstFileVideo = this.failedFolderDir + this.videoFile;
				
			print("\nError CleanUp: Moving  [" + srcFileVideo + "] to [" + dstFileVideo + "]");
			move(srcFileVideo, dstFileVideo);
				
			if (fileExists(dstFileVideo)) {
				print("File Moved Successfully to [" + dstFileVideo + "]");
			} else {
				print("Error File cannot be found at [" + dstFileVideo + "]");
			}
		
		} else if (this.videoFile && fileExists(this.failedFolderDir +  this.videoFile)) { // Case 3: File is already in failed folder (retry)
			
			print("\nError CleanUp: Video File already at [" + this.failedFolderDir +  this.videoFile + "] leaving");
				
		} else { // Case 4: Have no idea where the File is - This should never happen in reality
			
			print("\nError Cleanup: Severe Error cannot locate Video File or Video File is undefined. Manual intervention needed to fix. Not Deleting any Tracks.");
			this.cleanUpBooleans.deleteTrack  = false; // Not sure where the file is so leave alone
				
		}
	}
	
	promoUpload.cleanUpXml = function() {
		
		if (debug) print("\nDEBUG: promoUpload.cleanUpXml()");
		
		if (this.xmlFile && fileExists(this.dropFolderPath + this.xmlFile)) { // Case 1 File is in drop folder
			
			var srcFileXml = this.dropFolderPath + this.xmlFile;
			var dstFileXml = this.failedFolderDir + this.xmlFile;
			
			print("\nError CleanUp: Moving  [" + srcFileXml + "] to [" + dstFileXml + "]");
			move(srcFileXml, dstFileXml);
			
			if (fileExists(dstFileXml)) {
				print("File Moved Successfully to [" + dstFileXml + "]");
			} else {
				print("Error File cannot be found at [" + dstFileXml + "]");
			}
			
		} else if (this.xmlFile && fileExists(this.failedFolderDir + this.xmlFile) ) { // Case 2 File is not in failed folder (If job is retry that`s where the Xml should be)
		
			print("\nError CleanUp: Xml File already at [" + this.failedFolderDir + this.xmlFile + "] leaving");
	
		} else {
			
			print("\nError Cleanup: Severe Error cannot locate Xml File or Xml File is undefined. Manual intervention needed to fix. Not Deleting any Tracks.")
			this.cleanUpBooleans.deleteTrack  = false; // Not sure where the file is so leave its video counter part alone
		
		}
		
	}

	promoUpload.cleanUpFailedJob = function() {
		
		if (debug) print("\nDEBUG: promoUpload.cleanUpFailedJob()");
		
		// Step 1 Handle the Video File
		print("\nError CleanUp: Attempting to Clean Up Video ");
		this.cleanUpVideo();
		
		// Step 2 Handle the Xml File
		print("\nError CleanUp: Attempting to Clean Up Xml ");
		this.cleanUpXml();
	
		// Step 3 Delete Track
		if (this.cleanUpBooleans.deleteTrack && this.stagingMedia) {
			print("\nError CleanUp: Deleting Track for Material [" + this.matId + "] on Media [" + this.stagingMedia + "]");
		    gmoNBCFunc.materialTrackDelete(this.matId, this.stagingMedia);
			sleep(2); // Give the chance for the StateHistory to Catch Up
		}
			
		// Step 4 - Transition to Failed 
		if (this.mediatorTrackTypes && this.matId) {
			print("\nError CleanUp: Transitioning [" + this.mediatorTrackTypes +"] with requirement [" + this.requirements.toOMUploadFailed+ "]");
			gmoNBCFunc.transitionTrackTypes(this.matId, this.requirements.toOMUploadFailed, this.mediatorTrackTypes);
		} else if (this.matId){
			print("\nError CleanUp: Transitioning [" + this.mediatorTrackTypes +"] with requirement [" + this.requirements.toOMUploadFailed+ "]");
			gmoNBCFunc.transitionTrackTypes(this.matId, this.requirements.toOMUploadFailed, this.videoTrackType); // Just Transition the Video. This wil cause file to show up in failed queue.
		} else {
			print("\nError CleanUp: Sever Error matId is not defined cannot run any workflow Transitions");
		}	
			
	}	
	
	promoUpload.getVersionTypeFromSideCarXml = function() {
		
		if (debug) print("\nDEBUG: promoUpload.getVersionTypeFromSideCarXml()");
		
		var sideCarVersionType = this.parsedXml..Text_Less.Present.toString();
		var validPromoVersionTagType = this.metaData.tag.validPromoVersionTypes;
		var validPromoVersionTypes = gmoNBCFunc.getTagsForType(validPromoVersionTagType);
		if (validPromoVersionTypes.indexOf(sideCarVersionType) === -1) throw new Error("Side Car Xml Version Type [" + sideCarVersionType + "] not in Valid Promo Version Type List [" + validPromoVersionTypes + "]");
		return sideCarVersionType;
	};
	
	promoUpload.getAspectRatioFromSideCarXml = function () {
		
		if (debug) print("\nDEBUG: promoUpload.getAspectRatioFromSideCarXml()");
		
		var sideCarAspectRatio = this.parsedXml..File_Aspect_Ratio.toString();
		if (sideCarAspectRatio === "") throw new Error("Could not extract Aspect Ratio from Side Car Xml");
		return sideCarAspectRatio;
	}
	
	promoUpload.getTransformationFromSideCarXml = function() {
		
		if (debug) print("\nDEBUG: promoUpload.getTransformationFromSideCarXml()");
		
		var sideCarTransformation = this.parsedXml..Transformation.toString();
		if (sideCarTransformation === "") throw new Error("Could not extract Transformation from Side Car Xml");
		return sideCarTransformation;
	}
	
	promoUpload.getTitleFromSideCarXml = function() {
		
		if (debug) print("\nDEBUG: promoUpload.getTitleFromSideCarXml()");
		
		var title = this.parsedXml..Promo_Title.toString();
		if (title === "") throw new Error("Could not extract Title");
		return title;
	}
	
	promoUpload.saveFirstClassCitizens = function() {
		
		if (debug) print("\nDEBUG: promoUpload.saveFirstClassCitizens()");
		
		this.materialHelper.resetSaveXml();
		this.materialHelper.addFrameRateToSaveXml(this.timeCodeDataObj.frame_rate);
		this.materialHelper.addDurationToSaveXml(this.timeCodeDataObj.duration);
		this.materialHelper.addMaterialTypeToSaveXml(this.promoMaterialType);
		this.materialHelper.addVersionTypeToSaveXml(this.getVersionTypeFromSideCarXml()); 
		this.materialHelper.addAspectRatioToSaveXml(this.getAspectRatioFromSideCarXml());
		this.materialHelper.addTransformationToSaveXml(this.getTransformationFromSideCarXml());
		this.materialHelper.addTitleToSaveXml(this.getTitleFromSideCarXml());
		if( this.materialHelper.saveUsingSaveXml() === false) throw new Error("Failed to Save First Class Citizens on Material");
	}
	 
	//                                                                                                                                              //
	// ////////////////////////////////////////////////////////////   Start of Script  //////////////////////////////////////////////////////////// //
	//                                                                                                                                              //
	
	print("\nFinding Mat Id");
	promoUpload.matId = promoUpload.findMatId();
	print("\nMaterial Id [" + promoUpload.matId + "]");
		
	// Transition Video TTL Straight away
	gmoNBCFunc.transitionTrackTypes(promoUpload.matId, promoUpload.requirements.toMediaReceived, promoUpload.videoTrackType);
	
	// Create a Job Update Object and report initial settings back
	promoUpload.jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	promoUpload.jobDashboard.updateStatusAndProgress("Starting Script",0);
	promoUpload.jobDashboard.updateStatusMap({"Script_MatID" : promoUpload.matId});
	
	// Build up iniitial Variables
	print("\nExtracting initial Variables"); 
	
	// Get Safe Mat Id
	promoUpload.safeMatId = gmoNBCFunc.getSafeFileId(promoUpload.matId);
	print("Safe Mat Id [" + promoUpload.safeMatId + "]");

	// Create Helper
	promoUpload.materialHelper = new gmoNBCFunc.materialHelper(promoUpload.matId);
		
	// Find File Information
	promoUpload.jobDashboard.updateStatusAndProgress("Extracting File Information",10);
	promoUpload.videoFile = promoUpload.materialHelper.getShortTextValue(promoUpload.metaData.shortText.originalFileName);
	promoUpload.baseFile = gmoNBCFunc.getBaseFileName(promoUpload.videoFile);
	promoUpload.xmlFile = promoUpload.baseFile + "." + promoUpload.xml;
	promoUpload.path = promoUpload.isRetryJob ? promoUpload.failedFolderDir : promoUpload.dropFolderPath;
	
	promoUpload.videoFileAndPath = promoUpload.path + promoUpload.videoFile;
	if (fileExists(promoUpload.videoFileAndPath) === false) throw new Error("Video File [" + promoUpload.videoFileAndPath + "] does not exist");
	
	// Tell the World which Video File to use
	promoUpload.jobDashboard.updateStatusMap({"Script_FileName" : promoUpload.videoFile});

	promoUpload.xmlFileAndPath = promoUpload.path + promoUpload.xmlFile;
	if (fileExists(promoUpload.xmlFileAndPath) === false) throw new Error("Xml File [" + promoUpload.xmlFileAndPath + "] does not exist");
	
	promoUpload.extension = gmoNBCFunc.getFileExtension(promoUpload.videoFileAndPath);
	if (promoUpload.extension !== promoUpload.extension) throw new Error("Extension [" + promoUpload.extension + "] is not valid");
		
	promoUpload.jobDashboard.updateStatusAndProgress("Running Media Info on Source File",15);	
	print("\nRunning Media Info on [" + promoUpload.videoFileAndPath + "]");
	promoUpload.mediaInfoXml = gmoNBCFunc.getFileInfoXml(promoUpload.videoFileAndPath); 
	
	promoUpload.parsedXml = new XML(FileUtils.readFile(promoUpload.xmlFileAndPath));
	print("\nSide Car Xml\n" + promoUpload.parsedXml);
	
	// Get Track Types out of Sidecar Xml
	promoUpload.jobDashboard.updateStatusAndProgress("Extracting Track Types from Side Car Xml",25);	
	print("\nExtracting Track Types from Xml");
	promoUpload.sideCarXmlTrackTypes = promoUpload.extractTrackTypesFromSideCarXml();
	print("\nSideCarXml Track Types [" + promoUpload.sideCarXmlTrackTypes + "]");
	
	// Convert the Sidecar Xml Track Types into Mediator Track Types
	promoUpload.jobDashboard.updateStatusAndProgress("Mapping Side Car Track Types to Mediator Track Types",35);
	print("\nConverting Side Car Track Types to Mediator Track Types");
	promoUpload.mediatorTrackTypes = promoUpload.getMediatorTrackTypesFromXmlTrackTypes();
	print("\nMapped Mediator Track Types [" + promoUpload.mediatorTrackTypes + "]");
	
	// Save new Track Type Links
	print("\nHandling new Track Type Links if applicable");
	promoUpload.trackTypeLinksUpdated = promoUpload.updateMaterialWithExtractedTrackTypeLinks();
	if (promoUpload.trackTypeLinksUpdated === false) throw new Error("\nFailed to Save new Track Type Links");
			
	// Ensure the new Track Types have caught up with the Video in the Workflow
	gmoNBCFunc.transitionTrackTypes(promoUpload.matId, promoUpload.requirements.toMediaReceived, promoUpload.mediatorTrackTypes);
	
	// Profile check
	promoUpload.jobDashboard.updateStatusAndProgress("Checking Source File for Profile",45);
	print("\nChecking [" + promoUpload.videoFileAndPath + "] for Profile");
	promoUpload.profileMatch = promoUpload.attemptProfileMatch();
	promoUpload.jobDashboard.updateStatusMap({"Script_Profile" : promoUpload.profileMatch});
	print("\nSuccess File [" + promoUpload.videoFileAndPath + "] matches Profile [" + promoUpload.profileMatch + "]");
	
	promoUpload.jobDashboard.updateStatusAndProgress("Validating Audio Streams",50);
	print("\nEnsuring Audio Streams are appropriate");
	promoUpload.audiosValidated = promoUpload.validateAudioStreams();
	print("\nAudio Streams are valid for Profile [" + promoUpload.profileMatch + "]");	
		
	// Get Media Information and Path Information
	promoUpload.stagingMedia = NBCGMO.defaultUploadSettings.stagingMedia;
	promoUpload.stagingMediaDir = lookup.media[promoUpload.stagingMedia].mount;
	promoUpload.stagingMediaUsesDotDir = lookup.media[promoUpload.stagingMedia].usesMatIdDir;
	promoUpload.stagingMediaFileandPath = promoUpload.stagingMediaUsesDotDir ? promoUpload.stagingMediaDir  + promoUpload.safeMatId + promoUpload.dotDir + promoUpload.safeMatId + "." + promoUpload.extension : promoUpload.stagingMediaDir + promoUpload.safeMatId + "." + promoUpload.extension;
	
	// Check destination is free
	if (fileExists(promoUpload.stagingMediaFileandPath)) {
		throw new Error("\nError File already exists in Staging Folder [" + promoUpload.stagingMediaFileandPath + "]");
	}
	
	// Report Staging Media to Dashboard
	promoUpload.jobDashboard.updateStatusMap({"Script_StagingMedia" : promoUpload.stagingMedia});
	promoUpload.jobDashboard.updateStatusAndProgress("Checking Source File for Structural integrity",55);	
	print("\nExamining Essence for Incode/Outcode/Duration");
	promoUpload.timeCodeDataObj = gmoNBCFunc.getTimeCodes(promoUpload.videoFileAndPath);
	
	print(
		"\nEssence Examined for Structural Integrity \n\tIncode [" + promoUpload.timeCodeDataObj.incode + "]" +
        "\n\tDuration [" + promoUpload.timeCodeDataObj.duration + "]" + 
	    "\n\tOutcode [" + promoUpload.timeCodeDataObj.outcode + "]" +
		"\n\tTimeCode Stream Index [" + promoUpload.timeCodeDataObj.tcindex + "]" + 
		"\n\tFrame Rate [" + promoUpload.timeCodeDataObj.frame_rate + "]"
	);
		
	// Save First Class Citizens Items like Material Type / Version Type etc
	promoUpload.jobDashboard.updateStatusAndProgress("Saving Material first class citizens",65);
	print("\nSaving Material First Class Citizens");
	promoUpload.saveFirstClassCitizens();
	
	print("\nSaving unencoded Track on [" + promoUpload.stagingMedia + "]");
	promoUpload.unencodedStorageTrack = gmoNBCFunc.complexUnencodedTrackSave(
		promoUpload.matId, // MatId
		promoUpload.stagingMedia,  // Media Name
		promoUpload.timeCodeDataObj.frame_rate, // Frame Rate
		promoUpload.timeCodeDataObj.incode, // Incode
		promoUpload.timeCodeDataObj.outcode // Outcode
	);
	
	if (promoUpload.unencodedStorageTrack === false) {
		throw new Error("Failed to save Track on [" + promoUpload.stagingMedia + "]");
	}
	
	// Delete Track if Script fails beyond here
	promoUpload.cleanUpBooleans.deleteTrack = true;
		
	// Staging Media is currently always .dir and file manipulation is a move so create .dir
	if (promoUpload.stagingMediaUsesDotDir) {
		promoUpload.createStagingMediaDir();
	}	
	
	promoUpload.jobDashboard.updateStatusAndProgress("Moving Source [" + promoUpload.videoFileAndPath + "] to Dest [" + promoUpload.stagingMediaFileandPath  + "]",75);	
	print("\nMoving Drop Folder File [" + promoUpload.videoFileAndPath + "] to [" + promoUpload.stagingMediaFileandPath + "]");
	move(promoUpload.videoFileAndPath, promoUpload.stagingMediaFileandPath);
		
	//Check File Exists
	if (fileExists(promoUpload.stagingMediaFileandPath)) {
		print("\nMove Successful");
		promoUpload.jobDashboard.updateStatusAndProgress("Successful File Move",85);	
	} else {
		throw new Error("\nError Move failed. Cannot see file at [" + promoUpload.stagingMediaFileandPath +"]");
	}	
	
	
		//---Testing-----
		//remove later!!
		print("\npromoUpload.matId   "+ promoUpload.matId);
		print("\npromoUpload.stagingMedia " +promoUpload.stagingMedia);
		print("\npromoUpload.timeCodeDataObj.frame_rate " +promoUpload.timeCodeDataObj.frame_rate);
		print("\npromoUpload.timeCodeDataObj.incode " +promoUpload.timeCodeDataObj.incode);
		print("\npromoUpload.timeCodeDataObj.outcode " +promoUpload.timeCodeDataObj.outcode);
		print("\npromoUpload.stagingMediaFileandPath " +promoUpload.stagingMediaFileandPath);
		print("\npromoUpload.mediatorTrackTypes " +promoUpload.mediatorTrackTypes);
		print("\npromoUpload.profileMatch " +promoUpload.profileMatch);
		print("\npromoUpload.getSideCarXmlTrackTypeList() " +promoUpload.getSideCarXmlTrackTypeList());
		
	// File has been moved. Encode Track
	promoUpload.encodedStorageTrack =  gmoNBCFunc.complexEncodedTrackSave(
		promoUpload.matId, // MatId
		promoUpload.stagingMedia, // Media Name
		promoUpload.timeCodeDataObj.frame_rate, // Frame Rate
		promoUpload.timeCodeDataObj.incode, // Incode
		promoUpload.timeCodeDataObj.outcode, // Outcode
		promoUpload.stagingMediaFileandPath, // Path to Src File 
		promoUpload.mediatorTrackTypes, // Track Types
		promoUpload.profileMatch, // Profile
		promoUpload.getSideCarXmlTrackTypeList() // Xml List of Track Type with Channels 
	);	
	
	if (promoUpload.encodedStorageTrack === false) {
		throw new Error("Failed to Save Encoded Track on [" + promoUpload.stagingMedia + "]");
	}	
	
	// Meta Data Save
	promoUpload.jobDashboard.updateStatusAndProgress("Saving Meta Data",90);	
	print("\nSaving Metadata");
	promoUpload.metaDataAdded = promoUpload.saveMetaData();
	if (promoUpload.metaDataAdded === false ) throw new Error("Failed to Save MetaData");
	
	// Delete Side Car
	promoUpload.jobDashboard.updateStatusAndProgress("Removing Side Car File",95);	
	print("\nRemoving Xml File [" + promoUpload.xmlFileAndPath + "]");
	remove(promoUpload.xmlFileAndPath)
		
	// Transition as job`s a good`un
	gmoNBCFunc.transitionTrackTypes(promoUpload.matId, promoUpload.requirements.toTranscode, promoUpload.mediatorTrackTypes);
		
	promoUpload.jobDashboard.updateStatusAndProgress("Succcessfully Uploaded [" + promoUpload.matId + "]",100);		
		
} catch(e) {
		
	print("\nScript Errror [" + e.message + "]\n** Error CleanUp: Attempting to Clean Up **");
	promoUpload.cleanUpFailedJob();
	
	// Log back to Dashboard if possible
	if (promoUpload.jobDashboard) {
		promoUpload.jobDashboard.updateStatus("Fail " + e.message);
	}
	
	throw(e);

} 