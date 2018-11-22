
PipelineHelper = function(placingHelper, vodWorking) {
	if ((this instanceof PipelineHelper) === false) {
		throw new Error("Please call constructor with new() keyword");
	}
	
	print("\nPipelineHelper() initialising");
		
	var placingId = placingHelper.getPlacingName();		
	var currentPipelineState = placingHelper.getPlacingState();

	
	this.getSettings = function(){
		var settings = gmoNBCNLDFunc.getSettings(placingHelper.getSettings());
		return settings;	
	}

	this.getWorkingPath = function(){
		var workingPath = lookup.nld[vodWorking].mount + placingId + ".dir/";	
		if (debug) print(["Working Path [" , workingPath , "]"].join(""));	
		return workingPath;	
	}

	this.getPipelineStateFolder = function() {
		//var pipelineStateFolder = currentPipelineState.replace(" ", "_");
		var pipelineStateFolder = currentPipelineState.replace(/ /g, "_").replace("_-_","_");
		if (debug) print(["pipelin eState Folder [" , pipelineStateFolder , "]"].join(""));
		return pipelineStateFolder;	
	}
	
	this.getCurrentWorkingFolder = function(makeFolder){
		var currentWorkingFolder = this.getWorkingPath() + "/" + this.getPipelineStateFolder() + "/";
		if (debug) print(["pipelin eState Folder [" , currentWorkingFolder , "]"].join(""));
		if(makeFolder === true) gmoNBCFunc.makeDirectory(currentWorkingFolder);
		return currentWorkingFolder;
	}
		
	this.getPreviousPipelineState = function(){
		var previousPipelineState = gmoNBCNLDFunc.getPreviousPipelineState(placingId, currentPipelineState)
		if (debug) print(["Previous Pipeline State [", previousPipelineState, "]"].join(""));
		return previousPipelineState;	
	}
		
	this.getMainMaterialMatId = function(){
		var mainMaterialMatId =  placingXml..MainMaterial.Material.MatId.toString();
		return mainMaterialMatId;
	}

	this.getPreviousWorkingFolder = function(){
			
		var previousWorkingFolder;
		var mediaObj = placingHelper.getUsableMediasForMaterial(placingHelper.getMainMaterial());

		if(this.getPreviousPipelineState() === "Transfer"){
            previousWorkingFolder = mediaObj["Video"]["Mount"];
		}else{
			previousWorkingFolder = [this.getWorkingPath(), this.getPreviousPipelineState().replace(" ", "_"), "/"].join("");
		}

		if(debug) print(["Previous Working Folder", previousWorkingFolder].join(""));
			return previousWorkingFolder;
	}

	this.getPackagingFolder = function(){

		var vodPackaging = "NLD_PACKAGING_DIR";
		var placingXML = placingHelper.getPlacingXml();
		var licenseeName = placingXML..ContentDestinationName.toString();
		print("Original Licensee Name is ["+licenseeName+"]");
		if (licenseeName == null || licenseeName == "" || licenseeName == undefined || licenseeName == "undefined" || licenseeName.length == 0) {
			throw new Error("Cannot Decipher a licenseeName from value [" + placingXML..ContentDestinationName + "]");
		}
		licenseeName = licenseeName.replace(/[^A-Z0-9]+/ig, "_").replace(/^_+|_+$/g,'')
		print("Licensee Name After Stripping Special Characters is ["+licenseeName+"]");
		var workingPath = lookup.nld[vodPackaging].mount + licenseeName + "/" + placingId + ".dir/";
		return workingPath;
	}
	
	this.getPackageQcFolder = function() {
		output("PipelineHelper.getPackageQcFolder()");
		var vodPackaging = "NLD_PACKAGING_DIR_USER";
		var placingXML = placingHelper.getPlacingXml();
		var licenseeName = placingXML..ContentDestinationName.toString();
		if (licenseeName == null || licenseeName == "" || licenseeName == undefined || licenseeName == "undefined" || licenseeName.length == 0) {
			throw new Error("Cannot Decipher a licenseeName from value [" + placingXML..ContentDestinationName + "]");
		}
		licenseeName = licenseeName.replace(/[^A-Z0-9]+/ig, "_").replace(/^_+|_+$/g,'')
		var workingPath = lookup.nld[vodPackaging].mount + licenseeName + "/" + placingId + ".dir/";
		return workingPath;
	}

	this.getPackageQcLicenseeFolder = function() {
		output("PipelineHelper.getPackageQcLicenseeFolder()");
		var vodPackaging = "NLD_PACKAGING_DIR_USER";
		var placingXML = placingHelper.getPlacingXml();
		var licenseeName = placingXML..ContentDestinationName.toString();
		if (licenseeName == null || licenseeName == "" || licenseeName == undefined || licenseeName == "undefined" || licenseeName.length == 0) {
			throw new Error("Cannot Decipher a licenseeName from value [" + placingXML..ContentDestinationName + "]");
		}
		licenseeName = licenseeName.replace(/[^A-Z0-9]+/ig, "_").replace(/^_+|_+$/g,'')
		var workingPath = lookup.nld[vodPackaging].mount + licenseeName + "/";
		return workingPath;
	}	
		
	this.cleanup = function(){
		var currentWorkingFolder = this.getCurrentWorkingFolder();
		
		if (fileExists(currentWorkingFolder)){
			output("Working folder exists, cleaning up files/folder for this state [" + currentWorkingFolder + "].");
			if (!gmoNBCFunc.deleteDirectory(currentWorkingFolder, true)){
				print("Failed to remove files.");
			}
		}else {
			output("No working folder exists, nothing to cleanup.");
		} 
	}

	this.getPreviousWorkingFolderByClass = function (trackTypeClass, cacheHelper, cacheKey, cacheMediaName) {

                var videoClass = "video"
                var audioClass = "audio";
                var selfContained = "SELF CONTAINED";

                var mediaObj = placingHelper.getUsableMediasForMaterial(placingHelper.getMainMaterial());

                if (trackTypeClass.toLowerCase() !== "audio" && trackTypeClass.toLowerCase() !== "video") {
                        throw new Error("Track Type Class [" + trackTypeClass + "] is not currently supported");
                }

                if (this.getPreviousPipelineState() === "Transfer"){
                		return trackTypeClass.toLowerCase() == videoClass ? mediaObj["Video"]["Mount"] : mediaObj["Audio"]["Mount"];
                } else if (this.getPreviousPipelineState() === "Preprocessing") {
                    
                    // Since preprocessing will only handle audio at the moment we point to the cache for audio files and the staging media otherwise
                    if (trackTypeClass.toLowerCase() === "audio" && gmoNBCFunc.isVarUsable(cacheMediaName)) {
                        return cacheHelper.getCacheMediaPath(cacheKey, cacheMediaName);
                    } else {
                        return trackTypeClass.toLowerCase() == videoClass ? mediaObj["Video"]["Mount"] : [this.getWorkingPath(), this.getPreviousPipelineState().replace(" ", "_"), "/"].join("");
                    }

                } else {
                        // Currently Audio will always be in the Main Video at this point
                        return trackTypeClass.toLowerCase() == videoClass ? [this.getWorkingPath(), this.getPreviousPipelineState().replace(" ", "_"), "/"].join("") : selfContained ;

                }

        }
	
		
}		
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	