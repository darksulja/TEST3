importPackage(Packages.com.pharos.foldermonitor);		// gives us access to foldermonitor classes and "constants" (eg: WorkBundle.STATUS_FILE_REMOVED)
importPackage(Packages.com.pharos.poxclient);			// gives us access to FileUtils etc
importPackage(Packages.com.pharos.moxb.containers);		// gives us access to TextList and Text classes
importPackage(Packages.com.pharos.subsystem.job);		// gives us access to JobDescription class
importPackage(Packages.java.io);						// gives us access to File class etc (if reqd)
importPackage(Packages.com.pharos.core.domain.job);     

//load("/usr/local/pharos/etc/scripts/nbcgmo_fun.js");
//load("/usr/local/pharos/bin/js/shellfun.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/lib/js/shellfun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_component_fun.js");

var debug = false;
var serverIP = lookup.system["login"].ip;
var user = "wsuser";
var pass = "wspass";
var subComponentExt = ["cap", "scc", "pac", "stl", "xml"];
var audioComponentExt = ["wav"];
var xmlExt = "xml";
var compFileObj;
var thisMaterialHelper;
var ttlSaveXml;

const NOT_AVAILABLE = "Not available"
const UPLOADABLE_STATE = "Order Placed";
const MEDIA_RECEIVED_STATE = "Media Received";
const UPLOAD_TRIGGER = "Upload";
const ADD_COMPONENT_TRIGGER = "Add Component";
const COMPONENT_UPLOAD_SUCCESS_TRIGGER = "Component Upload Success";
const DOT = ".";
const HYPHEN = "-";
const STATE_MACHINE = "NBC GMO";
const ORIGINAL_FILENAME = "Original File Name";
const READY = "Ready";
const VIDEO = "Video";


//////////////////////////////////////////////////////////////  Start of Standard Folder Monitor Functions //////////////////////////////////////////////////////////
function makeIdentifierFromFile(monitoredFolder, path, filename, workBundleMap) {
	logger.info("");
	printObnoxiously("Making Identifier From File","New File Arrival");
	logger.info("monitoredFolder " + String(monitoredFolder));
	logger.info("path " + String(path));
	logger.info("filename " + String(filename));
	logger.info("workBundleMap " + String(workBundleMap));

	var indentifier = "";
	logger.info("Examining File ["+String(filename)+"]");
	var uFile = new gmoNBCFunc.usefulFileObj(String(filename));
	var name = uFile.basename;
	logger.debug("ext  ["+uFile.extension+"]");
	logger.debug("name ["+name+"]");
	
	var indexOfSideCarInXMLFileName = name.toUpperCase().indexOf("_SIDECAR")
	if(indexOfSideCarInXMLFileName>-1){
		logger.debug("Has SideCar in File Name at index ["+indexOfSideCarInXMLFileName+"]");
		name =  name.substr(0, indexOfSideCarInXMLFileName);
	}

	//Check the Extension is valid
	if (gmoNBCFunc.contains(subComponentExt, uFile.extension.toLowerCase()) || gmoNBCFunc.contains(audioComponentExt, uFile.extension.toLowerCase()) || uFile.extension.toLowerCase() === "xml") {
		logger.info("Extension [" + uFile.extension.toLowerCase() + "] is valid continuing");
	} else {
		printObnoxiously("Extension [" + uFile.extension.toLowerCase() + "] is not valid not returning an Identfier");
		return "";
	} 

	// Return True Identifier
	identifier = name;
	logger.info("");
	printObnoxiously("Using Identifier ["+identifier+"]","Identifier Creation");
	logger.info("");

	return identifier;
}

