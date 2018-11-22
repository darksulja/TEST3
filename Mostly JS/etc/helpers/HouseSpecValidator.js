/*
* @Author: Karthik Rengasamy
* @Date:   2017-08-14 22:38:04
* @Last Modified by:   karthikrengasamy
* @Last Modified time: 2017-09-04 22:59:57
*/

function HouseSpecValidator() {

	if((this instanceof HouseSpecValidator) === false)	throw new Error("Please call constructor with new() keyword")
	if(typeof(gmoNBCFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js")
	if(typeof(_)==="undefined")  load("/opt/evertz/mediator/etc/scripts/modules/js/underscore-min.js")
	if(typeof(PresetHelper)==="undefined")  load("/opt/evertz/mediator/etc/helpers/PresetHelper.js")
	if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")
	if(typeof(MediaInfoHelper)==="undefined")  load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js")
}

HouseSpecValidator.prototype.constructor = HouseSpecValidator;

HouseSpecValidator.prototype.setFileNameWithPath = function(fileNameWithPath){
	this.__fileNameWithPath = fileNameWithPath;
}

HouseSpecValidator.prototype.setFilterCriteriaObject = function(filterObject){
	this.__filterObj = filterObject;
}

HouseSpecValidator.prototype.listHouseSpecNames = function(){
	var presetHelper = new PresetHelper();
	var houseSpecNames =  presetHelper.listPresetsByPresetType(NBCGMO_CONSTANTS.HOUSE_PROFILE_SPECIFICATIONS);
	return houseSpecNames;
}

HouseSpecValidator.prototype.getHouseProfileSpecs = function(houseSpecName){
	var presetHelper = new PresetHelper();
	var preset = presetHelper.getPreset(houseSpecName);

	return preset;
}

HouseSpecValidator.prototype.getAllHouseSpecsDetails = function(){
	var houseSpecs = [];
	var houseSpecNames = this.listHouseSpecNames();
	for each (houseSpecName in houseSpecNames){
		houseSpecs.push(this.getHouseProfileSpecs(houseSpecName));
	}
	return houseSpecs;
}

HouseSpecValidator.prototype.filterHouseProfilesByCriteria = function(){
	var framerate = this.__filterObj["framerate"];
	var standard =  this.__filterObj["standard"];
	var format = this.__filterObj["format"];

	var filteredList =  _.where(this.getAllHouseSpecsDetails(),{"Frame Rate": framerate, "Video Standard" : standard});
	return _.filter(filteredList,function(profile){return profile["Video Format"][0] == format;});
}

HouseSpecValidator.prototype.getVideoTypeAndValueMediainfoLookup = function(prop, mediaInfoHelper) {
	function propertyNotFound(p) {
		return {
			"type"	:	"equal",
			"value"	:	"Warning: Property ["+p+"] Not Found"
		}
	}

	var videoTrackProps = mediaInfoHelper.getTrackProperties(NBCGMO_CONSTANTS.VIDEO,0);
	if (prop === "Frame Rate") {
		var value = mediaInfoHelper.getFrameRate();
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "equal","value" : value}
	}else if (prop === "Video Bit Rate") {
		var value = videoTrackProps["BitRate"];
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "minimum","value" : Math.floor(parseInt(value))/1000/1000}
	}else if (prop === "Video Height") {
		var value = parseInt(mediaInfoHelper.getVideoHeight());
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "equal","value" : value.toString()}
	}else if (prop === "Video Width") {
		var value = parseInt(mediaInfoHelper.getVideoWidth());
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "equal","value" : value.toString()}
	}else if (prop === "Video Chroma Sampling") {
		var value = mediaInfoHelper.getChromaSubsampling();
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "equal","value" : value}
	}else if (prop === "Video Codec") {
		var value = videoTrackProps["Codec"];
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "equal","value" : value}
	}else if (prop === "Video Container") {
		var value = mediaInfoHelper.getVideoContainer();
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "equal","value" : value}
	}else if (prop === "Video Format") {
		var value = mediaInfoHelper.getVideoFormat();
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "equal","value" : value}
	}else if (prop === "Video Standard") {
		var value = mediaInfoHelper.getStandard();
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "equal","value" : value}
	}else if (prop === "Video Scan Type") {
		var value = mediaInfoHelper.getScanType();
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "equal","value" : value}
	}

	propertyNotFound(prop)
}

