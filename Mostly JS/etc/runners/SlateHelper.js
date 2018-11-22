/*
* @Author: Karthik Rengasamy
* @Date:   2017-01-21 23:50:57
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-03-19 20:32:35
*/

var SlateHelper = function(placingId){

	if(typeof(gmoNBCFunc)==="undefined"){
		print("Loading nbcgmo_fun")
		load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");	
	}

	if(typeof(gmoNBCNLDFunc)==="undefined"){
		print("Loading nbcgmo_nld_fun")
		load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");	
	}

	if(typeof(PlacingHelper)==="undefined"){
		print("Loading placingHelper")
		load("/opt/evertz/mediator/etc/runners/placingHelper.js");	
	}

	if (typeof (AmountOfTime) === "undefined") {
	   print("Loading microtime")
       load('/opt/evertz/mediator/lib/js/microtime.js');
    }

	this.__placing_id = placingId;
	this.__placing_helper = new PlacingHelper(this.__placing_id);
	this.__placingXml = this.__placing_helper.getPlacingXml();
	this.__settings = this.__placing_helper.getSettings();
	this.__material = gmoNBCFunc.materialGetFull(this.__placingXml..MainMaterial.Material.MatId.toString())..Material;


	this.getVersionType = function(){
		var versionType = this.__placingXml..ShortTextList.ShortText.(ShortTextType == "Order Version Type").Value.toString();
		return versionType;
	}

	this.isEmbeddedCaptioning = function (){
		var isEmbeddedCaption = this.__placingXml..ShortTextList.ShortText.(ShortTextType == "Embedded Captioning").Value.toString() == "true";
		if(isEmbeddedCaption){
			return "Embedded";
		} else{
			return "None";
		}
	}

	this.getCurrentDate = function(timeZone,format) {
		importPackage(Packages.java.text);
		var date = new java.util.Date();
		var formatter = new SimpleDateFormat(format);
		formatter.setTimeZone(java.util.TimeZone.getTimeZone(timeZone));
		var currentDate = formatter.format(date)
		return "Date: " + String(currentDate.toString());
	}

	this.getSeasonDetails = function(){

		var season = gmoNBCFunc.resolveAlias("Series_SMAT_Season_Sequence",this.__placing_id);
		if(gmoNBCFunc.isVarUsable(season)){
			season = "Season#: " + season;
		}
		return season;
	}

	this.getEpisodeDetails = function(){
		var episode = gmoNBCFunc.resolveAlias("Material_SMAT_Ep_Seq_as_Broadcast",this.__placing_id);
		if(gmoNBCFunc.isVarUsable(episode)){
			episode = "Episode#: " + episode;
		}
		return episode;
	}

	this.getAspectRatio = function(){
		var profileAspectRatio = gmoNBCFunc.resolveAlias("Placing_Profile_Aspect_Ratio", this.__placing_id);
		return gmoNBCFunc.lastSubstrBefore(gmoNBCFunc.lastSubstrAfter(profileAspectRatio, "("),")").replace(":", "");
	}

	this.formatDate = function(dateTimeString){

		if(gmoNBCFunc.isVarUsable(dateTimeString)){

			var dateString = dateTimeString.split('T')[0];
			var year = dateString.split('-')[0];
			var month = dateString.split('-')[1];
			var day = dateString.split('-')[2];

			return "Original Air Date: " + month + "/" + day +"/" + year;
		}
		return "";
	}
		
		
	this.getAirDateLogic = function(){

		var gtmAirDate = gmoNBCFunc.resolveAlias("Material_GTM_Original_Air_Date", this.__placing_id);
		var smatAirDate = gmoNBCFunc.resolveAlias("Material_SMAT_Original_Air_Date_NAUS", this.__placing_id);
		var gcoAirDate = gmoNBCFunc.resolveAlias("Material_GCO_Original_Air_Date", this.__placing_id);
		var compassAirDate = gmoNBCFunc.resolveAlias("Material_Compass_Original_Air_Date", this.__placing_id);

		if (gmoNBCFunc.isVarUsable(gcoAirDate)){
			return this.formatDate(gcoAirDate)
		} else if (gmoNBCFunc.isVarUsable(compassAirDate)){
			return this.formatDate(compassAirDate)
		} else if (gmoNBCFunc.isVarUsable(smatAirDate)){
			return this.formatDate(smatAirDate)
		} else if (gmoNBCFunc.isVarUsable(gtmAirDate)){
			return this.formatDate(gtmAirDate)
		} else {
			return ""
		}
	}

	this.getOutputFrameRate = function(){
		var outputFrameRate = this.__placingXml..PublicationDefinition.Presets.PresetList.Preset.TagList.Tag.(TagType == "NLD Output Frame Rate").Value.toString();
		// If Telecine and return to original, we will be setting the output frame rate to P23_976.
		var telecine = this.__material.ShortTextList.ShortText.(ShortTextType == "Telecine").Value.toString();
		if (outputFrameRate == "Return to Original Frame Rate" && telecine.toString() == "true"){
			return "P23_976";
		} else if (outputFrameRate == "Same as Source" || outputFrameRate == "Return to Original Frame Rate"){
			return this.__material.FrameRate.toString();
		} else {
			return outputFrameRate;
		}
	}

	this.getOriginalFrameRate = function(){

		var telecine = this.__material.ShortTextList.ShortText.(ShortTextType == "Telecine").Value.toString();
		if (telecine.toString() == "true"){
			return "P23_976";
		}else {
			return this.__material.FrameRate.toString();
		}

	}

	this.getFormat = function (){
		var standard = this.getStandard();
		if (gmoNBCFunc.isVarUsable(standard)){
			return standard.Format;
		}
		return "";
	}

	this.getResolution = function (){
		var standard = this.getStandard();
		if (gmoNBCFunc.isVarUsable(standard)){
			return standard.Resolution;
		}
		return "";
	}

	this.getStandard = function(){

		var standard = gmoNBCFunc.resolveAlias("Slate_Alias_Placing_Standard", this.__placing_id);
		if (gmoNBCFunc.isVarUsable(standard)){
			var lookup = NBCGMO.safeStandards[standard.toUpperCase()];
			if (gmoNBCFunc.isVarUsable(lookup)){
				return lookup;
			}
		}
		return "";
	}

	this.getTitle = function(){

		var type = this.__material.MaterialType.toString().toUpperCase();
		if(type == "EPISODIC"){
			var title = gmoNBCFunc.resolveAlias("Brand_SMAT_Series_Title_ENGUS",this.__placing_id);
			if (!gmoNBCFunc.isVarUsable(title)){
				title = this.__material..Brand.Title.toString();
			}
			return title;
		}else if (type == "FEATURE"){
			return this.__material.Title.toString();
		}
		return ""
	}

	this.appendLabellingIfValueExists = function (label,value){
		if (gmoNBCFunc.isVarUsable(value)){
			return label + value;
		}
		return "";
	}

	this.getTotalRunTime = function(){

		var parcelEventObject = this.__placing_helper.getParcelEventObj();

		var duration = "00:00:00:00"
		var parcelFrameRate = parcelEventObject[0].parcelFrameRate;

		duration = AmountOfTime.parseText(parcelFrameRate,duration);

		for each (var event in parcelEventObject[0].eventObjList){
			if(event.stream == "nld video" ){
				print(event.matId + " " +  event.duration + " " )
				duration = duration.add(AmountOfTime.parseText(event.frameRate,event.duration));
			}
		}
		print("duration @ [" + parcelFrameRate + "] is " + duration )
		var outputFrameRate = this.getOutputFrameRate();
		if(outputFrameRate!=parcelFrameRate){
			print("Converting From [" + parcelFrameRate+ "] to [" + outputFrameRate  + "]")
			duration = duration.convertTo(outputFrameRate)
		}
		duration = duration.toString()
		var HrsMinsSecs = duration.substr(0,duration.lastIndexOf(":"))
		return HrsMinsSecs;
	}

	this.getSourceFormat = function(){

		var medias = this.__material.Track.MediaName.toString();
		var format = "";
		if(medias.indexOf("HD")>-1){
			format = "HD";
		}else if (medias.indexOf("SD")>-1){
			format = "SD";
		}
		return format;
	}

	this.getAudioLayout = function() {
		var audioLayout = [];
		var matchedProfileType = this.__placingXml..ShortTextList.ShortText.(ShortTextType == "Matched Profile").Value.toString();
		var trackTypes = gmoNBCNLDFunc.getProfileTrackTypes(matchedProfileType);
		var i = 0;
		for each (trackType in trackTypes){
			if(trackType.ClassName.toString()=="Audio"){
				var fileTag = trackType.FileTag.toString();
				var language = fileTag.slice(fileTag.indexOf('_')+1);
				var chIndexFirst  = "CH " + (i+1) + ": ";
				var chIndexNext   = "CH " + (i+2) + ": ";
				i = i+2;
				if(trackType.Name.toString().indexOf('Stereo')>-1){
					audioLayout.push(chIndexFirst + "Stereo LT " + language)
					audioLayout.push(chIndexNext  + "Stereo RT " + language)
				}else if (trackType.Name.toString().indexOf('Surround Front')>-1){
					audioLayout.push(chIndexFirst + "5.1 Left " + language)
					audioLayout.push(chIndexNext  + "5.1 Right " + language)
				}else if (trackType.Name.toString().indexOf('Surround C/LFE')>-1){
					audioLayout.push(chIndexFirst + "5.1 Center " + language)
					audioLayout.push(chIndexNext  + "5.1 LFE " + language)
				}else if (trackType.Name.toString().indexOf('Surround Rear')>-1){
					audioLayout.push(chIndexFirst + "5.1 Left Surround " + language)
					audioLayout.push(chIndexNext  + "5.1 Right Surround " + language)
				}else if (trackType.Name.toString().indexOf('MOS')>-1){
					audioLayout.push(chIndexFirst + "MOS");
					audioLayout.push(chIndexNext  + "MOS");
				}else if (trackType.Name.toString().indexOf('Mono')>-1){
					audioLayout.push(chIndexFirst + "Mono " + language)
					audioLayout.push(chIndexNext  + "Mono " + language)
				}else if (trackType.Name.toString().indexOf('Description')>-1){
					audioLayout.push(chIndexFirst + "VDS " + language)
					audioLayout.push(chIndexNext  + "VDS " + language)
				}
			}
		}
		return audioLayout.join(';');
	}

	this.getCustomOptions = function(){

		var slateDataMapping = {
			"Date (EST)" 	: this.getCurrentDate('EST','MM/dd/yyyy'),
			"Date (PST)" 	: this.getCurrentDate('PST','MM/dd/yyyy'),
			"Date (CST)" 	: this.getCurrentDate('CST','MM/dd/yyyy'),
			"Date (GMT)" 	: this.getCurrentDate('GMT','MM/dd/yyyy'),
			"Date (MST)" 	: this.getCurrentDate('MST','MM/dd/yyyy'),
			"Season #"   	: this.getSeasonDetails(),
			"Episode #"   	: this.getEpisodeDetails(),
			"Aspect Ratio"	: this.getAspectRatio(),
			"TVD #"			: this.appendLabellingIfValueExists("Prod #: ",gmoNBCFunc.resolveAlias("Placing_TVD_Production",this.__placing_id)),
			"PO #"			: this.appendLabellingIfValueExists("PO#: ",gmoNBCFunc.resolveAlias("Placing_POAL",this.__placing_id)),
			"Licensee ID #" : this.appendLabellingIfValueExists("ID#: ",gmoNBCFunc.resolveAlias("Slate_Alias_Placing_Licensee_Number",this.__placing_id)),
			"Air Date"      : this.getAirDateLogic(),
			"GTM Air Date"	: this.formatDate(gmoNBCFunc.resolveAlias("Material_GTM_Original_Air_Date", this.__placing_id)),
			"SMAT Air Date"	: this.formatDate(gmoNBCFunc.resolveAlias("Material_SMAT_Original_Air_Date_NAUS", this.__placing_id)),
			"TL Air Date"	: this.formatDate(gmoNBCFunc.resolveAlias("Material_GCO_Original_Air_Date", this.__placing_id)),
			"Compass Air Date"	:  this.formatDate(gmoNBCFunc.resolveAlias("Material_Compass_Original_Air_Date", this.__placing_id)),
			"Frame Rate"    : this.appendLabellingIfValueExists("Frame Rate: ",NBCGMO.frameRateLookup[this.getOutputFrameRate()]),
			"Original Frame Rate"    : this.appendLabellingIfValueExists("Original Frame Rate: ",NBCGMO.frameRateLookup[this.getOriginalFrameRate()]),
			"Resolution"    : this.getResolution(),
			"Format"        : this.getFormat(),
			"Episode Title" : this.__material.Episode.Title.toString(),
			"Title" 		: this.getTitle(),
			"CC" 			: this.appendLabellingIfValueExists("CC: ",this.isEmbeddedCaptioning()),
			"Version Type"  : this.getVersionType(),
			"Audio Layout"  : this.getAudioLayout(),
			"TRT"			: this.getTotalRunTime()
		}

		return slateDataMapping;
	}

	this.getSlateTemplate = function(){

		var format = this.getSourceFormat();
		return this.__settings.slateTemplate + "_" + format;
	}

	this.getSlateInfo = function(){
		
		var slateInfo = {};
		var customValues = this.getCustomOptions();
		print(customValues.toSource());
		for (index = 1; index<=25; index++){
			var options = this.__settings["slateOption" + index];
			var optionName = "";
			var optionValue = "";
			for each (var option in options.Value){
				var value = "";
				option = option.toString();
				optionName = optionName!="" ? optionName + "," + option : option;
				if(gmoNBCFunc.isVarUsable(option) && option !="-None-"){
					var optionDescription = gmoNBCFunc.getTagByTagTypeAndValue("NLD Slate Option " + index, option);
					if(gmoNBCFunc.isVarUsable(optionDescription) && optionDescription.Description.toString().indexOf("Slate_Alias")>-1){
						value = gmoNBCFunc.resolveAlias(optionDescription.Description.toString(),this.__placing_id);
					}else if (gmoNBCFunc.isVarUsable(optionDescription) && optionDescription.Description.toString().toUpperCase().indexOf("STATIC")>-1){
						value = optionDescription.Value.toString();
					}else {
						value = customValues[option];
					}

					if(gmoNBCFunc.isVarUsable(value)){
						optionValue = optionValue !="" ? optionValue + "  " + value : value 
					}
				}
			}
			print("[" + index + "] Option [" + optionName + "]" + " Value [" + optionValue + "]");
			
			if(!gmoNBCFunc.isVarUsable(optionValue)){
				optionValue = "";
			}
			if(optionName == "Audio Layout"){
				//Forcing Audio Layout to be Last - It should have a Fixed Position
				slateInfo[26] = optionValue;
				slateInfo[index] = "";
			}else {
				slateInfo[index] = optionValue;
			}
		}
		return slateInfo;
	}


	this.populateTemplate = function(duration,slateLocation,frameRate,eventDuration){

		var slateData = this.getSlateInfo();


		var map = new XML();
		for (index = 1; index<=26; index++){
			map += <Key>{index}</Key>;
			map += <Value>{slateData[index]}</Value>;
		}
		var template = this.getSlateTemplate(); 

		var templatePayLoad = <PharosCs>
			<CommandList>
				<Command subsystem="outputTemplate" method="populate">
				  <ParameterList>
				    <Parameter name="outputTemplate" value={template}/>
				    <Parameter name="outputData">
				      <Value>
				        <Mapping>
					        <slate>
					        <Map>{map}</Map>
					        </slate>
					        <location>{slateLocation}</location>
					        <duration>{duration}</duration>
					        <frameRate>{frameRate}</frameRate>
					        <eventDuration>{eventDuration}</eventDuration>
				        </Mapping>
				      </Value>
				    </Parameter>
				  </ParameterList>
				</Command>
			</CommandList>
		</PharosCs>;

		return wscall(templatePayLoad)..PopulatedOutputTemplate.Output.toString();
	}

}