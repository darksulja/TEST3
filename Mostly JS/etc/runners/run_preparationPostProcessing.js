load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_component_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_vantage_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_settings.js"); 
load("/opt/evertz/mediator/etc/runners/vantage_lookup.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/pipelineHelper.js");
load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");
load("/opt/evertz/mediator/etc/runners/cacheHelper.js");
load("/opt/evertz/mediator/etc/helpers/ErrorHandlerHelper.js");

var debug = false;
const ASYNC = "async";
const SYNC = "sync";
const NLD_VIDEO_STREAM = "nld video";

try {

	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);
	
	// Key used for NLD settings in lookup.js regarding working directories.
	var vodWorking = "NLD_WORKING_DIR";
	var sameAsSourceSetting = "Same as Source"; 
	var returnToOrigFrameRateSetting = "Return to Original Frame Rate";
	
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);
		
	// Get required values from Job Description.
	var placingId = jobDescription.Properties.Mapping.domainKey.toString();
	
	//create placing and pipeline helpers 
	var placingHelper = new PlacingHelper(placingId);
	var cacheHelper = new CacheHelper(placingHelper);
	var pipelineHelper = new PipelineHelper(placingHelper, vodWorking);
	
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
	
	// Get NLD Working information and generic job information.
	const videoClass = "Video";
	const audioClass = "Audio";
	var pubDefName = placingHelper.getPubDef();
	var currentWorkingFolder = pipelineHelper.getCurrentWorkingFolder();
	var previousVideoClassWorkingFolder = pipelineHelper.getPreviousWorkingFolderByClass(videoClass);
	var previousAudioClassWorkingFolder = pipelineHelper.getPreviousWorkingFolderByClass(audioClass);
	if (previousAudioClassWorkingFolder !== "SELF CONTAINED") throw new Error("Warning Audios are not self contained. They should be at this point in the pipline! Cannot continue...");
	var settings = placingHelper.getSettings();
	
	print("\n" +
		"Publication Definition Name [" + pubDefName + "] \n" +
		"Working Dir [" + currentWorkingFolder + "] \n" +
		"Previous Dir [" + previousVideoClassWorkingFolder + "] \n"
	);	
	
	var matId = pipelineHelper.getMainMaterialMatId();
	var materialXml = materialGet(matId, "tracks", "fulltext", "shorttext", "tag");
	var mediaObj = placingHelper.getUsableMediasForMaterial(matId);
  	var videoMedia = mediaObj["Video"]
  	var videoTrack = videoMedia["Track"]; 

	var extension = videoTrack.FileExtension.toString(); // how do we knwo this will always match the original?? 

	var workingPath = pipelineHelper.getWorkingPath();
	
	var fileName;
	var previousPipelineState = pipelineHelper.getPreviousPipelineState();
	//previousPipelineState == "Transfer" ? fileName = videoTrack.FileId.toString() : fileName = placingId;
	
	if (previousPipelineState == "Transfer"){ 
		var sourceVideoFilePath = previousVideoClassWorkingFolder+ videoTrack.FileId.toString() + "." + extension; 
		var vantageSrcObj = new gmoNBCFunc.usefulFileObj(sourceVideoFilePath); 
	} else if (previousPipelineState == "Conform") { 
		// Get conform cache material. 
		var conformKey = cacheHelper.getCacheKey("CNFM");
		output("Conform Key [" + conformKey + "]"); 
		var vantageSrcObj = cacheHelper.getCacheFileObj(conformKey);	 
	} else { 
		var sourceVideoFilePath =  previousVideoClassWorkingFolder+ placingId + "." + extension; 
		var vantageSrcObj = new gmoNBCFunc.usefulFileObj(sourceVideoFilePath); 
	} 
	
	output("Source Video File Path" + vantageSrcObj.unix_file);
	
	//var vantageSrcObj = new gmoNBCFunc.usefulFileObj(sourceVideoFilePath);
	var destVideoFilePath = currentWorkingFolder + placingId + "." + vantageSrcObj.extension; 
	var vantageDstObj = new gmoNBCFunc.usefulFileObj(destVideoFilePath);
	
	// Is used to correctly ripple timecode on the caption file.
	var conformSourceIncode = gmoNBCFunc.getTimeCodes(vantageSrcObj.unix_file).incode.toString();
	
	// This will be passed into Vantage as a variable.
	var mediaInfoHelper = new MediaInfoHelper();
	mediaInfoHelper.setSourceFile(vantageSrcObj);
	var materialFrameRate = materialXml..Material.FrameRate.toString();
	var sourceScanType = mediaInfoHelper.getScanType();
	var sourceFrameRate = NBCGMO.frameRateLookup[materialFrameRate]; // Converts to the format Vantage is expection (DF30 = 29.97, NDF25 = 25, P23_976 = 23.98)
	
	var outputScanType = settings.outputScanType.toLowerCase();
	var outputFrameRate = settings.outputFrameRate;
	
	print("\n" +
		"Current Pipeline State [" + pipelineState + "] \n" +
		"Previous Pipeline State [" + previousPipelineState + "] \n" +
		"Working Dir [" + currentWorkingFolder + "] \n" +
		"Source File Path [" + vantageSrcObj.unix_file + "] \n " +
		"Dest File Path [" + destVideoFilePath + "] \n"
	);
	
	makedir(currentWorkingFolder);
	
	// Caption stuff goes here.
	var nonEditablePresets = ["None"];

	var captionMapping = gmoNBCNLDFunc.getProfileCaptionMap(placingXml, matId, settings);
	
	//var captionMethod = settings.captionMethod;
	var editRequired;
	//var embedRequired;
	var sidecarScc;
	var embedScc;
	
	nonEditablePresets.indexOf(settings.sourceTrim) < 0 ? editRequired = true : editRequired = false;
	//captionMethod == "Embedded" ? embedRequired = true : embedRequired = false;
	
	output("Caption Requires Editing: " + editRequired);
	//output("Caption Requires Embeddeding: " + embedRequired);

	// Loop over each specified caption method. Determine if the file needs to be edited/converted/embedded.
	for (captionMethodName in captionMapping){	
		var captionMethod = captionMapping[captionMethodName].captionMethod;
		var captionMethodType = captionMapping[captionMethodName].captionMethodType;

	//try {
	if (captionMethod != "None") {
		var closedCaptionTrackType = captionMapping[captionMethodName].trackTypeName;
		print("\n" +
				"Beginning captioning Edit/Conversion for: \n" +
				"================================================================================= \n" +
				"Closed Caption Track Type [" + closedCaptionTrackType + "] \n" +
				"Caption Method [" + captionMethod + "] \n" +
				"Caption Method Type [" + captionMethodType + "] \n" +
				"================================================================================="
			);
			if (closedCaptionTrackType != "Blank" && closedCaptionTrackType != ""){

							
			// The required extension for editing/embedding, might differ from the final required extension.
			// For example we need to use .scc to edit/embed, but .cap could be the final required format.
			// If we have a .cap to start, it will need to be convered to .scc for edit/embed, and then reconverted back to .cap if its a sidecar.
			// The extension on the staging media will be for the video, need to find the caption track and pull its extension from there.
			var storeCaptionTrack;

			for each (var tt in materialXml..Material.Track){
				if(NBCGMO.validCaptionMedias.indexOf(tt.MediaName.toString()) > -1 ){
					for each (var trackDef in tt.TrackDefinition){
						if(trackDef.TrackTypeName == closedCaptionTrackType){
							storeCaptionTrack = tt;
							break;
						}
					}
				}
			}

			var fileExt = storeCaptionTrack.FileExtension.toString();
			var subMedia = gmoNBCCompFunc.lookupSubMediaByFileType(fileExt);
			var captionMediaFolder = lookup.media[subMedia].mount;

			print("\n" +
				"================================================================================= \n" +
				"Caption Media Track [" + storeCaptionTrack + "] \n" +
				"Caption Media Folder[" + captionMediaFolder + "] \n" +
				"================================================================================="
			);

			// Get the filename from the Caption Media incase it ever were different then the store.
			var fileName = storeCaptionTrack.FileId.toString();
			var fileTag = storeCaptionTrack.TrackDefinition.(TrackTypeName == closedCaptionTrackType).TrackType.FileTag.toString();

			if(typeof storeCaptionTrack === "undefined" || storeCaptionTrack === null || storeCaptionTrack === ""){
				throw new Error("Could not find matching closed caption track.");
			}
					
			//output(captionMediaFolder + ' : ' + matId + ' : ' + fileName + ' : ' + fileTag + ' : ' + fileExt  );
			
			var sourceCaptionFileObj = new gmoNBCFunc.usefulFileObj(captionMediaFolder + matId + ".dir/" + fileName + "-" + fileTag + "." + fileExt);
			var convertedCaptionFileObj;
			var editedCaptionFileObj;	
			var finishedCaptionFile;
			
			// Create MacCaption object.
			var macCaption = new gmoNBCCompFunc.macCaption();
			
			output("-----------------------------------------------------------------");
			
			// Convert caption file to SCC.
			convertedCaptionFileObj = new gmoNBCFunc.usefulFileObj(currentWorkingFolder + sourceCaptionFileObj.basename + "_converted." + "scc");
			if (sourceCaptionFileObj.extension != "scc" && !sourceCaptionFileObj.exists()) {
				output("Caption file is not the required extension converting from [" + sourceCaptionFileObj.extension  + "] to [scc]");
							
				macCaption.setSourceFile(sourceCaptionFileObj);
				macCaption.simpleInOut(convertedCaptionFileObj, materialFrameRate);	
			} else {
				output("Caption file is already the required extension.");
				// Since we didn't need to convert, but the EDL step is going to expect this lets set the variable :)
				//convertedCaptionFileObj = sourceCaptionFileObj
				copy(sourceCaptionFileObj.unix_file, convertedCaptionFileObj.unix_file);
			}
			
			sleep(5);
			// Random hack to force the DVS to flush the file so Linux can check if it exists.
			run("/bin/ls", "-lh", convertedCaptionFileObj.unix_path);
			if (convertedCaptionFileObj.exists() == false){
				throw new Error("Caption file doesn't exist.");
			}
			
			output("-----------------------------------------------------------------");
			
			editedCaptionFileObj = new gmoNBCFunc.usefulFileObj(currentWorkingFolder + sourceCaptionFileObj.basename + "_edited." + convertedCaptionFileObj.extension);			
			if (editRequired == true && !editedCaptionFileObj.exists()){
				output("Editing of caption file is required, creating EDL and cutting caption file.\n");
				edlFileObj = new gmoNBCFunc.usefulFileObj(currentWorkingFolder + editedCaptionFileObj.basename + ".edl");
				// edlFileObj = new gmoNBCFunc.usefulFileObj(currentWorkingFolder + placingId + ".edl");
				
				if (captionMethodType == "Embed"){
					output("Need to re-time .scc from 0 base to correctly embed.");
					conformSourceIncode = "00:00:00:00";
				}
				var result = gmoNBCNLDFunc.createCMX3600EDLfromParcel(placingXml, convertedCaptionFileObj, edlFileObj, conformSourceIncode);
				if (result == true){
					output("EDL Created succesfully, lets do some editing using MacCaption! :)");
				} else {
					throw new Error("Failed to make EDL.");
				}

				sleep(5);
				run("/bin/ls", "-lh", edlFileObj.unix_path);
				// Edit SCC file using created EDL.
				macCaption.setSourceFile(convertedCaptionFileObj);
				macCaption.setEdl(edlFileObj);
				macCaption.editSccFileUsingEdl(editedCaptionFileObj, materialFrameRate);
			} else if (editRequired == true && editedCaptionFileObj.exists()) {
					// Copy if over if it already exists so we dont do the same work twice.
					output("Edited caption file exists, skipping making the edits again.");
					//copy(convertedCaptionFileObj.unix_file, editedCaptionFileObj.unix_file);
			} else {
				output("Caption does not need to be edited, setting timecode to match incode of conform file instead.");
									
				var firstEventIncode = placingXml.PlacingParcelList.PlacingParcel.Parcel.ParcelEventList.Event[0].EventTrim.toString();
				
				var javaFrameRate = Packages.com.pharos.microtime.FrameRate[String(materialFrameRate)];
				var conformSourceIncodeFl = Packages.com.pharos.microtime.FrameLabel.parseText(javaFrameRate, conformSourceIncode);
				var firstEventIncodeFl = Packages.com.pharos.microtime.FrameLabel.parseText(javaFrameRate, firstEventIncode);

				// Need to retime the caption file to match the incode of the conform file.
				macCaption.setSourceFile(convertedCaptionFileObj);
				if (conformSourceIncodeFl.compareTo(firstEventIncodeFl) == -1) {
					output("Need to decrease timecode of caption file.");
					var decreaseTimecode = new String(firstEventIncodeFl.subtract(conformSourceIncodeFl));
					//var decreaseTimecode = firstEventIncodeFl["subtract(com.pharos.microtime.FrameLabel)"](conformSourceIncodeFl).toString();
					macCaption.rippleTimecodeDecrease(editedCaptionFileObj, decreaseTimecode, materialFrameRate);
				} else if (conformSourceIncodeFl.compareTo(firstEventIncodeFl) == 1) {
					output("Need to increase timecode of caption file.");
					var increaseTimecode = new String(firstEventIncodeFl.add(conformSourceIncodeFl).toString());
					macCaption.rippleTimecodeIncrease(editedCaptionFileObj, increaseTimecode, materialFrameRate);
				} else {
					editedCaptionFileObj = convertedCaptionFileObj;
					output("Values match, no need to ripple timecode.");
				}					
			}
			
			sleep(5);
			// Random hack to force the DVS to flush the file so Linux can check if it exists.
			run("/bin/ls", "-lh", editedCaptionFileObj.unix_path);
			if (editedCaptionFileObj.exists() == false){
				throw new Error("Caption file doesn't exist.");
			}

			if (captionMethodType == "Embed" && captionMethod != "None"){	
				captionMapping[captionMethodName].captionFile = editedCaptionFileObj;
				embedScc = true;
			} else if (captionMethodType == "Sidecar" && captionMethod != "None"){
				captionMapping[captionMethodName].captionFile = editedCaptionFileObj;
				sidecarScc = true;
			} else {
				output("It shouldn't get here as only Embed/Sidecar are supported captionMethodTypes.");
				throw new Error("Unsupported Caption Method Type [" + captionMethodType + "]");
			}
			
			output("-----------------------------------------------------------------");
			} else {
				output("CC Track Type [" + closedCaptionTrackType + "] was in the ideal Profile, but not the matched Profile. Skipping..");
			}
		}
	}
			
	if (embedScc == true){		
				output("Embedding of caption file is required, embedding to video.\n");
				// Embed edited SCC file to video file.
				// macCaption.setSourceFile(editedCaptionFileObj);
				// macCaption.embedScc(vantageSrcObj, materialFrameRate);
				
				output("Because were embedding we need to create a local copy to use.");
				var temporaryWorkingFile = new gmoNBCFunc.usefulFileObj(currentWorkingFolder + "/" + placingId  + "_embed.mov");
				makedir(temporaryWorkingFile.unix_path);
				
				gmoNBCFunc.copyFileOnRemoteHost(lookup.storage.dvs.host,	// Hostname or IP, prefer to specify hostname as it will retry with different IP's if it fails
				vantageSrcObj.dvs_path,					// Source Path
				temporaryWorkingFile.dvs_path,			// Destination path relative to mount on the host were sshing into (DVS in this case)
				vantageSrcObj.filename,					// Source Filename
				temporaryWorkingFile.filename,			// Leave this as null (not as a string of "null"), if you dont want to rename the file.
				vantageSrcObj.filesize);				// You can not specify this at all, however it will check for the file transfer speed if you specify it.
				// Update the source video file pointer.
				vantageSrcObj = new gmoNBCFunc.usefulFileObj(temporaryWorkingFile.unix_file);
				sleep(2);
				// Random hack to force the DVS to flush the file so Linux can check if it exists.
				run("/bin/ls", "-lh", vantageSrcObj.unix_path);
				
			/*} else {
				output("Embedding not required, caption will be a sidecar.");
				sidecarScc = true;
			}
			
			output("-----------------------------------------------------------------");
			
		} else {
			output("No CC track type was matched, skipping Closed Caption embed.")
		}
	}
	/*} catch(e) {
		output("Caption stuff failed, skipping for now...");
		output("Caption Error: " + e.message);
	}*/
		var macCaptionMap = {};
		for (captionMethodName in captionMapping){		
			var captionMethod = captionMapping[captionMethodName].captionMethod;
			var captionMethodType = captionMapping[captionMethodName].captionMethodType;
			var embedCaptionFile = captionMapping[captionMethodName].captionFile;
			
			if (captionMethod != "None" && captionMethodType == "Embed" && embedCaptionFile != "" && embedCaptionFile != null){
				print("\n" +
					"========================================= \n" +
					"Embed Caption File [" + embedCaptionFile.unix_file + "] \n" +
					"Caption Method [" + captionMethod + "] \n" +
					"Caption Method Type [" + captionMethodType + "] \n" +
					"========================================="
				);
				
				// Building of embed command goes here.
				macCaptionMap[captionMethod] = embedCaptionFile;			
			}			
		}


		// Using the parcel get the vchip information.
		var vchipRating = null;
		var vchipTitle = null;
		var vChipParcelEventObject = placingHelper.getParcelEventObjByStream("nld vchip");
		var ratingFlags = [];
		var rating = [];
		for each (var parcelEvent in vChipParcelEventObject[0].eventObjList){
			if (parcelEvent.stream == "nld vchip"){
				output("There is a VCHIP stream, setting vchip parameters.")
				var parcelEventText = parcelEvent.raw.CgText.toString().split(" ");
				var parcelEventFullText =  parcelEvent.raw.CgText.toString();
						
				for each (var item in parcelEventText){
					if (item.indexOf("Rating=") >= 0) {
						// Should be format TV-14
						rating = item.replace("Rating=", "").replace("-", ",");
					} else if (item.indexOf("RatingFlags=") >= 0) {
						// Should be format DLSV
						ratingFlags = item.replace("RatingFlags=", "").split("");
					} else if (item.indexOf("RatingTitle=") >= 0) {
						vchipTitle = parcelEventFullText.slice(parcelEventFullText.indexOf("RatingTitle="),parcelEventFullText.length);
						vchipTitle = vchipTitle.replace("RatingTitle=", "");
						vchipTitle = gmoNBCNLDFunc.normalizeText(vchipTitle);
						vchipTitle = vchipTitle.length>32 ? vchipTitle.slice(0,32) : vchipTitle;
						vchipTitle = vchipTitle.replace(/ /g,"\ ");
						vchipTitle = '"'+vchipTitle+'"';
						output("VchipTitle is ["+vchipTitle+"]");
					}
				}
				// Needs to look like "USTV,14,V,S,L,D"
				vchipRating = "US" + rating + (ratingFlags == "" ? ",none" : "," + ratingFlags.join(","));
			}
		}

		// Run the MacCaption command here.
		var macCaption = new gmoNBCCompFunc.macCaption();
		macCaption.embedMultipleScc(vantageSrcObj, materialFrameRate, macCaptionMap, vchipRating, vchipTitle);
	}

	jobDashboard.updateStatusAndProgress("Setting Up Transcode.",15);
		
	
	print("\n" +
		"Source Scan Type [" + sourceScanType + "] \n" +
		"Source Frame Rate [" + materialFrameRate + "] \n" +
		"Output Scan Type [" + outputScanType + "] \n"	+
		"Output Frame Rate [" + outputFrameRate + "] \n"
	);

	/* If Output Frame Rate = Return to Original Frame Rate 
	   For Telecine Assets with 3-2 or 2-3 Cadence Pattern the output Frame rate will be P23_976
	   For Non Telecine - This will be Same as Source
	*/

	outputFrameRate = outputFrameRate === returnToOrigFrameRateSetting ? gmoNBCNLDFunc.checkTelecineAndSelectFrameRate(materialXml): outputFrameRate;
	
	/* 
	   If outputScanType is defined as Same as Source then we will use the sourceScanType
	*/

	outputScanType = outputScanType == sameAsSourceSetting.toLowerCase() ? sourceScanType : outputScanType;

	print("Output Scan Type [" + outputScanType + "]");
	
	// Default to true, since theres only one case where vantage isn't required.
	var vantageRequired = true;
		
	// Crazy logic goes here to determine the vantage Workflow Based on Source/Dest Frame Rates.

	if (materialFrameRate == outputFrameRate && sourceScanType == outputScanType) {
		output("File already matches required Frame Rate and Scan Type, no transcoding required.");
		vantageRequired = false;
	} else if (outputFrameRate == "P23_976"){
		// 23.98fps conversion workflow.
		var vantageWorkflowName = "GMO_HD_SD_PRORESHQ_CONVERT_TO_2398_16CH";		
	} else if (outputFrameRate == "DF30"){
		// 29.97fps conversion workflow.
		if (outputScanType == "interlaced"){
			var vantageWorkflowName = "GMO_HD_SD_PRORESHQ_CONVERT_TO_2997I_16CH";	
		} else if (outputScanType == "progressive"){
			var vantageWorkflowName = "GMO_HD_SD_PRORESHQ_CONVERT_TO_2997P_16CH";				
		}		
	} else if (outputFrameRate == "NDF25"){
		// 25fps conversion workflow.
		if (outputScanType == "interlaced"){
			var vantageWorkflowName = "GMO_HD_SD_PRORESHQ_CONVERT_TO_50I_16CH";	
		} else if (outputScanType == "progressive"){
			var vantageWorkflowName = "GMO_HD_SD_PRORESHQ_CONVERT_TO_25P_16CH";				
		}
	} else if (outputFrameRate == "Same as Source"){
		// If the output frame rate is same as source, but the scan type doesn't match the output requirement, we still need to run it through the frame rate conversion workflow.
		if (materialFrameRate == "DF30" && (outputScanType != sourceScanType)){
			output("Forcing frame rate conversion due to mismatch scan type.");
			if (outputScanType == "interlaced"){
				var vantageWorkflowName = "GMO_HD_SD_PRORESHQ_CONVERT_TO_2997I_16CH";	
			} else if (outputScanType == "progressive"){
				var vantageWorkflowName = "GMO_HD_SD_PRORESHQ_CONVERT_TO_2997P_16CH";				
			}		
		} else if (materialFrameRate == "NDF25" && (outputScanType != sourceScanType)){
			output("Forcing frame rate conversion due to mismatch scan type.");
			if (outputScanType == "interlaced"){
				var vantageWorkflowName = "GMO_HD_SD_PRORESHQ_CONVERT_TO_50I_16CH";	
			} else if (outputScanType == "progressive"){
				var vantageWorkflowName = "GMO_HD_SD_PRORESHQ_CONVERT_TO_25P_16CH";				
			}
		} else {
			output("Using same FrameRate as source, vantage not required.");
			vantageRequired = false;
			
		}
	} else {
		throw new Error("Unsupported/unknown frame rate selected [" + outputFrameRate + "]");
	}

	if (vantageRequired == true) {
		var vantageJobFactory = vantageLookup.getJobFactoryByWorkflow(vantageWorkflowName);
		
		// Check source file exists
		if (!fileExists(vantageSrcObj.unix_file)){
			throw new Error("Source video file [" + vantageSrcObj.unix_file + "] does not exist, can not continue.");
		}
		
		makedir(vantageDstObj.unix_path);

			
		// Build our vantage object, since this is a simple transcode we should only need source and dest file paths/files.
		var vantageObj = new gmoNBCVantageFunc.Standard_Vantage_Object();
		vantageObj.setOriginal(vantageSrcObj);
		vantageObj.setJobName(vantageWorkflowName + "-" + placingId);
		vantageObj.setWorkflowName(vantageWorkflowName);
		
		// Set all required vantage variables.
		vantageObj.setVar("mov_dest_filepath", vantageDstObj.win_path);
		vantageObj.setVar("output_filename", vantageDstObj.basename);
		vantageObj.setVar("source_framerate", sourceFrameRate);
		vantageObj.setVar("speed_change_allowance", true);
		vantageObj.setVar("source_frame_width", mediaInfoHelper.getVideoWidth());
		vantageObj.setVar("source_frame_height", mediaInfoHelper.getVideoHeight());
		vantageObj.setVar("source_telecine", gmoNBCNLDFunc.setTelecine(sourceFrameRate, materialXml));
		
		// we need to anchor is its NDF25. 
		//this will make sure that the start of content remains or is put at the correct timecode. 
		//ie a file start may be 59:30:00:00 but we always want the output content to start at 10:00:00:00
		// the content start is specified in the post processing preset
		if(outputFrameRate == "NDF25") {
			var anchorFrameRates = {NDF25 : "@25", P23_976 : "@23.976", DF30 : "@30"};
			
			// get some details from the conform/post processing presets
			// If the desired output Incode is Same a Source look at incode of previously made file otherwise use Preset Value
			var inputFileIncode = settings.fileStart === sameAsSourceSetting ? gmoNBCFunc.getTimeCodes(vantageSrcObj.unix_file).incode : settings.fileStart;
			var fileStart = FrameLabel.parseText(materialFrameRate, inputFileIncode);
			//var outputFileIncode = settings.startOfContent === sameAsSourceSetting ? gmoNBCFunc.getTimeCodes(placingHelper.getPreviousPipeLinePathAndFile(previousPipeLineState,previousVideoClassWorkingFolder)).incode : settings.startOfContent;
			
			var header = settings.includeHeader;
			var parcelEventObject = placingHelper.getParcelEventObjByStream(NLD_VIDEO_STREAM);
			
			// if the topblackduration is greater than 0 then we must have a black event 			
			if(AmountOfTime.parseText(materialFrameRate, settings.topBlackDuration).asFrames() > 0){
				topBlack = true;
			} else {
				topBlack = false;
			}
			
			// Determine which event in the parcel to look at based on whether a header or a black occupy the first events 		
			if (header && topBlack) {
				var eventNumber = 2
			} else if(header || topBlack){
				var eventNumber = 1
			} else {
				var eventNumber = 0
			}
			
			var offset = "";
			if(settings.includeCustomHeader){
				print("Custom Header Req")
				var frameLabel = ""; 
				for each (event in parcelEventObject[0].eventObjList){
					if(frameLabel == ""){
						frameLabel = Packages.com.pharos.microtime.FrameLabel.parseText(FrameRate[event.frameRate], "00:00:00:00")
					}
					if(event["matId"] == matId){
						//We are calculating duration of all header events up to Main material 
						break;
					} 
					print(event["matId"])

					if(event.frameRate == "DF30"){
						var eventDuration = event["duration"];
						var eventDurationInSeconds = parseInt(eventDuration.split(":")[0]) *60*60  + parseInt(eventDuration.split(":")[1]) * 60 +  parseInt(eventDuration.split(":")[2]);
						var frameLabelForEventDuration = Packages.com.pharos.microtime.FrameLabel.parseText(FrameRate[event.frameRate],gmoNBCFunc.calculateDF30TimeCode(eventDurationInSeconds))
					}else {
						var frameLabelForEventDuration = Packages.com.pharos.microtime.FrameLabel.parseText(FrameRate[event.frameRate],event["duration"]);
					}
					print("frameLabelForEventDuration -"+frameLabelForEventDuration);
					frameLabel = gmoNBCFunc.addFrameLabels(frameLabel,frameLabelForEventDuration);
					print(frameLabel)
				}
				fileStart = Packages.com.pharos.microtime.FrameLabel.parseText(FrameRate[fileStart.rate],fileStart.toString())
				var sourceAnchor = gmoNBCFunc.addFrameLabels(fileStart,frameLabel) + anchorFrameRates[materialFrameRate];
			}else {
				print("Regular Processing")
				offset = AmountOfTime.parseText(materialFrameRate,parcelEventObject[0].eventObjList[eventNumber].offset);
				var sourceAnchor = FrameLabel.parseFrames(materialFrameRate, fileStart.add(offset).asFrames()) + anchorFrameRates[materialFrameRate];
			}
	
			// map and add the frame rates. 
			//var sourceAnchor = fileStart.add(offset).toString() + anchorFrameRates[materialFrameRate];
			var outputAnchor = settings.startOfContent + anchorFrameRates[outputFrameRate];  
			
			
			 /*<Key>source_anchor_timecode</Key>
             <Value>00:57:31:00@30</Value>
			  <Key>output_anchor_timecode</Key>
           <Value>00:57:30;00@25</Value>*/

			//set vantage variable
			vantageObj.setVar("source_anchor_timecode",sourceAnchor);
			vantageObj.setVar("output_anchor_timecode",outputAnchor);
		}
		
		// for progress 
		var jobObject = {
			"jobId" : _jobId,
			"startPercent" : 20,
			"endPercent" : 90
		}; 

		jobDashboard.updateStatusAndProgress("Transcoding...",20);
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
		//if embedding is required and Material Type has a Closed Caption for the profile
		if (embedScc == true && closedCaptionTrackType != "" && closedCaptionTrackType != null && closedCaptionTrackType != []){
			// Since embedding requires us to copy the file now, lets remove it once transcoded file is confirmed there.
			output("Since embedding requires us to copy the file now, remove it once transcoded file is confirmed");
			remove(vantageSrcObj.unix_file);
		}
	} else {
		if (embedScc == true){
			output("Since Vantage was not required, lets copy the temp file used for embedding to the location where Transcode is expecting.");
			// Since embedding requires us to copy the file now, lets rename it since vantage wont be used.
			move(vantageSrcObj.unix_file, currentWorkingFolder + "/" + placingId  + ".mov");
		} else {
			output("Since Vantage was not required setting data element for this state to false, so it will source the video from Conform.");
			output("This will be false, even if captioning was done, because captions are always sourced from the \"Component\" folder.");
			gmoNBCNLDFunc.updatePipelineStateDataElement(placingId, pipelineState, false);		
		}
	}
	if (sidecarScc == true){
		output("Sidecar SCC required.");
		for (captionMethodName in captionMapping){			
			var captionMethod = captionMapping[captionMethodName].captionMethod;
			var captionMethodType = captionMapping[captionMethodName].captionMethodType;
			var sidecarCaptionFile = captionMapping[captionMethodName].captionFile;
			var trackTypeFileTag = captionMapping[captionMethodName].trackTypeFileTag;
			var requiredExt = captionMethod.toLowerCase();

			if (captionMethod != "None" && captionMethodType == "Sidecar" && sidecarCaptionFile != "" && sidecarCaptionFile != null){
				print("\n" +
					"========================================= \n" +
					"Sidecar Caption File [" + sidecarCaptionFile.unix_file + "] \n" +
					"Caption Method [" + captionMethod + "] \n" +
					"Caption Method Type [" + captionMethodType + "] \n" +
					"========================================="
				);
								
				var componentFolder =  workingPath + "/Component/";
				if (fileExists(componentFolder)){
					output("Component folder exists, no need to make one.");
				} else {
					output("Making component folder, since one did not exist.");
					gmoNBCFunc.makeDirectory(componentFolder);
				}
								
				output("Need to sleep before trying to touch edited caption file, it seems to take a few seconds after mac caption is finished with it.");
				// Random hack to force the DVS to flush the file so Linux can check if it exists.
				run("/bin/ls", "-lh", sidecarCaptionFile.unix_path);
				
				// Convert caption file to Required Extension.
				convertedSidecarCaptionFileObj = new gmoNBCFunc.usefulFileObj(currentWorkingFolder + sidecarCaptionFile.basename.replace("_edited", "") + "_final_converted." + requiredExt);				
				if (sidecarCaptionFile.extension != requiredExt){
					output("Caption file is not the required extension for delivery converting from [" + sidecarCaptionFile.extension  + "] to [" + requiredExt + "]");
								
					macCaption.setSourceFile(sidecarCaptionFile);
					macCaption.simpleInOut(convertedSidecarCaptionFileObj, materialFrameRate);	
				} else {
					output("Caption file is already the required extension of [" + requiredExt + "].");			
					copy(sidecarCaptionFile.unix_file, convertedSidecarCaptionFileObj.unix_file);
				}
				
				// Random hack to force the DVS to flush the file so Linux can check if it exists.
				run("/bin/ls", "-lh", convertedSidecarCaptionFileObj.unix_path);
				
				var finishedCaptionFile = new gmoNBCFunc.usefulFileObj(componentFolder + placingId + "-" + trackTypeFileTag + "." + convertedSidecarCaptionFileObj.extension);				
				for (i = 1; i <= 3; i++) {		
					if (convertedSidecarCaptionFileObj.exists() == true){	
						if (vantageRequired == true && outputFrameRate != "Same as Source"){		
							output("Vantage was required, so lets re-time the SCC.");
							macCaption.setSourceFile(convertedSidecarCaptionFileObj);
							macCaption.convertFrameRate(materialFrameRate, outputFrameRate, finishedCaptionFile, settings.startOfContent);
						} else {
							output("Vantage was not required, so just copying SCC to component folder.");
							output("Copying [" + convertedSidecarCaptionFileObj.unix_file + "] to [" + finishedCaptionFile.unix_file + "]")
							copy(convertedSidecarCaptionFileObj.unix_file, finishedCaptionFile.unix_file);
						}
						break;
					} else {
						output("Edited caption file does not exist yet.");
						output("Attempt [" + i + "] of [3]");
						if (i == 3){
							throw new Error("Edited caption file failed to exist after 3 attempts.");
						}
					}
				}
			}			
		}
	}
		
	jobDashboard.updateStatusAndProgress("Finishing Script",100);
		
	quit(0);
	
} catch(e){
	output("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})

	if (typeof(settings) !== "undefined") {
		gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml, true,	"",	e.message, settings.postprocessingFailureEmailAddresses);
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
	var ehh = new ErrorHandlerHelper("Post Processing",placingId,"Placing");
	if (gmoNBCFunc.isVarUsable(e.code)) {
		errorMsg = ehh.getError(e.code, e.parameters).message;
		output("Error caught in Post Processing: Error Code ["+e.code+"] Message ["+errorMsg+"]");
	} else {
		errorMsg = e.message;
		output("An error has occurred: " + errorMsg);
	}
	ehh.saveNote(errorMsg);	
	quit(-1);
}
