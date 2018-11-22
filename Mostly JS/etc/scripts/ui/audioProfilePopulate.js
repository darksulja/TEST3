/*
* @Author: Karthik Rengasamy
* @Description: Audio Profile Population Script
* @Date:   2017-03-18 11:38:25
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-04-28 16:42:08
*/

var java = JavaImporter(
	Packages.java.util.ArrayList,
	Packages.com.pharos.core.domain,
	Packages.com.pharos.core.domain.utils,
	Packages.com.pharos.core.domain.list,
	Packages.com.pharos.core.domain.options,
	Packages.com.pharos.core.domain.reports,
	Packages.java.lang.Integer
);

//Declaring Constants - Form Data Keys

const AUDIO_PROFILES = "Audio Profiles";
const TRACK_TYPE_GROUP = "Track Type Group";
const CHANNEL = "Channel";
const LANGUAGE = "Language";
const PRESET_NAME = "Preset Name";
const HIDDEN_PRESET_NAME = "Hidden Preset Name";

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
	* [listTrackTypesAndGroups List TrackTypes And Groups]
	* @return [List] List of Strings Track Types + Track Type Groups
	*/
	function listTrackTypesAndGroups(){
		var reportName = "listTrackTypesAndGroupsInMediator";
		var command = new Command("report","runReport");
		command.addParameter("reportName", reportName);
		command.addParameter("pageSize", new Integer(2000));
		var reportResults = _commandHelper.runCommand(command);
		if(reportResults && reportResults.getSuccess() == true){
			_logger.info("Processing Report Results");
			var results = reportResults.getOutput().getList().getList();
			var trackTypesAndGroups = new ArrayList();
			for (var i = 0; i < results.size(); i++) {
				var name = results.get(i).get("TYPE_NAME");
				if(!isNullOrEmptyOrUndefined(name)){
					trackTypesAndGroups.add(name.replace(","," @ "));
				}
			}
			return trackTypesAndGroups;
		}
		return null;
	}

   /**
	* [getPreset Get a preset]
	* @param  [String] presetName 
	* @return [Preset] Preset domain object
	*/
	function getPreset(presetName){
	 	const SHORT_TEXT = "shorttext";
	 	var command = new Command("preset","get");
		command.addParameter("presetName", presetName);
		var options = new PresetOptions();
    	options.addOption(SHORT_TEXT);
		command.addParameter("options",options);
		var commandResult = _commandHelper.runCommand(command);
		if(commandResult.getSuccess()){
			return commandResult.getOutput();
		} else {
			_logger.info("No Preset Found ");
			return null;
		}
	}

   /**
	* [getChannelList Get List Of Valid Number of Channels]
	* @return List Of Valid Number of Channels
	*/
	function getChannelList(){
		var channelList = new ArrayList();
		channelList.add("None");
		channelList.add("0");
		channelList.add("1");
		channelList.add("2");
		channelList.add("6");
		return channelList;
	}

   /**
	* [getLanguageList Get List Of Valid Languages]
	* @return List Of Valid Languages
	*/
	function getLanguageList(){
		var languageList = new ArrayList();
		languageList.add("None");
		languageList.add("Primary Language");
		languageList.add("Secondary Language");
		languageList.add("Tertiary Language");
		languageList.add("Fourth Language");
		return languageList;
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

	function getCopyOfTrackTypeGroupList(trackTypes){
		var trackTypesList = new ArrayList();
		for (var i = 0; i <trackTypes.size(); i++) {
			trackTypesList.add(trackTypes.get(i));
		}
		return trackTypesList;
	}

	_logger.info("Running Audio Profile Population Script");
	_logger.info("Running populate script with selection ["+_selection+"] and dataKey ["+_dataKey+"]");
	
	if(_dataKey == AUDIO_PROFILES && !isNullOrEmptyOrUndefined(_selection)){

		var trackTypesList = new ArrayList();

		trackTypesList.add("None");
		trackTypesList.add("Mono");
		trackTypesList.add("Stereo");
		trackTypesList.add("Surround");
		
		var trackTypesAndGroups = listTrackTypesAndGroups();
		
		if(!isNullOrEmptyOrUndefined(trackTypesAndGroups)){
			trackTypesList.addAll(trackTypesAndGroups)
		}

		if(_selection=="New"){

			var channelList = getChannelList();
			var languageList = getLanguageList();	

			//Reset Preset Text Box
			_formData.addDataField(PRESET_NAME, "");
			_formData.addDataField(HIDDEN_PRESET_NAME, "");
		
			//Reset All dropdowns
			for (var i = 1; i <= 16; i++) {
				var languageField = LANGUAGE + " " + i;
				var channelField = CHANNEL + " " + i;
				var trackTypeGroupField = TRACK_TYPE_GROUP + " " + i;
			
				_formData.addDataField(trackTypeGroupField, trackTypesList.toArray().join());
				_formData.addDataField(channelField, channelList.toArray().join());
				_formData.addDataField(languageField,languageList.toArray().join());
			}
		}else {
			_formData.addDataField(PRESET_NAME, _selection);
			_formData.addDataField(HIDDEN_PRESET_NAME, _selection);
			var preset = getPreset(_selection);
			var shortTextList = preset.getShortTextList();
			
			for (var i = 1; i <= 16; i++) {
				var languageField = LANGUAGE + " " + i;
				var channelField = CHANNEL + " " + i;
				var trackTypeGroupField = TRACK_TYPE_GROUP + " " + i;
				
				var channelList = getChannelList();
				var languageList = getLanguageList();
				var trackTypesGroupList = getCopyOfTrackTypeGroupList(trackTypesList);
				var channel = getValueFromShortTextList(shortTextList,channelField);
				var language = getValueFromShortTextList(shortTextList,languageField);
				var trackTypeGroup = getValueFromShortTextList(shortTextList,trackTypeGroupField).replace(","," @ ");
				
				channelList.remove(channel);
				channelList.add(0,channel);
				
				languageList.remove(language);
				languageList.add(0,language);


				trackTypesGroupList.remove(trackTypeGroup);
				trackTypesGroupList.add(0,trackTypeGroup);
				
				_formData.addDataField(trackTypeGroupField, trackTypesGroupList.toArray().join());
				_formData.addDataField(channelField, channelList.toArray().join());
				_formData.addDataField(languageField,languageList.toArray().join());
			}

		}
	}

	_logger.info("Completed Audio Profile Population Script");
}