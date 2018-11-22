/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-31 22:32:12
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2018-04-04 13:09:02
*/

function UploadHelper () {

	if ((this instanceof UploadHelper) === false) {
		throw new Error("Please call constructor with new() keyword");
	}

	if(typeof(wscall)==="undefined"){
		print("Loading ShellFun js ")
		load("/opt/evertz/mediator/lib/js/shellfun.js");	
	}

	if(typeof(gmoNBCFunc)==="undefined"){
		print("Loading gmoNBCFunc js ")
		load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");	
	}
	
	if(typeof(MediaInfoHelper)==="undefined"){
		print("Loading MediaInfoHelper js ")
		load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");
	}
	if(typeof(NBCGMO_CONSTANTS)==="undefined"){
		load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")		
	}  

}

UploadHelper.prototype.constructor = UploadHelper;


UploadHelper.prototype.initializeAndSetVariables = function(matId,uploadType,isRetry,uploadPath){
	
	this.setUploadType(uploadType); 
	this.setMatId(matId);
	this.setIsRetry(isRetry);
	this.setUploadFilePath(uploadPath);

	var dropFolder = this.getDropFolder();

	this.getMaterialHelper().saveTagValue("Drop Folder", dropFolder);

	if(gmoNBCFunc.isVarUsable(dropFolder) && gmoNBCFunc.isVarUsable(lookup.dropfolder[dropFolder].stagingMedia)){
		var stagingMedia = lookup.dropfolder[dropFolder].stagingMedia;
	}else {
		var stagingMedia = NBCGMO.omUploadSettings.defaultVideoStagingMedia;
	}

	this.setStagingMedia(stagingMedia);
}

/**
 * [UploadStates]
 * @type {Object}
 */
UploadHelper.prototype.UploadStates = {
	orderPlaced : "Order Placed",
	mediaReceived : "Media Received",
	uploadStarted : "Upload Started"
}

/**
 * [UploadStateMachine]
 * @type {String}
 */
UploadHelper.prototype.UploadStateMachine = "NBC GMO";

/**
 * [UploadRequirements]
 * @type {Object}
 */
UploadHelper.prototype.UploadRequirements = {
	toMediaReceived : "Upload",
	toOMUploadFailed : "Failed (OM)",
	toTranscode : "Transcode",
	toTranscodePriority : "Transcode (Priority)",
	toQCRequired : "Complete"
}

/**
 * [log]
 * @param  {[String]} functionName [Calling Function]
 * @param  {[String]} message      [Message to be Logged]
 */
UploadHelper.prototype.log = function (functionName, message)  {
	print("UploadHelper # " + functionName + " : " + message);
};

/**
 * [setUploadType Setters For uploadType ]
 * @param {[String]} uploadType 
 */
UploadHelper.prototype.setUploadType = function (uploadType)  {
	this.__uploadType = uploadType;
	this.log("setUploadType", "__uploadType ["+this.__uploadType+"]")
}

/**
 * [setMatId Setters For matId]
 * @param {[String]} matId [Material Identifier]
 */
UploadHelper.prototype.setMatId = function(matId){
	this.__matId = matId;
	this.log("setMatId", "__matId ["+this.__matId+"]")
}

/**
 * [getMatId Getters For matId]
 * @return {[String]} [Material Identifier]
 */
UploadHelper.prototype.getMatId = function(){
	return this.__matId;
}

/**
 * [setUploadFilePath Setters for uploadFilePath]
 * @param {[String]} uploadFilePath
 */
UploadHelper.prototype.setUploadFilePath = function(uploadFilePath){
	this.__uploadFilePath = uploadFilePath;
	this.log("setUploadFilePath", "__uploadFilePath ["+this.__uploadFilePath+"]")
}

/**
 * [getUploadFilePath Getters For uploadFilePath]
 * @return {[String]}
 */
UploadHelper.prototype.getUploadFilePath = function(){
	return this.__uploadFilePath;
}

/**
 * [setIsRetry Setters For isRetry ]
 * @param {[boolean]} retry 
 */
UploadHelper.prototype.setIsRetry = function(retry){
	this.__isRetry = retry;
}

/**
 * [isRetry Is Material Upload Retry ]
 * @param {[boolean]} retry 
 */
UploadHelper.prototype.isRetry = function(){
	return this.__isRetry; 
}


/**
 * [setStagingMedia Setters For stagingMedia ]
 * @param {[String]} stagingMedia 
 */
