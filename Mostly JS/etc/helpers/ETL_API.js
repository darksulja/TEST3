/*
* @Author:Chris Filippone
* @Date:   2017-07-07 12:57:36
*/
//
// MX
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");	
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");	
load("/opt/evertz/mediator/etc/runners/ProfileHelper.js");	
load("/opt/evertz/mediator/etc/runners/nbcgmo_settings.js");		
load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js")
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js');  
// 
importPackage(Packages.org.apache.commons.httpclient);
importPackage(Packages.org.apache.commons.httpclient.methods);
importPackage(Packages.org.apache.http.impl.client);
importPackage(Packages.org.apache.http.auth);
//
var  ETLworksHelper = function(placingId,partnerName,schemaName,storageLocation,metadataEndPointOverride) {
    //  
    this.__ETL_LOGIN = "mediator";
    this.__ETL_PASS = "p7of3dvak2fjq9aec441ksa6iv";
    this.__ETL_PREFIX = "http://";
    this.__STATUS_POLL_TIME = 30 ;
    this.__placing_Id = "";
    this.__storageLocation = "";
    this.__placingHelper = "";
    this.__placingXml = ""; 
    this.__MatId = "";
    this.__ph ;
    this.__ETL_SCHEMA = schemaName;
    this.__ETL_partnerName = partnerName;
    this.__ETL_TVD = "";
    this.__ETL_IP = "100.99.48.43";
    const METADATA_END_POINT_SETTINGS_NAME = "Metadata Endpoint";
    //
    this.__getSystemSettings = function () {
        // get system title 
        var result =  wscall(<PharosCs>
                            <CommandList>
                            <Command subsystem="systemSettings" method="getSystemSettingsList"/>
                            </CommandList>
                        </PharosCs>)..Output.SystemSettingsList.SystemSettings;
        // system titles
        var dev_system_title = "NBCU GMO X DEV DC";
        var qa_system_title = "NBCU GMO X QA DC";
        var prod_system_title = "NBCU GMO X PROD EC";
        print ("System Title : " + result.SystemTitle.toString());
        if (result.SystemTitle.toString() == dev_system_title){
            return "dev";
        } else if (result.SystemTitle.toString() == qa_system_title){
            return "stage";
        } else if (result.SystemTitle.toString() == prod_system_title){
            return "prod";
        } else {
            print("Cannot match system title");
            throw new error ("Identity error");
        }
    }
    //
    this.__getEndPointFromTagType = function(tagType){
        print("ETA_API.__getEndPointsFromTagType");
        var endpoint = "";
        var tagSearchResult = wscall(<PharosCs>
            <CommandList>
            <Command subsystem="tag" method="search">
                <ParameterList>
                <Parameter name="value" value=""/>
                <Parameter name="tagType" value={tagType}/>
                </ParameterList>
            </Command>
            </CommandList>
        </PharosCs>);

        if(tagSearchResult..Command.@success.toString() === "true" && tagSearchResult..Output.TagList != "") {
            for each (var tag in tagSearchResult..Output.TagList.Tag.(TagType.toString() == tagType)) {
                var endpoint = tag.Value.toString();
                break;
            }
        }
        return endpoint;
    }
    var systemName = this.__getSystemSettings();
    if (gmoNBCFunc.isVarUsable(metadataEndPointOverride) && metadataEndPointOverride !== "None"){
        this.__ETL_METADATASEND =  metadataEndPointOverride ;
        this.__ETL_STATUS       =  metadataEndPointOverride + "/status/";
        this.__ETL_METADATAGET  =  metadataEndPointOverride ;
    }else {
        this.__ETL_METADATASEND = "plugins/schedules/rest/v1/httplistener/" + systemName + "/metadata/";
        this.__ETL_STATUS       = "plugins/schedules/rest/v1/httplistener/" + systemName + "/metadata/status/";
        this.__ETL_METADATAGET  = "plugins/schedules/rest/v1/httplistener/" + systemName + "/metadata/";
    }
    //
    var endPoint = this.__getEndPointFromTagType(METADATA_END_POINT_SETTINGS_NAME);
    //
    if(gmoNBCFunc.isVarUsable(endPoint)){
        this.__ETL_SITE = endPoint;
    }else{
        this.__ETL_SITE = "metadata-etl.inbcu.com";
    }
    print("Metadata  URL : "+this.__ETL_SITE);
    this.__ETL_URL = this.__ETL_PREFIX + this.__ETL_SITE +"/"; 
    //
    this.__metaDataRequestURL =this.__ETL_URL + this.__ETL_METADATASEND;
    this.__metaDataGetURL =this.__ETL_URL + this.__ETL_METADATAGET;
    this.__statusURL = this.__ETL_URL + this.__ETL_STATUS;
    
    print("Request Metadata URL :"+this.__metaDataRequestURL);
    print("Metadata GET URL : "+this.__metaDataGetURL);
    print("Status URL :"+this.__statusURL);
    //
    var authCode="";
    if (systemName == "prod"){
        print ("Production access");
        authCode = "UHJvZHVjdGlvbk1lZGlhdG9yOnRkY2xwdWdiMWk5NG04OTIzanZ2anRyYm9k";
    }else{
        print ("Stage access");
        authCode = "U3RhZ2luZ01lZGlhdG9yOjFmOHR2b3E2azZqYXVsZzFyZjF1ODg3cnRv";
    }
    //
    this.initialize = function(){
        // variable check 
                    //
        output("Instantiating ETLworksHelper");
        if (gmoNBCFunc.isVarUsable(placingId)){
            this.__placing_Id = placingId;
            // Initial Placing helper
            this.__placingHelper = new PlacingHelper(placingId);
            this.__placingXml = this.__placingHelper.getPlacingXml(); 
            this.__MatId = this.__placingHelper.mainMaterial;
            this.__ETL_TVD = this.__placingXml..ShortText.(ShortTextType.toString() == "TVD Production #").Value.toString();
            this.__materialHelper = new gmoNBCFunc.materialHelper(this.__MatId);
            if( this.__materialHelper.materialExists() === false){
                throw new error ("Material :" + this.__MatId  + " does NOT exist...");
            } 

            // for UHD 
            this.__materialXml = this.__materialHelper.getMaterialXml() ;
            //Profile help
            this.__ph = new ProfileHelper();
            this.__ph.setProfile(this.__placingXml.ShortTextList.ShortText.(ShortTextType == "Matched Profile").Value.toString());
            this.__ph.initialize();
            print("profile : "+this.__placingXml.ShortTextList.ShortText.(ShortTextType == "Matched Profile").Value.toString());
            print("Placing ID set to : "+this.__placing_Id);
        }else{
            throw new error ("Placing ID must be supplied")
        }
        if (gmoNBCFunc.isVarUsable(storageLocation)){
            this.__storageLocation = storageLocation;
            print("Storage location set to : " + this.__storageLocation);
        }else{
            throw new error ("Storage location must be supplied");
        }
    }
    this.setStatus = function (status){
        print('Return status set to ['+ status+']');
        this.__status = status;
    }
    this.getStatus = function (){
        return this.__status;
    }
    this.sendToETL = function (sourceShareID,body,method,Output){
        try{
            this.__JRAPI = new JRAPI();
            var client = new Packages.org.apache.commons.httpclient.HttpClient();
            //client.getState().setCredentials(AuthScope.ANY,this.__ETL_IP,new Packages.org.apache.commons.httpclient.UsernamePasswordCredentials(this.__ETL_LOGIN,this.__ETL_PASS));
            if (method == 'GET'){
                if (body.length > 0){
                    for (var i=0; i < body.length; i++){
                        sourceShareID += body +"/";
                    }
                }
                var get = new Packages.org.apache.commons.httpclient.methods.GetMethod( sourceShareID);
                get.setRequestHeader(new Header("Content-Type", "application/json"));
                get.setRequestHeader(new Header("Accept", "application/json"));
                var basicAuth = "Basic "+authCode;
                get.setRequestHeader(new Header( "Authorization", basicAuth));;
                var status = client.executeMethod(get);
                var br = new java.io.BufferedReader(new java.io.InputStreamReader(get.getResponseBodyAsStream()));           
            }else if (method == 'POST') {
                var post = new Packages.org.apache.commons.httpclient.methods.PostMethod(sourceShareID);
                post.setRequestHeader(new Header("Content-Type", "application/json"));
                post.setRequestHeader(new Header("Accept", "application/json"));
                post.setRequestBody(this.__JRAPI.JSON.stringify(body));
                var basicAuth = "Basic "+authCode;
                post.setRequestHeader(new Header( "Authorization", basicAuth));
                var status = client.executeMethod(post);
                var br = new java.io.BufferedReader(new java.io.InputStreamReader(post.getResponseBodyAsStream()));
                } else {
                // other methods put delete etc
            }
            //
           
            print("\n API status - "+status);
            this.setStatus(status);
            var response = "";
            var line = br.readLine();
            while(line != null){
                response = response + line;
                line = br.readLine();
            }
            br.close();
            if (method == 'GET'){
                get.releaseConnection();
            }else if (method == 'POST'){
                post.releaseConnection();
            } else{
                print("Other method ?")
            }
            print("Response\n"+response);
            print("Status"+status);
            if(Output =="JSON"){
                var payload = this.__JRAPI.JSON.parse(response);
            }   
            else{
                var payload = response;
            }
            if(status == 200) {
                if(response !== "" && response.indexOf("error")>=0) {
                    var obj = eval("("+response+")");
                    var errorMessage = obj.error.exception + "-" + obj.error.internal_message;
                    throw new Error("ETL API error - " + errorMessage);    
                }else{
                    return payload; 
                }
            } else {
                if(response!="" && response.indexOf("error")>=0) {
                    obj = eval("("+response+")");
                    var errorMessage = obj.error.exception + "-" + obj.error.internal_message;
                    throw new Error(" ETL api Failed - " + errorMessage);
                }
                throw new Error(" ETL API Look Up Failed - " + response);
                return {"status":""};
            }
        } catch(e){
            print("error on ETL API call " +e.message )  ;
            return {"status":""};
        }
        //
    }
    this.pollStatus = function (flowId,messageId){
        var ETL_STATUS = this.__statusURL + flowId + "/" + messageId ;
        print(ETL_STATUS);
        var cntr =0;
        var body="";
        while (true){
            cntr ++;
            try {
                var response = this.sendToETL(ETL_STATUS,body,"GET","JSON");
            } catch(e){
                continue;
            }
            if (response.status === 'success') {
                print('\nCompleted   Successfully');
                break;
            }
            if (response.status  === 'error' ) {
                print('\nError condition - status ['+response.status +']' );
                throw new Error("[ Errored ]");
            }
            if (response.status  === 'running' ) {
                print('\nStatus [ Running ]');
            }
            if (response.status  === 'warning' ) {
                print('\nWarning condition - status ['+response.status +']');
                //  break ? throw new Error("Errored ");
            }
            sleep(this.__STATUS_POLL_TIME);
            if (cntr > 10){
                throw new error ("ETL API ERROR");
            }

        }
    }
    this.getMetadata = function(){
        this.__JRAPI = new JRAPI();  
        try{
            var action="add";
            var version=1;
            var results = this.TechnicalMetadata(action,version);
            print(this.__JRAPI.JSON.stringify(results));
            // url for request params  URL / partner / schema / TVD / OrderID
            // URL + /apple/itunes/A0B80/AL-240408-A0B80-155544681
            var newURL = this.__metaDataRequestURL + this.__ETL_partnerName + "/" + this.__ETL_SCHEMA + "/" + this.__ETL_TVD + "/" + this.__placing_Id ;
            print("complete URL" +newURL);
            //var newURL = this.__metaDataRequestURL + "Apple" + "/" + this.__ETL_SCHEMA + "/" + this.__ETL_TVD + "/" + this.__placing_Id ;
            //print("URL : " + newURL);
            try{
                var response = this.sendToETL(newURL,results,'POST','JSON');
            } catch(e){
                print("Error sending request to ETL API "+e.message);
            }
            print("status : "+response.status)
            if (response.status == "received"){
                this.pollStatus(response.flowId,response.messageUuid);
                print("DONE");
                var resultsURL = this.__metaDataGetURL + this.__placing_Id + "/" + this.__ETL_partnerName + "/" + this.__ETL_SCHEMA  ;
                //var resultsURL = this.__metaDataGetURL + this.__placing_Id + "/" + "Apple" + "/" + this.__ETL_SCHEMA  ;
                // print (resultsURL);
                var results = this.sendToETL(resultsURL,"",'GET',"XML");
                return results;
            }
        } catch(e){
            print("Error preparing metadata "+e.message);
        }

    }
    this.TechnicalMetadata = function(action,version){
        // list of standard image formats to check againstt file extension of image
        try {
            var fileLocation = this.__storageLocation;
            var placingId = this.__placing_Id;
            print("Storage Location :"+storageLocation);
            print("Placing ID" + placingId);
            var videoFormats = ["tif","tiff","bmp","jpg","jpeg","gif","png"];
            // MD5 hash from useful file 
            this.getMd5Sum = function(inFile){
                return /^[\d\w]+/.exec(run("/usr/bin/md5sum",inFile ).output).toString();
            }; // get md5
            // Need this for JSON object
            this.__JRAPI = new JRAPI();
            //  Need to calculate tracks in case of MOS
            this.calcChannelsPerTrack = function (tracks){
                var channels= {};
                var position =0 ; // start at 0 for video
                for each (var track in tracks..TrackType){
                    var audioChannels =0;
                    var trackClass = track.ClassId.toString();
                    var trackTypeName =  track.Name.toString();
                    // print(trackClass);
                    // print(trackTypeName);
                    if (gmoNBCFunc.isVarUsable(trackClass)){
                        if(trackClass == "AUDIO"){
                            if (this.__ph.getProfileAsString().indexOf("NLDM") == 0) {
                                (trackTypeName.indexOf("Mono") > -1 || trackTypeName.indexOf("MOS") > -1)
                                    ? audioChannels = 1
                                    : audioChannels = 2;
                            }
                            else { audioChannels = 2 };
                        }
                        position += audioChannels;
                        channels[trackTypeName] = position;

                    }
                }
                return channels;
            }; //calc channels pre track 
            var sideCar = this.__ph.isProfileHasSideCarAudioReq();
            var profileTracks =  this.__ph.getProfile();
            //print("Profile tracks"+profileTracks);
            var profileChannels = this.__ph.getAudioChannelsForProfile();
            print("Profile channels : "+profileChannels);
            // basic return object info
            var technicalData =  {
                "Id" : placingId,
                "Action" : action,
                "SourceMaterialID": this.__placingHelper.mainMaterial,
                "TVDProdNumber": this.__placingHelper.getTVDId(),
                "Platform": this.__placingXml..ShortTextList.ShortText.(ShortTextType == "Licensee").Value.toString(),
                "version": version,
                "MediaFileManifest" : []
            };
            //
            print("Storage location : " + fileLocation);
            var dirFiles = new File(fileLocation).listFiles();
            // single file 
            // if (dirFiles == null){
            //     dirFiles =  storageLocation;
            // } 
            //  Loop through directory items
            for each(fileItem in dirFiles){
                    // setup file XML from mediainfo
                    var videoFlag= false;
                    //
                    var audioChannelCount = 0 ;
                    var mediaInfoHelper = new MediaInfoHelper();
                    print("File : " +fileItem);
                    //print("Profile : " +ph.getProfileAsString() );
                    var fileInfoXml = gmoNBCFunc.getFileInfoXml(fileItem);
                    //print(fileInfoXml);
                    mediaInfoHelper.setMediaInfoXml(fileInfoXml);
                    var audioTrack = fileInfoXml.track.(@type.toString()==="Audio");
                    if (gmoNBCFunc.isVarUsable(audioTrack)){
                        var audioChannelCount = fileInfoXml.track.(@type.toString()==="Audio").length() ;
                    }
                    var channelLocations = this.calcChannelsPerTrack(profileTracks);
                    var generalInfoXML =  fileInfoXml.track.(@type.toString()==="General");
                    var imageInfoXML =  fileInfoXml.track.(@type.toString()==="Image");            
                    if (audioChannelCount > 0 ) {
                        //
                        for each (var track in profileTracks..TrackType){
                            if(track.ClassId.toString() == "VIDEO"){
                                //
                                videoFlag = true;
                                var videoItem={};
                                var filegetmd5 = this.getMd5Sum(fileItem).toString();
                                var filesize = generalInfoXML.File_size[0].toString();
                                var frameRate = generalInfoXML.Frame_rate[0].toString();
                                var videoContainer = fileInfoXml.track.(@type.toString()==="Video");
                                var fileExt = generalInfoXML.File_extension;
                                //print(videoContainer);
                                var fileName =  generalInfoXML.File_name.toString() + "." + generalInfoXML.File_extension;
                                var codec = videoContainer.Codec[0].toString() ? videoContainer.Codec[0].toString() : "";
                                var videoItem = {"Type": "Video",
                                                "FileName": fileName ,
                                                "FileSize" : filesize ,
                                                "FrameRate": frameRate,
                                                "CheckSum": fileMD5,
                                                "Standard": mediaInfoHelper.getStandard(mediaInfoHelper.getVideoHeight()),
                                                "Width": videoContainer.Width[0].toString(),
                                                "Height": videoContainer.Height[0].toString(),
                                                "Duration": videoContainer.Duration[4].toString(),
                                                "Codec": codec,
                                                "Format": videoContainer.Format.toString(),
                                                "BitRate": videoContainer.Bit_rate[0].toString(),
                                                "HDRluminanceMax" : this.__materialHelper.getMaterialShortTextValue("HDR: Luminance Max"),
                                                "HDRluminanceMin" : this.__materialHelper.getMaterialShortTextValue("HDR: Luminance Min"),
                                                "HDRmaxCLL" : this.__materialHelper.getMaterialShortTextValue("HDR: MaxCLL"),
                                                "HDRmaxFALL" : this.__materialHelper.getMaterialShortTextValue("HDR: MaxFALL"),
                                                "HDRprimariesStandard" : this.__materialHelper.getMaterialShortTextValue("HDR: Primaries Standard"),
                                                "HDRwhitePoint" : this.__materialHelper.getMaterialShortTextValue("HDR: White Point"),
                                                "AudioTracks" : []
                                            };
                            //print(this.__JRAPI.JSON.stringify(videoItem));        
                            //
                            }else if(track.ClassId.toString() == "AUDIO"){
                                var audioItem = {};
                                var audioChannels =0;
                                var trackTypeName =  track.Name.toString();
                                var fileTag = track.FileTag.toString();
                                print("Name :" +trackTypeName);
                                print("Location : " + channelLocations[trackTypeName]);
                                var trackInfo = fileInfoXml..track.(@type.toString()==="Audio")[channelLocations[trackTypeName] - 1];
                                // 
                                if (this.__ph.getProfileAsString().indexOf("NLDM") == 0) {
                                    (trackTypeName.indexOf("Mono") > -1 || trackTypeName.indexOf("MOS") > -1)
                                        ? audioChannels = 1
                                        : audioChannels = 2
                                }
                                else { 
                                    audioChannels = 2 
                                }
                                audioItem["LanguageCode"] =  fileTag.slice(fileTag.indexOf('_')+1);
                                audioItem["Position"] =  track.DefaultPosition.toString();
                                audioItem["TrackTypeCode"] =  fileTag;
                                if (track.Name.toString() == "Stereo M&E"){
                                    var codec = "";
                                    var format ="";
                                    var bitRate="";
                                }    
                                else{
                                    var format =  trackInfo.Format[0].toString();
                                    var codec = trackInfo.Codec[0].toString() ;
                                    var bitRate =trackInfo.Bit_rate[0].toString();
                                }
                                audioItem["Codec"] =  codec;
                                audioItem["Format"] =  format;
                                audioItem["Channels"] = audioChannels;
                                audioItem["BitRate"] =  bitRate;
                                //print(this.__JRAPI.JSON.stringify((audioItem));
                                //
                                videoItem.AudioTracks.push(audioItem);
                            }else {
                                    // we deal with this as it has no Audio tracks
                                    // for future use
                            }                                    
                    } // for each track in profile
                    technicalData.MediaFileManifest.push(videoItem); 
                } else if (generalInfoXML.File_extension =="scc") {
                    var captionItem ={};

                    print ("SUBTITLE");
                    var track = profileTracks..TrackType.(ClassId =="SUBTITLE");
                    //print(track);
                    var fileMD5 = this.getMd5Sum(fileItem).toString();
                    var filesize = generalInfoXML.File_size[0].toString();
                    var fileName =  generalInfoXML.File_name.toString() + "." + generalInfoXML.File_extension.toString();
                    var fileTag = track.FileTag.toString();
                    captionItem.Type="Caption";
                    captionItem.FileName = fileName; 
                    captionItem.FileSize = filesize ;
                    captionItem.CheckSum = fileMD5;
                    captionItem.LanguageCode = fileTag.slice(fileTag.indexOf('_')+1);
                    captionItem.TrackTypeCode = fileTag;
                    captionItem.Format = generalInfoXML.Format[0].toString();
                    technicalData.MediaFileManifest.push(captionItem);
                    // print(JSON.stringify(captionItem));    
                    // print(captionItem)
                } else if ( gmoNBCFunc.isVarUsable(fileExt) ){
                    if ( videoFormats.indexOf(fileExt.toLowerCase()) !== -1) {
                        // Image file 
                        //print(imageInfoXML);
                        var imageItem = {};
                        var fileMD5 = this.getMd5Sum(fileItem).toString();
                        var filesize = generalInfoXML.File_size[0].toString();
                        var fileName =  generalInfoXML.File_name.toString() + "." + generalInfoXML.File_extension.toString();
                        var filePrefix =  generalInfoXML.File_name.toString() ;
                        print("Image");";"
                        imageItem.Type= "Image";
                        imageItem.FileName = fileName; 
                        imageItem.FileSize = filesize ;
                        imageItem.CheckSum = fileMD5;
                        imageItem.Width = imageInfoXML.Width[0].toString();
                        imageItem.Height =  imageInfoXML.Height[0].toString();
                        imageItem.Format = imageInfoXML.Format[0].toString();
                        imageItem.LanguageCode = filePrefix.slice(filePrefix.indexOf('-')+1).slice(filePrefix.indexOf('_')+1);
                        technicalData.MediaFileManifest.push(imageItem);
                    }
                } else {
                    print ("Undetermined track / material  media type : " +fileInfoXml..track.@type.toString() );
                } 

            }// for each file
            //
            //print(this.__JRAPI.JSON.stringify(technicalData));
            return technicalData;
            } catch(e){
                output("An error occured creating technical meta data : " + e.message);
        }
    } // function end
} // end of helper 
//
// Example usage.
//
// // MX
// wsLogin("localhost","wsuser","wspass");
// this.__JRAPI = new JRAPI();        
// var debug = false;
// var schemaName = "test";
// var partnerName = "apple";
// var endPointOverride ="None";
// var placingId = "TEST-MA3-18743572-9C5A-44B3-922B-C6055C12E20F";
// var directoryPath = "/srv/dc-dvs/NLD/Packaging/BUENA_VISTA_ON_DEMAND_DISNEY/TEST-MA3-18743572-9C5A-44B3-922B-C6055C12E20F.dir/";
// // Initialize and run 
// var ETL = new ETLworksHelper(placingId,partnerName,schemaName,directoryPath,endPointOverride);
// ETL.initialize();
// //var results = ETL.TechnicalMetadata("add",1);
// //print(this.__JRAPI.JSON.stringify(technicalData));
// print(ETL.getMetadata());