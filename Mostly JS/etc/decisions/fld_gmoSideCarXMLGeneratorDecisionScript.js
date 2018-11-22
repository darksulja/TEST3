// Java Packages
importPackage(Packages.com.pharos.foldermonitor);		// gives us access to foldermonitor classes and "constants" (eg: WorkBundle.STATUS_FILE_REMOVED)
importPackage(Packages.com.pharos.poxclient);			// gives us access to FileUtils etc
importPackage(Packages.com.pharos.moxb.containers);		// gives us access to TextList and Text classes
importPackage(Packages.com.pharos.subsystem.job);		// gives us access to JobDescription class
importPackage(Packages.java.io);						// gives us access to File class etc (if reqd)
importPackage(Packages.com.pharos.core.domain.job);

// Libraries
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/lib/js/shellfun.js");

//Setting for troubleshooting
var debug = true;
//Global Vars
var csvExt = "csv";
var xmlExt = "xml";
var validExts  = [csvExt];

var failedDir =  "/failed/";
var completedDir = "/completed/";
var tagValueStudioPostDropFolder = "StudioPost";
var tagValueStudioPostComponentDropFolder = "FROM_StudioPost_T2_Components";
var xmlWriteDir="";
var videoSideCarXmlWriteDir = lookup.dropfolder[tagValueStudioPostDropFolder].mount;
var componentSideCarXmlWriteDir = lookup.dropfolder[tagValueStudioPostComponentDropFolder].mount;

///////////////////////////////////////////////////////  Start of User Defined Functions ////////////////////////////////////////////////////////////////////////

// Function to Move a File to the Failed Folder
// @param [string] - (file) - Name of File Relative to Upload Directory

// Function to Move a File to the Complete Folder
// @param [string] - (file) - Name of File Relative to Upload Directory
function isoFormatDate() {
	var d = new Date();
	return String(d.getFullYear()) + "-" + String("0" + (d.getMonth() + 1)).slice(-2) + "-" + String("0" + (d.getDate())).slice(-2)
// Function to print a string in an obvious manner
// @param [string] (str) - Error to log to screen
// **Optional** @param[heading] - Heading to display for messsage. Will default to "Error" if argument is not present
}


//////////////////////////////////////////////////////////////  Start of Standard Folder Monitor Functions //////////////////////////////////////////////////////////
function makeIdentifierFromFile(monitoredFolder, path, fileName, workBundleMap){
	print("");
	gmoNBCFunc.printObnoxiously("Making Identifier From File","New File Arrival");
	logger.info("monitoredFolder " + String(monitoredFolder));
	logger.info("path " + String(path));
	logger.info("fileName " + String(fileName));
	print("workBundleMap " + String(workBundleMap));

	var indentifier = "";
	print("Examining File ["+String(fileName)+"]");
	var uFile = new gmoNBCFunc.usefulFileObj(String(fileName));
	var name = uFile.basename;
	var ext  = uFile.extension;

	print("ext  ["+ext+"]");
	print("name ["+name+"]");

	//Check the Extension is valid
	if(validExts.indexOf(ext) == -1){
		var err = "Extension [" + ext + "] is not valid returning an ident";
		gmoNBCFunc.printObnoxiously(err);
		gmoNBCFunc.failAndMove(fileName,path,err);
		return "";
	}else{
		print("Extension [" + ext + "] is valid continuing");
	}

	// Return True Identifier
	identifier = name;
	print("");
	gmoNBCFunc.printObnoxiously("Using Identifier ["+identifier+"]","Identifier Creation");
	print("");

	return identifier;
}

function isWorkBundleReady(workBundle) {
	var isWorkBundleReady = true;
	gmoNBCFunc.printObnoxiously("Checking if WorkBundle with Identifier [" + String(workBundle.identifier) + "] is ready?","WorkBundle Analysis");
	var path = workBundle.info.path + "/";
    var fileName = String(workBundle.fileItemMap.values().iterator().next().filename);
    var fileSize = new File(path + fileName);
    print("File ["+path + fileName+"] size ["+fileSize.length()+"]");
    if (fileSize.length() == 0) {
		isWorkBundleReady = false;
	}
	if(isWorkBundleReady){
		generateXMLs(String(workBundle.identifier), path, fileName);
		gmoNBCFunc.completeAndMove(fileName,path);
		isWorkBundleReady = false;
	}
	print("isWorkBundleReady() [" + isWorkBundleReady + "]: Finished [" + path + fileName + "]\n");
	return isWorkBundleReady;
}


