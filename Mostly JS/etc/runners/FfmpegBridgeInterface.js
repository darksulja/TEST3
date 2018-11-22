/*
* @Author: Chad Lundgren
* @Date:   2018-06-26 23:26:09
* @Last Modified by:  Chad Lundgren
* @Last Modified time: 2018-06-26 12:18:29
*/

importPackage(Packages.com.pharos.poxclient);

if(typeof(wscall)==="undefined"){
    load("/opt/evertz/mediator/lib/js/shellfun.js");    
}

if(typeof(JRAPI)==="undefined"){
    load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js');
}

FfmpegBridgeInterface = function() {

    this.__endpoint = "";
    this.__JRAPI = new JRAPI()
    this.getEndPoint = function(){
        return this.__endpoint;
    };

    this.initializeFfmpegBridge = function(){
    print("Initializing FfmpegBridgeInterface");
    const END_POINT_SETTINGS_NAME = "Ffmpeg Bridge Endpoint";
    const END_POINT_SETTINGS_HOSTNAME = "Ffmpeg Bridge Hostname Endpoint";
    var endpoint = this.__getEndPointFromTagType(END_POINT_SETTINGS_NAME);
    var hostEndpoint = this.__getEndPointFromTagType(END_POINT_SETTINGS_HOSTNAME);

    if(gmoNBCFunc.isVarUsable(endpoint)) {
        this.__endpoint = endpoint;
        print("Using FfmpegBridgeInterface with Endpoint ["+ this.__endpoint + "]");
    } else {
        print("Failed to Initialize FfmpegBridgeInterface with Endpoint");
        }

    if(gmoNBCFunc.isVarUsable(hostEndpoint)) {
        this.__hostEndpoint = hostEndpoint;
        print("Initialized FfmpegBridgeInterface with hostEndpoint ["+ this.__hostEndpoint + "]");
    } else {
        print("Failed to Initialize FfmpegBridgeInterface with this.__hostEndpoint");
        }
    }

    this.__getEndPointFromTagType = function(tagType){
        print("FfmpegBridgeInterface.__getEndPointsFromTagType");
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
                endpoint= tag.Value.toString();
                break;
            }
        }
        return endpoint;
    }

    this.postMessage = function(payload, method, dry_run){

        try {
            var url = new java.net.URL(this.__endpoint);
            var client = new SimpleRestClient();
            var resource = String(url.getPath()).replace(/\/$/, "") + "/" + method || "";
            client.setHttpHeader("Content-type", "application/json");
            client.setHttpHeader("Host", this.__hostEndpoint);
            client.setMimeType("application/json");
            client.setScheme(url.getProtocol());
            client.setHost(url.getHost());
            client.setPort(url.getPort());
            client.setPath(resource);
            print("Sending payload: " + this.__JRAPI.JSON.stringify(payload));
            print("Host IP: " + url.getProtocol() + "://" + url.getHost() + ":" + url.getPort() + resource);
            print("Host Name: [" + this.__hostEndpoint + "]");
            if (typeof dry_run !== undefined && dry_run == true ) {
                return false;
            }

            client.send("POST", this.__JRAPI.JSON.stringify(payload));
              var response = this.__JRAPI.JSON.parse(client.getLastBody())

            print("client.getLastBody(): " + client.getLastBody());
            var status = client.getLastStatus();
            if (status >= 200 && status <= 299 && response.state == "Failed") {
                print('Received Failed Status from FFMPEG API')
                throw new Error(response || "Received Failed Status from FFMPEG API");
            } else if (status >= 200 && status <= 299 && response.state != "Failed") {
                return client.getLastBody();
            } else {
                print("Other Failure: " + response);
                return false;
            }
        } catch(e) {
            print("REST call failed: " + gmoNBCFunc.printObj(e.message));
            // Will check for this
            return false;
        }
    }

}