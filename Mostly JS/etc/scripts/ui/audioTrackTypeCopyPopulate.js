var java = JavaImporter(
    Packages.java.util.ArrayList,
    Packages.com.pharos.core.domain,
    Packages.com.pharos.core.domain.utils,
    Packages.com.pharos.core.domain.list,
    Packages.com.pharos.core.domain.options,
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

    /**
     * return a list of the track type groups used in the material passed.
     * @param material
     * @returns {ArrayList}
     */
    function getTrackTypeGroupNames(material) {
        var sourceTrackTypeGroupNames = new ArrayList();
        var trackTypeLinkList = material.getTrackTypeLinks();
        //_logger.info("trackTypeLinkList = "+ trackTypeLinkList);

        //_logger.info("trackTypeLinkList.size() = "+trackTypeLinkList.size());
        for (var i = 0; i < trackTypeLinkList.size(); i++) {
            var ttLink = trackTypeLinkList.get(i);
            var trackTypeGroupName = ttLink.getTrackType().getName().toString();
            sourceTrackTypeGroupNames.add(trackTypeGroupName);
        }
        return sourceTrackTypeGroupNames;
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

    //
    // Start of the Script
    //

    _logger.info("Running Audio Track Type Group Copy Populate Script");
    _logger.info("Running populate script with selection [" + _selection + "] and dataKey [" + _dataKey + "]");

    var materialIdSource = _formData.getValue(SOURCE_MATID);
    var materialIdDest = _formData.getValue(DEST_MATID);
    var trackTypeGroup = _formData.getValue(TRACK_TYPE_GROUPS); // The selected TrackTypeGroup
    var forceCopy = _formData.getValue(FORCE_COPY);

    var trackTypeGroupNames = listTrackTypeGroupsInMediator();

    // Validate the Source Material ID
    if (_dataKey == SOURCE_MATID && isVarUsable(_selection)) {

        // Change the Track Type List to only those in this materialID
        _logger.info("Processing Source MatID Populate");

        // Get the track type from the material
        var material = materialGet(_selection, ["tracktypelinks"]);
        if (isVarUsable(material)) {

            var sourceTrackTypeGroupNames = getTrackTypeGroupNames(material);

            _logger.info("sourceTrackTypeGroupNames = " + sourceTrackTypeGroupNames);

            var newTTGNameList = new ArrayList();
            var tTGNameList = new ArrayList();
            for each(var ttgName in trackTypeGroupNames.toArray()) {
                //_logger.info("Processing Mediator: " + ttgName);
                var groupTracks = getTrackTypesFromGroup(ttgName);
                if (isVarUsable(groupTracks)) {
                    //_logger.info("groupTracks.size() = " + groupTracks.size());
                    for (i = 0; i < groupTracks.size(); i++) {
                        var found = true;
                        var groupName = groupTracks.get(i);
                        if (isVarUsable(groupName) && groupName != "Video") {
                            // Only process valid groups that are NOT Video
                            //_logger.info("GroupName =  " + groupName);
                            for each(var name in sourceTrackTypeGroupNames.toArray()) {
                                //_logger.info("Processing: " + name);
                                if (isVarUsable(name) && name != "Video") {
                                    _logger.info("Source GroupName =  " + name);

                                    if (groupName == name) {
                                        // We have a match between the material and the list, so keep this one.
                                        //_logger.info("Using: " + ttgName);
                                        newTTGNameList.add(ttgName.replace(",", " @ "));
                                        // todo Should I make sure the source has all the tracked needed for the group
                                        //found = true;
                                        break;
                                    }
                                    else {
                                        // If it does not have ALL the tracks its not used in this material.
                                        found = false;
                                    }
                                }
                            }
                        }
                        if (!found) break;
                    }
                }
            }

            for (i = 0; i < newTTGNameList.size() - 1; i++) {
                var first = newTTGNameList.get(i).toString();
                _logger.info("Using: " + first);
                tTGNameList.add(first);
            }

            if (tTGNameList.size() == 0) {
                tTGNameList.add("Invalid Source Material: No Audio Tracks!");
            } else {
                // Put in the last one in the list we did not check above.
                tTGNameList.add(newTTGNameList.get(newTTGNameList.size()-1).toString());
            }

            _logger.info("Loading TrackTypeGroup Dropdown with: " + tTGNameList);

            _formData.addDataField(TRACK_TYPE_GROUPS, tTGNameList.toArray().join());
        }
        else {
            _logger.info("ERROR: Invalid Material ID used in Source Material");
        }
    }

    _logger.info("Completed Audio Track Type Group Copy Populate Script");
}
