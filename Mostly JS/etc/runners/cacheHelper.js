/**
 *	Function to create a Cache Helper Object
 *
 *  @usage	new CacheHelper(placingHelper, cacheKey, cacheMedia)
 *  @param	{placingHelper}	the Placing Helper Object
 *  @param	{String}		the cache key (typically from the Job Desc)
 *  @param	{String}		the cache media (typically from the Job Desc)
 *  @return	{cacheHelper}	the Cache Helper Object
 **/

CacheHelper = function(placingHelper) {
    
    if ((this instanceof CacheHelper) === false) {
        throw new Error("Please call constructor with new() keyword");
    }

    print("\nCacheHelper() initialising...");
    
	// -------------------------------------------------
	// Cache Helper Object Options
	// -------------------------------------------------
    
    var cacheKeyPrefixOptions = {
        'Preprocessing' : 'PREP',
        'Conform' : 'CNFM',
        'Postprocessing' : 'POST',
        'Transcode' : 'TRNS'        
    }
    
	// -------------------------------------------------
	// Cache Helper Object Methods
	// -------------------------------------------------

    /**
	 * Returns the Cache Key Associated with the Placing
	 * 
	 * @usage	getCacheKey(cacheType)
     * @param   cacheType   the 4 letter prefix of the cache type (i.e. CNFM)
	 * @return	{String}	the cache key found matching the cache type associated with the placing
	 */
    this.getCacheKey = function(cacheType) {
        var placingXml = placingHelper.getPlacingXml();
		return placingXml..CacheKeys.Map.Entry.(Key.toString() == cacheType).Value.toString();
	}
	
    /**
	 * Returns the Cache Media Associated with the Cache Material
	 * 
	 * @usage	getCacheMediaName(cacheKey)
     * @param   cacheKey    the cache key you want to determine the Media Name for
	 * @return	{String}	the cache media name associated with the cache key provided
	 */
	// At the moment assume the first track is the Cache Media.
	this.getCacheMediaName = function(cacheKey) {
		var cacheMaterialXml = materialGet(cacheKey, "tracks")..Material;
		var cacheTrack = cacheMaterialXml.Track[0];
        
        if (cacheTrack !== null && cacheTrack !== undefined){
            return cacheTrack..MediaName.toString();
        } else {
            return null;
        }
	}
    
    /**
	 * Returns the Cache Media Path based on the cache key and media name
	 * 
	 * @usage	getCacheMediaPath()
     * @param   cacheKey
     * @param   cacheMediaName
	 * @return	{String}	the cache media path of the cache media (and key) provided
	 */
    this.getCacheMediaPath = function(cacheKey, cacheMediaName) {
        var cacheMediaPath = lookup.media[cacheMediaName].mount;

        // Determine if the path of the Media uses MatId.dir or not
        if (lookup.media[cacheMediaName].usesMatIdDir) {
            cacheMediaPath = cacheMediaPath + cacheKey + ".dir/";
            makedir(cacheMediaPath);
        } else {
            // No changes required
        }

        return cacheMediaPath;
    }
    
    /**
	 * Returns a Track Definition that can be used to save against the Cache Material
	 * 
	 * @usage	createCacheTrackDef(trackFileName, trackFilePath, trackTypeName)
	 * @param	{String}	the path of the TrackFile
     * @param	{String}	the filename of the TrackFile
     * @param	{String}	the type of the TrackFile
	 * @return	{String}	the cache track definition
	 */
	this.createCacheTrackDef = function(trackFilePath, trackFileName, trackTypeName) {
		var cacheTrackDef = <TrackDefinition>
                                <TrackTypeName>{trackTypeName}</TrackTypeName>
                                <TrackFile>
                                    <Path>{trackFilePath}</Path>
                                    <Name>{trackFileName}</Name>
                                </TrackFile>
                            </TrackDefinition>;

		return cacheTrackDef;
	}
    
    /**
	 * Generates a Cache Key to compare against the Cache Key given in the Job Description
	 * 
	 * @usage	generateCacheKey(placingId, keyPrefix)
	 * @return	{String}	A unique cache key generated from the Placing details
	 */
    this.generateCacheKey = function(placingId, keyPrefix) {
		var xml =
			<PharosCs>
				<CommandList>
					<Command subsystem="transcodeCache" method="generateTranscodeKey">
						<ParameterList>
							<Parameter name="placingId" value={placingId}/>
						</ParameterList>
					</Command>
				</CommandList>
			</PharosCs>;
            
        if (keyPrefix !== null && keyPrefix !== undefined && keyPrefix !== ""){
            xml..Command.ParameterList.Parameter += <Parameter name="keyPrefix" value={keyPrefix}/>
        }

		return(wscall(xml)..Output);
	}
    
    /**
	 * Returns a Cache File Object (will need to determine how this changes per stage)
	 * 
	 * @usage	getCacheFileObj(cacheKey)
     * @param   cacheKey        the cache key
	 * @return	{usefulFileObj} a useful file object referencing the cache file    
	 */
    this.getCacheFileObj = function(cacheKey) {
		var cacheMaterialXml = materialGet(cacheKey, "tracks")..Material;
		var cacheTrack = cacheMaterialXml.Track[0];

		if (!gmoNBCFunc.isVarUsable(cacheTrack)) {
			throw new Error("No Cache Material Track Available For [" + cacheKey + "]\nPlease Confirm and Re-Order the Placing");
		}

		var fileId = cacheTrack.FileId.toString();
		var fileExtension = cacheTrack.FileExtension.toString();
        
        var cacheMediaName = this.getCacheMediaName(cacheKey);
        var cacheMediaPath = this.getCacheMediaPath(cacheKey, cacheMediaName);
        
		var cacheFileObj = new gmoNBCFunc.usefulFileObj(cacheMediaPath + fileId + "." + fileExtension);

		return cacheFileObj;
	}
    
    /**
	 * Saves the Cache Track to the Media
	 * 
	 * @usage	saveCacheTrack(matId, trackId, mediaName, fileId, fileExt, checkSum, fileBytes, cacheTrackDef)
     * @param   matId               the cache material ID
     * @param   trackId             ...
     * @param   mediaName           ...
     * @param   fileId              ...
     * @param   fileExt             ...
     * @param   checkSum            ...
     * @param   fileBytes           ...
     * @param   cacheTrackDefList   (Optional) track definition(s) of the cached output file
	 * @return	{wscall}            update the material with the details
	 */
	this.saveCacheTrack = function(matId, trackId, mediaName, fileId, fileExt, checkSum, fileBytes, cacheTrackDefList) {

		var xml =
			<PharosCs>
				<CommandList>
					<Command subsystem="material" method="addOrUpdateTracks">
						<ParameterList>
							<Parameter name="matId" value={matId}/>
							<Parameter name="trackList">
								<Value>
									<TrackList>
										<Track id={trackId}>
											<MediaName>{mediaName}</MediaName>
											<FileId>{fileId}</FileId>
											<FileExtension>{fileExt}</FileExtension>
											<Checksum>{checkSum}</Checksum>
											<FileBytes>{fileBytes}</FileBytes>
										</Track>
									</TrackList>
								</Value>
							</Parameter>
						</ParameterList>
					</Command>
				</CommandList>
			</PharosCs>;
        
        // Optionally, save track definition(s) against the Cache Track 
        if (cacheTrackDefList !== null && cacheTrackDefList !== undefined) {
            for each (var trackDef in cacheTrackDefList) {
                xml..Track.TrackDefinition += trackDef;
            }
        }
        
        return wscall(xml);
	}
    
	/**
	 * Perform a validation check on the Cache Key
	 *   - Validate the cache key (typically taken from the Job Desc) matches the key generated against the placing
	 * 
	 * @usage	cacheKeyValidation(cacheKey)
	 * @param	{String}	the cache key to validate
     * @return  {String}    the valid cache key
	 */
    this.cacheKeyValidation = function(cacheKey, keyPrefix) {
		var generatedCacheKey = this.generateCacheKey(placingHelper.placingId, keyPrefix).toString();
        
		output("Checking if the Cache Key matches a key generated from the source placing...");
        if (cacheKey != generatedCacheKey){
            output("WARNING: The Cache Key of type [" + keyPrefix + "] on the placing does not match the one generated at run-time of this script.");
            output("If this is a re-order and presets have changed this is likely to be the case.");
            output("Generated [" + generatedCacheKey + "] Placing [" + cacheKey + "]");
        }
        
        return generatedCacheKey;
    }  
    
    /**
	 * Perform a validation check on the Cache Material 
	 *   - Validate the cache material exists (this material is created by the Managed Transcode Runner)
	 * 
	 * @usage	cacheMaterialValidation(cacheKey)
	 * @param	{String}	the cache key to validate against
     * @return  {Boolean}   true if the validation passes, false if it fails
	 */
    this.cacheMaterialValidation = function(cacheKey) {
        var validCacheMaterial = true;
		var cacheMaterialXml = materialGet(cacheKey, "tracks")..Material;
 
        output("Checking if the Cache Material Associated with " + cacheKey + " exists...");
        if (cacheMaterialXml.toString() == "" || cacheMaterialXml.toString() == null) {
            output("Cache Material not found!");
            validCacheMaterial = false;
			throw new Error("Validation Failed for Cache Key Material");
        } else {
			output("Cache Material found.");
            output("Cache Material XML: \n" + cacheMaterialXml);
        }
        
        return validCacheMaterial;
    }
    
    /**
	 * Cleanup the Cache Media folder
	 *   - Remove any files that have been transferred to the cache media
	 * 
	 * @usage	cacheMediaCleanup(cacheKey, cacheMediaName)
	 * @param	{String}	the cache key to validate against
     * @param	{String}	the cache media name
	 */
    this.cacheMediaCleanup = function(cacheKey, cacheMediaName) {
		var cacheMediaPath = this.getCacheMediaPath(cacheKey, cacheMediaName);
		
		if (fileExists(cacheMediaPath)){
			output("Cache folder exists, cleaning up files/folder for this state [" + cacheMediaPath + "].");
			if (!gmoNBCFunc.deleteDirectory(cacheMediaPath, true)){
				print("Failed to remove files.");
			}
		}else {
			output("No cache folder exists, nothing to cleanup.");
		}
    }
}
