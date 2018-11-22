// Java Packages
importPackage(Packages.com.pharos.foldermonitor);		// gives us access to foldermonitor classes and "constants" (eg: WorkBundle.STATUS_FILE_REMOVED)
importPackage(Packages.com.pharos.poxclient);			// gives us access to FileUtils etc
importPackage(Packages.com.pharos.moxb.containers);		// gives us access to TextList and Text classes
importPackage(Packages.com.pharos.subsystem.job);		// gives us access to JobDescription class
importPackage(Packages.java.io);						// gives us access to File class etc (if reqd)
importPackage(Packages.com.pharos.core.domain.job);     
// TVD Number Notes
//
// Each TVD Production Number relates to an NBCU Project that originates from Studio Post Production.
// A project contains a set of Materials. (The set could potentially be 1)
// Each Material is editorially the same, but the Aspect Ratio and Texted Information differ. (Mediator uses the Texted Information for Version Types)
// Valid Aspect Ratios : 1.33, 1.78, 2.35 
// Valid Texted Information : OM-FTLESS, OM-FTEXTED, OM-TATEND, OM-TELEMENTS
// Mediator saves the TVD Production # against Material domain objects
// For a given TVD Production # number, the combination of Aspect Ratios and Version Types must be unique
// E.g. 		
//   ** Valid ** Each combination of Aspect Ratio / Version Type is unique for the given TVD Production #
//	 		Material 1:
//				TVD Production # : 1234
//				Aspect Ratio : 1.78
//				Version Type : OM-FTLESS
//		
//	 		Material 2:
//				TVD Production # : 1234
//				Aspect Ratio : 1.78
//				Version Type : OM-FTEXTED
//
//	 		Material 3:
//				TVD Production # : 1234
//				Aspect Ratio : 2.35 
//				Version Type : OM-FTLESS
//
//
//	If an attempt to upload a file now occurs with:
//
//			 TVD Production # : 1234
//			 Aspect Ratio : 1.78 
//			 Version Type : OM-FTLESS
//
// The result is ** Invalid ** Since the uniqueness would be violated
//		
//
//   The Folder Monitor must therefore do two checks for the TVD Production # :
//
//		 1) Check that what's being uploaded is valid 
//
// 			 To check for this a hidden set TVDAspectRatioVersionTypeList exists in Mediator detailing all the possible iterations.
//			 It's made up of  <FILEASPECTRATIO> : <VERSIONTYPE>  e.g. 1.78:OM-FTLESS or 2.35:OM-TATEND
//	 
//   		A variable is made from the Side Car Xml representing the attempted upload iteration.
//
// 	 		var sideCarAspectRatioVersionTypeCombo = sideCarFileAspectRatio + ":" + sideCarVersionType;
//			If the above variable is in the set this test is passed
//			
// 
//   	2) That an existing iteration does not exist
//	
//			 This is done by looping throuh all the Materials that match a given TVD Production # and creating a 
//		     matAspectRatioVersionTypeCombo variable which can be compared to the sideCarAspectRatioVersionTypeCombo
//
//			if a match exists, logic can be run based upon the Tracks and or Track Type Links to see if it can be uploaded against
//
// 
//	Self Generation of Materials
//
//	When a new TVD Production # enters the NBCU business systems, Translator will register a blank shell with the TVD Production #
//		This shell will be uploaded against if the SideCarFileAspectRatio and the SideCarOriginalAspect Ratio match. (The latter being the Master Aspect Ratio for the Project)		
//		Otherwise a Material will be created in the Folder Monitor
//
//

// Libraries
load("/opt/evertz/mediator/etc/runners/lookup.js");	
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");	
load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js");	
load("/opt/evertz/mediator/lib/js/shellfun.js");	
load("/opt/evertz/mediator/etc/helpers/SideCarXmlHelper.js");

//Setting for troubleshooting
var debug = false;
// Global Vars
var movExt = "mov";
var xmlExt = "xml"
//var validExts  = [movExt,xmlExt];
var validExts  = ["mov","xml","aspx","partial","mov.aspx","mov.partial"];
var videoTrackType = "Video";
var reqToOrderPlaced = "Order Placed";
var reqToUploadStarted = "Start";
var serverIP = lookup.system["login"].ip;
var user = "wsuser";
var pass = "wspass";
var defaultFailSubDir = "UnknownTVDNumber/";
var shortTextTypeTVDProduction = "TVD Production #";
var shortTextTypeOrigFileName =  "Original File Name";
var shortTextTypeGTMTitleVersion =  "GTM Title Version";
var shortTextTypeTextlessComplete =  "Textless Complete";
var shortTextTypeOriginalFrameRate = "Original Frame Rate";
var shortTextTypeOriginalAspectRatio = "Original Aspect Ratio";
var shortTextTypeAudioProfile = "Audio Profile";
var shortTextTypeDaisyID = "Daisy ID";
var shortTextTypeSourceID = "Source ID";
var shortTextTypeDaisyProductionNo = "Daisy Production #";
var shortTextTypeParentID = "Parent ID";
var tagTypeLanguageMasterType = "Territory Sub-Type";
var tagTypePrimaryLanguageType = "Primary Language";
var tagTypeSecondaryLanguageType = "Secondary Language"; 
var tagTypeTertiaryLanguageType = "Tertiary Language";  
var tagTypeFourthLanguageType = "Fourth Language";

