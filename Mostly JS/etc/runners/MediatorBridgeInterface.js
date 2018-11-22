/*
* @Author: karthikrengasamy
* @Date:   2017-03-07 21:57:36
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-04-16 16:04:55
*/

importPackage(Packages.com.pharos.poxclient);
importPackage(Packages.org.apache.commons.httpclient);
importPackage(Packages.org.apache.commons.httpclient.methods);
importPackage(Packages.org.apache.http.impl.client);
importPackage(Packages.org.apache.http.auth)

if(typeof(wscall)==="undefined"){
	load("/opt/evertz/mediator/lib/js/shellfun.js");	
}

if(typeof(JRAPI)==="undefined"){
	load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js');
}

if(typeof(gmoNBCFunc)==="undefined"){
	load('/opt/evertz/mediator/lib/js/nbcgmo_fun.js');
}

MediatorBridgeInterface = function() {

	this.__endpoint = "";

	this.__JRAPI = new JRAPI()

	this.getEndPoint = function(){
		return this.__endpoint;
	};

	this.initializeMediatorBridge = function(endPointTagName){

		var END_POINT_SETTINGS_NAME = gmoNBCFunc.isVarUsable(endPointTagName) ? endPointTagName : "Mediator Bridge Endpoint";

		print("Initializing MediatorBridgeInterface");
		var endpoint = this.__getEndPointFromTagType(END_POINT_SETTINGS_NAME);
		if(gmoNBCFunc.isVarUsable(endpoint)){
			this.__endpoint = endpoint;
			print("Initialized MediatorBridgeInterface with Endpoint ["+this.__endpoint+"]");
		}else {
			print("Failed to Initialize MediatorBridgeInterface");
		}
	}

	this.__getEndPointFromTagType = function(tagType){
		print("MediatorBridgeInterface.__getEndPointsFromTagType");
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

	this.postMessage = function(payload, method){

		try{
			var url = new java.net.URL(this.__endpoint);
			var client = new SimpleRestClient();
			var resource = String(url.getPath()).replace(/\/$/, "") + "/" + method || "";
			client.setMimeType("application/json");
			client.setScheme(url.getProtocol());
			client.setHost(url.getHost());
			client.setPort(url.getPort());
			client.setPath(resource);
			print("Sending payload: " + this.__JRAPI.JSON.stringify(payload)); 
			print("Host: " + url.getProtocol() + "://" + url.getHost() + ":" + url.getPort() + resource);
			client.send("POST", this.__JRAPI.JSON.stringify(payload));
			var status = client.getLastStatus();
			print("client.getLastStatus(): " + client.getLastStatus());
			print("client.getLastBody(): " + client.getLastBody());
			if (status >= 200 && status <= 299 && client.getLastBody() != "OK") {
				var response = this.__JRAPI.JSON.parse(client.getLastBody());
				return response; 
			} else if (status >= 200 && status <= 299 && client.getLastBody() == "OK") {
				return true;
			} else {
				return false;
			}
		}catch(e){
			print("REST call failed: " + e.message);
			throw new Error(e.message); 
		}
	}
	
	this.getMessage = function(vars, method){
		try{
			var url = new java.net.URL(this.__endpoint);
			var client = new Packages.org.apache.commons.httpclient.HttpClient();
			var resource = String(url.getProtocol() + "://" + url.getHost() + ":" + url.getPort() + url.getPath()).replace(/\/$/, "") + "/" + method +"?" || "";
			for(var propt in vars){
				if(typeof(vars[propt]) == "string"){
					resource += propt + "=" + vars[propt];
				}
			}
			var hostConfig = client.getHostConfiguration();
			var get = new Packages.org.apache.commons.httpclient.methods.GetMethod(resource);
			get.setRequestHeader(new Header("Content-Type","application/json"));
			get.setRequestHeader(new Header("Accept", "application/json"));

			var status = client.executeMethod(get);
			var br = new java.io.BufferedReader(new java.io.InputStreamReader(get.getResponseBodyAsStream()));
			var response = "";
			var line = br.readLine();
			while(line != null){
				response = response + line;
				line = br.readLine();
			}
			br.close();
			get.releaseConnection();

			response = eval("("+response+")");
			if (status >= 200 && status <= 299) {
				return response; 
			} else if (status >= 200 && status <= 299) {
				return true;
			} else {
				return false;
			}
		}catch(e){
			print("REST call failed: " + e.message);
			throw new Error(e.message); 
		}
	}

}
