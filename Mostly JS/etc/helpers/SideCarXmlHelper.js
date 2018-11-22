var SideCarXmlHelper = function() {
	this.languageMatchCheck = function(languageCheckObj) {
		var primaryLanguage = languageCheckObj.matXml.TagList.Tag.(TagType.toString() == "Primary Language").Value.toString();
		var secondaryLanguage = languageCheckObj.matXml.TagList.Tag.(TagType.toString() == "Secondary Language").Value.toString();
		var tertiaryLanguage = languageCheckObj.matXml.TagList.Tag.(TagType.toString() == "Tertiary Language").Value.toString();
		var sideCarSecondaryLangauge = this.getSideCarLanguage("Secondary Language", languageCheckObj.sideCarXml); 
		var sideCarTertiaryLanguage = this.getSideCarLanguage("Tertiary Language", languageCheckObj.sideCarXml); 
		var videoState = languageCheckObj.matXml..TrackTypeLink.(TrackTypeName.toString() === videoTrackType).StateName.toString();
		logger.info("\tMaterial Primary Language [" + primaryLanguage + "]");
		logger.info("\tVideo State [" + videoState + "]");
		
		if (languageCheckObj.isLMBeingUpoaded) {
			if (primaryLanguage === languageCheckObj.sideCarPrimaryLanguage && secondaryLanguage === sideCarSecondaryLangauge && tertiaryLanguage === sideCarTertiaryLanguage && languageCheckObj.matAspectRatioVersionTypeCombo === languageCheckObj.sideCarAspectRatioVersionTypeCombo && videoState !== languageCheckObj.states.omUploadState)  {
				logger.info("");
				throw new Error("Material already exists for Aspect Ratio Version Type Combination [" + languageCheckObj.sideCarAspectRatioVersionTypeCombo + "] with Primary Language [" + primaryLanguage + "] and Secondary Language [" + secondaryLanguage + "] and Tertiary Language [" + tertiaryLanguage + "] Please Purge [" + languageCheckObj.matXml.MatId + "] and redrop files...");
			}
		} else {
			if (languageCheckObj.matAspectRatioVersionTypeCombo === languageCheckObj.sideCarAspectRatioVersionTypeCombo && videoState !== languageCheckObj.states.omUploadState) {
				logger.info("");
				throw new Error("Material already exists for Aspect Ratio Version Type Combination [" + languageCheckObj.sideCarAspectRatioVersionTypeCombo + "] Please Purge [" + languageCheckObj.matXml.MatId + "] and redrop files...");
			}
		}	
	},

	this.getSideCarLanguage = function(language, sideCarXml) {
		// This may not exist if it's not an LM being uploaded
		var sideCarLanguage = sideCarXml.Slate.ID_List.ID.(Type.toString()==language).Value.toString();
		if (sideCarLanguage) {
			logger.info("\tSideCarXml " + language + " [" + sideCarLanguage + "]");
		} else {
			logger.info("\tNo SideCarXml " + language +" detected. May fail if LM is being uploaded");
		}		
		
		return sideCarLanguage;
	}	
}