load('/opt/evertz/mediator/lib/js/shellfun.js');
if(typeof(NBCGMO_CONSTANTS)==="undefined") load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js");
if(typeof(gmoNBCFunc)==="undefined") load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
if(typeof(UploadHelper)==="undefined") load("/opt/evertz/mediator/etc/runners/UploadHelper.js");
if(typeof(ProfileHelper)==="undefined") load("/opt/evertz/mediator/etc/runners/ProfileHelper.js");
if(typeof(AudioProfileHelper)==="undefined") load("/opt/evertz/mediator/etc/runners/AudioProfileHelper.js");
if(typeof(TrackHelper)==="undefined") load("/opt/evertz/mediator/etc/helpers/TrackHelper.js");
if(typeof(Preset)==="undefined") load("/opt/evertz/mediator/etc/runners/Preset.js");
if(typeof(TVDInspector)==="undefined") load("/opt/evertz/mediator/etc/runners/TVDInspector.js");

// Scope these a bit
const MatReg = {};
MatReg.detailedError = null;

function MaterialRegistration(utsId) {

    if((this instanceof MaterialRegistration) === false)  throw new Error("Please call constructor with new() keyword")

    if(gmoNBCFunc.isVarUsable(utsId)){
        this.setUTSId(utsId);
        this.setUTSMaterialHelper(new gmoNBCFunc.materialHelper(this.getUTSId()));
        this.__audioPositions = [];
        this.__audioTrackTypeLinks = [];
        this.__audioRegistrationComplete = false;
    }else{
        throw new Error ("Unrusted Source Material Id is required to register official material.")
    }

}

MaterialRegistration.prototype.constructor = MaterialRegistration;

MaterialRegistration.prototype.requirements = {
    toMediaReceived : "Upload",
    toOrderPlaced: "Retry",
    toOMUploadFailed : "Failed (OM)",
    toQCRequired : "Complete"
}

MaterialRegistration.prototype.setGMOId = function(matId){
    this.__gmoMatId = matId;
}

MaterialRegistration.prototype.getGMOId = function(){
    return this.__gmoMatId;
}

MaterialRegistration.prototype.setUTSId = function(matId){
    this.__UTSId = matId;
}

MaterialRegistration.prototype.getUTSId = function(){
    return this.__UTSId;
}

MaterialRegistration.prototype.setUTSMaterialHelper = function(utsHelper){
    this.__UTSMaterialHelper = utsHelper;
}

MaterialRegistration.prototype.getUTSMaterialHelper = function(){
    return this.__UTSMaterialHelper;
}

MaterialRegistration.prototype.setAudioFilePositions = function(positions){
    this.__audioPositions = positions;
}

MaterialRegistration.prototype.getAudioFilePositions = function(){
    return this.__audioPositions;
}

MaterialRegistration.prototype.setAudioRegistrationComplete = function(bool){
    this.__audioRegistrationComplete = bool;
}

MaterialRegistration.prototype.isAudioRegistrationComplete = function(){
    return this.__audioRegistrationComplete;
}

MaterialRegistration.prototype.setAudioTrackTypes = function(trackTypeLinks){
    this.__audioTrackTypeLinks = trackTypeLinks;
}

MaterialRegistration.prototype.getAudioTrackTypes = function(){
    return this.__audioTrackTypeLinks;
}

MaterialRegistration.prototype.getUnTrustedOMWorkingDirectory= function(){
    return lookup.media[NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING].mount + this.getUTSId() + NBCGMO_CONSTANTS.DOT_DIR + File.separator;
}

