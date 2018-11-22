// Java Packages
importPackage(Packages.com.pharos.foldermonitor); // gives us access to foldermonitor classes and "constants" (eg: WorkBundle.STATUS_FILE_REMOVED)
importPackage(Packages.com.pharos.poxclient); // gives us access to FileUtils etc
importPackage(Packages.com.pharos.moxb.containers);	// gives us access to TextList and Text classes
importPackage(Packages.com.pharos.subsystem.job); // gives us access to JobDescription class
importPackage(Packages.java.io); // gives us access to File class etc (if reqd)
importPackage(Packages.com.pharos.core.domain.job); // gives us access to custom Job Description

// Libraries
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/lib/js/shellfun.js");

// True Global Var
var debug = false;

// Attach Variables and Methods to object to stop global variable bleeding
var fldMonPromoUpload = {};

fldMonPromoUpload.promoUpload = "PromoUpload"
fldMonPromoUpload.uploadDir = lookup.dropfolder[fldMonPromoUpload.promoUpload].mount;
fldMonPromoUpload.failedDir = fldMonPromoUpload.uploadDir + "failed/FolderMonitor/";
fldMonPromoUpload.movExt = "mov"; // Currently only setup for Mov Videos. If more wrappers are reqired expand and have function work out the video extension etc.
fldMonPromoUpload.xmlExt = "xml"
fldMonPromoUpload.validExts  = [fldMonPromoUpload.movExt, fldMonPromoUpload.xmlExt];
fldMonPromoUpload.serverIP = lookup.system["login"].ip;
fldMonPromoUpload.user = "wsuser";
fldMonPromoUpload.pass = "wspass";
/* var serverIP = "localhost";
var user = "wsuser";
var pass = "wspass"; */
fldMonPromoUpload.videoTrackType = "Video";
fldMonPromoUpload.notAvailable = "Not available";
fldMonPromoUpload.stateMachine = "NBC GMO"
fldMonPromoUpload.gmoOwner = "NBCU GMO";
fldMonPromoUpload.reqToOrderPlaced = "Order Placed";
fldMonPromoUpload.originalFileNameShortText = "Original File Name";
fldMonPromoUpload.jobDescProps = {
	path : "Path",
	files : "Files",
	matId : "FolderMonitorMatId"
}

// Function to save new Material
// @param [object - from gmoFun Material Helper] (materialHelper) 
// @return [boolean] - indicating whether the Material Saved correctly
fldMonPromoUpload.saveNewMaterial = function(materialHelper, vidFile) {

	logger.info("");
	logger.info("Registering Material [" +  materialHelper.matId + "]");
	
	// Add Relevant Information to Save
	materialHelper.addTrackTypeLink(this.videoTrackType, this.notAvailable, this.stateMachine); 
	materialHelper.addShortTextToSaveXml(this.originalFileNameShortText, vidFile);
	materialHelper.addOwnerToSaveXml(this.gmoOwner);
	
	return materialHelper.saveUsingSaveXml();

}

// Function to check wheteher an Existing Record is suitable to upload against
// @param [object - from gmoFun Material Helper] (materialHelper) 
// @return [boolean] - indicating whether the Material can be uploaded against
// @error - if Materail has Tracks
fldMonPromoUpload.checkUploadEligibility = function(materialHelper) {
	
	logger.info("")
	logger.info("Material [" + materialHelper.matId + "] registed in Mediator. Checking Upload eligibility");
	
	var hasTracks = materialHelper.getTrackList().length() > 0;
	if (hasTracks) {
		throw new Error("Material [" + materialHelper.matId + "] contains Tracks. Cannot Upload");
	}
	
	var videoTTLState =  materialHelper.getStateOfTtl(this.videoTrackType);
	if (videoTTLState !== this.notAvailable) {
		throw new Error("Track Type [" + this.videoTrackType + "] is [" + videoTTLState + "] It must be [" + this.notAvailable + "] to upload");
	}
	
	return true;
	
}

