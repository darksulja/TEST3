load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");

const SLEEP_DURATION = 30000;
try {
	print("Running Delivery Test script");

	 var getPreset = function(presetName){
		var preset;
		var getPresetCommand = <PharosCs>
				  <CommandList>
					<Command subsystem="preset" method="get">
					  <ParameterList>
						<Parameter name="presetName" value={presetName}/>
						<Parameter name="options">
						  <Value>
							<PresetOptions>
							   <Option>shorttext</Option>
							   <Option>tag</Option>
							   <Option>fulltext</Option>
							   <Option>markup</Option>
							</PresetOptions>
						  </Value>
						</Parameter>
					  </ParameterList>
					</Command>
				  </CommandList>
				</PharosCs>
			presetCommandResponse = wscall(getPresetCommand);
			if(presetCommandResponse..Command.@success.toString() == "true"){
				preset = presetCommandResponse..Output.Preset;
			}
		return preset;
	 }
     var outputs = []
	 var output = function(str){
		 print(str);
		 outputs.push(str);
	 }

	 var getDeliveryPreset = function(pubDefinitionName){
		var preset;
		var getPubDefCommand = <PharosCs>
				  <CommandList>
					<Command subsystem="placing" method="getPublicationDefinition">
					  <ParameterList>
						<Parameter name="publicationDefinition">
						  <Value>
							<PublicationDefinition>
							  <Name>{pubDefinitionName}</Name>
							</PublicationDefinition>
						  </Value>
						</Parameter>
					  </ParameterList>
					</Command>
				  </CommandList>
				</PharosCs>;

		pubDefCommandResponse = wscall(getPubDefCommand);
		if(pubDefCommandResponse..Command.@success.toString() == "true"){
			if(pubDefCommandResponse..PublicationDefinition.Presets.length()>=1){
				var deliveryPreset = pubDefCommandResponse..PublicationDefinition.Presets.Preset.(PresetType=="Delivery");
				var presetName = deliveryPreset.Name.toString();
				if(presetName!=""){
					print("Delivery Preset is ["+presetName+"]");
					preset = getPreset(presetName);
				}else {
					throw new Error("No Delivery Preset Configured for [" + pubDefinitionName + "]");
				}
			}else{
				throw new Error("No Presets Configured for [" + pubDefinitionName + "]");
			}
		}
		return preset;
	}

	var getDeliverySettings = function(preset){

		var presetShortTextList =preset.ShortTextList;
		var presetTagList = preset.TagList;

		// Delivery Related Settings (Common to all methods)
		var deliveryMethod = presetTagList.Tag.(TagType == "NLD Delivery Method").Value.toString(),
			bandwidthFloor = presetShortTextList.ShortText.(ShortTextType == "NLD Bandwidth Floor").Value.toString(),
			bandwidthCeiling = presetShortTextList.ShortText.(ShortTextType == "NLD Bandwidth Ceiling").Value.toString(),
			successEmailAddresses = presetTagList.Tag.(TagType == "NLD Success E-Mail Addresses").Value,
			sendSuccessEmail = presetShortTextList.ShortText.(ShortTextType == "NLD Send Success Email").Value.toString() == "true",
			failureEmailAddresses = presetTagList.Tag.(TagType == "NLD Failure E-Mail Addresses").Value,
			packagingFailureEmailAddresses = presetTagList.Tag.(TagType == "NLD Packaging Failure E-Mail Addresses").Value,
			sendFailureEmail = presetShortTextList.ShortText.(ShortTextType == "NLD Send Failure Email").Value.toString() == "true",

			// Aspera Settings;
			asperaProxy = presetShortTextList.ShortText.(ShortTextType == "NLD Aspera Proxy").Value.toString(),
			asperaSourceNode = presetShortTextList.ShortText.(ShortTextType == "NLD Aspera Source Node").Value.toString(),
			asperaTargetNode = presetShortTextList.ShortText.(ShortTextType == "NLD Aspera Target Node").Value.toString(),
			asperaTargetPath = presetShortTextList.ShortText.(ShortTextType == "NLD Aspera Target Path").Value.toString(),
			asperaBandwidthMax = presetShortTextList.ShortText.(ShortTextType == "NLD Bandwidth Max").Value.toString(),
			asperaBandwidthMin = presetShortTextList.ShortText.(ShortTextType == "NLD Bandwidth Min").Value.toString(),
			asperaSshPort = presetShortTextList.ShortText.(ShortTextType == "NLD SSH Port").Value.toString(),
			asperaUdpPort = presetShortTextList.ShortText.(ShortTextType == "NLD UDP Port").Value.toString(),
			asperaSourceUser = presetShortTextList.ShortText.(ShortTextType == "NLD Aspera Source User Name").Value.toString(),
			asperaTargetUser = presetShortTextList.ShortText.(ShortTextType == "NLD Aspera Target User Name").Value.toString(),


			// Signiant Settings;
			signiantTargetPath = presetShortTextList.ShortText.(ShortTextType == "NLD Signiant Target Path").Value.toString(),
			signiantTargetRelayAgent = presetShortTextList.ShortText.(ShortTextType == "NLD Signiant Target Relay Agent").Value.toString(),
			signiantJobGroup = presetTagList.Tag.(TagType == "NLD Signiant Job Group").Value.toString(),
			signiantJobTemplateLibraryName = presetTagList.Tag.(TagType == "NLD Signiant Job Template Library Name").Value.toString(),
			signiantJobTemplateName = presetTagList.Tag.(TagType == "NLD Signiant Job Template Name").Value.toString(),
			signiantSourceAgent = presetTagList.Tag.(TagType == "NLD Signiant Source Agent").Value.toString(),
			signiantTargetAgent = presetTagList.Tag.(TagType == "NLD Signiant Target Agent").Value.toString(),
			signiantManager = presetTagList.Tag.(TagType == "NLD Signiant Manager").Value.toString(),

			// Faspex Settings;
			faspexVantageWorkflow = presetTagList.Tag.(TagType == "NLD Faspex Vantage Workflow").Value.toString(),
			faspexTransferHost = presetTagList.Tag.(TagType == "NLD Faspex Transfer Host").Value.toString(),
			faspexWorkgroup = presetShortTextList.ShortText.(ShortTextType == "NLD Faspex Workgroup").Value.toString(),
			faspexNote = presetShortTextList.ShortText.(ShortTextType == "NLD Faspex Note").Value.toString(),
			faspexTitle = presetShortTextList.ShortText.(ShortTextType == "NLD Faspex Title").Value.toString(),
			faspexSourceShareName = presetTagList.Tag.(TagType == "NLD Faspex Source Share Name").Value.toString(),

			// FTP Settings;
			ftpHost = presetTagList.Tag.(TagType == "NLD FTP Host").Value.toString(),
			ftpPort = presetShortTextList.ShortText.(ShortTextType == "NLD FTP Port").Value.toString(),
			ftpTargetPath = presetShortTextList.ShortText.(ShortTextType == "NLD FTP Target Path").Value.toString(),
			ftpProxy = presetTagList.Tag.(TagType == "NLD FTP Proxy").Value.toString(),
			ftpProxyPort = presetShortTextList.ShortText.(ShortTextType == "NLD FTP Proxy Port").Value.toString(),
			ftpsEnabled = presetShortTextList.ShortText.(ShortTextType == "NLD FTPS Enabled").Value.toString() == "true",
			sFtpEnabled = presetShortTextList.ShortText.(ShortTextType == "NLD SFTP Enabled").Value.toString() == "true";

		var __settings = {
			// Delivery Preset Settings
			"deliveryMethod"					:	deliveryMethod,
			"bandwidthFloor"					:	bandwidthFloor,
			"bandwidthCeiling"					:	bandwidthCeiling,
			"successEmailAddresses"				:	successEmailAddresses,
			"sendSuccessEmail"					:	sendSuccessEmail,
			"failureEmailAddresses"				:	failureEmailAddresses,
			"sendFailureEmail"					:	sendFailureEmail,

			// Aspera Preset Settings
			"asperaProxy"						: 	asperaProxy,
			"asperaSourceNode"					: 	asperaSourceNode,
			"asperaTargetNode"					: 	asperaTargetNode,
			"asperaBandwidthMax"				:	asperaBandwidthMax,
			"asperaBandwidthMin"				:	asperaBandwidthMin,
			"asperaSshPort"						: 	asperaSshPort,
			"asperaUdpPort"						: 	asperaUdpPort,
			"asperaTargetPath"					:	asperaTargetPath,
			"asperaSourceUser"					:	asperaSourceUser,
			"asperaTargetUser"					:	asperaTargetUser,

			// Signiant Preset Settings
			"signiantTargetPath"				:	signiantTargetPath,
			"signiantTargetRelayAgent"			:	signiantTargetRelayAgent,
			"signiantJobGroup"					: 	signiantJobGroup,
			"signiantJobTemplateLibraryName"	:	signiantJobTemplateLibraryName,
			"signiantJobTemplateName"			: 	signiantJobTemplateName,
			"signiantSourceAgent"				:	signiantSourceAgent,
			"signiantTargetAgent"				:	signiantTargetAgent,
			"signiantManager"					:	signiantManager,

			// Faspex Preset Settings
			"faspexVantageWorkflow"				:	faspexVantageWorkflow,
			"faspexWorkgroup"					:	faspexWorkgroup,
			"faspexNote"						: 	faspexNote,
			"faspexTitle"						:	faspexTitle,
			"faspexTransferHost"				:   faspexTransferHost,
			"faspexSourceShareName"				:   faspexSourceShareName,

			// FTP Preset Settings
			"ftpHost"							:	ftpHost,
			"ftpPort"							:	ftpPort,
			"ftpTargetPath"						:	ftpTargetPath,
			"ftpProxy"							:	ftpProxy,
			"ftpProxyPort"						:	ftpProxyPort,
			"ftpsEnabled"						:	ftpsEnabled,
			"sFtpEnabled"						:	sFtpEnabled,
		}
		print("Delivery Settings: ");
		for (var prop in __settings){
			print(prop, ":", __settings[prop]);
		}

		return __settings;
	}

	var  generateHtmlTableRow = function(name,value){
		var tableRow = <tr align="left">
			<th style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;" >{name}</th>
			<td style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;">{value}</td>
		</tr>;
		return tableRow;
	};
	var toTitleCase = function (str){
		return str.replace(/\w+/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	}
	var generateDeliveryReport = function(publicationDefName, settings, exitCode, message,outputs,emailAddresses ){

		var emailSubject = "Delivery Test Report " + "["+ publicationDefName +"]";
		var space = " ";

		var logs = <span>Logs: <br></br></span>
		for each (var line in outputs){
			logs.appendChild(<p>{line}</p>);
			logs.appendChild(<p>{space}</p>);
		}

		var emailHtml = <html>
				<body style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans; font-size:15px;margin:0 auto ;border: 0;">
					<div style="margin: 20px auto;width: 980px;">
						<div style="vertical-align:middle;padding-top:5px;"><h3 style="text-align: center;"><strong>{emailSubject}</strong></h3></div>
						<p style="text-align: center;"></p>
						<br></br>
					</div>
					<div><span>{logs}</span></div>
				</body>
			</html>;

		var emailTable = <table style="width:100%;line-height: 1.5;height: 15%;">
			</table>;

		for (var prop in settings){
			if(settings[prop]!="")
				emailTable.appendChild(generateHtmlTableRow(toTitleCase(prop), settings[prop]));
		}
		emailTable.appendChild(generateHtmlTableRow("Message", message));
		emailHtml..div[0].appendChild(emailTable);

		var emailTo = emailAddresses;
		var result = gmoNBCFunc.sendCustomEmail(emailTo, emailSubject, emailHtml);
		print("Email Job Created Succesfully, Job Id [" + result..Output.Integer.toString() + "]");
	}

	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);

	var jobDesc = getJobParameter("jobDescription")..Output.JobDescription;
	print("Getting Info from job description");

	jobDashboard.updateStatusAndProgress("Extracting data from Job Description",7);

	var emailAddresses = jobDesc.Properties.Mapping.addresses.toString();
	var publicationDefinition = jobDesc.Properties.Mapping.profile.toString();
	var file = jobDesc.Properties.Mapping.file.toString();

	print(
		"Email Addresses [" + emailAddresses + "] \n" +
		"Publication definition is  [" + publicationDefinition + "] \n" +
		"Test File is  [" + file + "]"
	);

	var sourceFiles = [];
	sourceFiles.push(new gmoNBCFunc.usefulFileObj(String(file)));

	//Signiant Module has Reference to placingId  to create job name - Generating a dummy id
	var placingId = "TEST_JOB_" + gmoNBCFunc.guidGenerator().substring(0,9) ;
	print("placingId - dummy is ["+placingId+"]");

	//Faspex Module has Reference to placingXML to pull work order title to set faspex notes - setting a dummy placing xml

	var placingXml = <Placing>
			<ShortTextList>
				<ShortText>
					<ShortTextType>Work Order Title</ShortTextType>
					<Value>Delivery Testing by NBCUniversal</Value>
				</ShortText>
			</ShortTextList>
		</Placing>;

	jobDashboard.updateStatusMap({"Script_PubDefinition":publicationDefinition});
	jobDashboard.updateStatusMap({"Script_Email":emailAddresses});
	jobDashboard.updateStatusMap({"Script_FileName":file});

	jobDashboard.updateStatusAndProgress("Getting PubDef & Delivery Preset",10);

	var deliveryPreset = getDeliveryPreset(publicationDefinition);
	jobDashboard.updateStatusMap({"Script_PresetName":deliveryPreset.Name.toString()});

	jobDashboard.updateStatusAndProgress("Getting Delivery Settings from Preset",15);
	var settings  = getDeliverySettings(deliveryPreset);

	var deliveryMethod = settings.deliveryMethod;
	jobDashboard.updateStatusMap({"Script_DeliveryMethod":deliveryMethod});

	print ("------------- Loading Module for [" + deliveryMethod +"] -------------");

	jobDashboard.updateStatusAndProgress("Loading Transfer Module for: " +  deliveryMethod,20);

	load("/opt/evertz/mediator/etc/runners/" + deliveryMethod + "Module.js");

	// Now that the module is complete, lets check the result :)
	if (typeof transferResult != 'undefined') {

		var transferResultExitCode = transferResult[0];
		var transferResultMessage = transferResult[1];
		print("Transfer Result Message: " + transferResultMessage);

		if (transferResultExitCode == 0) {
			print("Transfer was a success using [" + deliveryMethod + "]");
		}

		if (transferResultExitCode != 0){
			throw new Error(transferResultMessage);
		}
	} else {
		throw new Error("No transfer result found from module, failing delivery.");
	}
    generateDeliveryReport(publicationDefinition, settings, 0, "Transfer Success", outputs,emailAddresses );
	jobDashboard.updateStatusAndProgress("Job Completed Successfully",100);

} catch(e) {
	print("An error has occurred: " + e.message);
	print("test"+outputs.join(" "));
	jobDashboard.updateStatusAndProgress(e.message,100);
	generateDeliveryReport(publicationDefinition, settings , 1 , e.message, outputs, emailAddresses);
}
