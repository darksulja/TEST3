// For testing to prevent lookup being loaded.
var lookup = {};
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/TVDInspector.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/DestSpecificMetadataModule.js");
load("/opt/evertz/mediator/etc/runners/pipelineHelper.js");
load("/opt/evertz/mediator/etc/runners/cacheHelper.js");
load("/opt/evertz/mediator/etc/runners/RecipeBook.js");
load("/opt/evertz/mediator/etc/runners/TextlessHandler.js");
load("/opt/evertz/mediator/etc/runners/PlacingBuilder2.0.js"); 

/**
* Start of variables/settings/mappings.
* TODO: Can any of these be put in nbcgmo_settings
**/
var states = {
	originalState : "Placing Ordered"
};

var requirements = {
	toApprovalRequired : "Initiate",
	toAwaitingComponents : "Order Incomplete"
};

// Preference goes from Left -> Right.
var versionTypeMap = {
	"Texted Only" : [ NBCGMO.versionTypeMap.omFtexted],
	"Texted Preferred, but can accept Textless" : [ NBCGMO.versionTypeMap.omFtexted, NBCGMO.versionTypeMap.omTatend, NBCGMO.versionTypeMap.omFtless],
	"Textless Only"	: [NBCGMO.versionTypeMap.omFtless],
	"Textless Preferred, but can accept Texted"	: [NBCGMO.versionTypeMap.omFtless, NBCGMO.versionTypeMap.omFtexted, NBCGMO.versionTypeMap.omTatend],
	"Textless at End Only" : [NBCGMO.versionTypeMap.omTatend],
	"Territory Master"	:	[NBCGMO.versionTypeMap.lmFtexted, NBCGMO.versionTypeMap.lmFtless, NBCGMO.versionTypeMap.lmTatend]
}
	
// Mapping for Translator Texted / Textless Override values to Version Type Preference
var textedTextlessOverridePrefMap = {
	"Texted" : "Texted Only",
	"Textless" : "Textless Only"
}

/**
* Start of functions local to this script.
* TODO: Can any of these be put in nbcgmo_fun or nbcgmo_nld_fun?
**/

extractConformSettingsFromPreset = function(placingXml, presetSettings, isRestoreAndDeliver) {
	
	// Const for Segment Type names.
	var breakPatterns = "Break Patterns";
	var somEom = "SOM / EOM";
	var none = "None";
	var wholeMaterial = "Whole Material";
		
	var segmentGroup, templateName, headerRequired, isCustomHeaderRequired;	
	var matSegmentTemplate = "MATSEGMENT";	
	
	print("Finding Template Information from Source Trim [" + presetSettings.sourceTrim + "]");
	
	// Work out which Settings for Building the Parcel
	switch (presetSettings.sourceTrim) {
		// Break Patterns
		case breakPatterns:
			segmentGroup = breakPatterns;
			templateName = matSegmentTemplate;
			headerRequired = presetSettings.includeHeader;
			isCustomHeaderRequired = presetSettings.includeCustomHeader;
			break;
		// SOM EOM
		case somEom:
			segmentGroup  = somEom;
			templateName = matSegmentTemplate;
			headerRequired = presetSettings.includeHeader;
			isCustomHeaderRequired = presetSettings.includeCustomHeader;
			break;
		// None
		case none:
			segmentGroup = somEom;
			templateName = matSegmentTemplate;
			headerRequired = true;
			isCustomHeaderRequired = presetSettings.includeCustomHeader;
			break;
		// When we do a restore and deliver set to whole material segment group	
		default:
			segmentGroup = wholeMaterial; 
			headerRequired = presetSettings.includeHeader;
			isCustomHeaderRequired = presetSettings.includeCustomHeader;
			templateName = matSegmentTemplate;
			break;
	}
	
	// Do some validation. We can force not throwing the error if restore and deliver is true.
	if(isCustomHeaderRequired && headerRequired && !isRestoreAndDeliver){ 
		throw new Error("Conform Preset is setup to use both Header from Source & Custom Header." + 
			"This is an invalid option and needs to be corrected in the preset");
	}
	
	//	Return Object	
	return {
		// Set from Preset
		"outputConformFrameRate" : presetSettings.outputConformFrameRate,
		"conformVantageWorkflow" :   presetSettings.conformVantageWorkflow,
		"topBlackDuration"	: presetSettings.topBlackDuration,
		"tailBlackDuration"	:	presetSettings.tailBlackDuration,
		"fileStart"	:   presetSettings.fileStart,
		"preTatendBlack" :   presetSettings.preTatendBlack,
		"midrollBlack" : presetSettings.midrollBlack,
		"versionPreference" : presetSettings.versionPreference,
		"territorySubType" : presetSettings.territorySubType,
		//Set from Switch Case
		"includeHeader" : isRestoreAndDeliver ? false : headerRequired, // Overide if it`s restore and deliver  
		"isCustomHeaderRequired" : isRestoreAndDeliver ? false : isCustomHeaderRequired, // Overide if it`s restore and deliver 
		"templateName" : templateName,
		"segmentGroup" : segmentGroup
	}
}