// Function to print a string in an obvious manner
// @param [string] (str) - Error to log to screen
// **Optional** @param[heading] - Heading to display for messsage. Will default to "Error" if argument is not present
fldMonPromoUpload.printObnoxiously = function(str,heading){
	
	var heading = heading === undefined ? "Error" : heading;
	logger.info("")
	logger.info("####################################### " + heading + " #######################################");
	logger.info("");
	logger.info(str);

}

// Note this is different to the standard setJobDescription
fldMonPromoUpload.assignJobDescriptionToWorkBundle = function(workBundle,matId) {
    logger.debug("In assignJobDescriptionToWorkBundle");
    // example: mimic what the default (non-skeleton) jobDescription code does
    if (workBundle.jobDescription == null ) {
        workBundle.jobDescription = new JobDescription();
    }
    // Add a list of the (non-removed) files
    var fileList = new TextList();
    var itf = workBundle.fileItemMap.values().iterator();
    // Create a List Of Files
    while (itf.hasNext()) {
        var itemInfo = itf.next();
        if (!itemInfo.getStatus().equals(WorkBundle.STATUS_FILE_REMOVED)) {
        	logger.info("\tAdding File to Job Description [" + itemInfo.filename + "]");
            fileList.add(new Text(itemInfo.filename));
        }
    }
    // Add the Path to the Job Description
    workBundle.jobDescription.setProperty(this.jobDescProps.path, workBundle.info.path);
    logger.info("\tSetting Job Description [" + this.jobDescProps.path + "] Property to [" + workBundle.info.path + "]");
	// Add the Mat Id to the Job Description
	logger.info("\tSetting Job Description [" + this.jobDescProps.matId + "] Property to [" + matId + "]");
	workBundle.jobDescription.setProperty(this.jobDescProps.matId, matId);
    // Add the file list property to object
	logger.info("\tAdding File List to Job Description");
    workBundle.jobDescription.setProperty(this.jobDescProps.files, fileList);
}

// Function to Move a File to the Failed Folder
// @param [string] - (file) - Name of File Relative to Upload Directory
// **Optional** @param [string] (identifier) - Name of the identifier. Will form part of the failed Path **Optional*
fldMonPromoUpload.failAndMove = function(file,identifier){
	
	var srcFile = this.uploadDir + file;
	var dstPath = identifier === undefined ? this.failedDir + this.failedDir : this.failedDir + identifier + "/";
	
	if (fileExists(srcFile)) {
		if (!fileExists(dstPath)) makedir(dstPath);
		this.printObnoxiously("Moving [" + srcFile + "] to [" + dstPath + "]","File Move to Failed Directory");
	    move(srcFile,dstPath);
	} else {
		this.printObnoxiously("Cannot Move File to Failed Directory. Src [" + srcFile +"] does not exist. Manual Intervention Required","File Move to Failed Directory");
	}
}

// 
// Mediator Methods
//

function makeIdentifierFromFile(monitoredFolder, path, filename, workBundleMap){
	
	logger.info("");
	fldMonPromoUpload.printObnoxiously("Making Identifier From File","New File Arrival");
	logger.info("monitoredFolder " + String(monitoredFolder));
	logger.info("path " + String(path));
	logger.info("filename " + String(filename));
	logger.info("workBundleMap " + String(workBundleMap));

	var indentifier = "";
	logger.info("Examining File [" + String(filename) + "]");
	var ext  = String(filename.substr(filename.indexOf(".")+1));
	var name = String(filename.substr(0,filename.indexOf(".")));
	logger.debug("ext  [" + ext + "]");
	logger.debug("name [" + name + "]");

	//Check the Extension is valid
	if(fldMonPromoUpload.validExts.indexOf(ext) === -1){
		fldMonPromoUpload.printObnoxiously("Extension [" + ext + "] is not valid returning an ident");
		fldMonPromoUpload.failAndMove(filename);
		return "";
	}else{
		logger.info("Extension [" + ext + "] is valid continuing");
	} 

	// Return True Identifier
	identifier = name;
	logger.info("");
	fldMonPromoUpload.printObnoxiously("Using Identifier [" + identifier + "]","Identifier Creation");
	logger.info("");

	return identifier;
} 




