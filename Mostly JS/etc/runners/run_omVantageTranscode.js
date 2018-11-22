// This script is due a rewrite!

//run_vantageTranscode.js
// load in the functions files we need
load("/opt/evertz/mediator/etc/runners/nbcgmo_vantage_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/vantage_lookup.js");
load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");

var debug = true; 

//wsLogin("localhost","wsuser","wspass");
output("Running run_omVantageTranscode.js");

var buildObject = function(jobDescription){
	print("\nBuidling Up Source Object for ["+jobDescription..Identifier+"]");
	var rtnObj = {};
	var stagingMedia = "";
	var omStagingSuffix = "OM_STAGING"
	var omDeliveryStagingSuffix1 = "DELIVERY1_STAGING";
	var omDeliveryStagingSuffix2 = "DELIVERY2_STAGING";
	output("jobdesc" + jobDescription);
	output("jobdescmat" + jobDescription.material)
	rtnObj.matid = jobDescription..MatId.toString().toUpperCase();
	output("matID " + rtnObj.matid);
	rtnObj.safematid = gmoNBCFunc.getSafeFileId(rtnObj.matid);
	output("safe matid" + rtnObj.safematid);
	rtnObj.matxml = materialGet(rtnObj.matid,"trackTypeLinks","tracks","shorttext","tag")..Material;
	//output("materailxml " + rtnObj.matxml);
	rtnObj.materialtype = rtnObj.matxml.MaterialType.toString();
	output("type" + rtnObj.materialtype);
	rtnObj.extension = rtnObj.matxml.Track.FileExtension[0].toString();
	rtnObj.mediatortracktypes = [];
	// Grab the Track Defs from the OM Staging Media
	
	stagingMedia = rtnObj.matxml.Track.(MediaName.indexOf(omStagingSuffix)>0).MediaName.toString();
	if(!gmoNBCFunc.isVarUsable(stagingMedia)) stagingMedia = rtnObj.matxml.Track.(MediaName.indexOf(omDeliveryStagingSuffix1)>0).MediaName.toString();
	if(!gmoNBCFunc.isVarUsable(stagingMedia)) stagingMedia = rtnObj.matxml.Track.(MediaName.indexOf(omDeliveryStagingSuffix2)>0).MediaName.toString();
	
	if(!gmoNBCFunc.isVarUsable(stagingMedia)){
		throw new Error("No Staging Track Registered on Materail.");
	}

	rtnObj.stagingmedia = stagingMedia;

	var stagingTrack = rtnObj.matxml.Track.(MediaName.toString() === stagingMedia && Encoded.toString() === "true" && (parseInt(DeleteMark.toString()) === 0));
	rtnObj.stagingtrackxml = stagingTrack;
	for (var i =0; i < stagingTrack.TrackDefinition.length(); i++) {
		print("Track Type [" + stagingTrack.TrackDefinition[i].TrackTypeName.toString() + "]");
		(rtnObj.mediatortracktypes).push(stagingTrack.TrackDefinition[i].TrackTypeName.toString());
	}
	show(rtnObj.mediatortracktypes);

	if (debug) show(rtnObj);
	for (var prop in rtnObj){
		if(!rtnObj[prop]){
			throw new Error("Cannot find Value in Object for Property ["+prop+"]");
		}
	}
	return rtnObj;
}