MaterialRegistration.prototype.getTrackMedias = function(){
    var standardNorm = function(st) {
        if (st == "UHD") {
            return "HD"
        } else {
            return st;
        }
    }

    var trackMediaObject = new Object();

    var utsUploadProfile = this.getUTSMaterialHelper().getShortTextValue("Matched Profile");
    if(!gmoNBCFunc.isVarUsable(utsUploadProfile)) throw new Error("No Matched Profile on Untrusted Material Id");
    var utsUploadProfilePreset = new Preset(utsUploadProfile,['shorttext',"tag"]);

    var frameRate = utsUploadProfilePreset.getDataElementValue('shorttext',"Frame Rate");
    if(frameRate == "P23_976") frameRate = "2398";
    if(!gmoNBCFunc.isVarUsable(frameRate)) throw new Error("No Frame Rate on Matched Profile [" + utsUploadProfile + "]");
    var lfSF = NBCGMO.formtypelookup[this.getUTSMaterialHelper().getMaterialType()];
    if(!gmoNBCFunc.isVarUsable(lfSF)) throw new Error("No Video Form Type (Long/Short Form) Verify Material Type on [" + this.getUTSId() + "]");
    var standard = standardNorm(utsUploadProfilePreset.getDataElementValue('tag',"Video Standard"));
    if(!gmoNBCFunc.isVarUsable(standard)) throw new Error("No Standard on Matched Profile [" + utsUploadProfile + "]");
    var formatMapping = utsUploadProfilePreset.getDataElementValue('tag',"Video Format Mapping");
    if(!gmoNBCFunc.isVarUsable(formatMapping)) throw new Error("No Format Mapping on Matched Profile [" + utsUploadProfile + "]");

    trackMediaObject.video = "DC_" + frameRate + "_" + lfSF + "_" + standard + "_" + formatMapping.toUpperCase();
    trackMediaObject.audio = "DC_" + frameRate + "_" + lfSF + "_" + standard + "_" + NBCGMO_CONSTANTS.WAV.toUpperCase();

    output("Track Media Video [" + trackMediaObject.video + "]");
    output("Track Media Audio [" + trackMediaObject.audio + "]");

    return trackMediaObject;
}

MaterialRegistration.prototype.copyMetadataFromUTS = function() {
 
    var utsTagsToCopy = gmoNBCFunc.getTagsForTypeXml("Untrusted Source");

    if(gmoNBCFunc.isVarUsable(this.getGMOId())){
        var gmoId = this.getGMOId();
    }else{
        var gmoId = gmoNBCFunc.generateMatId(NBCGMO_CONSTANTS.GENERATOR_SCRIPTS.GMO_MAT_ID,NBCGMO_CONSTANTS.FREE_SEQUENCE_MAPPING.GMO_MAT_ID);
    }

    var gmoMatHelper = new gmoNBCFunc.materialHelper(gmoId);
    gmoMatHelper.addOwnerToSaveXml(NBCGMO_CONSTANTS.OWNERS.NBCU_GMO);
    gmoMatHelper.addMaterialTypeToSaveXml(this.getUTSMaterialHelper().getMaterialType());
    gmoMatHelper.addFrameRateToSaveXml(this.getUTSMaterialHelper().getMaterialFrameRate());
    gmoMatHelper.addVersionTypeToSaveXml(this.getUTSMaterialHelper().getVersionType());
    gmoMatHelper.addAspectRatioToSaveXml(this.getUTSMaterialHelper().getAspectRatio());
    gmoMatHelper.addTransformationToSaveXml(this.getUTSMaterialHelper().getTransformation());
    gmoMatHelper.addTitleToSaveXml(this.getUTSMaterialHelper().getTitle());
    gmoMatHelper.addShortTextToSaveXml("UTS Record",this.getUTSId());

    if(!gmoMatHelper.materialExists()) gmoMatHelper.addTrackTypeLink(NBCGMO_CONSTANTS.VIDEO,"Order Placed", NBCGMO_CONSTANTS.STATE_MACHINES.NBC_GMO);

    for each(tag in utsTagsToCopy..Tag) {
        var tagName = tag.Value.toString();
        if (tag.Description == "shorttext") {
            gmoMatHelper.addShortTextToSaveXml(tagName,this.getUTSMaterialHelper().getMaterialShortTextValue(tagName));
        } else if (tag.Description == "fulltext") {
            gmoMatHelper.addFullTextToSaveXml(tagName,this.getUTSMaterialHelper().getFullTextValue(tagName));
        } else if (tag.Description == "tag") {
            gmoMatHelper.addTagToSaveXml(tagName,this.getUTSMaterialHelper().getTagValue(tagName));
        }
    }

    output("Saving material with GMO ID: [" + gmoId + "]");
    try {
        gmoMatHelper.printSaveXml();
        gmoMatHelper.saveUsingSaveXml();
    } catch(e) {
        throw new Error("Failed to create new material from UTS [" + this.getUTSId() + "]. Error: " + e);
    }

    //if its a retry we need to fix the ttls
    for each(ttl in gmoMatHelper.getTrackTypes()){
        if(gmoMatHelper.getStateOfTtl(ttl) == "OM Upload Failed"){
            gmoNBCFunc.transitionTrackTypes(this.getGMOId(),this.requirements.toOrderPlaced,[ttl]);
        }
    }

    this.setGMOId(gmoId);
    return gmoId;
}

