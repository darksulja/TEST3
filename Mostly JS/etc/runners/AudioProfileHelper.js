/*
* @Author: Mike Ayubi
* @Date:   2017-05-11
* @Last Modified by: Mike Ayubi
*/
if (typeof gmoNBCFunc === "undefined") {
		print("Loading /opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
		load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
	} else {
		print("Object [ gmoNBCFunc ] already lodaded");
	}

	if (typeof Preset === "undefined") {
		print("Loading /opt/evertz/mediator/etc/runners/Preset.js");
		load("/opt/evertz/mediator/etc/runners/Preset.js");
	} else {
		print("Object [ Preset ] already lodaded");
	}

var AudioProfileHelper = function (audioProfile,profileType) {

	this.__audioProfile;
	this.__audioProfilePreset;
	this.__languageMasterArray = [];
	this.__audioProfileType;

	if(gmoNBCFunc.isVarUsable(audioProfile)){
		this.__audioProfile = audioProfile;
	}
	if(gmoNBCFunc.isVarUsable(profileType)){
		this.__audioProfileType = profileType;
	}else{
		this.__audioProfileType = "Audio Profiles";	//Default to Audio Profiles for now
	}

	this.initialize = function(){
		this.__audioProfilePreset = new Preset(this.__audioProfile);
		if(this.__audioProfilePreset.getType() != this.__audioProfileType) throw new Error("Audio Profile [" + audioProfile + "] is not of type [" + this.__audioProfileType + "]");
		print("AudioProfileHelper() initialized for profile [" + this.__audioProfile + "]");
	}

	this.setName = function (audioProfile) {
		this.__audioProfile = audioProfile;
	}

	this.setType = function (profileType) {
		this.__audioProfileType = profileType;
	}

	this.setLanguages = function (langArray){
		if(langArray.length != 4) throw new Error("AudioProfileHelper language arary must be of length 4. e.g ['EN-US' ,'EN-UK' ,'' ,'']");
		this.__languageMasterArray = langArray;
	}

	this.getPreset = function(){
		return this.__audioProfilePreset;
	}

	this.getTotalNumberOfChannels = function (){

		var trackTypeGroupNames = [];
		var dataElementObjects = this.__audioProfilePreset.getDataElementsByPrefix("shorttext","Channel");
		var numChannels = 0;
		for each(da in dataElementObjects){
			var number = parseInt(da.value);
			if(gmoNBCFunc.isVarUsable(number) && !isNaN(number)){
				numChannels += number;			
			} 
		}

		return numChannels;
	}
	this.getTrackLayout = function (){

		var languageMasterDefs = ["Primary Language","Secondary Language","Tertiary Language","Fourth Language"];
		var rtnList = [];

		var position = 1;
		var trackTypeGroupElementObjects = this.__audioProfilePreset.getDataElementsByPrefix("shorttext","Track Type Group");
		for each(var x = 0; x < trackTypeGroupElementObjects.length; x++){
			var type = trackTypeGroupElementObjects[x].type;
			var trackTypeGroup = trackTypeGroupElementObjects[x].value;
			if (gmoNBCFunc.isVarUsable(trackTypeGroup) && trackTypeGroup.toLowerCase() != "none") {
				var ordinality = parseInt(type.trim().split(" ")[3]);
				var language = this.__audioProfilePreset.getDataElementValue("shorttext","Language " + ordinality);

				if(gmoNBCFunc.contains(languageMasterDefs,language)){
					var langCode = this.__languageMasterArray[languageMasterDefs.indexOf(language)];
					if(!gmoNBCFunc.isVarUsable(langCode)) throw new Error("Language [" + language + "] is not set on AudioProfileHelper language array.");					
					var langLookUp = gmoNBCFunc.getTagByTagTypeAndValue("Language Code Lookup",langCode.toLowerCase());
					if(!gmoNBCFunc.isVarUsable(langLookUp)) throw new Error("Language Lookup code [" + langCode.toLowerCase() + "] not registered in Tag Admin.");
					trackTypeGroup = trackTypeGroup + " " + langLookUp.Description.toString();
				}
				var channels = parseInt(this.__audioProfilePreset.getDataElementValue("shorttext","Channel "  + ordinality));

				var rtnObject = new Object();
				rtnObject.profileName = this.__audioProfilePreset.getName();
				rtnObject.channels = channels;
				rtnObject.trackTypeGroup = trackTypeGroup;
				rtnObject.position = position;
				rtnList.push(rtnObject);
				position += channels;			
			}
		}	
		return rtnList;
	}

	this.initialize();
}

print("Loaded [PresetHelper.js]");
