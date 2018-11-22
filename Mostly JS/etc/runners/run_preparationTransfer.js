load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/helpers/ErrorHandlerHelper.js");

var debug = false;

try {
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);
	
	// Key used for NLD settings in lookup.js regarding working directories.
	var vodWorking = "NLD_WORKING_DIR"
	
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);
		
	// Get required values from Job Description.
	var 	placingId = jobDescription.Properties.Mapping.domainKey.toString();
		
	// Get the placing details, include everything so we don't need to add things later.
	var placingXml = placingGet(placingId, "material", "fulltext", "shorttext", "tag", "destination", "parcel", "parcelMaterial", "profileStatus")..Output.Placing;
	print("PlacingXml: " + placingXml);
		
	print(
		"Placing Id [" + placingId + "] \n"
	);
			
	jobDashboard.updateStatusAndProgress("Gathering Placing Details/Settings",10);
	
	// Get staging information and generic job information.
	var stagingMedia = placingXml..StagingMediaName.toString();
	var pubDefName = placingXml.PlacingPublicationList.PlacingPublication.PublicationDefinition.Name.toString();
	
	print("\n" +
		"Staging Media [" + stagingMedia + "] \n" +
		"Publication Definition Name [" + pubDefName + "] \n"
	);
	
	for each (var eventXml in placingXml.PlacingParcelList.PlacingParcel.Parcel.ParcelEventList.Event){
		var trimMatId = eventXml.TrimMaterialId.toString();
		var materialXml = materialGet(trimMatId, "tracks");
		
		// Working out the valid media's we need.
		for each (var track in materialXml..Track){
			var mediaName = track..MediaName.toString();
			output("Checking if [" + mediaName + "] is valid to be used with Venice.");
			if (NBCGMO.validQCmedias.indexOf(mediaName) >= 0){
				output("Media [" + mediaName + "] is a valid media.")
				
				var extension = track.FileExtension.toString();
				var fileId = track.FileId.toString();
				
				var mediaPath = lookup.media[mediaName].mount; 
				//var veniceProfile = lookup.media[mediaName].venicesettings; // This was not being used so it's been commented out. This was not even being used at the hub...
				
				// Dynamically work if we need to use MatId Directories.
				if (lookup.media[mediaName].usesMatIdDir){
					var sourceFileObj = new gmoNBCFunc.usefulFileObj(mediaPath + "/" + trimMatId + ".dir/" + fileId + "." + extension);
				} else {				
					var sourceFileObj = new gmoNBCFunc.usefulFileObj(mediaPath + "/" + fileId + "." + extension);
				}
				break;			
			}
		}	
		
		var destPath = lookup.media[stagingMedia].mount;
		if (lookup.media[stagingMedia].usesMatIdDir){
			var destFileObj = new gmoNBCFunc.usefulFileObj(destPath + trimMatId + ".dir/" + sourceFileObj.filename);
			makedir(destFileObj.unix_path);
		} else {				
			var destFileObj = new gmoNBCFunc.usefulFileObj(destPath + sourceFileObj.filename);
		}
				
		output("Copying file [" + sourceFileObj.unix_file + "] to [" + destFileObj.unix_file + "]");
		copy(sourceFileObj.unix_file, destFileObj.unix_file);
		
		if (destFileObj.exists()){
			output("Transfer was successful.");
			// Updating dest file object to update filesize value.
			destFileObj = new gmoNBCFunc.usefulFileObj(destPath + sourceFileObj.filename);
		}
		
		var xml = 
			<Material>
				<MatId/>
				<Track>
					<MediaName/>
					<FrameRate/>
					<FileId/>
					<FileExtension/>
					<FileBytes/>
					<Encoded/>
				</Track>	
			</Material>;

		xml.MatId				= trimMatId;
		xml.Track.MediaName	= stagingMedia;
		xml.Track.FrameRate	= materialXml..Output.Material.FrameRate.toString();
		xml.Track.FileId 		= destFileObj.basename;
		xml.Track.FileExtension = destFileObj.extension;
		xml.Track.FileBytes    	= destFileObj.filesize;
		xml.Track.Encoded    	= true;
		
		output(xml);
		materialSave(xml);
	}
	
	jobDashboard.updateStatusAndProgress("Finishing Script",100);
		
	quit(0);
	
} catch(e){
	output("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message})
	
	if (fileExists(destFileObj.unix_file)){
		output("Destination file exists, cleaning up files/folder for this state [" + destFileObj.unix_file + "].");
		remove(destFileObj.unix_file);		
	} else {
		output("No destination file exists, nothing to cleanup.");
	}
	var ehh = new ErrorHandlerHelper("Transfer",placingId,"Placing");
	if (gmoNBCFunc.isVarUsable(e.code)) {
		errorMsg = ehh.getError(e.code, e.parameters).message;
		output("Error caught in Transfer: Error Code ["+e.code+"] Message ["+errorMsg+"]");
	} else {
		errorMsg = e.message;
		output("An error has occurred: " + errorMsg);
	}
	ehh.saveNote(errorMsg);	
	quit(1);
}