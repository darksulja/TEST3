if(typeof(NBCGMO_CONSTANTS)==="undefined") load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js");
if(typeof(gmoNBCFunc)==="undefined") load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");

try {
    var states = {
	    movedToShellRecord : "Moved to Shell Record"
    };
    var requirements = {
	    purge : "Purge"
    };

    var shortTextTypeUTSRecord = "UTS Record";

    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;

    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
    jobDashboard.updateStatusAndProgress("Starting Script",5);

    // Get Material ID from Job Description.
    var materialId = jobDescription.Properties.Mapping.domainKey.toString();
    var materialXML = materialGet(materialId,"shorttext")..Material;

    var utsRecordId = materialXML.ShortTextList.ShortText.(shortTextTypeUTSRecord === ShortTextType.toString()).Value.toString();
    if(gmoNBCFunc.isVarUsable(utsRecordId)){
	    output("Setting UTS Record [" + utsRecordId + "] for deletion.");
	    gmoNBCFunc.transitionTrackTypes(utsRecordId,requirements.purge,[NBCGMO_CONSTANTS.VIDEO]);
    }else{
	    output("Material [" + materialId + "] did not originate from UTS Workflow. Ignoring this material.\n")
    }

    output("Script Complete.");

    jobDashboard.updateStatusAndProgress("Finished Running Script Successfully", 100);
} catch(e) {
    output("An error has occured: " + e.message);
    jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});	
    quit(1);
}
