/*
* @Author: Karthik Rengasamy
* @Date:   
* @Last Modified by:   206466664
* @Last Modified time: 2018-10-23 23:24:32
*/

if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")

function AdOpsCreativeHelper (creative) {

	if ((this instanceof AdOpsCreativeHelper) === false) {
		throw new Error("Please call constructor with new() keyword");
	}

	if(typeof(gmoNBCFunc)==="undefined")  {
		output("Loading nbcgmo_fun js ")
		load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js")
	}

	if(typeof(gmoNBCBatonFunc)==="undefined"){
		load("/opt/evertz/mediator/etc/runners/nbcgmo_baton_fun.js");
	}

	if (!gmoNBCFunc.isVarUsable(creative)) {
		throw new Error("AdOpsCreativeHelper requires creative object as parameter");
	}

	if(typeof(JSCommons)==="undefined"){
		output("Loading JSCommons js ")
		load("/opt/evertz/mediator/etc/helpers/JSCommons.js");
	}

	if(typeof(_)==="undefined"){
		load("/opt/evertz/mediator/etc/scripts/modules/js/underscore-min.js");
	}

	this.__creative = creative;
}

AdOpsCreativeHelper.prototype.constructor = AdOpsCreativeHelper;

/**
 * Setter For Placing Helper
 * @param {*} placingHelper 
 */
AdOpsCreativeHelper.prototype.setPlacingHelper = function(placingHelper){
	this.__placingHelper = placingHelper;
}

/**
 * GetCreativeID - From VAST QC Results ->Creative
 */
AdOpsCreativeHelper.prototype.__getCreativeId = function () {
	var creativeId = gmoNBCFunc.isVarUsable(this.__creative.creativeId) ? this.__creative.creativeId : "";
	output("Creative ID is ["+creativeId+"]");
	return creativeId;
}

/**
 * GetAdID - From VAST QC Results -> Creative
 */
AdOpsCreativeHelper.prototype.__getAdId = function () {
	var adId = gmoNBCFunc.isVarUsable(this.__creative.adId) ? this.__creative.adId : "";
	output("AD ID is ["+adId+"]");
	return adId;
}

/**
 * GetCreativeMaterialId - Construct Mediator Material ID For a Creative
 */
AdOpsCreativeHelper.prototype.__getCreativeMaterialId = function () {
	var creativeId = this.__getCreativeId();
	var adId = this.__getAdId();
	var vastUniqueID = this.__placingHelper.getShortTextValueByType(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_VAST_UNIQUE_ID);
	vastUniqueID = vastUniqueID.replace(/[^\w\s]/gi, '');

	if(gmoNBCFunc.isVarUsable(this.__getCreativeId())){
		var creativeMaterialId = NBCGMO_CONSTANTS.VAST + NBCGMO_CONSTANTS.UNDERSCORE + vastUniqueID + NBCGMO_CONSTANTS.UNDERSCORE + this.__getCreativeId();
		if(creativeMaterialId.length>40){
		    creativeMaterialId = NBCGMO_CONSTANTS.VAST + NBCGMO_CONSTANTS.UNDERSCORE + this.__getCreativeId();
		}
		
		if(creativeMaterialId.length>40){
		    creativeMaterialId = NBCGMO_CONSTANTS.VAST + NBCGMO_CONSTANTS.UNDERSCORE + com.google.common.hash.Hashing.md5().hashString(this.__getCreativeId(), java.nio.charset.Charset.forName('US-ASCII')).toString();
		}

	}else {
		var creativeMaterialId = NBCGMO_CONSTANTS.VAST + NBCGMO_CONSTANTS.UNDERSCORE + vastUniqueID + NBCGMO_CONSTANTS.UNDERSCORE + adId ;
		if(creativeMaterialId.length>40){
		    creativeMaterialId = NBCGMO_CONSTANTS.VAST + NBCGMO_CONSTANTS.UNDERSCORE + adId;
		}
		
		if(creativeMaterialId.length>40){
		    creativeMaterialId = NBCGMO_CONSTANTS.VAST + NBCGMO_CONSTANTS.UNDERSCORE + com.google.common.hash.Hashing.md5().hashString(adId, java.nio.charset.Charset.forName('US-ASCII')).toString();
		}
	}
	if(creativeMaterialId.length>40){
		throw new Error('Material ID is more than 40 Characters long')
	}
	return creativeMaterialId.toUpperCase();
}

