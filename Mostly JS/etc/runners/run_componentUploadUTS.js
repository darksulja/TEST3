/*
* @Author: Chad Lundgren, based on run_untrustedOMUpload.js
* @Date:   2018-08-24 03:15:34
* @Last Modified by:   Chad Lundgren
* @Last Modified time: 2018-08-28 08:15:34
*/

load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")
if(typeof(daisyFileNameHelper)==="undefined")  load("/opt/evertz/mediator/etc/helpers/DaisyFilenameAPI.js")
load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js'); // This is included becasue we want the JSON parsing
this._JRAPI = new JRAPI();
var job = new gmoNBCFunc.WSJobUpdateObject();

const Component = {};
Component.triggers = {
    toSourceMediaReceived : NBCGMO_CONSTANTS.TRIGGERS.UPLOAD,
    toComponentUploadFailed : NBCGMO_CONSTANTS.TRIGGERS.FAILED,
    toComponentReviewRequired: NBCGMO_CONSTANTS.TRIGGERS.COMPLETE,
    toPurge:  NBCGMO_CONSTANTS.TRIGGERS.PURGE
}
Component.states = {
    MEDIA_RECEIVED: "Media Received"
}
/// Component.triggers.toSourceMediaReceived
Component.daisyIDLookups = {} ;
function UploadHelper() {

    if((this instanceof UploadHelper) === false)    throw new Error("Please call constructor with new() keyword")
    if(typeof(MediaInfoHelper)==="undefined")  load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js")
    if(typeof(TrackHelper)==="undefined")  load("/opt/evertz/mediator/etc/helpers/TrackHelper.js")
}

Component.uploadType = "Audio 1"; // Default for unknown audio

UploadHelper.prototype.constructor = UploadHelper;

UploadHelper.requirements = {
    toMediaValidation : NBCGMO_CONSTANTS.TRIGGERS.COMPLETE,
    toComponentUploadFailed : NBCGMO_CONSTANTS.TRIGGERS.FAILED
}

UploadHelper.prototype.setFilePath = function(filePath){
    this._filePath = filePath;
}

UploadHelper.prototype.getFilePath = function(){
    return this._filePath;
}

UploadHelper.prototype.setFileName = function(fileName){
    this._fileName = fileName;
}

UploadHelper.prototype.getFileName = function(){
    return this._fileName;
}

UploadHelper.prototype.validateUploadParameters = function(filePath,fileName){
    output("UploadHelper validateUploadParameters - Start")
    if(!gmoNBCFunc.isVarUsable(filePath)){
        throw new Error("Unable to upload content as source location of the content is null or empty");
    }
    
    if(!gmoNBCFunc.isVarUsable(fileName)){
        throw new Error("Unable to upload content as source file name is null or empty")
    }
    output("UploadHelper validateUploadParameters - End")
}

UploadHelper.prototype.generateMatId = function(){
    output("UploadHelper generateMatId - Start")
    var _matId = gmoNBCFunc.generateMatId(NBCGMO_CONSTANTS.GENERATOR_SCRIPTS.UNTRUSTED_COMPONENT_ID,
        NBCGMO_CONSTANTS.FREE_SEQUENCE_MAPPING.UNTRUSTED_COMPONENT_ID);
    output("UploadHelper generateMatId - End")
    return _matId;
}

UploadHelper.prototype.getDropFolder = function(filePath){
    output("UploadHelper getDropFolder - Start")
    var dropFolderPathInParts = filePath.split("/");
    var _dropFolder = dropFolderPathInParts[dropFolderPathInParts.length-1];
    output("UploadHelper getDropFolder - End")
    return _dropFolder;
}

UploadHelper.prototype.getStagingMedia = function(dropFolder) {
    output("UploadHelper getStagingMedia - Start")
    var _stagingMedia = "";
    print('lookup.dropfolder[dropFolder] is: ' + lookup.dropfolder[dropFolder]  )
    if(gmoNBCFunc.isVarUsable(dropFolder) && 
        gmoNBCFunc.isVarUsable(lookup.dropfolder[dropFolder]) &&
        gmoNBCFunc.isVarUsable(lookup.dropfolder[dropFolder].stagingMedia)){
            print('using REAL dropfolder setting')
        _stagingMedia = lookup.dropfolder[dropFolder].stagingMedia;
    }else {
        print('using fallback dropfolder setting')
        _stagingMedia = NBCGMO.omUploadSettings.defaultVideoStagingMedia;
    }
    print('_stagingMedia is: [' + _stagingMedia + ']');
    output("UploadHelper getStagingMedia - End")
    return _stagingMedia;
}

