PlacingHelper = function(placingId) {
	
	if ((this instanceof PlacingHelper) === false) {
		throw new Error("Please call constructor with new() keyword");
	}
	
	print("\nPlacingHelper() initialising with Placing [" + placingId + "]");
	
	// Fields
	this.placingId = placingId;
	this.placingXml = placingGet(this.placingId, "material", "parcelMaterialLight", "cacheDetails", "parcel", "destination", "profileStatus", "shorttext", "fulltext", "tag", "history", "destinationSpecificMetaData")..Placing;
	this.mainMaterial = this.placingXml..MainMaterial..MatId.toString();
	this.pipeLineStates = {"transfer" : "Transfer", "preprocessing" : "Preprocessing", "conform" : "Conform","postprocessing" : "Post Processing","transcode" : "Transcode"};
	this.textedTextlessOverrideValues = ["Texted", "Textless", "Textless at Tail", "Texted w/Textless at Tail"];
	this.materialTextShortTextType = "Material Text";
	this.dueDateShortTextType = "Due Date";
	this.restoreAndDeliverShortText = "Restore and Deliver";
	this.requiresTextedTextlessOverride;
	if (debug) print("PlacingXml: " + this.placingXml);

	//                               //
	// Initialising Procedures Start //
	//                               //
	if (this.placingXml === "") {
		throw new Error("Failed to get Placing Xml for [" + this.placingId + "]");
	}else {
		print("PlacingHelper() avaialable for [" + placingId + "]");
	}
	
	// Has to be defined here as the below property uses it to set value
	this.__findTextedTextlessOverrideStatus = function() {
		var placingXmlMaterialTextValue = this.placingXml..ShortText.(ShortTextType.toString() === this.materialTextShortTextType).Value.toString();
		return this.textedTextlessOverrideValues.indexOf(placingXmlMaterialTextValue) > -1; 
	}
	
	// Sadly not a nice way to initalise a JS Object so free run
	this.requiresTextedTextlessOverride = this.__findTextedTextlessOverrideStatus();

	// set the XML 
	this.setPlacingXml = function (newXml){
		this.placingXml = newXml;
	}

	//
	// Start of Public Methods
	//
	this.refresh = function() {
		print("\nRefreshing Placing Helper to ensure latest Data");
		this.placingXml = placingGet(this.placingId, "material", "parcelMaterialLight", "cacheDetails", "parcel", "destination", "profileStatus", "shorttext", "fulltext", "tag", "history", "destinationSpecificMetaData")..Placing;
		this.mainMaterial = this.placingXml..MainMaterial..MatId.toString();
	}

	this.refreshParcel = function() {
		print("\nRefreshing Placing Parcel to ensure latest Data");
		delete this.placingXml..Parcel;
		this.placingXml.PlacingParcelList.PlacingParcel.Parcel = placingGet(this.placingId, "parcel");
		this.mainMaterial = this.placingXml..MainMaterial..MatId.toString();		
	}
		
	// Check to see if Placing has any Destination Specifc Metadata
	// @return [boolean]
	this.hasDestinationSpecificMetaData = function() {
		return this.placingXml..DestinationSpecificMetadataLinks.length() > 0;
	}
	
	// Returns the Xml containing Destination Specific Metadata
	// @return[xml] if Xml exists otherwise undefined
	this.getDestinationSpecificMetaDataXml = function() {
		return this.placingXml..DestinationSpecificMetadataLinks.length() > 0 ? this.placingXml..DestinationSpecificMetadataLinks : undefined;
	}
		
	// Returns Placing Id
	// @return [string] - Placing ID 
	this.getPlacingName = function(){
		if (debug) print("PlacingHelper.getPlacingName() [" + this.placingXml..PlacingId.toString() + "]");
		return this.placingXml.PlacingId.toString();
	}
	
	// Reurns whether a Texted / Textless override is necessary
	// @return [boolean]
	this.getTextedTextlessOverrideStatus = function() {
		return this.requiresTextedTextlessOverride;
	}
		
	// Returns the Texted / Textless Override Value to use. (Should be used in conjunction with getTextedTextlessOverrideStatus() to see if it`s necessary )
	// return [string] - Indicating which Override value should be used
	this.getTextedTextlessOverrideValue = function() {
		var placingXmlMaterialTextValue = this.placingXml..ShortText.(ShortTextType.toString() === this.materialTextShortTextType).Value.toString();
		return placingXmlMaterialTextValue;
	}
		
	// Returns State of Placing 
	// @return [string] - State Name of Placing
	this.getPlacingState = function() {
		if (debug) print("PlacingHelper.getPlacingState() [" + this.placingXml.StateName.toString() + "]");
		return this.placingXml.StateName.toString();
	}
	
	// Returns number of Parcels attached to Placing
	// @return [number] - Denoting the Number of Parcels attached to Placing
	this.numberOfParcels = function() {
		if (debug) print("PlacingHelper.numberOfParcels() [" + this.placingXml.PlacingParcelList.PlacingParcel.length() + "]")
		return parseInt(this.placingXml.PlacingParcelList.PlacingParcel.length());
	}
	
	// Return complete Placing Xml - rather a lot of output
	// @return [xml] - Placing Get - placingGet() at the top of quasi class for details
	this.getPlacingXml = function() {
		if (debug) print("PlacingHelper.getPlacingXml()");
		return this.placingXml;
	}
	
	// Returns Content Dest - May need to be expanded upon when multiple dests come into play
	//	@return [string] - Showing Content Dest
	this.getContentDest = function() {
		if (debug) print("PlacingHelper.getContentDest() [" + this.placingXml..ContentDestination.Name.toString() + "]");
		return this.placingXml..ContentDestination.Name.toString();
	}
	
	// Returns Publication Definition Name
	//	@return [string] - Showing Pub Def
	this.getPubDef  = function () {
		if (debug) print("PlacingHelper.getPubDef() [" + this.placingXml..PublicationDefinition.Name.toString() + "]");
		return this.placingXml..PublicationDefinition.Name.toString();
	}
	
	// Returns Placing Start Date - may need to change with bulk ordering ?
	// @return [string] - Indicating Placing Start Date
	this.getStartDate = function() {
		if (debug) print("PlacingHelper.getStartDate() [" + this.placingXml..StartDate.toString() + "]");
		return this.placingXml..StartDate.toString();
	}
	
	// Returns Placing End Date - may need to change with bulk ordering
	//	@return [string] - Indicating Placing End Date
	this.getEndDate = function() {
		if (debug) print("PlacingHelper.getEndDate() [" + this.placingXml..EndDate.toString() + "]");
		return this.placingXml..EndDate.toString();
	}
	
	// Returns Preroll Offset
	//	@return [string] - Indicating Preroll Offset
	this.getPrerollOffset = function(){
		var prerollOffset = this.placingXml..ContentDestination.PrerollOffset.toString();
		if (debug) print("PlacingHelper.getPrerollOffset() [" + prerollOffset + "]");
		return prerollOffset;
	}
	
	// Returns Staging Media
	//	@return [string] - Showing Stagign Media Name
	this.getStagingMedia= function() {
		if (debug) print("PlacingHelper.getStagingMedia() [" + this.placingXml..StagingMediaName.toString() + "]");
		return this.placingXml..StagingMediaName.toString();

		}

	this.getUsableMediasForMaterial = function (matId, materialXml) {

		if (debug) print("PlacingHelper.getUsableMaterialMediaObj()");
		var obj = {
			"Video": {},
			"Audio": {}
		};

		if (gmoNBCNLDFunc.isAncillaryMaterial(matId)) {

			var videoMedia = this.getStagingMedia();
			var audioMedia = this.getStagingMedia();

		} else {

			if (typeof materialXml == "undefined") {
				materialXml = materialGet(matId, "tracks")..Material;
			}
			var videoMedia = gmoNBCFunc.getOMMedia(matId, materialXml);
			var audioMedia = gmoNBCFunc.getOMAudioMedia(matId, materialXml);

			obj["Video"]["Track"] = materialXml.Track.(MediaName.toString() == videoMedia)
			obj["Audio"]["Track"] = materialXml.Track.(MediaName.toString() == audioMedia)
		}

		obj["Video"]["MediaName"] = videoMedia;
		if (gmoNBCFunc.isVarUsable(videoMedia)) {
			obj["Video"]["Mount"] = lookup.media[videoMedia].mount;
		} else {
			this.deleteStagingMedia(matId); // Tidy up the staging media
			throw new Error("Could not find a suitable source video media for [" + matId + "]. Please check where material exists and re-order placing to re-initiate archive restore if appropriate");
		}

		obj["Audio"]["MediaName"] = audioMedia;
		if (gmoNBCFunc.isVarUsable(audioMedia)) {
			obj["Audio"]["Mount"] = lookup.media[audioMedia].mount;
		} else {
			this.deleteStagingMedia(matId); // Tidy up the staging media
			throw new Error("Could not find a suitable source audio media for [" + matId + "]. Please check where material exists and re-order placing to re-initiate archive restore if appropriate");
		}

		return obj;
	}

	this.deleteStagingMedia = function(matId) {
		if (debug) print("PlacingHelper.deleteStagingMedia()");
		gmoNBCFunc.deleteTrackWithDeleteMark(matId, this.getStagingMedia());
	}
	// Returns Settings
	//	@return [object] - Off all the Preset Settings
	this.getSettings = function(){
		if (debug) print("PlacingHelper.getSettings()");
		var settings = gmoNBCNLDFunc.getSettings(this.placingXml);
		if (debug) show(settings);
		return settings;
	}
	
	this.getTVDId = function(){
		var tvdId = this.placingXml..ShortTextList.ShortText.(ShortTextType == "TVD Production #").Value.toString();
		if (debug) print("PlacingHelper.getTVDId() [" + tvdId + "]");
		return tvdId; 
	}

	this.getPlacingId = function(){
		var placingId = this.placingId;
		if (debug) print("PlacingHelper.getPlacingId() [" + placingId + "]");
		return placingId;
	}
	
	this.getUseableAspectRatio = function(){
		var woAsepct = this.placingXml..ShortTextList.ShortText.(ShortTextType == "Profile Aspect Ratio").Value.toString();
		var useableAspect = gmoNBCFunc.lastSubstrBefore(gmoNBCFunc.lastSubstrAfter(woAsepct, "("),")").replace(":", ".");
		if (debug) print("PlacingHelper.getUseableAspectRatio() [" + useableAspect + "]");
		return useableAspect; 
	}
	
	this.getProfile = function(){
		var profile = this.placingXml..ShortTextList.ShortText.(ShortTextType == "Profile").Value.toString();
		if (debug) print("PlacingHelper.getProfile() [" + profile + "]");
		return profile; 
	}
	this.getMatchedProfile = function() {
		var matched_profile = this.placingXml..ShortTextList.ShortText.(ShortTextType == "Matched Profile").Value.toString();
		if (debug) print("PlacingHelper.getMatchedProfile() [" + matched_profile + "]");
		return matched_profile;
	}
		
	this.isTestOrder = function() {
		var po_al_type = this.placingXml..TagList.Tag.(TagType.toString() == "PO/AL Type").Value.toString();
		if (debug) print("PlacingHelper.isTestOrder() [" + po_al_type + "]");
		return po_al_type.toLowerCase() === "test";
	}
	// Returns Information about each Parcel and Event in Placing - may also need to be adapted when/if multiple parcels are used
	// 	@return [array] of objects
	//		[number] parcelIndex - Showing the order of the parcel in the placingGet
	// 	 	[string] parcel -  Name of the Parcel
	//   	[string] parcelFrameRate - Frame Rate of the Parcel
	//   	[array] eventObjList - See this.__getEventInfoFromParcel() for details
	this.getParcelEventObj = function() {
		if (debug) print("PlacingHelper.__getParcelEventObj()");
		var rtn = [];
		var parcelList = this.__getParcelNames();
		var i = 0;
		for each (var parcel in parcelList) {
			var obj = {};
			obj["parcelIndex"] = i;
			obj["parcel"] = parcel;
			obj["parcelFrameRate"] = this.__getParcelFrameRate(parcel);
			obj["eventObjList"] = this.__getEventInfoFromParcel(parcel);
			obj["parcelStatus"] = this.__getParcelStatus(parcel);
			rtn.push(obj);
			i++;
		}
		return rtn;
	}

	// Returns Information about each Parcel and Event by Stream in Placing - may also need to be adapted when/if multiple parcels are used
	// 	@return [array] of objects
	//		[number] parcelIndex - Showing the order of the parcel in the placingGet
	// 	 	[string] parcel -  Name of the Parcel
	//   	[string] parcelFrameRate - Frame Rate of the Parcel
	//   	[array] eventObjList - See this.__getEventInfoFromParcel() for details
	this.getParcelEventObjByStream = function(streamName) {
		if (debug) print("PlacingHelper.__getParcelEventObj()");
		var rtn = [];
		var parcelList = this.__getParcelNames();
		var i = 0;
		for each (var parcel in parcelList) {
			var obj = {};
			obj["parcelIndex"] = i;
			obj["parcel"] = parcel;
			obj["parcelFrameRate"] = this.__getParcelFrameRate(parcel);
			obj["eventObjList"] = this.__getEventInfoFromParcelbyStream(parcel,streamName);
			obj["parcelStatus"] = this.__getParcelStatus(parcel);
			rtn.push(obj);
			i++;
		}
		return rtn;
	}

	// Returns a list of unique matIDs (excluding ancillary materials) from the parcel event list.
	// @return [array]
	this.filterUniqueMaterialsFromParcel = function() {
		var materials = [];
		var parcelEventList = this.getParcelEventObj();

		for each(var parcel in parcelEventList) {
			for each(var event in parcel.eventObjList) {
				if (!contains(materials, event.matId) && !gmoNBCNLDFunc.isAncillaryMaterial(event.matId)) {
					materials.push(event.matId);
				}
			}
		}

		return materials;
	}
	
	// Returns the Most Recent State Transition for a Placing
	// @return [string]
	this.getLatestTrigger = function() {
		return this.placingXml..WorkflowStateHistoryList.WorkflowStateHistory[0].Requirement.toString();
	}
	
	// Indicates whether Placing was a Re Order
	this.isInternalReOrder = function() {
		var reOrderTrigger = "Re Order"; // Make into array if multiple triggers can be used for a Re Order
		return this.getLatestTrigger() === reOrderTrigger;
	}
	
	// Returns the Main Material for a Placing
	this.getMainMaterial = function() {
		return this.mainMaterial;
	}
	
	this.isWaterMarkingRequired = function(placingXml, materialXml) {
		var getWaterMarkingOverride = function(p_pxml) {
			const oldWatermarkingOverride = "WaterMarking";
			const newWatermarkingOverride = "TL Watermarking Required";
			var waterMarkingFromTranslator = "";
			waterMarkingFromTranslator = p_pxml..ShortText.(ShortTextType.toString() === newWatermarkingOverride).Value.toString();
			if (!gmoNBCFunc.isVarUsable(waterMarkingFromTranslator)) {
				waterMarkingFromTranslator = p_pxml..ShortText.(ShortTextType.toString() === oldWatermarkingOverride).Value.toString();
			}
			return waterMarkingFromTranslator;
		};
		/* Rules :

			Override Flag From Translator => New field is "TL Watermarking Required", old field is "WaterMarking". We accept either,
			old one first
			If that is not present, we check Mediator rules. If we are doing a Watermark, we add Watermark Required" shortText for later
			sending to Translator 

			1) Material Type = Feature => Always Water Mark	
			2) Material Type = Episodic => Follow date Hierarchy and offset defined in settings
	
		*/
	
		var tlWaterMarkOverrideValue = getWaterMarkingOverride(placingXml);
		var airDateString = "";
		var requiresWatermarking = true;

		if(tlWaterMarkOverrideValue != "") {

			print("\n WaterMark OverRide Flag from Translator is [" + tlWaterMarkOverrideValue + "]");
			if(tlWaterMarkOverrideValue == "true") {
				gmoNBCNLDFunc.savePlacingShortText(placingId,"TL Watermarking Required", "true" );
				return true; 
			} // Else - carry out regular profile Watermarking Logic
		}

		// Ability to Bypass Watermarking by configuring the BrandCode
		if (materialXml..Brand.length() == 0) {
			materialXml = materialGet(materialXml.MatId.toString(), 'brand')..Material;
		}

		if (gmoNBCFunc.isVarUsable(gmoNBCFunc.getTagByTagTypeAndValue('Bypass Watermarking Logic (Show)', materialXml..BrandCode.toString()))) {
			print("Show Code [" + materialXml..BrandCode.toString() + "] has been configured to bypass watermarking");
			return false;
		}

		var materialType = materialXml.MaterialType.toString();
		print("\nMaterial Type is ["+ materialType +"]");
		
		if(NBCGMO.waterMarkingSettings[materialType] !=undefined) {
			print("\nWatermarking has value ["+ NBCGMO.waterMarkingSettings[materialType].waterMark +"]");
			if(NBCGMO.waterMarkingSettings[materialType].waterMark == "Always"){
				print('Always value detected, adding Watermark Required')
				gmoNBCNLDFunc.savePlacingShortText(placingId,"Watermark Required", "true" );
				return true;
			}else if (NBCGMO.waterMarkingSettings[materialType].waterMark == "Rule"){
				var offset = NBCGMO.waterMarkingSettings[materialType].offset;
				var dates = NBCGMO.waterMarkingSettings[materialType].dates;

				for each (dateField in dates){
					airDateString = this.getAirDate(dateField);
					print("\n" + dateField + " has value ["+ airDateString +"]");
					if (airDateString == "") {
						continue;
					}
					if(!this.checkWaterMarkingRequiredByDateAndOffset(airDateString,dateField,offset)){
						print('rule value is false, NOT adding Watermark Required')
						requiresWatermarking = false;
					}
					break;
				}
				if (requiresWatermarking) {
					print('rule value is true, adding Watermark Require ')
					gmoNBCNLDFunc.savePlacingShortText(placingId,"Watermark Required", "true" );
				}
				return requiresWatermarking;
			}
		}else {
			throw new Error("Material has [" + materialType + "] as Material Type. Please correct this info in Material  "); 
		}

		return false;
	}; 

	
	this.checkWaterMarkingRequiredByDateAndOffset = function (airDate,airDateField,offset){
		if (debug) print("\n DEBUG: PlacingHelper.checkWaterMarkingRequiredByDateAndOffset()");

		var airDateArr = airDate.split("T");
		
		var airDateObj = new Date(airDateArr[0].replace(/-/g,"/"));
		if (airDateArr.length > 1) {
			airDateObj.setHours(airDateObj.getHours() + airDateArr[1].split(":")[0]);
		}
		
		print("\nAir Date for Material [" + airDateObj + "]");
		
		var offsetTimeObj = new Date();
		offsetTimeObj.setHours(offsetTimeObj.getHours() + parseInt(offset)); // Add offset
		
		print("\nHours from now [" + offsetTimeObj + "]")
		
		// Air date is after next 24 hours and offset if provided
		var requiresWatermarking = airDateObj.valueOf() > offsetTimeObj.valueOf();
		print("\nWatermarking required as " + airDateField + " is after next " + offset + " hours? [" + requiresWatermarking + "]");	
		
		return requiresWatermarking;
	};
	
	// Returns the Air Date of the main Material based on its type as a String
	// @return string airDateField - The name of the field to obtain the Air Date
	// @error - If no value is set for the Air Date field
	this.getAirDate = function(airDateField) {
		if (debug) print("\n DEBUG: PlacingHelper.getAirDate()");
		var mainMaterial = this.getMainMaterial();
		var materialXml = materialGet(mainMaterial,"shorttext")..Material;
		var airDate = materialXml.ShortTextList.ShortText.(ShortTextType.toString() == airDateField).Value.toString();
		if (typeof airDate == 'undefined' || airDate == "") {
			return "";
		}
		return airDate;
	}
	this.isRestoreAndDeliverFromPlacingShortText = function() {
		return this.placingXml..ShortText.(ShortTextType == this.restoreAndDeliverShortText).Value.toString() == "true";
	}
	// Returns whether the NDD R and D Watermarking Required checkbox is checked
	this.isRestoreAndDeliverFromPresetPresence = function() {
		return (this.placingXml..PlacingPublicationList.PlacingPublication.PublicationDefinition.Presets.PresetList.Preset.(PresetType == "Restore and Deliver").length() == 1)
	}
	// @return boolean
	this.getWaterMarkingRequiredForRestoreDeliver = function () {
		if (debug) print("\n DEBUG: PlacingHelper.getWaterMarkingRequiredForRestoreDeliver()");

		var waterMarkingFromTranslator = this.getShortTextValueByType("TL Watermarking Required");
		if (!gmoNBCFunc.isVarUsable(waterMarkingFromTranslator)) waterMarkingFromTranslator = this.getShortTextValueByType("Watermarking");

		var presetWaterMarkingRequired = this.placingXml..PlacingPublicationList.PlacingPublication.PublicationDefinition.Presets.PresetList.Preset.(PresetType == "Restore and Deliver").ShortTextList.ShortText.(ShortTextType == "NLD R and D Watermarking Required").Value;

		if(presetWaterMarkingRequired.toString() == 'false' && waterMarkingFromTranslator == 'true'){
			output("Order has a Restore and Deliver Preset set to [false], however TL Override sent to include Watermarking [true]");
			return true;
		}else if (gmoNBCFunc.isVarUsable(presetWaterMarkingRequired.toString()) && presetWaterMarkingRequired.toString() == 'true') {
			return true;
		}
		return false;
	}

	// Returns the Due Date of a Placing as a String
	this.getDueDate = function() {
		if (debug) print("\n DEBUG: PlacingHelper.getDueDate()");
		var dueDate = this.placingXml..ShortText.(ShortTextType == this.dueDateShortTextType).Value.toString();
		return dueDate;
	};

	this.getOutputTemplateId = function(){
        var outputTemplateId = parseInt(this.placingXml..OutputTemplate.Integer);
        return isNaN(outputTemplateId) ? undefined : outputTemplateId;
    }
        
    this.getOutputTemplate = function(){
        return gmoNBCNLDFunc.getOutputTemplate(this.getOutputTemplateId()); 
    }

    this.getOutputTemplateName = function(){
        return this.getOutputTemplate().Name.toString();
    }
    	
	// Return the Full Path and File for the Previous Pipe Line
	// @param[string] (previousPipeLineState) - Name of the Previous PipeLine State
	// @param[string] (previousWorkingPath) - Location of the Previous Working Path
	// @error - If no Extension is found on the Staging Track 
	// @error -  
	this.getPreviousPipeLinePathAndFile = function(previousPipeLineState, previousWorkingVideoPath) {
		
		var previousWorkingPathAndFile;
		  
		if (previousPipeLineState === this.pipeLineStates.transfer || previousPipeLineState === this.pipeLineStates.preprocessing) {
			
			var mediaObj = this.getUsableMediasForMaterial(this.getMainMaterial());
			var usableVideoMedia =  mediaObj["Video"]["MediaName"];
			// Currently if the previous state was either of the above the file will be on NLD Staging
			previousWorkingPathAndFile = new gmoNBCFunc.materialHelper(this.getMainMaterial()).getPathAndFileOfTrackTypeOnMedia(usableVideoMedia, "Video", true);
			  
		} else if (previousPipeLineState === this.pipeLineStates.conform) {
		
			// Need a better way to handle this. Caches will come to rescue
			previousWorkingPathAndFile = previousWorkingVideoPath + placingHelper.placingId + ".mov";
	   	
		} else {
			
			throw new Error("Method cannot currently find Incode from Previous State [" + previousPipeLineState + "]");
		}
		
		if (previousWorkingPathAndFile === undefined) throw new Error("Failed to Find a Path and File for Previous ");
		return previousWorkingPathAndFile;
		
	};
		 // Method to get V Chip Rating - this will need to change when Placings contain Multiple Material
    this.getVChipRatingForMainMaterial = function() {
        if (debug) print("\nPlacingHelper.getVChipRatingForMainMaterial()");
        var ratingTagType = "US Rating";
        return new gmoNBCFunc.materialHelper(this.getMainMaterial()).getTagValue(ratingTagType);
    };
    
    this.getMainMaterialBrandTitle = function() {
        if (debug) print("\nPlacingHelper.getMainMaterialBrandTitle()");
        return new gmoNBCFunc.materialHelper(this.getMainMaterial()).getBrandTitle();
    }

	this.getPlacingShortTextValue = function(shortTextType) {
		 var shortTextValue = this.placingXml..ShortTextList.ShortText.(ShortTextType.toString() == shortTextType).Value.toString()
			return shortTextValue;
	};
	this.getWorkOrderDeliveryEmails = function () {
		var workOrderDeliveryEmails = [];

		var requestorEmailAddress = this.getPlacingShortTextValue("Requestor Email Address");
		if(gmoNBCFunc.isVarUsable(requestorEmailAddress)) workOrderDeliveryEmails.push(requestorEmailAddress);

		var createdByEmailAddress = this.getPlacingShortTextValue("Created By Email Address");
		if(gmoNBCFunc.isVarUsable(createdByEmailAddress)) workOrderDeliveryEmails.push(createdByEmailAddress);

		var updatedByEmailAddress = this.getPlacingShortTextValue("Updated By Email Address");
		if(gmoNBCFunc.isVarUsable(updatedByEmailAddress)) workOrderDeliveryEmails.push(updatedByEmailAddress);
		
		var podRecipients = this.getFullTextValueByType("POD Recipients");
		if(gmoNBCFunc.isVarUsable(podRecipients)) {
  			var delimiter = /\s*,\s*/;
  			var podEmails = podRecipients.split(delimiter);
  			podEmails.forEach(function(emailAddress){
    			workOrderDeliveryEmails.push(emailAddress);
      		});
  		};

  		var removeDuplicates = workOrderDeliveryEmails.filter(function(email, index){
    		return workOrderDeliveryEmails.indexOf(email) >= index;
  		});
		return workOrderDeliveryEmails;
	};

	// Note this only expects Placings with a single parcel
	this.getParcel = function() {
		if (debug) print("\nPlacingHelper.getParcel()");
		return this.placingXml..Parcel[0];
	};
	
	this.getFullTextValueByType = function(fullTextType) {
		if (debug) print("\nPlacingHelper.getFullText()");
		return this.placingXml..FullText.(FullTextType.toString() == fullTextType).Value.toString();
	};

    this.getTagByType = function(tagType) {
        // Assumes one value, does not work with multiple values
        var tagTextValue = this.placingXml..TagList.Tag.(TagType.toString() == tagType).Value.toString();
        return tagTextValue;
	}

	/**
	*	Extracts the Track Types from the Placing's main assets by Audio Class
	*	@param[xml] - of the Placing
	*	@param[string] - of the Main Mat Id
	*	@param[string] - of the Audio Class to look for	
	*	@return[array] of strings
	**/
	this.getMatchedProfileTrackTypesByClass = function (placingXml, mainMatId, trackTypeClassName) {

                var rtn = [];

                // System Xml List
                var ttXml = gmoNBCFunc.getTrackTypes();

                // Get Track Types in Placing
                var placingTrackTypes = gmoNBCNLDFunc.getMatchedProfileTrackTypes(placingXml, mainMatId);

                // Filter out the Track Types of the pretinent Audio Class
                for each (var tt in placingTrackTypes) {

                        var trackType = tt.toString(); // Note: getMatchedProfileTrackTypes returns xml

                        var systemTrackTypeXmlNode = ttXml..TrackType.(Name.toString() == trackType);

                        if (systemTrackTypeXmlNode.ClassName.toString() == trackTypeClassName){
                                rtn.push(trackType);
                        }

                }

                return rtn;
        }

		this.workflowReset = function(){
		print("Resetting Placing ["+this.placingId+"]");
		try{
			wscall(<PharosCs>
			  <CommandList>
				<Command subsystem="workflow" method="reset">
				  <ParameterList>
					<Parameter name="placing">
					  <Value>
						<Placing>
						  <PlacingId>{this.placingId}</PlacingId>
						</Placing>
					  </Value>
					</Parameter>
				  </ParameterList>
				</Command>
			  </CommandList>
			</PharosCs>)
		}catch(e){
			throw new Error("Error in Placing Workflow Reset");
		}
	}

	this.getOutputFrameRate = function(){
		var outputFrameRate = this.placingXml..PublicationDefinition.Presets.PresetList.Preset.TagList.Tag.(TagType == "NLD Output Frame Rate").Value.toString();

		var mainMaterial = this.getMainMaterial();
		var materialXml = materialGet(mainMaterial,"shorttext")..Material;

		// If Telecine and return to original, we will be setting the output frame rate to P23_976.
		var telecine = materialXml.ShortTextList.ShortText.(ShortTextType == "Telecine").Value.toString();
		if (outputFrameRate == "Return to Original Frame Rate" && telecine.toString() == "true"){
			return "P23_976";
		} else if (outputFrameRate == "Same as Source" || outputFrameRate == "Return to Original Frame Rate"){
			return materialXml.FrameRate.toString();
		} else {
			return outputFrameRate;
		}
	}
    
    this.getShortTextValueByType = function(shortTextType) {
        var shortTextValue = this.placingXml..ShortTextList.ShortText.(ShortTextType.toString() == shortTextType).Value.toString();
        return shortTextValue;
    };

    this.getTagByType = function(tagType) {
        // Assumes one value, does not work with multiple values
        var tagTextValue = this.placingXml..TagList.Tag.(TagType.toString() == tagType).Value.toString();
        return tagTextValue;
	}

	// Consider these private - use at your own risk
	
	// Returns information relating to each event in a Parcel
	//	@return [array] of objects
	//		[number] eventIndex - Indicating the order of an event in a Parcel
	//		[string] matId - Mat Id of Event
	// 		[string] frameRate - Frame Rate of Event
	//		[string] incode - Incode of Event
	//      [string] outcode - Outcode of Event
	//		[string] duration - Duration of Event
	//		[string] offset - Offset from Parcel Event - Note: This is an Amount of Time NOT a Frame Label
	//      [object] stagingTrackInfo - See this.__checkStagingTrackInfo() for list of properties
	//      [string] eventType - Event's Type
	//		[string] stream - Event't Stream
	this.__getEventInfoFromParcel = function(parcelName) {
		if (debug) print("PlacingHelper.__getEventInfoFromParcel()");
		var rtn = [];
		var i = 0;	
		for each (var parcelEvent in this.placingXml..Parcel.(ParcelName.toString()=== parcelName)..ParcelEventList.Event) {
			var obj = {};
			obj["eventIndex"] = i;
			obj["matId"] = parcelEvent.TrimMaterialId.toString();
			obj["frameRate"] = parcelEvent.FrameRate.toString();
			obj["incode"] = parcelEvent.EventTrim.toString();
			obj["outcode"] = parcelEvent.Outcode.toString();
			obj["duration"] = parcelEvent.Duration.toString();
			obj["offset"] = parcelEvent.ParcelOffset.toString();
			obj["stagingTrackInfo"] = this.__checkStagingTrackInfo(obj.matId);
			obj["eventType"] = parcelEvent.EventType.toString();
			obj["stream"] = parcelEvent.Stream.toString();
			obj["cgText"] = parcelEvent.CgText.toString();
			obj["segmentId"] = parcelEvent.SegmentId.toString();
			obj["raw"] = parcelEvent;
			rtn.push(obj);
			i++;
		}
		return rtn;
	}

	// Returns information relating to each event in a Parcel by Stream
	//	@return [array] of objects
	//		[number] eventIndex - Indicating the order of an event in a Parcel
	//		[string] matId - Mat Id of Event
	// 		[string] frameRate - Frame Rate of Event
	//		[string] incode - Incode of Event
	//      [string] outcode - Outcode of Event
	//		[string] duration - Duration of Event
	//		[string] offset - Offset from Parcel Event - Note: This is an Amount of Time NOT a Frame Label
	//      [object] stagingTrackInfo - See this.__checkStagingTrackInfo() for list of properties
	//      [string] eventType - Event's Type
	//		[string] stream - Event't Stream
	this.__getEventInfoFromParcelbyStream = function(parcelName,streamName) {
		if (debug) print("PlacingHelper.__getEventInfoFromParcel()");
		var rtn = [];
		var i = 0;	
		for each (var parcelEvent in this.placingXml..Parcel.(ParcelName.toString()=== parcelName)..ParcelEventList.Event.(Stream.toString()== streamName)) {
			var obj = {};
			obj["eventIndex"] = i;
			obj["matId"] = parcelEvent.TrimMaterialId.toString();
			obj["frameRate"] = parcelEvent.FrameRate.toString();
			obj["incode"] = parcelEvent.EventTrim.toString();
			obj["outcode"] = parcelEvent.Outcode.toString();
			obj["duration"] = parcelEvent.Duration.toString();
			obj["offset"] = parcelEvent.ParcelOffset.toString();
			obj["stagingTrackInfo"] = this.__checkStagingTrackInfo(obj.matId);
			obj["eventType"] = parcelEvent.EventType.toString();
			obj["stream"] = parcelEvent.Stream.toString();
			obj["cgText"] = parcelEvent.CgText.toString();
			obj["segmentId"] = parcelEvent.SegmentId.toString();
			obj["raw"] = parcelEvent;
			rtn.push(obj);
			i++;
		}
		return rtn;
	}
	
	// Get Infromation about the Staging Track for an event
	this.__checkStagingTrackInfo = function(matId) {
		var obj = {}
		var trackXml = materialGet(matId,"tracks")..Track.(MediaName.toString()=== this.getStagingMedia() && parseInt(DeleteMark) === 0 && Encoded.toString() === "true");
		obj["hasStagingTrack"] = trackXml.length() > 0;
		obj["stagingTrackTypes"] = [];
		// Return Object no need to carry on 
		if (!obj.hasStagingTrack) {
			return obj;
		}
		// Find Track Types if an Xml exists
		for each (var td in trackXml.TrackDefinition) {
			obj.stagingTrackTypes.push(td.TrackTypeName.toString());
		}
		return obj;
	}
	
	// Extracts Parcel Names from Placing
	this.__getParcelNames = function() {
		var rtn = [];
		for each(var parcel in this.placingXml.PlacingParcelList.PlacingParcel.Parcel) {
			rtn.push(parcel.ParcelName.toString());
		}
		return rtn;
	}
	
	// Gets the Frame Rate of the Parcel in Question
	this.__getParcelFrameRate = function(parcelName) {
		return this.placingXml..Parcel.(ParcelName.toString() === parcelName).FrameRate.toString();
	}
	
	// Gets the Status of the Parcel
	this.__getParcelStatus = function(parcelName) {
		return this.placingXml..Parcel.(ParcelName.toString() === parcelName).ParcelStatus.toString();
	}
	
	this.saveFakeStagingTrackForAllMats = function() {
		const FUNCNAME = "saveFakeStagingTrack()";
		var materialList = this.filterUniqueMaterialsFromParcel();
		this.__logger(FUNCNAME, "Material List = [" + materialList + "]");
		for (var i = 0; i <  materialList.length; i++) {
			var matId = materialList[i];
			this.__logger(FUNCNAME, "Saving Track on [" + this.getStagingMedia() + "] for [" + matId + "]");
			var mh = new gmoNBCFunc.materialHelper(matId);
			var saveXml = <Material>
				<MatId>{matId}</MatId>
				<Track>
					<MediaName>{this.getStagingMedia()}</MediaName>
					<Encoded>true</Encoded>
				</Track>
			</Material>;
			var position = 1;
			for each(sTrackTypeLink in mh.getMaterialXml()..TrackTypeLink) {
				sTrackTypeName = sTrackTypeLink.TrackTypeName.toString();
				print(sTrackTypeLink.TrackTypeName.toString());
				saveXml.Track.TrackDefinition += <TrackDefinition>
													<TrackTypeName>{sTrackTypeName}</TrackTypeName>
													<Position>{position}</Position>
												</TrackDefinition>;
				position++;
			}
			materialSave(saveXml);			
		}
	}

	this.saveFakeStagingTrackForOneMat = function(matId) {
		const FUNCNAME = "saveFakeStagingTrack()";
		this.__logger(FUNCNAME, "Saving Track on [" + this.getStagingMedia() + "] for [" + matId + "]");
		var mh = new gmoNBCFunc.materialHelper(matId);
		var saveXml = <Material>
			<MatId>{matId}</MatId>
			<Track>
				<MediaName>{this.getStagingMedia()}</MediaName>
				<Encoded>true</Encoded>
			</Track>
		</Material>;
		var position = 1;
		for each(sTrackTypeLink in mh.getMaterialXml()..TrackTypeLink) {
			sTrackTypeName = sTrackTypeLink.TrackTypeName.toString();
			print(sTrackTypeLink.TrackTypeName.toString());
			saveXml.Track.TrackDefinition += <TrackDefinition>
												<TrackTypeName>{sTrackTypeName}</TrackTypeName>
												<Position>{position}</Position>
											</TrackDefinition>;
			position++;
		materialSave(saveXml);			
		}
	}

	this.sourceMaterialRestoreEval = function() {
		const FUNCNAME = "allMaterialsOnUsableStorage";
		var materialList = this.filterUniqueMaterialsFromParcel();
		this.__logger(FUNCNAME, "Material List = [" + materialList + "]");	
		var requireRestore = [];
		var noRestore = [];
		for (var i = 0; i <  materialList.length; i++) {
			try {
				var matId = materialList[i];
				if (this.getUsableMediasForMaterial(matId)) {
					noRestore.push(matId);
				};
			} catch (e) {
				this.__logger(FUNCNAME, "[" + matId + "] needs to be restored");
				requireRestore.push(matId);
			}
		}
		return {
			"requireRestore" : requireRestore,
			"noRestoreNeeded" : noRestore
		};
	}

	this.__logger = function(func, str) {
		output(func + ": " + str);
	}
}

