load('/opt/evertz/mediator/lib/js/shellfun.js');
if(typeof(NBCGMO_CONSTANTS)==="undefined") load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js");
if(typeof(gmoNBCFunc)==="undefined") load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");

function ServiceManually(utsId) {

    if((this instanceof ServiceManually) === false)  throw new Error("Please call constructor with new() keyword")

    if(gmoNBCFunc.isVarUsable(utsId)){
        this.setUTSId(utsId);
        this.setUTSMaterialHelper(new gmoNBCFunc.materialHelper(this.getUTSId()));
        this.archiveLocaitonRef = "FROM_StudioPost_T2";
    }else{
        throw new Error ("Unrusted Source Material Id is required to Service File Manually.")
    }
}

ServiceManually.prototype.constructor = ServiceManually;

ServiceManually.prototype.requirements = {
    complete : "Complete",
    error : "Error"
}

ServiceManually.prototype.setUTSId = function(matId){
    this.__UTSId = matId;
}

ServiceManually.prototype.getUTSId = function(){
    return this.__UTSId;
}

ServiceManually.prototype.setUTSMaterialHelper = function(utsHelper){
    this.__UTSMaterialHelper = utsHelper;
}

ServiceManually.prototype.getUTSMaterialHelper = function(){
    return this.__UTSMaterialHelper;
}

ServiceManually.prototype.moveAndDeleteStaging = function(){
    var dropFolder = this.getUTSMaterialHelper().getTagValue(NBCGMO_CONSTANTS.TAGS.DROP_FOLDER);
    var stagingMedia = lookup.dropfolder[dropFolder].stagingMedia;
    var originalFileName = this.getUTSMaterialHelper().getMaterialShortTextValue("Original File Name");
    var servicePath = lookup.dropfolder[this.archiveLocaitonRef].mount + "failed/Service_Manually/" + originalFileName;
    if(!gmoNBCFunc.isVarUsable(stagingMedia)) throw new Error ("Unable to identify where the source file is located");
    var fileNameWithPath = this.getUTSMaterialHelper().getPathAndFileOfTrackTypeOnMedia(stagingMedia,NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO,false);
    var sourceFileObject = new gmoNBCFunc.usefulFileObj(fileNameWithPath)
    if(!sourceFileObject.exists()){
        throw new Error ("Mediator has registered the file location as but file is not located in ["+sourceFileObject+"]");
    }
    
    gmoNBCFunc.moveFile(sourceFileObject.unix_file, servicePath);
    output("Moved file to archive location successully.");
    gmoNBCFunc.deleteTrackWithDeleteMark(this.getUTSId(),stagingMedia);
}

function _main() {
    try { 
        output("run_serviceManually.js - Start")
        var jobDescription = getJobParameter("jobDescription");
        output("\nJobDescription\n"+jobDescription+"]");
        var unTrustedMatId = jobDescription..MatId.toString();
        var job = new gmoNBCFunc.WSJobUpdateObject();
        job.updateStatusMap({"Script_MatId":unTrustedMatId});
        job.updateStatusAndProgress("Starting Service Manually",10);    
        var serviceManually = new ServiceManually(unTrustedMatId);
        serviceManually.moveAndDeleteStaging();
        gmoNBCFunc.transitionTrackTypes(serviceManually.getUTSId(),serviceManually.requirements.complete,[NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO]);
        job.updateStatusAndProgress("Completed successully.",100);    
    } catch(e) {
        output("run_serviceManually - Error ["+e.message+"]");
        gmoNBCFunc.transitionTrackTypes(serviceManually.getUTSId(),serviceManually.requirements.error,[NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO]);
        job.updateStatusAndProgress("Failed to move file to Service Manually location.",100);    
        quit(1);

    }finally{
        output("run_serviceManually - End")
    }
}

if(typeof _jobId != "undefined"){
    _main();
}else{
    output("Script is Executed Without Job Information")
}
