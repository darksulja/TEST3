load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_component_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_settings.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/ProfileHelper.js");	

// Function to Save Material with Metadata,tracktypelinks,tracks,segments
// @param [string] (matId) - MatId of the Material to save
// @param [object] (sideCarXML)
// @param [boolean] (isImported) does this material id already exist in the system?
 var materialMetadataSave = function(matId,sideCarXml,isImported){
 	print("Material Mat Id "+ matId);
	var matSaveXml = 
					<Material>
						<Owner>
							<Name/>
						</Owner>
						<MatId/>
						<Title/>
						<FrameRate/>
						<Duration/>
						<MaterialType/>
						<VersionType/>
						<AspectRatio/>
						<SegmentList/>
						<FullTextList/>
						<ShortTextList/>
						<TagList/>
					</Material>;

	matSaveXml.Owner.Name = "NBCU GMO"; // Global Var
	matSaveXml.MatId = matId;
	matSaveXml.MaterialType = sideCarXml..Material.MaterialType.toString();;
	matSaveXml.FrameRate = sideCarXml..Material.FrameRate.toString();; 
	matSaveXml.VersionType = sideCarXml..Material.VersionType.toString();
	matSaveXml.AspectRatio = sideCarXml..Material.AspectRatio.toString();
	matSaveXml.Title = sideCarXml..Material.Title.toString();

	//this conditional is here because we original sent a batch of xmls without duration
	var duration = sideCarXml..Material.Duration.toString();
	if(duration != ""){
		matSaveXml.Duration = duration;
	} else{
		for each (track in sideCarXml..Material.Tracks.Track){
			if(track.TrackDefinition.(TrackTypeName.toString() === "Video")){
				var videoTrack = track;
				break;
			}
		}	
		var vidIncode = videoTrack.Incode.toString();
		var vidOutcode = videoTrack.Outcode.toString();
		var vidFrameRate = videoTrack.FrameRate.toString();

		matSaveXml.Duration = gmoNBCFunc.calculateDuration(vidIncode,vidOutcode,vidFrameRate);
	}

	var transformation = sideCarXml..Material.Transformation.toString();
	if(transformation != ""){
		matSaveXml.Transformation += <Transformation>{transformation}</Transformation>;
	}

	matSaveXml = appendDataElementsFromSidecarXML(sideCarXml..Material,matSaveXml);

	for each(var trackTypeLink in sideCarXml..Material.TrackTypeLinks.TrackTypeLink){
		var commentListXML = new XMLList();
		var ttlXML = <TrackTypeLink>
		   		<TrackTypeName>{trackTypeLink.TrackTypeName.toString()}</TrackTypeName>
		    	<StateName>{states.notAvailableState}</StateName>
		    	<StateMachine>NBC GMO</StateMachine>
				<FullTextList/>
				<ShortTextList/>
				<TagList/>
				</TrackTypeLink>;

		ttlXML = appendDataElementsFromSidecarXML(trackTypeLink,ttlXML);
		matSaveXml.appendChild(ttlXML);
	}

	//Add Segments
	matSaveXml.appendChild(getSegmentsSaveXML(sideCarXml));

	print("");
	//print("MatSaveXml \n["+matSaveXml+"]");
	var saveStatus = materialSave(matSaveXml);
	
	return saveStatus;
}

var getTrackSaveXML = function(sideCarXML){
	var excludeTracks = ["DC_MEDIATOR_X_MAIN","RETAIN_COMPONENTS_MEDIA","DC_MEDIATOR_X_AUDIO","DC_MEDIATOR_X_SUBTITLE","OM_STAGING","NLDStaging"];
	var returnSaveXML = new XMLList();
	var processedTracks = [];
	var matId = sideCarXml..Material.MatId.toString();
 	var ph = new ProfileHelper();

	for each(var track in sideCarXML..Material.Tracks.Track){
		if(!gmoNBCFunc.contains(excludeTracks,track.MediaName.toString()) && track.DeleteMark.toString() == 0 && 
		   !gmoNBCFunc.startsWith(track.MediaName.toString(),'DIVA')){
			
			var mediaName = track.MediaName.toString();
			if(mediaName.toUpperCase().indexOf('BROWSE_') >= 0){
				mediaName = "EC_" + mediaName;
			}
			else if(gmoNBCFunc.startsWith(mediaName,"T2_")){
				mediaName = mediaName.replace("T2_","DC_T2_");
			}
			else{
				mediaName = "DC_T2_" + mediaName;
			}

			//Do this to avoid adding the same track twice after medianame translation
			if(!gmoNBCFunc.contains(processedTracks,mediaName)){
				var trackExtension = track.FileExtension.toString();
				var saveTrackXML = <Track>
									<FrameRate>{track.FrameRate.toString()}</FrameRate>
									<MediaName>{mediaName}</MediaName>
									<FileId>{track.FileId.toString()}</FileId>
								    <Incode>{track.Incode.toString()}</Incode>
								    <Outcode>{track.Outcode.toString()}</Outcode>
									<FileExtension>{trackExtension}</FileExtension>
								</Track>;
				for each(var trackDef in track.TrackDefinition){
					var trackTypeName = trackDef.TrackTypeName.toString();
					var fileTag = ph.getTrackType(trackTypeName).FileTag.toString();
					var fileId = trackExtension.toLowerCase() == "mov" ? matId + "." + trackExtension : matId + "-" + fileTag + "." + trackExtension
					var trackDefXML = <TrackDefinition>		
									 	<TrackTypeName>{trackTypeName}</TrackTypeName>						
								 		<Position>{trackDef.Position.toString()}</Position>
								 		<FilePosition>{trackDef.FilePosition.toString()}</FilePosition>
								 		<FileId>{fileId}</FileId>
								 		<Channels>{trackDef.Channels.toString()}</Channels>
							 		</TrackDefinition>;

					saveTrackXML.Track += trackDefXML;
				}
				returnSaveXML += saveTrackXML;
				processedTracks.push(mediaName);
			}
		}
	}

	return returnSaveXML;
}