HouseSpecValidator.prototype.getAudioTypeAndValueMediainfoLookup = function(prop,trackIndex,mediaInfoHelper){
	function propertyNotFound(p) {
		return {
			"type"	:	"equal",
			"value"	:	"Warning: Property ["+p+"] Not Found"
		}
	}

	var audioTrackProps = mediaInfoHelper.getTrackProperties(NBCGMO_CONSTANTS.AUDIO,trackIndex);

	if (prop === "Audio Bit Depth") {
		var value = audioTrackProps["BitDepth"];
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "equal","value" : value}
	} else if (prop === "Audio Bit Rate") {
		var value = audioTrackProps["BitRate"];
		if(gmoNBCFunc.isVarUsable(value)) return {"type" 	: "minimum","value" : Math.floor(parseInt(value))/1000} 
	} else if (prop === "Audio Channels Per Stream") {
		var value = audioTrackProps["Channels"];
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "equal","value" : value}
	} else if (prop === "Audio Codec") {
		var value = audioTrackProps["AudioCodec"];
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "equal","value" : value}
	}else if (prop === "Audio Format") {
		var value = audioTrackProps["Format"];
		if(gmoNBCFunc.isVarUsable(value)) return {"type" : "equal","value" : value}
	}else if (prop === "Audio Sampling Rate") {
		var value = audioTrackProps["SamplingRate"];
		if(gmoNBCFunc.isVarUsable(value))return {"type" : "equal","value" : Math.floor(parseInt(value)/1000).toString()} 	
	}

	propertyNotFound(prop);
}

