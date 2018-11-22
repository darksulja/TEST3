/**
 * AudioComponentHelper
 *
 * Helper class for audio components
 * Find all audio tracks
 * Map the audio tracks to their corresponding group
 * Copy TrackTypeGroups between audio Components
 *
 * Usage Example:
 *
 * if(typeof(AudioComponentHelper) === "undefined"){
 *    print("Loading AudioComponentHelper")
 *    load("/opt/evertz/mediator/etc/runners/AudioComponentHelper.js");
 * }
 * var acHelper = new AudioComponentHelper();
 * acHelper.getAudioTrackTypes(materialId);
 */

"use strict";

// Import for the logger.
importPackage(Packages.org.apache.log4j);

var AudioComponentHelper = (function () {

    //
    // Define any global vars or functions
    //

    /**
     * Constructor for AudioComponentHelper
     * @param sourceID
     * @param destID
     * @param trackTypeGroup
     * @constructor
     */
    var AudioComponentHelper;
    var logger;             // Interface to the log4J logger class
    var dryRun = false;     // If True the copy of files and metadata will not take place

    /**
     * Display all properties/functions of an object (note: not recursive)
     * This uses logger.info, not print
     *
     * @usage    show(object)
     * @param    {Object}    object    object to display
     */
    function show(object) {
        logger.info(object);
        for (prop in object) {
            logger.info(prop + " : " + object[prop]);
        }
    }

    AudioComponentHelper = function (sourceID, destID, trackTypeGroup, force) {

        //
        // Define and setup the logger
        //
        this.setupLogger();

        if (dryRun) {
            logger.info("* * * *  T H I S  I S  A  D R Y R U N   * * * *");
        }

        //
        // Define any public vars and attach them to 'this'
        //

        /**
         * holds the JobDescription
         * @type {XML} The Job Description
         */
        try {
            this.jobDescription = getJobParameter("jobDescription");
        } catch (e) {
            // We must be running standalone and not part of a job.
            this.jobDescription = null;
        }

        /**
         * @type {boolean} If true the copy will happen even if the target already has the track.
         */
        this.forceCopy = false;
        this.setForceCopy(force);
        logger.info("forceCopy set to " + this.forceCopy);

        /**
         * [jobDashboard]
         * The dashboard to update during the copy process
         */
        this.jobDashboard = null;

        /**
         * @type {string} Path to material
         */
        this.path = "";

        /**
         * @type {object} Source material
         */
        this.sourceObj = null;

        /**
         * @type {object} Target material
         */
        this.targetObj = null;

        /**
         * @type {string} Material ID
         */
        this.sourceMatId = sourceID;

        /**
         * @type {string} Material ID
         */
        this.targetMatId = destID;

        /**
         * @type {Array} The Audio Track Type Groups from the source
         */
        this.sourceTrackTypes = null;

        /**
         * @type {Array} The Audio Track Type Groups from the target
         */
        this.targetTrackTypes = null;

        /**
         * @type {string} The track Type Group to copy
         */
        this.trackTypeGroup = trackTypeGroup;

        /**
         * @type {Array} The track Types of the group in this.trackTypeGroup
         */
        this.trackTypeGroupNames = [];

        /**
         * @type {Array} The track Types of the group in this.trackTypeGroup
         */
        this.groupTrackTypes = [];

        // Test if we were instantiated!
        // todo !?! This does not seem to work, if I new or not this does not get called. May have something todo with this being in a closure or maybe rhino?????
        if ((this instanceof AudioComponentHelper) === false) {
            throw new Error("Please call constructor with new() keyword");
        }

        //
        // Load needed libraries
        //

        if (typeof(gmoNBCFunc) === "undefined") {
            logger.info("Loading nbcgmo_fun");
            load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
            //print = gmoNBCFunc.printOrLog;
        }

        if (typeof(gmoNBCNLDFunc) === "undefined") {
            logger.info("Loading nbcgmo_nld_fun");
            load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
        }

        if (typeof(gmoNBCCompFunc) === "undefined") {
            logger.info("Loading gmoNBCCompFunc");
            load("/opt/evertz/mediator/etc/runners/nbcgmo_component_fun.js");
        }

        if (typeof(MediaInfoHelper) === "undefined") {
            logger.info("Loading MediaInfoHelper");
            load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");
        }

        debug = false;	// More logging if true

        // Login to the webservices
        // NOTE: !?! nbcgmo_fun is loading sessionkey, but it is invalid because lookup.js does a wsLogout() but does not reset sessionkey? So it cannot be tested for validity here?
        logger.info("Logging into Server [localhost] in AudioComponentHelper");
        wsLogin("localhost", "wsuser", "wspass");

        if (debug) print("\nJobDesc\n" + this.jobDescription + "\n");
    };

    /**
     * .prototype Example
     * variables and functions define within the .prototype are shared by all instances.
     * There is only one instantiated.
     *
         function User() {

			var name = "my name";

			this.foo = function () {
				// one function per User instance
				// can access 'name' variable
			};
		 }

         User.prototype.bar = function () {
			// one function shared by all User instances
			// cannot access 'name' variable
		 };

         var a = new User();
         var b = new User();

         console.log(a.foo === b.foo); // false; each instance has its own foo()
         console.log(a.bar === b.bar); // true; both instances use the same bar()
     */

    //
    // Define the prototype methods and variables
    //

    /**
     * This classes prototypes
     * Items in .prototype are shared by all instances. There is only one instantiated.
     */
    AudioComponentHelper.prototype = {

        /**
         * Define the constructor
         * @type {AudioComponentHelper|*}
         */
        constructor: AudioComponentHelper,

        /**
         * set up the log4j logger
         */
        setupLogger: function () {
            try {
                if (logger == undefined) {
                    logger = Logger.getLogger("AudioComponentHelper");
                    logger.info("Starting logger in AudioComponentHelper");
                    logger.debug("We are in debug mode for logging!");
                } else {
                    logger.info("Logger already defined!");
                }
            } catch (e) {
                throw new Error("Error setting up the logger! [" + e.message + "]");
            }
            this.isPrivate = true;
            logger.info("Inside prototype.setupLogger, isPrivate =" + this.isPrivate);
        },

        /**
         * Set the fourceCopy Variable
         * Handle both boolean or strings
         * @param force
         */
        setForceCopy: function (force) {
            this.forceCopy = (force.toString().toLowerCase() == 'true');
        },


        /**
         *
         * @param aDashboard
         */
        setJobDashboard : function(aDashboard) {
            this.jobDashboard = aDashboard;
        },

        /**
         * Update the Job Dashboard if defined.
         * @param msg
         * @param percent
         */
        updateJobDashboard : function (msg, percent) {
            if( gmoNBCFunc.isVarUsable(this.jobDashboard)) {
                this.jobDashboard.updateStatusAndProgress(msg, percent);
            }
        },

        /**
         * Extract the Audio Track Type Groups from Side Car Xml
         * @param _obj      - _sidecarxml
         * @returns {Array} - _trackTypes (Containing the Audio Track Types extracted)
         */
        extractAudioTrackTypesGroupsFromSideCarXml: function (_obj) {
            var _sidecarxml = _obj.parsedxml;
            var _trackTypeGroups = [];
            logger.info("\nExtracting Audio Track Types Groups from [" + _obj.xmlfile + "]\n");

            for (var i = 0; i < _sidecarxml.Tracks.Track.length(); i++) {
                var _trackTypeName = _sidecarxml.Tracks.Track[i].Track_Type_Name.toString();
                var _xmlTrackType = _sidecarxml.Tracks.Track[i].@type.toString();
                if (_xmlTrackType == "Audio") {
                    logger.info("\t" + _xmlTrackType + " [" + _trackTypeName + "]");
                    _trackTypeGroups.push(_trackTypeName);
                }
            }
            //
            // Todo: Add in a check here to call a function from nbcgmo_fun.js to check that the Track Types are in Mediator!
            //
            return _trackTypeGroups;
        },

        /**
         * Function to map the TrackTypes in the SideCar Xml to Track Types in Mediator
         * *** Optional @param [string/array] (ensureTrackTypes) *** - If used the return array must contain those Track Types
         *
         * @param {Array} xmlTrackTypes - List of the Xml Track Types which should link to Track Type Groups in Mediator
         * @param ensureTrackTypes
         * @returns {Array}
         *
         * @error - If the Track Type Group is Blank - I.e. if the Track Type Group doesn't exist
         * @error - If ensureTrackTypes is true and those Track Types aren't found
         * @error - If 0 Track Types are found
         */
        getMediatorTrackTypesFromXmlTrackTypes: function (xmlTrackTypes, ensureTrackTypes) {
            try {
                if (debug) logger.info("\nDEBUG: In getMediatorTrackTypesFromXmlTrackTypes() with XmlTrackType Array [" + xmlTrackTypes + "]");
                // Return
                var trackTypes = [];

                // Loop through Input Array Getting TrackTypeGroup Xml
                for (var i = 0; i < xmlTrackTypes.length; i++) {
                    //var trackTypeGroupName = xmlTrackTypes[i];
                    logger.info("Mapping Xml Track Type [" + trackTypeGroupName + "] to Mediator Track Types");
                    var trackTypeGroupXml = gmoNBCFunc.trackTypeGroupGet(this.trackTypeGroup);
                    if (trackTypeGroupXml.TrackType.length() === 0) throw new Error("No TrackTypes Defined for Track Type Group [" + trackTypeGroupName + "].\n" +
                    "Are Track Type Links and Track Type Groups Correctly Configured?");

                    // Extract the Track Type Names from each TrackTypeGroup Get
                    for (var j = 0; j < trackTypeGroupXml.TrackType.length(); j++) {
                        logger.info("\tFound Mediator TrackType [" + trackTypeGroupXml.TrackType[j].Name.toString() + "]");
                        trackTypes.push(trackTypeGroupXml.TrackType[j].Name.toString());
                    }
                }
                if (ensureTrackTypes) {
                    //If they pass in one item or a string comma separated list, make it into an array
                    if (typeof(ensureTrackTypes) === "string") ensureTrackTypes = ensureTrackTypes.split(",");
                    for each (var trackType in ensureTrackTypes) {
                        if (trackTypes.indexOf(trackType) === -1) throw new Error("\nCould not find Track Type in final Mediator TrackTypes [" + trackType + "]");
                    }
                }
            } catch (e) {
                throw new Error("Unable to find any Track from Xml Track Types [" + xmlTrackTypes + "]\n" +
                "Are Track Type Links and Track Type Groups Correctly Configured in Mediator?");
            }

            if (trackTypes.length === 0) throw new Error("Was unable to find any Track from Xml Track Types [" + xmlTrackTypes + "]\n" +
            "Are Track Type Links and Track Type Groups Correctly Configured in Mediator?");
            return trackTypes;
        },


        /**
         *Returns Boolean based on whether value is in array
         *@param [arr] [The array to use]
         *@param [val] [The value to match in array]
         *@return [Returns Boolean]
         */

        contains:function(arr, val) {
            if (arr.toString() == val) return true;
            var i = arr.length;
            while (i--) if (arr[i].toString() == val) return true;
            return false;
        },

        /**
         * check if passed group is in the passed group array
         * @param {Array<string>} aGroups - The array of groups
         * @param {string} aTrackTypeGroup - The group being searched for
         * @returns {boolean}
         */
        hasTrackTypeGroup: function (aGroups, aTrackTypeGroup) {
            var ret = false;

            for each(var group in aGroups) {
                if (group == aTrackTypeGroup) {
                    ret = true;
                    break;
                }
            }
            return ret;
        },

        /**
         * check if all passed source tracks are in the passed target tracks
         * @param {Array<string>} aSourceTT - The array of track types from the source
         * @param {Array<string>} aTargetTT - The group of track types from the target
         * @returns {boolean} false if any tracks are missing from the target
         */
        hasTrackTypes: function (aSourceTT, aTargetTT) {
            var ret = true;
            var length = aSourceTT..TrackDefinition.length;
            logger.info("aSourceTT..TrackDefinition.length = "+length );

            if( length > 0 ) {
                for each(var sTrack in aSourceTT..TrackDefinition) {
                    var matched = false;
                    for each(var tTrack in aTargetTT..TrackDefinition) {
                        if (sTrack.TrackTypeName == tTrack.TrackTypeName) {
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) {
                        logger.info("No '" + sTrack.TrackTypeName + "' found in target - need to copy!");
                        ret = false;
                        break;
                    }
                }
            }
            else
                ret = false;
            return ret;
        },

        /**
         * get the audio track types from the group passed.
         * @param aTrackTypeGroup - The group to get the track types from
         * @return {Array}
         */
        getTrackTypesFromGroup: function (aTrackTypeGroup) {
            var groupTrackTypes = [];

            logger.info("\nMapping Track Type [" + aTrackTypeGroup + "] to Mediator Track Types");
            var xmlTrackTypes = gmoNBCFunc.trackTypeGroupGet(aTrackTypeGroup);
            ///logger.info("xmlTrackTypes = ");
            //show(xmlTrackTypes);

            if (xmlTrackTypes.TrackType.length() === 0)
                throw new Error("No TrackTypes Defined for Track Type Group [" + aTrackTypeGroup + "].\n" +
                "Are Track Type Links and Track Type Groups Correctly Configured?");

            // logger.info("tracksXML for matID:"+materialId);
            // show( tracksXML );

            // Extract the Track Types
            for (var j = 0; j < xmlTrackTypes.TrackType.length(); j++) {
                logger.info("\tFound Mediator TrackType [" + xmlTrackTypes.TrackType[j].Name.toString() + "]");
                //groupTrackTypes.push(xmlTrackTypes.TrackType[j].Name.toString());
                groupTrackTypes.push(xmlTrackTypes.TrackType[j]);
            }
            if (debug) {
                logger.info("The track types for group " + aTrackTypeGroup + " are:");
                show(groupTrackTypes);
            }
            return groupTrackTypes;
        },

        /**
         *    Returns a Track Type from an array if the track type starts with a specified string
         *    @param[array] - list of track types to search
         *    @param[string] - string that track type should start with
         *    @error - if there are not exactly three tracktypes in the array
         *    @error - if no track type match was found
         **/
        getTrackTypeByStartString: function (trackTypeArr, trackTypeStr) {

            if (trackTypeArr.length !== 3) throw new Error("Surround Track Type must have exactly 3 Track Types. Specified [" + trackTypeArr + "]");

            for each(var trackType in trackTypeArr) {
                if (gmoNBCFunc.startsWith(trackType, trackTypeStr)) return trackType;
            }

            throw new Error("Failed to find a Track Type that stars with [" + trackTypeStr + "] out of [" + trackTypeArr + "]");
        },

        /**
         * Get the material XML for the ID passed
         * @param aMatId
         * @returns {Object[]|XML}
         */
        materialGet: function (aMatId) {
            return materialGet(aMatId, "tracktypelinks", "tracks", "shorttext", "tag");
        },

        /**
         * Save the track definitions for the target
         *
         * Note: This was saving to much. It was putting the new Audio tracktypes on all the media. I switched to use makeAndSaveTrackDef() in copyTrackTypeGroup()
         * @param sourceTrackTypes
         * @param targetTrackTypes
         */
        saveTracks: function (sObj, tObj) {
            logger.info("############# Saving Track types");
            try {
                var targetXml = this.materialGet(tObj.matId);
                var sourceXml = this.materialGet(sObj.matId);

                var targetTTLs = [];
                for each (var ttl in targetXml..TrackTypeLink) {
                    targetTTLs.push(ttl.TrackTypeName.toString());
                }
                logger.info("Target Array = \n\t" + targetTTLs);

                for each (var sttl in sourceXml..TrackTypeLink) {

                    if (!gmoNBCFunc.contains(targetTTLs, sttl.TrackTypeName.toString())) {
                        ///logger.info("targetTTLs did not contain "+ sttl.TrackTypeName);
                        // Add this track type link to the target
                        targetTTLs.push(sttl.TrackTypeName.toString());
                    }
                }
                logger.info("Target Array (Amended) = \n\t" + targetTTLs);
                // if (gmoNBCFunc.contains(arr,track_TypeName)) {
                // 	arr.remove(track_TypeName);
                // } else {
                // 	logger.info("Track type link [" + track_TypeName + "] does not exist on the material, continuing on...");
                // 	continue;
                // }

                //Save our new track definitions
                // @formatter:off
				var material_SaveXml =
					<Material>
						<MatId>{tObj.matId}</MatId>
					</Material>;
				// @formatter:on

                if (targetXml..Track) {
                    for each (var bTrack in targetXml..Track) {
                        ///logger.info("bTrack = "+bTrack.toSource());
                        var trackDef_List = new XMLList();
                        // @formatter:off
						var trackXml =
							<Track>
								<MediaName>{bTrack.MediaName.toString()}</MediaName>
							</Track>;
						// @formatter:on

            // Add back all the materials current track types
            for each (bTdef in bTrack.TrackDefinition) {
                //if (bTdef.TrackTypeName.toString() != track_TypeName) {
                logger.info("Saving: " + bTdef.TrackTypeName.toString());
                // @formatter:off
							trackDef_List +=
								<TrackDefinition>
									<TrackTypeName>{bTdef.TrackTypeName.toString()}</TrackTypeName>
									<Position>{bTdef.Position.toString()}</Position>
								</TrackDefinition>;
							// @formatter:on
                            //}
                        }

                        // Now add the new types being copied.
                        logger.info("Looping through the source track types");
                        for each(var sTT in sObj.xml..TrackType) {
                            // @formatter:off
							trackDef_List +=
								<TrackDefinition>
									<TrackTypeName>{sTT.Name.toString()}</TrackTypeName>
									<Position>{sTT.DefaultPosition.toString()}</Position>
								</TrackDefinition>;
							// @formatter:on
                            logger.info("Added: " + sTT.Name.toString());
                            //logger.info(sTT);
                        }

                        trackXml.TrackDefinition = trackDef_List;
                        material_SaveXml.Track += trackXml;
                    }
                    logger.info("\n\tSaving new track definitions\n");
                    /////logger.info(material_SaveXml);
                    ////!?!materialSave(material_SaveXml, 'replaceTrackDefinitions');//  DON'T USE ANY OPTIONS HERE
                } else {
                    logger.info("MatID has no registered media tracks, continuing on...");
                }

                // Save our new TTL
                // @formatter:off
				var material_SaveXml =
					<Material>
						<MatId>{tObj.matId}</MatId>
					</Material>;
				// @formatter:on
                if (targetXml..TrackTypeLinks) {
                    var new_Ttls = new XMLList();
                    for (var u = 0; u < targetTTLs.length; u++) {
                        logger.info("Adding the TrackTypeLink - '" + targetTTLs[u] + "' [" + targetXml..TrackTypeLink.(TrackTypeName.toString() == targetTTLs[u]).StateName.toString() + "]");
                        // @formatter:off
						new_Ttls +=
							<TrackTypeLink>
								<TrackTypeName>{targetTTLs[u]}</TrackTypeName>
								<StateName> {targetXml..TrackTypeLink.(TrackTypeName.toString() == targetTTLs[u]).StateName.toString()}</StateName>
								<StateMachine >NBC GMO</StateMachine>
							</TrackTypeLink>;
						// @formatter:on
                    }
                    material_SaveXml.TrackTypeLink = new_Ttls;
                    logger.info("\n\tSaving new track type links\n");
                    ///logger.info(material_SaveXml);
					///!?!materialSave(material_SaveXml, 'replaceTrackTypeLinks');
                } else {
                    logger.info("MatID has no registered track type links, continuing on...");

                }
            } catch (e) {
                throw new Error("Failed to save new tracks for [" + tObj.matId + "] " + e.message);
            }
        },

        /**
         * Get the track types associated with the passed material
         *
         * @param {string} materialId  The material who's track type will be returned.
         * @return {Object} Tracks, Mount, Path
         */
        getAudioTrackTypes: function (materialId) {
            var retObj = {};
            try {
                // question ? Should I be doing this???
                // var material = materialGet(materialId);
                // material = material..MatId.toString();
                logger.info("#### Material == " + materialId + " ####");

                if (materialId) {
                    var materialXml = materialGet(materialId, "tracktypelinks", "tracks", "fulltext", "shorttext")..Material;
                    logger.info("Loaded XML for " + materialXml.MatId.toString());
                    if (materialXml.MatId.toString() != materialId) {
                        throw new Error("Material ID [" + materialId + "] can not be found!");
                    }

                    var _trackTypes = [];
                    print("\nAttempting to Extract Track Types from [materialXML] - ("+materialXml.Tracks.Track.length()+")\n");

                    // Make sure we got a destination path back. If we did not the materials media has probably been archived.
                    /*if( materialXml.Tracks.Track.length() == 0 ) {
                        throw new Error("Material has no audio tracks. Make sure the tracks have not been archived.");
                    }*/

                    for (var i = 0; i < materialXml.Tracks.Track.length(); i++) {
                        var _trackTypeName = materialXml.Tracks.Track[i].Track_Type_Name.toString();
                        var _xmlTrackType = materialXml.Tracks.Track[i].@type.toString();
                        logger.info("_trackTypeName = " + _trackTypeName);
                        switch (_xmlTrackType) {
                            // Temorarily ignoring anything besides Video and Audio for the moment
                            case "Video":
                                print("\t" + _xmlTrackType + " [Video]");
                                _trackTypes.push("Video");
                                break;
                            case "Audio":
                                print("\t" + _xmlTrackType + " [" + _trackTypeName + "]");
                                _trackTypes.push(_trackTypeName);
                                break;
                            case "Captioning":
                                // 	print("\t"+_xmlTrackType+" ["+_trackTypeName+"]");
                                //  	_trackTypes.push(_trackTypeName);
                                break;
                            case "Subtitle":
                                // 	print("\t"+_xmlTrackType+" ["+_trackTypeName+"]");
                                //  	_trackTypes.push(_trackTypeName);
                                break;
                            case "Component":
                                break;
                            default:
                                throw new Error("\nUnsure how to parse [" + _xmlTrackType + "] Track Type Name [" + _trackTypeName + "]")
                        }
                    }

                    //
                    // Get the audio files and paths
                    //

                    var audioMedia = gmoNBCFunc.getOMAudioMedia(materialId, materialXml);
                    logger.info("audioMedia = " + audioMedia);
                    retObj["Xml"] = materialXml;
                    retObj["Track"] = materialXml.Track.(MediaName.toString() == audioMedia);
                    if (gmoNBCFunc.isVarUsable(audioMedia)) {
                        retObj["Mount"] = lookup.media[audioMedia].mount;
                    }
                    retObj["Path"] = gmoNBCFunc.getMediaTrackFilePath(materialId, audioMedia);
                    logger.info("getMediaTrackFilePath = " + retObj["Path"]);
                    logger.info("AbsolutePath = " + retObj["Track"]..AbsolutePath.toString());
                    //logger.info("***********\naudioMedia = "+audioMedia.toSource());
                    //logger.info("***********\nobj = "+retObj.toSource());

                    var arr = [];
                    for each (var ttl in materialXml..TrackTypeLink) {
                        logger.info("Adding ["+ttl.TrackTypeName.toString()+"]");
                        arr.push(ttl.TrackTypeName.toString());
                    }
                    logger.info("Track Type links from Material XML:");
                    show(arr);
                } else {
                    throw new Error("Could not find material for Source [" + materialId + "]");
                }
            } catch (e) {
                var err = "Error in getAudioTrackTypes: [" + e.message + "] for Material ID [" + materialId + "]";
                //logger.info( err );
                throw new Error(err);
            }
            return retObj;
        },


        /**
         * Copy the Track Type Links
         * This function requires all the local variables to be set before being called.
         */
        copyTrackTypeLinks: function () {
            var ret = false;
            try {
                var originalFileName = this.sourceTrackTypes["Track"]..TrackDefinition[0].TrackFile.Name.toString();
                logger.info("originalFileName = " + originalFileName);

                var matHelper = new gmoNBCFunc.materialHelper(this.targetMatId);
                //logger.info("MaterialHelper.getTrackTypeLinkXmlList = ");
                //show( matHelper.getTrackTypeLinkXmlList() );

                //logger.info("matHelper.getTrackTypes() = "+matHelper.getTrackTypes());
                //logger.info("matHelper.getTrackTypeLinkXmlList() = "+matHelper.getTrackTypeLinkXmlList());

                for each (trackType in this.groupTrackTypes) {
                    ret = true;
                    if (debug) {
                        logger.info("Registering Track Type Link " + trackType.Name.toString());
                        logger.info("TrackTypeLink = " + trackType);
                    }
                    logger.info("trackTypeGroupGet for [" + trackType.Name.toString() + "] = " + gmoNBCFunc.trackTypeGroupGet(trackType.Name.toString()));
                    trackTypeName = trackType.Name.toString();
                    fileName = originalFileName;
                    // Set the state to Order Placed, so when trigger "Component Copy" the materials will go into component Review Required. See trigger in NBC GMO state machine
                    matHelper.addTrackTypeLink(trackTypeName, "Order Placed", "NBC GMO");
                    matHelper.addTrackTypeLinkShortText(trackTypeName, "Original File Name", fileName);
                }
                if (debug) logger.info("saveXML = " + matHelper.saveXml);
                matHelper.saveUsingSaveXml();

            } catch (e) {
                throw new Error("Error copying the Track Type Links : " + e.message);
            }

            return ret;
        },

        /**
         * Get the path to the audio files and copy them
         * This function requires all the local variables to be set before being called.
         */
        copyAudioFiles: function () {
            var ret = false;
            var absolutePathSource = this.sourceTrackTypes["Track"]..AbsolutePath.toString();
            var absolutePathTarget = this.targetTrackTypes["Track"]..AbsolutePath.toString();

            try {
                var pathTarget;
                try {
                    pathTarget = this.targetTrackTypes["Track"]..Path[0].toString();
                } catch (e) {
                    pathTarget = this.targetTrackTypes["Track"]..Path.toString();
                }
                logger.info("Target Path = " + pathTarget);

                /*logger.info("this.trackTypeGroupNames = ");
                show(this.trackTypeGroupNames);

                logger.info("this.sourceTrackTypes[\"Track\"]..TrackDefinition = ");
                show(this.sourceTrackTypes["Track"]..TrackDefinition);
                */

                logger.info("this.sourceTrackTypes['Track']..TrackDefinition) == "+this.sourceTrackTypes["Track"]..TrackDefinition);
                for each(track in this.sourceTrackTypes["Track"]..TrackDefinition) {
                    logger.info("track = "+track);
                    logger.info("Processing... "+ track.TrackTypeName.toString());

                    if (this.contains(this.trackTypeGroupNames, track.TrackTypeName.toString())) {
                        ret = true;
                        var newPath = absolutePathTarget + pathTarget;
                        var sourcePath = absolutePathSource + track.TrackFile.Path + "/" + track.TrackFile.Name;
                        var targetPath = newPath + (newPath.slice(newPath.length - 1, newPath.length) === "/" ? "" : "/" ) + track.TrackFile.Name;
                        // See if the target directory is present. If not create it
                        if (!fileExists(newPath)) {
                            logger.info("\tCreating dir " + newPath);
                            makedir(newPath);
                        }

                        var destFile = new gmoNBCFunc.usefulFileObj(targetPath);
                        var sourceFile = new gmoNBCFunc.usefulFileObj(sourcePath);

                        logger.info("Copying [" + track.TrackFile.Name + "] from [" + sourcePath + "] to [" + targetPath + "]");
                        if (!dryRun) {
                            gmoNBCFunc.copyFileOnRemoteHost(
                                lookup.storage.dvs.host,			// Hostname or IP, prefer to specify hostname as it will retry with different IP's if it fails
                                sourceFile.dvs_path,				// Source Path
                                destFile.dvs_path,					// Destination path relative to mount on the host were sshing into (DVS in this case)
                                sourceFile.filename,				// Source Filename
                                destFile.filename,					// Leave this as null (not as a string of "null"), if you dont want to rename the file.
                                sourceFile.filesize);				// You can not specify this at all, however it will check for the file transfer speed if you specify it.
                        }
                    }

                }
            } catch (e) {
                var error = "Error copying the files : " + e.message;
                logger.info(error);
                throw new Error(error);
            }
            if( !ret ) {
                var e = "No track type ["+this.trackTypeGroupNames.toString()+"] found in Source Material";
                logger.info(e);
                throw new Error(e);
            }
            return ret;
        },

        /**
         * Copy the group from the source to the target
         * This function requires all the local variables to be set before being called.
         */
        copyTrackTypeGroup: function () {
            var ret = false;
            try {
                var trackDef_List = new XMLList();
                var storeMedia;

                //Find Video Store Media from Track -> Media
                for each (var track in this.targetTrackTypes["Track"]) {

                    if (track.Encoded.toString() === "true" &&
                        gmoNBCFunc.contains(NBCGMO.storeMedias, track.MediaName.toString())) {
                        storeMedia = track.MediaName.toString();
                        logger.info("Store Media set to [" + storeMedia + "]");
                        break;
                    }
                }

                for each(track in this.sourceTrackTypes["Track"]..TrackDefinition) {
                    if (debug) {
                        logger.info("Checking " + track.TrackTypeName);
                        logger.info("Track = " + track);
                    }

                    if (gmoNBCFunc.contains(this.trackTypeGroupNames, track.TrackTypeName.toString())) {
                        logger.info("\tCopying metadata " + track.TrackTypeName);
                        ret = true;
                        var fileExt = gmoNBCFunc.getFileExtension(track.TrackFile.Name, false).toString();
                        var fileType = fileExt;
                        if ("xml" == fileType) {
                            // If we get additional xml captions like EBU-TT - We need to identify type and not just use xml extension
                            fileType = "smpte-tt";
                        }
                        var destMediaName = this.targetTrackTypes["Track"]..MediaName.toString();//gmoNBCCompFunc.lookupAudioMediaByStoreMediaAndExt(this.targetTrackTypes["Track"],null,fileType);
                        logger.info("track.MatId: " + this.targetMatId);
                        logger.info("destMediaName: " + destMediaName.toString());
                        logger.info("track.TrackTypeName: " + track.TrackTypeName);
                        logger.info("track.Position: " + track.Position);
                        logger.info("track.Channels: " + track.Channels);
                        logger.info("track.FilePosition: " + track.FilePosition);
                        logger.info("track.frameRate: " + this.sourceTrackTypes["Track"]..FrameRate[0]);
                        logger.info("fileExt: " + fileExt);
                        logger.info("track.TrackFile.name: " + track.TrackFile.Name);
                        logger.info("this.sourceTrackTypes[\"Track\"]..MediaId:" + this.sourceTrackTypes["Track"]..MediaId[0].toString());
                        //debug = true;
                        if (!dryRun) {
                            gmoNBCCompFunc.makeAndSaveTrackDef(this.targetMatId, destMediaName, track.TrackTypeName.toString(), track.Position, track.Channels,
                                track.FilePosition, track.fileExt, this.sourceTrackTypes["Track"]..FrameRate[0], this.sourceTrackTypes["Track"]..MediaId[0].toString());
                        }
                        //logger.info(track);
                        //targetTrackTypes["Track"]..TrackDefinition += track;
                        //Transition Component TrackTypeName
                        print("\nTransition Material ["+ this.targetMatId +"] TrackTypeGroup ["+ track.TrackTypeName.toString()+ "] from State [Order Placed] to [Component Review Required]");
                        gmoNBCFunc.transitionTrackTypes(this.targetMatId,COMPONENT_COPY_TRIGGER,[track.TrackTypeName.toString()]);

                    } else {
                        logger.info("groupTrackTypes does not contain " + track.TrackTypeName.toString());
                    }
                }
            } catch (e) {
                var error = "Error copying the MetaData : " + e.message;
                logger.info(error);
                throw new Error(error);
            }
            if( !ret ) {
                logger.info("No track type ["+track.TrackTypeName.toString()+"] found in trackTypeGroupNames");
            }
            return ret;
        },

        /**
         * Copy the tracks for the track type group passed between the two materials passed.
         *
         * Note: The params are optional. If not passed it will use the data set by the constructor.
         *
         * @param {string} aSource - The material id to copy from
         * @param {string} aTarget - The material id to copy to
         * @param {string} aTrackTypeGroup - The Track Type Group to copy
         *                                   If null ALL groups will be copied
         * @return {boolean} - true if groups were copied
         */
        copyTrackTypeGroups: function (aSource, aTarget, aTrackTypeGroup) {
            var ret = true;
            var transitionedTTL = null;
            var error = "";

            if( this.jobDescription !== null )
                transitionedTTL = this.jobDescription..trackTypeLink.TrackTypeLink.TrackTypeName.toString();

            logger.info("transitionedTTL = ");
            show(transitionedTTL);
            // Get the current function name to pass in errors.
            // This is not working in Rhino
            // todo: Figure out a way to get the current function name.
            // var funcName = arguments.callee.toString();
            // var fn = arguments.callee.toString().match(/function\s+([^\s\(]+)/);
            // this.log( fn, funcName );

            logger.info("Starting copyTrackTypeGroups");
            // Save the passed vars to the globals if any were passed
            if (aSource !== undefined) {
                logger.info("Using passed variables");

                this.sourceMatId = aSource;
                if (targetMatId !== undefined) this.targetMatId = aTarget;
                if (trackTypeGroup !== undefined) this.trackTypeGroup = aTrackTypeGroup;
            }
            logger.info("Copying " + (this.trackTypeGroup === null ? " ALL " : "") + " Track Type Group" + (this.trackTypeGroup === null ? "s" : " " + this.trackTypeGroup) + " from " + this.sourceMatId + " to " + this.targetMatId + "\n");

            //
            // Get the track types for the track type group
            //
            this.groupTrackTypes = this.getTrackTypesFromGroup(this.trackTypeGroup);
            var i = 0;
            for each (var trackType in this.groupTrackTypes) {
                this.trackTypeGroupNames.push(trackType.Name.toString());
                if (debug) logger.info("this.trackTypeGroupNames["+i+"] = " + this.trackTypeGroupNames.toString());
            }

            if (debug) logger.info("this.groupTrackTypes = " + this.groupTrackTypes);

            //
            // Get the source and target media, and the tracks we will copy
            //
            this.sourceTrackTypes = this.getAudioTrackTypes(this.sourceMatId);
            this.targetTrackTypes = this.getAudioTrackTypes(this.targetMatId);
            if (debug) {
                logger.info("The source track types for " + this.sourceMatId + " are:");
                show(this.sourceTrackTypes);
                logger.info("The Target track types for " + this.targetMatId + " are:");
                show(this.targetTrackTypes);
            }

            //
            // Copy the track types that are in the track type group from the source to the target
            //

            if (this.hasTrackTypes(this.sourceTrackTypes["Track"], this.targetTrackTypes["Track"]) && !this.forceCopy) {
                error = "Skipping the copy. Target already has the Track Type Group [" + this.trackTypeGroup + "]. Use Force Copy to override.";
                logger.info(error);
                ret = false;
            } else if( this.sourceTrackTypes["Path"] === "") {
                error = "ERROR: Source has no usable Audio Track paths";
                show(this.sourceTrackTypes);
                ret = false;
            } else {
                if (this.forceCopy) logger.info("Force Copy is true. The copy will be performed even if destination already has the track type group");
                //logger.info("this.targetTrackTypes[\"Track\"]= "+this.targetTrackTypes["Track"]);

                logger.info("this.sourceTrackTypes[\"Path\"] = "+this.sourceTrackTypes["Path"]);

                try {

                    // Copy the Track Type Links
                    ret = this.copyTrackTypeLinks();
                    logger.info("copyTrackTypeLinks() == "+ ret );
                    this.updateJobDashboard("Copied Track Type Links", 20);

                    // Copy the audio files
                    if (ret) {
                        ret = this.copyAudioFiles();
                        logger.info("copyAudioFiles() == " + ret);
                        this.updateJobDashboard("Copied Track Type Links", 60);
                    }

                    // Copy the Track Type Group entries
                    if (ret) {
                        ret = this.copyTrackTypeGroup();
                        logger.info("copyTrackTypeGroup() == " + ret);
                        this.updateJobDashboard("Copied Track Type Links", 80);
                    }
                } catch (e) {
                    ret = false;
                    error = "Error caught in copyTrackTypeGroups returning false : " + e.message;
                    logger.info(error);
                    if( transitionedTTL !== null && !dryRun)
                        materialWorkflowTransition(this.targetMatId, "Error", transitionedTTL);
                }
            }
            if (!ret) {
                // Pass the error up to the caller
                logger.info("Throwing error: "+error);
                throw new Error(error);
            }
            logger.info("Ending copyTrackTypeGroups");
            return ret;
        },

        /**
         * Clean up
         * Log off of servers etc....
         */
        cleanUp: function () {
            // Log out of the web services
            logger.info("Logging out of Server");
            wsLogout(); // Ready to Submit Logout
        }
    };

    // Return the constructor
    return AudioComponentHelper;
})();
