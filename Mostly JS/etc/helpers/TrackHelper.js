/*
* @Author: karthikrengasamy
* @Date:   2017-09-14 19:13:48
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-10-09 21:40:53
*/

/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-17 03:15:34
* @Last Modified by:   karthikrengasamy
* @Last Modified time: 2017-09-14 19:14:47
*/

function TrackHelper(matId) {

	if((this instanceof TrackHelper) === false)	throw new Error("Please call constructor with new() keyword")
	if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")
	if(typeof(gmoNBCFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
	if(typeof(MediaInfoHelper)==="undefined")  load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js")
	if(!gmoNBCFunc.isVarUsable(matId)){
		throw new Error("Please Instantiate Track Helper with Material ")
	}
	this.__matId = matId
	this.__mh = new gmoNBCFunc.materialHelper(this.__matId);
}

TrackHelper.prototype.constructor = TrackHelper;

TrackHelper.prototype.__getBaseTrack = function(){
	return  <Track>
	   	<MediaName/>
		<FrameRate/>
		<Incode/>
		<Outcode/>
		<FileId/>
		<FileExtension/>
		<FileBytes/>
		<Encoded/>
	</Track>;
}

TrackHelper.prototype.__getBaseTrackDefinition = function(){
	return  <TrackDefinition>
		<TrackTypeName/>
		<Position/>
		<FileId/>
		<FilePosition/>
		<Channels/>
	</TrackDefinition>;
}

TrackHelper.prototype.__getBaseTrackFile = function(){
	return  <TrackFile>
		<Path/>
		<Name/>
		<Bytes/>
	</TrackFile>;
}

TrackHelper.prototype.buildTrackFile = function(mediaName,fileObj){
	output("TrackHelper buildTrackFile - Start")
	var mediaMountPath = lookup.media[mediaName].mount;
	output("Media ["+mediaName+"] maps to location ["+mediaMountPath+"]")
	var trackFile = this.__getBaseTrackFile();
	trackFile.Name = fileObj.filename
	trackFile.Bytes = fileObj.filesize
	trackFile.Path = File.separator + fileObj.unix_path.replace(mediaMountPath,"");
	output("Setting Track File Name is ["+trackFile.Name+"]")
	output("Setting Track File Size is ["+trackFile.Bytes+"]")
	output("Setting Track File Path is ["+trackFile.Path+"]")
	output("TrackHelper buildTrackFile - End")
	return trackFile;
}

TrackHelper.prototype.buildTrackDefinition = function(mediaName,fileObj,trackTypeName,properties){
	output("TrackHelper buildTrackDefinition - Start")
	var trackDefinition = this.__getBaseTrackDefinition()

	trackDefinition.TrackTypeName = trackTypeName;
	output("Setting TrackDefinition TrackTypeName is ["+trackTypeName+"]")
	trackDefinition.FileId = fileObj.filename;
	output("Setting TrackDefinition FileId is ["+fileObj.filename+"]")

	if(gmoNBCFunc.isVarUsable(properties.Position)){
		output("Setting TrackDefinition Position is ["+properties.Position+"]")
		trackDefinition.Position = properties.Position;
	}
	if(gmoNBCFunc.isVarUsable(properties.FilePosition)){
		output("Setting TrackDefinition FilePosition is ["+properties.FilePosition+"]")
		trackDefinition.FilePosition = properties.FilePosition;
	}
	if(gmoNBCFunc.isVarUsable(properties.Channels)){
		output("Setting TrackDefinition Channels is ["+properties.Channels+"]")
		trackDefinition.Channels = properties.Channels;
	}
	if(gmoNBCFunc.isVarUsable(properties.Format)){
		output("Setting TrackDefinition Format is ["+properties.Format+"]")
		//trackDefinition.Format = properties.Format;
	}
	if(gmoNBCFunc.isVarUsable(properties.BitRate)){
		output("Setting TrackDefinition BitRate is ["+properties.BitRate+"]")
		trackDefinition.BitRate = properties.BitRate;
	}
	if(gmoNBCFunc.isVarUsable(properties.SamplingRate)){
		output("Setting TrackDefinition SamplingRate is ["+properties.SamplingRate+"]")
		trackDefinition.SamplingRate = properties.SamplingRate;
	}
	if(gmoNBCFunc.isVarUsable(properties.BitDepth)){
		output("Setting TrackDefinition BitDepth is ["+properties.BitDepth+"]")
		trackDefinition.BitDepth = properties.BitDepth;
	}
	if(gmoNBCFunc.isVarUsable(properties.Width)){
		output("Setting TrackDefinition Width is ["+properties.Width+"]")
		trackDefinition.Width = properties.Width;
	}
	if(gmoNBCFunc.isVarUsable(properties.Height)){
		output("Setting TrackDefinition Height is ["+properties.Height+"]")
		trackDefinition.Height = properties.Height;
	}
	if(gmoNBCFunc.isVarUsable(properties.ChromaSubsampling)){
		output("Setting TrackDefinition ChromaSubsampling is ["+properties.ChromaSubsampling+"]")
		trackDefinition.ChromaSubsampling = properties.ChromaSubsampling;
	}
	if(gmoNBCFunc.isVarUsable(properties.ScanType)){
		output("ScanType is ["+properties.ScanType+"]")
		output("ScanOrder is ["+properties.ScanOrder+"]")

		var scanType = properties.ScanType;
		if(gmoNBCFunc.isVarUsable(properties.ScanType) &&  properties.ScanType.toUpperCase() == 'INTERLACED'){
			var scanOrder = properties.ScanOrder;
			if(gmoNBCFunc.isVarUsable(scanOrder) && scanOrder.toUpperCase() == 'TFF' ){
				scanType = "Interlaced_Upper";
			}else if (gmoNBCFunc.isVarUsable(scanOrder)  && scanOrder.toUpperCase() == 'BFF' ){
				scanType = "Interlaced_Lower";
			}
		}

		trackDefinition.ScanType = scanType
		output("Setting TrackDefinition ScanType is ["+scanType+"]")
	}

	trackDefinition.TrackFile = this.buildTrackFile(mediaName,fileObj);
	output("TrackHelper buildTrackDefinition - End")
	return trackDefinition;
}

TrackHelper.prototype.saveUnEncodedTrack = function(mediaName){
	output("TrackHelper saveUnEncodedTrack - Start");
	output("Saving UnEncoded Track for Material ["+this.__matId+"] on Media ["+mediaName+"]");
	track = this.buildTrack(mediaName,false)
	if(debug) output("\nDEBUG:\n"+track);
	this.__mh.addTrackToSaveXml(track);
	this.__mh.saveUsingSaveXml();
	output("TrackHelper saveUnEncodedTrack - End");
}

TrackHelper.prototype.saveEncodedTrack = function(mediaName,timeCode,trackTypeNames,fileNames) {
	output("TrackHelper savEncodedTrack - Start");
	output("Saving Encoded Track for Material ["+this.__matId+"] on Media ["+mediaName+"]");
	track = this.buildTrack(mediaName,true,timeCode)
	if(debug) output("\nDEBUG:\n"+track);

	var isSelfContained = fileNames.length==1?true:false

	if(isSelfContained){
		var mediaInfoHelper = new MediaInfoHelper();
		var fileReference = fileNames[0];
		var fileRefObj = new gmoNBCFunc.usefulFileObj(fileReference);
		mediaInfoHelper.setSourceFile(fileRefObj);
	}

	for(index = 0; index < trackTypeNames.length; index++) {
    	var trackTypeName = trackTypeNames[index];
    	output("Track Type Name is ["+trackTypeName+"]")
    	if(!isSelfContained){
    		output("File is SelfContained")
    		var mediaInfoHelper = new MediaInfoHelper();
			var fileReference = fileNames[index];
			var fileRefObj = new gmoNBCFunc.usefulFileObj(fileReference);
			mediaInfoHelper.setSourceFile(fileRefObj);
			var properties = mediaInfoHelper.getTrackProperties(trackTypeName,0);
    	}else{
    		var properties = mediaInfoHelper.getTrackProperties(trackTypeName,index);
    	}
    	track.appendChild(this.buildTrackDefinition(mediaName,fileRefObj,trackTypeName,properties));
    	track.FileExtension = fileRefObj.extension;
	}

	this.__mh.addTrackToSaveXml(track);
	this.__mh.saveUsingSaveXml();
	output("TrackHelper savEncodedTrack - End");
}

TrackHelper.prototype.saveEncodedTrackWithPositions = function(mediaName,timeCode,trackTypeNames,fileNames,filePositions,trackTypesAudioXML) {
	output("TrackHelper savEncodedTrack - Start");
	output("Saving Encoded Track for Material ["+this.__matId+"] on Media ["+mediaName+"]");
	track = this.buildTrack(mediaName,true,timeCode);
	if(debug) output("\nDEBUG:\n"+track);

	var isSelfContained = fileNames.length==1?true:false

	if(isSelfContained){
		var mediaInfoHelper = new MediaInfoHelper();
		var fileReference = fileNames[0];
		var fileRefObj = new gmoNBCFunc.usefulFileObj(fileReference);
		mediaInfoHelper.setSourceFile(fileRefObj);
	}

	for(index = 0; index < trackTypeNames.length; index++) {
    	var trackTypeName = trackTypeNames[index];
    	output("Track Type Name is ["+trackTypeName+"]")
    	if(!isSelfContained){
    		output("File is NOT SelfContained")
    		var mediaInfoHelper = new MediaInfoHelper();
			var fileReference = fileNames[index];
			var fileRefObj = new gmoNBCFunc.usefulFileObj(fileReference);
			mediaInfoHelper.setSourceFile(fileRefObj);
			var properties = mediaInfoHelper.getTrackProperties(trackTypeName,0);
			if(gmoNBCFunc.isVarUsable(filePositions)){
	    		properties.Position = index+1;
	    		properties.FilePosition = filePositions[index];	
	    		if(gmoNBCFunc.isVarUsable(trackTypesAudioXML)){
	    			var channelsFromProfile = trackTypesAudioXML..TrackType.(TrackTypeName.toString() == trackTypeName).Channels.toString();
	    			output("Channels extracted from profile for track type [" + trackTypeName + "] as [" + channelsFromProfile + "]");
	    			properties.Channels = channelsFromProfile;
	    		}						
			}
    	}else{
    		var properties = mediaInfoHelper.getTrackProperties(trackTypeName,index);
    	}
    	track.appendChild(this.buildTrackDefinition(mediaName,fileRefObj,trackTypeName,properties));
    	track.FileExtension = isSelfContained ? fileRefObj.extension : new gmoNBCFunc.usefulFileObj(fileNames[0]).extension;
	}

	this.__mh.addTrackToSaveXml(track);
	this.__mh.saveUsingSaveXml();
	output("TrackHelper savEncodedTrack - End");
}


TrackHelper.prototype.buildTrack = function(mediaName,isEncoded,timeCode){
	output("TrackHelper buildTrack - Start");
	var track = this.__getBaseTrack();
	track.FileId = this.__matId;
	track.MediaName = mediaName;
	track.Encoded = isEncoded;

	if(gmoNBCFunc.isVarUsable(timeCode)){
		output("Applying Duration & Frame Rate to Material Save XML");
		this.__mh.addFrameRateToSaveXml(timeCode.frameRate);
		this.__mh.addDurationToSaveXml(timeCode.duration);
		output("Applying Time Code Information to Material Save XML");
		track.FrameRate = timeCode.frameRate;
		track.Incode = timeCode.incode;
		track.Incode.@rate = timeCode.frameRate;
		track.Outcode = timeCode.outcode;
		track.Outcode.@rate = timeCode.frameRate;
	}
	output("TrackHelper buildTrack - Start");
	return track;
}