function generateXMLs(identifier, path, fileName) {

	gmoNBCFunc.printObnoxiously("XML Generation Starts for  Identifier [" + identifier + "]","SideCar XML Generation");

    getVersion = function(version) {
		if(version != "") {
			version = version.toUpperCase();
			if(version.indexOf("THEATRICAL")>= 0) {
				return "Theatrical Version";
			}
			else if (version.indexOf("TELEVISION")>= 0) {
				return "Television Version";
			}
		}
		return "";
	}
	
	getVersionType = function(versionType,textlessAtTail, isLangMaster, isTrailer) {
		const lm = "LM";
		const om = "OM";

		versionType = versionType.toUpperCase();
		textlessAtTail = textlessAtTail.toUpperCase();
		isTextlessComplete = "False";

		if(versionType.indexOf("TEXTED MASTER")>=0){
			switch(textlessAtTail){
				case "NONE" :
					 versionType = (isLangMaster ? lm : om) + "-FTEXTED";
					 isTextlessComplete = "False";
					 break;
				case "PARTIAL" :
					 versionType = (isLangMaster ? lm : om) + "-TATEND";
					 isTextlessComplete = "False";
					 break;
				case "COMPLETE" :
					 versionType = (isLangMaster ? lm : om) + "-TATEND";
					 isTextlessComplete = "True";
					 break;
				default :
					 versionType = (isLangMaster ? lm : om) + "-FTEXTED";
					 isTextlessComplete = "False";
			}
		}

		if(versionType.indexOf("TEXTLESS MASTER")>=0){
			switch(textlessAtTail){
				case "NONE" :
					 versionType = (isLangMaster ? lm : om) + "-FTLESS";
					 isTextlessComplete = "True";
					 break;
				case "PARTIAL" :
					 versionType = (isLangMaster ? lm : om) + "-FTLESS";
					 isTextlessComplete = "False";
					 break;
				case "COMPLETE":
					 versionType = (isLangMaster ? lm : om) + "-FTLESS";
					 isTextlessComplete = "True";
					 break;
				default :
					 versionType = (isLangMaster ? lm : om) + "-FTLESS";
					 isTextlessComplete = "True";
			}
		}

		if(versionType.indexOf("TEXTLESS ELEMENTS")>=0){
			switch(textlessAtTail){
				case "NONE" :
					 versionType = (isLangMaster ? lm : om) + "-TELEMENTS";
					 isTextlessComplete = "True";
					 break;
				case "PARTIAL" :
					 versionType = (isLangMaster ? lm : om) + "-TELEMENTS";
					 isTextlessComplete = "False";
					 break;
				case "COMPLETE" :
					 versionType = (isLangMaster ? lm : om) + "-TELEMENTS";
					 isTextlessComplete = "True";
					 break;
				default :
					 versionType = (isLangMaster ? lm : om) + "-TELEMENTS";
					 isTextlessComplete = "True";
			}
		}

		// "TR" always beats "LM" and "OM", even if it's a language master.
		versionType = isTrailer ? versionType.replace(versionType.substr(0, 2), "TR") : versionType;
		
		version = {
			versionType : versionType,
			isTextlessComplete : isTextlessComplete
		}
		return version;
	}

	isOriginal = function (value){
		if(value.indexOf("Y")>=0){
			return "True";
		}
		return "False";
	}

	getOriginalAspectRatio = function (data){
		if(data.OAR.indexOf("Y")>=0){
			//OAR = FAR
			return getAspectRatio(data.FileAspectRatio);
		} else {
			return "";
		}
	}

	getTransformation = function (frameSize) {

		frameSize = frameSize.toUpperCase();
		if(frameSize.indexOf("FF")>=0){
			return "Full Frame";
		} else if (frameSize.indexOf("LB")>=0) {
			return "Letter Box";
		} else if (frameSize.indexOf("AM")>=0) {
			return "Anamorphic";
		}
		return "";
	}

 getAspectRatio = function(aspectRatio) {
     if ("133" == aspectRatio ){
         return "1.33";
     } else if ("155" == aspectRatio){
         return "1.55";
     } else if ("156" == aspectRatio){
         return "1.56";
     } else if ("166" == aspectRatio){
         return "1.66";
     } else if ("175" == aspectRatio){
         return "1.75";
     } else if ("177" == aspectRatio){
         return "1.77";
     } else if ("178" == aspectRatio ){
         return "1.78";
     } else if ("185" == aspectRatio ){
         return "1.85";
     } else if ("189" == aspectRatio){
         return "1.89";
     } else if ("200" == aspectRatio) {
         return "2.00";
     } else if ("210" == aspectRatio) {
         return "2.10";
     } else if ("220" == aspectRatio){
         return "2.20";
     } else if ("221" == aspectRatio) {
         return "2.21";
     } else if ("235" == aspectRatio){
         return "2.35";
     } else if ("239" == aspectRatio) {
         return "2.39";
     } else if ("240" == aspectRatio){
         return "2.40";
     } else if ("250" == aspectRatio) {
         return "2.50";
     } else if ("255" == aspectRatio) {
         return "2.55";
     } else if ("255" == aspectRatio) {
         return "2.55";
     } else if ("266" == aspectRatio) {
         return "2.66";
     } else if ("276" == aspectRatio) {
         return "2.76";
     } else {
         return aspectRatio;
     }
 }


	findIfLanguagedMaster = function(_data) {
		var hasBurnIn = function(burn_in_check) {
			if (burn_in_check.BurnInSubtitle !== "" && burn_in_check.BurnInSubtitle.toLowerCase() !== "n/a"  && burn_in_check.BurnInSubtitle.toLowerCase() !== "n" && burn_in_check.BurnInForcedNarr !== "" && burn_in_check.BurnInForcedNarr.toLowerCase() !== "n/a"  && burn_in_check.BurnInForcedNarr.toLowerCase() !== "n") {
				logger.info("Have Subtitle/Forced Narrative Burn-In");
				return true;
			} else {
				return false;
			}
		};

		if (_data.SecondaryLanguage !== "" && _data.SecondaryLanguage.toLowerCase() !== "n/a")	{
			if (_data.TertiaryLanguage !== "" && _data.TertiaryLanguage.toLowerCase() !== "n/a") {
				logger.info("Have Languaged Master with 3 Languages");
				hasBurnIn(_data);	//	Called for Logging
				return true;
			}
			logger.info("Have Languaged Master with 2 Languages");
			hasBurnIn(_data);	//	Called for Logging
			return true;
		}

		if (_data.LanguageMasterType !== "" && _data.LanguageMasterType.toLowerCase() !== "n/a") {
			logger.info("Have a 'Language Master Type' set to [" + _data.LanguageMasterType + "]. Treating as Languaged Master");
			hasBurnIn(_data);	//	Called for Logging
			return true;
		}

		return hasBurnIn(_data);	//	Could have burn-in with no secondary or tertiary language
	}

	var mapping = {
		FileName 	 : "NEW Filename",
		Title		 : "Title",
		EpisodeTitle : "Episode Title",
		DaisyID 	 : "Daisy ID",
		TVDProdNo	 : "TVD Prod #",
		Version		 : "Version",
		VersionType		 : "Version Type",
		OAR			 : "OAR",
		FileAspectRatio : "Aspect Ratio",
		FrameRate    : "Frame Rate",
		FrameSize    : "Frame Size",
		AudioConfig  : "Audio Config",
		TextlessAtTail  	: "Textless at Tail?",
		TrackTypeName		: "Track Type Name",
		ComponentType		: "Component Type",
		DaisyProdNo			: "DAISY Prod #",
		ParentID 			: "Parent ID",
		OFR 				: "OFR",
		Comments        	: "Issue Resolution Notes/ Decision",
		Priority			: "Drop Folder",
		Components			: "Components",
		ComponentFileNames 	: "Component File Names",
		PrimaryLanguage		: "Language",
		SecondaryLanguage	: "Secondary Language",
		TertiaryLanguage 	: "Tertiary Language",
		FourthLanguage		: "Fourth Language",
		BurnInSubtitle		: "Burn In Subtitle",
		BurnInForcedNarr	: "Burn In FN",
		LanguageMasterType  : "Language Master Type",
		MaterialId			: "MAT_ID",
		uhdHDRFormat  		: "UHD/HDR"
	};

	// Login to the webservices
    var serverIP = lookup.system["login"].ip;
	var user = "wsuser";
	var pass = "wspass";
	logger.debug("Logging into Server [" + serverIP + "]");
	wsLogin(serverIP,user,pass);

	try {
		//Creates a File Object
		var csvFile = new File(path + fileName);
		//Reads the File
		var csvData = readFile(csvFile);
		//Load the CSV Data in to an arrray
		var csvArray = gmoNBCFunc.CSVToArray(csvData);
		// Get Header Row from csvArray
		header = csvArray[0];

		if (csvArray.length > 1000) {
			throw new Error("CSV is over 1000 rows - presume this is an error and failing before we try and interpret");
		}

		for (var index = 1 /* Skip the headers */; index < csvArray.length; index++) {
			// try {
				row = csvArray[index];
				data = {};
				for (var key in mapping ) {

					var value = row[getIndex(header, mapping[key])];
					if(typeof value == undefined || String(value) == 'undefined' ){
						value = "";
					} else {
						value =  new String(value);
					}

					if("N/A" == value.toUpperCase()){
						value = "";
					}
					data[key] = value;
					logger.info("["+ key +"] = [" +value +"]");
				}

				var usefullFileObj = new gmoNBCFunc.usefulFileObj(String(data.FileName));
				var name = usefullFileObj.basename;

				if(name == ""){
					logger.info("Skipping row as cannot determine file name ");
					continue;
				}
				if( gmoNBCFunc.isVarUsable(data.LanguageMasterType) )
				{
					logger.debug("LanguageMasterType of "+data.LanguageMasterType+" is usable");
					var territoyType = data.LanguageMasterType;
					var territoryTag = gmoNBCFunc.getTagByTagTypeAndValue("Territory Sub-Type",territoyType);
					logger.info("Territory Sub-Type in Language Master Type = '"+String(territoryTag)+"'");
					if( !gmoNBCFunc.isVarUsable(territoryTag) )
						throw new Error("Invalid Territory Sub-Type in Language Master Type of "+String(territoyType)+" found in csv file "+String(csvFile)+"!" );
				}
				else
					logger.info("No Territory Sub-Type provided in Languge Master Type - Skipping check");


				var isLanguagedMaster = findIfLanguagedMaster(data);
				var isTrailer = data.Version.toUpperCase().indexOf("TRAILER") > -1 ? true : false;
				var versionObject = getVersionType(data.VersionType,data.TextlessAtTail, isLanguagedMaster, isTrailer);
				var sideCarXML = <Delivery>
									<File_Name>{data.FileName}</File_Name>
									<Slate>
										<Program_Title>{data.Title}</Program_Title>
										<Episode_Title>{data.EpisodeTitle}</Episode_Title>
										<Version>{data.Version}</Version>
										<Original_Aspect_Ratio>{getOriginalAspectRatio(data)}</Original_Aspect_Ratio>
										<File_Aspect_Ratio>{getAspectRatio(data.FileAspectRatio)}</File_Aspect_Ratio>
										<Frame_Rate>{data.FrameRate}</Frame_Rate>
										<Original_Frame_Rate>{isOriginal(data.OFR)}</Original_Frame_Rate>
										<Transformation>{getTransformation(data.FrameSize)}</Transformation>
										<Comments>{data.Comments}</Comments>
										<AudioConfig>{data.AudioConfig}</AudioConfig>
										<TRT></TRT>
										<Text_Less>
											<Present>{versionObject.versionType}</Present>
											<Complete>{versionObject.isTextlessComplete}</Complete>
											<Start_Time/>
										</Text_Less>
										<Parts>
										</Parts>
										<ID_List>
											<ID>
												<Type>TVD</Type>
												<Value>{data.TVDProdNo}</Value>
											</ID>
											<ID>
												<Type>Daisy ID</Type>
												<Value>{data.DaisyID}</Value>
											</ID>
											<ID>
												<Type>Daisy Production #</Type>
												<Value>{data.DaisyProdNo}</Value>
											</ID>
											<ID>
												<Type>Parent ID</Type>
												<Value>{data.ParentID}</Value>
											</ID>
											<ID>
												<Type>Primary Language</Type>
												<Value>{data.PrimaryLanguage}</Value>
											</ID>
											<ID>
												<Type>Secondary Language</Type>
												<Value>{data.SecondaryLanguage}</Value>
											</ID>
											<ID>
												<Type>Tertiary Language</Type>
												<Value>{data.TertiaryLanguage}</Value>
											</ID>
											<ID>
												<Type>Fourth Language</Type>
												<Value>{data.FourthLanguage}</Value>
											</ID>
											<ID>
												<Type>Burn In Subtitle</Type>
												<Value>{data.BurnInSubtitle}</Value>
											</ID>
											<ID>
												<Type>Burn In FN</Type>
												<Value>{data.BurnInForcedNarr}</Value>
											</ID>
											<ID>
												<Type>Mediator Material ID</Type>
												<Value>{data.MaterialId}</Value>
											</ID>
										</ID_List>
									</Slate>
									<Tracks></Tracks>
								</Delivery>

				if (data.LanguageMasterType != "") {
					sideCarXML.Slate.ID_List.ID += 	<ID>
														<Type>Language Master Type</Type>
														<Value>{data.LanguageMasterType}</Value>
													</ID>;
				}

				if (data.uhdHDRFormat != "") {
					sideCarXML.Slate.ID_List.ID += 	<ID>
														<Type>UHD HDR Format</Type>
														<Value>{data.uhdHDRFormat}</Value>
													</ID>;
				}

				if(data.ComponentType.toUpperCase().indexOf("CAPTION")>= 0 || data.ComponentType.toUpperCase().indexOf("AUDIO")>= 0) {
					sideCarXML.Tracks.appendChild(addComponentTrack(data.TrackTypeName,''));
					xmlWriteDir = componentSideCarXmlWriteDir;
					fileNameAppender = "_SIDECAR";
				} else {
					if (isLanguagedMaster) {
						/*
							Audio Tracks for Multi-Language CSV
						*/
						sideCarXML.Tracks = getTracks(data);
					} else {
						/*
							Audio Tracks for Single Language CSV
						*/
						sideCarXML.Tracks = getTracks(data);
					}

					if(data.Components!="" && data.Components.length>=1){
						var components = data.Components.split(',');
						var componentFileNames = data.ComponentFileNames.split(',');
						for (var i = 0; i <components.length; i++) {
							logger.info("Adding Component for [" + components[i] + "] with filename [" + componentFileNames[i] + "]");
							sideCarXML.Tracks.Track += addComponentTrack(components[i],componentFileNames[i]);
						}
					}

					if(typeof(data.Priority) !== "undefined" && data.Priority.toString() != "") {
						xmlWriteDir = lookup.dropfolder[data.Priority.toString().replace(" ","")].mount;
					}
					else {
						xmlWriteDir = videoSideCarXmlWriteDir;
					}

					fileNameAppender = "";
				}

				logger.info("\n" + sideCarXML);
				try {

					var xmlFileName = usefullFileObj.basename + fileNameAppender + "." + xmlExt
					logger.info("\n" + xmlWriteDir + xmlFileName);
					bw = new java.io.BufferedWriter(new java.io.FileWriter(new java.io.File(xmlWriteDir + xmlFileName)));
					bw.write(sideCarXML);
					bw.close();
				} catch (e){
					logger.info("Error Writing XML for row ["+line+"] and Error is "+e);
				}

			// } catch (e) {
				// logger.info("Error Processing Line [" + index + "] - " + e.messsage);
			// }
		}
	} catch (e) {
		var err = "Error in GenerateXML "+e;
		logger.info(err);
		gmoNBCFunc.failAndMove(fileName,path,err);
	}
	logger.debug("Logging Out Web Services");
	wsLogout(); // Ready to Submit Logout
}