UploadHelper.prototype.setStagingMedia = function(stagingMedia){
	this.__stagingMedia = stagingMedia;
	this.log("setStagingMedia", "__stagingMedia ["+this.__stagingMedia+"]")
}

/**
 * [getStagingMedia Getters For stagingMedia]
 * @return {[String]} 
 */
UploadHelper.prototype.getStagingMedia = function(){
	return this.__stagingMedia;
}

/**
 * [setHouseProfile  Setters For houseProfile]
 * @param {[String]} houseProfile 
 */
UploadHelper.prototype.setHouseProfile = function(houseProfile){
	this.__houseProfile = houseProfile;
	this.log("setHouseProfile", "__houseProfile ["+this.__houseProfile+"]")
}

/**
 * [getHouseProfile Getters For houseProfile]
 * @return {[String]} 
 */
UploadHelper.prototype.getHouseProfile = function(){
	return this.__houseProfile;
}

/**
 * [getMaterialHelper ]
 * @param  {Boolean} isRefreshMaterialHelper 
 * @return {[MaterialHelper]}                 
 */
UploadHelper.prototype.getMaterialHelper = function(isRefreshMaterialHelper){
	if(!gmoNBCFunc.isVarUsable(this.__materialHelper) || isRefreshMaterialHelper){
		this.__materialHelper = new gmoNBCFunc.materialHelper(this.getMatId());
	}
	return this.__materialHelper;
}

/**
 * [getMaterialXml]
 * @return {[Xml]} 
 */
UploadHelper.prototype.getMaterialXml = function(){
	this.__materialXml = this.getMaterialHelper().getMaterialXml()..Material;
	return this.__materialXml;
}

/**
 * [getFileName]
 * @return {[String]} 
 */
UploadHelper.prototype.getFileName = function(){
	if(!gmoNBCFunc.isVarUsable(this.__fileName)){
		this.__fileName = this.getMaterialXml().ShortTextList.ShortText.(ShortTextType.toString()==="Original File Name").Value.toString()
	}
	if(debug) this.log("getFileName", "__fileName ["+this.__fileName+"]")
	return this.__fileName;
}

/**
 * [getExtension]
 * @return {[String]} 
 */
UploadHelper.prototype.getExtension = function(){
	return gmoNBCFunc.getFileExtension(this.getFileName()); 
}
/**
 * [getUploadFilePathWithFileName ]
 * @return {[String]}
 */
UploadHelper.prototype.getUploadFilePathWithFileName= function(){
	return this.getUploadFilePath() + "/" + this.getFileName(); 
}

/**
 * [getDropFolder]
 * @param  {Boolean} isRetry 
 * @return {[String]}       
 */
UploadHelper.prototype.getDropFolder = function(){
	if(this.isRetry()){
		var dropFolder = this.getMaterialXml().TagList.Tag.(TagType.toString() == "Drop Folder").Value.toString();
	}else{
		var pathSplitAsFoldersInArray = this.getUploadFilePath().split("/");
		var dropFolder = pathSplitAsFoldersInArray[pathSplitAsFoldersInArray.length-1];
	}
	return dropFolder;
}

/**
 * [getDropFolderPath]
 * @param  {Boolean} isRetry 
 * @return {[String]}       
 */
UploadHelper.prototype.getDropFolderPath = function(){
	var dropFolder = this.getDropFolder();
	if(this.isRetry()){
		var dropFolderPath = lookup.dropfolder[dropFolder].mount + "failed/OMRunner/";
	}else{
		var dropFolderPath = lookup.dropfolder[dropFolder].mount;
	}
	return dropFolderPath;
}

/**
 * [getMediaInfoHelper]
 * @param  {Boolean} isRefreshMediaInfoHelper 
 * @return {[MediaInfoHelper]}                       
 */
UploadHelper.prototype.getMediaInfoHelper = function(isRefreshMediaInfoHelper){
	var functionName = "getMediaInfoHelper";
	this.log(functionName,"Start");
	if(!gmoNBCFunc.isVarUsable(this.__mediaInfoHelper) || isRefreshMediaInfoHelper){
		this.__mediaInfoHelper = new MediaInfoHelper();
		this.__mediaInfoHelper.setSourceFile(this.getUsefulDropFolderFileObj());
	}else {
		this.log(functionName,"Just Returning Existing MediaInfo Helper");
	}
	this.log(functionName,"End");
	return this.__mediaInfoHelper;
}

/**
 * [getTimecode ]
 * @return {[Object]} 
 */