MaterialRegistration.prototype.getUTSWorkingTrackObject = function(){

    var workingInfoObject = new Object();
    workingInfoObject.incode = this.getUTSMaterialHelper().getTrackIncode(NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING);
    workingInfoObject.outcode = this.getUTSMaterialHelper().getTrackOutcode(NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING);
    workingInfoObject.frameRate  = this.getUTSMaterialHelper().getMaterialFrameRate();
    workingInfoObject.duration = gmoNBCFunc.calculateDuration(workingInfoObject.incode,workingInfoObject.outcode,workingInfoObject.frameRate);

    return workingInfoObject;    
}

MaterialRegistration.prototype.createTwoChannelWavsFromSingles = function(singleWavFiles,audioTTLSChannelMap,outputPath) {
    var twoChannelWavsFilePaths = [];
    var ph = new ProfileHelper();
    if (!fileExists(NBCGMO_CONSTANTS.CMD.AUDIOMANIPULATE))throw new Error("Cannot find binary at ["+NBCGMO_CONSTANTS.CMD.AUDIOMANIPULATE+"]");

    var pairCount = 0;
    var trackCount= 0;
    while(trackCount < audioTTLSChannelMap.length){
        output("============================================");
        var pairFileFileObj = new gmoNBCFunc.usefulFileObj(String(singleWavFiles[pairCount]));
        var trackTypeName = audioTTLSChannelMap[trackCount][0];
        var fileTag = ph.getTrackType(trackTypeName).FileTag.toString();
        var channels = parseInt(audioTTLSChannelMap[trackCount][1]);

        var wavPairOutputFile = outputPath + this.getGMOId() + "-" + fileTag + "." + NBCGMO_CONSTANTS.WAV;
        output("\nCreating Audio Pair Using ["+NBCGMO_CONSTANTS.CMD.AUDIOMANIPULATE+"]\n ["+wavPairOutputFile+"]");
        output("TrackTypeName ["+trackTypeName+"] has ["+channels+"] channel[s]");

        var firstWavInThePair = singleWavFiles[pairCount];
        var secondWavInThePair;
        
        if (channels == 1) {        
            output("We have a single channel track, converting to dual mono");
            secondWavInThePair = singleWavFiles[pairCount];
            pairCount+=1;
            trackCount++;            
        } else {            
            output("We have a dual channel track, using next two wav files"); 
            secondWavInThePair = singleWavFiles[pairCount+1];
            pairCount+=2;
            trackCount++;
        }
        if(!gmoNBCFunc.isVarUsable(firstWavInThePair) || !gmoNBCFunc.isVarUsable(secondWavInThePair)) throw new Error("Number of tracks specified on Audio Profile more than mono audio files in source directory.");
        if(!fileExists(wavPairOutputFile)){ 
            var createWavPair = run([NBCGMO_CONSTANTS.CMD.AUDIOMANIPULATE],"-i",firstWavInThePair,"-i",secondWavInThePair,"-o",
                wavPairOutputFile,"-c",2,"-b",24,"-f",NBCGMO_CONSTANTS.WAV);
            if (createWavPair.exit !== 0) throw new Error("Run Command Failed for [" + NBCGMO_CONSTANTS.CMD.AUDIOMANIPULATE + "]");

            if (fileExists(wavPairOutputFile)) {
                output("\nSuccesfully created ["+wavPairOutputFile+"]\nUsed Sources: \n ["+firstWavInThePair+"]\n ["+secondWavInThePair+"]");
            } else {
                throw new Error("Cannot find output WAV ["+wavPairOutputFile+"]\n");    
            }
        }else{
            output("An Output Wav ["+wavPairOutputFile+"] already exists. Skipping create Wav Pair");
        }

        twoChannelWavsFilePaths.push(wavPairOutputFile); 
    }

    output("\nPair Files ["+twoChannelWavsFilePaths+"]");
    return twoChannelWavsFilePaths;
}

