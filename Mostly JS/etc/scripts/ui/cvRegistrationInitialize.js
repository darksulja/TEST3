/*
* @Author: Karthik Rengasamy
* @Description: Content Versioning Population Script
* @Date:   2017-03-18 11:38:25
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-05-17 01:20:21
* @Last Modified by:   Chris Filippone
* @Last Modified time: 2018-03-20 09:00:00
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

const MATERIAL_AUDIO_PROFILE = "Material.AudioProfile";

with (java) {
	  _logger.info("Running Content Versioning Initialization Script");

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
	 * list Tracktypes
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
							var name = results.get(i).get("TYPE_NAME");
							trackTypeGroups.add(name.replace(",", " @ "));
					}
					return trackTypeGroups;
			}
			return null;
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
	var audioProfiles = listAudioProfiles();
	var audioProfileList = new ArrayList();

	audioProfileList.add("Please Select");
	if(!isNullOrEmptyOrUndefined(audioProfiles)){
		audioProfileList.addAll(audioProfiles)
	}
	// Load the Track Type Group Dropdown with all the Track Type groups
  	var trackTypes = listTrackTypesInMediator();
	var trackTypesList = new ArrayList();

	trackTypesList.add("Please Select");
	if(!isNullOrEmptyOrUndefined(trackTypes)){
		trackTypesList.addAll(trackTypes)
	}
	_logger.info("Completed Audio Track Type Initialization Script");
	_formData.addDataField(MATERIAL_AUDIO_PROFILE,audioProfileList.toArray().join());
	// loop for track types 	
	for (var i = 1; i < 6; i++) {
		var TRACK_TYPE = "Material.TrackType" + i.toString()  ;
		var TRACK_FILE = "Material.TrackType" + i.toString()  + '.Filename' ; 
		_formData.addDataField(TRACK_FILE,"");
		_formData.addDataField(TRACK_TYPE,trackTypesList.toArray().join());
	}	// populate all track conponents
	_logger.info("Completed Content Versioning Initialization Script");
}