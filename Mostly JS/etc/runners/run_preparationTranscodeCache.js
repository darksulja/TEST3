load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_vantage_fun.js");
load("/opt/evertz/mediator/etc/runners/vantage_lookup.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/pipelineHelper.js");
load("/opt/evertz/mediator/etc/runners/cacheHelper.js");
load("/opt/evertz/mediator/etc/runners/ProfileHelper.js");
load("/opt/evertz/mediator/etc/helpers/ErrorHandlerHelper.js");

var debug = false;

try {

	var checkSDAnamorphic = function(media, ratio, xform) {
		return media == "SD" && ratio == "1.78" && (xform == "Anamorphic" || xform == "AM")
			? true
			: false
	}

	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);
	
	// Key used for NLD settings in lookup.js regarding working directories.
	var vodWorking = "NLD_WORKING_DIR"
	var returnToOrigFrameRateSetting = "Return to Original Frame Rate";
	
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);
		
	// Get required values from Job Description.
	var placingId = jobDescription.Properties.Mapping.domainKey.toString(),
		transcodeKey = jobDescription.Properties.Mapping.transcodeKey.toString(),
		transcodeCacheMedia = jobDescription.Properties.Mapping.transcodeCacheMedia.Media.Name.toString();
		
	// Create Placing and Pipeline Helpers
	var placingHelper = new PlacingHelper(placingId);
	var pipelineHelper = new PipelineHelper(placingHelper, vodWorking);
	var cacheHelper = new CacheHelper(placingHelper);
	var CacheMediaName = cacheHelper.getCacheMediaName("CNFM");
    var generatedTranscodeKey = cacheHelper.generateCacheKey(placingId, "TRNS").toString();
	// Due to a potentional bug, lets log out the generated vs. Job Desc key if they don't match.
	if (transcodeKey != generatedTranscodeKey){
		output("WARNING: The Transcode Key in the Job Description does not match the one generated at run-time of this script.");
		output("Setting Transcode Key to that of the generated one since it is the correct one.");
		output("Generated [" + generatedTranscodeKey + "] Job Description [" + transcodeKey + "]");
		transcodeKey = generatedTranscodeKey;
	}
	
	// Get the placing details, include everything so we don't need to add things later.
	var placingXmlHold = placingHelper.getPlacingXml();
	//print("PlacingXml : " + placingXmlHold);
	
	var pipelineState = placingHelper.getPlacingState();
  	var previousPipelineState = pipelineHelper.getPreviousPipelineState();
  	ph = new ProfileHelper();
    ph.initialize();
    ph.setProfile(placingHelper.getMatchedProfile());
	// Using the presets/placing metadata, lets get a list of settings that we need to use later.
	var settings = gmoNBCNLDFunc.getSettings(placingXmlHold);
	output("\n");
	// Get Profile information and generic job information.
	var pubDefName = placingHelper.getPubDef();
	var currentWorkingFolder = pipelineHelper.getCurrentWorkingFolder();
	gmoNBCNLDFunc.checkPipelineStateRequired(placingId, pipelineState);
	var workingPath = pipelineHelper.getWorkingPath();    
	var previousPipelineState = pipelineHelper.getPreviousPipelineState();
	var conformKey = cacheHelper.getCacheKey("CNFM");
	var CacheMedia = cacheHelper.getCacheMediaName(conformKey);
	var conformCachePath= cacheHelper.getCacheMediaPath(conformKey, CacheMedia);

	output("Conform Key [" + conformKey + "]");
	print(
		"Placing Id [" + placingId + "] \n" +
		"Current Pipeline State [" + pipelineState + "] \n" +
		"Transcode Key [" + transcodeKey + "] \n" + 
		"Transcode Media [" + transcodeCacheMedia + "] \n"	+
		"Matched Profile [" + ph.getProfileAsString() + "] \n"
	);
	// Work out if the transcodeKeyMaterial does exist, and if so what Track Id will we need to update at the end.
	var transcodeKeyMaterialXml = materialGet(transcodeKey, "tracks")..Material;
	var activeTrackId = transcodeKeyMaterialXml.Track.(Encoded == "false").(DeleteMark == 0).(MediaName == transcodeCacheMedia).@id[0].toString();
	
	if (activeTrackId == "" || activeTrackId == null){
		throw new Error("Could not find an active track for the Transcode Cache Media[" + transcodeCacheMedia + "] for Transcode Key Material [" + transcodeKey + "]");
	}
	
	jobDashboard.updateStatusAndProgress("Gathering Placing Details/Settings",10);

	var previousWorkingFolder = previousPipelineState == "Transfer" ? pipelineHelper.getPreviousWorkingFolder() + matId + ".dir/" : pipelineHelper.getPreviousWorkingFolder();
		
	if (settings.transcodeVantageWorkflow == "" || settings.transcodeVantageWorkflow == null){
		throw new Error("No vantage workflow name provided, can not continue.");
	}
	
	var vantageJobFactory = vantageLookup.getJobFactoryByWorkflow(settings.transcodeVantageWorkflow);
	
	print("\n" +
		"Publication Definition Name [" + pubDefName + "] \n" +
		"Working Dir [" + currentWorkingFolder + "] \n" +
		"Previous Dir [" + previousWorkingFolder + "] \n" +
		"Vantage Workflow Name [" + settings.transcodeVantageWorkflow + "] \n" + 
		"Vantage Job Factory [" + vantageJobFactory + "] \n"
	);
	//
	// Multiple parcel loop 
	//
	var numberOfParcels = placingHelper.numberOfParcels();
	print("Parcels : " + numberOfParcels);
	var placingParcelList = placingXmlHold.PlacingParcelList;
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
		if(cntr == 1){
			var matId = pipelineHelper.getMainMaterialMatId();
		}  else{
			var matId =  parcel.ParcelEventList..Event[0].(EventType == "Video").TrimMaterialId.toString();
		}
		if (!gmoNBCFunc.isVarUsable(matId)) {
			throw new Error('Cannot find MatId of Main Material, cannot continue ')
		} else {
			print('MainMaterial matId value is: [' + matId + ']')
		}
		
		var mainMaterialHelper = new gmoNBCFunc.materialHelper(matId);
		var mediaObj = placingHelper.getUsableMediasForMaterial(matId);
		var videoMedia = mediaObj["Video"]
		var videoTrack = videoMedia["Track"];
		var extension = videoTrack.FileExtension.toString();

		var destVideoFilePath = currentWorkingFolder + placingId + "." + settings.transcodedExtension; 
		if (cntr >1 ) {   // trailer
			// Get conform cache material for trailer.
			var sourceVideoFilePath =  conformCachePath + matId + ".mov" ;  
			var vantageSrcObj = new gmoNBCFunc.usefulFileObj(sourceVideoFilePath);
			var destVideoFilePath = currentWorkingFolder + matId + ".mov" ; 
		} else if (previousPipelineState == "Transfer"){
			var sourceVideoFilePath = previousWorkingFolder + videoTrack.FileId.toString() + "." + extension;
			var vantageSrcObj = new gmoNBCFunc.usefulFileObj(sourceVideoFilePath);
		} else if (previousPipelineState == "Conform") {
			// Get conform cache material.
			output("Conform Key [" + conformKey + "]");
			var vantageSrcObj = cacheHelper.getCacheFileObj(conformKey);
		}
		else {		
			var sourceVideoFilePath = previousWorkingFolder + placingId + "." + extension;
			var vantageSrcObj = new gmoNBCFunc.usefulFileObj(sourceVideoFilePath);
		}
		
		// The dest file should be placingId.ext at the end, might need to change this later.
	
		print("\n" +
			"Current Pipeline State [" + pipelineState + "] \n"	+
			"Previous Pipeline State [" + previousPipelineState + "] \n" +
			"Working Dir [" + currentWorkingFolder + "] \n" +
			"Source File Path [" + vantageSrcObj.unix_file + "] \n" + 
			"Dest File Path [" + destVideoFilePath + "] \n"
		);
		
		jobDashboard.updateStatusAndProgress("Setting Up Transcode.",15);	
		
		// The extension is likely incorrect, but gives us the usefulFileObj for the functions. Will reconcile after the transcode is complete.
		var vantageDstObj = new gmoNBCFunc.usefulFileObj(destVideoFilePath);
		
		// Get the number of audio channels based on the profile match that was found.
		if (placingHelper.isRestoreAndDeliverFromPlacingShortText()) {
			output("Pulling Total Number of Output Audio Channels From Source Material");
			var outputAudioChannels = gmoNBCFunc.totalNumberOfAudioChannelsOnTrack(videoTrack);
		} else {
			output("Pulling Total Number of Output Audio Channels From Profile");
		var outputAudioChannels = ph.getAudioChannelsForProfile();
		}
		// This will be passed into Vantage as a variable.
		//var parcelFrameRate = placingXml.PlacingParcelList.PlacingParcel.Parcel.FrameRate.toString(); // Get this from the file?
		
		/* If Output Frame Rate = Return to Original Frame Rate 
			For Telecine Assets the output Frame rate will be P23_976
			For Non Telecine - This will be Same as Source
		Else 
			Same as Source or Preset defined Frame Rate
		*/
		var outputFrameRate = settings.outputFrameRate === returnToOrigFrameRateSetting ? gmoNBCNLDFunc.checkTelecineAndSelectFrameRate(mainMaterialHelper.getMaterialXml()): settings.outputFrameRate;
		
		if (gmoNBCFunc.isVarUsable(outputFrameRate) && outputFrameRate != "Same as Source"){
			output("Getting frame rate from Post Processing preset.");
			var frameRate = outputFrameRate;
		} else {
			output("Getting frame rate from main material.");
			var frameRate = mainMaterialHelper.getMaterialFrameRate();
		}
		
		var vantageFrameRate = NBCGMO.frameRateLookup[frameRate];
		
		// Check source file exists
		if (!fileExists(vantageSrcObj.unix_file)){
			throw new Error("Source video file [" + vantageSrcObj.unix_file + "] does not exist, can not continue.");
		}
		
		makedir(vantageDstObj.unix_path);
		//this is a temporary fix until we get permssions sorted 
		run("/bin/chmod", 777, "-R", vantageDstObj.unix_path);
		
		// Build our vantage object, since this is a simple transcode we should only need source and dest file paths/files.
		var vantageObj = new gmoNBCVantageFunc.Standard_Vantage_Object();
		vantageObj.setOriginal(vantageSrcObj);
		vantageObj.setJobName(settings.transcodeVantageWorkflow + "-" + placingId);
		vantageObj.setWorkflowName(settings.transcodeVantageWorkflow);
			
		// Set all required vantage variables.
		vantageObj.setVar("mov_dest_filepath", vantageDstObj.win_path);
		vantageObj.setVar("output_filename", vantageDstObj.basename);
		vantageObj.setVar("output_framerate", vantageFrameRate);
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

		//Side Car Audio Extraction

		if(ph.isProfileHasSideCarAudioReq()){

			print("Matched Profile Has Side Car Audio Requirements ");
			var trackTypes = ph.getSideCarTrackTypesForProfile();
			var sideCarAudioGroups = ph.getSideCarAudioGroups();
			outputAudioChannels = parseInt(outputAudioChannels);
			
			//Assuming every Track Type in Output is 2 Channels; 
			print("Output Channels Based on Profile ["+outputAudioChannels+"]");
			outputAudioChannels = outputAudioChannels - (trackTypes.length * 2);
			print("Output Channels discarding Side Car Audio ["+outputAudioChannels+"]");
			var destAudioFilePath = workingPath + "/Component/" + placingId + "." + "xyz"; 
			print("Dest Audio File Path [" + destAudioFilePath + "]");
			
			// The extension is likely incorrect, but gives us the usefulFileObj for the functions. Will reconcile after the transcode is complete.
			var vantageAudioDstObj = new gmoNBCFunc.usefulFileObj(destAudioFilePath);
			makedir(vantageAudioDstObj.unix_path);
			
			//this is a temporary fix until we get permssions sorted 
			run("/bin/chmod", 777, "-R", vantageAudioDstObj.unix_path);
			vantageObj.setVar("destfilepath", vantageAudioDstObj.win_path);
			vantageObj.setVar("extractAudio", "True");

			var stereoIndex = 0;
			var surroundIndex = 0;
			var extractAudioPosition = outputAudioChannels;
			
			for each (audioGroup in sideCarAudioGroups){
				extractAudioPosition = extractAudioPosition;
				if(audioGroup.indexOf("SFR")>-1 || audioGroup.indexOf("SRE")>-1 || audioGroup.indexOf("SCN")>-1){
					surroundIndex++;
					vantageObj.setVar("Surround" + surroundIndex, "True");
					vantageObj.setVar("Surround" + surroundIndex + "Ch1", extractAudioPosition + 1);
					vantageObj.setVar("Surround" + surroundIndex + "Ch2", extractAudioPosition + 2);
					vantageObj.setVar("Surround" + surroundIndex + "Ch3", extractAudioPosition + 3);
					vantageObj.setVar("Surround" + surroundIndex + "Ch4", extractAudioPosition + 4);
					vantageObj.setVar("Surround" + surroundIndex + "Ch5", extractAudioPosition + 5);
					vantageObj.setVar("Surround" + surroundIndex + "Ch6", extractAudioPosition + 6);
					vantageObj.setVar("Surround" + surroundIndex + "Ch6", extractAudioPosition + 6);
					vantageObj.setVar("Surround" + surroundIndex + "_output_file_name", placingId + "_" + audioGroup);
					extractAudioPosition = extractAudioPosition + 6;
				}else {
					stereoIndex++;
					vantageObj.setVar("Stereo" + stereoIndex, "True");
					vantageObj.setVar("Stereo" + stereoIndex + "Ch1", extractAudioPosition + 1 );
					vantageObj.setVar("Stereo" + stereoIndex + "Ch2", extractAudioPosition + 2);
					vantageObj.setVar("Stereo" + stereoIndex + "_output_file_name", placingId + "_" + audioGroup);
					extractAudioPosition = extractAudioPosition + 2;
				}
			}

		}else{
			print("Matched Profile Has No Side Car Audio Requirements ")
		}

		// Consider setting Output Transformation if run_profileAllocation set it.
		// Default values of HD
		var outputWidth = 1920;
		var outputHeight = 1080;
		const sourceTransformation = mainMaterialHelper.getTransformation();
		const outputTransformation = placingHelper.getPlacingShortTextValue('Output Transformation');
		if (!gmoNBCFunc.isVarUsable(outputTransformation)) {
			print("Attempting to send Transformation Vantage variables, but could not find value for outputTransformation Value, will not send transformation values")
		} else {
			vantageObj.setVar("output_transformation", outputTransformation);
			vantageObj.setVar("source_transformation", sourceTransformation);

			var matXml = mainMaterialHelper.getMaterialXml();
			print('\n\nmatXml looks like: ')
			gmoNBCFunc.printObj(matXml)
			print(' END matXml\n\n\n\n')
			var mediaInfoHelper = new gmoNBCFunc.mediaInfoHelper(matXml);
			vantageObj.setVar("source_frame_width", mediaInfoHelper.getVideoWidth());
			vantageObj.setVar("source_frame_height", mediaInfoHelper.getVideoHeight());
			const profileAspectRatio = gmoNBCFunc.resolveAlias("Placing_Profile_Aspect_Ratio", placingId);
			var PAR = profileAspectRatio.toLowerCase();
			if (!gmoNBCFunc.isVarUsable(PAR)) {
				throw new Error("Attempting to send Transformation Vantage variables, but could not find value for profileAspectRatio, cannot continue ")
			}

			//Default is 1920x1080, works for most cases except 4x3
			if (PAR == "16x9 anamorphic (1:78)" ||  PAR == "4x3 full frame (1:33)" || PAR.indexOf("4x3 letterbox") > -1 ) {
				outputWidth = 720;
				outputHeight = 480;
			}
			vantageObj.setVar("output_frame_width", outputWidth);
			vantageObj.setVar("output_frame_height", outputHeight);
		}

		
		vantageObj.setVar("output_audio_channels", outputAudioChannels);

		checkSDAnamorphic(mainMaterialHelper.getSourceFormat(), mainMaterialHelper.getAspectRatio(), mainMaterialHelper.getTransformation())
			? vantageObj.setVar("sd_anamorphic_16_9", true)
			: vantageObj.setVar("sd_anamorphic_16_9", false)
			
		print("\n");
		//show(vantageObj); 

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
		
		// Sanity Check
		if (gmoNBCFunc.listDirectory(vantageDstObj.unix_path).length == 0) { 
			throw new Error("No files in directory [" + vantageDstObj.win_path + "] after Transcode\nPlease check transcode workflow for more information")
		}

		// If extension is provided fine the transcoded file. Else search the output folder for the file (not ideal!!)
		if (settings.transcodedExtension != "" && settings.transcodedExtension != null){
			output("Transcoded File Extension provided in preset, lets use it.");
			var destFilePath = vantageDstObj.unix_path + vantageDstObj.basename + "." + settings.transcodedExtension;
			
			// If we find the file, set the boolean to true.
			var transcodedFileObj = new gmoNBCFunc.usefulFileObj(destFilePath);
			if (!transcodedFileObj.exists()){
				throw new Error("Could not find destination file.");
			} 
		} else {
			output("Transcoded File Extension not provided in preset, lets try to find the file.");
			var destFolder = new File (vantageDstObj.unix_path);
			for each (var file in destFolder.listFiles()){
				output("Checking file [" + file + "]");
				var transcodedFileObj = new gmoNBCFunc.usefulFileObj(String(file.path));
				if (transcodedFileObj.basename != vantageDstObj.basename){
					throw new Error("Could not find destination file.");
				} 
			}
		}
		
		// Get the transcode cache media path. Work out if it uses matId.dir. (at the time of writing this it doesn't)
		if (lookup.media[transcodeCacheMedia].usesMatIdDir){
			var transcodeCachePath = lookup.media[transcodeCacheMedia].mount + transcodeKey + ".dir/";	
			makedir(transcodeCachePath);
			//this is a temporary fix until we get permssions sorted 
			//run("/bin/chmod", 777, "-R", transcodeCachePath); - Permissions should be sorted now so retrying
		} else {
			var transcodeCachePath = lookup.media[transcodeCacheMedia].mount;			
		}
		if (cntr >1 ) {   // trailer
			var transcodedFilePath = currentWorkingFolder + matId + transcodedFileObj.extension;
		}else {
			var transcodedFilePath = transcodeCachePath + transcodeKey + "." + transcodedFileObj.extension;
			// File was found, now we can move it to our transcode cache.
			output("Moving file [" + transcodedFileObj.unix_file + "] to [" + transcodedFilePath + "]");
			move(transcodedFileObj.unix_file, transcodedFilePath);
			
			// Update file object.
			transcodedFileObj = new gmoNBCFunc.usefulFileObj(transcodedFilePath);

			if (transcodedFileObj.exists()){
				output("Move was succesfull to Transcode Cache Media. Cleaning up ");
				remove(vantageDstObj.unix_path);
			} else {
				throw new Error("Failed to move file to Transcode Cache Media.");
			}	
		}
		
	
		
		// Need to save the track for Transcode Cache here.
		jobDashboard.updateStatusAndProgress("Updating Transcode Manager",95);
		
		var fileId = transcodedFileObj.basename;
		var fileExt = transcodedFileObj.extension;
		var fileBytes = transcodedFileObj.filesize;
		var checkSum = "";
		
		print("Updating [" + activeTrackId + "] for Transcode Cache Material ["  + transcodeKey + "]");
		print("\n" +
			"File Id [" + fileId + "] \n" +
			"File Ext [" + fileExt + "] \n" + 
			"File Bytes [" + fileBytes + "] \n" +
			"MD5 Sum [" + checkSum + "] \n"
		);
		if (cntr == 1){
			cacheHelper.saveCacheTrack(
				transcodeKey,
				activeTrackId,
				transcodeCacheMedia,
				fileId,
				fileExt,
				checkSum,
				fileBytes,
				[cacheHelper.createCacheTrackDef("/" + transcodeKey + ".dir/", transcodedFileObj.filename, "Video")]
			);
		}
	
	} // parcel loop

	// TEMPORARY COPY FOR NOW TO PACKAGE QC
	/*
		COMMENTED OUT SINCE A RENAME/COPY IS DONE IN THE PACKAGING SCRIPT.
	gmoNBCFunc.copyFileOnRemoteHost("100.116.70.202",			// Hostname or IP, prefer to specify hostname as it will retry with different IP's if it fails
					transcodedFileObj.dvs_path,		// Source Path
					"/media/dvs-rt3/PACKAGE_QC/",			// Destination path relative to mount on the host were sshing into (DVS in this case)
					transcodedFileObj.filename,		// Source Filename
					placingId + "." + fileExt,					// Leave this as null (not as a string of "null"), if you dont want to rename the file.
					transcodedFileObj.filesize);		// You can not specify this at all, however it will check for the file transfer speed if you specify it.	
	*/
	
	jobDashboard.updateStatusAndProgress("Finishing Script",100);
		
	quit(0);
	
} catch(e){
	output("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})

	if (typeof(settings) !== "undefined") {
		gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml, true,	"",	e.message, settings.transcodeFailureEmailAddresses);
	}

	if (fileExists(currentWorkingFolder)){
		output("Working folder exists, cleaning up files/folder for this state [" + currentWorkingFolder + "].");
		if (!gmoNBCFunc.deleteDirectory(currentWorkingFolder, true)){
			print("Failed to remove files.");
		}
		if (transcodedFileObj){
			output("Need to clean up the transcode cache track/files if it fails after it exists.");
			remove(transcodedFileObj.unix_file);
		}
	} else {
		output("No working folder exists, nothing to cleanup.");
	}
	
	if (gmoNBCFunc.isVarUsable(vantageAudioDstObj)) {
		if (fileExists(vantageAudioDstObj.unix_path)) {
			output("Working audio folder exists, cleaning up files/folder in [" + vantageAudioDstObj.unix_path + "].");
			if (!gmoNBCFunc.deleteDirectory(vantageAudioDstObj.unix_path, true)) {
				output("Failed to remove sidecar audio files.");
			}
		}
	} else {
		output("No sidecar audio working folder exists, nothing to cleanup");
	}
	quit(-1);
}