UploadHelper.prototype.getTimecode = function(){
	if(!gmoNBCFunc.isVarUsable(this.__timecode)){
		if (this.getExtension() === "mov") { 
			this.__timecode = gmoNBCFunc.getMovTimeCodes(this.getUsefulDropFolderFileObj().unix_file, this.getMediaInfoHelper().getFrameRate());
			this.__timecode.frame_rate = this.getMediaInfoHelper().getFrameRate();
			print("\nEssence Examined for Structural Integrity \n\tIncode [" + this.__timecode.incode + "]\n\tDuration [" + this.__timecode.duration + "]\n\tOutcode [" + this.__timecode.outcode + "]\n\tTimeCode Stream Index [" + this.__timecode.tcindex + "] \n\tFrame Rate [" + this.__timecode.frame_rate + "]");
		}else{
			throw new Error("Currently Unable to deal with File Extension ["+this.getExtension()+"]");
		}
	}
	return this.__timecode;
}

/**
 * [saveFrameRate ]
 * @return {[Boolean]}
 */
UploadHelper.prototype.saveFrameRate = function(){
	return(materialSave(
    <Material>
      <MatId>{this.getMatId()}</MatId>
      <FrameRate>{this.getMediaInfoHelper().getFrameRate()}</FrameRate>
    </Material>
  ));
}

/**
 * [getUsefulDropFolderFileObj]
 * @return {[Object]}
 */
UploadHelper.prototype.getUsefulDropFolderFileObj = function(){
	var functionName = "getUsefulDropFolderFileObj";
	this.log(functionName,"Start");
	var dropFolderWithfileName = this.getDropFolderPath() + this.getFileName();
	this.log(functionName,"End");
	return new gmoNBCFunc.usefulFileObj(dropFolderWithfileName);
}

/**
 * [getUsefulStagingFileObj]
 * @return {[Object]} []
 */
UploadHelper.prototype.getUsefulStagingFileObj = function(){
	var functionName = "getUsefulStagingFileObj";
	this.log(functionName,"Start");
	var stagingMedia = lookup.media[this.getStagingMedia()];
	var stagingPath = stagingMedia.mount;
	var stagingPathWithFileName;
	if(stagingMedia.usesMatIdDir){
		stagingPathWithFileName = stagingPath + this.getMatId() + ".dir" + "/" + this.getMatId() + "." + this.getExtension();
	}else{
		stagingPathWithFileName = stagingPath  + this.getMatId() + "." + this.getExtension();
	}
	this.log(functionName,"End");
	return new gmoNBCFunc.usefulFileObj(stagingPathWithFileName);
}

/**
 * [evaluateMatchedHouseProfile]
 * @return {[String]}
 */
UploadHelper.prototype.evaluateMatchedHouseProfile = function(){
	var functionName = "evaluateMatchedHouseProfile";
	this.log(functionName,"Start");
	var mediaInfoHelper = this.getMediaInfoHelper();
	var houseProfile;

	for (var i=0; i<NBCGMO.contributionProfileGroups.HouseProfiles.length; i++) {
		var profile = NBCGMO.contributionProfileGroups.HouseProfiles[i];
		this.log(functionName , "Checking to see if file ["+this.getFileName()+"] matches the following profile ["+profile+"]");
		if (gmoNBCFunc.runProfileValidation(mediaInfoHelper.getMediaInfoXml(),profile)) {
		    houseProfile = profile;
			break;
		}
	}
	this.setHouseProfile(houseProfile);
	this.log(functionName,"End");
	return this.houseProfile;
}

/**
 * [getAudioProfileName ]
 * @return {[String]} 
 */
UploadHelper.prototype.getAudioProfileName = function(){
	var functionName = "getAudioProfileName";
	this.log(functionName,"Start");
	var audioProfileName = this.getMaterialXml().TagList.Tag.(TagType.toString() == NBCGMO_CONSTANTS.TAGS.VALID_MEDIA_UPLOAD_VALUES).Value.toString(); 
	if(!gmoNBCFunc.isVarUsable(audioProfileName)) {
		var audioProfileName = this.getMaterialXml().ShortTextList.ShortText.(ShortTextType.toString()=== NBCGMO_CONSTANTS.SHORT_TEXTS.AUDIO_PROFILE).Value.toString();
	}

	this.log(functionName,"End");
	return audioProfileName;
}

/**
 * [getLanguagesInMaster]
 * @return {[Array]}
 */
