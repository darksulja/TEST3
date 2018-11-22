var java = JavaImporter(
    Packages.com.pharos.core.domain,
    Packages.com.pharos.core.domain.options,
    Packages.com.pharos.core.domain.utils

);

/* This function checks if the material has tracks on browse on not. */
/*
function checkIfTracksExistsOnBrowse(material) {
    var tracksExistOnBrowse = false;
    var tracks = material.getTracks().iterator();
    while (tracks.hasNext()) {
        var track = tracks.next();
        logger.info(track.getMediaName().toString());

        if (track.getMediaName() == "Browse") {
            tracksExistOnBrowse = true;
            break;
        }
    }
    logger.info(tracksExistOnBrowse);
    return tracksExistOnBrowse;
}
*/
//function used to determine if at least 1 track is on Main media
function checkIfTracksExistsOnMain(material){
    var tracksExistOnMain = false;
    var tracks = material.getTracks().iterator();
    while (tracks.hasNext()) {
        var track = tracks.next();
        logger.info(track.getMediaName().toString());

        if (track.getMediaName() == "Main") {
            tracksExistOnMain = true;
            break;
        }
    }
    logger.info(tracksExistOnMain);
    return tracksExistOnMain;
}
//for future reference: track.getEncoded() returns an int, track.isEncoded returns a bool, getEncodedAsBoolean() returns bool, but can distinguish between non-encoded and null 
function allTracksEncoded(material){
    var areTracksEncoded = true;
    var tracks = material.getTracks().iterator();
    while (tracks.hasNext()) {
        var track = tracks.next();
        logger.info(track.getMediaName().toString());
        var isEncoded = track.isEncoded();
        if (isEncoded == false) {
            areTracksEncoded = false;
            break;
        }
    }
    logger.info(areTracksEncoded);
    return areTracksEncoded;
}
/* This function moves a material to Ready and is invoked when the renderX was unsucessful in browse creation */
function moveMaterialToReady(requirementFound) {
    with(java) {

        requirement.id = requirementFound.id;
        requirement.name = requirementFound.name;
        requirement.visibility = requirementFound.visibility;

    }
}

/* This function gets the transfer history and checks whether the last transfer to Browse was a success or not */
/*
function checkTransferToBrowseWasSuccessful() {
    with(java) {
        var command = new Command("transfer", "getTransferHistory");

        command.addParameter("matId", matId);
        var result = _commandHelper.runCommand(command);

        var transferHistory = result.getOutput().iterator();


        var transferHistoryEntry;
        var destinationMedias = [];
        var completedStates = [];

        while (transferHistory.hasNext()) {
            transferHistoryEntry = transferHistory.next();
            destinationMedias.push(transferHistoryEntry.getDestinationMedia());
            completedStates.push(transferHistoryEntry.getCompletedState());
        }

        for (var i = destinationMedias.length - 1; i >= 0; i--) {
            if (destinationMedias[i] == "Browse") {
                if (completedStates[i] == "In error") {
                    return false;
                } else {
                    return true;
                }
            }
        }

        return true; // The material has no transfer history to Browse

    }
}
*/

with(java) {
    var materialOptions = ['tracks', 'trackTypeLinks'];
    var requirementNameToFetch = workflowDecisionParameters.getParam("RequirementName");
    var requirementFound = scriptHelper.getWorkflowRequirement(requirementNameToFetch);
    var material = scriptHelper.getMaterial(workflowItem.id, materialOptions);
    var matId = material.getMatId().toString();
    var materialOnMain = checkIfTracksExistsOnMain (material);
    var tracksEncodedFlag = allTracksEncoded(material); // returns a bool based on whether or not the material has encoded tracks
 
    //THERE ARE TRACKS ON MAIN MEDIA AND ALL TRACKS ARE ENCODED
    if (materialOnMain == true && tracksEncodedFlag == true) {
        moveMaterialToReady(requirementFound); 
    }
    //EITHER: NO TRACKS ON MAIN MEDIA, OR NOT ALL TRACKS ARE ENCODED
    else{
        if(materialOnMain == false){
            logger.info("The material has no tracks on Main media");
            scriptHelper.abort("\n\nUnable to Bypass Metadata Queue - the material has no tracks on Main media"); // The material stays in metadata queue since it has no tracks on main
        }
        else{
            logger.info("The material has tracks that are not encoded");
            scriptHelper.abort("\n\nThe material has tracks that are not encoded"); // The material stays in metadata queue since it has no tracks on main
        }
    }
}