// Promo type should either be "Main" or "Tail".
getPromoDetails = function(promoType, destSpecificMatHierarchialObj){
	var dataElementName = promoType + " Promo Material";
	var defaultWholeMaterialSegmentGroup = "Whole Material";
	
	if (destSpecificMatHierarchialObj !== undefined ) {
		var promoMatId = destSpecificMatHierarchialObj[dataElementName];
		if (typeof promoMatId !== undefined && typeof promoMatId !== "undefined" && promoMatId !== ""){
			var promoMaterialHelper = new gmoNBCFunc.materialHelper(promoMatId);
			var promoFrameRate = promoMaterialHelper.getMaterialFrameRate();
			var promoSegment = promoMaterialHelper.getSegmentsByGroup(defaultWholeMaterialSegmentGroup)..Segment;
			if (promoSegment.length() > 1){
				throw new Error("More then one segment of type [" + defaultWholeMaterialSegmentGroup + "] was returned for Promo MatId [" + promoMatId + "]");
			} else if (promoSegment.length() == 1) {
				output("Promo segment exists, let's use that.");
				var promoIncode = promoSegment.MarkerIn.Absolute.toString();
				var promoOutcode = promoSegment.MarkerOut.Absolute.toString();
			} else {
				output("No promo segment exists, getting values from track incode/outcode instead.");
				var mainMedia = promoMaterialHelper.findMainStoreMedia();
				if (mainMedia === undefined) throw new Error("\Promo Material [" + headerMatId + "] does not exist on a Valid Store / T2 Media to get Incode / Outocde From");
				
				var mainMediaTrackXml = promoMaterialHelper.getTrackXmlByMedia(mainMedia);
				
				var promoIncode = mainMediaTrackXml.Incode.toString();
				var promoOutcode = mainMediaTrackXml.Outcode.toString();							
			}
		}
	}
	
	return {
		"promoMatId" : promoMatId,
		"promoFrameRate" : promoFrameRate,
		"promoIncode" : promoIncode,
		"promoOutcode" : promoOutcode
	}
}

/* 
 * Takes the track types returned from materialHelper.getTrackTypes() and filters out the non-audio tracks.
 */
filterTrackTypes = function(trackTypes) {
    
    var isAudioOrVideo = function(trackType) {
        
        if(trackType=="Video") {
           return true;
        }
        
        var request = <PharosCs>
                    <CommandList>
                        <Command subsystem="trackType" method="get">
                            <ParameterList>
                                <Parameter name="trackTypeName" value={trackType}/>
                            </ParameterList>
                        </Command>
                    </CommandList>
                </PharosCs>;
        var response = wscall(request);
        return response..ClassId == "AUDIO";
    };
    
    var filtered = [];
    
    for each(var trackType in trackTypes) {
        if(isAudioOrVideo(trackType)) {
            filtered.push(trackType);
        }
    }
    
    return filtered;
}

/**
*  #####  #######    #    ######  #######    ####### #######     #####   #####  ######  ### ######  ####### 
* #     #    #      # #   #     #    #       #     # #          #     # #     # #     #  #  #     #    #    
* #          #     #   #  #     #    #       #     # #          #       #       #     #  #  #     #    #    
*  #####     #    #     # ######     #       #     # #####       #####  #       ######   #  ######     #    
*       #    #    ####### #   #      #       #     # #                # #       #   #    #  #          #    
* #     #    #    #     # #    #     #       #     # #          #     # #     # #    #   #  #          #    
*  #####     #    #     # #     #    #       ####### #           #####   #####  #     # ### #          #                                                                                                            
*/