HouseSpecValidator.prototype.getComparisonAgainstHouseProfiles = function(mediaInfoHelper,houseProfiles,ignoreProps){
	var results = [];

	for each(var hp in houseProfiles){
		var hpName = hp.Name;
		output("Evaluating against House Profile ["+hpName+"]")
		var rtnObj = new Object();
		var passedAllChecks = true;
		var detailsPassed = [];
		var detailsFailed = [];

		var keys = Object.keys(hp).sort(); //maintain order for nice printing
		var videoProps = [];
		var audioProps = [];
		for (var x = 0; x < keys.length; x++) gmoNBCFunc.startsWith(keys[x],NBCGMO_CONSTANTS.AUDIO) ? audioProps.push(keys[x]) : videoProps.push(keys[x]);

		for (var i = 0; i < videoProps.length; i++) {
			var prop = videoProps[i];
			if(gmoNBCFunc.contains(ignoreProps,prop)) continue;
			var numTab = prop.length >= 15 ? "\t\t" : "\t\t\t";
			if(prop.length > 20) numTab = "\t";

			var setValue = hp[prop];
			var typeAndValue = this.getVideoTypeAndValueMediainfoLookup(prop,mediaInfoHelper);
			if(gmoNBCFunc.isVarUsable(typeAndValue)) {
				var prntMsg = prop + ":" + numTab + "Expected ["+setValue+"]" + " - " + "Actual ["+typeAndValue.value+"]";

				if (typeAndValue.type === "equal") {
					if (typeof(setValue) == "object") {
						if(gmoNBCFunc.containsIgnoreCase(setValue,typeAndValue.value)){
							detailsPassed.push(prntMsg);
							isAnyValueMatchedInArray = true;							
						}else{
							detailsFailed.push(prntMsg);
							passedAllChecks = false;							
						}
					} else {
						if (gmoNBCFunc.equalsIgnoreCase(typeAndValue.value,setValue)){
							detailsPassed.push(prntMsg);
						} else {
							detailsFailed.push(prntMsg);
							passedAllChecks = false;
						}
					}
				} else if (typeAndValue.type === "minimum"){
					if (typeAndValue.value >= setValue){
						detailsPassed.push(prntMsg);
					} else {
						detailsFailed.push(prntMsg);
						passedAllChecks = false;
					}
				}
			} else {
				detailsFailed.push("["+hp.Name+"] - Property ["+prop+"] not defined in lookup.");
			}
		}
		var detailOutputStr = "[Video Track]\n";
		detailOutputStr += detailsPassed.length > 0 ? " PASSED\n" : "";
		for (var i=0;i<detailsPassed.length;i++) detailOutputStr += "  " + detailsPassed[i] + "\n";
		detailOutputStr = detailsFailed.length > 0 ? detailOutputStr += " FAILED\n" : detailOutputStr += "\n";
		for (var j=0;j<detailsFailed.length;j++) detailOutputStr += "  " + detailsFailed[j] + "\n";
		detailOutputStr += "\n";

		for (y = 0; y < mediaInfoHelper.getMediaInfoXml().track.(@type.toString()==="Audio").length(); y++){
			var detailsPassed = [];
			var detailsFailed = [];
			for (var z = 0; z < audioProps.length; z++) {
				var prop = audioProps[z];
				var numTab = prop.length >= 15 ? "\t\t" : "\t\t\t";
				if(prop.length > 20) numTab = "\t";

				var setValue = hp[prop];
				var typeAndValue = this.getAudioTypeAndValueMediainfoLookup(prop,y,mediaInfoHelper);
				if(gmoNBCFunc.isVarUsable(typeAndValue)) {
				var prntMsg = prop + ":" + numTab + "Expected ["+setValue+"]" + " - " + "Actual ["+typeAndValue.value+"]";
					if (typeAndValue.type === "equal") {
						if (typeof(setValue) == "object") {
							if(gmoNBCFunc.containsIgnoreCase(setValue,typeAndValue.value)){
								detailsPassed.push(prntMsg);
								isAnyValueMatchedInArray = true;							
							}else{
								detailsFailed.push(prntMsg);
								passedAllChecks = false;							
							}
						} else {
							if (gmoNBCFunc.equalsIgnoreCase(typeAndValue.value,setValue)){
								detailsPassed.push(prntMsg);
							} else {
								detailsFailed.push(prntMsg);
								passedAllChecks = false;
							}
						}
					} else if (typeAndValue.type === "minimum"){
						if (typeAndValue.value >= setValue){
							detailsPassed.push(prntMsg);
						} else {
							detailsFailed.push(prntMsg);
							passedAllChecks = false;
						}
					}
				}else {
					detailsFailed.push("["+hp.Name+"] - Property ["+prop+"] not defined in lookup.");
				}
			}

			detailOutputStr += "[Audio Track " + (y+1) + "]\n";
			detailOutputStr += detailsPassed.length > 0 ? " PASSED\n" : "";
			for (var i=0;i<detailsPassed.length;i++) detailOutputStr += "  " + detailsPassed[i] + "\n";
			detailOutputStr = detailsFailed.length > 0 ? detailOutputStr += " FAILED\n" : detailOutputStr += "\n";
			for (var j=0;j<detailsFailed.length;j++) detailOutputStr += "  " + detailsFailed[j] + "\n";
		}

		rtnObj.name = hpName;
		rtnObj.passed = passedAllChecks;
		rtnObj.details = detailOutputStr;
		results.push(rtnObj);
		output(detailOutputStr);

		if(passedAllChecks) break;  // we can break at this point if we find a match sooner
	}

	return results;
}

HouseSpecValidator.prototype.validateSpecAgainstProfiles = function(){

	if(gmoNBCFunc.isVarUsable(this.__fileNameWithPath)) {
		var usefulFileObj = new gmoNBCFunc.usefulFileObj(this.__fileNameWithPath);
		if(!usefulFileObj.exists()) throw new Error("File not found error [" + usefulFileObj.unix_file + "]");
    	var mediaInfoHelper = new MediaInfoHelper();
    	mediaInfoHelper.setSourceFile(usefulFileObj);

    	this.setFilterCriteriaObject({"framerate":mediaInfoHelper.getFrameRate(),"standard":mediaInfoHelper.getStandard(),"format":mediaInfoHelper.getVideoFormat()});
    	var results = this.getComparisonAgainstHouseProfiles(mediaInfoHelper,this.filterHouseProfilesByCriteria(),['Name','Description']);

    	return results;

	}else {
		throw new Error("Required Parameters fileNameWithPath is not provided" )
	}
}