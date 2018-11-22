/**
 * WsRunner for audioCopyTrackTypeGroup
 */

load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
//load("/opt/evertz/mediator/etc/runners/nbcgmo_settings.js");
//load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/AudioComponentHelper.js");


try {
    var COMPONENT_COPY_TRIGGER = "Component Copy";
	var ret = false;

	print("In Runner - run_audioCopyTrackTypeGroup.js");

	//var debug = true;
	var jobDesc = getJobParameter("jobDescription");
	//if(debug)
		print("\nJobDesc\n"+jobDesc+"\n");

	var materialIdSource = jobDesc..sourceID.toString();
	var materialIdDest = jobDesc..destID.toString();
	var trackTypeGroup = jobDesc..trackTypeGroup.toString();
    var forceCopy = jobDesc..forceCopy.toString();

	//jobDashboard.updateStatusMap({"MATERIAL_ID":materialIdSource});
	output("materialIdSource: " + materialIdSource);

	//
	// Setup the Dashboard
	//
	//Source Material | Target Material | Track Type | Status | Status Comments |

    // Create a Dashboard Updater Object
	print("Updating Job DashBoard...");
    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();

    jobDashboard.updateStatusMap({"Script_SourceMatId":materialIdSource});
    jobDashboard.updateStatusMap({"Script_DestMatId":materialIdDest});
    jobDashboard.updateStatusMap({"Script_TrackTypeGroup":trackTypeGroup});
    jobDashboard.updateStatusMap({"Script_ForceCopy":forceCopy});
    jobDashboard.updateStatusAndProgress("Starting Script",5);

    var acHelper = new AudioComponentHelper(materialIdSource,materialIdDest,trackTypeGroup,forceCopy);
    // Set the Dashboard in the helper, so it can update the status as it does it's work.
    acHelper.setJobDashboard(jobDashboard);

	// NOTE: Material GMO_00000000043033_02 has an original filename of GMO_00000000016341_01.mov
	// The file can be found at /srv/dc-delivery/TestHold/transferTest

	// var trackTypeGroupsSource = acHelper.getAudioTrackTypes(sourceMatId);
	// print("\n\n###################### Track Type Groups for "+ sourceMatId + " are:");
	// show(trackTypeGroupsSource);
	//
	// var trackTypeGroupsTarget = acHelper.getAudioTrackTypes(targetMatId);
	// print("\n\n###################### Track Type Groups for "+ targetMatId + " are:");
	// show(trackTypeGroupsTarget);

    jobDashboard.updateStatusAndProgress("Copying Track Type Group"+trackTypeGroup,5);
	print("Copying...");
	//acHelper.copyTrackTypeGroups(sourceMatId, targetMatId, "Surround English");
	ret = acHelper.copyTrackTypeGroups();
	print("acHelper.copyTrackTypeGroups() was "+(ret?"successful":"unsuccessful")+"!");

	if( ret ) {
        jobDashboard.updateStatusAndProgress("Completed copying Track Type Group ["+trackTypeGroup+"]",100);
    }
    else {
        jobDashboard.updateStatusAndProgress("Error Copying Track Type Group ["+trackTypeGroup+"]",100);
        jobDashboard.updateStatusMap({"JOB__ERROR": "Unexpected return of false from copyTrackTypeGroups()"});
	}

} catch(e){
	print("ERROR: "+e.message);
	//materialWorkflowTransition(materialIdDest, requirements.error, transitionedTTL);
    if (typeof(jobDashboard) !== "undefined") {
        jobDashboard.updateStatus("Error Copying Track Type Group ["+trackTypeGroup +"]");
        jobDashboard.updateStatusMap({"JOB__ERROR": e.message});
    }
    throw(e);
} finally {
    //jobDashboard.updateStatusAndProgress("Finished Script",100);
	acHelper.cleanUp();
}
