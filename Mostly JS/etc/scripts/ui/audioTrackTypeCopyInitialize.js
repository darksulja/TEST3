var java = JavaImporter(
	Packages.java.util.ArrayList,
	Packages.com.pharos.core.domain,
	Packages.com.pharos.core.domain.utils,
	Packages.com.pharos.core.domain.job,
	Packages.com.pharos.core.domain.list,
	Packages.com.pharos.core.domain.reports,
	Packages.java.lang.Integer
);

// Declaring Constants - Form Data Keys
const TRACK_TYPE_GROUP = "TrackTypeGroup";
const TRACK_TYPE_GROUPS = "TrackTypeGroups";
const SOURCE_MATID = "Material.MatId.source";
const DEST_MATID = "Material.MatId.destination";
const FORCE_COPY = "ForceCopy";

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
	 * [listTrackTypeGroupsInMediator List TrackTypes And Groups]
	 * @return [List] List of Strings Track Types + Track Type Groups
	 */
	function listTrackTypeGroupsInMediator() {
			//var reportName = "listTrackTypesInMediator";
			//var reportName = "listTrackTypesAndGroupsInMediator"; // Must change NAME below to TYPE_NAME
			var reportName = "listTrackTypeGroupsInMediator";
			_logger.info("Running  Report listTrackTypeGroupsInMediator");
			var command = new Command("report", "runReport");
			command.addParameter("reportName", reportName);
			command.addParameter("pageSize", new Integer(2000));
			var reportResults = _commandHelper.runCommand(command);
			if (reportResults && reportResults.getSuccess() == true) {
					_logger.info("Processing Report listTrackTypeGroupsInMediator Results");
					var results = reportResults.getOutput().getList().getList();
					var trackTypeGroups = new ArrayList();
					for (var i = 0; i < results.size(); i++) {
							var name = results.get(i).get("NAME");
							if (isVarUsable(name)) {
									trackTypeGroups.add(name.replace(",", " @ "));
							}
					}
					return trackTypeGroups;
			}
			return null;
	}

	//
	// Start the Script
	//

	_logger.info("Running Audio Track Type Group Copy Initialization Script");

	// Load the Track Type Group Dropdown with all the Track Type groups
	var trackTypeGroups = listTrackTypeGroupsInMediator();

	_formData.addDataField(TRACK_TYPE_GROUPS, trackTypeGroups.toArray().join());

	_logger.info("Completed Audio Track Type Group Copy Initialization Script");
}