var tagTypeAspectRatioVersionTypeCombo = "TVDAspectRatioVersionTypeList";

var tagTypeDropFolder = "Drop Folder";
var tagValueStudioPostDropFolder = "StudioPost";
var uploadDir = lookup.dropfolder[tagValueStudioPostDropFolder].mount;
var failedDir =  uploadDir + "/failed/FolderMonitor/";
var gmoOwner = "NBCU GMO";
var shortText = "shorttext";
var states = {
	omUploadState : "Order Placed",      
	notAvailableState : "Not available" 
};

///////////////////////////////////////////////////////  Start of User Defined Functions ////////////////////////////////////////////////////////////////////////
// Function to Move a File to the Failed Folder
// @param [string] - (file) - Name of File Relative to Upload Directory
// **Optional** @param [string] (tvProdNumber) - Name of the TVD Production #. Will form part of the failed Path **Optional**
function failAndMove(file,tvdProdNumber){
	var srcFile = uploadDir + file;
	var dstPath = tvdProdNumber === undefined ? failedDir + defaultFailSubDir : failedDir + tvdProdNumber + "/";
	if (fileExists(srcFile)) {
		if (!fileExists(dstPath)) makedir(dstPath);
		printObnoxiously("Moving [" + srcFile + "] to [" + dstPath + "]","File Move to Failed Directory","File Move to Failed Directory");
	    move(srcFile,dstPath);
	} else {
		printObnoxiously("Cannot Move File to Failed Directory. Src [" + srcFile + "] does not exist. Manual Intervention Required","File Move to Failed Directory");
	}
}

// Function that returns the current date in ISO 8601 format (YYYY-MM-DD).
function isoFormatDate() {
	var d = new Date();
	return String(d.getFullYear()) + "-" + String("0" + (d.getMonth() + 1)).slice(-2) + "-" + String("0" + (d.getDate())).slice(-2)
}

