/*
* @Author: Karthik Rengasamy
* @Description: Territory Master Registration Population Script
* @Date:   2017-03-18 11:38:25
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-05-30 23:21:26
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
const MATERIAL_INSERT_TYPE = "Material.InsertType";
const MATERIAL_ORIGINAL_NAME= "Material.OriginalFileName";
const MATERIAL_TVD_PRODUCTION = "Material.TVDProduction#";
const MATERIAL_AUDIO_PROFILE = "Material.AudioProfile";
const MATERIAL_ASPECT_RATIO = "Material.AspectRatio";
const MATERIAL_PRIMARY_LANGUAGE = "Material.PrimaryLanguage";


const MESSAGE = "TerritoryMaster.ErrorMessage";

//Options Constant 
const SHORT_TEXT = "shorttext";
const TAG = "tag";


//Form DataKey ==> Data Element Name MAPPING  
const MAPPING = {
	MATERIAL_ORIGINAL_NAME : "Original File Name",
	MATERIAL_TVD_PRODUCTION : "TVD Production #",
	MATERIAL_AUDIO_PROFILE : "Audio Profile",
	MATERIAL_PRIMARY_LANGUAGE : "Primary Language"
};

with (java) {
	  _logger.info("Running Territory Master Registration Population Script");

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
	* [listAudioProfiles  List Audio Profiles]
	* @return [List] List of Strings Audio Profiles
	*/
	function listAudioProfiles(){
		var reportName = "listAudioProfilesInMediator";
		var command = new Command("report","runReport");
		command.addParameter("reportName", reportName);
		command.addParameter("pageSize", new Integer(2000));
		var reportResults = _commandHelper.runCommand(command);
		if(reportResults && reportResults.getSuccess() == true){
			_logger.info("Processing Report Results");
			var results = reportResults.getOutput().getList().getList();
			var audioProfiles = new ArrayList();
			for (var i = 0; i < results.size(); i++) {
				var name = results.get(i).get("AUDIO_PROFILE_NAME");
				if(!isNullOrEmptyOrUndefined(name)){
					audioProfiles.add(name);
				}
			}
			return audioProfiles;
		}
		return null;
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
	
	var audioProfiles = listAudioProfiles();
	var audioProfileList = new ArrayList();

	audioProfileList.add("Please Select");
	if(!isNullOrEmptyOrUndefined(audioProfiles)){
		audioProfileList.addAll(audioProfiles)
	}

	if(_dataKey == MATERIAL_MAT_ID && !isNullOrEmptyOrUndefined(_selection)){
			_logger.info("Material Edit - Populating Existing Data for Material");

			var materialId = _selection;
			var options = [SHORT_TEXT,TAG];
			var material = materialGet(materialId,options);

		if(!isNullOrEmptyOrUndefined(material)){

			var shortTextList = material.getShortTextList();
			var tagList = material.getTagList();

			_formData.addDataField(MATERIAL_TITLE,material.getTitle());
			_formData.addDataField(MATERIAL_ASPECT_RATIO,material.getAspectRatioName());
			var insertType = "Please Select";
			
			if(!isNullOrEmptyOrUndefined(material.getVersionType())){
				if(material.getVersionType().startsWith("PI")){
					insertType = "Picture Inserts";
				}else if(material.getVersionType().startsWith("FN")){
					insertType = "Forced Narrative";
				}
			}

			_formData.addDataField(MATERIAL_INSERT_TYPE,insertType);
			
	 		_formData.addDataField(MATERIAL_TVD_PRODUCTION,getValueFromShortTextList(shortTextList,MAPPING.MATERIAL_TVD_PRODUCTION));
	 		_formData.addDataField(MATERIAL_ORIGINAL_NAME,getValueFromShortTextList(shortTextList,MAPPING.MATERIAL_ORIGINAL_NAME));

	 		var audioProfile = getValueFromShortTextList(shortTextList,MAPPING.MATERIAL_AUDIO_PROFILE);
	 		audioProfileList.remove(audioProfile);
	 		audioProfileList.add(0,audioProfile);
	 		_formData.addDataField(MATERIAL_AUDIO_PROFILE,audioProfileList.toArray().join());

	 		var materialPrimaryLanguage = getValueFromTagList(tagList,MAPPING.MATERIAL_PRIMARY_LANGUAGE);
 			_formData.addDataField(MATERIAL_PRIMARY_LANGUAGE,materialPrimaryLanguage);
 		}

	}else{
		_formData.addDataField(MATERIAL_INSERT_TYPE,"Please Select");
		_formData.addDataField(MATERIAL_ASPECT_RATIO,"Unknown");
	}
	
	_logger.info("Completed Territory Master Registration Population Script");
}