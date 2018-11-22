load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_settings.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");

// Functions Specific to Script
var validateAudioStreams = function(sourceObj) {
	var countAudioXmlChannels = function(sourceObject) {
		var xmlObj = sourceObject.parsedxml;
		// Always make sure we start with 0 audio channels
		var audCnt = 0;
		// Go through each track, add up the number of channels specified
		for (var i = 0; i < xmlObj..Tracks.Track.length(); i++) {
			var currAudCnt = xmlObj..Tracks.Track[i].Channels.toString();
			audCnt = audCnt + Number(currAudCnt);
		}
		return audCnt;
	}
	// Get our audio channel count from XML
	var xmlAudioChannels = countAudioXmlChannels(sourceObj);
	// Grab the Contrbution Profile Audio Settings
	if (NBCGMO.contributionProfilesAudioSettings[sourceObj.profile]) {
		var audioSettings = NBCGMO.contributionProfilesAudioSettings[sourceObj.profile];
		print("\nFound Audio Settings from Profile:");
		for (prop in audioSettings){
			print("["+prop+"] : ["+audioSettings[prop]+"]");
		}
		if (debug) show(audioSettings);
	} else {
		throw new Error("Unable to find Audio Settings for Profile ["+sourceObj.profile+"]");
	}
	var audioChannels = 0;
	// Check that each Audio Stream 
	for (var i=0; i<sourceObj.mediainfoxml.track.(@type.toString()==="Audio").length(); i++) {
		audioChannels ++;
		var audioTrack = sourceObj.mediainfoxml.track.(@type.toString()==="Audio")[i];
		print("\nValidating Audio Stream ["+(i+1)+"] out of ["+sourceObj.mediainfoxml.track.(@type.toString()==="Audio").length()+"]");
		if (audioTrack.Codec[0].toString() !== audioSettings.Codec) throw new Error("Codec Mismatch Expected ["+audioSettings.Codec+"] Actual ["+audioTrack.Codec[0].toString()+"]\n"+audioTrack);
		print("\tSuccess Codec is ["+audioSettings.Codec+"]");	
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
		print("\tSuccess Bit Rate is ["+audioSettings.BitRate+"]");
		if (parseInt(audioTrack.Sampling_rate[0].toString()) !== audioSettings.SamplingRate) throw new Error("Sampling Rate MisMatch Expected ["+audioSettings.SamplingRate+"] Actual ["+audioTrack.Sampling_rate[0].toString()+"]\n"+audioTrack);
		print("\tSuccess Sampling Rate is ["+audioSettings.SamplingRate+"]")
		if (parseInt(audioTrack.Resolution[0].toString()) !== audioSettings.Resolution) throw new Error("Resolution MisMatch Excpected ["+audioSettings.Resolution+"] Actual ["+audioTrack.Resolution[0].toString()+"]");
		print("\tSuccess Resolution/Bit Depth is ["+audioSettings.Resolution+"]");
		if (parseInt(audioTrack.Channel_s_[0].toString()) !== audioSettings.ChannelsPerStream) throw new Error("Stream / Channel error Expected [" +audioSettings.ChannelsPerStream + "] Actual [" + audioTrack.Channel_s_[0].toString() + "]");
		print("\tSuccess Stream has ["+ audioTrack.Channel_s_[0].toString() + "] channel(s)");
	}
	output(audioChannels);
	output(xmlAudioChannels);
	if(xmlAudioChannels > audioChannels){
		throw new Error("Audio Channel Count Mis-Match Between Sidecar XML and File:\n" +
						"  XML Contains [" + xmlAudioChannels + "]\n" +
						"  File Contains [" + audioChannels + "]\n" + 
						"Cannot upload with more Track Types defined in the XML than on the File - Please correct XML and retry");
		// We cannot have more track types in mediator than we have on the file 
	}else if(xmlAudioChannels < audioChannels){
		print("\nWe have more audio tracks in he file than specified in the xml");
		gmoNBCFunc.addComment(sourceObj.matid, "Upload", "Audio Channel Count Mis-Match Between Sidecar XML and File:\n" + 
														"  XML Contains [" + xmlAudioChannels + "]\n" +
														"  File Contains [" + audioChannels + "]\n" + 
														"File Has More Audio Channels Than Have Been Supplied In The Sidecar XML");
		// we can have more track types on the file than in mediator but we should log a comment
	}else if(xmlAudioChannels == audioChannels){
		print("\nSidecar and XML match");
		// xml and file match 
	}
	return true;
}

// Function to ensure that Material has the correct Track Type Links
// @param [string] (matId) 
// @param [array] (mediatorTrackTypes) - list of the Track Types that have been mapped from the SideCar Xml 
// @return [boolean] - indicating whether the Material now contains the correct Track Types
var registerOMTrackTypeLinks = function(matId,mediatorTrackTypes,matXml) {
	var missingTrackTypes = [];
						
	// Find difference in Material Track Type Links and Side Car Mapped Track Type Links (could be 0 if it's a retry job)
	for each(var sideCarTrackType in mediatorTrackTypes) {
		if (matXml.TrackTypeLink.(TrackTypeName.toString() === sideCarTrackType).length() === 0) {
			print("\tMaterial does not contain [" + sideCarTrackType + "]");
			missingTrackTypes.push(sideCarTrackType);
		} 
	}

	if (debug) print("SideCarTrackTypes [" + mediatorTrackTypes + "] Missing Track Types [" + missingTrackTypes + "]");

	if (missingTrackTypes.length === 0) {
		print("\nMaterial has all required Track Types no need to register any");
		return true;
	} else {
		var trackTypeSaveXml = <Material/>;
		trackTypeSaveXml.MatId = matId;
	}

	for each (var trackType in missingTrackTypes) {
		if (debug) print("Creating Track Type Link Node for [" + trackType + "]");
		trackTypeSaveXml.appendChild(gmoNBCFunc.createTrackTypeLinkNode(trackType,states.orderPlaced,sourceObj.statemachine)); // Some of these are global vars
	}

	print("\nSaving new TrackTypes [" + trackTypeSaveXml + "]");
	return materialSave(trackTypeSaveXml);
	
}	

