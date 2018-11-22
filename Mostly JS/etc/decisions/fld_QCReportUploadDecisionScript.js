importPackage(Packages.com.pharos.foldermonitor);		// gives us access to foldermonitor classes and "constants" (eg: WorkBundle.STATUS_FILE_REMOVED)
importPackage(Packages.com.pharos.poxclient);			// gives us access to FileUtils etc
importPackage(Packages.com.pharos.moxb.containers);		// gives us access to TextList and Text classes
importPackage(Packages.com.pharos.subsystem.job);		// gives us access to JobDescription class
importPackage(Packages.java.io);						// gives us access to File class etc (if reqd)
importPackage(Packages.com.pharos.core.domain.job);     
importPackage(Packages.com.pharos.poxclient.baton);
load("/opt/evertz/mediator/etc/runners/nbcgmo_baton_fun.js");
//load("/usr/local/pharos/etc/scripts/nbcgmo_fun.js");
//load("/usr/local/pharos/bin/js/shellfun.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/FolderMonitorHelper.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/lib/js/shellfun.js");
if(typeof(LoadBalancer)==="undefined"){
    load("/opt/evertz/mediator/etc/runners/LoadBalancer.js");	
}
// Avoid logger not defined errors
importPackage(Packages.org.apache.log4j);
var logger;             // Interface to the log4J logger class


var debug = false;
var serverIP = lookup.system["login"].ip;
var user = "wsuser";
var pass = "wspass";
var thisMaterialHelper;
var QCReport = QCReport || {};
var dropFolderFileObj;
const MEDIA_RECEIVED_STATE = "Media Received";
const DOT = ".";
const HYPHEN = "-";
const STATE_MACHINE = "NBC GMO";
const ORIGINAL_FILENAME = "Original File Name";
const READY = "Ready";
// If these aren't failed
var failedDir =  "/failed/";
var completedDir = "/completed/";

//////////////////////////////////////////////////////////////  Start of Standard Folder Monitor Functions //////////////////////////////////////////////////////////
function makeIdentifierFromFile(monitoredFolder, path, filename, workBundleMap) {
	print("");
	printObnoxiously("Making Identifier From File","New File Arrival");
	print("monitoredFolder " + monitoredFolder);
	print("path " + path);
	print("filename " + filename);
    print("workBundleMap " + workBundleMap);
    // For some reason filename is undefined over in assignJobDescriptionToWorkBundle
    QCReport.filename = filename;

    if (!gmoNBCFunc.isVarUsable(filename))  {
        throw new Error("\nFailed to receive filename, cannot continue [" + filename + "]") 
    };
    var regex = /((?:GMO|UTS).*[\d]+_[\d]+)\.(pdf)/i;
    var found = filename.match(regex);
    print('after regex match')
    
    try {
        print("Logging into Server [" + lookup.system["login"].ip + "]");
        wsLogin(lookup.system["login"].ip,"wsuser","wspass");
        if (found == null) {
            throw new Error('No match found for GMO pattern in: [' + filename + ']')
        }

        print('Getting GMO and File Extension')
        var GMOMatch = found[1];
        var matchExt = found[2];
        
        if (!gmoNBCFunc.isVarUsable(GMOMatch))  {
            throw new Error("\nFailed to parse GMO/UTS Number, cannot continue") 
        };

        if (!gmoNBCFunc.isVarUsable(matchExt))  {  
            throw new Error("\nFailed to parse extension, cannot continue") 
        };

        if ( matchExt.toLowerCase() == "pdf") {
            print("Extension [" + matchExt + "] is valid continuing");
        } else {
            printObnoxiously("Extension [" + matchExt + "] is not valid - must be PDF or pdf - cannot continue");
            return "";
        }
        print("Found GMO Number: [" + GMOMatch + '] and Extension [' + matchExt + ']'  );

        var materialXml =  materialGet(GMOMatch, "files");
        var isValidGMO = ( materialXml..Command.@success == "true" );

        if (!isValidGMO) {
            throw new Error("\nFailed to match existing material, cannot continue [" + GMOMatch + "]") 
        } else {
            print('Found matching GMO/UTS, continuing')
            QCReport.MatId = GMOMatch;
        }

        var identifier = "";
        print("Examining File [" + filename + "]");
        var uFile = new gmoNBCFunc.usefulFileObj(filename);
        var name = uFile.basename;
        print("ext  [" + uFile.extension + "]");
        print("name [" + name + "]");
        
        // Return True Identifier
        identifier = name;
        print("");
        printObnoxiously("Using Identifier [" + identifier + "]","Identifier Creation");
        print("");

        return identifier;

    } catch(e) {
        path = monitoredFolder  + failedDir;
        gmoNBCFunc.failAndMove(uFile.filename,monitoredFolder,e);
        //TL;DR, return a blank string, or get  Java errors. false also fails
        return "";
    }
}

function isWorkBundleReady(/*WorkBundle*/ workBundle) {
	try {
		print("");
		print("isWorkBundleReady()");
		var sFilename = String(workBundle.fileItemMap.values().iterator().next().filename);
		var sPath = workBundle.info.path + "/";
		var sFileObj = new gmoNBCFunc.usefulFileObj(sPath + sFilename);
		var bActionWorkbundle = false;
		var fmh = new FolderMonitorHelper();
		fmh.setFile(sFileObj);

		// File not 0 bytes check
		if(fmh.getFile().filesize == 0){
			print("\tSkipping Upload [" + sFilename + "] is 0 bytes in size.");
			return false;
		}
		// Build a Job Description and exit successfully
		print("Creating Job Description for Identifier [" + String(workBundle.identifier) + "]");
		assignJobDescriptionToWorkBundle(workBundle, QCReport.MatId);
		bActionWorkbundle = true;
	} catch (e) {
		print(e);
		return "false";
	} finally {
		print("");
		wsLogout();
		return bActionWorkbundle;
	}
}

function assignJobDescriptionToWorkBundle(workBundle, matId) {
    print("In assignJobDescriptionToWorkBundle");
    // example: mimic what the default (non-skeleton) jobDescription code does
    if (workBundle.jobDescription == null ) {
        workBundle.jobDescription = new JobDescription();
    }

    // Add the Path to the Job Description
    workBundle.jobDescription.setProperty("Path", workBundle.info.path);
    print("\tSetting Job Description Path Property to ["+ workBundle.info.path + "]")
    // Add the file list property to object
    workBundle.jobDescription.setProperty("File", QCReport.filename);
    // Add the Material Id to be used
    workBundle.jobDescription.setProperty("FolderMonitorMatId", matId);
    print("\tSetting Job Description FolderMonitorMatId Property to [" + matId + "]");
}

// Function to print a string in an obvious manner
// @param [string] (str) - Error to log to screen
// **Optional** @param[heading] - Heading to display for messsage. Will default to "Error" if argument is not present
function printObnoxiously(str,heading){
	var heading = heading === undefined ? "Error" : heading;
	print("")
	print("####################################### "+heading+" #######################################");
	print("");
	print(str);
}