// Function that outputs an error message to a file on disk when the workflow fails. The file is located in the originating folder.
// @param [string] (err) - Error message
// @param [string] (origDir) - Original directory where the file was dropped
// @param [string] (movFile) - Media filename
// @param [string] (tvdNum) - TVD number
function logErrorToDisk(err, origDir, movFile, tvdNum) {
    var fullPath = origDir + "logs/folderMonitor_" + isoFormatDate() + ".log";
	var errMsg = String(movFile + " : " + tvdNum + " : " + err)
	logger.info("Logging error to disk: " + fullPath);

	if (fileExists(fullPath)) {
		append(errMsg, fullPath);
		print("full path is: "+fullPath);
		}
	else {
		if (!fileExists(origDir + "logs")) {
			makedir(origDir + "logs");
		}
		overwrite(errMsg, fullPath);
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



// Function to Save Material with Metadata (This will be an insert if the Mat ID has been generated in the script)
// @param [string] (matId) - MatId of the Material to save
// @param [string] (aspectRatio) - Aspect Ratio of the Material
// @param [string] (versionType) - Indicating the Version Type of the Material
// @param [string] (tvdProdNo) - Indicating what TVDProduction that Material belongs to
// @param [boolean] (saveTTL) - Indicating whether or not a Video TTL should be saved (Only to be used if Material is being created in script)
// @param [string] (title) - Title gained from the Side Car Xml
// @param [object] (shellMatID) - Material ID for Shell Record
// @param [boolean] (isShellCreatedByFolderMon) - Indicating whetherer the shell record created by Mediator
// @param [object] (sideCarXML)
 materialMetadataSave = function(matId,aspectRatio,versionType,tvdProdNo,saveTTL,srcFileName,title,shellMatID,isShellCreatedByFolderMon,sideCarXml,invalidMatIdSuffix){
	var matSaveXml = 
					<Material>
						<Owner>
							<Name/>
						</Owner>
						<MatId/>
						<FrameRate/>
						<MaterialType/>
						<VersionType/>
						<AspectRatio/>
						<ShortTextList/>
						<FullTextList/>
						<TagList/>	
					</Material>;

	matSaveXml.Owner.Name = gmoOwner; // Global Var
	matSaveXml.MatId = matId;
	matSaveXml.FrameRate = "P23_976"; //Awaiting final XML Schema, hard coded at the moment
	matSaveXml.VersionType = versionType;
	matSaveXml.AspectRatio = aspectRatio;
	matSaveXml.ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(shortTextTypeTVDProduction,tvdProdNo));
	matSaveXml.ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(shortTextTypeOrigFileName,srcFileName));
	matSaveXml.TagList.appendChild(gmoNBCFunc.createTagNode(tagTypeDropFolder,tagValueStudioPostDropFolder));
	
	logger.info("Shell Material Mat Id "+shellMatID);
	
	if (isShellCreatedByFolderMon && shellMatID!="" ){
		
		shellMaterial =  materialGet(shellMatID,'episode','shorttext','tag');
		//Copy Title From Original Shell Record to Shell Created by Folder Monitor 
		matSaveXml.Title = shellMaterial..Material.Title.toString();
		matSaveXml.MaterialType = shellMaterial..Material.MaterialType.toString();
		existingTitle = matSaveXml.Title.toString();
		//Copy Episode/Series/Brand From Original Shell Record to Shell Created by Folder Monitor 
		if(shellMaterial..Episode.EpisodeId.toString()!="") {
			matSaveXml.Episode.EpisodeId = shellMaterial..Episode.EpisodeId.toString();
		}
		gtmTitleVersion = shellMaterial..ShortTextList.ShortText.(ShortTextType.toString() == shortTextTypeGTMTitleVersion).Value.toString();
		if(gtmTitleVersion!="") { 
			matSaveXml.ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(shortTextTypeGTMTitleVersion,gtmTitleVersion));
		}
		
	} else {
		logger.info("Processing Else Block Of Code");
		matXML =  materialGet(matId);
		existingTitle = matXML..Title.toString();
		logger.info(existingTitle);
		materialType = matXML..MaterialType.toString();
		if(materialType=="")
			matSaveXml.MaterialType = "Programme";
		else 
			matSaveXml.MaterialType = materialType;
	}
	// Only want to save the Title if there's no information
	if (existingTitle === "") {
		matSaveXml.Title = title;
	}
	logger.info("Video TTL save: " + saveTTL);
	if (saveTTL) {
		matSaveXml.appendChild(
			<TrackTypeLink>
		   		<TrackTypeName>{videoTrackType}</TrackTypeName>
		    	<StateName>{states.notAvailableState}</StateName>
		    	<StateMachine>NBC GMO</StateMachine>
			</TrackTypeLink>
		);
	}
	
	//Additional OM Data Elements 
	
	var isTextLessComplete = sideCarXml.Slate.Text_Less.Complete.toString();
	logger.info("\tSideCarXml isTextLessComplete ["+isTextLessComplete+"]");
    matSaveXml.ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(shortTextTypeTextlessComplete,isTextLessComplete));
	//Source ID selection fall back to daisy ID
	var sideCarDaisyID = sideCarXml.Slate.ID_List.ID.(Type.toString()==="Daisy ID").Value.toString();
	logger.info("\tSideCarXml Daisy ID ["+sideCarDaisyID+"]");
	var sideCarSourceID = sideCarXml.Slate.ID_List.ID.(Type.toString()==="Source ID").Value.toString();
	logger.info("\tSideCarXml Source ID ["+sideCarSourceID+"]");
	if (!gmoNBCFunc.isVarUsable(sideCarDaisyID)  && !gmoNBCFunc.isVarUsable(sideCarSourceID) ){
		sideCarSourceID = matId;
		sideCarDaisyID = matId;
		logger.info("Daisy and source id set to Material id");
	} else if ( gmoNBCFunc.isVarUsable(sideCarDaisyID)  && !gmoNBCFunc.isVarUsable(sideCarSourceID)  ){
		sideCarSourceID = sideCarDaisyID;
		logger.info("Source id set to daisy id");
	} else if (!gmoNBCFunc.isVarUsable(sideCarDaisyID) && gmoNBCFunc.isVarUsable(sideCarSourceID) ){
		sideCarDaisyID = sideCarSourceID ;
		logger.info("Daisy id set to source id");
	} else {
		// both are set leave alone 
		logger.info("Daisy and source id already set");
	}


	matSaveXml.ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(shortTextTypeSourceID,sideCarSourceID));
	matSaveXml.ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(shortTextTypeDaisyID,sideCarSourceID));		
	//
	var sideCarDaisyProdNo = sideCarXml.Slate.ID_List.ID.(Type.toString()==="Daisy Production #").Value.toString();
	logger.info("\tSideCarXml Daisy Production # ["+sideCarDaisyProdNo+"]");
	if(sideCarDaisyProdNo)
		matSaveXml.ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(shortTextTypeDaisyProductionNo,sideCarDaisyProdNo));
	
	var sideCarParentID = sideCarXml.Slate.ID_List.ID.(Type.toString()==="Parent ID").Value.toString();
	logger.info("\tSideCarXml Parent ID ["+sideCarParentID+"]");
	if(sideCarParentID)
		matSaveXml.ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(shortTextTypeParentID,sideCarParentID));
	
	var sideCarLanguageMasterType = sideCarXml.Slate.ID_List.ID.(Type.toString()=="Language Master Type").Value.toString(); 
	logger.info("\tSideCarXml Language Master Type ["+sideCarLanguageMasterType+"]");
	if(sideCarLanguageMasterType)
		matSaveXml.TagList.appendChild(gmoNBCFunc.createTagNode(tagTypeLanguageMasterType, sideCarLanguageMasterType));
	
	var sideCarPrimaryLanguage = sideCarXml.Slate.ID_List.ID.(Type.toString()=="Primary Language").Value.toString(); 
	logger.info("\tSideCarXml Primary Language ["+sideCarPrimaryLanguage+"]");
	if(sideCarPrimaryLanguage)
		matSaveXml.TagList.appendChild(gmoNBCFunc.createTagNode(tagTypePrimaryLanguageType, sideCarPrimaryLanguage));
	
	var sideCarUHDHDR = sideCarXml.Slate.ID_List.ID.(Type.toString()=="UHD HDR Format").Value; 
	logger.info("\tSideCarXml UHD/HDR ["+sideCarPrimaryLanguage+"]");
	if(gmoNBCFunc.isVarUsable(sideCarUHDHDR))
		matSaveXml.TagList.appendChild(gmoNBCFunc.createTagNode("UHD/HDR", sideCarUHDHDR.toString()));
	
	var sideCarSecondaryLanguage = sideCarXml.Slate.ID_List.ID.(Type.toString()=="Secondary Language").Value.toString(); 
	logger.info("\tSideCarXml Secondary Language ["+sideCarSecondaryLanguage+"]");
	if(sideCarSecondaryLanguage)
		matSaveXml.TagList.appendChild(gmoNBCFunc.createTagNode(tagTypeSecondaryLanguageType, sideCarSecondaryLanguage));

	var sideCarTertiaryLanguage = sideCarXml.Slate.ID_List.ID.(Type.toString()=="Tertiary Language").Value.toString(); 
	logger.info("\tSideCarXml Tertiary Language ["+sideCarTertiaryLanguage+"]");
	if(sideCarTertiaryLanguage)
		matSaveXml.TagList.appendChild(gmoNBCFunc.createTagNode(tagTypeTertiaryLanguageType, sideCarTertiaryLanguage));

	var sideCarFourthLanguage = sideCarXml.Slate.ID_List.ID.(Type.toString()=="Fourth Language").Value.toString(); 
	logger.info("\tSideCarXml Fourth Language ["+sideCarFourthLanguage+"]");
	if(sideCarFourthLanguage)
		matSaveXml.TagList.appendChild(gmoNBCFunc.createTagNode(tagTypeFourthLanguageType, sideCarFourthLanguage));
	
	var sideCarTransformation = sideCarXml.Slate.Transformation.toString();
	logger.info("\tSideCarXml Transformation ["+sideCarTransformation+"]");
	if(sideCarTransformation)
		matSaveXml.Transformation = sideCarTransformation;

	var sideCarMaterialType = sideCarXml.Slate.Version.toString();
	sideCarMaterialType = sideCarMaterialType.toUpperCase();
	logger.info("\tSideCarXml Material Type ["+sideCarMaterialType+"]");
	if (sideCarMaterialType.indexOf("THEATRICAL")>-1){
		sideCarMaterialType = "Feature";
	} else if(sideCarMaterialType.indexOf("TELEVISION")>-1){
		sideCarMaterialType = "Episodic";
	} else if(sideCarMaterialType.indexOf("TRAILER")>-1){
		sideCarMaterialType = "Trailer";
	} else if(sideCarMaterialType.indexOf("INSERT REEL")>-1){
		sideCarMaterialType = "Insert Reel";
	} else {
		sideCarMaterialType = "Programme";
	}
	logger.info("\tSideCarXml Material Type has been updated to ["+sideCarMaterialType+"]");
	matSaveXml.MaterialType = sideCarMaterialType;

	var sideCarOriginalFrameRate = sideCarXml.Slate.Original_Frame_Rate.toString();
	logger.info("\tSideCarXml Original Frame Rate ["+sideCarOriginalFrameRate+"]");
	if(sideCarOriginalFrameRate)
		matSaveXml.ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(shortTextTypeOriginalFrameRate,sideCarOriginalFrameRate));
	 
	var sideCarFileAspectRatio = sideCarXml.Slate.File_Aspect_Ratio.toString();
	logger.info("\tSideCarXml File Aspect Ratio ["+sideCarFileAspectRatio+"]");
	var sideCarOriginalAspectRatio = sideCarXml.Slate.Original_Aspect_Ratio.toString();
	logger.info("\tSideCarXml Original Aspect Ratio ["+sideCarOriginalAspectRatio+"]");
	 
	var sideCarOriginalAspectRatioFlag = "False";
	if(sideCarFileAspectRatio == sideCarOriginalAspectRatio)
		sideCarOriginalAspectRatioFlag = "True";
	 
	matSaveXml.ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(shortTextTypeOriginalAspectRatio,sideCarOriginalAspectRatioFlag));
	 
	var audioProfile = sideCarXml.Slate.AudioConfig.toString();
	logger.info("\tSideCarXml Audio Profile ["+audioProfile+"]");
	 
	matSaveXml.ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(shortTextTypeAudioProfile,audioProfile));
	
	var sideCarComments =  sideCarXml.Slate.Comments.toString();
	logger.info("\tSideCarXml Comments ["+sideCarComments+"]");

	if (isShellCreatedByFolderMon && shellMatID!="" ) {
		try {
			matSaveXml = gmoNBCFunc.copyMetadataFromShell(matId,tvdProdNo,matSaveXml);
		} catch (e) {
			logger.info("Non-Fatal Error Saving Metadata Across TVD Group: " + e.messsage);
		}
	}

	if (invalidMatIdSuffix && shellMatID != "") {
		logger.info("Shell Mat ID [" + shellMatID + "] has a _01 prefix. Saving with new Mat ID [" + matId + "].")
		matSaveXml = gmoNBCFunc.copyMetadataFromShell(matId,tvdProdNo,matSaveXml);
	}

	logger.info("");
	logger.info("MatSaveXml \n["+matSaveXml+"]");
	var saveStatus = materialSave(matSaveXml);
	if(sideCarComments){
		 gmoNBCFunc.addComment(matId,"Library Clean Up Notes",sideCarComments);
		 logger.info("Adding Comments ");
	}
	 
	return saveStatus;
}

