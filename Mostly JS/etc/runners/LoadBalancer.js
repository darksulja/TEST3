
importPackage(Packages.com.pharos.poxclient);
importPackage(Packages.javax.xml.stream);

LoadBalancer = function() {
    //To run this call the function LoadBalancer = new LoadBalancer()
 	//Set loadBalancer.setType();
 	//Set loadBalancer.setTagType();

 	//DVS
 	//lb = new LoadBalancer()
	//lb.setType("DVS")
	//lb.setTagType("DVS_FS_LB_GROUP")
	//lb.getEndPoint();

	//Aspera
	//lb = new LoadBalancer()
	//lb.setType("Aspera")
 	//lb.setTagType("ASPERA_P2P_LB_GROUP")
 	//lb.getEndPoint();

	//Faspex
	//lb = new LoadBalancer()
	//lb.setType("Faspex")
 	//lb.setTagType("ASPERA_FASPEX_LB_GROUP")
 	//lb.getEndPoint();


 	//Error
	//lb = new LoadBalancer()
	//lb.setType("Faspex")
 	//lb.setTagType("Aspera Faspex LB None")
 	//lb.getEndPoint();

	if(typeof(gmoNBCFunc)==="undefined"){
		load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
	}

	// if(typeof(wscall)==="undefined"){
	// 	load("/usr/local/pharos/bin/js/shellfun.js");
	// }
	//
	if(typeof(_)==="undefined"){
		load("/opt/evertz/mediator/etc/scripts/modules/js/underscore-min.js");
	}

	this.__type = "";
	this.__tagType = "";

	this.setType = function (type){
		 this.__type = type;
	}

	this.setTagType = function (tagType){
		 this.__tagType = tagType;
	}

	this.__getEndPointsFromTagType = function(tagType){
		print("LoadBalancer.__getEndPointsFromTagType");
		var endpoints = [];
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
				var obj = {}
				obj["host"] = tag.Value.toString();
				obj["description"] = tag.Description.toString()
				endpoints.push(obj);
			}
		}
		return endpoints;
	}

	this.getEndPoint = function (){
		print("LoadBalancer.getEndPoint");
		if (!gmoNBCFunc.isVarUsable(this.__type) || !gmoNBCFunc.isVarUsable( this.__tagType)){
			throw new Error("Missing Variables. Use the setters to set type & tagType")
		}

		if(this.__type == "Aspera"){
			return this.__getAsperaP2PEndpoint();
		} else if(this.__type == "DVS"){
			return this.__getDVSEndpoint();
		} else if(this.__type == "Faspex"){
			return this.__getFaspexEndpoint();
		} else{
			throw new Error("Type is not Recognized");
		}
	}

	this.__getDVSEndpoint = function (){
		print("LoadBalancer.__getDVSEndpoint");
		var filserverList = {}
		var endpoints = this.__getEndPointsFromTagType(this.__tagType);

		if(!gmoNBCFunc.isVarUsable(endpoints) ||  endpoints.length==0 ){
			throw new Error("No EndPoints Configured for [" + this.__type + "] and tag Type ["+ this.__tagType + "]");
		}

		var getRunningTransfers = function(host){
			try{
                command = [];
                command.push('/usr/bin/timeout');
        		command.push('10')
        		command.push('/usr/bin/ssh');
        		command.push('-i')
				command.push('/opt/evertz/mediator/etc/mediator_x_rsa');
				command.push('-oStrictHostKeyChecking=no');
				command.push('-oUserKnownHostsFile=/dev/null');
				command.push('evertz@' + host);
        		command.push("ps -aef | grep -E 'curl|cp /media' | wc -l");

                var rtn = run.apply(this, command);

                if(debug){
					print(rtn.output)
					print(rtn.output.split('\n'))
				}
				var count =  rtn.output.split('\n')[0];
				//-2 = Process returns the grep in the process list and connection . hence the -2
				if(count!="") count = parseInt(count) -2;
				else count = 0;
				print(host + " is transferring [" + count +"] Files");
				return count;
			}catch(e){
				print(host + " is not reachable [" + -1 +"] ");
				return -1;
			}
			return -1;
		}
		var index = 0;
		for each (endpoint in endpoints){
			var transfers = getRunningTransfers(endpoint["host"]);
			if(transfers>-1){
				filserverList[index] = {}
				filserverList[index]["host"] = endpoint["host"];
				filserverList[index]["val"] = transfers;
				index ++;
			}
		}
		print(filserverList.toSource())
		return _.min(filserverList, function(o){return o.val;}).host;
	}

	this.__getAsperaP2PEndpoint = function (){
		print("LoadBalancer.__getAsperaP2PEndpoint");
		var asperaEndPointList = {}
		var endpoints = this.__getEndPointsFromTagType(this.__tagType);

		if(!gmoNBCFunc.isVarUsable(endpoints) ||  endpoints.length==0 ){
			throw new Error("No EndPoints Configured for [" + this.__type + "] and tag Type ["+ this.__tagType + "]");
		}

		var index = 0;
		for each (endpoint in endpoints){
			var transfers = this.__getRunningAsperaTransfers(endpoint["host"]);
			if(transfers>-1){
				asperaEndPointList[index] = {}
				asperaEndPointList[index]["host"] = endpoint["host"];
				asperaEndPointList[index]["val"] = transfers
				index ++;
			}
		}
		print(asperaEndPointList.toSource())
		return _.min(asperaEndPointList, function(o){return o.val;}).host;
	}

	this.__getFaspexEndpoint = function (){
		print("LoadBalancer.__getFaspexEndpoint");
		var asperaEndPointList = {}
		var endpoints = this.__getEndPointsFromTagType(this.__tagType);

		if(!gmoNBCFunc.isVarUsable(endpoints) ||  endpoints.length==0 ){
			throw new Error("No EndPoints Configured for [" + this.__type + "] and tag Type ["+ this.__tagType + "]");
		}

		var index = 0;
		for each (endpoint in endpoints){
			var transfers = this.__getRunningAsperaTransfers(endpoint["host"]);
			if(transfers>-1){
				asperaEndPointList[index] = {}
				asperaEndPointList[index]["host"] = endpoint["host"];
				asperaEndPointList[index]["description"] = endpoint["description"];
				asperaEndPointList[index]["val"] = transfers;
				index ++;
			}
		}
		print(asperaEndPointList.toSource())
		return _.min(asperaEndPointList, function(o){return o.val;}).description;
	}

	this.__getRunningAsperaTransfers = function(host){
		try{

			var payload = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+
				"<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:typ=\"urn:Aspera:XML:FASPSessionNET:2009/11:Types\">"+
		   			"<soapenv:Header/>"+
		   			"<soapenv:Body>"+
			   			"<typ:GetSessionInfoRequest>"+
			   			 "<SessionFilter><SessionStatus>running</SessionStatus></SessionFilter>"+
			   			 "</typ:GetSessionInfoRequest>"+
					"</soapenv:Body>"+
				"</soapenv:Envelope>";

			var client = new SimpleRestClient();
			client.setMimeType("text/xml;charset=UTF-8");
			client.setScheme("http");
			client.setHost(host);
			client.setPort(40001);
			client.setHttpHeader("SOAPAction", "FASPSessionNET-200911#GetSessionInfo");
			client.setPath("/services/soap/Transfer-201210");
			client.setAuthenticationType("None");
			client.send("POST", payload);
			var status = client.getLastStatus();
			if(status >= 200 && status <= 299){
				var response = String(client.getLastBody());
				response = response.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, "").replace(/^\s+/,'');
				var responseXml = new XML(response);
				var count = parseInt(responseXml..ResultCount.toString());
				print(host + " is running [" + count +"] transfers");
				return count;
			}
		}catch(e){
			print(e.message);
			print(host + " is not reachable or Error in API [" + -1 +"] ");
			return -1;
		}
		return -1;
	}

}
