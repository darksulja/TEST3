load('/opt/evertz/mediator/lib/js/shellfun.js');
if(typeof(NBCGMO_CONSTANTS)==="undefined") load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js");
if(typeof(gmoNBCNLDFunc)==="undefined") load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
if(typeof(gmoNBCFunc)==="undefined") load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
if(typeof(gmoNBCVantageFunc)==="undefined") load("/opt/evertz/mediator/etc/runners/nbcgmo_vantage_fun.js");
if(typeof (MediaInfoHelper) === "undefined") load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");
if(typeof(TrackHelper)==="undefined")  load("/opt/evertz/mediator/etc/helpers/TrackHelper.js");

function FixVantageTranscode(utsId) {

    if((this instanceof FixVantageTranscode) === false)  throw new Error("Please call constructor with new() keyword");

    if(gmoNBCFunc.isVarUsable(utsId)){
        this.setUTSId(utsId);
        this.setUTSMaterialHelper(new gmoNBCFunc.materialHelper(this.getUTSId()));
        this.setSourceFileObject(this.getUTSMaterialHelper().getPathAndFileOfTrackTypeOnMedia(NBCGMO_CONSTANTS.MEDIAS.STAGING.DC_T2_OM_STAGING,NBCGMO_CONSTANTS.VIDEO,true));
        this.setWorkingFileObject(lookup.media[NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING].mount + File.separator + this.getUTSId() + NBCGMO_CONSTANTS.DOT_DIR  + File.separator + NBCGMO_CONSTANTS.VIDEO + File.separator + this.getSourceFileObject().filename);
    }else{
        throw new Error ("Unrusted Source Material Id is required to re-transcode material.");
    }
}

FixVantageTranscode.prototype.constructor = FixVantageTranscode;

FixVantageTranscode.prototype.setUTSId = function(matId){
    this.__UTSId = matId;
}

FixVantageTranscode.prototype.getUTSId = function(){
    return this.__UTSId;
}

FixVantageTranscode.prototype.setUTSMaterialHelper = function(utsHelper){
    this.__UTSMaterialHelper = utsHelper;
}

FixVantageTranscode.prototype.getUTSMaterialHelper = function(){
    return this.__UTSMaterialHelper;
}

FixVantageTranscode.prototype.setSourceFileObject = function(path){
    var videoFileObject = new gmoNBCFunc.usefulFileObj(path);
    if (!videoFileObject.exists()){
        throw new Error("Source video file [" + videoFileObject.unix_file + "] does not exist, cannot continue.");
    }
    this.__sourceFileObj = videoFileObject;
}

FixVantageTranscode.prototype.getWorkingFileObject = function(){
    return this.__workingFileObj;
}

FixVantageTranscode.prototype.setWorkingFileObject = function(path){
    var videoFileObject = new gmoNBCFunc.usefulFileObj(path);
    this.__workingFileObj = videoFileObject;
}

FixVantageTranscode.prototype.getSourceFileObject = function(){
    return this.__sourceFileObj;
}

FixVantageTranscode.prototype.setTranscodedFileObject = function(path){
    var videoFileObject = new gmoNBCFunc.usefulFileObj(path);
    this.__transcodedFileObj = videoFileObject;
}

FixVantageTranscode.prototype.getTranscodedFileObject = function(){
    return this.__transcodedFileObj;
}

FixVantageTranscode.prototype.setWorkflow = function(workflow){
    this.__workflow = workflow;
}

FixVantageTranscode.prototype.getWorkflow = function(){
    return this.__workflow;
}

FixVantageTranscode.prototype.getFileMediaInfoHelper= function(){
    return this.__workflow;
}

FixVantageTranscode.prototype.setMediaInfoHelper = function(fileObj) {
    this.__mediaInfoHelper = new MediaInfoHelper();

    if (!fileObj.exists()) throw new Error("Source video file [" + fileObj.unix_file + "] does not exist, can not continue");

    this.__mediaInfoHelper.setSourceFile(fileObj);
}

FixVantageTranscode.prototype.getFileMediaInfoHelper = function() {
    return this.__mediaInfoHelper;
}

