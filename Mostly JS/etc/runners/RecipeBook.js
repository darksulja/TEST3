var RecipeFinder = function (recipeBook) {

	// Check new keyword was used
	if (!( this instanceof RecipeFinder)) {
		throw new Error("Please call with new () keyword");
	}
	
	this.recipeBook = recipeBook;
		
	this.searchForRecipeComponents = function(outputFileTypeToCheck,settingsList,isRestoreAndDeliver) {
		
		// Ways to make output file (Restore and Deliver should look under the Restore and Deliver Prop)
		var recipesForOutputFile = isRestoreAndDeliver === true ? this.recipeBook.recipes[recipeBook.restoreAndDeliver][outputFileTypeToCheck] : this.recipeBook.recipes[outputFileTypeToCheck];
				
		if (recipesForOutputFile.length === 0) {
			print("\nNo Recipes listed for [" + recipesForOutputFile + "]");
			return false;
		};
		
		print("\nNumber of Recipes [" + recipesForOutputFile.length + "] to make Output File [" + outputFileTypeToCheck + "]");
		for (var i=0; i<recipesForOutputFile.length; i++) {
		
			print("\n++++ Checking Recipe [" + (i+1) + "] out of [" + recipesForOutputFile.length + "] ++++");
		
			var recipeComponents = this.findMaterialSegmentGroupList(recipesForOutputFile[i],settingsList);
			if (recipeComponents) {
				print("\nSuccess Recipe [" + (i+1)+ "] can be used to create [" + outputFileTypeToCheck + "]"); 
				return recipeComponents;
			} else {
				print("\nRecipe [" + (i+1)+ "] cannot be used to create [" + outputFileTypeToCheck + "]");
			}
		}
		
		print("\nNo Recipes found to create [" + outputFileTypeToCheck + "]");
		return false;
	},
	
	this.findMaterialSegmentGroupMatch = function(matchedMaterialObjList, segmentGroup, settingsList) {
	
		for (var j=0; j < matchedMaterialObjList.length; j++) {
			
			var matId = matchedMaterialObjList[j].matid;
			// Return Object
			var rtn =  {matid : matId, versiontype : matchedMaterialObjList[j].versiontype, framerate : matchedMaterialObjList[j].framerate };
					
			print("\nChecking Material [" + matId + "] for [" + segmentGroup + "]");
			var materialHelper = new gmoNBCFunc.materialHelper(matId);
			
			// If project is Restore and Deliver - Check for Whole Material Segment at the default index. Create if missing.
			if (settingsList.restoreandeliver) {
				
				var wholeMaterialSegmentGroup = "Whole Material"; // Sadly needs to be hardcoded until how to get global scope is figured out
				var wholeMaterialDefaultIndex = 1;
				var hasWholeSegmentAtCorrectIndex = materialHelper.getSegmentsByGroup(wholeMaterialSegmentGroup).Segment.(parseInt(Index) === wholeMaterialDefaultIndex).length() === 1;
				
				if (hasWholeSegmentAtCorrectIndex) {
					
					print("\nProject is Restore and Deliver. [" + wholeMaterialSegmentGroup + "] Segment exists at Index [" + wholeMaterialDefaultIndex+ "] using");
					
				} else {
					
					print("\nProject is Restore and Deliver and Requires a [" + wholeMaterialSegmentGroup + "] Segment at Index [" + wholeMaterialDefaultIndex + "] creating!");
					this.createSegment(materialHelper, wholeMaterialSegmentGroup, wholeMaterialDefaultIndex);
				
				}
			} 
			
			// Check Segment Group exists
			var hasRequiredSegments = materialHelper.getSegmentsByGroup(segmentGroup).Segment.length() > 0;
			if (hasRequiredSegments) {
				print("\nSuccess Material [" + matId + "] contains Segment Group [" + segmentGroup + "]");
				rtn.segmentgroup = segmentGroup; // Add appropriate Segment Group to Return
				return rtn;
			} 
		}
		return false;
	},
	
	this.findMaterialSegmentGroupList = function(recipe,settingsList) {
		var myLog = function(str) {
			output("findMaterialSegmentGroupList(): " + str);
		}
	
		var tvdInspector = new TVDInspector(settingsList.tvdnumber);
		myLog("\nRecipe requires [" + recipe.length + "] Material(s)");
	
		// Houses the steps for current recipe
		var recipeComponents = [];
	
		for (var i=0; i< recipe.length; i++) {
			
			myLog("\nChecking if Material [" + (i + 1) + "] out of [" + recipe.length + "] exists with the following Criteria:");
			var recipeAspectRatio = recipe[i].aspectratio;
			var recipeVersionType = recipe[i].versiontype; 
			var recipeSegmentGroup = recipe[i].segmentgroup;
			var recipeTerritorySubType = recipe[i].territorysubtype;
		
			var querySpecificVersionTypeAndAspectRatio = recipeVersionType !== recipeBook.versionTypeNeutral; // If we require a specific Version Type to be the Source
			var aspectRatioToQuery = recipeAspectRatio === recipeBook.setByWorkOrder ? settingsList.aspectratio : recipeAspectRatio; 
			var segmentGroup = recipeSegmentGroup === recipeBook.setByPreset ? settingsList.segmentgroup : recipeSegmentGroup; 
			
			if (typeof recipeTerritorySubType === "undefined") {
				var territorySubType = "N/A";
			} else if (recipeTerritorySubType === recipeBook.setByPreset) {
				var territorySubType = settingsList.territorymastertype;
			} //  Room for translator to override :)
		
			myLog(
				"\n\t\tRequired Aspect Ratio [" + aspectRatioToQuery + "]" +
				"\n\t\tRequired Version Type [" + recipeVersionType + "]" +
				"\n\t\tRequired Segment Group [" + segmentGroup + "]" + 
				"\n\t\tRequired Territory Sub Type [" + territorySubType + "]"
			);
		
			// List of Material Objects to check Segments on
			var matchedMaterialObjList;
		
			if (territorySubType == "N/A")  {
				// English only (Original)
				myLog("Performing 'Basic' Material Search For TVD Number and Aspect Ratio");
				if (querySpecificVersionTypeAndAspectRatio) {
					matchedMaterialObjList = tvdInspector.getMaterialObjectsByVersionTypeAndAspectRatio(recipeVersionType,aspectRatioToQuery);
				} else {
					matchedMaterialObjList = tvdInspector.getMaterialObjectsListByAspectRatio(aspectRatioToQuery);
				}
				
			} else {
				// Building a Territory Master
				myLog("Performing 'Extended' Material Search For TVD Number, Aspect Ratio and Territory Sub Type");
				if (querySpecificVersionTypeAndAspectRatio) {
					matchedMaterialObjList = tvdInspector.getTerritoryMasterObjectsByVersionTypeAspectRatio(recipeVersionType, aspectRatioToQuery, territorySubType);
				} else {
					matchedMaterialObjList = tvdInspector.getTerritoryMasterObjectsListByAspectRatio(aspectRatioToQuery, territorySubType);
				}
			}
		
			//See if a Recipe Component exists
			var recipeComponent;
			recipeComponent = this.findMaterialSegmentGroupMatch(matchedMaterialObjList,segmentGroup,settingsList);
		
			// Cannot fulfill this Recipe as the Recipe Component didn't exist
			if (recipeComponent === false) {
				myLog("\n\t\tFAIL: No such Material exists");
				return false;
			}
		
			// Found a part of the Recipe Add it
			recipeComponents.push(recipeComponent);
		}	
		// Return the Components to make the Recipe
		return recipeComponents;
	},
	
	this.createSegment = function(materialHelper, segmentGroup, index) {
		
		var storeMedia = materialHelper.findMainStoreMedia();
		if (storeMedia === undefined) throw new Error("Failed to find a valid Track to retrieve Time Codes to create a Whole Material Segment from!");
		
		var mainMediaTrackXml = materialHelper.getTrackXmlByMedia(storeMedia);
		var incode = mainMediaTrackXml.Incode.toString();
		var outcode = mainMediaTrackXml.Outcode.toString(); 
		
		materialHelper.addSegmentToSaveXml(incode, outcode, segmentGroup, index);
		
		var saveMaterialSegment = materialHelper.saveUsingSaveXml();
		if (saveMaterialSegment === false) throw new Error("\nFailed to save [" + segmentGroup  + "] Segment for [" + materialHelper.matId + "]");
	
	},
	
	this.attemptRecipeMatch = function (versionPreferenceList, recipeSettingsList, isRestoreAndDeliver) {
		
		// See if it`s possible to make one of the accepted output types
		for (var i=0; i< versionPreferenceList.length; i++) {
					
			var outputFileTypeToCheck = versionPreferenceList[i];
			
			print("\n############################################################################################");
			print("\nChecking to see if Version Type [" + outputFileTypeToCheck + "] Preference [" + (i + 1) + "] out of [" + versionPreferenceList.length + "] can be made with Aspect Ratio [" + recipeSettingsList.aspectRatio + "]");
			print("\n############################################################################################");
						
			// Attempt to get a Recipe and the Components (Materials and Segment Group)
			var recipeComponents = this.searchForRecipeComponents(outputFileTypeToCheck, recipeSettingsList, isRestoreAndDeliver);
				
			// See if a valid Recipe has been found
			if (recipeComponents) {
				gmoNBCNLDFunc.savePlacingShortText(this.placingId,"Order Version Type",gmoNBCNLDFunc.getNLDVersionTypeDescription(outputFileTypeToCheck));
				return recipeComponents;
			} 
			print("\nCannot create output FileType [" + outputFileTypeToCheck + "]");
		}
	}
};

