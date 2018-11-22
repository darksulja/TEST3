/*
* @Author: Arturo Esquivel
* @Date:   2017-05-17 02:03:10
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-06-08 00:37:12
*/

importPackage(Packages.com.pharos.foldermonitor);		// Gives us access to foldermonitor classes and "constants" (eg: WorkBundle.STATUS_FILE_REMOVED)
importPackage(Packages.com.pharos.poxclient);			// Gives us access to FileUtils etc
importPackage(Packages.com.pharos.moxb.containers);		// Gives us access to TextList and Text classes
importPackage(Packages.com.pharos.subsystem.job);		// Gives us access to JobDescription class
importPackage(Packages.java.io);						// Gives us access to File class etc (if reqd)
importPackage(Packages.com.pharos.core.domain.job); 

load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/FolderMonitorHelper.js");

const VALID_EXTENSIONS = ["mov","mp4","mxf"];

/**
 * [makeIdentifierFromFile description]
 * @param  [String] monitoredFolder 
 * @param  [String] path            
 * @param  [String] filename        
 * @param  [map] workBundleMap   
 * @return [String]                 
 */
function makeIdentifierFromFile(monitoredFolder, path, filename, workBundleMap) {
	logger.info("");
	logger.info("makeIdentifierFromFile()");	
	var uFile = new gmoNBCFunc.usefulFileObj(String(path) + "/" + String(filename));
	var fmh = new FolderMonitorHelper();
	fmh.setFile(uFile);
	fmh.setExtensionTypes(VALID_EXTENSIONS);
	fmh.setIdentifier();
	return fmh.getIdentifier();
}


/**
 * isWorkBundleReady
 * @param [Object] - workBundle
 *
**/
function isWorkBundleReady(/*WorkBundle*/ workBundle) {
	try {
		logger.info("");
		logger.info("isWorkBundleReady()");
        wsLogin(lookup.system["login"].ip,"wsuser","wspass");

		var sFilename = String(workBundle.fileItemMap.values().iterator().next().filename);
		var sPath = workBundle.info.path + "/";
		var sFileObj = new gmoNBCFunc.usefulFileObj(sPath + sFilename);
		var bActionWorkbundle = false;
		var fmh = new FolderMonitorHelper();
		fmh.setFile(sFileObj);

		// File not 0 bytes check
		if(fmh.getFile().filesize == 0){
			logger.info("\tSkipping Upload [" + sFilename + "] is 0 bytes in size.");
			return false;
		}

		if(fmh.isWorkingFile()){
			logger.info("\tSkipping Upload [" + sFilename + "] as it is considered a working file and not suitable for ingest.");
			return false;
		}
		
		// Build a Job Description and exit successfully
		logger.info("Creating Job Description for Identifier [" + String(workBundle.identifier) + "]");
		assignJobDescriptionToWorkBundle(workBundle);
		bActionWorkbundle = true;
	} catch (e) {
		logger.info(e);
		return false;
	} finally { 
		logger.info("");
		wsLogout();
		return bActionWorkbundle;
	}
}

function assignJobDescriptionToWorkBundle(workBundle) {
    logger.debug("In assignJobDescriptionToWorkBundle");
    // example: mimic what the default (non-skeleton) jobDescription code does
    if (workBundle.jobDescription == null ) {
        workBundle.jobDescription = new JobDescription();
    }
	
	var sFilename = String(workBundle.fileItemMap.values().iterator().next().filename);
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
}