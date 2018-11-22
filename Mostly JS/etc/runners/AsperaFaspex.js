importPackage(Packages.org.apache.commons.httpclient);
importPackage(Packages.org.apache.commons.httpclient.methods);
importPackage(Packages.org.apache.http.impl.client);
importPackage(Packages.org.apache.http.auth);

load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js'); // This is included becasue we want the JSON parsing
load('/opt/evertz/mediator/etc/runners/nbcgmo_fun.js');

/**
 * Implementation of the Aspera Faspex REST API.
 */
var NBCAsperaFaspex =  function() {
	
	this._host = null;
	this._username = null;
	this._password = null;
	this._proxyHost = null;
	this._proxyPort = null;
	this._sourceShareName = null;
	this._title = null;
	this._note = null;
	this._recipients = [];
	this._paths = [];
	this._JRAPI = new JRAPI();
	
	java.lang.System.setProperty("jsse.enableSNIExtension", "false")
	
	this.getTransferURL = function(){
		return "https://"+this._host+"/aspera/faspex/send";
	};

	this.getSourceShareURL = function(){
		return "https://"+this._host+"/aspera/faspex/source_shares";
	};

	this.setHost = function(host){
		this._host = host;
	};
	
	this.setUsername = function(username){
		this._username = username;
	};

	this.setPassword = function(password){
		this._password = password;
	};
	
	this.setProxyHost = function(proxyHost){
		this._proxyHost = proxyHost;
	};
	
	this.setProxyPort = function(proxyPort){
		this._proxyPort = proxyPort;
	};
	
	this.setTitle = function(title){
		this._title = title;
	};
	
	this.setNote = function(note){
		this._note = note;
	};
	
	this.setRecipients = function(recipients){
		this._recipients = recipients;
	};
	

	this.setSourceShareName = function(sourceShareName){
		this._sourceShareName = sourceShareName;
	};
	
	this.setPaths = function(paths){
		this._paths = paths;
	};
	
	this.printParameters = function(){

		print("\nFaspex URL - "+this.getTransferURL());
		print("\nProxy - "+this._proxyHost+":"+this._proxyPort);
		print("\nFaspex Title - "+this._title);
		print("\nFaspex Note - "+this._note);
		print("\nFaspex Recipients - "+this._recipients);
		print("\nFaspex Source Share Name - "+this._sourceShareName);
		print("\nFaspex Sourec Paths - "+this._paths);
	}
	
	this.isVarUsable = function(v) {
		// Lazy check for undefined, null and emptystrings
		if (typeof v === "undefined" || v === null || v === "") {
			return false;
		} else {
			return true;
		}
	}

	this.getSourceShareID = function() {

		print("\n Finding Source Share ID For "+this._sourceShareName);
		var sourceShareID = "";
		var client = new Packages.org.apache.commons.httpclient.HttpClient();
		var get = new Packages.org.apache.commons.httpclient.methods.GetMethod(this.getSourceShareURL());
		var hostConfig = client.getHostConfiguration();

		client.getState().setCredentials(AuthScope.ANY,this._host,new Packages.org.apache.commons.httpclient.UsernamePasswordCredentials(this._username,this._password));
		
		if(this.isVarUsable(this._proxyHost)){
			hostConfig.setProxy(this._proxyHost,parseInt(this._proxyPort));
		}
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

		print("\n"+response);

		if(status==200) {

			if(response!="" && response.indexOf("error")>=0) {
				var obj = eval("("+response+")");
				var errorMessage = obj.error.user_message + "-" + obj.error.internal_message;
				throw new Error("Faspex Job Source Share Look Up Failed - " + errorMessage);
			}

			if(response!="" && response.indexOf("items")>=0) {
				var obj = eval("("+response+")");
				for each (var item in obj.items) {	
					if(this._sourceShareName.toUpperCase()==item.name.toUpperCase()){
						sourceShareID = item.id;
						break;
					}
				}
				
			}

		} else {
			
			if(response!="" && response.indexOf("error")>=0) {
				var obj = eval("("+response+")");
				var errorMessage = obj.error.user_message + "-" + obj.error.internal_message;
				throw new Error("Faspex Job Source Share Look Up Failed - " + errorMessage);
			}
			throw new Error("Faspex Job Source Share Look Up Failed - " + response);
		}

		return sourceShareID;
	}
	
	this.startTransfer = function() {

		this.printParameters();

		var client = new Packages.org.apache.commons.httpclient.HttpClient();
		var post = new Packages.org.apache.commons.httpclient.methods.PostMethod(this.getTransferURL());
		var hostConfig = client.getHostConfiguration();
	
		var payload = {
			"delivery" : {
				
				"title" : this._title,
				"note"  : this._note,
				"recipients" : this._recipients,
				"send_upload_result" : true,
				"use_encryption_at_rest" : false,
				"sources" : [
					{
						"id" : this.getSourceShareID(),
						"paths" : this._paths
					}
				]
			}
		}
		print(this._JRAPI.JSON.stringify(payload));

		if(this.isVarUsable(this._proxyHost)){
			hostConfig.setProxy(this._proxyHost,parseInt(this._proxyPort));
		}
		client.getState().setCredentials(AuthScope.ANY,this._host,new Packages.org.apache.commons.httpclient.UsernamePasswordCredentials(this._username,this._password));

		post.setRequestBody(this._JRAPI.JSON.stringify(payload));
		post.setRequestHeader(new Header("Content-Type","application/json"));
		post.setRequestHeader(new Header("Accept", "application/json"));
		
		var status = client.executeMethod(post);
		
		print("\n API status - "+status);
		
		var br = new java.io.BufferedReader(new java.io.InputStreamReader(post.getResponseBodyAsStream()));
		var response = "";
		var line = br.readLine();
		while(line != null){
			response = response + line;
			line = br.readLine();
		}
		
		br.close();
		post.releaseConnection();

		print("\n"+response);
		
		if(status==200) {

			if(response!="" && response.indexOf("error")>=0) {
				var obj = eval("("+response+")");
				var errorMessage = obj.error.user_message + "-" + obj.error.internal_message;
				throw new Error("Faspex Job Submission Failed - " + errorMessage);
			}

			if(response!="" && response.indexOf("links")>=0) {
				var obj = eval("("+response+")");
				return obj.links.status;
			}

		} else {
			
			if(response!="" && response.indexOf("error")>=0) {
				var obj = eval("("+response+")");
				var errorMessage = obj.error.user_message + "-" + obj.error.internal_message;
				throw new Error("Faspex Job Submission Failed - " + errorMessage);
			}
			
			throw new Error("Faspex Job Submission Failed - " + response);
		}

		return null;
	}

	this.getJobStatus = function(link){

		var job = {
			"status" : "",
			"progress" : "",
			"errorMessage" : ""
		}

		var client = new Packages.org.apache.commons.httpclient.HttpClient();
		var get = new Packages.org.apache.commons.httpclient.methods.GetMethod(link);
		var hostConfig = client.getHostConfiguration();

		client.getState().setCredentials(AuthScope.ANY,this._host,new Packages.org.apache.commons.httpclient.UsernamePasswordCredentials(this._username,this._password));
		if(this.isVarUsable(this._proxyHost)){
			hostConfig.setProxy(this._proxyHost,parseInt(this._proxyPort));
		}
		get.setRequestHeader(new Header("Content-Type","application/xml"));
		get.setRequestHeader(new Header("Accept", "application/xml"));

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


		if(status==200) {

			var responseXML = new XML(gmoNBCFunc.removeXmlHeader(response));
			print("\n"+responseXML);
			var status = responseXML..upload.status.toString();
			var progressPercent = responseXML..upload.percentage.toString();
			var errorMessage = responseXML..upload.error_description.toString();

			job["status"] = status;
			job["progress"] = progressPercent;
			job["errorMessage"] = errorMessage;

		} else {
			throw new Error("Faspex Get Job Status Failed - " + response);
		}

		return job;

	}
	
};
