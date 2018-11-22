load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/helpers/AdOpsCreativeHelper.js");


output("Running run_adOpsTlPlacingUpdate.js");

var requirements = {
    updated:"Updated",
    cancel:"Cancel",
    reinstate:"Reinstate",
    reorder : "Re Order",
    orderplaced : 'Order Placed',
    deliver : 'Deliver',
    passed : 'Passed',
    reject : 'Reject'
}

var states = {
    awaitingUpdate:"Awaiting Update",
    awaitingComponents:"Awaiting Components",
    awaitingDetails:"Awaiting Details",
    workOrderCanceled:"Work Order Canceled",
    notAvailable : "Not available",
    packageQCReferralRequired: "Package QC Referral Required",
    deliveryRequired : 'Delivery Required',
    rejected : 'Rejected',
}

function getParcelMaterialsFromPlacingXml(placingXml) {
        
    var parcelMaterials = [];
    for each(var trimMatId in placingXml..Parcel[0].ParcelEventList..TrimMaterialId)  {
        parcelMaterials.push(trimMatId.toString());
    }
    print('parcelMaterials are: [' + parcelMaterials + ']')
    return parcelMaterials;
}

function resetMaterialTracks(matId, trackTypeName ) {

    output("adOps TL resetMaterialTracks - start");
    const adOpsCreativeHelper = new AdOpsCreativeHelper(matId);
    const materialHelper = new gmoNBCFunc.materialHelper(matId);
    var trackTypes = adOpsCreativeHelper.__getRequiredTrackTypes();
    if (gmoNBCFunc.isVarUsable(trackTypeName))  {
        trackTypes = [trackTypeName]
    }

    if (materialHelper.materialExists()) {
        output("[" + matId + "] Exists & Reseting Track Types");
        for each (trackTypeName in trackTypes) {
            print('resetting [' + trackTypeName + ']')
            gmoNBCFunc.resetTrackTypeLink(matId,trackTypeName);
        }
    }
    output("adOps TL resetMaterialTracks - end");
}

function cancelMaterials(matId) {
    const materialHelper = new gmoNBCFunc.materialHelper(matId);
    // Allow time for the automatic transitions to "Not Available" to take place
    print('pausing for 5 seconds to make sure that all tracks to end up in Not available')
    sleep(5);
    materialHelper.refresh();
    // Now transition all tracks to Canceled state
    gmoNBCFunc.transitionMaterial(matId, states.notAvailable,  requirements.cancel)
}

