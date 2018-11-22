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
if(typeof(JobHelper)==="undefined") load("/opt/evertz/mediator/etc/runners/JobHelper.js");

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
Component.subsOrAudio = "subtitle";
const subTitleTypes = ''

getTrackType = function(trackTypeName){
            return wscall(<PharosCs>
                      <CommandList>
                        <Command subsystem="trackType" method="get">
                          <ParameterList>
                            <Parameter name="trackTypeName" value={trackTypeName}/>
                          </ParameterList>
                        </Command>
                      </CommandList>
                    </PharosCs>)..TrackType;
    }

getStagingMedia = function(dropFolder){
    output("UploadHelper getStagingMedia - Start")
    var _stagingMedia = "";
    print('lookup.dropfolder[dropFolder] is: ' + lookup.dropfolder[dropFolder]  )
    if(gmoNBCFunc.isVarUsable(dropFolder) && 
        gmoNBCFunc.isVarUsable(lookup.dropfolder[dropFolder]) &&
        gmoNBCFunc.isVarUsable(lookup.dropfolder[dropFolder].stagingMedia)){
        _stagingMedia = lookup.dropfolder[dropFolder].stagingMedia;
    }else {
        _stagingMedia = NBCGMO.omUploadSettings.defaultVideoStagingMedia;
    }
    print('_stagingMedia is: [' + _stagingMedia + ']');
    output("UploadHelper getStagingMedia - End")
    return _stagingMedia;
}

function addTrack(audioMedia, trackTypeName, tdPositionArray,filePositionArray, channels, frameRate, componentPathName,originalFileName) {
    print('addTrack function')
    try {
        Component.GmoMatHelper.addTrackTypeLink(trackTypeName, "Ready", NBCGMO_CONSTANTS.STATE_MACHINES.NBC_GMO);
        print('after addTrackTypeLink')

        print('right before saveUsingSaveXml')
        Component.GmoMatHelper.saveUsingSaveXml();
        sleep(2);
        print('after saveUsingSaveXml')
        // Get max of both and set them
        tdPosition = tdPositionArray.reduce(function(a, b) {
            return Math.max(a, b);
        });

        filePosition = filePositionArray.reduce(function(a, b) {
            return Math.max(a, b);
        });

        tdPosition = tdPosition + 1;
        filePosition = filePosition + 1;

        print('tdPosition is [' + tdPosition + "]");
        print('filePosition is [' + filePosition + "]");
        gmoNBCCompFunc.makeAndSaveTrackDef(Component.GMOId, audioMedia, trackTypeName, tdPosition, channels, filePosition, Component.fileExt, frameRate, componentPathName);
        // Make sure the track def is there to save shortText on
        sleep(3);
        Component.GmoMatHelper.addTrackTypeLinkShortText(trackTypeName, NBCGMO_CONSTANTS.SHORT_TEXTS.ORIGINAL_FILE_NAME, originalFileName);
        Component.GmoMatHelper.saveUsingSaveXml();
    } catch(e) {
        print("Error adding Track Def [" + e.message + "]");
    }
}

