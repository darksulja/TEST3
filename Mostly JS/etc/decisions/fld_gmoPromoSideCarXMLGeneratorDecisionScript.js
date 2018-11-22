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
var xmlExt = "xml"
var validExts  = [csvExt];

var failedDir =  "/failed/";
var completedDir = "/completed/";
var tagValuePromoDropFolder = "PromoUpload";
var xmlWriteDir="";
var videoSideCarXmlWriteDir = lookup.dropfolder[tagValuePromoDropFolder].mount;

///////////////////////////////////////////////////////  Start of User Defined Functions ////////////////////////////////////////////////////////////////////////2


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
	
	var mapping = {
		FileName 	 : "NEW Filename",
		PromoTitle		: "Promo Title",
		FileAspectRatio : "Aspect Ratio",
		FrameSize    : "Frame Size",
		AudioConfig  : "Audio Config"
	};
	
	try {
		//Creates a File Object 
		var csvFile = new File(path + fileName);
		//Reads the File 
		var csvData = readFile(csvFile);
		//Load the CSV Data in to an arrray
		var csvArray = gmoNBCFunc.CSVToArray(csvData);
		// Get Header Row from csvArray
		header = csvArray[0];
		
		for (var index = 1 /* Skip the headers */; index < csvArray.length; index++) {
			
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
			
			var versionObject = {
				versionType : "PR-FTEXTED",
				isTextlessComplete : "True"
			};
			
			var sideCarXML = <Delivery>
								<Slate>
									<Promo_Title>{data.PromoTitle}</Promo_Title>
									<File_Aspect_Ratio>{getAspectRatio(data.FileAspectRatio)}</File_Aspect_Ratio>
									<Transformation>{getTransformation(data.FrameSize)}</Transformation>
									<AudioConfig>{data.AudioConfig}</AudioConfig>
									<TRT></TRT>
									<Text_Less>
										<Present>{versionObject.versionType}</Present>
										<Complete>{versionObject.isTextlessComplete}</Complete>
										<Start_Time/>
									</Text_Less>
									<Parts>
									</Parts>
								</Slate>
								<Tracks></Tracks>
							</Delivery>
			 
			sideCarXML.Tracks = getTracks(data.AudioConfig);
			
			xmlWriteDir = videoSideCarXmlWriteDir;

			fileNameAppender = "";
			
			logger.info("\n"+sideCarXML);
			
			try {
				
				var xmlFileName = usefullFileObj.basename + fileNameAppender + "." + xmlExt
				logger.info("\n" + xmlWriteDir + xmlFileName);
				bw = new java.io.BufferedWriter(new java.io.FileWriter(new java.io.File(xmlWriteDir + xmlFileName)));
				bw.write(sideCarXML);
				bw.close();	
			} catch (e){
				logger.info("Error Writing XML is "+e);
			} 
		}

	} catch (e) {
		var err = "Error in GenerateXML "+e;
		logger.info(err);
		gmoNBCFunc.failAndMove(fileName,path, err);
	}
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

