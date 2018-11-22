/*
* @Author: Chris Filippone/Mike Ayubi
* @Description: Dub Cards Population Script
* @Date:   2018-09-21 11:38:25
*/

var java = JavaImporter(
	Packages.com.pharos.core.domain,
	Packages.com.pharos.core.domain.list,
	Packages.com.pharos.core.domain.utils,
	Packages.com.pharos.core.domain.job,
	Packages.com.pharos.core.domain.options,
	Packages.com.pharos.microtime,
    Packages.java.text.SimpleDateFormat,
	Packages.java.util.ArrayList,
    Packages.java.lang.Integer,
    Packages.com.pharos.poxclient,
    Packages.com.pharos.poxclient.rhozet,
    Packages.com.pharos.poxclient.buydrm,
    Packages.java.io,
    Packages.com.pharos.util,
    Packages.com.pharos.microtime,
    Packages.com.pharos.core.domain.reports,
    Packages.com.pharos.core.domain.reports.parameters
);

//Declaring Constants - Form Data Keys

const PLACING_ID = "Placing.PlacingId";
const DAISY_ID = "DaisyID";
const SUPPLEMENTAL_DAISY_ID = "SupplementalDaisyID";
const TRAILER_DAISY_ID = "TrailerDaisyID";
const DUB_CARD_DAISY_ID = "DubCardDaisyID";
const BOX_ART_FILENAME = "BoxArtFilename";
const POSTER_ART_FILENAME = "PosterArtFilename";
const SERIES_ART_FILENAME = "SeriesArtFilename";
const SEASON_ART_FILENAME = "SeasonArtFilename";
const EPISODE_ART_FILENAME = "EpisodeArtFilename";
const HERO_ART_FILENAME = "HeroArtFilename";
const TITLE_ART_FILENAME = "TitleArtFilename";
const TRAILER_ART_FILENAME = "TrailerArtFilename";
const UPDATE_TRAILER_FLAG = "UpdateTrailerFlag";
const UPDATE_IMAGE_FLAG = "UpdateImageFlag";
const UPDATE_METADATA_FLAG = "UpdateMetadataFlag";
const UPDATE_SIDECAR_AUDIO_FLAG = "UpdateSidecarAudioFlag";
const UPDATE_SIDECAR_AUDIO_TRACK = "SidecarAudioTrack";
const UPDATE_SIDECAR_CAPTION_FLAG = "UpdateSidecarCaptionFlag";
const UPDATE_SIDECAR_CAPTION_TRACK = "UpdateSidecarCaptionTrack";
const PLACING_STATE = "PlacingState";
const WORKFLOW_ACTION = "WorkflowAction";
const DELIVERY_REVISION = "Delivery Revision";

const MESSAGE = "metadataPlacing.ErrorMessage";

//Options Constant 
const SHORT_TEXT = "shorttext";
const FULL_TEXT = "fulltext";
const TAG = "tag";
const DESTINATION = "destination";

//Form DataKey ==> Data Element Name MAPPING  
const MAPPING = {
	DAISY_ID : "Daisy ID",
    SUPPLEMENTAL_DAISY_ID  : "Supplemental Daisy ID",
	TRAILER_DAISY_ID : "Trailer Daisy ID",
	DUB_CARD_DAISY_ID : "Dub Card Daisy ID",
	BOX_ART_FILENAME : "BoxArt Image Filenames",
	POSTER_ART_FILENAME : "PosterArt Image Filenames",
	SERIES_ART_FILENAME : "SeriesArt Image Filenames",
	SEASON_ART_FILENAME : "SeasonArt Image Filenames",
	EPISODE_ART_FILENAME : "EpisodeArt Image Filenames",
	HERO_ART_FILENAME : "HeroArt Image Filenames",
	TITLE_ART_FILENAME : "TitleArt Image Filenames",
	TRAILER_ART_FILENAME : "TrailerArt Image Filenames",
	UPDATE_TRAILER_FLAG : "Update Trailer Package",
	UPDATE_IMAGE_FLAG : "Update Image Package",
	UPDATE_METADATA_FLAG : "Update Metadata Package",
	UPDATE_SIDECAR_AUDIO_FLAG : "Update Sidecar Audio Package",
	UPDATE_SIDECAR_AUDIO_TRACK : "Update Sidecar Audio Track",
	UPDATE_SIDECAR_CAPTION_FLAG : "Update Sidecar Caption Package",
	UPDATE_SIDECAR_CAPTION_TRACK : "Update Sidecar Caption Track",
	DELIVERY_REVISION : "Delivery Revision"
}

