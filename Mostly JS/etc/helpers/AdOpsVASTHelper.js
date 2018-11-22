/*
* @Author: Karthik Rengasamy
* @Date:   
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2018-08-10 23:00:00
*/

function AdOpsVASTHelper () {

	if ((this instanceof AdOpsVASTHelper) === false) {
		throw new Error("Please call constructor with new() keyword");
	}

	if(typeof(wscall)==="undefined"){
		print("Loading ShellFun js ");
		load("/opt/evertz/mediator/lib/js/shellfun.js");
	}

	if(typeof(AdOpsCreativeHelper)==="undefined"){
		print("Loading JSCommons js ");
		load("/opt/evertz/mediator/etc/helpers/AdOpsCreativeHelper.js");
	}

	if(typeof(JSCommons)==="undefined"){
		print("Loading JSCommons js ");
		load("/opt/evertz/mediator/etc/helpers/JSCommons.js");
	}
	this.__qcResults = "";
}
AdOpsVASTHelper.prototype.constructor = AdOpsVASTHelper;

/**
 * setPlacingHelper Setter for Placing Helper
 */
AdOpsVASTHelper.prototype.setPlacingHelper = function (placingHelper){
	this.__placingHelper = placingHelper;
}

/**
 * setVastQCResults - Setter for VAST QC Results
 */
AdOpsVASTHelper.prototype.setVastQCResults = function(qcResults){
	this.__qcResults = qcResults;
};

/**
 * setBatonReport - Setter for BATON QC Report
 */
AdOpsVASTHelper.prototype.setBatonReport = function(batonReport){
	this.__batonReport = batonReport;
};

/**
 * getErrorCount - Get Task Error Count
 */
AdOpsVASTHelper.prototype.getErrorCount = function(){
	return parseInt(this.__qcResults.taskReport.error);
}

/**
 * getQCSummary - From VAST QC Results 
 */
AdOpsVASTHelper.prototype.getQCSummary = function(){
	return this.__qcResults.taskReport.summary;
}

/**
 * getCreatives - From VAST QC Results -> Creatives
 */
AdOpsVASTHelper.prototype.getCreatives = function(){
	return this.__qcResults.taskReport.creatives;
}

/**
 * __buildCreativeParcels - Create an Parcel and add Materials as Parcel Events and link the parcel 
 * to the placing ->VAST Work Order
 */
AdOpsVASTHelper.prototype.__buildCreativeParcels = function(creativeMaterials){
	output("__buildCreativeParcels - start")
	var guid = function(){
		function s4() {
		  return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	}
	var parcelId = guid();
	var matId = creativeMaterials[0];
	var mh  = new gmoNBCFunc.materialHelper(matId);
	var frameRate = mh.getMaterialFrameRate();
	var duration = NBCGMO_CONSTANTS.DEFAULT_DURATION;

	var placingParcel = 
		<PharosCs>
			<CommandList>
			<Command subsystem="placing" method="save">
			<ParameterList>
			<Parameter name="placing">
			<Value>
			<Placing>
			<PlacingId>{this.__placingHelper.placingId}</PlacingId>
			<PlacingParcelList>
				<PlacingParcel>
				<Parcel>
					<ClassName>Placing</ClassName>
					<ParcelName>{parcelId}</ParcelName>
					<ParcelType>Placing</ParcelType>
					<FrameRate>{frameRate}</FrameRate>
					<ParcelStatus>Unknown</ParcelStatus>
					<Duration rate={frameRate}>{duration}</Duration>
					<ParcelEventList></ParcelEventList>
					<Owners>
						<Owner>
							<Name>{NBCGMO_CONSTANTS.OWNERS.AD_OPS}</Name>
						</Owner>
					</Owners>
					<TemplateParameterList/>
				</Parcel>
			</PlacingParcel>
			</PlacingParcelList>
			</Placing>
			</Value>
			</Parameter>
		</ParameterList>
		</Command>
		</CommandList>
	</PharosCs>

	for each (creativeMatId in creativeMaterials){
		placingParcel..ParcelEventList.Event +=<Event>
				<TrimMaterialId>{creativeMatId}</TrimMaterialId>
				<Stream>nld video</Stream>
				<FrameRate>{frameRate}</FrameRate>
				<EventType>Video</EventType>
				<RelativeOutcode rate={frameRate}>{duration}</RelativeOutcode>
				<Outcode rate={frameRate}>{duration}</Outcode>
				<Duration rate={frameRate}>{duration}</Duration>
				<ParcelOffset>{duration}</ParcelOffset>
			</Event>
	}
	if(debug) output(placingParcel);
	wscall(placingParcel)
	output("__buildCreativeParcels - end")
}

/**
 * GetCreativeID - From VAST QC Results ->Creative
 */
AdOpsVASTHelper.prototype.processVASTQCResults = function(){
	output("getVASTQCResults - start");
	var creatives = this.getCreatives();
    print('after this.getCreatives ')
    var creativeMaterials= [];
	for each (creative in creatives){
        print('creative is: ' + creative + ']')
		if(creative.attemptId !="-1"){
			creative.batonReport = this.__batonReport;
			var adOpsCreativeHelper = new AdOpsCreativeHelper(creative);
			adOpsCreativeHelper.setPlacingHelper(this.__placingHelper);
			var creativeMaterialId = adOpsCreativeHelper.saveCreative();
			creativeMaterials.push(creativeMaterialId);
		}
	}
	//Build Parcel and Link the Materials
	this.__buildCreativeParcels(creativeMaterials)
	output("getVASTQCResults - end");
}