/*
* @Author: Karthik Rengasamy
* @Description: Territory Master Registration Submission Script 
* @Date:   2017-03-18 11:38:25
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-05-31 00:07:16
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
const MATERIAL_TITLE = "Material.Title";
const MATERIAL_INSERT_TYPE = "Material.InsertType";
const MATERIAL_ORIGINAL_NAME= "Material.OriginalFileName";
const MATERIAL_TVD_PRODUCTION = "Material.TVDProduction#";
const MATERIAL_AUDIO_PROFILE = "Material.AudioProfile";
const MATERIAL_ASPECT_RATIO = "Material.AspectRatio";
const MATERIAL_PRIMARY_LANGUAGE = "Material.PrimaryLanguage";


//APPLICATION Constants
const OWNER_NBCU_GMO = "NBCU GMO";
const STATE_MACHINE_NBCU_GMO = "NBC GMO";
const STATE_ORDER_PLACED = "Order Placed";
const VIDEO_TRACK_TYPE = "Video";

//Options Constant 
const SHORT_TEXT = "shorttext";
const TAG = "tag";

const MESSAGE = "TerritoryMaster.ErrorMessage";


//Form DataKey ==> Data Element Name MAPPING  

const MAPPING = {
	MATERIAL_ORIGINAL_NAME : "Original File Name",
	MATERIAL_TVD_PRODUCTION : "TVD Production #",
	MATERIAL_AUDIO_PROFILE : "Audio Profile",
	MATERIAL_PRIMARY_LANGUAGE : "Primary Language"
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

	_logger.info("Running Territory Master Registration Submission Script ");

	var materialId = _formData.getValue(MATERIAL_MAT_ID);

	var materialTitle = _formData.getValue(MATERIAL_TITLE);

    var materialInsertType = _formData.getValue(MATERIAL_INSERT_TYPE);

    var materialAspectRatio = _formData.getValue(MATERIAL_ASPECT_RATIO);

    var materialTVDProduction = _formData.getValue(MATERIAL_TVD_PRODUCTION);

    var materialOriginalFileName = _formData.getValue(MATERIAL_ORIGINAL_NAME);

    var materialAudioProfile = _formData.getValue(MATERIAL_AUDIO_PROFILE);

    var materialPrimaryLanguage = _formData.getValue(MATERIAL_PRIMARY_LANGUAGE);


    _logger.info(MATERIAL_MAT_ID + " is ["+materialId+"]");
    _logger.info(MATERIAL_TITLE + " is ["+materialTitle+"]");
    _logger.info(MATERIAL_INSERT_TYPE + " is ["+materialInsertType+"]");
    _logger.info(MATERIAL_ASPECT_RATIO + " is ["+materialAspectRatio+"]");
    _logger.info(MATERIAL_TVD_PRODUCTION + " is ["+materialTVDProduction+"]");
    _logger.info(MATERIAL_ORIGINAL_NAME + " is ["+materialOriginalFileName+"]");
    _logger.info(MATERIAL_AUDIO_PROFILE + " is ["+materialAudioProfile+"]");
    _logger.info(MATERIAL_PRIMARY_LANGUAGE + " is ["+materialPrimaryLanguage+"]");

    var materialVersionType = "";
    if(!isNullOrEmptyOrUndefined(materialInsertType)){
    	if(materialInsertType.startsWith("Picture")){
    		materialVersionType = "PI-FTEXTED";
    	}else{
    		materialVersionType = "FN-FTEXTED";
    	}
    }

 	if(isNullOrEmptyOrUndefined(materialId)){
		//NEW MATERIAL REGISTRATION
 		var materialId = generateEntityIdentifier("material_generator","FREE_SEQUENCE_01");
 		var material = createMaterialObj(materialId);
 		
 		var shortTextList = new ShortTextList();
 		var ttlShortTextList = new ShortTextList();
 		var tagList = new TagList();

 		var owner = new Owner(OWNER_NBCU_GMO)
 		
 		var trackTypeLinkList = new ArrayList();
 		var trackTypeLink = new TrackTypeLinkDefault();
 		trackTypeLink.setTrackTypeName(VIDEO_TRACK_TYPE);
 		trackTypeLink.setStateMachineName(STATE_MACHINE_NBCU_GMO);
 		trackTypeLink.setStateName(STATE_ORDER_PLACED);
 		ttlShortTextList.add(createShortTextObj(MAPPING.MATERIAL_ORIGINAL_NAME,materialOriginalFileName));
 		trackTypeLink.setShortTextList(ttlShortTextList);
 		trackTypeLinkList.add(trackTypeLink);

 		shortTextList.add(createShortTextObj(MAPPING.MATERIAL_TVD_PRODUCTION,materialTVDProduction));
 		shortTextList.add(createShortTextObj(MAPPING.MATERIAL_ORIGINAL_NAME,materialOriginalFileName));
 		shortTextList.add(createShortTextObj(MAPPING.MATERIAL_AUDIO_PROFILE,materialAudioProfile));
 		tagList.add(createTagObj(MAPPING.MATERIAL_PRIMARY_LANGUAGE,materialPrimaryLanguage));
 	
 		material.setTitle(materialTitle);
 		material.setSubTitle(materialTitle);
		material.setVersionType(materialVersionType);
		material.setAspectRatioName(materialAspectRatio);
 		material.addOwner(owner);
 		material.setShortTextList(shortTextList);
 		material.setTagList(tagList);
 		material.setTrackTypeLinks(trackTypeLinkList);

 		var result = materialSave(material);

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
		var material = materialGet(materialId,options);
		var shortTextList = new ShortTextList();
		var tagList = new TagList();
		var ttlShortTextList = new ShortTextList();
		if(!isNullOrEmptyOrUndefined(material)){
			material.setTitle(materialTitle);
 			material.setSubTitle(materialTitle);
			material.setVersionType(materialVersionType);
			material.setAspectRatioName(materialAspectRatio);

			var trackTypeLinkList = new ArrayList();
	 		var trackTypeLink = new TrackTypeLinkDefault();
	 		trackTypeLink.setTrackTypeName(VIDEO_TRACK_TYPE);
	 		trackTypeLink.setStateMachineName(STATE_MACHINE_NBCU_GMO);
	 		trackTypeLink.setStateName(STATE_ORDER_PLACED);
	 		ttlShortTextList.add(createShortTextObj(MAPPING.MATERIAL_ORIGINAL_NAME,materialOriginalFileName));
	 		trackTypeLink.setShortTextList(ttlShortTextList);
	 		trackTypeLinkList.add(trackTypeLink);
			
			var matShortTextList = material.getShortTextList();
			var matTagList = material.getTagList();
			
			var tvdShortText = getShortTextFromShortTextList(matShortTextList,MAPPING.MATERIAL_TVD_PRODUCTION);
			tvdShortText.setShortText(materialTVDProduction);
			shortTextList.add(tvdShortText);
			
			var orgFileNameShortText = getShortTextFromShortTextList(matShortTextList,MAPPING.MATERIAL_ORIGINAL_NAME);
			orgFileNameShortText.setShortText(materialOriginalFileName);
			shortTextList.add(orgFileNameShortText);
			
			var audioProfileShortText = getShortTextFromShortTextList(matShortTextList,MAPPING.MATERIAL_AUDIO_PROFILE);
			audioProfileShortText.setShortText(materialAudioProfile);
			shortTextList.add(audioProfileShortText);
			
			var tag = getTagFromTagList(matTagList,MAPPING.MATERIAL_PRIMARY_LANGUAGE);
			tag.setName(materialPrimaryLanguage);
			tagList.add(tag);

			material.setTrackTypeLinks(trackTypeLinkList);
			material.setShortTextList(shortTextList);
 			material.setTagList(tagList);

			var result = materialSave(material);

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

    _logger.info("Completed Territory Master Registration Submission Script ");
}