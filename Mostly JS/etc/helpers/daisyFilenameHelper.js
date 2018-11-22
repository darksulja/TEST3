/*
* @Author:Chris Filippone
* @Date:   2017-03-07 12:57:36
*/
// URL http://daisy.inbcu.com/daisy/asset/search/filename/DowntonAbbey_SET562077_UXX01_EPS_Television_25_4x3FF_133_RUS_2CH_PAL_RussianLibrary.mpg
// Example :DaisyFileNameAPI("DowntonAbbey_SET562077_UXX01_EPS_Television_25_4x3FF_133_RUS_2CH_PAL_RussianLibrary.mpg","XML");
// Example :DaisyFileNameAPI("DowntonAbbey_SET562077_UXX01_EPS_Television_25_4x3FF_133_RUS_2CH_PAL_RussianLibrary.mpg","JSON");
importPackage(Packages.org.apache.commons.httpclient);
importPackage(Packages.org.apache.commons.httpclient.methods);
importPackage(Packages.org.apache.http.impl.client);
importPackage(Packages.org.apache.http.auth);

load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js'); // This is included becasue we want the JSON parsing
load('/opt/evertz/mediator/etc/runners/nbcgmo_fun.js');

DaisyFileNameAPI = function (fileName,returnFormat) {
    this._JRAPI = new JRAPI();
    var sourceShareID = "http://daisy.inbcu.com/daisy/asset/search/filename/" + fileName;
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
        if(response!="" && response.indexOf("error")>=0) {
            var obj = eval("("+response+")");
            var errorMessage = obj.error.user_message + "-" + obj.error.internal_message;
            throw new Error("Daisy filename API error - " + errorMessage);
        }
        if (returnFormat == "XML"){
            // 
            var resultsXml = <Results>
                          <fileName/>
                         </Results> ;
            resultsXml.fileName = payload.filename;
            for each (var record in payload.results){
                Xml = <Daisy>
                            <Title/>
                            <PrimaryLanguage/>
                            <AspectRatio/>
                            <MaterialType/>
                            <VersionType/>
                            <Transformation/>
                            <DaisyId/>
                            <audioProfile/>
                            <oOriginalAspectRatio/>
                            <ProdNumber/>
                            <OriginalFrameRate/>
                        </Daisy> ;
                Xml.Title = record.title;
                Xml.PrimaryLanguage = record.primaryLanguage;
                Xml.AspectRatio = record.aspectRatio;
                Xml.MaterialType = record.materialType;
                Xml.VersionType = record.versionType;
                Xml.Transformation = record.transformation;
                Xml.DaisyId = record.daisyId;
                Xml.AudioProfile = record.audioProfile;
                Xml.OriginalAspectRatio = record.originalAspectRatio;
                Xml.ProdNumber = record.prodNumber;
                Xml.OriginalFrameRate = record.originalFrameRate;
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
                    channelXml.Configuration = channel.configuration
                    channelXml.ChannelNumber = channel.channelNumber
                    Xml.appendChild(channelXml);
                }
                resultsXml.appendChild(Xml);
            }
            return resultsXml;
        }else{
            // JSON
            return payload ;
        }
    } else {
        if(response!="" && response.indexOf("error")>=0) {
            var obj = eval("("+response+")");
            var errorMessage = obj.error.user_message + "-" + obj.error.internal_message;
            throw new Error(" Daisy Filename api  Failed - " + errorMessage);
        }
        throw new Error(" daisy filename api Look Up Failed - " + response);
    }
}
//
// JSON example 
// var x = new DaisyFileNameAPI("DowntonAbbey_SET562077_UXX01_EPS_Television_25_4x3FF_133_RUS_2CH_PAL_RussianLibrary.mpg","JSON");
// print(x)
// {
//     "filename": "DowntonAbbey_SET562077_UXX01_EPS_Television_25_4x3FF_133_RUS_2CH_PAL_RussianLibrary.mpg",
//     "results": [{
//         "title": "DOWNTON ABBEY #01 EPISODE #01 (UXX01) ",
//         "primaryLanguage": "Russian",
//         "aspectRatio": "1.33:1",
//         "materialType": "Full Episode",
//         "versionType": "Television",
//         "channels": [{
//             "language": "Russian",
//             "version": "Unmatched",
//             "format": "Stereo",
//             "description": null,
//             "configuration": "Stereo LT +12db",
//             "channelNumber": "1"
//         }, {
//             "language": "Russian",
//             "version": "Unmatched",
//             "format": "Stereo",
//             "description": null,
//             "configuration": "Stereo RT +12db",
//             "channelNumber": "2"
//         }],
//         "transformation": "Full Frame",
//         "daisyId": "DA000116245",
//         "audioProfile": "2",
//         "originalAspectRatio": "1.33:1",
//         "prodNumber": "UXX01",
//         "originalFrameRate": "25"
//     }]
// }
// 
// XML example
// var y = new DaisyFileNameAPI("DowntonAbbey_SET562077_UXX01_EPS_Television_25_4x3FF_133_RUS_2CH_PAL_RussianLibrary.mpg","XML");
// print(y)
/* <Results>
  <fileName>DowntonAbbey_SET562077_UXX01_EPS_Television_25_4x3FF_133_RUS_2CH_PAL_RussianLibrary.mpg</fileName>
  <Daisy>
    <Title>DOWNTON ABBEY #01 EPISODE #01 (UXX01) </Title>
    <primaryLanguage>Russian</primaryLanguage>
    <aspectRatio>1.33:1</aspectRatio>
    <materialType>Full Episode</materialType>
    <versionType>Television</versionType>
    <Transformation>Full Frame</Transformation>
    <daisyId>DA000116245</daisyId>
    <audioProfile>2</audioProfile>
    <originalAspectRatio>1.33:1</originalAspectRatio>
    <prodNumber>UXX01</prodNumber>
    <originalFrameRate>25</originalFrameRate>
    <Channels>
      <Language>Russian</Language>
      <Version>Unmatched</Version>
      <Format>Stereo</Format>
      <Description>null</Description>
      <Configuration>Stereo LT +12db</Configuration>
      <channelNumber>1</channelNumber>
    </Channels>
    <Channels>
      <Language>Russian</Language>
      <Version>Unmatched</Version>
      <Format>Stereo</Format>
      <Description>null</Description>
      <Configuration>Stereo RT +12db</Configuration>
      <channelNumber>2</channelNumber>
    </Channels>
  </Daisy>
</Results>  */
