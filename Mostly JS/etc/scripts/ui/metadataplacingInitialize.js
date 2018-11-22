/*
* @Author:Mike Ayubi
* @Description: metadata placing init Script
* @Date:   2017-09-22 11:38:25
*/

var java = JavaImporter(
	Packages.com.pharos.core.domain,
	Packages.com.pharos.core.domain.list,
	Packages.com.pharos.core.domain.utils,
	Packages.com.pharos.core.domain.job,
	Packages.com.pharos.core.domain.options,
	Packages.com.pharos.microtime,
    Packages.java.text.SimpleDateFormat,
	Packages.java.util.ArrayList,
    Packages.java.lang.Integer,
    Packages.com.pharos.poxclient,
    Packages.com.pharos.poxclient.rhozet,
    Packages.com.pharos.poxclient.buydrm,
    Packages.java.io,
    Packages.com.pharos.util,
    Packages.com.pharos.microtime,
    Packages.com.pharos.core.domain.reports,
    Packages.com.pharos.core.domain.reports.parameters
);

with (java) {

	const UPDATE_SIDECAR_AUDIO_TRACK = "SidecarAudioTrack";
	const UPDATE_SIDECAR_CAPTION_TRACK = "UpdateSidecarCaptionTrack";

	const MAPPING = {
		UPDATE_SIDECAR_AUDIO_TRACK : "Update Sidecar Audio Track",
		UPDATE_SIDECAR_CAPTION_TRACK : "Update Sidecar Caption Track"
	}

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

	_logger.info("Running metadata Placing Initialization Script");

   /**
	* [listTrackTypesAndGroups List TrackTypes And Groups]
	* @return [List] List of Strings Track Types + Track Type Groups
	*/
	function listTrackTypes(class_id){
		var reportName = "listTrackTypesInMediatorWithFilter";
		var command = new Command("report","runReport");
		command.addParameter("reportName", reportName);
		command.addParameter("pageSize", new Integer(2000));
        var class_ID_param = new StringReportParameter();
        class_ID_param.setName("class_id");
        class_ID_param.setValue(class_id);
        class_ID_param.setOperator("is");
        var reportParameters = new CustomReportParameterList();
        var custReportParmeter = new CustomReportRuntimeParametersDefault();
        reportParameters.add(class_ID_param);
        custReportParmeter.setParameters(reportParameters);
        command.addParameter("reportParameters", custReportParmeter);

		var reportResults = _commandHelper.runCommand(command);
		if(reportResults && reportResults.getSuccess() == true){
			_logger.info("Processing Report Results");
			var results = reportResults.getOutput().getList().getList();
			var trackTypes = new ArrayList();
			trackTypes.add("Select track")
			for (var i = 0; i < results.size(); i++) {
				var name = results.get(i).get("TYPE_NAME");
				if(!isNullOrEmptyOrUndefined(name)){
					trackTypes.add(name.replace(","," @ "));
				}
			}
			return trackTypes;
		}
		return null;
	}

	var audioTrackTypes = listTrackTypes(2);
	var subtitleTrackTypes = listTrackTypes(4);
	_formData.addDataField(UPDATE_SIDECAR_AUDIO_TRACK, audioTrackTypes.toArray().join());
	_formData.addDataField(UPDATE_SIDECAR_CAPTION_TRACK, subtitleTrackTypes.toArray().join());

	_logger.info("Completed metadata Placing Registration Initialization Script");
}