FixVantageTranscode.prototype.getVantageObject = function(){
    var vantageObj = new gmoNBCVantageFunc.Standard_Vantage_Object();
    vantageObj.setOriginal(this.getSourceFileObject());
    vantageObj.setJobName(this.getWorkflow() + "-" + this.getUTSId());
    vantageObj.setWorkflowName(this.getWorkflow());

    this.setMediaInfoHelper(this.getSourceFileObject());
    vantageObj.setVar("Audio Channels",this.getFileMediaInfoHelper().getTotalNumberOfAudioChannels());
    vantageObj.setVar("output_filename", this.getSourceFileObject().basename);
    vantageObj.setVar("destfilepath", this.getWorkingFileObject().win_path);

    return vantageObj;
}

FixVantageTranscode.prototype.startTranscode = function(){
    output("Starting transcode of [" + this.getSourceFileObject().unix_file + "] using workflow [" + this.getWorkflow() + "]");
    show(this.getVantageObject());

    if(this.getUTSMaterialHelper().getTrackList().(MediaName.toString() === NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING && parseInt(DeleteMark) === 0).length() > 0){
        output("Deleting existing [" + NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING + "] track from previous transcode.");
        gmoNBCFunc.deleteTrackWithDeleteMark(this.getUTSId(), NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING);
    }
    gmoNBCFunc.makeDirectory(this.getWorkingFileObject().unix_path);
    var result = gmoNBCVantageFunc.makeAndRunTranscodeJob(this.getVantageObject());

    if (result == true) {
        output("\nSuccessfully Transcoded ["+this.getSourceFileObject().unix_file+"]");
    } else {
        throw new Error("Vantage Transcode Failed with Error [" + result + "]");
    }

    this.setTranscodedFileObject(this.getWorkingFileObject().unix_file);
    if (!this.getTranscodedFileObject().exists()){
        throw new Error("Could not find destination file.");
    }else{
        output("Saving [" + NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING + "] with newly transcoded file");
        var th = new TrackHelper(this.getUTSId());
        th.saveEncodedTrack(NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING,null,[NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO],[this.getWorkingFileObject().unix_file]);
    }       
}

function _main() {

    try { 
        output("run_fixVantageTranscode.js - Start")
        var jobDescription = getJobParameter("jobDescription");
        output("\nJobDescription\n"+jobDescription+"]");
        var unTrustedMatId = jobDescription..MatId.toString();
        output("\nMatId : "+unTrustedMatId+"\n ");
        gmoNBCFunc.transitionTrackTypes(unTrustedMatId,NBCGMO_CONSTANTS.TRIGGERS.START,NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO);
        var job = new gmoNBCFunc.WSJobUpdateObject();
        job.updateStatusAndProgress("Starting attempt to fix untrusted source file.",10); 
        var fixVT = new FixVantageTranscode(unTrustedMatId);
        fixVT.setWorkflow(fixVT.getUTSMaterialHelper().getTagValue(NBCGMO_CONSTANTS.TAGS.MSA_REVIEW_VANTAGE_WORKFLOW));
        vantageWorkflow = fixVT.getUTSMaterialHelper().getTagValue(NBCGMO_CONSTANTS.TAGS.MSA_REVIEW_VANTAGE_WORKFLOW);
        filename = fixVT.getUTSMaterialHelper().getMaterialShortTextValue(NBCGMO_CONSTANTS.SHORT_TEXTS.ORIGINAL_FILE_NAME);
        job.updateStatusMap({"Script_MatId":unTrustedMatId});
        job.updateStatusMap({"Vantage_Workflow":vantageWorkflow});
        output("\n"+"Vantage workflow :"+vantageWorkflow+"\n")
        job.updateStatusMap({"Original_Filename":filename});
        output("\nOriginal File :"+filename+"\n");
        job.updateStatusAndProgress("Transcoding...",50);
        fixVT.startTranscode();
        gmoNBCFunc.transitionTrackTypes(unTrustedMatId,NBCGMO_CONSTANTS.TRIGGERS.COMPLETE_FIX,NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO);
        job.updateStatusAndProgress("Completed Successfully",100);
    }catch(e){

        output("run_fixVantageTranscode - Error ["+e.message+"]");

        if (gmoNBCFunc.isVarUsable(job)) {
            job.updateStatus(e.message);    
        }

        gmoNBCFunc.transitionTrackTypes(unTrustedMatId,NBCGMO_CONSTANTS.TRIGGERS.FAILED_FIX,NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO);
        quit(1);

    }finally{
        output("run_fixVantageTranscode.js - End");
    }
}

if(typeof _jobId != "undefined"){
    _main();
}else{
    output("Script is Executed Without Job Information");
}
