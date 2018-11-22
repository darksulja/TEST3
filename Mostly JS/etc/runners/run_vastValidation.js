/*
* @Author: mikeayubi
* @Date:   2018-07-12 23:26:09
* @Last Modified by:   206466664
* @Last Modified time: 2018-08-28 17:41:33
* This is a new baton vast job which should replace the old run_batonAutoQC.js file with this services based version
*/
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/BatonHelper.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/helpers/ErrorHandlerHelper.js");
load("/opt/evertz/mediator/etc/runners/PubDefHelper.js");

output("\nRunning run_vastValidation.js");

function validateProfile(ph){
    var errMsg = new Error();
    if(!gmoNBCFunc.isVarUsable(ph.getPubDef()) || ph.getPubDef() == "Blank"){
        errMsg.code = 100;
        throw errMsg;
    } else{
        var pubDefHelper = new PubDefHelper(ph.getPubDef());
        var vastPresetXml = pubDefHelper.getPresetByType("VAST Profile");
        var hasVastProfile = vastPresetXml.length() > 0;
        if(!hasVastProfile){
            errMsg.code = 101;
            throw errMsg;
        }
    }

    return true;
}

function validateVASTBatonParams(ph){
    var errMsg = new Error();
    errMsg.parameters = {placingId : ph.placingId};

    var settings = ph.getSettings();
    var TEST_PLAN = settings.vastTestPlan;
    var PRIORITY = settings.vastQCPriority;
    var MEDIA_FILE_PATH = ph.getFullTextValueByType("VAST URL");

    if(!gmoNBCFunc.isVarUsable(TEST_PLAN)){
        errMsg.code = 102;
        throw errMsg;
    }else if(!gmoNBCFunc.isVarUsable(PRIORITY)){
        errMsg.code = 103;
        throw errMsg;
    }else if(!gmoNBCFunc.isVarUsable(MEDIA_FILE_PATH)){
        errMsg.code = 104;
        throw errMsg;
    } 

    return true;
}

try{
    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
    jobDashboard.updateStatusAndProgress("Starting Script",5);

    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
    var entityId = jobDescription..domainKey.toString();
    var entityAction = jobDescription..EntityAction.toString();
    var entityType = jobDescription..Entity.toString();
    var entityOperation = jobDescription..EntityOperation.toString(); 

    output("" +
        "Entity Identifier [" + entityId + "]"
    );

    jobDashboard.updateStatusMap({"Script_EntityId":entityId});
    var ph = new PlacingHelper(entityId);
    jobDashboard.updateStatusAndProgress("Validating VAST Order",25);

    //Validate VAST profile exists and correct type.
    validateProfile(ph);
    //Validate profile and order has correct params for baton qc call
    validateVASTBatonParams(ph);
    
    output("Validation Job was completed succesfully.");
    jobDashboard.updateStatusAndProgress("Validation Success",100);
    
}catch(e){
    output("An error has occurred: " + e.message);
    jobDashboard.updateStatusAndProgress("Validation Failure",100);
    jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})

    var ehh = new ErrorHandlerHelper("VAST Validation",ph.placingId,"Placing");
    if (gmoNBCFunc.isVarUsable(e.code)) {
        var errorMsg = ehh.getError(e.code, e.parameters).message;
        output("Error caught in Vast Validation: Error Code ["+e.code+"] Message ["+errorMsg+"]");
    } else {
        var errorMsg = e.message;
        output("An error has occurred: " + errorMsg);
    }
    ehh.saveNote(errorMsg);
    
    quit(1);
}