/**
 * GetCreativeMaterialTitle - Material Title For a Creative
 */
AdOpsCreativeHelper.prototype.__getCreativeTitle = function () {
	return this.__creative.adId + NBCGMO_CONSTANTS.SPACE + this.__creative.properties.adTitle + NBCGMO_CONSTANTS.SPACE + this.__creative.properties.adSystem + NBCGMO_CONSTANTS.SPACE + this.__creative.properties.adType;
}

/**
 * GetCreativeMaterialFrameRate - Material Frame Rate For a Creative
 */
AdOpsCreativeHelper.prototype.__getCreativeFrameRate = function () {
	return gmoNBCFunc.isVarUsable(this.__creative.properties.frameRate) ? (_.invert(NBCGMO.frameRateLookup))[this.__creative.properties.frameRate] : NBCGMO_CONSTANTS.DEFAULT_FRAME_RATE;
}

/**
 * GetCreativeMaterialDuration - Material Duration For a Creative
 */
AdOpsCreativeHelper.prototype.__getCreativeDuration = function () {
	return gmoNBCFunc.isVarUsable(this.__creative.properties.duration) ? this.__creative.properties.duration : NBCGMO_CONSTANTS.DEFAULT_DURATION;
}

/**
 * GetCreativeMaterialType - Default to VAST MATERIAL TYPE
 */
AdOpsCreativeHelper.prototype.__getCreativeMaterialType = function () {
	return NBCGMO_CONSTANTS.DEFAULT_ADOPS_VAST_MATERIAL_TYPE;
}

/**
 * GetCreativeMaterialRenditions - From VAST QC Results -> Creative ->Renditions
 */
AdOpsCreativeHelper.prototype.__getCreativeRenditions = function () {
	return this.__creative.renditions;
}

/**
 * GetCreativeTrackingElementCount - From VAST QC Results -> Creative -> TrackingElementCount
 */
AdOpsCreativeHelper.prototype.__getCreativeTrackingElementCount = function () {
	return gmoNBCFunc.isVarUsable(this.__creative.properties.trackingElementCount) && this.__creative.properties.trackingElementCount!= null ?  this.__creative.properties.trackingElementCount : 0;
}

/**
 * GetCreativeImpressionCount - From VAST QC Results -> Creative -> ImpressionCount
 */
AdOpsCreativeHelper.prototype.__getCreativeImpressionCount = function () {
	return gmoNBCFunc.isVarUsable(this.__creative.properties.impressionCount) && this.__creative.properties.impressionCount!= null ?  this.__creative.properties.impressionCount : 0;
}

/**
 * GetCreativeTrackTypes - System Default as of Now
 * No Requirements to make it configurable. Making Default for simplicity
 */
AdOpsCreativeHelper.prototype.__getRequiredTrackTypes = function (severity) {
	var trackTypes = [
		NBCGMO_CONSTANTS.TRACK_TYPES.VAST,
		NBCGMO_CONSTANTS.TRACK_TYPES.MEZZANINE,
		NBCGMO_CONSTANTS.TRACK_TYPES.HIGH,
		NBCGMO_CONSTANTS.TRACK_TYPES.MEDIUM,
		NBCGMO_CONSTANTS.TRACK_TYPES.LOW
	]
	return trackTypes;
}

/**
 * GetCreativeTrackTypeInfo - Evaluate and Match Renditions to Track Types
 * No Requirements to make it configurable. Making it Default for simplicity
 */
AdOpsCreativeHelper.prototype.__getTrackTypeByInfo = function (resolution,bitrate) {
	output("__getTrackTypeByInfo - start");
    output("bitrate & resolution is ["+bitrate + " " + resolution+"]");
    if (!gmoNBCFunc.isVarUsable(resolution) && !gmoNBCFunc.isVarUsable(bitrate)) {
        print('Both bitrate and resolution are blank, defaulting trackType to VAST ')
        return NBCGMO_CONSTANTS.TRACK_TYPES.VAST;
    }    
	bitrate = parseFloat(bitrate);
	if((resolution=="1920x1080" || resolution=="1280x720" || resolution=="720x480") && bitrate>=15){
		return NBCGMO_CONSTANTS.TRACK_TYPES.MEZZANINE
	}else if((resolution=="1920x1080" || resolution=="1280x720" || resolution=="720x480") && (bitrate >=3.25 && bitrate <=5)){
		return NBCGMO_CONSTANTS.TRACK_TYPES.HIGH
	}else if((resolution=="960x540" || resolution=="640x480") && (bitrate >=1 && bitrate <=1.5)){
		return NBCGMO_CONSTANTS.TRACK_TYPES.MEDIUM
	}else if((resolution=="640x360" || resolution=="416x234") && bitrate<1){
		return NBCGMO_CONSTANTS.TRACK_TYPES.LOW
	}
	output("__getTrackTypeByInfo -found no matches for tracktype, setting to blank");
    return "";
}

