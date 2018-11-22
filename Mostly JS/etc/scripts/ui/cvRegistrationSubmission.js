/*
* @Author: Karthik Rengasamy
* @Description: Content Versioning Submission Script 
* @Date:   2017-03-18 11:38:25
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-06-08 15:43:32
* @Last Modified by:   Chris Filippone
* @Last Modified time: 2018-03-20 13:43:32
*/

var java = JavaImporter(
    Packages.com.pharos.core.domain,
    Packages.com.pharos.core.domain.utils,
    Packages.com.pharos.core.domain.job,
	Packages.com.pharos.core.domain.list,
	Packages.java.util.ArrayList,
	Packages.java.lang.Integer
);

//Declaring Constants - Form Data Keys

const MATERIAL_MAT_ID = "Material.MatId";
const MATERIAL_DAISY_ID = "Material.DaisyID";
const MATERIAL_SOURCE_ID = "Material.SourceID";
const MATERIAL_TITLE = "Material.Title";
const MATERIAL_CV_TYPE = "Material.ContentVersionType";
const MATERIAL_VERSION_TYPE = "Material.VersionType";
const MATERIAL_REF_TVD_PRODUCTION = "Material.OriginalTVDProduction#";
const MATERIAL_ORIGINAL_NAME= "Material.OriginalFileName";
const MATERIAL_TVD_PRODUCTION = "Material.TVDProduction#";
const MATERIAL_AUDIO_PROFILE = "Material.AudioProfile";
const MATERIAL_ASPECT_RATIO = "Material.AspectRatio";
const MATERIAL_TRANSFORMATION = "Material.Transformation";
const MATERIAL_TYPE = "Material.MaterialType";


//APPLICATION Constants
const OWNER_NBCU_GMO = "NBCU GMO";
const STATE_MACHINE_NBCU_GMO = "NBC GMO";
const STATE_ORDER_PLACED = "Order Placed";
const VIDEO_TRACK_TYPE = "Video";

//Options Constant 
const SHORT_TEXT = "shorttext";
const TAG = "tag";

const MESSAGE = "ContentVersioning.ErrorMessage";

//Form DataKey ==> Data Element Name MAPPING  

const MAPPING = {
	MATERIAL_ORIGINAL_NAME : "Original File Name",
	MATERIAL_REF_TVD_PRODUCTION : "Original TVD Production #",
	MATERIAL_TVD_PRODUCTION : "TVD Production #",
	MATERIAL_AUDIO_PROFILE : "Audio Profile",
	MATERIAL_CV_TYPE : "Content Version Type",
	DAISY_ID: "Daisy ID",
	SOURCE_ID: "Source ID"
};

