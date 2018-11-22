load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_vantage_fun.js");
load("/opt/evertz/mediator/etc/runners/vantage_lookup.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/pipelineHelper.js");
load("/opt/evertz/mediator/etc/runners/SlateHelper.js");
load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");
load("/opt/evertz/mediator/etc/runners/cacheHelper.js");

try {
	var debug = false;
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);

	// Key used for NLD settings in lookup.js regarding working directories.
	var vodWorking = "NLD_WORKING_DIR";
	const CUSTOM_HEADER = "Custom Header";
	var allFrameRates = "all";
	var blackMaterials = NBCGMO.blackMaterials[allFrameRates];
	var barsAndTonesMaterials = NBCGMO.barsAndTonesMaterials[allFrameRates];
	var slateMaterials = NBCGMO.slateMaterials[allFrameRates];
	var ancillaryMaterials = NBCGMO.waterMarkingMaterials[allFrameRates].concat(NBCGMO.vchipMaterials[allFrameRates]);
	
	// By default mute this number of channels on the source MXF. This is because we will reference ONLY exeternal WAV files.
	var numberOfChannelsToMute = 16;

	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);

	// Get required values from Job Description.
	var placingId = jobDescription.Properties.Mapping.domainKey.toString();

	//create placing, pipeline and cache helpers
	var placingHelper = new PlacingHelper(placingId);
	var pipelineHelper = new PipelineHelper(placingHelper, vodWorking);
    	var cacheHelper = new CacheHelper(placingHelper);

	var placingXml = placingHelper.getPlacingXml();
	var pipelineState = placingHelper.getPlacingState();
	var previousPipeLineState = pipelineHelper.getPreviousPipelineState();

	print(
		"Placing Id [" + placingId + "] \n" +
		"Current Pipeline State [" + pipelineState + "] \n"
	);

	// Check if pipeline state is required. Will exit here if not.
	gmoNBCNLDFunc.checkPipelineStateRequired(placingId, pipelineState);

	//check the placing has gone through the correct workflow transitions
	//gmoNBCNLDFunc.checkValidStateRoute(pipelineHelper.getPreviousPipelineState(), pipelineState);

	jobDashboard.updateStatusAndProgress("Gathering Placing Details/Settings",10);

	// Get staging information and generic job information.
	const videoClass = "Video";
	const audioClass = "Audio";
	var stagingMedia = placingHelper.getStagingMedia();
	var pubDefName = placingHelper.getPubDef();
	var currentWorkingFolder = pipelineHelper.getCurrentWorkingFolder();
	var workingPath = pipelineHelper.getWorkingPath();
	var settings = placingHelper.getSettings();
	var sameAsSourceSetting = "Same as Source";
    var mainMaterialMatId = pipelineHelper.getMainMaterialMatId();

    // Get Preprocessing Cache Details
    var prepCacheKey = cacheHelper.getCacheKey("PREP");
    var prepCacheMediaName = cacheHelper.getCacheMediaName(prepCacheKey);
    var previousVideoClassWorkingFolder = pipelineHelper.getPreviousWorkingFolderByClass(videoClass);
    var previousAudioClassWorkingFolder = pipelineHelper.getPreviousWorkingFolderByClass(audioClass, cacheHelper, prepCacheKey, prepCacheMediaName);
	// This will be passed into Vantage as a variable.
	//var sourceParcelFrameRate = placingXml.PlacingParcelList.PlacingParcel.Parcel.FrameRate.toString(); - not used

	var vantageWorkflowName = settings.conformVantageWorkflow
	var vantageJobFactory = vantageLookup.getJobFactoryByWorkflow(vantageWorkflowName);

	print("\n" +
		"Staging Media [" + stagingMedia + "] \n" +
		"Publication Definition Name [" + pubDefName + "] \n" +
		"Vantage Workflow Name [" + vantageWorkflowName + "] \n" +
		"Vantage Job Factory [" + vantageJobFactory + "] \n" +
		"Working Dir [" + currentWorkingFolder + "] \n" +
        "Main Material Id [" + mainMaterialMatId + "] \n"
	);

	var parcelEventObject = placingHelper.getParcelEventObj();
	show(parcelEventObject);
	var parcelFrameRate = parcelEventObject[0].parcelFrameRate;
	var vantageFrameRate = NBCGMO.frameRateLookup[parcelFrameRate];

	print("Working Out Sources for Vantage");
	var vantageSourceMap = gmoNBCNLDFunc.createVantageSourceMap(placingXml, previousVideoClassWorkingFolder, previousAudioClassWorkingFolder, stagingMedia, previousPipeLineState);
	print("\nVantage Source Mapper Object\n");
	gmoNBCFunc.printObj(vantageSourceMap);

	output("\nBuilding CML");
	var cmlBuilder = new gmoNBCNLDFunc.cmlBuilder();

	var processedMatIdList = [];

	for each (var event in parcelEventObject[0].eventObjList){
		if(event.eventType == "Still" && blackMaterials.indexOf(event.matId) > -1){
			output("Adding black");
			if(event.cgText.indexOf(CUSTOM_HEADER)>-1){
				output(event.duration);
				cmlBuilder.addBlackSegmentWithDurationAndFrameRate(event.duration + "@" + vantageFrameRate);
			} else {
				var blackDuration = gmoNBCNLDFunc.convertToVantageTimecodeWithMillis(event.duration, parcelFrameRate);
				output(blackDuration);
				cmlBuilder.addBlackSegment(blackDuration);
			}

		}else if (event.eventType == "Still" && barsAndTonesMaterials.indexOf(event.matId) > -1) {

			output("\nEvent Mat Id [" + event.matId + "] is an Bars & Tones Material");
			output("Adding Bars & Tones ");
			
			var tonesFilePath = vantageSourceMap[event.matId]["Video"][0]["path"];
			var sourceIndex = vantageSourceMap[event.matId]["Video"][0]["sourceindex"]; 
			var barsAndToneDuration = gmoNBCNLDFunc.convertToVantageTimecodeWithMillis(event.duration, parcelFrameRate);
			var durationWithFrameRate = event.duration + "@" + vantageFrameRate;
			var barsObj = new gmoNBCFunc.usefulFileObj(lookup.media[stagingMedia].mount + 
				event.matId + ".dir/" + 
				gmoNBCNLDFunc.getCustomHeaderImageFileName(event.matId,mainMaterialMatId));
		
			var source = cmlBuilder.createSource(sourceIndex, tonesFilePath);
			cmlBuilder.addAudioMixToSource(source, "All", "All", 1);
			cmlBuilder.addSource(source);
			cmlBuilder.addBarsAndToneToSegment(barsObj.win_file, sourceIndex, barsAndToneDuration, durationWithFrameRate)

		}else if (event.eventType == "Still" &&  slateMaterials.indexOf(event.matId) > -1) {

			output("\nEvent Mat Id [" + event.matId + "] is an Slate Material.");
			var slateDuration = gmoNBCNLDFunc.convertToVantageTimecodeWithMillis(event.duration, parcelFrameRate);
			var slateObj = new gmoNBCFunc.usefulFileObj(lookup.media[stagingMedia].mount + 
				event.matId + ".dir/" +
				gmoNBCNLDFunc.getCustomHeaderImageFileName(event.matId,mainMaterialMatId));
			var slHelper = new SlateHelper(placingId);
			var segment = slHelper.populateTemplate(slateDuration,slateObj.win_file,vantageFrameRate, event.duration);
			cmlBuilder.addSegmentToSequence(new XML(segment));
		}
		else if (ancillaryMaterials.indexOf(event.matId) > -1) {

			output("\nEvent Mat Id [" + event.matId + "] is an ancillary Material. Ignoring...");
		} else {
			var segment = cmlBuilder.makeEmptySegment();

			var trimMatId = event.matId;
			output("++++++++++++++++++++ Creating CML for Event Trim Mat Id [" + trimMatId + "] ++++++++++++++++++++");

			var parcelEventFrameRate = event.frameRate;
			var parcelEventTrim = event.incode;
			var parcelEventOutcode = event.outcode;

			print("\n" +
				"Parcel Event FrameRate [" + parcelEventFrameRate + "] \n" +
				"Parcel Event Trim [" + parcelEventTrim + "] \n" +
				"Parcel Event Outcode [" + parcelEventOutcode + "] \n"
			);
			var cmlEventOutcodeAsFrames = FrameLabel.parseText(parcelEventFrameRate, parcelEventOutcode).asFrames() + 1;
			var cmlEventOutcode = FrameLabel.parseFrames(parcelEventFrameRate,cmlEventOutcodeAsFrames)
			// Had to change it to use FrameLabel as tctoframe doent support P23_976
			// var cmlEventOutcode = frametotc(parcelEventFrameRate, (tctoframe(parcelEventFrameRate, parcelEventOutcode) + 1));
			// Check if it was previously added as a source. A single MatId might appear as multiple events if its segmented, or the same top/tail promo.
			var materialXml = materialGet(trimMatId, "tracks");
			var stagingTrack = materialXml..Track.(MediaName == stagingMedia);
			var fileName = stagingTrack.FileId.toString();
			var extension = stagingTrack.FileExtension.toString();
			var materialIncode = stagingTrack.Incode.toString();

			print("\n" +
				"Material Incode [" + materialIncode + "] \n"
			);

			var matchedProfileTrackTypes =  gmoNBCNLDFunc.getMatchedProfileTrackTypes(placingXml, trimMatId);
			//print("\Matched Profile Track Types for event: \n" + matchedProfileTrackTypes + "\n");

			// Black insertion goes here.

			var targetAudioPosition = 1;
			for (i = 0; i < matchedProfileTrackTypes.length(); i++){
				var trackTypeName = matchedProfileTrackTypes[i].toString();
				output("Adding CML for Matched Track Type [" + trackTypeName + "]");

				if (trackTypeName == "MOS"){
					output("Silence is required, incrementing audio target by 2.");
					targetAudioPosition += 2;
					continue;
				}

				var segmentType = vantageSourceMap[trimMatId][trackTypeName][i]["segmentType"];

				if (segmentType == "Video") {
					// Get the path/index from the vantage source map object.
					var sourceVideoFilePath = vantageSourceMap[trimMatId][trackTypeName][i]["path"];
					var sourceIndex = vantageSourceMap[trimMatId][trackTypeName][i]["sourceindex"];

					// Only add the source if the MatId isn't in the processed MatId List.
					if (processedMatIdList.indexOf(trimMatId) == -1){
						var source = cmlBuilder.createSource(sourceIndex, sourceVideoFilePath);

						// Loop through all channels and mute them, all audios will be added via external WAV files.
						for (m = 1; m <= numberOfChannelsToMute; m++){
							cmlBuilder.addAudioMixToSource(source, m, m, 0);
						}

						cmlBuilder.addSource(source);
					}
					segment = cmlBuilder.addVideoToSegment(segment, sourceIndex, parcelEventTrim, cmlEventOutcode);

				} else if (segmentType == "Audio"){

					var audioSegment = null;
					var sourceAudioFilePath = null;
					var sourceIndex = null;

					// Get the path/index from the vantage source map object.
					var sourceAudioFilePath = vantageSourceMap[trimMatId][trackTypeName][i]["path"];
					var sourceIndex = vantageSourceMap[trimMatId][trackTypeName][i]["sourceindex"];

					// Only add the source if the MatId isn't in the processed MatId List.
					if (processedMatIdList.indexOf(trimMatId) == -1){
						var source = cmlBuilder.createSource(sourceIndex, sourceAudioFilePath);

						// Add each audio channel to the source.
						cmlBuilder.addAudioMixToSource(source, 1, targetAudioPosition, 1);
						cmlBuilder.addAudioMixToSource(source, 2, targetAudioPosition + 1, 1);

						// Add source to list.
						cmlBuilder.addSource(source);

						// Increment twice due to the 2 Channel WAV file that was used.
						targetAudioPosition += 2;
					}

					// Add this unique audio to the segment so it has the correct source/timecode.
					audioSegmentIncode = gmoNBCNLDFunc.calculateVantageAudioIncode(parcelEventTrim, materialIncode, parcelEventFrameRate);
					audioSegmentOutcode = gmoNBCNLDFunc.calculateVantageAudioOutcode(cmlEventOutcode, materialIncode, parcelEventFrameRate);

					segment = cmlBuilder.addAudioToSegment(segment, sourceIndex, audioSegmentIncode, audioSegmentOutcode);
				}
			}

			// Now that we have done all our event stuff, lets add the segment to the sequence.
			cmlBuilder.addSegmentToSequence(segment);

			// Add it to a list, so we don't add this material as a source again.
			processedMatIdList.push(trimMatId);
			output("++++++++++++++++++++ End of CML for Event Trim Mat Id [" + trimMatId + "] ++++++++++++++++++++");
		}
	}

	// Work out what Time Code to feed Vantage. If it's Same as Source call getTimeCodes on the Previous PipeLine File otherwise use the File Start from the Preset
	print("\nRequested Output File Incode [" + settings.fileStart + "]");
	var outputFileStart = settings.fileStart === sameAsSourceSetting ? gmoNBCFunc.getTimeCodes(placingHelper.getPreviousPipeLinePathAndFile(previousPipeLineState, previousVideoClassWorkingFolder)).incode : settings.fileStart;
	print("\nStriping Output file to [" + outputFileStart + "]");

	if(parcelFrameRate == 'DF30' && settings.fileStart != sameAsSourceSetting){
		var timecodeSplit = outputFileStart.split(":");
		outputFileStart = timecodeSplit[0] + ":" + timecodeSplit[1] + ":" + timecodeSplit[2] + ";" + timecodeSplit[3];
    }

	cmlBuilder.addTimecodeToTarget(outputFileStart, vantageFrameRate);

	// Build the final CML using the list of sequences and sources.
	var finalCml = cmlBuilder.generateCml();

	// Path to wher ethe CML exists.
	var cmlFilePath = currentWorkingFolder + placingId + ".cml";

	output(cmlFilePath);

	// Lets not hardcode the extension, to lazy to fix properly atm.
	// Dest file coming out of the conform of Vantage.
	var destVideoFilePath = currentWorkingFolder  +  placingId + ".mov";

	var vantageSrcObj = new gmoNBCFunc.usefulFileObj(cmlFilePath);
	var vantageDstObj = new gmoNBCFunc.usefulFileObj(destVideoFilePath);

	output(finalCml);

	// COMMENTED OUT :) quit(-1);

	output("Making the following directory" + currentWorkingFolder);
	makedir(currentWorkingFolder);
	overwrite(finalCml, vantageSrcObj.unix_file);

	jobDashboard.updateStatusAndProgress("Setting Up Conform.",15);

	// Check source file exists
	if (vantageSrcObj.exists() == false){
		throw new Error("Source video file [" + vantageSrcObj.unix_file + "] does not exist, can not continue.");
	}

	var mainMaterialXml = materialGet(pipelineHelper.getMainMaterialMatId(), "tracks", "fulltext", "shorttext", "tag");
	var mediaInfoHelper = new MediaInfoHelper();
	mediaInfoHelper.setSourceFile(new gmoNBCFunc.usefulFileObj(gmoNBCNLDFunc.getStagingVideoFile(stagingMedia, pipelineHelper.getMainMaterialMatId())));
	
	
	// Build our vantage object, since this is a simple transcode we should only need source and dest file paths/files.
	var vantageObj = new gmoNBCVantageFunc.Standard_Vantage_Object();
	vantageObj.setOriginal(vantageSrcObj);
	vantageObj.setJobName(vantageWorkflowName + "-" + placingId);
	vantageObj.setWorkflowName(vantageWorkflowName);

	// Set all required vantage variables.
	vantageObj.setVar("mov_dest_filepath", vantageDstObj.win_path);
	vantageObj.setVar("output_filename", vantageDstObj.basename);
	vantageObj.setVar("source_framerate", vantageFrameRate);
	vantageObj.setVar("source_frame_width", mediaInfoHelper.getVideoWidth());
	vantageObj.setVar("source_frame_height", mediaInfoHelper.getVideoHeight());
	vantageObj.setVar("source_scan_mode", mediaInfoHelper.getVantageScanType());

	print("\n");

	// for progress
	var jobObject = {
		"jobId" : _jobId,
		"startPercent" : 20,
		"endPercent" : 90
	};

	jobDashboard.updateStatusAndProgress("Conforming...",20);
	// Run the vantage job using the object
	var vantageResult = gmoNBCVantageFunc.makeAndRunVantageJob(vantageObj,jobObject,null, vantageJobFactory);
	if (vantageResult == true) {
		print("\nSuccessfully Transcoded ["+vantageSrcObj.unix_file+"]");
	} else {
		throw new Error("Vantage Transcode Failed with Error [" + vantageResult + "].");
	}

	// Update the object so the filesize is correct.
	var transcodedFileObj = new gmoNBCFunc.usefulFileObj(vantageDstObj.unix_file);
	if (!transcodedFileObj.exists()){
		throw new Error("Could not find destination file.");
	}

	quit(0);

} catch(e){
	output("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})

	if (settings.conformSendFailureEmail == "true") {
		gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml,true,"",e.message);
	}

	if (fileExists(currentWorkingFolder)){
		output("Working folder exists, cleaning up files/folder for this state [" + currentWorkingFolder + "].");
		if (!gmoNBCFunc.deleteDirectory(currentWorkingFolder, true)){
			print("Failed to remove files.");
		}
		if (transcodedFileObj){
			output("Need to clean up the transcode files if it fails after it exists.");
			remove(transcodedFileObj.unix_file);
		}
	
	} else {
		output("No working folder exists, nothing to cleanup.");
	}

	quit(-1);
}