function isWorkBundleReady(workBundle) {
	try {
		
		logger.debug("Logging into Server [" + serverIP + "]");
		wsLogin(serverIP,user,pass);
		logger.info("");
		printObnoxiously("Checking if WorkBundle with Identifier [" + String(workBundle.identifier) + "] is ready?","WorkBundle Analysis");
		
		var hasComponent = false;
		var hasXml = false;
		
		// Loop through files in WorkBundle and Check that we have both a component and an Xml exist
		var itf = workBundle.fileItemMap.values().iterator();
		var sPath = workBundle.info.path + "/";
		var workbundleIsReady = false;
		var tvdProductionNumber,trackTypeName;
		
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
					if(filename.indexOf("_SIDECAR")<0){
						if (gmoNBCFunc.contains(subComponentExt, ext) || gmoNBCFunc.contains(audioComponentExt, ext)) {
							hasComponent = true; 
							compFileObj = new gmoNBCFunc.usefulFileObj(sPath + filename);
						}
					}
					if (ext == xmlExt && filename.indexOf("_SIDECAR")>=0) hasXml = true;
					logger.debug("\nDEBUG: \n FileName [" + String(filename) + "] Name [" + name + "] Extension [" + ext + "] \n");
				}
			}
		}
		
		logger.info("Identifier [" + String(workBundle.identifier) + "] Contains Component [" + hasComponent + "] Contains Xml [" + hasXml + "]");
		
		/*
			If we have both an XML and a Component continue on through the workbundle analysis
		*/
		if (hasComponent && hasXml) {
			var xmlFileObj = new gmoNBCFunc.usefulFileObj(String(workBundle.info.path) + "/" + String(workBundle.identifier) + "_SIDECAR." + xmlExt);
			logger.info("");
			logger.info("Extracting Data from SideCarXml [" + xmlFileObj.unix_file + "]");
			
			/*
				Read SideCar XML
			*/
			var uSideCarXml = new gmoNBCCompFunc.componentSideCarXml(xmlFileObj);
			if (debug) logger.info("\tParsed Xml [" + uSideCarXml.filename + "], Contents\n:" + uSideCarXml.getSideCarXml());
		
			logger.info("SideCarXml Values That Matter:");
			logger.info("    TVD Production #      :    " + uSideCarXml.getTvdProductionNumber());
			logger.info("    File Aspect Ratio     :    " + uSideCarXml.getFileAspectRatio());
			logger.info("    Original Aspect Ratio :    " + uSideCarXml.getOriginalAspectRatio());
			logger.info("    Version Type 		   :    " + uSideCarXml.getVersionType());
			logger.info("    Material ID 		   :    " + uSideCarXml.getMaterialId());
			
			tvdProductionNumber = uSideCarXml.getTvdProductionNumber();
			trackTypeName = uSideCarXml.getTrackTypeName();
			materialId = uSideCarXml.getMaterialId();
			
			logger.info("Checking which Material we should upload this component against");
			
			var workflowAndTtlsAreReady = false; // Are the track type links and workflow ready?
			var tvdProjectObj = gmoNBCFunc.tvdNumberProjectQuery(tvdProductionNumber);
			if (tvdProjectObj.numberOfMatches > 0) {
				if(gmoNBCFunc.isVarUsable(materialId)){
					logger.info("Material Id Provided - Using This Material Without Any Selection By Verson Type, TVD & Aspect Ratio");
					thisMaterialHelper = new gmoNBCFunc.materialHelper(materialId);
				}else{
					logger.info("Material Id Not Provided - Trying to Find a Material Using  Verson Type, TVD & Aspect Ratio");
					thisMaterialHelper = whichMaterialShouldIUploadAgainst(gmoNBCCompFunc.subsOrAudio(compFileObj), tvdProjectObj, uSideCarXml.getOriginalAspectRatio(),
						uSideCarXml.getFileAspectRatio(), uSideCarXml.getVersionType());
				}
				if (thisMaterialHelper.getStateOfTtl(VIDEO) === READY) {
					
					var trackTypeGroupXml = gmoNBCFunc.trackTypeGroupGet(trackTypeName);
					var surroundTrackNames = [];
					//Making a Temporary fix to get Cinavia Components Uploaded
					var allSurroundTrackTypeNamesExist = false;

					// Check for Surround Track Type Group exist first and we're dealing with one
					if(trackTypeGroupXml.TrackType.length() === 3){
						for (var k=0; k<trackTypeGroupXml.TrackType.length();k++) {
							var surroundTrackName = trackTypeGroupXml.TrackType[k].Name.toString();
							surroundTrackNames.push(surroundTrackName);

							if(!thisMaterialHelper.trackTypeLinkExists(surroundTrackName)){
								allSurroundTrackTypeNamesExist = false;
							}	
						}
					}
					
					// Try to Upload Against Component if it already exists
					if (thisMaterialHelper.trackTypeLinkExists(trackTypeName)) {
						/*
							The TrackTypeLink we are trying to upload already exists against the material -
								Check the workflow state is Ok to upload
						*/
						logger.info("TrackType [" + trackTypeName + "] already exists on the Material. Checking if workflow state is OK to upload against");
						if (thisMaterialHelper.getStateOfTtl(trackTypeName) === UPLOADABLE_STATE) {
							workflowAndTtlsAreReady = true;
						} else if (thisMaterialHelper.getStateOfTtl(trackTypeName) === NOT_AVAILABLE) {
							/*
								For the time being we'll let the FolderMonitor perform this transition from NA -> Order Placed and see where that leaves us
							*/
							gmoNBCFunc.transitionTrackTypes(thisMaterialHelper.matId, ADD_COMPONENT_TRIGGER, trackTypeName);
							workflowAndTtlsAreReady = true;
						}
					} 
					else if(allSurroundTrackTypeNamesExist && gmoNBCFunc.startsWith(trackTypeName,"Surround")){
						var allInUploadableState = true;
						var allInNAState = true;
						
						trackTypeName = trackTypeGroupXml.TrackType[0].Name.toString();

						for (var u=0; u<trackTypeGroupXml.TrackType.length();u++) {
							var surroundTrackName = trackTypeGroupXml.TrackType[u].Name.toString();
							logger.info("Surround TrackType [" + surroundTrackName + "] already exists on the Material. Checking if workflow state is OK to upload against");
							if (thisMaterialHelper.getStateOfTtl(surroundTrackName) != UPLOADABLE_STATE) {
								allInUploadableState = false;
							}
							if(thisMaterialHelper.getStateOfTtl(surroundTrackName) != NOT_AVAILABLE){
								allInNAState = false;
							}
							
							//Figure out which ttl has the Filename associated with it and make it main component
							if(typeof thisMaterialHelper.getTTLShortTextValue("Original File Name",surroundTrackName) != "undefined"){
								trackTypeName = surroundTrackName;								
							}
						}
						
						if (allInUploadableState){
							workflowAndTtlsAreReady = true;	
						}
						else if(allInNAState){
							gmoNBCFunc.transitionTrackTypes(thisMaterialHelper.matId, ADD_COMPONENT_TRIGGER, surroundTrackNames.join());
							workflowAndTtlsAreReady = true;
						}																		
					}			
					else {
						/*
							The TrackTypeLink we are trying to upload does not exist against the material -
								Register the TrackType (in NotAvailable)
								Add the Original Filename
								Transition to Order Placed
						*/
						if (trackTypeGroupXml.TrackType.length() === 3){
							for (var j=0; j<trackTypeGroupXml.TrackType.length();j++) {
								var surroundTrackName = trackTypeGroupXml.TrackType[j].Name.toString();
								logger.info("Surround TrackType [" + surroundTrackName + "] does not already exist on the Material. Will register a TrackTypeLink");
								if(j == 0){
									thisMaterialHelper.addTrackTypeLink(surroundTrackName, NOT_AVAILABLE, STATE_MACHINE);
									thisMaterialHelper.addTrackTypeLinkShortText(surroundTrackName, ORIGINAL_FILENAME, compFileObj.filename);
									trackTypeName = surroundTrackName; //this becomes the main component to send to job
								}
								else{
									thisMaterialHelper.addTrackTypeLink(surroundTrackName, NOT_AVAILABLE, STATE_MACHINE);
								}
							}			
						}
						else{		
							logger.info("TrackType [" + trackTypeName + "] does not already exist on the Material. Will register a TrackTypeLink");
							thisMaterialHelper.addTrackTypeLink(trackTypeName, NOT_AVAILABLE, STATE_MACHINE);
							logger.info("1");
							thisMaterialHelper.addTrackTypeLinkShortText(trackTypeName, ORIGINAL_FILENAME, compFileObj.filename);
						}
						logger.info("2");
						logger.info(thisMaterialHelper.saveUsingSaveXml());
						thisMaterialHelper.saveUsingSaveXml();
						
						if(surroundTrackNames.length > 0 && gmoNBCFunc.startsWith(trackTypeName,"Surround")){
							gmoNBCFunc.transitionTrackTypes(thisMaterialHelper.matId, ADD_COMPONENT_TRIGGER, surroundTrackNames.join());
						}
						else{
							gmoNBCFunc.transitionTrackTypes(thisMaterialHelper.matId, ADD_COMPONENT_TRIGGER, trackTypeName);							
						}
						
						workflowAndTtlsAreReady = true;
					}
				} else {
					logger.info("[" + VIDEO + "] TrackTypeLink is in State [" + thisMaterialHelper.getStateOfTtl(VIDEO) + "]. Cannot upload at this time")
				}
			} else {
				logger.info("Could not find any matches for TVD Production #. WorkBundle NOT ready");
			}
		}else {
			
			if(hasComponent){
				logger.info("Check to see if the component is a reupload or already registered ");
				result = gmoNBCFunc.getMatIdFromFilenameTTL(compFileObj.filename,UPLOADABLE_STATE);
				matId = result.matId;
				logger.info("Material is ["+matId+"] ");
				trackTypeName = result.ttl;
				logger.info("trackTypeName is ["+trackTypeName+"] ");
				if(matId){
					var thisMaterialHelper = new gmoNBCFunc.materialHelper(matId);
					if (thisMaterialHelper.getStateOfTtl(VIDEO) === READY) {
						workflowAndTtlsAreReady = true;
					}
				}
			}
			
		}

		if (workflowAndTtlsAreReady) {
			logger.info("");
			logger.info("Creating Job Description for Identifier [" + String(workBundle.identifier) + "]");
			assignJobDescriptionToWorkBundle(workBundle, thisMaterialHelper, tvdProductionNumber, trackTypeName);
			return true;		
		} else {
			return false;
		}
	} catch (e) {
		logger.info("Error in isWorkBundleReady(): " + e.messsage);
		return false;
	} finally {
		wsLogout();
	}
}