var getSegmentsSaveXML = function(sideCarXml){
	var returnSaveXML = <SegmentList></SegmentList>;
	
	for each(var segment in sideCarXml..Material.SegmentList.Segment){
		var saveSegmentXML = <Segment>
								<Index>{segment.Index.toString()}</Index>
								<MarkerIn>
									<FrameRate>{segment.MarkerIn.FrameRate.toString()}</FrameRate>
									<Absolute>{segment.MarkerIn.Absolute.toString()}</Absolute>
								</MarkerIn>
								<MarkerOut>
									<FrameRate>{segment.MarkerOut.FrameRate.toString()}</FrameRate>
									<Absolute>{segment.MarkerOut.Absolute.toString()}</Absolute>
								</MarkerOut>
								<SegmentGroup>
									<Name>{segment.SegmentGroup.Name.toString()}</Name>
								</SegmentGroup>
								<SegmentType>
									<Name>{segment.SegmentType.Name.toString()}</Name>
								</SegmentType>
							<FullTextList/>
							<ShortTextList/>
							<TagList/>	
							</Segment>;

		saveSegmentXML = appendDataElementsFromSidecarXML(segment,saveSegmentXML);
		returnSaveXML.appendChild(saveSegmentXML);
	}

	return returnSaveXML;
}  

//Helper method to add data elements (shortext,tag,fulltext) to nodes
var appendDataElementsFromSidecarXML = function(sideCarXml,saveXML){
	var excludeFullText = ['Media Info Xml'];
	for each(var dataElement in sideCarXml.DataElementList.DataElement) {
		if(dataElement.Type.toString() == "shorttext"  ) {
			 saveXML..ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(dataElement.Name.toString(),dataElement.Value.toString()));
		}	
		else if(dataElement.Type.toString() == "tag" ||  dataElement.Type.toString() == "set") {
			saveXML..TagList.appendChild(gmoNBCFunc.createTagNode(dataElement.Name.toString(),dataElement.Value.toString()));
		}
		else if(dataElement.Type.toString() == "fulltext" && !gmoNBCFunc.contains(excludeFullText,dataElement.Name.toString())){
			saveXML..FullTextList.appendChild(gmoNBCFunc.createFullTextNode(dataElement.Name.toString(),dataElement.Value.toString()));
		}
	}

	return saveXML;
}

var addEpisode = function(sideCarXml,matHelper){

	if (sideCarXml..Material.Episode.length() > 0 && sideCarXml..Material.Episode.EpisodeId.toString() != "") {
		print("Episode detected on [" + sideCarXml..Material.MatId.toString() + "]");
		var episodeXml = <Episode>						
							<FullTextList/>
							<ShortTextList/>
							<TagList/>
							<SeriesList/>
						</Episode>;
		episodeXml.Episode += <EpisodeId>{sideCarXml..Material.Episode.EpisodeId.toString()}</EpisodeId>;
		episodeXml.Episode += <Title>{sideCarXml..Material.Episode.Title.toString()}</Title>;
		episodeXml.Episode += <FrameRate>{sideCarXml..Material.Episode.FrameRate.toString()}</FrameRate>;
		episodeXml.SeriesList += <Series><SeriesCode>{sideCarXml..Material.Series.SeriesCode.toString()}</SeriesCode></Series>;
		episodeXml = appendDataElementsFromSidecarXML(sideCarXml..Material.Episode,episodeXml);
		
		//print("EpisodeSaveXml \n["+episodeXml+"]");
		var saveStatus = gmoNBCFunc.saveEpisodeXML(episodeXml);
		if(!saveStatus) throw new Error("Failure importing episode [" + sideCarXml..Material.Episode.EpisodeId.toString() + "]");

		return sideCarXml..Material.Episode.EpisodeId.toString();
	}
	else{
		print("No episode for this material import.");
		return false;
	}
}