// Extract the Track Type from Side Car Xml
// @param  [xml]   - _sidecarxml
// @return [array] - _trackTypes (Containing the Track Types extracted)
// @error - If the Track Type in the XML file cannot be parsed.
var extractTrackTypesFromSideCarXml = function(_obj){
	var _sidecarxml = _obj.parsedxml;
    var _trackTypes = [];
    print("\nAttempting to Extract Track Types from ["+_obj.xmlfile+"]\n");
    
    for (var i=0;i<_sidecarxml.Tracks.Track.length();i++) {
   		var _trackTypeName = _sidecarxml.Tracks.Track[i].Track_Type_Name.toString();
   		var _xmlTrackType  = _sidecarxml.Tracks.Track[i].@type.toString();
   		switch (_xmlTrackType) {
   			// Temorarily ignoring anything besides Video and Audio for the moment
			case "Video":
		  		print("\t"+_xmlTrackType+" [Video]"); 
		  		_trackTypes.push("Video");
		    	break;
		    case "Audio":
		    	print("\t"+_xmlTrackType+" ["+_trackTypeName+"]");
		    	_trackTypes.push(_trackTypeName);
		    	break;
		    case "Captioning":
		    // 	print("\t"+_xmlTrackType+" ["+_trackTypeName+"]");
		    //  	_trackTypes.push(_trackTypeName);

	      	break;
		    case "Subtitle":
		    // 	print("\t"+_xmlTrackType+" ["+_trackTypeName+"]");
		    //  	_trackTypes.push(_trackTypeName);
		      	break;
			case "Component":
		      	break;
		  default:
		        throw new Error("\nUnsure how to parse ["+_xmlTrackType+"] Track Type Name ["+_trackTypeName+"]")
		}
   	}
   	//
   	// Add in a check here to call a function from nbcgmo_fun.js to check that the Track Types are in Mediator!
   	//
   	return _trackTypes;
}

var updateForcedNarrativeLanguageTag = function(_obj) {
	var myLog = function(str) {
		output("updateForcedNarrativeLanguageTag(): " + str);
	};
	
	myLog("Checking if sidecar has a Forced Narrtive Language on the video track type.");
	var _sidecarxml = _obj.parsedxml;
    var fnLanguage 	= _sidecarxml.Tracks.Track.(@type == "Video").Forced_Narrative_Burn_In.Language.toString();
	var fnCode 		= _sidecarxml.Tracks.Track.(@type == "Video").Forced_Narrative_Burn_In.Code.toString();
	var subLanguage = _sidecarxml.Tracks.Track.(@type == "Video").Subtitle_Burn_In.Language.toString();
	var subCode		= _sidecarxml.Tracks.Track.(@type == "Video").Subtitle_Burn_In.Code.toString();
	var _matSaveXml = 	<Material>
							<MatId>{_obj.matid}</MatId>
							<TrackTypeLink>
								<TrackTypeName>Video</TrackTypeName>
								<TagList/>
							</TrackTypeLink>
						</Material>;
	var isSave = false;					
    if (fnLanguage != null && fnLanguage != ""){
		myLog("Updating Forced Narrative Tags to Language: [" + fnLanguage + "] Code: [" + fnCode + "]");
		_matSaveXml.TrackTypeLink.TagList.Tag += gmoNBCFunc.createTagNode("Forced Narrative", fnLanguage);
		_matSaveXml.TrackTypeLink.TagList.Tag += gmoNBCFunc.createTagNode("Forced Narrative Code", fnCode);
		isSave = true;
	}
	if (subLanguage != null && subLanguage != "") {
		myLog("Updating Subtitle Tags to Language: [" + subLanguage + "] Code: [" + subCode + "]");
		_matSaveXml.TrackTypeLink.TagList.Tag += gmoNBCFunc.createTagNode("Subtitle", subLanguage);
		_matSaveXml.TrackTypeLink.TagList.Tag += gmoNBCFunc.createTagNode("Subtitle Code", subCode);		
		isSave = true;
	}
	
	if (isSave) {
		try {
			return materialSave(_matSaveXml);
		} catch (e) {
			throw new Error("Issue updating Forced Narrative/Subtitle Burn in information. Please check that the languages are configured - otherwise escalate to Mediator Support");
		}
	} else {
		return true;
	}
}

// Function to map the TrackTypes in the SideCar Xml to Track Types in Mediator
// @param [array] (xmlTrackTypes) - List of the Xml Track Types which should link to Track Type Groups in Mediator
// *** Optional @param [string/array] (ensureTrackTypes) *** - If used the return array must contain those Track Types
// @return [array]
// @error - If the Track Type Group is Blank - I.e. if the Track Type Group doesn't exist
// @error - If ensureTrackTypes is true and those Track Types aren't found
// @error - If 0 Track Types are found
var getMediatorTrackTypesFromXmlTrackTypes = function(xmlTrackTypes,ensureTrackTypes){
	if (debug) print("\nDEBUG: In getMediatorTrackTypesFromXmlTrackTypes() with XmlTrackType Array ["+xmlTrackTypes+"]");
	// Return
	var trackTypes = [];

	// Loop through Input Array Getting TrackTypeGroup Xml 
	for (var i=0; i<xmlTrackTypes.length;i++) {
		var trackTypeGroupName = sourceObj.xmltracktypes[i];
		print("\nMapping Xml Track Type ["+trackTypeGroupName+"] to Mediator Track Types");
		var trackTypeGroupXml = gmoNBCFunc.trackTypeGroupGet(trackTypeGroupName);
		if (trackTypeGroupXml.TrackType.length()===0) throw new Error("No TrackTypes Defined for Track Type Group [" + trackTypeGroupName + "].\n" +
																	"Are Track Type Links and Track Type Groups Correctly Configured?");
			
		// Extract the Track Type Names from each TrackTypeGroup Get
		for (var j=0; j<trackTypeGroupXml.TrackType.length();j++) {
			print("\tFound Mediator TrackType ["+trackTypeGroupXml.TrackType[j].Name.toString()+"]");
			trackTypes.push(trackTypeGroupXml.TrackType[j].Name.toString());
		}
		
	}
	if (ensureTrackTypes) {
		//If they pass in one item or a string comma seperated list, make it into an array
		if (typeof(ensureTrackTypes) === "string") ensureTrackTypes = ensureTrackTypes.split(",");
		for each (var trackType in ensureTrackTypes) {
			if (trackTypes.indexOf(trackType) === -1) throw new Error("\nCould not find Track Type in final Mediator TrackTypes [" + trackType + "]");
		}

	}
	if (trackTypes.length === 0) throw new Error("Unable to find any Track from Xml Track Types [" + xmlTrackTypes + "]\n" +
												"Are Track Type Links and Track Type Groups Correctly Configured in Mediator?");
	return trackTypes;
}