function checkMaterials(matId) {

    var primaryLanguage = Component.UTCMatHelper.getPrimaryLanguage();
    Component.originalFileName = Component.UTCMaterialXML..TrackTypeLink..ShortText.(ShortTextType.toString() == "Original File Name").Value.toString();
    print('UTC originalFileName is: [' + Component.originalFileName + ']');
    var regex=/\.(wav|cap|scc|pac|stl|xml)$/i;
    var found = Component.originalFileName.match(regex);
    Component.fileExt = found[1];

    if (!gmoNBCFunc.isVarUsable(Component.fileExt)) {
        throw new Error("\n  fileExt blank or null, cannot continue ");
    } else {
        print('fileExt is: [' +  Component.fileExt + ']' );
    }

    // Check to see if GMO number is real, if not throw
    if (Component.GMOId.indexOf('GMO_') > -1) {

        // E4X is doing weird XMLLlist stuff, so 0 is needed here to avoid bogus blank string
        var frameRate = Component.GmoMaterialXml..Material.FrameRate[0].toString();
        print('Component is: [' + frameRate + ']' )
        Component.frameRate = frameRate;
        var isValidGMO = ( Component.GmoMaterialXml..Command.@success == "true" );
    } else {
        throw new Error("Number must contain valid GMO MatId to work ");
    }
    var componentGMOTrackTypeName = Component.UTCMatHelper.getShortTextValue("Component GMO TrackType Name");
    
    if (!gmoNBCFunc.isVarUsable(componentGMOTrackTypeName)) {
        throw new Error("componentGMOTrackTypeName is blank or null");
        } else {
            Component.componentGMOTrackTypeName = componentGMOTrackTypeName;
            print('componentGMOTrackTypeName is: [' + Component.componentGMOTrackTypeName + ']' );
    }

    if ( Component.fileExt == 'wav' ) {
        // Lookup FileTag by Component.componentGMOTrackTypeName
        Component.fileTag = getTrackType(Component.componentGMOTrackTypeName).FileTag;
        if (!gmoNBCFunc.isVarUsable(Component.fileTag)) {
            throw new Error("Component.fileTag could not be found cannot copy in without valid GMO TrackType Name ");
            } else {
            print('Component.fileTag is: [' + Component.fileTag + ']' );
        }
    } else {
        print('Subtitle, setting blank fileTag')
        Component.fileTag = '';
    }
    

    if (!isValidGMO) {
        throw new Error("\nFailed to match existing GMO MatId, cannot continue [" + d + "]") 
    } else {
        print('Found matching GMO MatId, continuing')
    }

    var allReady = true;
    for each(var ttl in Component.GmoMatHelper.getTrackTypes() ) {
        var state = Component.GmoMatHelper.getStateOfTtl(ttl);    
        output("\t\tTrackTypeLink [" + ttl + "] at [" + state + "]");
        if(state != 'Ready') {
            allReady = false;
        }
    }

    if (allReady == false) {
        print('GMO tracks are not all in ready state, quitting and leaving in Component Review Required');
        // May end up in either state depending on failure point:  will fail silently if the transition does not work
        gmoNBCFunc.transitionMaterial(matId, Component.states.REGISTERED,Component.triggers.toComponentReviewRequired);
        gmoNBCFunc.transitionMaterial(matId, Component.states.COMPONENT_REVIEWED,Component.triggers.toComponentReviewRequired);
        quit(0);
    } else {
        print('GMO tracks all in ready state, continuing');
    }

   Component.audioMedia = gmoNBCFunc.getOMAudioMedia(Component.GMOId)
    var trackDefintions = '';
}