// Note this is different to the standard setJobDescription
function assignJobDescriptionToWorkBundle(workBundle,materialID,tvProductionNumber,shellCreatedByFolderMon) {
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
    workBundle.jobDescription.setProperty("ShellCreatedByFolderMon",shellCreatedByFolderMon);
    logger.info("\tSetting Job Description ShellCreatedByFolderMon to ["+shellCreatedByFolderMon+"]")
    // TVD Production (Has to be concatenated with the # removed to make a valid xml tag)
    workBundle.jobDescription.setProperty("TVDProductionNo",tvProductionNumber);
    logger.info("\tSetting Job Description Property TVD Production # to ["+tvProductionNumber+"]");
}

function checkMatIdSuffix(matId) {
	var split = matId.split('_');
	if (split[2] == '01') {
		logger.info("Warning: material ID " + matId + " has an _01 suffix.");
		return false;
	} else {
		logger.info("Material ID " + matId + " suffix OK.");
		return true;
	}
}


//////////////////////////////////////////////////////////////  End of User Defined Functions              //////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////  Start of Standard Folder Monitor Functions //////////////////////////////////////////////////////////
function makeIdentifierFromFile(monitoredFolder, path, filename, workBundleMap){
	logger.info("");
	printObnoxiously("Making Identifier From File","New File Arrival");
	logger.info("monitoredFolder " + String(monitoredFolder)); 
	logger.info("path " + String(path));
	logger.info("filename " + String(filename));
	logger.info("workBundleMap " + String(workBundleMap));

	var indentifier = "";
	logger.info("Examining File ["+String(filename)+"]");
	var ext  = String(filename.substr(filename.indexOf(".")+1));
	var name = String(filename.substr(0,filename.indexOf(".")));
	logger.debug("ext  ["+ext+"]");
	logger.debug("name ["+name+"]");

	//Check the Extension is valid
	if(validExts.indexOf(ext) == -1){
		printObnoxiously("Extension [" + ext + "] is not valid returning an ident");
		failAndMove(filename);
		return "";
	}else{
		logger.info("Extension [" + ext + "] is valid continuing");
	} 

	// Return True Identifier
	identifier = name;
	logger.info("");
	printObnoxiously("Using Identifier ["+identifier+"]","Identifier Creation");
	logger.info("");

	return identifier;
}