// Temporary function to Save a Silence Track Type Link and a Silence Track Def to the Aux Audio Media
var makeMaterialSilenceCompatible = function(mat,mediaName,trackType,state) {
		print("Material [" + mat + "] Media [" + mediaName + "] Track Type [" + trackType + "] State [" + state + "]");
		
		// Save Track Type Link
		var ttlSaveXml =  <Material><MatId>{mat}</MatId></Material>;
		ttlSaveXml.appendChild(gmoNBCFunc.createTrackTypeLinkNode(trackType,state,"NBC GMO"));
		var ttlSaved = materialSave(ttlSaveXml);
		if (!ttlSaved) throw new Error("Failed to save [" + trackType + "] Track Type Link");
		
		// Update the Track to have the MOS Track DEF
		var auxAudioTrackXml = materialGet(mat,"tracks")..Track.(MediaName.toString() === mediaName);
		var auxAudioTrackId = auxAudioTrackXml.@id[0].toString();
		var trackDefs = auxAudioTrackXml..TrackDefinition;
		if (!auxAudioTrackId) throw new Error("Failed to find Track ID for Material [" + mat + "] on Media [" + mediaName + "]" );
		if (debug) print("\nTrack ID [" + auxAudioTrackId + "]\nTrackXml " + auxAudioTrackXml);
		
        // In order to create a track file we need the silence to use the same TrackFile as another audio (since a file won't exist).
		// Lets jsut grab the first one for now.
		
		var firstAudioTrackDef = auxAudioTrackXml.TrackDefinition[0];        
        
		var updateTrackXml = <PharosCs>
								<CommandList>
									<Command subsystem="material" method="addOrUpdateTracks">
										<ParameterList>
											<Parameter name="matId" value={mat}/>
											<Parameter name="trackList">
												<Value>
													<TrackList>
														<Track id={auxAudioTrackId}>
                                                            <MediaName>{mediaName}</MediaName>
															{trackDefs}
														</Track>
													</TrackList>
												</Value>
											</Parameter>
										</ParameterList>
									</Command>
								</CommandList>
							</PharosCs>;
				
		updateTrackXml..Track.appendChild(<TrackDefinition>
											<TrackTypeName>{trackType}</TrackTypeName>
											<FilePosition>1</FilePosition>
											<Channels>2</Channels>
											<Position>0</Position>
                                            {firstAudioTrackDef.TrackFile}
										  </TrackDefinition>);
					
		return saveSilence = wscall(updateTrackXml)..Command.@success == true;
}

var getQCTrigger = function(priority,isStraightToArchive){
	var qcTrigger = requirements.toQC;
	
	if(isStraightToArchive)
		qcTrigger = requirements.toBypassQC;
	else if (priority)
		qcTrigger = requirements.toQCPriority;
		
	return qcTrigger;
}