try {
	// Do ProfileAllocation stuff here :)
	debug = false;
	
	// Defining initial objects/helpers/properties
	
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5); 
	
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
   	
	var placingId = jobDescription.Properties.Mapping.domainKey.toString();
	var placingHelper = new PlacingHelper(placingId);
	var pipelineHelper = new PipelineHelper(placingHelper);
	var placingBuilder = new ReturnOfThePlacingBuilder();
	var textlessHandler = new TextlessHandler();
	var placingXml = placingHelper.getPlacingXml();
	var parcelXml = placingHelper.getParcel();	
	
	// Recipe Book stuff that we will need later :)
	var recipeBook = new RecipeBook();
	var recipeFinder = new RecipeFinder(recipeBook);
	
	print("\nPlacing ID [" + placingId + "]");
	if (debug) print(placingXml);
	
	var tvdId = placingHelper.getTVDId();
	// TODO: Can any of these be added as simple placingHelper.getField() functions/do they make sense to be in there?
	var profile = placingXml.ShortTextList.ShortText.(ShortTextType == "Profile").Value.toString();
	var profileAspectRatio = placingXml.ShortTextList.ShortText.(ShortTextType == "Profile Aspect Ratio").Value.toString();
	// Need to parse down text to be a useable aspectRatio (ex. "Full Frame 16x9 (1.78)" = "1.78")
	var parsedAspectRatio = gmoNBCFunc.lastSubstrBefore(gmoNBCFunc.lastSubstrAfter(profileAspectRatio, "("),")").replace(":", ".");
	
	// Get the pub def and validate its set, also log out warning if case is mis-matched coming from TL.
	// This will do a case-insenstive match against all pub defs. We specifically use this over placingHelper.getPubDef(), which only returns the one saved on the placing.
	var pubDefXml = gmoNBCNLDFunc.getPubDef(profile); 
	if(typeof pubDefXml == "undefined"){
		throw new Error("Profile/Publication Definition [" + profile + "] is not setup or named differently in Mediator");
	} else {
		var pubDefName = pubDefXml.Name.toString();
	}

	print("\nPub Def [" + pubDefName + "]");

	// Save the placing with the pub def, so we can get the placingXml to contain all the presets/metadata.
	placingBuilder.saveSkeletonPlacing(placingId, pubDefName);
	
	// Super Important to now get the updated Placing Xml by refreshing
	placingHelper.refresh();
	placingXml = placingHelper.getPlacingXml();
	
	// A settings object with all our preset values as simple fields :)
	// TODO: Can we put this in placingHelper() or its own helper?
	var settings = gmoNBCNLDFunc.getSettings(placingXml);
	
	/**
	*	This doesn't work as expected! Currently prints a blank object probably because it prints before the recipes have been added. 
	*
	*/
	if (debug) {
		print("\nRecipe Book List:");
		gmoNBCFunc.printObj(RecipeBook.recipes);
	}
	
	// Now that we have gotten alot of the fields we need, lets work on the logic!
	
	// If its a re-order we got some handy functions to clean things up.
	var isReorder = placingHelper.isInternalReOrder();
	
	if (isReorder) {
		print("\nPlacing is a reorder deleting NLDWorking directory and all Cache tracks.");
		// Will remove all working directories, and if true, will clear all cache material.
		gmoNBCNLDFunc.removePlacingNLDWorkingDir(placingId,true);
		// Packaging exists on a different file-system, so lets clean it up separately.
		gmoNBCNLDFunc.removePlacingNLDPackagingDir(pipelineHelper.getPackagingFolder());
	}
	
	// Lets work out if its a Restore and Deliver, cause then the logic is much more simple :)
	var isRestoreAndDeliver = pubDefXml..Preset.(PresetType.toString() == "Restore and Deliver").length() > 0;

	print("\nRestore and Deliver Order ? [" + isRestoreAndDeliver + "]");
	
	// Build a conform settings object.
	// TODO: Does this need to be a function? Can it be done differently with the new way of building sources in the future?
	var conformSettingsObj = extractConformSettingsFromPreset(placingXml, settings, isRestoreAndDeliver);
	
	if (debug){
		print("\Conform Settings List:");
		gmoNBCFunc.printObj(conformSettingsObj);
	}
	
	// See if Translator overrode the Textless / Texted preference
	var requiresTextedTextlessOverride = placingHelper.getTextedTextlessOverrideStatus();
	print("\nTranslator Textless Override requested [" + requiresTextedTextlessOverride + "]");
	
	if (requiresTextedTextlessOverride) {
		var textedTextlessOverrideValue = placingHelper.getTextedTextlessOverrideValue();
		var presetVersionPref = textedTextlessOverridePrefMap[textedTextlessOverrideValue];
		print("\nTranslator chose to override Texted / Textless Value.");
		print("\nReceived Value [" + textedTextlessOverrideValue + "] mapped to Version Preference [" + presetVersionPref + "]");
	} else if (isRestoreAndDeliver) {
		print("\nRestore and Deliver [" + isRestoreAndDeliver + "] getting Restore and Deliver Texted Preference");
        var restoreAndDeliverPresetName = pubDefXml..Preset.(PresetType.toString() === "Restore and Deliver").Name.toString();
        var presetVersionPref = gmoNBCNLDFunc.getPreset(restoreAndDeliverPresetName)..Tag.(TagType.toString() === "NLD Texted/Textless").Value.toString();
	} else {
		print("\nGetting Texted Preference from Conform Preset")
		var presetVersionPref  = conformSettingsObj.versionPreference;
		print("\tPreset set to [" + presetVersionPref + "]");
	}

	// Set the Preference
	var versionPreferenceList = versionTypeMap[presetVersionPref];
	
	print("\nCreating Settings List for Recipe Finder");
	var recipeSettingsList = {
		segmentgroup : conformSettingsObj.segmentGroup,
		tvdnumber : tvdId,
		aspectratio : parsedAspectRatio,
		restoreandeliver : isRestoreAndDeliver,
		territorymastertype : conformSettingsObj.territorySubType
	}
	
	if (debug){
		print("\nRecipe Settings List:");
		gmoNBCFunc.printObj(recipeSettingsList);
	}
	
	print("\nAttempting to find a Recipe for a Preference from the following [" + versionPreferenceList + "]");	
	var recipeComponents = recipeFinder.attemptRecipeMatch(versionPreferenceList, recipeSettingsList, isRestoreAndDeliver);
	
	if (typeof recipeComponents === "undefined") {
		throw new Error("Failed to find a Recipe to make an OutputFile [" + versionPreferenceList + "]");
	}
	
	print("\n############################################################################################");
	print("\n Finalised Recipe:");
	print("\n#############################################################################################\n");
	//jobDashboard.updateStatusAndProgress("Found successful Recipe to make Output File",30);
	
	print("\nRecipe Components:");
	gmoNBCFunc.printObj(recipeComponents);
	
	// Default this to first material frame rate.
	// TODO: How do we better handle this with multiple materials in the future?
	var parcelFrameRate = recipeComponents[0].framerate;
	print("\nUsing Frame Rate from first Material as Parcel Frame Rate [" + parcelFrameRate + "]");
	
	// Get dest specific Metadata 
	var firstMaterial = recipeComponents[0].matid;
	var destSpecificMetadataObj = new DestSpecificMetadataModule("material", firstMaterial, pubDefName);
	print("\nDestination Specific Metadata for Material [" + firstMaterial + "] [" + destSpecificMetadataObj.containsDestSpecificMetadata() + "]");
		
	// Get the Hierarchail Object Episode to Brand - This is retrieved regardless of whether any such metadata exists. The Placing Builder uses that fact that some properties may be undefined to make decisions
	var destSpecificMatHierarchialObj = destSpecificMetadataObj.extractDestinationSpecicMetadataEpisodeToBrandHierarchy__Material();

    // Work out if were making an OM Tat End, Default to false.
    var isOmTatEnd = false;
    if (presetVersionPref == "Textless at End Only") {
        var isOmTatEnd = true;
    }

    // Defualt textless insert mode to false.
	// Below we will loop over each recipe component to see if we are using Textless Data segments.
    var textlessInserts = false;

    output("Lets build our parcel! Yippee ki yay");
	for each (var recipeComponent in recipeComponents) {
		// We need to find the recipe component that uses our main material.
		// This will need to change when we start doing language masters.
		
		if (recipeComponent.segmentgroup == conformSettingsObj.segmentGroup){
			var mainRecipeComponent = recipeComponent;
		}

		if (recipeComponent.segmentgroup == "Textless Data"){
		    textlessHandler.setTextlessMatId(recipeComponent.matid);
			textlessInserts = true;
		} else {
            textlessHandler.setTextedMatId(recipeComponent.matid);
        }

	}

	// If we have a main recipe component, lets do some segment building :)
	if (mainRecipeComponent !== null && mainRecipeComponent !== undefined){

	    // Get some basic details about the main recipe component.
		var matId = mainRecipeComponent.matid;
		var frameRate = mainRecipeComponent.framerate;
		var segmentGroup = mainRecipeComponent.segmentgroup;
		var materialHelper = new gmoNBCFunc.materialHelper(matId);
        var trackTypes = materialHelper.getTrackTypes();
        
        print("\n\n~trackTypes - before: ");
        for each(var tt in trackTypes) { print(tt); }
        
        trackTypes = filterTrackTypes(trackTypes);
        
        print("\n\n~trackTypes - after: ");
        for each(var tt in trackTypes) { print(tt); }
        
        print("\n");        
				
		var segmentList = materialHelper.getSegmentsByGroup(segmentGroup)..Segment;

		// Make sure we have some segments to loop over.
		if (segmentList.length() !== 0) {

            /**
			 * Top Black Segment
             */
			if (conformSettingsObj.topBlackDuration !== "00:00:00:00" && !isRestoreAndDeliver){		
				var segmentBlock = placingBuilder.addBlackSegment(conformSettingsObj.topBlackDuration, frameRate);
				placingBuilder.addSegmentBlock(segmentBlock);
			}

            /**
			 * Header Segment
             */
			if(conformSettingsObj.includeHeader && !isRestoreAndDeliver){
				var mainMedia = materialHelper.findMainStoreMedia();
				if (mainMedia === undefined) throw new Error("\nHeader Material [" + headerMatId + "] does not exist on a Valid Store / T2 Media to get Incode / Outocde From");
				
				var mainMediaTrackXml = materialHelper.getTrackXmlByMedia(mainMedia);
				
				var headerSegmentIncode = mainMediaTrackXml.Incode.toString();
				var firstSegmentIncode = FrameLabel.parseText(frameRate, segmentList[0].MarkerIn.Absolute.toString());
				var headerSegmentOutcode = firstSegmentIncode.subtract(AmountOfTime.parseFrames(frameRate, 1));				
				
				var segmentBlock = placingBuilder.addSegmentFromTimecodes(matId, headerSegmentIncode, headerSegmentOutcode, frameRate);
				placingBuilder.addSegmentBlock(segmentBlock);
			}

            /**
			 * Main Promo Segment
             */
			var mainPromoDetails = getPromoDetails("Main", destSpecificMatHierarchialObj);
			if (mainPromoDetails.promoMatId !== null && mainPromoDetails.promoMatId !== undefined && mainPromoDetails.promoMatId !== "" && !isRestoreAndDeliver){
				var segmentBlock = placingBuilder.addSegmentFromTimecodes(mainPromoDetails.promoMatId, mainPromoDetails.promoIncode, mainPromoDetails.promoOutcode, mainPromoDetails.promoFrameRate);
				placingBuilder.addSegmentBlock(segmentBlock);
			}


            /**
			 * Segment Logic (Includes Break Patterns, Whole Material, etc)
             */
			for each(var segment in segmentList){

			    // Work out if we have any matched texted/textless segment.
                if (textlessInserts){
                    var matchedSegmentObjList = textlessHandler.getMatchedSegments(segment);
                    output("Found a total of [" + matchedSegmentObjList.length + "] texted/textless segments for replacement.");
                }

                // If we have matched textless inserts, lets use them, else just add a real segment as no replacements are required.
                if (textlessInserts && matchedSegmentObjList.length > 0) {
                    /**
                     * Textless Insert Segments - Replace texted data with textless data from another material.
                     */

                    output("Replacing Texted Data with Textless Data segments.");

                    // This will be a pointer to the previous segment's outcode.
                    // This needs to be explicitly null so each new segment loop wipes the value.
                    var previousSegmentOutcode = null;

                    // If the first textless insert, doesn't start at the segment incode, lets add the start from the original segment.
                    if (matchedSegmentObjList[0]["texted"].MarkerIn.Absolute.toString() != segment.MarkerIn.Absolute.toString()){
                        var segmentBlock = placingBuilder.addSegmentFromTimecodes(matId, segment.MarkerIn.Absolute.toString(), textlessHandler.minusOneFrame(matchedSegmentObjList[0]["texted"].MarkerIn.Absolute.toString(), frameRate), frameRate);
                        placingBuilder.addSegmentBlock(segmentBlock);
					}

                    for each (var matchedSegmentObj in matchedSegmentObjList){
                    	var textlessSegment = matchedSegmentObj["textless"];
                        var textedSegment = matchedSegmentObj["texted"];

                    	// Get all the textless segment insert information.
                        var textlessSegmentIncode = textlessSegment.MarkerIn.Absolute.toString();
                        var textlessSegmentOutcode = textlessSegment.MarkerOut.Absolute.toString();
                        var textedSegmentIncode = textedSegment.MarkerIn.Absolute.toString();
                        var textedSegmentOutcode = textedSegment.MarkerOut.Absolute.toString();

                        // Only add a segment from the main material if previousSegmentOutcode has a value. (Likely only during the first run through of the loop)
                        if (previousSegmentOutcode !== null && previousSegmentOutcode !== undefined){
                            var segmentBlock = placingBuilder.addSegmentFromTimecodes(matId, textlessHandler.addOneFrame(previousSegmentOutcode, frameRate), textlessHandler.minusOneFrame(textedSegmentIncode, frameRate), frameRate);
                            placingBuilder.addSegmentBlock(segmentBlock);
						}

						// Add our textless insert segemnt.
						var segmentBlock = placingBuilder.addSegmentFromSegmentXml(textlessSegment.Material.MatId.toString(), textlessSegment);
                        placingBuilder.addSegmentBlock(segmentBlock);

                        // Set the previousSegmentOutcode accordingly, this allows us to fill in the blanks between the textless inserts.
						// We must use the texted segment outcode, as the textless might not match our source material.
                        previousSegmentOutcode = textedSegmentOutcode;
                    }

                    // If the last textless insert, doesn't end at the segment outcode, lets add the rest from the original segment.
                    if (previousSegmentOutcode != segment.MarkerOut.Absolute.toString()){
                        var segmentBlock = placingBuilder.addSegmentFromTimecodes(matId, textlessHandler.addOneFrame(previousSegmentOutcode, frameRate), segment.MarkerOut.Absolute.toString(), frameRate);
                        placingBuilder.addSegmentBlock(segmentBlock);
					}
                } else {
                    /**
                     * Real Segment(s) - No texted/textless inserts required, use a real segment.
                     */

                    output("Adding raw un-edited segment, no texted/textless replacements needed.");

                    /*
                     * Original method:
                     */
                    //var segmentBlock = placingBuilder.addSegmentFromSegmentXml(matId, segment);
                    
                    /*
                     * This is the current "halfway" solution for Territory Masters.
                     * It explicitly adds material and track type information to the template XML used for parcel generation.
                     * However, it currently only uses the track types on the main material rather than track types specified in the profile.
                     * Further development is needed to finalize territory masters.
                     */
                    var segmentBlock = placingBuilder.makeEmptySegmentBlock();
                    
                    //trackTypes @ Line 396
                    for each(var trackType in trackTypes) {
                        
                        segmentBlock = placingBuilder.addSegmentFromSegmentXml(matId, segment, trackType, segmentBlock);
                        //break;//for testing
                        
                    }
                    
                    placingBuilder.addSegmentBlock(segmentBlock);
                }

                /**
                 * Midroll Black Segment
                 */
                // Only add black if its not the last segment.
                if (segmentList[segmentList.length() - 1] != segment && conformSettingsObj.midrollBlack != "00:00:00:00" && !isRestoreAndDeliver){
                    var segmentBlock = placingBuilder.addBlackSegment(conformSettingsObj.midrollBlack, frameRate);
                    placingBuilder.addSegmentBlock(segmentBlock);
                }

			}

            /**
			 * Tail Promo Segment
             */
			var tailPromoDetails = getPromoDetails("Tail", destSpecificMatHierarchialObj);
			if (tailPromoDetails.promoMatId !== null && tailPromoDetails.promoMatId !== undefined && tailPromoDetails.promoMatId !== "" && !isRestoreAndDeliver){
				var segmentBlock = placingBuilder.addSegmentFromTimecodes(tailPromoDetails.promoMatId, tailPromoDetails.promoIncode, tailPromoDetails.promoOutcode, tailPromoDetails.promoFrameRate);
				placingBuilder.addSegmentBlock(segmentBlock);
			}

            /**
			 * OM Textless At End Logic
             */
			if (isOmTatEnd){
				output("Lets add an OM Tat End segment");

                /**
				 * OM Textless At End Pre Black Segment
                 */
				if (conformSettingsObj.preTatendBlack !== "00:00:00:00" && !isRestoreAndDeliver){
					var segmentBlock = placingBuilder.addBlackSegment("00:00:00:00", conformSettingsObj.preTatendBlack, frameRate);
					placingBuilder.addSegmentBlock(segmentBlock);
				}

                /**
				 * OM Textless At End Segment
                 */
				// We can use the second component and safely assume its our OM Tat End component
				var omTatEndMatId = recipeComponents[1].matid;
				var omTatEndSegmentGroup = recipeComponents[1].segmentgroup;
				var omTatEndMaterialHelper = new gmoNBCFunc.materialHelper(omTatEndMatId);
				
				var omTatEndSegmentList = omTatEndMaterialHelper.getSegmentsByGroup(omTatEndSegmentGroup)..Segment;
				
				if (omTatEndSegmentList.length() !== 1) {
					throw new Error ("Can only accept a single segment for OM Tat End segment data.");
				}
		
				var segmentBlock = placingBuilder.addSegmentFromSegmentXml(omTatEndMatId, omTatEndSegmentList[0]);
				placingBuilder.addSegmentBlock(segmentBlock);
			}

            /**
             * Tail Black Segment
             */
			if (conformSettingsObj.topBlackDuration !== "00:00:00:00" && !isRestoreAndDeliver){
				var segmentBlock = placingBuilder.addBlackSegment(conformSettingsObj.tailBlackDuration, frameRate);
				placingBuilder.addSegmentBlock(segmentBlock);
			}

		} else {
			throw new Error("Segments could not be found for Material [" + matId + "] in with a group of [" + segmentGroup + "]");
		}
	}
	
	/**
	*	Add the requisite Template settings for Parcel Generation
	**/
	placingBuilder.setPlacingIdParam(placingId);
	placingBuilder.setParcelFrameRateParam(parcelFrameRate);
	placingBuilder.setTemplateName("NBCMainNLDTemplate");
	placingBuilder.setSegmentBlockList(placingBuilder.segmentBlockList);
	placingBuilder.setWatermarkRequired(placingHelper.isWaterMarkingRequired(placingHelper.getPlacingXml(), materialHelper.materialXml..Material));
	
	if (debug) print("\n\nDebug: Template List [ "+ placingBuilder.templateParameterList + "]");
	
	// This just creates the Parcel but doesn't save it. 
	var parcelXml = wscall(placingBuilder.generateWsXml())..Parcel;
	
	var saveParcel = 
		<PharosCs>
			<CommandList>
				<Command subsystem="placing" method="save">
					<ParameterList>
						<Parameter name="placing">
							<Value>
								<Placing>
									<PlacingId>{placingId}</PlacingId>
									<PlacingParcelList>
										<PlacingParcel>
											{parcelXml}
										</PlacingParcel>
									</PlacingParcelList>
								</Placing>
							</Value>
						</Parameter>
					</ParameterList>
				</Command>
			</CommandList>
		</PharosCs>;
	
	wscall(saveParcel);
	
	// Transition Placing - with successful requirement
	jobDashboard.updateStatusAndProgress("Transitioning Placing",95);
	print("\nTransitioning Placing [" + placingId + "] with requirement [" + requirements.toApprovalRequired + "]");
	
	try{	
		gmoNBCNLDFunc.transitionPlacing(placingId, states.originalState, requirements.toApprovalRequired);
	}catch(e) {
		print("\nProfile Allocation Transition Error: [" + e + "]");
		sleep(5)
		gmoNBCNLDFunc.transitionPlacing(placingId, states.originalState, requirements.toApprovalRequired);
	}
	// Leave Successfully
	jobDashboard.updateStatusAndProgress("Success",100);

	/* START OF COMMENT FOR TESTING
	
	
	// Update the placingXml and parcelXml variables.
	placingHelper.refresh();
	placingXml = placingHelper.getPlacingXml();
	parcelXml = placingHelper.getParcel();

	//jobDashboard.updateStatusAndProgress("Placing Successfully Built",70);
	
	// Gather Requirements for Custom Header 
	if(conformSettingsObj.isCustomHeaderRequired){
		customHeaderRequirementsObj = findCustomHeaderRequirements(parcelXml, settings);
		//jobDashboard.updateStatusAndProgress("Fullfilling Custom Header Requirements",75);
		insertCustomHeaderEvents = insertCustomHeaderEventsIntoParcel(parcelXml, customHeaderRequirementsObj);
		if (insertCustomHeaderEvents !== true) throw new Error("Failed to add Custom Headers to Parcel");
		if(debug)print(gmoNBCNLDFunc.getParcel(parcelId)..ParcelEventList);
	} else{
		print("\nConform Preset has no Custom Header Requirements. Skipping ...");
	}
			
	// Update the placingXml and parcelXml variables.
	placingHelper.refresh();
	placingXml = placingHelper.getPlacingXml();
	parcelXml = placingHelper.getParcel();
	
	// Need to add the VCHIP and Watermarking Information
	if(isRestoreAndDeliver === false ){
		//jobDashboard.updateStatusAndProgress("Inserting VCHIP and Watermarking Information",83);
		insertAndSaveAncillaryEvents(placingHelper, firstMaterialXml);
	} else {
		print("Restore and deliver selected, ancillary events not supported");
	}
	
	// Update the placingXml and parcelXml variables.
	placingHelper.refresh();
	placingXml = placingHelper.getPlacingXml();
	parcelXml = placingHelper.getParcel();
	
	// Check All TrackTypes for Materials exist in a Valid State
	print("\nEnsuring Validity of Track Types in Placing");
	//jobDashboard.updateStatusAndProgress("Ensuring Track Types Match a Valid Material Type Profile Map",85);
	ensureTrackTypesAreValid(placingXml);
		
	// Translator Check
	print("\nEnsuring Validity Translator Shell Exists\n");
	//jobDashboard.updateStatusAndProgress("Ensuring Translator has a record of Placing",90);
	translatorShellExists = gmoNBCFunc.isTranslatorShellExists(tvdId);
	if(translatorShellExists !== true){
		throw new Error("There is no Translator Shell Record Mapping for this TVD #. Please map this Material in Translator and retry this in Mediator from Awaiting Components task"); 
	}
		
	// Transition Placing - with successful requirement
	//jobDashboard.updateStatusAndProgress("Transitioning Placing",95);
	print("\nTransitioning Placing [" + placingId + "] with requirement [" + requirements.toApprovalRequired + "]");
	gmoNBCNLDFunc.transitionPlacing(placingId, states.originalState, requirements.toApprovalRequired);
	
	
	
	END OF COMMENT FOR TESTING */

	// Leave Successfully
	//jobDashboard.updateStatusAndProgress("Success",100);
	
} catch(e) {
	// TransitionPlacing - with fail requirement
	print("\nProfile Allocation error: [" + e + "]");
	gmoNBCNLDFunc.transitionPlacing(placingId, states.originalState, requirements.toAwaitingComponents);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})
	quit(-1);
}


