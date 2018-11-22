var java = JavaImporter(
	Packages.com.pharos.core.domain,
	Packages.com.pharos.core.domain.utils,
	Packages.com.pharos.core.domain.job
	);

// Declaring Constants - Form Data Keys
const TRACK_TYPE_GROUP = "TrackTypeGroup";
const TRACK_TYPE_GROUPS = "TrackTypeGroups";
const SOURCE_MATID = "Material.MatId.source";
const DEST_MATID = "Material.MatId.destination";
const FORCE_COPY = "ForceCopy";

with (java) {

  //
  // Start the script
  //

  _logger.info("Running Audio Track Type Group Copy Submission script...");

	var materialIdSource = _formData.getValue(SOURCE_MATID);
	var materialIdDest = _formData.getValue(DEST_MATID);
	var trackTypeGroup = _formData.getValue(TRACK_TYPE_GROUPS);
	var forceCopy = _formData.getValue(FORCE_COPY);

  _logger.info("trackTypeGroup = "+trackTypeGroup);
  _logger.info("forceCopy = "+forceCopy);

	var jobFactoryName = "audioTrackTypeGroupCopyJobFactory";

	var jobDescription = new JobDescription();
	jobDescription.setProperty("sourceID",materialIdSource);
	jobDescription.setProperty("destID",materialIdDest);
	jobDescription.setProperty("trackTypeGroup",trackTypeGroup);
  jobDescription.setProperty("forceCopy",forceCopy);
	//_logger.info("jobDescription = "+jobDescription.get);

	var jobCmd = new Command("job","executeJob");
	jobCmd.addParameter("jobFactoryName",jobFactoryName);
	jobCmd.addParameter("jobDescription",jobDescription);

	var result = false;
	var jobResult = _commandHelper.runCommand(jobCmd);
	_logger.info("Job is Submitted");
	if(jobResult && jobResult.getSuccess() == true){
		_result.setSuccess(true);
		_result.setOutcome("Success");
		result = true;
	} else {
		_result.setSuccess(false);
		_result.setOutcome("Unable to create job");
	}

	_logger.info("Completed Audio Track Type Group Copy Submission script "+(result?"successfully":"unsuccessfully"));
}
