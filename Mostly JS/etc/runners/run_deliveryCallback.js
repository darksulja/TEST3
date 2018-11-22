/**
 * Created by karthikrengasamy on 11/9/16.
 */
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");

//Local Functions Start
/**
 * Get Placing ID from report Results
 * @param results
 * @param response
 * @returns {Placing ID Or Empty String}
 */
var getPlacingIDFromResults = function(results,response){
    print ("")
    if(results.PagedResults.Count > 1) {
        throw new Error("Found More than 1 placing for TransferIdentifier ["+response.TransferIdentifier+"]");
    }else if (results.PagedResults.Count == 1) {
        return results..PLACING__ID.toString();
    } else {
        return ""
    }
};
/**
 * Find Placing ID By running Report Using TransferIdentifier
 * @param response
 * @returns {Placing ID Or Empty String}
 */
var findPlacingFromTransferIdentifier = function(response){
    var transferIdentifierDataElement = "Delivery Package File Name";

    var results = gmoNBCNLDFunc.searchPlacingByDataElement(transferIdentifierDataElement,response.TransferIdentifier,STATES.AWAITING_RESPONSE);
    var placingID = getPlacingIDFromResults(results,response);
    
    if(placingID == ""){
        var results = gmoNBCNLDFunc.searchPlacingByDataElement(transferIdentifierDataElement,response.TransferIdentifier,STATES.DELIVERY_ERROR);
        placingID = getPlacingIDFromResults(results,response);
    }
    print ("Placing ID "+placingID)
    return placingID;
}
/**
 * Check State And Run Appropriate WorkFlow Transistion
 * @param placingId
 * @param state
 * @param isSuccess
 */
var checkStateAndRunWorkFlowTransistion = function(placingId,state,isSuccess){
    var trigger = "";
    if(STATES.AWAITING_RESPONSE == state && isSuccess ){
        trigger = TRIGGERS.COMPLETE;
    }else if(STATES.DELIVERY_ERROR == state && isSuccess){
        trigger = TRIGGERS.COMPLETE_HIDDEN;
    }else if(STATES.AWAITING_RESPONSE == state && !isSuccess){
        trigger = TRIGGERS.ERROR;
    }
    if(trigger!=""){
        print("Running Workflow State Transistion Using Trigger ["+trigger+"]");
        gmoNBCNLDFunc.transitionPlacing(placingId, state, trigger);
        if(trigger == TRIGGERS.COMPLETE || trigger == TRIGGERS.COMPLETE_HIDDEN){
            gmoNBCNLDFunc.savePlacingShortText(placingId,"Rejection",false);            
        }
    }
}

//Local Functions End

//Execution Starts
const ASPERA_ORCHESTRATOR = "Aspera Orchestrator";
const STATES = {
    AWAITING_RESPONSE : "Awaiting Delivery Response",
    DELIVERY_ERROR : "Delivery Error"
}
const TRIGGERS = {
    COMPLETE : "Complete",
    ERROR : "Error",
    COMPLETE_HIDDEN : "Complete (Hidden)"
}

try {
    print("Running run_deliveryCallback.js script");

    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
    jobDashboard.updateStatusAndProgress("Starting Script",5);
    var jobDesc = getJobParameter("jobDescription")..Output.JobDescription;

    var response = {
        "TransferIdentifier" : jobDesc..TransferIdentifier.toString(),
        "TransferSystem"  : jobDesc..TransferSystem.toString(),
        "TransferStatus"  : jobDesc..TransferStatus.toString(),
        "TransferError"   : jobDesc..TransferError.toString()
}
    print("\n" +
        "TransferIdentifier [" + response.TransferIdentifier + "] \n" +
        "TransferSystem [" + response.TransferSystem + "] \n" +
        "TransferStatus [" + response.TransferStatus + "] \n" +
        "TransferError [" + response.TransferError + "]"
    );

    var placingId = findPlacingFromTransferIdentifier(response);

    if(placingId){
        print("This is the delivery Response for Placing  [" + placingId + "] from ["+ response.TransferSystem + "]");

        var placingHelper = new PlacingHelper(placingId);
        // Get the placing details, include everything so we don't need to add things later.
        var placingXml = placingHelper.getPlacingXml();
        // Using the presets/placing metadata, lets get a list of settings that we need to use later.
        var settings = placingHelper.getSettings();
        //Get the placing State
        var placingState = placingHelper.getPlacingState();
        print("Current Placing State [" + placingState + "]");
        var isSuccess = false;
        if("SUCCESS" == response.TransferStatus){
            isSuccess = true;
        }

        checkStateAndRunWorkFlowTransistion(placingId,placingState,isSuccess);
        placingHelper.refresh();
        var placingXml = placingHelper.getPlacingXml();

        //We Update the Delivery Revision When its successful and state is already not Delivered
        if(isSuccess && placingState != STATES.DELIVERED){
            gmoNBCNLDFunc.saveDeliveryRevision(placingXml);
        }
        // create Note for translator
        if (!isSuccess){
            gmoNBCFunc.saveNote("Placing",placingId,"Delivery Error","ERROR","IMPORTANT",response.TransferError);
        }

        //Lets Send Success/Failure Email Notification
        print ("Send failure email code status "+settings.sendFailureEmail)
        if ((settings.sendSuccessEmail == true || settings.sendSuccessEmail == "true") && isSuccess){
            gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml,false,[response.TransferIdentifier],"", settings.successEmailAddresses);
        }else{
            gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml,true,"",response.TransferError,settings.failureEmailAddresses);
        }

    } else {
        print("There is no reference for this delivery in Mediator  [" + response.TransferIdentifier + "] ");
        jobDashboard.updateStatusAndProgress("No Placings Found",100);
    }


    jobDashboard.updateStatusAndProgress("Finishing Script",100);
} catch(e) {
    print("An error has occurred: " + e.message);
    jobDashboard.updateStatusAndProgress(e.message,100);
}
//Execution Ends

