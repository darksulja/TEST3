var java = JavaImporter(
	Packages.java.util.ArrayList,
	Packages.com.pharos.core.domain,
	Packages.com.pharos.core.domain.utils,
	Packages.com.pharos.core.domain.list,
	Packages.com.pharos.core.domain.reports,
	Packages.com.pharos.core.domain.reports.parameters,
	Packages.java.lang.Integer
	);

// Declaring Constants - Form Data Keys
const TRACK_TYPE_GROUP = "TrackTypeGroup";
const TRACK_TYPE_GROUPS = "TrackTypeGroups";
const SOURCE_MATID = "Material.MatId.source";
const DEST_MATID = "Material.MatId.destination";
const FORCE_COPY = "ForceCopy";
const SHORT_TEXT = "shorttext";
const TAG = "tag";
var tvdSource;
var tvdDest;

with (java) {

	//
	// Common functions
	//

	/**
	 *	[isVarUsable - Checks whether a given argument is null, undefined or an empty string]
	 *	@param	{[Any]} - The variable you wish to test
	 *	@return {Boolean} - Whether the variable is 'usable'
	 **/
	function isVarUsable(v) {
			// Lazy check for undefined, null and emptystrings
			if (typeof v === "undefined" || v === undefined || v === null || v === "" || v === []) {
					return false;
			} else {
					return true;
			}
	}

	/**
	 * [createMaterialObj]
	 * @param  [string] matId
	 * @return [object] material
	 */
	function createMaterialObj(matId) {
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
	function materialGet(matId, options) {
			var materialOptions = new MaterialOptions();
			for each (option in options) {
					materialOptions.addOption(option);
			}

			var command = new Command("material", "get");
			command.addParameter("material", createMaterialObj(matId));
			command.addParameter("options", materialOptions);
			var jobResult = _commandHelper.runCommand(command);
			if (jobResult.getSuccess()) {
					return jobResult.getOutput();
			} else {
					_logger.info("No Material Found ");
					return null;
			}
	}

	/**
	 * [isValidMaterialId]
	 * @param materialId
	 * @returns {boolean}
	 */
	function isValidMaterialId (materialId) {
			var ret = false;
			// todo else what makes a material ID invalid
			ret = isVarUsable(materialId);
			if( ret ) {
					var mat = materialGet(materialId);
					_logger.info("isValidMaterialId = "+ mat);
					ret = isVarUsable(mat);
			}
			return ret;
	}

	/**
	 * [isMaterialIdReady]
	 * @param materialId
	 * @returns {boolean}
	 */
	function isMaterialIdReady (materialId, trackTypeGroup) {
			var ret = false;
			ret = isVarUsable(materialId);
			if( ret ) {
					// Convert tracktypegroup to tracktypes.
					var tracktypes = getTrackTypesFromGroup(trackTypeGroup);
					var material = materialGet(materialId,  ["tracktypelinks"]);
					var trackTypeLinkList = material.getTrackTypeLinks();
					_logger.info("Compare "+trackTypeGroup+" to trackTypeLinkList.size() == "+trackTypeLinkList.size());
					if( isVarUsable(material) ) {
							for (var i = 0; i < trackTypeLinkList.size(); i++) {
									var trackTypeLink = trackTypeLinkList.get(i);
									//show(trackTypeLink);
									var trackTypeName = trackTypeLink.getTrackType().getName().toString();
									_logger.info("trackTypeName: "+trackTypeName);
									for each ( var tracktype in tracktypes.toArray() ) {
											_logger.info("tracktype = "+tracktype);
											if (tracktype == trackTypeName) {
													var state = trackTypeLink.getStateName().toString();
													if (state == "Ready") {
															_logger.info("Track " + trackTypeName + " is in the Ready state");
													}
													else {
															_logger.info("Track " + trackTypeName + " is NOT in the Ready state");
															ret = false;
													}
											}
									}
							}
					}
			}
			return ret;
	}

	/**
	 * return true if the dest has all the tracks for the track type group passed.
	 * @param tracktypeGroup
	 * @returns {boolean}
	 */
	function trackTypeInDest(materialId, tracktypeGroup) {
			var ret = false;
			var material = materialGet(materialId, ["tracktypelinks"]);
			var groupTracks = getTrackTypesFromMaterial(materialId, tracktypeGroup);
			_logger.info("getTrackTypesFromMaterial == "+groupTracks);
			var newTTGNameList = new ArrayList();
			var tracks = getTrackTypesFromGroup(tracktypeGroup);
			_logger.info("getTrackTypesFromGroup == "+tracks);

			if (isVarUsable(groupTracks)) {
					_logger.info("groupTracks.size() = " + groupTracks.size());
					for (i = 0; i < groupTracks.size(); i++) {
							var found = true;
							var groupName = groupTracks.get(i);
							if (isVarUsable(groupName) && groupName != "Video") {
									_logger.info("GroupName =  " + groupName);
									for (var i = 0; i < tracks.size(); i++) {
											var name = tracks.get(i);
											_logger.info("Processing: " + name);
											// Only process valid groups that are NOT Video
											if (isVarUsable(name) && name != "Video") {
													_logger.info("groupName match: "+groupName+" == "+ name);
													//   groupName match: Surround Rear English (US) == Stereo English (US)
													if (groupName == name) {
															// We have a match between the material and the list, so keep this one.
															_logger.info("Using " + name);
															newTTGNameList.add(tracktypeGroup.replace(",", " @ "));
															ret = true;
															break;
													}
													else {
															// If any of the track types are missing don't let the copy happen.
															_logger.info("Destination is missing the track ["+name+"]");
															found = false;
													}
											}
									}
							}
							if (found) break;
					}
			}
			_logger.info("trackTypeInDest == "+ ret);
			return ret;
	}

	/**
	 *  Return the Tracks from the material that are part of the tracktypegroup passed
	 * @param materialId
	 * @param trackTypeGroup
	 * @returns {ArrayList}
	 */
	function getTrackTypesFromMaterial (materialId, trackTypeGroup) {

			if( isVarUsable(materialId) ) {
					var tracktypes = getTrackTypesFromGroup(trackTypeGroup);
					var material = materialGet(materialId,  ["tracktypelinks"]);
					var trackTypeLinkList = material.getTrackTypeLinks();
					var retTracks = new ArrayList();

					if( isVarUsable(material) ) {
							for (var i = 0; i < trackTypeLinkList.size(); i++) {
									var trackTypeLink = trackTypeLinkList.get(i);

									//show(trackTypeLink);
									var trackTypeGroupName = trackTypeLink.getTrackType().getName().toString();
									//_logger.info("trackTypeGroupName: "+trackTypeGroupName);
									_logger.info("Compare "+trackTypeGroup+" to "+trackTypeGroupName);
									if( trackTypeGroupName == trackTypeGroup) {
											_logger.info("\tMatch: "+trackTypeGroupName);
											for each (var tracktype in tracktypes.toArray()) {
													if (tracktype == trackTypeGroupName) {
															//_logger.info("tracktype = " + tracktype);
															retTracks.add(trackTypeGroupName);
													}
											}
											break;
									}
							}
					}
			}
			_logger.info("Material ["+materialId+"] has the track type groups : "+retTracks);
			return retTracks;
	}

	/**
	 * Return the XML for the tracks in the track type group passed.
	 * @param trackTypeGroupName
	 * @returns {Array}
	 */
	function trackTypeGroupGet (trackTypeGroupName){
			_logger.info("Getting tracks for group "+trackTypeGroupName);
			const SHORT_TEXT = "shorttext";
			var command = new Command("trackType","getTrackTypeGroup");
			command.addParameter("name", trackTypeGroupName);
			//var options = new PresetOptions();
			//options.addOption(SHORT_TEXT);
			//command.addParameter("options",options);
			var commandResult = _commandHelper.runCommand(command);
			if(commandResult.getSuccess()){
					return commandResult.getOutput();
			} else {
					_logger.info("No tracktypes Found ");
					return null;
			}
	}

	/**
	 * Returns the tracks types for the group passed.
	 * For Surround English (US) it would return
	 * [TrackType[id=207, name = [Surround Front English (US)]], TrackType[id=206, name = [Surro
	 * und C/LFE English (US)]], TrackType[id=208, name = [Surround Rear English (US)]]]
	 *
	 * @param aTrackTypeGroup
	 * @returns {Array}
	 */
	function getTrackTypesFromGroup (aTrackTypeGroup) {
			var ret = new ArrayList();
			_logger.info("\nMapping Track Type [" + aTrackTypeGroup + "] to Mediator Track Types");
			var xmlTrackTypes = trackTypeGroupGet(aTrackTypeGroup);
			_logger.info("xmlTrackTypes = "+xmlTrackTypes);
			if( isVarUsable(xmlTrackTypes)) {
					var tracks = xmlTrackTypes.getTrackTypes();
					_logger.info("tracks = " + tracks);

					if (tracks.size() === 0)
							throw new Error("No TrackTypes Defined for Track Type Group [" + aTrackTypeGroup + "].\n" +
							"Are Track Type Links and Track Type Groups Correctly Configured?");

					// Convert the XML to an array
					if (isVarUsable(tracks)) {
							ret = new ArrayList();
							//for each(var trackType in trackTypeList.toArray()) {
							for (var i = 0; i < tracks.size(); i++) {
									var trackType = tracks.get(i);
									if (isVarUsable(trackType)) {
											//_logger.info("trackType = " + trackType.getName());
											ret.add(trackType.getName().toString());
									}
							}
					} else {
							_logger.info("output was NULL commandResult = " + commandResult.toString());
					}
			}

			return ret;
	}

	/**
	* Return true if the material ID has audio tracks we can get the destination path from.
	* This is not being used but kept it in the code for reference on how to do a materialReport using the MaterialReportParameter
	* @param matID
	* @returns {boolean}
	*/
	function hasTracksReport(matId) {
		var ret = false;
		var custReportParameters = new CustomReportParameterList();
		var customReportRuntimeParametersDefault = new CustomReportRuntimeParametersDefault();
		//var reportName = "listTrackTypesInMediator";
		//var reportName = "listTrackTypesAndGroupsInMediator"; // Must change NAME below to TYPE_NAME
		var reportName = "listMaterialTracks";
		_logger.info("Running Report listMaterialTracks");
		var command = new Command("report", "runReport");
		command.addParameter("reportName", reportName);
		command.addParameter("pageSize", new Integer(2000));

		var reportParameter = new MaterialReportParameter();
		reportParameter.setName("matId");
		reportParameter.setValue(matId);
		reportParameter.setOperator("is");
		custReportParameters.add(reportParameter);

		customReportRuntimeParametersDefault.setParameters(custReportParameters);
		command.addParameter("reportParameters", customReportRuntimeParametersDefault);

		var reportResults = _commandHelper.runCommand(command);
		_logger.info("listMaterialTracks reportResults == "+reportResults!=null?(reportResults.getSuccess()?"true":"false"):"NULL");
		if (reportResults && reportResults.getSuccess() == true) {
			//_logger.info("Report ran successfuly");
			var results = reportResults.getOutput().getList().getList();
			if( results.size() > 0 ) {
				//_logger.info("results == "+results);
				//_logger.info("Material ["+matId+"] has ["+results.size()+"] Tracks")
				ret = true;
			}
		}
		return ret;
	}

	/**
	* Return true if the material ID has tracks we can get the destination path from.
	* @param matID
	* @returns {boolean}
	*/
	function hasTracks(matId) {

		_logger.info("hasTrackshasTrackshasTrackshasTracks");
		var material = materialGet(matId,  ["tracks"]);
		var trackList = material.getTracks();
		_logger.info(trackList.size());
		return (trackList.size() > 0);
	}

	/**
	 *
	 * @param sourceId
	 * @param DestId
	 * @returns {boolean}
	 */
	function isTvdNumSame(sourceId, destId) {
			ret = false;
			var options = [SHORT_TEXT,TAG];
			var matSource = materialGet(sourceId,options);
			var matDest = materialGet(destId,options);
			_logger.info("matSource = "+ matSource.toString());
			var shortTextList = matSource.getShortTextList();
			_logger.info("shortTextList = "+ shortTextList.toString());
			tvdSource = getValueFromShortTextList(shortTextList,"TVD Production #").toString();
			_logger.info("tvdSource = "+ tvdSource.toString());
			shortTextList = matDest.getShortTextList();
			tvdDest = getValueFromShortTextList(shortTextList,"TVD Production #").toString();

			_logger.info("TVDs = Source["+tvdSource+"] Dest["+tvdDest+"]");
			if( tvdSource == tvdDest ) {
					ret = true;
			}
			return ret;
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
			if(isVarUsable(shortTextList) && shortTextList.size()>=1){

					for (var i = 0; i < shortTextList.size(); i++) {
							var shortText = shortTextList.get(i);
							if(isVarUsable(shortText) && shortText.getShortTextType()==shortTextName){
									shortTextValue = shortText.getShortText();
									break;
							}
					}
			}
			return shortTextValue;
	}

	/**
	 *
	 * @returns {tvdSource}
	 */
	function getTvdSource() {
			return tvdSource;
	}

	/**
	 *
	 * @returns {tvdDest}
	 */
	function getTvdDest() {
			return tvdDest;
	}

  //
	// Start the script
  //

	_logger.info("Running Audio Track Type Group Copy Validation Script");

	var isValidationError = false;
	var error = "";
	var materialIdSource = _formData.getValue(SOURCE_MATID);
	var materialIdDest = _formData.getValue(DEST_MATID);
	var trackTypeGroup = _formData.getValue(TRACK_TYPE_GROUPS); // The selected TrackTypeGroup
	var forceCopy = _formData.getValue(FORCE_COPY).toString().toLowerCase() == 'true';

	_logger.info("forceCopy = ["+_formData.getValue(FORCE_COPY).toString().toLowerCase()+"] - ["+forceCopy+"]");
	_logger.info("TrackTypeGroup ="+trackTypeGroup);

	// validate Material IDs
	// A loop so we can break out on errors and not run extra validation
	while(true) {

		if (!isValidMaterialId(materialIdSource)) {
			_validationResult.addError(SOURCE_MATID, "Please provide a Valid Source Material ID");
			isValidationError = true;
			break;
		}

		if (!isValidMaterialId(materialIdDest)) {
			_validationResult.addError(DEST_MATID, "Please provide a Valid Destination Material ID");
			isValidationError = true;
			break;
		}

		if (materialIdSource == materialIdDest ) {
			error = "The Source & Destination Material IDs must be different "+materialIdSource.toString();
			_validationResult.addError(SOURCE_MATID,error);
			_validationResult.addError(DEST_MATID,error);
			isValidationError = true;
			break;
		}

		// Validate the track type group
		if (trackTypeGroup.substr(0, 7) == "Invalid" ) {
			error = "The Source Material does not contain any audio tracks, please select another";
      _validationResult.addError(SOURCE_MATID, error);
      _validationResult.addError(TRACK_TYPE_GROUPS, error);
      break;
		}

		// Validate the source material is in the ready state.
		if (!isMaterialIdReady(materialIdSource, trackTypeGroup) && !forceCopy ) {
			error = "One or more of the source material audio tracks selected for copying is not in the Ready state. Please enable Force Copy to copy";
			_validationResult.addError(SOURCE_MATID, error);
			_validationResult.addError(FORCE_COPY, error);
			break;
		}

		// Validate the Destination does not have the track type group already.
		if (trackTypeInDest(materialIdDest, trackTypeGroup) && !forceCopy) {
			error = "The destination material already contains the track type group "+trackTypeGroup+". Please enable Force Copy to copy";
			_validationResult.addError(DEST_MATID, error);
			_validationResult.addError(FORCE_COPY, error);
			break;
		}

		// Validate the destination has tracks we can get the track path from..
		if (!hasTracks(materialIdDest)) {
			error = "Destination Material has no tracks to find the target path. Please make sure the tracks have not been archived.";
			_validationResult.addError(DEST_MATID, error);
			_validationResult.addError(FORCE_COPY, error);
			break;
		}

		// Do the TVD numbers match
		if( !isTvdNumSame(materialIdSource, materialIdDest)) {
	    error = "The TVD numbers much match between the source ["+getTvdSource()+"] and destination ["+getTvdDest()+"]  materials";
	    _validationResult.addError(SOURCE_MATID, error);
	    _validationResult.addError(DEST_MATID, error);
	    break;
		}

		// Always break at te ned of this loop
		break;
	}
	_logger.info("Completed Audio Track Type Group Copy Validation Script"+(isValidationError?" with errors":""));
}
