if (typeof MediaInfoHelper === "undefined") {
	print("Loading /opt/evertz/mediator/etc/runners/MediaInfoHelper.js");
	load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");
} else {
	print("Object [ MediaInfoHelper ] already loaded");
}

if (typeof PlacingHelper === "undefined") {
	print("Loading /opt/evertz/mediator/etc/runners/placingHelper.js");
	load("/opt/evertz/mediator/etc/runners/placingHelper.js");
} else {
	print("Object [ PlacingHelper ] already loaded");
}

if (typeof ProfileHelper === "undefined") {
	print("Loading /opt/evertz/mediator/etc/runners/ProfileHelper.js");
	load("/opt/evertz/mediator/etc/runners/ProfileHelper.js");
} else {
	print("Object [ ProfileHelper ] already loaded");
}

if (typeof Preset === "undefined") {
	print("Loading /opt/evertz/mediator/etc/runners/Preset.js");
	load("/opt/evertz/mediator/etc/runners/Preset.js");
} else {
	print("Object [ Preset ] already loaded");
}

var PackageQCHelper = function() {
	output("Instantiating PackageQCHelper");
	this.__placingHelper;
	this.__profileHelper;
	this.__mediaInfoHelper;
	this.__matchedProfileTrackTypeFullText = "Matched Profile Track Types";
	this.__orderAudioProfileLongText = "Audio";
	this.__fileInformationFullText = "File Information";
	this.__profileInformationFullText = "Profile/Preset Information";
	this.__orderInformationFullText = "Order Information";
	
	this.setPlacingHelper = function(placingId) {
		this.__placingHelper = new PlacingHelper(placingId);
		this.setProfileHelper();
	}

	this.getPlacingHelper = function() {
		return this.__placingHelper;
	}

	this.setProfileHelper = function() {
		this.__profileHelper = new ProfileHelper();
		this.__profileHelper.initialize();
		this.__profileHelper.setProfile(this.__placingHelper.getMatchedProfile());
	}

	this.getProfileHelper = function() {
		return this.__profileHelper;
	}

	this.setMediaInfoHelper = function(fileObj) {
		this.__mediaInfoHelper = new MediaInfoHelper();

		if (!fileObj.exists()) throw new Error("Source video file [" + fileObj.unix_file + "] does not exist, can not continue");

		this.__mediaInfoHelper.setSourceFile(fileObj);
	}

	this.getMediaInfoHelper = function() {
		return this.__mediaInfoHelper;
	}

	this.getMatchedProfileTrackTypes = function() {
		var trackTypeField = "";
		var matchedProfileTrackTypes = this.__profileHelper.getTrackTypes();
		for (var i = 0; i < matchedProfileTrackTypes.length; i++) {
			trackTypeField += matchedProfileTrackTypes[i].trim() + "\n";
		}
		return trackTypeField ;
	}

	this.saveMatchedProfileTrackTypes = function() {
		output("Saving [" + this.__matchedProfileTrackTypeFullText + "] to [" + this.__placingHelper.placingId + "]");
		gmoNBCNLDFunc.savePlacingFullText(this.__placingHelper.placingId, this.__matchedProfileTrackTypeFullText, this.getMatchedProfileTrackTypes());
	}

	this.getOrderAudiolayout= function(){
		output("Audio start\n");
		var placingXml = this.__placingHelper.getPlacingXml();
		var audio = this.__placingHelper.getFullTextValueByType("Audio");
		var reformattedAudio="";
		if (audio.indexOf(";") > -1){
			var fields = audio.split(";");
			var newfields=[];
			for (var i = 0, len = fields.length; i < len; i++) {
				var channel = fields[i].trim();
				var channelFormat="";
				var channelNumber = channel.substring(channel.indexOf(" "),channel.indexOf(" ", channel.indexOf(" ") + 1)).trim();
				output("channel :"+ channelNumber + ":\n");
				if (channelNumber.length > 1) {
					channelFormat = channel ;
				} else {
					var first = channel.indexOf(" ");
					var second = channel.indexOf(" ",channel.indexOf(" ") + 1);
					channelFormat = channel.substr(0, first + 1 ) +
									+ " 0"  + channelNumber + " " + 
									channel.substr(second +1, channel.length - second )
				}
				if (channelNumber>" "){
					newfields.push( channelFormat );
				}

			}
				
			newfields.sort();
			for (var i = 0, len = newfields.length; i < len; i++) {
				reformattedAudio = reformattedAudio + newfields[i] +"\n";
			}
		} else {
			reformattedAudio = audio;
		}
		//output("New Audio value" + reformattedAudio +"\n")
		return reformattedAudio;
	}

	this.saveOrderAudioProfilelayout = function() {
		output("Saving [" + this.__orderAudioProfileLongText + "] to [" + this.__placingHelper.placingId + "]");
		gmoNBCNLDFunc.savePlacingFullText(this.__placingHelper.placingId, this.__orderAudioProfileLongText, this.getOrderAudiolayout());
	}

	this.getFileInformation = function() {
		var fileInformation = "";
		var videoTrackInfo = this.__mediaInfoHelper.getTrackProperties("Video", 0);
		var audioTrackInfo = this.__mediaInfoHelper.getTrackProperties("Audio", 0);
		var frameRate = this.__mediaInfoHelper.getFrameRate();
		var startTimeCode = this.__mediaInfoHelper.getStartTimecode();
		var totalAudioChannels = this.__mediaInfoHelper.getTotalNumberOfAudioChannels();

		fileInformation +=
						"Video Codec\t\t\t: " + videoTrackInfo.Codec + "\n" +
						"Video Format\t\t\t: " + videoTrackInfo.Format + "\n" +
						"Scan Type\t\t\t: " + videoTrackInfo.ScanType + "\n" +
						"Frame Rate\t\t\t: " + frameRate + "\n" +
						"Frame Size/Resolution\t\t: " + videoTrackInfo.Width + "x" + videoTrackInfo.Height + "\n" +
						"Chroma Sampling\t\t: " + videoTrackInfo.ChromaSubsampling + "\n" +
						"Audio Codec\t\t\t: " + audioTrackInfo.Codec + "\n" +
						"Audio Format\t\t\t: " + audioTrackInfo.Format + "\n" +
						"Audio Bit Depth\t\t: " + audioTrackInfo.BitDepth + "\n" +
						"Number of Audio Channels\t: " + totalAudioChannels + "\n" +
						"Start Timecode\t\t: " + startTimeCode;

		return fileInformation;
	}

	this.saveFileInformation = function() {
		output("Saving [" + this.__fileInformationFullText + "] to [" + this.__placingHelper.placingId + "]");
		gmoNBCNLDFunc.savePlacingFullText(this.__placingHelper.placingId, this.__fileInformationFullText, this.getFileInformation());
	}

	this.getPresetInformation = function() {
		var presetInformation = "";
		var mainMatId = this.__placingHelper.getMainMaterial();
		var placingXml = this.__placingHelper.getPlacingXml();
		var captions = gmoNBCNLDFunc.checkMatchedTrackTypeForTrackTypeClass(placingXml, mainMatId, "Subtitle");
		var settings = this.__placingHelper.getSettings();
		var headerOptions = [settings.headerOption1,settings.headerOption2,settings.headerOption3,settings.headerOption4,settings.headerOption5,settings.headerOption6];
		var headerDurations = [settings.headerOption1Duration,settings.headerOption2Duration,settings.headerOption3Duration,settings.headerOption4Duration,settings.headerOption5Duration,settings.headerOption6Duration];
		var headers = "";

		// Load the headers to display
		if (gmoNBCFunc.isVarUsable(settings.includeCustomHeader)  && settings.includeCustomHeader.toString().toLowerCase() === "true")  {
			for( var i = 1; i <= headerOptions.length; i++ ) {
			var options = !gmoNBCFunc.isVarUsable(headerOptions[i]) ? "" : headerOptions[i];
			var durations = !gmoNBCFunc.isVarUsable(headerDurations[i]) ? "" : headerDurations[i];

			if( options != "" || durations != "" )
				headers += "    Option " + i + " [" + options + "] - Duration: [" + durations + "]\n";
		}
		}

		presetInformation +=
					"Source Trim\t\t\t\t: " + (gmoNBCFunc.isVarUsable(settings.sourceTrim) ? settings.sourceTrim : "") + "\n" +
			  "Header Information: "+ "\n" +
			  "    Include Header\t\t\t: " + (gmoNBCFunc.isVarUsable(settings.includeHeader) ? settings.includeHeader : "") + "\n" +
			  "    Include Custom Header\t\t: " + (gmoNBCFunc.isVarUsable(settings.includeCustomHeader) ? settings.includeCustomHeader : "") + "\n" +
					headers +
					"Midroll Insertion Duration\t\t: " + (gmoNBCFunc.isVarUsable(settings.midrollBlack) ? settings.midrollBlack : "") + "\n" +
					"Top Black\t\t\t\t: " + (gmoNBCFunc.isVarUsable(settings.topBlackDuration) ? settings.topBlackDuration : "") + "\n" +
					"PreTatend Black\t\t\t: " + (gmoNBCFunc.isVarUsable(settings.preTatendBlackDuration) ? settings.preTatendBlackDuration : "") + "\n" +
					"Tail Black\t\t\t\t: " + (gmoNBCFunc.isVarUsable(settings.tailBlackDuration) ? settings.tailBlackDuration : "") + "\n" +
					"File Start\t\t\t\t: " + (gmoNBCFunc.isVarUsable(settings.fileStart) ? settings.fileStart : "") + "\n" +
					"Texted/Textless\t\t\t: " + (gmoNBCFunc.isVarUsable(settings.versionPreference) ? settings.versionPreference : "") + "\n" +
					"Output Frame Rate\t\t\t: " + (gmoNBCFunc.isVarUsable(settings.outputFrameRate) ? settings.outputFrameRate : "") + "\n" +
					"Output Scan Type\t\t\t: " + (gmoNBCFunc.isVarUsable(settings.outputScanType) ? settings.outputScanType : "") + "\n" +
					"Start Of Content\t\t\t: " + (gmoNBCFunc.isVarUsable(settings.startOfContent) ? settings.startOfContent : "") + "\n" +
					"Caption Method\t\t\t: " + (gmoNBCFunc.isVarUsable(settings.captionMethod) ? settings.captionMethod : "") + "\n" +
			  "Captions\t\t\t\t: " + (gmoNBCFunc.isVarUsable(captions) ? captions : "") + "\n" +
			  "Transcode Vantage Workflow\t\t: " + (gmoNBCFunc.isVarUsable(settings.transcodeVantageWorkflow) ? settings.transcodeVantageWorkflow : "") + "\n" +
					"Conform Vantage Workflow\t\t: " + (gmoNBCFunc.isVarUsable(settings.conformVantageWorkflow) ? settings.conformVantageWorkflow : "") + "\n";

		return presetInformation;

	}

	this.savePresetInformation = function() {
		output("Saving [" + this.__profileInformationFullText + "] to [" + this.__placingHelper.placingId + "]");
		gmoNBCNLDFunc.savePlacingFullText(this.__placingHelper.placingId, this.__profileInformationFullText, this.getPresetInformation());
	}
}

