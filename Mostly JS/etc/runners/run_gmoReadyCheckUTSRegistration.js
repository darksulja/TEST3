/*
Last Modified: 09/12/2018
Updated By: Chad Lundgren <chad.lundgren@nbcuni.com>
 */

if(typeof(gmoNBCFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")
if(typeof(gmoNBCNLDFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
if(typeof(gmoNBCCompFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_component_fun.js");

if(typeof(NBCGMO)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_settings.js");
if(typeof(lookup)==="undefined")  load("/opt/evertz/mediator/etc/runners/lookup.js");
if(typeof(MediaInfoHelper)==="undefined")  load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");

if(typeof(JSCommons)==="undefined"){
    print("Loading JSCommons js ")
    load("/opt/evertz/mediator/etc/helpers/JSCommons.js");	
}
if(typeof(MediatorCommons)==="undefined"){
    print("Loading JSCommons js ")
    load("/opt/evertz/mediator/etc/helpers/MediatorCommons.js");	
}


const Component = {};
// Triggers, aka requirements
Component.triggers = {
    toSourceMediaReceived : NBCGMO_CONSTANTS.TRIGGERS.UPLOAD,
    toComponentUploadFailed : NBCGMO_CONSTANTS.TRIGGERS.FAILED,
    toComponentReviewRequired: NBCGMO_CONSTANTS.TRIGGERS.COMPLETE,
    toComponentReview: NBCGMO_CONSTANTS.TRIGGERS.COMPLETE,
    toPurge:  NBCGMO_CONSTANTS.TRIGGERS.PURGE
}
Component.states = {
    MEDIA_RECEIVED: "Media Received",
    COMPONENT_REVIEWED: "Component Review Required",
    REGISTERED: "Registered",
    READY: "Ready"
}
const ORIGINAL_FILENAME = "Original File Name";
const subTitleTypes = ''
var audioOrSubMedia = '';
const DOT = ".";
const HYPHEN = "-";

__buidNotificationJobDescription = function(UTCId){
	var jobDescription =   <JobDescription>
			<Properties>
				<Mapping>
					<material>
                        <Material>
                        <MatId>{UTCId}</MatId>
                        </Material>
                    </material>
				</Mapping>
			</Properties>
	    </JobDescription>;
	return jobDescription;
}

callUntrustedComponentReview =  function (UTCId) {
	if(typeof JobHelper === "undefined"){
		MediatorCommons.loadScriptFile("JobHelper");
	}

	var jobHelper = new JobHelper();
    jobHelper.setJobFactory("Untrusted Component Review");
    print('Attempting to execute Untrusted Component Review')

	jobHelper.setJobDescription(this.__buidNotificationJobDescription(UTCId));
	jobHelper.executeJob();
}

var getMaterialsForApprovalRequired = function(GmoMatId ) {
    print('running query for UTC Materials matching')
    var cmd = 
        <PharosCs>
            <CommandList>
                <Command subsystem="report" method="runReport">
                    <ParameterList>
                        <Parameter name="reportName" value="UTCReport" />
                        <Parameter name="pageSize">
                            <Value>
                                <Integer>9999</Integer>
                            </Value>
                        </Parameter>
                    </ParameterList>
                </Command>
            </CommandList>
        </PharosCs>;

    var materialList = []; 
    var rtn = wscall(cmd);
    print('passed in GMO ID is: [' + GmoMatId + ']')

    for each (var reportRowResult in rtn..ResultList.PagedResults.Results.ReportRow){
        var reportGmoMatId = reportRowResult.COMPONENTSHELL.toString();
        var UTCId = reportRowResult.MAT_ID.toString();
        if (GmoMatId  == reportGmoMatId  ) {
            materialList.push(UTCId);
        } 
    }
    return materialList;
}

try {
    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;  
    // print(jobDescription);
    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
    jobDashboard.updateStatusAndProgress("Starting Script",5);
    var material = jobDescription..material.Material;
    var GMOMatId = material..MatId.toString();
    output(" GMO MatId [" + GMOMatId + "]");

    if (!gmoNBCFunc.isVarUsable(GMOMatId)) {
        throw new Error("GMOMatid is empty, cannot continue ");
    } else {
        print('GMO GMOMatID is: [' + GMOMatId + ']' );
    }

    Component.GMOId = GMOMatId;
    Component.GmoMatHelper = new gmoNBCFunc.materialHelper(Component.GMOId);
    Component.GmoMaterialXml = Component.GmoMatHelper.getMaterialXml();

    var allReady = true;
    for each(var ttl in Component.GmoMatHelper.getTrackTypes() ) {
        var state = Component.GmoMatHelper.getStateOfTtl(ttl);    
        //output("\t\tTrackTypeLink [" + ttl + "] at [" + state + "]");
        if(state != 'Ready') {
            allReady = false;
        }
    }

    if (allReady == false) {
        print('GMO tracks are not all in ready state, quitting');
        quit(0);

    } else {
        print('GMO tracks all in ready state, continuing');
    }

    var materialList = getMaterialsForApprovalRequired(Component.GMOId);
    if (materialList.length < 1) {
        print('Did not find any matching UTC materials')
    }
    
    for each (var materialId in materialList) {
        Component.UTCMatHelper = new gmoNBCFunc.materialHelper(materialId);
    
        var allReady = true;
        for each(var ttl in Component.UTCMatHelper.getTrackTypes() ) {
            var state = Component.UTCMatHelper.getStateOfTtl(ttl).toString();
            output("\t\tTrackTypeLink [" + ttl + "] at [" + state + "]");

            // TrackTypeLink [Audio 1] at [Registered]
            if(state != 'Registered' ) {
                allReady = false;
            }

            if (allReady == false) {
                print('UTC track is not in Registered state, not Transitioning');
            } else {
                print('UTC track in ready state, continuing');
                callUntrustedComponentReview(materialId)

            }

        }

    }

} catch(e) {
    output("An error has occured: " + e.message);
    jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});
    quit(1);
}
