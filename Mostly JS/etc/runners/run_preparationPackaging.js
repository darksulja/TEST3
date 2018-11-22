load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_component_fun.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/pipelineHelper.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_vantage_fun.js");
load("/opt/evertz/mediator/etc/runners/cacheHelper.js");
load("/opt/evertz/mediator/etc/runners/ProfileHelper.js");
load("/opt/evertz/mediator/etc/runners/PackageQCHelper.js");
load("/opt/evertz/mediator/etc/runners/FileNameHelper.js");
load("/opt/evertz/mediator/etc/helpers/PresetHelper.js");
load("/opt/evertz/mediator/etc/helpers/ErrorHandlerHelper.js");
load("/opt/evertz/mediator/etc/helpers/ETL_API.js");

var debug = false;

function overrideOrPresetDecison(fileType){
	var override = fileNameHelper.checkFileNameOverride(fileType);
	if (override != undefined) {
		print("FileName Override for fileType: " + fileType + ". Using Override");
		return override;
	} else {
		return false;
	}
}

try {
	// Compiles a template of what a given type of filename should look like, based on the preset's tag list.
	// This is used to do a visual comparison in the Package QC form between the expected filename and the actual filename.
	// We then save this template as a short text in the placing's XML.
	//
	// FYI: Be mindful of the fact that 'seperator' is mispelled in all of our presets.
	var fileNameFormat = function(placingXml, fileType) {
		if (["Video", "Audio", "Caption"].indexOf(fileType) == -1) { print("Invalid file type requested for file name formatting."); return "" }

		var format = [];
		var fields = placingXml..PublicationDefinition.Presets.PresetList.Preset.TagList.Tag.(TagType == "NLD " + fileType + " Output Filename").Value;
		var separator = placingXml..PublicationDefinition.Presets.PresetList.Preset.ShortTextList.ShortText.(ShortTextType == 'NLD ' + fileType + ' Output Filename Seperator').Value.toString();

		if (fields.length() > 1) {
			for each(field in fields) format.push("<" + field + ">")
			return format.join(separator)
		} else {
			return "No file format found for this preset." // This string will appear in the UI.
		}
	}

	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);

	// Key used for NLD settings in lookup.js regarding working directories.
	var vodWorking = "NLD_WORKING_DIR"

	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);

	// Get required values from Job Description.
	var placingId = jobDescription.Properties.Mapping.domainKey.toString();

	//create placing and pipeline helpers
	var placingHelper = new PlacingHelper(placingId);
	var pipelineHelper = new PipelineHelper(placingHelper, vodWorking);
	var placingXml = placingHelper.getPlacingXml();
	var presetHelper = new PresetHelper();
	var packagingPresetName = placingXml..Preset.(PresetType == "Packaging").Name.toString();
	var presetOptions = presetHelper.getPreset(packagingPresetName);
	var pipelineState = placingHelper.getPlacingState();
	var previousPipelineState = pipelineHelper.getPreviousPipelineState();
    var outputTemplateId = placingHelper.getOutputTemplateId();
    var cacheHelper = new CacheHelper(placingHelper);
    var mediaObj = placingHelper.getUsableMediasForMaterial(placingHelper.getMainMaterial());
    var videoMedia = mediaObj["Video"]["MediaName"];
    var videoTrack = mediaObj["Video"]["Track"];
	var fileNameHelper = new FileNameHelper(placingId, "Placing");
	fileNameHelper.setFileNameOverrides(placingXml);
	var videoReady = false ;
	var audioReady = false ;	
	print(
		"Placing Id [" + placingId + "] \n" +
		"Current Pipeline State [" + pipelineState + "] \n" +
		"Previous Pipeline State [" + previousPipelineState + "] \n" +
		"Video Media [" + videoMedia + "] \n"
	);

	// Check if pipeline state is required. Will exit here if not.
	gmoNBCNLDFunc.checkPipelineStateRequired(placingId, pipelineState);

	//check the placing has gone through the correct workflow transitions
	//gmoNBCNLDFunc.checkValidStateRoute(pipelineHelper.getPreviousPipelineState(), pipelineState);

	jobDashboard.updateStatusAndProgress("Gathering Placing Details/Settings",10);

	// Get NLD Working information and generic job information.
	var pubDefName = placingHelper.getPubDef();
	var currentWorkingFolder = pipelineHelper.getPackagingFolder();
	var workingPath = pipelineHelper.getWorkingPath();
	var userQcPath = pipelineHelper.getPackageQcFolder();	
	
	
	print("\n" +
			"Publication Definition Name [" + pubDefName + "] \n" +
			"Current Working Folder [" + currentWorkingFolder + "] \n" +
			"Working Path [" + workingPath + "] \n"
	);
	
	gmoNBCFunc.makeDirectory(currentWorkingFolder);
	
	var settings = placingHelper.getSettings();
	
	jobDashboard.updateStatusAndProgress("Renaming files.", 20);

	//
	var deliveredFileNames = [];
	var deliveredPackage = "";
	
	var mainMaterialId = pipelineHelper.getMainMaterialMatId();
	
	if (previousPipelineState == "Transfer"){
		output("Need to use Video Media [" + videoMedia + "] since previous state was Transfer.");
		var previousWorkingFolder = pipelineHelper.getPreviousWorkingFolder();
		if (placingXml.PlacingParcelList.PlacingParcel.Parcel.ParcelEventList.Event.length() > 1){
			var errObj = new Error();
			errObj.code = 137;
			throw errObj;
		}

		var fileName = videoTrack.FileId.toString();
		var extension =  videoTrack.FileExtension.toString();
		
		var sourceFileObj = new gmoNBCFunc.usefulFileObj(previousWorkingFolder + mainMaterialId + ".dir/" + fileName + "." + extension);
	} else if(previousPipelineState == "Conform"){
		// Get transcode cache material.
		var transcodeKey = cacheHelper.getCacheKey("CNFM");
		output("Transcode Key [" + transcodeKey + "]");
        var sourceFileObj = cacheHelper.getCacheFileObj(transcodeKey);
	} else {
		// Get transcode cache material.
		var transcodeKey = cacheHelper.getCacheKey("TRNS");
		output("Transcode Key [" + transcodeKey + "]");
        	var sourceFileObj = cacheHelper.getCacheFileObj(transcodeKey);		
	}
	
	var isSMATApproved = gmoNBCFunc.isVarUsable(placingHelper.getPlacingShortTextValue("Export Format")) ? true : false;
	if(settings.smatApprovalRequired && !isSMATApproved){
		var approvalError = new Error();
		approvalError.code = 139;
		throw approvalError;
	}else if(settings.smatApprovalRequired && isSMATApproved){
		output("SMAT Approval found. Proceeding...")
	}else{
		output("No SMAT Approval Required. Skipping check and proceeding with packaging.");
	}

	if (settings.isPerformChecksumReq) {
		print("Running checksum on video...");
		gmoNBCNLDFunc.savePlacingShortText(placingId, "Video Checksum", sourceFileObj.getMd5Sum());
	}
	
	// Video Dest File Name and Dest File
	var videoDestFileName = overrideOrPresetDecison("Video");
	if(videoDestFileName == false){
		var videoDestFile = gmoNBCNLDFunc.getDestFilePathDetails(placingXml, currentWorkingFolder, "Video", sourceFileObj.extension, settings).destFilePath;
	}else{
		var videoDestFile = new gmoNBCFunc.usefulFileObj(currentWorkingFolder + videoDestFileName + "." + sourceFileObj.extension);
	}

	// Save the video output file format.
	gmoNBCNLDFunc.savePlacingShortText(placingId, "NLD Video Output Filename Format", fileNameFormat(placingXml, "Video"));
	
	// Lets rename the video file.
	gmoNBCFunc.copyFileOnRemoteHost(lookup.storage.dvs.endpoint(),	// Hostname or IP, prefer to specify hostname as it will retry with different IP's if it fails
						sourceFileObj.dvs_path,			// Source Path
						videoDestFile.dvs_path,			// Destination path relative to mount on the host were sshing into (DVS in this case)
						sourceFileObj.filename,			// Source Filename
						videoDestFile.filename,			// Leave this as null (not as a string of "null"), if you dont want to rename the file.
						sourceFileObj.filesize);		// You can not specify this at all, however it will check for the file transfer speed if you specify it.
						
	deliveredFileNames.push(videoDestFile.filename);

	gmoNBCNLDFunc.savePlacingShortText(placingId, "NLD Video Output Delivery Filename", videoDestFile.filename);

	sleep(2);
	run("/bin/ls", "-lh", videoDestFile.unix_path);
    gmoNBCNLDFunc.savePlacingShortText(placingId, "Video File Name", videoDestFile.filename);
    gmoNBCNLDFunc.savePlacingShortText(placingId, "Video File ID", videoDestFile.basename);
    gmoNBCNLDFunc.savePlacingShortText(placingId, "Video File Size", sourceFileObj.filesize);
	videoReady = true;

	//Trailer Logic//
	var trailerParcelEventList = placingXml.PlacingParcelList.PlacingParcel.(Ordinality == 2).Parcel.ParcelEventList.Event[0];
	if(gmoNBCFunc.isVarUsable(trailerParcelEventList)){
		output("Trailer must be packaged as part of this parcel.");
		var trailermatId = trailerParcelEventList.TrimMaterialId.toString();
		output("Trailer Material Id [" + trailermatId + "]");
		var previousWorkingFolder = pipelineHelper.getPreviousWorkingFolder();

		var trailerMediaObj = placingHelper.getUsableMediasForMaterial(trailermatId);
		var trailerVideoTrack = trailerMediaObj["Video"]["Track"];
		//		var trailerSourceFileObj = new gmoNBCFunc.usefulFileObj(previousWorkingFolder + trailerVideoTrack.FileId.toString() + "." + trailerVideoTrack.FileExtension.toString());
		var trailerSourceFileObj = new gmoNBCFunc.usefulFileObj(previousWorkingFolder + trailerVideoTrack.FileId.toString() + "." + settings.transcodedExtension );
		if(!trailerSourceFileObj.exists()) throw new Error("Trailer video file not found. Trailer video file required for package.");

		var trailerVideoDestFile = gmoNBCNLDFunc.getDestFilePathDetails(placingXml, currentWorkingFolder, "Trailer", trailerSourceFileObj.extension, settings).destFilePath;

		// Save the video output file format.
		gmoNBCNLDFunc.savePlacingShortText(placingId, "NLD Trailer Output Filename Format", fileNameFormat(placingXml, "Trailer"));
		// Lets rename the video file.
		gmoNBCFunc.copyFileOnRemoteHost(lookup.storage.dvs.endpoint(),	
							trailerSourceFileObj.dvs_path,			
							trailerVideoDestFile.dvs_path,			
							trailerSourceFileObj.filename,			
							trailerVideoDestFile.filename,			
							trailerSourceFileObj.filesize);		
							
		deliveredFileNames.push(trailerVideoDestFile.filename);
		gmoNBCNLDFunc.savePlacingShortText(placingId, "NLD Trailer Video Output Delivery Filename", trailerVideoDestFile.filename);
		sleep(2);
		run("/bin/ls", "-lh", trailerVideoDestFile.unix_path);
		gmoNBCNLDFunc.savePlacingShortText(placingId, "Trailer Video File Name", trailerVideoDestFile.filename);
		gmoNBCNLDFunc.savePlacingShortText(placingId, "Trailer Video File ID", trailerVideoDestFile.basename);
		gmoNBCNLDFunc.savePlacingShortText(placingId, "Trailer Video File Size", trailerSourceFileObj.filesize);
	}

	// Caption rename/file stuff.
	//var captionMethod = settings.captionMethod;
	var captionMethod; 
	
	if ( settings.captionMethod == "" || settings.captionMethod == null){
		if (settings.embeddedCaption1 != "None" && settings.embeddedCaption1 != "" || settings.embeddedCaption2 != "None" && settings.embeddedCaption2 != ""){
			captionMethod = "Embedded";
		}
		else if (settings.sideCarCaption1 != "None" && settings.sideCarCaption1 != "" || settings.sideCarCaption2 != "None" && settings.sideCarCaption2 != ""){
			captionMethod = "Sidecar";
		}
		else {
			print("captionMethod is blank");
			captionMethod = "";
		}
	}
	else {
		//legacy form
		captionMethod = settings.captionMethod;
	}

	var sideCarCaption;	
	if (captionMethod == "Embedded" || captionMethod == null || captionMethod == ""){
		sideCarCaption = false;
	} else {
		sideCarCaption = true;
	}
	
	if (sideCarCaption == true){
		var closedCaptionTrackType = gmoNBCNLDFunc.checkMatchedTrackTypeForTrackTypeClass(placingXml, mainMaterialId, "Subtitle");
		output("Closed Caption Track Type [" + closedCaptionTrackType + "]");
		var trackTypeFileTag = gmoNBCNLDFunc.checkMatchedTrackTypeForTrackTypeFileTag(placingXml, mainMaterialId, "Subtitle");
		print("Closed Caption Track Type Filetag [" + trackTypeFileTag + "]");

		if (closedCaptionTrackType != "" && closedCaptionTrackType != null && closedCaptionTrackType != []){
			//var captionExtension = captionMethod.substring(captionMethod.lastIndexOf('-') + 2).toLowerCase();
			var captionExtension;
			if (settings.captionMethod == "" || settings.captionMethod == null){
				print("Using new captionMethod form");
				captionExtension = (settings.sidecarCaption1 != "None" && settings.sidecarCaption1 != "") ? settings.sidecarCaption1.toLowerCase() : settings.sidecarCaption2.toLowerCase();
			}
			else {
				//legacy form
				print("Using legacy captionMethod form");
				captionExtension = captionMethod.substring(captionMethod.lastIndexOf('-') + 2).toLowerCase();
			}
			
			var captionFileObj = new gmoNBCFunc.usefulFileObj(workingPath + "/Component/" + placingId + "-" + trackTypeFileTag + "." + captionExtension);			
			
			var captionDestFileName = overrideOrPresetDecison("Caption");
			if(captionDestFileName == false){
				var captionDestFile = gmoNBCNLDFunc.getDestFilePathDetails(placingXml, currentWorkingFolder, "Caption", captionFileObj.extension, settings).destFilePath;
			} else{
				var captionDestFile = new gmoNBCFunc.usefulFileObj(currentWorkingFolder + captionDestFileName + "." + captionExtension);
			}

			// Save the expected caption format to the placing short text.
			gmoNBCNLDFunc.savePlacingShortText(placingId, "NLD Caption Output Filename Format", fileNameFormat(placingXml, "Caption"));
			
			// Lets rename the video file.
			gmoNBCFunc.copyFileOnRemoteHost(lookup.storage.dvs.endpoint(),	// Hostname or IP, prefer to specify hostname as it will retry with different IP's if it fails
							captionFileObj.dvs_path,			// Source Path
							captionDestFile.dvs_path,			// Destination path relative to mount on the host were sshing into (DVS in this case)
							captionFileObj.filename,			// Source Filename
							captionDestFile.filename,			// Leave this as null (not as a string of "null"), if you dont want to rename the file.
							captionFileObj.filesize);			// You can not specify this at all, however it will check for the file transfer speed if you specify it.
							
			deliveredFileNames.push(captionDestFile.filename);
			sleep(2);
			run("/bin/ls", "-lh", captionDestFile.unix_path);
			captionDestFile = captionDestFile.refresh();

			gmoNBCNLDFunc.savePlacingShortText(placingId, "Caption File Name", captionDestFile.filename);
			gmoNBCNLDFunc.savePlacingShortText(placingId, "Caption File ID", captionDestFile.basename);
			gmoNBCNLDFunc.savePlacingShortText(placingId, "Caption File Size", captionFileObj.filesize);
			if(gmoNBCFunc.isVarUsable(outputTemplateId)) gmoNBCNLDFunc.savePlacingShortText(placingId, "Caption Checksum", captionFileObj.getMd5Sum());

		} else {
			output("No CC track type was matched, skipping Closed Caption copy.")
		}
	}

	//Side Car Audio 
    ph = new ProfileHelper();
    ph.initialize();
    ph.setProfile(placingXml.ShortTextList.ShortText.(ShortTextType == "Matched Profile").Value.toString());

    if(ph.isProfileHasSideCarAudioReq()){

		print("Matched Profile Has Side Car Audio Requirements ");
        var audioGroups = ph.getSideCarAudioGroups();

        var audioFolder = new File (workingPath + "/Component/");
        var audioFiles = audioFolder.listFiles();


        for each (audioGroup in audioGroups){	
			
			fileNameHelper.setFileNameIterator(iterator);
			for each (var file in audioFiles){
				output("Checking file [" + file + "]");
	            var audioFileObj = new gmoNBCFunc.usefulFileObj(String(file.path));
				if (audioFileObj.basename == placingId + "_" + audioGroup){
					break;
				} else{
					audioFileObj = "";
				}
			}
    		var audioDestFileName = overrideOrPresetDecison("Audio");
			if(audioDestFileName == false){
				var audioDestFile = gmoNBCNLDFunc.getDestFilePathDetails(placingXml, currentWorkingFolder, "Audio", audioFileObj.extension, settings, audioGroup).destFilePath;
			} else{
    			var audioDestFile = new gmoNBCFunc.usefulFileObj(currentWorkingFolder + audioDestFileName + "." + audioFileObj.extension);
			}

    		gmoNBCFunc.copyFileOnRemoteHost(lookup.storage.dvs.endpoint(),audioFileObj.dvs_path,audioDestFile.dvs_path,
			audioFileObj.filename,audioDestFile.filename,audioFileObj.filesize);

    		deliveredFileNames.push(audioDestFile.filename);
			iterator++;
        }

		// Save the expected audio format to the placing short text.
		// This doesn't run for each audio file; they all follow the same format.
		gmoNBCNLDFunc.savePlacingShortText(placingId, "NLD Audio Output Filename Format", fileNameFormat(placingXml, "Audio"));

    }else{
    	output("No Side Car Audio Required, skipping Side Car Audio copy.")
    }
	
   if(!outputTemplateId){
        output("No output template defined for this pub def, no metadata will be created");
    }else {
        output("Publication Definition has an output template set, creating metadata");
		var outputTemplateName = placingHelper.getOutputTemplateName();

        // Check for language and region on the placing otherwise we cannot populate the output template
        var language = placingHelper.getPlacingShortTextValue("Language");
        var region = placingHelper.getPlacingShortTextValue("Region");
		if (outputTemplateName == "iTunes") {
	        if(!language || !region) { 
				var errObj = new Error();
				errObj.code = 138;
				throw errObj;
			}
		}
        
		var metadataExt = presetOptions['NLD Metadata Output File Extension'] || "xml";
        var metadataDestFileDetails = gmoNBCNLDFunc.getDestFilePathDetails(placingXml, currentWorkingFolder, "Metadata", metadataExt, settings);
		var metadataDestFile = metadataDestFileDetails.destFilePath;

		if (metadataExt == "xml") gmoNBCNLDFunc.createOutputXml(placingId, metadataDestFile.unix_file);
		else if (metadataExt == "csv") gmoNBCNLDFunc.createOutputCsv(placingId, metadataDestFile.unix_file);

        deliveredFileNames.push(metadataDestFile.filename);
        deliveredPackage = metadataDestFileDetails.fullPackageName;
    }
		// Check for Metadata 
	print("settings ETL "+settings.ETLmetadata );
	//print("settings.packageName.length" +settings.packageName.length);
	if (settings.ETLmetadata ){
		// load api
		//
		var normalizeFileNameFields = function(fieldValue){
			return fieldValue.replace(/[^A-Za-z0-9._-]/g,"");
		}
		//
		// Need Tag and short text info 
		var metadataPartnerName = placingXml..PublicationDefinition.Presets.PresetList.Preset.TagList.Tag.(TagType == "Metadata PartnerName")[0].Value.toString() ; 
		var metadataSchemaName = placingXml..PublicationDefinition.Presets.PresetList.Preset.TagList.Tag.(TagType == "Metadata Schema Name").Value;
		var metadataEndPointOverride = placingXml..PublicationDefinition.Presets.PresetList.Preset.ShortText.(ShortTextType == "Metadata Endpoint Override").Value.toString() ; 
		//
		print("ETL Metadata loaded :");
		print(" Partner : " + metadataPartnerName);
		print(" Schema(s) : " + metadataSchemaName);
		print(" End Point Override : "+ metadataEndPointOverride);
		print(" Current Working folder : "+ currentWorkingFolder );
		var cntr = 0;
		//
		try {
			for (var i=0 ; i < metadataSchemaName.length(); i++) {
				var schemaName = normalizeFileNameFields(metadataSchemaName[i].toString());
				cntr ++;
				print(" Schema : " + schemaName);
				var metaDataExtension =  "Metadata Filename extension " + cntr.toString();
				var extension = placingXml..PublicationDefinition.Presets.PresetList.Preset.ShortTextList.ShortText.(ShortTextType == metaDataExtension)[0].Value.toString() ; 
				print(" Extension : "+extension);
				var metadataDestFileDetails = gmoNBCNLDFunc.getDestFilePathDetails(placingXml, currentWorkingFolder, "ETLMetadata", extension, settings,cntr);
				var metaDataDestFile = metadataDestFileDetails.destFilePath;
				deliveredPackage = metadataDestFileDetails.fullPackageName;
				// send to ETL metadata
				var metaDestFileNameOverride = false;  // set to false - placed in case filename overrides are needed in future
                var metaDestFileNameOverride = false;  // set to false - placed in case filename overrides are needed in future
                print("Package : " +deliveredPackage);
                if( deliveredPackage > ""){
					var newfolder = currentWorkingFolder + "/" + deliveredPackage + "/"; 
	                var ETLAPI = new ETLworksHelper(placingId,metadataPartnerName,schemaName,newfolder ,metadataEndPointOverride);
                 }else{
                    var ETLAPI = new ETLworksHelper(placingId,metadataPartnerName,schemaName,currentWorkingFolder,metadataEndPointOverride);
                 }   
 				ETLAPI.initialize();
				var results = ETLAPI.getMetadata();
				var metadataDestFileDetails = gmoNBCNLDFunc.getDestFilePathDetails(placingXml, currentWorkingFolder, "ETLMetadata", extension, settings,cntr);
				var metaDataDestFile = metadataDestFileDetails.destFilePath;
				print(" Metadata File Name : " +cntr +" :" + metaDataDestFile.unix_file);
				overwrite(results, metaDataDestFile.unix_file);
				deliveredFileNames.push(metaDataDestFile.filename);
				print(" ------------------------------------- ");
			}
			}catch(e){
				throw new Error("Problem with Metadata load : " + e.message);
			}
		}

	//Image logic
	var imageMappingObject = gmoNBCNLDFunc.getImageMappingObject(placingHelper,settings);
	for each (var type in imageMappingObject){
		if(type[0].length > 0){
			output("Processing image type " + type[1] + ": " + type[0])
			for(var i =0; i < type[0].length; i++){
				if(gmoNBCFunc.isVarUsable(type[0][i])){
					var sourceImageObj = new gmoNBCFunc.usefulFileObj(lookup.media["DC_IMAGES_LIBRARY"].mount + type[0][i]);
					if(!sourceImageObj.exists()) throw new Error("Image missing at file location [" + sourceImageObj.unix_file + "]");					
					var imageDestFile = gmoNBCNLDFunc.getDestFilePathDetails(placingXml, currentWorkingFolder, type[1], sourceImageObj.extension, settings).destFilePath;
					if(!gmoNBCFunc.isVarUsable(imageDestFile.basename)){
						output("No filename generated for image. Copying to dest with original name [" + imageDestFile.unix_path + sourceImageObj.filename + "]");
						imageDestFile = new gmoNBCFunc.usefulFileObj(imageDestFile.unix_path + sourceImageObj.filename);
					}
					//if incrementImage file naming tag is used, we need to put the actual image number in the INCRMNT-IMAGE placeholder
					if(imageDestFile.unix_file.indexOf("INCRMNT-IMAGE") !== -1){
						output("Inserting increment number into image file name.")
						imageDestFile = new gmoNBCFunc.usefulFileObj(imageDestFile.unix_file.replace("INCRMNT-IMAGE", i + 1));
						output("New file name [" + imageDestFile.filename + "]");
					}
					gmoNBCFunc.copyFileOnRemoteHost(lookup.storage.dvs.endpoint(),sourceImageObj.dvs_path,imageDestFile.dvs_path,
						sourceImageObj.filename,imageDestFile.filename,sourceImageObj.filesize);
					deliveredFileNames.push(imageDestFile.filename);
				}
			}
		}
	}


	// Not currently used, left in from POC days.
	if (settings.packageFormat == "tar"){
		jobDashboard.updateStatusAndProgress("Packaging file(s) into a [" + settings.packageFormat + "]", 30);
		var inputFiles = []
		inputFiles.push(transcodedFileObj.unix_file);
		
		var tarDestFileName = overrideOrPresetDecison("Tar");
		if(tarDestFileName == false){
			var tarDestFileObj = gmoNBCNLDFunc.getDestFilePathDetails(placingXml, currentWorkingFolder, "Tar", transcodedFileObj.extension, settings).destFilePath;
		}else{
			var tarDestFileObj = new gmoNBCFunc.usefulFileObj(currentWorkingFolder + placingId + "." + settings.packageFormat);
		} 
		
		gmoNBCNLDFunc.createTarball("-cf", tarDestFileObj.unix_file, inputFiles, null, false);
		
		if (tarDestFileObj.exists() == true){
			print("Package output file exists, can now finish the script.");
			deliveredFileNames.push(tarDestFileObj.filename);
		} else {
			var errObj = new Error();
			errObj.code = 104;
			throw errObj;
		}
	} else {
		output("No file packaging required.");
	}		

	/*
		Make Symbolic Link
	*/
	gmoNBCFunc.makeDirectory(pipelineHelper.getPackageQcLicenseeFolder());
	if (!fileExists(userQcPath)) {
		gmoNBCFunc.makeSymbolicLink(userQcPath, new gmoNBCFunc.usefulFileObj(currentWorkingFolder).dvs_file);		
	} else {
		output("Not making symbolic link - source [" + userQcPath + "] already exists");
	}	
	
	gmoNBCNLDFunc.placingTagSave(placingId, "Delivery File Names", deliveredFileNames);		
	gmoNBCNLDFunc.savePlacingShortText(placingId, "Delivery Package File Name", deliveredPackage);
	
	try {
		/*
			Add Extra Package QC Metadata
		*/
		output("Adding extra metadata for Package QC");
		var packageQCHelper = new PackageQCHelper();
		packageQCHelper.setPlacingHelper(placingId);
		packageQCHelper.setMediaInfoHelper(videoDestFile);
		packageQCHelper.saveMatchedProfileTrackTypes();
		packageQCHelper.saveFileInformation();
		packageQCHelper.savePresetInformation();
		packageQCHelper.saveOrderAudioProfilelayout();
	} catch(e) {
		output("An error occured adding extra Package QC info: " + e.message);
	}
	
	jobDashboard.updateStatusAndProgress("Finishing Script",100);
	print("\n-----------Ending run_preparationPackaging.js----------------");
	
	quit(0);
	
} catch(e){
	output("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})
	try { // Non-Critical
		if(gmoNBCFunc.startsWith(e.message,"EMPTY FIELD ERROR:")){
			gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml,true,"",e.message,settings.packagingFailureEmailAddresses);
		} else if (settings.packagingSendFailureEmail == "true"){
			gmoNBCNLDFunc.sendGenericPlacingEmail(placingXml,true,"",e.message,settings.packagingFailureEmailAddresses);
		} else {
			print("No email required");
		}
	} catch(e) {
		output("Send Email Failed " + e.message);
	}
	
	if (fileExists(currentWorkingFolder)){
		output("Working folder exists, cleaning up files/folder for this state [" + currentWorkingFolder + "].");
		if (!gmoNBCFunc.deleteDirectory(currentWorkingFolder, true)){
			print("Failed to remove files.");
		}
	} else {
		output("No working folder exists, nothing to cleanup.");
	}
	var ehh = new ErrorHandlerHelper("Packaging",placingId,"Placing");
	if (gmoNBCFunc.isVarUsable(e.code)) {
		errorMsg = ehh.getError(e.code, e.parameters).message;
		output("Error caught in Packaging: Error Code ["+e.code+"] Message ["+errorMsg+"]");
	} else {
		errorMsg = e.message;
		output("An error has occurred: " + errorMsg);
	}
	ehh.saveNote(errorMsg);

	quit(1);
}