function isWorkBundleReady(workBundle) {
	
	var hasMov = false;
	var hasXml = false;
	logger.info("");
	
	// Loop through files in WorkBundle and Check an Mov and Xml exist
	var itf = workBundle.fileItemMap.values().iterator();

	while (itf.hasNext()) {
		
		var itemInfo = itf.next();
		logger.info("FileName [" + String(itemInfo.filename) + "]");
		logger.info("WorkBundle [" + String(workBundle) + "]");
		
		// Be sure to test we're only looking at files that haven't been "removed"
		if (!itemInfo.getStatus().equals(WorkBundle.STATUS_FILE_REMOVED) ) {
			var filename = String(itemInfo.filename);
			if (filename) {
				var ext  = filename.substr(filename.indexOf(".")+1);
				var name = filename.substr(0,filename.indexOf("."));
				if(ext === fldMonPromoUpload.movExt) hasMov = true; 
				if(ext === fldMonPromoUpload.xmlExt) hasXml = true;
				logger.debug("\nDEBUG: \n FileName [" + String(filename) + "] Name [" + name + "] Extension [" + ext + "] \n");
            }
		} 
	}
	
	logger.info("Indentifier [" + filename + "] Contains Mov [" + hasMov + "] Contains Xml [" + hasXml + "]");
		
	if (hasMov == false  || hasXml == false) {
		logger.info("WorkBundle not yet ready. Will reevaluate later");
		return false;
	}
	
	try {
		
		logger.info("");
		logger.info("Logging into Web Server");
		wsLogin(fldMonPromoUpload.serverIP, fldMonPromoUpload.user, fldMonPromoUpload.pass);
		
		var baseFileName = String(workBundle.identifier);
		var xmlFile = baseFileName + "." + fldMonPromoUpload.xmlExt;
		var vidFile = baseFileName + "." + fldMonPromoUpload.movExt;
			
		// Check have occured let`s use WorkBundle Identifier as MatId
		var matId = gmoNBCFunc.generatePromoMatId();
		var materialHelper = new gmoNBCFunc.materialHelper(matId);
		var jobSubmitted = false;
		
		// Run Checks on existing Material to check upload suitability - this currerntly won`t occur as Material is being generated in script
		if (materialHelper.materialExists()) {
			
			var shellEligibleForUpload = fldMonPromoUpload.checkUploadEligibility(materialHelper);
			if (shellEligibleForUpload === false) throw new Error("Cannot upload against Shell [" + matId + "]");
			
		} else {
			
			var materialRecordSaved = fldMonPromoUpload.saveNewMaterial(materialHelper, vidFile); // Add in Xml here if desired. Currently used in Upload Script
			if (materialRecordSaved == false) throw new Error("Failed to Save new Material Shell for [" + matId + "]");
			
		}
			
		// Transition Track Type Link		
		gmoNBCFunc.transitionTrackTypes(matId, fldMonPromoUpload.reqToOrderPlaced, fldMonPromoUpload.videoTrackType);
		
		// Assign Job Description function
		fldMonPromoUpload.assignJobDescriptionToWorkBundle(workBundle, matId);
		logger.info("");
		logger.info("Submitting Job Description");
		jobSubmitted = true;
			
	} catch(e) {
		
		fldMonPromoUpload.printObnoxiously(e);
		fldMonPromoUpload.failAndMove(xmlFile, baseFileName);
		fldMonPromoUpload.failAndMove(vidFile, baseFileName);	
	
	} finally {
		logger.info("");
		logger.info("Logging Out");
		wsLogout();	
		logger.info("");
		logger.info("Returning [" + jobSubmitted + "] for Identifier [" + matId + "]");
		return jobSubmitted;
	}
	
}