var RecipeBook = function() {
	// Constants	
	this.versionTypeNeutral = "Version Type Netural";
	this.setByWorkOrder = "Set by Workorder";
	this.setByPreset = "Set by Preset";
	this.restoreAndDeliver = "RESTORE AND DELIVER";
	
	// Segment Types
	this.segmentTextlessSomEom  = "Textless SOM/EOM";
	this.segmentWholeMaterial = "Whole Material";
	this.segmentHeader = "Header";
	this.segmentTextlessData = "Textless Data";
		
	/***************************************
	*	Recipes
	*	Below is a list of all the recipes. You can then specify as many recipes per output type that you are trying to make.
	*	Please put a document header like this, to specify the start of a new Recipe type. Comment each individual recipe as required.
	****************************************/
	this.recipes = {};
	
	
	/***************************************
	*	Restore and Deliver recipes.
	*	A recipe exists for every version type, as long as a match is found for the required/preferred version types.
	****************************************/
	
	this.recipes[this.restoreAndDeliver] = [];
	// Ways to make Restore and Deliver Textless at End File
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.omTatend] = [];
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.omTatend].push([{aspectratio : this.setByWorkOrder, versiontype : NBCGMO.versionTypeMap.omTatend, segmentgroup : this.segmentWholeMaterial}]);
	// Ways to make Restore and Deliver Fully Texted File
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.omFtexted] = [];
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.omFtexted].push([{aspectratio : this.setByWorkOrder, versiontype : NBCGMO.versionTypeMap.omFtexted, segmentgroup : this.segmentWholeMaterial}]);
	// Ways to make a Restore and Deliver Fully Textless File
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.omFtless] = [];
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.omFtless].push([{aspectratio : this.setByWorkOrder, versiontype : NBCGMO.versionTypeMap.omFtless, segmentgroup : this.segmentWholeMaterial}]);
	// Ways to make a Restore and Deliver Textless at End
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.omTelements] = [];
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.omTelements].push([{aspectratio : this.setByWorkOrder, versiontype : NBCGMO.versionTypeMap.omTelements, segmentgroup : this.segmentWholeMaterial}])
		

	// Ways to make a Restore and Deliver Texted Languaged Master
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.lmFtexted] = [];
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.lmFtexted].push([{aspectratio : this.setByWorkOrder, versiontype : NBCGMO.versionTypeMap.lmFtexted, segmentgroup : this.segmentWholeMaterial, territorysubtype : this.setByPreset}])
	// Ways to make a Restore and Deliver Textless Languaged Master  
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.lmFtless] = [];
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.lmFtless].push([{aspectratio : this.setByWorkOrder, versiontype : NBCGMO.versionTypeMap.lmFtless, segmentgroup : this.segmentWholeMaterial, territorysubtype : this.setByPreset}])
	// Ways to make a Restore and Deliver Textless At End Languaged Master  
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.lmTatend] = [];
	this.recipes[this.restoreAndDeliver][NBCGMO.versionTypeMap.lmTatend].push([{aspectratio : this.setByWorkOrder, versiontype : NBCGMO.versionTypeMap.lmTatend, segmentgroup : this.segmentWholeMaterial, territorysubtype : this.setByPreset}])


	/***************************************
	*	Textless At End Recipes
	****************************************/
	
	// Ways to make a Textless At End Asset 
	this.recipes[NBCGMO.versionTypeMap.omTatend] = [];
	// Create from an OM-TATEND Asset that has the Textless SOM/EOM Group
	this.recipes[NBCGMO.versionTypeMap.omTatend].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.omTatend, 
			segmentgroup : this.setByPreset
		}, 
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.omTatend, 
			segmentgroup : this.segmentTextlessSomEom
		}
	]);
	// Create from an OM-omFtexted Asset and any other Material that has Textless SOM/EOM Group
	this.recipes[NBCGMO.versionTypeMap.omTatend].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.omFtexted, 
			segmentgroup : this.setByPreset
		},
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : this.versionTypeNeutral, 
			segmentgroup : this.segmentTextlessSomEom
		}
	]);
	
	
	/***************************************
	*	Fully Texted Recipes
	****************************************/
	
	this.recipes[NBCGMO.versionTypeMap.omFtexted] = [];
	// Create from a Fully Texted Asset
	this.recipes[NBCGMO.versionTypeMap.omFtexted].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.omFtexted, 
			segmentgroup : this.setByPreset
		}
	]);
	// Create from a Textless at End Asset
	this.recipes[NBCGMO.versionTypeMap.omFtexted].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.omTatend, 
			segmentgroup : this.setByPreset
		}
	]);
		

	/***************************************
	*	Fully Textless Recipes
	****************************************/
	
	this.recipes[NBCGMO.versionTypeMap.omFtless] = [];
	// Create from a Fully Textless Asset
	this.recipes[NBCGMO.versionTypeMap.omFtless].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.omFtless, 
			segmentgroup : this.setByPreset
		}
	]);
	
	this.recipes[NBCGMO.versionTypeMap.omFtless].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.omFtexted, 
			segmentgroup : this.setByPreset
		},
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : this.versionTypeNeutral, 
			segmentgroup : this.segmentTextlessData,
			usewhenrunningtemplate : false
		}		
	]);
	
	// Create from a Textless at end - using both the Texted and Textless Segments
	this.recipes[NBCGMO.versionTypeMap.omFtless].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.omTatend, 
			segmentgroup : this.setByPreset
		},
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : this.versionTypeNeutral, 
			segmentgroup : this.segmentTextlessData,
			usewhenrunningtemplate : false	// Set this to check if this segment group exists but not use it when running the break parting template
		}		
	]);	
	

	/***************************************
	*	Textless Elements Recipes
	****************************************/
	
	this.recipes[NBCGMO.versionTypeMap.omTelements] = [];
	// Create from a Textless Elements Asset
	this.recipes[NBCGMO.versionTypeMap.omTelements].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.omTelements, 
			segmentgroup : this.setByPreset
		}
	]);

	// Create from OM-TATEND (Textless SOM/EOM)
	this.recipes[NBCGMO.versionTypeMap.omTelements].push([
		{
			aspectratio : this.setByWorkOrder,
			versiontype : NBCGMO.versionTypeMap.omTatend,
			segmentgroup : this.segmentTextlessSomEom
		}
	]);

	/***************************************
	*	Textless Elements Only Recipes
	****************************************/
	
	this.recipes[NBCGMO.versionTypeMap.lmTelements] = [];
	// Create from a Textless Elements Asset
	this.recipes[NBCGMO.versionTypeMap.lmTelements].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.lmTelements, 
			segmentgroup : this.setByPreset
		}
	]);
	
	this.recipes[NBCGMO.versionTypeMap.lmTelements].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.lmTatend, 
			segmentgroup : this.segmentTextlessSomEom
		}
	]);	


	/***************************************
	*	Fully Texted Territory Master Recipes
	****************************************/
	
	this.recipes[NBCGMO.versionTypeMap.lmFtexted] = [];
	// Create from an LM-FTEXTED which matches the Territory Sub-Type
	this.recipes[NBCGMO.versionTypeMap.lmFtexted].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.lmFtexted, 
			segmentgroup : this.setByPreset,
			territorysubtype : this.setByPreset
		}
	
	]);
	// Create from an LM-TATEND which matches the Territory Sub-Type
	this.recipes[NBCGMO.versionTypeMap.lmFtexted].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.lmTatend, 
			segmentgroup : this.setByPreset,
			territorysubtype : this.setByPreset
		}
	
	]);	
	

	/***************************************
	*	Textless at End Territory Master Recipes
	****************************************/
	
	this.recipes[NBCGMO.versionTypeMap.lmTatend] = [];
	// Create from an LM-TATEND which matches the territory Sub-Type that has the Textless SOM/EOM Group
	this.recipes[NBCGMO.versionTypeMap.lmTatend].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.lmTatend, 
			segmentgroup : this.setByPreset,
			territorysubtype : this.setByPreset
		}, 
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.lmTatend, 
			segmentgroup : this.segmentTextlessSomEom
		}	
	]);
	// Create from an LM-FTEXTED that matches the territory sub-type and any other Material that has Textless SOM/EOM Group
	this.recipes[NBCGMO.versionTypeMap.lmTatend].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.lmFtexted, 
			segmentgroup : this.setByPreset,
			territorysubtype : this.setByPreset
		},
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : this.versionTypeNeutral, 
			segmentgroup : this.segmentTextlessSomEom
		}
	]);	


	/***************************************
	*	Content Versioning Texted Only
	****************************************/

	this.recipes[NBCGMO.versionTypeMap.cvFtexted] = [];
	// Create from an CV-FTEXTED which matches the Required Version Type
	this.recipes[NBCGMO.versionTypeMap.cvFtexted].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.cvFtexted, 
			segmentgroup : this.setByPreset,
			territorysubtype : this.setByPreset
		}
	]);

	/***************************************
	*	Content Versioning Texted w/ End Credits Asset
	****************************************/

	this.recipes[NBCGMO.versionTypeMap.cvFtextedWEndCredits] = [];
	// Create from an CV-TXTCREDITS which matches the Required Version Type
	this.recipes[NBCGMO.versionTypeMap.cvFtextedWEndCredits].push([
		{
			aspectratio : this.setByWorkOrder, 
			versiontype : NBCGMO.versionTypeMap.cvFtextedWEndCredits, 
			segmentgroup : this.setByPreset,
			territorysubtype : this.setByPreset
		}
	]);

}

// Global Vars
var buildJSLibDir = "/opt/evertz/mediator/lib/js/";
var localFileDir  = "/opt/evertz/mediator/etc/runners/";

// Extra Libraries to Load if needed
if (typeof(wscall)==="undefined") {
	var shellfunFile = buildJSLibDir + "shellfun.js";
	load(shellfunFile);
    if (typeof(wscall)==="undefined") {
    	throw new Error("Failed to load [" + shellfunFile + "]");
    } else {
    	print("Loaded [" + shellfunFile + "]");
    }
}

// Load nbcgmo_settings.js as its required for things in the recipe book.
if (typeof(NBCGMO)==="undefined") {
	var gmoSettingsFile = localFileDir + "nbcgmo_settings.js";
	if (fileExists(gmoSettingsFile)) {
		load(gmoSettingsFile);
    } else {
    	throw new Error("Cannot find Settings File [" + gmoSettingsFile + "]");
    }
    if (typeof(NBCGMO)==="undefined") {
    	throw new Error("Failed to load [" + gmoSettingsFile + "]");
    } else {
    	print("Loaded [" + gmoSettingsFile + "] from RecipeBook.js");
    }
}