MaterialRegistration.prototype.startRegistration = function(){
    var isRetry = gmoNBCFunc.isVarUsable(this.getGMOId()) ? true : false;
    output("Material Registration is retry [" + isRetry + "]");
    this.copyMetadataFromUTS();
    this.getUTSMaterialHelper().addShortTextToSaveXml("Shell Record Id",this.getGMOId());
    this.getUTSMaterialHelper().saveUsingSaveXml();

    var untrustedFileBaseObj = new gmoNBCFunc.usefulFileObj(this.getUnTrustedOMWorkingDirectory());
    var gmoTrackHelper = new TrackHelper(this.getGMOId());
    var gmoUploadHelper = new UploadHelper();
    gmoUploadHelper.initializeAndSetVariables(this.getGMOId(),NBCGMO_CONSTANTS.VIDEO,isRetry,"");
    var trackMedias = this.getTrackMedias();

    // === AUDIO ===
    var audioProfileObj = gmoUploadHelper.getAudioProfileObject();
    var audioProfileTrackXml = gmoUploadHelper.getProfileTrackTypesAsXML(audioProfileObj.TrackLayout);
    var hasNativeMOS = false;
    if(audioProfileTrackXml..TrackType.(TrackTypeName.toString() == NBCGMO_CONSTANTS.TRACK_TYPES.MOS).length() > 0) hasNativeMOS = true;
    output("hasNativeMOS [" + hasNativeMOS + "]");
    var audioTTLSChannelMap = [];
    for (var i=0; i < audioProfileTrackXml..TrackType.length(); i++){
        if(audioProfileTrackXml..TrackType[i].TrackTypeName.toString() != NBCGMO_CONSTANTS.VIDEO){
            var position = audioProfileTrackXml..TrackType[i].Position.toString();
            var trackTypeName = audioProfileTrackXml..TrackType[i].TrackTypeName.toString();
            var channels = audioProfileTrackXml..TrackType[i].Channels.toString();
            this.getAudioTrackTypes().push(trackTypeName);
            this.getAudioFilePositions().push(position);
            audioTTLSChannelMap.push([trackTypeName,channels]);
        }
    }

    if(!hasNativeMOS) this.getAudioTrackTypes().push(NBCGMO_CONSTANTS.TRACK_TYPES.MOS);
    gmoUploadHelper.registerOMTrackTypeLinks(this.getAudioTrackTypes());
    var gmoAudioMediaObj = new gmoNBCFunc.usefulFileObj(lookup.media[trackMedias.audio].mount + this.getGMOId() + NBCGMO_CONSTANTS.DOT_DIR);
    if(!gmoAudioMediaObj.exists()) gmoNBCFunc.makeDirectory(gmoAudioMediaObj.unix_file);
    gmoTrackHelper.saveUnEncodedTrack(trackMedias.audio);
    gmoNBCFunc.transitionTrackTypes(this.getGMOId(),this.requirements.toMediaReceived,this.getAudioTrackTypes());
    var monoFilePaths = gmoNBCFunc.listAndSortFiles(untrustedFileBaseObj.unix_file + NBCGMO_CONSTANTS.AUDIO,"AUD_UN",NBCGMO_CONSTANTS.WAV);
    var pairFilePaths = this.createTwoChannelWavsFromSingles(monoFilePaths,audioTTLSChannelMap,gmoAudioMediaObj.unix_file);
    if(!hasNativeMOS) pairFilePaths.push(pairFilePaths[0]); // this is so MOS can match up to the same audio pair file as the first audio 

    gmoTrackHelper.saveEncodedTrack(trackMedias.audio,this.getUTSWorkingTrackObject(),this.getAudioTrackTypes(),pairFilePaths);
    gmoNBCFunc.transitionTrackTypes(this.getGMOId(),this.requirements.toQCRequired,this.getAudioTrackTypes());
    this.setAudioRegistrationComplete(true);

    //=== VIDEO ===
    var videoAudioTrackTypes = this.getAudioTrackTypes();
    var videoAudioPairFilePaths = pairFilePaths;
    if(!hasNativeMOS){
        videoAudioTrackTypes.pop();
        videoAudioPairFilePaths.pop();
    } 
    var gmoVideoMediaObj = new gmoNBCFunc.usefulFileObj(lookup.media[trackMedias.video].mount + this.getGMOId() + NBCGMO_CONSTANTS.DOT_DIR);
    if(!gmoVideoMediaObj.exists()) gmoNBCFunc.makeDirectory(gmoVideoMediaObj.unix_file);
    gmoTrackHelper.saveUnEncodedTrack(trackMedias.video);
    gmoNBCFunc.transitionTrackTypes(this.getGMOId(),this.requirements.toMediaReceived,[NBCGMO_CONSTANTS.VIDEO]);
    var untrustedVideoFileObj = new gmoNBCFunc.usefulFileObj(untrustedFileBaseObj.unix_file + NBCGMO_CONSTANTS.VIDEO + File.separator + this.getUTSId() + "." + gmoUploadHelper.getExtension());
    var gmoVideoFile = gmoVideoMediaObj.unix_file + this.getGMOId() + "." + untrustedVideoFileObj.extension;
    for(var u = 0; u < videoAudioPairFilePaths.length; u++) videoAudioPairFilePaths[u] = gmoVideoFile;
    gmoNBCFunc.moveFile(untrustedVideoFileObj.unix_file,gmoVideoMediaObj.unix_file + this.getGMOId() + "." + untrustedVideoFileObj.extension);
    gmoTrackHelper.saveEncodedTrackWithPositions(trackMedias.video,this.getUTSWorkingTrackObject(),[NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO].concat(videoAudioTrackTypes),
        [gmoVideoFile].concat(videoAudioPairFilePaths),[0].concat(this.getAudioFilePositions()),audioProfileTrackXml);   
    gmoNBCFunc.transitionTrackTypes(this.getGMOId(),this.requirements.toQCRequired,[NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO]);

    gmoNBCFunc.transitionTrackTypes(this.getUTSId(),this.requirements.toQCRequired,[NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO]);

    //Copy Metadata from shellrecord if possible
    gmoUploadHelper.copyMetadataFromShell();
}

