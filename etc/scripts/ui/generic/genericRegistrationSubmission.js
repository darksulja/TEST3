const MAT_ID_DATA_KEY = "matId";
const TITLE_DATA_KEY = "title";
const ASPECT_RATIO_DATA_KEY = "aspectRatio";
const MATERIAL_TYPE_DATA_KEY = "materialType";
const TRACK_TYPES_DATA_KEY = "trackTypes";
const VERSION_DATA_KEY = "materialVersionType";
const EPISODE_ID_DATA_KEY = "episodeId";
const FILE_NAME_DATA_KEY = "fileName";
const UPLOAD_TYPE_DATA_KEY = "uploadType";
const NETWORK_KEY = "network";
const BRAND_KEY = "brand";


var java = JavaImporter(
    Packages.com.pharos.core.domain,
	Packages.com.pharos.core.domain.list,
	Packages.com.pharos.core.domain.job,
    Packages.com.pharos.core.domain.utils,
	Packages.com.pharos.moxb.containers,
	Packages.com.pharos.microtime,
	java.lang.Thread
);

function isValid(value) {
	return value !== null & value !== "" && value !== undefined;
}

with (java) {  
    _logger.info("Running Material Registration Submission Script");
	try {
		// Parse the form data to get all our fields
		var matId = _formData.getValue(MAT_ID_DATA_KEY);
		var title = _formData.getValue(TITLE_DATA_KEY);			
		var aspectRatio = _formData.getValue(ASPECT_RATIO_DATA_KEY);
		var materialType = _formData.getValue(MATERIAL_TYPE_DATA_KEY);
		var trackTypes = new XMLList(_formData.getValue(TRACK_TYPES_DATA_KEY));
		var episodeId = _formData.getValue(EPISODE_ID_DATA_KEY);
		var versionType = _formData.getValue(VERSION_DATA_KEY);
		var fileName = _formData.getValue(FILE_NAME_DATA_KEY);
		var networkName = _formData.getValue(NETWORK_KEY);
		var brandCode = _formData.getValue(BRAND_KEY);
		
		// A hidden form field, used to help determine if its an Image/Video/Document/etc.
		var uploadType = _formData.getValue(UPLOAD_TYPE_DATA_KEY);		
		if (!isValid(uploadType)) {
			throw new Error('Please make sure upload type is specified in your form as a hidden field.');
		}

		_logger.info('Building a material object with MatId [' + matId + '].');
		// Build our material object
		var material = new Material();
		if (isValid(matId)) {
			material.setMatId(matId);
		} else {
			throw new Error("MatId must be provided.");
		}	
		
		// Check to make sure that the filename is provided 
		if (!isValid(fileName) || fileName == "") { 
			throw new Error("The File Name must be provided.");
		}

		// Optional fields
		if (isValid(title)) {
			material.setTitle(title);
		}	
		if (isValid(aspectRatio)) {
			material.setAspectRatioName(aspectRatio);
		} else {
			material.setAspectRatioName("Unknown");
		}
		
		if (isValid(materialType)) {
			material.setMaterialType(materialType);	
		}
		if (isValid(versionType)) {
			material.setVersionType(versionType);	
		}

		//Build our episode and add it
		if(isValid(episodeId)){
            var episode = new Episode();
            episode.setEpisodeId(episodeId);
            material.setEpisode(episode);
        }

        //Adding the default Owner to the material
        var owner = new Owner("Default");
        material.addOwner(owner);

		//ShortText List to add to material
		var shortTextList = new ShortTextList();

		//Adding the ShortText file name
		var fileNameShortText = new ShortText();
		fileNameShortText.setShortTextType('File Name')
		fileNameShortText.setShortText(fileName);
		shortTextList.add(fileNameShortText);

		//Add the new Brand List to the material 
		var brandList = new BrandList(); 
		if (isValid(brandCode) && brandCode != "") { 
			_logger.info('Adding Brand: [' + brandCode + ']');
			var newBrand = new Brand()
			newBrand.setBrandCode(brandCode);
			brandList.add(newBrand); 
		}

		material.setLinkedBrandList(brandList);

		//Creating tagList to add to the material later
		var tagList = new TagList();

		//Adding the ShortText for the Network if the input is valid
		if (isValid(networkName) && networkName != ""){
			_logger.info('Adding Network Tag: [' + networkName + ']');
			var networkTag = new Tag();
			networkTag.setTagTypeName("Network");
			networkTag.setName(networkName);
			tagList.add(networkTag);
		}

		//Adding the taglist to the material
		material.setTagList(tagList);

		// Add a TTL, if Video take the ones specified in the form.
		var ttlsToAdd = [];
		if (uploadType == "Video" || uploadType == "Audio") {
			for each (var trackType in trackTypes) {				
				ttlsToAdd.push(trackType.TrackTypeName);            	
			}	
		} else if (uploadType == "Image") {
			ttlsToAdd.push('Image');
		} else if (uploadType == "Document") {
			ttlsToAdd.push('Document');
		}
		
		for each (var ttl in ttlsToAdd) {
			_logger.info("Adding TTL of type [" + ttl + "] for MatId [" + matId + "].");
			var trackTypeLink = new TrackTypeLinkDefault();
			trackTypeLink.setTrackTypeName(ttl);
			trackTypeLink.setStateMachineName('Ingest');
			trackTypeLink.setStateName('Not Available');
			//Add the ShortTextList to the track type link
			trackTypeLink.setShortTextList(shortTextList);
			material.addTrackTypeLink(trackTypeLink);
		}
		
        // Save the Material
        var command = new Command("material", "save");
        command.addParameter("material", material);
		_commandHelper.runCommand(command);
		
		_logger.info("Waiting for Elastic Search indexing")

		var searchCommand = new Command("search", "executeSearchRequest")
		var request =  {
			"request": {
				"GenericSearchRequest": {
					"ProviderId": "Local",
					"SearchClauseList": {
						"Operator": "and",
						"Clause": [
							{
								"SearchTargetId": "Material",
								"SearchClauseList": {
									"Operator": "and",
									"Clause": [
										{
											"SearchTargetId": "TrackTypeLink",
											"SearchClauseList": {
												"Operator": "and",
												"Clause": [
													{
														"ClauseDefId": "ShortText.File Name",
														"ClauseValue": fileName
													}
												]
											}
										}
									]
								}
							}
						]
					},
					"ResultTypeList": {
						"SearchResultType": [
							{
								"Id": "Material",
								"FieldsToReturn": [
									"MatId"
								]
							}
						]
					}
				}
			}
		}
	
		searchCommand.addParameter("request", request)

		var ResultListCount = 0
		var timeoutCount = 0
		do {
			_logger.info("Indexing. . .")
			response = _commandHelper.runCommand(searchCommand)
			ResultListCount = response.ResultListCount
			java.Thread.sleep(1000)
			timeoutCount += 1
			if(timeoutCount > 10) {
				throw new Error("Timeout while waiting for index to update.")
			}
		} while(ResultListCount == 0)

		_logger.info("Completed Material Registration Submission Script");
		
		// Currently no logic is required, just return true.
		_result.setSuccess(true);
		_result.setOutcome("Material successfully registered.");
	} catch (e) {
		_result.setSuccess(false);
		_result.setOutcome("Error occured: [" + e.message + "].");
		_logger.info("Error occured: [" + e.message + "].");
	}
}
