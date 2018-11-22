/*
* @Author: Karthik Rengasamy
* @Description: Audio Profile Initialization Script
* @Date:   2017-03-18 11:38:25
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-04-28 16:43:20
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

const TRACK_TYPE_GROUP = "Track Type Group";
const CHANNEL = "Channel";
const LANGUAGE = "Language";
const AUDIO_PROFILE = "Audio Profiles";

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

	_logger.info("Running Audio Profile Initialization Script");
		
	var audioProfiles = listAudioProfiles();
	var audioProfileList = new ArrayList();
	audioProfileList.add("New");
	
	if(!isNullOrEmptyOrUndefined(audioProfiles)){
		audioProfileList.addAll(audioProfiles)
	}

	_formData.addDataField(AUDIO_PROFILE, audioProfileList.toArray().join());

	_logger.info("Completed Audio Profile Initialization Script");
}