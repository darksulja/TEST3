 /*
* @Author:Chris Filippone
* @Date:   2017-03-07 12:57:36
*/
// URL http://daisy.inbcu.com/daisy/asset/search/filename/DowntonAbbey_SET562077_UXX01_EPS_Television_25_4x3FF_133_RUS_2CH_PAL_RussianLibrary.mpg
// testing in rhino 
//
importPackage(Packages.org.apache.commons.httpclient);
importPackage(Packages.org.apache.commons.httpclient.methods);
importPackage(Packages.org.apache.http.impl.client);
importPackage(Packages.org.apache.http.auth);
//
load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js'); // This is included becasue we want the JSON parsing
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");		
load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js");
// for testing only
//wsLogin("localhost","wsuser","wspass");
//
var gmoNBCDaisy ={

    daisyFileNameHelper : function(matId,filename) {
        print("Mat ID [" + matId + ']');
        this.matId = matId;
        if (gmoNBCFunc.isVarUsable(filename)) {
            this.originalFilename = filename;
            print('filename param found, using it : [' + this.originalFilename + ']' )
        } else {
            var materialHelper = new gmoNBCFunc.materialHelper(matId);
            this.originalFilename = materialHelper.getMaterialShortTextValue(NBCGMO_CONSTANTS.SHORT_TEXTS.ORIGINAL_FILE_NAME);
            print('Using MatId of [' + matId + '] to find [' + this.originalFilename + '] for lookup' );
        }
        try{
            this._JRAPI = new JRAPI();
            var sourceShareID = "http://daisy.inbcu.com/daisy/filenameService/asset/" + this.originalFilename;
            var client = new Packages.org.apache.commons.httpclient.HttpClient();
            var get = new Packages.org.apache.commons.httpclient.methods.GetMethod( sourceShareID);
            var hostConfig = client.getHostConfiguration();
            get.setRequestHeader(new Header("Content-Type","application/json"));
            get.setRequestHeader(new Header("Accept", "application/json"));
            var status = client.executeMethod(get);
            print("\n API status - "+status);
            var br = new java.io.BufferedReader(new java.io.InputStreamReader(get.getResponseBodyAsStream()));
            var response = "";
            var line = br.readLine();
            while(line != null){
                response = response + line;
                line = br.readLine();
            }
            br.close();
            get.releaseConnection();
            print("Response\n"+response);
            //print("Status"+status);
            var payload = this._JRAPI.JSON.parse(response);
            if(status==200) {
                if(response !== "" && response.indexOf("error")>=0) {
                    var obj = eval("("+response+")");
                    var errorMessage = obj.error.user_message + "-" + obj.error.internal_message;
                    throw new Error("Daisy filename API error - " + errorMessage);    
                }else{
                    this.resultsOBJ = payload;
                }
            } else {
                if(response!="" && response.indexOf("error")>=0) {
                    obj = eval("("+response+")");
                    var errorMessage = obj.error.user_message + "-" + obj.error.internal_message;
                    throw new Error(" Daisy Filename api  Failed - " + errorMessage);
                }
                throw new Error(" daisy filename api Look Up Failed - " + response);
                this.resultsOBJ={Found:false,results:[]};
            }
        } catch(e){
            print("error")  ;
        }    
        //print(originalFilename);
        //
        this.frameRateLookup= function (frameRate){
            var anchorFrameRates = { "25":"NDF25",
                                    "60" : "NDF60",
                                    "23.976": "P23_976",
                                    // Spotted in the wild 08/28/2018 
                                    "23.98": "P23_976",
                                    "30" :"DF30"};
        
            return anchorFrameRates[frameRate];
        };
        this.getParsedAspectRatio = function (aspectRatio){
            if (aspectRatio == "Multiple Ratios-See Comments"){
                return 0
            }
            var aspect = aspectRatio.split(":");
            return aspect[0];
        };

        this.getNBClanguage = function (language) {
            //print("Language : "+language);
            language = gmoNBCFunc.getTagByTagTypeAndValue("Daisy Language Code Lookup", language.toString().toLowerCase())
            return gmoNBCFunc.isVarUsable(language)? language.Description.toString(): "";
        }
        
        this.getNBCmaterialType = function (materialType) {
            //print("Materialtype : "+materialType);
            materialType = gmoNBCFunc.getTagByTagTypeAndValue("Daisy Material Type Lookup", materialType.toString().toLowerCase())
            return gmoNBCFunc.isVarUsable(materialType)? materialType.Description.toString(): "";
        }
        this.getNBCtransformation = function (transformation) {
            //print("Materialtype : "+materialType);
            var newTransformation ="";
            if(transformation == "Letterbox") newTransformation = "Letter Box";
            if(transformation == "Full Frame") newTransformation = "Full Frame";
            if(transformation == "Side Matte") newTransformation = "Side Matte";
            return newTransformation
        }
        this.getResultXML = function (){
            //
            var payload = this.resultsOBJ;   
            var resultsXml = <Results>
                        <fileName/>
                        <Found/>
                        </Results> ;
            resultsXml.fileName = payload.filename;
            if (payload.results.length >0 ){
                resultsXml.Found = "True";
            }else{
                resultsXml.Found = "False";
            }
            for each (var record in payload.results){
                Xml = <Daisy>
                            <Title/>
                            <PrimaryLanguage/>
                            <MediatorLanguage/>
                            <AspectRatio/>
                            <MediatorAspectRatio/>
                            <MaterialType/>
                            <MediatorMaterialType/>
                            <VersionType/>
                            <Transformation/>
                            <DaisyId/>
                            <OriginalAspectRatio/>
                            <MediatorOriginalAspectRatio/>
                            <OriginalAspectRatioFlag/>
                            <ProdNumber/>
                            <OriginalFrameRate/>
                            <MediatorOriginalFrameRate/>
                        </Daisy> ;
                Xml.Title = record.title;
                Xml.PrimaryLanguage = record.primaryLanguage;
                Xml.MediatorLanguage = this.getNBClanguage(record.primaryLanguage);
                Xml.AspectRatio = record.aspectRatio;
                Xml.MediatorAspectRatio = this.getParsedAspectRatio(record.aspectRatio);
                Xml.MaterialType = record.materialType;
                Xml.MediatorMaterialType = this.getNBCmaterialType(record.materialType);
                Xml.VersionType = record.versionType;
                Xml.Transformation = this.getNBCtransformation(record.transformation);
                Xml.DaisyId = record.daisyId;
                Xml.OriginalAspectRatio = record.originalAspectRatio;
                Xml.OriginalAspectRatioFlag = record.originalAspectRatio === record.aspectRatio;
                Xml.MediatorOriginalAspectRatio = this.getParsedAspectRatio(record.originalAspectRatio);
                Xml.ProdNumber = record.prodNumber;
                Xml.OriginalFrameRate = record.originalFrameRate;
                Xml.MediatorOriginalFrameRate = this.frameRateLookup(record.originalFrameRate);
                for each  (var channel in record.channels){
                    var channelXml =<Channels>
                                        <Language/>
                                        <Version/>
                                        <Format/>
                                        <Description/>
                                        <Configuration/>
                                        <ChannelNumber/>
                                    </Channels>
                    channelXml.Language = channel.language;
                    channelXml.Version = channel.version;
                    channelXml.Format = channel.format;
                    channelXml.Description = channel.description;
                    channelXml.Configuration = channel.configuration;
                    channelXml.ChannelNumber = channel.channelNumber;
                    Xml.appendChild(channelXml);
                }
                resultsXml.appendChild(Xml);
            }
            return resultsXml;
        }
        this.getResultJSON = function (){
            //
            var payload = this.resultsOBJ;  
            // var test = this._JRAPI.JSON.stringify(payload);
            // print(test) 
            if (payload.results.length >0 ){
                var record = payload.results[0];
                var returnOBJ = {
                    "title" : record.title.toString(),
                    "Found": true,
                    "fileName" : payload.filename.toString(),
                    "primaryLanguage" : gmoNBCFunc.isVarUsable(record.primaryLanguage)? record.primaryLanguage.toString() : "",
                    "mediatorLanguage" : gmoNBCFunc.isVarUsable(record.primaryLanguage)? this.getNBClanguage(record.primaryLanguage.toString()) : "",
                    "aspectRatio" : gmoNBCFunc.isVarUsable(record.aspectRatio)? record.aspectRatio.toString() : "",
                    "mediatorAspectRatio" : gmoNBCFunc.isVarUsable(record.aspectRatio)? this.getParsedAspectRatio( record.aspectRatio.toString()) : "",
                    "materialType" : gmoNBCFunc.isVarUsable(record.materialType)? record.materialType.toString() : "",
                    "mediatorMaterialType" : gmoNBCFunc.isVarUsable(record.materialType)? this.getNBCmaterialType(record.materialType.toString()) : "",
                    "versionType" : gmoNBCFunc.isVarUsable(record.versionType)? record.versionType.toString():"",
                    "transformation" : gmoNBCFunc.isVarUsable(record.transformation)? this.getNBCtransformation(record.transformation.toString()) : "",
                    "daisyId" : gmoNBCFunc.isVarUsable(record.daisyId)? record.daisyId.toString() : "",
                    "originalAspectRatio" : gmoNBCFunc.isVarUsable(record.originalAspectRatio)? record.originalAspectRatio.toString() : "",
                    "mediatorOriginalAspectRatio" : gmoNBCFunc.isVarUsable(record.originalAspectRatio)?  this.getParsedAspectRatio(record.originalAspectRatio.toString()) : "",
                    "originalAspectRatioFlag": record.originalAspectRatio === record.aspectRatio ,
                    "prodNumber" : gmoNBCFunc.isVarUsable(record.prodNumber)?  record.prodNumber.toString() : "",
                    "originalFrameRate" : gmoNBCFunc.isVarUsable(record.originalFrameRate)?  record.originalFrameRate.toString() : "",
                    "mediatorOriginalFrameRate" : gmoNBCFunc.isVarUsable(record.originalFrameRate)?  this.frameRateLookup(record.originalFrameRate.toString()) : "",
                    "channelLayout" : record.channels
                }
            }
            else {
                returnOBJ= {"Found": false};
            }
            // var test = this._JRAPI.JSON.stringify(returnOBJ);
            // print(test)
            return returnOBJ ;
        }
       
        this.updateDaisyInfo = function(){
            var JSONdata = this.getResultJSON();
            if (JSONdata.Found){
                    try {
                    materialHelper.addTitleToSaveXml(JSONdata.title);

                    if (gmoNBCFunc.isVarUsable(JSONdata.mediatorLanguage)) {
                        materialHelper.saveTagValue("Primary Language",JSONdata.mediatorLanguage);
                    }

                    if (gmoNBCFunc.isVarUsable(JSONdata.mediatorAspectRatio)) {
                        materialHelper.addAspectRatioToSaveXml(JSONdata.mediatorAspectRatio);
                    }

                    if (gmoNBCFunc.isVarUsable(JSONdata.mediatorMaterialType)) {
                        materialHelper.addMaterialTypeToSaveXml(JSONdata.mediatorMaterialType);
                    }

                    if (gmoNBCFunc.isVarUsable(JSONdata.versionType)) {
                        materialHelper.addVersionTypeToSaveXml(JSONdata.versionType);
                    }

                    if (gmoNBCFunc.isVarUsable(JSONdata.transformation)) {
                        materialHelper.addTransformationToSaveXml(JSONdata.transformation);
                    }

                    if (gmoNBCFunc.isVarUsable(JSONdata.daisyId)) {
                        materialHelper.saveShortTextValue("Daisy ID",JSONdata.daisyId);
                    }

                    if (gmoNBCFunc.isVarUsable(JSONdata.originalAspectRatioFlag)) {
                        materialHelper.saveShortTextValue("Original Aspect Ratio",JSONdata.originalAspectRatioFlag);
                    }

                    if (gmoNBCFunc.isVarUsable(JSONdata.prodNumber)) {
                        materialHelper.saveShortTextValue("Daisy Production #",JSONdata.prodNumber);
                    }

                    //materialHelper.printSaveXml();
                    materialHelper.saveUsingSaveXml();
                } catch(e) {
                    throw new Error("Failed to save Daisy info against material [" + this.matId + "]. Error: " + e);
                }
            }
        }
  
    }
}
//EXAMPLES
//
//file exists example
//
//  var dh = new  gmoNBCDaisy.daisyFileNameHelper('UTS_00000000000140_02');
//  dh.checkDaisyAPIandUpdate();
//  // show xml dh.getResultXML();
//  var dh = new gmoNBCDaisy.daisyFileNameHelper('UTS_00000000000132_02');
//  dh.checkDaisyAPIandUpdate();
//  // show xml dh.getResultXML();
