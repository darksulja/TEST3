/*
* @Author: Karthik Rengasamy
* @Description: Audio Profile Submission Script 
* @Date:   2017-03-18 11:38:25
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-04-27 02:36:24
*/

var java = JavaImporter(
    Packages.com.pharos.core.domain,
    Packages.com.pharos.core.domain.utils,
    Packages.com.pharos.core.domain.options,
	Packages.com.pharos.core.domain.list,
	Packages.java.util.ArrayList
);

//Declaring Constants - Form Data Keys
const HIDDEN_PRESET_NAME = "Hidden Preset Name";
const PRESET_NAME = "Preset Name";
const TRACK_TYPE_GROUP = "Track Type Group";
const CHANNEL = "Channel";
const LANGUAGE = "Language";

//Declaring Constants - Script

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
	* [savePreset To Save Preset]
	* @param  [Preset] Preset domain object
	* @return Command Response
	*/
	function savePreset(preset){
		var command = new Command("preset","save");
		command.addParameter("preset", preset);
		var commandResult = _commandHelper.runCommand(command);
		return commandResult;
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

	function getForm(formName){
		var command = new Command("form","get");
		command.addParameter("formName", formName);
		var commandResult = _commandHelper.runCommand(command);
		return commandResult.getOutput();
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

    _logger.info("Running Audio Profile Submission Script ");

    var hiddenPresetName = _formData.getValue(HIDDEN_PRESET_NAME);
    var presetName = _formData.getValue(PRESET_NAME);

    //Check if its New preset or Old Preset 

    if(isNullOrEmptyOrUndefined(hiddenPresetName)){
		//New Preset - then build a preset object and save 
		var preset = new Preset();
		var shortTextList = new ShortTextList();

		for (var i = 1; i <= 16; i++) {
			var languageField = LANGUAGE + " " + i;
			var channelField = CHANNEL + " " + i;
			var trackTypeGroupField = TRACK_TYPE_GROUP + " " + i;
			shortTextList.add(createShortTextObj(languageField,_formData.getValue(languageField)));
			shortTextList.add(createShortTextObj(trackTypeGroupField,_formData.getValue(trackTypeGroupField).replace(" @ ",",")));
			shortTextList.add(createShortTextObj(channelField,_formData.getValue(channelField)));
		}

    }else{
    	//Old Preset - then Get Preset and then do a update
    	var preset = getPreset(hiddenPresetName);
    	var shortTextList = new ShortTextList();

		for (var i = 1; i <= 16; i++) {
			var languageField = LANGUAGE + " " + i;
			var channelField = CHANNEL + " " + i;
			var trackTypeGroupField = TRACK_TYPE_GROUP + " " + i;

			var langShortText = getShortTextFromShortTextList(preset.getShortTextList(),languageField);
			var channelShortText = getShortTextFromShortTextList(preset.getShortTextList(),channelField);
			var trackTypeGroupShortText = getShortTextFromShortTextList(preset.getShortTextList(),trackTypeGroupField);

			langShortText.setShortText(_formData.getValue(languageField));
			channelShortText.setShortText(_formData.getValue(channelField));
			trackTypeGroupShortText.setShortText(_formData.getValue(trackTypeGroupField).replace(" @ ",","));
			
			shortTextList.add(langShortText);
			shortTextList.add(channelShortText);
			shortTextList.add(trackTypeGroupShortText);

		}
    }

    preset.setName(presetName);
    preset.setDescription(presetName);
    preset.setPresetType("Audio Profiles");
    preset.setForm(getPreset("Audio Profile Default").getForm());
    preset.setShortTextList(shortTextList);
    preset.setCommon(true);

    var response = savePreset(preset)

    if(response.getSuccess()){
		_result.setSuccess(true);
		_result.setOutcome(presetName + " is saved Successfully");
    }else{
   	 	_result.setSuccess(false);
   	 	_result.setOutcome("Failed to Save Preset ["+presetName+"] ");
    }

    _logger.info("Completed Audio Profile Submission Script ");
}