UploadHelper.prototype.getLanguagesInMaster = function(){
	var functionName = "getLanguagesInMaster";
	this.log(functionName, "Start");
	var lmLangArray = [];
	var primaryLanguage = this.getMaterialHelper().getTagValue("Primary Language");
	gmoNBCFunc.isVarUsable(primaryLanguage) ? lmLangArray.push(primaryLanguage) : lmLangArray.push("");

	var secondaryLanguage = this.getMaterialHelper().getTagValue("Secondary Language");
	gmoNBCFunc.isVarUsable(secondaryLanguage) ? lmLangArray.push(secondaryLanguage) : lmLangArray.push("");

	var tertiaryLanguage = this.getMaterialHelper().getTagValue("Tertiary Language");
	gmoNBCFunc.isVarUsable(tertiaryLanguage) ? lmLangArray.push(tertiaryLanguage) : lmLangArray.push("");

	var fourthLanguage = this.getMaterialHelper().getTagValue("Fourth Language");
	gmoNBCFunc.isVarUsable(fourthLanguage) ? lmLangArray.push(fourthLanguage) : lmLangArray.push("");
	this.log(functionName, "End");
	return lmLangArray;
}

/**
 * [getAudioProfileObject]
 * @return {[Object]}
 */
UploadHelper.prototype.getAudioProfileObject = function(){

	var functionName = "getAudioProfileObject";
	this.log(functionName,"Start");
	var profileObject = {};
	var lmLangArray = this.getLanguagesInMaster();

	if(typeof(ProfileHelper)==="undefined"){
		this.log(functionName , "Loading ProfileHelper js ")
		load("/opt/evertz/mediator/etc/runners/ProfileHelper.js");	
	}

	var ph = new ProfileHelper();
	var audioProfileName = this.getAudioProfileName();
	this.getMaterialHelper().saveShortTextValue("Audio Profile",audioProfileName);
	var audioProfile = ph.getAudioProfile(audioProfileName);

	audioProfile.setLanguages(lmLangArray);

	var profileTrackLayout = audioProfile.getTrackLayout();
	
	var profileTrackTypes = ["Video"];
	// Get Audio Language Track Types
	for each (var obj in profileTrackLayout){
		profileTrackTypes.push(obj.trackTypeGroup)
	}

	profileObject.TotalNumberOfChannels = audioProfile.getTotalNumberOfChannels();
	profileObject.TrackTypes = profileTrackTypes;
	profileObject.TrackLayout = profileTrackLayout;
	this.log(functionName,"End");
	return profileObject;
}

/**
 * [validateAudioStreams ]
 * @param  {[Object]} audioProfileObject 
 * @return {[Boolean]} 
 */
