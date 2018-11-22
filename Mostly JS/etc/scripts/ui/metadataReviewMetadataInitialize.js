/*
* @Original Author: Karthik Rengasamy
* @Revision Author: Chris Filippone
* @Description: Metadata Review Meta data pull for Audio Profile
* @Date:   2018-02-09 10:32:25
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


const MATERIAL_AUDIO_PROFILE = "Material.AudioProfile";

with (java) {
	  _logger.info("Running Metadata Review Metadata Initialization Script");

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

	var audioProfiles = listAudioProfiles();
	var audioProfileList = new ArrayList();

	audioProfileList.add("Please Select");
	if(!isNullOrEmptyOrUndefined(audioProfiles)){
		audioProfileList.addAll(audioProfiles)
	}

	_formData.addDataField(MATERIAL_AUDIO_PROFILE,audioProfileList.toArray().join());
	
	_logger.info("Completed Metadata Review Metadata Initialization Script");
}