try{
	print("\nStarting run_gmoVantageTranscode.js");
	var debug = false;
	var transcodeEnabled = false;
	var captionExtraction = false;
	var T2Prefix = "T2_";
	var form = {
		longform : "LF", 
		shortform : "SF"
	}
	var requirements = {
		toVantageTranscode : "Start",
		toCaptionExtraction : "Extract Captions",
		toQC : "Complete",
		toQCPriority : "Complete (Priority)",
		toVantageFailed : "Failed",
		toBypassQC : "Bypass QC"
	}

	var states = {
			originalState : "Vantage Transcode Required",
			processingState: "Vantage Transcode"
	}

	var jobDesc = getJobParameter("jobDescription");
	if(debug) print("\nJobDesc\n"+jobDesc+"\n");

	// Create a Dashboard Updater Object
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",10);

	//lets create a source obbjet that will store all our lovely material details
	var sourceObj = buildObject(jobDesc);
	if(debug) show(sourceObj);
	
	var priority = false;
	
	if (jobDesc..Priority !== "undefined" && jobDesc..Priority != "") {
		if(jobDesc..Priority.toString() == "true") {
			priority = true;
		}
	}
	
	jobDashboard.updateStatusMap({"Script_Priority":priority});
	jobDashboard.updateStatusMap({"Script_MatId":sourceObj.matid});
	//Check if the Material is Straight to Archive Workflow 
	var isStraightToArchive = gmoNBCFunc.isMateriaStraightToArchiveWorkflow(sourceObj.matid);
	
	// Transition all track types in Vantage Transcode Required to Vantage Transcode
	gmoNBCFunc.transitionMaterial(sourceObj.matid, states.originalState, requirements.toVantageTranscode);

	// Find out the file path to the saging media
	sourceObj.stagingmediamount = lookup.media[sourceObj.stagingmedia].mount;

	if(lookup.media[sourceObj.stagingmedia].usesMatIdDir){
		//we need to add the .dir to the file path
		sourceObj.stagingmediapathandfile = sourceObj.stagingmediamount + sourceObj.safematid +".dir/" + sourceObj.safematid + "." + sourceObj.extension
	}else{
		//filepath remains the same
		sourceObj.stagingmediapathandfile = sourceObj.stagingmediamount + sourceObj.safematid + "." + sourceObj.extension
	}

	//check the file exisits in the staging media folder
	/*
	if(!fileExists(sourceObj.stagingmediapathandfile)){
		throw new Error("")
	}
	*/
	// we may eventually do transcodes so thats what this logic is for
	if(!transcodeEnabled){
		// the output media will be the same as the format of the file that goes in so we can determine this pre transcode and get vantage to put it in the right place on the DVS
		//Do a media info on the file
		print("\nGetting MediaInfo Xml for [" + sourceObj.stagingmediapathandfile + "]");
		sourceObj.mediainfoxml = gmoNBCFunc.getFileInfoXml(sourceObj.stagingmediapathandfile);

		// Loop through House Profiles and see if one Matches the Current File being Uploaded
		jobDashboard.updateStatusAndProgress("Running Profile Validation Checks",15);
		for (var i=0; i<NBCGMO.contributionProfileGroups.HouseProfiles.length; i++) {
			var profile = NBCGMO.contributionProfileGroups.HouseProfiles[i];
			var profileObj = NBCGMO.contributionProfiles[profile];
			print("\nChecking to see if file ["+sourceObj.stagingmediapathandfile+"] matches the following profile ["+profile+"]");
			if (gmoNBCFunc.runProfileValidation(sourceObj.mediainfoxml,profile)) {
				sourceObj.profile = profile;
				break;
			}
		}

		// Check a Profile has been found for file
		if (sourceObj.profile) {
			print("\nSuccess File ["+sourceObj.stagingmediapathandfile+"] matches Profile ["+sourceObj.profile+"]");
			jobDashboard.updateStatusMap({"Script_Profile":sourceObj.profile});
			// Add in the Metadata Based upon the Media
			sourceObj.metadata = NBCGMO.contributionProfilesMetaData[sourceObj.profile];
		} else {
			throw new Error("Failed to find a Valid Profile for file ["+sourceObj.vidfile+"]")
		}
		
		
		// Work out appropriate Media here
		var formType = NBCGMO.formtypelookup[sourceObj.materialtype];
		if (formType === undefined) throw new Error("Failed to find Form Type from Material Type [" + formType + "]");
		print("\nForm Type [" + formType + "] found from Material [" + sourceObj.materialtype + "]\nAttempting to find Media")

		// Uncomment T2 Prefixes when ready (Plan is to move audio wavs to NRT)
		/**
			Currently make everything go to the DVS then work on the Isilon....
		
		**/
		
		if (formType === "LF") {
		
			sourceObj.videomedia = sourceObj.metadata.defaultStorageMedia;
			sourceObj.audiomedia = sourceObj.metadata.defautAudioStorageMedia;
		
		} else {
		
			sourceObj.videomedia = sourceObj.metadata.defaultStorageMediaSF;
			sourceObj.audiomedia = sourceObj.metadata.defautAudioStorageMediaSF;
		
		}			
		
		/*if (formType === "LF") {
			if (isStraightToArchive) {
				sourceObj.videomedia = T2Prefix + sourceObj.metadata.defaultStorageMedia;
				sourceObj.audiomedia = /*T2Prefix +*/ /*sourceObj.metadata.defautAudioStorageMedia;
			} else { 
				sourceObj.videomedia = sourceObj.metadata.defaultStorageMedia;
				sourceObj.audiomedia = sourceObj.metadata.defautAudioStorageMedia;
			}
		} else {
			if (isStraightToArchive) {
				sourceObj.videomedia = T2Prefix + sourceObj.metadata.defaultStorageMediaSF;
				sourceObj.audiomedia = /*T2Prefix +*/ //sourceObj.metadata.defautAudioStorageMediaSF;
			/*} else {
				sourceObj.videomedia = sourceObj.metadata.defaultStorageMediaSF;
				sourceObj.audiomedia = sourceObj.metadata.defautAudioStorageMediaSF;
			}
		}*/
		
		// Check Medias exists
		if (lookup.media[sourceObj.videomedia] === undefined) {
			throw new Error("\nVideo Media [" + sourceObj.videomedia + "] is undefined");
		} else {
			print("\nVideo Media set to [" + sourceObj.videomedia + "]");
		}
		
		if (lookup.media[sourceObj.audiomedia] === undefined) {
			throw new Error("\nAudio Media [" + sourceObj.audiomedia + "] is undefined");
		} else {
			print("\nAudio Media set to [" + sourceObj.audiomedia + "]");
		}
		
		sourceObj.videomediadir = lookup.media[sourceObj.videomedia].mount;
		sourceObj.audiomediadir = lookup.media[sourceObj.audiomedia].mount;

		if(lookup.media[sourceObj.videomedia].usesMatIdDir){
			sourceObj.videomediapath = sourceObj.videomediadir + sourceObj.safematid +".dir/"

		}else{
			sourceObj.videomediapath = sourceObj.videomediadir
		}

		sourceObj.videomediapathandfile = sourceObj.videomediapath + sourceObj.safematid + "." + sourceObj.extension;

		if(lookup.media[sourceObj.audiomedia].usesMatIdDir){
			sourceObj.audiomediapath = sourceObj.audiomediadir + sourceObj.safematid +".dir/"
		}else {
			sourceObj.audiomediapath = sourceObj.audiomediadir
		}

		sourceObj.audiomediapathandfile = sourceObj.audiomediapath + sourceObj.safematid + "." + sourceObj.extension

	}else{
		//add some more stuff into here to do the transcode logi when it comes to it, I am tryign to future proof the system.
		// eventually at then of this we need to determine the location of where the
	}

	if (fileExists(sourceObj.audiomediapath)){
		throw new Error("Directory already exists for this media.");
	}
	gmoNBCFunc.makeDirectory(sourceObj.videomediapath);
	gmoNBCFunc.makeDirectory(sourceObj.audiomediapath);
	
	//this is a temporary fix until we get permssions sorted
	//run("/bin/chmod", 777, "-R", sourceObj.videomediapath);
	//run("/bin/chmod", 777, "-R", sourceObj.audiomediapath);

	print("Vantage Source: " + sourceObj.stagingmediapathandfile);
	print("Vantage Video Output Destination: " + sourceObj.videomediapath);
	print("Vantage Audio Output Destination: " + sourceObj.audiomediapath);

	// Turn the source desitnation into somethign that Vanatgae can read
	var vantageSrcObj = new gmoNBCFunc.usefulFileObj(sourceObj.stagingmediapathandfile);
	var vantageDstObjVideo = new gmoNBCFunc.usefulFileObj(sourceObj.videomediapath);
	var vantageDstObjAduio = new gmoNBCFunc.usefulFileObj(sourceObj.audiomediapath);

	//we need to make the .dir directorys for where we are puttign ze file

	// set some details about the W.F.
	var vantageWFGMO = "GMO_OM_UPLOAD";//"GMO_INGEST_MOVE_AND_AUDIO_EXTRACTION"; // Temporarily changed for testing
	var vantageJobFactory = vantageLookup.getJobFactoryByWorkflow(vantageWFGMO);
	//var vantageJobFactory = NBCGMO.vantageSettings["defaultVantageJobFactoryName"];

	output(vantageDstObjVideo.win_file);
	// make the vantage object
	// pass in 2 destinations, one for audio one for video and audio
	var vantageObj = new gmoNBCVantageFunc.Standard_Vantage_Object();
	vantageObj.setOriginal(vantageSrcObj);
	vantageObj.setJobName(vantageWFGMO+"-"+sourceObj.safematid);
	vantageObj.setWorkflowName(vantageWFGMO);
	show(vantageObj);
	//vantageObj.setVar("destfilepath",vantageDstObjVideo.win_file);
	// commented out for now as we dont have the EC vantage WFs at the mo 
	vantageObj.setVar("mov_dest_filepath", vantageDstObjVideo.win_file);
	vantageObj.setVar("audio_dest_filepath", vantageDstObjAduio.win_file);
	vantageObj.setVar("output_filename", sourceObj.safematid);
	vantageObj.setVar("Audio Channels", gmoNBCFunc.totalNumberOfAudioChannelsOnTrack(sourceObj.stagingtrackxml));
	print("\n");
	show(vantageObj);

	// for progress
	var jobObject = {
		"jobId" : _jobId,
		"startPercent" : 15,
		"endPercent" : 50
	};

	// lets comment this ouit and fake the last bit of the script
	// Run the vantage job using the object
	var vantageResult = gmoNBCVantageFunc.makeAndRunTranscodeJob(vantageObj);
	if (vantageResult == true) {
		print("\nSuccessfully Transcoded ["+sourceObj.videomediapathandfile+"]");
	} else {
		throw new Error("Vantage Transcode Failed with Error [" + vantageResult + "].");
	}
	
	// adding a sleep so i have time to add the file etension so we can getround vantage issues for now 
	sleep(30);

	// bob sugests we add some sort of poling in of the file size after vantage. he has seen it before where it says its finished but hasnt actually completed the file
	// we should do something like silze size wait check file size equals file size
	
	// should we check for both the video and the audio.
	// should we check for each audio - in that case we need to assess whats going in in the first place and what we expect to get back out.
	if(!fileExists(sourceObj.videomediapathandfile)){
		throw new Error("File has not been received from Vantage ");
	}else{
		output("Video file has been successsfully copied out of vantage")
	};

	jobDashboard.updateStatusAndProgress("Checking file has settled",50);

	var file = new File(sourceObj.videomediapathandfile);

	var fileSize = file.length();
	var fileSize2 = file.length();

	while(fileSize !== fileSize2){
		output("File still being created");
		sleep(10);
		var fileSize2 = sourceObj.videomediapathandfile.length();
	}
	// Extract TimeCodes / Frame Rates from File
	print("\nExamining Essence for Incode/Outcode/Duration");
	sourceObj.mediainfohelper = new MediaInfoHelper();
	sourceObj.mediainfohelper.setMediaInfoXml(sourceObj.mediainfoxml);
	sourceObj.timecodedata = gmoNBCFunc.getMovTimeCodes(sourceObj.videomediapathandfile,sourceObj.mediainfohelper.getFrameRate());
	sourceObj.timecodedata.frame_rate = sourceObj.mediainfohelper.getFrameRate();

	print("\nIncode ["+sourceObj.timecodedata.incode+"]");
	print("\nDuration ["+sourceObj.timecodedata.duration+"]");
	print("\nOutcode ["+sourceObj.timecodedata.outcode+"]");
	print("\nTimeCode Stream Index ["+sourceObj.timecodedata.tcindex+"]");
	print("\nFrame Rate ["+sourceObj.timecodedata.frame_rate+"]");


	// if we dont do a transcode then we will already know the media
	if(transcodeEnabled){
		// lets do a media info on the output file

		gmoNBCFunc.getFileInfoXml(sourceObj.videomediapathandfile);

		var formType = NBCGMO.formTypeLookup[sourceObj.materialtype];
		var format; // formulated from mediainfo
		var codec; // do a mediainfo
		var frameRate; //do a media info

		sourceObj.videomedia = formType + format + codec + frameRate;

		// will need to be able to move to the correct place prob be ssh copy as going between isilon and dvs
	}

	// Save an Unencoded Audio Track
 	var unencodedAudioStoreTrack = gmoNBCFunc.complexUnencodedTrackSave(
 		sourceObj.matid, // Material Id
 		sourceObj.audiomedia,  // Media Name
 		sourceObj.timecodedata.frame_rate, // Frame Rate
 		sourceObj.timecodedata.incode, // Incode
 		sourceObj.timecodedata.outcode 	// Outcode
 	);
 	print("\nUnencoded Audio Track ["+unencodedAudioStoreTrack+"]");

	// save a track on its main media
	// Unencoded Storage Track
	jobDashboard.updateStatusAndProgress("Saving Encoded Storage Track",55);
	var unencodedStorageTrack = gmoNBCFunc.complexUnencodedTrackSave(
		sourceObj.matid,                    		// MatId
		sourceObj.videomedia,             		// Media Name
		sourceObj.timecodedata.frame_rate,  	// Frame Rate
		sourceObj.timecodedata.incode,      	// Incode
		sourceObj.timecodedata.outcode      	// Outcode
	);
	print("\nUnencoded Storage Track ["+unencodedStorageTrack+"]");

 	// Encoded Storage Track
	jobDashboard.updateStatusAndProgress("Saving Unencoded Storage Track",60);
	
	var materialXML = materialGet(sourceObj.matid,"tracks");
	var sourceTrackTypes = <TrackTypes></TrackTypes>;
	sourceTracks = new XMLList();
	track = materialXML..Track.(MediaName.toString()== sourceObj.stagingmedia);
	for each (var td in track.TrackDefinition){
		 sourceTracks += <TrackType>
				<TrackTypeName>{td.TrackTypeName.toString()}</TrackTypeName>
				<Channels>{td.Channels.toString()}</Channels>
			</TrackType>;
	}
	sourceTrackTypes.TrackTypes = sourceTracks;
	
	if(debug) print(sourceTracks);
	var encodedStorageTrack =  gmoNBCFunc.complexEncodedTrackSave(
		sourceObj.matid,                    		// MatId
		sourceObj.videomedia,          		// Media Name
		sourceObj.timecodedata.frame_rate,  	// Frame Rate
		sourceObj.timecodedata.incode,      	// Incode
		sourceObj.timecodedata.outcode,     	// Outcode
		sourceObj.videomediapathandfile,  	// Path to Src File
		sourceObj.mediatortracktypes,      	// Track Types
		sourceObj.profile,              // Profile
		sourceTrackTypes
	);
	print("\nEncoded Storage Track ["+encodedStorageTrack+"]");

	var materialDurationUpdate = gmoNBCFunc.updateMaterialDuration(
		sourceObj.matid,                   			// MatId
		sourceObj.timecodedata.duration,		// Duration
		sourceObj.timecodedata.frame_rate 	// Frame Rate
	);
	print("\nMaterial Duration Update ["+materialDurationUpdate+"]");

 	//need to get the audio track type names saved on the material

 	// Current Vantage Workflow also creates seperate discrete audios. Need to create two Channel Wavs from each paris or single wavs
	jobDashboard.updateStatusAndProgress("Creating Stereo WAV Pairs",65);
	print("\nAttemping to create two channel wavs from discrete wavs");
	// List Discrete Wavs
	var discreteWavs = gmoNBCVantageFunc.listAndSortSingleVantageWavs(sourceObj.audiomediapath,sourceObj.safematid);
	// Create Two Channel Wavs
	var twoChannelWavs = gmoNBCVantageFunc.createTwoChannelWavsFromSingles(sourceObj.matid,discreteWavs,sourceObj.safematid,sourceObj.audiomediapath,sourceObj.mediatortracktypes,sourceObj.videomedia);

	// Save Encoded Audio Track
	var encodedAudioStoreTrack = gmoNBCFunc.complexAudioEncodedTrackSave(
		sourceObj.matid,
		sourceObj.audiomedia,
		sourceObj.timecodedata.frame_rate,
		sourceObj.timecodedata.incode,
		sourceObj.timecodedata.outcode,
		twoChannelWavs
	);
	
	// Work Around for Silence - remove when done
	print("Update Material to have silence."); 
	var silenceTrackType = "MOS";
	var materialContainsSilence = makeMaterialSilenceCompatible(sourceObj.matid,sourceObj.audiomedia,silenceTrackType,states.processingState);
	


	// Transistion Track Types to QC Required or Cpation Extraction
	if(captionExtraction){
		jobDashboard.updateStatusAndProgress("Transitioning to " + requirements.toCaptionExtraction,95);
		gmoNBCFunc.transitionMaterial(sourceObj.matid, states.processingState, requirements.toCaptionExtraction)
	}else{
		var qcTrigger = getQCTrigger(priority,isStraightToArchive);
		jobDashboard.updateStatusAndProgress("Transitioning to " + qcTrigger,95);
		gmoNBCFunc.transitionMaterial(sourceObj.matid, states.processingState, qcTrigger);
	};

	jobDashboard.updateStatusAndProgress("Finished Script",100);
	quit(0);

}catch(e){
	print("Something went wrong: " + e);

	if (sourceObj.matid) {
		print("\nFAIL Transistioning Track Types to Vantage Failed");
		gmoNBCFunc.transitionMaterial(sourceObj.matid, states.processingState, requirements.toVantageFailed);
		gmoNBCFunc.addComment(sourceObj.matid, "Vantage", e.message);
		gmoNBCVantageFunc.cleanUpAudioFilesAndTracks(sourceObj.matid, sourceObj.audiomediapath, sourceObj.audiomedia);
	}
	jobDashboard.updateStatus("Job failed with errors.");
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});
	quit(1);
}
