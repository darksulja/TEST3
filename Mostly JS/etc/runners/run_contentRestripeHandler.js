load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_vantage_fun.js");
load("/opt/evertz/mediator/etc/runners/vantage_lookup.js");
load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");

var debug = false;

const VANTAGE_WORKFLOW = 'HD_SD_PRORES_HQ_MOV_AUDIOPASS_FPS_PASS_CC_FLAG_FIX_TIMECODE_RESTRIPE';
const DEST_ANCHOR = "Destination Anchor";
const Requirements = {
	Complete: "Complete",
	Failed: "Failed"
}

try {
	var getFPS = function(framerate) {
		switch (framerate) {
			case "P23_976":
			case "P23_98":
				return "23.976";
			case "NDF25":
				return "25";
			case "DF30":
				return "29.97";
			default:
				throw new Error("Attempted to convert invalid frame rate: " + framerate);
		}
	}

	var deleteAllSegments = function(matXml) {
		print("Deleting all segments on material [" + matXml.MatId + "].");

		for each(var segment in matXml.SegmentList..Segment) {
			var segmentKey = segment.Key.toString();
			var segmentGroup = segment.SegmentGroup.Name.toString();
			var segmentType = segment.SegmentType.Name.toString();

			var deleteSegment = <PharosCs>
									<CommandList>
										<Command subsystem="segment" method="deleteSegment">
											<ParameterList>
												<Parameter name="segmentId">
													<Value>
														<Integer>{segmentKey}</Integer>
													</Value>
												</Parameter>
											</ParameterList>
										</Command>
									</CommandList>
								</PharosCs>;


			print("Deleting segment: group [" + segmentGroup + "], type [" + segmentType + "], id [" + segmentKey + "].");
			wscall(deleteSegment);
		}
	}

	var getDestinationPaths = function(videoMedia) {
		if (videoMedia.indexOf('T2') > -1) {
			print("Setting destination paths for T2...");
			var destinationPaths = {
				'WINDOWS': lookup.storage.nrtisilon.win_prefix + "Restripe\\",
				'UNIX': lookup.storage.nrtisilon.unix_root + "Restripe/",
				'UNIX_BACKUP': lookup.storage.nrtisilon.unix_root + "Restripe/Backup/",
				'MEDIA': "T2"
			}
		} else if (/DC_(?=2398|NDF25|DF30)/.test(videoMedia)) {
			print("Setting destination paths for DVS...");
			var destinationPaths = {
				'WINDOWS': lookup.storage.dvs.win_prefix + "Restripe\\",
				'UNIX': lookup.storage.dvs.unix_root + "Restripe/",
				'UNIX_BACKUP': lookup.storage.dvs.unix_root + "Restripe/Backup/",
				'MEDIA': "DVS"
			}
		} else {
			throw new Error("Could not determine destination paths for media: " + videoMedia);
		}

		// Check that our destination and backup directories exist.
		try {
			if (!new gmoNBCFunc.usefulFileObj(destinationPaths.UNIX).exists()) {
				print("Destination path [" + destinationPaths.UNIX + "] does not exist. Creating...");
				makedir(destinationPaths.UNIX);
				makedir(destinationPaths.UNIX_BACKUP);
			} else if (!new gmoNBCFunc.usefulFileObj(destinationPaths.UNIX_BACKUP).exists()) {
				print("Destination path [" + destinationPaths.UNIX + "] exists, but backup path [" + destinationPaths.UNIX_BACKUP + "] does not. Creating...");
				makedir(destinationPaths.UNIX_BACKUP);
			}
		} catch(e) {
			throw new Error("Restripe destination and backup paths do not exist and could not be created.");
		}

		print("\nUsing destination paths:");
		gmoNBCFunc.printObj(destinationPaths);
		return destinationPaths;
	}

	print("Running contentRestripeHandler...");

	var jobObject = {};
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script", 5);

	var matId = jobDescription..MatId.toString();
	var material = new gmoNBCFunc.materialHelper(matId);
	var matXml = material.getMaterialXml()..Material;
	var materialTrackTypes = material.getTrackTypes();
	var videoMedia = gmoNBCFunc.getOMMedia(matId);
	var destinationAnchor = material.getTagValue(DEST_ANCHOR);

	try {
		var sourceAnchor = material.getSegmentsByGroup("SOM / EOM")[0]..MarkerIn.(MarkerType == "SOM / EOM|Start1").Absolute.toString();
		if (!gmoNBCFunc.isVarUsable(sourceAnchor)) {
			throw new Error("Error during SOM / EOM segment lookup.");
		}
	} catch(e) {
		print(e);
		throw new Error("Could not find SOM / EOM segment." + e);
	}

	if (!gmoNBCFunc.isVarUsable(destinationAnchor)) {
		throw new Error("An invalid restripe timecode was given: [" + destinationAnchor + "].");
	}

	if (videoMedia.indexOf("DIVA") > 1) {
		throw new Error("The only OM media for [" + matId + "] is a DIVA track: [" + videoMedia + "]. This is an invalid state for a Spot Check material.");
	}

	var destinationPaths = getDestinationPaths(videoMedia);
	var originalFile = new gmoNBCFunc.usefulFileObj(material.getPathAndFileOfTrackTypeOnMedia(videoMedia, "Video", false));
	var originalExt = originalFile.extension;
	var originalMediaInfo = new MediaInfoHelper();
	originalMediaInfo.setSourceFile(originalFile);

	var output_audio_channels = originalMediaInfo.getTotalNumberOfAudioChannels();
	var output_filename = matId + "-RESTRIPE";
	var output_fps = getFPS(material.getMaterialFrameRate());
	var source_anchor_timecode = sourceAnchor + "@" + output_fps;
	if (material.getMaterialFrameRate() == "DF30" && destinationAnchor.indexOf(';') == -1) {
		destAnchorSplit = destinationAnchor.split(':');
		var output_anchor_timecode = destAnchorSplit[0] + ':' + destAnchorSplit[1] + ':' + destAnchorSplit[2] + ';' + destAnchorSplit[3] + '@' + output_fps;
	} else {
		var output_anchor_timecode = destinationAnchor + "@" + output_fps;
	}
	var vantageJobFactory = vantageLookup.getJobFactoryByWorkflow(VANTAGE_WORKFLOW);

	// Set Vantage options.
	var vantageObj = new gmoNBCVantageFunc.Standard_Vantage_Object();
	vantageObj.setJobName(VANTAGE_WORKFLOW + "-RESTRIPE-" + matId);
	vantageObj.setWorkflowName(VANTAGE_WORKFLOW);
	vantageObj.setOriginal(originalFile.win_file);
	vantageObj.setVar("output_audio_channels", output_audio_channels);
	vantageObj.setVar("output_framerate", output_fps);
	vantageObj.setVar("source_anchor_timecode", source_anchor_timecode);
	vantageObj.setVar("output_anchor_timecode", output_anchor_timecode);
	vantageObj.setVar("output_filename", output_filename);
	vantageObj.setVar("mov_dest_filepath", destinationPaths.WINDOWS);
	vantageObj.nicknames.Original = originalFile.win_file;

	print("Restriping material [" + matId + "] from source anchor [" + source_anchor_timecode + "] to [" + output_anchor_timecode + "].");

	try {
		var vantageResult = gmoNBCVantageFunc.makeAndRunTranscodeJob(vantageObj);
		var restripedVideo = new gmoNBCFunc.usefulFileObj(destinationPaths.UNIX + output_filename + "." + originalExt);

		print("Vantage result was [" + vantageResult + "].");
		if (!vantageResult) throw new Error("Vantage workflow returned false. See logs for more information.");

		if (restripedVideo.exists()) {
			var frameRate = material.getMaterialFrameRate(); // the same for both
			var restripedMediaInfo = new MediaInfoHelper();
			restripedMediaInfo.setSourceFile(restripedVideo);
			var restripedSOM = restripedMediaInfo.getStartTimecode();
			var restripedEOM = restripedMediaInfo.getEndTimecode();
			var restripedDuration = gmoNBCFunc.calculateDuration(restripedSOM, restripedEOM, frameRate);
			var origSOM = originalMediaInfo.getStartTimecode();
			var origEOM = originalMediaInfo.getEndTimecode();
			var origDuration = gmoNBCFunc.calculateDuration(origSOM, origEOM, frameRate);

			// Check that duration of both old and restriped videos are identical.
			if (origDuration != restripedDuration) {
				print("Warning: original video duration does not match restriped video duration!")
				print("Original: " + origDuration + ", restriped: " + restripedDuration);
			}

			try {
				var backupFile = new gmoNBCFunc.usefulFileObj(destinationPaths.UNIX_BACKUP + originalFile.filename);

				print("Original filesize: " + originalFile.filesize + ". Restriped filesize: " + restripedVideo.filesize + ".");
				print("Moving original video [" + originalFile.unix_file + "] to backup location [" + backupFile.unix_file + "].");
				gmoNBCFunc.moveFile(originalFile.unix_file, backupFile.unix_file);

				if (backupFile.exists()) {
					print("Moving restriped video [" + restripedVideo.unix_file + "] to original file's location at [" + originalFile.unix_file + "].");
					gmoNBCFunc.moveFile(restripedVideo.unix_file, originalFile.unix_file);
				}
				else {
					throw new Error("Backup file [" + backupFile.unix_file + "] was not created. Aborting workflow.");
				}
			} catch(e) {
				throw new Error("Unable to move original video or restriped video: " + e);
			}
		} else {
			throw new Error("Restriped output video [" + restripedVideo.unix_file + "] does not exist. Likely a Vantage workflow error. Left original in place.");
		}
	} catch(e) {
		throw new Error("Error running Vantage restripe workflow: " + e);
	}

	// Rewrite tracks with the restriped SOM/EOM.
	for each(var track in matXml..Track) {
			print("Restriping track: " + track.MediaName.toString());
			print("Original: Incode " + track['Incode'] + ", Outcode " + track['Outcode']);

			// Save @rate, but not @nanos; if @nanos stays the same, the track won't be overridden.
			var rate = track['Incode'].@rate.toString();
			track['Incode'] = new XML("<Incode>" + restripedSOM + "</Incode>");
			track['Incode'].@rate = rate;

			var rate = track['Outcode'].@rate.toString();
			track['Outcode'] = new XML("<Outcode>" + restripedEOM + "</Outcode>");
			track['Outcode'].@rate = rate;

			print("Restriped: Incode " + track['Incode'] + ", Outcode " + track['Outcode'] + "\n");
	}

	// Save *before* deleting segments.
	try {
		materialSave(matXml);
	} catch(e) {
		print("Restoring original video file...");
		gmoNBCFunc.moveFile(backupFile.unix_file, originalFile.unix_file);
		throw new Error("Error saving restriped tracks: " + e);
	}

	// If OM media is on DVS, delete the T2 media entirely (if present); both video and audio.
	// This saves us from having to copy the restriped video onto a different mount.
	//
	// Also delete any staging media we encounter.
	for each(var track in matXml..Track) {
		var mediaName = track.MediaName.toString();
		if (mediaName.indexOf('WAV') > -1) {
			print("Skipping deletion of audio track [" + mediaName + "]");
			continue;
		} else if (destinationPaths.MEDIA == "DVS" && mediaName.indexOf('T2') > -1) {
			print("OM media is on DVS. Deleting this T2 track.\n");
			gmoNBCFunc.materialTrackDelete(matId, mediaName);
		} else if (mediaName.toUpperCase().indexOf('STAGING') > -1) {
			print("Track " + mediaName + " is a staging track. Deleting.");
			gmoNBCFunc.materialTrackDelete(matId, mediaName);
		}
	}

	try {
		// Delete and regenerate browse.
		var browseTracks = gmoNBCFunc.getMaterialTrackList(matId).filter(function (track) {
			if (track.indexOf("Browse") > -1) return (track)
		});

		if (browseTracks.length > 0) {
			requestMedia = "";
			for (var i = 0; i < browseTracks.length; i++) {
				var browseTrack = browseTracks[i];
				print("Deleting browse track: " + browseTrack);
				gmoNBCFunc.deleteTrackWithDeleteMark(matId, browseTrack);
				sleep(1);
				if (browseTrack.indexOf('EC') > -1) {
					var requestMedia = browseTrack;
				}
			}
			sleep(5);
			if (requestMedia != "") {
				print("Re-Request ID is [" + makeTransferRequest(matId, requestMedia, 1) + "]");;
			}
		} else {
			print("No browse tracks found on material [" + matId + "]. Skipping browse regeneration.");
		}
	} catch (e) {
		print("Browse regeneration warning: " + e);
	} finally {
		material.refresh(); // our track delete needs to be reflected locally
		matXml = material.getMaterialXml()..Material;
	}

	// Delete all segments.
	try {
		deleteAllSegments(matXml);
	} catch(e) {
		print("Unable to delete segments on material [" + matId + "]: " + e);
	}

	print("Restripe of " + matId + " complete.");
	jobDashboard.updateStatusAndProgress("Success", 100);
	gmoNBCFunc.transitionTrackTypes(matId, Requirements.Complete, materialTrackTypes);
} catch(e) {
	gmoNBCFunc.transitionTrackTypes(matId, Requirements.Failed, materialTrackTypes);
	jobDashboard.updateStatusAndProgress(e, 100);
	throw new Error("Error restriping content: " + e);
}
