/**
 *  run_imageUpload.js - a wsrunner used to upload image files to the GMO system
 *
 *  This script aims to do the following:
 *   - Copy an image file found in an upload folder to the appropriate media
 *   - Create a material with image specific metadata
 *   - Save the track type as graphic
 **/

// Load NBC GMO Libraries
load('/opt/evertz/mediator/lib/js/shellfun.js');
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_component_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_settings.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");

try {

    // ***************************
    //  Get Details from Job Desc
    // ***************************
	var jobDesc = getJobParameter("jobDescription");                        // Job Description
	var matId = jobDesc..MatId.toString();                   // Material ID (from Job Description)
    var materialHelper = new gmoNBCFunc.materialHelper(matId);              // Material Helper Used to Build the Save XML
    var trackTypeName = jobDesc..TrackTypeName.toString();  // The Track Type Name
	var srcFilePath = jobDesc..FileName.toString();          // The Path of the Image File
    var frameRate = materialHelper.getMaterialFrameRate();                  // The Material Frame Rate
    var aspectRatio = materialHelper.getAspectRatio();                      // The Material Aspect Ratio
    var mediaReceived = false;                                              // Used to Transition a Failed Upload Prior to Order Placed
    var imageType = "Dub Cards";                                // Not sure where we can get this info from?

    // *************************
    //      Status Updates
    // *************************
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script...", 0);
	jobDashboard.updateStatusMap({"Script_MatId":matId});

	gmoNBCFunc.transitionMaterial(matId, "Order Placed", "Upload");
	mediaReceived = true;   // Notify the system an Order has been placed

    output("\nUsing the following Material Details...");
    output("   Material ID = " + matId);
    output("   Track Type Name = " + trackTypeName);
    output("   File Path = " + srcFilePath);
    output("   Frame Rate = " + frameRate);
    output("   Image Type = " + imageType);

	// Update the Job Dashboard with the progress
	jobDashboard.updateStatusAndProgress("Getting Details from Image File...", 15);
    output("\nGetting Details from Image File...");

    // ****************************
    //  Get Details from mediainfo
    // ****************************
    var mediaInfoOutput = gmoNBCFunc.getFileInfoXml(srcFilePath);

    output("Using the following Image Details...");
    output("   Artwork Height = " + mediaInfoOutput..Height[0].toString());
    output("   Artwork Width = " + mediaInfoOutput..Width[0].toString());

    // **************************
    //    Determine Image Type
    // **************************

    if (imageType.indexOf("Dub Cards") != -1) {
        var mediaName = "DC_DUB_CARD";
    } else {
        throw new Error("Invalid Image Type");
    }

    var mediaPath = lookup.media[mediaName].mount;

    // **************************
    //     Move File to Media
    // **************************
	// Update the Job Dashboard with the progress
	jobDashboard.updateStatusAndProgress("Uploading the Image File...", 30);
    output("\nUploading the Image File...");

    // Determine the Track File Path
    if (lookup.media[mediaName].usesMatIdDir) {
        var trackFilePath = matId + ".dir/";
        // Create the ".dir" Sub-Directory
        gmoNBCFunc.makeDirectory(mediaPath + trackFilePath);
    } else {
        var trackFilePath = "";
    }

    var srcFileObj = new gmoNBCFunc.usefulFileObj(srcFilePath);   // Useful File Object (same as above for testing)
    var destFilePath = mediaPath + trackFilePath + matId + "." + srcFileObj.extension;
    var destFileObj = new gmoNBCFunc.usefulFileObj(destFilePath);   // Useful File Object (same as above for testing)

    // Move the File to the Destination Media
    gmoNBCFunc.copyFileDeleteSource(srcFileObj.unix_file, destFileObj.unix_file);

	// Update the Job Dashboard with the progress
	jobDashboard.updateStatusAndProgress("Copy of Material to Media was successful...", 45);

    // *************************
    //     Save the Material
    // *************************
	// Update the Job Dashboard with the progress
	jobDashboard.updateStatusAndProgress("Building the Material Metadata...", 60);
    output("\nBuilding the Material Metadata...");

    // Build the "Save XML" used by the Material Helper
	materialHelper.addDurationToSaveXml("00:00:00:01"); // Transfers (in general) require at least 1 frame of duration
    materialHelper.addAspectRatioToSaveXml(aspectRatio);
    materialHelper.addOwnerToSaveXml("NBCU GMO");
	materialHelper.addShortTextToSaveXml("Artwork Height", mediaInfoOutput..Height[0].toString());
	materialHelper.addShortTextToSaveXml("Artwork Width", mediaInfoOutput..Width[0].toString());

    // Build the Track XML
    var trackXml =
        <Track>
            <Encoded>true</Encoded>
            <MediaName>{mediaName}</MediaName>
            <FileId>{destFileObj.basename}</FileId>
            <FileExtension>{destFileObj.extension}</FileExtension>
            <Incode rate={frameRate}>00:00:00:00</Incode>
            <Outcode rate={frameRate}>00:00:00:01</Outcode>
        </Track>;

    // Build the Track Definition XML (within the Track XML)
    var trackDefXml =
        <TrackDefinition>
            <TrackTypeName>{trackTypeName}</TrackTypeName>
            <TrackFile>
                <Path>{trackFilePath}</Path>
                <Name>{destFileObj.filename}</Name>
            </TrackFile>
            <Position>0</Position>
            <FilePosition>0</FilePosition>
        </TrackDefinition>;

    // Append the Track Definition XML to the Track XML
    trackXml.appendChild(trackDefXml);
    // Finally, put it all together
    materialHelper.addTrackToSaveXml(trackXml);
	// Update the Job Dashboard with the progress
	jobDashboard.updateStatusAndProgress("Registering the Image Material...", 85);
    output("Registering the Image Material...");
    // Save the Material
	materialHelper.saveUsingSaveXml();
	// Update the Job Dashboard with the progress
	jobDashboard.updateStatusAndProgress("Finished Image Upload Successfully", 100);
    output("Finished Image Upload Successfully!");

    // *********************************
    //    Transition Workflow to Ready
    // *********************************
	gmoNBCFunc.transitionMaterial(matId, "Media Received", "Bypass Spot Check");

    // Quit Cleanly
    quit(0);

} catch (e) {
    print(e.name);
    print(e.message);
	if (typeof(jobDashboard) !== "undefined") {
		jobDashboard.updateStatus(e.message);
	}

	// We need to fail from the appropriate workflow state
	if (mediaReceived == true) {
		gmoNBCFunc.transitionMaterial(matId, "Media Received", "Failed");
	} else {
		gmoNBCFunc.transitionMaterial(matId, "Order Placed", "Failed");
	}

    quit(-1);
};