// Object to house most of the information regarding the current upload. The Video will also transition to Media Received if in Order Placed (Necessary for Error Catching)
// Note this is constantly added to during the script
// @return [object] (Initial properties)
	// matid [string] - Mat Id of the upload
	// safematid [string] - Mat Id of the upload with slashes replaced with underscores
	// matxml [xml] - Material Get of the Material with TrackTypeLinks, Tracks, ShortTexts and Tag options
	// originalfilename [string] - The original Video file name from the Folder Monitor drop
	// originalfilenamenoext [string] - File Name without ".extension"
	// extension [string]-  Extension of the VIDEO file
	// vidfile [string] - Name of the Video File (no path reference)
	// vidpath [string] - Absoloute path and video file name
	// xmlfile [string] - Name of Xml File (no path reference)
	// xmlpath [string] - Absoloute path and xml file name
	// parsedxml [xml] - Side Car Xml in a parsed Xml format
	// mediainfoxml [xml] - Media Info Xml for Main Video File
	// originator [string] - Originator for Import
	// statemachine [string] - State Machine to save the new Track Types into
	// stagingmedia [string] - Name of the Staging Media
// @error - If the Video Track Type is not in Order Placed or Media Received
// @error - If the Video File can't be found
// @error - If the Video File is 0 bytes in length
// @error - If the Xml File can't be found
var buildSourceObj = function() {
	var rtnObj = {};
	// Build the least amount of properties required to transition to Media Received
	rtnObj.matid = matId;
	rtnObj.safematid = gmoNBCFunc.getSafeFileId(rtnObj.matid);
	rtnObj.matxml = materialGet(rtnObj.matid,"trackTypeLinks","tracks","shorttext","tag")..Material;
			
	// Look at the Video State. If the Video is in Order Placed transition to Media Received this is essential to allow the Error Catching to work properly hence why this is run almost immediatly
	// If the Video is not Order Placed (direct from a Folder Monitor) or in Media Received (from a Retry Job) something is very wrong and will require manual intervention
	var videoState = rtnObj.matxml.TrackTypeLink.(TrackTypeName.toString() === trackTypes.video).StateName.toString();
	print("\nValidating current Video State [" + videoState + "] is valid");
	if (videoState === states.orderPlaced || videoState === states.uploadStarted ) {
		gmoNBCFunc.transitionTrackTypes(rtnObj.matid,requirements.toMediaReceived,trackTypes.video);
		print("Transitioned Video Track Type to [" + states.mediaReceived + "] Remaining TrackTypes will follow later...");
	} else if (videoState !== states.mediaReceived) throw new Error("Video State is [" + videoState + "] Video State must be [" + states.orderPlaced + "] or [" + states.mediaReceived + "]");

	// Carry on buliding the Source Obj
	rtnObj.originalfilename = rtnObj.matxml.ShortTextList.ShortText.(ShortTextType.toString()===origFileShortTextType).Value.toString(); 
	rtnObj.originalfilenamenoext = rtnObj.originalfilename.substr(0,rtnObj.originalfilename.lastIndexOf(".")); 
	rtnObj.extension = gmoNBCFunc.getFileExtension(rtnObj.originalfilename); 
	rtnObj.vidfile = rtnObj.originalfilename; 
	rtnObj.vidpath = path + rtnObj.vidfile;
	rtnObj.xmlfile = rtnObj.originalfilenamenoext + "." + extensions.xml; 
	rtnObj.xmlpath = path + rtnObj.xmlfile;  
	if (!fileExists(rtnObj.vidpath)) throw new Error("Cannot find Source File at [" + rtnObj.vidpath + "]");
	if (new File(rtnObj.vidpath).length() === 0) throw new Error("File [" + rtnObj.vidpath + "] length is 0 bytes");
	if (!fileExists(rtnObj.xmlpath)) throw new Error("Cannot find Source File at [" + rtnObj.xmlpath + "]");
	rtnObj.parsedxml = new XML(FileUtils.readFile(rtnObj.xmlpath)); 
	rtnObj.mediainfoxml = gmoNBCFunc.getFileInfoXml(rtnObj.vidpath); 
	rtnObj.mediainfohelper = new MediaInfoHelper();
	rtnObj.mediainfohelper.setMediaInfoXml(rtnObj.mediainfoxml);	
	rtnObj.originator = "GMO OM Upload"; 
	rtnObj.statemachine = "NBC GMO";  

	var dropFolder = "";

	if(rtnObj.matxml.TagList.Tag.(TagType.toString() == "Drop Folder").Value !== "undefined" && rtnObj.matxml.TagList.Tag.(TagType.toString() == "Drop Folder").Value.toString() != "") {
		dropFolder = rtnObj.matxml.TagList.Tag.(TagType.toString() == "Drop Folder").Value.toString();
	} else {
		var dropFolderArr = jobDesc..Path.toString().split("/");
		dropFolder = dropFolderArr[dropFolderArr.length-1];
	}

	if(gmoNBCFunc.isVarUsable(dropFolder) && gmoNBCFunc.isVarUsable(lookup.dropfolder[dropFolder].stagingMedia)){
		rtnObj.stagingmedia = lookup.dropfolder[dropFolder].stagingMedia;
	}else {
		rtnObj.stagingmedia = NBCGMO.omUploadSettings.defaultVideoStagingMedia;
	}

	if(debug) show(rtnObj);
	
	return rtnObj;
}

var registerComponentsFromSideCarXML = function (matId , sidecarXML){
	var trackTypes = sidecarXML..Track.(@type =="Component");
	var thisMaterialHelper = new gmoNBCFunc.materialHelper(matId);
	try{
		for(i=0;i<trackTypes.length();i++){
		    trackTypeName = trackTypes[i].Track_Type_Name.toString();
		    fileName = trackTypes[i].Original_File_Name.toString();
			thisMaterialHelper.addTrackTypeLink(trackTypeName, "Order Placed", "NBC GMO");
			thisMaterialHelper.addTrackTypeLinkShortText(trackTypeName, "Original File Name", fileName);
		}
		print(thisMaterialHelper.saveXml);
		thisMaterialHelper.saveUsingSaveXml();

	}catch(e){
		print("Error Registering Components "+e);
	}
}