function getIndex(header,name){
	var index=-1;
	for (var i = header.length - 1; i >= 0; i--) {
		if(header[i].toUpperCase()==name.toUpperCase()) {
			index = i;
			break;
		}
	}
	return index;
}

function getComponentTracks(componentType, trackTypeName, format){
	var tracks = new XMLList();
	tracks =
			<Tracks>
				<Track type={componentType}>
					<Track_Type_Name>{trackTypeName}</Track_Type_Name>
			  </Track>
			</Tracks>
	return tracks;

}

function addComponentTrack(trackTypeName,fileName){

	var track = <Track type="Component">
			<Track_Type_Name>{trackTypeName}</Track_Type_Name>
			<Original_File_Name>{fileName}</Original_File_Name>
		</Track>
	return track;
}

function getTracks(_data) {
	var xmlLangCodeLookup = function(code,field) {
		field = typeof field !== 'undefined' ? field : "";
		switch (code.toLowerCase()) {
			case "ar-ar":
				return "Arabic";
				break;
			case "id-id":
				return "Indonesian";
				break;
			case "es-es":
				return "Spanish (Spain)";
				break;
			case "es-cl":
				return "Spanish (Chile)";
				break;
			case "pt-pt":
				return "Portuguese (Pt)";
				break;
			case "zh-cht":
				return "Chinese (Traditional)";
				break;
			case "ca-es":
				return "Catalan";
				break;
			case "en-us":
				return "English (US)";
				break;
			case "en-uk":
				return "English (UK)";
				break;
			case "en-gb":
				return "English (UK)";
				break;
			case "en-au":
				return "English (Aus)";
				break;
			case "cs-cz":
				return "Czech";
				break;
			case "fr-ca":
				return "French (Canadian)";
				break;
			case "it-it":
				return "Italian (Std)";
				break;
			case "es-las":
				return "Spanish (Latin America)";
				break;
			case "tr-tr":
				return "Turkish";
				break;
			case "ja-jp":
				return "Japanese (Japan)";
				break;
			case "pt-br":
				return "Portuguese (Br)";
				break;
			case "fr-fr":
				return "French (Std)";
				break;
			case "fr-be":
				return "French (Belgium)";
				break;				
			case "de-de":
				return "German (Std)";
				break;
			case "hu-hu":
				return "Hungarian";
				break;
			case "hi-in":
				return "Hindi (India)";
				break;
			case "pl-pl":
				return "Polish";
				break;
			case "ru-ru":
				return "Russian";
				break;
			case "nl-nl":
				return "Dutch (Std)";
				break;
			case "sk-sk":
				return "Slovak";
				break;
			case "he-il":
				return "Hebrew";
				break;
			case "sv-se":
				return "Swedish";
				break;
			case "nb-no":
				return "Norwegian (Nynorsk)";
				break;
			case "da-dk":
				return "Danish";
				break;
			case "vi-vn":
				return "Vietnamese";
				break;
			case "fi-fi":
				return "Finnish";
				break;
			case "fl-be":
				return "Flemish (Belgium)";
				break;
			case "is-is":
				return "Icelandic";
				break;
			case "et-ee":
				return "Estonian";
				break;
			case "lv-lv":
				return "Latvian";
				break;
			case "lt-lt":
				return "Lithuanian";
				break;
			case "el-gr":
				return "Greek";
				break;
			case "hr-hr":
				return "Croatian";
				break;
			case "bg-bg":
				return "Bulgarian";
				break;
			case "sl-sl":
				return "Slovenian";
				break;
			case "ko-kr":
				return "Korean (Korea)";
				break;
			case "zh-ti":
				return "Tibetan Chinese (Std)";
				break;
			case "sh-sh":
				return "Serbian";
				break;
			case "sh-sp":
				return "Serbian";
				break;
			case "sr-sp":
				return "Serbian";
				break;
			case "uk-ua":
				return "Ukrainian";
				break;
			case "zh-chm":
				return "Chinese (traditional), Mandarin";
				break;
			case "es-mx":
                return "Spanish (Mexico)";
                break;
			case "zh-hk":
				return "Chinese (traditional), Cantonese";
				break;	
			case "th-th":
				return "Thai";
				break;
				case "ro-ro":
				return "Romanian";
				break;				
			default:
				throw new Error("Language code lookup not defined for [" + code + "]" + (field!="" ? (" in ["+field+"] - Please check all fields are filled correctly for the selected Audio Profile") : ""));
		}

	};

	/**
	 *	Converts Text to Title Case format
	 *	@param 	[String] - Text to convert
	 *	@return	[String] - 'Title Case' format text
	 **/
	var toTitleCase = function(str) {
		return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	};

	var tracks = new XMLList();
	var audioConfig = _data.AudioConfig;
	if(typeof audioConfig !=undefined )
		audioConfig = audioConfig.toUpperCase();
		if (audioConfig == "16CH BROADCAST STANDARD") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
							</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>MOS</Track_Type_Name>
							<Description>LT/RT +0db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>5</Position>
							<Channels>2</Channels>
							<Track_Type_Name>MOS</Track_Type_Name>
							<Description>LT/RT +0db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>11</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>13</Position>
							<Channels>1</Channels>
							<Track_Type_Name>{"Mono Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>14</Position>
							<Channels>1</Channels>
							<Track_Type_Name>Mono Mix Minus</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>15</Position>
							<Channels>1</Channels>
							<Track_Type_Name>Mono Voiceover</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>16</Position>
							<Channels>1</Channels>
							<Track_Type_Name>MOS</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>
		}
		else if (audioConfig == "16CH TLD STANDARD") {
			tracks =
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
							<Position>1</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>MOS</Track_Type_Name>
							<Description>LT/RT +0db</Description>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>11</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Music</Track_Type_Name>
						<Description>LT/RT +12db</Description>          
						   <Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>13</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Effects</Track_Type_Name>
						<Description>LT/RT +12db</Description>          
						<Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>15</Position>
						<Channels>2</Channels>
						<Track_Type_Name>{"Mono Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
						<Format>PCM</Format>
					</Track>
				</Tracks>
		}

		else if (audioConfig == "16CH CEG COM W51") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
							</Track>
						<Track type="Audio">
								<Position>1</Position>
								<Channels>6</Channels>
								<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>MOS</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>11</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>13</Position>
							<Channels>1</Channels>
							<Track_Type_Name>{"Mono Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>14</Position>
							<Channels>1</Channels>
							<Track_Type_Name>Mono Mix Minus</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>15</Position>
							<Channels>1</Channels>
							<Track_Type_Name>Mono Voiceover</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>16</Position>
							<Channels>1</Channels>
							<Track_Type_Name>MOS</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>
		}
		else if (audioConfig == "16CH DWA STANDARD") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
								<Position>3</Position>
								<Channels>6</Channels>
								<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>11</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>13</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo Music</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>15</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo Effects</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>
		}
		else if (audioConfig == "16CH BROADCAST STANDARD NO DUPLICATES") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>MOS</Track_Type_Name>
							<Description>LT/RT +0db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>5</Position>
							<Channels>2</Channels>
							<Track_Type_Name>MOS 2</Track_Type_Name>
							<Description>LT/RT +0db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage) + " 2"}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>11</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>13</Position>
							<Channels>1</Channels>
							<Track_Type_Name>{"Mono Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>14</Position>
							<Channels>1</Channels>
							<Track_Type_Name>Mono Mix Minus</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>15</Position>
							<Channels>1</Channels>
							<Track_Type_Name>Mono Voiceover</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>16</Position>
							<Channels>1</Channels>
							<Track_Type_Name>MOS 3</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>
		}
		else if (audioConfig == "12CH STANDARD") {
			tracks =
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>6</Channels>
								<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Format>PCM</Format>
						</Track>
					<Track type="Audio">
								<Position>7</Position>
								<Channels>2</Channels>
								<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
						</Track>
					<Track type="Audio">
								<Position>9</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
								<Description>LT/RT +12db</Description>
						   <Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>11</Position>
								<Channels>2</Channels>
								<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage) + " 2"}</Track_Type_Name>
								<Description>LT/RT +20db</Description>
						   <Format>PCM</Format>
					</Track>
				</Tracks>
		}
		else if (audioConfig == "12CH DWA STANDARD (NETFLIX)") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>5</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>11</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage) + " 2"}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
				</Tracks>;
		}
		else if (audioConfig == "12CH DWA DUAL STEREO") {
			tracks =
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>2</Channels>
								<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Format>PCM</Format>
						</Track>
					<Track type="Audio">
								<Position>3</Position>
								<Channels>2</Channels>
								<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage) + " 2"}</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
						</Track>
					<Track type="Audio">
								<Position>5</Position>
								<Channels>6</Channels>
								<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Description>LT/RT +12db</Description>
						   <Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>11</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
								<Description>LT/RT +12db</Description>          
							   <Format>PCM</Format>
					</Track>
				</Tracks>
		}
		else if (audioConfig == "6CH STANDARD") { 
			tracks =	
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>6</Channels>
								<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Format>PCM</Format>
						</Track>
				</Tracks>
		}
		else if (audioConfig == "10CH STANDARD") { 
			tracks =	
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>6</Channels>
								<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Format>PCM</Format>
						</Track>
					<Track type="Audio">
								<Position>7</Position>
								<Channels>2</Channels>
								<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
						</Track>
					<Track type="Audio">
								<Position>9</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
								<Description>LT/RT +12db</Description>
							   <Format>PCM</Format>
						</Track>
				</Tracks>
		}
		else if (audioConfig == "10CH DLM FLIPPED STEREO") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.SecondaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>						
					</Tracks>;		
		}
		else if (audioConfig == "10CH BROADCAST STANDARD") {
			tracks =
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>6</Channels>
								<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>7</Position>
								<Channels>2</Channels>
								<Track_Type_Name>MOS</Track_Type_Name>
								<Description>LT/RT +0db</Description>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>9</Position>
						<Channels>2</Channels>
						<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
						<Description>LT/RT +12db</Description>
						<Format>PCM</Format>
					</Track>
				</Tracks>
		}
		else if (audioConfig =="20CH DWA EARLY STANDARD"){
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>6</Channels>
							<Track_Type_Name>Surround M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>15</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>17</Position>
							<Channels>1</Channels>
							<Track_Type_Name>{"Mono Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>18</Position>
							<Channels>1</Channels>
							<Track_Type_Name>Mono Effects</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>	
						<Track type="Audio">
							<Position>19</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo Mix Minus</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>	
					</Tracks>
		}
		else if (audioConfig == "8CH TLD MS") {
			tracks = <Tracks>
					<Track type="Video">
							<Format></Format>
					</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo Spanish (Latin America)</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>5</Position>
							<Channels>1</Channels>
							<Track_Type_Name>Mono Dialogue Spanish (Latin America)</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>6</Position>
							<Channels>1</Channels>
							<Track_Type_Name>Mono Spanish (Latin America)</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Mono Spanish (Latin America) 2</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
			</Tracks>;		
		}
		else if (audioConfig == "8CH TLD MEME") {
			tracks = <Tracks>
					<Track type="Video">
							<Format></Format>
					</Track>
					<Track type="Audio">
						<Position>1</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Spanish (Latin America)</Track_Type_Name>
						<Description>LT/RT +12db</Description>
						<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>5</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Music</Track_Type_Name>
						<Description>LT/RT +12db</Description>          
						   <Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>7</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Effects</Track_Type_Name>
						<Description>LT/RT +12db</Description>          
						   <Format>PCM</Format>
					</Track>
			</Tracks>;		
		}
		else if (audioConfig == "8CH TLD SLMEML") {
			tracks = <Tracks>
					<Track type="Video">
							<Format></Format>
					</Track>
					<Track type="Audio">
						<Position>1</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Spanish (Latin America)</Track_Type_Name>
						<Description>LT/RT +12db</Description>
						<Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>3</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
						<Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>5</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo M&amp;E 2</Track_Type_Name>
						<Description>LT/RT +12db</Description>          
						   <Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>7</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Mono Spanish (Latin America)</Track_Type_Name>
						<Description>LT/RT +12db</Description>          
						   <Format>PCM</Format>
					</Track>
			</Tracks>;		
		}	
		else if (audioConfig == "8CH TLD MDM") {
			tracks = <Tracks>
					<Track type="Video">
							<Format></Format>
					</Track>
					<Track type="Audio">
						<Position>1</Position>
						<Channels>2</Channels>
						<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
						<Description>LT/RT +12db</Description>
						<Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>3</Position>
						<Channels>2</Channels>
						<Track_Type_Name>{"Mono Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
						<Description>LT/RT +12db</Description>
						<Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>5</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Music</Track_Type_Name>
						<Description>LT/RT +12db</Description>          
						   <Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
			</Tracks>;		
		}
		else if (audioConfig == "8CH TLD MDME") {
			tracks = <Tracks>
					<Track type="Video">
							<Format></Format>
					</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>2</Channels>
								<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>5</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Music</Track_Type_Name>
						<Description>LT/RT +12db</Description>          
						   <Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>7</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Effects</Track_Type_Name>
						<Description>LT/RT +12db</Description>          
						   <Format>PCM</Format>
					</Track>
			</Tracks>;		
		}
		else if (audioConfig == "8CH TLD MED") {
			tracks = <Tracks>
					<Track type="Video">
							<Format></Format>
					</Track>
					<Track type="Audio">
						<Position>1</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Spanish (Latin America)</Track_Type_Name>
						<Description>LT/RT +12db</Description>
						<Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>3</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Music</Track_Type_Name>
						<Description>LT/RT +12db</Description>          
						   <Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>5</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Effects</Track_Type_Name>
						<Description>LT/RT +12db</Description>          
						   <Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Mono Dialogue Spanish (Latin America)</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;		
		}
		else if (audioConfig == "8CH TLD MS") {
			tracks = <Tracks>
					<Track type="Video">
							<Format></Format>
					</Track>
					<Track type="Audio">
						<Position>1</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Spanish (Latin America)</Track_Type_Name>
						<Description>LT/RT +12db</Description>
						<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>5</Position>
							<Channels>1</Channels>
							<Track_Type_Name>Mono Dialogue Spanish (Latin America)</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>6</Position>
							<Channels>1</Channels>
							<Track_Type_Name>Mono Spanish (Latin America)</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Mono Spanish (Latin America) 2</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
			</Tracks>;		
		}
		else if (audioConfig == "8CH SPLIT TRACK") {
					tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
								<Track type="Audio">
								<Position>5</Position>
								<Channels>1</Channels>
								<Track_Type_Name>MOS</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>6</Position>
								<Channels>1</Channels>
								<Track_Type_Name>MOS 2</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>7</Position>
								<Channels>1</Channels>
								<Track_Type_Name>MOS 3</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>8</Position>
								<Channels>1</Channels>
								<Track_Type_Name>MOS 4</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>		
					</Tracks>;
		}
		else if (audioConfig == "8CH STANDARD") {
			tracks =
				 <Tracks>
					<Track type="Video">
							<Format></Format>
					</Track>
					<Track type="Audio">
						<Position>1</Position>
						<Channels>6</Channels>
						<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
						<Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>7</Position>
						<Channels>2</Channels>
						<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
						<Description>LT/RT +12db</Description>
						<Format>PCM</Format>
					</Track>
				</Tracks>
		}
		else if (audioConfig == "8CH DWA NON STANDARD") {
			tracks =
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>2</Channels>
								<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>3</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
								<Description>LT/RT +12db</Description>
							  <Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>5</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo Music</Track_Type_Name>
							<Description>LT/RT +0db</Description>
							<Format>PCM</Format>
					</Track>
			</Tracks>
		}
		else if (audioConfig == "8CH STEREO START") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
							</Track>
			</Tracks>;
		} 
		else if (audioConfig == "8CH TLM STANDARD") {
					tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.SecondaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>5</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.SecondaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "4CH STANDARD") {
			tracks =
				 <Tracks>
						<Track type="Video">
								<Format></Format>
						</Track>
					<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
				</Tracks>
		}
		else if (audioConfig == "4CH MONO") {
			tracks =
				 <Tracks>
						<Track type="Video">
								<Format></Format>
						</Track>
					<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Mono M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
				</Tracks>
		}
		else if (audioConfig == "2CH STANDARD") {
			tracks =
				 <Tracks>
						<Track type="Video">
								<Format></Format>
						</Track>
					<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
				</Tracks>
		}
		else if (audioConfig == "2CH MONO") {
			tracks =
				 <Tracks>
						<Track type="Video">
								<Format></Format>
						</Track>
					<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
				</Tracks>
		}
		else if (audioConfig == "2CH STEREO ME") {
			tracks =
				 <Tracks>
						<Track type="Video">
								<Format></Format>
						</Track>
					<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
				</Tracks>
		}
		else if (audioConfig == "2CH DLM MONO") {
			tracks = 
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
						<Position>1</Position>
						  <Channels>1</Channels>
						<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
						<Description>LT/RT +12db</Description>
						<Format>PCM</Format>
					   </Track>
					<Track type="Audio">
						   <Position>2</Position>
						   <Channels>1</Channels>
						   <Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.SecondaryLanguage)}</Track_Type_Name>
						<Description>LT/RT +12db</Description>	 
						<Format>PCM</Format>
					   </Track>
				</Tracks>;
		}
		else if (audioConfig == "10CH TEXTLESS MASTER"){
	
			tracks =
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>2</Channels>
								<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>3</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>5</Position>
								<Channels>1</Channels>
								<Track_Type_Name>{"Mono Voiceover " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>6</Position>
								<Channels>1</Channels>
								<Track_Type_Name>{"Mono Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>7</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo Music</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>9</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo Effects</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
				</Tracks>
		}
		else if (audioConfig == "10CH 5.1 TEXTED MASTER WME"){
	
			tracks =
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>6</Channels>
								<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>7</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>9</Position>
								<Channels>2</Channels>
								<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
				</Tracks>
	
		}
		else if (audioConfig == "10CH STEREO TEXTED MASTER WME"){
			tracks =
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>2</Channels>
								<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>3</Position>
								<Channels>1</Channels>
								<Track_Type_Name>MOS</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>4</Position>
								<Channels>1</Channels>
								<Track_Type_Name>MOS 2</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>5</Position>
								<Channels>1</Channels>
								<Track_Type_Name>MOS 3</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>6</Position>
								<Channels>1</Channels>
								<Track_Type_Name>MOS 4</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>7</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>9</Position>
								<Channels>2</Channels>
								<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage) + " 2"}</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
				</Tracks>
	
		}
		else if (audioConfig == "4CH CEG TEXTED MASTER"){
			tracks =
				 <Tracks>
						<Track type="Video">
								<Format></Format>
						</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>2</Channels>
								<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>3</Position>
								<Channels>1</Channels>
								<Track_Type_Name>{"Mono Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>4</Position>
								<Channels>1</Channels>
								<Track_Type_Name>Mono Mix Minus</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
				</Tracks>
	
		}
		else if (audioConfig == "4CH CEG TEXTLESS MASTER"){
	
				tracks =
				 <Tracks>
						<Track type="Video">
								<Format></Format>
						</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>1</Channels>
								<Track_Type_Name>{"Mono Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>2</Position>
								<Channels>1</Channels>
								<Track_Type_Name>Mono Mix Minus</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
								<Position>3</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
				</Tracks>
		}
		else if (audioConfig == "2CH DLM STANDARD") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
	
		}
		else if (audioConfig == "4CH DLM STANDARD") {
			if (_data.PrimaryLanguage.toLowerCase() == _data.SecondaryLanguage.toLowerCase()) {
				var xml_str = "Stereo " + xmlLangCodeLookup(_data.SecondaryLanguage) + " 2";
			} else {
				var xml_str = "Stereo " + xmlLangCodeLookup(_data.SecondaryLanguage);
			}
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{xml_str}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
	
		}
		else if (audioConfig == "4CH DLM MONO") {
					tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.SecondaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "4CH DLM STEREO MONO") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.SecondaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "4CH TLM STANDARD") {
					tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>1</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.SecondaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>4</Position>
							<Channels>1</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.TertiaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "8CH DLM STANDARD") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.SecondaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "10CH DLM STANDARD") {
			if (_data.PrimaryLanguage.toLowerCase() == _data.SecondaryLanguage.toLowerCase()) {
				var xml_str = "Stereo " + xmlLangCodeLookup(_data.SecondaryLanguage) + " 2";
			} else {
				var xml_str = "Stereo " + xmlLangCodeLookup(_data.SecondaryLanguage);
			}
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{xml_str}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "10CH STEREO START") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>5</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
							</Track>
			</Tracks>;
		} 
		else if (audioConfig == "12CH STANDARD +20 M&E") {
					tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
							</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>11</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E 2</Track_Type_Name>
							<Description>LT/RT +20db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "12CH STANDARD MUSIC") {
					tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
							</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
								<Position>11</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo Music</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
					</Tracks>;
		}
		else if (audioConfig == "12CH MONO MUSIC") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
							</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
								<Position>11</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo Music</Track_Type_Name>
								<Description>LT/RT +0db</Description>
								<Format>PCM</Format>
					</Track>
				</Tracks>;
		}			
		else if (audioConfig == "12CH DLM STANDARD") {
			if (_data.PrimaryLanguage.toLowerCase() == _data.SecondaryLanguage.toLowerCase()) {
				var xml_str = "Stereo " + xmlLangCodeLookup(_data.SecondaryLanguage) + " 2";
			} else {
				var xml_str = "Stereo " + xmlLangCodeLookup(_data.SecondaryLanguage);
			}		
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{xml_str}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>11</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "12CH DUAL DLM") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.SecondaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "6CH STANDARD") { 
			tracks =	
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>6</Channels>
								<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Format>PCM</Format>
						</Track>
				</Tracks>
		}
		else if (audioConfig == "8CH TLD ME") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
								<Position>1</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo Spanish (Latin America)</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>5</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E 2</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Mono Effects</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>	
					</Tracks>;
		}
		else if (audioConfig == "8CH TLD MONO") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
								<Position>1</Position>
								<Channels>2</Channels>
								<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>5</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.PrimaryLanguage) + " 2"}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "6CH TLD DE") { 
			tracks =	
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
								<Position>1</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo Spanish (Latin America)</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
					</Track>
					<Track type="Audio">
							<Position>5</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Mono Dialogue Spanish (Latin America)</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
					</Track>
				</Tracks>
		}
		else if (audioConfig == "16CH DLM STANDARD") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.SecondaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>11</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.SecondaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "8CH TLD ME") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
								<Position>1</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo Spanish (Latin America)</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>5</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E 2</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Mono Effects</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>	
					</Tracks>;
		}
		else if (audioConfig == "8CH TLD MONO") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
								<Position>1</Position>
								<Channels>2</Channels>
								<Track_Type_Name>Stereo Spanish (Latin America)</Track_Type_Name>
								<Description>LT/RT +12db</Description>
								<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>5</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Mono Spanish (Latin America)</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Mono Spanish (Latin America) 2</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "8CH STEREO QUAD-LANG") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.SecondaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>5</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.TertiaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.FourthLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "22CH DWA STANDARD") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>11</Position>
							<Channels>6</Channels>
							<Track_Type_Name>Surround M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>17</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>19</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo Effects</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>21</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo Music</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "6CH STEREO MIX") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>5</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo Dialogue & Effects " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "8CH TLD MED STEREO") { 
			tracks =	
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
						<Position>1</Position>
						<Channels>2</Channels>
						<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
						<Description>LT/RT +12db</Description>
						<Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>3</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Music</Track_Type_Name>
						<Description>LT/RT +12db</Description>          
						   <Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>5</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo Effects</Track_Type_Name>
						<Description>LT/RT +12db</Description>          
						   <Format>PCM</Format>
					</Track>
					<Track type="Audio">
						<Position>7</Position>
						<Channels>2</Channels>
						<Track_Type_Name>{"Stereo Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
						<Format>PCM</Format>
					</Track>
				</Tracks>
		}
		else if (audioConfig == "16CH TLD ST STANDARD") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>MOS</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>11</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo Music</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>13</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo Effects</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>15</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>					
					</Tracks>;
		}
		else if (audioConfig == "8CH TLD ST MED") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo Music</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>5</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo Effects</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>7</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
						</Track>					
					</Tracks>;
		}
		else if (audioConfig == "22CH CM STANDARD") {
			tracks = <Tracks>
						<Track type="Video">
							<Format></Format>
						</Track>
						<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Stereo " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>3</Position>
							<Channels>6</Channels>
							<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>9</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>11</Position>
							<Channels>6</Channels>
							<Track_Type_Name>Surround M&amp;E</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>17</Position>
							<Channels>2</Channels>
							<Track_Type_Name>{"Mono Dialogue " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>19</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo Music</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
						<Track type="Audio">
							<Position>21</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo Effects</Track_Type_Name>
							<Format>PCM</Format>
						</Track>
					</Tracks>;
		}
		else if (audioConfig == "8CH 51 MONO") {
 			tracks =
 				 <Tracks>
 					<Track type="Video">
 							<Format></Format>
 					</Track>
 					<Track type="Audio">
 						<Position>1</Position>
 						<Channels>6</Channels>
 						<Track_Type_Name>{"Surround " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
 						<Format>PCM</Format>
 					</Track>
 					<Track type="Audio">
 						<Position>7</Position>
 						<Channels>2</Channels>
 						<Track_Type_Name>{"Mono " + xmlLangCodeLookup(_data.PrimaryLanguage)}</Track_Type_Name>
 						<Description>LT/RT +12db</Description>
 						<Format>PCM</Format>
 					</Track>
 				</Tracks>
 		}
		else {
			tracks =
				<Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
				</Tracks>
		}

	/*
		Sort Out any Language Burn-In
	*/
	if (typeof _data.BurnInSubtitle !== "undefined" && _data.BurnInSubtitle != "" && _data.BurnInSubtitle.toUpperCase() != "N/A" && _data.BurnInSubtitle.toUpperCase() != "N") {
		// Subtitle Burn-In
		tracks.Track.(@type.toString() == "Video").Subtitle_Burn_In += <Subtitle_Burn_In>
																				<Language>{xmlLangCodeLookup(_data.BurnInSubtitle)}</Language>
																				<Code>{_data.BurnInSubtitle}</Code>
																		</Subtitle_Burn_In>
	}
	if (typeof _data.BurnInForcedNarr !== "undefined" && _data.BurnInForcedNarr != "" && _data.BurnInForcedNarr.toUpperCase() != "N/A" && _data.BurnInForcedNarr.toUpperCase() != "N") {
		// Forced Narrative Burn-In
		tracks.Track.(@type.toString() == "Video").Forced_Narrative_Burn_In += <Forced_Narrative_Burn_In>
																					<Language>{xmlLangCodeLookup(_data.BurnInForcedNarr)}</Language>
																					<Code>{_data.BurnInForcedNarr}</Code>
																				</Forced_Narrative_Burn_In>
	}

	return tracks;
}