MaterialRegistration.prototype.validateUnique = function() {

    print('reached validateUnique');
    var TVDProduction =  this.getUTSMaterialHelper().getTvdNum();
    // AR + Version Type + Standard + UHD/HDR + Transformation  + Language version(s)
    var aspectRatio = this.getUTSMaterialHelper().getAspectRatio();
    var versionType = this.getUTSMaterialHelper().getVersionType();
    var sourceFormat = this.getUTSMaterialHelper().getSourceFormat();
    var transformation = this.getUTSMaterialHelper().getTransformation();
    var UHD = _cleanupLanguageValues(this.getUTSMaterialHelper().isUHD());
    var primaryLanguage = _cleanupLanguageValues(this.getUTSMaterialHelper().getPrimaryLanguage());
    var secondaryLanguage = _cleanupLanguageValues(this.getUTSMaterialHelper().getSecondaryLanguage());
    var tertiaryLanguage = _cleanupLanguageValues(this.getUTSMaterialHelper().getTertiaryLanguage());

    print("TVDProduction - [" + TVDProduction + ']');
    print("aspectRatio - [" + aspectRatio + ']');
    print("versionType - [" + versionType + ']');
    print("transformation - [" + transformation + ']');
    print("UHD - [" + UHD + ']');
    print("primaryLanguage - [" + primaryLanguage + ']');
    print("secondaryLanguage - [" + secondaryLanguage + ']');
    print("tertiaryLanguage - [" + tertiaryLanguage + ']');

    var utsUploadProfile = this.getUTSMaterialHelper().getShortTextValue("Matched Profile");
    if (!gmoNBCFunc.isVarUsable(utsUploadProfile)) {
        throw new Error("No Matched Profile on Untrusted Material Id");
    }
    print("Matched House Profile: [" + utsUploadProfile + ']');
    var utsUploadProfilePreset = new Preset(utsUploadProfile,['shorttext',"tag"]);
    var sourceFormat = utsUploadProfilePreset.getDataElementValue('tag',"Video Standard");
    print("House Profile sourceFormat is: - [" + sourceFormat + ']');

    if (!gmoNBCFunc.isVarUsable(TVDProduction) ) {
        throw new Error("TVDProduction [" + TVDProduction + "] cannot be blank for validation to occur.");
    }

    if (!gmoNBCFunc.isVarUsable(aspectRatio) || aspectRatio == "Unknown") {
    throw new Error("aspectRatio [" + aspectRatio + "] cannot be blank or Unknown for validation to occur.");
    }

    if (!gmoNBCFunc.isVarUsable(versionType)) {
        throw new Error("versionType [" + versionType + "] cannot be blank for validation to occur.");
    }   

    if (!gmoNBCFunc.isVarUsable(sourceFormat)) {
        throw new Error("sourceFormat [" + sourceFormat + "] cannot be blank for validation to occur.");
    }

    // These combinations are a whitelist, check them first
    var aspectRatioVersionTypeCombo = aspectRatio + ":" + versionType;
    var validTVDProdAspectRatioVersionTypeCombos = gmoNBCFunc.getTagsForType("TVDAspectRatioVersionTypeList");

    // Mediator has a hidden list of valid TVDProduction Aspect Ratio / Version Type Combos. 
    if (validTVDProdAspectRatioVersionTypeCombos.indexOf(aspectRatioVersionTypeCombo) === -1) {
        throw new Error("aspectRatioVersionTypeCombo [" + aspectRatioVersionTypeCombo + "] is not a valid combination.");
        return false;
    }

    var tVDInspector = new TVDInspector(TVDProduction);
    var TVDMaterialList = tVDInspector.getMaterialObjectsList();
    var matchedMaterials = [];
    for each (var possiblyMatchedMaterial in TVDMaterialList ) {
        if (possiblyMatchedMaterial.matid.indexOf("UTS") === -1 ) {
        // Avoid using Junky records for comparision, ends up with junk like "aspectRatioVersionTypeCombo[String]: 14:9:"
        if (!gmoNBCFunc.isVarUsable(possiblyMatchedMaterial.aspectratio)) {
            print('Missing aspect ratio for [ ' + possiblyMatchedMaterial.matid + ", skipping");
            continue;
        }
        if (!gmoNBCFunc.isVarUsable(possiblyMatchedMaterial.versiontype)) {
            print('Missing Version Type for [ ' + possiblyMatchedMaterial.matid + "], skipping");
            continue;
        };
        if (!gmoNBCFunc.isVarUsable(possiblyMatchedMaterial.source_format)) {
            print('Missing source_format for [ ' + possiblyMatchedMaterial.matid + ", skipping");
            continue;
        }
        var matObject = {
            matid : possiblyMatchedMaterial.matid,
            aspectratio : possiblyMatchedMaterial.aspectratio,
            versiontype : possiblyMatchedMaterial.versiontype,
            aspectRatioVersionTypeCombo:  possiblyMatchedMaterial.aspectratio + ":" + possiblyMatchedMaterial.versiontype,
            UHD : _cleanupLanguageValues(possiblyMatchedMaterial.UHD),
            source_format : possiblyMatchedMaterial.source_format,
            primaryLanguage :  _cleanupLanguageValues(possiblyMatchedMaterial.primaryLanguage),
            secondaryLanguage : _cleanupLanguageValues(possiblyMatchedMaterial.secondaryLanguage),
            tertiaryLanguage : _cleanupLanguageValues(possiblyMatchedMaterial.tertiaryLanguage)
        };
        print("keeping non-UTS possiblyMatchedMaterial.MatId [" + possiblyMatchedMaterial.matid + "]");
        matchedMaterials.push(matObject); 
        } else {
            print('skipping UTS number: [' + possiblyMatchedMaterial.matid + ']')
        }
    }

    if (matchedMaterials.length < 1) {
        print("No non-UTS matches found, continuing")
        return true;
    }

    var checker = this.checkforDupes(matchedMaterials, primaryLanguage,secondaryLanguage,tertiaryLanguage,aspectRatioVersionTypeCombo, aspectRatio, versionType, sourceFormat, transformation,UHD);
    if (checker == false ) {
        const matMatches = [];
        for each (var mat in matchedMaterials) {
            matMatches.push(mat.matid);
        }
        print("Candidates for possible matching materials are: [" + matMatches.join(", ") + ']' )
        return false;
    }
    // If we couldn't find anything to object to, pass it on
    return true;
    
}