// Function to save any MetaData on Material
// @param [object] - sourceObj (Main Object built in OM Script)
// @return [boolean] - indicating whether the save was successful
var saveMetaData = function (sourceObj) {
	// Save Vars
	var matSaveXml = <Material>
						<MatId/>
						<FullTextList/>
						<ShortTextList/>
				    </Material>;
	var	minfoFullTextType = "Media Info Xml";		 
	var duplicateAudioShortText = "Duplicate Audios";
	// Save the MediaInfo Xml
	matSaveXml.MatId = sourceObj.matid;
	matSaveXml.ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(duplicateAudioShortText,sourceObj.duplicatesinsidecar));
	return materialSave(matSaveXml);
}

// Function to update Material Frame Rate - Only Used if the Essence Frame Rate is different
var updateFrameRate = function(matId,frate) {
  return(materialSave(
    <Material>
      <MatId>{matId}</MatId>
      <FrameRate>{frate}</FrameRate>
    </Material>
  ));
}

// Below are 3 functions relating to Duplicate Audio Saves

// Function to save Duplicates Track Types (Build a seperate Command for the CommandList for each Track Type)
// @param  [array] (trackTypeMap)  - containing mapping objects of Track Type Group and Track Type Xmls
// @return [boolean] - if successful
// @error - If any of the seperate Command Saves Fail
var saveDuplicateTrackTypes = function(trackTypeMap) {
	print("\nBuilding up New Track Type Save");
	var saveXml = <PharosCs><CommandList/></PharosCs>;

	// Iterate through Groups
	for each(var trackTypeGroup in trackTypeMap){
		// Drill down to TrackTypes
		for each(var trackTypeToSave in trackTypeGroup.trackTypeXmls) {
			var cmdXml = 
				<Command subsystem="trackType" method="save">
					<ParameterList>
					   	<Parameter name="trackType">
				 		    <Value>
				 		    	{trackTypeToSave}
				 		    </Value>
				 		</Parameter>
				 	</ParameterList>
				 </Command>;
			// Add to Main Xml Save	 
			saveXml.CommandList.appendChild(cmdXml);	
		}
	}

	if (debug) print("\nNew Track Type Save \n " +saveXml);
	// Check of the Individual Commands succeeded
	var res = wscall(saveXml);
	for each(var response in res..Command){
		if(response.@success.toString() === "false") throw new Error("Failed Duplicate Track Type Saves " + saveXml);
	}
	// Successful Save
	return true;
};

// Function to save Duplicates Track Type Groups (Build a seperate Command for the CommandList for each Group that needs saving)
// @param  [array] (trackTypeMap) - containing mapping objects of Track Type Group and Track Type Xmls
// @return [boolean] - if successful
// @error - If any of the seperate Command Saves Fail
var saveDuplicateTrackTypeGroups = function(trackTypeMap) {
	print("\nBuilding up New Track Type Group Save");
	var saveXml = <PharosCs><CommandList/></PharosCs>

	for each(var trackTypeGroup in trackTypeMap){
		var cmdXml = 
			 <Command subsystem="trackType" method="saveTrackTypeGroup">
				<ParameterList>
				   	<Parameter name="trackTypeGroup">
					    <Value>
							<TrackTypeGroup>
								<Name>{trackTypeGroup.groupName}</Name>
								<Description>Group to handle duplicate Audios for {trackTypeGroup.groupName}</Description>
								<TrackTypeList>
									{trackTypeGroup.trackTypeXmls}
								</TrackTypeList>
							</TrackTypeGroup>
					    </Value>
					</Parameter>
				</ParameterList>
			</Command>;

		saveXml.CommandList.appendChild(cmdXml);	
	}
	if(debug) print("\n Track Type Group Save \n" + saveXml);
	// Check of the Individual Commands succeeded
	var res = wscall(saveXml);
	for each(var response in res..Command){
		if(response.@success.toString() === "false") throw new Error("Failed Duplicate Track Type Group Saves " + saveXml);
	}
	// Successful Save
	return true;
}
	
// Function to save duplicate track type links.
// @param [array] (trackTypeArr) - contains the track type names that need to be linked to the material.
// @param [string] (matId) - the material ID to link against.
// @return [array] - The track type names if successful.
// @error - If the wscall to save the track type links against the material fails.
var saveDuplicateTrackTypeLinks = function(trackTypeArr, matId) {
    
    var mhelper = new gmoNBCFunc.materialHelper(matId);
                
    var saved = [];
    
    for each(trackTypeObj in trackTypeArr) {
        
        var name = trackTypeObj.trackTypeXmls..Name.toString();
        
        mhelper.addTrackTypeLink(name,"Order Placed","NBC GMO");
        
        saved.push(name);
    }
    
    mhelper.saveUsingSaveXml();
    
    return saved;
}
    
// Replaces a Character in a String
// @param [string] (s) - String to "change" 
// @param [number] (n)- Position to insert change at (0 based counting)
// @param [char(yes yes JavaScript doesn't do Chars wha wha wha)] (n) - Value to Insert 
function replaceCharAt(s, n, t) {
   	return s.substring(0, n) + t + s.substring(n + 1);
}