function getTracks(audioConfig) {
	var tracks = new XMLList();
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
	    				<Track_Type_Name>Stereo English</Track_Type_Name>
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
	    				<Track_Type_Name>Mono English</Track_Type_Name>
	    				<Description>LT/RT +12db</Description>
	    				<Format>PCM</Format>
	    			</Track>
	    			<Track type="Audio">
	    				<Position>9</Position>
	    				<Channels>2</Channels>
	    				<Track_Type_Name>Stereo English</Track_Type_Name>
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
	    				<Track_Type_Name>Mono Dialogue English</Track_Type_Name>
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
	else if (audioConfig == "16CH CEG COM W51") {
		tracks = <Tracks>
					<Track type="Video">
						<Format></Format>
						</Track>
					<Track type="Audio">
            				<Position>1</Position>
            				<Channels>6</Channels>
            				<Track_Type_Name>Surround English</Track_Type_Name>
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
	    				<Track_Type_Name>Stereo English</Track_Type_Name>
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
	    				<Track_Type_Name>Mono Dialogue English</Track_Type_Name>
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
	else if (audioConfig == "16CH BROADCAST STANDARD NO DUPLICATES") {
		tracks = <Tracks>
					<Track type="Video">
						<Format></Format>
					</Track>
					<Track type="Audio">
	    				<Position>1</Position>
	    				<Channels>2</Channels>
	    				<Track_Type_Name>Stereo English</Track_Type_Name>
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
	    				<Track_Type_Name>Mono English</Track_Type_Name>
	    				<Description>LT/RT +12db</Description>
	    				<Format>PCM</Format>
	    			</Track>
	    			<Track type="Audio">
	    				<Position>9</Position>
	    				<Channels>2</Channels>
	    				<Track_Type_Name>Stereo English 2</Track_Type_Name>
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
	    				<Track_Type_Name>Mono Dialogue English</Track_Type_Name>
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
            				<Track_Type_Name>Surround English</Track_Type_Name>
            				<Format>PCM</Format>
        			</Track>
				<Track type="Audio">
            				<Position>7</Position>
            				<Channels>2</Channels>
            				<Track_Type_Name>Stereo English</Track_Type_Name>
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
            				<Track_Type_Name>Stereo English</Track_Type_Name>
            				<Description>LT/RT +20db</Description>          
           			<Format>PCM</Format>
				</Track>
			</Tracks>
	}
	else if(audioConfig == "10CH STANDARD") { 
		tracks =	
			<Tracks>
				<Track type="Video">
					<Format></Format>
				</Track>
				<Track type="Audio">
            				<Position>1</Position>
            				<Channels>6</Channels>
            				<Track_Type_Name>Surround English</Track_Type_Name>
            				<Format>PCM</Format>
        			</Track>
				<Track type="Audio">
            				<Position>7</Position>
            				<Channels>2</Channels>
            				<Track_Type_Name>Stereo English</Track_Type_Name>
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
	else if(audioConfig == "10CH BROADCAST STANDARD") { 
		tracks =	
			<Tracks>
				<Track type="Video">
					<Format></Format>
				</Track>
				<Track type="Audio">
							<Position>1</Position>
							<Channels>6</Channels>
							<Track_Type_Name>Surround English</Track_Type_Name>
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
					<Track_Type_Name>Stereo English</Track_Type_Name>
					<Description>LT/RT +12db</Description>
					<Format>PCM</Format>
				</Track>
			</Tracks>
	}
	else if(audioConfig == "8CH STANDARD") {
		tracks =
			 <Tracks>
				<Track type="Video">
						<Format></Format>
				</Track>
				<Track type="Audio">
					<Position>1</Position>
					<Channels>6</Channels>
					<Track_Type_Name>Surround English</Track_Type_Name>
					<Format>PCM</Format>
				</Track>
				<Track type="Audio">
					<Position>7</Position>
					<Channels>2</Channels>
					<Track_Type_Name>Stereo English</Track_Type_Name>
					<Description>LT/RT +12db</Description>
					<Format>PCM</Format>
				</Track>
			</Tracks>
			
	}	
	else if(audioConfig == "4CH STANDARD") {
		tracks =
			 <Tracks>
					<Track type="Video">
							<Format></Format>
					</Track>
				<Track type="Audio">
						<Position>1</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo English</Track_Type_Name>
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
	else if(audioConfig == "4CH MONO") {
		tracks =
			 <Tracks>
					<Track type="Video">
							<Format></Format>
					</Track>
				<Track type="Audio">
						<Position>1</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Mono English</Track_Type_Name>
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
	else if(audioConfig == "2CH STANDARD") {
		tracks =
			 <Tracks>
					<Track type="Video">
							<Format></Format>
					</Track>
				<Track type="Audio">
						<Position>1</Position>
						<Channels>2</Channels>
						<Track_Type_Name>Stereo English</Track_Type_Name>
						<Description>LT/RT +12db</Description>
						<Format>PCM</Format>
				</Track>
			</Tracks>
	}
	else if(audioConfig == "2CH STEREO ME") {
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
	else if (audioConfig == "10CH TEXTLESS MASTER"){

		tracks =	
			<Tracks>
				<Track type="Video">
					<Format></Format>
				</Track>
				<Track type="Audio">
							<Position>1</Position>
							<Channels>2</Channels>
							<Track_Type_Name>Stereo English</Track_Type_Name>
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
		    				<Track_Type_Name>Mono Voiceover</Track_Type_Name>
		    				<Description>LT/RT +12db</Description>
		    				<Format>PCM</Format>
	    		</Track>
	    		<Track type="Audio">
		    				<Position>6</Position>
		    				<Channels>1</Channels>
		    				<Track_Type_Name>Mono Dialogue English</Track_Type_Name>
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
							<Track_Type_Name>Surround English</Track_Type_Name>
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
							<Track_Type_Name>Stereo English</Track_Type_Name>
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
							<Track_Type_Name>Stereo English</Track_Type_Name>
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
		    				<Track_Type_Name>Stereo English 2</Track_Type_Name>
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
							<Track_Type_Name>Stereo English</Track_Type_Name>
							<Description>LT/RT +12db</Description>
							<Format>PCM</Format>
				</Track>
				<Track type="Audio">
							<Position>3</Position>
							<Channels>1</Channels>
							<Track_Type_Name>Mono Dialogue English</Track_Type_Name>
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
	else if (audioConfig == "4CH  CEG TEXTLESS MASTER"){

			tracks =
			 <Tracks>
					<Track type="Video">
							<Format></Format>
					</Track>
				<Track type="Audio">
							<Position>1</Position>
							<Channels>1</Channels>
							<Track_Type_Name>Mono Dialogue English</Track_Type_Name>
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
	else {
		tracks =
			<Tracks>
				<Track type="Video">
					<Format></Format>
				</Track>
			</Tracks>
	}

	return tracks;
}
