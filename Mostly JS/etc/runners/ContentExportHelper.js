/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-09 21:06:51
* @Last Modified by:   Ray Olsen
* @Last Modified time: 2018-04-11 17:21:00
*/

function ContentExportHelper () {

	if ((this instanceof ContentExportHelper) === false) {
		throw new Error("Please call constructor with new() keyword");
	}

	if(typeof(wscall)==="undefined"){
		print("Loading ShellFun js ")
		load("/opt/evertz/mediator/lib/js/shellfun.js");
	}

	if(typeof(JSCommons)==="undefined"){
		print("Loading JSCommons js ")
		load("/opt/evertz/mediator/etc/helpers/JSCommons.js");
	}

	if(typeof(ProfileHelper)==="undefined"){
		print("Loading ProfileHelper js ")
		load("/opt/evertz/mediator/etc/ProfileHelper.js");
	}

}
ContentExportHelper.prototype.constructor = ContentExportHelper;


ContentExportHelper.prototype.log = function (functionName, message)  {
	print("ContentExportHelper # " + functionName + " : " + message);
};

/**
 * [isContentExportPublicationDefinition Checks If Pub Def is for Content Export WorkFlow]
 * @param  [String]  publicationDefinitionName [PublicationDefinition.Name]
 * @return [Boolean] true or false
 */
ContentExportHelper.prototype.isContentExportPublicationDefinition = function (publicationDefinitionName) {
	var functionName = "isContentExportPublicationDefinition";
	this.log(functionName, "publicationDefinitionName ["+publicationDefinitionName+"]");
	const REPORT_NAME = "ListContentExportPropertyForProfile";
	if(JSCommons.isVarUsable(publicationDefinitionName)){

		var reportRequest = <PharosCs>
			<CommandList>
				<Command subsystem="report" method="runReport">
					<ParameterList>
						<Parameter name="reportName" value="ListContentExportPropertyForProfile"/>
						<Parameter name="reportParameters">
							<Value>
								<CustomReportRuntimeParameters>
									<Parameters>
										<StringReportParameter>
											<Name>PUBLICATION_DEFINITION_NAME</Name>
											<Operator>is</Operator>
											<Values>
												<String>{publicationDefinitionName}</String>
											</Values>
										</StringReportParameter>
									</Parameters>
								</CustomReportRuntimeParameters>
							</Value>
						</Parameter>
					</ParameterList>
				</Command>
			</CommandList>
		</PharosCs>
		var reportResponse = wscall(reportRequest)..ResultList;
		if(reportResponse..Count.toString() != 0){
			return reportResponse..ReportRow[0].__TEXT.toString() == "true";
		}
	}
	return false;
};

ContentExportHelper.prototype.getSourceTrackTypes = function(matId,materialXml,media){
	var functionName = "getSourceTrackTypes";
	this.log(functionName, "Start");
	this.log(functionName, "matId ["+matId+"]");
	this.log(functionName, "media ["+media+"]");
	var trackTypeArray = [];
	if(typeof materialXml == "undefined"){
		materialXml = materialGet(matId,"tracks")..Material;
	}
	var trackTypes =  materialXml.Track.(MediaName.toString()==media && parseInt(DeleteMark) === 0 && Encoded.toString() === "true" ).TrackDefinition.TrackTypeName;
	for each (trackType in trackTypes){
		trackTypeArray.push(trackType.toString());
	}
	this.log(functionName, "TrackTypes ["+trackTypeArray+"]");
	this.log(functionName, "End");
	return trackTypeArray;
}

ContentExportHelper.prototype.getMatchedProfile = function(pubDefinition,matId,materialXml,omMedia){
	var functionName = "getMatchedProfile";
	var profile = {}
	this.log(functionName, "Start");
	this.log(functionName, "matId ["+matId+"]");
	this.log(functionName, "media ["+omMedia+"]");
	this.log(functionName, "pubDefinitionName ["+pubDefinition.Name.toString()+"]");

	if(typeof materialXml == "undefined"){
		materialXml = materialGet(matId,"tracks")..Material;
	}
	var materialType = materialXml.MaterialType.toString();
	this.log(functionName, "Finding Matched Profile for Type ["+materialType+"]");

	var profileList = pubDefinition.MaterialTypeProfileMap.LinkedHashMap.Entry.(Key.toString() === materialType).Value.List.String;
	this.log(functionName, "Profile List: "+ profileList);

	var sourceTrackTypes = this.getSourceTrackTypes(matId,materialXml,omMedia);
	if(JSCommons.isVarUsable(profileList)){
		var ph = new ProfileHelper();
		ph.initialize();
		for each (layout in profileList){
			this.log(functionName, "Found Profile ["+layout.toString()+"]. Checking isMatched ?");
			ph.setProfile(layout.toString())
			if(ph.isMatchedProfile(sourceTrackTypes)){
				profile["Name"] = layout.toString();
				profile["TrackTypes"] = ph.getTrackTypes();
				break;
			}
		}

	}else{
		throw new Error ("No Audio Layout defined in profile ["+this.__profile+"] for type ["+materialType+"]");
	}
	return profile;
}

ContentExportHelper.prototype.getContentExportAudioMapping = function(matId,materialXml,media,profile){
		var functionName = "getContentExportAudioMapping";
		this.log(functionName, "Start");
		var trackTypes = profile["TrackTypes"];
		var mappingObject = {}
		const OUTPUT_CHANNEL = "OUTPUT_CHANNEL"
		var i=1;
		mappingObject["Total Audio Channels"] = 0;
		mappingObject["Audio Mapping"] = {}

		if(typeof materialXml == "undefined"){
			materialXml = materialGet(matId,"tracks")..Material;
		}

		for each (var trackType in trackTypes){
			if(trackType!=="Video"){
				var trackDefinition = materialXml.Track.(MediaName.toString()==media && parseInt(DeleteMark) === 0 && Encoded.toString() === "true" ).TrackDefinition.(TrackTypeName.toString()==trackType.toString())[0];
				var channels = parseInt(trackDefinition.Channels.toString())
				var filePosition = parseInt(trackDefinition.FilePosition.toString())
				var nextPosition = i + channels;
				this.log(functionName, "\n" +
					"Channels [" + channels + "] \n" +
					"File Position [" + filePosition + "] \n" +
					"Next Position [" + nextPosition +"]"
				);

				while(i < nextPosition){
					this.log(functionName, OUTPUT_CHANNEL + " " + i + " -> " + filePosition)
					mappingObject["Audio Mapping"][OUTPUT_CHANNEL + "_" + zeroPad(i,2)] = filePosition
					i = i + 1;
					filePosition = filePosition + 1;
				}
			}
		}
		mappingObject["Total Audio Channels"] = i-1;
		this.log(functionName, "End");
		return mappingObject;
	}
