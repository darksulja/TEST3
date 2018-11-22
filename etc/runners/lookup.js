// test

var lookup = {};

(function() {

        if(typeof wscall === 'undefined') load("/opt/evertz/mediator/lib/js/shellfun.js");
        print("Loaded lookup... Building lookup object...");

        // Function to self identify
        var findSystemName = function() {

                print("Attempting to Self Identify System");
                var config_file = "/opt/evertz/mediator/etc/env.info";
                var systemTitle = FileUtils.readFile(config_file);
                var regionLocation = "DC"; // Hard coding temporarily --> this needs to be rewritten when running with a multi regionalised system

                // Check the 3 possibilties and return if matched
                var isDevSystem = /DEV/i.test(systemTitle);
                if (isDevSystem)  return regionLocation + "-GMO-DEV";

                var isQASystem = /QA/i.test(systemTitle);
                if (isQASystem) return regionLocation + "-GMO-QA";

                var isProdSystem = /PROD/i.test(systemTitle);
                if (isProdSystem) return  regionLocation + "-GMO-PROD";

                // Didn't find system Error
                throw new Error("\nUnable to determine whether system is DEV/QA/Prod exiting to avoid a meltdown");

        }

        // Function to get a List of the Media Classes
        var getClassListXml = function(){
                return wscall(
                        <PharosCs>
                                <CommandList>
                                        <Command subsystem="media" method="getClassList"/>
                                </CommandList>
                        </PharosCs>)..Output;
        }

        // Function to get a List of the Medias - // Exclude Tapes eventually
        var getMediaXmlList = function(classListXml) {

                var classGetXmlList = new XMLList();

                for each(var mediaClass in classListXml..MediaClass) {
                        var className = mediaClass.ClassName.toString();
                        classGetXmlList += <Text>{className}</Text>
                }
				return wscall(
                        <PharosCs>
                          <CommandList>
                                <Command subsystem="media" method="getMediaListByClass">
                                  <ParameterList>
                                        <Parameter name="classList">
                                          <Value>
                                                <TextList>
                                                        {classGetXmlList}
                                                </TextList>
                                          </Value>
                                        </Parameter>
                                  </ParameterList>
                                </Command>
                          </CommandList>
                        </PharosCs>)..Output;
        }

        // Function to Create Array Object of Medias based on the Config Tool
        var createConfigToolsMediaObjects = function(mediaXmlList, name) {

                // Makes a Group for Archive Medias and exclude that way?
                function excludeDivaMedias(mediaObj){

                        var isDiva =/_DIVA_/.test(mediaObj.ref) ? true : false;
                        if (isDiva) print("Excluding Archive Media [" + mediaObj.ref + "]");
                        return isDiva ? false : true;

                }

                // Added in whilst decisions are still being made for the Dev / QA systems
                function excludeECMedias(mediaObj) {

                        var isECMedia = /^EC/.test(mediaObj.ref) ? true : false;
                        // if (isECMedia) print("Excluding EC Media [" + mediaObj.ref + "]");
                        return isECMedia ? false : true;

                }

                var rtn = [];

                for each(var media in mediaXmlList..Media) {
                        var mediaName = media.Name.toString();

                        var objToAdd = {
                                type : "media",
                                ref : mediaName,
                                systemname : name,
                                values : {}
                        }

                        rtn.push(objToAdd);
                }

                // Filter out any Diva Media and Return
                return rtn.filter(excludeDivaMedias).filter(excludeECMedias);
        }
        
        var getDVSEndPoint = function(){
            return "den-dvs.moc.net";
        }        
        // Function to Check whether a specific Media is valid for addition to lookup object
        var isValidMediaForExport = function(mediaValues,mediaName) {
                var validExport = true;
				var ignorableProps = ["usesMatIdDir", "usesFlatStructure", "usesMD5SumStructure"];

                // Check Media Exists
                if (!mediaValues.mediaExists) {
                        print("Media [" + mediaName + "] does not exist. Media will not be available in 'lookup' scope");
                        validExport = false;
                }

                // Check that the Necessary Properties are defined in the Config Tool for the Media in question
                for(var prop in mediaValues){
                        if(!mediaValues[prop] &&  ignorableProps.indexOf(prop) === - 1){
                                print("Media [" + mediaName+ "] Property [" + prop + "] is not set in Config Tool. Media will not be available in 'lookup' scope");
                                validExport = false;
                        }
                }

                // Check that the Directory Exists
                if (!fileExists(mediaValues.mount)) {
                        print("Media [" + mediaName + "] Mount [" + mediaValues.mount + "] does not exist. Media will not be available in 'lookup' scope");
                        validExport = false;
                }
                return validExport;
        }

        var getDVSEndPoint = function(){
      		if(typeof(LoadBalancer)==="undefined"){
      			load("/opt/evertz/mediator/etc/runners/LoadBalancer.js");	
      		}
      		var lb = new LoadBalancer()
      		lb.setType('DVS')
      		lb.setTagType("DVS_FS_LB_GROUP")
      		return lb.getEndPoint();
      	}

        // Function to create Object specific to the system
        var createSystemSpecificObject = function(array) {

                var systemName = findSystemName();
                print("System name found to be [" + systemName + "]");

                // Get the Media Xml List
                var mediaGetXml = getMediaXmlList(getClassListXml());

                // Add to the Medias in Config Tool to the provided Array
                var configToolMediaObjects = createConfigToolsMediaObjects(mediaGetXml, systemName);
                array = array.concat(configToolMediaObjects);

                var typeProp = "type";
                var refProp = "ref";
                var valuesProp = "values";
                var systemnameProp = "systemname";
                var exportObject = {};

                // Go through each of the objects in the array and see if they are suitable to be exported
                for each (var obj in array) {
                        var validExport = true; // Default to be updated

                        // Cases where object in array should be ignored
                        if(
                       // If it doesn't match the System Name
                           obj[systemnameProp] !== systemName  ||
                           // Export Object already has a reference (Allows overwrites to be used)
                           exportObject[obj[typeProp]] !== undefined && exportObject[obj[typeProp]].hasOwnProperty(obj[refProp]) ||
                           // Object doesn't have appropriate properties
                           (!obj.hasOwnProperty(typeProp)) ||
                           (!obj.hasOwnProperty(refProp)) ||
                           (!obj.hasOwnProperty(systemnameProp)) ||
                           (!obj.hasOwnProperty(valuesProp))
                        ){
                            print("Will not deal with " + obj[refProp] +  " for system [" + obj[systemnameProp] + "]");
							continue; // use continue to avoid cycles
                        }

                        // Internal Properties
                        var _type = obj[typeProp];
                        var _ref = obj[refProp];
                        var _values = obj[valuesProp];

                        // If this is the first iteration of this "type" ensure the type property for returnable 'exportObject' is set to an object
                        if (!exportObject.hasOwnProperty(_type)) exportObject[_type] = {};

                        // If Media pull values from Config Tool
                        if (_type === "media") {

                                // Populate Values
                                var mediaXml = mediaGetXml..Media.(Name.toString() === _ref );
                                        _values.usesMatIdDir = mediaXml.DirectoryNameFactoryName.toString() === "MaterialDirectoryNameFactory";
                                        _values.usesFlatStructure = mediaXml.DirectoryNameFactoryName.toString() === "FlatListDirectoryNameFactory";
                                        _values.usesMD5SumStructure = mediaXml.DirectoryNameFactoryName.toString() === "Md5SumDirectoryNameFactory";
                                        _values.folderStructureSet = mediaXml.DirectoryNameFactoryName.toString() || undefined;
                                        _values.mediaExists = mediaXml.Name.length() > 0;
                                        _values.mount = mediaXml.AbsolutePath.toString() || undefined;
                                        _values.frameRate = mediaXml.FrameRate.toString() || undefined;

                                // Run Validation
                                var validMedia = isValidMediaForExport(_values,_ref);
                                if(validMedia === false) validExport = false;


                                // Append "/" to mount if it doesn't end with "/" to avoid chaos
                                if (_values.mount && _values.mount.endsWith("/") === false) _values.mount = _values.mount + "/";
                        }
                        // If Object is a valid for Export add
                        if (validExport === true) {
                                print("Adding type [" +obj[typeProp]+ "] ref [" +obj[refProp] +"]");
                                exportObject[_type][_ref] = _values;
                        }
                }
                return exportObject;
        };

    // Define the Look Up
        var allSystemVars = [
                // Drop Folders for Uploads
                {
                        type : "dropfolder",
                        ref : "StudioPost",
                        systemname : "DC-GMO-DEV",
                        values : {
                                mount : "/srv/dc-delivery/StudioPost/"
                        }
                },{
                        type : "dropfolder",
                        ref : "TEST",
                        systemname : "DC-GMO-DEV",
                        values : {
                                mount : "/srv/dc-delivery/StudioPost/TEST"
                        }
                },{
                        type : "dropfolder",
                        ref : "StudioPost",
                        systemname : "DC-GMO-QA",
                        values : {
                                mount : "/srv/dc-delivery/StudioPost/"
                        }
                },{
                        type : "dropfolder",
                        ref : "StudioPost",
                        systemname : "DC-GMO-PROD",
                        values : {
                                mount : "/srv/dc-delivery/StudioPost/"
                        }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2",
                    systemname : "DC-GMO-DEV",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/dev-mediator/Delivery/FROM_StudioPost_T2/",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2",
                    systemname : "DC-GMO-QA",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/qa-mediator/Delivery/FROM_StudioPost_T2",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2",
                    systemname : "DC-GMO-PROD",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/prod-mediator/Delivery/FROM_StudioPost_T2",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_Legacy",
                    systemname : "DC-GMO-DEV",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/dev-mediator/Delivery/FROM_StudioPost_T2_Legacy/",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_Legacy",
                    systemname : "DC-GMO-QA",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/qa-mediator/Delivery/FROM_StudioPost_T2_Legacy/",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_Legacy",
                    systemname : "DC-GMO-PROD",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/prod-mediator/Delivery/FROM_StudioPost_T2_Legacy/",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_Priority",
                    systemname : "DC-GMO-DEV",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/dev-mediator/Delivery/FROM_StudioPost_T2_Priority/",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_Priority",
                    systemname : "DC-GMO-QA",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/qa-mediator/Delivery/FROM_StudioPost_T2_Priority/",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_Priority",
                    systemname : "DC-GMO-PROD",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/prod-mediator/Delivery/FROM_StudioPost_T2_Priority/",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_Components",
                    systemname : "DC-GMO-DEV",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/dev-mediator/Delivery/FROM_StudioPost_T2_Components/",
                        stagingMedia : "DC_COMPONENT_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_Components",
                    systemname : "DC-GMO-QA",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/qa-mediator/Delivery/FROM_StudioPost_T2_Components/",
                        stagingMedia : "DC_COMPONENT_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_Components",
                    systemname : "DC-GMO-PROD",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/prod-mediator/Delivery/FROM_StudioPost_T2_Components/",
                        stagingMedia : "DC_COMPONENT_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_DLM",
                    systemname : "DC-GMO-DEV",
                    values : {
                        mount : "/srv/dc-isilon-full/DIGITAL_DELIVERY/INCOMING_TO_DENVER/FROM_WC/DLM_INGEST/mediator-dev/FROM_StudioPost_T2_DLM/",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_DLM",
                    systemname : "DC-GMO-QA",
                    values : {
                        mount : "/srv/dc-isilon-full/DIGITAL_DELIVERY/INCOMING_TO_DENVER/FROM_WC/DLM_INGEST/mediator-qa/FROM_StudioPost_T2_DLM/",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_DLM",
                    systemname : "DC-GMO-PROD",
                    values : {
                        mount : "/srv/dc-isilon-full/DIGITAL_DELIVERY/INCOMING_TO_DENVER/FROM_WC/DLM_INGEST/mediator-prod/FROM_StudioPost_T2_DLM/",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_UnTrusted",
                    systemname : "DC-GMO-DEV",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/dev-mediator/Delivery/FROM_StudioPost_T2_UnTrusted/",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_UnTrusted",
                    systemname : "DC-GMO-QA",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/qa-mediator/Delivery/FROM_StudioPost_T2_UnTrusted/",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_StudioPost_T2_UnTrusted",
                    systemname : "DC-GMO-PROD",
                    values : {
                        mount : "/srv/dc-isilon-full/GMO/Mediator/prod-mediator/Delivery/FROM_StudioPost_T2_UnTrusted/",
                        stagingMedia : "DC_T2_OM_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "CLASSIC_MEDIA_01",
                    systemname : "DC-GMO-DEV",
                    values : {
                        mount : "/srv/dc-delivery-01/DIGITAL_DELIVERY/dev-mediator/INCOMING_TO_DENVER/Aspera_Incoming/FROM_DREAMWORKS/CLASSIC_MEDIA_01/",
                        stagingMedia : "DC_DELIVERY1_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "CLASSIC_MEDIA_01",
                    systemname : "DC-GMO-QA",
                    values : {
                        mount : "/srv/dc-delivery-01/DIGITAL_DELIVERY/qa-mediator/INCOMING_TO_DENVER/Aspera_Incoming/FROM_DREAMWORKS/CLASSIC_MEDIA_01/",
                        stagingMedia : "DC_DELIVERY1_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "CLASSIC_MEDIA",
                    systemname : "DC-GMO-PROD",
                    values : {
                        mount : "/srv/dc-delivery-01/DIGITAL_DELIVERY/INCOMING_TO_DENVER/Aspera_Incoming/FROM_DREAMWORKS/CLASSIC_MEDIA/",
                        stagingMedia : "DC_DELIVERY1_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "CLASSIC_MEDIA_02",
                    systemname : "DC-GMO-DEV",
                    values : {
                        mount : "/srv/dc-delivery-02/DIGITAL_DELIVERY/dev-mediator/INCOMING_TO_DENVER/Aspera_Incoming/FROM_DREAMWORKS/CLASSIC_MEDIA_02/",
                        stagingMedia : "DC_DELIVERY2_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "CLASSIC_MEDIA_02",
                    systemname : "DC-GMO-QA",
                    values : {
                        mount : "/srv/dc-delivery-02/DIGITAL_DELIVERY/qa-mediator/INCOMING_TO_DENVER/Aspera_Incoming/FROM_DREAMWORKS/CLASSIC_MEDIA_02/",
                        stagingMedia : "DC_DELIVERY2_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "CLASSIC_MEDIA",
                    systemname : "DC-GMO-PROD",
                    values : {
                        mount : "/srv/dc-delivery-02/DIGITAL_DELIVERY/INCOMING_TO_DENVER/Aspera_Incoming/FROM_DREAMWORKS/CLASSIC_MEDIA/",
                        stagingMedia : "DC_DELIVERY2_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_TELEMUNDO_MIGRATION",
                    systemname : "DC-GMO-DEV",
                    values : {
                        mount : "/srv/dc-delivery-02/DIGITAL_DELIVERY/dev-mediator/INCOMING_TO_DENVER/Aspera_Incoming/FROM_TELEMUNDO_MIGRATION/",
                        stagingMedia : "DC_DELIVERY2_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_TELEMUNDO_MIGRATION",
                    systemname : "DC-GMO-QA",
                    values : {
                        mount : "/srv/dc-delivery-02/DIGITAL_DELIVERY/qa-mediator/INCOMING_TO_DENVER/Aspera_Incoming/FROM_TELEMUNDO_MIGRATION/",
                        stagingMedia : "DC_DELIVERY2_STAGING"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_TELEMUNDO_MIGRATION",
                    systemname : "DC-GMO-PROD",
                    values : {
                        mount : "/srv/dc-delivery-02/DIGITAL_DELIVERY/INCOMING_TO_DENVER/Aspera_Incoming/FROM_TELEMUNDO_MIGRATION/",
                        stagingMedia : "DC_DELIVERY2_STAGING"
                    }
                },{
					type : "dropfolder",
					ref : "BroadcastPriority",
					systemname : "DC-GMO-DEV",
					values : {
						mount : "/srv/dc-delivery/BroadcastPriority/"
					}
				},{
					type : "dropfolder",
					ref : "BroadcastPriority",
					systemname : "DC-GMO-QA",
					values : {
						mount : "/srv/dc-delivery/BroadcastPriority/"
					}
				},{
					type : "dropfolder",
					ref : "BroadcastPriority",
					systemname : "DC-GMO-PROD",
					values : {
						mount : "/srv/dc-delivery/BroadcastPriority/"
					}
				},{
                    type : "dropfolder",
                    ref : "FROM_EC_MEDIATOR",
                    systemname : "DC-GMO-DEV",
                    values : {
                        mount : "/srv/dc-isilon/INBOUND/FROM_EC_MEDIATOR/"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_EC_MEDIATOR",
                    systemname : "DC-GMO-QA",
                    values : {
                        mount : "/srv/dc-isilon/INBOUND/FROM_EC_MEDIATOR/"
                    }
                },{
                    type : "dropfolder",
                    ref : "FROM_EC_MEDIATOR",
                    systemname : "DC-GMO-PROD",
                    values : {
                        mount : "/srv/dc-isilon/INBOUND/FROM_EC_MEDIATOR/"
                    }
                },{
					type : "venice",
					ref : "VENICE_OUTPUT_FILE",
					systemname : "DC-GMO-DEV",
					values : {
						fileLocation : "/srv/dc-dvs-all/VENICE/Mediator_GMO_Playlist/"
					}
				},
				{
					type : "venice",
					ref : "VENICE_OUTPUT_FILE",
					systemname : "DC-GMO-QA",
					values : {
						fileLocation : "/srv/dc-dvs-all/VENICE/Mediator_GMO_Playlist/"
					}
				},
				{
					type : "venice",
					ref : "VENICE_OUTPUT_FILE",
					systemname : "DC-GMO-PROD",
					values : {
						fileLocation : "/srv/dc-dvs-all/VENICE/Mediator_GMO_Playlist/"
					}
				},
				{
                        type : "dropfolder",
                        ref : "PromoUpload",
                        systemname : "DC-GMO-DEV",
                        values : {
                                mount : "/srv/dc-delivery/PromoUpload/"
                        }
                },
				{
                        type : "dropfolder",
                        ref : "PromoUpload",
                        systemname : "DC-GMO-QA",
                        values : {
                                mount : "/srv/dc-delivery/PromoUpload/"
                        }
                },
				{
                        type : "dropfolder",
                        ref : "PromoUpload",
                        systemname : "DC-GMO-PROD",
                        values : {
                                mount : "/srv/dc-delivery/PromoUpload/"
                        }
                },
                {
                        type : "dropfolder",
                        ref : "FROM_LA_CV",
                        systemname : "DC-GMO-DEV",
                        values : {
                                mount : "/srv/dc-isilon-full/DIGITAL_DELIVERY/INCOMING_TO_DENVER/FROM_WC/CV_INGEST/mediator-dev/FROM_LA_CV/",
                                stagingMedia : "DC_T2_OM_STAGING"
                        }
                },
                {
                        type : "dropfolder",
                        ref : "FROM_LA_CV",
                        systemname : "DC-GMO-QA",
                        values : {
                                mount : "/srv/dc-isilon-full/DIGITAL_DELIVERY/INCOMING_TO_DENVER/FROM_WC/CV_INGEST/mediator-qa/FROM_LA_CV/",
                                stagingMedia : "DC_T2_OM_STAGING"
                        }
                },
                {
                        type : "dropfolder",
                        ref : "FROM_LA_CV",
                        systemname : "DC-GMO-PROD",
                        values : {
                                mount : "/srv/dc-isilon-full/DIGITAL_DELIVERY/INCOMING_TO_DENVER/FROM_WC/CV_INGEST/mediator-prod/FROM_LA_CV/",
                                stagingMedia : "DC_T2_OM_STAGING"
                        }
                },
				//------------------------------
				//adding info for MacCaption
				{
				  type : "maccaption",
				  ref : "MACCAPTION_INFORMATION",
				  systemname : "DC-GMO-QA",
				  values : {
					//ssh 100.125.141.71 -l mediator
					ipAddress : "100.125.141.80",
					userName : "mediator",
					password : "ph@r0s1",
					host : "den-macpro4",
					exec : "/usr/local/bin/maccaption",
					workingDir : "",
					projectDir : ""
					  }
				},
				
				{
				  type : "maccaption",
				  ref : "MACCAPTION_INFORMATION",
				  systemname : "DC-GMO-DEV",
				  values : {
					//ssh 100.125.141.71 -l mediator
					ipAddress : "100.125.141.80",
					userName : "mediator",
					password : "ph@r0s1",
					host : "den-macpro4",
					exec : "/usr/local/bin/maccaption",
					workingDir : "",
					projectDir : ""
					  }
				},
				
				{
				  type : "maccaption",
				  ref : "MACCAPTION_INFORMATION",
				  systemname : "DC-GMO-PROD",
				  values : {
					ipAddress : "100.125.141.80",
					userName : "mediator",
					password : "ph@r0s1",
					host : "den-macpro4",
					exec : "/usr/local/bin/maccaption",
					workingDir : "",
					projectDir : ""
					  }
				},

				
				//------------------------------
				//adding info for Baton
				{
				  type : "baton",
				  ref : "BATON_INFORMATION",
				  systemname : "DC-GMO-DEV",
				  values : {
				ipAddress : "100.125.141.102",
				port : 8080,
				userName : "mediator",
				password : "mediator"
				  }
			    },{
				  type : "baton",
				  ref : "BATON_INFORMATION",
				  systemname : "DC-GMO-QA",
				  values : {
				/* //tested theses IPs and they worked
				ipAddress : "100.125.141.102", 
				ipAddress : "100.125.141.101",*/
				ipAddress : "100.125.141.103",
				port : 8080,
				userName : "mediator",
				password : "mediator"
				 }
				},{
				  type : "baton",
				  ref : "BATON_INFORMATION",
				  systemname : "DC-GMO-PROD",
				  values : {
				ipAddress : "100.125.141.101",
				port : 8080,
				userName : "mediator",
				password : "mediator",
				loadBalancerIP : "100.116.68.110",
                remoteWSUser : "wsuser",
                remoteWSPass : "wspass"
				  }
				},
                //
                // All medias will be returned from the config tool and the following properties will be provided
                //
                //       usesMatIdDir : [boolean] - indicating whether a .dir structure is used
                //       mount : [string] - pointing to the absolute path of the media
                //   frameRate : [string] - specifying the media's frame rate.
                //
                //   Additional key pairs can be specified under the values property. Do not use the keys above
                //
                //
                //
                {
                        type : "nld",
                        ref     : "NLD_WORKING_DIR",
                        systemname : "DC-GMO-DEV",
                        values : {
                                mount : "/srv/dc-isilon/NLDWorking/"
                        }
                },{
                        type : "nld",
                        ref     : "NLD_WORKING_DIR",
                        systemname : "DC-GMO-QA",
                        values : {
                                mount : "/srv/dc-isilon/NLDWorking/"
                        }
                },{
                        type : "nld",
                        ref     : "NLD_WORKING_DIR",
                        systemname : "DC-GMO-PROD",
                        values : {
                                mount : "/srv/dc-isilon/NLDWorking/"
                        }
                },{
                        type : "nld",
                        ref     : "NLD_PACKAGING_DIR",
                        systemname : "DC-GMO-DEV",
                        values : {
                                mount : "/srv/dc-dvs/NLD/Packaging/"
                        }
                },{
                        type : "nld",
                        ref     : "NLD_PACKAGING_DIR",
                        systemname : "DC-GMO-QA",
                        values : {
                                mount : "/srv/dc-dvs/NLD/Packaging/"
                        }
                },{
                        type : "nld",
                        ref     : "NLD_PACKAGING_DIR",
                        systemname : "DC-GMO-PROD",
                        values : {
                                mount : "/srv/dc-dvs/NLD/Packaging/"
                        }
                },{
                        type : "nld",
                        ref     : "NLD_PACKAGING_DIR_USER",
                        systemname : "DC-GMO-DEV",
                        values : {
                                mount : "/srv/dc-dvs-all/VENICE/NLD_QC/"
                        }
                },{
                        type : "nld",
                        ref     : "NLD_PACKAGING_DIR_USER",
                        systemname : "DC-GMO-QA",
                        values : {
                                mount : "/srv/dc-dvs-all/VENICE/NLD_QC/"
                        }
                },{
                        type : "nld",
                        ref     : "NLD_PACKAGING_DIR_USER",
                        systemname : "DC-GMO-PROD",
                        values : {
                                mount : "/srv/dc-dvs-all/VENICE/NLD_QC/"
                        }
                },{
                        type : "storage",
                        ref     : "dvs",
                        systemname :  "DC-GMO-DEV",
                        values : {
                                win_prefix : "\\\\den-dvs.dcgmo.data\\dvs-rt1\\Mediator\\dev-mediator\\",
                                unix_root : "/srv/dc-dvs/",
                                path_on_dvs : "/media/DVS-RT1/DC/Mediator/dev-mediator/",
                                path_on_mac : "/Volumes/DVS-RT1/Mediator/dev-mediator/",
                                host : "den-dvs.dcgmo.data",
                                endpoint : getDVSEndPoint
                        }
                },{
                        type : "storage",
                        ref     : "dvs",
                        systemname :  "DC-GMO-QA",
                        values : {
                                win_prefix : "\\\\den-dvs.dcgmo.data\\dvs-rt1\\Mediator\\qa-mediator\\",
                                unix_root : "/srv/dc-dvs/",
                                path_on_dvs : "/media/DVS-RT1/DC/Mediator/qa-mediator/",
                                path_on_mac : "/Volumes/DVS-RT1/Mediator/qa-mediator/",
                                host : "den-dvs.dcgmo.data",
                                endpoint : getDVSEndPoint
                        }
                },{
                        type : "storage",
                        ref     : "dvs",
                        systemname :  "DC-GMO-PROD",
                        values : {
                                win_prefix : "\\\\den-dvs.dcgmo.data\\dvs-rt1\\Mediator\\prod-mediator\\",
                                unix_root : "/srv/dc-dvs/",
                                path_on_dvs : "/media/DVS-RT1/DC/Mediator/prod-mediator/",
                                path_on_mac : "/Volumes/DVS-RT1/Mediator/prod-mediator/",
                                host : "den-dvs.dcgmo.data",
                                endpoint : getDVSEndPoint
                        }
                },{
                        type : "storage",
                        ref     : "nrtisilon",
                        systemname :  "DC-GMO-DEV",
                        values : {
                                win_prefix : "\\\\den-isilon2.dcgmo.data\\DC\\GMO\\Mediator\\dev-mediator\\",
                                unix_root : "/srv/dc-isilon/",
                                path_on_dvs : "/media/Isilon2/GMO/Mediator/dev-mediator/",
                                path_on_mac : "/Volumes/Isilon2/GMO/Mediator/dev-mediator/",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "nrtisilon",
                        systemname :  "DC-GMO-QA",
                        values : {
                                win_prefix : "\\\\den-isilon2.dcgmo.data\\DC\\GMO\\Mediator\\qa-mediator\\",
                                unix_root : "/srv/dc-isilon/",
                                path_on_dvs : "/media/Isilon2/GMO/Mediator/qa-mediator/",
                                path_on_mac : "/Volumes/Isilon2/GMO/Mediator/qa-mediator/",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "nrtisilon",
                        systemname :  "DC-GMO-PROD",
                        values : {
                                win_prefix : "\\\\den-isilon2.dcgmo.data\\DC\\GMO\\Mediator\\prod-mediator\\",
                                unix_root : "/srv/dc-isilon/",
                                path_on_dvs : "/media/Isilon2/GMO/Mediator/prod-mediator/",
								path_on_mac : "/Volumes/Isilon2/GMO/Mediator/prod-mediator/",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "nrtisilon_full",
                        systemname :  "DC-GMO-DEV",
                        values : {
                                win_prefix : "\\\\den-isilon2.dcgmo.data\\DC\\",
                                unix_root : "/srv/dc-isilon-full/",
                                path_on_dvs : "/media/Isilon2/",
                                path_on_mac : "",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "nrtisilon_full",
                        systemname :  "DC-GMO-QA",
                        values : {
                                win_prefix : "\\\\den-isilon2.dcgmo.data\\DC\\",
                                unix_root : "/srv/dc-isilon-full/",
                                path_on_dvs : "/media/Isilon2/",
                                path_on_mac : "",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "nrtisilon_full",
                        systemname :  "DC-GMO-PROD",
                        values : {
                                win_prefix : "\\\\den-isilon2.dcgmo.data\\DC\\",
                                unix_root : "/srv/dc-isilon-full/",
                                path_on_dvs : "/media/Isilon2/",
								path_on_mac : "",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "delivery",
                        systemname :  "DC-GMO-DEV",
                        values : {
                                win_prefix : "\\\\den-isilon.moc.net\\IMOG\\DIGITAL_DELIVERY\\DC_INCOMING_GMO_DEV\\",
                                unix_root : "/srv/dc-delivery/",
                                path_on_dvs : "/media/Isilon_DEV/DIGITAL_DELIVERY/DC_INCOMING_GMO_DEV/",
                                path_on_mac : "/Volumes/Isilon_DEV/",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "delivery",
                        systemname :  "DC-GMO-QA",
                        values : {
                                win_prefix : "\\\\den-isilon.moc.net\\IMOG\\DIGITAL_DELIVERY\\DC_INCOMING_GMO_QA\\",
                                unix_root : "/srv/dc-delivery/",
                                path_on_dvs : "/media/Isilon/DIGITAL_DELIVERY/DC_INCOMING_GMO_QA/",
                                //path_on_mac : "/Volumes/Isilon/DIGITAL_DELIVERY/DC_INCOMING_GMO_QA/",
								path_on_mac : "/Volumes/Isilon/",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "delivery",
                        systemname :  "DC-GMO-PROD",
                        values : {
                                win_prefix : "\\\\den-isilon.moc.net\\IMOG\\DIGITAL_DELIVERY\\DC_INCOMING_GMO_PROD\\",
                                unix_root : "/srv/dc-delivery/",
                                path_on_dvs : "/media/Isilon_PROD/DIGITAL_DELIVERY/DC_INCOMING_GMO_PROD/",
								path_on_mac : "/Volumes/Isilon_PROD/",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "dc-delivery-01",
                        systemname :  "DC-GMO-DEV",
                        values : {
                                win_prefix : "\\\\dendelivery1.dcgmo.data\\GMO\\",
                                unix_root : "/srv/dc-delivery-01/",
                                path_on_dvs : "/media/delivery1/",
                                path_on_mac : "",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "dc-delivery-01",
                        systemname :  "DC-GMO-QA",
                        values : {
                                win_prefix : "\\\\dendelivery1.dcgmo.data\\GMO\\",
                                unix_root : "/srv/dc-delivery-01/",
                                path_on_dvs : "/media/delivery1/",
                                path_on_mac : "",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "dc-delivery-01",
                        systemname :  "DC-GMO-PROD",
                        values : {
                                win_prefix : "\\\\dendelivery1.dcgmo.data\\GMO\\",
                                unix_root : "/srv/dc-delivery-01/",
                                path_on_dvs : "/media/delivery1/",
                                path_on_mac : "",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "dc-delivery-02",
                        systemname :  "DC-GMO-DEV",
                        values : {
                                win_prefix : "\\\\dendelivery2.dcgmo.data\\GMO\\",
                                unix_root : "/srv/dc-delivery-02/",
                                path_on_dvs : "/media/delivery2/",
                                path_on_mac : "",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "dc-delivery-02",
                        systemname :  "DC-GMO-QA",
                        values : {
                                win_prefix : "\\\\dendelivery2.dcgmo.data\\GMO\\",
                                unix_root : "/srv/dc-delivery-02/",
                                path_on_dvs : "/media/delivery2/",
                                path_on_mac : "",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "dc-delivery-02",
                        systemname :  "DC-GMO-PROD",
                        values : {
                                win_prefix : "\\\\dendelivery2.dcgmo.data\\GMO\\",
                                unix_root : "/srv/dc-delivery-02/",
                                path_on_dvs : "/media/delivery2/",
                                path_on_mac : "",
                                host : ""
                        }
                 },{
                        type : "storage",
                        ref     : "dvs_user_qc",
                        systemname :  "DC-GMO-DEV",
                        values : {
                                win_prefix : "\\\\den-dvs.dcgmo.data\\dvs-rt1\\DC\\VENICE\\NLD_QC\\",
                                unix_root : "/srv/dc-dvs-all/",
                                path_on_dvs : "/media/DVS-RT1/DC/VENICE/NLD_QC/",
                                path_on_mac : "/Volumes/DVS-RT1/VENICE/NLD_QC/",
                                host : "den-dvs.dcgmo.data"
                        }
                },{
                        type : "storage",
                        ref     : "dvs_user_qc",
                        systemname :  "DC-GMO-QA",
                        values : {
                                win_prefix : "\\\\den-dvs.dcgmo.data\\dvs-rt1\\DC\\VENICE\\NLD_QC\\",
                                unix_root : "/srv/dc-dvs-all/",
                                path_on_dvs : "/media/DVS-RT1/DC/VENICE/NLD_QC/",
                                path_on_mac : "/Volumes/DVS-RT1/VENICE/NLD_QC/",
                                host : "den-dvs.dcgmo.data"
                        }
                },{
                        type : "storage",
                        ref     : "dvs_user_qc",
                        systemname :  "DC-GMO-PROD",
                        values : {
                                win_prefix : "\\\\den-dvs.dcgmo.data\\dvs-rt1\\DC\\VENICE\\NLD_QC\\",
                                unix_root : "/srv/dc-dvs-all/",
                                path_on_dvs : "/media/DVS-RT1/DC/VENICE/NLD_QC/",
                                path_on_mac : "/Volumes/DVS-RT1/VENICE/NLD_QC/",
                                host : "den-dvs.dcgmo.data"
                        }
                },{
                        type : "storage",
                        ref     : "browse",
                        systemname :  "DC-GMO-DEV",
                        values : {
                                win_prefix : "\\\\den-isilon2.dcgmo.data\\DC\\GMO\\Mediator\\dev-mediator\\browse\\",
                                unix_root : "/srv/browse/",
                                path_on_dvs : "/media/Isilon2/GMO/Mediator/dev-mediator/browse/",
                                path_on_mac : "/Volumes/Isilon2/GMO/Mediator/dev-mediator/browse/",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "browse",
                        systemname :  "DC-GMO-QA",
                        values : {
                                win_prefix : "\\\\den-isilon2.dcgmo.data\\DC\\GMO\\Mediator\\qa-mediator\\browse\\",
                                unix_root : "/srv/browse/",
                                path_on_dvs : "/media/Isilon2/GMO/Mediator/qa-mediator/browse/",
                                path_on_mac : "/Volumes/Isilon2/GMO/Mediator/qa-mediator/browse/",
                                host : ""
                        }
                },{
                        type : "storage",
                        ref     : "browse",
                        systemname :  "DC-GMO-PROD",
                        values : {
                                win_prefix : "\\\\den-isilon2.dcgmo.data\\DC\\GMO\\Mediator\\prod-mediator\\browse\\",
                                unix_root : "/srv/browse/",
                                path_on_dvs : "/media/Isilon2/GMO/Mediator/prod-mediator/browse/",
                                path_on_mac : "/Volumes/Isilon2/GMO/Mediator/prod-mediator/browse/",
                                host : ""
                        }
                },
				{
                        type : "system",
                        ref     : "login",
                        systemname : "DC-GMO-DEV",
                        values : {
                                ip : "localhost"
                        }
                },
				{
                        type : "system",
                        ref     : "login",
                        systemname : "DC-GMO-QA",
                        values : {
                                ip : "localhost"
                        }
                },
				{
                        type : "system",
                        ref     : "login",
                        systemname : "DC-GMO-PROD",
                        values : {
                                ip : "100.116.68.99"
                        }
                }
        ];
		
		var getSystemLoginHeadless = function(array, sysName) {
            const SYSTEM = "system";
            const LOGIN = "login";
            for each (obj in array) {
                if (obj["type"] === SYSTEM && obj["ref"] === LOGIN && obj["systemname"] == sysName) {
                    return obj.values.ip;
                }
			}			
		}
		
        // Log in to Server if necessary
        if(typeof(sessionKey)==='undefined'){
                print("Independent Session Logging into Server for Session Key");
                var independentSession = true; // Indicates that session is not controlled by Mediator and therefore logging in / logging out need to be handled
                wsLogin(getSystemLoginHeadless(allSystemVars, findSystemName()), "wsuser", "wspass");
        }

        // Run Look Up Function
        lookup = createSystemSpecificObject(allSystemVars);

        // Log out of Server if necessary
        if(independentSession){
                print("Independent Session Logging Out of Session");
                wsLogout();
        }

        print("'lookup' object created in your scope.");

})();
