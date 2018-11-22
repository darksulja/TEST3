const MAT_ID_DATA_KEY = "matId";
const TITLE_DATA_KEY = "title";
const MATERIAL_TYPE_DATA_KEY = "materialType";
const TRACK_TYPES_DATA_KEY = "trackTypes";
const TRACK_MAPPING_DATA_KEY = "trackMapping";
const EPISODE_ID_DATA_KEY = "episodeId";
const SERIES_CODE_DATA_KEY = "seriesCode";
const FILE_NAME_DATA_KEY = "fileName";
const UPLOAD_TYPE_DATA_KEY = "uploadType";


var java = JavaImporter(
    Packages.com.pharos.core.domain,
	Packages.com.pharos.core.domain.list,
	Packages.com.pharos.core.domain.job,
    Packages.com.pharos.core.domain.utils,
	Packages.com.pharos.moxb.containers,
	Packages.com.pharos.microtime
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
		var materialType = _formData.getValue(MATERIAL_TYPE_DATA_KEY);
		var trackMapping = new XMLList(_formData.getValue(TRACK_MAPPING_DATA_KEY));
		var episodeId = _formData.getValue(EPISODE_ID_DATA_KEY);
		var seriesCode = _formData.getValue(SERIES_CODE_DATA_KEY);
		var fileName = _formData.getValue(FILE_NAME_DATA_KEY);
		
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

		// Optional fields
		if (isValid(title)) {
			material.setTitle(title);
		}
		
		if (isValid(materialType)) {
			material.setMaterialType(materialType);	
		}

		//Build our episode and add it
		if(isValid(episodeId)){
            var episode = new Episode();
            episode.setEpisodeId(episodeId);
            material.setEpisode(episode);
        }

        //Build our series and add it
		if(isValid(seriesCode)){
            var series = new Series();
            series.setSeriesCode(seriesCode);
            episode.setSeries(series);
        }

        //Adding the default Owner to the material
        var owner = new Owner("Default");
        material.addOwner(owner);

		//ShortText List to add to material
		var shortTextList = new ShortTextList();

		//Adding the ShortText file name
		var fileNameShortText = new ShortText();
		fileNameShortText.setShortTextType('File Name');
		fileNameShortText.setShortText(fileName);
		shortTextList.add(fileNameShortText);

		//Add the ShortTextList to the material
		material.setShortTextList(shortTextList);

		//Creating tagList to add to the material later
		var tagList = new TagList()

		//Adding the taglist to the material
		material.setTagList(tagList);

		// Add the TTLs specified in the form.
		if (isValid(trackMapping)) {
			for each (var trackMap in trackMapping) {		
				_logger.info("Adding TTL of type [" + trackMap.TrackTypeName + "] for MatId [" + matId + "].");
				
				var trackTypeLink = new TrackTypeLinkDefault();
				trackTypeLink.setTrackTypeName(trackMap.TrackTypeName);
				trackTypeLink.setStateMachineName('Ingest');
				trackTypeLink.setStateName('Not Available');
				
				material.addTrackTypeLink(trackTypeLink);

			}
        }
		
        // Save the Material
        var command = new Command("material", "save");
        command.addParameter("material", material);
        _commandHelper.runCommand(command);

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
