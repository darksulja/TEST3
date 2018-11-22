if(typeof(NBCGMO_CONSTANTS)==="undefined") load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js");
if(typeof(gmoNBCFunc)==="undefined") load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
if(typeof(gmoNBCNLDFunc)==="undefined") load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
if(typeof(PlacingHelper) === "undefined") load("/opt/evertz/mediator/etc/runners/placingHelper.js");
    
try {
    var states = {
        "ready"            :  "Ready",
        "adOpsReview"      :  "Ad Ops Review",
        "spotCheck"        :  "Spot Check",
        "spotCheckRequired":  "Spot Check Required",
        "adOpsReview"      :  "Ad Ops Review",
        "packageQCRequired" : "Package QC Required",
        "packageQCReferralRequired" : "Package QC Referral Required",
        "deliveryRequired"   : "Delivery Required"
    };
    var requirements = {
        toDeliveryRequired : "Passed",
        packageQCReferral  : "Package QC Referral"
    };
        
    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;  
    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
    jobDashboard.updateStatusAndProgress("Starting Script",5);
    
    var materialId = jobDescription.Properties.Mapping.domainKey.toString();
    var materialHelper = new gmoNBCFunc.materialHelper(materialId);
    var vastOrderId = materialHelper.getShortTextValue("VAST Order Id");
    if(!gmoNBCFunc.isVarUsable(vastOrderId)) throw new Error("No valid VAST order associated with Creative Id.");
    output("Processing Creative Ids for VAST Order [" + vastOrderId + "]");
    var placingHelper = new PlacingHelper(vastOrderId);
    var creativeMaterialIds = placingHelper.filterUniqueMaterialsFromParcel();

    // To avoid jobs that are unnecessary due to a previous action/job running when the placing has already transitioned
    var latestState = placingHelper.getPlacingState();
    var prevTransitioned =  latestState == states.deliveryRequired || latestState == states.packageQCReferralRequired ? true : false; 
    if(prevTransitioned){
        output("Job unnecessary. Exiting script because placing already transitioned to [" + latestState + "]");
        quit(0);
    } 

    var allReady = true;
    var statesInAdOps = false;
    var statesInSpotCheck = false;
    for each(var matId in creativeMaterialIds){
        var creativeMaterialHelper = new gmoNBCFunc.materialHelper(matId);
        output("\tExamining Creative Material Id [" + creativeMaterialHelper.matId + "]");
        for each(var ttl in creativeMaterialHelper.getTrackTypes()){
            var state = creativeMaterialHelper.getStateOfTtl(ttl);
            output("\t\tTrackTypeLink [" + ttl + "] at [" + state + "]");
            if(state == states.spotCheck || state == states.spotCheckRequired){
                allReady = false;
                statesInSpotCheck = true;
            }else if(state == states.adOpsReview){
                allReady = false;
                statesInAdOps = true;
            }
        }       
    }

    output("All Creative Id TrackTypeLinks in [" + states.ready + "] ? [" + allReady + "]");
    output("Any Creative Id TrackTypeLinks in [" + states.adOpsReview + "] ? [" + statesInAdOps + "]");
    output("Any Creative Id TrackTypeLinks in [" + states.spotCheckRequired + "] ?[" + statesInSpotCheck + "]");
    // 1st Condition - All Track Types in Ready -> 'Delievery Required'
    // 2nd Condition - Track Types in Ready + Ad Ops Review -> Package QC Referral Required
    // 3rd Condition - Any Track Type in 'Spot Check Required' or 'Spot Check' stay in 'Package QC Required'
    if(allReady){
        output("VAST Order [" + vastOrderId + "] has all Creative Ids at [" + states.ready + "], transitioning it to [" + states.deliveryRequired + "]");
        gmoNBCNLDFunc.transitionPlacing(placingHelper.getPlacingId(),states.packageQCRequired,requirements.toDeliveryRequired);
    }else if(statesInAdOps && !statesInSpotCheck){
        output("VAST Order [" + vastOrderId + "] is marked for [" + states.adOpsReview + "], trantioning it to [" + states.packageQCReferralRequired + "]");
        gmoNBCNLDFunc.transitionPlacing(placingHelper.getPlacingId(),states.packageQCRequired,requirements.packageQCReferral);
    }else if(!allReady && statesInSpotCheck){
        output("Not Transitioning Vast Order [" + vastOrderId + "] because creative material found in Spot Check state.");
        output("Exiting script...");
        quit(0);
    }

    output("Script Complete.");
    
    jobDashboard.updateStatusAndProgress("Finished Running Script Successfully", 100);
} catch(e) {
    output("An error has occured: " + e.message);
    jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});   
    quit(1);
}