checkIfMaterialIsRedelivery = function(fileName,tvdMatIdsXml){
	var matId ="";
	logger.info("Current Upload File Name -"+fileName);
	for each(var material in tvdMatIdsXml){
		var fileNameFromMaterial = material.ShortTextList.ShortText.(ShortTextType == "Original File Name").Value.toString();
		logger.info("fileNameFromMaterial -"+fileNameFromMaterial);
		if(fileNameFromMaterial==fileName){
			var material = materialGet(material.MatId.toString(),'history')..Material;
			if (material.StateHistoryGroup[0].length() > 0) {
				if(material.StateHistoryGroup[0].Requirement.toString()=='Redeliver' ) {
					matId = material.MatId.toString();
					break;
				}
			} else if (material.StateHistoryGroup[1].length() > 0) {
				if(material.StateHistoryGroup[1].Requirement.toString()=='Redeliver' ) {
					matId = material.MatId.toString();
					break;
				}
			}
		}
	}
	logger.info("matId - "+matId)

	return matId;
}


function isWorkBundleReady(workBundle) {
	logger.debug("Logging into Server [" + serverIP + "]");
	wsLogin(serverIP,user,pass);
	logger.info("");
	printObnoxiously("Checking if WorkBundle with Identifier [" + String(workBundle.identifier) + "] is ready?","WorkBundle Analysis");
	var hasMov = false;
	var hasXml = false;
	var shellMatID = "";
	var invalidMatIdSuffix = false;

	// Loop through files in WorkBundle and Check an Mov and Xml exist
	var itf = workBundle.fileItemMap.values().iterator();
	var mySidecarXmlHelper = new SideCarXmlHelper();
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
            }
		} 
	}
	logger.info("Indentifier [" + String(workBundle.identifier) + "] Contains Mov [" + hasMov + "] Contains Xml [" + hasXml + "]");

    // Decide whether to continue based upon the presence of a Mov and Xml in the WorkBundle
	if(hasMov && hasXml) {
		try{
			var workBundleArr = String(workBundle.info.path).split("/");
			tagValueStudioPostDropFolder = workBundleArr[workBundleArr.length-1];
			uploadDir = lookup.dropfolder[tagValueStudioPostDropFolder].mount;
			failedDir =  uploadDir + "/failed/FolderMonitor/";
			
			// Save the Original File Name - this will be used in the OM Script and should prove useful it debugging down the line
			var srcFileName = workBundle.getStubFilenameByExt(movExt) + "." + movExt;

			var xmlFile = String(workBundle.info.path) + "/" + String(workBundle.identifier) + "." + xmlExt;
			logger.info("");
			logger.info("Extracting Data from SideCarXml [" + xmlFile + "]");

			var sideCarXml = new XML(gmoNBCFunc.removeXmlHeader(FileUtils.readFile(xmlFile)));
			if (debug) logger.info("\tParsed Xml [" + sideCarXml + "]");
			
			var sideCarTitle = sideCarXml.Slate.Program_Title.toString();
			logger.info("\tSideCarXml Title [" + sideCarTitle + "]");
			
			var sideCarTVDProdNum = sideCarXml.Slate.ID_List.ID.(Type.toString()==="TVD").Value.toString();
		 	if (!sideCarTVDProdNum) throw new Error("Failed to extract a TVD Production # from the SideCarXml [" + xmlFile + "]");
		 	logger.info("\tSideCarXml ("+shortTextTypeTVDProduction+") ["+sideCarTVDProdNum+"]");

		 	var sideCarFileAspectRatio = sideCarXml.Slate.File_Aspect_Ratio.toString();
		 	if (!sideCarFileAspectRatio) throw new Error("\nFailed to extract File Aspect Ratio from SideCarXml [" + xmlFile + "]");
		 	logger.info("\tSideCarXml File Aspect Ratio ["+sideCarFileAspectRatio+"]");

		 	var sideCarOriginalAspectRatio = sideCarXml.Slate.Original_Aspect_Ratio.toString();
			logger.info("\tSideCarXml Original Aspect Ratio [" + sideCarOriginalAspectRatio + "]");
		 	if (!sideCarOriginalAspectRatio)logger.info("\tSideCarXml has no Original Aspect Ratio. OAR is N ");
		 	logger.info("\tSideCarXml Original Aspect Ratio [" + sideCarOriginalAspectRatio + "]");
				
			var sidecarUHDHDRFormat = sideCarXml.Slate.ID_List.ID.(Type.toString()=="UHD HDR Format").Value;
			sidecarUHDHDRFormat = gmoNBCFunc.isVarUsable(sidecarUHDHDRFormat) ?  sidecarUHDHDRFormat.toString().toUpperCase() : ""; 
	 		logger.info("\tSideCarXml UHD/HDR ["+sidecarUHDHDRFormat+"]");
		 	var validUHDHDRFormats = gmoNBCFunc.getTagsForType("UHD/HDR"); //empty is a valid combo so we add it
		 	if (validUHDHDRFormats.indexOf(sidecarUHDHDRFormat) === -1 && sidecarUHDHDRFormat != "") throw new Error("Sidecar XML 'UHD HDR Format' [" + sidecarUHDHDRFormat + "] is not valid.\n Valid values are: " + validUHDHDRFormats);			
				
			var sideCarPrimaryLanguage = mySidecarXmlHelper.getSideCarLanguage("Primary Language", sideCarXml); 

		 	var sideCarVersionType = sideCarXml.Slate.Text_Less.Present.toString();
			if (!sideCarVersionType) throw new Error("\nFailed to extract a Version Type for SideCarXml [" + xmlFile + "]");
			logger.info("\tSideCarXml Version Type [" + sideCarVersionType + "]");
			
			// LM - One of the Languaged Master Version Types
			// Also check for TR (Trailer) and IR (Insert Reel) types
			var lmRegex = /LM-/; 
			var trRegex = /TR-/;
			var irRegex = /IR-/;
			var isLMBeingUpoaded = lmRegex.test(sideCarVersionType);
			var isTRBeingUploaded = trRegex.test(sideCarVersionType);
			var isIRBeingUploaded = irRegex.test(sideCarVersionType);

			if (
				(isLMBeingUpoaded && !sideCarPrimaryLanguage) ||
				(isTRBeingUploaded && !sideCarPrimaryLanguage) ||
				(isIRBeingUploaded && !sideCarPrimaryLanguage)
			) {
				throw new Error("\nVersion Type being uploaded is [" + sideCarVersionType + "] and Primary Language is [" + sideCarPrimaryLanguage + "]");
			}
		 	
		 	// This may well be the longest variable name in history but it's descriptive and not open to interpretation
		 	// Each TVD# is only allowed one Material per Combination.  - See description at top of Folder Monitor
		 	var sideCarAspectRatioVersionTypeCombo = sideCarFileAspectRatio + ":" + sideCarVersionType;
		 	logger.info("\tCreated SideCarAspectRatioVersionTypeCombo [" + sideCarAspectRatioVersionTypeCombo + "]");

		 	// Important to checks what's being uploaded is a valid iteration
		 	// Mediator has a hidden list of valid TVDProduction Aspect Ratio / Version Type Combos. 
		 	var validTVDProdAspectRatioVersionTypeCombos = gmoNBCFunc.getTagsForType(tagTypeAspectRatioVersionTypeCombo);
		 	if (validTVDProdAspectRatioVersionTypeCombos.indexOf(sideCarAspectRatioVersionTypeCombo) === -1) {
		 		throw new Error("SideCarAspectRatioVersionTypeCombo [" + sideCarAspectRatioVersionTypeCombo + "] is not valid.");
		 	}

		 	// At this point the Folder Monitor has validated that the Side Car Aspect Ratio and Texted Information is a valid TVD Prod # iteration
		 	// Now need to check that the iteration version does not exist in Mediator or if it does that no tracks exist and or the state of the Track Type Links
		 	// List all the Materials matching a TVD Production #
		 	logger.info("");
		 	logger.info("Searching for all Materials that match (" + shortTextTypeTVDProduction + ") [" + sideCarTVDProdNum + "]");
		 	var tvdMatIds = gmoNBCFunc.getMaterialsFromDataElements(shortText,shortTextTypeTVDProduction,sideCarTVDProdNum);
			
			// Expand later to deal with this as a valid use case
		 	if (tvdMatIds.length === 0) {
		 		logger.info("No Materials found for the (" + shortTextTypeTVDProduction + ") : [" + sideCarTVDProdNum + "]");
				logger.info("***** Mediator will create Shell Record *****");
		 	} else {
		 		logger.info("Materials that Match (" + sideCarTVDProdNum + ") : [" + tvdMatIds + "]");
		 	}

		 	// Store the MatXmls for Materials that match a TVD Production # for use later
			var tvdMatIdsXml = [];

			// Check that the TVD Production Iteration does not exists in Mediator or if it does that no tracks exist and or the state of the Track Type Links
			logger.info("");
			logger.info("Examining existing Materials for TVDProduction #  [" + sideCarTVDProdNum + "] to check for the attempted upload [" + sideCarAspectRatioVersionTypeCombo + "] iteration uniqueness")
		
			// Check that the uniqueness of the Sidecar is not violated. Different rules for different version types
			
			for each(var mat in tvdMatIds) {
				
				var matXml = materialGet(mat,"tag","shorttext","tracks","trackTypeLinks")..Material;
				logger.info("");
				logger.info("Examining Material [" + mat + "]");

				var aspectRatio = matXml.AspectRatio.toString();
				logger.info("\tAspect Ratio [" + aspectRatio + "]");

				var versionType = matXml.VersionType.toString();
				logger.info("\tVersion Type [" + versionType + "]");
				
				var matAspectRatioVersionTypeCombo = aspectRatio + ":" + versionType;
				logger.info("\tMaterial AspectRatioVersionTypeCombo [" + matAspectRatioVersionTypeCombo + "]");
					
			    if ("Translation Layer" == matXml.TagList.Tag.(TagType.toString() == "Shell Creator").Value.toString()) {
					shellMatID = matXml.MatId.toString();
					logger.info("\tshellMatID [" + shellMatID + "]");
				}
				
				
				//logger.info("\tMaterial Primary Language [" + primaryLanguage + "]");
				
				var videoState = matXml..TrackTypeLink.(TrackTypeName.toString() === videoTrackType).StateName.toString();
				logger.info("\tVideo State [" + videoState + "]");
				
				// Check Violations haven't occured. Different Rules for LM/TR/IR.
				// It's ok to have an existing Aspect Ratio Version Type Combo IF the primary language is different.
				var languageCheckObj = {
					matXml : matXml,
					sideCarXml : sideCarXml,
					sideCarPrimaryLanguage : "English", 
					isLMBeingUpoaded : (isLMBeingUpoaded || isTRBeingUploaded || isIRBeingUploaded) ? true : false,
					matAspectRatioVersionTypeCombo : matAspectRatioVersionTypeCombo, 
					sideCarAspectRatioVersionTypeCombo : sideCarAspectRatioVersionTypeCombo, 
					sidecarUHDHDRFormat : sidecarUHDHDRFormat,
					states : states
				};
				
				mySidecarXmlHelper.languageMatchCheck(languageCheckObj);
				
				// Store for later
				tvdMatIdsXml.push(matXml);
			}

			// Vars to be used below
			var matId; // To be used for the Job Description
			var shellCreatedByFolderMon = true;
			var createTTL = true;
			logger.info("");
			logger.info("Passed unique Aspect Ratio Version Type Combination Check. Iteration [" + sideCarAspectRatioVersionTypeCombo + "] ok to upload against");
			logger.info("");
			
			// Handle Redliveries
			var isRedeliverMatId = checkIfMaterialIsRedelivery(srcFileName,tvdMatIdsXml);
			logger.info("isRedeliverMatId - "+isRedeliverMatId);
			
			if (isRedeliverMatId!="" && isRedeliverMatId.length >= 2) {
				
				createTTL = false;
				shellCreatedByFolderMon = false;
				matId = isRedeliverMatId;	
			
			} else {
				// If the Original Aspect Ratio matches this files' Sidecar XML Aspect Ratio we will check to see if we can upload against the 'main' registered material
				if ((sideCarFileAspectRatio === sideCarOriginalAspectRatio) && !isLMBeingUpoaded /* Languaged Masters Should Never Upload Against the Main Material */) {
					logger.info("Side Car Original Aspect Ratio  matches File Aspect Ratio [" + sideCarFileAspectRatio + "]");
					logger.info("");
					logger.info("Checking to see if Blank Shell exists")

					// Check how many blank shells there are
					var counter = 0;
					for each(var material in tvdMatIdsXml){ 
						var noOfTracks = material..Track.length();
						var vidState = material..TrackTypeLink.(TrackTypeName.toString() === videoTrackType).StateName.toString();

						// If Material has no Tracks and Video Track Type Link is in OM Order Places shell can be used
						logger.info("");
						if (noOfTracks === 0 && vidState === states.omUploadState) {
							matId = material.MatId.toString();
							if (!checkMatIdSuffix(matId)) { // If it fails this check, give it an entirely new matId.
								matId = gmoNBCFunc.generateMatId(NBCGMO_CONSTANTS.GENERATOR_SCRIPTS.GMO_MAT_ID,NBCGMO_CONSTANTS.FREE_SEQUENCE_MAPPING.GMO_MAT_ID);
								invalidMatIdSuffix = true;
							}
							if (matId !== "") counter++;
						}
					}

					// Was a Mat Id found?
					// Need to allow for File Aspect Ratios to match but the reverse of the Texted status
					// I.e. the Original Translator Shell has been uploaded against
					if (counter === 0) {
						logger.info("");
						logger.info("No blank Shells found will generate a Material Id");
						//matId = gmoNBCFunc.generateMatId(); 
						matId = gmoNBCFunc.generateMatId(NBCGMO_CONSTANTS.GENERATOR_SCRIPTS.GMO_MAT_ID,NBCGMO_CONSTANTS.FREE_SEQUENCE_MAPPING.GMO_MAT_ID); 
						// Note this generates a Mat Id to be used not a Material Record itself.
						if (!matId) throw new Error("Failed to generate a Material Id");
						logger.info("Generated Mat Id [" + matId + "]");
					} else if (counter === 1) {
						// Translator Shell
						shellCreatedByFolderMon = false;
						createTTL = invalidMatIdSuffix ? true : false;
						logger.info("");
						logger.info("Found Original Shell registered by Translator");
					} else {
						throw new Error("Found [" + counter + "] Shells. Must be <= 1 for TVDProduction # [" + sideCarTVDProdNum + "]");
					}
				} else {
					logger.info("File Aspect Ratio [" + sideCarFileAspectRatio + "] is different to Original TV Production Aspect Ratio [" + sideCarOriginalAspectRatio + "]");
					logger.info("Generating Material Id for TVDProduction Number (" + sideCarTVDProdNum + ")  - [" + sideCarAspectRatioVersionTypeCombo + "]");
						
					//matId = gmoNBCFunc.generateMatId();													
					matId = gmoNBCFunc.generateMatId(NBCGMO_CONSTANTS.GENERATOR_SCRIPTS.GMO_MAT_ID,NBCGMO_CONSTANTS.FREE_SEQUENCE_MAPPING.GMO_MAT_ID); 
					// Note this generates a Mat Id to be used not a Material Record itself.
					
					if (!matId) throw new Error("Failed to Generate Material Id");
					logger.info("Generated MatId [" + matId + "]");
					logger.info("");
					printObnoxiously("Self Registering MatId [" + matId + "]","Self Registation");
				}
				
			}
			
			// And fire when ready
			logger.info("");
			printObnoxiously("Updating Shell [" + matId + "]","Shell Update");

			//If there is ever a need to pass one more argument - i am going to rewrite the input as an object
			var updateShell = materialMetadataSave(matId,sideCarFileAspectRatio,sideCarVersionType,sideCarTVDProdNum,
										createTTL,srcFileName,sideCarTitle,shellMatID,shellCreatedByFolderMon,sideCarXml,invalidMatIdSuffix);
			if (!updateShell) throw new Error("Failed to Update Shell [" + matId + "]  (" + sideCarTVDProdNum + ") - [" + sideCarAspectRatioVersionTypeCombo + "]");
			logger.info("");

			// Transistion from Not Available to OM Order Placed (this will provide some history for reporting etc)	
			if (createTTL) {
				logger.info("Transitioning Track Type [" + videoTrackType + "] for Material [" + matId + "]");
				gmoNBCFunc.transitionTrackTypes(matId,reqToOrderPlaced,videoTrackType);
			}

     		logger.info("");
			logger.info("Creating Job Description for Identifier [" + String(workBundle.identifier) + "]");
			assignJobDescriptionToWorkBundle(workBundle,matId,sideCarTVDProdNum,shellCreatedByFolderMon);
			gmoNBCFunc.transitionTrackTypes(matId,reqToUploadStarted,videoTrackType);
			logger.info("Submitting Job WorkBundle is Ready");
			logger.info("");
			logger.debug("Logging Out");
			wsLogout(); // Ready to Submit Logout
			logger.info
			return true;

		} catch(e) {
			// Add in email Job here!
			printObnoxiously(e);
			failAndMove(String(workBundle.identifier)+"."+xmlExt,sideCarTVDProdNum);
			failAndMove(String(workBundle.identifier)+"."+movExt,sideCarTVDProdNum);
			logErrorToDisk(e, uploadDir, String(workBundle.identifier + "." + movExt), sideCarTVDProdNum);
			logger.info("");
			logger.debug("Logging Out");
			wsLogout(); // Error has occured Logout
			return false;
		}

		// Should never get here	
		return false;

	}else{
		logger.info("");
		logger.info("WorkBundle not Ready yet will reevalute later");
		logger.info("");
		logger.debug("Logging Out");
		wsLogout(); // Logout
		return false;
	}
}