MaterialRegistration.prototype.checkforDupes = function(matchedMaterials, primaryLanguage,secondaryLanguage,tertiaryLanguage,aspectRatioVersionTypeCombo, aspectRatio, versionType, sourceFormat, transformation,UHD ) {

    for each (var partialMatch in matchedMaterials) {
        // It's ok to have an existing Aspect Ratio Version Type Combo IF the primary language is different
        if (primaryLanguage === partialMatch.primaryLanguage && secondaryLanguage === partialMatch.secondaryLanguage && tertiaryLanguage === partialMatch.tertiaryLanguage && aspectRatioVersionTypeCombo === partialMatch.aspectRatioVersionTypeCombo && UHD == partialMatch.UHD )  {
            MatReg.detailedError = "Material already exists for Aspect Ratio Version Type Combination [" + partialMatch.aspectRatioVersionTypeCombo + 'UHD: [' +  partialMatch.UHD +  "] with Primary Language [" + primaryLanguage + "] and Secondary Language [" + secondaryLanguage + "] and Tertiary Language [" + tertiaryLanguage + "] Please Purge at least [" + partialMatch.matid + "] and redrop files...";
            print(MatReg.detailedError);
            return false;
        }  else {
            if (aspectRatioVersionTypeCombo === matchedMaterials.aspectRatioVersionTypeCombo) {
                MatReg.detailedError = "Material already exists for Aspect Ratio Version Type Combination [" + aspectRatioVersionTypeCombo + "] Please Purge [" + matchedMaterials.matid + "] and redrop files...";
                print(MatReg.detailedError);
                return false;
            }
        }

    }
     // Now check for all 6 to match, if so, fail it
     // If they are both null, they matched already in the first part
     // "aspectratio" and similar spelling were already in TVDInspector
     for each (var fullMatch in matchedMaterials) {
         print('fullMatch.primaryLanguage is: [' + fullMatch.primaryLanguage + ']');
         print('fullMatch.secondaryLanguage is: [' + fullMatch.secondaryLanguage + ']');
         print('fullMatch.tertiaryLanguage is: [' + fullMatch.tertiaryLanguage + ']');

         print('primaryLanguage is: [' + primaryLanguage + ']');
         print('secondaryLanguage is: [' + secondaryLanguage + ']');
         print('tertiaryLanguage is: [' + tertiaryLanguage + ']');
         print('UHD is: ['  + UHD + ']');       
	// Intentionally using == here: - we want undefined and null to match, as well as "" (N/A etc are being changed into blank for comparison here )
        if (aspectRatio == fullMatch.aspectratio &&
            versionType == fullMatch.versiontype &&
            sourceFormat == fullMatch.source_format &&
            UHD == fullMatch.UHD && 
            transformation == fullMatch.transformation &&
            primaryLanguage == fullMatch.primaryLanguage &&
            secondaryLanguage == fullMatch.secondaryLanguage &&
            tertiaryLanguage == fullMatch.tertiaryLanguage
            )
         {
            MatReg.detailedError = "Cannot continue, matches on all criteria: aspectRatio: [" +  aspectRatio + "] versionType: [" + versionType +  "] sourceFormat: [" +  sourceFormat + "] UHD: [" + UHD +  "] transformation [" + transformation +  " languages [" + primaryLanguage + secondaryLanguage + tertiaryLanguage + "]";
            return false;
        }
    }
    return true;
}