// Function to create the associated TrackType Xmls for a new Group
// @param[string] (trackTypeGroup) - Name of the New Group to Create Track Type for (Manipulation occurs in Function to find Parent Values)
// @return [xmllist] - Containing a list of Track Types that need saving for the group
var createNewTrackTypeXmlsFromGroup = function(trackTypeGroup) {
	var parentTrackTypeInt = parseInt(trackTypeGroup.replace(/[^0-9]/g,'')); // Remove any Non Int Values 
	var parentTrackTypeGroupName = trackTypeGroup.replace(/[0-9]/g,'').replace(/ +$/, ""); // Remove any Int Values and additionally any Whitespace
	var parentTrackTypeGroupXml = gmoNBCFunc.trackTypeGroupGet(parentTrackTypeGroupName);
	if (parentTrackTypeGroupXml.length() === 0) throw new Error("Failed to find a Parent Track Type Group for [" + trackTypeGroup + "]");
	var newTrackTypesFromGroupXml = new XMLList();

	for each(var trackType in parentTrackTypeGroupXml.TrackType) {
		var parentTrackTypeName = trackType.Name.toString()
		var newTrackTypeName = parentTrackTypeName  + " " + parentTrackTypeInt;
		print("**** New Track Type [" + newTrackTypeName + "] belongs to Group [" + trackTypeGroup  + "] from Parent Track Type [" + parentTrackTypeName + "] and Parent Track Type Group [" + parentTrackTypeGroupName + "] ****");
		var xml = 
			<TrackType>
				<Name/>
				<ClassName/>
				<FileTag/>
				<Ordinality/>
				<DefaultPosition/>
			 </TrackType>;
			
		xml.Name = newTrackTypeName;
		xml.ClassName = trackType.ClassName.toString();
		xml.FileTag = replaceCharAt(trackType.FileTag.toString(),2,parentTrackTypeInt);
		xml.Ordinality = trackType.Ordinality = 1;
		xml.DefaultPosition = 1;
		// Only add language if it exists (i.e. not 0)
		if (parseInt(trackType.LanguageId) !== 0) {
			xml.appendChild(<LanguageId>{trackType.LanguageId.toString()}</LanguageId>);
		}
		// Add to Xml List of Track Types from Group
		newTrackTypesFromGroupXml += xml;	
	}
	return newTrackTypesFromGroupXml;
}

// Function to ensure that Duplicate Audios are successfully handled - New Track Types and Track Type Grouops are created if necessary
// @param [array] (sideCarXmlAudios)
// @param [string] (materialId)
// @return [boolean] - Indicating whether it was successful 
// @error (Individual errors will occur in the seperate functions if a fail occurs)
var unmuddlePossibleDuplicateAudios = function(sideCarXmlAudios,materialId) {
	var trackTypeGroupArr = [];
    var saveTTLArr = [];
	print("\nChecking to see if Unregistered Duplicate Audios are contained in Side Car");
	var duplicatesInSideCar = "false";
	var previouslyUpdated = false;
	// Loop through each of the TrackType Groups an array of Object to be used for Track Type and Track Type Group Saves
	for each(var trackTypeGroup in sideCarXmlAudios) {
		var isDuplicateGroup = /\d+$/.test(trackTypeGroup) === true; // Check if Track Type Group Ends in an Integer
		var trackTypeGroupRegistered = gmoNBCFunc.trackTypeGroupGet(trackTypeGroup).length() === 1;
		print("\nTrackTypeGroup [" + trackTypeGroup + "] Is Duplicate? [" + isDuplicateGroup + "] TrackTypeGroup Registered [" + trackTypeGroupRegistered + "]");
		// Update a flag so it can be saved later
		if (isDuplicateGroup && (previouslyUpdated == false)) {
			duplicatesInSideCar = "true";
		}
		// Work Out if it's necessary to make new Track Types and corresponding Groups
		if (isDuplicateGroup) {
            
            var ttObj = {"groupName" : trackTypeGroup,"trackTypeXmls" : createNewTrackTypeXmlsFromGroup(trackTypeGroup)};
            
            if(trackTypeGroupRegistered === false) {
            
                print("Creating New Track Types for Group [" + trackTypeGroup + "]");
                trackTypeGroupArr.push(ttObj);
            
            }
            
            saveTTLArr.push(ttObj);
		}
	}
	// Were any duplicates found?
	if (trackTypeGroupArr.length > 0) {
		// New Track Type Save
		var trackTypesSaved = saveDuplicateTrackTypes(trackTypeGroupArr);
		print("New Track Types Successfully Saved [" + trackTypesSaved + "]");
		// New Track Type Group Save
		var trackTypeGroupsSaved = saveDuplicateTrackTypeGroups(trackTypeGroupArr);
		print("New Track Groups Successfully Saved [" + trackTypeGroupsSaved + "]");
		// Need to Update the Blades Local Caache
		var cacheUpdated = publishTrackTypeGroupsAndProfile();
		print("Track Type Cache Updated Successfully [" + cacheUpdated + "]");
        
	} else {
		print("No Duplicates found");
	}
    
    if(saveTTLArr.length > 0) {
        
        var trackTypeLinksSaved = saveDuplicateTrackTypeLinks(saveTTLArr,materialId);
        print("Track Type Links Successfully Saved [" + trackTypeLinksSaved + "]");
        
    }
    
	return {"success" : true, "hasduplicates" : duplicatesInSideCar};
}

// Function to Publish Track Type Groups. Sadly necessary
var publishTrackTypeGroupsAndProfile = function() {
	print("\nPublish Track Type Groups and Profiles to update Cache");
	var res = wscall(<PharosCs>
					  <CommandList>
						<Command subsystem="serviceManager" method="publishConfig">
						  <ParameterList>
							<Parameter name="configurationSubsystem">
							  <Value>
								<ConfigurationSubsystem>
								  TrackTypeGroupsAndProfiles
								</ConfigurationSubsystem>
							  </Value>
							</Parameter>
						  </ParameterList>
						</Command>
					  </CommandList>
					</PharosCs>);
	if (res..Command.@success.toString() === "false") {
		throw new Error("Failed to update Track Type Cache via Publish");
	} else {
		return true;
	}				
					
}