var addSeries = function(sideCarXml){
	
	if (sideCarXml..Material.Series.length() > 0 && sideCarXml..Material.Series.SeriesCode.toString() != "") {
		print("Series detected on [" + sideCarXml..Material.MatId.toString() + "]");
		var seriesXml = <Series>						
							<FullTextList/>
							<ShortTextList/>
							<TagList/>
							<BrandList/>
						</Series>;
		seriesXml.Series += <SeriesCode>{sideCarXml..Material.Series.SeriesCode.toString()}</SeriesCode>;
		seriesXml.Series += <Title>{sideCarXml..Material.Series.Title.toString()}</Title>;
		seriesXml.Brand += <Brand><BrandCode>{sideCarXml..Material.Brand.BrandCode.toString()}</BrandCode></Brand>
		seriesXml = appendDataElementsFromSidecarXML(sideCarXml..Material.Series,seriesXml);

		//print("SeriesSaveXml \n["+seriesXml+"]");
		var saveStatus = gmoNBCFunc.saveSeriesXML(seriesXml);
		if(!saveStatus) throw new Error("Failure importing series [" + sideCarXml..Material.Series.SeriesCode.toString() + "]");

		return sideCarXml..Material.Series.SeriesCode.toString();
	}
	else{
		print("No series for this material import.");
		return false;
	}
}

var addBrand = function(sideCarXml){
	
	if (sideCarXml..Material.Brand.length() > 0 && sideCarXml..Material.Brand.BrandCode.toString() != "") {
		print("Brand detected on [" + sideCarXml..Material.MatId.toString() + "]");
		var brandXml = <Brand>						
							<FullTextList/>
							<ShortTextList/>
							<TagList/>
						</Brand>;
		brandXml.Brand += <BrandCode>{sideCarXml..Material.Brand.BrandCode.toString()}</BrandCode>;
		brandXml.Brand += <Title>{sideCarXml..Material.Brand.Title.toString()}</Title>;
		brandXml = appendDataElementsFromSidecarXML(sideCarXml..Material.Brand,brandXml);

		//print("BrandSaveXml \n["+brandXml+"]");
		var saveStatus = gmoNBCFunc.saveBrandXML(brandXml);
		if(!saveStatus) throw new Error("Failure importing brand [" + sideCarXml..Material.Brand.BrandCode.toString() + "]");

		return sideCarXml..Material.Brand.BrandCode.toString();
	}
	else{
		print("No brand for this material import.");
		return false;
	}
}

var getScanType = function(vidFilePath){
	var videoFileObj = new gmoNBCFunc.usefulFileObj(vidFilePath);

	if(!videoFileObj.exists()) throw Error ("Video file could not be found during scan type extraction. [" + vidFilePath + "]");

	var scanType = "";
	//We need to do a mediainfo on the mov for video scan type
	var mediainfoxml = gmoNBCFunc.getFileInfoXml(vidFilePath);
	var mediaInfoVideoTrackNode = mediainfoxml.track.(@type.toString()==="Video");
	scanType = mediaInfoVideoTrackNode.Scan_type[0].toString();
    if(typeof scanType !='undefined' &&  scanType.toUpperCase() == 'INTERLACED'){
        var scanOrder = mediaInfoVideoTrackNode.Scan_order[0];
        if(typeof scanOrder!='undefined' && scanOrder.toUpperCase() == 'TFF' ){
            scanType = "Interlaced_Upper";
        }else if (typeof scanOrder!='undefined' && scanOrder.toUpperCase() == 'BFF' ){
            scanType = "Interlaced_Lower";
        }
    }

    return scanType;
}

