/*
* @Author: karthikrengasamy
* @Date:   2017-09-04 23:26:09
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-12-20 12:18:29
*/

function MediatorBridgeTranscodeHelper() {
	if((this instanceof MediatorBridgeTranscodeHelper) === false)	throw new Error("Please call constructor with new() keyword")
	if(typeof(gmoNBCFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js")
	if(typeof(MediatorBridgeInterface)==="undefined")  load("/opt/evertz/mediator/etc/runners/MediatorBridgeInterface.js")
	if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")
	
	this.__mediatorBridgeInterface = new MediatorBridgeInterface();
	this.__mediatorBridgeInterface.initializeMediatorBridge();
}

MediatorBridgeTranscodeHelper.prototype.constructor = MediatorBridgeTranscodeHelper;

/**
 * [setTranscoderType]
 * @param {[string]} transcoderType
 */
MediatorBridgeTranscodeHelper.prototype.setTranscoderType = function(transcoderType){
	this.__transcoderType = transcoderType;
};

/**
 * [getTranscoderType]
 * @return {[string]}
 */
MediatorBridgeTranscodeHelper.prototype.getTranscoderType = function(){
	return this.__transcoderType;
};

/**
 * [getMediatorBridgeInterface Returns an instance of MediatorBridgeInterface]
 * @return {[MediatorBridgeInterface]}
 */
MediatorBridgeTranscodeHelper.prototype.getMediatorBridgeInterface = function(){
	return this.__mediatorBridgeInterface;
};

/**
 * [__getTranscoderRestProperties Returns the Rest Methods of Transcoder]
 * @return {[type]} [description]
 */
MediatorBridgeTranscodeHelper.prototype.__getTranscoderRestProperties = function(){
	 return NBCGMO_CONSTANTS.MEDIATOR_BRIDGE.REST_METHODS.TRANSCODE[this.getTranscoderType()];
}

/**
 * [submitTranscodeJob Submits a Trancode Job]
 * @param  {[string]} workFlowName   
 * @param  {[string]} sourceFileName 
 * @param  {[string]} variablesObj
 * @return {[object]} 
 */
MediatorBridgeTranscodeHelper.prototype.submitTranscodeJob = function(workFlowName,sourceFileName,variablesObj) {
	output("submitTranscodeJob - start");
	var response;
	var transcoderRestProperties = this.__getTranscoderRestProperties();
	if (gmoNBCFunc.isVarUsable(transcoderRestProperties)){
		var method = transcoderRestProperties.SUBMIT_JOB;
		output("Rest method to submitTranscodeJob is ["+method+"]");
		var vantageDomain = this.vantageDomain = this.getVantageDomain(workFlowName);
		try {
			var request = {
				vantageWorkflowName      :   workFlowName,
				Original                 :	 sourceFileName,
				variables                :   variablesObj,
				domain                   :   vantageDomain
			}
			response = this.getMediatorBridgeInterface().postMessage(request, method); 
		}catch(TranscodeJobSubmitException) {
			output("Transcode Job Submit Exception: Failed To Submit a Transcode Job to ["+this.getTranscoderType()+"] - " + TranscodeJobSubmitException.message); 
			throw new Error("Transcode Job Submit Exception: Failed To Submit a Transcode Job to ["+this.getTranscoderType()+"] - " + TranscodeJobSubmitException.message)
		}
	} else { 
		throw new Error("No Rest Properties Defined for the Transcoder Type ["+this.getTranscoderType()+"]")
	}
	output("submitTranscodeJob - end");
	return response;
}

/**
 * [getTranscodeJobStatus Gets the Status Of Transcode Job]
 * @param  {[string]} jobId 
 * @return {[object]}      
 */
MediatorBridgeTranscodeHelper.prototype.getTranscodeJobStatus = function(jobId){
	output("getTranscodeJobStatus - start");
	var response;
	var transcoderRestProperties = this.__getTranscoderRestProperties();
	if(gmoNBCFunc.isVarUsable(transcoderRestProperties)){
		var method = transcoderRestProperties.POLL_JOB_STATUS;
		output("Rest method to getTranscodeJobStatus is ["+method+"]");
		var vantageDomain = this.vantageDomain;
		try {
			var request = 	{ 	"jobId" 	: 	jobId,
								"domain"	:	vantageDomain
							};
		    response = this.getMediatorBridgeInterface().postMessage(request, method); 
		}catch(TranscodeJobGetStatusException) {
			output("Transcode Job Get Status Exception: Failed To Get Status of a Transcode Job ["+this.getTranscoderType()+"] - " + TranscodeJobGetStatusException.message); 
			throw new Error("Transcode Job Get Status Exception: Failed To Get Status of a Transcode Job ["+this.getTranscoderType()+"] - " + TranscodeJobGetStatusException.message)
		}
	}else{
		throw new Error("No Rest Properties Defined for the Transcoder Type ["+this.getTranscoderType()+"]")
	}
	output("getTranscodeJobStatus - end");
	return response;
}

/**
 * [getTranscodeJobErrorMessage Gets the Error Message for a Failed Transcode Job]
 * @param  {[string]} jobId 
 * @return {[object]} 
 */
MediatorBridgeTranscodeHelper.prototype.getTranscodeJobErrorMessage = function(jobId){
	output("getTranscodeJobErrorMessage - start");
	var response;
	var transcoderRestProperties = this.__getTranscoderRestProperties();
	if(gmoNBCFunc.isVarUsable(transcoderRestProperties)){
		var method = transcoderRestProperties.GET_ERROR_MESSAGE;
		output("Rest method to getTranscodeJobErrorMessage is ["+method+"]");
		var vantageDomain = this.vantageDomain;
		try {
			var request = { "jobId"    :   jobId, 
							"domain"   :   vantageDomain
						  };
			response = this.getMediatorBridgeInterface().postMessage(request, method); 
		}catch(TranscodeJobGetErrorException) {
			output("Transcode Job Get Error Exception:  Failed To Get Error of a Failed Transcode Job ["+this.getTranscoderType()+"] - " + TranscodeJobGetErrorException.message); 
			throw new Error("Transcode Job Get Error Exception:  Failed To Get Error of a Failed Transcode Job ["+this.getTranscoderType()+"] - " + TranscodeJobGetErrorException.message)
		}
	}else{
		throw new Error("No Rest Properties Defined for the Transcoder Type ["+this.getTranscoderType()+"]")
	}
	output("getTranscodeJobErrorMessage - end");
	return response;
}

/**
 * [getVantageDomain Gets the Vantage domain of a given workflow based on a tag and its description]
 * @param  {[string]} workflowName
 * @return {[string]} Vantage domain, either the tag description or a default constant
 */
MediatorBridgeTranscodeHelper.prototype.getVantageDomain = function(workflowName) {
	output("getVantageDomain - start");
	const VANTAGE_WORKFLOW_TAG = "VantageWorkflow";
	var transcoderRestProperties = this.__getTranscoderRestProperties();
	var defaultDomain = transcoderRestProperties.DOMAIN;
	try {
		var res = gmoNBCFunc.getTagByTagTypeAndValue(VANTAGE_WORKFLOW_TAG, workflowName)..Description.toString();
	} catch(e) {
		output("Tag lookup failed for Vantage workflow [" + workflowName + "] - " + e);
		return defaultDomain;
	}
	output("getVantageDomain - end");
	return gmoNBCFunc.isVarUsable(res) ? res : defaultDomain;
}
