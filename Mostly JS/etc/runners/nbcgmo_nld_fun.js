//this is a file to store functions used by vantage
if(typeof(ProfileHelper) === "undefined"){
    print("Loading ProfileHelper")
    load("/opt/evertz/mediator/etc/runners/ProfileHelper.js");
}


var gmoNBCNLDFunc = {
	/**
	 * Transitions the placing from a specified state with a specified requirement
	 * @param [placingId] [The Placing Id to be transitioned]
	 * @param [fromState] [The state to transition from]
	 * @param [requirement] [The requirement to use]
	 */

	transitionPlacing : function(placingId, fromState, requirement) {
		if (arguments.length !== 3) {
			throw new Error("Not provided enough arguments for transitioning material");
		}

		var placingXml = placingGet(placingId);
		var placingCurrentState = placingXml..StateName.toString();

		if (placingXml..StateName != fromState){
			throw new Error("From State [" + fromState + " Does not match the current placings state of [" + placingCurrentState + "]");
		} else {
			output("Transitioning Placing [" + placingId + "] using Requirement [" + requirement + "]");
			placingWorkflowTransition(placingId, requirement);
		}
	},

	getAllPubDefs	: function(){
		var xml =
			<PharosCs>
				<CommandList>
					<Command subsystem="placing" method="getAllPublicationDefinitionList"/>
				</CommandList>
			</PharosCs>;

		return(wscall(xml)..Output);
	},

	getSettings : function(placingXml){


		if (typeof(placingXml) === "Undefined") throw new Error("Provide placing Xml to build settings object from your Presets.");

		// Shortcuts for E4X Expression of TagList and ShorttextList
		var placingShortTextList = placingXml..PublicationDefinition.Presets.PresetList.Preset.ShortTextList;
		var placingTagList = placingXml..PublicationDefinition.Presets.PresetList.Preset.TagList;
		var zeroStringTimeCode = "00:00:00:00";

		// Transcode Related Settings
		var transcodeVantageWorkflow = placingTagList.Tag.(TagType == "NLD Transcode Vantage Workflow").Value.toString(),
			transcodedExtension = placingShortTextList.ShortText.(ShortTextType == "NLD Transcoded Extension").Value.toString(),
			transcodeLicensee = placingShortTextList.ShortText.(ShortTextType == "NLD Licensee").Value,
			transcodeLicenseeRND = placingXml..PublicationDefinition.Presets.PresetList.Preset.(PresetType == "Restore and Deliver").ShortTextList.ShortText.(ShortTextType == "NLD Licensee").Value,

			// Pre Processing related settings
			audioNormalization = placingTagList.Tag.(TagType == "NLD Audio Normalization").Value.toString(),

			// Package Related settings
			//packageFormat =  placingShortTextList.ShortText.(ShortTextType == "NLD Package Format").Value.toString(),
			packageFormat =  placingTagList.Tag.(TagType == "NLD Output Package Format").Value.toString(),
            packageName =  placingTagList.Tag.(TagType == "NLD Output Package Name").Value.toString(),

			// Post Processing Related settings
			outputFrameRate =  placingTagList.Tag.(TagType == "NLD Output Frame Rate").Value.toString(),
			outputScanType =  placingTagList.Tag.(TagType == "NLD Output Scan Type").Value.toString(),
			captionMethod = placingTagList.Tag.(TagType == "NLD CC Subtitling Decision").Value.toString(),
			embeddedCaption1 = placingTagList.Tag.(TagType == "NLD Embedded Caption 1").Value.toString(),
			embeddedCaption2 = placingTagList.Tag.(TagType == "NLD Embedded Caption 2").Value.toString(),
			sidecarCaption1 = placingTagList.Tag.(TagType == "NLD Sidecar Caption 1").Value.toString(),
			sidecarCaption2 = placingTagList.Tag.(TagType == "NLD Sidecar Caption 2").Value.toString(),
			startOfContent = placingTagList.Tag.(TagType == "NLD Start of Content").Value.toString(),
			isVCHIPRequired =  placingShortTextList.ShortText.(ShortTextType == "NLD VCHIP Required").Value.toString() == "true",

			// Conform Related Settings
			sourceTrim = placingTagList.Tag.(TagType == "NLD Source Trim").Value.toString(),
			outputConformFrameRate = placingTagList.Tag.(TagType == "NLD Conform Output Frame Rate").Value.toString(),
			conformVantageWorkflow = placingTagList.Tag.(TagType == "NLD Conform Vantage Workflow").Value.toString(),
			topBlackDuration = placingShortTextList.ShortText.(ShortTextType == "NLD Top Black Duration").Value.toString(),
			preTatendBlackDuration = placingShortTextList.ShortText.(ShortTextType == "NLD Pre-Tatend Black Duration").Value.toString(),
			tailBlackDuration = placingShortTextList.ShortText.(ShortTextType == "NLD Tail Black Duration").Value.toString(),
			fileStart = placingTagList.Tag.(TagType == "NLD File Start").Value.toString(),
			includeHeader = placingShortTextList.ShortText.(ShortTextType == "NLD Include Header").Value.toString() == "true",
			preTatendBlack = placingShortTextList.ShortText.(ShortTextType == "NLD Pre-Tatend Black Duration").Value.toString(),
			midrollBlack = placingShortTextList.ShortText.(ShortTextType == "NLD Midroll Insertion Duration").Value.toString(),
			textlessFilterSettings = placingShortTextList.ShortText.(ShortTextType == "NLD Partially Texted Type").Value.toString(),

			versionPreference = placingTagList.Tag.(TagType == "NLD Texted/Textless").Value.toString(),
			territorySubType = placingTagList.Tag.(TagType == "NLD Territory Master Type").Value.toString(),
			includeDubCards = placingShortTextList.ShortText.(ShortTextType == "NLD Include Dub Cards").Value.toString() == "true",
			dubCardInsertDuration = placingShortTextList.ShortText.(ShortTextType == "NLD Dub Card Insertion Duration").Value.toString(),
			fadeIn = placingShortTextList.ShortText.(ShortTextType == "NLD Fade In").Value.toString(),
			fadeOut = placingShortTextList.ShortText.(ShortTextType == "NLD Fade Out").Value.toString(),
			enableFadeInOut = placingShortTextList.ShortText.(ShortTextType == "NLD Enable Fade In Out").Value.toString() == "true",

			//Custom Header Settings
			includeCustomHeader = placingShortTextList.ShortText.(ShortTextType == "NLD Include Custom Header").Value.toString() == "true",
			ebuBarsPALConversion = placingShortTextList.ShortText.(ShortTextType == "NLD EBU Bars PAL Conversion").Value.toString() == "true",
			headerOption1 = placingTagList.Tag.(TagType == "NLD Custom Header Option 1").Value.toString(),
			headerOption2 = placingTagList.Tag.(TagType == "NLD Custom Header Option 2").Value.toString(),
			headerOption3 = placingTagList.Tag.(TagType == "NLD Custom Header Option 3").Value.toString(),
			headerOption4 = placingTagList.Tag.(TagType == "NLD Custom Header Option 4").Value.toString(),
			headerOption5 = placingTagList.Tag.(TagType == "NLD Custom Header Option 5").Value.toString(),
			headerOption6 = placingTagList.Tag.(TagType == "NLD Custom Header Option 6").Value.toString(),

			headerOption1Duration = placingShortTextList.ShortText.(ShortTextType == "NLD Header Option 1 Duration").Value.toString(),
			headerOption2Duration = placingShortTextList.ShortText.(ShortTextType == "NLD Header Option 2 Duration").Value.toString(),
			headerOption3Duration = placingShortTextList.ShortText.(ShortTextType == "NLD Header Option 3 Duration").Value.toString(),
			headerOption4Duration = placingShortTextList.ShortText.(ShortTextType == "NLD Header Option 4 Duration").Value.toString(),
			headerOption5Duration = placingShortTextList.ShortText.(ShortTextType == "NLD Header Option 5 Duration").Value.toString(),
			headerOption6Duration = placingShortTextList.ShortText.(ShortTextType == "NLD Header Option 6 Duration").Value.toString(),

			slateBackgroundStyle = placingTagList.Tag.(TagType == "NLD Slate Style/Background").Value.toString(),
			slateTemplate = placingTagList.Tag.(TagType == "NLD Slate Template").Value.toString(),

			slateOption1 = placingTagList.Tag.(TagType == "NLD Slate Option 1"),
			slateOption2 = placingTagList.Tag.(TagType == "NLD Slate Option 2"),
			slateOption3 = placingTagList.Tag.(TagType == "NLD Slate Option 3"),
			slateOption4 = placingTagList.Tag.(TagType == "NLD Slate Option 4"),
			slateOption5 = placingTagList.Tag.(TagType == "NLD Slate Option 5"),
			slateOption6 = placingTagList.Tag.(TagType == "NLD Slate Option 6"),
			slateOption7 = placingTagList.Tag.(TagType == "NLD Slate Option 7"),
			slateOption8 = placingTagList.Tag.(TagType == "NLD Slate Option 8"),
			slateOption9 = placingTagList.Tag.(TagType == "NLD Slate Option 9"),
			slateOption10 = placingTagList.Tag.(TagType == "NLD Slate Option 10"),
			slateOption11 = placingTagList.Tag.(TagType == "NLD Slate Option 11"),
			slateOption12 = placingTagList.Tag.(TagType == "NLD Slate Option 12"),
			slateOption13 = placingTagList.Tag.(TagType == "NLD Slate Option 13"),
			slateOption14 = placingTagList.Tag.(TagType == "NLD Slate Option 14"),
			slateOption15 = placingTagList.Tag.(TagType == "NLD Slate Option 15"),
			slateOption16 = placingTagList.Tag.(TagType == "NLD Slate Option 16"),
			slateOption17 = placingTagList.Tag.(TagType == "NLD Slate Option 17"),
			slateOption18 = placingTagList.Tag.(TagType == "NLD Slate Option 18"),
			slateOption19 = placingTagList.Tag.(TagType == "NLD Slate Option 19"),
			slateOption20 = placingTagList.Tag.(TagType == "NLD Slate Option 20"),
			slateOption21 = placingTagList.Tag.(TagType == "NLD Slate Option 21"),
			slateOption22 = placingTagList.Tag.(TagType == "NLD Slate Option 22"),
			slateOption23 = placingTagList.Tag.(TagType == "NLD Slate Option 23"),
			slateOption24 = placingTagList.Tag.(TagType == "NLD Slate Option 24"),
			slateOption25 = placingTagList.Tag.(TagType == "NLD Slate Option 25"),

			// Delivery Related Settings (Common to all methods)
			deliveryMethod = placingTagList.Tag.(TagType == "NLD Delivery Method").Value.toString(),
			bandwidthFloor = placingShortTextList.ShortText.(ShortTextType == "NLD Bandwidth Floor").Value.toString(),
			bandwidthCeiling = placingShortTextList.ShortText.(ShortTextType == "NLD Bandwidth Ceiling").Value.toString(),
			successEmailAddresses = placingTagList.Tag.(TagType == "NLD Success E-Mail Addresses").Value,
			sendSuccessEmail = placingShortTextList.ShortText.(ShortTextType == "NLD Send Success Email").Value.toString() == "true",
			failureEmailAddresses = placingTagList.Tag.(TagType == "NLD Failure E-Mail Addresses").Value,
			sendFailureEmail = placingShortTextList.ShortText.(ShortTextType == "NLD Send Failure Email").Value.toString() == "true",

			// Email Settings
			preprocessingSuccessEmailAddresses = placingTagList.Tag.(TagType == "NLD Preprocessing Success E-Mail Addresses").Value,
			conformSuccessEmailAddresses = placingTagList.Tag.(TagType == "NLD Conform Success E-Mail Addresses").Value,
			postprocessingSuccessEmailAddresses = placingTagList.Tag.(TagType == "NLD Postprocessing Success E-Mail Addresses").Value,
			transcodeSuccessEmailAddresses = placingTagList.Tag.(TagType == "NLD Transcode Success E-Mail Addresses").Value,
			packagingSuccessEmailAddresses = placingTagList.Tag.(TagType == "NLD Packaging Success E-Mail Addresses").Value,

			preprocessingSendSuccessEmail = placingShortTextList.ShortText.(ShortTextType == "NLD Preprocessing Send Success Email").Value.toString(),
			conformSendSuccessEmail = placingShortTextList.ShortText.(ShortTextType == "NLD Conform Send Success Email").Value.toString(),
			postProcessingSendSuccessEmail = placingShortTextList.ShortText.(ShortTextType == "NLD Postprocessing Send Success Email").Value.toString(),
			transcodeSendSuccessEmail = placingShortTextList.ShortText.(ShortTextType == "NLD Transcode Send Success Email").Value.toString(),
			packagingSendSuccessEmail = placingShortTextList.ShortText.(ShortTextType == "NLD Packaging Send Success Email").Value.toString(),

            preprocessingFailureEmailAddresses = placingTagList.Tag.(TagType == "NLD Preprocessing Failure E-Mail Addresses").Value,
            conformFailureEmailAddresses = placingTagList.Tag.(TagType == "NLD Conform Failure E-Mail Addresses").Value,
			postprocessingFailureEmailAddresses = placingTagList.Tag.(TagType == "NLD Postprocessing Failure E-Mail Addresses").Value,
			transcodeFailureEmailAddresses = placingTagList.Tag.(TagType == "NLD Transcode Failure E-Mail Addresses").Value,
			packagingFailureEmailAddresses = placingTagList.Tag.(TagType == "NLD Packaging Failure E-Mail Addresses").Value,

			// These are Tags
            preprocessingSendFailureEmail = placingShortTextList.ShortText.(ShortTextType == "NLD Preprocessing Send Failure Email").Value.toString(),
			conformSendFailureEmail = placingShortTextList.ShortText.(ShortTextType == "NLD Conform Send Failure Email").Value.toString(),
			postprocessingSendFailureEmail = placingShortTextList.ShortText.(ShortTextType == "NLD Postprocessing Send Failure Email").Value.toString(),
			transcodeSendFailureEmail = placingShortTextList.ShortText.(ShortTextType == "NLD Transcode Send Failure Email").Value.toString(),
			packagingSendFailureEmail = placingShortTextList.ShortText.(ShortTextType == "NLD Packaging Send Failure Email").Value.toString(),

			// Aspera Settings;
			asperaProxy = placingShortTextList.ShortText.(ShortTextType == "NLD Aspera Proxy").Value.toString(),
			asperaSourceNode = placingShortTextList.ShortText.(ShortTextType == "NLD Aspera Source Node").Value.toString(),
			asperaTargetNode = placingShortTextList.ShortText.(ShortTextType == "NLD Aspera Target Node").Value.toString(),
			asperaTargetPath = placingShortTextList.ShortText.(ShortTextType == "NLD Aspera Target Path").Value.toString(),
			asperaBandwidthMax = placingShortTextList.ShortText.(ShortTextType == "NLD Bandwidth Max").Value.toString(),
			asperaBandwidthMin = placingShortTextList.ShortText.(ShortTextType == "NLD Bandwidth Min").Value.toString(),
			asperaSshPort = placingShortTextList.ShortText.(ShortTextType == "NLD SSH Port").Value.toString(),
			asperaUdpPort = placingShortTextList.ShortText.(ShortTextType == "NLD UDP Port").Value.toString(),
			asperaTargetUser = placingShortTextList.ShortText.(ShortTextType == "NLD Aspera Target User Name").Value.toString();
			asperaSourceUser = placingShortTextList.ShortText.(ShortTextType == "NLD Aspera Source User Name").Value.toString();
			// Signiant Settings;
			signiantTargetPath = placingShortTextList.ShortText.(ShortTextType == "NLD Signiant Target Path").Value.toString(),
			signiantTargetRelayAgent = placingShortTextList.ShortText.(ShortTextType == "NLD Signiant Target Relay Agent").Value.toString(),
			signiantJobGroup = placingTagList.Tag.(TagType == "NLD Signiant Job Group").Value.toString(),
			signiantJobTemplateLibraryName = placingTagList.Tag.(TagType == "NLD Signiant Job Template Library Name").Value.toString(),
			signiantJobTemplateName = placingTagList.Tag.(TagType == "NLD Signiant Job Template Name").Value.toString(),
			signiantSourceAgent = placingTagList.Tag.(TagType == "NLD Signiant Source Agent").Value.toString(),
			signiantTargetAgent = placingTagList.Tag.(TagType == "NLD Signiant Target Agent").Value.toString(),
			signiantManager = placingTagList.Tag.(TagType == "NLD Signiant Manager").Value.toString(),

			// Faspex Settings;
			faspexVantageWorkflow = placingTagList.Tag.(TagType == "NLD Faspex Vantage Workflow").Value.toString(),
			faspexTransferHost = placingTagList.Tag.(TagType == "NLD Faspex Transfer Host").Value.toString(),
			faspexWorkgroup = placingShortTextList.ShortText.(ShortTextType == "NLD Faspex Workgroup").Value.toString(),
			faspexNote = placingShortTextList.ShortText.(ShortTextType == "NLD Faspex Note").Value.toString(),
			faspexTitle = placingShortTextList.ShortText.(ShortTextType == "NLD Faspex Title").Value.toString(),
			faspexSourceShareName = placingTagList.Tag.(TagType == "NLD Faspex Source Share Name").Value.toString(),

			// FTP Settings;
			ftpHost = placingTagList.Tag.(TagType == "NLD FTP Host").Value.toString(),
			ftpPort = placingShortTextList.ShortText.(ShortTextType == "NLD FTP Port").Value.toString(),
			ftpTargetPath = placingShortTextList.ShortText.(ShortTextType == "NLD FTP Target Path").Value.toString(),
			ftpProxy = placingTagList.Tag.(TagType == "NLD FTP Proxy").Value.toString(),
			ftpProxyPort = placingShortTextList.ShortText.(ShortTextType == "NLD FTP Proxy Port").Value.toString(),
			ftpsEnabled = placingShortTextList.ShortText.(ShortTextType == "NLD FTPS Enabled").Value.toString() == "true",
			sFtpEnabled = placingShortTextList.ShortText.(ShortTextType == "NLD SFTP Enabled").Value.toString() == "true",
            //Generic Transfer Settings;
			genericRemoteTransferHost = placingTagList.Tag.(TagType == "NLD Generic Remote Transfer Host").Value.toString(),
			genericRemoteTargetPath = placingShortTextList.ShortText.(ShortTextType == "NLD Generic Target Path").Value.toString(),
			genericTransferOption = placingTagList.Tag.(TagType == "NLD Generic Transfer Option").Value.toString(),
			//Generic to All Delivery Settings
			transferOrder = placingTagList.Tag.(TagType == "NLD Transfer Order").Value,
			deliveryAcknowledgmnetRequired = placingShortTextList.ShortText.(ShortTextType == "NLD Delivery Acknowledgment").Value.toString() == "true",

			//Metadata settings;
			smatApprovalRequired = placingShortTextList.ShortText.(ShortTextType == "SMAT Approval Required").Value.toString() == "true",
			profileAllocationSetting = placingTagList.Tag.(TagType == "NLD Profile Allocation Decision").Value.toString(),
			//VAST Profile
			vastQCPriority = placingTagList.Tag.(TagType == "VAST QC Priority").Value.toString(),
			vastTestPlan = placingShortTextList.ShortText.(ShortTextType == "VAST Test Plan").Value.toString(),
			// Add etl MetaData 
			ETLmetadata = placingShortTextList.ShortText.(ShortTextType == "Metadata Required").Value.toString(),

			//Images
			includeBoxartImages = placingShortTextList.ShortText.(ShortTextType == "Include Boxart Images").Value.toString() == "true",
			includeHeroImages = placingShortTextList.ShortText.(ShortTextType == "Include Hero Images").Value.toString() == "true",
			includePosterImages = placingShortTextList.ShortText.(ShortTextType == "Include Poster Images").Value.toString() == "true",
			includeChapterImages = placingShortTextList.ShortText.(ShortTextType == "Include Chapter Images").Value.toString() == "true",
			includeTitleImages = placingShortTextList.ShortText.(ShortTextType == "Include Title Images").Value.toString() == "true",
			includeSeriesImages = placingShortTextList.ShortText.(ShortTextType == "Include Series Images").Value.toString() == "true",
			includeSeasonImages = placingShortTextList.ShortText.(ShortTextType == "Include Season Images").Value.toString() == "true",
			includeEpisodeImages = placingShortTextList.ShortText.(ShortTextType == "Include Episode Images").Value.toString() == "true",
			includeTrailerImages = placingShortTextList.ShortText.(ShortTextType == "Include Trailer Images").Value.toString() == "true",
			isPerformChecksumReq = placingShortTextList.ShortText.(ShortTextType == "NLD Requires Video Checksum").Value.toString() == "true"

		var __settings = {

			// Pre processing Settings
			"audioNormalization"				: 	audioNormalization,

			// Transcode Preset Settings
			"transcodeVantageWorkflow"			:	transcodeVantageWorkflow,
			"transcodedExtension"				:	transcodedExtension,
			"transcodeLicensee"                 :   transcodeLicensee.length() > 1 ? transcodeLicenseeRND.toString() : transcodeLicensee.toString(),


			// Package Preset Settings
			"packageFormat"					:	packageFormat,
			"packageName"                    :    packageName,
			"packagingFailureEmailAddresses": packagingFailureEmailAddresses,

			// Post Processing Preset Settings
			"outputFrameRate"					:	outputFrameRate,
			"outputScanType"					:	outputScanType,
			"captionMethod"						:   captionMethod,
			"startOfContent"					:	startOfContent,
			"isVCHIPRequired"					:   isVCHIPRequired,
			"embeddedCaption1"					: 	embeddedCaption1, 
			"embeddedCaption2"					: 	embeddedCaption2, 
			"sidecarCaption1"					: 	sidecarCaption1,
			"sidecarCaption2"					: 	sidecarCaption2,

			// Confrom Preset Settings
			"sourceTrim" 						:	sourceTrim,
			"outputConformFrameRate"			:	outputConformFrameRate,
			"conformVantageWorkflow"            :   conformVantageWorkflow,
            "topBlackDuration"                  :   (topBlackDuration == "" ? zeroStringTimeCode : topBlackDuration),
            "tailBlackDuration"                 :   (tailBlackDuration == "" ? zeroStringTimeCode : tailBlackDuration),
            "fileStart"                         :   fileStart,
            "includeHeader"                     :   includeHeader,
            "preTatendBlack"                    :   (preTatendBlackDuration == "" ? zeroStringTimeCode : preTatendBlackDuration),
			"midrollBlack"                      :   (midrollBlack == "" ? zeroStringTimeCode : midrollBlack),
			"partiallyTextedType"                           :       textlessFilterSettings,			
			"versionPreference"                 :   versionPreference,
			"includeDubCards"					:   includeDubCards,
			"dubCardInsertDuration"				: 	dubCardInsertDuration,
			"fadeIn"							:   fadeIn, 
			"fadeOut"							:   fadeOut,
			"enableFadeInOut"					:   enableFadeInOut,  

		    //Custom Header Settings
			"includeCustomHeader"				:   includeCustomHeader,
			"ebuBarsPALConversion"				: 	ebuBarsPALConversion,
			"headerOption1"						:   headerOption1,
			"headerOption2"						:   headerOption2,
			"headerOption3"						:   headerOption3,
			"headerOption4"						:   headerOption4,
			"headerOption5"						:   headerOption5,
			"headerOption6"						:   headerOption6,

			"headerOption1Duration"				:   headerOption1Duration,
			"headerOption2Duration"				:   headerOption2Duration,
			"headerOption3Duration"				:   headerOption3Duration,
			"headerOption4Duration"				:   headerOption4Duration,
			"headerOption5Duration"				:   headerOption5Duration,
			"headerOption6Duration"				:   headerOption6Duration,

			"slateOption1"						: slateOption1,
			"slateOption2"						: slateOption2,
			"slateOption3"						: slateOption3,
			"slateOption4"						: slateOption4,
			"slateOption5"						: slateOption5,
			"slateOption6"						: slateOption6,
			"slateOption7"						: slateOption7,
			"slateOption8"						: slateOption8,
			"slateOption9"						: slateOption9,
			"slateOption10"					    : slateOption10,
			"slateOption11"						: slateOption11,
			"slateOption12"						: slateOption12,
			"slateOption13"						: slateOption13,
			"slateOption14"						: slateOption14,
			"slateOption15"						: slateOption15,
			"slateOption16"						: slateOption16,
			"slateOption17"						: slateOption17,
			"slateOption18"						: slateOption18,
			"slateOption19"						: slateOption19,
			"slateOption20"					    : slateOption20,
			"slateOption21"						: slateOption21,
			"slateOption22"						: slateOption22,
			"slateOption23"						: slateOption23,
			"slateOption24"						: slateOption24,
			"slateOption25"						: slateOption25,

			"slateBackgroundStyle" 				: slateBackgroundStyle,
			"slateTemplate"						: slateTemplate,

			"territorySubType"					:	territorySubType,

			// Delivery Preset Settings
			"deliveryMethod"					:	deliveryMethod,
			"bandwidthFloor"					:	bandwidthFloor,
			"bandwidthCeiling"					:	bandwidthCeiling,
			"successEmailAddresses"				:	successEmailAddresses,
			"sendSuccessEmail"					:	sendSuccessEmail,
			"failureEmailAddresses"				:	failureEmailAddresses,
			"sendFailureEmail"					:	sendFailureEmail,

			// Email Settings
			"preprocessingSuccessEmailAddresses"	: 	preprocessingSuccessEmailAddresses,
			"conformSuccessEmailAddresses"		: 	conformSuccessEmailAddresses,
			"postprocessingSuccessEmailAddresses"	: 	postprocessingSuccessEmailAddresses,
			"transcodeSuccessEmailAddresses"	: 	transcodeSuccessEmailAddresses,
			"packagingSuccessEmailAddresses"	:	packagingSuccessEmailAddresses,

			"preprocessingSendSuccessEmail"		:	preprocessingSendSuccessEmail,
			"conformSendSuccessEmail"			:	conformSendSuccessEmail,
			"postProcessingSendSuccessEmail"	:	postProcessingSendSuccessEmail,
			"transcodeSendSuccessEmail"			:	transcodeSendSuccessEmail,
			"packagingSendSuccessEmail"			:	packagingSendSuccessEmail,

			"preprocessingFailureEmailAddresses"	:	preprocessingFailureEmailAddresses,
			"conformFailureEmailAddresses"		:	conformFailureEmailAddresses,
			"postprocessingFailureEmailAddresses"	:	postprocessingFailureEmailAddresses,
			"transcodeFailureEmailAddresses"	:	transcodeFailureEmailAddresses,
			"packagingFailureEmailAddresses"	:	packagingFailureEmailAddresses,

			"preprocessingSendFailureEmail"		:	preprocessingSendFailureEmail,
			"conformSendFailureEmail"			:	conformSendFailureEmail,
			"postprocessingSendFailureEmail"	:	postprocessingSendFailureEmail,
			"transcodeSendFailureEmail"			:	transcodeSendFailureEmail,
			"packagingSendFailureEmail"			:	packagingSendFailureEmail,

			// Aspera Preset Settings
			"asperaProxy"						: 	asperaProxy,
			"asperaSourceNode"					: 	asperaSourceNode,
			"asperaTargetNode"					: 	asperaTargetNode,
			"asperaBandwidthMax"					:	asperaBandwidthMax,
			"asperaBandwidthMin"					:	asperaBandwidthMin,
			"asperaSshPort"						: 	asperaSshPort,
			"asperaUdpPort"						: 	asperaUdpPort,
			"asperaTargetPath"					:	asperaTargetPath,
			"asperaTargetUser"					:	asperaTargetUser,
			"asperaSourceUser"					:	asperaSourceUser,

			// Signiant Preset Settings
			"signiantTargetPath"					:	signiantTargetPath,
			"signiantTargetRelayAgent"				:	signiantTargetRelayAgent,
			"signiantJobGroup"					: 	signiantJobGroup,
			"signiantJobTemplateLibraryName"			:	signiantJobTemplateLibraryName,
			"signiantJobTemplateName"				: 	signiantJobTemplateName,
			"signiantSourceAgent"					:	signiantSourceAgent,
			"signiantTargetAgent"					:	signiantTargetAgent,
			"signiantManager"					:	signiantManager,

			// Faspex Preset Settings
			"faspexVantageWorkflow"					:	faspexVantageWorkflow,
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

            //Generic Transfer Settings
			"genericRemoteTransferHost"			: genericRemoteTransferHost,
			"genericRemoteTargetPath"			: genericRemoteTargetPath,
			"genericTransferOption"				: genericTransferOption,
			//Generic to All Delivery Settings
			"transferOrder"						:   transferOrder,
			"deliveryAcknowledgmnetRequired"    :   deliveryAcknowledgmnetRequired,
			//Metadata Settings
			"profileAllocationDecision"         :   profileAllocationSetting,
			"smatApprovalRequired"				:   smatApprovalRequired,
      		//VAST Profile
      		"vastTestPlan"						: vastTestPlan,
			"vastQCPriority"					: vastQCPriority,
			// ETL Metadata
			"ETLmetadata"						: ETLmetadata == "True" || ETLmetadata == "true" ? true : false,
			//Image settings
			"includeBoxartImages"				: includeBoxartImages,
			"includeHeroImages"					: includeHeroImages,
			"includePosterImages"				: includePosterImages,
			"includeChapterImages"				: includeChapterImages,
			"includeTitleImages"				: includeTitleImages,
			"includeSeriesImages"				: includeSeriesImages,
			"includeSeasonImages"				: includeSeasonImages,
			"includeEpisodeImages"				: includeEpisodeImages,
			"includeTrailerImages"				: includeTrailerImages,
			"isPerformChecksumReq"				: isPerformChecksumReq			
		}

		if (debug) {
			print("Settings: ");
			for (var prop in __settings){
				print(prop, ":", __settings[prop]);
			}
		}
		return __settings;
	},

	checkPipelineStateRequired : function(placingId, currentState){

		var pipelineStates = this.getPipelineStates(placingId);
		// for testing purpose: pipelineStates[currentState] = true;
		// Add in some Transcode key logic here?
		if (pipelineStates[currentState] == true) {
			output("This pipeline state is required.");
		} else {
			output("This pipeline state is not required, exiting.");
			quit(0);
		}
	},

	makeBaseEventXml : function(duration, framerate, stream, matId, event_type, description, cg_text, event_trim, event_outcode, segment_id){
		var e = new XML('<Event></Event>');
		e.EventType = event_type;
        e.FrameRate = framerate;
		e.TrimMaterialId = matId;
		e.Duration = duration;
        e.Stream = stream;
		e.Description = description;
		e.CgText = cg_text;
		if(gmoNBCFunc.isVarUsable(event_trim)){
			e.EventTrim = event_trim;
			e.EventTrim.@rate = framerate;
		}
		if(gmoNBCFunc.isVarUsable(event_outcode)){
			e.Outcode = event_outcode;
			e.Outcode.@rate = framerate;
		}
		if(gmoNBCFunc.isVarUsable(segment_id)){
			e.SegmentId =  segment_id
		}
        return e;
	},


	makeStillEvent: function(duration, framerate, stream, matId){
		var e = new XML('<Event></Event>');
		e.EventType = 'Still';
        e.FrameRate = framerate;
		e.TrimMaterialId = matId;
		e.Duration = duration;
        e.Stream = stream;
        return e;
	},
	
	makeVChipEvent : function (ratingSystem, ratingFlags, ratingTitle, duration, frameRate) {

		var frameRateToMaterialMap = {
			"P23_976" : "VCHIP_P23_976",
			"DF30" : "VCHIP_DF30"
		}

		ratingTitle = ratingTitle.replace(/[^A-Za-z0-9]/g,"");

		var vChipEventXml = new XML(<Event></Event>);
		vChipEventXml.EventType = "Text";
		vChipEventXml.Description = "VCHIP";
		vChipEventXml.Stream = "nld vchip";
		var streamId = gmoNBCNLDFunc.getStreamId(vChipEventXml.Stream);
		if(gmoNBCFunc.isVarUsable(streamId)){
			vChipEventXml.StreamId = streamId;
		}
		
		vChipEventXml.FrameRate = frameRate;
		vChipEventXml.TrimMaterialId = NBCGMO.vchipMaterials[frameRate];
		vChipEventXml.ParcelOffset = "00:00:00:00";
		vChipEventXml.Duration = duration === undefined ? "00:00:00:25:00" : duration;
		vChipEventXml.CgText = "Rating=" + ratingSystem + " RatingFlags=" + ratingFlags + " RatingTitle=" +  ratingTitle;

		return vChipEventXml;
	},


	makeWaterMarkingEvent : function (requiresWatermarking, duration, frameRate) {

		var waterMarkingEvent = new XML(<Event></Event>);
		waterMarkingEvent.EventType = "Text";
		waterMarkingEvent.Description = "Watermarking";
		waterMarkingEvent.Stream = "nld watermarking";
		var streamId = gmoNBCNLDFunc.getStreamId(waterMarkingEvent.Stream);
		if(gmoNBCFunc.isVarUsable(streamId)){
			waterMarkingEvent.StreamId = streamId;
		}
		waterMarkingEvent.FrameRate = frameRate;
		waterMarkingEvent.TrimMaterialId =  NBCGMO.waterMarkingMaterials[frameRate];
		waterMarkingEvent.ParcelOffset = "00:00:00:00";
		waterMarkingEvent.Duration = duration === undefined ? "00:00:00:25:00" : duration;
		waterMarkingEvent.CgText = "Watermarking=" + requiresWatermarking;

		return waterMarkingEvent;
	},

	getPrevEvent: function(eventList, index){
		return index > 0 ? eventList.Event[index-1] : undefined
	},

	getNextEvent: function(eventList, index){
		return index < eventList.Event.length()-1 ? eventList.Event[index+1] : undefined
	},

	getEvent: function(eventList, index){
		return eventList.Event[index]
	},

	getPenultimateEventIndex : function(eventList){
		return eventList.Event.length() - 2;
	},

	isPenultimateEvent : function(eventList, index) {
		return this.getPenultimateEventIndex(eventList) === index;
	},

	getParcel: function(parcelId){
		var xml = <PharosCs>
                  <CommandList>
                  <Command subsystem="parcel" method="get">
                    <ParameterList>
                      <Parameter name="parcelId">
                        <Value>
                          <Integer>{parcelId}</Integer>
                        </Value>
                          </Parameter>
                          <Parameter name="options">
                              <Value>
                                  <ParcelOptions>
                                      <Option>parcelEvents</Option>
                                  </ParcelOptions>
                              </Value>
                          </Parameter>
                         </ParameterList>
                       </Command>
                    </CommandList>
                   </PharosCs>;
        return(wscall(xml)..Parcel);
	},

	saveParcel: function(parcelXml){
		var xml = <PharosCs>
				  <CommandList>
					<Command subsystem="parcel" method="save">
					  <ParameterList>
						<Parameter name="parcel">
						  <Value>
							{parcelXml}
						  </Value>
						</Parameter>
					  </ParameterList>
					</Command>
				  </CommandList>
				</PharosCs>;

		wscall(xml);
	},

	getPipelineStates: function(placingId){
		var placingXml = placingGet(placingId, "shorttext");

		var preProcessingState = placingXml..ShortTextList.ShortText.(ShortTextType == "Preprocessing").Value.toString() == "true",
			conformState = placingXml..ShortTextList.ShortText.(ShortTextType == "Conform").Value.toString() == "true",
			postProcessingState =  placingXml..ShortTextList.ShortText.(ShortTextType == "Post Processing").Value.toString() == "true",
			transcodeState =  placingXml..ShortTextList.ShortText.(ShortTextType == "Transcode").Value.toString() == "true",
			packagingState =  placingXml..ShortTextList.ShortText.(ShortTextType == "Packaging").Value.toString() == "true",
			deliveryState =  placingXml..ShortTextList.ShortText.(ShortTextType == "Delivery").Value.toString() == "true",
			archiveOrderState =  placingXml..ShortTextList.ShortText.(ShortTextType == "Archive Order").Value.toString() == "true";

		var __pipelineStates = {
			// Placing States
			"Preprocessing"		:	preProcessingState,
			"Conform"		:	conformState,
			"Post Processing"	:	postProcessingState,
			"Transcode"		:	transcodeState,
			"Packaging"		:	packagingState,
			"Delivery"		:	deliveryState,
			"Archive Order"		:	archiveOrderState
		}
		if (debug){
			print("Pipeline States: ");
			show(__pipelineStates);
		}
		return __pipelineStates;

	},

	getPreviousPipelineState : function(placingId, currentState){

		var pipelineStates = this.getPipelineStates(placingId);
		var currentStateIndex = NBCGMO.nldStates.indexOf(currentState);
		var stateIndex = -1;
		var previousStateIndex = -1;

		for each (var stateName in NBCGMO.nldStates){
			var stateExecuted = pipelineStates[stateName];
			if (debug) output("Checking State [" + stateName + "] Executed [" + stateExecuted + "] Current State Index [" + currentStateIndex + "]");
			if (stateExecuted == true){
				var stateIndex = NBCGMO.nldStates.indexOf(stateName);
				if (debug) output("Previous State Index [" + stateIndex + "]for [" + stateName + "]");
				if ((currentStateIndex > stateIndex) && (stateIndex > previousStateIndex)){
					var previousState = stateName;
					var previousStateIndex = stateIndex;
				}
			}
		}

		if (previousState == "" || previousState == null){
			var previousState = "Transfer";
		}

		return previousState;
	},

	getPipelineStateFolderName : function(stateName){
		return stateName.replace(" ", "_");
	},

	compilePlacing : function(placingXml){
		var xml =
			<PharosCs>
				<CommandList>
					<Command subsystem="placing" method="save">
						<ParameterList>
							<Parameter name="placing">
								<Value>
									{placingXml}
								</Value>
							</Parameter>
						</ParameterList>
					</Command>
				</CommandList>
			</PharosCs>;

		return wscall(xml);
	},

	updatePipelineStateDataElement : function(placingId, stateName, pipelineValue){
		output("Updating Pipeline State DataElement for State [" + stateName + "] to [" + pipelineValue + "]");

		var xml =
			<Placing>
				<PlacingId>{placingId}</PlacingId>
				<ShortTextList>
					<ShortText>
						<ShortTextType>{stateName}</ShortTextType>
						<Value>{pipelineValue}</Value>
					</ShortText>
				</ShortTextList>
			</Placing>;

		return this.compilePlacing(xml);
	},

	/**
	 *
	 *	Placing Tag Save
	 *	@author		Jeff Blakeney
	 *	@param		string	The Placing ID to save the tag(s) against.
	 *	@param		string	The tag type to save for.
	 *	@param		string/array	It can either be an array of values (for an ordinal/ordinal expanding set), or a singluar value for any type of set.
	 *
	 */

	placingTagSave : function(placingId, tagType, tagValue){
		output("Saving Tag against placing, Tag Type [" + tagType + "] Value [" + tagValue + "]");

		var xml =
			<Placing>
				<PlacingId>{placingId}</PlacingId>
				<TagList></TagList>
			</Placing>;

		if (tagValue instanceof Array){
			for each (var saveValue in tagValue) {
				xml.TagList.Tag +=
					<Tag>
						<TagType>{tagType}</TagType>
						<Value>{saveValue}</Value>
					</Tag>;
			}
		} else {
			xml.TagList.Tag +=
				<Tag>
					<TagType>{tagType}</TagType>
					<Value>{tagValue}</Value>
				</Tag>;
		}

		return this.compilePlacing(xml);
	},

	getAllOutputTemplates : function() {
        var xml = 
            <PharosCs>
                <CommandList>
                    <Command subsystem="outputTemplate" method="getAllOutputTemplates"/>
                </CommandList>
            </PharosCs>;

        return(wscall(xml)..Output);
    },
    
    getOutputTemplate : function(templateId) {
        var allOutputTemplates = this.getAllOutputTemplates();
            
        for each(var template in allOutputTemplates.OutputTemplate){
            if (parseInt(template.Id) === templateId){
                return template;
            } 
        }
    },
        
    populateForPlacing : function(placingId) {
        var populateForPlacing = 
            <PharosCs>
              <CommandList>
                <Command subsystem="outputTemplate" method="populateForPlacing">
                  <ParameterList>
                    <Parameter name="placingId" value={placingId}/>
                  </ParameterList>
                </Command>
              </CommandList>
            </PharosCs>;

        return(wscall(populateForPlacing)..Output);
    },

	createOutputXml : function(placingId, fileName)  {
        output("Populating XML for placing");
        var pop = this.populateForPlacing(placingId);
        
        //one day this stage will be built into output templates :)
        output("Validating XML");
        var xml = gmoNBCFunc.removeXmlNameSpace(pop.PopulatedOutputTemplate.Output);
        var emptyFields = this.findEmptyNodes(xml);
        if (emptyFields.length > 0){
            throw new Error("Populated output template contains empty fields: " + emptyFields);
        }
        
        output("Generating XML to output file [" + fileName +"]");
        //if XML already exists then append is going to cause an issue so removing append and replacing with overwrite
        overwrite(pop.PopulatedOutputTemplate.Output,fileName);
    },

	createOutputCsv: function(placingId, fileName) {
		print("Populating CSV for placing.");
		var output = gmoNBCNLDFunc.populateForPlacing(placingId).PopulatedOutputTemplate.Output;

		print("Validating CSV...");
		var rows = output.split("\n");
		var headerLength = rows[0].split(',').length;

		for (var i = 1; i < rows.length; i++) {
			var rowLength = rows[i].split(',').length;
			if (rowLength != headerLength) {
				throw new Error("Missing fields in output CSV. Expected " + headerLength + " fields, but row " + i + " is " + rowLength + " fields long.");
			}
		}

		print("CSV validation passed. All rows are " + headerLength + " fields long.");
		print("Saving output to: " + fileName);
		overwrite(output, fileName);
	},
    
    findEmptyNodes : function(xml, parent, emptyNodes){
        emptyNodes = emptyNodes || [];

        if(xml.hasComplexContent()){
            for(var i = 0; i < xml.length(); i++){
                if (debug) print('visiting node '+xml[i].name());
                this.findEmptyNodes(xml[i].children(), xml[i], emptyNodes);
            }
        }else if(parent && parent.attributes().length() > 0){
            // empty node but has attributes
            if (debug) print('node [', parent.name(), '] has [', parent.attributes().length(), '] attributes');

            for(var i = 0; i < parent.attributes().length(); i++){
                if (debug) print('\t', parent.attributes()[i].name(), ' = ', parent.attributes()[i]);
            }
        }else{
            var empty = xml.length() > 0 ? false : true;

            if (debug) print('terminal node [', parent.name(),'] empty =', empty);

            if(!empty){
                if (debug) print('\tnode content =', xml);
            }else{
                emptyNodes.push(parent.name());
            }
        }
        return emptyNodes;
    },


	createTarball : function(options, outputFile, inputFiles, directory, removeFiles){
		if (typeof(removeFiles) == "undefined"){
			var removeFiles = false;
		}

		var tarExe = ["/bin/tar"];

		var runInputs = [];
		runInputs = runInputs.concat(options);
		runInputs = runInputs.concat(outputFile);

		if (removeFiles) {
			runInputs = runInputs.concat("--remove-files");
		}

		if (directory != "" && directory != null){
			runInputs = runInputs.concat(["-C", directory]);
		}

		runInputs = runInputs.concat(inputFiles);

		try {
			print("Attempting to create Tarball File [" + outputFile + "]");
			var result = run(tarExe, runInputs);
		} catch (e) {
			throw new Error("Creating Tarball failed. Command: [" + tarExe + " " + runInputs + "] - Error [" + e.message + "]");
		}

		if (result.exit !== 0){
			throw new Error("Creating Tarball failed. Command: [" + tarExe + " " + runInputs + "] - Error [" + result.error + "]");
		}

	},

	getPreset : function(presetName){
		var xml =
			<PharosCs>
			  <CommandList>
				<Command subsystem="preset" method="get">
				  <ParameterList>
					<Parameter name="presetName" value={presetName}/>
					<Parameter name="options">
					  <Value>
						<PresetOptions>
						  <Option>shorttext</Option>
						  <Option>fulltext</Option>
						<Option>tag</Option>
						</PresetOptions>
					  </Value>
					</Parameter>
				  </ParameterList>
				</Command>
			  </CommandList>
			</PharosCs>;

		return(wscall(xml)..Output);
	},

    getPublicationDefinitionByName : function(pubDefName) {
      var xml = <PharosCs>
            <CommandList>
            <Command subsystem="placing" method="getPublicationDefinition">
              <ParameterList>
              <Parameter name="publicationDefinition">
                <Value>
                <PublicationDefinition>
                  <Name>{pubDefName}</Name>
                </PublicationDefinition>
                </Value>
              </Parameter>
              </ParameterList>
            </Command>
            </CommandList>
          </PharosCs>;

      return(wscall(xml)..Output);
    },

    getPublicationDefinitionElasticSearch : function(testName) {
        var mySearch = wscall(<PharosCs>
        	<CommandList>
        		<Command subsystem="elasticSearch" method="uniqueFieldValuesSearch">
        			<ParameterList>
        				<Parameter name="type">
        					<Value>Placing</Value>
        				</Parameter>
        				<Parameter name="field">
        					<Value>PlacingPublication.PubDefName</Value>
        				</Parameter>
        				<Parameter name="searchProviderId">
        					<Value>Local</Value>
        				</Parameter>
        				<Parameter name="uppercase">
        					<Value>
        						<Boolean>false</Boolean>
        					</Value>
        				</Parameter>
        				<Parameter name="filterPrefix">
        					<Value>{testName}</Value>
        				</Parameter>
        			</ParameterList>
        		</Command>
        	</CommandList>
        </PharosCs>);
        var pubDefName = mySearch..UniqueFieldSearchResultList.(String.toUpperCase() == testName.toUpperCase()).String.toString();

        if (pubDefName !== "") {
          return this.getPublicationDefinitionByName(pubDefName);
        } else {
          throw new Error("Could Not Find Configured Publication Definition for [" + testName + "]");
        }
    },

    getPublicationDefinitionReport : function(testName) {
        var runReportXML =  <PharosCs>
                    			<CommandList>
                    				<Command subsystem="report" method="runReport">
                    					<ParameterList>
                    						<Parameter name="reportName" value="Get Publication Definition Case Insensitive"/>
                    						<Parameter name="reportParameters">
                    							<Value>
                    							<CustomReportRuntimeParameters>
                    								<Parameters>
                    								<StringReportParameter>
                    									<Name>input</Name>
                    									<Operator>is</Operator>
                    									<Values>
                    										<String>{testName}</String>
                    									</Values>
                    								</StringReportParameter>
                    								</Parameters>
                    							</CustomReportRuntimeParameters>
                    							</Value>
                    						</Parameter>
                    						<Parameter name="pageSize">
                    							<Value>
                    								<Integer>9999</Integer>
                    							</Value>
                    						</Parameter>
                    						<Parameter name="page">
                    							<Value>
                    								<Integer>1</Integer>
                    							</Value>
                    						</Parameter>
                    					</ParameterList>
                    				</Command>
                    			</CommandList>
                    		</PharosCs>;
	    var rtn = wscall(runReportXML);

		var rtnCount = parseInt(rtn..ResultList.PagedResults.Count);
		if (rtnCount > 1) {
			throw new Error("Found More Than One Configured Publication Definition for Profile [" + testName + "]");
		} else if (rtnCount == 0) {
			throw new Error("Could Not Find Configured Publication Definition for [" + testName + "]");
		}
        return this.getPublicationDefinitionByName(rtn..ResultList..NAME.toString());
    },


	getPubDef : function(pubDefName) {
        var foundPubDef = "";
        try {
            output("getPubDef(): Trying using Elastic Search");
            foundPubDef = this.getPublicationDefinitionElasticSearch(pubDefName).PublicationDefinition;
        } catch(e) {
            output("getPubDef(): Couldn't find pub def using Elastic Search. Trying using Custom Report");
            foundPubDef = this.getPublicationDefinitionReport(pubDefName).PublicationDefinition;
        }
		return foundPubDef;
	},

	makeHeaderSegment : function(matId){
    output("Making / Updating Header Segment to be Incode of material to SOM");
    var materialXML = materialGet(matId, "segments", "tracks")..Output;
    var mainMaterialFrameRate = materialXML..Material.FrameRate;

	 for each(var seg in materialXML..SegmentList.Segment){
		 if(seg.SegmentGroup.Name.toString() == "SOM / EOM"){
			 //get the incode of the SOM
			 var somIncode = seg.MarkerIn.Absolute;
			 var headerOutcode = FrameLabel.parseText(mainMaterialFrameRate, somIncode).subtract("00:00:00:01").toString();
		 }
	 }

		for each(var track in materialXML..Track){
			if(NBCGMO.storeMedias.indexOf(track.MediaName.toString()) > -1 ||
				NBCGMO.archiveMedias.indexOf(track.MediaName.toString()) > -1 ||
					NBCGMO.t2Medias.indexOf(track.MediaName.toString()) > -1){
				var headerIncode = track.Incode.toString();
			}
		}

		var xml = <PharosCs>
				  <CommandList>
					<Command subsystem="material" method="save">
					  <ParameterList>
						<Parameter name="material">
						  <Value>
							<Material>
							  <MatId>{matId}</MatId>
							  <SegmentList>
								<Segment>
								  <MarkerIn>
									<FrameRate>{mainMaterialFrameRate}</FrameRate>
									<Absolute>{headerIncode}</Absolute>
								  </MarkerIn>
								  <MarkerOut>
									<FrameRate>{mainMaterialFrameRate}</FrameRate>
									<Absolute>{headerOutcode}</Absolute>
								  </MarkerOut>
								  <SegmentGroup>
									<Name>Header</Name>
								  </SegmentGroup>
								  <SegmentType>
									<Name>GMO</Name>
								  </SegmentType>
								  <Index>1</Index>
								</Segment>
							  </SegmentList>
							</Material>
						  </Value>
						</Parameter>
					  </ParameterList>
					</Command>
				  </CommandList>
				</PharosCs>;

		wscall(xml);
	 },

	// Decommissioned July 2016
	// using placingBuilder
	buildPlacing : function(placingId, pubDefName, segmentGroup, material, templateName, parcelFrameRate,headerRequired){
		output("Creating Placing:" + placingId);
		output("Publication Definition will be set as: " + pubDefName);

		getOrderedSegmentsForGroup = function(materialXML,segmentGroupName){
			var orderedSegments = [];
			var segments = materialXML..SegmentList.Segment.(SegmentGroup.Name==segmentGroupName);
			for (var index=1;index<=segments.length();index++){
				orderedSegments.push(segments.(Index==index));
			}
			return orderedSegments;
		}

		var templateXml = new XMLList();
		var materialXml = materialGet(material.toString(), "segments")..Output;
		if(headerRequired){
			output("Header is required, adding header segment.");
			templateXml += <TemplateParameterList>
									<TemplateParameter>
										<Value>{material}</Value>
										<Name>segment-matId</Name>
										<Type>template parameter</Type>
									</TemplateParameter>
									<TemplateParameter>
										<Value>Header</Value>
										<Name>segment-segmentGroup</Name>
										<Type>template parameter</Type>
									</TemplateParameter>
									<TemplateParameter>
										<Value>1</Value>
										<Name>segment-segmentIndex</Name>
										<Type>template parameter</Type>
									</TemplateParameter>
								</TemplateParameterList>;
		};

		output("Checking for segments in the following group: " + segmentGroup);
		var orderedSegments = getOrderedSegmentsForGroup(materialXml,segmentGroup);

		for each (var segment in orderedSegments){

			if(segment.SegmentGroup.Name.toString() == segmentGroup){
				output("Segment found, adding to the template");
				var segmentIndex = segment.Index.toString();

				templateXml += <TemplateParameterList>
								<TemplateParameter>
									<Value>{material}</Value>
									<Name>segment-matId</Name>
									<Type>template parameter</Type>
								</TemplateParameter>
								<TemplateParameter>
									<Value>{segmentGroup}</Value>
									<Name>segment-segmentGroup</Name>
									<Type>template parameter</Type>
								</TemplateParameter>
								<TemplateParameter>
									<Value>{segmentIndex}</Value>
									<Name>segment-segmentIndex</Name>
									<Type>template parameter</Type>
								</TemplateParameter>
							</TemplateParameterList>;
			}
		}


		output("Template Succesfully Created");

		var placing = <Placing>
					 	<PlacingId>{placingId}</PlacingId>
					 	<PlacingPublicationList>
					 		<PlacingPublication>
					 			<PublicationDefinition>
					 				<Name>{pubDefName}</Name>
					 			</PublicationDefinition>
					 		</PlacingPublication>
					 	</PlacingPublicationList>
							<PlacingParcelList>
								<PlacingParcel>
									<Parcel>
										<ParcelType>Placing</ParcelType>
										<FrameRate>{parcelFrameRate}</FrameRate>
										<TemplateName>{templateName}</TemplateName>
										<TemplateParameterList>
											<TemplateParameter>
												<Name>materials-compoundList</Name>
													<Value>
														<TemplateParameterListCompound>
														{templateXml}
														</TemplateParameterListCompound>
													</Value>
												<Name>list-compoundList</Name>
												<Type>template parameter</Type>
											</TemplateParameter>
										</TemplateParameterList>
									</Parcel>
								</PlacingParcel>
						 	</PlacingParcelList>
					 </Placing>

		return(placing);
	},

	findMainMaterialId : function(placingXml){
		/*
		// The assumption made is that the source file extension will be the same as that of the main material in the placing
		output("Number of Events Found: " + placingXml.PlacingParcelList..Parcel.ParcelEventList..Event.length());

		if(placingXml.PlacingParcelList..Parcel.ParcelEventList..Event.length() == 1){
			// If there is only one event, and only one parcel, in the placing, the given material is simply set as the main material
			var mainMaterialId = placingXml.PlacingParcelList.PlacingParcel.Parcel.ParcelEventList.Event.TrimMaterialId.toString();
			output("Found one material in the parcel list, using it as the main material: " + mainMaterialId);
		} else {
			var temporaryEventCount = 0;
			var outputEvents = true;
			var mainMaterialId = "";
			var mainMaterialDuration = -1;
			var mainProgramId = "";
			var mainProgramDuration = -1;
			output("Iterating through all materials found in the parcel list...");
			// If multiple events exist in a parcel, or multiple parcels exist, iterate through all of them
			for each (var parcelEvent in placingXml.PlacingParcelList..Parcel.ParcelEventList..Event){
				temporaryEventCount += 1;
				if(outputEvents){
					output("Event ["+temporaryEventCount+"] Material: " + parcelEvent.Material.MatId.toString());
					output("Event ["+temporaryEventCount+"] Material Duration: " + parcelEvent.Material.Duration.@nanos);
					output("Event ["+temporaryEventCount+"] Material Type: " + parcelEvent.Material.MaterialType.toString());
				}
				if(parcelEvent.Material.MaterialType.toString() == "Programme" && parcelEvent.Material.Duration.@nanos > mainProgramDuration){
					// Two key assumptions are made:
					//	1) Main material is of programme type.
					//	2) Main material will have the longest duration.
					mainProgramDuration = parcelEvent.Material.Duration.@nanos;
					mainProgramId = parcelEvent.Material.MatId.toString();
				} else if(parcelEvent.Material.Duration.@nanos > mainMaterialDuration){
					// In the event that there is no material of programme type, we will simply use the material with the longest duration
					mainMaterialDuration = parcelEvent.Material.Duration.@nanos;
					mainMaterialId = parcelEvent.Material.MatId.toString();
				}
			}
			if(mainProgramId != ""){
				// If a material of program type is found, this ensures
				// that it is actually used instead of any other material
				output("Found a main material of programme type, making sure that it is used");
				mainMaterialId = mainProgramId;
			}
			if(mainMaterialId == ""){
				// theoretically, this error should never be thrown, but it's included nonetheless
				throw new Error("Unable to find any material within the parcel list.");
			}
			output("Found multiple materials in parcel list, using the following as the main material: " + mainMaterialId);
		}*/
		output("Getting Main Material Id from Placing XML.");
		var mainMaterialId = placingXml..MainMaterial.Material.MatId.toString();

		return mainMaterialId;
	},

	/**
	 * [calculateVantageAudioDuration This is using a different approach to calculate duration compared to calculateVantageAudioIncode-Outcode]
	 * @param  {[type]} outcode
	 * @param  {[type]} incode
	 * @param  {[type]} frameRate
	 * @return {[type]}
	 */
	calculateVantageAudioDuration : function(incode, outcode, frameRate, framesToAdd){

		print("Incode ["+incode+"] OutCode ["+outcode+"] FrameRate ["+frameRate+"]");
		var frameRateObj = makeJavaFrameRate(frameRate);
		var frameLabelIn = FrameLabel.parseText(frameRateObj, incode);
		var frameLabelOut = FrameLabel.parseText(frameRateObj, outcode);
		var amtOfTime = frameLabelIn.difference(frameLabelOut);
		print("Frames : "+amtOfTime.asFrames())
		if(gmoNBCFunc.isVarUsable(framesToAdd)){
			amtOfTime = amtOfTime.add(framesToAdd);
			print("Frames After Addition : "+amtOfTime.asFrames())
		}
		var amtOfTimeInMillis = amtOfTime.asMillis();
		if(frameRate == "P23_976"){
			var amtOfTimeInSecs = (amtOfTime.asFrames()/23.976);
			amtOfTimeInSecs = amtOfTimeInSecs.toFixed(4);
			print("amtOfTimeInSecs ["+amtOfTimeInSecs+"]");
			var amtOfTimeInMSecs = (amtOfTimeInSecs % 60);
			print("amtOfTimeInMSecs ["+amtOfTimeInMSecs+"]")
			amtOfTimeInMSecs = amtOfTimeInMSecs.toFixed(3);
			var hours = zeroPad(parseInt(amtOfTimeInSecs/3600),2)
			var minutes = zeroPad(parseInt((amtOfTimeInSecs%3600)/60),2);
			var seconds =  zeroPad(amtOfTimeInMSecs.toString().split(".")[0],2);
			var millis = amtOfTimeInMSecs.toString().split(".")[1];
			var duration = hours.toString() + ":" + minutes.toString() + ":" + seconds.toString() + "." + millis.toString();
		}else {
			var amtOfTimeInMillis = amtOfTime.asMillis();
			var amtOfTimeInSecs = (amtOfTimeInMillis / 1000);
			print("amtOfTimeInSecs ["+amtOfTimeInSecs+"]");
			var amtOfTimeInMSecs = (amtOfTimeInSecs % 60);
			print("amtOfTimeInMSecs ["+amtOfTimeInMSecs+"]")
			amtOfTimeInMSecs = amtOfTimeInMSecs.toFixed(3);
			print("amtOfTimeInMSecs ["+amtOfTimeInMSecs+"]")
			var duration = amtOfTime.toString().split(":")[0] +
					":" + amtOfTime.toString().split(":")[1] +
					":" + amtOfTime.toString().split(":")[2] +
					"." + amtOfTimeInMSecs.toString().split(".")[1]
		}
		print("Duration ["+duration+"]");
		return duration;
	},

	calculateVantageAudioIncode : function(eventTrim, materialIncode, frameRate){
		var frameRateObj = makeJavaFrameRate(frameRate);

		eventTrim = FrameLabel.parseText(frameRateObj, eventTrim);
		materialIncode = FrameLabel.parseText(frameRateObj, materialIncode);

		var relativeIncode = this.convertToVantageTimecodeWithMillis(materialIncode.difference(eventTrim).toString(), frameRate);

		return relativeIncode;
	},

	calculateVantageAudioOutcode : function(eventOutcode, materialIncode, frameRate){
		var frameRateObj = makeJavaFrameRate(frameRate);

		eventOutcode = FrameLabel.parseText(frameRateObj, eventOutcode);
		materialIncode = FrameLabel.parseText(frameRateObj, materialIncode);

		var relativeOutcode = this.convertToVantageTimecodeWithMillis(materialIncode.difference(eventOutcode).toString(), frameRate);

		return relativeOutcode;
	},

	convertToVantageTimecodeWithMillis : function (timecode, frameRate){
		var frameRateObj = makeJavaFrameRate(frameRate);

		var timecodeSplit = timecode.split(":");
		var timecodeFramesOnly =  Packages.com.pharos.microtime.FrameLabel.parseFrames(frameRateObj,timecodeSplit[3]);
		var timecodeMillisOnly = ("000" + Math.round(timecodeFramesOnly.asNanos() / 1000000)).slice(-3);

		return timecodeSplit[0] + ":" + timecodeSplit[1] + ":" + timecodeSplit[2] + "." + timecodeMillisOnly;
	},

	getMatchedProfileTrackTypes : function(placingXml, matId){
		print("getMatchedProfileTrackTypes - Start")
		var getProfileDirect = function(bProfileName) {
			var bLog = function(str) {
				print("getMatchedProfileTrackTypes.getProfileDirect(): " + str);
			};

			var bRtnXml = wscall(	<PharosCs>
										<CommandList>
											<Command subsystem="trackType" method="searchProfile"/>
										</CommandList>
									</PharosCs>);
			//bLog(bRtnXml)
			for each (var bProfile in bRtnXml..Profile) {
				if (bProfile.Name.toString() == bProfileName) {
					bLog("Found Profile in Configured System Profiles for [" + bProfileName + "]");
					return bProfile..TrackType.Name;
				}
			}
		};

		if(this.isAncillaryMaterial(matId)){
			//By Default Return Video Track Type for Ancillary Materials
			return <Name>Video</Name>;
		}

		if (placingXml..ProfileStatus.length() <= 0){
			throw new Error("No ProfileStatus in placingXml, please add it to placing.get WSCall before calling this function.");
		}

		//DELETE ME LATER!
		var materialProfileStatus = placingXml..ProfileStatus.(Name == matId)[0].Statuses.ProfileStatus.(Name.indexOf("NLD") >= 0).(Result == "ok");
		var numProfiles = materialProfileStatus.length();

		if (debug) output("Number of matched profiles with a status of \"ok\" for MatId [" + matId + "] is [" + numProfiles + "]");
		if (numProfiles != 0){
			// Taking the first profile, since we might have matched multiples
			// return materialProfileStatus[0].Statuses.ProfileStatus.Name;
			return getProfileDirect(materialProfileStatus[0].Name.toString());
		} else {
			return;
		}
		print("getMatchedProfileTrackTypes - End")
		return  placingXml..ProfileStatus.(Name == matId)[0].Statuses.ProfileStatus.(Name.indexOf("NLD") >= 0).(Result == "ok").Statuses.ProfileStatus.Name;
	},

	getSegmentDataById : function(matId,segmentId) {
    return wscall(<PharosCs>
        <CommandList>
                <Command subsystem="material" method="get">
                        <ParameterList>
                                <Parameter name="matId" value={matId}/>
                                <Parameter name="options">
                                        <Value>
                                                <MaterialOptions>
                                                        <Option>segments</Option>
                                                </MaterialOptions>
                                        </Value>
                                </Parameter>
                                <Parameter name="segmentOptions">
                                        <Value>
                                                <SegmentOptions>
                                                        <Option>shorttext</Option>
                                                        <Option>tag</Option>
                                                </SegmentOptions>
                                        </Value>
                                </Parameter>
                        </ParameterList>
                </Command>
        </CommandList></PharosCs>)..SegmentList.Segment.(@id.toString() == segmentId)
    },

	/**
	 *	getMatchedProfileName
	 *	@param placingXml	[XML]		-	Placing XML
	 *  @param matId		[String]	-	Material ID to check
	 *	Returns the matched profile name for a given Placing XML and Material ID
	 **/
	getMatchedProfileName : function(placingXml, matId) {
		print("getMatchedProfileName - Start")
		if (placingXml..ProfileStatus.length() <= 0){
			throw new Error("No ProfileStatus in placingXml, please add it to placing.get WSCall before calling this function.");
		}


		var materialProfileStatus = placingXml..ProfileStatus.(Name == matId)[0].Statuses.ProfileStatus.(Name.indexOf("NLD") >= 0).(Result == "ok");
		var numProfiles = materialProfileStatus.length();

		if (debug) output("Number of matched profiles with a status of \"ok\" for MatId [" + matId + "] is [" + numProfiles + "]");
		if (numProfiles != 0){
			// Taking the first profile, since we might have matched multiples
			return materialProfileStatus[0].Name.toString();
		} else {
			return;
		}
		print("getMatchedProfileName - End")
		return  placingXml..ProfileStatus.(Name == matId)[0].Statuses.ProfileStatus.(Name.indexOf("NLD") >= 0).(Result == "ok").Name;
	},

	/**
	 *	indexOfProfileFromProfileStatus
	 *	@param profileStatusListXml [XML] 		-  placingXml..ProfileStatus for a given material ID
	 *	@param bProfileName			[String]	-  Profile Name to search for e.g. NLD - Surround + Stereo + Closed Caption English (US)
	 *
	 **/
	indexOfProfileFromProfileStatus : function(profileStatusListXml, bProfileName) {
		if (profileStatusListXml.Statuses.ProfileStatus.(Name.toString() === bProfileName).length()) {
			return profileStatusListXml.Statuses.ProfileStatus.(Name.toString() === bProfileName).childIndex();
		} else {
			// Profile doesn't actually exist
			return null;
		}
	},

	getStagingVideoFile : function(stagingMediaName, matId) {
		var stagingMediaFolder = lookup.media[stagingMediaName].mount;
		var materialXml = materialGet(matId, "tracks");
		var stagingTrack = materialXml..Track.(MediaName == stagingMediaName);
		var fileName = stagingTrack.FileId.toString();
		var extension = stagingTrack.FileExtension.toString();
		return (stagingMediaFolder + matId + ".dir/" + fileName + "." + extension);
	},

	createVantageSourceMap : function (plXml, prevVideoFolder, prevAudioFolder, previousPipelineState) {

		var matEventList = [];
		var vantageSourceMapperObject = {};
		var allFrameRates = "all";
		var materialsToExclude = [];
		var ph = new ProfileHelper();
		var placingHelper = new PlacingHelper(plXml..PlacingId.toString());
	    Array.prototype.push.apply(materialsToExclude, NBCGMO.blackMaterials['all'])
	    Array.prototype.push.apply(materialsToExclude, NBCGMO.vchipMaterials['all']);
	    Array.prototype.push.apply(materialsToExclude, NBCGMO.waterMarkingMaterials['all']);
	    Array.prototype.push.apply(materialsToExclude, NBCGMO.slateMaterials['all']);

		print("Extracting Events from Placing");
		// Grab Events and Add to vantageSourceMapperObject
		for each(var e in plXml..ParcelEventList.Event) {
			if(materialsToExclude.indexOf(e.TrimMaterialId.toString()) < 0){
				var eventMatId = e.TrimMaterialId.toString();
				if(debug) print("\t[Event " + eventMatId +"]");
				if (matEventList.indexOf(eventMatId) === -1) {
					matEventList.push(eventMatId.toString());
					vantageSourceMapperObject[eventMatId] = {}; // Create blank object ready
				}
			}
		}

		// Loop through each Material and add more properties
		var j = 1;
		for (var matId in vantageSourceMapperObject) {
			print("Event [" + matId + "]");
			var materialXml = materialGet(matId, "tracks");
			var mediaObj = placingHelper.getUsableMediasForMaterial(matId);
			var videoTrack = mediaObj.Video.Track;
			var audioTrack = mediaObj.Audio.Track;
			var profileTrackTypes = this.getMatchedProfileTrackTypes(plXml, matId);


			// Loop through each TrackType adding the Source Index and the path to the file
			for (var i=0; i<profileTrackTypes.length();i++) {

				var trackTypeName = profileTrackTypes[i];
				print("\t\tTrack Type [" + trackTypeName + "]");
				if (trackTypeName != "MOS"){

					var ttClass = ph.getTrackType(trackTypeName).ClassId.toString();



					if (!vantageSourceMapperObject[matId].hasOwnProperty(trackTypeName)) {
						vantageSourceMapperObject[matId][trackTypeName] = {};
					}
					if (!vantageSourceMapperObject[matId][trackTypeName].hasOwnProperty(i)) {
						vantageSourceMapperObject[matId][trackTypeName][i] = {};
					}
					// List out the Source Index
					vantageSourceMapperObject[matId][trackTypeName][i]["sourceindex"] = j;

					// Put into mapping function eventually
					if (ttClass == "VIDEO") {

						if(NBCGMO.barsAndTonesMaterials[allFrameRates].indexOf(matId)>=0){
							print("bars")
							videoTrack = this.getBarsAndToneStagingTrack(matId);
							var fileName = videoTrack.FileId.toString();
							var extension = videoTrack.FileExtension.toString();
							var sourceVideoFilePath = lookup.media[videoTrack.MediaName.toString()].mount + matId + ".dir/" + fileName + "." + extension;
							print(sourceVideoFilePath)
						}else{
							var fileName = videoTrack.FileId.toString();
							var extension = videoTrack.FileExtension.toString();
							var sourceVideoFilePath = lookup.media[videoTrack.MediaName.toString()].mount + matId + ".dir/" + fileName + "." + extension;
						}
						var sourceVideoObj =  new gmoNBCFunc.usefulFileObj(sourceVideoFilePath);
						vantageSourceMapperObject[matId][trackTypeName][i]["segmentType"] = "Video";
						vantageSourceMapperObject[matId][trackTypeName][i]["path"] = sourceVideoObj.win_file;

					} else if (ttClass.indexOf("AUDIO") >= 0) {

						// Point Source to Vantage
						var fileTag = audioTrack..TrackDefinition.TrackType.(Name == trackTypeName).FileTag[0].toString();
						// Pass in Previous State and decide!
						var sourceAudioFilePath = previousPipelineState == "Transfer" ? prevAudioFolder +  matId + ".dir/" + fileName + "-" + fileTag + ".wav" : prevAudioFolder + fileName + "-" + fileTag + ".wav";

						var sourceAudioObj = new gmoNBCFunc.usefulFileObj(sourceAudioFilePath);

						vantageSourceMapperObject[matId][trackTypeName][i]["segmentType"] = "Audio";
						vantageSourceMapperObject[matId][trackTypeName][i]["path"] = sourceAudioObj.win_file;

					} else {
						//throw new Error("Cannot currently deal with Track Type Class for Vantage Segments");
						output("Unable to hadnle Track Type Class of [" + ttClass + "], ignoring for now.");
					}
					j++; // Increment Vantage Source Index Counter
				} else {
					output("MOS is silence, this is a bodge for now.");
				}
			}
		}
		print("vantageSourceMapperObject ["+vantageSourceMapperObject.toSource()+"]");
		return vantageSourceMapperObject;
	},

	cmlBuilder : function(){

		this.target = new XML(<Target></Target>)
		this.sequence = new XML(<Sequence></Sequence>);
		this.sources = new XMLList();

		this.makeEmptySegment = function(segmentType){
			return new XML(<Segment></Segment>);
		}

		this.addTimecodeToTarget = function(timecode, frameRate){
			var timeField = timecode + "@" + frameRate;
			this.target.Target += <Timecode type="source" time={timeField}/>;
		}

		this.addVideoToSegment = function(segment, sourceIndex, incode, outcode){
			
			segment.Video += new XML(<Video source={sourceIndex}>
						<Head>
							<Edit mode="absolute" time={incode}/>
						</Head>
						<Tail>
							<Edit mode="absolute" time={outcode}/>
						</Tail>
					</Video>);

			return segment;
		}

		this.addBarsAndToneToSegment = function(location, sourceIndex, duration , durationWithFrameRate){

			var barsAndTonesSegment = cmlBuilder.makeEmptySegment();
			var canvas = new XML(<Canvas layer="0" align="head" adjust="body" duration={durationWithFrameRate} />)
			var image  = new XML(<Image layer="1" align="head" fill="hold" location={location}/>)
			barsAndTonesSegment.Canvas = canvas;
			barsAndTonesSegment.Image = image;
			barsAndTonesSegment.Audio = new XML(<Audio source={sourceIndex}><Tail>
							<Edit mode="duration" time={duration}/>
						</Tail>
					</Audio>);
			this.addSegmentToSequence(barsAndTonesSegment);
		}

		this.addGraphicsToSegment = function(location, durationWithFrameRate){
			var graphicsSegment = cmlBuilder.makeEmptySegment();
			var image  = new XML(<Image layer="1" location={location} duration={durationWithFrameRate} layout="stretch" />)
			graphicsSegment.Image = image;
			this.addSegmentToSequence(graphicsSegment);
		}

		this.addAudioToSegment = function(segment, sourceIndex, incode, outcode){
			segment.Audio += new XML(<Audio source={sourceIndex}>
						<Head>
							<Edit mode="absolute" time={incode}/>
						</Head>
						<Tail>
							<Edit mode="absolute" time={outcode}/>
						</Tail>
					</Audio>);

			return segment;
		}

		/*
		this.addBlackToSegment = function(segment, blackDuration){
			segment.Black += new XML(<Canvas duration={blackDuration} foreground-color="black" background-color="black" layer="1"/>)
			return segment;
		}
		*/
		
		this.addBlackSegment = function(blackDuration){
			var canvasSegment = this.makeEmptySegment()
			var canvas = new XML(<Canvas duration={blackDuration} foreground-color="black" background-color="black" layer="1"/>);
			canvasSegment.Canvas = canvas;

			this.addSegmentToSequence(canvasSegment);
		}

		this.addBlackSegmentWithDurationAndFrameRate = function(durationWithFrameRate){
			var canvasSegment = this.makeEmptySegment()
			var canvas = new XML(<Canvas duration={durationWithFrameRate} foreground-color="black" background-color="black" layer="1"/>);
			canvasSegment.Canvas = canvas;
			this.addSegmentToSequence(canvasSegment);
		}

		this.addSegmentToSequence = function(segment){
			this.sequence.Sequence += segment;
		}

		this.createSource = function(sourceIndex, filePath){
			return new XML(<Source identifier={sourceIndex}>
					<File location={filePath}/>
				</Source>);
		}

		this.addAudioMixToSource = function(source, sourceChannel, targetChannel, audioLevel){
			source.Mix += new XML(<Mix source={sourceChannel} target={targetChannel} level={audioLevel}/>);

			return source;
		}

		this.addSource = function(source){
			this.sources += source;
		}

		this.generateCml = function(){
			var cml = new XML(
			<Composition xmlns="Telestream.Soa.Facility.Playlist">
				{this.target}
				{this.sequence}
				{this.sources}
			</Composition>);

			return cml;
		}

	},
	/**
	 *
	 *  Will create a CMX3600EDL for use with MacCaption to cut/stich a SCC file based on
	 *	the Placing that is stitched in Conform for the Video asset.
	 *
	 *	Useful File Object
	 *	@author		Zec "Amazing" Larkin
	 *	@param		xml 			The placingXml which contains the parcel.
	 *	@param		usefulFileObj	The input SCC file as a usefulFileObj.
	 *	@param		usefulFileObj	The output EDL file as a usefulFileObj.
	 *  @param		fileStart		The start timecode coming out of Conform.
	 *	@return		boolean			Return true/false, depending on if the EDL was succesfully created.
	 */
	createCMX3600EDLfromParcel : function (placingXml, captionFile, outputFile, fileStart) {
		var placingId = placingXml..PlacingId.toString();
		var parcelFrameRate = placingXml..Parcel.FrameRate.toString();
		if (outputFile.exists()) remove(outputFile.unix_file);

		var dropFrameTimeCodes = ["DF30","DF60"]; // Extract out into settings file will be useful for other areas
		var allFrameRates = "all";
		var materialsToExclude = NBCGMO.waterMarkingMaterials[allFrameRates].concat(NBCGMO.vchipMaterials[allFrameRates]);

		// Create an array of unique material IDs found in the parcel, then look up their material types.
		// Save any that are promos so that we can skip them during the EDL creation loop.
		var promos = [];
		var parcelMaterials = [];
		for each(var trimMatId in placingXml..Parcel[0].ParcelEventList..TrimMaterialId) parcelMaterials.push(trimMatId.toString())
		parcelMaterials = parcelMaterials.filter(function(el, idx) { return parcelMaterials.indexOf(el) == idx });
		for each(var matId in parcelMaterials) {
			if (materialGet(matId)..MaterialType == "Promo") promos.push(matId)
		}

		// Add Project Name
		append(placingId, outputFile.unix_file);
		// Frame Code Mode (FCM)
		append(dropFrameTimeCodes.indexOf(parcelFrameRate) === -1 ? "FCM: NON-DROP FRAME" : "FCM: DROP FRAME", outputFile.unix_file);

		// Loop through building up the EDL (If Event is a still  (i.e. we've added black) we need to choose a Frame Label that won't appear on the Material so it'll be blank on the Output. Agreed to be 20:00:00:00
		var editEventNumber = 1;
		// May need to expand when multiple Materials appear and or Multi Frame Rate. May also need to add or subtract a frame if Inclusive / Exclusive mismatch
		for each(var parcelEvent in placingXml..Parcel[0].ParcelEventList.Event) {

			// Values from Event
			var matId = parcelEvent.TrimMaterialId.toString();
			if (materialsToExclude.indexOf(matId) > -1) {
				print("\nIgnoring Ancillary Material [" + matId + "]")
				continue;
			}
			var eventType = parcelEvent.EventType.toString();
			var frameRate = parcelEvent.FrameRate.toString();
			var javaFrameRate = Packages.com.pharos.microtime.FrameRate[String(frameRate)];

			// Skip promos
			if (promos.indexOf(matId) > -1) {
				print("\nIgnoring promo [" + matId + "]");
				continue;
			}

			var eventTrim = Packages.com.pharos.microtime.FrameLabel.parseText(javaFrameRate, parcelEvent.EventTrim.toString());
			if (eventType !== "Still") var eventOutcode = Packages.com.pharos.microtime.FrameLabel.parseText(javaFrameRate, parcelEvent.Outcode.toString());
			var eventDuration = Packages.com.pharos.microtime.AmountOfTime.parseText(javaFrameRate, parcelEvent.Duration.toString());
			var parcelOffset = Packages.com.pharos.microtime.AmountOfTime.parseText(javaFrameRate, parcelEvent.ParcelOffset.toString());

			var fileStart = Packages.com.pharos.microtime.FrameLabel.parseText(javaFrameRate, fileStart);
			//var destFileIncode = parcelOffset.toString();
			var destFileIncode = fileStart.add(parcelOffset); // Need to create it from Java so it has the add() method.
			var destFileOutcode = Packages.com.pharos.microtime.FrameLabel.parseText(javaFrameRate, destFileIncode.add(eventDuration));
			// Crazy out of Bound Frame Labels for Stills
			var outOfBoundFrameLabel = Packages.com.pharos.microtime.FrameLabel.parseText(javaFrameRate,"22:00:00:00");
			var outOfBoundOutCodeFrameLabel = outOfBoundFrameLabel.add(eventDuration);

			// Decide where Source Time Codes come from based upon Event Type
			if (eventType !== "Still") {
				var sourceFileIncode = eventTrim;
				var sourceFileOutcode = eventOutcode;
			} else {
				var sourceFileIncode = outOfBoundFrameLabel;
				var sourceFileOutcode = outOfBoundOutCodeFrameLabel;
			}

			var edlLine =
				zeroPad(editEventNumber,3) 	+ 	// Event number, increments from 0
				gmoNBCFunc.makeMeSpaces(1) 	+ 	// Blank Space
				"VANTAGE_" 					+ 	// Variable for use in CMX3600 format.
				gmoNBCFunc.makeMeSpaces(1) 	+ 	// Blank Space
				"V" 						+ 	// Indicate's Video
				gmoNBCFunc.makeMeSpaces(5) 	+ 	// Blank Space
				"C" 						+ 	// Operator to "Cut" mode.
				gmoNBCFunc.makeMeSpaces(8) 	+ 	// Blank Space
				sourceFileIncode 			+	// Source File Incode
				gmoNBCFunc.makeMeSpaces(1) 	+ 	// Blank Space
				sourceFileOutcode 			+	// Source File Outcode
				gmoNBCFunc.makeMeSpaces(1) 	+ 	// Blank Space
				destFileIncode 				+ 	// Dest File Incode
				gmoNBCFunc.makeMeSpaces(1) 	+ 	// Blank Space
				destFileOutcode;			 	// Dest File Outcode

			append(edlLine,	outputFile.unix_file);

			// Increase Edit Event
			editEventNumber++;

		}

		// Still Developing but need to fool Maccaption by referecing
		append(">>> SOURCE VANTAGE_ VANTAGE_TAPE 060a2b340101010101010f00-13-00-00-00-{000000b9-e4a7-9eb2-060e2b347f7f2a80%}", outputFile.unix_file);
		append("", outputFile.unix_file);
		append("* Reel VANTAGE_ '" + captionFile.filename + "'", outputFile.unix_file);

		if (outputFile.exists()){
			return true;
		} else {
			return false;
		}
	},
	getOutputFileName : function(placingXml, fileType,sourceFileTag){
		
		var debug = true;
		var mainMaterialId = this.findMainMaterialId(placingXml);
		//var materialXml = materialGet(mainMaterialId, "brand", "series", "episode", "shorttext", "tag", "fulltext", "tracktypelinks");
		var materialXml = gmoNBCFunc.materialGetFull(mainMaterialId);

		// Variables to make the E4X expressions smaller below.
		var materialObj = materialXml..Material;
		var materialSt = materialObj.ShortTextList.ShortText;

		var episodeObj = materialObj.Episode;
		var episodeSt = episodeObj.ShortTextList.ShortText;

		var seriesObj = episodeObj.Series;
		var seriesSt = seriesObj.ShortTextList.ShortText;

		var brandObj = seriesObj.Brand;
		var brandSt = brandObj.ShortTextList.ShortText;

		var placingSt = placingXml..ShortTextList.ShortText;

		// If its a caption file, we may need the language code. Lets work out what Caption Track Type was used for the placing.
		// We can then get its language code from the TTL.
		var sideCarFileTag;
		if (fileType == "Caption"){
			var captionTtlName = this.checkMatchedTrackTypeForTrackTypeClass(placingXml, mainMaterialId, "Subtitle");
			var fileTag = materialXml..TrackTypeLink.(TrackTypeName == captionTtlName).TrackType.FileTag.toString();
			sideCarFileTag = fileTag.replace("CCA_", "");
			var langCode = fileTag.substr(0,2).toLowerCase() + fileTag.substr(2,4).toUpperCase();

		}

		var seperators = ["-", "_"];

		// Maps the file type (Caption, Video, TGZ, etc) to a Content Name.
		var contentFileNameMapping = {
			"Video"		:	"CONTENT",
			"Caption"	:	"Full_Caption",
			"Trailer"	:   "TRAILER"
		}

		// Frame Rate mappings, customers want to see "2997", "2398" not "DF30" or "P23_976".
		var frameRateMapping = {
			"DF30"		:	"2997",
			"NDF25"		:	"25",
			"P23_976"	:	"2398"
		}
		var frameRateMappingInCaps = {
			"DF30"		:	"2997DF",
			"NDF25"		:	"25NDF",
			"P23_976"	:	"2398NDF"
		}

		getVersion = function(){
			pad = '00';
			var deliveryRevision = getRevisionFromPlacingXML();
			deliveryRevision ++;
			deliveryRevision = (pad + deliveryRevision).slice(-pad.length);
			return deliveryRevision;
		}

		getVVersion = function(){
			deliveryRevision = getRevisionFromPlacingXML();
			if(deliveryRevision>=1) {
			    deliveryRevision ++;
				deliveryRevision = "V"+deliveryRevision;
			}else{
				deliveryRevision = ""
			}
			return deliveryRevision;
		}

		getRevisionFromPlacingXML = function(){
			var deliveryRevisionShortTextType = "Delivery Revision";
			var deliveryRevision = placingXml..ShortText.(ShortTextType.toString() == deliveryRevisionShortTextType).Value.toString();
			if(deliveryRevision =="")
				deliveryRevision = 0;
			else
				deliveryRevision = parseInt(deliveryRevision);
			return deliveryRevision;
		}

		// Work out if material is Textless and return TL or nothing.
		getTextlessValue = function(){
			var textLessVersionTypes = ["FTLESS"];
			var versionType = materialXml..VersionType.toString();

			if (textLessVersionTypes.indexOf(versionType.split("-")[1]) >= 0){
				return "TL"
			} else {
				return "";
			}
		}

		getOutputFrameRate = function(){
			var outputFrameRate = placingXml..PublicationDefinition.Presets.PresetList.Preset.TagList.Tag.(TagType == "NLD Output Frame Rate").Value.toString();
			// If Telecine and return to original, we will be setting the output frame rate to DF30.
			if (outputFrameRate == "Return to Original Frame Rate" && materialSt.(ShortTextType == "Telecine").Value.toString() == "true"){
				return "P23_976";
			} else if (outputFrameRate == "Same as Source" || outputFrameRate == "Return to Original Frame Rate"){
				return materialObj.FrameRate.toString();
			} else {
				return outputFrameRate;
			}
		}

		formatDate = function(dateTimeString){
			var dateString = dateTimeString.split('T')[0];

			var year = dateString.split('-')[0];
			var month = dateString.split('-')[1];
			var day = dateString.split('-')[2];

			return month + day + year.substr(2,4);
		}

		var gtmAirDate = gmoNBCFunc.resolveAlias("Material_GTM_Original_Air_Date", placingId);
		var smatAirDate = gmoNBCFunc.resolveAlias("Material_SMAT_Original_Air_Date_NAUS", placingId);
		var gcoAirDate = gmoNBCFunc.resolveAlias("Material_GCO_Original_Air_Date", placingId);
		var compassAirDate = gmoNBCFunc.resolveAlias("Material_Compass_Original_Air_Date", placingId);

		getAirDateLogic = function(){
			if (gcoAirDate != null && gcoAirDate != ""){
				return gcoAirDate
			} else if (compassAirDate != null && compassAirDate != ""){
				return compassAirDate
			} else if (smatAirDate != null && smatAirDate != ""){
				return smatAirDate
			} else if (gtmAirDate != null && gtmAirDate != ""){
				return gtmAirDate
			} else {
				return ""
			}
		}

		getAspectRatio = function(){
			var profileAspectRatio = gmoNBCFunc.resolveAlias("Placing_Profile_Aspect_Ratio", placingId);
			return gmoNBCFunc.lastSubstrBefore(gmoNBCFunc.lastSubstrAfter(profileAspectRatio, "("),")").replace(":", "");
		}

		getPrimaryGuest = function(){
			var smatEpisodeTitle = gmoNBCFunc.resolveAlias("Episode_SMAT_Episode_Title_ENGUS", placingId);
			output(smatEpisodeTitle);
			var primaryGuest = smatEpisodeTitle.split(",")[0].replace(" ", "");

			return primaryGuest;
		}
		getTVDEpisode = function(){
            		var tvdLastTwoDigits = placingSt.(ShortTextType == "TVD Production #").Value.toString().substr(-2);
            		return tvdLastTwoDigits;
        	}

		getTitle = function (placingId) {
			var type = materialXml..MaterialType.toString().toUpperCase();
			var title = "";
			print("getTitle(): Material Type is [" + type + "]");
			if (type == "EPISODIC") {
				var SMATTitle = gmoNBCFunc.resolveAlias("Brand_SMAT_Series_Title_ENGUS", placingId);
				print("SMAT Title is: [" + SMATTitle + "]");
				title = SMATTitle;
				if (!(gmoNBCFunc.isVarUsable(SMATTitle))) {
					print("getTitle(): SMAT Title is empty - checking GTM Title");
					var GTMTitle = gmoNBCFunc.resolveAlias("Brand_GTM_Show_Title", placingId);
					title = GTMTitle;
					if (!(gmoNBCFunc.isVarUsable(GTMTitle))) {
						print("getTitle(): GTM Title is empty - checking Compass Title");
						var CompassTitle = gmoNBCFunc.resolveAlias("Brand_Compass_Title", placingId);
						title = CompassTitle;
					}
				}
				print("title is : " + title);
				return title;
			} else {
					return materialXml..Material.Title.toString();
			}
		}

		getSideCarContentTypeLang = function(sideCarFileTag){
			if(fileTag!="" && typeof fileTag !="undefined" ){
				var languageTag = fileTag.slice(fileTag.indexOf('_')+1);
				var type = fileTag.slice(0,fileTag.indexOf('_'));
				var surroundFileType = ["SFR","SRE","SCN"];
				if(surroundFileType.indexOf(type)>=0){
					type = "SUR-51"
				}else {
					type = "STE"
				}
				return type + "_" + languageTag;
			}
			return "";
		}

		getAudioGroup = function(trackTypeName){

			if (trackTypeName.toString().indexOf('Surround')>-1){
				return "51";
			}

			return "20";
		}

		getLanguageAudioGroup = function(placingId,includeAudioGroup){
			var audioTrackString = "";
			var matchedProfileTrackTypes = [];
			var audioPrefixes = [];
			var placingHelper = new PlacingHelper(placingId);
			var ph = new ProfileHelper();
			ph.initialize();

			if (placingHelper.isRestoreAndDeliverFromPlacingShortText()) {
				print("Pulling Audio Tracks From Source Material due to Restore and Deliver.");
				var mediaObj = placingHelper.getUsableMediasForMaterial(placingHelper.getMainMaterial());
				var videoMedia = mediaObj["Video"];
				var videoTrack = videoMedia["Track"];
				for each (var td in videoTrack.TrackDefinition) {
					matchedProfileTrackTypes.push(td.TrackTypeName.toString());
				}
			} else {
				var matchedProfile = placingHelper.getShortTextValueByType("Matched Profile");
				if(gmoNBCFunc.isVarUsable(matchedProfile)){
					ph.setProfile(matchedProfile);

					if(ph.isProfileHasSideCarAudioReq()){
						matchedProfileTrackTypes = ph.getTrackTypes().filter(function(e){return ph.getSideCarTrackTypesForProfile().indexOf(e) < 0;});
					}else{
						matchedProfileTrackTypes = ph.getTrackTypes();
					}
				}
			}

			for (i = 0; i < matchedProfileTrackTypes.length; i++) {
				var trackTypeName = matchedProfileTrackTypes[i].toString();
				var result = ph.getTrackType(trackTypeName);
				if (result.ClassName.toString().toUpperCase() == "AUDIO"){
					var fileTag = result.FileTag.toString();
					var languageTag = fileTag.slice(fileTag.indexOf('_')+1);
					var mappedTag = gmoNBCFunc.getTagByTagTypeAndValue("Track Type Language Mapping",languageTag);
					if(gmoNBCFunc.isVarUsable(mappedTag)) {
						var outputString = mappedTag.Description.toString();
						var audioGroup = this.getAudioGroup(trackTypeName);
						if(includeAudioGroup && gmoNBCFunc.isVarUsable(audioGroup)){
							outputString = outputString + "_" + audioGroup;
						}
						audioPrefixes.push(outputString);
					}
				}
			}

			audioTrackString = audioPrefixes.filter(function(elem, index, self) {return index == self.indexOf(elem);}).join("_");
			return audioTrackString;
		}

		getAudioChannels = function(placingId){

			var audioChannels = "";
			var placingHelper = new PlacingHelper(placingId);

			try{
				if (placingHelper.isRestoreAndDeliverFromPlacingShortText()) {
					print("Pulling Total Number of Output Audio Channels From Source Material");
					var mediaObj = placingHelper.getUsableMediasForMaterial(placingHelper.getMainMaterial());
					var videoMedia = mediaObj["Video"]
				 	var videoTrack = videoMedia["Track"];
					audioChannels = gmoNBCFunc.totalNumberOfAudioChannelsOnTrack(videoTrack);
				} else {
					var matchedProfile = placingHelper.getShortTextValueByType("Matched Profile");
					print("Pulling Total Number of Output Audio Channels From Profile [" + matchedProfile + "]");
					var ph = new ProfileHelper();
					ph.initialize();
					ph.setProfile(matchedProfile);
					audioChannels = ph.getAudioChannelsForProfile();

					if(ph.isProfileHasSideCarAudioReq()){
						var trackTypes = ph.getSideCarTrackTypesForProfile();
						print("Output Channels Based on Profile ["+audioChannels+"]");
						audioChannels = parseInt(audioChannels) - (trackTypes.length * 2);
						print("Output Channels discarding Side Car Audio ["+audioChannels+"]");
					}
				}

				if(gmoNBCFunc.isVarUsable(audioChannels)){
					audioChannels = audioChannels + "CH";
				}else {
					audioChannels = "";
				}

			}catch(e){
				print("Exception in getAudioChannels"+e)
			}

			return audioChannels;
		}

		var normalizeFileNameFields = function(fieldValue){
			return fieldValue.replace(/[^A-Za-z0-9._-]/g,"");
		}
		checkIsStaticAndGetData =  function(fileNameField,fileNameTag){
			var tag = gmoNBCFunc.getTagByTagTypeAndValue(fileNameTag,fileNameField);
			if(tag==undefined){
				return "";
			} else {
				if(tag.Description.toString().toUpperCase().indexOf("STATIC")>=0){
					return tag.Value.toString();
				}
			}
			return "";
		}


		//checkin is a array which will be searched for each value in another array checkfor
		checkFieldsRequired = function(checkIn, checkFor) {
			var missing = [];
			for (var i = 0; i < checkFor.length; i++){
				if (gmoNBCFunc.contains(checkIn, checkFor[i])){
					missing.push(checkFor[i]);
				}
			}
			if (missing.length > 0) {
				print("Missing the required Fields for filenaming: " + missing);
				throw new Error("Missing required fields for filenaming: " + missing);
			}
		}

		// Each field maps to either static text, another mapping (i.e. DF30 = 2997) or to a E4X expression.
		// Fields can be prepended with there own seperator if needed, an additional seperator won't be added when constructing the filenames.
		// Currently we can get ANY field on the Material (Main one for the parcel), Episode, Series, Brand, or Placing.
		var fileNameMapping = {
			"Series #"		: 	seriesObj.SeriesNumber.toString(),
			//"Series Title"	: 	materialXml..Episode.Series.Title.toString(),
			"Series Title"	: 	brandObj.Title.toString(),
			"Episode #"		:	episodeObj.EpisodeNumber.toString(),
			"Episode Title"	:	episodeObj.Title.toString(),
			"Frame Rate"	:	frameRateMapping[materialObj.FrameRate.toString()],
			"Licensee Name"	:	placingXml..PublicationDefinition.Presets.PresetList.Preset.TagList.Tag.(TagType == "NLD Friendly Licensee Name").Value.toString(),
			//"SKU"			:	"SKU",
			"SKU"			:	brandSt.(ShortTextType == "Brand SKU").Value.toString(),
			"Content"		:	contentFileNameMapping[fileType],
			"Content + Format"		:	contentFileNameMapping[fileType] + "_" + placingSt.(ShortTextType == "Standard").Value.toString().substr(0,2),
			"Content + Frame Rate"	:	contentFileNameMapping[fileType] + frameRateMapping[materialObj.FrameRate.toString()],
			"Content + Frame Rate + Language Code"	:	contentFileNameMapping[fileType] + frameRateMapping[materialObj.FrameRate.toString()] + "_" + langCode,
			"Language Code"	:	langCode,
			"PO/AL #"		:	placingSt.(ShortTextType == "PO/AL #").Value.toString(),
			"Format"		:	placingSt.(ShortTextType == "Standard").Value.toString().substr(0,2),
			"TVD #"			:	placingSt.(ShortTextType == "TVD Production #").Value.toString(),
            "TVD_EPISODE#"   :  getTVDEpisode(),
            "Season # + TVD_EPISODE#" : gmoNBCFunc.resolveAlias("Series_SMAT_Season_Sequence", placingId) + getTVDEpisode(),
			"Season #"		:	seriesSt.(ShortTextType == "GTM Season Number").Value.toString(),
			"Compass Base Material ID"    :    materialSt.(ShortTextType == "Compass Material ID").Value.toString().replace(/^\+/, "").replace(/\+$/, ""),
			"TEST"			:	"TEST",
			"Version"		:	getVersion(),
			"V[Version]"		: getVVersion(),
			"Network"		:	"NBC",
			"NBCU"			:	"NBCU",
			"NBC"			:	"NBC",
			"GMO"			:	"GMO",
			"Season + Season #" 	:	"Season" + gmoNBCFunc.resolveAlias("Series_SMAT_SAFE_Season_ID", placingId),
			"Ep + Episode #" 		:	"Ep" + gmoNBCFunc.resolveAlias("Episode_SMAT_Ep_Seq_w_Season_Only_Content", placingId),
			"TL"					:	getTextlessValue(),
			"Season + Episode #"	:	gmoNBCFunc.resolveAlias("Series_SMAT_Season_Sequence", placingId) + gmoNBCFunc.resolveAlias("Episode_SMAT_Ep_Seq_as_Broadcast", placingId),
			"SMAT Episode Title"	:	gmoNBCFunc.resolveAlias("Episode_SMAT_Episode_Title_ENGUS", placingId),
			"Output Frame Rate"		:	frameRateMapping[getOutputFrameRate()],
			"Output Frame Rate (Caps)"		:	frameRateMappingInCaps[getOutputFrameRate()],
			"Short Licensee Name"	:	placingXml..PublicationDefinition.Presets.PresetList.Preset.TagList.Tag.(TagType == "NLD Friendly Licensee Name").Value.toString(), // Asked Zec where this is stored.
			"SMAT Network"			:	gmoNBCFunc.resolveAlias("Brand_SMAT_Network_Name_-_Display", placingId),
			"SMAT Season #"				:	gmoNBCFunc.resolveAlias("Series_SMAT_Season_Sequence", placingId).replace(/[^0-9]/g, ""),
			"S[Season #]"			:	"S" + gmoNBCFunc.resolveAlias("Series_SMAT_Season_Sequence", placingId),
			"SMAT Series Title"		:	gmoNBCFunc.resolveAlias("Brand_SMAT_Series_Title_ENGUS", placingId),
			"Short Series Title"	:	gmoNBCFunc.resolveAlias("Brand_SMAT_Series_Title_ENGUS", placingId).substr(0,8),
			"Hayu Cross Ref #"		:   gmoNBCFunc.resolveAlias("Hayu_Cross_Ref_Number", placingId), 
			"Aspect Ratio"			:	getAspectRatio(),
			"GTM Original Air Date"	:	formatDate(gtmAirDate),
			"SMAT Original Air Date"	:	formatDate(smatAirDate),
			"TL Original Air Date"	:	formatDate(gcoAirDate),
			"Compass Original Air Date"	:	formatDate(compassAirDate),
			"Air Order"				: "", // Carlos to provide details
			"Air Date Logic"		:	formatDate(getAirDateLogic()),
			"Primary Guest"			:	getPrimaryGuest(),
			"Title" 				: 	getTitle(placingId),
			"GMO Mat ID"			: mainMaterialId,
			"LANG_GROUP"			: 	getLanguageAudioGroup(placingId,false),
			"LANGUAGE_AUDIO_GROUP"	: 	getLanguageAudioGroup(placingId,true),
			"Content Type + Lang"   : getSideCarContentTypeLang(sourceFileTag),
			"Licensee House ID"		:	placingXml..ShortText.(ShortTextType.toString() == "Licensee House ID").Value.toString(),
			"Output Audio Channels" : getAudioChannels(placingId),
			"CTV Short Series Name" : gmoNBCFunc.resolveAlias("CTV_Short_Series_Name", placingId),
			"SMAT Season ID" : gmoNBCFunc.resolveAlias("Material_SMAT_Season_ID",placingId),
			"SMAT: SAFE Season ID" : gmoNBCFunc.resolveAlias("Material_SMAT_Season_ID",placingId),
			"Original File Name" : gmoNBCFunc.getFileNameWithoutExt(gmoNBCFunc.resolveAlias("Material_Original_File_Name",placingId)),
			"Filename/VenID-iTunes" : gmoNBCFunc.resolveAlias("Material_SMAT_FilenameVenID-_iTunes_NA" + gmoNBCFunc.resolveAlias("Placing_Region", placingId),placingId),
			"metadata"        		:   "metadata",
			"Increment Image"		:  "INCRMNT-IMAGE",
			"Full"					:  "Full",
			"Trailer"				: "Trailer",
			"Mezz"					: "Mezz",
			"Image"					: "Image",
			"Caption"				: "Caption",
			"Subtitle"				: "Subtitle",
			"Source"				: "Source",
			"Preview"				: "Preview",
			"PM"					: "PM",
			"ME"					: "ME",
			"Nearfield"				: "Nearfield",
			"Theatrical"			: "Theatrical",
			"GTM Brand Sku"		: gmoNBCFunc.resolveAlias("Material_SMAT_BRAND_SKU",placingId),
			"SMAT Provider Name" : gmoNBCFunc.resolveAlias("Material_SMAT_Provider_Name",placingId),
			"EIDR"				 : placingSt.(ShortTextType == "EIDR").Value.toString().split("/")[1],
			"Video Checksum"	 : placingSt.(ShortTextType == "Video Checksum").Value.toString()
		}

		//  Make it ETL Metadata field aware
		var fileNameTag;
        var seperatorShortText;
		// 
        if (fileType != "" && fileType != null){
            if(fileType === "Package"){
                fileNameTag = "NLD Output Package Name"
                seperatorShortText = "NLD Output Package Name Separator" 
			}else if(fileType === "ETLMetadata"){
				fileNameTag = "Metadata Filename " + sourceFileTag.toString() ;
				seperatorShortText = "Metadata Filename separator "  + sourceFileTag.toString();
				print("Metadata filename tag " + fileNameTag);
				print("Metadata separator "+ seperatorShortText);
			}		
			else {
                fileNameTag = "NLD " + fileType + " Output Filename";
                seperatorShortText = "NLD " + fileType + " Output Filename Seperator";
            }    
        } else {
            throw new Error("No file type specified for rename file.")
        }
		var destFileName = "";
		var fileNameFields = placingXml..PublicationDefinition.Presets.PresetList.Preset.TagList.Tag.(TagType == fileNameTag).Value;
		var fileNameSeperator = placingXml..PublicationDefinition.Presets.PresetList.Preset.ShortTextList.ShortText.(ShortTextType == seperatorShortText).Value.toString();
		// Loop through each field, normalzie it (RegEx only allows A-Z, a-z, 0-9, -, _, .).
		// A seperator is added if its not the first event and doesn't have its own seperator at the first character.
		// Then the normalzied field is added using the mapping from above.
		var emptyOrNullNameFields = [];
		var excludeFromEmptyCheck = ["V[Version]", "TL"];
		var failIfEmpty = ["Licensee House ID"];
		for (var i=0; i<fileNameFields.length(); i++) {
			var fileNameField = fileNameFields[i].toString();
			var fileNameValue = fileNameMapping[fileNameField]

			if (fileNameValue == undefined) {
				fileNameValue = checkIsStaticAndGetData(fileNameField, fileNameTag);
			} else {
				fileNameValue = normalizeFileNameFields(fileNameValue);
			}

			if(fileNameValue == "" || fileNameValue == null){
				if(!gmoNBCFunc.contains(excludeFromEmptyCheck,fileNameField)){
					emptyOrNullNameFields.push(fileNameField);
				}
			}
			output("Value for [" + fileNameField + "] is [" + fileNameValue + "]")

			// If it has a seperator prepended to it, lets not add another seperator.
			// Also if its the first field, lets not add a seperator either.
			if (i != 0 && fileNameValue!="" && seperators.indexOf(fileNameValue.substr(0,1)) < 0){
				destFileName += fileNameSeperator;
			}
			destFileName += fileNameValue;
		}

		if(emptyOrNullNameFields.length > 0){
			print("EMPTY FIELD ERROR: Cannot construct valid filename for placing. Sending to [Packaging Error] . The following field(s) are empty or null: " + emptyOrNullNameFields);
			checkFieldsRequired(failIfEmpty, emptyOrNullNameFields);
		}

		output("Destination Filename is [" + destFileName + "]");

		return destFileName;
	},

	getDestFilePathDetails : function(placingXml, currentWorkingFolder, fileType, ext, settings, sourceFileTag) {
        var path;
        var slash = "/";
        var dot = ".";
        var packageReq = false;
        var debug = true;
        output("Generating Output File name for " + fileType + "file");
        var outputFileName = this.getOutputFileName(placingXml, fileType, sourceFileTag);
        
        // find out if a folder is required 
        if (settings.packageName.length > 0){
            output("A package is required");
            packageReq = true;
            var outputPackageName = this.getOutputFileName(placingXml, "Package");
            if(debug) output("packageName: " + outputPackageName);
            
            var packageFormat = settings.packageFormat; 
            if(debug) output("packageFormat" + packageFormat);
            
            var fullPackageName = outputPackageName + dot + packageFormat;
            if(debug) output("fullPackageName" + fullPackageName);
            
            path = currentWorkingFolder + fullPackageName + slash + outputFileName + dot + ext; 
            //path = currentWorkingFolder + outputPackageName + slash + outputFileName + dot + ext; 
			if (debug) output("Dest File Path" + path);
		} else {
            path = currentWorkingFolder + outputFileName + dot + ext; 
            if (debug) output("Dest File Path" + path);
        }
        
        var destFile = new gmoNBCFunc.usefulFileObj(path);
        gmoNBCFunc.makeDirectory(destFile.unix_path);
        return {
            "destFilePath" : destFile,
            "packageReq" : packageReq,
            "packageFileName" : outputPackageName, 
            "packageFormat" : packageFormat,
            "fullPackageName" : fullPackageName
        }    
        
    },
        

	checkMatchedTrackTypeForTrackTypeClass : function(placingXml, matId, trackTypeClassName) {
		var matchedTrackTypes = this.getMatchedProfileTrackTypes(placingXml, matId);

		for each (var trackType in matchedTrackTypes){
			trackType = trackType.toString();
			var cmd =
				<PharosCs>
					<CommandList>
						<Command subsystem="trackType" method="get">
							<ParameterList>
								<Parameter name="trackTypeName" value={trackType}/>
							</ParameterList>
						</Command>
					</CommandList>
				</PharosCs>;
			var result = wscall(cmd)..Output;
			if (trackTypeClassName == result.TrackType.ClassName.toString()){
				return trackType;
			}
		}
	},

	checkMatchedTrackTypeForTrackTypeFileTag : function(placingXml, matId, trackTypeClassName) {
		var matchedTrackTypes = this.getMatchedProfileTrackTypes(placingXml, matId);

		for each (var trackType in matchedTrackTypes){
			trackType = trackType.toString();
			var cmd =
				<PharosCs>
					<CommandList>
						<Command subsystem="trackType" method="get">
							<ParameterList>
								<Parameter name="trackTypeName" value={trackType}/>
							</ParameterList>
						</Command>
					</CommandList>
				</PharosCs>;
			var result = wscall(cmd)..Output;
			if (trackTypeClassName == result.TrackType.ClassName.toString()){
				return result.TrackType.FileTag.toString();
			}
			
		}
	},
	
	checkMatchedTrackType : function(placingXml, matId, trackTypeName) {
		var matchedTrackTypes = this.getMatchedProfileTrackTypes(placingXml, matId);

		for each (var trackType in matchedTrackTypes){
			trackType = trackType.toString();

			if (trackType == trackTypeName){
				return true;
			}
		}

		return false;
	},
	// Creates an array of useful file objects for delivery to a Pub Def
	// @param [string] (placingName) - Placing ID
	// @return [array] containing usefulFileObjects
	// @error if "Packaging" directory doest exists for a placingDir
	// @error if there are no files to deliver
	createContentDistDeliveryObjects : function(packagingDirectoryForPlacing) {

		// Files should ALWAYS be delivered out of Packaging

		if(!fileExists(packagingDirectoryForPlacing)) {
			throw new Error("Cannot find directory at [" + packagingDirectoryForPlacing + "]");
		}

		var filesToDeliverDir = new File(packagingDirectoryForPlacing).listFiles();
		var filesToDeliver = [];

		// Create a useful file object for each delivery
		for each(var fileToDeliver in filesToDeliverDir) {
			if(!fileToDeliver.isHidden()){
				filesToDeliver.push(new gmoNBCFunc.usefulFileObj(String(fileToDeliver)));
			}
		}

		if (filesToDeliver.length == 0) {
			throw new Error("Could not find any files for delivery in [" + packagingDirectoryForPlacing + "]");
		}

		return filesToDeliver;

	},
	saveDeliveryRevision : function(placingXml){
		var deliveryRevisionShortTextType = "Delivery Revision";
		var deliveryRevision = placingXml..ShortText.(ShortTextType.toString() == deliveryRevisionShortTextType).Value.toString();
		if(deliveryRevision =="")
			deliveryRevision = "0";

		deliveryRevision = parseInt(deliveryRevision);
		deliveryRevision++;

		this.savePlacingShortText(placingXml.PlacingId.toString(),deliveryRevisionShortTextType,String(deliveryRevision));
	},
	savePlacingShortText : function(placingId, shortTextType, shortTextValue){

		output("Adding Short Text Element [" + shortTextType + "] and [" + shortTextValue + "]");
		var xml =
			<Placing>
				<PlacingId>{placingId}</PlacingId>
				<ShortTextList>
					<ShortText>
						<ShortTextType>{shortTextType}</ShortTextType>
						<Value>{shortTextValue}</Value>
					</ShortText>
				</ShortTextList>
			</Placing>;
		return this.compilePlacing(xml);
	},
	savePlacingFullText : function(placingId, fullTextType, fullTextValue){

		output("Adding Full Text Element [" + fullTextType + "] and [" + fullTextValue + "]");
		var xml =
			<Placing>
				<PlacingId>{placingId}</PlacingId>
				<FullTextList>
					<FullText>
						<FullTextType>{fullTextType}</FullTextType>
						<Value>{fullTextValue}</Value>
					</FullText>
				</FullTextList>
			</Placing>;
		return this.compilePlacing(xml);
	},
	searchPlacingByDataElement : function(name,value,state) {
		var runReportXML =  <PharosCs>
			<CommandList>
				<Command subsystem="report" method="runReport">
					<ParameterList>
						<Parameter name="reportName" value="searchPlacingReport"/>
						<Parameter name="reportParameters">
							<Value>
							<CustomReportRuntimeParameters>
								<Parameters>
								<StringReportParameter>
									<Name>name</Name>
									<Operator>is</Operator>
									<Values>
										<String>{name}</String>
									</Values>
								</StringReportParameter>
								<StringReportParameter>
									<Name>value</Name>
									<Values>
										<String>{value}</String>
									</Values>
									<Operator>is</Operator>
								</StringReportParameter>
								<StringReportParameter>
									<Name>state</Name>
									<Values>
										<String>{state}</String>
									</Values>
									<Operator>is</Operator>
								</StringReportParameter>
								</Parameters>
							</CustomReportRuntimeParameters>
							</Value>
						</Parameter>
						<Parameter name="pageSize">
							<Value>
								<Integer>9999</Integer>
							</Value>
						</Parameter>
						<Parameter name="page">
							<Value>
								<Integer>1</Integer>
							</Value>
						</Parameter>
					</ParameterList>
				</Command>
			</CommandList>
		</PharosCs>
		//print("\n Report Query "+runReportXML);
	    var rtn = wscall(runReportXML);
		var rtnCount = parseInt(rtn..ResultList.PagedResults.Count);

		if (rtnCount >= 1) {
			print("Number of returned results is ["+rtnCount+"].");
		} else if (rtnCount == 0) {
			print("No Records Found ");
		}
		return rtn..ResultList;
	},

	// Method to remove the Placing's NLD Working Dir NOTE THIS IS RECURSIVE
	removePlacingNLDWorkingDir : function (placingId,removeAllCacheMaterials) {
		var placingHelper = new PlacingHelper(placingId);
		var placingXml = placingHelper.getPlacingXml();
    var cacheHelper = new CacheHelper(placingHelper);

		// Functionalise code below here
		var dotDir = ".dir/"
		var placingPath = lookup.nld["NLD_WORKING_DIR"].mount + placingId + dotDir;
		var nldWorkingPlacingFileObj = new File(placingPath);
		var nldFileObjPath = nldWorkingPlacingFileObj.getAbsolutePath() + "/"; // DO NOT REMOVE TRAILING SLASH
		var maxSubDirsAllowed = 7; //Currently a max of 7  Preprocessing, Conform, PostProcessing, Transcode, Packaging, Delivery, Component

		// Run some safety checks for the more neurotic among us
		print("\nInternal Re Order for Placing [" + placingId + "] Running safety checks before removing [" + nldFileObjPath  + "]");

		// Safety Check 1 - deletes will be actioned recursively check placingId isn't blank (could just check Placing if placing is false)
		if (placingId == null || placingId == false || placingId == undefined || placingId == "" || placingId.length == 0) {
			throw new Error("Cannot Decipher a Placing ID from value [" + placingId + "]");
		}

		print("\tSuccess: Valid Placing Id Formed [" + placingId + "]");
		if (removeAllCacheMaterials){
			for each (var nldCacheKey in placingXml..CacheKeys.Map..Entry.Value){
				nldCacheKey = nldCacheKey.toString();
				nldCacheMediaName = cacheHelper.getCacheMediaName(nldCacheKey);
				if (nldCacheKey != "TRANSCODE_REQUIRES_PRESETS" && nldCacheKey != "" && nldCacheKey != null && nldCacheMediaName!=null){
					print("Removing Cache track from MatId [" + nldCacheKey + "] from Media [" + nldCacheMediaName + "]");
					gmoNBCFunc.materialTrackDelete(nldCacheKey, nldCacheMediaName);
				}
			}
		}

		// Safety Check 2 - Check Path Exists
	    if (nldWorkingPlacingFileObj.exists() == false) {
			print("Specified Path [" + nldFileObjPath + "] does not exist");
			return;
		}

		print("\tSuccess: Working Path [" + nldFileObjPath + "] exists");

		// Safety Check 3 - Check Path is a directory
		if (nldWorkingPlacingFileObj.isDirectory() == false) {
			throw new Error("Specified Path [" + nldFileObjPath + "] is not a directory");
		}

		print("\tSuccess: Working Path [" + nldFileObjPath + "] is a directory");

		// Safety Check 4 - check there aren't more directories than expected.
		if (nldWorkingPlacingFileObj.list().length > maxSubDirsAllowed) {
			throw new Error("Number of Sub Directories [" + nldWorkingPlacingFileObj.list().length + "] only allowed to delete a maximum of [" + maxSubDirsAllowed + "]");
		}

		print("\tSuccess: Working Path [" + nldFileObjPath + "] has fewer than [" + maxSubDirsAllowed + "]  sub-directories.");

		// ** Delete here - no going back**
		print("\nIssuing recursive delete for [" + nldFileObjPath + "]");
		rmdir(nldFileObjPath,true);

		if (fileExists(nldFileObjPath)) {
			throw new Error("Failed to delete [" + nldFileObjPath + "]");
		}

		print("Successfully removed [" + nldFileObjPath + "]");

	},

	removePlacingNLDPackagingDir : function (packagingPath) {
		var nldPackagingPlacingFileObj = new File(packagingPath);
		var nldFileObjPath = nldPackagingPlacingFileObj.getAbsolutePath() + "/"; // DO NOT REMOVE TRAILING SLASH
		// Safety Check 3 - Check Path is a directory
		if (nldPackagingPlacingFileObj.isDirectory() == false) {
			print("Specified Path [" + nldFileObjPath + "] is not a directory");
			return;
		}
		print("\nIssuing recursive delete for [" + nldFileObjPath + "]");
		rmdir(nldFileObjPath,true);
		if (fileExists(nldFileObjPath)) {
			throw new Error("Failed to delete [" + nldFileObjPath + "]");
		}

		print("Successfully removed [" + nldFileObjPath + "]");

	},
	generateHtmlPlacingEmailBody : function (placingXml,isFailure,sourceFilesString,message){
		var tagType = placingXml..TagList.Tag.(TagType.toString() == "PO/AL Type").Value.toString();
		var licenseNumber = placingXml..ShortText.(ShortTextType.toString() == "Licensee Number").Value.toString();
		var tagTypeNumber = placingXml..ShortText.(ShortTextType.toString() == "PO/AL #").Value.toString();
		var tvdProductionNumber = placingXml..ShortText.(ShortTextType.toString() == "TVD Production #").Value.toString();
		var placingHelper = new PlacingHelper(placingXml.PlacingId.toString());
		var placingStatus = placingHelper.getPlacingState();

		var shortTextElementsForEmail = [
			'Work Order Title',
			'Licensee',
			'Licensee Category',
			'TVD Production #',
			'Due Date',
			'Requestor Name'
		];

		var shortTextElementsLookedUp = [];
	
		for (var i = 0; i < shortTextElementsForEmail.length ; i++) {
			//Custom logic per MFA 427/MFA-805 
			//  "Work Order Title" field from the Material Card using a "Seasons Title" field + "Episode Title" field.
			if (shortTextElementsForEmail[i] == 'Work Order Title') {
				var mainMaterial = placingHelper.getMainMaterial();
				var materialXML = materialGet(mainMaterial, "episode")..Output.Material;
				var seasonsTitle = materialXML.Episode.Series.Title.toString();
				var episodeTitle =  materialXML.Episode.Title.toString();
				if (gmoNBCFunc.isVarUsable(seasonsTitle) && gmoNBCFunc.isVarUsable(episodeTitle) ) {
					var shortTextElementValue = seasonsTitle + " > " + episodeTitle;
					} else {
					//Fallback to the old method of "Work Order Title Shorttext, which is better than nothing"
						var shortTextElementValue =  placingXml..ShortText.(ShortTextType.toString() == shortTextElementsForEmail[i]).Value.toString();
					}
			} else 	{
				var shortTextElementValue =  placingXml..ShortText.(ShortTextType.toString() == shortTextElementsForEmail[i]).Value.toString();
			}


			if (gmoNBCFunc.isVarUsable(shortTextElementValue)) {
				shortTextElementsLookedUp.push(shortTextElementValue);
			// Set to undefined to keep things lined up, output loop runs gmoNBCFunc.isVarUsable to skip empty value rows
			} else {
				shortTextElementsLookedUp.push(undefined);
			}
		}

		var successOrFailure = "";
		!isFailure ? successOrFailure = "Success" : successOrFailure = "Failure";

		var emailHeader = "Mediator " + placingStatus + " " + successOrFailure + " Notification";
		var emailMessage = successOrFailure + " "  + placingStatus + " for Placing "+placingXml.PlacingId.toString()+ " \n\n";


		var emailHtml = <html>
			<body style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans; font-size:15px;margin:0 auto ;border: 0;">
				<div style="margin: 20px auto;width: 980px;">
					<div style="vertical-align:middle;padding-top:5px;"><h3 style="text-align: center;"><strong>{emailHeader}</strong></h3></div>
					<p style="text-align: center;">{emailMessage}</p>
					<br></br>
				</div>
			</body>
		</html>;

		var emailTable = <table style="width:100%;line-height: 1.5;height: 15%;">
			</table>;

		emailTable.appendChild(this.generateHtmlTableRow('Placing ID #',placingXml.PlacingId.toString()));

		for (var j = 0; j < shortTextElementsForEmail.length; j++ )  {
			if(gmoNBCFunc.isVarUsable(shortTextElementsLookedUp[j])) {
				emailTable.appendChild(this.generateHtmlTableRow(shortTextElementsForEmail[j], shortTextElementsLookedUp[j]));
			}
		}

		emailTable.appendChild(this.generateHtmlTableRow('Placing Status',placingXml.StateName.toString()));
		if(sourceFilesString != ""){
			emailTable.appendChild(this.generateHtmlTableRow('File List',sourceFilesString));
		}
		if(message != ""){
			emailTable.appendChild(this.generateHtmlTableRow(successOrFailure +' Message',message));
		}

		emailHtml..div[0].appendChild(emailTable);
		return emailHtml;
	},

    sendGenericPlacingEmail: function(placingXml, isFailure, sourceFilesString, message, pipeLineEmails){
		var placingId = placingXml.PlacingId.toString();
		var placingHelper = new PlacingHelper(placingId);
		var placingStatus = placingHelper.getPlacingState();
		var settings = placingHelper.getSettings();

		var successOrFailure = "";
		!isFailure ? successOrFailure = "Success" : successOrFailure = "Failure";

		var emailSubject = placingStatus + " " + successOrFailure + " for [" + placingId + "] Notification";
		var emailBody = this.generateHtmlPlacingEmailBody(placingXml,isFailure,sourceFilesString,message);

		// Get the list of emails to send to for a failure.
		var emailAddresses = this.getDefaultEmailAddresses(isFailure,placingStatus);

        if (pipeLineEmails != "" && pipeLineEmails !== undefined) {
            for each (var email in pipeLineEmails) {
                print("Adding Email [" + email + "] to lits of emails to send to.");
                emailAddresses.push(email);
            }

		}

		//Sending E-mail
		var emailTo = emailAddresses.join(";");

		print("------------------\n" +
		"Sending Email \n" +
		"To: " + emailTo + "\n" +
		"\n" +
		"Subject: " + emailSubject + "\n" +
		"Body: " + "\n" +
		emailBody + "\n" +
		"------------------\n"
		);

		if (emailTo != null && emailTo != "" && emailTo != []){

			var result = gmoNBCFunc.sendCustomEmail(emailTo, emailSubject, emailBody);
			print("Email Job Created Succesfully, Job Id [" + result..Output.Integer.toString() + "]");
		} else {
			print("WARNING: No email job created cause the 'To Email Address' was not supplied.");
		}

	},

	 getDefaultEmailAddresses : function(isFailure,state) {
        var defaultAddressList = [];
        if (!isFailure && (state == "Delivery" || state == "Delivered" )) {
                print("getDefaultEmailAddresses(): Getting Default Email Addresses for Success");
                var emailAddressList = gmoNBCFunc.getTagsForType("NLD Pipeline Success Email Addresses");
            } else {
                print("getDefaultEmailAddresses(): Getting Default Email Addresses for Failure");
                var emailAddressList = gmoNBCFunc.getTagsForType("NLD Pipeline Support Email Addresses");
            }
            for each (var emailAddress in emailAddressList) {
                print("getDefaultEmailAddresses(): Adding Email [" + emailAddress + "] to list of emails to sent to.");
                defaultAddressList.push(emailAddress);
            }
        return defaultAddressList;
    },

    generateHtmlTableRow : function(name,value){
		var tableRow = <tr align="left">
			<th style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;" >{name}</th>
			<td style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;">{value}</td>
		</tr>;
		return tableRow;
	},
	/**
	 ** Creates a note on the placing with the status of the required tracks for its profile.
	 ** @param placingID : The ID of the placing to create the note for.
	 **/
	 profileStatusNoteWritten : false,
	createProfileStatusNote : function(placingID) {

		var placingHelperObj = new PlacingHelper(placingID);

		var placingXML = placingHelperObj.getPlacingXml();

		function getPubDefXML(name) {

			return wscall(
				<PharosCs>
				  <CommandList>
					<Command subsystem="placing" method="getPublicationDefinition">
					  <ParameterList>
						<Parameter name="publicationDefinition">
						  <Value>
							<PublicationDefinition>
							<Name>{name}</Name>
							</PublicationDefinition>
						  </Value>
						</Parameter>
					  </ParameterList>
					</Command>
				  </CommandList>
				</PharosCs>
			);

		};

		var pubDefinitionName = placingXML.PlacingPublicationList.PlacingPublication.PublicationDefinition.Name.toString();

		var pubDefXML = getPubDefXML(pubDefinitionName);

		function makeMaterialTypeProfileMap(pubDefXML) {

			var mapObj = {};

			for each(var entry in pubDefXML.CommandList.Command.Output.PublicationDefinition.MaterialTypeProfileMap.LinkedHashMap.Entry) {
				mapObj[entry.Key.toString()] = entry..String[0].toString();
			}

			return mapObj;
		}

		var profileMap = makeMaterialTypeProfileMap(pubDefXML);


		var parcelEvents = placingHelperObj.getParcelEventObj();

		function filterUnique(parcelEvents) {

			var events = {};

			for each(var parcel in parcelEvents) {

				for each (var vent in parcel["eventObjList"]) {

					events[vent["matId"]] = vent["matId"];

				}

			}
			return events;
		}

		var matIDs = filterUnique(parcelEvents);


		for each(var matid in matIDs) {

			var materialHelperObj = new gmoNBCFunc.materialHelper(matid);

			var actualTTL_XML = materialHelperObj.getTrackTypeLinkXmlList();

			var matType = materialHelperObj.getMaterialType();

			var profileName = profileMap[matType];

			var profileHelperObj = new ProfileHelper();
			profileHelperObj.setProfile(profileName);
			profileHelperObj.initialize();

			var unavailableTT = profileHelperObj.evaluateTrackTypesAgainstSetProfile(actualTTL_XML,"Ready");

			if(unavailableTT.length > 0) {

				var noteString = "";
				noteString += "Profile: "+profileName+"\n";

				for each(var pair in unavailableTT) {

					var key;
					for(key in pair);
					var val = pair[key];
					noteString += key+" : "+val+"\n";

				}

				gmoNBCFunc.saveNote(
					"Placing",
					placingID,
					"Awaiting Components",
					"ERROR",
					"AVERAGE",
					noteString
				);
			}

		}

		this.profileStatusNoteWritten = true;
	},

	getProfileCaptionMap : function(placingXml, matId, presetSettings) {
		output("Building Profile Caption Map");
		// Get caption method(s) from preset.
		var captionMethod = presetSettings.captionMethod;

		// This is to support backwards compatibility if "captionMethod" is defined for older created presets.
		if (captionMethod == "" || captionMethod == null){
			var embeddedCaption1 = presetSettings.embeddedCaption1;
			var embeddedCaption2 = presetSettings.embeddedCaption2;
			var sidecarCaption1 = presetSettings.sidecarCaption1;
			var sidecarCaption2 = presetSettings.sidecarCaption2;
		} else if (captionMethod == "Embedded"){
			var embeddedCaption1 = "CC1";
			var embeddedCaption2 = "None";
			var sidecarCaption1 = "None"
			var sidecarCaption2 = "None";
		} else if (captionMethod == "Sidecar - SCC"){
			var embeddedCaption1 = "None";
			var embeddedCaption2 = "None";
			var sidecarCaption1 = "SCC"
			var sidecarCaption2 = "None";
		} else if (captionMethod == "Sidecar - CAP"){
			var embeddedCaption1 = "None";
			var embeddedCaption2 = "None";
			var sidecarCaption1 = "CAP"
			var sidecarCaption2 = "None";
		} else {
			var embeddedCaption1 = "None";
			var embeddedCaption2 = "None";
			var sidecarCaption1 = "None"
			var sidecarCaption2 = "None";
		}

		var captionMapping = {
			"embeddedCaption1" : {
				captionMethod : embeddedCaption1,
				captionMethodType : "Embed",
				trackTypeName : "",
				trackTypeFileTag : "",
				captionFile : ""
			},
			"embeddedCaption2" : {
				captionMethod : embeddedCaption2,
				captionMethodType : "Embed",
				trackTypeName : "",
				trackTypeFileTag : "",
				captionFile : ""
			},
			"sidecarCaption1" : {
				captionMethod : sidecarCaption1,
				captionMethodType : "Sidecar",
				trackTypeName : "",
				trackTypeFileTag : "",
				captionFile : ""
			},
			"sidecarCaption2" : {
				captionMethod : sidecarCaption2,
				captionMethodType : "Sidecar",
				trackTypeName : "",
				trackTypeFileTag : "",
				captionFile : ""
			}
		};

		// Get the publication definition so we can find the profile name.
		var pubDefName = placingXml.PlacingPublicationList.PlacingPublication.PublicationDefinition.Name.toString();
		var pubDef = this.getPubDef(pubDefName);

		// Get the material type to use.
		var materialXml = materialGet(matId);
		var materialType = materialXml..MaterialType;

		// Get the top matched profile to work with.
		//We should look at the Matched Profile And not the Top Profile

		var topMatchedProfileName = this.getMatchedProfileName(placingXml,matId);
		output("Using Profile [" + topMatchedProfileName + "]");
		if(topMatchedProfileName == undefined){
			//throw new Error("Required Components are not in ready state or not available on the Material, sending to Awaiting Components until they arrive.");
			this.createProfileStatusNote(placingXml.PlacingId.toString());
			throw new Error(
				"Required Components are not in ready state or not available on the Material, sending to Awaiting Components until they arrive.");
		}

		var topMatchedProfile = this.getProfile(topMatchedProfileName.toString());

		var matchedTrackTypeNum = 0;
		var captionMethodNum = 0;
		for each (var ccTrackType in topMatchedProfile..TrackType.(ClassName == "Subtitle")){
			ccTrackTypeName = ccTrackType.Name.toString();
			ccTrackTypeFileTag = ccTrackType.FileTag.toString();
			output("Checking where [" + ccTrackTypeName + "] goes in the mapping.");
			for (key in captionMapping){
				if (captionMapping[key].captionMethod != "None" && captionMapping[key].trackTypeName == ""){
					// Check that the track type is valid for the matched profile (not just the top profile).
					if (captionMapping[key].trackTypeName != "Blank" && this.checkMatchedTrackType(placingXml, matId, ccTrackTypeName)){
						captionMapping[key].trackTypeName = ccTrackTypeName;
						captionMapping[key].trackTypeFileTag = ccTrackTypeFileTag;

						captionMethodNum++;
						break;
					} else {
						captionMapping[key].trackTypeName = "Blank";
					}
				}
			}

			matchedTrackTypeNum++;
		}

		if (matchedTrackTypeNum == 0){
			for (key in captionMapping){
				if (captionMapping[key].captionMethod != "None"){
					captionMethodNum++;
				}
			}
		}

		if (matchedTrackTypeNum != captionMethodNum){
			throw new Error("Number of Caption Track Types in top profile [" + matchedTrackTypeNum + "] does not match the number of selected Caption Methods [" + captionMethodNum + "]");
		}

		return captionMapping;
	},

	getAllProfiles : function(){
		var xml =
			<PharosCs>
				<CommandList>
					<Command subsystem="trackType" method="searchProfile"/>
				</CommandList>
			</PharosCs>;

		return(wscall(xml)..Output);
	},

	getProfile : function(profileName){
		var allProfiles = this.getAllProfiles();

		for each (var profile in allProfiles.Profile){
			if (profile.Name.toString().toLowerCase() == profileName.toLowerCase()){
				return profile;
			}
		}
	},

	checkTelecineAndSelectFrameRate : function(materialXml){
		var isTelecine = materialXml..Material.ShortTextList.ShortText.(ShortTextType == "Telecine").Value.toString();
		var frameRate = "Same as Source"
		var cadencePattern = materialXml..Material.ShortTextList.ShortText.(ShortTextType == "Cadence Pattern").Value.toString();
		if(isTelecine == "true"){
			frameRate = "P23_976"
		}
		return frameRate;
	},
	/**
	 * [getParcelDuration Calculates the Duration from Parcel Events]
	 * @param  {[E4X XML]} placingXml [Placing XML With Parcel]
	 * @return {[String]}            [duration]
	 */
	getParcelDuration : function(placingXml){
		var duration = "";
		for each (var event in placingXml..ParcelEventList.Event){
			if(event.Stream.toString()=='nld video'){
				if(duration) {
					duration = duration.add(AmountOfTime.parseText(event.Duration.@rate,event.Duration.toString()));
				}
				else{
					duration = AmountOfTime.parseText(event.Duration.@rate,event.Duration.toString());
				}
			}
		}
		print("Parcel Duration is ["+duration+"]");
		return duration.toString();
	},

	normalizeText : function(text){
		return text.replace(/[^A-Za-z0-9 ]/g,"");
	},

	getNLDVersionTypeDescription : function(versionType){
		var mapping = {

			"OM-FTEXTED"   : "Texted",
			"OM-FTLESS"    : "Textless",
			"OM-TATEND"    : "Textless at End",
			"OM-TELEMENTS" : "Textless Elements",
			"LM-FTEXTED"   : "Texted",
			"LM-FTLESS"    : "Textless",
			"LM-TATEND"    : "Textless at End",
			"LM-TELEMENTS" : "Textless Elements"
		}
		return mapping[versionType];
	},

	getEndPointFromLoadBalancer: function(type,group){

		if(group.indexOf("LB_GROUP")<=-1){
			print("Not a Load Balanced Group - Returning Same Info ["+group+"]");
			return group;
		}

		if(typeof(LoadBalancer)==="undefined"){
			load("/opt/evertz/mediator/etc/runners/LoadBalancer.js");
		}
		var lb = new LoadBalancer()
		lb.setType(type);
		lb.setTagType(group);
		return lb.getEndPoint();
	},

	getProfileTrackTypes : function(profileName) {
		print("getMatchedProfileTrackTypes.profileName(): " + profileName);

		var rtnXml = wscall(<PharosCs>
				<CommandList>
					<Command subsystem="trackType" method="searchProfile"/>
				</CommandList>
			</PharosCs>);

		for each (var profile in rtnXml..Profile) {
			if (profile.Name.toString() == profileName) {
				print("Found Profile in Configured System Profiles for [" + profileName + "]");
				return profile..TrackType;
			}
		}
	},
	/**
	 * [findBarsAndToneFile By different critera]
	 * @param  {[String]} barsAndTonesMatId
	 * @return {[String]} barsAndTonesFileName
	 */
	getBarsAndToneStagingTrack: function (barsAndTonesMatId){
		var barsAndTonesTrack = <Track>
			<MediaName>DC_NLDStaging</MediaName>
			<FileId>{barsAndTonesMatId}</FileId>
			<FileExtension>mov</FileExtension>
			<TrackDefinitions>
				<TrackDefinition>
					<TrackType>
						<Name>Video</Name>
						<ClassId>VIDEO</ClassId>
					</TrackType>
				</TrackDefinition>
				</TrackDefinitions>
			</Track>
		return barsAndTonesTrack;
	},

	getCustomHeaderImageFileName: function(ancillaryMatId,mainMaterialId){
		var mainMaterialXML = materialGet(mainMaterialId, "tracks");
		var frameRate = mainMaterialXML..FrameRate.toString();
		var medias = mainMaterialXML..Track.MediaName.toString();
		var appender = "";
		if(medias.indexOf("HD")>-1){
			appender = "_HD";
		}else if (medias.indexOf("SD")>-1){
			appender = "_SD";
		}

		return ancillaryMatId + appender + ".png"
	},

	isAncillaryMaterial: function (ancillaryMatId){

		var ancillaryMaterials = [];
	        Array.prototype.push.apply(ancillaryMaterials, NBCGMO.blackMaterials['all'])
	        Array.prototype.push.apply(ancillaryMaterials, NBCGMO.vchipMaterials['all']);
	        Array.prototype.push.apply(ancillaryMaterials, NBCGMO.waterMarkingMaterials['all']);
	        Array.prototype.push.apply(ancillaryMaterials, NBCGMO.barsAndTonesMaterials['all']);
	        Array.prototype.push.apply(ancillaryMaterials, NBCGMO.slateMaterials['all']);
	        if(ancillaryMaterials.indexOf(ancillaryMatId)< 0){
	        	return false;
	        } else {
	        	return true;
	        }
	},

	setTelecine: function(Sourceframerate, materialXml) {
		if (Sourceframerate.toString() == "29.97" && materialXml..Material.ShortTextList.ShortText.(ShortTextType == "Telecine").Value.toString().toLowerCase() == "true") {
			print("Material is DF30 and has Telecine, setting Telecine to True.");
			return true;
		} else {
			print("Setting Telecine to False");
			return false;
		}
	},
	/**
	*  Function to retrieve number of active jobs per node (source or target node)

	*  @param	{jobFactory}	the job factory name (e.g. 'asperaTransferJobFactory')
	*  @return	{resultReportXml} the xml that is generated from wscall of runReportXml
	**/

	numberOfActiveDeliveries : function(jobFactory){

		print("running numberOfActiveDeliveries: ");

		var runReportXml = <PharosCs>
			<CommandList>
				<Command subsystem="report" method="runReport">
					<ParameterList>
						<Parameter name="reportName" value="numberActiveJobsPerNode"/>
						<Parameter name="reportParameters">
							<Value>
								<CustomReportRuntimeParameters>
									<Parameters>
										<StringReportParameter>
											<Name>jobFactory</Name>
											<Values>
												<String>{jobFactory}</String>
											</Values>
										</StringReportParameter>
									</Parameters>
								</CustomReportRuntimeParameters>
							</Value>
						</Parameter>
						<Parameter name="pageSize">
							<Value>
								<Integer/>
							</Value>
						</Parameter>
						<Parameter name="page">
							<Value>
								<Integer/>
							</Value>
						</Parameter>
					</ParameterList>
				</Command>
			</CommandList>
		</PharosCs>;

		//Values decared outside of the loop
		var pageSize=1000; //Runs the report and gets 1000 results at a time;
		var pageNo=1; //Page number to start at;
		var returnedRows; // Variable to hold how many we found per run. Used to break loop when no more results
		var resultList = <ResultList></ResultList>;

		while(returnedRows !== 0){

			//Update the pageSize and page parameters.
			runReportXml..ParameterList.Parameter.(@name == "pageSize").Value.Integer = pageSize;
			runReportXml..ParameterList.Parameter.(@name == "page").Value.Integer = pageNo;

			//Run the report
			var rtn = wscall(runReportXml);

			//Add each node's info to the result list
			for each (var reportRowResult in rtn..ResultList.PagedResults.Results.ReportRow){
				resultList.appendChild(reportRowResult);
			}

			//Work out the number of rows returned and increment the page number
			returnedRows = parseInt(rtn..ResultList.PagedResults.Results.ReportRow.length());
			pageNo++;

		}

		return resultList;
	},

	 maxNumDeliveryRetrieval : function(tagValue){

			var resultTagXml = gmoNBCFunc.getTagsForTypeXml("Maximum Concurrent Deliveries");
	        var maxNum = resultTagXml.Tag.(Value == tagValue).Description.toString();
	        if(maxNum == undefined || maxNum == null || maxNum == "") {
	                print("WARNING: A max concurrent delviery has not been set for node [" + tagValue + "] defaulting to 3.");
	                maxNum = 3;
	        }

	        return maxNum;
        },
	/**
	*  Function to check the number of remaining jobs allowed for a given node

	*  @param	{nodeName}	the taget node (e.g. 'asperaTargetNode')
	*  @param 	{jobFactory}    the job factory name (e.g. 'asperaTransferJobFactory')
	*  @return	{numRemainingJobs} the number of remaining jobs
	**/

	numOfRemainingJobs : function(nodeName, jobFactory){
		print("nodeName:   "+nodeName);
		var activeDeliveries = this.numberOfActiveDeliveries(jobFactory);
		print("activeDeliveries: " + activeDeliveries);
		var numActiveJobs = activeDeliveries.ReportRow.(NODE.toString() == nodeName).NUM_ACTIVE_JOB.toString();
		print("numActiveJobs: "+numActiveJobs);
		var maxNumDelivery = this.maxNumDeliveryRetrieval(nodeName);
		var numRemainingJobs = Number(maxNumDelivery) - Number(numActiveJobs);

		return numRemainingJobs;
	},
	/**
	 * [getStream Function to get Stream By Name]
	 * @param  {[String]} streamName [streamName]
	 * @return {[Object]}            [description]
	 */
	getStreamId : function(streamName){
		var getStreamPayload = <PharosCs>
  			<CommandList>
    			<Command subsystem="playtime" method="getStreams">
      				<ParameterList>
        				<Parameter name="streamName" value={streamName}/>
      				</ParameterList>
    			</Command>
  			</CommandList>
		</PharosCs>
		return wscall(getStreamPayload)..StreamList.Stream.@id.toString();
	},

	getImageMappingObject : function(placingHelper,settings){
		var rtnObject = [];

		if(settings.includeBoxartImages){
			rtnObject.push([placingHelper.getFullTextValueByType("BoxArt Image Filenames").split(","),"Boxart"]);
		}
		if(settings.includeHeroImages){
			rtnObject.push([placingHelper.getFullTextValueByType("HeroArt Image Filenames").split(","),"Hero"]);
		}
		if(settings.includePosterImages){
			rtnObject.push([placingHelper.getFullTextValueByType("PosterArt Image Filenames").split(","),"Poster"]);
		}
		if(settings.includeChapterImages){
			rtnObject.push([placingHelper.getFullTextValueByType("ChapterArt Image Filenames").split(","),"Chapter"]);
		}
		if(settings.includeTitleImages){
			rtnObject.push([placingHelper.getFullTextValueByType("TitleArt Image Filenames").split(","),"Title"]);
		}
		if(settings.includeSeriesImages){
			rtnObject.push([placingHelper.getFullTextValueByType("SeriesArt Image Filenames").split(","),"Series"]);
		}
		if(settings.includeSeasonImages){
			rtnObject.push([placingHelper.getFullTextValueByType("SeasonArt Image Filenames").split(","),"Season"]);
		}
		if(settings.includeEpisodeImages){
			rtnObject.push([placingHelper.getFullTextValueByType("EpisodeArt Image Filenames").split(","),"Episode"]);
		}
		if(settings.includeTrailerImages){
			rtnObject.push([placingHelper.getFullTextValueByType("TrailerArt Image Filenames").split(","),"Trailerart"]);
		}

		return rtnObject;
	}

}