var importBrowseCommentsPXF = function(matId, importFile, ccTrackTypeName, importChain) {
        output("Making browse comments for material " + matId);
		output("Mat Id: "+matId);
		output("CC Track Type Name: " + ccTrackTypeName);
		output("Import Chain: " + importChain);
		
        try {
			var wscallResponse = wscall(<PharosCs>
			  <CommandList>
				<Command subsystem="comment" method="deleteComments">
				  <ParameterList>
					<Parameter name="matId" value={matId}/>
					<Parameter name="trackTypeName" value={ccTrackTypeName}/>
				  </ParameterList>
				</Command>
			  </CommandList>
			</PharosCs>);
        } catch (e) {
			throw new Error("ERROR: Unable to clear existing comments.");
		}
        
		if (importChain == null || importChain == ""){
			importChain = "None";
		}

		var contextRoot = wscall(<PharosCs><CommandList><Command subsystem="file" method="getContextRoot"/></CommandList></PharosCs>)..Output.toString();
		importFile = importFile.replace(contextRoot, "")
		
		try {
               wscall(<PharosCs>
                  <CommandList>
                    <Command subsystem="dataimport" method="doImport">
                      <ParameterList>
                        <Parameter name="importFile" value={importFile}/>
                        <Parameter name="importChain" value={importChain}/>
                      </ParameterList>
                    </Command>
                  </CommandList>
                </PharosCs>);
        } catch(e) {
			throw new Error("Unable to import captions pxf.");
		}
}

function addComments(sideCarXml,isImported){
	var matId = sideCarXml..Material.MatId.toString();
	print("Adding Comments to material");
	var processedTypes = [];
	for each(var ttl in sideCarXml..Material.TrackTypeLinks.TrackTypeLink){
		for each(var ttlComment in ttl.Comment){
			var ttlName = ttl.TrackTypeName.toString();
			var commentType = ttlComment.CommentTypeName.toString();
			var commentDetail = ttlComment.Detail.toString();
			var grade  = ttlComment.Grade.toString();
			var startTc  = ttlComment.StartTc.toString();
			var endTc  = ttlComment.EndTc.toString();

			if(isImported){
				if(!gmoNBCFunc.contains(processedTypes,commentType)){
					gmoNBCFunc.deleteComments(matId,ttlName,[commentType]);
					processedTypes.push(commentType);
				}
			}
			gmoNBCFunc.addComment(matId, commentType, commentDetail, ttlName, startTc, endTc, grade);
		}
	}
}

