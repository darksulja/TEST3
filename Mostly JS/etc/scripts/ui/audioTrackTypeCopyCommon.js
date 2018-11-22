var java = JavaImporter(
    Packages.java.util.ArrayList,
    Packages.com.pharos.core.domain,
    Packages.com.pharos.core.domain.utils,
    Packages.com.pharos.core.domain.job,
    Packages.com.pharos.core.domain.list,
    Packages.com.pharos.core.domain.reports,
    Packages.java.lang.Integer
    );

with (java) {

    /**
     * Show the contents of a JavaScript Object
     * @param object
     */
    function show(object) {
        _logger.info(object);
        for (prop in object) {
            _logger.info(prop + " : " + object[prop]);
        }
    }

    /**
     *	[isVarUsable - Checks whether a given argument is null, undefined or an empty string]
     *	@param	{[Any]} - The variable you wish to test
     *	@return {Boolean} - Whether the variable is 'useable'
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
     * Dup of what getTrackTypesFromGroup returns
     * [getTrackTypeGroupTracks List Track Types Group Tracks]
     *  [Surround Front English (US), Surround C/LFE English (US), Surround Rear English (US)]
     * @return [List] List of Strings Track Types + Track Type Groups
     */
    /*function getTrackTypeGroupTracks(aTrackTypeGroup) {
        var ret = null;
        //_logger.info("Running  command  trackType->getTrackTypeGroup(" + aTrackTypeGroup + ")");

        var command = new Command("trackType", "getTrackTypeGroup");
        command.addParameter("name", aTrackTypeGroup);
        var commandResult = _commandHelper.runCommand(command);
        if (commandResult.getSuccess()) {
            //_logger.info("Success in getTrackTypeGroupTracks");
            var output = commandResult.getOutput();
            if (isVarUsable(output)) {
                var trackTypeList = output.getTrackTypes();

                if (isVarUsable(trackTypeList)) {
                    ret = new ArrayList();
                    //for each(var trackType in trackTypeList.toArray()) {
                    for (var i = 0; i < trackTypeList.size(); i++) {
                        var trackType = trackTypeList.get(i);
                        if (isVarUsable(trackType)) {
                            //_logger.info("trackType = " + trackType.getName());
                            ret.add(trackType.getName());
                        }
                    }
                } else {
                    _logger.info("output was NULL commandResult = " + commandResult.toString());
                }
            }
        } else {
            _logger.info("Failure in getTrackTypeGroup");
        }
        return ret;
    }*/

    /**
     *  Return the Tracks from the material that are part of the tracktypegroup passed
     * @param materialId
     * @param trackTypeGroup
     * @returns {ArrayList}
     */
    function getTrackTypesFromMaterial (materialId, trackTypeGroup) {

        /*Compare Surround English (US) to trackTypeLinkList.size() == 4
        trackTypeGroupName: Video
        tracktype = Surround Front English (US)
        tracktype = Surround C/LFE English (US)
        tracktype = Surround Rear English (US)
        trackTypeGroupName: MOS
        tracktype = Surround Front English (US)
        tracktype = Surround C/LFE English (US)
        tracktype = Surround Rear English (US)
        trackTypeGroupName: Stereo English (US)
        tracktype = Surround Front English (US)
        tracktype = Surround C/LFE English (US)
        tracktype = Surround Rear English (US)
        trackTypeGroupName: Stereo Spanish (Latin America)
        tracktype = Surround Front English (US)
        tracktype = Surround C/LFE English (US)
        tracktype = Surround Rear English (US)
        getTrackTypesFromMaterial == []*/

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
     * return true if the dest has all the tracks for the track type group passed.
     * @param tracktypeGroup
     * @returns {boolean}
     */
    function trackTypeInDest(materialId, tracktypeGroup) {
        var ret = false;
        var material = materialGet(materialId, ["tracktypelinks"]);
        //var sourceTrackTypeGroupNames = getTrackTypeGroupNames(material);
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
                    //for each(var name in tracks.toArray()) {
                        _logger.info("Processing: " + name);
                        // Only process valid groups that are NOT Video
                        if (isVarUsable(name) && name != "Video") {
                            _logger.info("groupName match: "+groupName+" == "+ name);
 //   groupName match: Surround Rear English (US) == Stereo English (US)
                            if (groupName == name) {
                                // We have a match between the material and the list, so keep this one.
                                _logger.info("Using " + name);
                                newTTGNameList.add(tracktypeGroup.replace(",", " @ "));
                                // todo Should I make sure the source has all the tracked needed for the group
                                ret = true;
                                break;
                            }
                            else {
                                // If any of the track types are missing let the copy happen.
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
     * get the audio track types from the group passed.
     * @param aTrackTypeGroup - The group to get the track types from
     * @return {Array}
     */
    /*function trackTypeGroupGet(trackTypeGroupName){
        if (debug) _logger.info("\nDEBUG: In getTrackTypeGroup() Looking Up Track Type Group ["+trackTypeGroupName+"]");

        // This is using puffin http://localhost:50/config/puffin.html#trackType.getTrackTypeGroup
		// Todo To get the materials Track Type Groups use: "material", "get" - Add Parameters "matId", MyMatId -  "options", "trackTypeLinks"
		var command = new Command("trackType","getTrackTypeGroup");
		command.addParameter("name", trackTypeGroupName);
		var commandResult = _commandHelper.runCommand(command);
		if(commandResult.getSuccess()){

			// some code
		} else {
			// some code
		}
    }*/

}