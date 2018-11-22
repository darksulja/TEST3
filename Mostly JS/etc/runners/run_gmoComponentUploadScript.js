load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_component_fun.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/lib/js/shellfun.js");
load("/opt/evertz/mediator/etc/runners/TransferRouteHelper.js");

function createStereoAudioPair(firstAudioInThePair,secondAudioInThePair,stereoPairOutputFile,ext){
	print("createStereoAudioPair");
	//TODO
	//I think this path should be updated
	var audioMBin = ["/usr/local/pharos/bin/audiomanipulate"];
	var bitDepth = 24; 
	var channels = 2;
	print(audioMBin + " -i " + firstAudioInThePair + " -i " + secondAudioInThePair + " -o " + stereoPairOutputFile + " -c " + channels + " -b " + bitDepth + " -f " + ext);
	var createStereoPair = run(audioMBin,"-i",firstAudioInThePair,"-i",secondAudioInThePair,"-o",stereoPairOutputFile,"-c",channels,"-b",bitDepth,"-f",ext);
			if (createStereoPair.exit !== 0) throw new Error("Run Command Failed for Audio Manipulate");
	
	return createStereoPair;
}


function deleteComments(matId,trackTypeName,commentTypeNames){
	try {
		
		print("\nDeleting comments ["+ commentTypeNames +"] for material ["+ matId +"] Track Type ["+ trackTypeName +"]");
		var commentTypeParameter;
		var commentTypeList = <CommentTypeList/>;
		if(typeof(commentTypeNames) != "undefined" && commentTypeNames!=null && commentTypeNames.length>=1){
			for each(var commentTypeName in commentTypeNames){
				commentTypeList.appendChild(<TypeName>{commentTypeName}</TypeName>);
			}
			commentTypeParameter =  <Parameter name="commentTypeNames">
										<Value></Value>
								    </Parameter>
			commentTypeParameter.Value.appendChild(commentTypeList);
		}
		
		var deleteComments = <PharosCs>
								<CommandList>
									<Command subsystem="comment" method="deleteCommentByCommentTypes">
									  <ParameterList>
										<Parameter name="matId" value={matId}/>
										<Parameter name="trackTypeName" value={trackTypeName}/>
									  </ParameterList>
									</Command>
								 </CommandList>
							 </PharosCs>;
		if(commentTypeParameter)
			deleteComments..ParameterList.appendChild(commentTypeParameter);
		wscall(deleteComments);
	} catch(e){
		print("Error deleting comments ["+ commentTypeNames +"] for material ["+ matId +"] "[+e]);
	}
	
}


function generateBrowseComments(frameRate,captionType,captionFileObj,trackTypeName){
	
	var mc = new gmoNBCCompFunc.macCaption();
	print("gmoNBCCompFunc: "+ captionFileObj);
	mc.setSourceFile(captionFileObj);
	//Adding Logic to Handle 23 98 Export Problems with smpte-tt & maccaptions
	if(frameRate!=""){
		print("\nFrame Rate is ["+frameRate+"] .Component is Subtitle - Running through MacCaption");
		ttXMLFile = new gmoNBCFunc.usefulFileObj(captionFileObj.unix_path + captionFileObj.basename + ITT_EXT);
		print("Generating ITT XML");	
		print(ttXMLFile.extension);	
		print("ttXMLFile that is paased to simpleInOut function: "+ttXMLFile);
		//mc.simpleInOut(ttXMLFile, frameRate,"async");	
		mc.simpleInOut(ttXMLFile, frameRate);
		if (fileExists(ttXMLFile.unix_path + "._" + captionFileObj.basename + ITT_EXT)) {
			print("Removing MacCaption temp file");
			remove(ttXMLFile.unix_path + "._" + captionFileObj.basename + ITT_EXT);
		}
		ttXMLFile = ttXMLFile;
		
	} else {
		
		if("smpte-tt" == captionType) {
			print("\nComponent is Subtitle - But already of type ["+ fileType +"] so not running through MacCaption");
			ttXMLFile = captionFileObj;
		} else {
			print("Generating SMPTE TT XML");
			// Generate the SMPTE TT XML file
			ttXMLFile = new gmoNBCFunc.usefulFileObj(captionFileObj.unix_path + captionFileObj.basename + XML_EXT);
			print(ttXMLFile.extension);
			//mc.simpleInOut(ttXMLFile, frameRate,"async");
			mc.simpleInOut(ttXMLFile, frameRate);
			if (fileExists(ttXMLFile.unix_path + "._" + captionFileObj.basename + XML_EXT)) {
				print("Removing MacCaption temp file");
				remove(ttXMLFile.unix_path + "._" + captionFileObj.basename + XML_EXT);
			}	
		}
	}
	sleep(20);			
	// Make PXF file from Captions and load comments into mediator
	gmoNBCCompFunc.makeBrowseCommentsFromSmpteTt(matId, ttXMLFile.unix_file, trackTypeName, "None", frameRate);

}

