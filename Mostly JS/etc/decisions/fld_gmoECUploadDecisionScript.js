// Java Packages
importPackage(Packages.com.pharos.foldermonitor);		// gives us access to foldermonitor classes and "constants" (eg: WorkBundle.STATUS_FILE_REMOVED)
importPackage(Packages.com.pharos.poxclient);			// gives us access to FileUtils etc
importPackage(Packages.com.pharos.moxb.containers);		// gives us access to TextList and Text classes
importPackage(Packages.com.pharos.subsystem.job);		// gives us access to JobDescription class
importPackage(Packages.java.io);						// gives us access to File class etc (if reqd)
importPackage(Packages.com.pharos.core.domain.job);     

// Libraries
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/lib/js/shellfun.js");
load("/opt/evertz/mediator/etc/runners/ProfileHelper.js");	

//Setting for troubleshooting
var debug = false;
// Global Vars
var movExt = "mov";
var xmlExt = "xml"
var validExts  = ["mov","xml","aspx","partial","mov.aspx","mov.partial"];
var serverIP = lookup.system["login"].ip;
var user = "wsuser";
var pass = "wspass";

var tagTypeDropFolder = "Drop Folder";
var tagValueDropFolder = "FROM_EC_MEDIATOR";
var uploadDir = lookup.dropfolder[tagValueDropFolder].mount;
var failedDir =  uploadDir + "/failed/FolderMonitor/";
var defaultFailSubDir = "UnknownMatId/";

///////////////////////////////////////////////////////  Start of User Defined Functions ////////////////////////////////////////////////////////////////////////
// Function to Move a File to the Failed Folder
// @param [string] - (file) - Name of File Relative to Upload Directory
function failAndMove(file,matId){
	var srcFile = uploadDir  + file;
	var dstPath = matId === undefined ? failedDir + defaultFailSubDir : failedDir + matId + "/";
	if (fileExists(srcFile)) {
		if (!fileExists(dstPath)) makedir(dstPath);
		printObnoxiously("Moving [" + srcFile + "] to [" + dstPath + "]","File Move to Failed Directory","File Move to Failed Directory");
	    move(srcFile,dstPath);
	} else {
		printObnoxiously("Cannot Move File to Failed Directory. Src [" + srcFile + "] does not exist. Manual Intervention Required","File Move to Failed Directory");
	}
}


// Function to print a string in an obvious manner
// @param [string] (str) - Error to log to screen
// **Optional** @param[heading] - Heading to display for messsage. Will default to "Error" if argument is not present
function printObnoxiously(str,heading){
	var heading = heading === undefined ? "Error" : heading;
	logger.info("")
	logger.info("####################################### "+heading+" #######################################");
	logger.info("");
	logger.info(str);
}


// Note this is different to the standard setJobDescription
function assignJobDescriptionToWorkBundle(workBundle,materialID,importCreatedByFolderMon,isComponentUpload) {
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
        	logger.info("\tAdding File to Job Description ["+itemInfo.filename+"]");
            fileList.add(new Text(itemInfo.filename) );
        }
    }
    // Add the Path to the Job Description
    workBundle.jobDescription.setProperty("Path", workBundle.info.path);
    logger.info("\tSetting Job Description Path Property to ["+workBundle.info.path+"]")
    // Add the file list property to object
    workBundle.jobDescription.setProperty("Files", fileList);
    // Add the Material Id to be used
    workBundle.jobDescription.setProperty("FolderMonitorMatId",materialID);
    logger.info("\tSetting Job Description FolderMonitorMatId Property to ["+materialID+"]");
    // Whether a Shell was created in Runner
    workBundle.jobDescription.setProperty("ImportCreatedByFolderMon",importCreatedByFolderMon);
    logger.info("\tSetting Job Description ImportCreatedByFolderMon to ["+importCreatedByFolderMon+"]");

    workBundle.jobDescription.setProperty("IsComponentUpload",isComponentUpload);
    logger.info("\tSetting Job Description IsComponentUpload to ["+isComponentUpload+"]");

}
//////////////////////////////////////////////////////////////  End of User Defined Functions              //////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////  Start of Standard Folder Monitor Functions //////////////////////////////////////////////////////////
function makeIdentifierFromFile(monitoredFolder, path, filename, workBundleMap){
	logger.info("");
	printObnoxiously("Making Identifier From File","New File Arrival");
	logger.info("monitoredFolder " + String(monitoredFolder));
	logger.info("path " + String(path));
	logger.info("filename " + String(filename));
	//logger.info("workBundleMap " + String(workBundleMap));

	var indentifier = "";
	logger.info("Examining File ["+String(filename)+"]");
	var ext  = String(filename.substr(filename.indexOf(".")+1));
	var name = String(filename.substr(0,filename.indexOf(".")));
	logger.debug("ext  ["+ext+"]");
	logger.debug("name ["+name+"]");

	// Return True Identifier
	identifier = name;
	logger.info("");
	printObnoxiously("Using Identifier ["+identifier+"]","Identifier Creation");
	logger.info("");

	return identifier;
}