// Currently un-used functions, putting here for now incase we still need them.


validateCaptionMethods = function() {
    // The function to get the caption map will do the validation, just have to call it.
    var captionMapping = gmoNBCNLDFunc.getProfileCaptionMap(this.sourceObj.placingxml, this.firstMaterial, this.presetSettings);
    //var captionMapping = gmoNBCNLDFunc.getProfileCaptionMap(this.placingHelper.getPlacingXml(), this.firstMaterial, this.presetSettings);
}


findCustomHeaderRequirements = function(parcelXml, presetSettings){
    var frameRate = parcelXml.FrameRate.toString();
    var customSlateBackGround = presetSettings.slateBackgroundStyle;
    var headerOptions = [];
    var headerOptionsDurations = [];
    var customSlateOptions = [];

    headerOptions = [
        this.presetSettings.headerOption1,
        this.presetSettings.headerOption2,
        this.presetSettings.headerOption3,
        this.presetSettings.headerOption4,
        this.presetSettings.headerOption5,
        this.presetSettings.headerOption6
    ];

    headerOptionsDurations = [
        this.presetSettings.headerOption1Duration,
        this.presetSettings.headerOption2Duration,
        this.presetSettings.headerOption3Duration,
        this.presetSettings.headerOption4Duration,
        this.presetSettings.headerOption5Duration,
        this.presetSettings.headerOption6Duration
    ];

    customSlateOptions = [
        this.presetSettings.slateOption1,
        this.presetSettings.slateOption2,
        this.presetSettings.slateOption3,
        this.presetSettings.slateOption4,
        this.presetSettings.slateOption5,
        this.presetSettings.slateOption6,
        this.presetSettings.slateOption7,
        this.presetSettings.slateOption8,
        this.presetSettings.slateOption9,
        this.presetSettings.slateOption10,
        this.presetSettings.slateOption11,
        this.presetSettings.slateOption12,
        this.presetSettings.slateOption13,
        this.presetSettings.slateOption14,
        this.presetSettings.slateOption15,
        this.presetSettings.slateOption16,
        this.presetSettings.slateOption17,
        this.presetSettings.slateOption18,
        this.presetSettings.slateOption19,
        this.presetSettings.slateOption20
    ];

    return {
        "isCustomHeaderRequired" : isCustomHeaderRequired,
        "headerOptions" : headerOptions,
        "headerOptionsDurations": headerOptionsDurations,
        "customSlateBackGround" : customSlateBackGround,
        "customSlateOptions" : customSlateOptions
    }
}