/**
 * GetCreativeVASTErrors -  From VAST QC Results - >VAST Container Errors
 */
AdOpsCreativeHelper.prototype.__getCreativeVASTErrors = function () {
	output("__getCreativeVASTErrors - start");
	var vastErrors = []
	if(gmoNBCFunc.isVarUsable(this.__creative.errors.VAST) && this.__creative.errors.VAST!= null){
		var errors = this.__creative.errors.VAST;
		if(errors.length > 0){
			vastErrors = errors;
		}
	}
	output("__getCreativeVASTErrors - end");
	return vastErrors;
}

/**
 * GetCreativeVASTADErrors -  From VAST QC Results ->VAST AD Container Errors
 */
AdOpsCreativeHelper.prototype.__getCreativeAdErrors = function () {
	output("__getCreativeAdErrors - start");
	var adErrors = []
	if(gmoNBCFunc.isVarUsable(this.__creative.errors.Ad) && this.__creative.errors.Ad!= null){
		var errors = this.__creative.errors.Ad;
		if(errors.length > 0){
			adErrors = errors;
		}
	}
	output("__getCreativeAdErrors - end");
	return adErrors;
}

/**
 * GetCommentGrade -  Mapping Baton Error Severity to Mediator Comment Grade
 */
AdOpsCreativeHelper.prototype.__getCommentGrade = function (severity) {
	output("__getCommentGrade - start");
	var gradeLookup = {
		"Info" : "1",
		"Warning" : "3",
		"Serious" : "5"
	}
	output("__getCommentGrade - end");
	return gmoNBCFunc.isVarUsable(gradeLookup[severity]) ? gradeLookup[severity] : gradeLookup["Serious"];
}

/**
 * GetCommentStartTimeCode -  From VAST QC Results -> Applying Comment against TimeCode
 */
AdOpsCreativeHelper.prototype.__getCommentStartTimeCode = function (error,frameRate) {
	output("__getCommentStartTimeCode - start");
	var startTimeCode = "";

	if (gmoNBCFunc.isVarUsable(error.startimecode)) {		
		startTimeCode = gmoNBCBatonFunc.batonTcToSmpteTc(error.startimecode, frameRate);
	} else if (gmoNBCFunc.isVarUsable(error.timecode)) {		
		startTimeCode = gmoNBCBatonFunc.batonTcToSmpteTc(error.timecode, frameRate);
	} else {
		startTimecode = "00:00:00:00";
	}

	output("Start Time Code ["+startTimeCode+"]");
	output("__getCommentStartTimeCode - end");
	return startTimeCode;
}

/**
 * GetCommentEndTimeCode -  From VAST QC Results -> Applying Comment against TimeCode
 */
AdOpsCreativeHelper.prototype.__getCommentEndTimeCode = function (error,frameRate) {
	output("__getCommentEndTimeCode - start");
	var endTimeCode = "";

	if (gmoNBCFunc.isVarUsable(error.endtimecode)) {		
		endTimeCode = gmoNBCBatonFunc.batonTcToSmpteTc(error.endtimecode, frameRate);
	} else if (gmoNBCFunc.isVarUsable(error.timecode)) {		
		endTimeCode = gmoNBCBatonFunc.batonTcToSmpteTc(error.timecode, frameRate);
	} else {
		endTimeCode = "00:00:00:00";
	}
	output("End Time Code ["+endTimeCode+"]");
	output("__getCommentEndTimeCode - end");
	return endTimeCode;
}

/**
 * ResetMaterialIfItExists -  Reset data Against Material For each Auto QC Run
 */
AdOpsCreativeHelper.prototype.__resetMaterialIfItExists = function(){
	output("__resetMaterialIfItExists - start");
	var matId = this.__getCreativeMaterialId()
	var mh = new gmoNBCFunc.materialHelper(matId);

	var trackTypes = this.__getRequiredTrackTypes();

	if(mh.materialExists()){
		output("["+matId+"] Exists & Reseting Track Types & deleting Comments");
		for each (trackTypeName in trackTypes){
			gmoNBCFunc.resetTrackTypeLink(matId,trackTypeName);
			mh.deleteComments(trackTypeName);
		}
	}
	output("__resetMaterialIfItExists - end");
}

