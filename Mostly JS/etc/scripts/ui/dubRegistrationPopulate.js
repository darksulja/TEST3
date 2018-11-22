/*
* @Author: Karthik Rengasamy
* @Description: Dub Cards Population Script
* @Date:   2017-03-18 11:38:25
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-07-10 11:31:44
*/

var java = JavaImporter(
	Packages.java.util.ArrayList,
	Packages.com.pharos.core.domain,
	Packages.com.pharos.core.domain.utils,
	Packages.com.pharos.core.domain.job,
	Packages.com.pharos.core.domain.list,
	Packages.com.pharos.core.domain.reports,
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

const MESSAGE = "DubCards.ErrorMessage";

//Options Constant 
const SHORT_TEXT = "shorttext";
const TAG = "tag";

//Form DataKey ==> Data Element Name MAPPING  
const MAPPING = {
	MATERIAL_TVD_PRODUCTION : "TVD Production #",
	MATERIAL_TERRITORY_SUB_TYPE : "Territory Sub-Type",
	MATERIAL_SEQUENCE : "Sequence"
};

with (java) {
	  _logger.info("Running Dub Card Registration Population Script");

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
	 * [getTagValues - List of Values Associated to a Tag]
	 * @param  [String] tagType [Tag Name]
	 * @return [ArrayLits] [Tag Values]
	 */
	function getTagValues(tagType){

		var command = new Command("tag","search");
		command.addParameter("tagType",tagType);
		var commandResult = _commandHelper.runCommand(command);
		if(commandResult.getSuccess()){
			var tagValueList = new ArrayList();
			var tagList = commandResult.getOutput();
			if(!isNullOrEmptyOrUndefined(tagList)){
				for (var i = 0; i < tagList.size(); i++) {
					var tag = tagList.get(i);
					if(!isNullOrEmptyOrUndefined(tag)){
						tagValueList.add(tag.getName());
					}
				}
				return 	tagValueList;
			}else {
				return null;
			}
		} else {
			_logger.info("No Results for Tag Type ["+tagType+"] Search");
			return null;
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

	_logger.info("Running populate script with selection ["+_selection+"] and dataKey ["+_dataKey+"]");
	
	if(_dataKey == MATERIAL_MAT_ID && !isNullOrEmptyOrUndefined(_selection)){
		_logger.info("Material Edit - Populating Existing Data for Material");

		var materialId = _selection;
		var options = [SHORT_TEXT,TAG];
		var material = materialGet(materialId,options);
		if(!isNullOrEmptyOrUndefined(material)){
			var shortTextList = material.getShortTextList();
			var tagList = material.getTagList();
			
			_formData.addDataField(MATERIAL_TITLE,material.getTitle());
			_formData.addDataField(MATERIAL_TVD_PRODUCTION,getValueFromShortTextList(shortTextList,MAPPING.MATERIAL_TVD_PRODUCTION));
			_formData.addDataField(MATERIAL_ASPECT_RATIO,material.getAspectRatioName());
			_formData.addDataField(MATERIAL_TRANSFORMATION,material.getTransformationName());
			_formData.addDataField(MATERIAL_VERSION_TYPE,material.getVersionType());
	 		_formData.addDataField(MATERIAL_TYPE,material.getMaterialType());
	 		_formData.addDataField(MATERIAL_SEQUENCE,getValueFromTagList(tagList,MAPPING.MATERIAL_TERRITORY_SUB_TYPE));
	 		_formData.addDataField(MATERIAL_SEQUENCE,getValueFromShortTextList(shortTextList,MAPPING.MATERIAL_SEQUENCE));

	 	}
	 	
	}else{
		_formData.addDataField(MATERIAL_ASPECT_RATIO,"Unknown");
	}
	
	_logger.info("Completed Dub Card Registration Population Script");
}