insertCustomHeaderEventsIntoParcel = function(parcelXml, customHeaderRequirementsObj){
    print("\nStarting Custom Header Creation Process");
    var headerOptions = customHeaderRequirementsObj.headerOptions;
    var headerOptionsDurations = customHeaderRequirementsObj.headerOptionsDurations;
    var parcelFrameRate = parcelXml.FrameRate.toString();
    var blackMatPrefix = "BLACK_";
    var blackMaterialId = blackMatPrefix + parcelFrameRate;
    var barsAndTonePrefix = "BARS_TONE_";
    var barsAndToneMatId = barsAndTonePrefix + parcelFrameRate;
    var slatePrefix = customHeaderRequirementsObj.customSlateBackGround;
    var slateMatId = slatePrefix + "_" + parcelFrameRate;
    var eventList = parcelXml.ParcelEventList;
    var stillEventType = "Still";
    var mainMaterialStream = "nld video";
    var eventDesc = "Custom Header";

    for (var index in headerOptions) {
        var option = headerOptions[index];
        print("\nIndex [" + index + "] Option [" + option+ "]")
        if(gmoNBCFunc.isVarUsable(option) && option!="-None-"){
            var optionDuration = headerOptionsDurations[index];
            print("\n[" + option + "] Duration is [" + optionDuration+ "]")
            if(gmoNBCFunc.isVarUsable(optionDuration)){
                var cgText = eventDesc + "-" + option;
                if("Black" == option) {
                    print("Inserting Black Event Index [" + index + "]");
                    eventList.insertChildBefore(eventList.Event[index],gmoNBCNLDFunc.makeBaseEventXml(optionDuration, parcelFrameRate, mainMaterialStream, blackMaterialId, stillEventType, eventDesc, cgText));
                }else if ("Slate" == option){
                    print("Inserting Slate Event Index [" + index + "]");
                    eventList.insertChildBefore(eventList.Event[index],gmoNBCNLDFunc.makeBaseEventXml(optionDuration, parcelFrameRate, mainMaterialStream, slateMatId, stillEventType, eventDesc, cgText));
                }else if("Bars & Tone" == option){
                    print("Inserting Bars & Tone Event Index [" + index + "]");
                    eventList.insertChildBefore(eventList.Event[index],gmoNBCNLDFunc.makeBaseEventXml(optionDuration, parcelFrameRate, mainMaterialStream, barsAndToneMatId, stillEventType, eventDesc, cgText));
                }

            }else{
                throw new Error("Custom Header Option [" + option+ "] is selected but no duration is provided for the option");
            }
        }else{
            print("\n[" + index + "] is not defined . Assuming End of Header Options")
            break;
        }
    }

    print("\nNew Custom Header Events have been added. Retiming Parcel:");
    var parcelOffset;
    var previousOffset;
    var newAddition = "Custom Header Events";

    for each(var ev in eventList.Event){
        // Used for logging
        previousOffset = ev.ParcelOffset.toString() === "" ? newAddition : ev.ParcelOffset;
        // Create Parcel Offsets - if first event (0 based counting) start at 00:00:00:00 otherwise add previous events duration
        parcelOffset = ev.childIndex() == 0 ? AmountOfTime.parseFrames(parcelFrameRate, 0) : parcelOffset.add(AmountOfTime.parseText(FrameRate[gmoNBCNLDFunc.getPrevEvent(eventList, ev.childIndex()).FrameRate.toString()], gmoNBCNLDFunc.getPrevEvent(eventList, ev.childIndex()).Duration.toString()));

        // Change the Current Events Offset
        ev.ParcelOffset = parcelOffset.asText(FrameRate[parcelFrameRate]);
        ev.Duration.@rate = parcelFrameRate;

        print(
            "\nEvent Index [" + ev.childIndex() + "]" +
            " Original Parcel Offset [" + previousOffset  + "]" +
            " New Parcel Offset [" + ev.ParcelOffset + "]" +
            " Duration [" + ev.Duration + "]"
        );
    }

    parcelXml.Duration = gmoNBCNLDFunc.getParcelDuration(<Placing><PlacingParcel>{parcelXml}</PlacingParcel></Placing>);
    print("\ninsertCustomHeaderEventsIntoParcel(): Saving Parcel" + "\n " + parcelXml);
    gmoNBCNLDFunc.saveParcel(parcelXml);
    return true;
}

