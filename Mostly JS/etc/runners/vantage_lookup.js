// Note: There should be one entry per system e.g. Dev , QA , Production on each of the Systems' "lookups". That is to say lookup, on dev should be identical to lookup on QA and also on Prod
//
// This means copying this file to other systems should be done with the utmost care. Make a change on Dev copy file to QA copy file to Prod to ensure work is not overwritten
//
// e.g. If a change is desried on Prod you must make the change for Prod on the Dev lookup copy it to QA and then to Prod.
//
// If this is unclear don't guess ask.

var vantageLookup = {};

(function() {	
	if(typeof wscall === 'undefined') load("/opt/evertz/mediator/lib/js/shellfun.js");
	print("Loaded Vantage Lookup... Building vantageLookup object...");
		
	// Function to self identify 	
	 // Function to self identify
        var findSystemName = function() {

                print("Attempting to Self Identify System");

                var systemSettingsListXml =

                        wscall(
                                <PharosCs>
                                        <CommandList>
                                                <Command subsystem="systemSettings" method="getSystemSettingsList"/>
                                        </CommandList>
                                </PharosCs>
                        );

                var matchedSystem;
                var systemTitle = systemSettingsListXml..SystemTitle.toString();
                var regionLocation = "DC"; // Hard coding temporarily --> this needs to be rewritten when running with a multi regionalised system

                // Check the 3 possibilties and return if matched
                var isDevSystem = /DEV/.test(systemTitle);
                if (isDevSystem)  return regionLocation + "-GMO-DEV";

                var isQASystem = /QA/.test(systemTitle);
                if (isQASystem) return regionLocation + "-GMO-QA";

                var isProdSystem = /PROD/.test(systemTitle);
                if (isProdSystem) return  regionLocation + "-GMO-PROD";

                // Didn't find system Error
                throw new Error("\nUnable to determine whehter system is DEV/QA/Prod exiting to avoid a meltdown");

        }


	var createSystemSpecificObject = function(array) {
		
		var __systemname = findSystemName();
		print("System name found to be ["+__systemname+"]");
		
		var type = "type";
		var ref = "ref";
		var values = "values";
		var enabled = "enabled";
		var systemname = "systemname";
		var jobFactoryName = "jobFactoryName";
		var exportObject = {};
		for each (var obj in array) {
			// Check each entry had the requisite properties
			if (obj.hasOwnProperty(type) && obj.hasOwnProperty(ref) && obj.hasOwnProperty(systemname) && obj.hasOwnProperty(values)) {
				// Only interested in Objects that are linked to the current system
 				if (obj[systemname] === __systemname) {
					var _type = obj[type];
					var _ref = obj[ref];
					var _values = obj[values];
					var _enabled = obj[enabled];
					var _jobFactoryName = obj[jobFactoryName];
					var _validExport = true;
					
					// Extract Data from the Config Tool - If type is media
					if (_type === "vantageDomain" && _enabled == true) {
						var _validExport = true;	
						
						for each (var workflowName in _values){
							if (!exportObject.hasOwnProperty(workflowName)) exportObject[workflowName] = [];
							var domainObject = {};
							domainObject[_ref] = _jobFactoryName;
							exportObject[workflowName].push(domainObject);
						}						
					}
										
					exportObject.getJobFactoryByWorkflow = function(workflowName) {
						output("Getting job factory by workflow name [" + workflowName + "]");	
						
						var getJobFactoryFromTag = function(workflowName) {
							var workflowSearchRes = wscall(<PharosCs>
										 <CommandList>
										   <Command subsystem="tag" method="search">
										     <ParameterList>
										       <Parameter name="value" value={workflowName}/>
										       <Parameter name="tagType" value="VantageWorkflow"/>
										     </ParameterList>
										   </Command>
										 </CommandList>
										</PharosCs>);

							if(workflowSearchRes..Command.@success.toString() === "true" && workflowSearchRes..Output.TagList != "") {
								for each (var workflowTag in workflowSearchRes..Output.TagList.Tag.(TagType.toString() == "VantageWorkflow")) {

									if(workflowTag.Value.toString() == workflowName) {
										if(typeof workflowTag.Description == "undefined" || workflowTag.Description.toString() == "") {
											return "";
										} else {
											return NBCGMO.vantageJobFactoryMap[workflowTag.Description.toString()];
										}
									}
								}
							}
							return "";
						};
						
						var jobFactoryFromTag = getJobFactoryFromTag(workflowName);
						
						if (jobFactoryFromTag != "") {
							return jobFactoryFromTag;
						} 
						return NBCGMO.vantageJobFactoryMap["GMO_VANTAGE_FARM"];
					}					
				}
			}
		}
		return exportObject;
	};

	
	// Define the Look Up
	var __allSystemVars = [
		// Drop Folders for Uploads
		{
            type : "vantageDomain",
            ref : "DefaultDomain",
            systemname : "DC-GMO-DEV",
            jobFactoryName : "vantageGatewayJobFactory",
            enabled : true,
            values : [    
            // A list of vantage workflows supported on this domain go here.

            // OM Vantage Transcode Workflow
            "GMO_INGEST_MOVE_AND_AUDIO_EXTRACTION",

            // Transcode Workflow
            "CANADA_SHAW_XDCAMHD422_MOV_10CH_2997_CC",
            "CANADA_SHAW_XDCAMHD422_MXF_AUDIOPASS_2997_CC",
            "CANADA_SHAW_XDCAMHD422_OMNEON_MOV_AUDIOPASS_2997_CC",
            "DEFENSE_MEDIA_IMX30_MXF_4X3_2CH_2997_CC",
            "EST_HD_MPEG2_TS_80MB_AUDIO_FPS_PASS",
            "XDCAMHD422_MXF_N15_AUDIOPASS_FPS_PASS_CC",
            "GLOBAL_NETWORKS_TO_DENVER_PRORESHQ_REWRAP_AUDIOPASS",
            "XDCAMHD422_MXF_AUDIOPASS_FPS_PASS_CC",
            "SHOMI_CANADA_DNX_220MBPS_HD_MOV_2997_AUDIOPASS",
            "PACTV_X264_20Mbps_HD_MOV_AUDIOPASS_FPS_PASS_CC",
            "HD_XDCAMHD422_MXF_SD_IMX50_MXF_AUDIOPASS_FPS_PASS_CC",
            "SDI_DIRECTV_LATIN_AMERICA_XDCAMHD422_MXF_AUDIOPASS_16BIT_2997_CC",
            "HD_PRORES_HQ_MOV_AUDIOPASS_FPS_PASS_CC",
			"XDCAMHD422_MOV_N15_AUDIOPASS_FPS_PASS_CC",
			"CHEK_MPEG2_HD_50MBPS_MPG_AUDIOPASS_2997I_CC",
			"SDI_DIRECTV_LATIN_AMERICA_XDCAMHD422_MOV_AUDIOPASS_16BIT_2997_CC",

            // Post-Processing Frame Rate Workflows
            "GMO_HD_PRORESHQ_CONVERT_TO_2398_16CH_TEST",
            "GMO_HD_PRORESHQ_CONVERT_TO_2997I_16CH_TEST",
            "GMO_HD_PRORESHQ_CONVERT_TO_2997P_16CH_TEST",
            "GMO_HD_PRORESHQ_CONVERT_TO_50I_16CH_TEST",
            "GMO_HD_PRORESHQ_CONVERT_TO_25P_16CH_TEST",

            // Conform Workflows
            "GMO_CONFORM_SOURCE_HD_SD_PRORESHQ",

            // Faspex Delivery Workflow
            "ASPERA_FASPEX_DELIVERY"

            ]            
        },
		{
			type : "vantageDomain",
			ref : "DefaultDomain",
			systemname : "DC-GMO-QA",
			jobFactoryName : "vantageGatewayJobFactory",
			enabled : true,
			values : [	
			// A list of vantage workflows supported on this domain go here.
			
			// OM Vantage Transcode Workflow
			"GMO_INGEST_MOVE_AND_AUDIO_EXTRACTION",
			
			// Transcode Workflow
            "CANADA_SHAW_XDCAMHD422_MOV_10CH_2997_CC",
            "CANADA_SHAW_XDCAMHD422_MXF_AUDIOPASS_2997_CC",
            "CANADA_SHAW_XDCAMHD422_OMNEON_MOV_AUDIOPASS_2997_CC",
            "DEFENSE_MEDIA_IMX30_MXF_4X3_2CH_2997_CC",
            "EST_HD_MPEG2_TS_80MB_AUDIO_FPS_PASS",
            "XDCAMHD422_MXF_N15_AUDIOPASS_FPS_PASS_CC",
            "GLOBAL_NETWORKS_TO_DENVER_PRORESHQ_REWRAP_AUDIOPASS",
            "XDCAMHD422_MXF_AUDIOPASS_FPS_PASS_CC",
            "SHOMI_CANADA_DNX_220MBPS_HD_MOV_2997_AUDIOPASS",
            "PACTV_X264_20Mbps_HD_MOV_AUDIOPASS_FPS_PASS_CC",
            "HD_XDCAMHD422_MXF_SD_IMX50_MXF_AUDIOPASS_FPS_PASS_CC",
            "SDI_DIRECTV_LATIN_AMERICA_XDCAMHD422_MXF_AUDIOPASS_16BIT_2997_CC",
            "HD_PRORES_HQ_MOV_AUDIOPASS_FPS_PASS_CC",
			"XDCAMHD422_MOV_N15_AUDIOPASS_FPS_PASS_CC",
			"CHEK_MPEG2_HD_50MBPS_MPG_AUDIOPASS_2997I_CC",
			"SDI_DIRECTV_LATIN_AMERICA_XDCAMHD422_MOV_AUDIOPASS_16BIT_2997_CC",
						
			// Post-Processing Frame Rate Workflows
			"GMO_HD_PRORESHQ_CONVERT_TO_2398_16CH_TEST",
			"GMO_HD_PRORESHQ_CONVERT_TO_2997I_16CH_TEST",
			"GMO_HD_PRORESHQ_CONVERT_TO_2997P_16CH_TEST",
			"GMO_HD_PRORESHQ_CONVERT_TO_50I_16CH_TEST",
			"GMO_HD_PRORESHQ_CONVERT_TO_25P_16CH_TEST",
			
			// Conform Workflows
			// commented this EC workflow out for now 
            //"GMO_CONFORM_SOURCE_HD_SD_PRORESHQ",
			"GMO_CONFORM",
			
			// Faspex Delivery Workflow
			"ASPERA_FASPEX_DELIVERY"
			
			]			
		},
		{
			type : "vantageDomain",
			ref : "DefaultDomain",
			systemname : "DC-GMO-PROD",
			jobFactoryName : "vantageGatewayJobFactory",
			enabled : true,
			values : [	
			// A list of vantage workflows supported on this domain go here.
			
			// OM Vantage Transcode Workflow
			"GMO_INGEST_MOVE_AND_AUDIO_EXTRACTION",
			
			// Transcode Workflow
            "CANADA_SHAW_XDCAMHD422_MOV_10CH_2997_CC",
            "CANADA_SHAW_XDCAMHD422_MXF_AUDIOPASS_2997_CC",
            "CANADA_SHAW_XDCAMHD422_OMNEON_MOV_AUDIOPASS_2997_CC",
            "DEFENSE_MEDIA_IMX30_MXF_4X3_2CH_2997_CC",
            "EST_HD_MPEG2_TS_80MB_AUDIO_FPS_PASS",
            "XDCAMHD422_MXF_N15_AUDIOPASS_FPS_PASS_CC",
            "GLOBAL_NETWORKS_TO_DENVER_PRORESHQ_REWRAP_AUDIOPASS",
            "XDCAMHD422_MXF_AUDIOPASS_FPS_PASS_CC",
            "SHOMI_CANADA_DNX_220MBPS_HD_MOV_2997_AUDIOPASS",
            "PACTV_X264_20Mbps_HD_MOV_AUDIOPASS_FPS_PASS_CC",
            "HD_XDCAMHD422_MXF_SD_IMX50_MXF_AUDIOPASS_FPS_PASS_CC",
            "SDI_DIRECTV_LATIN_AMERICA_XDCAMHD422_MXF_AUDIOPASS_16BIT_2997_CC",
            "HD_PRORES_HQ_MOV_AUDIOPASS_FPS_PASS_CC",
			"XDCAMHD422_MOV_N15_AUDIOPASS_FPS_PASS_CC",
			"CHEK_MPEG2_HD_50MBPS_MPG_AUDIOPASS_2997I_CC",
			"SDI_DIRECTV_LATIN_AMERICA_XDCAMHD422_MOV_AUDIOPASS_16BIT_2997_CC",
						
			// Post-Processing Frame Rate Workflows
			"GMO_HD_PRORESHQ_CONVERT_TO_2398_16CH_TEST",
			"GMO_HD_PRORESHQ_CONVERT_TO_2997I_16CH_TEST",
			"GMO_HD_PRORESHQ_CONVERT_TO_2997P_16CH_TEST",
			"GMO_HD_PRORESHQ_CONVERT_TO_50I_16CH_TEST",
			"GMO_HD_PRORESHQ_CONVERT_TO_25P_16CH_TEST",
			
			// Conform Workflows
			"GMO_CONFORM_SOURCE_HD_SD_PRORESHQ",
			
			// Faspex Delivery Workflow
			"ASPERA_FASPEX_DELIVERY"
			
			]			
		}
	];
	
	var getSystemLoginIp = function() {
		// Need to hardcode this logic to be able to login to create the lookup object. Using hostname cause we cant login to get system name :(
		var hostName = run("/bin/hostname").output;
		output("Generating IP to login with based on the hostname [" + hostName + "].");			
		
		if (/DEV/.test(hostName)) {
			return "localhost";
		} else if (/QA/.test(hostName)) {
			return "localhost";
		} else {
			// Assume were production.
			return "100.116.68.150";
		}			
	}
	
	// Log in to Server if necessary
	if(typeof(sessionKey)==='undefined'){
		print("Independent Session Logging into Server for Session Key");
		var independentSession = true; // Indicates that session is not controlled by Mediator and therefore logging in / logging out need to be handled
		wsLogin(getSystemLoginIp(),"wsuser","wspass");
	}
	
	// Run Look Up Function
	vantageLookup = createSystemSpecificObject(__allSystemVars);
	
	// Log out of Server if necessary
	if(independentSession){
		print("Independent Session Logging Out of Session");
		wsLogout();
	}
	
	print("'vantageLookup' object created in your scope.");

})();