//////////////////////////////////////////////////////////////////////////////    Start of Script   ////////////////////////////////////////////////////////////////////// 
try { 

	print("\nStarting run_gmoComponentUploadScript.js");
	//Global Script Vars 
	var debug = false;
	var matId; 
	var filePath, fileName, fileExt,fileType; 
	var materialXml;
	var destFileObj, dropFolderFileObj;
	var destMedia;
	var frameRate;
	var tdPosition = "0";
	var storeMedia = "";
	var channels = "0";
	var filePosition = "1";
	
	const UPLOADABLE_STATE = "Order Placed";
	const MEDIA_RECEIVED_STATE = "Media Received";
	const UPLOAD_TRIGGER = "Upload";
	const COMPONENT_UPLOAD_SUCCESS_TRIGGER = "Component Upload Success";
	const FAILED = "Failed";
	const DOT = ".";
	const XML_EXT = ".xml";
	const ITT_EXT = ".itt";
	const HYPHEN = "-";
	var trackTypeName;
	
	var jobDesc = getJobParameter("jobDescription");
	if (debug) print("\nJobDesc\n"+ jobDesc +"]");
	
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",10);
	
	//Extracting data from Job Description
	var folderMonMatId = jobDesc..FolderMonitorMatId.toString();
	matId = folderMonMatId;
	
	filePath = jobDesc..Path.toString()+ "/";
	fileName = jobDesc..TextList.Text[0].toString();
	fileExt = gmoNBCFunc.getFileExtension(fileName,false);
	trackTypeName = jobDesc..TrackTypeName.toString();
	
	print("\nRunning Component Upload for Material ["+ matId +"] and TrackTypeName ["+ trackTypeName +"]");
	print("\nFileName  ["+ fileName +"] and FilePath ["+ filePath +"]");
	print("\nTransition Material ["+ matId +"] TrackTypeLink ["+ trackTypeName +"] from State ["+ UPLOADABLE_STATE +"] with Requirement ["+ UPLOAD_TRIGGER +"]")
	
	jobDashboard.updateStatusMap({"Script_MatId":matId});
	jobDashboard.updateStatusMap({"Script_FileName":fileName});
	
	gmoNBCFunc.transitionTrackTypes(matId,UPLOAD_TRIGGER,[trackTypeName]);
	
	jobDashboard.updateStatusMap({"Script_TrackTypeName":trackTypeName});
	
	//Deleteing Previously Applied Upload Comments 
	deleteComments(matId,trackTypeName,['Upload']);
	
	//Get Material XML
	print("Getting Material XML for Material ["+matId+"]");
	materialXml = materialGet(matId,"tracktypelinks","markers","shorttext","tag","owners","tracks");
	
	frameRate = materialXml..Material.FrameRate.toString();
	
	//Get the file ISO Tag from the TTL
	var fileTag = materialXml..TrackTypeLink.(TrackTypeName == trackTypeName).TrackType.FileTag.toString();
	dropFolderFileObj = new gmoNBCFunc.usefulFileObj(filePath + fileName);
	
	//Find out if Component is Audio or Subtitle
	var subsOrAudio = gmoNBCCompFunc.subsOrAudio(dropFolderFileObj);
	print("subsOrAudio is:    " + subsOrAudio);
	
	//Find Video Store Media from Track -> Media
   for each (var track in materialXml..Track) {
		
		if (parseInt(track.DeleteMark) === 0 &&
					track.Encoded.toString() === "true" &&
					gmoNBCFunc.contains(NBCGMO.storeMedias, track.MediaName.toString())) {
			storeMedia = track.MediaName.toString();
			print("Store Media set to ["+storeMedia+"]");
			break;
		}
		
	}
	//Find Component Media 
	fileType = fileExt;
	if("xml"==fileType){
		// If we get additional xml captions like EBU-TT - We need to identify type and not just use xml extension 
		fileType = "smpte-tt";
	}
	var destMediaName = ("subtitle" == subsOrAudio) ? gmoNBCCompFunc.lookupSubMediaByFileType(fileType) : gmoNBCFunc.getComponentAudioMedia(matId, materialXml..Material);
	destMedia = lookup.media[destMediaName];
	
	//Finding Component Media failed - Throw an Error 
	if (!gmoNBCFunc.isVarUsable(destMedia)) {
		throw new Error("destMedia ["+destMedia+"] not recognised");
	}
	jobDashboard.updateStatusMap({"Script_MediaName":destMediaName});
	
	var destMediaPath = destMedia.usesMatIdDir ? destMedia.mount + matId + ".dir/" : destMedia.mount;
	var destFileNameNoExt = matId + HYPHEN + fileTag ;
	var destFileName = destFileNameNoExt + DOT + fileExt;
	
	destFileObj = new gmoNBCFunc.usefulFileObj(destMediaPath + destFileName);
	print("\nDestination will be Path ["+ destMediaPath +"] FileName ["+ destFileName +"]");
	
	//Update Job Progress 20 Percent 
	jobDashboard.updateStatusAndProgress("JOB__RESULT","[" + matId + "] Copying file [" + destFileObj.filename + "] to [" + destMediaName + "]");
	jobDashboard.updateStatusAndProgress("JOB__PROGRESS", 20);
	
	gmoNBCFunc.makeDirectory(destMediaPath);
	
	//Move File to dest Folder
	print("\nMoving Drop Folder File ");
	gmoNBCFunc.copyFileOnRemoteHost(lookup.storage.dvs.host,	// Hostname or IP, prefer to specify hostname as it will retry with different IP's if it fails
						dropFolderFileObj.dvs_path,				// Source Path
						destFileObj.dvs_path,					// Destination path relative to mount on the host were sshing into (DVS in this case)
						dropFolderFileObj.filename,				// Source Filename
						destFileObj.filename,					// Leave this as null (not as a string of "null"), if you dont want to rename the file.
						dropFolderFileObj.filesize);			// You can not specify this at all, however it will check for the file transfer speed if you specify it.

	//Check File Exists
	var fileExistense = false;
	var retryLimit = 0;
	while(!fileExistense && retryLimit<=10){
		fileExistense = fileExists(destFileObj.unix_file);
		retryLimit++;
		sleep(6)
	}
	if (fileExistense) {
		print("\nMove Successful");
	} else {
		throw new Error("\nError Move failed. Cannot see file at "+ destFileObj.unix_file);
	}

	print("\nCreating TrackDef for [" + matId + "] trackTypeName [" + trackTypeName + "] On Media [" + destMediaName + "]");
	
	if ("audio" == subsOrAudio){
		channels = '2';
	} else {
		jobDashboard.updateStatusAndProgress("Generating Browse Comments",75);
		generateBrowseComments(frameRate,fileType,destFileObj,trackTypeName);
	}
	
	//Save Original File Name against Track Type Link as a Data Element
	gmoNBCFunc.saveTrackTypeShortTextElement(trackTypeName, "Original File Name", fileName);
	
	//Save TrackDef for the Component 
	gmoNBCCompFunc.makeAndSaveTrackDef(matId, destMediaName, trackTypeName, tdPosition, channels, filePosition, fileExt, frameRate,	destFileName);

	//Transition Component TrackTypeName
	print("\nTransition Material ["+ matId +"] TrackTypeLink ["+ trackTypeName +"] from State ["+ MEDIA_RECEIVED_STATE +"] with Requirement ["+ COMPONENT_UPLOAD_SUCCESS_TRIGGER +"]")
	gmoNBCFunc.transitionTrackTypes(matId, COMPONENT_UPLOAD_SUCCESS_TRIGGER, [trackTypeName]);
	
	//Remove the Original Component from drop folder
	print("\nFinished Processing Material ["+matId+"] from File ["+fileName+"]. Removing component & sidecar from dropfolder");
	jobDashboard.updateStatusAndProgress("Cleaning Up Files",95);
	debug = true;
	remove(dropFolderFileObj.unix_file);
	remove(dropFolderFileObj.unix_path + dropFolderFileObj.basename + "_SIDECAR" + XML_EXT);
	debug = false;

    if (subsOrAudio == "audio") {
        try {
            print("Making Request to Hi-Res QC Media");
            trh = new TransferRouteHelper(destMediaName);
            if (!trh.isValidQCMedia()) {
                makeTransferRequest(matId, trh.getTargetQCMedia(), 1);
            }
        } catch(e) {
            print(e.message);
        }
    }
	// Finished
	print("\n-----------Ending run_gmoComponentUploadScript.js----------------");
	jobDashboard.updateStatusAndProgress("Finishing Script",100);
	
} catch(e){
	print("\nComponent Upload Job  Failed ["+ matId +"] and TrackTypeName ["+ trackTypeName +"]"+e);
	//Add Comments that Component Upload Failed 
	gmoNBCFunc.addComment(matId,"Upload","Error During Upload " +e.message, trackTypeName);
	//Transition Material TTL to Failed 
	gmoNBCFunc.transitionTrackTypes(matId,FAILED,[trackTypeName]);
	//Update the Job to Reflect the Failure
	output ("Error failing script : " + e.message);
	updateStatusMap("JOB__ERROR", e.message);	
	throw e;
	quit(1); 	
}