function copyTracktoGMO() {
    var stagingMediaName = getStagingMedia('FROM_StudioPost_T2_Components_UTC');
    var stagingPrefix = lookup.media[stagingMediaName].mount
    print('stagingPrefix is: ' + stagingPrefix + ']')
    var stagingDir = stagingPrefix + '/' + matId + '.dir';
    print('stagingDir is: ' + stagingDir + ']')
    var componentPathName = stagingDir + "/" +  matId + NBCGMO_CONSTANTS.DOT +   Component.fileExt; 
    print('componentPathName is: ' + componentPathName + ']')
    print('fileExt (from earlier regex) is: [' +  Component.fileExt + ']')
    var dropFolderFileObj = new gmoNBCFunc.usefulFileObj(componentPathName);
    fileName = dropFolderFileObj.filename;

    print('fileName is: ' + fileName )
    // Default since there a multiple extensions for captions
    if ( Component.fileExt == 'wav') {
        Component.subsOrAudio = "audio";
        print('WAv file detected')
    }
    print("Component.subsOrAudio: " + Component.subsOrAudio )
    var destMediaName = ( Component.subsOrAudio == "subtitle" ) ? gmoNBCCompFunc.lookupSubMediaByFileType( Component.fileExt) : gmoNBCCompFunc.lookupAudioMediaByStoreMediaAndExt(Component.GmoMaterialXml,Component.audioMedia, Component.fileExt);
    var destMedia = lookup.media[destMediaName];
    //Finding Component Media failed - Throw an Error 
    if (!gmoNBCFunc.isVarUsable(destMedia)) {
        throw new Error("destMedia ["+destMedia+"] not recognised");
    }
    print("destMedia is  ["+destMedia+"]")
    Component.destMediaName = destMediaName;
    Component.destMedia = destMedia;

    if (Component.fileExt == 'wav') {
        var destMediaPath = destMedia.usesMatIdDir ? destMedia.mount + Component.GMOId + ".dir/" : destMedia.mount;
        var destFileNameNoExt = Component.GMOId + NBCGMO_CONSTANTS.HYPHEN +  Component.fileTag;
        var destFileName = destFileNameNoExt + NBCGMO_CONSTANTS.DOT + Component.fileExt;
        Component.pathName = destMediaPath + destFileName;
        var destFileObj = new gmoNBCFunc.usefulFileObj(Component.pathName);
        print("\nAudio Destination will be Path ["+ Component.pathName +"]");
    } else {
        var destMediaPath = destMedia.usesMatIdDir ? destMedia.mount + Component.GMOId + ".dir/" : destMedia.mount;
        var destFileName =  Component.GMOId + NBCGMO_CONSTANTS.DOT + Component.fileExt;
        Component.pathName = destMediaPath + destFileName;
        var destFileObj  = new gmoNBCFunc.usefulFileObj(destMediaPath + destFileName);
        print("\nSubtitle Destination will be Path ["+ Component.pathName + destFileName +"]");
    }
    
    jobDashboard.updateStatusAndProgress("JOB__RESULT","[" + matId + "] Copying file [" + destFileObj.filename + "] to [" + destMediaName + "]");
    jobDashboard.updateStatusAndProgress("JOB__PROGRESS", 60);
    
    gmoNBCFunc.makeDirectory(destMediaPath);

    //Move File to dest Folder
    print("\nMoving Drop Folder File ");
    gmoNBCFunc.copyFileOnRemoteHost(lookup.storage.dvs.host,    // Hostname or IP, prefer to specify hostname as it will retry with different IP's if it fails
                        dropFolderFileObj.dvs_path,                // Source Path
                        destFileObj.dvs_path,                    // Destination path relative to mount on the host were sshing into (DVS in this case)
                        dropFolderFileObj.filename,                // Source Filename
                        destFileObj.filename,                    // Leave this as null (not as a string of "null"), if you dont want to rename the file.
                        dropFolderFileObj.filesize);            // You can not specify this at all, however it will check for the file transfer speed if you specify it.

    //Check File Exists
    var fileExistense = false;
    var retryLimit = 0;
    while(!fileExistense && retryLimit <= 10){
        fileExistense = fileExists(destFileObj.unix_file);
        retryLimit++;
        sleep(6)
    }
    if (fileExistense) {
        print("\nMove Successful");
    } else {
        throw new Error("\nError Move failed. Cannot see file at "+ destFileObj.unix_file);
    }

}

function registerTrackAgainstGMO() {

    var GMOId = Component.GMOId
    var audioMedia = Component.audioMedia;
    var subtitleMedia = Component.SubMedia
    var justTracksMaterialXml = materialGet(GMOId,"tracks", 'tracktypeLinks')..Material;
    var audioTrackDefinitions = justTracksMaterialXml.Track.(MediaName == audioMedia).TrackDefinition;
    var tdPositionArray = [];
    var filePositionArray = [];
    print("Component.subsOrAudio: " +  Component.subsOrAudio  )
    var trackTypeName = Component.componentGMOTrackTypeName;

    if (Component.subsOrAudio == "audio") {
        for each (var trackDef in audioTrackDefinitions) {
            // 2 is default after video
            var filePosition = parseInt(trackDef.FilePosition.toString(), 10) || 2;
            var position = parseInt(trackDef.Position.toString(), 10) || 2;
            print('Adding filePosition value: [' + filePosition + ']');
            print('Adding position value: [' + position + ']');
            tdPositionArray.push(position);
            filePositionArray.push(filePosition);
            // Mono and surround handling to come in Q4
            var channels = "2";
            print('Adding Track for [' + trackTypeName + '] where FileId will be  [' +  Component.GMOId + ']' );
            print('Will Add [' + trackTypeName + '] to TrackDefinition')
            print('Successfully registered, setting new GMO Component to Component Review Required')
        }
        addTrack( Component.audioMedia, trackTypeName, tdPositionArray,filePositionArray, channels, Component.frameRate, Component.GMOId, Component.originalFileName); 
    }  else {
        // Subtitle track settings different than audio
        tdPositionArray.push(0)
        filePositionArray.push(1)
        channels = 0;
        addTrack( Component.destMediaName, trackTypeName, tdPositionArray,filePositionArray, channels, Component.frameRate, Component.GMOId, Component.originalFileName); 
    }
    sleep(3);

}