UploadHelper.prototype.registerMaterial = function(matId,fileName,dropFolder){
    output("UploadHelper registerMaterial - Start")

    job.updateStatusAndProgress("Generating a Untrusted Component ID",15);
    output("Component Material ID ["+matId+"]");
    job.updateStatusMap({"Script_MatId":matId});
    var defaultTrackType = Component.uploadType;
    var mh = new gmoNBCFunc.materialHelper(matId);
    sleep(3);
    try{    
        mh.addOwnerToSaveXml(NBCGMO_CONSTANTS.OWNERS.NBCU_GMO);
        mh.addTrackTypeLink(defaultTrackType, NBCGMO_CONSTANTS.STATES.NOT_AVAILABLE, NBCGMO_CONSTANTS.STATE_MACHINES.UNTRUSTED_COMPONENT);
        mh.addTitleToSaveXml(Component.daisyIDLookups.title);
        print('after addTitle');
        mh.addTrackTypeLinkShortText(defaultTrackType,NBCGMO_CONSTANTS.SHORT_TEXTS.ORIGINAL_FILE_NAME,fileName);
        mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.DAISY_ID,Component.daisyIDLookups.daisyId );
        print('after daisyId');
        mh.addShortTextToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.TVD_PRODUCTION_NUM,Component.daisyIDLookups.prodNumber);  // # Is an illegal character according to Rhino
        mh.addTagToSaveXml(NBCGMO_CONSTANTS.SHORT_TEXTS.PRIMARY_LANGUAGE,Component.daisyIDLookups.mediatorLanguage);
        var check = mh.getSaveXml();
        print("Checking XML\n\n" + check);
        mh.saveUsingSaveXml();
    }catch(re){
        output("UploadHelper registerMaterial - Error - Untrusted Material Registration Failed: " + re);
        throw new Error("Untrusted Material Registration Failed");
    }
    output("UploadHelper registerMaterial - End")
}

UploadHelper.prototype.moveFileToStagingMedia = function(matId,stagingMedia,filePath){
    print('inside moveFileToStagingMedia, stagingMedia is:  [' + stagingMedia + ']' );
    output("UploadHelper moveFileToStagingMedia - Start")
    if (lookup.media[stagingMedia].usesMatIdDir) {
        
        var stagingMediaFileObj = new gmoNBCFunc.usefulFileObj(lookup.media[stagingMedia].mount + matId + 
                NBCGMO_CONSTANTS.DOT_DIR + matId + NBCGMO_CONSTANTS.DOT + gmoNBCFunc.getFileExtension(filePath));

        output("Creating Directory [" + stagingMediaFileObj.unix_path + "]");
        gmoNBCFunc.makeDirectory(stagingMediaFileObj.unix_path);
        if (!fileExists(stagingMediaFileObj.unix_path)) throw new Error("\nFailed to create Staging Directory at [" + stagingMediaFileObj.unix_path + "]");
        sleep(1);
        var results_dir = run("/bin/ls", "-lh", stagingMediaFileObj.unix_path);

        copy(filePath,stagingMediaFileObj.unix_file);
        //Check File Existence
        sleep(1);
        var results_copy = run("/bin/ls", "-lh", stagingMediaFileObj.unix_path);
        if (fileExists(stagingMediaFileObj.unix_file)) {
            output("Copy Successful");
        } else {
            throw new Error("\nError Move failed. Cannot see file at [" + stagingMediaFileObj.unix_file +"]");
        }
    }
    output("UploadHelper moveFileToStagingMedia - End")
    return stagingMediaFileObj;
}