/**
 * Create Creative Material  -   From VAST QC Results -> Creative
 */
AdOpsCreativeHelper.prototype.__createMaterial = function(){
	output("__createMaterial - start");
	var mh = new gmoNBCFunc.materialHelper(this.__getCreativeMaterialId());
	var frameRate = this.__getCreativeFrameRate();
	mh.addOwnerToSaveXml(NBCGMO_CONSTANTS.OWNERS.AD_OPS);
	mh.addTitleToSaveXml(this.__getCreativeTitle());
	mh.addMaterialTypeToSaveXml(this.__getCreativeMaterialType());
	mh.addFrameRateToSaveXml(frameRate);
	mh.addDurationToSaveXml(this.__getCreativeDuration());
	
	mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_CAMPAIGN_ORDER_NAME ,
		this.__placingHelper.getShortTextValueByType(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_CAMPAIGN_ORDER_NAME));
	mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_CAMPAIGN_ORDER_ID ,
		this.__placingHelper.getShortTextValueByType(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_CAMPAIGN_ORDER_ID));
	mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_VERTICAL ,
		this.__placingHelper.getShortTextValueByType(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_VERTICAL));
	mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_ADVERTISER ,
		this.__placingHelper.getShortTextValueByType(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_ADVERTISER));
	mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_ADVERTISER_ID ,
		this.__placingHelper.getShortTextValueByType(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_ADVERTISER_ID));
	mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_CREATIVE_NAME ,
		this.__placingHelper.getShortTextValueByType(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_CREATIVE_NAME));
	mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_VAST_UNIQUE_ID ,
		this.__placingHelper.getShortTextValueByType(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_VAST_UNIQUE_ID));
	mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_TRAFFICKER_NAME ,
		this.__placingHelper.getShortTextValueByType(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_TRAFFICKER_NAME));
	mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.VAST_ORDER_ID , this.__placingHelper.getPlacingId());
	
	mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_CREATIVE_ID ,this.__getCreativeId());
	mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_AD_ID ,this.__getAdId());
	
	// Properties from Baton Results
	mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_TRACKING_ELEMENT_COUNT ,this.__getCreativeTrackingElementCount());
	mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.ADOPS_IMPRESSION_COUNT ,this.__getCreativeImpressionCount());
	
	var trackTypes = this.__getRequiredTrackTypes();
	for each (trackType in trackTypes){
		mh.addTrackTypeLink(trackType,NBCGMO_CONSTANTS.STATES.NOT_AVAILABLE,
			 NBCGMO_CONSTANTS.STATE_MACHINES.AD_OPS_QC);
	}
	var renditions = this.__getCreativeRenditions();
	for each (rendition in renditions){
		var trackType = this.__getTrackTypeByInfo(rendition.resolution,rendition.averageBitRate);
        if (!gmoNBCFunc.isVarUsable(trackType)) {
            print('TrackType[' + trackType + '] is not usable, not adding shorttexts')
            continue;
        }  
        mh.addTrackTypeLinkShortText(trackType,NBCGMO_CONSTANTS.SHORT_TEXTS.VIDEO_FILE_NAME,rendition.fileName);
		mh.addTrackTypeLinkShortText(trackType,NBCGMO_CONSTANTS.SHORT_TEXTS.RESOLUTION,rendition.resolution);
		mh.addTrackTypeLinkShortText(trackType,NBCGMO_CONSTANTS.SHORT_TEXTS.VIDEO_FILE_SIZE,rendition.fileSize);
		mh.addTrackTypeLinkShortText(trackType,NBCGMO_CONSTANTS.SHORT_TEXTS.VIDEO_BIT_RATE,rendition.averageBitRate);
		mh.addTrackTypeLinkShortText(trackType,NBCGMO_CONSTANTS.SHORT_TEXTS.AUDIO_BIT_RATE,rendition.bitRate);
		mh.addTrackTypeLinkShortText(trackType,NBCGMO_CONSTANTS.SHORT_TEXTS.AUDIO_SAMPLING_RATE,rendition.samplingFrequency);
		mh.addTrackTypeLinkShortText(trackType,NBCGMO_CONSTANTS.SHORT_TEXTS.AUDIO_CHANNEL_COUNT,rendition.audioChannels);
	}

	if(debug) mh.printSaveXml();
	mh.saveUsingSaveXml();
	output("__createMaterial - end");
}

