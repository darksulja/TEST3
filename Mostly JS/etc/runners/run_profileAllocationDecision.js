load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/PubDefHelper.js");

try {    

    const PROFILE_SHORT_TEXT_TYPE = "Profile";
	const METADATA_PRESET_TYPE = "Metadata";
	const PROFILE_ALLOCATION_METHOD_TAG_TYPE = "NLD Profile Allocation Method";
	const NEW_PROFILE_ALLOCATION_METHOD = "New Profile Allocation";
	const PROFILE_ALLOCATION_DECISION_STATE = "Profile Allocation Decision";
	
    var triggers = {
		transitionOld : "Original Profile Allocation",
		transitionNew : "New Profile Allocation",
        transitionOldInsert : "Original Profile Allocation (Placing Insert)",
        transitionNewInsert : "New Profile Allocation (Placing Insert)"
    };
	
	var exitCode = 0;
	var jobDesc = getJobParameter("jobDescription");
    
    var placingID = jobDesc..domainKey.toString();
	print("\nRunning Profile Allocation Decision for [" + placingID + "]");
	
    var placingHelperObj = new PlacingHelper(placingID);
    
    var latestTrigger = placingHelperObj.getLatestTrigger();
    print("\nTrigger for job [" + latestTrigger + "]");
    
    var placingInsert = latestTrigger === "Order Placed";
	print("\nPlacing is an Insert? [" + placingInsert + "]");
    
    var profile = placingHelperObj.getShortTextValueByType(PROFILE_SHORT_TEXT_TYPE);
    print("\nPub Def / Profile Short Text on Placing set to [" + profile + "]");
	
	var pubDef = gmoNBCNLDFunc.getPubDef(profile).Name.toString();
	if (pubDef == undefined) throw new Error("\nNo information for Pub Def [" + profile + "] exists!");
		
	var pubDefHelperObj = new PubDefHelper(pubDef);
    var metadataPresetXml = pubDefHelperObj.getPresetByType(METADATA_PRESET_TYPE);
    var metadataPresetExists = metadataPresetXml.length() > 0;
    print("\nMetadata Preset Defined on Placing? [" + metadataPresetExists + "]");
	
	// Metadata Preset may explictly state which Profile Allocation Method to use
    if (metadataPresetExists) {
        
        var fullPresetXml = gmoNBCNLDFunc.getPreset(metadataPresetXml.Name.toString());
        
        var chosenProfileAllocation = fullPresetXml..TagList.Tag.(TagType == PROFILE_ALLOCATION_METHOD_TAG_TYPE).Value.toString();
        
		// Extract Value and decide
        if (chosenProfileAllocation == NEW_PROFILE_ALLOCATION_METHOD) {
            
            if (placingInsert) {
                print("\nTransitioning to New Profile Allocation Insert as [" + METADATA_PRESET_TYPE +  "] Preset Type has [" + PROFILE_ALLOCATION_METHOD_TAG_TYPE + "] set to value [" + chosenProfileAllocation + "] and latest trigger was ["+latestTrigger+"]\n");
                gmoNBCNLDFunc.transitionPlacing(placingID, PROFILE_ALLOCATION_DECISION_STATE, triggers.transitionNewInsert);
            } else {
                print("\nTransitioning to New Profile Allocation as [" + METADATA_PRESET_TYPE +  "] Preset Type has [" + PROFILE_ALLOCATION_METHOD_TAG_TYPE + "] set to value [" + chosenProfileAllocation + "] and latest trigger was ["+latestTrigger+"]\n");
                gmoNBCNLDFunc.transitionPlacing(placingID, PROFILE_ALLOCATION_DECISION_STATE, triggers.transitionNew);
            }
            
        } else {
            
            if (placingInsert) {
                print("\nTransitioning to Original Profile Allocation Insert [" + METADATA_PRESET_TYPE +  "] Preset Type has [" + PROFILE_ALLOCATION_METHOD_TAG_TYPE + "] set to value [" +  chosenProfileAllocation + "] and latest trigger was ["+latestTrigger+"]\n");
                gmoNBCNLDFunc.transitionPlacing(placingID, PROFILE_ALLOCATION_DECISION_STATE, triggers.transitionOldInsert);
            } else {
                print("\nTransitioning to Original Profile Allocation [" + METADATA_PRESET_TYPE +  "] Preset Type has [" + PROFILE_ALLOCATION_METHOD_TAG_TYPE + "] set to value [" +  chosenProfileAllocation + "] and latest trigger was ["+latestTrigger+"]\n");
                gmoNBCNLDFunc.transitionPlacing(placingID, PROFILE_ALLOCATION_DECISION_STATE, triggers.transitionOld);
            }
            
        }
        
    } else {
        
        if(placingInsert) {
            print("\nTransitioning to Original Profile Allocation Insert as no [" + METADATA_PRESET_TYPE + "] Preset Type is defined for Pub Def [" + pubDef + "] and latest trigger was ["+latestTrigger+"]\n");
            gmoNBCNLDFunc.transitionPlacing(placingID, "Profile Allocation Decision", triggers.transitionOldInsert);
        } else {
            print("\nTransitioning to Original Profile Allocation as no [" + METADATA_PRESET_TYPE + "] Preset Type is defined for Pub Def [" + pubDef + "] and latest trigger was ["+latestTrigger+"]\n");
            gmoNBCNLDFunc.transitionPlacing(placingID, "Profile Allocation Decision", triggers.transitionOld);
        }        
    }
    
} catch(e) {
	print("profileAllocationDecision: Error: [" + e.message +  "]");
    print("\nTransitioning to Original Profile Allocation Insert as an error has occured\n");
    gmoNBCNLDFunc.transitionPlacing(placingID, "Profile Allocation Decision", triggers.transitionOldInsert);
	exitCode = -1;
	
} finally {
	
    quit(exitCode);
	
}