with (java) {

   /**
	* [isNullOrEmptyOrUndefined - Checks If a String is Null , Empty or  Undefined ]
	* @param  {[Any]}  
	* @return {Boolean} 
	*/
    function isNullOrEmptyOrUndefined(val){
        if(val!=null && val!="" && val!=undefined && typeof val!="undefined" && val!="Please Select"){
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
	* Gets the ShortText from short text list.
	*
	* @param      {ArrayList}  shortTextList  The short text list
	* @param      {string}  shortTextName  The short text name
	* @return     ShortText Object
	*/
	function getShortTextFromShortTextList(shortTextList,shortTextName){
		var shortTextObject = "";
		if(!isNullOrEmptyOrUndefined(shortTextList) && shortTextList.size()>=1){

			for (var i = 0; i < shortTextList.size(); i++) {
				var shortText = shortTextList.get(i);
				if(!isNullOrEmptyOrUndefined(shortText) && shortText.getShortTextType()==shortTextName){
					shortTextObject = shortText;
					break;
				}
			}
		}
		return shortTextObject;
	}

  /**
	* Gets the Tag from Tag list.
	*
	* @param      {ArrayList}  tagList  tagList
	* @param      {string}  tagName  The Tag Name
	* @return     tag Object
	*/
	function getTagFromTagList(tagList,tagName){
		var tagObject = "";
		if(!isNullOrEmptyOrUndefined(tagList) && tagList.size()>=1){

			for (var i = 0; i < tagList.size(); i++) {
				var tag = tagList.get(i);
				if(!isNullOrEmptyOrUndefined(tagName) && tag.getTagTypeName()==tagName){
					tagObject = tag;
					break;
				}
			}
		}
		return tagObject;
	}

   /**
	* [materialGet - Run PharosCs Command to Get Material with Options]
	* @param  [String] matId [Material Identifier]
	* @param  [Array] String Array of Options
	* @return [Object] material  [Material Object]
	*/
    function materialGet(matId,options){
    	var materialOptions = new MaterialOptions();
    	for each (option in options){
    		materialOptions.addOption(option);
    	}

		var command = new Command("material","get");
		command.addParameter("material",createMaterialObj(matId));
		command.addParameter("options",materialOptions);
	    var jobResult = _commandHelper.runCommand(command);
		if(jobResult.getSuccess()){
			return jobResult.getOutput();
		} else {
			_logger.info("No Material Found ");
			return null;
		}
	}

	/**
	 * [materialSave Material Save]
	 * @param  [Material] Material Object
	 * @return [material] Material Object
	 */
	function materialSave(material){
    	
		var command = new Command("material","save");
		command.addParameter("material",material);
	    var jobResult = _commandHelper.runCommand(command);
		if(jobResult.getSuccess()){
			//_logger.info("Material Save Success");
			return jobResult.getOutput();
		} else {
			_logger.info("Material Save Failed");
			return null;
		}
	}

   /**
	* [createMaterialObj]
	* @param  [string] matId 
	* @return [object] material
	*/
	function createMaterialObj(matId){
		var material = new Material();
		material.setMatId(matId);
		return material;
	}

	/**
	 * [generateEntityIdentifier generate Entity Identifier]
	 * @param  [String] scriptName   
	 * @param  [String] sequenceName 
	 * @return [String]              
	 */
	function generateEntityIdentifier(scriptName,sequenceName){
		var command = new Command("tools", "generateId");
		command.addParameter("script", scriptName);
		command.addParameter("sequenceName", sequenceName);
		var result = _commandHelper.runCommand(command);
		var entityId = result.getOutput();
		return entityId;
	}

	/**
	 * List all tracks  
	 */
	function listTrackTypesInMediator() {
		//var reportName = "listTrackTypesInMediator";
		//var reportName = "listTrackTypesAndGroupsInMediator"; // Must change NAME below to TYPE_NAME
		var reportName = "listTrackTypesInMediator";
		_logger.info("Running  Report listTrackTypesInMediator");
		var command = new Command("report", "runReport");
		command.addParameter("reportName", reportName);
		command.addParameter("pageSize", new Integer(2000));
		var reportResults = _commandHelper.runCommand(command);
		if (reportResults && reportResults.getSuccess() == true) {
				_logger.info("Processing Report listTrackTypesInMediator Results");
				var results = reportResults.getOutput().getList().getList();
				var trackTypeGroups = new ArrayList();
				for (var i = 0; i < results.size(); i++) {
						var name = results.get(i).get("TYPE_NAME").toString();
						if(!isNullOrEmptyOrUndefined(name)){
							trackTypeGroups.add(name.replace(",", " @ "));
						}
				}
				return trackTypeGroups;
		}
		return null;
	}
	
	_logger.info("Running Content Versioning Submission Script ");

	var materialId = _formData.getValue(MATERIAL_MAT_ID);

    var daisyID = _formData.getValue(MATERIAL_DAISY_ID);
//  future use when form is renamed source from daisy
//	var sourceID = _formData.getValue(MATERIAL_SOURCE_ID);
	var sourceID = daisyID;
//	
	var materialTitle = _formData.getValue(MATERIAL_TITLE);

    var materialCVType = _formData.getValue(MATERIAL_CV_TYPE);

    var materialVersionType = _formData.getValue(MATERIAL_VERSION_TYPE);

    var materialAspectRatio = _formData.getValue(MATERIAL_ASPECT_RATIO);

    var materialTVDProduction = _formData.getValue(MATERIAL_TVD_PRODUCTION);

    var materialRefTVDProduction = _formData.getValue(MATERIAL_REF_TVD_PRODUCTION);

    var materialOriginalFileName = _formData.getValue(MATERIAL_ORIGINAL_NAME);

    var materialAudioProfile = _formData.getValue(MATERIAL_AUDIO_PROFILE);

    var materialTransformation = _formData.getValue(MATERIAL_TRANSFORMATION);

	var TRACK_TYPE = "";

	var TRACK_FILE = "";

	_logger.info(MATERIAL_MAT_ID + " is ["+materialId+"]");
	// keep both source and daisy while migrate to source id
	_logger.info(MATERIAL_DAISY_ID + " is ["+ daisyID+"]");
	_logger.info(MATERIAL_SOURCE_ID + " is ["+ sourceID+"]");
    _logger.info(MATERIAL_TITLE + " is ["+materialTitle+"]");
    _logger.info(MATERIAL_CV_TYPE + " is ["+materialCVType+"]");
    _logger.info(MATERIAL_VERSION_TYPE + " is ["+materialVersionType+"]");
    _logger.info(MATERIAL_ASPECT_RATIO + " is ["+materialAspectRatio+"]");
    _logger.info(MATERIAL_TVD_PRODUCTION + " is ["+materialTVDProduction+"]");
    _logger.info(MATERIAL_REF_TVD_PRODUCTION + " is ["+materialRefTVDProduction+"]");
    _logger.info(MATERIAL_ORIGINAL_NAME + " is ["+materialOriginalFileName+"]");
    _logger.info(MATERIAL_AUDIO_PROFILE + " is ["+materialAudioProfile+"]");
    _logger.info(MATERIAL_TRANSFORMATION + " is ["+materialTransformation+"]");

 	if(isNullOrEmptyOrUndefined(materialId)){
		//NEW MATERIAL REGISTRATION
 		var materialId = generateEntityIdentifier("cv_material_generator","FREE_SEQUENCE_06");
 		var material = createMaterialObj(materialId);
		var trackTypeLinkList = new ArrayList();

		// Use MatId if Daisy ID is not populated

		if (isNullOrEmptyOrUndefined(daisyID)) {
			daisyID = materialId;
			_logger.info(MATERIAL_DAISY_ID + " is copying from MatId and is now: [" + materialId+ "]" );
		}
		// use both until migrate to source
		if (isNullOrEmptyOrUndefined(sourceID)) {
			sourceID = materialId;
			_logger.info(MATERIAL_SOURCE_ID + " is copying from MatId and is now: [" + materialId+ "]" );
		}
		//
		var vtrackTypeLink = new TrackTypeLinkDefault();
		var shortTextList = new ShortTextList();
		var ttlShortTextList = new ShortTextList();
		var tagList = new TagList();
		//

		var trackTypeLink = new TrackTypeLinkDefault();

		for (var i = 1; i < 6; i++) {
			var trackTypeLink = new TrackTypeLinkDefault();
			var ttlShortTextList = new ShortTextList();
			var uiTRACK_TYPE = "Material.TrackType" + i.toString() ;
			var uiTRACK_FILE = "Material.TrackType" + i.toString()  + '.Filename' ; 
			var TRACK_TYPE = _formData.getValue(uiTRACK_TYPE);
			var TRACK_FILE = _formData.getValue(uiTRACK_FILE);

			if (!isNullOrEmptyOrUndefined(TRACK_TYPE) ){	
				trackTypeLink.setTrackTypeName(TRACK_TYPE);
				trackTypeLink.setStateMachineName(STATE_MACHINE_NBCU_GMO);
				trackTypeLink.setStateName(STATE_ORDER_PLACED);
				if (!isNullOrEmptyOrUndefined(TRACK_FILE) ){
					ttlShortTextList.add(createShortTextObj(MAPPING.MATERIAL_ORIGINAL_NAME,TRACK_FILE));
					trackTypeLink.setShortTextList(ttlShortTextList);
				}
				trackTypeLinkList.add(trackTypeLink);
			}
		}
		var owner = new Owner(OWNER_NBCU_GMO)
		// add video last to be first 
		//
		vtrackTypeLink.setTrackTypeName(VIDEO_TRACK_TYPE);
		vtrackTypeLink.setStateMachineName(STATE_MACHINE_NBCU_GMO);
		vtrackTypeLink.setStateName(STATE_ORDER_PLACED);
		ttlShortTextList.add(createShortTextObj(MAPPING.MATERIAL_ORIGINAL_NAME,materialOriginalFileName));
		vtrackTypeLink.setShortTextList(ttlShortTextList);
		trackTypeLinkList.add(vtrackTypeLink);
		// use source id as well until migrate t source
		shortTextList.add(createShortTextObj(MAPPING.SOURCE_ID,sourceID));
		shortTextList.add(createShortTextObj(MAPPING.DAISY_ID,daisyID));
		//
 		shortTextList.add(createShortTextObj(MAPPING.MATERIAL_TVD_PRODUCTION,materialTVDProduction));
 		shortTextList.add(createShortTextObj(MAPPING.MATERIAL_REF_TVD_PRODUCTION,materialRefTVDProduction));
 		shortTextList.add(createShortTextObj(MAPPING.MATERIAL_ORIGINAL_NAME,materialOriginalFileName));
 		shortTextList.add(createShortTextObj(MAPPING.MATERIAL_AUDIO_PROFILE,materialAudioProfile));
 		tagList.add(createTagObj(MAPPING.MATERIAL_CV_TYPE,materialCVType));

 		material.setTitle(materialTitle);
 		material.setSubTitle(materialTitle);
		material.setVersionType(materialVersionType);
		material.setAspectRatioName(materialAspectRatio);
 		material.addOwner(owner);
 		material.setShortTextList(shortTextList);
 		material.setTagList(tagList);
 		material.setTrackTypeLinks(trackTypeLinkList);
 		material.setMaterialType("Feature");
 		material.setTransformationName(materialTransformation);

		_logger.info(MATERIAL_DAISY_ID + " is currently showing up as: ["+ daisyID+"]");
		_logger.info(MATERIAL_SOURCE_ID + " is currently showing up as: ["+ sourceID+"]");

 		var result = materialSave(material);

		//
		// Technically this should be 
		// 	if(isNullOrEmptyOrUndefined(result)){
		// But that breaks form.  TODO replace with shellfun.js materialSave
		//

 		if(isNullOrEmptyOrUndefined(material)){
 			_result.setSuccess(false);
            _result.setOutcome("Material Registration Failed");
 		}else{
 			_result.setSuccess(true);
            _result.setOutcome("Material Registration is Successful. Material Id is ["+materialId+"]");
 		}

 	}else{
		//MATERIAL UPDATE 
		var options = [SHORT_TEXT,TAG];
		//var options = [SHORT_TEXT,TAG];
		var material = materialGet(materialId,options);
		var shortTextList = new ShortTextList();
		var tagList = new TagList();
		var ttlShortTextList = new ShortTextList();
		
		if(!isNullOrEmptyOrUndefined(material)){

			material.setTitle(materialTitle);
 			material.setSubTitle(materialTitle);
			material.setVersionType(materialVersionType);
			material.setAspectRatioName(materialAspectRatio);
			material.setMaterialType("Feature");
			material.setTransformationName(materialTransformation);
			// 
			var trackTypeLinkList = new ArrayList();
			// master
			var trackTypeLink = new TrackTypeLinkDefault();
			var ttlShortTextList = new ShortTextList();
	 		trackTypeLink.setTrackTypeName(VIDEO_TRACK_TYPE);
	 		trackTypeLink.setStateMachineName(STATE_MACHINE_NBCU_GMO);
	 		trackTypeLink.setStateName(STATE_ORDER_PLACED);
	 		ttlShortTextList.add(createShortTextObj(MAPPING.MATERIAL_ORIGINAL_NAME,materialOriginalFileName));
	 		trackTypeLink.setShortTextList(ttlShortTextList);
	 		trackTypeLinkList.add(trackTypeLink);

			var matShortTextList = material.getShortTextList();
			var matTagList = material.getTagList();
	
			var tvdShortText = getShortTextFromShortTextList(matShortTextList,MAPPING.MATERIAL_TVD_PRODUCTION);
			if (!isNullOrEmptyOrUndefined(tvdShortText)){
				tvdShortText.setShortText(materialTVDProduction);
				shortTextList.add(tvdShortText);
			} else {
				shortTextList.add(createShortTextObj(MAPPING.MATERIAL_TVD_PRODUCTION,materialTVDProduction));
			}
			
			var refTVDShortText = getShortTextFromShortTextList(matShortTextList,MAPPING.MATERIAL_REF_TVD_PRODUCTION);
			if (!isNullOrEmptyOrUndefined(refTVDShortText)){
				refTVDShortText.setShortText(materialRefTVDProduction);
				shortTextList.add(refTVDShortText);
			} else {
				shortTextList.add(createShortTextObj(MAPPING.MATERIAL_REF_TVD_PRODUCTION,materialRefTVDProduction)); 
			}

			var orgFileNameShortText = getShortTextFromShortTextList(matShortTextList,MAPPING.MATERIAL_ORIGINAL_NAME);
			if (!isNullOrEmptyOrUndefined(orgFileNameShortText)){
				orgFileNameShortText.setShortText(materialOriginalFileName);
				shortTextList.add(orgFileNameShortText);
			} else {
				shortTextList.add(createShortTextObj(MAPPING.MATERIAL_ORIGINAL_NAME,materialOriginalFileName));
			}
		
			var audioProfileShortText = getShortTextFromShortTextList(matShortTextList,MAPPING.MATERIAL_AUDIO_PROFILE);
			if (!isNullOrEmptyOrUndefined(audioProfileShortText)){
				audioProfileShortText.setShortText(materialAudioProfile);
				shortTextList.add(audioProfileShortText);
			} else {
				shortTextList.add(createShortTextObj(MAPPING.MATERIAL_AUDIO_PROFILE,materialAudioProfile));
			}
			// use source id as well until migrate t source
			shortTextList.add(createShortTextObj(MAPPING.SOURCE_ID,sourceID));
			shortTextList.add(createShortTextObj(MAPPING.DAISY_ID,daisyID));

			var tag = getTagFromTagList(matTagList,MAPPING.MATERIAL_CV_TYPE);
			if (!isNullOrEmptyOrUndefined(tag) && matTagList.size() >  0 ) {
				tag.setName(materialCVType);
				tagList.add(tag);
			} else {

				tagList.add(createTagObj(MAPPING.MATERIAL_CV_TYPE,tag));
			}

			for (var i = 1; i < 6; i++) {
				var trackTypeLink = new TrackTypeLinkDefault();
				var ttlShortTextList = new ShortTextList();
				var uiTRACK_TYPE = "Material.TrackType" + i.toString() ;
				var uiTRACK_FILE = "Material.TrackType" + i.toString()  + '.Filename' ; 
				var TRACK_TYPE = _formData.getValue(uiTRACK_TYPE);
				var TRACK_FILE = _formData.getValue(uiTRACK_FILE);
	
				if (!isNullOrEmptyOrUndefined(TRACK_TYPE) ){	
					trackTypeLink.setTrackTypeName(TRACK_TYPE);
					trackTypeLink.setStateMachineName(STATE_MACHINE_NBCU_GMO);
					trackTypeLink.setStateName(STATE_ORDER_PLACED);
					if (!isNullOrEmptyOrUndefined(TRACK_FILE) ){
						ttlShortTextList.add(createShortTextObj(MAPPING.MATERIAL_ORIGINAL_NAME,TRACK_FILE));
						trackTypeLink.setShortTextList(ttlShortTextList);
					}
					trackTypeLinkList.add(trackTypeLink);
				}
			}

			material.setShortTextList(shortTextList);
 			material.setTagList(tagList);
 			material.setTrackTypeLinks(trackTypeLinkList);

			var result = materialSave(material);

			// this code should read 
			// if(isNullOrEmptyOrUndefined(result)){
			// but changing code breaks functionality as result is NULL 
			// TODO : change to use shellfun.js materialSave 

			if(isNullOrEmptyOrUndefined(material)){
				_result.setSuccess(false);
				_result.setOutcome("Material Update Failed");
			}else{
				_result.setSuccess(true);
				_result.setOutcome("Material Update is Successful");
			}
			
		}else{
			//Shouldnt Have Come This far - Validation Script should have Failed it 
			_result.setSuccess(false);
            _result.setOutcome("Material Registration Failed. Unable to find Material for Update");
		}
 	}

    _logger.info("Completed Content Versioning Submission Script ");
}