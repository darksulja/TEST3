/*
* @Author: Karthik Rengasamy
* @Description: DubCards Submission Script
* @Date:   2017-03-18 11:38:25
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-07-10 19:08:22
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
const MATERIAL_TVD_PRODUCTION = "Material.TVDProduction#";
const MATERIAL_ASPECT_RATIO = "Material.AspectRatio";
const MATERIAL_TRANSFORMATION = "Material.Transformation";
const MATERIAL_VERSION_TYPE = "Material.VersionType";
const MATERIAL_TYPE = "Material.MaterialType";
const MATERIAL_TERRITORY_SUB_TYPE = "Material.TerritorySubType";
const MATERIAL_SEQUENCE = "Material.Sequence";
const MATERIAL_DUB_CARD_FILENAME = "Material.DubCardFilename";

//APPLICATION Constants
const OWNER_NBCU_GMO = "NBCU GMO";
const STATE_MACHINE_NBCU_GMO = "NBC GMO";
const STATE_ORDER_PLACED = "Order Placed";
const GRAPHIC_TRACK_TYPE = "Graphic";

//Options Constant
const SHORT_TEXT = "shorttext";
const TAG = "tag";

const MESSAGE = "DubCards.ErrorMessage";


//Form DataKey ==> Data Element Name MAPPING

const MAPPING = {
  MATERIAL_TVD_PRODUCTION : "TVD Production #",
  MATERIAL_TERRITORY_SUB_TYPE : "Territory Sub-Type",
  MATERIAL_SEQUENCE : "Sequence",
  MATERIAL_DUB_CARD_FILENAME : "Dub Card Filename"
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

	_logger.info("Running Dub Card Registration Submission Script ");

	var materialId = _formData.getValue(MATERIAL_MAT_ID);

	var materialTitle = _formData.getValue(MATERIAL_TITLE);

	var materialTVDProduction = _formData.getValue(MATERIAL_TVD_PRODUCTION);

	var materialAspectRatio = _formData.getValue(MATERIAL_ASPECT_RATIO);

	var materialTransformation = _formData.getValue(MATERIAL_TRANSFORMATION);

    var materialVersionType = _formData.getValue(MATERIAL_VERSION_TYPE);

    var materialType = _formData.getValue(MATERIAL_TYPE);

    var materialTerritorySubType = _formData.getValue(MATERIAL_TERRITORY_SUB_TYPE);

    var materialSequence = _formData.getValue(MATERIAL_SEQUENCE);

    var dubCardFile = _formData.getValue(MATERIAL_DUB_CARD_FILENAME);

    var isSubmitJob = false;

    _logger.info(MATERIAL_MAT_ID + " is ["+materialId+"]");
    _logger.info(MATERIAL_TITLE + " is ["+materialTitle+"]");
    _logger.info(MATERIAL_TVD_PRODUCTION + " is ["+materialTVDProduction+"]");
    _logger.info(MATERIAL_ASPECT_RATIO + " is ["+materialAspectRatio+"]");
    _logger.info(MATERIAL_TRANSFORMATION + " is ["+materialTransformation+"]");
    _logger.info(MATERIAL_VERSION_TYPE + " is ["+materialVersionType+"]");
    _logger.info(MATERIAL_TYPE + " is ["+materialType+"]");
    _logger.info(MATERIAL_TERRITORY_SUB_TYPE + " is ["+materialTerritorySubType+"]");
    _logger.info(MATERIAL_SEQUENCE + " is ["+materialSequence+"]");
    _logger.info(MATERIAL_DUB_CARD_FILENAME + " is ["+dubCardFile+"]");


 	if(isNullOrEmptyOrUndefined(materialId)){
		//NEW MATERIAL REGISTRATION
 		var materialId = generateEntityIdentifier("material_generator","FREE_SEQUENCE_01");
 		var material = createMaterialObj(materialId);

 		var shortTextList = new ShortTextList();
 		var tagList = new TagList();

 		var owner = new Owner(OWNER_NBCU_GMO)

 		var trackTypeLinkList = new ArrayList();
 		var trackTypeLink = new TrackTypeLinkDefault();
 		trackTypeLink.setTrackTypeName(GRAPHIC_TRACK_TYPE);
 		trackTypeLink.setStateMachineName(STATE_MACHINE_NBCU_GMO);
 		trackTypeLink.setStateName(STATE_ORDER_PLACED);
 		trackTypeLinkList.add(trackTypeLink);

 		shortTextList.add(createShortTextObj(MAPPING.MATERIAL_TVD_PRODUCTION,materialTVDProduction));
 		shortTextList.add(createShortTextObj(MAPPING.MATERIAL_SEQUENCE,materialSequence));
  		shortTextList.add(createShortTextObj(MAPPING.MATERIAL_DUB_CARD_FILENAME,dubCardFile));

 		tagList.add(createTagObj(MAPPING.MATERIAL_TERRITORY_SUB_TYPE,materialTerritorySubType));

 		material.setTitle(materialTitle);
 		material.setSubTitle(materialTitle);
		material.setVersionType(materialVersionType);
		material.setAspectRatioName(materialAspectRatio);
 		material.addOwner(owner);
 		material.setShortTextList(shortTextList);
 		material.setTagList(tagList);
 		material.setTrackTypeLinks(trackTypeLinkList);
 		material.setMaterialType(materialType);
 		material.setTransformationName(materialTransformation);

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
			material.setAspectRatioId(null);
			material.setMaterialType(materialType);
			material.setTransformationName(materialTransformation);

			var trackTypeLinkList = new ArrayList();
	 		var trackTypeLink = new TrackTypeLinkDefault();
	 		trackTypeLink.setTrackTypeName(GRAPHIC_TRACK_TYPE);
	 		trackTypeLink.setStateMachineName(STATE_MACHINE_NBCU_GMO);
	 		trackTypeLink.setStateName(STATE_ORDER_PLACED);
	 		trackTypeLinkList.add(trackTypeLink);

			var matShortTextList = material.getShortTextList();
			var matTagList = material.getTagList();

			var tvdShortText = getShortTextFromShortTextList(matShortTextList,MAPPING.MATERIAL_TVD_PRODUCTION);
			if (!isNullOrEmptyOrUndefined(tvdShortText)){
				tvdShortText.setShortText(tvdShortText);
				shortTextList.add(tvdShortText);
			} else {
				shortTextList.add(createShortTextObj(MAPPING.MATERIAL_TVD_PRODUCTION,materialTVDProduction));
			}

			var materialSequenceShortText = getShortTextFromShortTextList(matShortTextList,MAPPING.MATERIAL_SEQUENCE);
			if (!isNullOrEmptyOrUndefined(materialSequenceShortText)){
				materialSequenceShortText.setShortText(materialSequence);
				shortTextList.add(materialSequenceShortText);
			} else {
				shortTextList.add(createShortTextObj(MAPPING.MATERIAL_SEQUENCE,materialSequence));
			}

			var materialDubCardFileShortText = getShortTextFromShortTextList(matShortTextList,MAPPING.MATERIAL_DUB_CARD_FILENAME);
			if (!isNullOrEmptyOrUndefined(materialDubCardFileShortText)){
				materialDubCardFileShortText.setShortText(dubCardFile);
				shortTextList.add(materialDubCardFileShortText);
			} else {
				shortTextList.add(createShortTextObj(MAPPING.MATERIAL_DUB_CARD_FILENAME,dubCardFile));
			}

			var tag = getTagFromTagList(matTagList,MAPPING.MATERIAL_TERRITORY_SUB_TYPE);
			if (!isNullOrEmptyOrUndefined(tag) && matTagList.size() >  0 ) {
				tag.setName(materialTerritorySubType);
				tagList.add(tag);
			} else {
				tagList.add(createTagObj(MAPPING.MATERIAL_TERRITORY_SUB_TYPE,materialTerritorySubType));
			}

			material.setShortTextList(shortTextList);
 			material.setTagList(tagList);
 			material.setTrackTypeLinks(trackTypeLinkList);

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

  _logger.info("Completed DubCard Registration Submission Script ");
}
