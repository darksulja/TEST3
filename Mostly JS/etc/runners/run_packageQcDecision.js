/*
Last Modified: 04/16/2018
Updated By: Chad Lundgren <chad.lundgren@nbcuni.com>
Updated : 08/28/18 
Updated By: Chris Filippone
Reason : Added Confidence Level by pass QC
 */

load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/usr/local/pharos/etc/runners/pipelineHelper.js");
load("/usr/local/pharos/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");

const STATUS_POLL_TIME = 10;

try {
    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
    print("Job Description: " + jobDescription);
    
    // Key used for NLD settings in lookup.js regarding working directories.
    var vodWorking = "NLD_WORKING_DIR"
    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();

    jobDashboard.updateStatusAndProgress("Starting Script",5);
    
    var requirements = {
        bypassQc : "Bypass QC",
        packageQc: "Package QC",
        updateRequired:"Update Required",
        cancel:"Cancel",
        passedConfidenceLevel : "Bypass QC Confidence Level"
        }
    
    var states = {
        packageQcDecision : "Package QC Decision",
        qcDecision : "QC Decision"   
    }
        
    // Get required values from Job Description.
    var placingId = jobDescription.Properties.Mapping.domainKey.toString();
    var placingHelper = new PlacingHelper(placingId);
    jobDashboard.updateStatusAndProgress("Gathering Placing Details/Settings",10);
    
    // Get the placing details. Duration is stored in parcelMaterial, which is now added to getPlacingXml
     var placingXml = placingHelper.getPlacingXml();
    // print("PlacingXml: " + placingXml);
  
            
    print(
        "Placing Id [" + placingId + "] \n"
    );

    // Get staging information and generic job information.
    var pubDefName = placingHelper.getPubDef();    
    print("\n" +
        "Publication Definition Name [" + pubDefName + "] \n"
    );
    print("Check state machine : "+placingXml.StateMachine);
    if(placingXml.StateMachine  == "Ad Ops Distribution State Machine") {
    // adops 
        print('Found Ad Ops Placing');
        gmoNBCNLDFunc.transitionPlacing(placingId, states.qcDecision, requirements.packageQc);
        quit(0);
     }
    // need to check for confidence Level to be ready
    var error_counter =0;
    //
    print("Checking to see if Confidence Level is ready");
    while(true){
        var confidenceLevelValue = placingXml..ShortTextList.ShortText.(ShortTextType == "Confidence Interval Value").Value.toString();
        if (gmoNBCFunc.isVarUsable(confidenceLevelValue)){
                break;
        }else if(error_counter > 60){
            print("Time out without Ci value.  Pass on to Package QC Required");
            confidenceLevelValue = 0;
            break;
        }else{
            print("Waiting");
        }

    sleep(STATUS_POLL_TIME)
    placingHelper.refresh();
    var placingXml = placingHelper.getPlacingXml();
    error_counter ++;
    }
    print ("Found CI ");
    // Using the presets/placing metadata, lets get a list of settings that we need to use later.
    var settings = gmoNBCNLDFunc.getSettings(placingXml);
    var workOrderCanceled = placingXml..ShortTextList.ShortText.(ShortTextType == "Flagged For Cancel").Value.toString();
    var awaitingUpdate = placingXml..ShortTextList.ShortText.(ShortTextType == "Flagged For Update").Value.toString();        
    var restoreAndDeliver = placingHelper.isRestoreAndDeliverFromPlacingShortText();
    // Confidence Interval Check. 
    // TAG for exclusions : Skip Confidence Level Bypass
    // Tag for magic number to bypass : Skip Confidence Level
    //     Default is for all 
    //     pubdef would be specific to pub def
    //

    var confidenceLevelValueNumber = parseInt(confidenceLevelValue)
    if(gmoNBCFunc.isVarUsable(confidenceLevelValueNumber)){
        var bypassCIcheck = gmoNBCFunc.isVarUsable(gmoNBCFunc.getTagByTagTypeAndValue("Confidence Level Exclusion List",pubDefName)) ? true : false ;
        var bypassQCnumber = parseInt(gmoNBCFunc.getTagByTagTypeAndValue("Confidence Level Threshold Definition","Default").Description) ;
        var customBypassQCnumber = gmoNBCFunc.isVarUsable(gmoNBCFunc.getTagByTagTypeAndValue("Confidence Level Threshold Definition",pubDefName)) ? parseInt(gmoNBCFunc.getTagByTagTypeAndValue("Confidence Level Threshold Definition",pubDefName).Description) : null ;
        print("Pubdef : "+pubDefName);
        print("Confidence Interval for placing : " + confidenceLevelValueNumber );
        print("Does pub def exists in always QC list : " + bypassCIcheck);
        print("Default Bypass magic number : " + bypassQCnumber);
        print("Custom Bypass magic number : " + customBypassQCnumber);
    }
    //
    print("Restore and Deliver Profile is: " + restoreAndDeliver)

    if (workOrderCanceled.toLowerCase() == "true") {
        gmoNBCNLDFunc.transitionPlacing(placingId, states.packageQcDecision, requirements.cancel);
        gmoNBCNLDFunc.savePlacingShortText(placingId, 'Flagged For Cancel', false);
    }
    else if (awaitingUpdate.toLowerCase() == "true") {
        gmoNBCNLDFunc.transitionPlacing(placingId, states.packageQcDecision, requirements.updateRequired);
        gmoNBCNLDFunc.savePlacingShortText(placingId, 'Flagged For Update', false);
    }

    else if (restoreAndDeliver) {

    // Get durations, defaulted here
    var sourceDuration = 0;
    var restoreDuration = 0;
    var MatID = placingHelper.getMainMaterial()

    var mainMaterialHelper = new gmoNBCFunc.materialHelper(MatID);
    sourceDuration =  placingXml..Material.(MatId==placingXml..MainMaterial..MatId.toString()).Duration.toString();
    print("\n sourceDuration is: [ " + sourceDuration + " ] .\n" );

    var materialWorld = mainMaterialHelper.getTrackList();
    var pipelineHelper = new PipelineHelper(placingHelper, vodWorking);
    var currentWorkingFolder = pipelineHelper.getCurrentWorkingFolder();
    var fh = pipelineHelper.getPackagingFolder() + MatID + '.mov';
    var videoFileObject = new gmoNBCFunc.usefulFileObj(fh);
    output('videoFileObject.unix_file is: ' + videoFileObject.unix_file);

    if (!videoFileObject.exists()) {
        output('did not find file matching placing materialID from ' + videoFileObject.unix_file +', trying packaging name');
        //mediainfo returns status of 1 if handed an MXF file, so mov is a reasonable assumption
        var packagingFileName =  pipelineHelper.getPackagingFolder() + placingXml..ShortTextList.ShortText.(ShortTextType.toString() === "NLD Video Output Delivery Filename").Value.toString();
        output('Packaging filename is: [' + packagingFileName + ']');
        var packagingFileObject = new gmoNBCFunc.usefulFileObj(packagingFileName);
        if (!packagingFileObject.exists()) {
            var errorMessage = "Cannot find restore file, transitioning to Package QC " +  packagingFileObject.unix_file;
            output(errorMessage);
            gmoNBCNLDFunc.transitionPlacing(placingId, states.packageQcDecision, requirements.packageQc);
            gmoNBCFunc.saveNote("Placing",placingId,"Info","ERROR","IMPORTANT",errorMessage);
            // mediaInfo exits with status 1 for not existing file, which causes An error has occured: run() command failed: exit code:1
             quit(0);
             } else {
                //If this works, use the right filename.
                 videoFileObject = packagingFileObject;
                 output("FileObject being used is now:" + videoFileObject )
             }
    }

    var mediaInfo = new MediaInfoHelper(placingId);
    mediaInfo.setSourceFile(videoFileObject);
    var restoreDuration = mediaInfo.getTimeCodes().duration;
    print( "\nrestoreDuration is: [" + restoreDuration  + " ] .\n");
    // pub def example  Movies_Anywhere_Semi_TL
    // Check duration to see if the restore worked correctly
     if ( sourceDuration == restoreDuration) {
        output("\n:::::Moving to Delivery Required: Duration of restore:  " + restoreDuration + " MATCHES source duration of " +  sourceDuration + "\n");
            gmoNBCNLDFunc.transitionPlacing(placingId, states.packageQcDecision, requirements.bypassQc);

        } else {
                var errorMessage = "Duration of restore: " + restoreDuration + " does not match source duration of " +  sourceDuration;
                output(errorMessage);
                gmoNBCNLDFunc.transitionPlacing(placingId, states.packageQcDecision, requirements.packageQc);
                gmoNBCFunc.saveNote("Placing",placingId,"Info","ERROR","IMPORTANT",errorMessage);
                }
    }
    // check CI
    else {
        if (bypassCIcheck){
            print("Bypass Confidence Interval check - QC always");
            gmoNBCNLDFunc.transitionPlacing(placingId, states.packageQcDecision, requirements.packageQc);
        } else if (gmoNBCFunc.isVarUsable(customBypassQCnumber) && confidenceLevelValue > customBypassQCnumber){
            print("Confidence Interval passes custom bypass QC number - No QC ");
            gmoNBCNLDFunc.transitionPlacing(placingId, states.packageQcDecision, requirements.passedConfidenceLevel);
        } else if (gmoNBCFunc.isVarUsable(bypassQCnumber) && confidenceLevelValue > parseInt(bypassQCnumber)){
            print("Confidence Interval passes bypass QC default number - No QC ");
            gmoNBCNLDFunc.transitionPlacing(placingId, states.packageQcDecision, requirements.passedConfidenceLevel);
        } else{
            print("Package QC required");
            gmoNBCNLDFunc.transitionPlacing(placingId, states.packageQcDecision, requirements.packageQc);
        }

    }   
        jobDashboard.updateStatusAndProgress("Finishing Script",100);
   
    quit(0);
    
} catch(e) {
    output("An error has occured: " + e.message);
    jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});
    if (fileExists(currentWorkingFolder)){
        output("Working folder exists, cleaning up files/folder for this state [" + currentWorkingFolder + "].");
        if (!gmoNBCFunc.deleteDirectory(currentWorkingFolder, true)){
            } else {
                output("No working folder exists, nothing to cleanup.");
            }
    quit(1);
    }
}