try {    
    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
    print("Job Description: " + jobDescription);
    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
    jobDashboard.updateStatusAndProgress("Starting Script",5);

    var translatorAction  = new XML(jobDescription..TranslatorAction.toString());   
    if (!gmoNBCFunc.isVarUsable(translatorAction))  {
        throw new Error('translatorAction must be present')
    }

    var domainType  = new XML(jobDescription..domainType.toString());
    if (domainType != 'Placing' && domainType != 'Material' ) {
        throw new Error('domainType must be either Placing or Material')
    }

    var placingId  = new XML(jobDescription..PlacingId.toString());
    if (!gmoNBCFunc.isVarUsable(placingId))  {
        throw new Error('placingId must be present')
    }

    var overrideStatus  = new XML(jobDescription..overrideStatus.toString());
    if (!gmoNBCFunc.isVarUsable(overrideStatus))  {
        print('overrideStatus must be present for placing and material overide, and material cancel')
    } else {
        print('overrideStatus is: [' + overrideStatus + ']');
    }

    var placingHelper = new PlacingHelper(placingId);
    var placingState = placingHelper.getPlacingState();
    var placingXml = placingHelper.getPlacingXml();

    if (domainType == 'Placing' && translatorAction == 'reorder') {
        print('Placing reorder')
        //When we Reset the placing lets reset the materials as well
        var parcelMaterials = getParcelMaterialsFromPlacingXml(placingXml);
        for each (var matId in parcelMaterials ) {
            print('Calling ad Ops resetMaterialTracks on matId: [' + matId + ']' ) 
            resetMaterialTracks(matId);
        }
        // Forces the placing to Not Available, regardlesss of current state
        placingHelper.workflowReset();
        gmoNBCNLDFunc.transitionPlacing(placingId, states.notAvailable, requirements.orderplaced);

    } else if (domainType == 'Placing' && translatorAction == 'cancel') {
        print('Placing cancel')
        var parcelMaterials = getParcelMaterialsFromPlacingXml(placingXml);
        for each (var matId in parcelMaterials ) {
            print('Calling ad Ops resetMaterialTracks on matId: [' + matId + ']' ) 
            resetMaterialTracks(matId);
          }
          print('now setting all tracks to canceled')
          cancelMaterials(matId);
          print('Now resetting VAST placing')
        placingHelper.workflowReset();
        gmoNBCNLDFunc.transitionPlacing(placingId, states.notAvailable, requirements.cancel);

    } else if (domainType == 'Placing' && translatorAction == 'override') {
        print('Placing override')
        if (placingState !== states.packageQCReferralRequired ) {
            throw new Error('Cannot override from any state but [' + states.packageQCReferralRequired + ']. Current state is: [' + placingState + ']')
        }
        if (overrideStatus != 'Deliver' && overrideStatus != 'Reject' ) { 
            throw new Error('overrideStatus must be either Deliver or Reject')
        }

        if (overrideStatus == 'Deliver') {
            gmoNBCNLDFunc.transitionPlacing(placingId, states.packageQCReferralRequired, requirements.deliver);
        } else if (overrideStatus == 'Reject') {
            gmoNBCNLDFunc.transitionPlacing(placingId, states.packageQCReferralRequired, requirements.reject);
        } 
 
    } else if (domainType == 'Material' && translatorAction == 'cancel') {
        print('Material cancel')
        var trackType  = new XML(jobDescription..trackType.toString());
        if (!gmoNBCFunc.isVarUsable(trackType))  {
            throw new Error('trackType must be present for Material trackType cancel')
        }
        var trackType  = new XML(jobDescription..trackType.toString());
        if (!gmoNBCFunc.isVarUsable(trackType))  {
            throw new Error('trackType must be present for Material trackType cancel')
        }
        // Find MatId from Parcel
        for each (var parcelEvent in placingXml.PlacingParcelList..Parcel.ParcelEventList..Event) {
            for each (var trackTypeName in parcelEvent.Material.TrackTypeLink ) {
                if (trackTypeName.TrackTypeName.toString() == trackType ) {
                    var matId = parcelEvent.TrimMaterialId.toString();
                    print('Found TrimMaterialId  [' + matId + '[ matching trackType [' + trackType + ']' )
                    } 
                }
            }
        
        print('matId is: ' + matId ) 
        print('trackType is: ' + trackType ) 
        resetMaterialTracks(matId, trackType);

        // Check the passed in MaterialID using parcelMaterials and cancel it
    } else if (domainType == 'Material' && translatorAction == 'override') {
        print('Material override')
        var trackType  = new XML(jobDescription..trackType.toString());
        if (!gmoNBCFunc.isVarUsable(trackType))  {
            throw new Error('trackType must be present for Material trackType overrride')
        }
        var matId  = new XML(jobDescription..MaterialId.toString());

        if (!gmoNBCFunc.isVarUsable(matId))  {
            throw new Error('MaterialId must be present for overrride')
        }
        if (overrideStatus != 'Passed' && overrideStatus != 'Reject' ) { 
            throw new Error('overrideStatus must be either Passed or Reject')
        }
        
        var materialInfo = materialGet(matId,'trackTypeLinks')
        var matchedStateName = materialInfo..TrackTypeLink.(TrackTypeName.toString() == trackType).StateName.toString();
        print('matchedStateName is: [' + matchedStateName + ']' )

        if (matchedStateName != "Ad Ops Review") {
            throw new Error('matId of [' + matId + '] must be in Ad Ops Review state, currently in [' + matchedStateName.toString() + ']' )
        }

        if (overrideStatus == 'Passed') {
            // Despite the plural name, function is smart enough to take 1 trackType
            gmoNBCFunc.transitionTrackTypes(matId,requirements.passed,trackType);
        } else if (overrideStatus == 'Reject') {
            gmoNBCFunc.transitionTrackTypes(matId,requirements.reject,trackType);
        } 
    }

} catch(e) {
    output("An error has occured: " + e.message);
    jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});    
    quit(1);
}
