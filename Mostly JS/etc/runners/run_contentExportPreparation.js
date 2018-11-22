/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-09 21:04:34
* @Last Modified by:   Ray Olsen
* @Last Modified time: 2018-04-11 17:21:00
*/

load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");

print("\nRunning run_contentExportPreparation.js");

ContentExportPreparationRunner = function(placingId){
	if ((this instanceof ContentExportPreparationRunner) === false) {
		throw new Error("Please call constructor with new() keyword");
	}
	this.__placingId = placingId;
}

ContentExportPreparationRunner.prototype.constructor = ContentExportPreparationRunner;

ContentExportPreparationRunner.prototype.log = function (functionName, message) {
	print("ContentExportPreparationRunner # " + functionName + " : " + message);
};

ContentExportPreparationRunner.prototype.setPlacingHelper = function(placingHelper) {
	var functionName = "setPlacingHelper";
	this.log(functionName, "Start");
	this.__placingHelper = placingHelper;
	this.log(functionName, "End");
}

ContentExportPreparationRunner.prototype.getSourceMedia = function(){
	var functionName = "getSourceMedia";
	this.log(functionName, "Start");
	var matId = this.__placingHelper.getMainMaterial();
	this.log(functionName, "Material Id is ["+ matId +"]");
	var sourceMedia = gmoNBCFunc.getOMMedia(matId);
	this.log(functionName, "Source Media Media is identified as ["+ sourceMedia +"]");
	this.log(functionName, "End");
	return sourceMedia;
}

ContentExportPreparationRunner.prototype.restoreMaterial = function(media){
	var functionName = "restoreMaterial";
	this.log(functionName, "Start");
	var matId = this.__placingHelper.getMainMaterial();
	this.log(functionName, "Material Id is ["+ matId +"]");
	print("Requesting Transfer From Archive and Polling Until Transfers done");
	var requestId = makeTransferRequest(matId, media, 1);
	this.log(functionName, "Restore Request Submitted ["+requestId+"]");
	//Polling Transfer
	try{
		pollTransferRequest(requestId, matId, media);
	}catch(e){
		this.log(functionName, "Restore Failed");
		throw new Error("Restore Failed."+e)
	}
	this.log(functionName, "Restore Completed");
}

try{
	var job = new gmoNBCFunc.WSJobUpdateObject();
	job.updateStatusAndProgress("Starting Script",5);

	var jobDescription = getJobParameter("jobDescription");
	var placingId = jobDescription..PlacingId.toString();
	job.updateStatusAndProgress("Gathering Placing Details",10);

	var preparationRunner = new ContentExportPreparationRunner(placingId);
	var placingHelper = new PlacingHelper(placingId);
	preparationRunner.setPlacingHelper(placingHelper);

	var sourceMedia = preparationRunner.getSourceMedia();

	if(!gmoNBCFunc.isVarUsable(sourceMedia)){
		job.updateStatusAndProgress("No Valid Media Found to source the file as input for Transcode",100);
		throw new Error("Unable to locate the Source file in any Media");
	}
	job.updateStatusAndProgress("Located Source File in ["+sourceMedia+"]",25);

	if(gmoNBCFunc.startsWith(sourceMedia,"DIVA")){
		job.updateStatusAndProgress("Restoring File from ["+sourceMedia+"]",35);
		sourceMedia = sourceMedia.replace("DIVA","T2");
		preparationRunner.restoreMaterial(sourceMedia);
		job.updateStatusAndProgress("Restore Completed",75);
	}else {
	    job.updateStatusAndProgress("Material needed for this placing is already in storage for use ",75);
	}

	job.updateStatusAndProgress("Success",100);

}catch(e){
	job.updateStatusAndProgress("Failed",100);
	job.updateStatusMap({"JOB__ERROR" : e.message})
	quit(1);
}
