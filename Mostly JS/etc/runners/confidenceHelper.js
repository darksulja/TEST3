if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")
if(typeof(gmoNBCFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
if(typeof(gmoNBCNLDFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
if(typeof PlacingHelper === "undefined") load("/opt/evertz/mediator/etc/runners/placingHelper.js");
/**
 * 
 * Function to create Confidence Helper object
 * 
 * @usage new confidenceHelper(placingId)
 * example :
 * 
 * var CI = new confidenceHelper("TEST-EV-PL-120517");
 * var CIString = CI.buildRawString();
 * var CIHash = CI.calcHashcode(CIString);
 * var Placings = CI.countConfidenceHash(CIHash);
 * var setCount = CI.setConfidenceCountValue(Placings);
 * var setHash = CI.setConfidenceHash(CIHash);
 * var settext = CI.setConfidenceTextValue(CIString);
 * 
 *
/*
* @Author: Chris Filippone
* @Date:   2018-02-26 08:15:34
* @Last Modified by:   
* @Last Modified time: 
*/
//
//
confidenceHelper = function (placingId) {
	if((this instanceof confidenceHelper) === false)  throw new Error("Please call constructor with new() keyword");

    if(gmoNBCFunc.isVarUsable(placingId)){
		output("\nInstantiating confidence helper\n");
		this.placingId = placingId;
		this.__placingHelper = new PlacingHelper(placingId);
		var placingXml = this.__placingHelper.getPlacingXml();
		var mainMatId = this.__placingHelper.getMainMaterial();
		if (debug) output("\n Matid "+mainMatId+"\n");
		var MaterialHelper = new gmoNBCFunc.materialHelper(mainMatId);

    } else{  
        throw new Error ("Placing Id is required to create confidence helper object.");
    }
	// degugging info
	var debug = false ;
	CIString ="";
    //
	//  Builds concatenated string of key values 
	//
	this.buildRawString = function() {
		var CIvalues = [];
		CIvalues.push( MaterialHelper.getMaterialType() );
		if (debug) output("\n Mat type " + MaterialHelper.getMaterialType()+"\n");
		CIvalues.push( gmoNBCNLDFunc.getMatchedProfileName(placingXml, mainMatId).toString());
		if (debug) output("\n Mat profile "+gmoNBCNLDFunc.getMatchedProfileName(placingXml, mainMatId).toString()+"\n")
		CIvalues.push( this.__placingHelper.getSettings()["audioNormalization"]);
		if (debug) output(" Audio normalization " +this.__placingHelper.getSettings()["audioNormalization"]+"\n");
		// Header
		CIvalues.push( this.__placingHelper.getSettings()["includeHeader"]);
		if (debug) output(" Include header " +this.__placingHelper.getSettings()["includeHeader"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["includeCustomHeader"]);
		if (debug) output(" Include custom header " +this.__placingHelper.getSettings()["includeCustomHeader"]+"\n");
		// header Option 1-6 and duration
		CIvalues.push( this.__placingHelper.getSettings()["headerOption1"]);
		if (debug) output(" header Option 1 " +this.__placingHelper.getSettings()["headerOption1"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["headerOption1Duration"]);
		if (debug) output(" header Option 1 duration " +this.__placingHelper.getSettings()["headerOption1Duration"]+"\n");
		// 2
		CIvalues.push( this.__placingHelper.getSettings()["headerOption2"]);
		if (debug) output(" header Option 2 " +this.__placingHelper.getSettings()["headerOption2"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["headerOption2Duration"]);
		if (debug) output(" header Option 2 duration " +this.__placingHelper.getSettings()["headerOption2Duration"]+"\n");
		// 3
		CIvalues.push( this.__placingHelper.getSettings()["headerOption3"]);
		if (debug) output(" header Option 3 " +this.__placingHelper.getSettings()["headerOption3"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["headerOption3Duration"]);
		if (debug) output(" header Option 3 duration " +this.__placingHelper.getSettings()["headerOption3Duration"]+"\n");
		// 4
		CIvalues.push( this.__placingHelper.getSettings()["headerOption4"]);
		if (debug) output(" header Option 4 " +this.__placingHelper.getSettings()["headerOption4"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["headerOption4Duration"]);
		if (debug) output(" header Option 4 duration " +this.__placingHelper.getSettings()["headerOption4Duration"]+"\n");
		// 5
		CIvalues.push( this.__placingHelper.getSettings()["headerOption5"]);
		if (debug) output(" header Option 5 " +this.__placingHelper.getSettings()["headerOption5"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["headerOption5Duration"]);
		if (debug) output(" header Option 4 duration " +this.__placingHelper.getSettings()["headerOption5Duration"]+"\n");
		// 6
		CIvalues.push( this.__placingHelper.getSettings()["headerOption6"]);
		if (debug) output(" header Option 5 " +this.__placingHelper.getSettings()["headerOption6"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["headerOption6Duration"]);
		if (debug) output(" header Option 6 duration " +this.__placingHelper.getSettings()["headerOption6Duration"]+"\n");
		// slates
		CIvalues.push( this.__placingHelper.getSettings()["slateOption1"]);
		if (debug) output(" Slate Option 1 " +this.__placingHelper.getSettings()["slateOption1"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption2"]);
		if (debug) output(" Slate Option 2 " +this.__placingHelper.getSettings()["slateOption2"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption3"]);
		if (debug) output(" Slate Option 3 " +this.__placingHelper.getSettings()["slateOption3"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption4"]);
		if (debug) output(" Slate Option 4 " +this.__placingHelper.getSettings()["slateOption4"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption5"]);
		if (debug) output(" Slate Option 5 " +this.__placingHelper.getSettings()["slateOption5"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption6"]);
		if (debug) output(" Slate Option 6 " +this.__placingHelper.getSettings()["slateOption6"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption7"]);
		if (debug) output(" Slate Option 7 " +this.__placingHelper.getSettings()["slateOption7"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption8"]);
		if (debug) output(" Slate Option 8 " +this.__placingHelper.getSettings()["slateOption8"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption9"]);
		if (debug) output(" Slate Option 9 " +this.__placingHelper.getSettings()["slateOption9"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption10"]);
		if (debug) output(" Slate Option 10 " +this.__placingHelper.getSettings()["slateOption10"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption11"]);
		if (debug) output(" Slate Option 11 " +this.__placingHelper.getSettings()["slateOption11"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption12"]);
		if (debug) output(" Slate Option 12 " +this.__placingHelper.getSettings()["slateOption12"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption13"]);
		if (debug) output(" Slate Option 13 " +this.__placingHelper.getSettings()["slateOption13"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption14"]);
		if (debug) output(" Slate Option 14 " +this.__placingHelper.getSettings()["slateOption14"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption15"]);
		if (debug) output(" Slate Option 15 " +this.__placingHelper.getSettings()["slateOption15"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption16"]);
		if (debug) output(" Slate Option 16 " +this.__placingHelper.getSettings()["slateOption16"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption17"]);
		if (debug) output(" Slate Option 17 " +this.__placingHelper.getSettings()["slateOption17"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption18"]);
		if (debug) output(" Slate Option 18 " +this.__placingHelper.getSettings()["slateOption18"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption19"]);
		if (debug) output(" Slate Option 19 " +this.__placingHelper.getSettings()["slateOption19"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption20"]);
		if (debug) output(" Slate Option 20 " +this.__placingHelper.getSettings()["slateOption20"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption21"]);
		if (debug) output(" Slate Option 21 " +this.__placingHelper.getSettings()["slateOption21"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption22"]);
		if (debug) output(" Slate Option 22 " +this.__placingHelper.getSettings()["slateOption22"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption23"]);
		if (debug) output(" Slate Option 23 " +this.__placingHelper.getSettings()["slateOption23"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption24"]);
		if (debug) output(" Slate Option 24 " +this.__placingHelper.getSettings()["slateOption24"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["slateOption25"]);
		if (debug) output(" Slate Option 25 " +this.__placingHelper.getSettings()["slateOption25"]+"\n");
		// dub cards
		CIvalues.push( this.__placingHelper.getSettings()["includeDubCards"]);
		if (debug) output(" include dub cards " +this.__placingHelper.getSettings()["includeDubCards"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["dubCardInsertDuration"]);
		if (debug) output(" dub card insert duration " +this.__placingHelper.getSettings()["dubCardInsertDuration"]+"\n");
		// COnform
		CIvalues.push( this.__placingHelper.getSettings()["midrollBlack"]);
		if (debug) output(" Mid roll insert duration " +this.__placingHelper.getSettings()["midrollBlack"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["preTatendBlack"]);
		if (debug) output(" Pre Tatend Black duration " +this.__placingHelper.getSettings()["preTatendBlack"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["tailBlackDuration"]);
		if (debug) output(" Tail Black duration " +this.__placingHelper.getSettings()["tailBlackDuration"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["topBlackDuration"]);
		if (debug) output(" Top Black duration " +this.__placingHelper.getSettings()["topBlackDuration"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["outputConformFrameRate"]);
		if (debug) output(" Output Conform Frame rate  " +this.__placingHelper.getSettings()["outputConformFrameRate"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["conformVantageWorkflow"]);
		if (debug) output(" conform Vantage Workflow  " +this.__placingHelper.getSettings()["conformVantageWorkflow"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["fileStart"]);
		if (debug) output(" file Start  " +this.__placingHelper.getSettings()["fileStart"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["sourceTrim"]);
		if (debug) output(" source Trim  " +this.__placingHelper.getSettings()["sourceTrim"]+"\n");
		// post process 
		CIvalues.push( this.__placingHelper.getSettings()["outputFrameRate"]);
		if (debug) output(" output Frame Rate  " +this.__placingHelper.getSettings()["outputFrameRate"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["outputScanType"]);
		if (debug) output(" output Scan Type  " +this.__placingHelper.getSettings()["outputScanType"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["startOfContent"]);
		if (debug) output(" start Of Content  " +this.__placingHelper.getSettings()["startOfContent"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["captionMethod"]);
		if (debug) output(" caption Method  " +this.__placingHelper.getSettings()["captionMethod"]+"\n");
		// transcode related
		CIvalues.push( this.__placingHelper.getSettings()["transcodeLicensee"]);
		if (debug) output(" transcode Licensee  " +this.__placingHelper.getSettings()["transcodeLicensee"]+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["transcodeVantageWorkflow"]);
		if (debug) output(" transcode Vantage workflow  " +this.__placingHelper.getSettings()["transcodeVantageWorkflow"]+"\n");
		// PAckaging
		CIvalues.push( this.__placingHelper.getPlacingShortTextValue("NLD Video Output Filename"));
		if (debug) output(" Video Output Filename  " + this.__placingHelper.getPlacingShortTextValue("NLD Video Output Filename")+"\n");
		CIvalues.push( this.__placingHelper.getPlacingShortTextValue("NLD Caption Output Filename"));
		if (debug) output(" Caption Output Filename  " + this.__placingHelper.getPlacingShortTextValue("NLD Caption Output Filename")+"\n");
		CIvalues.push( this.__placingHelper.getPlacingShortTextValue("NLD Audio Output Filename"));
		if (debug) output(" Audio Output Filename  " + this.__placingHelper.getPlacingShortTextValue("NLD Audio Output Filename")+"\n");
		CIvalues.push( this.__placingHelper.getSettings()["packageName"]);
		if (debug) output(" package Name  " +this.__placingHelper.getSettings()["packageName"]+"\n");
		CIvalues.push( this.__placingHelper.getPlacingShortTextValue("NLD Package Format"));
		if (debug) output(" Package Format  " + this.__placingHelper.getPlacingShortTextValue("NLD Package Format")+"\n");
		// placing matched profile 
		var MatchedProfile = this.__placingHelper.getPlacingShortTextValue("Matched Profile");
		if (!gmoNBCFunc.isVarUsable(MatchedProfile) ) {
			// if no matched profile replace with  versionPreference
			MatchedProfile = this.__placingHelper.getSettings()["versionPreference"];
		}
		CIvalues.push( MatchedProfile);
		if (debug) output(" Matched Profile  "  + MatchedProfile+"\n");
		//
		for (var i = 0; i < CIvalues.length; i++) {
			if (gmoNBCFunc.isVarUsable(CIvalues[i]) ) {
				CIString = CIString + CIvalues[i];
			}
		}
		// string made 
		if (debug) output(" CI String  " + CIString + "\n");		
		return CIString;
	}
	//
	// MD5 hash calculate and return 
	//
	this.calcHashcode = function(CIString){
		var hash = com.google.common.hash.Hashing.md5().hashString(CIString, java.nio.charset.Charset.forName('US-ASCII')).toString();
		if (debug) output(" CI Hash  " + hash + "\n");
		return hash;
	}
	//
	// Count instances in Delivered state with same hash.
	//	
	this.countConfidenceHash = function(CIHash) {
		// Count existing hash in placings for delivered assets
		var results = 	gmoNBCNLDFunc.searchPlacingByDataElement("Confidence Interval Hash",CIHash,"Delivered")  ; 
		var Placings = results.PagedResults.Count.toString();
		//
		if (debug) output(" Confidence Interval Hash count "+ Placings +"\n");
		return Placings;
	}
	//
	// Save hash with Placing.
	//
	this.setConfidenceHash = function(CIHash) {
		// check if ShortText exists on placing Id
		// check hash
		var checkHash = this.__placingHelper.getPlacingShortTextValue("Confidence Interval Hash");
		if (!gmoNBCFunc.isVarUsable(checkHash) || checkHash != CIHash) {
			gmoNBCNLDFunc.savePlacingShortText(this.placingId,"Confidence Interval Hash",CIHash);
			if (debug) output(" Confidence Interval Hash added to Placing ID  \n");
			return true;
		}else{
			if (debug) output(" Confidence Interval Hash was already added to Placing ID and matches  \n");
			return false;
		}
	}
	//
	// Save Count of delivered placings with hash to Placing.
	//
	this.setConfidenceCountValue = function(Placings){
		var checkValue = this.__placingHelper.getPlacingShortTextValue("Confidence Interval Value");
		if (!gmoNBCFunc.isVarUsable(checkValue) || checkValue != Placings) {
			if (debug) output(" Confidence Interval Value added to Placing ID  \n");
			gmoNBCNLDFunc.savePlacingShortText(this.placingId,"Confidence Interval Value",Placings);
			return true;
		}else{
			return false;
		}
	}
	//
	// save long text generated to Long Text
	//
	this.setConfidenceTextValue = function(CIString,placingId){
		var checkText = placingXml.FullTextList.FullText.(FullTextType == "Confidence Interval Text").toString()
		if (!gmoNBCFunc.isVarUsable(checkText) || checkText != CIString) {
			if (debug) output(" Confidence Interval Text added to Placing ID  \n");
			gmoNBCNLDFunc.savePlacingFullText(placingId,"Confidence Interval Text",CIString);
			return true;
		} else {
			return false;
		}
	}
	//
	// End
	//
};