function _main(){
    
    try { 
        output("run_componentUploadUTS.js - Start")
        var jobDescription = getJobParameter("jobDescription");
        output("\nJobDescription\n"+jobDescription+"]");
        job.updateStatusAndProgress("Starting Untrusted Component Upload Script",5);
   
        var uploadHelper  = new UploadHelper();
        var matId = uploadHelper.generateMatId();  // UTC, not UTS prefix
        print('matid is: [' + matId + ']');
        uploadHelper.setFileName(jobDescription..Files.TextList.Text.toString());
        uploadHelper.setFilePath(jobDescription..Path.toString())
        output("FilePath ["+uploadHelper.getFilePath()+"]")
        output("FileName ["+uploadHelper.getFileName()+"]")
        job.updateStatusMap({"Script_FileName":uploadHelper.getFileName()});
        job.updateStatusMap({"Script_FolderPath":uploadHelper.getFilePath()});

        var dropFolder = uploadHelper.getDropFolder(uploadHelper.getFilePath());
        print('dropFolder is: [' + dropFolder + ']' )
        const stagingMedia = uploadHelper.getStagingMedia(dropFolder);
        print('stagingMedia is: [' + stagingMedia + ']');
        uploadHelper.validateUploadParameters(uploadHelper.getFilePath(),uploadHelper.getFileName());

        var extensionFound = gmoNBCFunc.getFileExtension(uploadHelper.getFileName());
        print('extension found: [' + extensionFound + ']'  );
        if (extensionFound !== "wav") {
            Component.uploadType = "Subtitle 1";  //Unknown Subtitle Type, SUB_UN-01, Class name Subtitle, language id 0
        }

        output("Drop Folder ["+dropFolder+"]")
        job.updateStatusMap({"Script_DropFolder":dropFolder});

        if(!gmoNBCFunc.isVarUsable(stagingMedia)){
            throw new Error("No Default Staging Media or Drop Folder Specific Staging Media is setup for upload")
        }
        job.updateStatusMap({"Script_StagingMedia":stagingMedia});
        job.updateStatusAndProgress("Saving Component upload Staging Track",30);
        var stagingFileObj = uploadHelper.moveFileToStagingMedia(matId,stagingMedia,uploadHelper.getFilePath()+ File.separator +uploadHelper.getFileName());
        job.updateStatusAndProgress("Move Completed, now looking up Daisy information with filename",55);

        var fileNameForSearch = uploadHelper.getFileName();
        //var fileNameForSearch = "Megamind_DA000990307_10A34_FTR_Theatrical_2398_CSP_2PM_ST20.wav";
        try {
            // Null since original uses matID
            var dh = new  gmoNBCDaisy.daisyFileNameHelper(null,fileNameForSearch);
            var response =  dh.getResultJSON();
            if (response.Found == true) {
                Component.daisyIDLookups.fileName = response.fileName;
                Component.daisyIDLookups.title = response.title;
                Component.daisyIDLookups.daisyId = response.daisyId;
                Component.daisyIDLookups.prodNumber =  response.prodNumber;
                Component.daisyIDLookups.mediatorLanguage =  response.mediatorLanguage;
                print("filename used for search: [" +  Component.daisyIDLookups.fileName + ']');
                print("Title: [" +   Component.daisyIDLookups.title + ']');
                print("daisyId: [" + Component.daisyIDLookups.daisyId + ']');
                print("prodNumber: [" + Component.daisyIDLookups.prodNumber + ']');
                print("mediatorLanguage: [" +  Component.daisyIDLookups.mediatorLanguage + ']');
                print('\n\n');
            } else {
                print('file not found on Daisy API');
                Component.daisyIDLookups.fileName = fileNameForSearch;
                Component.daisyIDLookups.title = Component.daisyIDLookups.fileName;
                Component.daisyIDLookups.daisyId = 'N/A';
                Component.daisyIDLookups.prodNumber = 'N/A';
                // Taglist, must be real value
                Component.daisyIDLookups.mediatorLanguage = 'EN-US';
                print(" Fallback filename used for search: [" +  Component.daisyIDLookups.fileName + ']');
                print(" Fallback Title: [" +   Component.daisyIDLookups.title + ']');
                print(" Fallback daisyId: [" + Component.daisyIDLookups.daisyId + ']');
                print(" Fallback prodNumber: [" + Component.daisyIDLookups.prodNumber + ']');
                print(" Fallback mediatorLanguage: [" +  Component.daisyIDLookups.mediatorLanguage + ']');
                print('\n\n');

            }
        } catch (error) {
            throw new Error('Daisy API connection failed: [' + error + '], purging this material.');
        }
        sleep(5)
        uploadHelper.registerMaterial(matId,fileNameForSearch,dropFolder);

        job.updateStatusAndProgress("Untrusted Component Registration Complete",75);  
        sleep(1);
        gmoNBCFunc.transitionMaterial(matId, NBCGMO_CONSTANTS.STATES.NOT_AVAILABLE, Component.triggers.toSourceMediaReceived); 
        sleep(1);
        // Possibly do some basic validation here?
        gmoNBCFunc.transitionMaterial(matId, Component.states.MEDIA_RECEIVED, Component.triggers.toComponentReviewRequired);
        job.updateStatusAndProgress("Completed Successfully",100);
        
    }catch(err){

        output("run_componentUploadUTS - Error ["+err.message+"]");

        if (gmoNBCFunc.isVarUsable(job)) {
            job.updateStatus(err.message);
        }
        quit(1);

    }finally{
        output("run_componentUploadUTS.js - End")
    }
}

if(typeof _jobId != "undefined"){
    _main();
}else{
    output("Script is Executed Without Job Information")
}