with (java) {
	_logger.info("Running metadata placing Population Script.");

   /**
	 * [isNullOrEmptyOrUndefined - Checks If a String is Null , Empty or  Undefined ]
	 * @param  {[Any]}  
	 * @return {Boolean} 
	 */
	function isNullOrEmptyOrUndefined(val){
		if(val!=null && val!="" && val!=undefined && typeof val!="undefined" ){
			return false;
		}else {
			return true;
		}
	}

   /**
	* Gets the value for a Data Element from short text list.
	*
	* @param      {ArrayList}  shortTextList  The short text list
	* @param      {string}  shortTextName  The short text name
	* @return     {string}  The value from short text list.
	*/
	function getValueFromShortTextList(shortTextList,shortTextName){
		var shortTextValue = "";
		if(!isNullOrEmptyOrUndefined(shortTextList) && shortTextList.size()>=1){

			for (var i = 0; i < shortTextList.size(); i++) {
				var shortText = shortTextList.get(i);
				if(!isNullOrEmptyOrUndefined(shortText) && shortText.getShortTextType()==shortTextName){
					shortTextValue = shortText.getShortText();
					break;
				}
			}
		}
		return shortTextValue;
	}

   /**
	* Gets the value for a Data Element from fulltext list.
	*
	* @param      {ArrayList}  fulltextList  The full text list
	* @param      {string}  fullTextName  The full text name
	* @return     {string}  The value from full text list.
	*/
	function getValueFromFullTextList(fullTextList,fullTextName){
		var fullTextValue = "";
		if(!isNullOrEmptyOrUndefined(fullTextList) && fullTextList.size()>=1){

			for (var i = 0; i < fullTextList.size(); i++) {
				var fullText = fullTextList.get(i);
				_logger.info(fullText.getFullTextType());
				_logger.info(fullTextName);

				if(!isNullOrEmptyOrUndefined(fullText) && fullText.getFullTextType()==fullTextName){
					fullTextValue = fullText.getFullText();
					break;
				}
			}
		}
		return fullTextValue;
	}

   /**
	* Gets the value from tag list.
	*
	* @param      {ArrayList}  tagList  The tag list
	* @param      {string}  tagName  The tag name
	* @return     {string}  The value from tag list.
	*/
	function getValueFromTagList(tagList,tagName){

		var tagValue = "";
		if(!isNullOrEmptyOrUndefined(tagList) && tagList.size()>=1){

			for (var i = 0; i < tagList.size(); i++) {
				var tag = tagList.get(i);
				if(!isNullOrEmptyOrUndefined(tag) && tag.getTagTypeName()==tagName){
					tagValue = tag.getName();
					break;
				}
			}
		}
		return tagValue;
	}

	/**
	 * Gets the multi valued tag from tag list.
	 *
	 * @param      {ArrayList}     tagList  The tag list
	 * @param      {string}     tagName  The tag name
	 * @return     {ArrayList}  The multi valued tag from tag list.
	 */
	function getMultiValuedTagFromTagList(tagList,tagName){
		var tagValueList = new ArrayList();
		if(!isNullOrEmptyOrUndefined(tagList) && tagList.size()>=1){

			for (var i = 0; i < tagList.size(); i++) {
				var tag = tagList.get(i);
					if(!isNullOrEmptyOrUndefined(tag) && tag.getTagTypeName()==tagName){
					tagValueList.add(tag.getName());
				}
			}
		}
		return getStrArr(tagValueList);
	}

	function getStrArr(tagList){
		var list = "";
		for (var i = 0; i < tagList.size(); i++) {
			if(list!="")
				list = list + ","+ tagList.get(i);
			else
				list = list + tagList.get(i);
		}
		return list;		
	}

	function getPlacing(placingIdentifier){
		var options = new PlacingOptions();
		options.addOption(SHORT_TEXT);
		options.addOption(FULL_TEXT);
		options.addOption(TAG);
		options.addOption(DESTINATION);
		var command = new Command("placing","get");
		command.addParameter("placing",createPlacingObj(placingIdentifier));
		command.addParameter("options",options);
		var jobResult = _commandHelper.runCommand(command);
		if(jobResult.getSuccess()){
			return jobResult.getOutput();
		} else {
			_logger.info("No Placing Found ");
			return null;
		}
	}

	/**
	 * [createPlacingObj]
	 * @param  {[string]} placingId 
	 * @return {[object]} placing
	 */
	function createPlacingObj(placingId){
		var placing = new Placing();
		placing.setPlacingId(placingId);
		return placing;
	}

	_logger.info("Running populate script with selection ["+_selection+"] and dataKey ["+_dataKey+"]");
	
	if(_dataKey == PLACING_ID){
		_logger.info("Populating Existing Data for Placing");

		var placingId = _selection;
		_logger.info("Placing ID is [" + placingId + "]");
		var placing = getPlacing(placingId);	
		
		if(!isNullOrEmptyOrUndefined(placing)){
			var shortTextList = placing.getShortTextList();
			var fullTextList = placing.getFullTextList();
			var currrentState = placing.getStateName();
			var deliveryRevision = parseInt(getValueFromShortTextList(shortTextList,MAPPING.DELIVERY_REVISION)) || 0;

			_formData.addDataField(DAISY_ID,getValueFromShortTextList(shortTextList,MAPPING.DAISY_ID));
	 		_formData.addDataField(SUPPLEMENTAL_DAISY_ID,getValueFromShortTextList(shortTextList,MAPPING.SUPPLEMENTAL_DAISY_ID));
			_formData.addDataField(TRAILER_DAISY_ID,getValueFromShortTextList(shortTextList,MAPPING.TRAILER_DAISY_ID));
			_formData.addDataField(DUB_CARD_DAISY_ID,getValueFromShortTextList(shortTextList,MAPPING.DUB_CARD_DAISY_ID));
	 		_formData.addDataField(BOX_ART_FILENAME,getValueFromFullTextList(fullTextList,MAPPING.BOX_ART_FILENAME));
	 		_formData.addDataField(POSTER_ART_FILENAME,getValueFromFullTextList(fullTextList,MAPPING.POSTER_ART_FILENAME));
	 		_formData.addDataField(EPISODE_ART_FILENAME,getValueFromFullTextList(fullTextList,MAPPING.EPISODE_ART_FILENAME));
	 		_formData.addDataField(SERIES_ART_FILENAME,getValueFromFullTextList(fullTextList,MAPPING.SERIES_ART_FILENAME));
	 		_formData.addDataField(SEASON_ART_FILENAME,getValueFromFullTextList(fullTextList,MAPPING.SEASON_ART_FILENAME));
	 		_formData.addDataField(TITLE_ART_FILENAME,getValueFromFullTextList(fullTextList,MAPPING.TITLE_ART_FILENAME));
	 		_formData.addDataField(HERO_ART_FILENAME,getValueFromFullTextList(fullTextList,MAPPING.HERO_ART_FILENAME));
	 		_formData.addDataField(TRAILER_ART_FILENAME,getValueFromFullTextList(fullTextList,MAPPING.TRAILER_ART_FILENAME));
	 		_formData.addDataField(PLACING_STATE,"State: '" + currrentState + "' - Delivery Revision: " + deliveryRevision);	 		
	 	}else{
	 		//Clear stuff if an invalid placing is inputted
			_formData.addDataField(DAISY_ID,"");
	 		_formData.addDataField(SUPPLEMENTAL_DAISY_ID,"");
			_formData.addDataField(TRAILER_DAISY_ID,"");
			_formData.addDataField(DUB_CARD_DAISY_ID, "");
	 		_formData.addDataField(BOX_ART_FILENAME,"");
	 		_formData.addDataField(POSTER_ART_FILENAME,"");
	 		_formData.addDataField(EPISODE_ART_FILENAME,"");
	 		_formData.addDataField(SERIES_ART_FILENAME,"");
	 		_formData.addDataField(SEASON_ART_FILENAME,"");
	 		_formData.addDataField(PLACING_STATE,"");
	 		_formData.addDataField(HERO_ART_FILENAME,"");
	 		_formData.addDataField(TITLE_ART_FILENAME,"");
	 		_formData.addDataField(TRAILER_ART_FILENAME,"");
	 	} 	
	}

	else{
		_logger.info("Completed Placing Population Script");
	}
	_logger.info("Completed Placing Population Script");
}