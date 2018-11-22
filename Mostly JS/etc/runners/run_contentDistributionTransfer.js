load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");

var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();


// consts
var VIDEO_NON_USABLE_MEDIA_STRINGS = ["T3_", "DIVA_"]; // Parts of the Media name which can be replaced to find a good 'Working Media'
var AUDIO_NON_USABLE_MEDIA_STRINGS = ["T3_", "DIVA_"]; // Parts of the Media name which can be replaced to find a good 'Working Media'
var VIDEO_PREFERED_WORKING_MEDIA = ["T2_", ""]; // Where we want the files to go to
var AUDIO_PREFERED_WORKING_MEDIA = ["T2_", ""]; // Where we want the files to go to
var TIME_REQUIRED = -90000; 
var TRANSFER_STATE = "Transfer";
var COMPLETE_TRANSITION = "Complete";
var ERROR_TRANSITION = "Error";

var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
print("Job Description: " + jobDescription);
var placingId = jobDescription.Properties.Mapping.domainKey.toString();

var pH = new PlacingHelper(placingId);


try {
    // Get the Restore Params Again
    var placingRestoreEval = pH.sourceMaterialRestoreEval();
    var restoreRequestStatus = {};
    if (placingRestoreEval.requireRestore.length > 0) {
        output("Restore required for [" + placingRestoreEval.requireRestore + "]");
        output("Restore not required for [" + placingRestoreEval.noRestoreNeeded + "]");

        // Generate Requests First
        for (var m = 0; m < placingRestoreEval.requireRestore.length; m++) {
            var matId = placingRestoreEval.requireRestore[m];
            restoreRequestStatus[matId] = {};
            output("Making Transfer Request for [" + matId + "]");

            // Find the current Media
            var videoMedia =  gmoNBCFunc.getOMMedia(matId);
            var audioMedia =  gmoNBCFunc.getOMAudioMedia(matId);

            // From the current Media - Find the Transfer Location
            var videoDest = getDestMedia(videoMedia, VIDEO_NON_USABLE_MEDIA_STRINGS, VIDEO_PREFERED_WORKING_MEDIA);
            var audioDest = getDestMedia(audioMedia, AUDIO_NON_USABLE_MEDIA_STRINGS, AUDIO_PREFERED_WORKING_MEDIA);

            output("Preferred Video Media Name [" + videoDest + "]");
            output("Preferred Audio Media Name [" + audioDest + "]");

            // Generate the Transfer Requests - Only if needed
            if (videoMedia !== videoDest) {
                output("Generating Transfer Request to for Video");
                var requestId = makeTransferRequest(matId, videoDest, TIME_REQUIRED);
                // var requestId = 100;
                output("Request ID is [" + requestId + "]");
                // Store the Request ID so we can find it later
                restoreRequestStatus[matId]["video"] = {
                    id : requestId,
                    media : videoDest
                };
            } else {
                restoreRequestStatus[matId]["video"] = {
                    id : -1,
                    media : videoDest
                }
            }

            if (audioMedia !== audioDest) {
                output("Generating Transfer Request to for Audio");
                var requestId = makeTransferRequest(matId, audioDest, TIME_REQUIRED);
                // var requestId = 101;
                output("Request ID is [" + requestId + "]");
                // Store the Request ID so we can find it later
                restoreRequestStatus[matId]["audio"] = {
                    id : requestId,
                    media : audioDest
                };
            } else {
                restoreRequestStatus[matId]["audio"] = {
                    id : -1,
                    media : audioDest
                };
            }
            print("");
        }

        var transfers_complete = false;
        while (!transfers_complete) {
            // Poll Transfer Requests
            var statusStr = "Restoring ";
            for (var prop in restoreRequestStatus) {
                // matId : {
                //     matId : <matId>
                //     video : <id>
                //     audio : <id>
                // }

                // Video
                if (restoreRequestStatus[prop].video.id > -1) {
                    output("Checking Status of Video Transfer for [" + prop + "]");
                    if (transferComplete(restoreRequestStatus[prop].video.id, prop, restoreRequestStatus[prop].video.media)) {
                        print("Video Transfer Complete For [" + prop + "]");
                        restoreRequestStatus[prop].video.id = -1;
                    } else {
                        statusStr += prop + " (Video),"
                    }
                }

                // Audio
                if (restoreRequestStatus[prop].audio.id > -1) {
                    output("Checking Status of Audio Transfer for [" + prop + "]");
                    if (transferComplete(restoreRequestStatus[prop].audio.id, prop, restoreRequestStatus[prop].audio.media)) {
                        print("Audio Transfer Complete For [" + prop + "]");
                        restoreRequestStatus[prop].audio.id = -1;
                    } else {
                        statusStr += prop + " (Audio),"
                    }
                }
            }

            // Update Dashboard
            statusStr = statusStr.substring(0, statusStr.length - 1);
            print(statusStr);
            try {
                jobDashboard.updateStatus(statusStr);
            } catch(e) {
                print("Error Updating Job Status: " + e.message);
            }

            // Is everything complete?
            if (allRestored(restoreRequestStatus)) {
                try {
                    jobDashboard.updateStatus("Restores Complete");
                } catch(e) {
                    print("Error Updating Job Status: " + e.message);
                }
                transfers_complete = true;
            }
            sleep(60);
        }
    }

    print("All Restores Complete - Saving Staging Tracks");
    pH.saveFakeStagingTrackForAllMats();

    print("Complete - Transitioning Placing");
    gmoNBCNLDFunc.transitionPlacing(placingId, TRANSFER_STATE, COMPLETE_TRANSITION);
} catch (e) {
    print("Error: " + e.message);
    gmoNBCNLDFunc.transitionPlacing(placingId, TRANSFER_STATE, ERROR_TRANSITION);
    throw new Error("Error Transferring Source Materials: " + e.message);
}


