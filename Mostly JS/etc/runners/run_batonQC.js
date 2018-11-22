/*
* @Author: mikeayubi
* @Date:   2018-07-12 23:26:09
* @Last Modified by:   206466664
* @Last Modified time: 2018-10-17 16:58:10
* This is a new baton vast job which should replace the old run_batonAutoQC.js file with this services based version
*/
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_baton_fun.js");
load("/opt/evertz/mediator/etc/runners/BatonHelper.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/helpers/ErrorHandlerHelper.js");
load("/opt/evertz/mediator/etc/helpers/AdOpsVASTHelper.js");
if(typeof(JRAPI)==="undefined") load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js');

output("\nRunning run_batonQC.js");

try{

    var batonHelper = new BatonHelper();
    var adOpsVASTHelper = new AdOpsVASTHelper();
    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
    this.__JRAPI = new JRAPI();
    this.__POLL_INTERVAL = 30;
    jobDashboard.updateStatusAndProgress("Starting Script",1);

    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
    jobDashboard.updateStatusAndProgress("Extracting Info from Job",3);

    var entityId = jobDescription..domainKey.toString();
    var entityAction = jobDescription..EntityAction.toString();
    var entityType = jobDescription..Entity.toString();
    var entityOperation = jobDescription..EntityOperation.toString(); 

    output("" +
        "Entity Identifier [" + entityId + "] \n"
    );

    jobDashboard.updateStatusAndProgress("Extracting Info from Job",5);
    jobDashboard.updateStatusMap({"Script_EntityId":entityId});

    jobDashboard.updateStatusAndProgress("Extracting Order QC Params",7);
    var ph = new PlacingHelper(entityId);
    var settings = ph.getSettings();

    var TEST_PLAN = settings.vastTestPlan;
    var PRIORITY = settings.vastQCPriority;
    var MEDIA_FILE_PATH = ph.getFullTextValueByType("VAST URL");

    jobDashboard.updateStatusAndProgress("Sending Data To Services",9);

    var submitJobResponse = batonHelper.submitJob(TEST_PLAN,PRIORITY,MEDIA_FILE_PATH);
    if (submitJobResponse == false || !gmoNBCFunc.isVarUsable(submitJobResponse)) throw new Error("Failed to submit job to Baton for QC. Could not complete request.");
    jobDashboard.updateStatusAndProgress("Executing Auto QC",10);
    jobDashboard.updateStatusAndProgress("Polling Status",12);
    var abortedCounter = 0;
    while (true) {
        try {
            var jobStatusResponse = batonHelper.getJobStatus(submitJobResponse.taskId);
            if (jobStatusResponse == false || !gmoNBCFunc.isVarUsable(jobStatusResponse.taskId)) throw new Error('Unknown error occured, did not receive response from Baton for job status.');

            output("Status is [" + jobStatusResponse.status + "]");
            if (jobStatusResponse.status == "Ready") {
                print('Job [' + jobStatusResponse.taskId + '] is waiting in queue for submission...')
                jobDashboard.updateStatusAndProgress('Baton ['+ jobStatusResponse.status +']',20);   
            } 
            else if (jobStatusResponse.status == "Running") {
                print('Job ['  + jobStatusResponse.taskId +'] is running...')  
                jobDashboard.updateStatusAndProgress('Baton ['+ jobStatusResponse.status +']',30);             
            }
            else if (jobStatusResponse.status == "Finished") {
                print('Job [' + jobStatusResponse.taskId + '] finished normally, exiting.')
                jobDashboard.updateStatusAndProgress('Baton ['+ jobStatusResponse.status +']',50); 
                break;
            }else if (jobStatusResponse.status == "Aborted") {
                print('Job [' + jobStatusResponse.taskId + '] Aborted in Baton, Waiting.')
                jobDashboard.updateStatusAndProgress('Baton ['+ jobStatusResponse.status +' Waiting on a Retry]',50); 
                abortedCounter++;
                if(abortedCounter>=20){
                    print('Job [' + jobStatusResponse.taskId + '] Aborted in Baton, Failing after MAX Waiting Period.')
                    jobDashboard.updateStatusAndProgress('Baton ['+ jobStatusResponse.status +']',50); 
                    throw new Error ('Task is Aborted in Baton ');
                }
            }
            sleep(this.__POLL_INTERVAL);
        } catch (e) {
            throw new Error ('Error retrieving job response: ' + e);
        }
    }

    try {
        jobDashboard.updateStatusAndProgress("Getting QC Results",65); 
        var vastQCResults = batonHelper.getVASTQCResults(submitJobResponse.taskId);
        adOpsVASTHelper.setPlacingHelper(ph);
        adOpsVASTHelper.setVastQCResults(vastQCResults);
            
        try{
            var report_date = now("yyyyMMdd_HHmmss");
            var batonPDF = batonHelper.getPDF(submitJobResponse.taskId, 
                NBCGMO_CONSTANTS.MEDIATOR_TEMP_PATH + ph.placingId + NBCGMO_CONSTANTS.UNDERSCORE + report_date + NBCGMO_CONSTANTS.DOT + NBCGMO_CONSTANTS.PDF );
            jobDashboard.updateStatusAndProgress("Downloading Baton PDF Report",70); 
            
        }catch(e){
            gmoNBCFunc.saveNote("Placing",ph.placingId,"Auto QC","COMMENT","AVERAGE", "Failed to Get Baton PDF Report");
            batonPDF="";
        }
        adOpsVASTHelper.setBatonReport(batonPDF);
        if(debug) output("Vast QC Results ["+vastQCResults+"]");
        output("Vast QC Results ["+adOpsVASTHelper.getQCSummary()+"]");
        gmoNBCFunc.saveNote("Placing",ph.placingId,"Auto QC","COMMENT","AVERAGE", adOpsVASTHelper.getQCSummary());
         jobDashboard.updateStatusAndProgress("Processing QC Results",75);
        //Save VAST QC Result Summary against the Placing
        adOpsVASTHelper.processVASTQCResults();
        if(gmoNBCFunc.isVarUsable(batonPDF)){
            remove(batonPDF);
        }
        jobDashboard.updateStatusAndProgress("Auto QC Process Completed Successfully",85); 

    }catch(e){
        throw new Error ('Error Processing  VAST QC Results: ' + e);
    }

    output("QC Job was completed successfully.");
    jobDashboard.updateStatusAndProgress("Services Notification Success",100);
}catch(e){
    output("An error has occurred: " + e.message);
    jobDashboard.updateStatusAndProgress("Services Notification Failure",100);
    jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})

    var ehh = new ErrorHandlerHelper("Auto QC",ph.placingId,"Placing");
    if (gmoNBCFunc.isVarUsable(e.code)) {
        errorMsg = ehh.getError(e.code, e.parameters).message;
        output("Error caught in Conform: Error Code ["+e.code+"] Message ["+errorMsg+"]");
    } else {
        errorMsg = e.message;
        output("An error has occurred: " + errorMsg);
    }
    ehh.saveNote(errorMsg);

    quit(1);
}
