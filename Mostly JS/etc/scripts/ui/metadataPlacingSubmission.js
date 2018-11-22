/*
* @Author: Mike Ayubi
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
const RETRY_ACTION = "Retry";
const RESET_ACTION = "Re-Order";
const ORDER_PLACED_TRIGGER = "Order Placed";
const BEGIN_COMPILING_TRIGGER = "Begin Compiling";
const RETRY_TRIGGER = "Retry";

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
	UPDATE_SIDECAR_CAPTION_TRACK : "Update Sidecar Caption Track"
}

var placingId = _formData.getValue(PLACING_ID)
var daisyId = _formData.getValue(DAISY_ID);
var supplementalDaisyId = _formData.getValue(SUPPLEMENTAL_DAISY_ID);
var trailerDaisyId = _formData.getValue(TRAILER_DAISY_ID);
var dubCardDaisyId = _formData.getValue(DUB_CARD_DAISY_ID);
var boxArtFilenames = _formData.getValue(BOX_ART_FILENAME);
var posterArtFilenames = _formData.getValue(POSTER_ART_FILENAME);
var seriesArtFilenames = _formData.getValue(SERIES_ART_FILENAME).toString().trim();
var seasonArtFilenames = _formData.getValue(SEASON_ART_FILENAME).toString().trim();
var episodeArtFilenames = _formData.getValue(EPISODE_ART_FILENAME).toString().trim();
var heroArtFilenames = _formData.getValue(HERO_ART_FILENAME).toString().trim();
var titleArtFilenames = _formData.getValue(TITLE_ART_FILENAME).toString().trim();
var trailerArtFilenames = _formData.getValue(TRAILER_ART_FILENAME).toString().trim();

var workflowAction = _formData.getValue(WORKFLOW_ACTION);
var updateTrailerFlag = _formData.getValue(UPDATE_TRAILER_FLAG).toString().toLowerCase() == 'true';
var updateImageFlag = _formData.getValue(UPDATE_IMAGE_FLAG).toString().toLowerCase() == 'true';
var updateMetadataFlag = _formData.getValue(UPDATE_METADATA_FLAG).toString().toLowerCase() == 'true';
var updateSidecarAudioFlag = _formData.getValue(UPDATE_SIDECAR_AUDIO_FLAG).toString().toLowerCase() == 'true';
var updateSidecarCaptionFlag = _formData.getValue(UPDATE_SIDECAR_CAPTION_FLAG).toString().toLowerCase() == 'true';
var sideCarAudioTrack = _formData.getValue(UPDATE_SIDECAR_AUDIO_TRACK);
var sideCarCaptionTrack = _formData.getValue(UPDATE_SIDECAR_CAPTION_TRACK);


with (java) {

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
	* Creates a short text object.
	*
	* @param      {<string>}     shortTextName   The short text name
	* @param      {<string>}     shortTextValue  The short text value
	* @return     {object}  { ShortText Object }
	*/
	function createShortTextObj(shortTextName,shortTextValue){
		var shortText = new ShortText();
		shortText.setShortTextType(shortTextName);
		shortText.setShortText(shortTextValue);
		return shortText;
	}

   /**
	* Creates a tag object.
	*
	* @param      {<string>}  tagName   The tag name
	* @param      {<string>}  tagValue  The tag value
	* @return     {object}     { Tag Object }
	*/
	function createTagObj(tagName,tagValue){
		var tag = new Tag();
		tag.setTagTypeName(tagName);
		tag.setName(tagValue);
		return tag;
	}

   /**
	* Creates a fulltext object.
	*
	* @param      {<string>}  fullTextName   The fulltext name
	* @param      {<string>}  fullTextValue  The fulltext value
	* @return     {object}     { fulltext Object }
	*/
	function createFullTextObj(fullTextName,fullTextValue){
		var fulltext = new FullText();
		fulltext.setFullTextType(fullTextName);
		fulltext.setFullText(fullTextValue);
		return fulltext;
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

	/**
	 * [materialSave placing Save]
	 * @param  [placing] placing Object
	 * @return [placing] placing Object
	 */
	function placingSave(placing){

		var command = new Command("placing","save");
		command.addParameter("placing",placing);
	    var result = _commandHelper.runCommand(command);
		if(result.getSuccess()){
			return true;
		}
		return false;
	}

	function runWorkflowTransition(trigger,entityType,entityObject){
		var command = new Command("workflow","transition");
		var requirement = new WorkflowRequirement();
		requirement.setName(trigger);
		command.addParameter(entityType,entityObject);
		command.addParameter("requirement",requirement);
		var result = _commandHelper.runCommand(command);
        if (result && result.getSuccess() == true) {
        	return true;
        }
        return false;
    }

    function workflowReset(placing) {
        _logger.info("Performing workflow reset on [" + placingId + "]");
        var command = new Command("workflow","reset");
        command.addParameter("placing", placing);
        var result = _commandHelper.runCommand(command);
        if (result && result.getSuccess() == true) {
        	return true;
        }
        return false;
	}

	function saveMetadata(placing){

 		var shortTextList = new ShortTextList();
 		var fullTextList = new FullTextList();
 		var tagList = new TagList();

 		shortTextList.add(createShortTextObj(MAPPING.DAISY_ID,daisyId));
 		shortTextList.add(createShortTextObj(MAPPING.SUPPLEMENTAL_DAISY_ID,supplementalDaisyId));
		shortTextList.add(createShortTextObj(MAPPING.TRAILER_DAISY_ID,trailerDaisyId));
		shortTextList.add(createShortTextObj(MAPPING.DUB_CARD_DAISY_ID,dubCardDaisyId));
 		shortTextList.add(createShortTextObj(MAPPING.UPDATE_TRAILER_FLAG,updateTrailerFlag));
 		shortTextList.add(createShortTextObj(MAPPING.UPDATE_IMAGE_FLAG,updateImageFlag));
 		shortTextList.add(createShortTextObj(MAPPING.UPDATE_METADATA_FLAG,updateMetadataFlag));
 		shortTextList.add(createShortTextObj(MAPPING.UPDATE_SIDECAR_AUDIO_FLAG,updateSidecarAudioFlag));
 		shortTextList.add(createShortTextObj(MAPPING.UPDATE_SIDECAR_CAPTION_FLAG,updateSidecarCaptionFlag));
 		if(isNullOrEmptyOrUndefined(sideCarAudioTrack) || sideCarAudioTrack == "Select track"){
			shortTextList.add(createShortTextObj(MAPPING.UPDATE_SIDECAR_AUDIO_TRACK,"N/A")); 			
 		}else{
 			shortTextList.add(createShortTextObj(MAPPING.UPDATE_SIDECAR_AUDIO_TRACK,sideCarAudioTrack));						
 		}
		if(isNullOrEmptyOrUndefined(sideCarCaptionTrack) || sideCarCaptionTrack == "Select track"){
			shortTextList.add(createShortTextObj(MAPPING.UPDATE_SIDECAR_CAPTION_TRACK,"N/A")); 			
 		}else{
 			shortTextList.add(createShortTextObj(MAPPING.UPDATE_SIDECAR_CAPTION_TRACK,sideCarCaptionTrack));						
 		}
 		placing.setShortTextList(shortTextList);

 		fullTextList.add(createFullTextObj(MAPPING.BOX_ART_FILENAME,boxArtFilenames));
 		fullTextList.add(createFullTextObj(MAPPING.POSTER_ART_FILENAME,posterArtFilenames));
 		fullTextList.add(createFullTextObj(MAPPING.SERIES_ART_FILENAME,seriesArtFilenames));
  		fullTextList.add(createFullTextObj(MAPPING.SEASON_ART_FILENAME,seasonArtFilenames));
  		fullTextList.add(createFullTextObj(MAPPING.EPISODE_ART_FILENAME,episodeArtFilenames));
  		fullTextList.add(createFullTextObj(MAPPING.HERO_ART_FILENAME,heroArtFilenames));
  		fullTextList.add(createFullTextObj(MAPPING.TITLE_ART_FILENAME,titleArtFilenames));
  		fullTextList.add(createFullTextObj(MAPPING.TRAILER_ART_FILENAME,trailerArtFilenames));
 		placing.setFullTextList(fullTextList);

 		var result = placingSave(placing);
    	_logger.info("Saved metadata");

 		return result;
	}
    //
    // Start the script
    //

    _logger.info("Running Submission script...");

    if(!isNullOrEmptyOrUndefined(placingId)){
   		var placing = createPlacingObj(placingId);

    	//Always save metadata if the form fields are ok first, this happens if no checkboxes are checked.
    	var result = saveMetadata(placing);

    	// The workflow actions will take precedence over anything else if ran and exit the script, they cant be run with update actions
		if(workflowAction!= "Select action"){
			if(workflowAction == RETRY_ACTION){
				result = runWorkflowTransition(RETRY_TRIGGER, "placing", placing);
			}else if(workflowAction == RESET_ACTION){
				result = workflowReset(placing);
				result = runWorkflowTransition(ORDER_PLACED_TRIGGER, "placing", placing);
			}
		}
		else if(updateTrailerFlag || updateMetadataFlag || updateImageFlag || updateSidecarAudioFlag || updateSidecarCaptionFlag){
			result = workflowReset(placing);
			if(updateTrailerFlag || updateSidecarAudioFlag || updateSidecarCaptionFlag){
				result = runWorkflowTransition(ORDER_PLACED_TRIGGER, "placing", placing);
			}else{
				result = runWorkflowTransition(BEGIN_COMPILING_TRIGGER, "placing", placing);				
			}
		}

		if(!result){
			_result.setSuccess(false);
			_result.setOutcome("Submission of Adustment FAILED!");
		}else{
			_result.setSuccess(true);
			_result.setOutcome("Submission of Adustment [SUCCESSFUL]");
		}
 
    }

	_logger.info("Completed Submission script "+(result?"successfully":"unsuccessfully"));
}