function isWorkBundleReady(workBundle) {
	logger.debug("Logging into Server [" + serverIP + "]");
	wsLogin(serverIP,user,pass);
	logger.info("");
	printObnoxiously("Checking if WorkBundle with Identifier [" + String(workBundle.identifier) + "] is ready?","WorkBundle Analysis");
	var hasMov = false;
	var hasXml = false;
	var matId = "";

	// Loop through files in WorkBundle and Check an Mov and Xml exist
	var itf = workBundle.fileItemMap.values().iterator();

	while (itf.hasNext()) {
		var itemInfo = itf.next();
		logger.info("FileName   " + String(itemInfo.filename));
		logger.info("WorkBundle " + String(workBundle));

		// Be sure to test we're only looking at files that haven't been "removed"
		if (!itemInfo.getStatus().equals(WorkBundle.STATUS_FILE_REMOVED) ) {
			var filename = itemInfo.filename;
			if (filename != null) {
				var ext  = String(filename.substr(filename.indexOf(".")+1));
				var name = String(filename.substr(0,filename.indexOf(".")));
				if(ext == movExt) hasMov = true; 
				if(ext == xmlExt) hasXml = true;
				logger.debug("\nDEBUG: \n FileName ["+String(filename)+"] Name ["+name+"] Extension ["+ext+"] \n");

				//set upload dir to appropriate directory
				//TODO possibly get mat id from inside sidcar instead
				matId = name;
				printObnoxiously("The extracted Material Id for this workbundle is " +matId,"Extracted ID");
            }
		} 
	}
	logger.info("Indentifier [" + String(workBundle.identifier) + "] Contains Mov [" + hasMov + "] Contains Xml [" + hasXml + "]");

    // Decide whether to continue based upon the presence of a Mov and Xml in the WorkBundle
	if(hasMov && hasXml) {
		try{
			var workBundleArr = String(workBundle.info.path).split("/");
			uploadDir = lookup.dropfolder[tagValueDropFolder].mount + matId + ".dir/";
			failedDir =  uploadDir + "/failed/FolderMonitor/";
			
     		logger.info("");
			logger.info("Creating Job Description for Identifier [" + String(workBundle.identifier) + "]");
			assignJobDescriptionToWorkBundle(workBundle,matId,true,false);
			logger.info("Submitting Job WorkBundle is Ready");
			logger.info("");
			logger.debug("Logging Out");
			wsLogout(); // Ready to Submit Logout
			logger.info
			return true;

		} catch(e) {
			// Add in email Job here!
			printObnoxiously(e);
			failAndMove(String(workBundle.identifier)+"."+xmlExt,matId);
			failAndMove(String(workBundle.identifier)+"."+movExt,matId);
			logger.info("");
			logger.debug("Logging Out");
			wsLogout(); // Error has occured Logout
			return false;
		}

		// Should never get here	
		return false;

	} else if(!hasMov && isMaterialImportedFromEC(matId) && hasXml){
		logger.info("Material [" + matId + "] was completely imported previously. Checking folder for new components");
		var matHelper = new gmoNBCFunc.materialHelper(matId);

		var currDirectory = lookup.dropfolder[tagValueDropFolder].mount + matId + ".dir/";
		var xmlFilePath = currDirectory + matId +  "." + xmlExt;
		var sideCarXML = new XML(gmoNBCFunc.removeXmlHeader(FileUtils.readFile(xmlFilePath)));

		var excludeTracks = ["DC_MEDIATOR_X_MAIN","DC_MEDIATOR_X_AUDIO","DC_MEDIATOR_X_SUBTITLE","OM_STAGING","NLDStaging"];

		var componentFilePaths = [];
		var componentsFound = false;
 		var ph = new ProfileHelper();

		for each(var track in sideCarXML..Material.Tracks.Track){
			if(!gmoNBCFunc.contains(excludeTracks,track.MediaName.toString()) && track.DeleteMark.toString() == 0 && !gmoNBCFunc.startsWith(track.MediaName.toString(),'DIVA')){
				
				for (var i =0; i < track.TrackDefinition.length(); i++) {
					var trackTypeName = track.TrackDefinition[i].TrackTypeName.toString();
					var fileTag = ph.getTrackType(trackTypeName).FileTag.toString();
		 			var fileName = matId + "-" + fileTag + "." + track.FileExtension.toString();
		 			print("Looking for file [" + fileName + "]");
					var sourceFilePath = currDirectory + fileName;
					var componentFile = new File(sourceFilePath);

					if(componentFile.exists()){
						print("Found component file [" +String(componentFile.getAbsoluteFile()) + "]. Adding to workbundle for component upload.");
						componentsFound = true;
					}
				}
			}		
		}

		if(componentsFound){
    		logger.info("");
			logger.info("Creating Job Description for Identifier [" + String(workBundle.identifier) + "]");
			assignJobDescriptionToWorkBundle(workBundle,matId,true,true);
			logger.info("Submitting Job WorkBundle is Ready");
			logger.info("");
			logger.debug("Logging Out");
			wsLogout(); // Ready to Submit Logout
			logger.info
			return true;			
		}else{
			logger.info("WorkBundle not Ready yet will reevalute later");
			logger.debug("Logging Out");
			wsLogout(); // Logout
		}

		return false;
	}

	else{
		logger.info("");
		logger.info("WorkBundle not Ready yet will reevalute later");
		logger.info("");
		logger.debug("Logging Out");
		wsLogout(); // Logout
		return false;
	}
}

// We need to verify this material has already been imported or not
function isMaterialImportedFromEC(matId){
	var matHelper = new gmoNBCFunc.materialHelper(matId);

	if(matHelper == null || matHelper == "undefined" || !matHelper.materialExists()) return false;

	var materialXML = matHelper.getMaterialXml();
	var vidState = materialXML..TrackTypeLink.(TrackTypeName.toString() === "Video").StateName.toString();

	if(vidState != "Ready") return false;

	return true;
}
