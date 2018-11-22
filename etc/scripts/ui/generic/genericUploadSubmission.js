const ESSENCE_FILE_DATA_KEY = "essenceFile";

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
	_logger.info("Running Generic Form Upload Submission Script");
	try {
		// Parse the form data to get all our fields
		var essenceFile = _formData.getValue(ESSENCE_FILE_DATA_KEY);

		// Build our material object
		var material = new Material();

		//ShortText List to add to material
		var shortTextList = new ShortTextList();
		material.setShortTextList(shortTextList);

		//Add the new Brand List to the material 
		var brandList = new BrandList()
		material.setLinkedBrandList(brandList);

		//Creating tagList to add to the material later
		var tagList = new TagList();
		material.setTagList(tagList);

		// Build our track
		var track = new Track();

		// Build the track defs and track type links from the track mapping
		material.addTrack(track);

		_logger.info("Building job description.");
		var jobDescription = new JobDescription();
		jobDescription.setProperty('material', material);
		if (isValid(essenceFile) && essenceFile != "") {
			jobDescription.setProperty('essenceFile', essenceFile);
		} else {
			throw new Error("An essence file must be provided.");
		}

		// Build our execute job and run it :)
		_logger.info("Executing an upload job for essence file [" + essenceFile + "].");
		var command = new Command("job", "executeJob");
		command.addParameter("jobFactoryName", "contentUploadJobFactory");
		command.addParameter("jobDescription", jobDescription);

		var result = _commandHelper.runCommand(command);
		_logger.info("Job submitted for essence file [" + essenceFile + "] Job Id [" + result.getOutput() + "].");

		_logger.info("Completed Generic Form Submission Script");

		// Currently no logic is required, just return true.
		_result.setSuccess(true);
		_result.setOutcome("Content successfully submitted for upload.");
	} catch (e) {
		_result.setSuccess(false);
		_result.setOutcome("Error occured: [" + e.message + "].");
		_logger.info("Error occured: [" + e.message + "].");
	}
}