function _main() {

    try { 
        output("materialRegistration.js - Start")
        var jobDescription = getJobParameter("jobDescription");
        output("\nJobDescription\n"+jobDescription+"]");
        var unTrustedMatId = jobDescription..MatId.toString();
        var job = new gmoNBCFunc.WSJobUpdateObject();
        job.updateStatusAndProgress("Starting Material Registration",10);    
  
        var materialRegistration = new MaterialRegistration(unTrustedMatId); 
        var isRetry = false;
        var shellRecordId = materialRegistration.getUTSMaterialHelper().getMaterialShortTextValue("Shell Record Id");
        var isRetry = gmoNBCFunc.isVarUsable(shellRecordId) ? true : false;
        if (isRetry) {
            print('Found retry ID - Shell Record ID - so not validating: [' + shellRecordId + ']' );
            materialRegistration.setGMOId(shellRecordId);
            materialRegistration.startRegistration();
            job.updateStatusMap({"Shell_Record_MatId":materialRegistration.getGMOId()});
            job.updateStatusAndProgress("Completed Successfully",100);
        } else {
            print('Did NOT find retry ID - Shell Record ID: running validateUnique')
            if (materialRegistration.validateUnique()) {
                print('No duplicates found, proceeding');
                materialRegistration.startRegistration();
                job.updateStatusMap({"Shell_Record_MatId":materialRegistration.getGMOId()});
                job.updateStatusAndProgress("Completed Successfully",100);
            } else {
                job.updateStatusAndProgress(MatReg.detailedError,100);
                throw new Error( MatReg.detailedError );
            }
        }
    } catch(e) {

        output("run_materialRegistration - Error ["+e.message+"]");

        gmoNBCFunc.transitionTrackTypes(materialRegistration.getUTSId(),materialRegistration.requirements.toOMUploadFailed,[NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO]);

        if (gmoNBCFunc.isVarUsable(job)) {
            job.updateStatusMap({"Shell_Record_MatId":materialRegistration.getGMOId()});
            job.updateStatus(e.message);
        }
        if (gmoNBCFunc.isVarUsable(materialRegistration.getGMOId())) {
            gmoNBCFunc.transitionTrackTypes(materialRegistration.getGMOId(),materialRegistration.requirements.toOMUploadFailed,NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO);   
        }
        if (gmoNBCFunc.isVarUsable(materialRegistration.getAudioTrackTypes() && !materialRegistration.isAudioRegistrationComplete())) {
            gmoNBCFunc.transitionTrackTypes(materialRegistration.getGMOId(),materialRegistration.requirements.toOMUploadFailed,materialRegistration.getAudioTrackTypes());   
        }
        quit(1);

    }finally{
        output("run_materialRegistration.js - End")
    }
}

function _cleanupLanguageValues(languageString) {

    var bogusValues = ['N/A', 'NA', 'undefined'];
    for (i = 0; i < bogusValues.length; i++) {
        languageString = languageString.replace(bogusValues[i], '');
    }
    return languageString;
}

if(typeof _jobId != "undefined"){
    _main();
}else{
    output("Script is Executed Without Job Information")
}