UploadHelper.prototype.validateAudioStreams = function(audioProfileObject) {
	var functionName = "validateAudioStreams";
	this.log(functionName, "Start");
	
	var audioChannels = 0;
	var audioChannelsOnProfile = audioProfileObject.TotalNumberOfChannels;
	var mediaInfoXml = this.getMediaInfoHelper().getMediaInfoXml();

	// Grab the Contrbution Profile Audio Settings
	if (NBCGMO.contributionProfilesAudioSettings[this.getHouseProfile()]) {
		var audioSettings = NBCGMO.contributionProfilesAudioSettings[this.getHouseProfile()];
		this.log(functionName, "Found Audio Settings from Profile:");
		for (prop in audioSettings){
			this.log(functionName, "["+prop+"] : ["+audioSettings[prop]+"]");
		}
	} else {
		throw new Error("Unable to find Audio Settings for Profile ["+this.getHouseProfile()+"]");
	}
	
	// Check that each Audio Stream 
	for (var i=0; i<mediaInfoXml.track.(@type.toString()==="Audio").length(); i++) {
		audioChannels ++;
		var audioTrack = mediaInfoXml.track.(@type.toString()==="Audio")[i];
		this.log(functionName, "Validating Audio Stream ["+(i+1)+"] out of ["+mediaInfoXml.track.(@type.toString()==="Audio").length()+"]");
		if (audioTrack.Codec[0].toString() !== audioSettings.Codec) throw new Error("Codec Mismatch Expected ["+audioSettings.Codec+"] Actual ["+audioTrack.Codec[0].toString()+"]");
		this.log(functionName, "Success Codec is ["+audioSettings.Codec+"]");	
		if (parseInt(audioTrack.Bit_rate[0].toString()) != audioSettings.BitRate){
			if(audioSettings.minBitRate!="" && typeof audioSettings.minBitRate!='undefined'){
				this.log(functionName, "Min Bit Rate Defined - Running Checks ");
				if (parseInt(audioTrack.Bit_rate[0].toString()) < audioSettings.minBitRate || parseInt(audioTrack.Bit_rate[0].toString()) > audioSettings.BitRate){
					this.log(functionName, "Min Bit Rate Defined - Out Of Range - Throwing Error ");
					throw new Error ("Bit Rate Mismatch Expected Range  ["+audioSettings.minBitRate+"] - ["+audioSettings.BitRate+"] Actual ["+audioTrack.Bit_rate[0].toString()+"]");
				}
			}else {
				throw new Error ("Bit Rate Mismatch Expected ["+audioSettings.BitRate+"] Actual ["+audioTrack.Bit_rate[0].toString()+"]"+audioTrack);
			}
			
		} 
		this.log(functionName, "Success Bit Rate is ["+audioSettings.BitRate+"]");
		if (parseInt(audioTrack.Sampling_rate[0].toString()) !== audioSettings.SamplingRate) throw new Error("Sampling Rate MisMatch Expected ["+audioSettings.SamplingRate+"] Actual ["+audioTrack.Sampling_rate[0].toString()+"]\n"+audioTrack);
		this.log(functionName, "Success Sampling Rate is ["+audioSettings.SamplingRate+"]")
		if (parseInt(audioTrack.Resolution[0].toString()) !== audioSettings.Resolution) throw new Error("Resolution MisMatch Excpected ["+audioSettings.Resolution+"] Actual ["+audioTrack.Resolution[0].toString()+"]");
		this.log(functionName, "Success Resolution/Bit Depth is ["+audioSettings.Resolution+"]");
		if (parseInt(audioTrack.Channel_s_[0].toString()) !== audioSettings.ChannelsPerStream) throw new Error("Stream / Channel error Expected [" +audioSettings.ChannelsPerStream + "] Actual [" + audioTrack.Channel_s_[0].toString() + "]");
		this.log(functionName, "Success Stream has ["+ audioTrack.Channel_s_[0].toString() + "] channel(s)");
	}
	this.log(functionName, "Audio Channels on File ["+audioChannels+"]");
	this.log(functionName, "Audio Channels on Profile ["+audioChannelsOnProfile+"]");

	if(audioChannelsOnProfile > audioChannels){
		throw new Error("More Track types defined in Audio Profile than in the File");
		// We cannot have more track types in mediator than we have on the file 
	}else if(audioChannelsOnProfile < audioChannels){
		this.log(functionName, "We have more audio tracks in he file than specified in the Profile");
		gmoNBCFunc.addComment(this.getMatId(), "Upload", "File has more audio tracks than what has been specified in the sidecar xml");
		// We can have more track types on the file than in mediator but we should log a comment
	}else if(audioChannelsOnProfile == audioChannels){
		this.log(functionName, "Channels on Audio Profile and File match");
		// Audio Profile and File match 
	}
	this.log(functionName, "End");
	return true;
}

/**
 * [unmuddlePossibleDuplicateAudios ]
 * @param  {[Array]} sideCarXmlAudios 
 */
