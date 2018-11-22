/*
* @Author: Karthik Rengasamy
* @Description: Content Versioning Population Script
* @Date:   2017-03-18 11:38:25
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-06-08 17:14:20
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
const MATERIAL_DAISY_ID = "Material.DaisyID";
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
const COMPONENT_TYPE1 = "Material.TrackType1";


const MESSAGE = "ContentVersioning.ErrorMessage";

//Options Constant 
const SHORT_TEXT = "shorttext";
const TAG = "tag";
const TRACKTYPELINKS = "tracktypelinks";


//Form DataKey ==> Data Element Name MAPPING  
const MAPPING = {
	MATERIAL_ORIGINAL_NAME : "Original File Name",
	MATERIAL_REF_TVD_PRODUCTION : "Original TVD Production #",
	MATERIAL_TVD_PRODUCTION : "TVD Production #",
	MATERIAL_AUDIO_PROFILE : "Audio Profile",
	MATERIAL_CV_TYPE : "Content Version Type",
	CV_TRANSFORMATION_TYPE : "Content Version Transformation",
	DAISY_ID : "Daisy ID"
};

with (java) {
	  _logger.info("Running Content Versioning Population Script");

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
	 * List all tracks  
	 */
	function listTrackTypesInMediator() {
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

   /**
	* [resetUIvars]
	* reset 5 ui objects
	*/
	function resetUIvars (TrackTypesList){
		for (var i = 1; i < 6; i++) {
				
			var TRACK_TYPE = "Material.TrackType" + i.toString()  ;
			var TRACK_FILE = "Material.TrackType" + i.toString()  + '.Filename' ; 
			//
			_formData.addDataField(TRACK_FILE,"");
			_formData.addDataField(TRACK_TYPE,TrackTypesList.toArray().join());
		}
	
	}
	//
	// start
	//

	_logger.info("Running populate script with selection ["+_selection+"] and dataKey ["+_dataKey+"]");
	
	var audioProfiles = listAudioProfiles();
	var audioProfileList = new ArrayList();

	audioProfileList.add("Please Select");
	if(!isNullOrEmptyOrUndefined(audioProfiles)){
		audioProfileList.addAll(audioProfiles)
	}

	// Load the Track Type Group Dropdown with all the Track Type groups
	var TrackTypes = listTrackTypesInMediator();
	var TrackTypesList = new ArrayList();
	TrackTypesList.add("Please Select");
	if(!isNullOrEmptyOrUndefined(TrackTypes)){
		TrackTypesList.addAll(TrackTypes)
	}	
	//
	// pre populate for existing Mat id
	//
	if(_dataKey == MATERIAL_MAT_ID && !isNullOrEmptyOrUndefined(_selection)){
		_logger.info("Material Edit - Populating Existing Data for Material");

		var materialId = _selection;
		var options = [SHORT_TEXT,TAG,TRACKTYPELINKS];
		var material = materialGet(materialId,options);
		var trackTypeLinkList = material.getTrackTypeLinks();
		resetUIvars(TrackTypesList);
		if(!isNullOrEmptyOrUndefined(material)){
			var shortTextList = material.getShortTextList();
			var tagList = material.getTagList();
			_formData.addDataField(MATERIAL_TITLE,material.getTitle());
			_formData.addDataField(MATERIAL_ASPECT_RATIO,material.getAspectRatioName());
			_formData.addDataField(MATERIAL_VERSION_TYPE,material.getVersionType());
			_formData.addDataField(MATERIAL_DAISY_ID,getValueFromShortTextList(shortTextList,MAPPING.DAISY_ID));
	 		_formData.addDataField(MATERIAL_REF_TVD_PRODUCTION,getValueFromShortTextList(shortTextList,MAPPING.MATERIAL_REF_TVD_PRODUCTION));
	 		_formData.addDataField(MATERIAL_TVD_PRODUCTION,getValueFromShortTextList(shortTextList,MAPPING.MATERIAL_TVD_PRODUCTION));
	 		_formData.addDataField(MATERIAL_ORIGINAL_NAME,getValueFromShortTextList(shortTextList,MAPPING.MATERIAL_ORIGINAL_NAME));
	 		_formData.addDataField(MATERIAL_TRANSFORMATION,material.getTransformationName());
	 		_formData.addDataField(MATERIAL_TYPE,material.getMaterialType());

	 		var materialCVType = getValueFromTagList(tagList,MAPPING.MATERIAL_CV_TYPE);
	 		_formData.addDataField(MATERIAL_CV_TYPE,materialCVType);

	 		var audioProfile = getValueFromShortTextList(shortTextList,MAPPING.MATERIAL_AUDIO_PROFILE);
	 		audioProfileList.remove(audioProfile);
	 		audioProfileList.add(0,audioProfile);
			_formData.addDataField(MATERIAL_AUDIO_PROFILE,audioProfileList.toArray().join());
			//
			// check Track types lists
			// loop through Tracktypes and excluding Video populate 5 temp variables
			//
			var counter = 1 ;
			for (var i = 0; i < trackTypeLinkList.size(); i++) {
				
				var trackTypeLink = trackTypeLinkList.get(i);
				var trackShortTextList = trackTypeLink.getShortTextList();
				var trackTypeName = trackTypeLink.getTrackType().getName().toString();
				// _logger.info("Material Edit - Track type name : " + trackTypeName);
				var TRACK_TYPE = "Material.TrackType" + counter.toString()  ;
				var TRACK_FILE = "Material.TrackType" + counter.toString()  + '.Filename' ; 
				//
				_formData.addDataField(TRACK_FILE,"");
				if( trackTypeName != 'Video' ) {
					if( counter < 6 && !isNullOrEmptyOrUndefined(trackTypeName) ) {
						var trackProfileList = new ArrayList();
						trackProfileList.addAll(TrackTypesList);
						trackProfileList.remove(trackTypeName);
						trackProfileList.add(0,trackTypeName);
						_formData.addDataField(TRACK_TYPE,trackProfileList.toArray().join());
						_formData.addDataField(TRACK_FILE,getValueFromShortTextList(trackShortTextList,MAPPING.MATERIAL_ORIGINAL_NAME));
						counter ++ ;
					} 
					trackProfileList= [];
				}
			}
		} else {
			// material not found 
		}
	} else {
		_formData.addDataField(MATERIAL_CV_TYPE,"Please Select");
		_formData.addDataField(MATERIAL_VERSION_TYPE,"Please Select");
		_formData.addDataField(MATERIAL_ASPECT_RATIO,"Unknown");	
		_formData.addDataField(MATERIAL_TRANSFORMATION,"Please Select");
	}
	
	_logger.info("Completed Content Versioning Population Script");
}