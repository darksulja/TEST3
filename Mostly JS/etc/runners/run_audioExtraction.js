/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-17 03:15:34
* @Last Modified by:   206466664
* @Last Modified time: 2018-10-31 22:40:12
* Modified By : Chris Filippone
* Modified Time : 2018-06-06
*/

if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")
if(typeof(gmoNBCFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
if(typeof(gmoNBCVantageFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_vantage_fun.js")
if(typeof(TrackHelper)==="undefined")  load("/opt/evertz/mediator/etc/helpers/TrackHelper.js")
if(typeof(daisyFileNameHelper)==="undefined")  load("/opt/evertz/mediator/etc/helpers/DaisyFilenameAPI.js")


function AudioExtractor(matId) {

	if((this instanceof AudioExtractor) === false)	throw new Error("Please call constructor with new() keyword")
	if(typeof(MediaInfoHelper)==="undefined")  load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js")

	if(gmoNBCFunc.isVarUsable(matId)){
		this.setMatId(matId);
	}else{
		throw new Error ("Mat Id is required to be able to extract audio from the source content linked to the Material")
	}
	this._isFixedHouseSpec = false;
}

AudioExtractor.prototype.constructor = AudioExtractor;

AudioExtractor.prototype.requirements = {
	toAudioExtraction : NBCGMO_CONSTANTS.TRIGGERS.START,
	toTechQueue : NBCGMO_CONSTANTS.TRIGGERS.COMPLETE,
	toAudioExtractionFailed : NBCGMO_CONSTANTS.TRIGGERS.FAILED
}

AudioExtractor.prototype.setMatId = function(matId){
	this.__matId = matId;
}

AudioExtractor.prototype.getMatId = function(){
	return this.__matId;
}

AudioExtractor.prototype.isHouseSpecFixed = function(){
	return this._isFixedHouseSpec;
}

AudioExtractor.prototype.setHouseSpecFixed = function(bool){
	this._isFixedHouseSpec = bool;
}

AudioExtractor.prototype.getSourceFileObj = function(){
	var mh = new gmoNBCFunc.materialHelper(this.getMatId());
	var dropFolder = mh.getTagValue(NBCGMO_CONSTANTS.TAGS.DROP_FOLDER);
	var mediaTrackToBeUsed;
	if(mh.getTrackList().(MediaName.toString() === NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING && parseInt(DeleteMark) === 0 && Encoded.toString() === "true").length() > 0){
		output("Source is Not in House Spec and a Fix is applied . Using the File From Working Media");
		mediaTrackToBeUsed = NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING;
		this.setHouseSpecFixed(true);
	}else{
		output("Source is Already in House Spec . Using the File From Staging Media");
		mediaTrackToBeUsed = lookup.dropfolder[dropFolder].stagingMedia;
	}

	if(!gmoNBCFunc.isVarUsable(mediaTrackToBeUsed)){
		throw new Error ("Unable to identify where the source file is located")
	}
	var fileNameWithPath = mh.getPathAndFileOfTrackTypeOnMedia(mediaTrackToBeUsed,NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO,false);
	var sourceFileObject = new gmoNBCFunc.usefulFileObj(fileNameWithPath)
	if(!sourceFileObject.exists()){
		throw new Error ("Mediator has registered the file location as but file is not located in ["+sourceFileObject+"]")
	}

	return sourceFileObject;
}

AudioExtractor.prototype.getUnTrustedOMWorkingDirectory= function(){
	return lookup.media[NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING].mount + this.getMatId() + NBCGMO_CONSTANTS.DOT_DIR +File.separator;
}

AudioExtractor.prototype.getVideoOutputFileObj = function(){ 
	return  new gmoNBCFunc.usefulFileObj(this.getUnTrustedOMWorkingDirectory() + NBCGMO_CONSTANTS.VIDEO + File.separator + NBCGMO_CONSTANTS.DUMMY_VIDEO_FILE);
}

AudioExtractor.prototype.getAudioOutputFileObj = function(){
	return  new gmoNBCFunc.usefulFileObj(this.getUnTrustedOMWorkingDirectory() + NBCGMO_CONSTANTS.AUDIO + File.separator + NBCGMO_CONSTANTS.DUMMY_AUDIO_FILE );
}

AudioExtractor.prototype.getExtractionTranscoderType = function(){
	return NBCGMO_CONSTANTS.VANTAGE;
}

AudioExtractor.prototype.startExtraction = function(){
	
	var sourceFileObj = this.getSourceFileObj();
	var outputFileObj = this.getVideoOutputFileObj();
	var audioFileObj = this.getAudioOutputFileObj();
	var transcoderType = this.getExtractionTranscoderType();
	var totalNumberOfAudioChannelsOnFile = 0;

	output("Cleaning up any previously extracted audio files.");
	gmoNBCFunc.deleteDirectory(this.getUnTrustedOMWorkingDirectory() + NBCGMO_CONSTANTS.AUDIO + "/", true);			

	var mediaInfoHelper = new MediaInfoHelper()
	mediaInfoHelper.setSourceFile(sourceFileObj);
	totalNumberOfAudioChannelsOnFile = mediaInfoHelper.getTotalNumberOfAudioChannels();



	output("Creating Video Working Directory [" + outputFileObj.unix_path + "]");
	gmoNBCFunc.makeDirectory(outputFileObj.unix_path);
	output("Creating Audio Working Directory [" + audioFileObj.unix_path + "]");
	gmoNBCFunc.makeDirectory(audioFileObj.unix_path);

	var transcodeObj = new gmoNBCVantageFunc.Standard_Vantage_Object();
	transcodeObj.setOriginal(sourceFileObj);
	if(mediaInfoHelper.getStandard()=="UHD"){
		transcodeObj.setWorkflowName("OM_UPLOAD_V7");
	}else{
		transcodeObj.setWorkflowName(NBCGMO_CONSTANTS.TRANSCODE_WORKFLOWS[transcoderType].AUDIO_EXTRACTION);
	}
	
	this.isHouseSpecFixed() == true ? transcodeObj.setVar("mov_dest_filepath", outputFileObj.win_path + "Fixed\\") : transcodeObj.setVar("mov_dest_filepath", outputFileObj.win_path);
	transcodeObj.setVar("audio_dest_filepath", audioFileObj.win_path);
	transcodeObj.setVar("output_filename", this.getMatId());
	transcodeObj.setVar("Audio Channels", totalNumberOfAudioChannelsOnFile);
	
	var audioExtractionResult = gmoNBCVantageFunc.makeAndRunTranscodeJob(transcodeObj,transcoderType);

	if (audioExtractionResult == true) {
		// wire in Daisy File name API
		output("Audios Extracted Successfully");
		if(this.isHouseSpecFixed()){
			gmoNBCFunc.moveFile(outputFileObj.unix_path + "Fixed" + File.separator + sourceFileObj.filename, outputFileObj.unix_path);			
		} 

	} else {
		throw new Error("Audio Extraction Failed with Error [" + audioExtractionResult + "].");
	}
}

AudioExtractor.prototype.listAndSortAudioWavs = function(dirToSearch){

	var dirFiles = new File(dirToSearch).listFiles().sort();
	var wavs = [];
	for (var i =0; i < dirFiles.length; i++) {
		var file = dirFiles[i];
		var fileInDirectory = String(file);
		if (fileInDirectory.endsWith(".wav")) {
			var extension = file.getName().substr(file.getName().indexOf('.')+1)
			var index = extension == "wav" ? "01" : extension.substr(0,3).slice(-2)
			var renamedFile = String(file.getParentFile()) + File.separator + this.getMatId() + NBCGMO_CONSTANTS.HYPHEN +'AUD_UN-' + index + '.wav';
			gmoNBCFunc.moveFile(fileInDirectory,renamedFile);
			wavs.push(renamedFile);
		}
	}
	wavs.sort();
	return wavs;
}

AudioExtractor.prototype.saveWorkingMediaTrack = function(){

	var outputFileObj = this.getVideoOutputFileObj();
	var audioFileObj = this.getAudioOutputFileObj();

	var fileNames = this.listAndSortAudioWavs(audioFileObj.unix_path);

	var mh = new gmoNBCFunc.materialHelper(this.getMatId());

	var videoFilePath = outputFileObj.unix_path + this.getMatId() + NBCGMO_CONSTANTS.DOT + NBCGMO_CONSTANTS.MOV;

	var trackTypeNames = [NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO];
	for (index in fileNames){
		var audioIndex = parseInt(index) + 1;
		trackTypeNames.push(NBCGMO_CONSTANTS.TRACK_TYPES.AUDIO + " " + audioIndex);
	}

	fileNames.unshift(videoFilePath);
	var mih = new MediaInfoHelper();
	mih.setSourceFile(new gmoNBCFunc.usefulFileObj(videoFilePath));
	var timeCode = mih.getTimeCodes();
	var th = new TrackHelper(this.getMatId());
	th.saveEncodedTrack(NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING,timeCode,trackTypeNames,fileNames);
}

function _main(){
	
	try { 
		output("run_audioExtraction.js - Start")
		var jobDescription = getJobParameter("jobDescription");
		output("\nJobDescription\n"+jobDescription+"]");

		var job = new gmoNBCFunc.WSJobUpdateObject();
		job.updateStatusAndProgress("Starting Audio Extraction Script",5);
		var matId = jobDescription..domainKey.toString();
		job.updateStatusMap({"Script_MatId":matId});
		output("Material ID ["+matId+"]")
		job.updateStatusMap({"Script_Title":jobDescription..Material.Title.toString()});
		var audioExtractor = new AudioExtractor(matId); 
		// Transition all track types in Audio Extraction Required to Audio Extraction
		gmoNBCFunc.transitionTrackTypes(matId,audioExtractor.requirements.toAudioExtraction,[NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO]); 	
		audioExtractor.startExtraction();
		job.updateStatusAndProgress("Audio Extracted Successfully",95);
		audioExtractor.saveWorkingMediaTrack();
		gmoNBCFunc.transitionTrackTypes(matId,audioExtractor.requirements.toTechQueue,[NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO]); 	
		try {
			var dh = new gmoNBCDaisy.daisyFileNameHelper(matId);
			dh.updateDaisyInfo();
		}catch (e){
			print ("Daisy api error "+ e)
		}
		
	}catch(e){

		output("run_audioExtraction - Error ["+e.message+"]");

		if (gmoNBCFunc.isVarUsable(job)) {
			job.updateStatus(e.message);	
		}

		if(gmoNBCFunc.isVarUsable(audioExtractor)){
			output("Cleaning up old Audio files");
			gmoNBCFunc.deleteDirectory(audioExtractor.getUnTrustedOMWorkingDirectory() + NBCGMO_CONSTANTS.AUDIO + "/", true);			
		}

		if (gmoNBCFunc.isVarUsable(matId)) {
			gmoNBCFunc.transitionTrackTypes(matId,audioExtractor.requirements.toAudioExtractionFailed,[NBCGMO_CONSTANTS.TRACK_TYPES.VIDEO]); 	
		}
        quit(1);

	}finally{
		output("run_audioExtraction.js - End")
	}
}

if(typeof _jobId != "undefined"){
	_main();
}else{
	output("Script is Executed Without Job Information")
}
