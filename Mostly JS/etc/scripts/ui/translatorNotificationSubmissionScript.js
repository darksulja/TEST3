var java = JavaImporter(
	Packages.com.pharos.core.domain,
	Packages.com.pharos.core.domain.utils,
	Packages.com.pharos.core.domain.job
);

const ENITY_TYPE = "EntityType";
const ENTITY_ID = "EntityID";

with (java) {
	_logger.info("Running Translator Notification Submission script...");
	var entityID = _formData.getValue(ENTITY_ID);
	var entityType = _formData.getValue(ENITY_TYPE);
	_logger.info("Entity ID is ["+entityID+"]");
	_logger.info("Entity Type is ["+entityType+"]");
	
	var jobFactoryName = "";
	var domainKeyType = "";
	if("MATERIAL" == entityType.toUpperCase()){
		jobFactoryName = "translatorMaterialUpdateJobFactory";
		domainKeyType = "matId";
	} else {
		jobFactoryName = "translatorPlacingUpdateJobFactory";
		domainKeyType = "placingId";
	}  
	
	var jobDescription = new JobDescription();
	    jobDescription.setProperty("domainKeyType",domainKeyType);
		jobDescription.setProperty("domainKey",entityID);
		
	if("ADOPS WORK ORDER" == entityType.toUpperCase()){
		jobDescription.setProperty("Entity","adops_qc_workorder");
		jobDescription.setProperty("EntityAction","U");
	}

    var jobCmd = new Command("job","executeJob");
    jobCmd.addParameter("jobFactoryName",jobFactoryName);
    jobCmd.addParameter("jobDescription",jobDescription);
	
    var jobResult = _commandHelper.runCommand(jobCmd);
	_logger.info("Job is Submitted");
    if(jobResult && jobResult.getSuccess() == true){
            _result.setSuccess(true);
            _result.setOutcome("Success");
    } else {
    		_result.setSuccess(false);
            _result.setOutcome("Unable to create job");
    }

}