UploadHelper.prototype.unmuddlePossibleDuplicateAudios = function(sideCarXmlAudios) {
	var functionName = "unmuddlePossibleDuplicateAudios";
	var trackTypeGroupArr = [];
	var duplicatesInSideCar = "false";
	var previouslyUpdated = false;
	this.log(functionName , "Checking to see if Unregistered Duplicate Audios are contained in Side Car");

	// Loop through each of the TrackType Groups an array of Object to be used for Track Type and Track Type Group Saves
	for each(var trackTypeGroup in sideCarXmlAudios) {
		var isDuplicateGroup = /\d+$/.test(trackTypeGroup) === true; // Check if Track Type Group Ends in an Integer
		var trackTypeGroupRegistered = gmoNBCFunc.trackTypeGroupGet(trackTypeGroup).length() === 1;
		this.log(functionName , "TrackTypeGroup [" + trackTypeGroup + "] Is Duplicate? [" + isDuplicateGroup + "] TrackTypeGroup Registered [" + trackTypeGroupRegistered + "]");
		// Update a flag so it can be saved later
		if (isDuplicateGroup && (previouslyUpdated == false)) {
			duplicatesInSideCar = "true";
		}
		// Work Out if it's necessary to make new Track Types and corresponding Groups
		if (isDuplicateGroup && (trackTypeGroupRegistered === false)) {
			this.log(functionName , "Creating New Track Types for Group [" + trackTypeGroup + "]");
			var ttObj = {"groupName" : trackTypeGroup,"trackTypeXmls" : createNewTrackTypeXmlsFromGroup(trackTypeGroup)};
			trackTypeGroupArr.push(ttObj);
		}
	}
	// Were any duplicates found?
	if (trackTypeGroupArr.length > 0) {
		// New Track Type Save
		var trackTypesSaved = saveDuplicateTrackTypes(trackTypeGroupArr);
		this.log(functionName , "New Track Types Successfully Saved [" + trackTypesSaved + "]");
		// New Track Type Group Save
		var trackTypeGroupsSaved = saveDuplicateTrackTypeGroups(trackTypeGroupArr);
		this.log(functionName , "New Track Groups Successfully Saved [" + trackTypeGroupsSaved + "]");
		// Need to Update the Blades Local Caache
		var cacheUpdated = publishTrackTypeGroupsAndProfile();
		this.log(functionName , "Track Type Cache Updated Successfully [" + cacheUpdated + "]");
	} else {
		this.log(functionName , "No Duplicates found");
	}
	return {"success" : true, "hasduplicates" : duplicatesInSideCar};
}

/**
 * [createNewTrackTypeXmlsFromGroup ]
 * @return {[Xml]} 
 */
