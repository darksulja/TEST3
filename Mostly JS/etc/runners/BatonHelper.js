/*
* @Author: mikeayubi
* @Date:   2018-07-12 23:26:09
* @Last Modified by:   mikeayubi
* @Last Modified time: 2018-07-12 23:26:09
*/

// Packages For the HTTP calls

importPackage(Packages.java.util);
importPackage(Packages.java.io);
importPackage(Packages.org.apache.http);
importPackage(Packages.org.apache.http.auth);
importPackage(Packages.org.apache.http.util);
importPackage(Packages.org.apache.http.entity);
importPackage(Packages.org.apache.http.message);
importPackage(Packages.org.apache.http.client);
importPackage(Packages.org.apache.http.client.methods);
importPackage(Packages.org.apache.http.client.entity);
importPackage(Packages.org.apache.http.impl.client);
importPackage(Packages.org.apache.commons.codec.binary);

var debug = true;
function BatonHelper() {
	var lookup = {};
	if((this instanceof BatonHelper) === false)	throw new Error("Please call constructor with new() keyword")
	if(typeof(gmoNBCFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js")
	if(typeof(ServicesInterface)==="undefined")  load("/opt/evertz/mediator/etc/runners/MediatorBridgeInterface.js")
	if(typeof(JRAPI)==="undefined"){
		load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js');
	}
	if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")
	
	this.__batonEndPoint = "http://100.116.68.53:8081/baton/";

	this.__JRAPI = new JRAPI()
}

BatonHelper.prototype.constructor = BatonHelper;

BatonHelper.prototype.getServicesInterface = function(){
	return this.__servicesInterface;
};

BatonHelper.prototype.__getBatonRestProperties = function(){
	 return NBCGMO_CONSTANTS.BATON_SERVICE["REST_METHODS"];
}

BatonHelper.prototype.submitJob = function(testPlan,priority,mediaFilePath){
	output("submitJob - start");
	var responseObj = {};
	var methodRestProperties = this.__getBatonRestProperties();
	if(gmoNBCFunc.isVarUsable(methodRestProperties)){
		var method = methodRestProperties.SUBMIT_JOB;
		output("Rest method to submitJob is ["+method+"]");
		try {

			var nvps = new ArrayList();
			nvps.add(new BasicNameValuePair('testPlan', testPlan.toString()));
			nvps.add(new BasicNameValuePair('priority', priority.toString()));
            nvps.add(new BasicNameValuePair('mediaFilePath', mediaFilePath.toString()));
            print('arrayList for passing into payload is: [' + nvps + ']')
            var params = new UrlEncodedFormEntity(nvps,'UTF-8');
            print('params: ' + params);
			var httpPost = new HttpPost(this.__batonEndPoint + method);
			httpPost.setHeader("Content-Type","application/x-www-form-urlencoded");
            httpPost.setEntity(params);
            print('httpPost:' + httpPost);
			var httpClient = HttpClients.createDefault();
			var postResponse = httpClient.execute(httpPost);
			var response = postResponse.getEntity();
            response = EntityUtils.toString(response);
            print('response: ' + response)
			if(debug) output("Submit Job response is ["+response+"]");
			responseObj = eval("("+response+")");

			if(!gmoNBCFunc.isVarUsable(responseObj.taskId)) throw new Error(responseObj.type + " - " + responseObj.message)

		}catch(JobSubmitException) {
			output("Job Submit Exception: Failed To Submit a Job to ["+this.__batonEndPoint+"] - " + JobSubmitException.message); 
			throw new Error("Job Submit Exception: " + JobSubmitException.message);
		}
	}else{
		throw new Error("No Rest Properties Defined for the Services Type [BATON]")
	}
	output("submitJob - end");
	return responseObj;
}

BatonHelper.prototype.getJobStatus = function(taskId){
	output("getJobStatus - start ["+taskId+"]");
	var responseObj = {};
	var methodRestProperties = this.__getBatonRestProperties();
	if(gmoNBCFunc.isVarUsable(methodRestProperties)){
		var method = methodRestProperties.POLL_JOB_STATUS;
		output("Rest method to getJobStatus is ["+method+"]");
		try {
			var httpGet = new HttpGet(this.__batonEndPoint + method + "?taskId=" + taskId);
            print('httpGet in getJobStatus is:  ' + httpGet + ']' )
            httpGet.setHeader("Content-Type","application/json");
			httpGet.setHeader("Accept", "application/json");
			var httpClient = HttpClients.createDefault();
			var responseGet = httpClient.execute(httpGet);
			var responseEntityGet = responseGet.getEntity();
			var response = EntityUtils.toString(responseEntityGet);
			if(debug) output("Status Job response is ["+response+"]");
			responseObj = eval("("+response+")");

			if(!gmoNBCFunc.isVarUsable(responseObj.taskId)) throw new Error(responseObj.type + " - " + responseObj.message)

		}catch(JobGetStatusException) {
			output("getJobStatus: Failed To Get Status of taskId ["+taskId+"] - " + JobGetStatusException.message); 
			throw new Error("getJobStatus(): Failed To Get Status of taskId ["+taskId+"] - " + JobGetStatusException.message);
		}
	}else{
		throw new Error("No Rest Properties Defined for the Services Type [BATON]")
	}
	output("getJobStatus - end");
	return responseObj;
}

BatonHelper.prototype.getVASTQCResults = function(taskId){
	output("getVASTQCResults - start ["+taskId+"]");
	var responseObj = {};
	var methodRestProperties = this.__getBatonRestProperties();
	if(gmoNBCFunc.isVarUsable(methodRestProperties)){
		var method = methodRestProperties.GET_VAST_QC_RESULTS;
		output("Rest method to getJobStatus is ["+method+"]");
		try {
            var httpGet = new HttpGet(this.__batonEndPoint + method + "?taskId=" + taskId);
            print('httpGet in getVASTQCResults is:  ' + httpGet + ']' )
			httpGet.setHeader("Content-Type","application/json");
			httpGet.setHeader("Accept", "application/json");
			var httpClient = HttpClients.createDefault();
            var responseGet = httpClient.execute(httpGet);
            print('after  httpClient.execute ')
			var responseEntityGet = responseGet.getEntity();
            var response = EntityUtils.toString(responseEntityGet);
            print('after  response ')

			if(debug) output("Status Job response is ["+response+"]");
			responseObj = eval("("+response+")");

			if(!gmoNBCFunc.isVarUsable(responseObj.taskReport)) throw new Error(responseObj.type + " - " + responseObj.message)

		}catch(Exception) {
			output("getVASTQCResults() Exception: Failed To getVASTQCResults of taskId ["+taskId+"] - " + Exception.message); 
			throw new Error("getVASTQCResults Exception: Failed To getVASTQCResults of taskId ["+taskId+"] - " + Exception.message);
		}
	}else{
		throw new Error("No Rest Properties Defined for the Services Type [BATON]")
	}
	output("getVASTQCResults - end");
	return responseObj;
}

BatonHelper.prototype.getPDF = function(taskId,fileName){
	output("getPDF - start");
	var responseObj = {};
	var methodRestProperties = this.__getBatonRestProperties();
	if(gmoNBCFunc.isVarUsable(methodRestProperties)){
		var method = methodRestProperties.GET_PDF;
		output("Rest method to getJobStatus is ["+method+"]");
		try {
            var httpGet = new HttpGet(this.__batonEndPoint + method + "?taskId=" + taskId);
            print('httpGet in getPDF is:  ' + httpGet + ']' )
			httpGet.setHeader("Content-Type","application/json");
			httpGet.setHeader("Accept", "application/json");
			var httpClient = HttpClients.createDefault();
			var responseGet = httpClient.execute(httpGet);
			var responseEntityGet = responseGet.getEntity();
			var response = EntityUtils.toString(responseEntityGet);
			responseObj = eval("("+response+")");
			var file = File(fileName);
			var fileOutputStream = new FileOutputStream(file);
			var writer = new BufferedOutputStream(fileOutputStream);
			var writer = new BufferedOutputStream(new FileOutputStream(new java.io.File(fileName)));
			output("Saving PDF report for taskId: [" + taskId + "] to [" + fileName + "]");
			writer.write(new org.apache.commons.codec.binary.Base64().decode(new java.lang.String(responseObj.pdf).getBytes()));

			if(!gmoNBCFunc.isVarUsable(responseObj.pdf)) throw new Error(responseObj.type + " - " + responseObj.message)

		}catch(Exception) {
			output("getPDF() Exception: Failed To getPDF of taskId ["+taskId+"] - " + Exception.message); 
			throw new Error("getPDF Exception: Failed To getPDF of taskId ["+taskId+"] - " + Exception.message);
		}
	}else{
		throw new Error("No Rest Properties Defined for the Services Type [BATON]");
	}
	output("getPDF - end");
	return fileName;
}