////////////////////////////////p//////////////////////////////////////////////    Start of Script   ////////////////////////////////////////////////////////////////////// 
try { 

	print("\nStarting run_gmoECUpload.js");
	
	// Global Script Vars 
	var debug = false;
	var sourceObj = {}; // Need to define explicity and early in case of error catching. Avoids cannot read undefined (property) from undefined (object) - leads to js error
	var validVidExts = ["mov"];
	var isRetryJob = false;	
	var stagingMedia = NBCGMO.omUploadSettings.defaultVideoStagingMedia;
	
	var jobDesc = getJobParameter("jobDescription");
	print("\nJobDesc\n"+jobDesc+"]");
	
	var priority = false;
	if (jobDesc..Priority !== "undefined" && jobDesc..Priority != "") {
		if(jobDesc..Priority.toString() == "true") {
			priority = true;
		}
	}	

	var requirements = {
		toReady : "Bypass (EC)",
		toOrderPlaced : "Order Placed",
		toECUploadFailed : "Failed (From EC)",
		toMediaRecieved : "Upload"
	};

	var states = {
		orderPlacedState : "Order Placed",
		ready : "Ready",
		notAvailableState: "Not available",
		uploadFailedEC : "Upload Failed (From EC)"
	};

	var extensions = {
		mov : "mov",
		xml : "xml"
	};

	var subComponentExt = ["CAP", "SCC", "PAC", "STL", "XML"];

	var tracksReadyForRegistration = [];
	var fileMissingErrorList = [];
	var trackTypeLinksIncorrectState = [];
	var browseCommentFilePaths = [];

	// This could be a Job Created from a Folder Monitor or else from a Retry Job. Either way the Job Descriptions will be different so run tests to workout the Mat Id
	var matId; // Final Var to be used for the MatId
	var filePath; // Final Var to be used for the path to where the file is
	var folderMonMatId = jobDesc..FolderMonitorMatId.toString();
	var isRetryJob = false;	
	var isComponentUpload = false;
	var isComponentUploadString = jobDesc..IsComponentUpload.toString();
	if(isComponentUploadString == "true"){
		isComponentUpload = true;
	}

	var retryMatId = jobDesc..domainKey.toString();
	print("\nFolderMonitor MatId [" + folderMonMatId + "] Retry MatId [" + retryMatId + "]");
	
	var transferFolderArr = "";
		
	if (folderMonMatId && retryMatId) {
		throw new Error("Cannot decide which MatId to use. FolderMonitorMatId has value [" + folderMonMatId + "] Retry MatId has value [" + retryMatId + "]");
	} else if (folderMonMatId) {
		matId = folderMonMatId;
	} else if (retryMatId) {
	 	isRetryJob = true;	
		matId = retryMatId;
	} else {
		throw new Error("Cannot find a MatId from Job Description");
	}
	
	var transferFolderPathArr= jobDesc..Path.toString().split("/");
	var transferFolder = transferFolderArr[transferFolderArr.length-1];
	var transferFolderPath = jobDesc..Path.toString()+ "/";

	var tagValueDropFolder = "FROM_EC_MEDIATOR";
	var uploadDir = lookup.dropfolder[tagValueDropFolder].mount;
	var failedDir =  uploadDir + "failed/ECRunner/" + matId + ".dir/";
	var failedFolder = failedDir;

	if(isRetryJob){
		print("Searching for import files form Failed directory since this is a retry...");
		transferFolderPath = failedFolder;
	}

	var xmlFilePath = transferFolderPath + matId + "." + extensions.xml;


	var sideCarXml = new XML(gmoNBCFunc.removeXmlHeader(FileUtils.readFile(xmlFilePath)));

	print("\nRunning ECUpload Job for [" + matId + "] Job is a retry? [" + isRetryJob + "] therefore file will be in [" + transferFolderPath + "] \n");

	// Create a Dashboard Updater Object
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",10);
	jobDashboard.updateStatusMap({"Script_MatId":matId});

	// Check whether material exists.
	var material_get_response = materialGet(matId.toString(),"tracktypelinks");
	var isImported = false;
    if (material_get_response.CommandList.Command.@success != "true") {
        output("No material record found for MatID : [" + matId.toString() + "], Performing import for first time from EC.")
    } else {
    	isImported = true;
        output("Updating Material : [" + matId.toString() + "] This was previousy imported from EC.");
    }

	// Save Metadata and create the Material for file import
	jobDashboard.updateStatusAndProgress("Importing Material XML",25);

	var metaDataSaved = materialMetadataSave(matId,sideCarXml,isImported);
	if (!metaDataSaved) throw new Error("Failed to save Metadata on Material [" + matId + "].Please validate Material Save XML.");

	// Establish a material helper to make things easier from here
	var matHelper = new gmoNBCFunc.materialHelper(matId);
	addComments(sideCarXml,isImported);

	//Add episode,brand, and series into the system as well if needed
	var brandCode = addBrand(sideCarXml);
	var seriesCode = addSeries(sideCarXml);
	var episodeId = addEpisode(sideCarXml);
	if(episodeId) matHelper.addEpisodeToSaveXml(episodeId);
	
	if(episodeId || seriesCode || brandCode) matHelper.saveUsingSaveXml();

	var materialTrackLinks = matHelper.getTrackTypes();
	if (materialTrackLinks.length <= 0) throw new Error("No Tracks on imported material [" + matId +"]. Failing import.");

	var ttlsNotReadyInGMO = [];
	for each(var trackTypeLink in sideCarXml..Material.TrackTypeLinks.TrackTypeLink){
		var ttlState = trackTypeLink.StateName.toString();
		if(ttlState != states.ready){
			ttlsNotReadyInGMO.push(trackTypeLink.TrackTypeName.toString());
		}
	}

	// If its not at ready we need to get it to order placed for an initial upload/retry, but if it is still in Order placed in GMO don't transition
	for each(var ttl in materialTrackLinks){
		if(matHelper.getStateOfTtl(ttl) == states.notAvailableState ){
			gmoNBCFunc.transitionTrackTypes(matId,requirements.toOrderPlaced,ttl);
		}
	}

	for each(var track in getTrackSaveXML(sideCarXml)){
		var mediaName = track.MediaName.toString();

		var validateFilesExist = [];
		var extension = track.FileExtension.toString();
		var fileName = matId + "." + extension;
		var trackTypeLinks = [];
		var skipTrackRegistration = false;

		var trackAlreadyExists = matHelper.getTrackList().(MediaName.toString() === mediaName && parseInt(DeleteMark) === 0 && Encoded.toString() === "true").length() > 0;
		print("Track [" + mediaName + "] exits ["+ trackAlreadyExists + "]");

		if(!trackAlreadyExists){
			print("Checking if media is restored to DIVA.");
			var delim = mediaName.indexOf('_');
			var divaMediaName = mediaName.substr(0,delim) + "_DIVA_" +  mediaName.substr(delim + 1,mediaName.length).replace("T2_", "");
			trackAlreadyExists = matHelper.getTrackList().(MediaName.toString() === divaMediaName && parseInt(DeleteMark) === 0 && Encoded.toString() === "true").length() > 0;
			print("DIVA Track [" + divaMediaName + "] exits ["+ trackAlreadyExists + "]");
		}
		//Encountered a video media
		if(track.TrackDefinition.(TrackTypeName == "Video").toString() != "") {
			var ttlState = matHelper.getStateOfTtl("Video");
			if((ttlState === states.ready) && trackAlreadyExists){
				skipTrackRegistration = true;
				print("Track [" +mediaName + "] was successfully registered on previous import. Skipping...");
			}
			else if((ttlState != states.orderPlacedState) && (ttlState != states.notAvailableState)){
				if(!gmoNBCFunc.contains(trackTypeLinksIncorrectState,"Video")){
					trackTypeLinksIncorrectState.push("Video");
				}
			}	

			var sourceFilePath = transferFolderPath + fileName;	
			trackTypeLinks.push("Video");		
			validateFilesExist.push(sourceFilePath);
		}
		else{
			var skipComponentTrack = true;
 			var ph = new ProfileHelper();
			for each (var td in track.TrackDefinition){
				var skipTD = false;
				var trackTypeName = td.TrackTypeName.toString();
				var tdFileTag = ph.getTrackType(trackTypeName).FileTag.toString();
				var ttlState = matHelper.getStateOfTtl(trackTypeName);

				if(ttlState === states.ready && trackAlreadyExists){
					skipTD = true;
				}else{
					skipComponentTrack = false;
				}

				if(tdFileTag.indexOf("MOS") === -1 && !skipTD){
					var sourcefileName = matId + "-" + tdFileTag + "." + extension;
					var sourceFilePath = transferFolderPath + sourcefileName;
					if (fileExists(sourceFilePath)) {
						trackTypeLinks.push(trackTypeName);
						validateFilesExist.push(sourceFilePath);
						if(gmoNBCFunc.contains(subComponentExt,extension.toUpperCase())){
							print("Adding in PXF file for browse caption import.");
							var captionBrowseObj = new Object();
							var browseCommentPath = lookup.media[mediaName].mount;
							if (lookup.media[mediaName].usesMatIdDir){
								var browseCommentPathObj = new gmoNBCFunc.usefulFileObj(browseCommentPath + matId + ".dir/");
							} else {				
								var browseCommentPathObj = new gmoNBCFunc.usefulFileObj(browseCommentPath);
							}
	
							captionBrowseObj.path = browseCommentPathObj.unix_file + sourcefileName.substr(0, sourcefileName.lastIndexOf(".")) + ".pxf";
							captionBrowseObj.trackTypeName = trackTypeName;
							validateFilesExist.push(transferFolderPath + sourcefileName.substr(0, sourcefileName.lastIndexOf(".")) + ".pxf");
							browseCommentFilePaths.push(captionBrowseObj);
						}
					} else {
						print("Ignoring [" + trackTypeName + "] because [" + sourceFilePath + "] does not exist");
						skipTD = true;
					}
	
				}
				else if(!skipTD && trackTypeName.indexOf('MOS')>-1){
					trackTypeLinks.push(trackTypeName);					
				}
			}
			if(skipComponentTrack){
				skipTrackRegistration = true;
				print("Track [" +mediaName + "] was successfully registered on previous import. Skipping...");
			}else{
				if((ttlState != states.orderPlacedState) && (ttlState != states.notAvailableState) && gmoNBCFunc.contains(matHelper.getTrackTypes,trackTypeName)){
					if(!gmoNBCFunc.contains(trackTypeLinksIncorrectState,trackTypeName)){
						trackTypeLinksIncorrectState.push(trackTypeName);
					}		
				}
			}
		}

		//We need to do some special logic if it is a caption/sub to add the pxf import
		var registrationObject = new Object();

		//Validate the files for the track exist in the upload area
		var sourceFilesFinal = [];
		if(!skipTrackRegistration){
			for each (var file in validateFilesExist){
				var importFileObj = new gmoNBCFunc.usefulFileObj(file);
				if(!importFileObj.exists()){
					fileMissingErrorList.push(importFileObj.unix_file);	
				}
				else{
					sourceFilesFinal.push(importFileObj.unix_file);
				}		
			}			
		}

		registrationObject.sourceFiles = sourceFilesFinal;
		registrationObject.mediaName = mediaName;
		registrationObject.uploadFolder = transferFolderPath;
		registrationObject.fileId = fileName;
		registrationObject.frameRate = track.FrameRate.toString();
		registrationObject.incode = track.Incode.toString();
		registrationObject.outcode = track.Outcode.toString();	
		registrationObject.ext = extension;
		registrationObject.trackTypeLinks = trackTypeLinks;
		registrationObject.skipFileCopy = false;
		registrationObject.completedTrackRegistration = false;
		registrationObject.completed = false;
		registrationObject.trackXML = track;
		
		registrationObject.scanType = "";
		if(gmoNBCFunc.contains(trackTypeLinks,"Video") && !skipTrackRegistration){
			var vidFilePath = transferFolderPath + matId + "." + extensions.mov;
			var scanType = getScanType(vidFilePath);
			registrationObject.scanType = scanType;
		}

		if(registrationObject.mediaName.toUpperCase().indexOf('BROWSE_') >= 0){
			registrationObject.skipFileCopy = true;
		}

		if(!skipTrackRegistration){
			tracksReadyForRegistration.push(registrationObject);
		}
	}

	jobDashboard.updateStatusAndProgress("Validating import files",25);

	//Validate associated tracks being processed have ttls in Order Placed
	if(trackTypeLinksIncorrectState.length > 0){
		throw new Error("Error: TrackTypeLinks not in " + states.orderPlacedState + " are [" + trackTypeLinksIncorrectState + "]");
	}else{
		print("Validation: - PASSED - TRACK TYPE LINK STATE VERIFICATION.");		
	}

	//Push Tracks in Order placed to Media Receieved

	if(fileMissingErrorList.length > 0){
		throw new Error("Error: File(s) missing for import registration. Please retry transfers from EC manually.\n" + fileMissingErrorList);
	} else{
		print("Validation: - PASSED - FILE EXISTENCE VERIFICATION.");
	}

	for each(var regObj in tracksReadyForRegistration){
		for each(var regttl in regObj.trackTypeLinks){
			if(!gmoNBCFunc.contains(ttlsNotReadyInGMO,regttl)) {
				gmoNBCFunc.transitionTrackTypes(matId,requirements.toMediaRecieved,regttl);
			}			
		}
	}
	//Begin the process of moving the files to the appropriate T2 Medias in DC.
	//We'll mark the registration objects as complete. If they do not throw an error. Otherwise they'll transition to failed.
	jobDashboard.updateStatusAndProgress("Registering Tracks",50);
	for each(var regObj in tracksReadyForRegistration){
		try{


			print("Registering Track for media [" + regObj.mediaName + "]");

			var unencodedTrack = gmoNBCFunc.complexUnencodedTrackSave(matId,
											regObj.mediaName,
											regObj.frameRate,
											regObj.incode,
											regObj.outcode);

			for each (var trackDefintion in regObj.trackXML.TrackDefinition){
				var trackTypeName = trackDefintion.TrackTypeName.toString();
				var position = trackDefintion.Position.toString();
				var filePosition = trackDefintion.FilePosition.toString();
				var fileId = trackDefintion.FileId.toString();
				var channels = trackDefintion.Channels.toString();

				gmoNBCCompFunc.makeAndSaveTrackDef(matId,
												 regObj.mediaName,
												 trackTypeName,
												 position,
												 channels,
												 filePosition,
												 regObj.ext,
												 regObj.frameRate,
												 fileId);
			}

			//Add in scan type on Video Track def
			if(regObj.scanType != ""){
				matHelper.refresh();
				var trackXML = matHelper.getTrackXmlByMedia(regObj.mediaName);
				trackXML.TrackDefinition.(TrackTypeName.toString() === "Video").ScanType = regObj.scanType;
				matHelper.addTrackToSaveXml(trackXML);
				matHelper.saveUsingSaveXml();
			}

			regObj.completedTrackRegistration = true;
		}
		catch(e){
			regObj.completedTrackRegistration = false;
			print("Error occured registering Track [" + regObj.mediaName + "] Message: " + e);
		}
	}

	//Lets do the file copy after there were no issues during track registration
	for each(var regObj in tracksReadyForRegistration){
		if(!regObj.completedTrackRegistration){
			throw new Error("Error(s) occured during track registration for Material [" + matId + "] on import.");
		}else{
			if(!regObj.skipFileCopy){
				var destPath = lookup.media[regObj.mediaName].mount;
				if (lookup.media[regObj.mediaName].usesMatIdDir){
					var destFilePathObj = new gmoNBCFunc.usefulFileObj(destPath + matId + ".dir/");
					gmoNBCFunc.makeDirectory(destFilePathObj.unix_file);
				} else {				
					var destFilePathObj = new gmoNBCFunc.usefulFileObj(destPath);
				}
			
				for each (var fileToCopy in regObj.sourceFiles){
					var fileToCopyObj = new gmoNBCFunc.usefulFileObj(fileToCopy.toString());
					gmoNBCFunc.moveFile(fileToCopy, destFilePathObj.unix_file + fileToCopyObj.filename);
				}
			}
		}
		regObj.completed = true;
	}

	matHelper.saveShortTextValue("Content Transfer Workflow State", "Ready in DC X");
	var ttlsTransitionedToready = [];
	for each(var regObj in tracksReadyForRegistration){
		for each (ttlTransition in regObj.trackTypeLinks){
			if(!gmoNBCFunc.contains(ttlsTransitionedToready,ttlTransition)){
				gmoNBCFunc.transitionTrackTypes(matId,requirements.toReady,ttlTransition);
				ttlsTransitionedToready.push(ttlTransition);				
			}
		}
	}

	//Import the comments on the browse
	if(browseCommentFilePaths.length > 0){
		for each (var browseObj in browseCommentFilePaths){
			importBrowseCommentsPXF(matId, browseObj.path, browseObj.trackTypeName, "None");	
		}
	}

	print("COMPLETE: Import for material [" + matId + "] is complete!");
	if (fileExists(transferFolderPath)){
		print("Transfer folder exists, cleaning up files/folder for this folder [" + transferFolderPath + "].");
		if (!gmoNBCFunc.deleteDirectory(transferFolderPath, true)){
	     	print("Failed to remove files.");
		}
	}

	jobDashboard.updateStatusAndProgress("Finished Import Successfully",100);

}catch(e){
	print("\n"+e.message);

	var matHelper = new gmoNBCFunc.materialHelper(matId); //refresh this incase earlier failure
	gmoNBCFunc.makeDirectory(failedFolder);

	//In the event we actually get past the file exist validation
	if(tracksReadyForRegistration.length > 0){
		print("Performing failure operations for ["+ tracksReadyForRegistration.length + "] tracks.");
		for each(var regObj in tracksReadyForRegistration){
			if(!regObj.completed){

				for each (var ttl in regObj.trackTypeLinks){
					if(matHelper.getStateOfTtl(ttl) == states.notAvailableState){
						gmoNBCFunc.transitionTrackTypes(matId,requirements.toOrderPlaced,ttl);
						matHelper.refresh();
					}
					if(matHelper.getStateOfTtl(ttl) == states.orderPlacedState){
						gmoNBCFunc.transitionTrackTypes(matId,requirements.toMediaRecieved,ttl);
					}
					gmoNBCFunc.transitionTrackTypes(matId,requirements.toECUploadFailed,ttl);
				}

				if(regObj.trackXML.Encoded.toString() === "false" && !isComponentUpload){
				print("Deleting track for media [" + regObj.mediaName + "]");
				gmoNBCFunc.materialTrackDelete(matId, regObj.mediaName);
				}
			}
		}
		if(!isRetryJob){
			for each(var regObj in tracksReadyForRegistration){
				if(!regObj.completed){
					for each (var fileToFail in regObj.sourceFiles){
						var fileToFailObj = new gmoNBCFunc.usefulFileObj(fileToFail.toString());
						gmoNBCFunc.moveFile(fileToFail, failedFolder + fileToFailObj.filename);
					}
				}
			}
			gmoNBCFunc.moveFile(xmlFilePath, failedFolder + matId + ".xml");
		}
	}
	else{
		print("Failing with no tracks found ready for registration.");
		//Fail the tracktype links
		var failedMaterialXml = matHelper.getMaterialXml();
		for each (var ttl in failedMaterialXml..TrackTypeLink){
			//If we fail during a retry
			if(matHelper.getStateOfTtl(ttl.TrackTypeName.toString()) == states.notAvailableState){
				gmoNBCFunc.transitionTrackTypes(matId,requirements.toOrderPlaced,ttl.TrackTypeName.toString());
				matHelper.refresh();
			}
			if(matHelper.getStateOfTtl(ttl.TrackTypeName.toString()) == states.orderPlacedState){
				gmoNBCFunc.transitionTrackTypes(matId,requirements.toMediaRecieved,ttl.TrackTypeName.toString());
			}
			gmoNBCFunc.transitionTrackTypes(matId,requirements.toECUploadFailed,ttl.TrackTypeName.toString());
		}

		for each (var track in failedMaterialXml..Track){
			if(track.Encoded.toString() === "false" && !isComponentUpload){
				print("Deleting track for media [" + track.MediaName.toString() + "]");
				gmoNBCFunc.materialTrackDelete(matId, track.MediaName.toString());				
			}
		}

		//Since we're failing things not at ready. Move everything from the upload dir to failed.
		if(!isRetryJob){
			var failedFolderObj = new File(transferFolderPath);
			for each(var file in failedFolderObj.listFiles()){
				gmoNBCFunc.moveFile(String(file.getAbsoluteFile()), failedFolder + file.getName());
			}
			gmoNBCFunc.moveFile(xmlFilePath, failedFolder + matId + ".xml");
		}
	}

	print("Failure operations complete.");

	// Yell	to Front End
	if (typeof(jobDashboard) !== "undefined") {
		jobDashboard.updateStatus(e.message);	
	}
	throw(e);
}	