/**
 * ImportBatonQCResultsAsComments  -   From VAST QC Results -> Creative ->Errors , Renditions ->Errors
 */
AdOpsCreativeHelper.prototype.__importBatonQCResultsAsComments= function(){
	output("__importBatonQCResultsAsComments - start");
	var matId = this.__getCreativeMaterialId();
	var frameRate = this.__getCreativeFrameRate();

	var materialImportXml = 
	<Pharos>
		<Material>
			<MatId>{this.__getCreativeMaterialId()}</MatId>
			<FrameRate>{frameRate}</FrameRate>
		</Material>
	</Pharos>;

	var trackTypes = this.__getRequiredTrackTypes();

	for each (trackType in trackTypes){
		materialImportXml.Material.TrackTypeLink += <TrackTypeLink><TrackTypeName>{trackType}</TrackTypeName></TrackTypeLink>
	}

	var vastErrors = this.__getCreativeVASTErrors();
	var vastAdErrors = this.__getCreativeAdErrors()

	if(vastErrors.length > 0 || vastAdErrors.length > 0){

		//VAST Container Errors
		for each (errorObj in vastErrors){
			materialImportXml = gmoNBCBatonFunc.addComment(materialImportXml, NBCGMO_CONSTANTS.COMMENT_TYPES.VAST,
				errorObj.error, NBCGMO_CONSTANTS.TRACK_TYPES.VAST, frameRate, this.__getCommentStartTimeCode(errorObj,frameRate), 
				this.__getCommentEndTimeCode(errorObj,frameRate), NBCGMO_CONSTANTS.DEFAULT_DURATION, this.__getCommentGrade(errorObj.severity));
		}
		//VAST Ad Errors
		for each (errorObj in vastAdErrors){
			materialImportXml = gmoNBCBatonFunc.addComment(materialImportXml, NBCGMO_CONSTANTS.COMMENT_TYPES.VAST_AD,
				errorObj.error, NBCGMO_CONSTANTS.TRACK_TYPES.VAST, frameRate, this.__getCommentStartTimeCode(errorObj,frameRate), 
				this.__getCommentEndTimeCode(errorObj,frameRate), NBCGMO_CONSTANTS.DEFAULT_DURATION, this.__getCommentGrade(errorObj.severity));
		}
	}

	var renditions = this.__getCreativeRenditions();
	for each (rendition in renditions){
		var trackType = this.__getTrackTypeByInfo(rendition.resolution,rendition.averageBitRate);
        if (!gmoNBCFunc.isVarUsable(trackType) ) {
            print('Not adding comments to blank TrackTypes')
            continue;
        }
        var allErrors = rendition.errors;
		for (errorCategory in allErrors){
			if(allErrors[errorCategory]!=null){
				var errors = allErrors[errorCategory];
				if(errorCategory.indexOf("Video")>0) commentType = NBCGMO_CONSTANTS.COMMENT_TYPES.VIDEO;
				if(errorCategory.indexOf("Audio")>0) commentType = NBCGMO_CONSTANTS.COMMENT_TYPES.AUDIO;
				
				for each (errorObj in errors){
					materialImportXml = gmoNBCBatonFunc.addComment(materialImportXml,commentType,
						errorObj.error, trackType, frameRate, this.__getCommentStartTimeCode(errorObj,frameRate), 
						this.__getCommentEndTimeCode(errorObj,frameRate), NBCGMO_CONSTANTS.DEFAULT_DURATION, this.__getCommentGrade(errorObj.severity));
				}
			}
		}
	}

	if(debug) output(materialImportXml)

	if (materialImportXml != "" && materialImportXml != null && materialImportXml != undefined){
		output("Sending in Direct Import to save comments against the material.");
		var importFile = NBCGMO_CONSTANTS.MEDIATOR_TEMP_PATH + matId + "_BatonCommentsPxf.xml";
		overwrite(materialImportXml, importFile);
		var importResult = gmoNBCFunc.importWithOutcome('None', importFile);
		if (!importResult) {
			output(matId + "_BatonCommentsPxf.xml Import Failed");
		}else{
			remove(importFile);
		}
	}
	output("__importBatonQCResultsAsComments - end");
}


