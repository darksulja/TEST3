load("/opt/evertz/mediator/lib/js/shellfun.js");
if(typeof(gmoNBCFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")
if(typeof(gmoNBCNLDFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
if(typeof(gmoNBCCompFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_component_fun.js");

if(typeof(NBCGMO)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_settings.js");
if(typeof(lookup)==="undefined")  load("/opt/evertz/mediator/etc/runners/lookup.js");
if(typeof(MediaInfoHelper)==="undefined")  load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");
if(typeof(FfmpegBridgeTranscodeHelper)==="undefined")  load("/opt/evertz/mediator/etc/bridge/FfmpegBridgeTranscodeHelper.js");
if(typeof(ProfileHelper)==="undefined") load("/opt/evertz/mediator/etc/runners/ProfileHelper.js");
if(typeof(JRAPI)==="undefined"){
    load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js');
}

this.__JRAPI = new JRAPI();
var dry_run = false;

try {
    print('Starting FFMPEG Browse Microservice');
    var debug = false;

    const ORIGINAL_FILENAME = "Original File Name";

    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
    print(jobDescription)
    var matId = jobDescription..matId.toString();
    var jobAction = jobDescription..JobAction.toString();
    print('JobAction is: [' + jobAction + ']' )
    var inputOptions = "-threads 0 -y" // automatic threads, overwrite input file allowed
    var inputFile = '';
    var outputOptions = '';
    var outputFile = '';
    var browseTrack = null;
    var browseFile = null;
    var audioUploadPath = null;
    var browseDir = lookup.storage.browse.unix_root;
    // The TrackTypeLink inside of a trackTypeLink is the one that got updated
    var trackTypeName = jobDescription..trackTypeLink.TrackTypeLink.TrackTypeName.toString();
    print('trackTypeName is: [' + trackTypeName + ']' );

    var ph = new ProfileHelper();
    var trackTypeNameFileTag = ph.getTrackType(trackTypeName)..FileTag.toString();    
    print('trackTypeNameFileTag is: [' + trackTypeNameFileTag  + ']' );

    if (!gmoNBCFunc.isVarUsable(matId)) {
        throw new Error("\nMatid for browse regeneration is blank or null, cannot continue");
    } else {
        print('matID is: [' + matId + ']' );
    }

    if (!gmoNBCFunc.isVarUsable(trackTypeNameFileTag)) {
        throw new Error("Could not find vald TrackType FileTag for value [" + trackTypeName +  "]: cannot continue");
    } else {
        print('Found trackTypeName: [' + trackTypeName + '] and trackTypeNameFileTag of: [' + trackTypeNameFileTag + ']');
    }

    var ffHelper = new FfmpegBridgeTranscodeHelper(matId);
    var matHelper = new gmoNBCFunc.materialHelper(matId);
    var materialXml = matHelper.getMaterialXml();
    var browseMedia = 'DC_Browse_' + materialXml..Material.FrameRate;
    var browseDetails = matHelper.getTrackXmlByMedia(browseMedia);
    print('browseDetails looks like: ' + browseDetails.toString())

    if (gmoNBCFunc.isVarUsable(browseDetails..AbsolutePath.toString())) {
        print('Have proper browse track, details will use that to make path');
    } else {
        throw new Error("Browse track is missing or some details are not complete");
    }
        var browseTrack = browseDetails..AbsolutePath.toString() + browseDetails..FileId[0].toString() + '.' + "mp4";
        print('Full path for browse mp4 is: [' + browseTrack + ']')
        if (!gmoNBCFunc.isVarUsable(browseTrack) ) {
            throw new Error('Cannot continue, browseTrack path construction failed')
        } else {
            browseFile = new gmoNBCFunc.usefulFileObj(browseTrack);
            print('browseFile path is: [' + browseFile.dvs_file + ']');
        }

    if (gmoNBCFunc.isVarUsable(browseFile)) {
        print('Found existing browse track');
    } else {
        throw new Error("No Browse File exists to be used for audio muxing");
    }

    // This does *NOT* need -i option: the FFMPEG service adds that automatically
    inputFile = browseFile.dvs_file;
    var originalBrowseFileName = browseFile.dvs_file;
    var originalBrowseSize = browseFile.filesize;

    var tempFileName = "TEMP_FFMPEG_VERSION_" + browseFile.filename;
    outputFile = browseFile.dvs_path + tempFileName;
    var localBrowseFileName = browseDir + browseFile.filename;
    var localOutPutFileName = browseDir + tempFileName;
    var trackMappingOptionsArray = [];

    // Cleaner list with just tracks
    var matXml = materialGet(matId, "tracks")..Material;
    var browseTrackDefinitions = matXml.Track.(MediaName == browseMedia).TrackDefinition;
    print('found browseTrackDefintions')
    print('browseTrackDefintions length' + browseTrackDefinitions.length());  
    if (jobAction == "Add") {

        var wavMedia = gmoNBCFunc.getOMAudioMedia(matId);
        print('wavMedia is [' + wavMedia +  "]")
    
        if (gmoNBCFunc.isVarUsable(wavMedia)) {
            print('WAV media is: [' + wavMedia + "]");
        } else {
            throw new Error("No WAV media, cannot continue");
        }

        var wavDetails = matHelper.getTrackXmlByMedia(wavMedia);
    
        if (gmoNBCFunc.isVarUsable(wavDetails)) {
            print('wavDetails is: [' + wavMedia + "]");
        } else {
            throw new Error("wavDetails getTrackXmlByMedia did not succeed, cannot make dv_file path without that");
        }

        var audioPathName = wavDetails..AbsolutePath.toString() + matId + NBCGMO_CONSTANTS.DOT_DIR + wavDetails..FileId[0].toString() + NBCGMO_CONSTANTS.HYPHEN + trackTypeNameFileTag + "." + NBCGMO_CONSTANTS.WAV;
            var audioFileObj = new gmoNBCFunc.usefulFileObj(audioPathName);
            // Need DVS path in for FFMPEG Bridge
            audioUploadPath = audioFileObj.dvs_file;
            print('audioPath DVS path is: [' + audioUploadPath + ']');

        // We are not using audioPathName yet but ffmpeg submitFfmpegJob will exploded without audiofile 
        if (gmoNBCFunc.isVarUsable(audioPathName)) {
            print('Relevant audiopath, will add for audio muxing: [' + audioUploadPath + "]");
        } else {
            throw new Error("No Audio file available to be used add for audio muxing, cannot continue with Add action");
        }

        // This is an ffmpeg shortcut that says, copy all existing tracks, and add the new one (1) at the end
        trackMappingOptionsArray = ['0','1'];

    } else if (jobAction == "Delete")  {
        print('Deleted trackTypeName is [' + trackTypeName + ']');
        var keeperTracks = [];
        var deletedTrackDef =  browseTrackDefinitions.(TrackTypeName == trackTypeName)
        print('deletedTrackDef is [' +  deletedTrackDef + ']');
        if (!gmoNBCFunc.isVarUsable(deletedTrackDef )) {
            throw new Error("Could not find trackTypeName - [" + trackTypeName + "] it may not exist in the Browse TrackDefinitions");
        }
        var deletedTrackNumber = parseInt(deletedTrackDef..Position, 10) - 1;  // FFMPEG is 0:0 video, 0:1 first audio track
        print('deletedTrackNumber is [' + deletedTrackNumber + ']' );
        if (!gmoNBCFunc.isVarUsable(deletedTrackNumber)) {
            throw new Error("Could not find track definition number for - [" + trackTypeName + "] it may not exist in the Browse TrackDefinitions");
        }

        var deleteTrackNumString = String(deletedTrackNumber);
        for each (var trackDef in browseTrackDefinitions) {
            if ( trackDef..Position == deleteTrackNumString ) {
                // Intentionally leaving a gap, ie, 0:0, 0:1, 0:3 is how you tell FFMPEG to leave out 0:2
                print('Found Deleted Track Position - [' + deleteTrackNumString + '], NOT adding that one so it will be demuxed')
                continue;
            } else {
                if (trackDef.TrackType.Name != "Video") {
                    // Removing one (audio) track 2 is 0:1, track 3 is 0:2 etc, which is how FFMPEG needs it
                    var newPositionNumber = String( parseInt(trackDef..Position, 10) - 1);
                    print('Adding Position Number [' + newPositionNumber +']'  );
                    keeperTracks.push('0:' + newPositionNumber );
                }
            }
        }
        if (keeperTracks.length < 2) {
            throw new Error("Have fewer than 2 tracks - [" + gmoNBCFunc.printObj(keeperTracks) + "]  cannot continue with Delete action, need at least Video and 1 Audio track to continue");
        }
        // Let's always keep the video
        trackMappingOptionsArray = ['0:0'].concat(keeperTracks);

    } else {
        throw new Error('Must have job action specfied')
    }
    print(trackMappingOptionsArray);
    var outPutOptionsPrefix = " ";
    if (gmoNBCFunc.isVarUsable(audioUploadPath)) {
        // For add only, this DOES need -i option, not added automatically in FFMPEG service
        // For delete, send space
        outPutOptionsPrefix =  " -i " + audioUploadPath
    }
    outputOptions = outPutOptionsPrefix +  ffHelper.makeFfmpegOutputOptions("-map", trackMappingOptionsArray) + '-c:v copy -c:a aac -dn ';
    
    try {
        if (dry_run == true) {
            print('dry run, not calling API')
        } else {
            sleep(20);
            print('Calling FFMPEG API')
            var submitJobResponse = this.__JRAPI.JSON.parse(ffHelper.submitFfmpegJob(inputFile, inputOptions,outputFile, outputOptions ));
            if (submitJobResponse == false ) {
                throw new Error("submitFfmpegJob failed, bailing");
        }
    }
    } catch(e) {
        print('submitJobError is: ' + e);
        throw new Error(e);
    }
    if (dry_run == true) {
        print('dry run, also not polling API');
    } else {
        var pollInterval = 30;
        while (true) {
            try {
                var transcodeJobStatusResponse = this.__JRAPI.JSON.parse(ffHelper.getTranscodeJobStatus(submitJobResponse["jobId"]));
                if (transcodeJobStatusResponse == false) {
                    throw new Error('Unknown error happened, did not receive response')
                }
                if (transcodeJobStatusResponse.state == "Failed") {
                    var errorMessage = transcodeJobStatusResponse.errmsg;
                    throw new Error('error happened: ['+ errorMessage + ']');
                } 
                if (transcodeJobStatusResponse.state == "Complete") {
                    print('finished normally, exiting')
                    break;
                }          
                print('job progress: [' + transcodeJobStatusResponse.progress + ']');
                sleep(pollInterval);
            } catch (e) {
                throw new Error ('error getting response: ' + e);
            }
        } 

        try {
            var newBrowse = new gmoNBCFunc.usefulFileObj(localOutPutFileName);
            print('Original browse filesize is: [' + originalBrowseSize + ']');
            print('New Browse filesize is: [' + newBrowse.filesize + ']');
            // Move File to dest Folder
            print("\nMoving FFMEPG MUXED File onto browse");
            gmoNBCFunc.copyFileOnRemoteHost(lookup.storage.dvs.host,	// Hostname or IP, prefer to specify hostname as it will retry with different IP's if it fails
                                newBrowse.dvs_path,				        // Source Path
                                browseFile.dvs_path,					// Destination path relative to mount on the host were sshing into (DVS in this case)
                                newBrowse.filename,				        // Source Filename
                                browseFile.filename,					// Leave this as null (not as a string of "null"), if you dont want to rename the file.
                                newBrowse.filesize);			        // You can not specify this at all, however it will check for the file transfer speed if you specify it.
            } catch(e) {
                print (e);
            }

        // Delete and regenerate EC Browse to reflect DC Browse
        try {
            var browseTracks = gmoNBCFunc.getMaterialTrackList(matId).filter(function(track) {
                if (track.indexOf("EC_Browse") > -1) {
                    return(track) }
            });

            if (browseTracks.length > 0) {
                var browseTrack = browseTracks[0];
                print("Deleting and tranfer EC browse track: " + browseTrack);
                gmoNBCFunc.materialTrackDelete(matId, browseTrack);
                sleep(2);
                makeTransferRequest(matId, browseTrack, -1);
            } else {
                print("No EC browse tracks found on material [" + matId + "]. Skipping browse update.");
            }
        } catch(e) {
            print("Browse regeneration warning: " + e);
        } finally {
            matHelper.refresh(); // reflect locally
        }

    }

    // Now Update Browse TrackDefs
    try {
        //Loop through and pull highest value for tdPosition and filePosition
        var filePositionArray = [];
        var tdPositionArray = [];
        var fileExt = NBCGMO_CONSTANTS.WAV;
        var frameRate =  materialXml..Material.FrameRate;
        var filePosition = 1;
        var channels = 2;

        if (jobAction == "Add") {
            for each (var trackDef in browseTrackDefinitions) {
                // Used by Add jobAction
                tdPositionArray.push(parseInt(trackDef.Position.toString(), 10));
                filePositionArray.push(parseInt(trackDef.FilePosition.toString(), 10));
            }
            print('Adding [' + trackTypeName + '] to TrackDefinition')
            if (tdPositionArray.length < 1 || filePositionArray.length < 1 ) {
                throw new Error("Need to have some tracks postions to add to the end");
            } else {
                print('Found track positions, continuing');
            }
            addTrack(trackTypeName, tdPositionArray,filePositionArray,audioPathName,dry_run );
            print('Finished Adding [' + trackTypeName + '] to TrackDefinition');
            
        } else if (jobAction == "Delete")  {
            if (browseTrackDefinitions.length() < 1 ) {
                throw new Error("Need to have some browseTrackDefinitions to re-write them - the material may need re-ordering or re-ingesting to correct");
            } else {
                print('Found browseTrackDefinitions, continuing');
            }    
            print('Deleting [' + trackTypeName + '] from TrackDefinition');
            fixTracks(matXml,browseTrackDefinitions,browseMedia,trackTypeName,frameRate,matId,fileExt,dry_run);
            print('Finished deleting [' + trackTypeName + '] from TrackDefinition')
        }

        } catch (e) {
        print(e);
    }

} catch (e) {
    print(e);
    quit(1);
} finally {
    wsLogout();
}

function fixTracks(matXml,browseTrackDefinitions,browseMedia,trackTypeName,frameRate,matId,fileExt,dry_run) {
    dry_run = false;
    print('fixTracks function')
     try {
        print("deletedTrackDef Name is: [" + trackTypeName + ']');
        print('browseTrackDefinitions')
        print(browseTrackDefinitions.length());  
        var materialSaveXml = <Material>
                <MatId>{matId}</MatId>
                <Track>
                    <FrameRate>{frameRate}</FrameRate>
                    <MediaName>{browseMedia}</MediaName>
                    <FileId>{matId}</FileId>
                    <Encoded>1</Encoded>
                    <FileExtension>{fileExt}</FileExtension>
                </Track>
            </Material>;
        // Full Copy so there is no value by reference issue
        var materialSaveXmlFinal = new XML(materialSaveXml.toString());
        for each (var trackDef in browseTrackDefinitions) {
            if (trackDef.TrackTypeName == trackTypeName)
            {
                print('Not adding trackTypeName [' + trackDef.TrackTypeName + ']')
            } else {
                print('Adding trackTypeName [' + trackDef.TrackTypeName + ']');
                materialSaveXml.Track.appendChild(trackDef);
            }
        }
        print('materialSaveXml first draft like: ['  + materialSaveXml + ']');
        print("\n\n");
        // Now renumber starting at 2, skipping video which is 1 in Browse track Def
        var i = 2;
        for each (var trackDef in materialSaveXml.Track.TrackDefinition) {
            if (trackDef.TrackType.Name == "Video") {
                print('video track, just adding without adjustment: [1]');
                materialSaveXmlFinal.Track.appendChild(trackDef);
            } else {
                trackDef.Position = String(i);
                print('Audio track, adjustment to Position Number: [' + String(i) + ']' );
                materialSaveXmlFinal.Track.appendChild(trackDef);
                i++
            }
        }

        print('materialSaveXmlFinal -- final draft  --like: ['  + materialSaveXmlFinal + ']')
        print("\n\n");

        if (!dry_run) {
            print('dry run false, saving updated Track XML');
            var success = materialSave(materialSaveXmlFinal, 'replaceTrackDefinitions');
            print('Success is: [' + success + ']');
        } else {
            print('dry run true, not saving')
        }
    } catch(e) {
        print("Error saving updated Track Defs on Redeliver Delete [" + e.message + "]");
    }
}

function addTrack(trackTypeName, tdPositionArray,filePositionArray, audioPathName,dry_run ) {
    print('addTrack function')
    try {
        matHelper.addTrackTypeLink(trackTypeName, "Ready", NBCGMO_CONSTANTS.STATE_MACHINES.NBC_GMO);
        matHelper.addTrackTypeLinkShortText(trackTypeName, ORIGINAL_FILENAME, audioPathName);
        matHelper.saveUsingSaveXml();
        sleep(2);
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

        //Save TrackDef for the Browse 
        gmoNBCCompFunc.makeAndSaveTrackDef(matId, browseMedia, trackTypeName, tdPosition, channels, filePosition, fileExt, frameRate, audioPathName);

    } catch(e) {
        print("Error addning Track Def [" + e.message + "]");
    }
}