load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
output("Running run_checkPlacingAwaitingComponents.js");

try {
	
	var states = {
		awaitingComponents : "Awaiting Components"
	};

	var requirements = {
		reInitiateHidden : "Reinitiate (Hidden)"
	};
	
	var shortTextTypeTVDProduction = "TVD Production #";
	
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);
	
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);
	
	// Get Material ID from Job Description.
	var materialId = jobDescription.Properties.Mapping.domainKey.toString();
	
	var materialXML = materialGet(materialId,"shorttext")..Material;
	
	var tvdProductionNumber = materialXML.ShortTextList.ShortText.(shortTextTypeTVDProduction === ShortTextType.toString()).Value.toString();

	var results = gmoNBCNLDFunc.searchPlacingByDataElement(shortTextTypeTVDProduction,tvdProductionNumber,states.awaitingComponents);
	if(results.PagedResults.Count>=1) {
		var placings = results..PLACING__ID;
		for each (var placing in placings) {
			print("State is Awaiting Components - Re Triggering Profile Allocation for Placing ["+placing+"]");
			try{
				gmoNBCNLDFunc.transitionPlacing(placing.toString(),states.awaitingComponents,requirements.reInitiateHidden);
			} catch(e) {
				print("State Transition Failed for Placing ["+placing+"] " + e.message);
			}
		}
	}
	
	//T2 Archive 
	
	// validateAndInitiateT2Archive(materialId);

	jobDashboard.updateStatusAndProgress("Finished Running Script Successfully", 100);
} catch(e) {
	print("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});	
	quit(1);
}

function validateAndInitiateT2Archive (matId) {
	
	var archiveMedias = [
		'T2_2398_LF_HD_PRORES',
		'T2_2398_SF_HD_PRORES',
		'T2_2398_LF_SD_PRORES',
		'T2_2398_SF_SD_PRORES',
		'T2_DF30_LF_HD_PRORES',
		'T2_DF30_SF_HD_PRORES',
		'T2_DF30_LF_SD_PRORES',
		'T2_DF30_SF_SD_PRORES'
	];

	var materialXML = materialGet(matId, 'trackTypeLinks','tracks','history');

	print("Generating Archive Request");

	if (materialXML..StateHistoryGroup[0].FromState.toString() != "Edit Metadata") {

		var storeMedia = "";
		var archiveMedia = "";
		for each (var track in materialXML..Track) {
			var media = track.MediaName.toString();

			if (gmoNBCFunc.contains(NBCGMO.storeMedias, media)) {

				storeMedia = media;
				print("Store Media is ["+media+"]");

				if(isTrackReadyForArchive(track,materialXML)){

					print("All Track Types are in Archivable State ");
					archiveMedia = "T2_" + storeMedia; 
					print("Archive Media is ["+archiveMedia+"]");
					print("Checking if a Track already exists on ["+archiveMedia+"]");
					var archiveTrack = materialXML..Track.(MediaName == archiveMedia).toString();
					
					if(archiveTrack==""){
						print("No Archive Track Exists - Lets Archive ");
						if(gmoNBCFunc.contains(archiveMedias, archiveMedia)){
							var requestId = makeTransferRequest(matId, archiveMedia, 60);
							print("Transfer Request ID is ["+requestId+"]");
							sleep(5);
						}else {
							print("Archive media ["+archiveMedia+"] is not enabled for archive");
						}
					} else {
						print("Archive Track already Exists - Skipping Archive ");
					}

				}  else {
					print("Track Types are not in a Archivable state ");
				}

			} else {
				print("Media ["+media+"] is not a store Media");
			}
		}

	} else {

		print("Skip Archive - This transistion is from Edit Metadata");
	}

}


function isTrackReadyForArchive(track,materialXML){
	
	var isVideoTrack = false;
	var isReadyForArchive = false;
	var archivableStateArray = ["Ready"];

	for each(var trackTypes in track..TrackType)	{
		for each(var trackType in trackTypes){
			var trackTypeName = trackType.Name.toString();
			state = materialXML..TrackTypeLink.(TrackTypeName == trackTypeName).StateName.toString();
			print("["+trackTypeName+"] -> ["+state+"]");
			if(trackTypeName == 'Video') {
				isVideoTrack = true;
				print("trackTypeName is Video - Breaking Inner For Loop")
				break;
			}
			if(!gmoNBCFunc.contains(archivableStateArray, state)) break;
		}
		if (isVideoTrack || !gmoNBCFunc.contains(archivableStateArray, state)){
		    print("trackTypeName is Video Or ["+trackTypeName+"] is in ["+state+"] - Breaking Outer For Loop");
			break;
		}
	}

	if(gmoNBCFunc.contains(archivableStateArray, state)){
		isReadyForArchive = true;
	}
	return isReadyForArchive;
}