function assignJobDescriptionToWorkBundle(workBundle, kMaterialHelper, kTvDProductionNumber, kTtn) {
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
			if(itemInfo.filename.toUpperCase().indexOf("_SIDECAR")== -1)
				fileList.add(new Text(itemInfo.filename) );
        }
    }
    // Add the Path to the Job Description
    workBundle.jobDescription.setProperty("Path", workBundle.info.path);
    logger.info("\tSetting Job Description Path Property to ["+workBundle.info.path+"]")
    // Add the file list property to object
    workBundle.jobDescription.setProperty("Files", fileList);
    // Add the Material Id to be used
    workBundle.jobDescription.setProperty("FolderMonitorMatId", kMaterialHelper.matId);
    logger.info("\tSetting Job Description FolderMonitorMatId Property to [" + kMaterialHelper.matId + "]");
    // The TrackTypeName we are uploading
    workBundle.jobDescription.setProperty("TrackTypeName", kTtn);
    logger.info("\tSetting Job Description TrackTypeName to [" + kTtn + "]");
    // TVD Production (Has to be concatenated with the # removed to make a valid xml tag)
    workBundle.jobDescription.setProperty("TVDProductionNo",kTvDProductionNumber);
    logger.info("\tSetting Job Description Property TVD Production # to ["+kTvDProductionNumber+"]");
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