__buildNotificationJobDescription = function(GMOId, TrackTypeName){
    var jobDescription =   <JobDescription>
            <Properties>
                <Mapping>
                <JobAction type="String">Add</JobAction>
                    <material>
                        <Material>
                        <MatId>{GMOId}</MatId>
                        </Material>
                    </material>
                    <trackTypeLink>
                        <TrackTypeLink>
                            <TrackTypeName>{TrackTypeName}</TrackTypeName>
                        </TrackTypeLink>
                    </trackTypeLink>
                    <matId>{GMOId}</matId>
                </Mapping>
            </Properties>
        </JobDescription>;
        print(jobDescription)
    return jobDescription;
 }
 
callFFMPEGService = function(GMOId,TrackTypeName) {

    var jobHelper = new JobHelper();
    jobHelper.setJobFactory("runFFMPEGMicroservice");
    print('Attempting to execute runFFMPEGMicroservice')
    jobHelper.setJobDescription(__buildNotificationJobDescription(GMOId, TrackTypeName));
    var result = jobHelper.executeJob();
    print(result);
}

try {
    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;  
    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
    jobDashboard.updateStatusAndProgress("Starting Script",5);
    var material = jobDescription..material.Material;
    var matId = material..MatId.toString();
    output("UTC MatId [" + matId + "]");

    if (!gmoNBCFunc.isVarUsable(matId)) {
        throw new Error("Matid is empty, cannot continue ");
    } else {
        print('UTC matID is: [' + matId + ']' );
    }
    Component.UTCMatHelper = new gmoNBCFunc.materialHelper(matId);
    Component.UTCMaterialXML = Component.UTCMatHelper.getMaterialXml();

    var componentShellRecordId = Component.UTCMatHelper.getShortTextValue("Component Shell Record Id");
    if (!gmoNBCFunc.isVarUsable(componentShellRecordId)) {
        throw new Error("componentShellRecordId is blank or null");
    } else {
        print('componentShellRecordId is: [' + componentShellRecordId + ']' );
    }
    Component.GMOId = componentShellRecordId;
    Component.GmoMatHelper = new gmoNBCFunc.materialHelper(componentShellRecordId);
    Component.GmoMaterialXml = Component.UTCMatHelper.getMaterialXml();

    var state = Component.UTCMaterialXML..TrackTypeLink.StateName.toString();
    if (state != 'Purge')    {
        jobDashboard.updateStatusAndProgress("Checking Materials",25);
        checkMaterials(matId);
        jobDashboard.updateStatusAndProgress("Copying Track into GMO ID",50);
        copyTracktoGMO();
        jobDashboard.updateStatusAndProgress("Registering Track on GMO ID",75);
        registerTrackAgainstGMO();
        gmoNBCFunc.transitionTrackTypes(Component.GMOId, Component.triggers.toComponentReviewRequired, Component.componentGMOTrackTypeName)
        var state = Component.UTCMaterialXML..TrackTypeLink.StateName.toString();
        print('Successfully registered, purging UTC');
        gmoNBCFunc.transitionMaterial(matId, state,Component.triggers.toPurge);
        jobDashboard.updateStatusAndProgress("Registering Track on GMO ID",95);
        callFFMPEGService(Component.GMOId,Component.componentGMOTrackTypeName);
    } else {
        // Purge
        print('in purge handling section');
        gmoNBCFunc.transitionMaterial(matId, state,Component.triggers.toPurge);
    }
    // exit normally
    jobDashboard.updateStatusAndProgress("Finishing Script",100);
    quit(0); 
} catch(e) {
    print('Error Occured, keeping material [' + matId + '] in Component Review Required for retry' )
    gmoNBCFunc.transitionMaterial(matId, Component.states.REGISTERED, Component.states.COMPONENT_REVIEWED);
    output("An error has occured: " + e.message);
    jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});
    quit(1);
}
