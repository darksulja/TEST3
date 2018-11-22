load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_vantage_fun.js");
load("/opt/evertz/mediator/etc/runners/vantage_lookup.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/pipelineHelper.js");
load("/opt/evertz/mediator/etc/runners/SlateHelper.js");
load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");
load("/opt/evertz/mediator/etc/runners/cacheHelper.js");
load("/opt/evertz/mediator/etc/runners/ProfileHelper.js");
load("/opt/evertz/mediator/etc/runners/TextlessHandler.js");
load("/opt/evertz/mediator/etc/helpers/ErrorHandlerHelper.js");

try {
	var debug = false;
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);

	// Key used for NLD settings in lookup.js regarding working directories.
	var vodWorking = "NLD_WORKING_DIR";
	const CUSTOM_HEADER = "Custom Header";
	const TEXTLESS_OVERRIDE = "Textless Override";
	const videoClass = "Video";
	const audioClass = "Audio";


	var allFrameRates = "all";
	var blackMaterials = NBCGMO.blackMaterials[allFrameRates];
	var barsAndTonesMaterials = NBCGMO.barsAndTonesMaterials[allFrameRates];
	var slateMaterials = NBCGMO.slateMaterials[allFrameRates];
	var dubCardMaterials = NBCGMO.dubCardMaterials[allFrameRates];
	var ancillaryMaterials = NBCGMO.waterMarkingMaterials[allFrameRates].concat(NBCGMO.vchipMaterials[allFrameRates]);
	
	// By default mute this number of channels on the source MXF. This is because we will reference ONLY exeternal WAV files.
	var numberOfChannelsToMute = 16;

	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);

	// Get required values from Job Description.
	var placingId = jobDescription.Properties.Mapping.domainKey.toString(),
		placingHelper = new PlacingHelper(placingId),
		pipelineHelper = new PipelineHelper(placingHelper, vodWorking),
		cacheHelper = new CacheHelper(placingHelper),
		conformKey = jobDescription.Properties.Mapping.transcodeKey.toString(),  
		generatedConformKey = cacheHelper.generateCacheKey(placingId, "CNFM").toString(),
		conformCacheMedia = jobDescription.Properties.Mapping.transcodeCacheMedia.Media.Name.toString(),
		placingXmlHold = placingHelper.getPlacingXml(); 
		  
	// Due to a potentional bug, lets log out the generated vs. Job Desc key if they don't match.
	if (conformKey != generatedConformKey){
		output("WARNING: The Conform Key in the Job Description does not match the one generated at run-time of this script.");
		output("Setting Conform Key to that of the generated one since it is the correct one.");
		output("Generated [" + generatedConformKey + "] Job Description [" + conformKey + "]");
		conformKey = generatedConformKey;
	}
	var previousPipeLineState = pipelineHelper.getPreviousPipelineState();
	// Check if pipeline state is required. Will exit here if not.
	var pipelineState = placingHelper.getPlacingState();
	gmoNBCNLDFunc.checkPipelineStateRequired(placingId, pipelineState);
	// Work out if the transcodeKeyMaterial does exist, and if so what Track Id will we need to update at the end. 
	var conformKeyMaterialXml = materialGet(conformKey, "tracks")..Material; 
	var activeTrackId = conformKeyMaterialXml.Track.(Encoded == "false").(DeleteMark == 0).(MediaName == conformCacheMedia).@id[0].toString();
	
	if (activeTrackId == "" || activeTrackId == null){ 
		throw new Error("Could not find an active track for the Conform Cache Media[" + conformCacheMedia + "] for Transcode Key Material [" + conformKey + "]"); 
	} 
	// Get Preprocessing Cache Details
	var prepCacheKey = cacheHelper.getCacheKey("PREP");
	var prepCacheMediaName = cacheHelper.getCacheMediaName(prepCacheKey);
	var previousVideoClassWorkingFolder = pipelineHelper.getPreviousWorkingFolderByClass(videoClass);
	var previousAudioClassWorkingFolder = pipelineHelper.getPreviousWorkingFolderByClass(audioClass, cacheHelper, prepCacheKey, prepCacheMediaName);
	
	//check the placing has gone through the correct workflow transitions
	//gmoNBCNLDFunc.checkValidStateRoute(pipelineHelper.getPreviousPipelineState(), pipelineState);

	jobDashboard.updateStatusAndProgress("Gathering Placing Details/Settings",10);

	// Get NLD Working information and generic job information.
	var pubDefName = placingHelper.getPubDef();
	var currentWorkingFolder = pipelineHelper.getCurrentWorkingFolder();
	var workingPath = pipelineHelper.getWorkingPath();
	var settings = placingHelper.getSettings();
	var sameAsSourceSetting = "Same as Source";
	//
	// Multiple parcel loop 
	//
	var numberOfParcels = placingHelper.numberOfParcels();
	print("Parcels : " + numberOfParcels);
	var placingParcelList = placingXmlHold.PlacingParcelList;
	var newPlacingXml = placingXmlHold;
	var cntr = 0;
	//
	for each (var parcel in placingParcelList..Parcel ){
		cntr ++;
		var placingXml = placingXmlHold;
		print("parcel :" + cntr);
		delete placingXml.PlacingParcelList;
		placingXml.appendChild( <PlacingParcelList> <PlacingParcel> <Ordinality>1</Ordinality> {parcel} </PlacingParcel>  </PlacingParcelList>  );
		// replace Xml for multiple parcels
		placingHelper.setPlacingXml(placingXml);
		//
		var parcelName = placingXml.PlacingParcelList.PlacingParcel..Parcel.ParcelName.toString();
		print("Parcel Name : "+ parcelName );
		//
		print(
			"Placing Id [" + placingId + "] \n" +
			"Current Pipeline State [" + pipelineState + "] \n" +
			"Conform Key [" + conformKey + "] \n" + 
			"Conform Media [" + conformCacheMedia + "] \n" +
			"parcel [ " +parcel.Ordinality	+"] \n"
		);
		if(cntr ==1){
			var mainMaterialMatId = pipelineHelper.getMainMaterialMatId();
		}  else{
			var mainMaterialMatId =  parcel.ParcelEventList..Event[0].(EventType == "Video").TrimMaterialId.toString();
		}
		print("Main material : "+mainMaterialMatId);
		var outputFrameRate = placingHelper.getOutputFrameRate();
		// This will be passed into Vantage as a variable.
		//var sourceParcelFrameRate = placingXml.PlacingParcelList.PlacingParcel.Parcel.FrameRate.toString(); - not used
		var vantageWorkflowName = settings.conformVantageWorkflow

		var vantageJobFactory = vantageLookup.getJobFactoryByWorkflow(vantageWorkflowName);

		print("\n" +
			"Publication Definition Name [" + pubDefName + "] \n" +
			"Vantage Workflow Name [" + vantageWorkflowName + "] \n" +
			"Vantage Job Factory [" + vantageJobFactory + "] \n" +
			"Working Dir [" + currentWorkingFolder + "] \n" +
			"Main Material Id [" + mainMaterialMatId + "] \n"
		);

		var mainMaterialXml = materialGet(mainMaterialMatId, "tracks", "fulltext", "shorttext", "tag");

		var mainMaterialMediaObj = placingHelper.getUsableMediasForMaterial(mainMaterialMatId);
		var mainMaterialVideoMedia = mainMaterialMediaObj["Video"];

		var parcelEventObject = placingHelper.getParcelEventObj();
		var parcelFrameRate = parcelEventObject[0].parcelFrameRate;
		var vantageFrameRate = NBCGMO.frameRateLookup[parcelFrameRate];

		print("Working Out Sources for Vantage");
		var vantageSourceMap = gmoNBCNLDFunc.createVantageSourceMap(placingXml, previousVideoClassWorkingFolder, previousAudioClassWorkingFolder, previousPipeLineState);
		print("\nVantage Source Mapper Object\n");
		gmoNBCFunc.printObj(vantageSourceMap);

		output("\nBuilding CML");
		var cmlBuilder = new gmoNBCNLDFunc.cmlBuilder();
		//Textless Handler
		var th = "";


		var processedMatIdList = [];
		var matchedProfile = placingHelper.getMatchedProfile();
		print("Audio profile: [" + matchedProfile + "]");

		for each (var event in parcelEventObject[0].eventObjList){
			gmoNBCFunc.printObj(event);

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
				var mediaObjectByEvent = placingHelper.getUsableMediasForMaterial(event.matId);				
				var tonesFilePath = vantageSourceMap[event.matId]["Video"][0]["path"];
				var sourceIndex = vantageSourceMap[event.matId]["Video"][0]["sourceindex"]; 
				var barsAndToneDuration = gmoNBCNLDFunc.convertToVantageTimecodeWithMillis(event.duration, parcelFrameRate);
				var durationWithFrameRate = event.duration + "@" + vantageFrameRate;

				if(settings.ebuBarsPALConversion == true){
					if(outputFrameRate == "NDF25"){
						var ebuBarsMatId = "BARS_TONE_NDF25";
						tonesFilePath= tonesFilePath.split(event.matId).join(ebuBarsMatId);
						print("PAL Conversion detected: Using EBU BARS AND TONE LOCATION. Converting from [" + parcelFrameRate + "] to [" + outputFrameRate + "]");
						event.matId = ebuBarsMatId;
						print("event mat id: " + event.matId);
					}
				}

				var barsObj = new gmoNBCFunc.usefulFileObj(mediaObjectByEvent["Video"]["Mount"] + 
					event.matId + ".dir/" + 
					gmoNBCNLDFunc.getCustomHeaderImageFileName(event.matId,mainMaterialMatId));
			
				var source = cmlBuilder.createSource(sourceIndex, tonesFilePath);
				cmlBuilder.addAudioMixToSource(source, "All", "All", 1);
				cmlBuilder.addSource(source);
				cmlBuilder.addBarsAndToneToSegment(barsObj.win_file, sourceIndex, barsAndToneDuration, durationWithFrameRate)
			}else if (event.eventType == "Still" && dubCardMaterials.indexOf(event.matId) > -1) {
				
				output("\nEvent Mat Id [" + event.cgText + "] is an Dub Cards Material");
				var durationWithFrameRate = event.duration + "@" + vantageFrameRate;
				var dubCardsMediaObject = placingHelper.getUsableMediasForMaterial(event.cgText);
				var graphicsTrack = dubCardsMediaObject["Video"]["Track"];
				var fileName = graphicsTrack.FileId.toString();
				var extension = graphicsTrack.FileExtension.toString();
				var sourceGraphicsFilePath = lookup.media[graphicsTrack.MediaName.toString()].mount + event.cgText + ".dir/" + fileName + "." + extension;
				var dubCardsObj = new gmoNBCFunc.usefulFileObj(sourceGraphicsFilePath);
				cmlBuilder.addGraphicsToSegment(dubCardsObj.win_file, durationWithFrameRate)

			}else if (event.eventType == "Still" &&  slateMaterials.indexOf(event.matId) > -1) {
				var mediaObjectByEvent = placingHelper.getUsableMediasForMaterial(event.matId);
				output("\nEvent Mat Id [" + event.matId + "] is an Slate Material.");
				var slateDuration = gmoNBCNLDFunc.convertToVantageTimecodeWithMillis(event.duration, parcelFrameRate);
				var slateObj = new gmoNBCFunc.usefulFileObj(mediaObjectByEvent["Video"]["Mount"]  + 
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
				var mediaObjectByEvent = placingHelper.getUsableMediasForMaterial(event.matId);
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
				var videoTrackByEvent = mediaObjectByEvent["Video"]["Track"];
				var fileName = videoTrackByEvent.FileId.toString();
				var extension = videoTrackByEvent.FileExtension.toString();
				var materialIncode = videoTrackByEvent.Incode.toString();

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

						if(settings.enableFadeInOut){
							output("Fade IN/OUT Settings Enabled for Preset. Checking for necessary insertion into CML event.");
							var segmentData = gmoNBCNLDFunc.getSegmentDataById(event.matId,event.segmentId);
							var isFadeInSeg  = segmentData.ShortTextList.ShortText.(ShortTextType == "Fade In On Segment").Value.toString() == "true";
							var isFadeOutSeg = segmentData.ShortTextList.ShortText.(ShortTextType == "Fade Out On Segment").Value.toString() == "true";

							if(isFadeInSeg || isFadeOutSeg){
								segment.Canvas += <Canvas background-color="black" duration="00:00:01.000" foreground-color="black" fill="hold" layer="0" />;
								segment.Video.@layer = "1";
							}

							if(isFadeInSeg) segment.Video.Head.Fade += <Fade duration={settings.fadeIn} />;
							if(isFadeOutSeg) segment.Video.Tail.Fade += <Fade duration={settings.fadeOut} />;
						}

					} else if (segmentType == "Audio"){

						var audioSegment = null;
						var sourceAudioFilePath = null;
						var sourceIndex = null;

						if(event.cgText.indexOf(TEXTLESS_OVERRIDE)>-1){
							if(th == ""){
								th = new TextlessHandler();
								output("Texted Material will be Main Material ID [" + mainMaterialMatId +"]");
								output("Textless Material will be [" + trimMatId + "]");
								th.setTextedMatId(mainMaterialMatId);
								th.setTextlessMatId(trimMatId);
								if (settings.partiallyTextedType !== "" && typeof settings.partiallyTextedType !== "undefined" && settings.partiallyTextedType !== "N/A") {
									th.setTextlessFilterName(settings.partiallyTextedType);
								}
							}
							// Get the path/index from the vantage source map object.
							sourceAudioFilePath = vantageSourceMap[mainMaterialMatId][trackTypeName][i]["path"];
							sourceIndex = vantageSourceMap[mainMaterialMatId][trackTypeName][i]["sourceindex"];
							// Only add the source if the MatId isn't in the processed MatId List.
							if (processedMatIdList.indexOf(mainMaterialMatId) == -1){
								if (matchedProfile.indexOf("NLDM") > -1 && trackTypeName.indexOf("Mono") > -1) {
									print("[" + trackTypeName + "]" + " NLDM profile. Incrementing tracks by 1.");
									var source = cmlBuilder.createSource(sourceIndex, sourceAudioFilePath);

									// Add each audio channel to the source.
									cmlBuilder.addAudioMixToSource(source, 1, targetAudioPosition, 1);

									// Add source to list.
									cmlBuilder.addSource(source);

									// Increment by 1 for NLDM.
									targetAudioPosition += 1;
								}
								else {
									print("[" + trackTypeName + "]. Incrementing tracks by 2.");
									var source = cmlBuilder.createSource(sourceIndex, sourceAudioFilePath);

									// Add each audio channel to the source.
									cmlBuilder.addAudioMixToSource(source, 1, targetAudioPosition, 1);
									cmlBuilder.addAudioMixToSource(source, 2, targetAudioPosition + 1, 1);

									// Add source to list.
									cmlBuilder.addSource(source);

									// Increment twice due to the 2 Channel WAV file that was used.
									targetAudioPosition += 2;
								}
							}
							var textedSegment = th.getCorrespondingTextedSegment(event.segmentId);
							// Add this unique audio to the segment so it has the correct source/timecode.
							audioSegmentIncode = gmoNBCNLDFunc.calculateVantageAudioDuration(textedSegment.MarkerIn.RefInCode.toString(),textedSegment.MarkerIn.Absolute.toString(),parcelEventFrameRate);
							audioSegmentOutcode = gmoNBCNLDFunc.calculateVantageAudioDuration(textedSegment.MarkerOut.RefInCode.toString(),textedSegment.MarkerOut.Absolute.toString(),parcelEventFrameRate,1);	
								
							
						}else {

							// Get the path/index from the vantage source map object.
							sourceAudioFilePath = vantageSourceMap[trimMatId][trackTypeName][i]["path"];
							sourceIndex = vantageSourceMap[trimMatId][trackTypeName][i]["sourceindex"];

							// Only add the source if the MatId isn't in the processed MatId List.
							if (processedMatIdList.indexOf(trimMatId) == -1){
								if (matchedProfile.indexOf("NLDM") > -1 && trackTypeName.indexOf("Mono") > -1) {
									print("[" + trackTypeName + "]" + " NLDM profile. Incrementing tracks by 1.");
									var source = cmlBuilder.createSource(sourceIndex, sourceAudioFilePath);

									// Add each audio channel to the source.
									cmlBuilder.addAudioMixToSource(source, 1, targetAudioPosition, 1);

									// Add source to list.
									cmlBuilder.addSource(source);

									// Increment by 1 for NLDM.
									targetAudioPosition += 1;
								}
								else {
									print("[" + trackTypeName + "]. Incrementing tracks by 2.");
									var source = cmlBuilder.createSource(sourceIndex, sourceAudioFilePath);

									// Add each audio channel to the source.
									cmlBuilder.addAudioMixToSource(source, 1, targetAudioPosition, 1);
									cmlBuilder.addAudioMixToSource(source, 2, targetAudioPosition + 1, 1);

									// Add source to list.
									cmlBuilder.addSource(source);

									// Increment twice due to the 2 Channel WAV file that was used.
									targetAudioPosition += 2;
								}
							}
							//Just Being Cautious of not breaking thats working in production . Logic applies to MA only 
							if (settings.partiallyTextedType !== "" && typeof settings.partiallyTextedType !== "undefined" && settings.partiallyTextedType !== "N/A") {
								audioSegmentIncode = gmoNBCNLDFunc.calculateVantageAudioDuration(materialIncode,parcelEventTrim,parcelEventFrameRate);
								audioSegmentOutcode = gmoNBCNLDFunc.calculateVantageAudioDuration(materialIncode,cmlEventOutcode,parcelEventFrameRate);
							}else{
								// Add this unique audio to the segment so it has the correct source/timecode.
								audioSegmentIncode = gmoNBCNLDFunc.calculateVantageAudioIncode(parcelEventTrim, materialIncode, parcelEventFrameRate);
								audioSegmentOutcode = gmoNBCNLDFunc.calculateVantageAudioOutcode(cmlEventOutcode, materialIncode, parcelEventFrameRate);	
							}								
						}
						segment = cmlBuilder.addAudioToSegment(segment, sourceIndex, audioSegmentIncode, audioSegmentOutcode);

						if(settings.enableFadeInOut){
							var segmentData = gmoNBCNLDFunc.getSegmentDataById(event.matId,event.segmentId);
							var isFadeInSeg  = segmentData.ShortTextList.ShortText.(ShortTextType == "Fade In On Segment").Value.toString() == "true";
							var isFadeOutSeg = segmentData.ShortTextList.ShortText.(ShortTextType == "Fade Out On Segment").Value.toString() == "true";
							if(isFadeInSeg) segment.Audio.(@source == sourceIndex).Head.Fade += <Fade duration={settings.fadeIn} />;
							if(isFadeOutSeg) segment.Audio.(@source == sourceIndex).Tail.Fade += <Fade duration={settings.fadeOut} />;
						}
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
		// Path to where the CML exists.
		if (cntr == 1){
			var cmlFilePath = currentWorkingFolder + placingId + ".cml";
		}else{
			var cmlFilePath = currentWorkingFolder + mainMaterialMatId + ".cml";
		}
		output(cmlFilePath);
		// Lets not hardcode the extension, to lazy to fix properly atm.
		// Dest file coming out of the conform of Vantage.
		//check for trailer
		if ( cntr  > 1){
			print("Trailer use GMO : "+mainMaterialMatId);
			var destVideoFilePath = currentWorkingFolder  +  mainMaterialMatId + ".mov";
		}else{
			var destVideoFilePath = currentWorkingFolder  +  placingId + ".mov";
		}
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

		var mediaInfoHelper = new MediaInfoHelper();
		var fileHandle = new gmoNBCFunc.usefulFileObj(gmoNBCNLDFunc.getStagingVideoFile(mainMaterialVideoMedia["MediaName"], mainMaterialMatId));
		mediaInfoHelper.setSourceFile(fileHandle);
		var HDR = mainMaterialXml..Tag.(TagType == "UHD/HDR").Value.toString().indexOf("UHD") > -1 ? true : false;
		
		
		// Build our vantage object, since this is a simple transcode we should only need source and dest file paths/files.
		print('vantageObj creation next.')
		var vantageObj = new gmoNBCVantageFunc.Standard_Vantage_Object();
		vantageObj.setOriginal(vantageSrcObj);
		vantageObj.setJobName(vantageWorkflowName + "-" + placingId);
		vantageObj.setWorkflowName(vantageWorkflowName);

		print('vantageObj variable setting happening next.')
		// Set all required vantage variables.
		vantageObj.setVar("mov_dest_filepath", vantageDstObj.win_path);
		vantageObj.setVar("output_filename", vantageDstObj.basename);
		vantageObj.setVar("source_framerate", vantageFrameRate);
		vantageObj.setVar("source_frame_width", mediaInfoHelper.getVideoWidth());
		vantageObj.setVar("source_frame_height", mediaInfoHelper.getVideoHeight());
		vantageObj.setVar("source_scan_mode", mediaInfoHelper.getVantageScanType());
		// Why do these variable have space in them? Because Vantage.
		vantageObj.setVar("Source File Path", fileHandle.win_path);
		vantageObj.setVar("Source File Name", fileHandle.filename);
		// Vantage requires the actual variable name sent in the payload to be HDR
		vantageObj.setVar("HDR", HDR);
		print("Source File Path is: " + fileHandle.win_path);
		print("Source File Name is: " + fileHandle.filename);
		print("HDR is: " + HDR)
		
		//Adding Watermarking Info - Added for UHD 
	    var mainMaterialHelper = new gmoNBCFunc.materialHelper(mainMaterialMatId);
		vantageObj.setVar("civolution_watermark_applied", placingHelper.isWaterMarkingRequired(placingHelper.getPlacingXml(), mainMaterialHelper.getMaterialXml()..Material).toString());
		vantageObj.setVar("civolution_watermark_licensee_name", settings.transcodeLicensee);

		var materialXml = mainMaterialHelper.getMaterialXml();
	    if (mainMaterialHelper.getMaterialType() == "Episodic") {
	        var episodeXml = mainMaterialHelper.episodeGet(mainMaterialHelper.getEpisodeId(), "shorttext");
	        var seriesXml = mainMaterialHelper.seriesGet(mainMaterialHelper.getSeriesId(), "shorttext");
	        var episodicData = {
	            seasonNumber: seriesXml..ShortTextList.ShortText.(ShortTextType == "GTM Season Number").Value.toString(),
	            seasonTitle: seriesXml..Title.toString(),
	            episodeNumber: materialXml..ShortTextList.ShortText.(ShortTextType == "SMAT: Ep Seq as Broadcast").Value.toString(),
	            episodeTitle: episodeXml..Title.toString(),
	            showTitle: materialXml..Brand.Title.toString(),
	            tvdNum: materialXml..ShortTextList.ShortText.(ShortTextType == "GTM: TVD Production #").Value.toString()
	        }

	        var watermarkTitleString = episodicData.showTitle;

	        if (gmoNBCFunc.isVarUsable(episodicData.seasonNumber) && gmoNBCFunc.isVarUsable(episodicData.episodeNumber)) {
	            var watermarkReference = episodicData.showTitle + " - " + episodicData.tvdNum + " - S"+episodicData.seasonNumber+"E"+episodicData.episodeNumber;
	        } else if (gmoNBCFunc.isVarUsable(episodicData.showTitle) && (episodicData.episodeTitle)) {
	            var watermarkReference = episodicData.showTitle + " - " + episodicData.tvdNum + " - " + episodicData.episodeTitle;
	        } else {
	            var watermarkReference = episodicData.showTitle + " - " + episodicData.tvdNum + " - " + mainMaterialHelper.getTitle();
	        }

	        vantageObj.setVar("civolution_watermark_title", watermarkTitleString);
	        vantageObj.setVar("civolution_watermark_reference", watermarkReference);
	    } else {
	        var watermarkTitleString = materialXml..Brand.Title.toString();
	        var watermarkReference = watermarkTitleString + " - " + materialXml..ShortTextList.ShortText.(ShortTextType == "GTM: TVD Production #").Value.toString();
	        vantageObj.setVar("civolution_watermark_title", watermarkTitleString);
	        vantageObj.setVar("civolution_watermark_reference", watermarkReference);
	    }

		print("\n");

		// for progress
		var jobObject = {
			"jobId" : _jobId,
			"startPercent" : 20,
			"endPercent" : 90
		};

		jobDashboard.updateStatusAndProgress("Conforming...",20);
		// Run the vantage job using the object
		var vantageResult = gmoNBCVantageFunc.makeAndRunTranscodeJob(vantageObj);
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
		
		// Get the conform cache media path. Work out if it uses matId.dir. (at the time of writing this it doesn't)  
		var conformCachePath= cacheHelper.getCacheMediaPath(conformKey, conformCacheMedia);
		if (cntr == 1){
			var transcodedFilePath = conformCachePath + conformKey + "." + transcodedFileObj.extension;  
		}else{
			var transcodedFilePath = conformCachePath + mainMaterialMatId + "." + transcodedFileObj.extension;  
		}
		var confCacheTrackFilePath = "/" + conformKey + ".dir/";
		
		// File was found, now we can move it to our conform cache.  
		output("Moving file [" + transcodedFileObj.unix_file + "] to [" + transcodedFilePath + "]");  
		gmoNBCFunc.moveFile(transcodedFileObj.unix_file, transcodedFilePath);

		
		// Update file object.  
		transcodedFileObj = new gmoNBCFunc.usefulFileObj(transcodedFilePath);  
	
		if (transcodedFileObj.exists()){  
			output("Move was succesfull to Conform Cache Media. Cleaning up ");  
			remove(vantageDstObj.unix_path);  
		} else {  
			throw new Error("Failed to move file to Conform Cache Media.");  
		}      
			
		jobDashboard.updateStatusAndProgress("Updating Transcode Manager",95); 
		
		/*Build the Track Def for Conform Cache*/
		var conformCacheTrackDefinitionList=[];
		
		/*As the Output File of Conform Cache only contains a single track type - "Video" at this moment, 
		thus, we hardcoded the trackTypeName to be "Video".*/

	//  conformCacheTrackDefinitionList.push(cacheHelper.createCacheTrackDef(transcodedFilePath, transcodedFileObj.filename, "Video"));
		if ( cntr  > 1){
			print ("trailer not cached")
		}else{
			conformCacheTrackDefinitionList.push(cacheHelper.createCacheTrackDef(confCacheTrackFilePath, transcodedFileObj.filename, "Video"));
		}
		var fileId = transcodedFileObj.basename;  
		var fileExt = transcodedFileObj.extension;  
		var fileBytes = transcodedFileObj.filesize;  
		//var checkSum = transcodedFileObj.getMd5Sum();  
		//set to empty string
		var checkSum = '';
		
		print("Updating [" + activeTrackId + "] for Conform Cache Material ["  + conformKey + "]"); 
		
		print("\n" +  
				"File Id [" + fileId + "] \n" +  
				"File Ext [" + fileExt + "] \n" +   
				"File Bytes [" + fileBytes + "] \n" +  
				"MD5 Sum [" + checkSum + "] \n"  
				);
		
		/*Save track and track def for Conform Cache*/
		//cacheHelper.saveCacheTrack(conformKey, activeTrackId, conformCacheMedia, fileId, fileExt, fileBytes, checkSum, conformCacheTrackDefinitionList);
		if (parcelName.indexOf("Trailer_") > -1){
			print ("trailer not cached")
		}else{
			cacheHelper.saveCacheTrack(conformKey, activeTrackId, conformCacheMedia, fileId, fileExt, checkSum, fileBytes, conformCacheTrackDefinitionList);	
		}
		// Send a Success Email Configuration 
		//gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml, false, "", "", settings.conformSuccessEmailAddresses);
			
	}
	quit(0);

} catch(e){
	output("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})

	try {
		if (typeof(settings) !== "undefined") {
			gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml, true,	"",	e.message, settings.conformFailureEmailAddresses);
		}
	} catch(e) {
		output("Failed to send email: " + e.message);
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
    var ehh = new ErrorHandlerHelper("Conform",placingId,"Placing");
    if (gmoNBCFunc.isVarUsable(e.code)) {
        errorMsg = ehh.getError(e.code, e.parameters).message;
        output("Error caught in Conform: Error Code ["+e.code+"] Message ["+errorMsg+"]");
    } else {
        errorMsg = e.message;
        output("An error has occurred: " + errorMsg);
    }
    ehh.saveNote(errorMsg);
	quit(-1);
}
