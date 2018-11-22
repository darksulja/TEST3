if (typeof gmoNBCFunc === "undefined") {
    print("Loading /opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
    load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
} else {
    print("Object [ gmoNBCFunc ] already lodaded");
}

var MediaInfoHelper = function() {
    output("Instantiating MediaInfoHelper");
    this.source_file_obj;
    this.mediaInfoXml;
    
    this.log = function(str, method) {
        if (gmoNBCFunc.isVarUsable(method)) {
            output("MediaInfoHelper." + method + "(): " + str);
        } else {
            output("MediaInfoHelper: " + str);
        }
    }
    
    this.validFrameRateMap = {
        // P23_976
        "23.976" : "P23_976",

        // DF30
        "29.97" : "DF30",
        "29.970" : "DF30",

        // NDF25
        "25" : "NDF25",
        "25.000" : "NDF25",

        // NDF30
        "30" : "NDF30",

        // DF60
        "59.94" : "DF60",

        // NDF60
        "60" : "NDF60"
    }

    this.vantageScanTypeMap = {
        "interlaced" : {
            "TFF" : "Interlaced Upper Field First",
            "BFF" : "Interlaced Lower Field First"
        },
        "progressive" : "Progressive"
    }

    this.setSourceFile = function(fileObj) {
        this.log("Setting Source File to [" + fileObj.unix_file + "]", "setSourceFile");
        this.source_file_obj = fileObj
        this.mediaInfoXml = gmoNBCFunc.getFileInfoXml(this.source_file_obj.unix_file);
    }
    
    this.setMediaInfoXml = function(bXml) {
        this.log("Directly Applying MediaInfo XML", "setMediaInfoXml");
        this.mediaInfoXml = bXml;
    }

    this.getMediaInfoXml = function() {
        return this.mediaInfoXml;
    }

    this.getScanType = function(){
        var scanType = this.mediaInfoXml.track.(@type.toString() === "Video").Scan_type[0].toString().toLowerCase();
        output("ScanType  is ["+scanType+"]")
        return scanType;
    }

    this.getScanOrder = function(){
        var scanOrder = "";
        if (gmoNBCFunc.isVarUsable(this.mediaInfoXml.track.(@type.toString() === "Video").Scan_order[0])) {
            scanOrder = this.mediaInfoXml.track.(@type.toString() === "Video").Scan_order[0].toString();
        }
        output("ScanOrder  is ["+scanOrder+"]")
        return scanOrder;
    }

    this.getVantageScanType = function() {
        var scanType = this.getScanType();
        if (scanType == "interlaced"){
            var scanOrder = this.getScanOrder();
            return this.vantageScanTypeMap[scanType][scanOrder];
        } else {
            return this.vantageScanTypeMap[scanType];
        }
    }

    this.getVideoHeight = function(){

        var videoHeight;
        if (this.mediaInfoXml.track.(@type.toString() == "Video").Original_height[0] != undefined) {
             videoHeight = this.mediaInfoXml.track.(@type.toString() === "Video").Original_height[0].toString();
        }else {
             videoHeight = this.mediaInfoXml.track.(@type.toString() === "Video").Height[0].toString();
        }
        output("VideoHeight  is ["+videoHeight+"]")
        return videoHeight.replace(/\s/g, "");
    }

    this.getVideoWidth = function(){
        var videoWidth;
        if (this.mediaInfoXml.track.(@type.toString() == "Video").Original_width[0] != undefined) {
             videoWidth = this.mediaInfoXml.track.(@type.toString() === "Video").Original_width[0].toString();
        }else {
             videoWidth = this.mediaInfoXml.track.(@type.toString() === "Video").Width[0].toString();
        }
        output("VideoWidth  is ["+videoWidth+"]")
        return videoWidth.replace(/\s/g, "");
    }

    this.getChromaSubsampling = function(){

        var chromaSubsampling = this.mediaInfoXml.track.(@type.toString() === "Video").Chroma_subsampling[0].toString();
        output("ChromaSubsampling is ["+chromaSubsampling+"]")
        return chromaSubsampling;
    }

    this.getVideoFormat = function(){

        var format = this.mediaInfoXml.track.(@type.toString() === "Video").Format[0].toString().toUpperCase();
        output("Format is ["+format+"]")
        return format;
    }

    this.getFrameRate = function(){
        var frameRates = this.mediaInfoXml.track.(@type.toString() === "Video").Frame_rate;

        for each (var frameRateString in frameRates){
            output("getFrameRate(): Checking FrameRate From MediaInfo [" + frameRateString + "]");
            var frameRate = this.validFrameRateMap[frameRateString];
            if (frameRate != "" && frameRate != null){
                 output("FrameRate   is ["+frameRate+"]")
                return frameRate;
            }
        }
        output("Could not Find Valid Frame Rate from MediaInfoXml. Check File Permissions and that it is not corrupt. \n" + this.mediaInfoXml); // Internal Logging
        throw new Error("Frame rate from MediaInfo did not match a valid frame rate. Check File Permissions and that it is not corrupt."); // Usually will appear in Job Dashboards
    } 

    this.getStandard = function(){
        var videoHeight = this.getVideoHeight();
        if(parseInt(videoHeight)>1080){
            return "UHD"
        }else if(parseInt(videoHeight)>=720){
            return "HD";
        }else {
            return "SD"
        }
    } 

    this.getTimeCodes = function(){

        var movDotExt     = ".mov";
        if(this.source_file_obj.unix_file.toLowerCase().endsWith(movDotExt)){
             return this._getMovTimeCodes();
        }else{
           throw new Error("File ["+file+"] does not end with ["+movDotExt+"]");
        }
    }
    
    this.getStartTimecode = function(){
        var movDotExt     = ".mov";
        if(this.source_file_obj.unix_file.toLowerCase().endsWith(movDotExt)){
            return this._getMovTimeCodes().incode;
        } else {
            return this.mediaInfoXml.track.(@type.toString()==="Video")[0].Time_code_of_first_frame[0].toString();
        }
    }

    this.getEndTimecode = function(){
        var movDotExt     = ".mov";
        if(this.source_file_obj.unix_file.toLowerCase().endsWith(movDotExt)){
            return this._getMovTimeCodes().outcode;
        } else {
            return this.mediaInfoXml.track.(@type.toString()==="Video")[0].Time_code_of_last_frame[0].toString();
        }
    }
    this.getTotalNumberOfAudioChannels = function(){
        var totalNumberOfAudioChannels = 0;
        var audioTracks = this.mediaInfoXml.track.(@type.toString()==="Audio");
        if(gmoNBCFunc.isVarUsable(audioTracks)){
            if(audioTracks.length() > 0){
                for each (var track in audioTracks){
                    var channelCount = parseInt(track.Channel_s_[0].toString());
                    if(gmoNBCFunc.isVarUsable(channelCount))totalNumberOfAudioChannels += channelCount;
                }
            }
        }
        output("getTotalNumberOfAudioChannels ["+totalNumberOfAudioChannels+"]");
        return totalNumberOfAudioChannels;
    }

    this.getVideoContainer = function(){
        var videoContainer = this.mediaInfoXml.track.(@type.toString() === "General").Format[0].toString();
        output("Video Cotainer ["+videoContainer+"]");
        return videoContainer;
    }

    this._getMovTimeCodes  = function(){
        output("_getMovTimeCodes start")
        var num_frames;
        var incode_str;

        if(!fileExists(this.source_file_obj.unix_file)){
            throw new Error("Cannot find file at ["+this.source_file_obj.unix_file+"]");
        }
        debug = true;
        var res = eval('(' + run('/usr/bin/ffprobe', '-i', this.source_file_obj.unix_file, '-show_streams', '-print_format', 'json').output + ')');
        debug = false;
        for (var i = 0, len = res.streams.length; i < len; i += 1) {
            var stream = res.streams[i];

            if (stream.codec_type === 'video') {
                num_frames = parseInt(stream.nb_frames);
            } else if (stream.codec_tag_string === 'tmcd') {
                var tcindex = i;
                incode_str = stream.tags.timecode;
            }
        }

        if (num_frames === undefined) {
            throw new Error("Could not find video stream: " + this.source_file_obj.unix_file + " - Check File Format");
        }
        if (incode_str === undefined) {
            throw new Error("Could not find timecode stream: " + this.source_file_obj.unix_file + " - Check File Format");
        }
        var frameRate = this.getFrameRate();
        var duration = AmountOfTime.parseFrames(frameRate, new java.lang.Double(num_frames));
        var incode   = FrameLabel.parseText(frameRate, incode_str);
        // Duration is difference between incode and outcode *inclusive*, so need to subtract 1 frame.
        var outcode = incode.add(duration).subtract(AmountOfTime.parseFrames(frameRate, new java.lang.Double(1)));
        output("FrameRate ["+frameRate+"]");
        output("Duration ["+duration+"]");
        output("OutCode ["+outcode+"]");
        output("InCode ["+incode+"]");
        output("_getMovTimeCodes end")
        return {
            duration   : duration,
            incode     : incode,
            outcode    : outcode,
            frameRate  : frameRate
        };
    }

    this.getMediaInfoTrackbyIndex = function(type,index){
        output("MediaInfoHelper getMediaInfoTrackbyIndex - Start")
        var mediaInfoTrackNode;
        if(type=="Video"){
            mediaInfoTrackNode =  this.mediaInfoXml.track.(@type.toString()==="Video");
        }else {
            if(index == 0 && this.mediaInfoXml.track.(@type.toString()==="Audio").length() == 1){
                mediaInfoTrackNode = this.mediaInfoXml.track.(@type.toString()==="Audio");
            }else{
                mediaInfoTrackNode = this.mediaInfoXml.track.(@type.toString()==="Audio")[index];
            }
        }
        output("MediaInfoHelper getMediaInfoTrackbyIndex - End")
        return mediaInfoTrackNode;
    }

    this.getTrackProperties = function(type,index){
        var properties = {}
        var mediaInfoTrackNode = this.getMediaInfoTrackbyIndex(type,index);
        if(gmoNBCFunc.isVarUsable(mediaInfoTrackNode)){

            if(type=="Video"){
                //Video
                properties["Width"] = this.getVideoWidth();
                properties["Height"] = this.getVideoHeight();
                properties["ChromaSubsampling"] = this.getChromaSubsampling();
                properties["ScanType"] = this.getScanType();
                properties["ScanOrder"] = this.getScanOrder();
                properties["FilePosition"] = 0;
                properties["Position"] = 1;
                properties["Channels"] = 0;
            }else {
                //Audio
                properties["SamplingRate"] = mediaInfoTrackNode.Sampling_rate[0].toString();
                properties["BitDepth"] = mediaInfoTrackNode.Bit_depth[0].toString();
                properties["Channels"] = mediaInfoTrackNode.Channel_s_[0].toString();
                properties["AudioCodec"] = mediaInfoTrackNode.Codec_ID[0].toString();
            }
            //Commmon
            properties["Format"] =  mediaInfoTrackNode.Format.toString();
            properties["BitRate"] = mediaInfoTrackNode.Bit_rate[0].toString();
            properties["Codec"] = mediaInfoTrackNode.Codec[0].toString();
           
        }else {
             output("MediaInfoTrackNode is Undefined/Empty");
        }
        return properties;
    }
}
