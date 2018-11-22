if (typeof gmoNBCFunc === "undefined") {
	print("Loading /opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
	load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
} else {
	print("Object [ gmoNBCFunc ] already loaded");
}

if (typeof gmoNBCNLDFunc === "undefined") {
	print("Loading /opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
	load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
} else {
	print("Object [ gmoNBCNLDFunc ] already loaded");
}

var DaisyIdInspector = function (daisyId) {
		
	// Check it's possible to examine the TVD Production # specified
	if (! (this instanceof DaisyIdInspector)) throw new Error("Please call with new() Keyword");
	if (!gmoNBCFunc.isVarUsable(daisyId)) throw new Error("Cannot Inspect specified Daisy Id with Values [" + daisyId + "]");
		
	// Fields
	this.shortTextType = "shorttext";
	this.daisyIdShortTextType = "Daisy ID";
	this.daisyId = daisyId;
	
	this.materialList = gmoNBCFunc.getMaterialsByShortText(this.daisyIdShortTextType,daisyId);
	
	// Remove UTS ids as they aren't valid for source selection
	for (var i =0; i < this.materialList.length; i++){
		if(gmoNBCFunc.startsWith(this.materialList[i],"UTS_")){
			print("Excluding [" + this.materialList[i] + "]");
			this.materialList.splice(i,1);
		}
	}
	print ("Material List "+this.materialList )
	// Ye Olde Public Methods

	this.getMaterialObject = function() {
		var matId = this.getMaterialId();
		var mgetXml = materialGet(matId, "shorttext", "tag", "tracks", "trackTypeLinks")..Material;
		var daisyid = mgetXml..ShortText.(ShortTextType.toString() === "Daisy ID").Value.toString();
		var rtnObj = {
			matid : matId,
			title : mgetXml.Title.toString(),
			versiontype : mgetXml.VersionType.toString(),
			aspectratio : mgetXml.AspectRatio.toString(),
			tvdproductionnumber : mgetXml..ShortText.(ShortTextType.toString() === "TVD Production #").Value.toString(),
			daisyid : daisyid,
			framerate : mgetXml.FrameRate.toString(),
			duration : mgetXml.Duration.toString(),
			territorytype : mgetXml..Tag.(TagType.toString() === "Territory Sub-Type").Value.toString(),
            trackDefinitionList : mgetXml..TrackDefinition,
            trackTypeLinkList : mgetXml..TrackTypeLink,
            transformation: mgetXml.Transformation.toString(),
            priority : 0
		}
		
		return rtnObj;
	}

	//Private methods
	this.getMaterialList = function() {
		return this.materialList;
	}
	
	this.getMaterialId = function(){
		if(this.materialList.length == 0){
			return ""
		}else{
			return this.materialList[0].toString();
		}
	}
}

print("Loaded [DaisyIdInspector.js]");