/**
	Commented out as this should now use the Scripted Template wizardry 
**/

/*	
insertAndSaveAncillaryEvents = function(placingHelper, materialXml) {
    print("\nSaving Ancillary Events into Parcel");

    var parcelXml = placingHelper.getParcel();
    var parcelDuration = parcelXml.Duration.toString();
    var parcelFrameRate = parcelXml.FrameRate.toString();

    // Find Watermarking Information
    print("\nExtracting information to build Watermarking Event");

    var requriesWatermarking = placingHelper.isWaterMarkingRequired(placingHelper.getPlacingXml(),materialXml);
    if (requriesWatermarking) {
        print("\nBuilding Watermarking Event");
        var waterMarkingEventXml = gmoNBCNLDFunc.makeWaterMarkingEvent(requriesWatermarking, parcelDuration, parcelFrameRate);
        parcelXml.ParcelEventList.appendChild(waterMarkingEventXml);
        print("\nCreated Watermarking Event [" + waterMarkingEventXml + "]")
    } else {
        print("\nWatermarking not required not creating Watermarking Event");
    }

    if(debug) print("\nParcel Xml [" + parcelXml + "]");
    print("\nSaving Parcel with VCHIP and Watermarking Information");
    gmoNBCNLDFunc.saveParcel(parcelXml);
}
*/

