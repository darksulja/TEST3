importPackage(Packages.com.pharos.poxclient.baton);
//load("/usr/local/pharos/etc/scripts/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
//load("/usr/local/pharos/etc/scripts/nbcgmo_baton_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_baton_fun.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");

function isTelecine(batonReportXML){
	var results = {
		isTelecine:false
	};

	try {
		//Get all errors with subitem = Cadence
		var errors = batonReportXML..streamnode..decodedvideochecks.error.(@subitem=="Cadence");
		if(typeof errors != "undefined" && errors.length()>=1){
			for each(var error in errors){
				print("Error Node "+error);
				if(error.(@synopsis == "The Cadence pattern does not match the restriction.")){
					var cadencePattern = error.Params.Param.(@Name=="Current_Cadence_Pattern").@Value.toString();
					print("Cadence Pattern is ["+cadencePattern+"]");
					if(gmoNBCFunc.contains(NBCGMO.CadencePatterns,cadencePattern)){
						results.isTelecine = true;
						results.cadencePattern = cadencePattern;
						break;
					}
				}
			}
		}
	}catch(e){
		print("Error while trying to identify cadence from Baton Report XML"+e);
	}
	return results;
}

const CADENCE_PATTERN = "Cadence Pattern";
const TELECINE = "Telecine";

try {
	var debug = false;
	
	// Get Baton information from lookup.js
	var batonSettings = lookup.baton["BATON_INFORMATION"];
	var batonAddress = batonSettings.ipAddress;
	var batonPort = batonSettings.port;
	var batonUserName = batonSettings.userName;
	var batonPassword = batonSettings.password;
		
	var commentType = NBCGMO.defaultBatonCommentType;
			
	// Create a Dashboard Updater Object
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);
	
	var jobDesc = getJobParameter("jobDescription");
	if(debug) print("\nJobDesc\n"+jobDesc+"\n");
		
	var matId = jobDesc..material.Material.MatId.toString() ;
	var materialXml = materialGet(matId, "trackTypeLinks", "tracks", "comments", "owners","tag") ;
	
	output("Running Baton checks against Material [" + matId + "].");
	jobDashboard.updateStatusMap({"MATERIAL_ID" : matId});
	
	var materialType = materialXml..MaterialType.toString();
	
	for each (var track in materialXml..Track){
		var mediaName = track..MediaName.toString();
		output("Checking if [" + mediaName + "] is valid to be used with Baton.");
		if (NBCGMO.validBatonMedias.indexOf(mediaName) >= 0){
			output("Media [" + mediaName + "] is a valid media.")
			var trackFrameRate = track.FrameRate.toString();
			
			var mountPath = lookup.media[mediaName].mount; 
			output("++++++++++++++++++++++" );
			output("mountPath [" + mountPath + "]");
			
			var extension = track.FileExtension.toString();
			var fileId = track.FileId.toString();
			
			if (lookup.media[mediaName].usesMatIdDir){
				var filePath = mountPath + "/" + matId + ".dir/" + fileId + "." + extension;	
			} else {				
				var filePath = mountPath + "/" + fileId + "." + extension;
			}
			var batonSourceFileObj = new gmoNBCFunc.usefulFileObj(filePath);
			break;			
		}
	}	
	
	// Defaulting for now, till NBC confirm how they want this to work dynmaically.
	var baton_test_plan;
 	if (materialXml..Material.FrameRate.toString() == "DF30") {
		baton_test_plan = "GMO_HD_MASTERS_29.97";
	} else if (materialXml..Material.FrameRate.toString() == "P23_976") {
		baton_test_plan = "GMO 23.98 HD";
	} else {
		baton_test_plan = "GMO_50i";
	}
	