function whichMaterialShouldIUploadAgainst(uComponentType, uTvdProjectQueryObj, uOriginalAspectRatio, uThisAspectRatio, uVersionType) {
	/*
		This function expects that the TVD Number exists in Mediator
		It is simply picking out the appropriate TVD number based on whether we have a subtitle or an audio
	*/
	
	var uLog = function (str) { 
		logger.info("whichIdShouldIUploadAgainst(): " + str);
	};
	

	if (uComponentType == "subtitle") {
		uLog("Running checks for a subtitle component");
		
		/*
			Subtitles must be uploaded against the same TVD production # and aspect ratio for correct positioning
		*/
		for (var uI = 0; uI < uTvdProjectQueryObj.materials.length; uI++) {
			var uMaterialHelper = new gmoNBCFunc.materialHelper(uTvdProjectQueryObj.materials[uI]);
			if (uMaterialHelper.getAspectRatio() == uThisAspectRatio && uMaterialHelper.getVersionType() == uVersionType) {
				uLog("Subtitle/Caption component has been matched to [" + uMaterialHelper.matId + "] because they are the same Aspect Ratio [" + uThisAspectRatio + "]");
				return uMaterialHelper;
            } else {
                uLog('Could not match on either Aspect Ratio or Version type on subtitle/caption, upload may have issues');
                return uMaterialHelper;
            }
		}
		
	} else {
		uLog("Running checks for an audio component");
		
		/*
			Audio must be uploaded against the same TVD production # but using the Original Aspect Ratio
		*/		
		for (var uI = 0; uI < uTvdProjectQueryObj.materials.length; uI++) {
			var uMaterialHelper = new gmoNBCFunc.materialHelper(uTvdProjectQueryObj.materials[uI]);
			if (uMaterialHelper.getAspectRatio() == uOriginalAspectRatio && uMaterialHelper.getVersionType() == uVersionType) {
				uLog("Audio component has been matched to [" + uMaterialHelper.matId + "] because they are the same Aspect Ratio [" + uThisAspectRatio + "]");
                uLog("Audio component also matches version type: [" + uMaterialHelper.getVersionType() + "] versionType: [" + uVersionType + "]")
                return uMaterialHelper;
            } else {
                uLog('Could not match on either Aspect Ratio or Version type on Audio Component, upload may have issues');
                return uMaterialHelper;
            }
		}
	}
}