ensureTrackTypesAreValid = function(placingXml) {
    print("ensureTrackTypesAreValid - Start")
    const mainMaterialStream = "nld video";
    const matchedProfileDataElement = "Matched Profile";
    var allMatchedFirstChoice = true;	//	Have all the events matched the first choice profile.
    var notesForUser = [];

    var getGetOrdinal = function(n) {
        var s=["th","st","nd","rd"],
            v=n%100;
        return n+(s[(v-20)%10]||s[v]||s[0]);
    }

    /*
     Loop through each event to determine:
     1. Does the Event Material have a matching profile
     2. If it does have a matching profile, this this is first choice profile?
     */
    var materialIdsChecked = [];
    for each (var parcelEvent in placingXml..Event.(Stream.toString() == mainMaterialStream)) {
        if (!gmoNBCFunc.contains(materialIdsChecked, parcelEvent.TrimMaterialId.toString()) && !gmoNBCNLDFunc.isAncillaryMaterial(parcelEvent.TrimMaterialId.toString())) {
            // Have not checked this material already
            var profileToUse;

            if (typeof gmoNBCNLDFunc.getMatchedProfileTrackTypes(placingXml, parcelEvent.TrimMaterialId.toString()) === undefined) {
                throw new Error("Required Components are not in ready state or not available on the Material, sending to Awaiting Components until they arrive.");
            } else {
                // 	We have some matched track types, get the profile name and check where it is in the list of profiles
                profileToUse = gmoNBCNLDFunc.getMatchedProfileName(placingXml, parcelEvent.TrimMaterialId.toString());
                print("profileToUse ["+profileToUse+"]")
                if (gmoNBCNLDFunc.indexOfProfileFromProfileStatus(placingXml..ProfileStatus.(Name == parcelEvent.TrimMaterialId.toString())[0], profileToUse) === 0) {
                    //	index 0 is the first choice profile

                } else {
                    var noteString = "Source Material [" + parcelEvent.TrimMaterialId.toString() + "] does not match first choice profile [" + placingXml..ProfileStatus.(Name == parcelEvent.TrimMaterialId.toString())[0].Statuses.ProfileStatus.Name[0].toString() +
                        "]. It has matched the [" + getGetOrdinal((1 + gmoNBCNLDFunc.indexOfProfileFromProfileStatus(placingXml..ProfileStatus.(Name == parcelEvent.TrimMaterialId.toString())[0], profileToUse))) + "] choice which is [" + profileToUse + "].";
                    output(noteString);
                    notesForUser.push(noteString);
                    allMatchedFirstChoice = false;
                }
                if(parcelEvent.TrimMaterialId.toString() == this.firstMaterial){
                    gmoNBCNLDFunc.savePlacingShortText(this.placingId,matchedProfileDataElement,profileToUse);
                }
            }

            // Don't check this Material ID again
            materialIdsChecked.push(parcelEvent.TrimMaterialId.toString());
        } else {
            // Add logging?
        }
    }
    print("\nSuccess all Materials in Placing match a Valid Material Type Profile Map");
    print("ensureTrackTypesAreValid - Exit")
    return {
        "success"	:	allMatchedFirstChoice,
        "comment"	:	notesForUser
    }
}