//////////////////////////////////////////////////////////////////////////////    Start of Script   ////////////////////////////////////////////////////////////////////// 
try { 

	print("\nStarting run_gmoOMUpload.js");
	
	// Global Script Vars 
	var debug = false;
	var sourceObj = {}; // Need to define explicity and early in case of error catching. Avoids cannot read undefined (property) from undefined (object) - leads to js error
	var validVidExts = ["mov"];
	var dotDir = ".dir/";
	var isRetryJob = false;	
	//var stagingMedia = NBCGMO.omUploadSettings.defaultVideoStagingMedia;
	var origFileShortTextType = "Original File Name";
	
	var jobDesc = getJobParameter("jobDescription");
	print("\nJobDesc\n"+jobDesc+"]");
	
	var priority = false;
	
	if (jobDesc..Priority !== "undefined" && jobDesc..Priority != "") {
		if(jobDesc..Priority.toString() == "true") {
			priority = true;
		}
	}

	var cleanUpBools = {
		deletetrack : false,
		filenamechange : false
	};	

	var requirements = {
		toMediaReceived : "Upload",
		toOMUploadFailed : "Failed",
		toQCRequired : "Transcode",
		toQCRequiredPriority : "Transcode (Priority)"
	};

	var trackTypes = {
		video : "Video"
	}

	var states = {
		orderPlaced : "Order Placed",
		mediaReceived : "Media Received",
		uploadStarted : "Upload Started"
	};

	var extensions = {
		mov : "mov",
		xml : "xml"
	};
	var omUploadCommentType = "OM Upload";
	var videoTrackTypeName = "Video"

	// This could be a Job Created from a Folder Monitor or else from a Retry Job. Either way the Job Descriptions will be different so run tests to workout the Mat Id
	var matId; // Final Var to be used for the MatId
	var filePath; // Final Var to be used for the path to where the file is
	var folderMonMatId = jobDesc..FolderMonitorMatId.toString();
	var retryMatId = jobDesc..domainKey.toString();
	print("\nFolderMonitor MatId [" + folderMonMatId + "] Retry MatId [" + retryMatId + "]");
	
	var studioPostFolderArr = "";
	var studioPostFolder = "";
		
	if (folderMonMatId && retryMatId) {
		throw new Error("Cannot decide which MatId to use. FolderMonitorMatId has value [" + folderMonMatId + "] Retry MatId has value [" + retryMatId + "]");
	} else if (folderMonMatId) {
		matId = folderMonMatId;
	} else if (retryMatId) {
		matId = retryMatId;
	} else {
		throw new Error("Cannot find a MatId from Job Description");
	}
	var materialHelper = new gmoNBCFunc.materialHelper(matId); // Tidy Up script to make use of Material Helper when time permits	
	
	//Check if job this is a duplicate job 
	if (materialHelper.getStateOfTtl("Video") != states.orderPlaced && materialHelper.getStateOfTtl("Video") != states.uploadStarted) {
		print("Job is a duplicate or material is not in Vantage Transcode Required, Exiting this Job.");
		quit(0);
	}
	var dropFolderMat = materialGet(matId,"tag")..Material;
	
	if(dropFolderMat.TagList.Tag.(TagType.toString() == "Drop Folder").Value !== "undefined" && dropFolderMat.TagList.Tag.(TagType.toString() == "Drop Folder").Value.toString() != "") {
		studioPostFolder = dropFolderMat.TagList.Tag.(TagType.toString() == "Drop Folder").Value.toString();
		studioPostFolderPath = lookup.dropfolder[studioPostFolder].mount;
	} else {
		studioPostFolderArr = jobDesc..Path.toString().split("/");
		studioPostFolder = studioPostFolderArr[studioPostFolderArr.length-1];
	}
	
	var studioPostFolderPath = lookup.dropfolder[studioPostFolder].mount
	var failedFolder = studioPostFolderPath + "failed/OMRunner/";
	
	if (folderMonMatId) {
		path = studioPostFolderPath;
	} else if (retryMatId) {
		path = failedFolder;
		isRetryJob = true;		
	} else {
		throw new Error("Cannot find a MatId from Job Description");
	}

	print("\nRunning OMUpload Job for [" + matId + "] Job is a retry? [" + isRetryJob + "] therefore file will be in [" + path + "] \nBuilding Main Source Object");
	sourceObj = buildSourceObj();
	print("\tSuccessfully built Source Object");

	// Create a Dashboard Updater Object
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",10);
	jobDashboard.updateStatusMap({"Script_Priority":priority});
	jobDashboard.updateStatusMap({"Script_MatId":sourceObj.matid});
	jobDashboard.updateStatusMap({"Script_FileName":sourceObj.vidfile});

	// Extract Track Type from Side Car Xml
	sourceObj.xmltracktypes = extractTrackTypesFromSideCarXml(sourceObj);
	print("\n\nXML Track Types ["+sourceObj.xmltracktypes+"] \nAttempting to Map Xml Track Types to Mediator Track Types");
	
	var handlePotentialDuplicates = unmuddlePossibleDuplicateAudios(sourceObj.xmltracktypes, matId);
	print("\nPossible Duplicate Audios Handled ? [" + handlePotentialDuplicates.success + "]");
	sourceObj.duplicatesinsidecar = handlePotentialDuplicates.hasduplicates;

	// Map Side Car TrackTypes to Mediator Track Types (A mapping will most likely be required)
	sourceObj.mediatortracktypes = getMediatorTrackTypesFromXmlTrackTypes(sourceObj.xmltracktypes,trackTypes.video);
	print("\n######### Mediator Mapped Track Types ########\n\t["+sourceObj.mediatortracktypes+"]");

	// Ensure Material has correct Track Type links
	print("\nEnsuring Material Track Types match Side Car Track Types");
	var trackTypesHarmonised = registerOMTrackTypeLinks(sourceObj.matid,sourceObj.mediatortracktypes,sourceObj.matxml);
	if (!trackTypesHarmonised) throw new Error("Failed to save new Track Types Links");
	print("\nMaterial Track Types now harmonised against Side Car Track Types");

	// Transition the Track Types that have been mapped to Media Received
	gmoNBCFunc.transitionTrackTypes(sourceObj.matid,requirements.toMediaReceived,sourceObj.mediatortracktypes);
	
	registerComponentsFromSideCarXML(sourceObj.matid,sourceObj.parsedxml);
	
	// Update the Forced Narrative tag to the value in the Sidecar XML
	updateForcedNarrativeLanguageTag(sourceObj);
	// Check no Track exists on the Staging Media
	if (sourceObj.matxml.Track.(MediaName.toString()===sourceObj.stagingmedia && parseInt(DeleteMark) === 0 ).length() !== 0 && !isRetryJob) {
		throw new Error("Material [" + sourceObj.matid + "] already has a track on [" + sourceObj.stagingmedia + "]");
	}

	// Run Profile Checking
	for (var i=0; i<NBCGMO.contributionProfileGroups.HouseProfiles.length; i++) {
		var profile = NBCGMO.contributionProfileGroups.HouseProfiles[i];
		var profileObj = NBCGMO.contributionProfiles[profile]; 
		print("\nChecking to see if file ["+sourceObj.vidfile+"] matches the following profile ["+profile+"]");
		if (gmoNBCFunc.runProfileValidation(sourceObj.mediainfoxml,profile)) {
			sourceObj.profile = profile;
			break;
		}
	}

	// Check a Profile has been found for file
	if (sourceObj.profile) {
		print("\nSuccess File [" + sourceObj.vidfile + "] matches Profile [" + sourceObj.profile + "]");
		jobDashboard.updateStatusMap({"Script_Profile":sourceObj.profile});	
	} else {
		gmoNBCFunc.sendCustomEmail(NBCGMO.systemFailureEmailList, "OM Upload - Profile Validation Failure", "The Material failed ["+sourceObj.matid+"] Profile Validation");
		throw new Error("Failed to find a Valid Profile for file [" + sourceObj.vidfile +"]");
	}

	// Validate the Audio Streams
	print("\nValidating Audio Streams");
	var audioStreamsValidated = validateAudioStreams(sourceObj);
	if (!audioStreamsValidated) throw new Error("Failed to Validate Audio Streams");
	print("\nAudio Streams Validated");

	// Get Media Information and Path Information
	//sourceObj.stagingmedia = stagingMedia;
	sourceObj.stagingmediadir = lookup.media[sourceObj.stagingmedia].mount;
	sourceObj.stagingmediafileandpath = lookup.media[sourceObj.stagingmedia].usesMatIdDir ? sourceObj.stagingmediadir  + sourceObj.safematid + dotDir + sourceObj.safematid + "." + sourceObj.extension : sourceObj.stagingmediadir + sourceObj.safematid + "." + sourceObj.extension;
	
	// Check that Video File is structurally sound
	print("\nExamining Essence for Incode/Outcode/Duration");
	if (sourceObj.extension === extensions.mov) { 
		sourceObj.timecodedata = gmoNBCFunc.getMovTimeCodes(sourceObj.vidpath, sourceObj.mediainfohelper.getFrameRate());
		sourceObj.timecodedata.frame_rate = sourceObj.mediainfohelper.getFrameRate();
		print("\nEssence Examined for Structural Integrity \n\tIncode [" + sourceObj.timecodedata.incode + "]\n\tDuration [" + sourceObj.timecodedata.duration + "]\n\tOutcode [" + sourceObj.timecodedata.outcode + "]\n\tTimeCode Stream Index [" + sourceObj.timecodedata.tcindex + "] \n\tFrame Rate [" + sourceObj.timecodedata.frame_rate + "]");
		// Update Material Frame Rate if it's different
		if (sourceObj.matxml.FrameRate.toString() !== String(sourceObj.timecodedata.frame_rate)) {
			print("\nUpdating Shell Frame Rate to [" + sourceObj.timecodedata.frame_rate + "]");
			var frameRateMatched = updateFrameRate(sourceObj.matid,sourceObj.timecodedata.frame_rate);
			if (!frameRateMatched) throw new Error("Failed to update Material Frame Rate");
		}
	} else {
		throw new Error("Currently Unable to deal with File Extension ["+sourceObj.extension+"]");
	}

	// Check Source File exists in drop folder
	if (!fileExists(sourceObj.vidpath) || !fileExists(sourceObj.xmlpath)) {
	 	throw new Error("Error cannot find one of the following [" + sourceObj.vidpath + "] or [" + sourceObj.xmlpath + "]");
	}

	// Unencoded Storage Track
	jobDashboard.updateStatusAndProgress("Saving Encoded Storage Track",45);
	jobDashboard.updateStatusMap({"Script_StagingMedia":sourceObj.stagingmedia});
	var unencodedStorageTrack = gmoNBCFunc.complexUnencodedTrackSave(
		sourceObj.matid,                    // MatId
		sourceObj.stagingmedia,             // Media Name
		sourceObj.timecodedata.frame_rate,  // Frame Rate
		sourceObj.timecodedata.incode,      // Incode
		sourceObj.timecodedata.outcode      // Outcode
	);
	cleanUpBools.deletetrack = true;

	// Check File doesn't exist in Staging Folder
	jobDashboard.updateStatusAndProgress("Saving Unencoded Staging Track",60);
	if (fileExists(sourceObj.stagingmediafileandpath)) {
		throw new Error("\nError File already exists in Staging Folder [" + sourceObj.stagingmediafileandpath + "]");
	}

	// Drop Folder to Staging Media is a Move. Therefore need the ".dir" directory to exist
	if (lookup.media[sourceObj.stagingmedia].usesMatIdDir) {
		var stagingDir = lookup.media[sourceObj.stagingmedia].mount + sourceObj.safematid + dotDir;
		print("\nCreating Directory [" + stagingDir + "]");
		makedir(stagingDir);
		if (!fileExists(stagingDir)) throw new Error("\nFailed to create Staging Directory at [" + stagingDir + "]");
	}

	// Move File
	jobDashboard.updateStatusAndProgress("Moving [" + sourceObj.vidpath + "] to [" + sourceObj.stagingmediafileandpath + "]",70);
	print("\nMoving Drop Folder File [" + sourceObj.vidpath + "] to [" + sourceObj.stagingmediafileandpath + "]");
	move(sourceObj.vidpath,sourceObj.stagingmediafileandpath);
	cleanUpBools.filenamechange = true; // If a fail occurs be aware file name will now have changed
	
	//Check File Exists
	if (fileExists(sourceObj.stagingmediafileandpath)) {
		print("\nMove Successful");
	} else {
		throw new Error("\nError Move failed. Cannot see file at [" + sourceObj.stagingmediafileandpath +"]");
	}

	// Save Encoded Staging Track
	jobDashboard.updateStatusAndProgress("Saving Encoded Staging Track",80);
	var sourceTrackTypes = <TrackTypes></TrackTypes>;

	sourceTracks = new XMLList();
	sourceTracks = <TrackType>
					<TrackTypeName>Video</TrackTypeName>
			</TrackType>
	for each (var track in sourceObj.parsedxml..Tracks.Track){
		
		var trackTypeGroupXml = gmoNBCFunc.trackTypeGroupGet(track.Track_Type_Name.toString());
		if (trackTypeGroupXml.TrackType.length()===1){
			sourceTracks += <TrackType>
					<TrackTypeName>{track.Track_Type_Name.toString()}</TrackTypeName>
					<Channels>{track.Channels.toString()}</Channels>
					<Position>{track.Position.toString()}</Position>
				</TrackType>
		}else {
			for (var j=0; j<trackTypeGroupXml.TrackType.length();j++) {
				print("\tFound Mediator TrackType ["+trackTypeGroupXml.TrackType[j].Name.toString()+"]");
				sourceTracks += <TrackType>
					<TrackTypeName>{track.Track_Type_Name.toString()}</TrackTypeName>
					<Channels>2</Channels>
					<Position></Position>
				</TrackType>
			}
		}
	}
	
	sourceTrackTypes.TrackTypes = sourceTracks;
	print(sourceTracks);
	var encodedStorageTrack =  gmoNBCFunc.complexEncodedTrackSave(
		sourceObj.matid,                    // MatId
		sourceObj.stagingmedia,             // Media Name
		sourceObj.timecodedata.frame_rate,  // Frame Rate
		sourceObj.timecodedata.incode,      // Incode
		sourceObj.timecodedata.outcode,     // Outcode
		sourceObj.stagingmediafileandpath,  // Path to Src File 
		sourceObj.mediatortracktypes,       // Track Types
		sourceObj.profile,                  // Profile
		sourceTrackTypes
	);
	// Save MetaData
	var metaDataSaved = saveMetaData(sourceObj);
	if (!metaDataSaved) throw new Error("Failed to save Metadata on Material");
	
	// Echo out Side Car Xml
	print("\nPrinting Side Car Xml for the record \n\n" + sourceObj.parsedxml);
	
	if(priority) {
		// Transistion Track Types to Priority QC Required
		gmoNBCFunc.transitionTrackTypes(sourceObj.matid,requirements.toQCRequiredPriority,sourceObj.mediatortracktypes);
	}
	else {
		// Transistion Track Types to QC Required
		gmoNBCFunc.transitionTrackTypes(sourceObj.matid,requirements.toQCRequired,sourceObj.mediatortracktypes);
	}
	
	// Delete Side Car Xml
	print("\nRemoving SideCar Xml [" + sourceObj.xmlpath + "]");
	remove(sourceObj.xmlpath);
	
	jobDashboard.updateStatusAndProgress("Finished Script",100);

}catch(e){
	// Clean Up - the order this is done is important don't change without thinking about the consequences
	// 1 Move file(s) to failed directory
	// 2 Delete Track if necessary (Proxy will automatically delete the .dir) 
	// 3 Transition Track Types to OM Upload Failed
	print("\n"+e.message);
	gmoNBCFunc.addComment(matId,omUploadCommentType,"Error During Upload : " +e.message, videoTrackTypeName);

	// Step 1.1 Move Vid File
	var failedVidFilePath = failedFolder + sourceObj.vidfile;
	
	if (fileExists(sourceObj.vidpath) && sourceObj.vidfile) {
		print("\nError CleanUp: Moving  [" + sourceObj.vidpath + "] to [" + failedVidFilePath + "]");
		move(sourceObj.vidpath,failedVidFilePath);
		if (fileExists(failedVidFilePath)) {
			print("File Moved Successfully to [" + failedVidFilePath + "]");
		} else {
			print("Error File cannot be found at [" + failedVidFilePath + "]");
		}
	} else if (fileExists(sourceObj.stagingmediafileandpath)) {
		print("\nError CleanUp: Moving  [" + sourceObj.stagingmediafileandpath + "] to [" + failedVidFilePath + "]");
		move(sourceObj.stagingmediafileandpath,failedVidFilePath);
		if (fileExists(failedVidFilePath)) {
			print("File Moved Successfully to [" + failedVidFilePath + "]");
		} else {
			print("Error File cannot be found at [" + failedVidFilePath + "]");
		}
	} else {
		// This should never occur. If it does something has gone badly wrong!!
		print("\nError Cleanup: Severe Error cannot locate Video File or Vid File is undefined. Manual intervention needed to fix");
		cleanUpBools.deletetrack = false; // No sure where the file is so leave alone
	}

	// Step 1.2 Move Xml File
	var failedXmlFilePath = failedFolder + sourceObj.xmlfile; 

	if (fileExists(sourceObj.xmlpath) && sourceObj.xmlfile) {
		print("\n Error CleanUp: Moving [" + sourceObj.xmlpath + "] to [" + failedXmlFilePath + "]");
		move(sourceObj.xmlpath,failedXmlFilePath);
		if (fileExists(failedXmlFilePath)) {
			print("File Moved Successfully to [" + failedXmlFilePath + "]");
		} else {
			print("Error File cannot be found at [" + failedXmlFilePath + "]");
		}
	} else { 
		print("\nError Cleanup: Severe Error cannot locate Xml File or Xml File is undefined. Manual intervention needed to fix");
	}

	// Step 2 Delete Track if necessary
	if (cleanUpBools.deletetrack) { 
		print("\nError CleanUp: Deleting Track for Material [" + matId + "] on Media [" + sourceObj.stagingmedia + "]");
		gmoNBCFunc.materialTrackDelete(matId,sourceObj.stagingmedia);
	}

	// Step 3 Work Flow
	// Remember if the Track is deleted (and therefore no Tracks exist for Material) the Track Types will transition to Not Available. Need the StateMachine to cater for this
	sleep(2); // Give the chance for the Second to change for the StateHistory
	if (typeof(sourceObj.mediatortracktypes) === "undefined") {
		print("\nError CleanUp: sourceObj.mediatortracktypes is undefined. Will soley transition Video with Requirement [" + requirements.toOMUploadFailed + "]");
		gmoNBCFunc.transitionTrackTypes(matId,requirements.toOMUploadFailed,"Video"); // Using matId var in case sourceObject has not been built by this point
	} else {
		print("\nError CleanUp: Transitioning [" + sourceObj.mediatortracktypes +"] with requirement [" + requirements.toOMUploadFailed + "]");
		gmoNBCFunc.transitionTrackTypes(sourceObj.matid,requirements.toOMUploadFailed,sourceObj.mediatortracktypes);
	}
	
	// Yell	to Front End
	if (typeof(jobDashboard) !== "undefined") {
		jobDashboard.updateStatus(e.message);	
	}
	throw(e);
}	