/*
* @Author: Mike Ayubi
* @Description: Validation Script
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
const WORKFLOW_ACTION = "WorkflowAction";

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
var VALID_UPDATE_STATES = ["Delivered","Packaging Error","Package QC Required","Package QC Referral Required",
"Transcode Error","Conform Error","Post Processing Error","Preprocessing Error","Transfer Error","Restore Error",
"Delivery Error"];
var VALID_RETRY_STATES = ["Packaging Error"];
var DELIVERED_ONCE_REQ = [UPDATE_TRAILER_FLAG,UPDATE_IMAGE_FLAG,UPDATE_METADATA_FLAG,UPDATE_SIDECAR_AUDIO_FLAG,UPDATE_SIDECAR_CAPTION_FLAG];

const SELECT_TRACK_DEFAULT = "Select track";
const SELECT_ACTION_DEFAULT = "Select action";
const DELIVERED_STATE = "Delivered";

with (java) {
	_logger.info("Running metadata placing Population Script.");

	function isValidActionState(state){
		for each(var opt in VALID_UPDATE_STATES){
			if(state == opt){
				return true;
			}
		}
		return false;
	}

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

	var isValidationError = false;
    var placingId = _formData.getValue(PLACING_ID);

    //filename elements
    var boxArtVAL = _formData.getValue(BOX_ART_FILENAME);
    var posterArtVAL = _formData.getValue(POSTER_ART_FILENAME);
    var seriesArtVAL = _formData.getValue(SERIES_ART_FILENAME);
    var seasonArtVAL = _formData.getValue(SEASON_ART_FILENAME);
    var episodeArtVAL = _formData.getValue(EPISODE_ART_FILENAME);
    var heroArtVAL = _formData.getValue(HERO_ART_FILENAME);
    var titleArtVAL = _formData.getValue(TITLE_ART_FILENAME);
    var trailerArtVAL = _formData.getValue(TRAILER_ART_FILENAME);

    var workflowAction = _formData.getValue(WORKFLOW_ACTION);
    var updateMetadataFlag = _formData.getValue(UPDATE_METADATA_FLAG).toString().toLowerCase() == 'true';
    var updateImageFlag = _formData.getValue(UPDATE_IMAGE_FLAG).toString().toLowerCase() == 'true';
    var updateTrailerFlag = _formData.getValue(UPDATE_TRAILER_FLAG).toString().toLowerCase() == 'true';

    var sidecarAudioTrackFlag = _formData.getValue(UPDATE_SIDECAR_AUDIO_FLAG).toString().toLowerCase() == 'true';
    var sidecarAudioTrackSelected = _formData.getValue(UPDATE_SIDECAR_AUDIO_TRACK);
    var sidecarCaptionTrackFlag = _formData.getValue(UPDATE_SIDECAR_CAPTION_FLAG).toString().toLowerCase() == 'true';
    var sidecarCaptionTrackSelected = _formData.getValue(UPDATE_SIDECAR_CAPTION_TRACK);

	if(isNullOrEmptyOrUndefined(placingId)){
		_validationResult.addError(PLACING_ID,"Please provide a Placing Id");
		isValidationError = true;
	}

	if((updateTrailerFlag || updateMetadataFlag || updateImageFlag || sidecarAudioTrackFlag || sidecarCaptionTrackFlag)){
		if(workflowAction != SELECT_ACTION_DEFAULT){
			_validationResult.addError(WORKFLOW_ACTION,"Cannot use Workflow Action in combination with an Update action.");
			isValidationError = true;			
		}
	}

    var patternError = "Invalid format. Filenames must be seperated by commas with and no spaces are allowed.\n (i.e) image1.jpg,image2.jpg,image3.png)";
	var objPattern = new RegExp(/^([a-zA-Z0-9@#$%!\-_?&]+\.([a-zA-Z]+)\,*){1,}$/);
	if(!isNullOrEmptyOrUndefined(boxArtVAL) && !objPattern.test(boxArtVAL)){
		_validationResult.addError(BOX_ART_FILENAME,patternError);
		isValidationError = true
	}
	if(!isNullOrEmptyOrUndefined(posterArtVAL) && !objPattern.test(posterArtVAL)){
		_validationResult.addError(POSTER_ART_FILENAME,patternError);
		isValidationError = true;
	}
	if(!isNullOrEmptyOrUndefined(seriesArtVAL) && !objPattern.test(seriesArtVAL)){
		_validationResult.addError(SERIES_ART_FILENAME,patternError);
		isValidationError = true;
	}
	if(!isNullOrEmptyOrUndefined(seasonArtVAL) && !objPattern.test(seasonArtVAL)){
		_validationResult.addError(SEASON_ART_FILENAME,patternError);
		isValidationError = true;
	}
	if(!isNullOrEmptyOrUndefined(episodeArtVAL) && !objPattern.test(episodeArtVAL)){
		_validationResult.addError(EPISODE_ART_FILENAME,patternError);
		isValidationError = true;
	}
	if(!isNullOrEmptyOrUndefined(heroArtVAL) && !objPattern.test(heroArtVAL)){
		_validationResult.addError(HERO_ART_FILENAME,patternError);
		isValidationError = true;
	}
	if(!isNullOrEmptyOrUndefined(titleArtVAL) && !objPattern.test(titleArtVAL)){
		_validationResult.addError(TITLE_ART_FILENAME,patternError);
		isValidationError = true;
	}
	if(!isNullOrEmptyOrUndefined(trailerArtVAL) && !objPattern.test(trailerArtVAL)){
		_validationResult.addError(TRAILER_ART_FILENAME,patternError);
		isValidationError = true;
	}

	if(sidecarAudioTrackFlag && sidecarAudioTrackSelected == SELECT_TRACK_DEFAULT){
		_validationResult.addError(UPDATE_SIDECAR_AUDIO_TRACK,"Please select an audio track.");
		isValidationError = true; 	
	}
	if(sidecarCaptionTrackFlag && sidecarCaptionTrackSelected == SELECT_TRACK_DEFAULT){
		_validationResult.addError(UPDATE_SIDECAR_CAPTION_TRACK,"Please select a caption track.");
		isValidationError = true; 	
	}

	if(!isNullOrEmptyOrUndefined(placingId)){
		var placing = getPlacing(placingId);
		if(!isNullOrEmptyOrUndefined(placing)){
			var shortTextList = placing.getShortTextList();
			var placingCurrentState = placing.getStateName();
			var deliveryRevision = parseInt(getValueFromShortTextList(shortTextList,MAPPING.DELIVERY_REVISION)) || 0;

			if(updateMetadataFlag || updateTrailerFlag || updateImageFlag || sidecarAudioTrackFlag || sidecarCaptionTrackFlag){
				if(!isValidActionState(placingCurrentState) || deliveryRevision <= 0){
					_validationResult.addError(PLACING_ID,"Cannot use Update action on placing as it is not in valid state or it has not been delivered once. Actionable states are  [" +VALID_UPDATE_STATES +"]");
					isValidationError = true;
				}	
			}

		}else{
			_validationResult.addError(PLACING_ID,"Placing Id does not exist.");
			isValidationError = true;			
		}
	}

    if(!isValidationError){
         _logger.info("Running Form Validation");
    }

    _logger.info("Completed Form Validation Script");
}