// END

function getDestMedia(curr, non_use, preferred) {
    // If the Media Name contains any of the 'non_use' strings - we can't use it
    // If the Media Name DOES NOT contain any of the 'non_use' strings - we CAN use it. This will prevent everything trying to Transfer to T2 when it exists on the DVS
    for (var i = 0; i < non_use.length; i++) {
        if (curr.indexOf(non_use[i]) > -1) {
            for (var u = 0; u < preferred.length; u++) {
                return curr.replace(non_use[i], preferred[u]);
            }
        }
    }
    return curr;
}


function allRestored(obj) {
    for (var prop in obj) {
        // If the restore ID has not been set to -1 then the transfer is not complete
        if (restoreRequestStatus[prop].video.id !== -1 || restoreRequestStatus[prop].audio.id !== -1) {
            print("allRestored(): [" + prop + "] Not Restored Yet")
            return false;
        }
    }
    return true;
}


function transferComplete(rid, matId, destMedia) {
    var command =
            <PharosCs>
              <CommandList>
                <Command subsystem="transfer" method="getRequests">
                  <ParameterList>
                    <Parameter name="requestor" value=""/>
                    <Parameter name="requestId">
                      <Value>
                        <Integer>{rid}</Integer>
                      </Value>
                    </Parameter>
                  </ParameterList>
                </Command>
              </CommandList>
            </PharosCs>;
    var status = ""+wscall(command)..Request.Status;
    var completed = false;
    error("Request: matId=[" + matId + "] id=[" + rid + "] status=[" + status + "]");
    if (status == "" || status == "Completed") {
        output("Transfer Complete!");
        completed = true;
    } else if (status == "Submitted" || status == "Calculated") {
        // Nothing yet
    } else {
        if (status != "In error") {
            // Need to delete the request
            // 'Missing', 'No media', 'No route', 'Ingest', 'Track types',
            // 'Deferred'
            deleteTransferRequest(matId, destMedia);
        }
        var sErr = "Error: Request ID [" + rid + "] failed with status [" + status + "]";
        error(sErr);
        throw new Error(sErr);
    }
    print("transferComplete(): " + completed)
    return completed;
}