/**
 * transitionTrackTypesBasedonQCResults  -   From VAST QC Results -> Creative -> Errors & Renditions ->Errors
 */
AdOpsCreativeHelper.prototype.__transitionBasedonQCResults = function(){
	output("__transitionBasedonQCResults - start");
	var matId = this.__getCreativeMaterialId();

	var vastErrors = this.__getCreativeVASTErrors();
	var vastAdErrors = this.__getCreativeAdErrors()

	if(vastErrors.length > 0 || vastAdErrors.length > 0){
		output("VAST Has Errors. Transitioning to  Spot Check Required")
		gmoNBCFunc.transitionTrackTypes(matId, NBCGMO_CONSTANTS.TRIGGERS.ERROR, NBCGMO_CONSTANTS.TRACK_TYPES.VAST);
	}else {
		output("VAST Has NO Errors. Transitioning to  Ready")
		gmoNBCFunc.transitionTrackTypes(matId,  NBCGMO_CONSTANTS.TRIGGERS.COMPLETE, NBCGMO_CONSTANTS.TRACK_TYPES.VAST);
	}

	var removeElementInArray = function(array,str){
		var index = array.indexOf(str)
		if (index > -1) {
		   array.splice(index, 1);
		}
		return array;
	}
	var trackTypes = this.__getRequiredTrackTypes();
	
	removeElementInArray(trackTypes,NBCGMO_CONSTANTS.TRACK_TYPES.VAST)

	var renditions = this.__getCreativeRenditions();
	for each (rendition in renditions){
		var trackType = this.__getTrackTypeByInfo(rendition.resolution,rendition.averageBitRate);
		removeElementInArray(trackTypes,trackType)
		var isError = false;
		var allErrors = rendition.errors;
		for (errorCategory in allErrors){
			if(allErrors[errorCategory]!=null){
				isError = true;
				break;
			}
		}
		if(isError){
			output("Rendition has errors . Transitioning to Spot Check Required")
			gmoNBCFunc.transitionTrackTypes(matId, NBCGMO_CONSTANTS.TRIGGERS.ERROR, trackType);
		}else {
			output("Rendition has no errors . Transitioning to Ready")
			gmoNBCFunc.transitionTrackTypes(matId, NBCGMO_CONSTANTS.TRIGGERS.COMPLETE, trackType);
		}
	}

	output("Adding a Comment for Renditions that were missing in VAST")
	for each (trackType in trackTypes){
        // Do not add comments or Transitions to blank track types!
        if(!gmoNBCFunc.isVarUsable(trackType)) {
            continue;
        }
		gmoNBCFunc.addComment(matId, NBCGMO_CONSTANTS.COMMENT_TYPES.VIDEO, "This Rendition is not available for the Creative ", 
					trackType, NBCGMO_CONSTANTS.DEFAULT_DURATION, NBCGMO_CONSTANTS.DEFAULT_DURATION, this.__getCommentGrade('Serious'));
		gmoNBCFunc.transitionTrackTypes(matId, NBCGMO_CONSTANTS.TRIGGERS.ERROR, trackType);
	}
	output("__transitionBasedonQCResults - end");
}

/**
 * saveCreative  -  Save VAST Creative And Renditions as Material & Track Types
 */

AdOpsCreativeHelper.prototype.saveCreative = function(){
	output("saveCreative - start");
	try{
		var matId = this.__getCreativeMaterialId();
		//Reset Materials In Case We Processed it in Previous Run 
		this.__resetMaterialIfItExists();
		//Create Material
		this.__createMaterial();
		//Attach Baton Report 
		if(gmoNBCFunc.isVarUsable(this.__creative.batonReport)){
			attachFile(this.__creative.batonReport, "MATERIAL", matId);
		}
		//Transition Materials to Auto QC
		output("Transitioning Creative Material to Auto QC State");
		gmoNBCFunc.transitionMaterial(matId, NBCGMO_CONSTANTS.STATES.NOT_AVAILABLE, NBCGMO_CONSTANTS.TRIGGERS.ORDER_PLACED);
		//Import Baton Comments 
		output("Importing Baton Comments");
		this.__importBatonQCResultsAsComments();
		//Transition Renditions/Track Types Based on QC Results
		output("Transitioning Creative Material based on QC Results")
		this.__transitionBasedonQCResults();

	}catch(e){
		throw new Error("Creative Failure "+e);
	}
	output("saveCreative - end");
	return matId;
}