UploadHelper.prototype.createNewTrackTypeXmlsFromGroup = function() {
	var functionName = "createNewTrackTypeXmlsFromGroup";
	this.log(functionName, "Start");
	var parentTrackTypeInt = parseInt(trackTypeGroup.replace(/[^0-9]/g,'')); // Remove any Non Int Values 
	var parentTrackTypeGroupName = trackTypeGroup.replace(/[0-9]/g,'').replace(/ +$/, ""); // Remove any Int Values and additionally any Whitespace
	var parentTrackTypeGroupXml = gmoNBCFunc.trackTypeGroupGet(parentTrackTypeGroupName);
	if (parentTrackTypeGroupXml.length() === 0) throw new Error("Failed to find a Parent Track Type Group for [" + trackTypeGroup + "]");
	var newTrackTypesFromGroupXml = new XMLList();

	for each(var trackType in parentTrackTypeGroupXml.TrackType) {
		var parentTrackTypeName = trackType.Name.toString()
		var newTrackTypeName = parentTrackTypeName  + " " + parentTrackTypeInt;
		this.log(functionName,"**** New Track Type [" + newTrackTypeName + "] belongs to Group [" + trackTypeGroup  + "] from Parent Track Type [" + parentTrackTypeName + "] and Parent Track Type Group [" + parentTrackTypeGroupName + "] ****");
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
	this.log(functionName, "End");
	return newTrackTypesFromGroupXml;
}

/**
 * [registerOMTrackTypeLinks ]
 * @param  {[Array]} trackTypes 
 * @return {[Boolean]}            
 */
UploadHelper.prototype.registerOMTrackTypeLinks = function(trackTypes) {
	var functionName = "registerOMTrackTypeLinks";
	this.log(functionName, "Start");
	var missingTrackTypes = [];
						
	// Find difference in Material Track Type Links and Side Car Mapped Track Type Links (could be 0 if it's a retry job)
	for each(var sideCarTrackType in trackTypes) {
		if (this.getMaterialXml().TrackTypeLink.(TrackTypeName.toString() === sideCarTrackType).length() === 0) {
			this.log(functionName, "Material does not contain [" + sideCarTrackType + "]");
			missingTrackTypes.push(sideCarTrackType);
		} 
	}

	if (missingTrackTypes.length === 0) {
		this.log(functionName, "Material has all required Track Types no need to register any");
		return true;
	} else {
		var trackTypeSaveXml = <Material/>;
		trackTypeSaveXml.MatId = this.getMatId();
	}

	for each (var trackType in missingTrackTypes) {
		this.log(functionName, "Creating Track Type Link Node for [" + trackType + "]");
		trackTypeSaveXml.appendChild(gmoNBCFunc.createTrackTypeLinkNode(trackType,this.UploadStates.orderPlaced,this.UploadStateMachine)); 
	}

	this.log(functionName, "Saving new TrackTypes [" + trackTypeSaveXml + "]");
	return materialSave(trackTypeSaveXml);
}	

/**
 * [getMediatorTrackTypesFromXmlTrackTypes ]
 * @param  {[Array]} xmlTrackTypes    
 * @param  {[String]} ensureTrackTypes 
 * @return {[Array]}                  
 */
UploadHelper.prototype.getMediatorTrackTypesFromXmlTrackTypes = function(xmlTrackTypes,ensureTrackTypes){
	var functionName = "getMediatorTrackTypesFromXmlTrackTypes";
	this.log(functionName, "Start");
	var trackTypes = [];

	// Loop through Input Array Getting TrackTypeGroup Xml 
	for (var i=0; i<xmlTrackTypes.length;i++) {
		var trackTypeGroupName = xmlTrackTypes[i];
		this.log(functionName, "Mapping Xml Track Type ["+trackTypeGroupName+"] to Mediator Track Types");
		var trackTypeGroupXml = gmoNBCFunc.trackTypeGroupGet(trackTypeGroupName);
		if (trackTypeGroupXml.TrackType.length()===0) throw new Error("No TrackTypes Defined for Track Type Group ["+trackTypeGroupName+"]");
			
		// Extract the Track Type Names from each TrackTypeGroup Get
		for (var j=0; j<trackTypeGroupXml.TrackType.length();j++) {
			this.log(functionName, "Found Mediator TrackType ["+trackTypeGroupXml.TrackType[j].Name.toString()+"]");
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
	if (trackTypes.length === 0) throw new Error("Unable to find any Track from Xml Track Types [" + xmlTrackTypes + "]");
	this.log(functionName, "End");
	return trackTypes;
}

/**
 * [getProfileTrackTypesAsXML description]
 * @param  {[Object]} profileTrackLayout
 * @return {[xml]}
 */
UploadHelper.prototype.getProfileTrackTypesAsXML = function(profileTrackLayout){
	var functionName = "getProfileTrackTypesAsXML";
	this.log(functionName,"Start");

	var sourceTrackTypes = <TrackTypes></TrackTypes>;
	sourceTracks = new XMLList();
	
	sourceTracks = <TrackType>
					<TrackTypeName>Video</TrackTypeName>
					<Position>0</Position>
			</TrackType>;

	for each (var track in profileTrackLayout){
		
		var trackTypeGroupXml = gmoNBCFunc.trackTypeGroupGet(track.trackTypeGroup);
		if (trackTypeGroupXml.TrackType.length()===1 || trackTypeGroupXml.TrackType.length()===0){
			sourceTracks += <TrackType>
					<TrackTypeName>{track.trackTypeGroup}</TrackTypeName>
					<Channels>{track.channels}</Channels>
					<Position>{track.position.toString()}</Position>
				</TrackType>
		}else {
			var position = parseInt(track.position.toString());
			for (var j=0; j<trackTypeGroupXml.TrackType.length();j++) {
				var trackTypeName = trackTypeGroupXml.TrackType[j].Name.toString();
				print("\tFound Mediator TrackType ["+trackTypeName+"]");
				sourceTracks +=	<TrackType>
							<TrackTypeName>{trackTypeName}</TrackTypeName>
							<Channels>2</Channels>
							<Position>{position}</Position>
							</TrackType>;
				position += 2;
			}
		}
	}
	sourceTrackTypes.TrackTypes = sourceTracks;
	this.log(functionName,"End");
	return sourceTrackTypes;
}

/**
 * [saveUnEncodedStagingTrack ]
 * @return {[Boolean]} 
 */
UploadHelper.prototype.saveUnEncodedStagingTrack = function(){
	var functionName = "saveUnEncodedStagingTrack";
	this.log(functionName,"Start");
	var isUnEncodedStorageTrackSaved =  gmoNBCFunc.complexUnencodedTrackSave(
		this.getMatId(),                    		
		this.getStagingMedia(),             		
		this.getTimecode().frame_rate,  		
		this.getTimecode().incode,  
		this.getTimecode().outcode 
	);
	this.log(functionName,"End");
	return isUnEncodedStorageTrackSaved;
}

/**
 * [saveEncodedStagingTrack ]
 * @param  {[Object]} mediatorTrackTypes 
 * @return {[Boolean]}                    
 */
UploadHelper.prototype.saveEncodedStagingTrack = function(mediatorTrackTypes,profileTrackLayout){
	var functionName = "saveEncodedStagingTrack";
	this.log(functionName,"Start");
	var isEncodedStorageTrackSaved =  gmoNBCFunc.complexEncodedTrackSave(
		this.getMatId(),                    		 // MatId
		this.getStagingMedia(),            		 	 // Media Name
		this.getTimecode().frame_rate,  		 	 // Frame Rate
		this.getTimecode().incode,  	 			 // Incode
		this.getTimecode().outcode, 	 			 // Outcode
		this.getUsefulStagingFileObj().unix_file,  	 // Path to Src File 
		mediatorTrackTypes,      				 	 // Track Types
		this.getHouseProfile(),                  	 // Profile
		this.getProfileTrackTypesAsXML(profileTrackLayout)
	);
	
	this.log(functionName,"End");
	return isEncodedStorageTrackSaved;
}

/**
 * [moveFileToStagingMedia ]
 * @return
 */
UploadHelper.prototype.moveFileToStagingMedia = function(){
	var functionName = "copyFileToStaging";
	this.log(functionName,"Start");
	
	var stagingUseFulFileObject = this.getUsefulStagingFileObj();
	var uploadFilePathWithFileName = this.getDropFolderPath() + this.getFileName();

	this.log(functionName,"Moving Drop Folder File [" + uploadFilePathWithFileName + "] to [" + stagingUseFulFileObject.unix_file + "]")

	if(stagingUseFulFileObject.exists()){
		throw new Error("\nError File already exists in Staging Folder [" + stagingUseFulFileObject.win_file + "]");
	}else{
		gmoNBCFunc.makeDirectory(stagingUseFulFileObject.unix_path)
		try{
			gmoNBCFunc.copyFileDeleteSource(uploadFilePathWithFileName, stagingUseFulFileObject.unix_file);
		}catch(e){
			throw new Error("\nError Move failed. Cannot see file at [" + stagingUseFulFileObject.unix_file +"]");
		}
	}
	this.log(functionName,"End");
}

UploadHelper.prototype.copyMetadataFromShell = function(){
	var functionName = "copyMetadataFromShell";
	this.log(functionName,"Start");
	try{
		var materialXml = gmoNBCFunc.copyMetadataFromShell(this.getMatId(),this.getMaterialHelper().getMaterialShortTextValue("TVD Production #"));
		materialSave(materialXml);
	}catch(e){
		this.log(functionName,"Error ["+e+"]");
	}
	this.log(functionName,"End");
}

UploadHelper.prototype.cleanUpOnFailure = function(){
	var functionName = "cleanUpOnFailure";
	this.log(functionName,"Start");
	var dropFolder = this.getDropFolder();
	var usefulDropFolderFileObj = this.getUsefulDropFolderFileObj();
	var usefulStagingFileObj = this.getUsefulStagingFileObj();
	var failedFolder = lookup.dropfolder[dropFolder].mount + "failed/OMRunner/";

	this.log(functionName,"FailedFolder [" + failedFolder + "]")

	if(!this.isRetry() && usefulDropFolderFileObj.exists()){

		try{
			gmoNBCFunc.moveFile(usefulDropFolderFileObj.unix_file, failedFolder);
		}catch(e){
			throw new Error("\nError Move failed. Cannot see file at [" + failedFolder +"]");
		}

	}else if (usefulStagingFileObj.exists()){
		
		try{
			gmoNBCFunc.moveFile(usefulStagingFileObj.unix_file, failedFolder + this.getFileName());
		}catch(e){
			throw new Error("\nError Move failed. Cannot see file at [" + failedFolder +"]");
		}

		try{
			print("\nError CleanUp: Deleting Track for Material [" + matId + "] on Media [" + sourceObj.stagingmedia + "]");
			gmoNBCFunc.materialTrackDelete(this.getMatId(),this.getStagingMedia());
		}catch(e){
			print("Error Deleting Staging Media [" + this.getStagingMedia() +"]");
		}

		// If the Track is deleted (and therefore no Tracks exist for Material) the Track Types will transition to Not Available.
		// Give the chance for the Second to change for the StateHistory
		sleep(2);
	}
	this.log(functionName,"End");
}

UploadHelper.prototype.generateMatId = function(){
	output("UploadHelper generateMatId - Start")
	var _matId = gmoNBCFunc.generateMatId(NBCGMO_CONSTANTS.GENERATOR_SCRIPTS.UNTRUSTED_MAT_ID,
		NBCGMO_CONSTANTS.FREE_SEQUENCE_MAPPING.UNTRUSTED_MAT_ID);
	output("UploadHelper generateMatId - End")
	return _matId;
}