/* 		//	TESTING
		var baton_test_plan = "GMO_HD_MASTERS_29.97";
//		var baton_test_plan = "GMO_50i"; */
		
		
		
	// Connect to Baton, and set all required settings.
	output("Connecting to Baton.");
	output("Baton Address [" + batonAddress + "]");
	output("Baton Port [" + batonPort + "]");
	output("Baton Username [" + batonUserName + "]");
	output("Baton Password [" + batonPassword + "]");
	
	var baton = new BatonTask(batonAddress, batonPort, batonUserName, batonPassword);
	baton.setPriority("High");
	baton.setTestPlan(baton_test_plan);
	output("setTestPlan [" + baton_test_plan + "]");
	//delete me later
	output("batonSourceFileObj   :"+batonSourceFileObj);  
	
	baton.setMediaFileType(batonSourceFileObj.extension);
	output("extension [" + extension + "]");
	output("win_path [" + batonSourceFileObj.win_path + "]");
	baton.setMediaPath(batonSourceFileObj.win_path);
	baton.startValidation(batonSourceFileObj.basename);
	output("basename [" + batonSourceFileObj.basename + "]");
	
	var pc = 0;
	var batonStatus = ""
	var lastPc = 0;
	var minPc = 6;
	var maxPc = 90;
	var baton_timeout = 10000; // seconds
	var sleep_time = 10;
	var jobProgressPc = 0;
	var lastJobProgressPc = 0;
	var jobYetToFinish = true;
	var retryOnAbort = true;
	var baton_id = baton.getTaskId();
		
	while (jobYetToFinish) {
		if (baton_timeout < 0) throw new Error("Timed out waiting for Baton Status");
		sleep(sleep_time);
		baton_timeout -= sleep_time;
		pc = baton.getProgress();
		batonStatus = baton.getStatus()[0]; // Running, Cancelled, Finished, Aborted or Error
		if (debug) output("Got PC value of ["+pc+"]");
		if (debug) output("Got batonStatus of ["+batonStatus+"]");
		if (batonStatus == 'Running') {
			if (pc != lastPc) {
				output("Mat ID ["+matId+"] Baton Task ["+baton_id+"] Progress ["+pc+"%] Timeout ["+baton_timeout+"]");
				baton_timeout = 10000;
				jobProgressPc = Math.round((pc / (100/(maxPc - minPc)))+minPc);
				if (jobProgressPc != lastJobProgressPc) {
					output("Total Job Progress at ["+jobProgressPc+"%]");
					jobDashboard.updateStatusAndProgress("Validating File In Baton", jobProgressPc);
					lastJobProgressPc = jobProgressPc;
				}
				lastPc = pc;
			}
		} else if (batonStatus == 'Finished') {
			output("Mat ID ["+matId+"] Baton Task ["+baton_id+"] Completed");
			jobYetToFinish = false;
		} else if (batonStatus == 'Aborted') {
			output("Mat ID ["+matId+"] Baton Task ["+baton_id+"] Progress ["+pc+"%] - ABORTED");
			// retry the test one time only
			if (! retryOnAbort) throw new Error("Baton Reports Job status of ["+batonStatus+"] and a Retry has already been attempted");
			retryOnAbort = false;
			output("Re-Validating file after Abort");
			output("Setting job percent back to 5");
			
			jobDashboard.updateStatusAndProgress("Re-Validating Aborted File",5);
			
			pc = 0;
			lastPc = 0;
			jobProgressPc = 0;
			lastJobProgressPc = 0;
			baton_timeout = 1000;
			
			baton.startValidation(file_name);
			baton_id = baton.getTaskId();
			output("New TASK_ID: "+baton_id);
			
		} else if ((batonStatus == 'Cancelled')||(batonStatus == 'Error')) {
			output("Mat ID ["+matId+"] Baton Task ["+baton_id+"] Progress ["+pc+"%] Status ["+batonStatus+"]");
			throw new Error("Baton job reports status of ["+batonStatus+"]");
		} else {
			throw new Error("Unrecognised Baton Job status of ["+batonStatus+"]");
		}
	}

	jobDashboard.updateStatusAndProgress("Getting Report",92);
		
	// process errors
	baton.waitForFinish(); // have to call this, even though we know we're finished as it does all the report parsing stuff needed to get the xml obj below...
	var report_xml_str = baton.getReport();

	// Replace the prolog.  NB double escaping for Javascript string literal, and then literal ? (as opposed to regexp ?)
	report_xml_str = report_xml_str.replaceFirst("<\\?xml[^>]*\\?>\n", "");

	var report_xml = XML(report_xml_str);

	found_errors = false;
	if (debug) output(report_xml..streamnode);

	//count BWF in baton xml
	jobDashboard.updateStatusAndProgress("Parsing Report",93);
	var BWFlist = report_xml..streamnode.(@name == "BWF Audio");
	var audioCountBaton = BWFlist.length();
	if (audioCountBaton == 0) {
		var aesList = report_xml..streamnode.(@name == "AES3 Audio");
		var audioCountBaton = aesList.length();
	}
	var count = materialXml..TrackTypeLink.(StateId != "1").TrackTypeClass.(ClassName == "Audio").length();
	
	output("Audio Count Baton="+ audioCountBaton +" Audio Count Mediator=" +count);

	jobDashboard.updateStatusAndProgress("Generating Results",94);
	
	var errNum = 0;
	var warnNum = 0;
	var infoNum = 0;
	var materialImportXml = 
	<Pharos>
		<Material>
			<MatId>{matId}</MatId>
			<FrameRate>{materialXml..Material.FrameRate.toString()}</FrameRate>
		</Material>
	</Pharos>;
	
	// Create empty materialSaveXml object to be used.
	for each (var ttn in materialXml..Material.TrackTypeLink.TrackTypeName) {
			materialImportXml.Material.TrackTypeLink += <TrackTypeLink>{ttn}</TrackTypeLink>;
	}
	
	output("Parsing Baton report results and mapping to relevant Track Types.");
	// loop through each stream
	for each (var stream in report_xml..streamnode) {
		var trackDefMap = gmoNBCFunc.createTrackDefPositionMap(matId, mediaName);
		var track_type_name = trackDefMap[stream.@id];
		
		var unmatchedTrack = false;
		//if (track_type_name == "") track_type_name = "Video"; // put all other information on the video track
		if (track_type_name == "" || track_type_name == null){
			track_type_name = "Video";
			unmatchedTrack = true;
		}
		if (track_type_name == "Video") {
			if (stream.info.field.(@name == "Display Aspect Ratio").length() > 0) {
				var aspectRatio = stream.info.field.(@name == "Display Aspect Ratio").@value.toString();
				if (debug) output(aspectRatio);
				var medAspectRatio = materialXml..Material.AspectRatio.toString() ;
				if (debug) output(medAspectRatio);
				if (aspectRatio != medAspectRatio) { 
					materialImportXml = gmoNBCBatonFunc.addComment(materialImportXml, commentType, "Aspect ratio of file does not match Aspect Ratio Baton detected.", "Video", trackFrameRate);
				}
			} else {
				if (debug) output("No aspect ratio element found in this XML");
			}
			var blackFrames = stream.info.field.(@name == "Black Frames(During the Video)").@value.toString(); // eg. "(00:04:47:160, 0.960) &#10;, (00:12:21:880, 34.640) &#10;"
			blackFrames = blackFrames.replace(/ &#10;/g,"").replace(/[\t\n\r ]/g,"");
			if (debug) output("Black Frames ["+blackFrames+"]");
			if (blackFrames != "NotPresent" && blackFrames != "") {
				found_erros = true;
				for each (var bf in blackFrames.split("),(")) {
					var bf_array = /\(?([0-9:]+),([0-9.]+)\)?/.exec(bf);
					// var bf_tc = batonTcToTc(bf_array[1],incode); // We don't need to offset by the incode as Baton is outputting timecodes correctly
					var bf_tc = batonTcToTc(bf_array[1],zero_timecode_string);
					var bf_dur = bf_array[2];
					print("black at tc=["+bf_tc+"] dur=["+bf_dur+"]");
					materialImportXml = gmoNBCBatonFunc.addComment(materialImportXml, commentType, "Black frames for a duration of [" + bf_dur + "]", "Video", trackFrameRate);
				}
			}
		} else {
			if (debug) output("Handling stream " + track_type_name);
		}

		// loop through each error in the stream
		for each (var error in stream..error) {
						
			if (error.@description.toString() != "") {
				description = error.@description.toString();
			} else {
				description = "No description provided by Baton.";
			}
			if (unmatchedTrack){
				description = description + " (No Matching TrackTypeLink. DEFAULTED TO VIDEO)";
			}
			if (error.@severity == "Info") {
				grade = 1;
				infoNum++
			} else if (error.@severity == "Warning") {
				grade = 3;
				warnNum++
			} else {
				grade = 5;
				errNum++
				found_errors = true;				
			}
			
			if (error.@startsmptetimecode.toString() != "") {
				startTimecode = error.@startsmptetimecode.toString();
			} else if (error.@startimecode.toString() != "") {		
				startTimecode = gmoNBCBatonFunc.batonTcToSmpteTc(error.@startimecode, trackFrameRate);
			} else if (error.@timecode.toString() != "") {		
				startTimecode = gmoNBCBatonFunc.batonTcToSmpteTc(error.@timecode, trackFrameRate);
			} else {
				startTimecode = "00:00:00:00";
			}
			
			if (error.@endsmptetimecode.toString() != "") {
				endTimecode = error.@endsmptetimecode.toString();
			} else if (error.@endtimecode.toString() != "") {		
				endTimecode = gmoNBCBatonFunc.batonTcToSmpteTc(error.@endtimecode, trackFrameRate);
			} else if (error.@timecode.toString() != "") {		
				endTimecode = gmoNBCBatonFunc.batonTcToSmpteTc(error.@timecode, trackFrameRate);
			} else {
				endTimecode = "00:00:00:00";
			}
			
			var trackIncode = materialXml..Track.(MediaName == mediaName).Incode.toString();
			
			materialImportXml = gmoNBCBatonFunc.addComment(materialImportXml, commentType, description, track_type_name, trackFrameRate, startTimecode, endTimecode, trackIncode, grade);
		}
	}

	//Telecine Identification 
	var results = isTelecine(report_xml);
	var materialHelper = new gmoNBCFunc.materialHelper(matId);
	if(results.isTelecine){
		materialHelper.saveShortTextValue(TELECINE, "true");
		materialHelper.saveShortTextValue(CADENCE_PATTERN, results.cadencePattern);
	}
	
	var errMsg = "";
	if (errNum > 0) errMsg = errMsg + "Errors ["+errNum+"] ";
	if (warnNum > 0) errMsg = errMsg + "Warnings ["+warnNum+"] ";
	if (infoNum > 0) errMsg = errMsg + "Info ["+infoNum+"] ";
	if (errMsg == "") errMsg = "No errors detected in file ";
	if (! retryOnAbort) errMsg = errMsg + "on second attempt of validation"
	
	jobDashboard.updateStatusMap({"JOB__ERROR" : errMsg});
	sleep(2);
	
	/*
	Commenting the legacy code to get Baton Report Using Curl
	// get information to attach pdf report to material
	jobDashboard.updateStatusAndProgress("Attaching Report",99);
	var curl = "/usr/bin/curl";
	var login_url = "http://"+batonAddress+":"+batonPort+"/Baton/@@blogin.html?login="+batonUserName+"&password="+batonPassword+"&baton.Login=Log%20in";
	var report_url = "http://"+batonAddress+":"+batonPort+"/Baton/Tasks/NewTasks/2015/11/13/18_0_0/0/vtasks/"+baton_id+"/@@vreport.pdf"; 
	var report_date = now("yyyyMMdd_HHmmss");
	var pdf_file = "/home/pharos/Baton_PDF_"+report_date+".pdf";

	// download pdf report
	output("login_url ["+login_url+"]");
	run(curl, "-I", login_url);
	output("report_url ["+report_url+"] to file ["+pdf_file+"]");
	run(curl, report_url, "-o", pdf_file);
	*/
	
	//New Change - Getting Baton report using Baton reportInPDF API
	var report_date = now("yyyyMMdd_HHmmss");
//	var pdf_file = "/home/pharos/Baton_PDF_"+report_date+".pdf";	
	var pdf_file = "/srv/dc-dvs/mediatorTemp/Baton_PDF_"+report_date+".pdf";

	baton.reportInPDF(pdf_file);

	var remote_ip = batonSettings.loadBalancerIP;
	var remote_user = batonSettings.remoteWSUser;
	var remote_pass = batonSettings.remoteWSPass;
		
	if(remote_ip !== "" && remote_ip !== null && typeof(remote_ip) !== 'undefined'){
		output("Remote settings have been provided, report will be attatched remotely");
		output("Connecting to: " + remote_ip + "with the following credentials: Username: " + remote_user + "Password: " + remote_pass);
		try{
			var ec = new gmoNBCFunc.remoteWebService();
			ec.wsLogin(remote_ip, remote_user, remote_pass);
			ec.attachFile(pdf_file, "MATERIAL", matId);
			ec.wsLogout();
		} catch (e){
			print("Error uploading Baton report: "+e.message);
		}
	} else{
		output("Remote settings have not been provided, report will be attatched locally");
		try{
			output("---------------ATTACHING FILE----------------")
			attachFile(pdf_file, "MATERIAL", matId);	
		} catch(e){
			print("Error uploading Baton report: "+e.message);
		}	
	}
		
	output("PDF file is : " + pdf_file);
	output("Mat ID is : " + matId);
	remove(pdf_file);
	jobDashboard.updateStatusAndProgress("Complete",100);
	
	if (!found_errors) {
		exit_code = 0;
	} else {
		exit_code = 1;
	}
	
} catch (e) {
	print("Something went wrong: " + e);
	gmoNBCFunc.addComment(matId, "Auto QC Failure", e.message);
	
	jobDashboard.updateStatus("Job failed with errors.");
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});
	exit_code = 1;
	
} finally {
	// Using importWithOutcome import the PXF with the commments into Mediator, then remove the tmp file.
	if (materialImportXml != "" && materialImportXml != null && materialImportXml != undefined){
		output("Sending in Direct Import to save comments against the material.");
		var importFile = "/srv/dc-dvs/mediatorTemp/" + matId + "_BatonCommentsPxf.xml";
		overwrite(materialImportXml, importFile);
		var importResult = gmoNBCFunc.importWithOutcome('None', importFile);
		remove(importFile);
		if (!importResult) exit_code = 1;
	}
}

quit(exit_code);