load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/TVDInspector.js");
load("/opt/evertz/mediator/etc/runners/DaisyIdInspector.js");
load("/opt/evertz/mediator/etc/runners/PlacingBuilder.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/DestSpecificMetadataModule.js");
load("/opt/evertz/mediator/etc/runners/pipelineHelper.js");
load("//opt/evertz/mediator/etc/runners/TextlessHandler.js");
load("/opt/evertz/mediator/etc/runners/cacheHelper.js");
load("/opt/evertz/mediator/etc/runners/DubCardsTVDInspector.js");
load("/opt/evertz/mediator/etc/helpers/ContentExportHelper.js");
load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js');
load("/opt/evertz/mediator/etc/scripts/modules/js/underscore-min.js");
// Notes about the future development of this scripts
// A rewrite should occur when Dest Specific Metadata

try {

	debug = false;

	// Set all variables and methods not in libraries to this object to stop global bleeding
	var profileAllocation = {};

	profileAllocation.states = {
		originalState : "Ordered"
	};

	profileAllocation.requirements = {
		toApprovalRequired : "Initiate",
		toAwaitingComponents : "Order Incomplete",
		toPlacingValidation   : "Begin Compiling",
		toExportsProfileAllocation : "Profile Allocation (Exports)"
	};

	profileAllocation.versionTypeObj = {fullyTexted : "OM-FTEXTED", textlessAtEnd : "OM-TATEND", fullyTextless : "OM-FTLESS", textlessElements : "OM-TELEMENTS", territoryTexted : "LM-FTEXTED", territoryTextless : "LM-FTLESS", territoryTatend : "LM-TATEND"}

	// Prefence goes from Left -> Right.
	profileAllocation.versionTypeMap = {
		"Texted Only" : [ NBCGMO.versionTypeMap.omFtexted],
		"Texted Preferred, but can accept Textless" : [ NBCGMO.versionTypeMap.omFtexted, NBCGMO.versionTypeMap.omTatend, NBCGMO.versionTypeMap.omFtless],
		"Textless Only"	: [NBCGMO.versionTypeMap.omFtless],
		"Textless Elements Only" : [NBCGMO.versionTypeMap.omTelements, NBCGMO.versionTypeMap.lmTelements],
		"Textless Preferred, but can accept Texted"	: [NBCGMO.versionTypeMap.omFtless, NBCGMO.versionTypeMap.omFtexted, NBCGMO.versionTypeMap.omTatend],
		"Textless at End Only" : [NBCGMO.versionTypeMap.omTatend],
		"Territory Master"	:	[NBCGMO.versionTypeMap.lmFtexted, NBCGMO.versionTypeMap.lmFtless, NBCGMO.versionTypeMap.lmTatend],
		"Content Version w/ End Credits" : [NBCGMO.versionTypeMap.cvFtextedWEndCredits],
		"Content Version Texted Only" : [NBCGMO.versionTypeMap.cvFtexted]
	}


	// Mapping for Translator Texted / Textless Override values to Version Type Preference
	profileAllocation.textedTextlessOverridePrefMap = {
		"Texted" : "Texted Only",
		"Textless" : "Textless Only",
		"Textless at Tail" : "Textless at End Only",
		"Texted w/Textless at Tail" : "Textless at End Only"
	}

	// Segment Group
	profileAllocation.textlessSomEom = "Textless SOM/EOM";
	profileAllocation.header = "Header";
	profileAllocation.wholeMaterial = "Whole Material";
	profileAllocation.textlessData = "Textless Data";
	profileAllocation.segmentGroupObj = {}
	profileAllocation.segmentGroupObj.textlessSomEom  = profileAllocation.textlessSomEom;
	profileAllocation.segmentGroupObj.wholeMaterial = profileAllocation.wholeMaterial;
	profileAllocation.segmentGroupObj.header = profileAllocation.header;
	profileAllocation.segmentGroupObj.textlessData = profileAllocation.textlessData;

	// Other Constants
	profileAllocation.setByPreset = "Set by Preset";
	profileAllocation.setByWorkOrder = "Set by Workorder";
	profileAllocation.versionTypeNeutral = "Version Type Netural";
	profileAllocation.breakPatterns = "Break Patterns";
	profileAllocation.somEom = "SOM / EOM";
	profileAllocation.none = "None";
	profileAllocation.restoreAndDeliver = "RESTORE AND DELIVER";

	// Object for matching Source Trim Settings
	profileAllocation.sourceTrimSettingsObj = {};
	profileAllocation.sourceTrimSettingsObj.breakPatterns = profileAllocation.breakPatterns;
	profileAllocation.sourceTrimSettingsObj.somEom = profileAllocation.somEom;
	profileAllocation.sourceTrimSettingsObj.none = profileAllocation.none;
	profileAllocation.sourceTrimSettingsObj.wholeMaterial = profileAllocation.wholeMaterial;

    // Transformation object

    profileAllocation.transformationSettingsObj = {
        outputTransformationSelected: null,
        sourceTransformation: null
    };

	// Figure out how to make all Output types
	profileAllocation.outputRecipeBook = {};

	// Ways to make a Restore and Deliver
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver] = [];
	// Ways to make Restore and Deliver Textless at End File
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.textlessAtEnd] = [];
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.textlessAtEnd].push([{aspectratio : profileAllocation.setByWorkOrder, versiontype : profileAllocation.versionTypeObj.textlessAtEnd, segmentgroup : profileAllocation.segmentGroupObj.wholeMaterial}]);
	// Ways to make Restore and Deliver Fully Texted File
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.fullyTexted] = [];
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.fullyTexted].push([{aspectratio : profileAllocation.setByWorkOrder, versiontype : profileAllocation.versionTypeObj.fullyTexted, segmentgroup : profileAllocation.segmentGroupObj.wholeMaterial}]);
	// Ways to make a Restore and Deliver Fully Textless File
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.fullyTextless] = [];
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.fullyTextless].push([{aspectratio : profileAllocation.setByWorkOrder, versiontype : profileAllocation.versionTypeObj.fullyTextless, segmentgroup : profileAllocation.segmentGroupObj.wholeMaterial}]);
	// Ways to make a Restore and Deliver Textless at End
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.textlessElements] = [];
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.textlessElements].push([{aspectratio : profileAllocation.setByWorkOrder, versiontype : profileAllocation.versionTypeObj.textlessElements, segmentgroup : profileAllocation.segmentGroupObj.wholeMaterial}])

	// Ways to make a Restore and Deliver Texted Languaged Master
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.territoryTexted] = [];
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.territoryTexted].push([{aspectratio : profileAllocation.setByWorkOrder, versiontype : profileAllocation.versionTypeObj.territoryTexted, segmentgroup : profileAllocation.segmentGroupObj.wholeMaterial, territorysubtype : profileAllocation.setByPreset}])
	// Ways to make a Restore and Deliver Textless Languaged Master
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.territoryTextless] = [];
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.territoryTextless].push([{aspectratio : profileAllocation.setByWorkOrder, versiontype : profileAllocation.versionTypeObj.territoryTextless, segmentgroup : profileAllocation.segmentGroupObj.wholeMaterial, territorysubtype : profileAllocation.setByPreset}])
	// Ways to make a Restore and Deliver Textless At End Languaged Master
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.territoryTatend] = [];
	profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][profileAllocation.versionTypeObj.territoryTatend].push([{aspectratio : profileAllocation.setByWorkOrder, versiontype : profileAllocation.versionTypeObj.territoryTatend, segmentgroup : profileAllocation.segmentGroupObj.wholeMaterial, territorysubtype : profileAllocation.setByPreset}])


	// Ways to make a Textless At End Asset
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.textlessAtEnd] = [];
	// Create from an OM-TATEND Asset that has the Textless SOM/EOM Group
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.textlessAtEnd].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeObj.textlessAtEnd,
			segmentgroup : profileAllocation.setByPreset
		},
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeObj.textlessAtEnd,
			segmentgroup : profileAllocation.segmentGroupObj.textlessSomEom
		}
	]);
	// Create from an OM-fullyTexted Asset and any other Material that has Tetless SOM/EOM Group
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.textlessAtEnd].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeObj.fullyTexted,
			segmentgroup : profileAllocation.setByPreset
		},
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeNeutral,
			segmentgroup : profileAllocation.segmentGroupObj.textlessSomEom
		}
	]);
	//	Ways to make a Fully Texted Asset
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.fullyTexted] = [];
	// Create from a Fully Texted Asset
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.fullyTexted].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeObj.fullyTexted,
			segmentgroup : profileAllocation.setByPreset
		}
	]);
	// Create from a Textless at End Asset
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.fullyTexted].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeObj.textlessAtEnd,
			segmentgroup : profileAllocation.setByPreset
		}
	]);
	// Ways to make a Fully Textless Asset
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.fullyTextless] = [];
	// Create from a OM Textless at end - using both the OM Texted and OM Textless Segments
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.fullyTextless].push([
		{
			aspectratio : profileAllocation.setByWorkOrder, 
			versiontype : profileAllocation.versionTypeObj.textlessAtEnd, 
			segmentgroup : profileAllocation.setByPreset
		},
		{
			aspectratio : profileAllocation.setByWorkOrder, 
			versiontype : profileAllocation.versionTypeNeutral, 
			segmentgroup : profileAllocation.segmentGroupObj.textlessData,
			usewhenrunningtemplate : false	// Set this to check if this segment group exists but not use it when running the break parting template
		}		
	]);
	// Create from a Fully Textless Asset
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.fullyTextless].push([{aspectratio : profileAllocation.setByWorkOrder, versiontype : profileAllocation.versionTypeObj.fullyTextless, segmentgroup : profileAllocation.setByPreset}]);
	// Ways to make a Textless Elements Asset
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.textlessElements] = [];
	// Create from a Textless Elements Asset
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.textlessElements].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeObj.textlessElements,
			segmentgroup : profileAllocation.setByPreset
		}
	]);


	/*
		Ways to make an LM-FTEXTED Territory Master
	*/
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.territoryTexted] = [];
	// Create from an LM-FTEXTED which matches the Territory Sub-Type
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.territoryTexted].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeObj.territoryTexted,
			segmentgroup : profileAllocation.setByPreset,
			territorysubtype : profileAllocation.setByPreset
		}

	]);
	// Create from an LM-TATEND which matches the Territory Sub-Type
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.territoryTexted].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeObj.territoryTatend,
			segmentgroup : profileAllocation.setByPreset,
			territorysubtype : profileAllocation.setByPreset
		}

	]);

	/*
		Ways to make an LM-FTEXTLESS Territory Master
	*/
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.territoryTextless] = [];
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.territoryTextless].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeObj.territoryTextless,
			segmentgroup : profileAllocation.setByPreset,
			territorysubtype : profileAllocation.setByPreset
		}

	]);

	/*
		Ways to make an LM-TATEND Territory Master
	*/
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.territoryTatend] = [];
	// Create from an LM-TATEND which matches the territory Sub-Type that has the Textless SOM/EOM Group
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.territoryTatend].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeObj.territoryTatend,
			segmentgroup : profileAllocation.setByPreset,
			territorysubtype : profileAllocation.setByPreset
		},
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeObj.territoryTatend,
			segmentgroup : profileAllocation.segmentGroupObj.textlessSomEom
		}
	]);
	// Create from an LM-FTEXTED that matches the territory sub-type and any other Material that has Tetless SOM/EOM Group
	profileAllocation.outputRecipeBook[profileAllocation.versionTypeObj.territoryTatend].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeObj.territoryTexted,
			segmentgroup : profileAllocation.setByPreset,
			territorysubtype : profileAllocation.setByPreset
		},
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : profileAllocation.versionTypeNeutral,
			segmentgroup : profileAllocation.segmentGroupObj.textlessSomEom
		}
	]);

	//Content Versioning

	/*
		Content Versioning Texted Only
	*/
	profileAllocation.outputRecipeBook[NBCGMO.versionTypeMap.cvFtexted] = [];
	// Create from an LM-FTEXTED which matches the Territory Sub-Type
	profileAllocation.outputRecipeBook[NBCGMO.versionTypeMap.cvFtexted].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : NBCGMO.versionTypeMap.cvFtexted,
			segmentgroup : profileAllocation.setByPreset,
			territorysubtype : profileAllocation.setByPreset
		}
	]);

	/*
		Content Versioning Texted w/ End Credits Asset
	*/
	profileAllocation.outputRecipeBook[NBCGMO.versionTypeMap.cvFtextedWEndCredits] = [];
	// Create from an LM-FTEXTED which matches the Territory Sub-Type
	profileAllocation.outputRecipeBook[NBCGMO.versionTypeMap.cvFtextedWEndCredits].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : NBCGMO.versionTypeMap.cvFtextedWEndCredits,
			segmentgroup : profileAllocation.setByPreset,
			territorysubtype : profileAllocation.setByPreset
		}
	]);

	/***************************************
	*	Textless Elements Recipes
	****************************************/

	profileAllocation.outputRecipeBook[NBCGMO.versionTypeMap.omTelements] = [];
	// Create from a Textless Elements Asset
	profileAllocation.outputRecipeBook[NBCGMO.versionTypeMap.omTelements].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : NBCGMO.versionTypeMap.omTelements,
			segmentgroup : profileAllocation.textlessSomEom
		}
	]);

	// Create from OM-TATEND (Textless SOM/EOM)
	profileAllocation.outputRecipeBook[NBCGMO.versionTypeMap.omTelements].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : NBCGMO.versionTypeMap.omTatend,
			segmentgroup : profileAllocation.textlessSomEom
		}
	]);

	profileAllocation.outputRecipeBook[NBCGMO.versionTypeMap.lmTelements] = [];
	// Create from a Territory Textless Elements Asset (If they Exist)
	profileAllocation.outputRecipeBook[NBCGMO.versionTypeMap.lmTelements].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : NBCGMO.versionTypeMap.lmTelements,
			segmentgroup : profileAllocation.textlessSomEom
		}
	]);

	// Create from a Territory Textless At End Asset
	profileAllocation.outputRecipeBook[NBCGMO.versionTypeMap.lmTelements].push([
		{
			aspectratio : profileAllocation.setByWorkOrder,
			versiontype : NBCGMO.versionTypeMap.lmTatend,
			segmentgroup : profileAllocation.textlessSomEom
		}
	]);

	profileAllocation.overideTextlessPrefsForMoviesAnywhere = function(){
		this.outputRecipeBook[this.versionTypeObj.fullyTextless] = [];
		// Create from a OM Fully Texted and any other OM Material that has Textless Markup Group
		this.outputRecipeBook[this.versionTypeObj.fullyTextless].push([
			{
				aspectratio : this.setByWorkOrder, 
				versiontype : this.versionTypeObj.fullyTexted, 
				segmentgroup : this.setByPreset
			},
			{
				aspectratio : this.setByWorkOrder, 
				versiontype : this.versionTypeNeutral, 
				segmentgroup : this.segmentGroupObj.textlessData,
				usewhenrunningtemplate : false	// Set this to check if this segment group exists but not use it when running the break parting template
			}		
		]);

		// Create from a OM Textless at end - using both the OM Texted and OM Textless Segments
		this.outputRecipeBook[this.versionTypeObj.fullyTextless].push([
			{
				aspectratio : this.setByWorkOrder, 
				versiontype : this.versionTypeObj.textlessAtEnd, 
				segmentgroup : this.setByPreset
			},
			{
				aspectratio : this.setByWorkOrder, 
				versiontype : this.versionTypeNeutral, 
				segmentgroup : this.segmentGroupObj.textlessData,
				usewhenrunningtemplate : false	// Set this to check if this segment group exists but not use it when running the break parting template
			}		
		]);

		this.outputRecipeBook[this.versionTypeObj.fullyTextless].push([
			{
				aspectratio : this.setByWorkOrder, 
				versiontype : this.versionTypeObj.fullyTextless, 
				segmentgroup : this.setByPreset
			}
		]);
	}

	print("\nRecipe Book:\n");
	try {
		gmoNBCFunc.printObj(profileAllocation.outputRecipeBook);
	} catch (e) {
		print(e.message);
	}



	// Object with methods to find Recipe list
	profileAllocation.recipeFinder = {
		searchForRecipeComponents : function(outputFileTypeToCheck,settingsList,isRestoreAndDeliver) {

			// Ways to make output file (Restore and Deliver should look under the Restore and Deliver Prop)
			var recipesForOutputFile = isRestoreAndDeliver === true ? profileAllocation.outputRecipeBook[profileAllocation.restoreAndDeliver][outputFileTypeToCheck] : profileAllocation.outputRecipeBook[outputFileTypeToCheck];

			if (recipesForOutputFile.length === 0) {
				print("\nNo Recipes listed for [" + recipesForOutputFile + "]");
				return false;
			};

			print("\nNumber of Recipes [" + recipesForOutputFile.length + "] to make Output File [" + outputFileTypeToCheck + "]");
			for (var i=0; i<recipesForOutputFile.length; i++) {

				print("\n++++ Checking Recipe [" + (i+1) + "] out of [" + recipesForOutputFile.length + "] ++++");

				var segmentCheck = this.findMaterialSegmentGroupList(recipesForOutputFile[i],settingsList);
				print("searchForRecipeComponents(): " + segmentCheck.recipeComponents);
				print("searchForRecipeComponents(): " + segmentCheck.textlessComponents);
				var recipeComponents = segmentCheck.recipeComponents;
				var textlessComponents = segmentCheck.textlessComponents;

				if (recipeComponents) {
					print("\nSuccess Recipe [" + (i+1)+ "] can be used to create [" + outputFileTypeToCheck + "]");
					return { 
						recipeComponents: recipeComponents, 
						textlessComponents: textlessComponents };
				} else {
					print("\nRecipe [" + (i+1)+ "] cannot be used to create [" + outputFileTypeToCheck + "]");
				}
			}

			print("\nNo Recipes found to create [" + outputFileTypeToCheck + "]");
			return false;
		},

		findMaterialSegmentGroupMatch : function(matchedMaterialObjList, segmentGroup, settingsList) {

			for (var j=0; j < matchedMaterialObjList.length; j++) {

				var matId = matchedMaterialObjList[j].matid;
				// Return Object
				var rtn =  {matid : matId, versiontype : matchedMaterialObjList[j].versiontype, framerate : matchedMaterialObjList[j].framerate, daisyid : matchedMaterialObjList[j].daisyid };

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

		findMaterialSegmentGroupList : function(recipe,settingsList) {
			var myLog = function(str) {
				output("findMaterialSegmentGroupList(): " + str);
			}
			//print("tvd number: " + settingsList.tvdnumber);
			//var tvdInspector = new TVDInspector(settingsList.tvdnumber);
			myLog("\nRecipe requires [" + recipe.length + "] Material(s)");

			// Houses the steps for current recipe
			var recipeComponents = [];
			// Houses Textless recipe components that we need later on
			var textlessComponents = []; 
			var savedMaterialCount = profileAllocation.matchingMaterialObject.length;

			//
			for (var i=0; i< recipe.length; i++) {

				myLog("\nChecking if Material [" + (i + 1) + "] out of [" + recipe.length + "] exists with the following Criteria:");
				var recipeAspectRatio = recipe[i].aspectratio;
				var recipeVersionType = recipe[i].versiontype;
				var recipeSegmentGroup = recipe[i].segmentgroup;
				var recipeTerritorySubType = recipe[i].territorysubtype;
				var recipeIsUseSegments = recipe[i].usewhenrunningtemplate;

				var querySpecificVersionTypeAndAspectRatio = recipeVersionType !== profileAllocation.versionTypeNeutral; // If we require a specific Version Type to be the Source
				var aspectRatioToQuery = recipeAspectRatio === profileAllocation.setByWorkOrder ? settingsList.aspectratio : recipeAspectRatio;
				var segmentGroup = recipeSegmentGroup === profileAllocation.setByPreset ? settingsList.segmentgroup : recipeSegmentGroup;
				var isUseToBuildTemplates = (typeof recipeIsUseSegments !== "undefined" ? recipeIsUseSegments : true);

				if (typeof recipeTerritorySubType === "undefined") {
					var territorySubType = "N/A";
				} else if (recipeTerritorySubType === profileAllocation.setByPreset) {
					var territorySubType = settingsList.territorymastertype;
				} //  Room for translator to override :)

				myLog(
					"\n\t\tRequired Aspect Ratio [" + aspectRatioToQuery + "]" +
					"\n\t\tRequired Version Type [" + recipeVersionType + "]" +
					"\n\t\tRequired Segment Group [" + segmentGroup + "]" +
					"\n\t\tRequired Territory Sub Type [" + territorySubType + "]" +
					"\n\t\tUse this Recipe Component When Running Templates [" + isUseToBuildTemplates + "]"

				);

				// List of Material Objects to check Segments on
				var matchedMaterialObjList;

				if (savedMaterialCount > 0){
					// using daisy
					print("using Daisy saved materials");
					matchedMaterialObjList = profileAllocation.matchingMaterialObject;
				}
				else if  (territorySubType == "N/A")  {
					// English only (Original)
					myLog("Performing 'Basic' Material Search For TVD Number and Aspect Ratio");
					if (querySpecificVersionTypeAndAspectRatio) {
						print("Quering using Specific Version Type");
						matchedMaterialObjList = tvdInspector.getMaterialObjectsByVersionTypeAndAspectRatio(recipeVersionType,aspectRatioToQuery);
					} else {
						print("Only Querying using Aspect Ratio");
						matchedMaterialObjList = tvdInspector.getMaterialObjectsListByAspectRatio(aspectRatioToQuery);
					}

				} else {
					// Building a Territory Master
					myLog("Performing 'Extended' Material Search For TVD Number, Aspect Ratio and Territory Sub Type");
					if (querySpecificVersionTypeAndAspectRatio) {
						matchedMaterialObjList = tvdInspector.getTerritoryMasterObjectsByVersionTypeAspectRatio(recipeVersionType, aspectRatioToQuery, territorySubType);
					} else {
						matchedMaterialObjList = tvdInspector.getTerritoryMasterObjectListByAspectRatio(aspectRatioToQuery, territorySubType);
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

				if (isUseToBuildTemplates) {
					// Found a part of the Recipe Add it
					recipeComponents.push(recipeComponent);					
				} else {
					output("Not adding recipe component to final list yet because we don't want to use it when running templates");
					textlessComponents.push(recipeComponent);
				}
			}
			// Return the Components to make the Recipe
			return {
				"recipeComponents"	:	recipeComponents,
				"textlessComponents" : textlessComponents
			}
		},

		createSegment : function(materialHelper, segmentGroup, index) {

			var storeMedia = materialHelper.findMainStoreMedia();
			if (storeMedia === undefined) throw new Error("Failed to find a valid Track to retrieve Time Codes to create a Whole Material Segment from!");

			var mainMediaTrackXml = materialHelper.getTrackXmlByMedia(storeMedia);
			var incode = mainMediaTrackXml.Incode.toString();
			var outcode = mainMediaTrackXml.Outcode.toString();

			materialHelper.addSegmentToSaveXml(incode, outcode, segmentGroup, index);

			var saveMaterialSegment = materialHelper.saveUsingSaveXml();
			if (saveMaterialSegment === false) throw new Error("\nFailed to save [" + segmentGroup  + "] Segment for [" + materialHelper.matId + "]");

		}
	}

	profileAllocation.buildObject = function(jobDescription){

		var jobDescription = this.jobDescription;
		print("\nBuilding Up Source Object for ["+jobDescription.Properties.Mapping.domainKey.toString()+"]");
		var rtnObj = {};

		rtnObj.placingid = jobDescription.Properties.Mapping.domainKey.toString();
		rtnObj.placingxml = placingGet(rtnObj.placingid, "material", "fulltext", "shorttext", "tag", "destination", "parcel", "parcelMaterial", "profileStatus")..Output.Placing;
		rtnObj.tvdid = rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "TVD Production #").Value.toString();
		var daisy = rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Daisy ID").Value.toString();
		if (gmoNBCFunc.isVarUsable(daisy)){
			rtnObj.daisyid = daisy;
		}  else {
			rtnObj.daisyid = rtnObj.placingxml.MatId;
		}
		rtnObj.workordertitle = rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Work Order Title").Value.toString();
		rtnObj.requestorname = rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Requestor Name").Value.toString();
		rtnObj.licensee = rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Licensee").Value.toString();
		rtnObj.profile = rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Profile").Value.toString();
		rtnObj.profilecode =  rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Profile Code").Value.toString();
		rtnObj.standard = rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Standard").Value.toString();
		rtnObj.woaspectratio = rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Profile Aspect Ratio").Value.toString();
		rtnObj.gauge = rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Gauge").Value.toString();
		rtnObj.materialtextlanguage = gmoNBCFunc.isVarUsable(rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Material Text Language")) ? 	rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Material Text Language").Value.toString() : "";
		rtnObj.materialtext = gmoNBCFunc.isVarUsable(rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Material Text")) ? rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Material Text").Value.toString() : "";
		rtnObj.supplementaldaisyid = gmoNBCFunc.isVarUsable(rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Supplemental Daisy ID")) ? rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Supplemental Daisy ID").Value.toString() : "";
		rtnObj.trailerdaisyid = gmoNBCFunc.isVarUsable(rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Trailer Daisy ID")) ? rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Trailer Daisy ID").Value.toString() : "";
		rtnObj.licenseecategory = rtnObj.placingxml.ShortTextList.ShortText.(ShortTextType == "Licensee Category").Value.toString();
		rtnObj.useableaspectratio = gmoNBCFunc.lastSubstrBefore(gmoNBCFunc.lastSubstrAfter(rtnObj.woaspectratio, "("),")").replace(":", ".");

		if (debug) show(rtnObj);
		for (var prop in rtnObj){
			if(rtnObj[prop] == false){
				print("Cannot find Value in Object for Property ["+prop+"]");
			}
		}
		return rtnObj;
	}

	profileAllocation.extractConformSettingsFromPreset = function() {

		var placingXml = this.sourceObj.placingxml;
		var sourceTrimSettings = this.sourceTrimSettingsObj;
		var isRestoreAndDeliver = this.isRestoreAndDeliver;

		var segmentGroup, templateName, headerRequired, isCustomHeaderRequired;
		var matSegmentTemplate = "MATSEGMENT";	// Only template to be used currently. Exapand as necessary.
		//var presetSettings = gmoNBCNLDFunc.getSettings(placingXml);

		if (debug) show(this.presetSettings);

		var sourceTrim = this.presetSettings.sourceTrim;

		print("Finding Template Information from Source Trim [" + sourceTrim + "]");

		// Work out which Settings for Building the Parcel
		switch (sourceTrim) {
			// Break Patterns
			case sourceTrimSettings.breakPatterns:
				segmentGroup = sourceTrimSettings.breakPatterns;
				templateName = matSegmentTemplate;
				headerRequired = this.presetSettings.includeHeader;
				isCustomHeaderRequired = this.presetSettings.includeCustomHeader;
				break;
			// SOM EOM
			case sourceTrimSettings.somEom:
				segmentGroup  = sourceTrimSettings.somEom;
				templateName = matSegmentTemplate;
				headerRequired = this.presetSettings.includeHeader;
				isCustomHeaderRequired = this.presetSettings.includeCustomHeader;
				break;
			// None
			case sourceTrimSettings.none:
				segmentGroup = sourceTrimSettings.somEom;
				templateName = matSegmentTemplate;
				headerRequired = true;
				isCustomHeaderRequired = this.presetSettings.includeCustomHeader;
				break;
			// When we do a restore and deliver set to whole material segment group
			default:
				segmentGroup = sourceTrimSettings.wholeMaterial;
				headerRequired = this.presetSettings.includeHeader;
				isCustomHeaderRequired = this.presetSettings.includeCustomHeader;
				templateName = matSegmentTemplate;
				break;
		}

		//	Return Object
		return {
			// Set from Preset
			"outputConformFrameRate" : this.presetSettings.outputConformFrameRate,
			"conformVantageWorkflow" :   this.presetSettings.conformVantageWorkflow,
			"topBlackDuration"	: this.presetSettings.topBlackDuration,
			"tailBlackDuration"	:	this.presetSettings.tailBlackDuration,
			"fileStart"	:   this.presetSettings.fileStart,
			"preTatendBlack" :   this.presetSettings.preTatendBlack,
			"midrollBlack" : this.presetSettings.midrollBlack,
			"versionPreference" : this.presetSettings.versionPreference,
			"partiallyTextedType" : this.presetSettings.partiallyTextedType,	// Partially Texted Type e.g. 'Movies Anywhere'
			"territorySubType" : this.presetSettings.territorySubType,
			//Set from Switch Case
			"includeHeader" : isRestoreAndDeliver ? false : headerRequired, // Overide if it`s restore and deliver
			"isCustomHeaderRequired" : isRestoreAndDeliver ? false : isCustomHeaderRequired, // Overide if it`s restore and deliver
			"templateName" : templateName,
			"segmentGroup" : segmentGroup
		}
	}


	/**
	 * { validateConformSettingsFromPreset }
	 */
	profileAllocation.validateConformSettingsFromPreset =  function(){

		if(profileAllocation.conformSettingsObj.isCustomHeaderRequired && profileAllocation.conformSettingsObj.includeHeader){
			throw new Error("Conform Preset is setup to use both Header from Source & Custom Header." +
				"This is an invalid option and needs to be corrected in the preset");
		}
	}


    profileAllocation.extractSourceTransformationSetting = function(matId) {
        var placingxml = this.sourceObj.placingxml;
        gmoNBCFunc.printObj(profileAllocation.matchingMaterialObject)
        var sourceTransformation = "";
        var transformationValues = [];
        for each (var matchingMaterial in profileAllocation.matchingMaterialObject ) {
            transformationValues.push(matchingMaterial.transformation)
        }
        print ('transformationValues: [' + transformationValues + ']');

        if (transformationValues.length == 0) { 
            print('Could not find sourceTranformation value, will not try to output transformation value ')
            return false;    
        }

        if (transformationValues.length == 1) {
            print ('Only 1 material, will use that source transformation value');
        }  else {
            print ('More than one value, need to check for conflicts');
            var matchingCheck = [];
            for each (var matching in transformationValues ) {
                // According to underscore docs uniq uses strict equality, making sure
                // One is not an "XML string" and one is a "string"
                matchingCheck.push(matching.toString())
            }
            // Remove any non-unique values
            _.uniq(matchingCheck);
            if (matchingCheck.length != 1) {
                print ('More than one Material and Source Transformation does not match on all')
                print('Values found: [' + matchingCheck + ']')
                return false;  
            }
        }
        profileAllocation.transformationSettingsObj.sourceTransformation = transformationValues[0];

        if (!gmoNBCFunc.isVarUsable(profileAllocation.transformationSettingsObj.sourceTransformation)) {
            print ('Source Transformation is missing, cannot set output transformation')
            return false;
        }
       

        if (profileAllocation.isRestoreAndDeliver) {
            // If it's restore and deliver, pull the source transformation and return, as this will not, by definition, change
            profileAllocation.transformationSettingsObj.outputTransformation = sourceTransformation;
                return true;
        }
        return true;
    }

    profileAllocation.determineTransformation = function() {
        try {
            var placingxml = this.sourceObj.placingxml;
            profileAllocation.foundHit = false;
            var transformationPreset = placingxml..PublicationDefinition.Presets.PresetList.Preset.(PresetType=="Transformation");
            if (transformationPreset.length() < 1) {
                print('No Transformation Preset found')
                // This pub def does not have a Transformation preset
                return false;
            }
            // print('\n\n\nprinting transformationPreset')
            // gmoNBCFunc.printObj(transformationPreset);

            var tagLists = transformationPreset..TagList.Tag
            var outPutsArray = [];
            for each (var tag in tagLists) {
                if (tag.TagType.toString().indexOf("NLD Output Transformation") > -1 ) {
                    var tagObject = { 
                        type: tag.TagType.toString(),
                        value: tag.Value.toString()
                    }
                    outPutsArray.push(tagObject)
                }
            }

            for each (var row in outPutsArray ) { 
                var sortedPresets = _.sortBy( outPutsArray, 'type' );
            }

            for each (var row in sortedPresets ) {
                // Next, iterate through source transformation choices for each one
                var which = row.type.slice(-1);
                if ( profileAllocation.foundHit == true) {
                    print('Already found a match, will not continue looking for another')
                    break;
                }
                switch (which) {
                        case "1" :
                            profileAllocation.findPossibleValue(tagLists, which)
                            break;
                        case "2" :
                            profileAllocation.findPossibleValue(tagLists, which)
                                break;
                        case "3" :
                            profileAllocation.findPossibleValue(tagLists, which)
                                break;
                            case "4" :
                                profileAllocation.findPossibleValue(tagLists, which)
                            break;     
                            default :
                }
            }
            print('End of determineTransformation function')
            return;

        } catch(e) {
            throw new Error('in determineTransformation and getting error: ' + e)
        }
    }

    profileAllocation.findPossibleValue = function(tagLists, which) {
        print('findPossibleValue: profileAllocation.transformationSettingsObj.sourceTransformation is: ' + profileAllocation.transformationSettingsObj.sourceTransformation)
        var ordinal = '';
        for (var i = 0; i < 3; i++) {
            switch (which) {
                case "1" :
                    ordinal = "First"
                    break;
                case "2" :
                    ordinal = "Second"
                    break;
                case "3" :
                    ordinal = "Third"
                    break;
                case "4" :
                    ordinal = "Fourth"
                    break;
                }
                var lookup = "NLD " + ordinal + " Allowed Source Transformation, Choice " + (i+1);
                var value = "";
                for each (var tag in tagLists) {
                    if (tag.TagType.toString() == lookup) {
                        value = tag.Value.toString();
                    }
                    if (value == profileAllocation.transformationSettingsObj.sourceTransformation) {
                        print('Found match using ' + ordinal + ' row for [' + value + '], setting profileAllocation.transformationSettingsObj.outputTransformationSelected' )
                        var whichOutput = "NLD Output Transformation " + which;
                        print('Using output value from: [' + whichOutput +']')
                        profileAllocation.transformationSettingsObj.outputTransformationSelected = this.placingHelper.getTagByType(whichOutput);
                        profileAllocation.foundHit = true;
                        break;
                        }
                }

        }

    }


	profileAllocation.findCustomHeaderRequirements = function(){
		var conformPresetSettings = this.conformSettingsObj;
		var parcelXml = this.parcelXml;
		var frameRate = parcelXml.FrameRate.toString();
		var isCustomHeaderRequired = conformPresetSettings.isCustomHeaderRequired;
		var customSlateBackGround = this.presetSettings.slateBackgroundStyle;
		var headerOptions = [];
		var headerOptionsDurations = [];
		var customSlateOptions = [];

		if(isCustomHeaderRequired){

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

		}

		return {
			"isCustomHeaderRequired" : isCustomHeaderRequired,
			"headerOptions" : headerOptions,
			"headerOptionsDurations": headerOptionsDurations,
			"customSlateBackGround" : customSlateBackGround,
			"customSlateOptions" : customSlateOptions
		}
	}

	profileAllocation.findDubCardsInsertRequirements = function(){
		var isDubCardsInsertRequired = this.presetSettings.includeDubCards;
		var dubCardInsertDuration = this.presetSettings.dubCardInsertDuration;
		return {
			"isDubCardsInsertRequired" : isDubCardsInsertRequired,
			"dubCardInsertDuration": dubCardInsertDuration
		}
	}

	profileAllocation.findBlackInsertionRequirements = function() {

		var conformPresetSettings = this.conformSettingsObj;
		var parcelXml = this.parcelXml;
		var outputFile = this.outputFileTypeToCheck;
		var omTatend = NBCGMO.versionTypeMap.omTatend;
		var lmTatend = NBCGMO.versionTypeMap.lmTatend;

		var makingOMTatend = outputFile === omTatend || outputFile === lmTatend ? true : false; // Can move to an object mapping if more than one output filetype become special
		var frameRate = parcelXml.FrameRate.toString();
		var includeHeader = conformPresetSettings.includeHeader;
		var isCustomHeaderRequired = conformPresetSettings.isCustomHeaderRequired;

		var topBlackDurationStr = conformPresetSettings.topBlackDuration;
		var midRollBlackDurationStr = conformPresetSettings.midrollBlack;
		var preTatendBlackDurationStr = conformPresetSettings.preTatendBlack;
		var tailBlackDurationStr = conformPresetSettings.tailBlackDuration;

		try {
			gmoNBCFunc.printObj(conformPresetSettings);
		} catch (e) {
			print(e.message);
		}


		var topBlackAsFrames = AmountOfTime.parseText(frameRate,topBlackDurationStr).asFrames();
		var midrollBlackAsFrames = AmountOfTime.parseText(frameRate,midRollBlackDurationStr).asFrames();
		var preTatendBlackAsFrames = AmountOfTime.parseText(frameRate,preTatendBlackDurationStr).asFrames();
		var tailBlackAsFrames = AmountOfTime.parseText(frameRate,tailBlackDurationStr).asFrames();

		var needsTopBlack = topBlackAsFrames > 0;
		var needsMidRollBlack = midrollBlackAsFrames > 0;
		var needsPreTatendBlack = preTatendBlackAsFrames > 0 && makingOMTatend; // See explanation where function is called
		var needsTailBlack = tailBlackAsFrames > 0;

		var requiresBlackInsertion =  needsTopBlack || needsMidRollBlack || needsPreTatendBlack || needsTailBlack;

		if (needsPreTatendBlack) {
			print("\nPre-Tatend Black Required because Output file is [" + outputFile + "] and Pre-Tatend Frames Set to [" + preTatendBlackAsFrames + "]");
		} else {
			print("\nPre-Tatend Black Not Reqired because Output file is [" + outputFile + "] and Pre-Tatend Frames Set to [" + preTatendBlackAsFrames + "]");
		}

		return {
			"topBlackDurationStr" : topBlackDurationStr,
			"midRollBlackDurationStr" : midRollBlackDurationStr,
			"preTatendBlackDurationStr" : preTatendBlackDurationStr,
			"tailBlackDurationStr" : tailBlackDurationStr,
			"needsTopBlack" : needsTopBlack,
			"needsMidRollBlack" : needsMidRollBlack,
			"needsPreTatendBlack" : needsPreTatendBlack,
			"needsTailBlack" : needsTailBlack,
			"requiresBlackInsertion" : requiresBlackInsertion,
			"includeHeader" : includeHeader,
			"isCustomHeaderRequired" : isCustomHeaderRequired,
			"makingOMTatend" : makingOMTatend
		}

	}

	profileAllocation.insertCustomHeaderEventsIntoParcel = function(){
		print("\nStarting Custom Header Creation Process");
		this.placingHelper.refresh();
		var parcelXml = this.placingHelper.getParcel();
		var customHeaderSettingsObj = this.customHeaderRequirementsObj;
		var headerOptions = customHeaderSettingsObj.headerOptions;
		var headerOptionsDurations = customHeaderSettingsObj.headerOptionsDurations;
		var parcelFrameRate = parcelXml.FrameRate.toString();
		var blackMatPrefix = "BLACK_";
		var blackMaterialId = blackMatPrefix + parcelFrameRate;
		var barsAndTonePrefix = "BARS_TONE_";
		var barsAndToneMatId = barsAndTonePrefix + parcelFrameRate;
		var slatePrefix = customHeaderSettingsObj.customSlateBackGround;
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

	profileAllocation.insertDubCardEventsIntoParcel = function(){
		print("\nStarting Dub Cards Creation Process");
		var dubCardSettingsObj = this.dubCardsInsertRequirementsObj;
		var stillEventType = "Still";
		var mainMaterialStream = "nld video";
		var omTatend = NBCGMO.versionTypeMap.omTatend;
		var lmTatend = NBCGMO.versionTypeMap.lmTatend;
		var outputFile = this.outputFileTypeToCheck;

		var criteria = {
			"TVD#" : this.sourceObj.tvdid,
			"ASPECT_RATIO" : this.sourceObj.useableaspectratio,
			"TERRITOTY_SUB_TYPE" : this.conformSettingsObj.territorySubType,
			"VERSION_TYPE":	["DUB-FTEXTED"]
		}
		print("Criteria ["+criteria.toSource()+"]");
		var inspector = new DubTVDInspector(criteria)
		var results = inspector.runSourceSelectionByCriteria();
		if(parseInt(results..Count.toString())<=0){
			throw new Error("Dub Card Insert Required, But No Dub Card Material Found for TVD #, Aspect Ratio & Territory Sub-Type")
		}

		print("Getting Event List");
		this.placingHelper.refresh();

		var parcelXml = this.placingHelper.getParcel();
		var parcelFrameRate = parcelXml.FrameRate.toString();
		var eventList = parcelXml.ParcelEventList;
		var dubCardsPrefix = "DUB_CARDS";
		var dubCardsGenericMatId = dubCardsPrefix + "_" + parcelFrameRate;

		var makingOMTatend = outputFile === omTatend || outputFile === lmTatend ? true : false;

		var penultimateEventIndex = gmoNBCNLDFunc.getPenultimateEventIndex(eventList);


		for each(row in results..Results.ReportRow){

			print("__RNUM "+ row.RNUM.toString());
			print("__MAT_ID "+ row.MAT_ID.toString());
			print("__VERSION_TYPE "+ row.VERSION_TYPE.toString());
			print("__ASPECT_RATIO "+ row.ASPECT_RATIO.toString());
			print("__TERRITORY_SUB_TYPE_NAME "+ row.TERRITORY_SUB_TYPE_NAME.toString());
			print("__SEQUENCE "+ row.SEQUENCE.toString());

			var eventDesc = "Dub Cards " + row.SEQUENCE.toString();
			var dubCardMatId = row.MAT_ID.toString();
			var baseEventXml = gmoNBCNLDFunc.makeBaseEventXml(dubCardSettingsObj.dubCardInsertDuration, parcelFrameRate, mainMaterialStream, dubCardsGenericMatId , stillEventType, eventDesc,  dubCardMatId);

			if (makingOMTatend) {
				if(row.RNUM.toString()!="1"){
					penultimateEventIndex = penultimateEventIndex + 1;
				}
				print("\nInserting Dub Card after Event Index [" + penultimateEventIndex + "] to Align with Building Textless At End");
				eventList.insertChildAfter(eventList.Event[penultimateEventIndex],baseEventXml);
			} else {
				print("\nInserting Dub Card after Event Index [" + eventList.Event.length() + "]");
				eventList.appendChild(baseEventXml);
			}
		}

		var newAddition = "Dub Cards Events";
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
		print("\ninsertDubCardEventsIntoParcel(): Saving Parcel" + "\n " + parcelXml);
		gmoNBCNLDFunc.saveParcel(parcelXml);
		return true;
	}

	profileAllocation.insertBlackEventsIntoParcel = function() {
		print("\nStarting Black Insertion Progress");

		this.placingHelper.refresh();
		var parcelXml = this.placingHelper.getParcel();
		var blackInsertionSettingsObj = this.blackRequirementsObj;
		var destSpecificObj = this.destSpecificMatHierarchialObj;
		var promoInserted = (typeof destSpecificObj["Main Promo Material"] !== "undefined" && destSpecificObj["Main Promo Material"] != "");
		var parcelFrameRate = parcelXml.FrameRate.toString();
		var blackMatPrefix = "BLACK_";
		var blackMaterialId = blackMatPrefix + parcelFrameRate;
		var eventList = parcelXml.ParcelEventList;
		var stillEventType = "Still";
		var mainMaterialStream = "nld video";// Make more intelligent if there`s a need to. Script will probably switch to JS templates before this occurs.
		var headerRequired = blackInsertionSettingsObj.includeHeader;
		var isCustomHeaderRequired = blackInsertionSettingsObj.isCustomHeaderRequired;
		var makingOMTatend = blackInsertionSettingsObj.makingOMTatend;
		var tailPromoCgText = "Tail Promo";
		var customHeaderCgText = "Custom Header";

		var skipDueToHeaderOrPromo = function(eventIndex, headerRequired, promoInserted) {
			if (debug) print("\neventIndex [" + eventIndex + "] headerRequired " + headerRequired + " promoInserted [" + promoInserted + "]");
			if (eventIndex === 0 && headerRequired === true) {
				if(debug) print("returning true");
				return true;
			} else if (eventIndex === 0 && headerRequired === false && promoInserted === true) {
				if(debug) print("returning true");
				return true;
			} else if (eventIndex === 1 && headerRequired === true  && promoInserted === true) {
				if(debug) print("returning true");
				return true;
			}
			if(debug) print("returning true");
			return false;
		}

		// Function to work out whether Midroll Black should be added after current Event in an Event List
		var insertMidrollBlackAfterCurrentEvent = function(eventIndex, eventList, headerRequired, requiresPreTatendBlack, makingOMTatend, stillEventType, promoInserted) {
			// Don't add between header and first Segment
			if (skipDueToHeaderOrPromo(eventIndex, headerRequired, promoInserted) === true) {
				return false;
			}

			// Don't add midroll black if it is Custom Header
			if (gmoNBCNLDFunc.getEvent(eventList, eventIndex) &&
				gmoNBCNLDFunc.getEvent(eventList, eventIndex).CgText.toString().indexOf(customHeaderCgText)>-1) {
				if (debug) print("Do NOT Insert Midroll. Custom Header and its CgText is [" + customHeaderCgText +"]");
				return false;
			}

			// Don't add midroll black between this and a tail promo.
			if (gmoNBCNLDFunc.getNextEvent(eventList, eventIndex) &&
				gmoNBCNLDFunc.getNextEvent(eventList, eventIndex).CgText.toString() == tailPromoCgText) {
				if (debug) print("Do NOT Insert Midroll. Next Event Exists and its CgText is [" + tailPromoCgText +"]");
				return false;
			}

			// If an OM-TATEND is being created and the Current Event is the Penultimate one don't add Midroll after current Event
			var isPenultimateEvent = gmoNBCNLDFunc.isPenultimateEvent(eventList,eventIndex);
			if (isPenultimateEvent && makingOMTatend) {
				if(debug)print("Do not insert Midroll after Event Index [" + eventIndex + "] Is Penultimate Event [" + isPenultimateEvent + "] and Making OM-TATEND [" + makingOMTatend + "]");
				return false;
			}
			// Check there's a next Event, that it isn't still, and the end of the Event List hasn't been reached
			if (gmoNBCNLDFunc.getNextEvent(eventList, eventIndex) &&
				gmoNBCNLDFunc.getNextEvent(eventList, eventIndex).EventType.toString() !== stillEventType &&
				eventIndex !== eventList.Event.length()) {
				if (debug) print("Insert Midroll. Next Event Exists and its Event Type is not [" + stillEventType +"]");
				return true;
			}
			// All other cases are false
			if (debug) print("Do not Insert Midroll")
			return false;
		}

		// Pre Tatend Black
		var requirespreTatendBlack = blackInsertionSettingsObj.needsPreTatendBlack;
		var preTatendBlack = blackInsertionSettingsObj.preTatendBlackDurationStr;

		if (requirespreTatendBlack) {
			var penultimateEventIndex = gmoNBCNLDFunc.getPenultimateEventIndex(eventList);
			print("Inserting Pre Tatend Black after Event Index [" + penultimateEventIndex + "]");
			eventList.insertChildAfter(eventList.Event[penultimateEventIndex],gmoNBCNLDFunc.makeStillEvent(preTatendBlack,parcelFrameRate,mainMaterialStream, blackMaterialId));
		}

		// Handle MidRoll / Pre Tatend
		var requiresMidrollBlack = blackInsertionSettingsObj.needsMidRollBlack;
		var midRollBlack = blackInsertionSettingsObj.midRollBlackDurationStr;

		if (requiresMidrollBlack) {
			for each(var ev in eventList.Event) {
				var eventIndex = parseInt(ev.childIndex());
				if (insertMidrollBlackAfterCurrentEvent(eventIndex, eventList, headerRequired, requirespreTatendBlack, makingOMTatend, stillEventType, promoInserted)) {
					print("\nInserting Midroll Black after Event Index [" + eventIndex + "]");
					eventList.insertChildAfter(ev,gmoNBCNLDFunc.makeStillEvent(midRollBlack, parcelFrameRate, mainMaterialStream, blackMaterialId));
				}
			}
		}

		// Handle Top Black
		var requiresTopBlack = blackInsertionSettingsObj.needsTopBlack;
		var topBlack = blackInsertionSettingsObj.topBlackDurationStr;

		if (requiresTopBlack) {
			print("\nTop Black Required - Adding at Index [0]");
			eventList.prependChild(gmoNBCNLDFunc.makeStillEvent(topBlack,parcelFrameRate,mainMaterialStream, blackMaterialId));
		} else {
			print("\nNo Top Black Required [" + requiresTopBlack + "]");
		}

		// Handle Tail Black
		var requiresTailBlack = blackInsertionSettingsObj.needsTailBlack;
		var tailBlack = blackInsertionSettingsObj.tailBlackDurationStr;

		if (requiresTailBlack) {
			print("\nTail Black Required - Adding at Index [" + eventList.Event.length() + "]");
			eventList.appendChild(gmoNBCNLDFunc.makeStillEvent(tailBlack,parcelFrameRate,mainMaterialStream, blackMaterialId));
		}  else {
			print("No Tail Black Required [" + tailBlack + "]");
		}

		// Retime
		print("\nNew Black Events have been added. Retiming Parcel:");
		var parcelOffset;
		var previousOffset;
		var newAddition = "New Addition";

		for each(var ev in eventList.Event){
			// Used for logging
			previousOffset = ev.ParcelOffset.toString() === "" ? newAddition : ev.ParcelOffset;
			// Create Parcel Offsets - if first event (0 based counting) start at 00:00:00:00 otherwise add previous events duration
			parcelOffset = ev.childIndex() == 0 ? AmountOfTime.parseFrames(parcelFrameRate, 0) : parcelOffset.add(AmountOfTime.parseText(FrameRate[gmoNBCNLDFunc.getPrevEvent(eventList, ev.childIndex()).FrameRate.toString()], gmoNBCNLDFunc.getPrevEvent(eventList, ev.childIndex()).Duration.toString()));

			// Change the Current Events Offset
			ev.ParcelOffset = parcelOffset.asText(FrameRate[parcelFrameRate]);

			print(
				"\nEvent Index [" + ev.childIndex() + "]" +
				" Original Parcel Offset [" + previousOffset  + "]" +
				" New Parcel Offset [" + ev.ParcelOffset + "]" +
				" Duration [" + ev.Duration + "]"
			);
		}

		print("\ninsertBlackEventsIntoParcel(): Saving Parcel" + "\n " + eventList);
		delete eventList..Material.TrackTypeLink;
		delete eventList..Material.Marker;
		delete eventList..Material.Track;
		delete eventList..Material.DocumentAttachments;
		delete eventList..Segment;
		gmoNBCNLDFunc.saveParcel(parcelXml);
		return true;
	}
	profileAllocation.ensureRDVideoAreValid = function(placingGetXml){
		print("\nensureRDVideoAreValid - Start");
		var matId = placingGetXml..MainMatId.toString();
		var mh = new gmoNBCFunc.materialHelper(matId);
		var mainVideoTTL = mh.getStateOfTtl("Video");
		if (mainVideoTTL != "Ready") {
			throw new Error("Restore and Deliver can not proceed, main video for " + matId + " is in state: " + mainVideoTTL);
		}
		print("Video is in state [" + mainVideoTTL +  "] for " + matId + ". Ok to proceed with Restore & Deliver.");
	}

	profileAllocation.ensureTrackTypesAreValid = function(placingGetXml) {
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
		for each (var parcelEvent in placingGetXml..Event.(Stream.toString() == mainMaterialStream)) {
			if (!gmoNBCFunc.contains(materialIdsChecked, parcelEvent.TrimMaterialId.toString()) && !gmoNBCNLDFunc.isAncillaryMaterial(parcelEvent.TrimMaterialId.toString())) {
				// Have not checked this material already
				var profileToUse;

				if (!gmoNBCFunc.isVarUsable(gmoNBCNLDFunc.getMatchedProfileTrackTypes(placingGetXml, parcelEvent.TrimMaterialId.toString()))) {
					throw new Error("Required Components are not in Ready State on Source [" + parcelEvent.TrimMaterialId.toString() + "], sending to Awaiting Components until they arrive.");	
				} else {
					// 	We have some matched track types, get the profile name and check where it is in the list of profiles
					profileToUse = gmoNBCNLDFunc.getMatchedProfileName(placingGetXml, parcelEvent.TrimMaterialId.toString());
					print("profileToUse ["+profileToUse+"]");

					// If the profile returned is 'undefined' then no profiles have been matched as 'ok'
					if (!gmoNBCFunc.isVarUsable(profileToUse)) {
						throw new Error("Required Components are not in Ready State on Source [" + parcelEvent.TrimMaterialId.toString() + "], sending to Awaiting Components until they arrive.");
					}

					if (gmoNBCNLDFunc.indexOfProfileFromProfileStatus(placingGetXml..ProfileStatus.(Name == parcelEvent.TrimMaterialId.toString())[0], profileToUse) === 0) {
						//	index 0 is the first choice profile

					} else {
					    var noteString = "Source Material [" + parcelEvent.TrimMaterialId.toString() + "] does not match first choice profile [" + placingGetXml..ProfileStatus.(Name == parcelEvent.TrimMaterialId.toString())[0].Statuses.ProfileStatus.Name[0].toString() +
					    "]. It has matched the [" + getGetOrdinal((1 + gmoNBCNLDFunc.indexOfProfileFromProfileStatus(placingGetXml..ProfileStatus.(Name == parcelEvent.TrimMaterialId.toString())[0], profileToUse))) + "] choice which is [" + profileToUse + "].";
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

	profileAllocation.getRestoreAndDeliverVersionPref = function(pubDefXml) {
			output("getRestoreAndDeliverVersionPref(): Running");
			var restoreAndDeliverPresetType = "Restore and Deliver";
			var nldTexted = "NLD Texted/Textless";

			var restoreAndDeliverPresetName = pubDefXml..Preset.(PresetType.toString() === restoreAndDeliverPresetType).Name.toString();
			if (restoreAndDeliverPresetName == false) throw new Error("Failed to find a Preset for Type [" + restoreAndDeliverPresetType  +"]");

			var versionPref = gmoNBCNLDFunc.getPreset(restoreAndDeliverPresetName)..Tag.(TagType.toString() === nldTexted).Value.toString();
			if (versionPref == false) throw new Error("Failed to Find [" + nldTexted + "] value for [" + restoreAndDeliverPresetName + "]");

			output("getRestoreAndDeliverVersionPref(): versionPref ["+ versionPref + "]");

			return versionPref;
	}

	profileAllocation.attemptRecipeMatch = function () {
		// See if it`s possible to make one of the accepted output types
		const matchedVersionTypeElement = "Order Version Type";

		for (var i=0; i< this.versionPreferenceList.length; i++) {

			this.outputFileTypeToCheck = this.versionPreferenceList[i];

			print("\n############################################################################################");
			print("\nChecking to see if Version Type [" + this.outputFileTypeToCheck + "] Preference [" + (i + 1) + "] out of [" + this.versionPreferenceList.length + "] can be made with Aspect Ratio [" + this.aspectRatio + "]");
			print("\n############################################################################################");

			// Attempt to get a Recipe and the Components (Materials and Segment Group)
			// This will return 'false' if nothing is found
			var localRecipeComponents = this.recipeFinder.searchForRecipeComponents(this.outputFileTypeToCheck, this.recipeSettingsList, this.isRestoreAndDeliver);
			if (localRecipeComponents) {
				this.recipeComponents = localRecipeComponents.recipeComponents;
				this.textlessComponents = localRecipeComponents.textlessComponents;
				// See if a valid Recipe has been found - TODO: this may be redundant
				if (this.recipeComponents) {
					gmoNBCNLDFunc.savePlacingShortText(this.placingId,matchedVersionTypeElement,gmoNBCNLDFunc.getNLDVersionTypeDescription(this.outputFileTypeToCheck));
					break;
				}			
		}
			print("\nCannot create output FileType [" + this.outputFileTypeToCheck + "]");
		}
		return localRecipeComponents;
	}

	profileAllocation.hasEmbeddedCaptioning = function(){
		this.placingHelper.refresh();	
		const embeddedCaptioningElement = "Embedded Captioning";
		var captionMapping = gmoNBCNLDFunc.getProfileCaptionMap(this.sourceObj.placingxml, this.firstMaterial, this.presetSettings);
		
		for (captionMethodName in captionMapping){	
			var trackTypeName = captionMapping[captionMethodName].trackTypeName;
			var captionMethodType = captionMapping[captionMethodName].captionMethodType;
			if (captionMethodType == "Embed" && (trackTypeName !== "" && trackTypeName != null)){
				output("Placing requires embedded captioning.");
				gmoNBCNLDFunc.savePlacingShortText(this.placingId,embeddedCaptioningElement,"true");
				return true;
			}
		}
		gmoNBCNLDFunc.savePlacingShortText(this.placingId,embeddedCaptioningElement,"false");		
	}

	profileAllocation.validateCaptionMethods = function() {
		// The function to get the caption map will do the validation, just have to call it.
		var captionMapping = gmoNBCNLDFunc.getProfileCaptionMap(this.sourceObj.placingxml, this.firstMaterial, this.presetSettings);
		//var captionMapping = gmoNBCNLDFunc.getProfileCaptionMap(this.placingHelper.getPlacingXml(), this.firstMaterial, this.presetSettings);
	}

	profileAllocation.getRatingSystemFromVChipString = function(ratingString) {
			
		var unusableRatingValues = [undefined, "", "NULL"];
	
		if (unusableRatingValues.indexOf(ratingString) > -1) {
			throw new Error("VCHIP is required based on Preset but the rating has a value of [" + ratingString + "]."+
			 "Please correct this and retry from Awaiting Components Task");
		}
			
		// Comes in the format US-TV-14-D-L-S-V
		var ratingArray = ratingString.split("-");
		
		if (unusableRatingValues.indexOf(ratingArray[0]) > -1) {
			throw new Error("VCHIP is required based on Preset but the rating has a value of [" + ratingArray[0] + "]."+
			 "Please correct this and retry from Awaiting Components Task");
		}
				
		return ratingArray[0] + "-" + ratingArray[1]
	}

	profileAllocation.getFlagsFromVChipString = function (ratingString) {
	
		var ratingArray = ratingString.split("-"); 
		var flags = "";
	
		for (var i = 2; i<ratingArray.length; i++) {
			flags += ratingArray[i];
		}
	
		return flags;
	}

	profileAllocation.insertAndSaveAncillaryEvents = function() {
	print("\nSaving 	 Events into Parcel");

	// Black Insertion has been added refresh so get the Parcel with the Inserted Black Events
	this.placingHelper.refresh();
	this.parcelXml = this.placingHelper.getParcel();
	var parcelDuration = this.parcelXml.Duration.toString();
	var parcelFrameRate = this.parcelXml.FrameRate.toString();
	var isVCHIPRequired = profileAllocation.isRestoreAndDeliver === false ? this.presetSettings["isVCHIPRequired"] : false;

	output("isVCHIPRequired = ["+isVCHIPRequired+"]");
	if (this.hasEmbeddedCaptioning() && isVCHIPRequired){
		print("\nExtracting information to build VCHIP Event");
		var vchipRatingDataElement = this.placingHelper.getVChipRatingForMainMaterial();
		var vChipTitle = this.placingHelper.getMainMaterialBrandTitle();

		if (vchipRatingDataElement === undefined || vChipTitle === undefined) {
			throw new Error("\nNot enough information to add VCHIP Details. VCHIP Rating is [" + vchipRatingDataElement + "] VCHIP Title is [" + vChipTitle + "]");
		}

		if(vChipTitle === undefined){
			throw new Error("VCHIP is required based on preset but the Title is not defined or empty");
		}

		// Split the VCHIP Rating into its Component parts
		// var vChipRatingSystem = this.getRatingSystemFromVChipString(vchipRatingDataElement);
		// var vChipFlags = this.getFlagsFromVChipString(vchipRatingDataElement);
		
		// Split the VCHIP Rating into its Component parts
		var vChipRatingSystem = this.getRatingSystemFromVChipString(vchipRatingDataElement);
		output("\nThis is the vChipRatingSystem = ["+vChipRatingSystem+"]");
		if(vchipRatingDataElement!="NR"){
			var vChipFlags = this.getFlagsFromVChipString(vchipRatingDataElement);
			var vChipEventXml = gmoNBCNLDFunc.makeVChipEvent(vChipRatingSystem, vChipFlags, vChipTitle, parcelDuration, parcelFrameRate);
			print("\nBuilding VCHIP Event");
			this.parcelXml.ParcelEventList.appendChild(vChipEventXml);
			print("\nCreated VCHIP Event [" + vChipEventXml + "]");
		}else {
			print("\nRating is NR - We are not Creating VCHIP Event");
		}
	} else {
		output("VCHIP  is not required for this Licensee or there is no embedded captions.")
	}


	// Find Watermarking Information

		print("\nExtracting information to build Watermarking Event");

		var requriesWatermarking = this.placingHelper.isWaterMarkingRequired(this.placingHelper.getPlacingXml(),this.materialXml);
		if (requriesWatermarking) {
			print("\nBuilding Watermarking Event");
			var waterMarkingEventXml = gmoNBCNLDFunc.makeWaterMarkingEvent(requriesWatermarking, parcelDuration, parcelFrameRate);
			this.parcelXml.ParcelEventList.appendChild(waterMarkingEventXml);
			print("\nCreated Watermarking Event [" + waterMarkingEventXml + "]")
		} else {
			print("\nWatermarking not required not creating Watermarking Event");
		}

		if(debug) print("\nParcel Xml [" + this.parcelXml + "]");
		print("\nSaving Parcel with VCHIP and Watermarking Information");
		delete this.parcelXml..Material.TrackTypeLink;
		delete this.parcelXml..Material.Marker;
		delete this.parcelXml..Material.Track;
		delete this.parcelXml..Material.DocumentAttachments;
		delete this.parcelXml..Segment;
		gmoNBCNLDFunc.saveParcel(this.parcelXml);
	}

	profileAllocation.adjustMainEventList = function() {
		print("Adjusting Main Event List");

		this.placingHelper.refresh();
		var parcelXml = this.placingHelper.getParcel();
		const parcelFrameRate = parcelXml.FrameRate.toString();
		var eventList = parcelXml.ParcelEventList;
		const blackInsertionSettingsObj = this.blackRequirementsObj;
		const presetSettings = this.presetSettings;
		const recipeComponents = this.recipeComponents;
		const textlessComponents = this.textlessComponents;
		var makingOMTatend = blackInsertionSettingsObj.makingOMTatend;
		const mainMaterialStream = "nld video";// Make more intelligent if there`s a need to. Script will probably switch to JS templates before this occurs.
		const videoEventType = "Video";

		this.endPromoSettings = function(hier_metadata) {
			this.__dataelement = "Tail Promo Material";
			this.__hier_metadata = hier_metadata;
			this.defaultWholeMaterialSegmentGroup = "Whole Material";
			this.defaultWholeMaterialIndex = 1;

			this.isRequired = function() {
				// If no Dest Specific Metadata passed in look
				if (this.__hier_metadata === undefined ) {
					return false;
				}

				var promoMatId = this.__hier_metadata[this.__dataelement]; // Hard Coding is left in whilst the a decision is made as to how to handle this. Most likely a Mapping Object in the Setting File
				return (typeof promoMatId === undefined || typeof promoMatId === "undefined" || promoMatId == "") ? false : true;
			}

			this.getMatId = function() {
				var promoMatId = this.__hier_metadata[this.__dataelement];
				return (typeof promoMatId === undefined || typeof promoMatId === "undefined" || promoMatId == "") ? undefined : promoMatId;
			}

			this.getDuration = function() {
				print("Getting Duration using Segment Group [" + this.defaultWholeMaterialSegmentGroup + "] at Index [" + this.defaultWholeMaterialIndex +"]");
				return this.__promoMaterialHelper.getSegmentDuration(this.defaultWholeMaterialSegmentGroup, this.defaultWholeMaterialIndex);
			}

			this.getTargetEventTrim = function() {
				print("Getting EventTrim using Segment Group [" + this.defaultWholeMaterialSegmentGroup + "] at Index [" + this.defaultWholeMaterialIndex +"]");
				return this.__promoMaterialHelper.getSegmentIncode(this.defaultWholeMaterialSegmentGroup, this.defaultWholeMaterialIndex);
			}

			this.getTargetEventOutcode = function() {
				print("Getting EventTrim using Segment Group [" + this.defaultWholeMaterialSegmentGroup + "] at Index [" + this.defaultWholeMaterialIndex +"]");
				return this.__promoMaterialHelper.getSegmentOutcode(this.defaultWholeMaterialSegmentGroup, this.defaultWholeMaterialIndex);
			}

			this.getTargetEventDescription = function() {
				return "Tail Promo";
			}

			this.getTargetEventCgText = function() {
				return "Tail Promo";
			}

			// Initialise
			if (this.isRequired()) {
				// Save Whole Material Markers if they don't exist
				this.__promoMaterialHelper = new gmoNBCFunc.materialHelper(this.getMatId());
				var hasWholeMaterialSegmentAtDefaultIndex = this.__promoMaterialHelper.getSegmentsByGroup(this.defaultWholeMaterialSegmentGroup).Segment.(parseInt(Index) === this.defaultWholeMaterialIndex).length() === 1;

				if (hasWholeMaterialSegmentAtDefaultIndex === false) {
					// No Whole Material Segment Exists - Add to Promo Material
					print("\nNo [" + this.defaultWholeMaterialSegmentGroup + "] Segment at Index [" + this.defaultWholeMaterialIndex + "] currently exists for [" + this.getMatId() + "] Creating...");

					// Get Incode and Outcode from Main Media
					var mainMedia = this.__promoMaterialHelper.findMainStoreMedia();
					if (mainMedia === undefined) throw new Error("Promo Material [" + this.getMatId() + "] does not exist on a Valid Store / T2 Media to get Incode / Outcode From");
					var mainMediaTrackXml = this.__promoMaterialHelper.getTrackXmlByMedia(mainMedia);
					var incode = mainMediaTrackXml.Incode.toString();
					var outcode = mainMediaTrackXml.Outcode.toString();

					// Add and Save Segment
					this.__promoMaterialHelper.addSegmentToSaveXml(incode, outcode, this.defaultWholeMaterialSegmentGroup, this.defaultWholeMaterialIndex);
					var saveWholeMaterialSegment = this.__promoMaterialHelper.saveUsingSaveXml();
					if (saveWholeMaterialSegment === false) throw new Error("There is an error in creating [" + this.defaultWholeMaterialSegmentGroup + "] Segment for [" + this.getMatId() + "]");

				} else {
					print("\nSuccess [" + this.defaultWholeMaterialSegmentGroup + "] Segment at Index [" + this.defaultWholeMaterialIndex + "] currently exists for [" + this.getMatId() + "] Using.");
				}
			}
		};

		/*
			Tail Promo Settings
		*/
		var endPromo = new this.endPromoSettings(this.destSpecificMatHierarchialObj);
		if (endPromo.isRequired()) {
			/*
				End Promo is needed
				1. If making a Textless At End - insert before the last event
				2. If making a regular parcel - insert as last event
			*/
			var penultimateEventIndex = gmoNBCNLDFunc.getPenultimateEventIndex(eventList);
			if (makingOMTatend) {
				print("Inserting Tail Promo after Event Index [" + penultimateEventIndex + "] to Align with Building Textless At End");
				// duration, framerate, stream, matId, event_type, description, cg_text
				eventList.insertChildAfter(eventList.Event[penultimateEventIndex],gmoNBCNLDFunc.makeBaseEventXml(endPromo.getDuration(), parcelFrameRate, mainMaterialStream, endPromo.getMatId(), videoEventType, endPromo.getTargetEventDescription(), endPromo.getTargetEventCgText(), endPromo.getTargetEventTrim(), endPromo.getTargetEventOutcode()));
			} else {
				print("Inserting Tail Promo after Event Index [" + eventList.Event.length() + "]");
				eventList.appendChild(gmoNBCNLDFunc.makeBaseEventXml(endPromo.getDuration(), parcelFrameRate, mainMaterialStream, endPromo.getMatId(), videoEventType, endPromo.getTargetEventDescription(), endPromo.getTargetEventCgText(), endPromo.getTargetEventTrim(), endPromo.getTargetEventOutcode()));
			}

			// Retime - Put this in a central function
			print("New Events have been added. Retiming Parcel:");
			var parcelOffset;
			var previousOffset;
			var newAddition = "New Addition";

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

			parcelXml.Duration = gmoNBCNLDFunc.getParcelDuration(<Placing><PlacingParcel>{parcelXml}</PlacingParcel></Placing		>);
			print("\nadjustMainEventList(): Saving Parcel" + "\n " + parcelXml);
			gmoNBCNLDFunc.saveParcel(parcelXml);
		}
		//print()
		// Don't perform length checks when textlessComponents is undefined, explodes the whole profileAllocation
		if (typeof textlessComponents !== "undefined" && textlessComponents != null  && textlessComponents.length > 0) {
			output("Performing Textless Substitution");
			var th = new TextlessHandler();
			output("Texted Material will be [" + recipeComponents[0].matid +"]");
			output("Textless Material will be [" + textlessComponents[0].matid + "]");
			th.setTextedMatId(recipeComponents[0].matid);
			th.setTextlessMatId(textlessComponents[0].matid);				
			/*
				Set the Textless Filter
			*/
			print("textless filter : " + this.conformSettingsObj.partiallyTextedType);
			if (this.conformSettingsObj.partiallyTextedType !== "" && typeof this.conformSettingsObj.partiallyTextedType !== "undefined" && this.conformSettingsObj.partiallyTextedType !== "N/A") {
				th.setTextlessFilterName(this.conformSettingsObj.partiallyTextedType);
			}
			parcelXml.ParcelEventList.Event = th.adjustEventListWithTextedSegments(eventList);
			parcelXml = th.reworkParcelOffsets(parcelXml);			
			gmoNBCNLDFunc.saveParcel(parcelXml);
		} else {
			output("No Textless Substitution Required");
		}
			
	}
    profileAllocation.daisyLookup = function(daisyID) {
		// use daisy
		print("Checking for daisy id = "+daisyID);
		var daisyIdInspector = new DaisyIdInspector(daisyID);
		var matchingMaterialObject = daisyIdInspector.getMaterialObject();
		//print("Material ID : " + matchingMaterialObject.matid)
		//print("MatID " + gmoNBCFunc.isVarUsable(matchingMaterialObject.matid));
		if (!gmoNBCFunc.isVarUsable(matchingMaterialObject.matid)){
		// GMO ID
		print("Looking for GMO id = "+daisyID);
			var mgetXml = materialGet(daisyID, "shorttext", "tag", "tracks", "trackTypeLinks")..Material;
			var matchingMaterialObject = {
				matid : mgetXml.MatId.toString(),
				versiontype : mgetXml.VersionType.toString(),
				title : mgetXml.Title.toString(),
				duration : mgetXml.Duration.toString(),
				aspectratio : mgetXml.AspectRatio.toString(),
				tvdproductionnumber : mgetXml..ShortText.(ShortTextType.toString() === "TVD Production #").Value.toString(),
				daisyid : mgetXml..ShortText.(ShortTextType.toString() === "Daisy ID").Value.toString(),
				framerate : mgetXml.FrameRate.toString(),
				territorytype : mgetXml..Tag.(TagType.toString() === "Territory Sub-Type").Value.toString(),
				trackDefinitionList : mgetXml..TrackDefinition,
				trackTypeLinkList : mgetXml..TrackTypeLink,
				transformation: mgetXml.Transformation.toString(),
				priority : 0
			}
		}
		print ("daisy material : "+ matchingMaterialObject.matid);
		//gmoNBCFunc.printObj(profileAllocation.matchingMaterialObject);
		return  matchingMaterialObject;
	}
	// trailer daisy id
	profileAllocation.insertTrailer = function(trailerObj){
		var placingParcelXml = this.placingHelper.getPlacingXml().PlacingParcelList;
		var trailerMaterialHelper = materialGet(trailerObj.matid,"segments");
		var segment = trailerMaterialHelper..SegmentList.Segment.(SegmentGroup.Name.toString() == profileAllocation.somEom);
		if (!gmoNBCFunc.isVarUsable(segment)){
			var segment = trailerMaterialHelper.SegmentList.Segment.(SegmentGroup.Name.toString() == profileAllocation.wholeMaterial);
			if (!gmoNBCFunc.isVarUsable(segment)){
				throw new error ("Trailer specified, but trailer does not have SOM/EOM or WHOLE MATERIAL segment");
			}
		}
		//
		//print(gmoNBCFunc.printObj(segment));
		//
		var rtn = wscall(<PharosCs>
			<CommandList>
			  <Command subsystem="timecode" method="calculateDuration">
				<ParameterList>
				  <Parameter name="incode" value={segment.MarkerIn.Absolute.toString()}/>
				  <Parameter name="outcode" value={segment.MarkerOut.Absolute.toString()}/>
				  <Parameter name="frameRate" value={trailerObj.framerate}/>
				</ParameterList>
			  </Command>
			</CommandList>
		  </PharosCs>);

		var tduration = rtn..Output.toString();	;
		//
		var ttrim = segment.MarkerIn.Absolute.toString();
		var toutcode = segment.MarkerOut.Absolute.toString();
		//
		var parcelId = trailerObj.matid + "_TRAILER_" + com.google.common.hash.Hashing.md5().hashString(trailerObj.matid, java.nio.charset.Charset.forName('US-ASCII')).toString();
		var mainMaterialStream = "nld video";
		var eventXml = gmoNBCNLDFunc.makeBaseEventXml(tduration, trailerObj.framerate, mainMaterialStream, trailerObj.matid, "Video", trailerObj.title,"",ttrim,toutcode,""); 
		var numberParcels = this.placingHelper.numberOfParcels();
		print("Number of Parcels : " + numberParcels );
		var newParcel = numberParcels +1;
		var trailerParcel = XMLList();
		//
		trailerParcel = <PlacingParcel>
			<Ordinality>{newParcel}</Ordinality>
				<Parcel>
				<ClassName>Placing</ClassName>
				<ParcelName>{parcelId}</ParcelName>
				<Title>{trailerObj.title}</Title>
				<ParcelType>Placing</ParcelType>
				<FrameRate>{trailerObj.framerate}</FrameRate>
				<ParcelStatus>Ready</ParcelStatus>
				<Duration rate={trailerObj.framerate}>{trailerObj.duration}</Duration>
				<ParcelEventList>{eventXml}</ParcelEventList>
			<Owners>
				<Owner>
					<Name>NBCU GMO</Name>
				</Owner>
			</Owners>
			</Parcel>
		</PlacingParcel> ;
		//	print ("Trailer parcel" + trailerParcel);
		placingParcelXml.appendChild(trailerParcel);
		var placingSaveXml =
		<PharosCs>
			<CommandList>
			<Command subsystem="placing" method="save">
				<ParameterList>
				<Parameter name="placing">
					<Value>
					<Placing>
					<PlacingId>{this.placingId}</PlacingId>
						{placingParcelXml}
						</Placing>
					</Value>
				</Parameter>
				</ParameterList>
				</Command>
			</CommandList>
		</PharosCs>;
		print("\nAttempting Placing Save for [" + this.placingId + "] for Trailer ") ;
		//print ("Placing : " + placingSaveXml);
		return wscall(placingSaveXml).CommandList.Command.@success.toString() === "true";	
	}
	//                                                                                                                                                           //
	//                                                                                                                                                           //
	// ------------------------------------------------------------------ Start of Script --------------------------------------------------------------------- //
	//                                                                                                                                                           //
	//                                                                                                                                                           //
	print("\nRunning profileAllocation.js");
	profileAllocation.jobDescription = getJobParameter('jobDescription')..Output.JobDescription;;

	// Build up Source Object (contains some useful items from Job Desc)
	profileAllocation.sourceObj = profileAllocation.buildObject();
	profileAllocation.jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	profileAllocation.jobDashboard.updateStatusAndProgress("Starting Script",5);

	// Set some of the more commonly used properties
	profileAllocation.placingId = profileAllocation.sourceObj.placingid;
	profileAllocation.aspectRatio = profileAllocation.sourceObj.useableaspectratio;
	profileAllocation.jobDashboard.updateStatusAndProgress("Gathering Placing Details/Settings",10);
   	print("\nPlacing ID [" + profileAllocation.placingId + "]");

   	var contentExportHelper = new ContentExportHelper();
   	if(contentExportHelper.isContentExportPublicationDefinition(profileAllocation.sourceObj.profile)){
   		print("\nOrder [" + profileAllocation.placingId + "] is For Content Export Workflow - Transitioning");
   	 	profileAllocation.jobDashboard.updateStatusAndProgress("Transitioning to Content Export Profile Allocation",90);
   	 	gmoNBCNLDFunc.transitionPlacing(profileAllocation.placingId, profileAllocation.states.originalState, profileAllocation.requirements.toExportsProfileAllocation);
   	 	profileAllocation.jobDashboard.updateStatusAndProgress("Sent to Content Export Profile Allocation",100);
   	 	quit(0);
   	 }

	//profileAllocation.pubDef = profileAllocation.sourceObj.profile;
	var publicationDefinition = gmoNBCNLDFunc.getPubDef(profileAllocation.sourceObj.profile);
	if(typeof publicationDefinition =="undefined"){
		throw new Error("Profile/Publication Definition [" + profileAllocation.sourceObj.profile + "] is not setup or named differently in Mediator");
	}
	profileAllocation.pubDef = publicationDefinition.Name.toString();
	if (profileAllocation.pubDef != profileAllocation.sourceObj.profile){
		output("Case was mis-matched coming from Translation Layer, updating sourceObj.profile to be correct.");
		profileAllocation.sourceObj.profile = profileAllocation.pubDef;
	}
	print("\nPub Def [" + profileAllocation.pubDef + "]");

	// Attach Pub Def to Placing. This is necessary to be able to obtain the Settings for the Placing (to figure out Conform options) before the Placing is fully built.
	profileAllocation.attachPubDefToPlacing = new PlacingBuilder(profileAllocation.placingId, profileAllocation.pubDef);
	profileAllocation.attachedPubDef = profileAllocation.attachPubDefToPlacing.buildSkeletonPlacing();
	if (profileAllocation.attachedPubDef !== true) throw new Error("Error in associating the profile [" + profileAllocation.pubDef + "] to placing [" + profileAllocation.placingId + "]");

	// Need to Refresh the Placing Xml now the Pub Def is attached to the Placing
	profileAllocation.sourceObj.placingxml = placingGet(profileAllocation.placingId, "material", "fulltext", "shorttext", "tag", "destination", "parcel", "parcelMaterial", "profileStatus")..Output.Placing;
	profileAllocation.pubDefXml = gmoNBCNLDFunc.getPubDef(profileAllocation.pubDef);
	profileAllocation.presetSettings = gmoNBCNLDFunc.getSettings(profileAllocation.sourceObj.placingxml);

	// Restore and Deliver?
	profileAllocation.isRestoreAndDeliver = profileAllocation.pubDefXml..Preset.(PresetType.toString().toLowerCase() == profileAllocation.restoreAndDeliver.toLowerCase()).length() > 0;
	print("\nRestore and Deliver Order ? [" + profileAllocation.isRestoreAndDeliver + "]");

	//Work out if it's a retry - if so delete the working dir
	profileAllocation.placingHelper = new PlacingHelper(profileAllocation.placingId);
	profileAllocation.pipelineHelper = new PipelineHelper(profileAllocation.placingHelper);

	print("\nDeleting any Pre-Existing Working and Packaging Directories");
		gmoNBCNLDFunc.removePlacingNLDWorkingDir(profileAllocation.placingId,true);
		gmoNBCNLDFunc.removePlacingNLDPackagingDir(profileAllocation.pipelineHelper.getPackagingFolder());

	// Find the Conform Settings
	print("\nExtracting Conform Settings");
	profileAllocation.conformSettingsObj = profileAllocation.extractConformSettingsFromPreset();

	if(debug) {
		print("\n Conform Settings Object");
		try {
			gmoNBCFunc.printObj(profileAllocation.conformSettingsObj);
		} catch (e) {
			print(e.message);
		}

	}

	print("\nValidating Conform Settings");
	profileAllocation.validateConformSettingsFromPreset();

	print("\nValidating Conform Settings");
	profileAllocation.validateConformSettingsFromPreset();


	if (gmoNBCFunc.isVarUsable(profileAllocation.conformSettingsObj.partiallyTextedType) && profileAllocation.conformSettingsObj.partiallyTextedType !== "N/A") {
		print("overideTextlessPrefsForMoviesAnywhere "+profileAllocation.conformSettingsObj.partiallyTextedType);
		profileAllocation.overideTextlessPrefsForMoviesAnywhere();
	}

	// Create a Settings object for the Recipe Checker
	print("\nCreating Settings List for Recipe Finder");
	profileAllocation.segmentGroup = profileAllocation.conformSettingsObj.segmentGroup;
	profileAllocation.tvdNumber = profileAllocation.sourceObj.tvdid;
	profileAllocation.daisyid = profileAllocation.sourceObj.daisyid;
	profileAllocation.supplementaldaisyid = profileAllocation.sourceObj.supplementaldaisyid;
	profileAllocation.territoryMasterType = profileAllocation.conformSettingsObj.territorySubType;
	// Work out Version Preference. Three options.
	// 1) Translator has overriden the Texted / Textless Values
	// 2) Restore and Deliver Project. Deduce from appropriate Preset
	// 3) Normal Project. Extract from Conform Preset

	// See if Tranlator overrode the Textless / Texted preference
	profileAllocation.requiresTextedTextlessOverride = profileAllocation.placingHelper.getTextedTextlessOverrideStatus();
	print("\nTranslator Textless Override requested [" + profileAllocation.requiresTextedTextlessOverride + "]");

	if (profileAllocation.requiresTextedTextlessOverride &&
		!profileAllocation.isRestoreAndDeliver /* We don't care about the override if its restore and deliver */) {


		profileAllocation.textedTextlessOverrideValue = profileAllocation.placingHelper.getTextedTextlessOverrideValue();

		if(gmoNBCFunc.isVarUsable(profileAllocation.territoryMasterType)
			&& gmoNBCFunc.isVarUsable(profileAllocation.territoryMasterType) && profileAllocation.conformSettingsObj.versionPreference == "Territory Master"){
			// Set the Preference
			profileAllocation.presetVersionPref = profileAllocation.textedTextlessOverridePrefMap[profileAllocation.textedTextlessOverrideValue];
			if (profileAllocation.presetVersionPref == "Texted Only"){
				print("Adding LM-TEXTED");
				profileAllocation.versionPreferenceList = [NBCGMO.versionTypeMap.lmFtexted];
			} else if (profileAllocation.presetVersionPref == "Textless Only") {
				print("Adding LM-TLESS");
				profileAllocation.versionPreferenceList = [NBCGMO.versionTypeMap.lmFtless];
			} else if (profileAllocation.presetVersionPref == "Textless at End Only") {
				print("Adding LM-TATEND");
				profileAllocation.versionPreferenceList = [NBCGMO.versionTypeMap.lmTatend];
			}
			print("Replacing Territory Master Version Types for Translator Override ["+profileAllocation.versionPreferenceList + "]");
		} else {
			profileAllocation.presetVersionPref = profileAllocation.textedTextlessOverridePrefMap[profileAllocation.textedTextlessOverrideValue];
			// Set the Preference
			profileAllocation.versionPreferenceList = profileAllocation.versionTypeMap[profileAllocation.presetVersionPref];
		}

		print("\nTranslator chose to override Texted / Textless Value. Received Value [" + profileAllocation.textedTextlessOverrideValue + "] mapped to Version Preference [" + profileAllocation.textedTextlessOverridePrefMap[profileAllocation.textedTextlessOverrideValue] + "]")

	} else if (profileAllocation.isRestoreAndDeliver) {

		print("\nRestore and Deliver [" + profileAllocation.isRestoreAndDeliver + "] getting Restore and Deliver Texted Preference");
		profileAllocation.presetVersionPref = profileAllocation.getRestoreAndDeliverVersionPref(profileAllocation.pubDefXml);
		// Set the Preference
		profileAllocation.versionPreferenceList = profileAllocation.versionTypeMap[profileAllocation.presetVersionPref];

	} else {

		print("\nGetting Texted Preference from Conform Preset")
		profileAllocation.presetVersionPref  = profileAllocation.conformSettingsObj.versionPreference;
		// Set the Preference
		profileAllocation.versionPreferenceList = profileAllocation.versionTypeMap[profileAllocation.presetVersionPref];
	}


	// A way of linking together values needed when checking if the desired output can be made
	profileAllocation.recipeSettingsList = {
		segmentgroup : profileAllocation.segmentGroup,
		tvdnumber : profileAllocation.tvdNumber,
		daisyid : profileAllocation.daisyid,
		supplementaldaisyid : profileAllocation.supplementaldaisyid,
		aspectratio : profileAllocation.aspectRatio,
		restoreandeliver : profileAllocation.isRestoreAndDeliver,
		versionpreference : profileAllocation.versionPreferenceList,
		territorymastertype : profileAllocation.territoryMasterType
	}

	print("\nRecipe Settings List:\n");
	try {
		gmoNBCFunc.printObj(profileAllocation.recipeSettingsList);
	} catch(e) {
		print(e.message);
	}


	// **                             ** //
	//    Work out recipe Components
	// **                             ** //

	profileAllocation.outputFileTypeToCheck; // Explicitly set as undefined
	profileAllocation.recipeComponents = [];
	profileAllocation.textlessComponents = [];
	profileAllocation.matchingMaterialObject = [];
	profileAllocation.jobDashboard.updateStatusAndProgress("Attempting to find Recipe to make a Valid Output File",15);
	// Daisy ID = Mat ID Logic
	var missingSegmentGroups = [];
	if(gmoNBCFunc.isVarUsable(profileAllocation.sourceObj.daisyid)  ){
		print("Attempting to find Recipe based on Daisy ID [" + profileAllocation.sourceObj.daisyid + "]");
		var materialObject =  profileAllocation.daisyLookup(profileAllocation.sourceObj.daisyid);
		var matId = materialObject.matid ;	
		if(!gmoNBCFunc.isVarUsable(matId) ){
			throw new Error("No matching Material found for source ID [" + profileAllocation.sourceObj.daisyid + "]");
		}
		profileAllocation.matchingMaterialObject.push(materialObject);
		// Movies anywhere check
		if(gmoNBCFunc.isVarUsable(profileAllocation.sourceObj.supplementaldaisyid)  ){
			print("Found supplemental Daisy ");
			var supplementalMatchingMaterialObject =  profileAllocation.daisyLookup(profileAllocation.sourceObj.supplementaldaisyid);
			var supplementalmatId = supplementalMatchingMaterialObject.matid ;
			print("Supplemental Matid "+supplementalmatId )
			if(gmoNBCFunc.isVarUsable(supplementalmatId) ){
				print("Found supplemental Daisy id adding to object");
				profileAllocation.matchingMaterialObject.push(supplementalMatchingMaterialObject);
			}
		}else{
			print("No supplemental Daisy found");
		} 

        // Find the Source Transformation Setting
        print("\nExtracting Source Transformation Settings");
        var sourceTransformationFound = false;
        sourceTransformationFound = profileAllocation.extractSourceTransformationSetting();
        if (sourceTransformationFound === false) {
            print('Problem with Source Transformation, cannot determine output transformation')
        } else {
            sourceTransformationFound = true;
            print('Running determineTransformation')
            profileAllocation.determineTransformation();
        }
        if ( sourceTransformationFound &&  profileAllocation.transformationSettingsObj.outputTransformationSelected != null) {
            print('Output Transformation selected: [' + profileAllocation.transformationSettingsObj.outputTransformationSelected + '] ')
        } else {
            print('No output Transformation could be determined, will NOT set that value on placing')
        }
        
		var daisyIdSegmentCheck = [profileAllocation.recipeFinder.findMaterialSegmentGroupMatch(profileAllocation.matchingMaterialObject,profileAllocation.segmentGroup,profileAllocation.recipeSettingsList)];
		//May be overriden later for Textless Only	
		//The findMaterialSegmentGroupMatch returns an array or 'false' if the segment group doesn't exist		
		if (daisyIdSegmentCheck[0] == false) { 
			print("Daisy id segment check");
			missingSegmentGroups.push(profileAllocation.segmentGroup);
		} 
		if(profileAllocation.segmentGroup != profileAllocation.textlessSomEom && profileAllocation.presetVersionPref == "Textless at End Only" && !profileAllocation.isRestoreAndDeliver) {
			print("Textless at End Only required. Verifying material contains Textless SOM/EOM");
			var textLessSOMEOMSegmentCheck = [profileAllocation.recipeFinder.findMaterialSegmentGroupMatch(profileAllocation.matchingMaterialObject,profileAllocation.textlessSomEom,profileAllocation.recipeSettingsList)];
			if(textLessSOMEOMSegmentCheck[0] == false){
				missingSegmentGroups.push(profileAllocation.textlessSomEom);
			}else{
				profileAllocation.outputFileTypeToCheck = profileAllocation.conformSettingsObj.versionPreference == "Territory Master" ? NBCGMO.versionTypeMap.lmTatend : NBCGMO.versionTypeMap.omTatend;
				daisyIdSegmentCheck.push(textLessSOMEOMSegmentCheck[0]);
			}
		} else if (profileAllocation.presetVersionPref == "Textless Only") {
			print("Textless Only required. Verifying material material has all segments required for creating Textless");
			if(gmoNBCFunc.isVarUsable(profileAllocation.sourceObj.supplementaldaisyid) && profileAllocation.matchingMaterialObject.length >1){			
					profileAllocation.recipeComponents.push(profileAllocation.matchingMaterialObject);
					profileAllocation.textlessComponents.push(profileAllocation.matchingMaterialObject[1]);
					////print("Textless value : " +gmoNBCFunc.printObj(profileAllocation.textlessComponents));
			} else{
				var applyObj = profileAllocation.attemptRecipeMatch();
				profileAllocation.recipeComponents = applyObj.recipeComponents;
				profileAllocation.textlessComponents = applyObj.textlessComponents;
			}
		}

		if(missingSegmentGroups.length > 0){
 			var errorMessage = "Could Not Find Segment Group(s) [" + missingSegmentGroups + "] on Linked Material [" + matId + "]";
			gmoNBCFunc.saveNote("Placing",profileAllocation.placingId,"Awaiting Components","ERROR","CRITICAL",errorMessage + " Verify conform preset is configured correctly and the asset is marked up correctly with required segment groups.");
			throw new Error(errorMessage);				
		}
		profileAllocation.recipeComponents = daisyIdSegmentCheck;
		
		//print ("Recipe Components : " + JSON.stringify(daisyIdSegmentCheck));
	} else {
		throw new Error("No Daisy ID Saved Against Placing. Please Update and Retry Source Selection");
	}
        // == false for null AND undefined, after falsey check
		if (profileAllocation.recipeComponents == false || profileAllocation.recipeComponents == null ) {
			throw new Error("Failed to find a source with everything to satisfy the output file requirements\n" +
							"  TVD Number: " + profileAllocation.tvdNumber + "\n" +
							"  Segment Group: " + profileAllocation.segmentGroup + "\n" +
							"  Aspect Ratio: " + profileAllocation.aspectRatio + "\n" +
							"  Territory Sub-Type: " + profileAllocation.territoryMasterType + "\n" +
							"  Version Preference: " + profileAllocation.versionPreferenceList);
		}

		print("\n############################################################################################");
		print("\n Finalised Recipe:");
		print("\n#############################################################################################\n");
		profileAllocation.jobDashboard.updateStatusAndProgress("Found successful Recipe to make Output File",30);
		profileAllocation.placingFrameRate = profileAllocation.recipeComponents[0].framerate;
		print("\nUsing Frame Rate from first Material as Parcel Frame Rate [" + profileAllocation.placingFrameRate + "]");

		// Get dest specific Metadata
		profileAllocation.firstMaterial = profileAllocation.recipeComponents[0].matid;
		profileAllocation.destSpecificMetadataObj = new DestSpecificMetadataModule("material", profileAllocation.firstMaterial, profileAllocation.pubDef);
		print("\nDestination Specific Metadata for Material [" + profileAllocation.firstMaterial + "] [" + profileAllocation.destSpecificMetadataObj.containsDestSpecificMetadata() + "]");
		// Get the Hierarchail Object Episode to Brand - This is retrieved regardless of whether any such metadata exists. The Placing Builder uses that fact that some properties may be undefined to make decisions
		profileAllocation.destSpecificMatHierarchialObj = profileAllocation.destSpecificMetadataObj.extractDestinationSpecicMetadataEpisodeToBrandHierarchy__Material();

		profileAllocation.materialXml = materialGet(profileAllocation.firstMaterial)..Output.Material;

		// Construct Placing
		profileAllocation.jobDashboard.updateStatusAndProgress("Building Placing",50);
		profileAllocation.placingBuilder = new PlacingBuilder(
			profileAllocation.placingId, // Placing ID
			profileAllocation.pubDef, // Pub Def
			profileAllocation.recipeComponents, // How to make the Output file  (matieral and Segment Group List)
			profileAllocation.conformSettingsObj.templateName, // PlayTime Template
			profileAllocation.placingFrameRate, // Frame Rate for Placing
			profileAllocation.conformSettingsObj.includeHeader, // Whether Parcel needs a Header
			profileAllocation.destSpecificMatHierarchialObj, // Pass in the Dest Specific Metadata Object
			debug // Indicating whether you want lots and lots of output
		)

		// Check Placing was Built Successfully
		profileAllocation.placingBuilt = profileAllocation.placingBuilder.buildPlacing();
		if (profileAllocation.placingBuilt === false) throw new Error("There is an error in creating the Parcel for placing [" + profileAllocation.placingId + "]");
		print("\nPlacing Built [" + profileAllocation.placingBuilt + "]");

		//Refreshing Placing after Few Seconds
		print("Delay for 5 Sec to Get Parcel Response");
		sleep(5);
		profileAllocation.sourceObj.placingxml = placingGet(profileAllocation.placingId, "material", "fulltext", "shorttext", "tag", "destination", "parcel", "parcelMaterial", "profileStatus")..Output.Placing;

		// Get back what was Saved
		profileAllocation.placingGetXml = placingGet(profileAllocation.placingId, "parcel", "profileStatus");
		if (debug) print("\n" + profileAllocation.placingGetXml);
		profileAllocation.jobDashboard.updateStatusAndProgress("Placing Successfully Built",70);

		// Get Information about the Placing / Parcel
		profileAllocation.parcelId = profileAllocation.placingGetXml..Parcel[0].@id.toString(); // Assuming one Parcel per Placing at the moment
		print("\nParcel Id [" + profileAllocation.parcelId + "]");
		profileAllocation.parcelXml = gmoNBCNLDFunc.getParcel(profileAllocation.parcelId);

		// Save the territory sub-type against the placing so that we can view it on various placing-related forms.
		// Note: A value of "None" will be interpreted literally as SQL and raise an exception, hence we use "No Sub-Type" instead.
		var _matId = profileAllocation.sourceObj.placingxml..MainMatId.toString();
		var _territory = materialGet(_matId, "tag")..TagList.Tag.(TagType == "Territory Sub-Type").Value.toString()

		gmoNBCNLDFunc.placingTagSave(profileAllocation.placingId, "Territory Sub-Type", _territory || "No Sub-Type");

		// Gather Requirements for Custom Header
		profileAllocation.customHeaderRequirementsObj = profileAllocation.findCustomHeaderRequirements();

		if(profileAllocation.customHeaderRequirementsObj.isCustomHeaderRequired){
			profileAllocation.jobDashboard.updateStatusAndProgress("Fullfilling Custom Header Requirements",75);
			profileAllocation.insertCustomHeaderEvents = profileAllocation.insertCustomHeaderEventsIntoParcel();
			if (profileAllocation.insertCustomHeaderEvents !== true) throw new Error("Failed to add Custom Headers to Parcel");
			if(debug)print(gmoNBCNLDFunc.getParcel(profileAllocation.parcelId)..ParcelEventList);
		} else{
			print("\nConform Preset has no Custom Header Requirements. Skipping ...");
		}

		// Gather Requirements for Black Insertion
		profileAllocation.blackRequirementsObj = profileAllocation.findBlackInsertionRequirements();

		// Ultimately see whether any Black Insertion is required
		profileAllocation.requiresBlackInsertion = profileAllocation.blackRequirementsObj.requiresBlackInsertion;

		// Gather Requirements for Dub Cards
		profileAllocation.dubCardsInsertRequirementsObj = profileAllocation.findDubCardsInsertRequirements();

		if(profileAllocation.dubCardsInsertRequirementsObj.isDubCardsInsertRequired){
			profileAllocation.jobDashboard.updateStatusAndProgress("Fullfilling Dub Cards Insert Requirements",75);
			profileAllocation.insertDubCardsEvents = profileAllocation.insertDubCardEventsIntoParcel();
			if (profileAllocation.insertDubCardsEvents !== true) throw new Error("Failed to Insert Dub Cards to Parcel");
			if(debug)print(gmoNBCNLDFunc.getParcel(profileAllocation.parcelId)..ParcelEventList);
		} else{
			print("\nConform Preset has no Dub Cards Insert Requirements. Skipping ...");
		}

		// Update the Parcel XML Timeline
		profileAllocation.adjustMainEventList();

		// Not Restore and Deliver but Black Insertion is required handle
		if (profileAllocation.isRestoreAndDeliver === false && profileAllocation.requiresBlackInsertion) {

			profileAllocation.jobDashboard.updateStatusAndProgress("Fullfilling Black Insertion Requirements",80);
			print("\nProject Restore and Deliver [" + profileAllocation.isRestoreAndDeliver + "] and Black Insertion Required [" + profileAllocation.requiredBlackInsertion + "]");

			profileAllocation.insertAndSaveBlackEvents = profileAllocation.insertBlackEventsIntoParcel();
			if (profileAllocation.insertAndSaveBlackEvents !== true) throw new Error("There is an error in building the Placing Parcel . The error has occured when trying to add the black events defined in the conform preset");
			if(debug)print(gmoNBCNLDFunc.getParcel(profileAllocation.parcelId)..ParcelEventList);
		}

		// Need to add the VCHIP and Watermarking Information
		if(profileAllocation.isRestoreAndDeliver === false || profileAllocation.placingHelper.getWaterMarkingRequiredForRestoreDeliver() === true){
			profileAllocation.jobDashboard.updateStatusAndProgress("Inserting VCHIP and Watermarking Information",83);
			profileAllocation.insertAndSaveAncillaryEvents();
		} else {
			print("Restore and deliver without watermarking selected, ancillary events not supported");
			profileAllocation.ensureRDVideoAreValid(profileAllocation.sourceObj.placingxml);
		}
		// Trailer
		if(gmoNBCFunc.isVarUsable(profileAllocation.sourceObj.trailerdaisyid)  ){
			print("Found trailer Daisy ");
			var JRAPI = new JRAPI();        
			var trailerMatchingMaterialObject =  profileAllocation.daisyLookup(profileAllocation.sourceObj.trailerdaisyid);
			print(JRAPI.JSON.stringify(trailerMatchingMaterialObject));
			var trailermatId = trailerMatchingMaterialObject.matid ;
			print("Trailer Matid : "+trailermatId )
			if(gmoNBCFunc.isVarUsable(trailermatId) ){
				print("Found trailer Daisy id adding to parcel");
				if(profileAllocation.insertTrailer(trailerMatchingMaterialObject)){
					print("Trailer added success");
					sleep(3); // make sure it is saved 
				}else{
					throw new Error("Problem adding trailer to Parcel ");					
				}

			}else{
				print("No usable Material ID for Trailer Daisy id ")
			}

		}else{
			print("No Trailer Daisy found");
		} 

		// Check All TrackTypes for Materials exist in a Valid State
		print("\nEnsuring Validity of Track Types in Placing");
		profileAllocation.jobDashboard.updateStatusAndProgress("Ensuring Track Types Match a Valid Material Type Profile Map",85);
		profileAllocation.placingGetXml =  placingGet(profileAllocation.placingId, "parcel", "profileStatus");

		var trackTypeResult = profileAllocation.ensureTrackTypesAreValid(profileAllocation.placingGetXml);
		if (!trackTypeResult.success) {
			gmoNBCFunc.saveNote("Placing",profileAllocation.placingId,"Profile Hierarchy","WARNING","AVERAGE",trackTypeResult.comment);
		}

		/*
		Temporarily Disabling this code AS TL & Mediator are not ready in Syncing up Shell Records
		// Translator Check
		print("\nEnsuring Validity Translator Shell Exists\n");
		profileAllocation.jobDashboard.updateStatusAndProgress("Ensuring Translator has a record of Placing",90);
		profileAllocation.translatorShellExists =  gmoNBCFunc.isTranslatorShellExists(profileAllocation.tvdNumber);
		if(profileAllocation.translatorShellExists !== true){
			throw new Error("Cannot Service Orders for a Material without Translator Shell");
		}
		*/

		// Transition Placing - with successful requirement
		profileAllocation.jobDashboard.updateStatusAndProgress("Transitioning Placing",95);
		if (trackTypeResult.success && !profileAllocation.placingHelper.isTestOrder() /* Do not auto approve test orders */) {
			print("\nTransitioning Placing [" + profileAllocation.placingId + "] with requirement [" + profileAllocation.requirements.toPlacingValidation + "]");
			gmoNBCNLDFunc.transitionPlacing(profileAllocation.placingId, profileAllocation.states.originalState, profileAllocation.requirements.toPlacingValidation);
		} else {
		print("\nTransitioning Placing [" + profileAllocation.placingId + "] with requirement [" + profileAllocation.requirements.toApprovalRequired + "]");

			gmoNBCNLDFunc.transitionPlacing(profileAllocation.placingId, profileAllocation.states.originalState, profileAllocation.requirements.toApprovalRequired);
		}
	//  
	// Leave Successfully
		profileAllocation.jobDashboard.updateStatusAndProgress("Success",100);

} catch(e) {
	// TransitionPlacing - with fail requirement
	print("\nProfile Allocation error: [" + e + "]");

	try{
		if(typeof profileAllocation.placingId!="undefined" && profileAllocation.placingId!=""){
			//Adding Awaiting Components Reason - Notes needs to be saved first before state Transition otherwise TL will not get the info in PXF
			if(e.message!="" && e.message.indexOf('validationException')>-1){
				//Replacing validationException with Proper Message
				e.message = "There is an error in saving the placing parcel. This is a generic error and needs to be investigated to identify the reason for failure";
			}
			gmoNBCFunc.saveNote("Placing",profileAllocation.placingId,"Awaiting Components","ERROR","CRITICAL",e.message);
		}
	}catch(e) {
		print("\nProfile Allocation Notes Error: [" + e + "]");
	}
	profileAllocation.jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})
	try{
		gmoNBCNLDFunc.transitionPlacing(profileAllocation.placingId, profileAllocation.states.originalState, profileAllocation.requirements.toAwaitingComponents);
	}catch(e) {
		print("\nProfile Allocation Transition Error: [" + e + "]");
		sleep(5)
		gmoNBCNLDFunc.transitionPlacing(profileAllocation.placingId, profileAllocation.states.originalState, profileAllocation.requirements.toAwaitingComponents);
	}
	quit(-1);
}
