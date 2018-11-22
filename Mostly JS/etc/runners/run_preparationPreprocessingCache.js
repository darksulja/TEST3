load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_vantage_fun.js");
load("/opt/evertz/mediator/etc/runners/vantage_lookup.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/pipelineHelper.js");
load("/opt/evertz/mediator/etc/runners/cacheHelper.js");
load("/opt/evertz/mediator/etc/helpers/ErrorHandlerHelper.js");

try {
	
	/**
	*	Function to create a standard Vantage Object specific 
	*	@param[boolean] - indicating whether a Surround Job is occuring
	*	@param[string] - name of the workflow in vantage
	*	@param[placingHelper Object]
	*	@param[array/string] - former if surround job / latter if stereo
	**/
	var createPreprocessingVantageObject = function(surroundJob, vantageWF, pHelper, trackTypes, outputPath) {
		
		// Internal Functions
		
		/** 
		*	Returns a Track Type from an array if the track type starts with a specified string
		* 	@param[array] - list of track types to search
		* 	@param[string] - string that track type should start with
		* 	@error - if there are not exactly three tracktypes in the array
		* 	@error - if no track type match was found
		**/
		var getTrackTypeByStartString = function(trackTypeArr, trackTypeStr) {
			
			if (trackTypeArr.length !== 3) throw new Error("Surround Track Type must have exactly 3 Track Types. Specified [" + trackTypeArr + "]");
			
			for each(var trackType in trackTypeArr) {
                if (gmoNBCFunc.startsWith(trackType, trackTypeStr)) return trackType;
			}

			throw new Error("Failed to find a Track Type that stars with [" + trackTypeStr + "] out of [" + trackTypeArr + "]");

		}
	
		// Material Helper
        var mh = new gmoNBCFunc.materialHelper(pHelper.getMainMaterial());
        var mediaObj = pHelper.getUsableMediasForMaterial(pHelper.getMainMaterial());
        var audioMedia = mediaObj["Audio"]["MediaName"];

        // Make Vantage Objs. Surrounds are handled as one job (a group)
        var vantageObj = new gmoNBCVantageFunc.Standard_Vantage_Object();
        vantageObj.setVar("Destfilepath", new gmoNBCFunc.usefulFileObj(outputPath).win_file);
        vantageObj.setWorkflowName(vantageWF);

        if (surroundJob) {
            
            // Extract the Track Type Names that are being passed to Vantage (unique to surround)
            var trackTypeNameSurroundFront = getTrackTypeByStartString(trackTypes, "Surround Front");
            var trackTypeNameSurroundCLFE = getTrackTypeByStartString(trackTypes, "Surround C/LFE");
            var trackTypeNameSurroundRear = getTrackTypeByStartString(trackTypes, "Surround Rear");
            // Find the file objects associated with each track type name and create a useful file object
            var fileObjSurroundFront = new gmoNBCFunc.usefulFileObj(mh.getPathAndFileOfTrackTypeOnMedia(audioMedia, trackTypeNameSurroundFront, true));
            var fileObjSurroundCLFE = new gmoNBCFunc.usefulFileObj(mh.getPathAndFileOfTrackTypeOnMedia(audioMedia, trackTypeNameSurroundCLFE, true));
            var fileObjSurroundRear = new gmoNBCFunc.usefulFileObj(mh.getPathAndFileOfTrackTypeOnMedia(audioMedia, trackTypeNameSurroundRear, true));
            // Map the filenames to the track type names (this will be used to accurately assign a track file to the track type name as part of the caching process)
            filenameTrackTypeNameMap[fileObjSurroundFront.filename] = trackTypeNameSurroundFront;
            filenameTrackTypeNameMap[fileObjSurroundCLFE.filename] = trackTypeNameSurroundCLFE;
            filenameTrackTypeNameMap[fileObjSurroundRear.filename] = trackTypeNameSurroundRear;

			// Front Channels (Original want *nix path not windows)
			vantageObj.setOriginal(fileObjSurroundFront);
			// C / LFE Channels
			vantageObj.setVar("WAV_C_lfe", fileObjSurroundCLFE.win_file);
			// Rear Channels
			vantageObj.setVar("WAV_Ls_Rs", fileObjSurroundRear.win_file);
			// Not Stereo
			vantageObj.setVar("Stereo", false);
			// Put a ring on it
			vantageObj.setJobName("Preprocessing-" + pHelper.getPlacingName() + "-Surround");

        } else {
            
            // Find the file objects associated with each track type name and create a useful file object
            var fileObjNonSurround = new gmoNBCFunc.usefulFileObj(mh.getPathAndFileOfTrackTypeOnMedia(audioMedia, trackTypes, true));
            // Map the filenames to the track type names (this will be used to accurately assign a track file to the track type name as part of the caching process)
            filenameTrackTypeNameMap[fileObjNonSurround.filename] = trackTypes;

            vantageObj.setOriginal(fileObjNonSurround);
            // Stereo
            vantageObj.setVar("Stereo", true);
            //Set some dummie paths
            vantageObj.setVar("WAV_C_lfe","\\\\i\\am\\a\\fake\\path");
            vantageObj.setVar("WAV_Ls_Rs","\\\\so\\am\\i");
            // Brand this bad boy
            vantageObj.setJobName("Preprocessing-" + pHelper.getPlacingName() + "-" + trackTypes);
        }
		
		return vantageObj;
    }
	
	/**
	*	Filters out unique Track Types (And MOS) - Stops mutlieple job being run on the same Track Type
	*	@param[array] - array of Track Types
	*	@return[array] - array of unique Track Types less MOS
	**/
	var getUniqueTrackTypes = function(arr) {
		
		// Don't want to normalise MOS
		var isMos = function(str) {
			return str.indexOf("MOS") > -1;
		}

		var rtn = [];

		for (var i = 0; i < arr.length; i++) {
            if (rtn.indexOf(arr[i])== -1 && isMos(arr[i]) == false) {
                rtn.push(arr[i]);
            }
        }
		
		return rtn;
    }

	/**
	*	Checks whether a Track Type is not Surround
	*	@param[string] - name of Track Type
	*	@return[boolean] - indicating if Track Type is not Surround
	**/
    function isNonSurround(trackType) {
        var surrStr = "Surround";
        return gmoNBCFunc.startsWith(trackType, surrStr) == false;
    }

	/**
	*	Checks whether a Track Type is Surround
	*	@param[string] - name of Track Type
	*	@return[boolean] - indicating if Track Type is Surround
	**/
    function isSurround(trackType) {
        var surrStr = "Surround";
        return gmoNBCFunc.startsWith(trackType, surrStr) == true;
    }

	/**
	*	Function to sort a list of Surround Track Types by language
	*	@param[array] - List of all Surround Track Types
	*	@return[array] - containing arrays of the Group Surround Track Type
	*	e.g. [
	*			["Surround Front English US", "Surround C/LFE English (US)", Surround Front Rear (US)] , 
	*			["Surround Front Chinese", "Surround C/LFE Chinese", "Surround Rear Chinese"]
	*		]
	**/
    var getSurroundGroups = function (surrArr) {
		
    	var rtn = [];

	    // Used to store Surround Track Types by language
        var langTrackTypeMap = {};

        for each (var trackType in surrArr) {

            // Use language as key for Map. Regex means find two words with a space after and then return all that's left
		    // The replace is used for ease when a C/LFE Track Type appears. If you're better at RegEx please adapt	
            var language = trackType.replace("/","").match(/(\w* \w* )(.*)/i)[2];         
            if (langTrackTypeMap[language] === undefined) langTrackTypeMap[language] = [];
				langTrackTypeMap[language].push(trackType);
            }

			if (debug) {
				print("\nLanguage to Track Type Mapping:\n");
				gmoNBCFunc.printObj(langTrackTypeMap);
			}
            
            // Surrounds are grouped by language, return an Array of Arrays for the Surround Vantage Job(s)
			for (var langageGroup in langTrackTypeMap) {
				rtn.push(langTrackTypeMap[langageGroup]);
			}

			return rtn;
    }

	/**
	 * Get the name of the file processed by Vantage
	 *   - Since the Vantage job has specific characters, some string manipulation is done to
	 *     extract the filename
	 * 
	 * @usage	getVantageFilename(vantageJobProperty)
	 * @param	{String}	the filename of the file processed by Vantage
	 */
	var getVantageFilename = function (vantageJobProperty) {
        // The vantage job property is a path to a file
		var vantageFileObj = new gmoNBCFunc.usefulFileObj(vantageJobProperty);
        // Pull the main material Id to determine which filename we are looking for
		var mainMatId = placingHelper.getMainMaterial();
        // The Unix path of the file contains the filename we are looking for
		var vantageUnixFile = vantageFileObj.unix_file;
		// Determine the vantage filename by searching for the mat id, and taking the substring at this point
        var vantageFilename; 
		vantageFilename = vantageUnixFile.substring(vantageUnixFile.indexOf(mainMatId) + mainMatId.length);
		vantageFilename = vantageFilename.substring(vantageFilename.indexOf(mainMatId));

		return vantageFilename;
	}

	/**
	 * Get a list of Vantage Job properties
	 *   - This function is very specific to cache processing and looks up the requried properties
	 * 	   for processing cache files
	 * 
	 * @usage	getVantageJobProperties(vantageJobObj)
	 * @param   {Object}    a vantage job object
     * @return	{String[]}	an array of strings (each element representing a Job Property string)
	 */
	var getVantageJobProperties = function (vantageJobObj) {
		var vantageJobProperties = new Array();

		// Handle the Vantage Job "nicknames"
		for (var jobNickname in vantageJobObj.nicknames) {
			if (vantageJobObj.nicknames[jobNickname].toString().indexOf(placingHelper.getMainMaterial()) != -1) {
				vantageJobProperties.push(vantageJobObj.nicknames[jobNickname]);
			}
		}
		// Handle the Vantage Job "variables"
		for (var jobVariable in vantageJobObj.variables) {
			if (vantageJobObj.variables[jobVariable].toString().indexOf(placingHelper.getMainMaterial()) != -1) {
				vantageJobProperties.push(vantageJobObj.variables[jobVariable]);
			}
		}

		return vantageJobProperties;
	}
    
    /**
	 * Take the output file from vantage and move it to the cache media
	 * 
	 * TODO: Set the filename as the cache key (currently not handled in Conform, so has to be the Material ID)
     *
	 * @usage	moveFileToCacheMedia(processedFileObj, prepCacheKey, prepCacheMediaName)
	 * @param	{String}	the filename of the preprocessed file
	 */
	var moveFileToCacheMedia = function (processedFileObj, prepCacheKey, prepCacheMediaName) {
        // TODO: Set the filename as the cache key (currently not handled in Conform, so it has to be the Material ID)
        var prepCacheFilePath = cacheHelper.getCacheMediaPath(prepCacheKey, prepCacheMediaName) + processedFileObj.filename;
        // Move the Processed File to the Cache Media
        output("Moving file [" + processedFileObj.unix_file + "] to [" + prepCacheFilePath + "]");
        move(processedFileObj.unix_file, prepCacheFilePath);
        
        // Validate the new file object exists (move was successful)
        var prepCacheFileObj = new gmoNBCFunc.usefulFileObj(prepCacheFilePath);
        if (prepCacheFileObj.exists()){
            output("Move was succesfull to Cache Media. Cleaning up ");
            remove(processedFileObj.unix_path);
        } else {
            throw new Error("Failed to move file to Cache Media.");
        }
	}
    
    /**
	 * Generate a track definition on the cache track for the output files
     *
	 * @usage	getCacheTrackDefinition(processedFileObj, prepCacheKey)
	 * @param	{String}	the file object of the preprocessed file
     * @param   {String}    the preprocessing cache key
     * @return  {String}    the track definition for the preprocessed file 
	 */
	var getCacheTrackDefinition = function (processedFileObj, prepCacheKey) {
        var cacheTrackDefinition;
        // Set the track file path (i.e. /PREPV02-FD1A3D98EBFCDA613690C080D8C7F2B9.dir/)
        var prepCacheTrackFilePath = "/" + prepCacheKey + ".dir/";
        // By passing in a filename to the mapping object, the associated tracktypename is returned as a key value pair
        var prepCacheTrackTypeName = filenameTrackTypeNameMap[processedFileObj.filename];
        // A single track definition of the cache track
        cacheTrackDefinition = cacheHelper.createCacheTrackDef(prepCacheTrackFilePath, 
                                                               processedFileObj.filename, 
                                                               prepCacheTrackTypeName);
                                                                          
        return cacheTrackDefinition;                                                                  
	}
	
	/**
	*	Start of Script
	**/	
	var debug = false;
	
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);
	
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);
	
	// Get required values from Job Description.
	var placingId = jobDescription.Properties.Mapping.domainKey.toString();

	// Initiliase main object
	var vodWorking = "NLD_WORKING_DIR"
	var placingHelper = new PlacingHelper(placingId);
	var pipelineHelper = new PipelineHelper(placingHelper, vodWorking);
	var pipelineState = placingHelper.getPlacingState();
	
	// Preprocessing Cache Details
    var cacheHelper = new CacheHelper(placingHelper);
    var prepCacheKey = jobDescription.Properties.Mapping.transcodeKey.toString();
    var prepCacheMediaName = jobDescription.Properties.Mapping.transcodeCacheMedia.Media.Name.toString();
    var prepCacheMaterialActiveTrackId = materialGet(prepCacheKey, "tracks")..Material.Track.@id[0].toString();
    var prepCacheKeyPrefix = "PREP";
    
    // Use an object to provide a key-value pair of filenames to tracktypenames
    var filenameTrackTypeNameMap = {};
    

	print(
		"Placing Id [" + placingId + "] \n" +
		"Current Pipeline State [" + pipelineState + "] \n" +
        "Cache Key [" + prepCacheKey + "] \n" +
        "Cache Media[" + prepCacheMediaName + "] \n"
	);
	
	// Check if pipeline state is required. Will exit here if not.
	gmoNBCNLDFunc.checkPipelineStateRequired(placingId, pipelineState);
    
	var currentWorkingFolder = pipelineHelper.getCurrentWorkingFolder();
	var placingXml = placingHelper.getPlacingXml();
	var settings = gmoNBCNLDFunc.getSettings(placingXml);
	var workflowName = settings.audioNormalization;
	var systemTrackTypeXml = gmoNBCFunc.getTrackTypes();
	var vantageJobFactory = vantageLookup.getJobFactoryByWorkflow(workflowName);
	const audioClass = "Audio";
	
	// Create output dir
	makedir(currentWorkingFolder);
	
	jobDashboard.updateStatusAndProgress("Gathering Placing Details/Settings",10);

	// Extract All Audio Track Types 
	print("\nExtract all Audio Track Types");
	var audioTrackTypes = placingHelper.getMatchedProfileTrackTypesByClass(placingXml, placingHelper.getMainMaterial(), audioClass);
	print("\nAll Audio Track Types [" + audioTrackTypes + "]");
	
	// Find Unique Track Types (This stops duplicate jobs and also removes MOS since it doesn't actually exist)
	print("\nFinding Unique Track Types:");
	var uniqueTrackTypes = getUniqueTrackTypes(audioTrackTypes);
	print("Unique Track Types [" + uniqueTrackTypes + "]");
	
	// Find Non-Surround Track Types
	print("\nChecking for Track Types that aren't Surround:");
	var nonSurroundTrackTypes = uniqueTrackTypes.filter(isNonSurround);
	print("Non Surround Track Types [ " + nonSurroundTrackTypes + "]");	
		
	// Find Surround Track Types
	print("\nChecking for Surround Track Types:");
	var surroundTrackTypes = uniqueTrackTypes.filter(isSurround);
	print("Surround Track Types [" + surroundTrackTypes + "]");

	// Find Surround Groups
	print("\nChecking for Surround Groups:");
	var surroundGroups = getSurroundGroups(surroundTrackTypes);
	print("Surround Groups [" + surroundGroups + "]");
		
	// Check which Job are necessary (Surround has to be run as one job)
	var surroundJobReq = surroundGroups.length > 0 ? true : false;
	var stereoJobReq = nonSurroundTrackTypes.length > 0 ? true : false;
	
	// Used for Job Dashboard feedback
	var jobObject = {"jobId" : _jobId, "startPercent" : 15, "endPercent" : 50};
	print("surroundJobReq [ " + surroundJobReq + "] stereoJobReq [ " + stereoJobReq + "]");  
    
    // Validate the Cache Material
    prepCacheKey = cacheHelper.cacheKeyValidation(prepCacheKey, prepCacheKeyPrefix);
    if (cacheHelper.cacheMaterialValidation(prepCacheKey) == false) {
        throw new Error("Cache Material Not Found!");
    }
    // Declare a Cache Track Definition List (used to save to the Cache Material)
    var prepCacheTrackDefinitionList = [];
	
	// Surround Jobs
	if (surroundJobReq) {
		
		// Surrounds are linked in groups of 3
		for each (var surroundTrackTypeGroup in surroundGroups) {
			
			print("\nRunning Audio Normalization Job for [" + surroundTrackTypeGroup + "]");
			var surroundVantageJobObj = createPreprocessingVantageObject(true, workflowName, placingHelper, surroundTrackTypeGroup, currentWorkingFolder);  
			if (debug) gmoNBCFunc.printObj(surroundVantageJobObj);

			var vantageSurroundResult = gmoNBCVantageFunc.makeAndRunTranscodeJob(vantageObj);
			if (debug) print("\nDEBUG vantageSurroundResult [" + vantageSurroundResult + "]");
			if (vantageSurroundResult !== true) throw new Error("Vantage Transcode Failed with Error [" + vantageSurroundResult + "].");

			// Pull the vantage job properties as an array that contains the processed filenames
			var vantageJobProperties = getVantageJobProperties(surroundVantageJobObj);
            
			for (var jobProperty in vantageJobProperties) {
                // Using the vantage job property, determine the filename and create a useful file object
                var processedFileObj = new gmoNBCFunc.usefulFileObj(currentWorkingFolder + getVantageFilename(vantageJobProperties[jobProperty]));
                // Move the vantage output file (processedFileObj) to the cache media
                moveFileToCacheMedia(processedFileObj, prepCacheKey, prepCacheMediaName);
                // Create a list of cache track definitions to be saved against the cache material
                prepCacheTrackDefinitionList.push(getCacheTrackDefinition(processedFileObj, prepCacheKey));
            }
        }
	}

	// Check if script needs to continue
	if (stereoJobReq == false) quit(0);

	// Stereo Jobs
	// Each Stereo or Mono (Dual) is handled as a seperate job
	for each (var trackType in nonSurroundTrackTypes){

		print("\nRunning Audio Normalization Job for [" + trackType + "]");
		output(currentWorkingFolder);
		var vantageJobObj = createPreprocessingVantageObject(false, workflowName, placingHelper, trackType, currentWorkingFolder);
		if (debug) gmoNBCFunc.printObj(vantageJobObj);
		var vantageNonSurroundResult = gmoNBCVantageFunc.makeAndRunTranscodeJob(vantageJobObj);
		if (debug) print("\nDEBUG vantageNonSurroundResult [" + vantageNonSurroundResult + "]");
		if (vantageNonSurroundResult !== true) throw new Error("Vantage Transcode Failed with Error [" + vantageNonSurroundResult + "].");

		// Pull the vantage job properties as an array that contains the processed filenames
        var vantageJobProperties = getVantageJobProperties(vantageJobObj);
        
        for (var jobProperty in vantageJobProperties) {
            // Using the vantage job property, determine the filename and create a useful file object
            var processedFileObj = new gmoNBCFunc.usefulFileObj(currentWorkingFolder + getVantageFilename(vantageJobProperties[jobProperty]));
            // Move the vantage output file (processedFileObj) to the cache media
            moveFileToCacheMedia(processedFileObj, prepCacheKey, prepCacheMediaName);
            // Create a list of cache track definitions to be saved against the cache material
            prepCacheTrackDefinitionList.push(getCacheTrackDefinition(processedFileObj, prepCacheKey));
        }
	}
    
    // Update the Cache Material with the appropriate Track Definition(s)
    cacheHelper.saveCacheTrack(prepCacheKey, prepCacheMaterialActiveTrackId, prepCacheMediaName, "", "", "", "", prepCacheTrackDefinitionList);
    
} catch(e){
	output("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})

	if (typeof(settings) !== "undefined") {
		gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml, true, "", e.message, settings.preprocessingFailureEmailAddresses);
	}
	
    if (prepCacheKey !== null && prepCacheKey !== undefined && prepCacheKey !== "") {
        cacheHelper.cacheMediaCleanup(prepCacheKey, prepCacheMediaName);
    }
    
	pipelineHelper.cleanup()
    var ehh = new ErrorHandlerHelper("Pre Processing",placingId,"Placing");
    if (gmoNBCFunc.isVarUsable(e.code)) {
        errorMsg = ehh.getError(e.code, e.parameters).message;
        output("Error caught in Pre Processing: Error Code ["+e.code+"] Message ["+errorMsg+"]");
    } else {
        errorMsg = e.message;
        output("An error has occurred: " + errorMsg);
    }
    ehh.saveNote(errorMsg);			
	quit(-1);
}
