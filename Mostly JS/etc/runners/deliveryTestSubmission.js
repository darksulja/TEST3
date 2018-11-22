var java = JavaImporter(
	Packages.com.pharos.core.domain,
	Packages.com.pharos.core.domain.utils,
	Packages.com.pharos.core.domain.job
);

const PUBLICATION_DEFINITION = "Delivery.PublicationDefinitionName";
const EMAIL_ADDRESSES = "Delivery.DistributionList";
const FILE_ID = "Delivery.File";
const JOB_FACTORY = "deliveryTestJobFactory";
 

with (java) {
	_logger.info("Running Delivery Submission script...");
	var profile = _formData.getValue(PUBLICATION_DEFINITION);
	var addresses = _formData.getValue(EMAIL_ADDRESSES);
	var file = _formData.getValue(FILE_ID);
	
	_logger.info("Profile is ["+profile+"]");
	_logger.info("Address is ["+addresses+"]");
	_logger.info("Delivery File is ["+file+"]");
	
	var jobDescription = new JobDescription();
	    jobDescription.setProperty("addresses",addresses);
	    jobDescription.setProperty("profile",profile);
		jobDescription.setProperty("file",file);

    var jobCmd = new Command("job","executeJob");
		jobCmd.addParameter("jobFactoryName",JOB_FACTORY);
		jobCmd.addParameter("jobDescription",jobDescription);
	
    var jobResult = _commandHelper.runCommand(jobCmd);
	_logger.info("Job is Submitted");
    if(jobResult && jobResult.getSuccess() == true){
            _result.setSuccess(true);
            _result.setOutcome("Delivey Test Job Submitted Successfully. You can monitor status in Delivery Test Dashboard");
    } else {
    		_result.setSuccess(false);
            _result.setOutcome("Unable to Submit Delivery Test job");
    }

}