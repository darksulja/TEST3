/*
* @Author: Chris Filippone
* @Description: Metadata Review Metadata ui script copied from Content Versioning Population Script
* @Date:   2018-02-09 12:38:25
* @Last Modified by:   
* @Last Modified time: 
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

const MATERIAL_AUDIO_PROFILE = "Material.AudioProfile";
const MATERIAL_MAT_ID = "Material.MatId";
const MESSAGE = "metadataReviewMetaData.ErrorMessage";

//Options Constant 
const SHORT_TEXT = "shorttext";
const TAG = "tag";

//Form DataKey ==> Data Element Name MAPPING  
const MAPPING = {
	MATERIAL_ORIGINAL_NAME : "Original File Name",
	MATERIAL_REF_TVD_PRODUCTION : "Original TVD Production #",
	MATERIAL_TVD_PRODUCTION : "TVD Production #",
	MATERIAL_AUDIO_PROFILE : "Audio Profile",
	MATERIAL_CV_TYPE : "Content Version Type",
	CV_TRANSFORMATION_TYPE : "Content Version Transformation"
};

with (java) {
	  _logger.info("Running Metadata Review MetaData Population Script");

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
	var audioProfiles = listAudioProfiles();
	var audioProfileList = new ArrayList();

	audioProfileList.add("Please Select");
	if(!isNullOrEmptyOrUndefined(audioProfiles)){
		audioProfileList.addAll(audioProfiles)
	}
	
	_logger.info("Populating Existing Data for Material");

	var materialId = _selection;
	var options = [SHORT_TEXT,TAG];
	var material = materialGet(materialId,options);

	_logger.info("Running metadata populate script with selection  ["+materialId+"] ");

	if(!isNullOrEmptyOrUndefined(material)){
		var shortTextList = material.getShortTextList();
		var tagList = material.getTagList();

		var audioProfile = getValueFromShortTextList(shortTextList,MAPPING.MATERIAL_AUDIO_PROFILE);
		audioProfileList.remove(audioProfile);
		audioProfileList.add(0,audioProfile);
		_formData.addDataField(MATERIAL_AUDIO_PROFILE,audioProfileList.toArray().join());
	}
	 	
	
	_logger.info("Completed Metadata Review Metadata Population Script");
}