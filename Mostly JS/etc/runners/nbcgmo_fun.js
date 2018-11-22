// Script to contain Functions for NBCU GMO SYSTEM
// Packages
importPackage(Packages.com.pharos.microtime);
load('/opt/evertz/mediator/lib/js/microtime.js');

var gmoNBCFunc = {



	/**
	
	 * Perform a transfer request
	 *
	 * @param	{string}	matId			material to request
	 * @param	{string}	destMedia		the media to transfer to
	 * @param	{string}	minsRequired	number of minutes into the future this transfer is required by
	 * @return	{number}	generated request id
	 * @param	{string}	trackTypeName   the track type to use (e.g. "Video" or "Audio (original)")
	 */
	makeTransferRequest : function(matId, destMedia, minsRequired, trackTypeName) {
		var future = new Date();
		var millis = (minsRequired*60)*1000;
		future.setTime(new Date().getTime() + millis);
		var isoDateString = dateToISOString(future);

		var command =
			<PharosCs>
					<CommandList>
					<Command subsystem="transfer" method="makeRequest">
							<ParameterList>
									<Parameter name="matId" value={matId}/>
									<Parameter name="destinationMedia" value={destMedia}/>
									<Parameter name="timeRequired" value={isoDateString}/>
									<Parameter name="trackTypes" value={trackTypeName}/>
							</ParameterList>
					</Command>
					</CommandList>
			</PharosCs>;
		print("Command is: "+ command);
		var result = wscall(command);
		return result..Request.@id;
	},

	remoteWebService : function() {
		this._mediatorHost = null;
		this._mediatorUser = null;
		this._mediatorPass = null;
		this._sessionKey = null;
		this._bLogout = false;
		this._httpClient = null;

		this.wscall = function(pharosCs) {
			var pharosCs = new XML(pharosCs);
			// if session key needs injecting (ie. not set, and not a login method)
			if (pharosCs.CommandList.@sessionKey.toString() == "" && pharosCs.CommandList.Command.@method != "login") {
				pharosCs.CommandList.@sessionKey = this._sessionKey;
			}

			var xmlStr = this._httpClient.sendXml(pharosCs.toXMLString());
			if (xmlStr) {
				// skip any xml processing directives as these seem to cause XML()
				// constructions a problem
				var x = xmlStr.indexOf("<Pharos");
				if( x > -1 ) {
					xmlStr = xmlStr.substr(x);
				}

				var result = new XML(xmlStr);
				// Now check the result for an Exception object
				if (result.hasOwnProperty("CommandException") || result..*.hasOwnProperty("CommandException")) {
					var sErr = "Error: Web service call failed, \nCode    = [" + result..Code + "] \nMessage = [" + result..Message + "]";
					print(sErr);
					throw new Error(sErr);
				}

				return result;
			} else {
				var sErr = "Error: HttpClient failed";
				print(sErr);
				throw new Error(sErr);
			}
		};

		this.wsLogin = function(mediatorHost, mediatorUser, mediatorPass) {
			this._mediatorHost = mediatorHost;
			this._mediatorUser = mediatorUser;
			this._mediatorPass = mediatorPass;
			if (!this._httpClient) {
				this._httpClient = new HttpClient(this._mediatorHost);
			}
			var pharosCs = <PharosCs>
							<CommandList>
								<Command subsystem="login" method="login">
									<ParameterList>
										<Parameter name="userName" value={this._mediatorUser}/>
										<Parameter name="password" value={this._mediatorPass}/>
									</ParameterList>
								</Command>
							</CommandList>
						</PharosCs>;
			var rtn = this.wscall(pharosCs);
			if (rtn.CommandList.Command.@success != "true") {
				throw new Error("login failed");
			}
			this._sessionKey = rtn..Output;
		};

		this.wsLogout = function() {
			this.wscall(<PharosCs>
							<CommandList>
								<Command subsystem="login" method="logout">
									<ParameterList>
									</ParameterList>
								</Command>
							</CommandList>
						</PharosCs>);
			this._sessionKey = null;
			this._httpClient = null;
			this._bLogout = false;
		};

		this.attachFile = function(filepath, type, id){
			var file = new File(filepath);
	        if (!file.exists()) throw new Error("File does not exist: ["+filepath+"]");
	        var filesize = file.length();
	        var filename = file.getName();
	        var attach_xml = <PharosCs>
	                        <CommandList>
	                                <Command method="attachFile" subsystem="upload">
	                                        <ParameterList>
	                                                <Parameter name="filename" value={filename}/>
	                                                <Parameter name="fileSize"><Value><Integer>{filesize}</Integer></Value></Parameter>
	                                                <Parameter name="objectId" value={id.toUpperCase()}/>
	                                                <Parameter name="objectType" value={type.toUpperCase()}/>
	                                        </ParameterList>
	                                </Command>
	                        </CommandList>
	                </PharosCs>;
	        var fileid = this.wscall(attach_xml)..Integer.toString();
	        var uploader = new HttpFileUpload(this._mediatorHost);
	        uploader.upload(filepath, fileid);
		}

	},

	/**
	 *	Opens an SSH session onto a remote host using a forced psuedo-tty, then runs a file copy on the remote host
	 *	@param [host_address] - The address of the remote host (DNS name or IP address accepted)
	 *	@param [source_path] - The source file path (on the remote host), DVS and DropBox local paths are automatically replaced
	 *
	 *
	 **/
	copyFileOnRemoteHost : function(host_address, source_path, dest_path, file_name, dest_file_name, file_size) {

		print("");

		//	Sometimes the file_name and dest_file_name are File objects (which breaks later)
		//	If this is the case then turn them into strings
		if (typeof file_name !== "string") {
			file_name = String(file_name);
		}
//		if (typeof dest_file_name !== "string") {
//			dest_file_name = String(dest_file_name);
//		}

		//	Attempt to cancel the whitespace in filenames
		file_name = file_name.replace(/ /g, "\\ ");

		if ((arguments < 5) || dest_file_name == null) {
			print("Number of arguments is ["+arguments.length+"]. Destination filename will be the same as the source");
			dest_file_name = file_name;
		}

		if ((arguments = 6) && (typeof(file_size) == "number")) {
			var check_transfer_speed = true;
		} else {
			var check_transfer_speed = false;
			file_size = "N/A";
		}

		// Logging
		print("copyFileOnRemoteHost() running with parameters:");
		print("source_address         :    "+host_address);
		print("source_path            :    "+source_path);
		print("dest_path              :    "+dest_path);
		print("file_name              :    "+file_name);
		print("dest_file_name         :    "+dest_file_name);
		print("file_size              :    "+file_size);

		// Create the endsWith function
		if (typeof String.prototype.endsWith !== 'function') {
			String.prototype.endsWith = function(suffix) {
				return this.indexOf(suffix, this.length - suffix.length) !== -1;
			}
		}

		// Get scp binary
	/*	var lookupPaths = ["/usr/local/bin/", "/usr/local/pharos/bin/", "/usr/bin/"];
		var scpPath = null;
		var scpExec = "scp";
		for each( var path in lookupPaths ) {
			if(fileExists(path + scpExec) ) {
				scpPath = path;
				break;
			}
		}
	*/
		var scp_java = JavaImporter(
			Packages.java.net,
			Packages.java.lang
		);

		// RegExp to validate IP address
		var ipRegE = /^\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}$/
		// Retry counter
		var retry_count = 0;

		// Make sure the filepaths are correctly formatted
		// Replace local mount paths with DVS relative paths
		if (!source_path.endsWith("/")) {
			source_path = source_path + "/";
		}
		if (!dest_path.endsWith("/")) {
			dest_path = dest_path + "/";
		}

		var host_address_ip = "";

		while (retry_count <= 3) {
			try {
				// Check if the addresses are hostnames or IP addresses
				if (!host_address.match(ipRegE)) {
					print("Source: Resolving IP address for name ["+host_address+"]");
					with(scp_java) {
						var source_inetAddr = InetAddress.getByName(host_address);
						host_address_ip = source_inetAddr.getHostAddress();
					}
					// Figure out the network address for the source,
					// This is so that we don't hop over VLANs unless we need to when resolving IPs via DNS
					var host_network_ip = "";
					for (var i = 0; i < String(host_address_ip).split('.').length - 1; i++) {
						host_network_ip += String(host_address_ip).split('.')[i] + ".";
					}
					host_network_ip += "0";
				} else {
					host_address_ip = host_address;
				}
				print("Got IP address ["+host_address_ip+"] for source");
				//Improper logging for NOW!!!
				//It is printing undefined because it doesnt get assigned anywhere in the code
				if (host_network_ip != "") { print("Got network address ["+host_network_ip+"] for remote host"); } // Logging

				/**
				 * Run
				 **/
				print("run command is [/usr/bin/ssh -i /opt/evertz/mediator/etc/mediator_x_rsa -oStrictHostKeyChecking=no -oUserKnownHostsFile=/dev/null evertz@" + host_address_ip + " cp " +  source_path + file_name + " " + dest_path + dest_file_name + "]");

				if (check_transfer_speed) { var start = new Date() }// For some debugging

			//	var rtn = run('/usr/bin/ssh', '-t', 'evertz@' + host_address_ip, 'cp ' +  source_path + file_name + " " + dest_path + dest_file_name);
				var rtn = run('/usr/bin/ssh', '-i', '/opt/evertz/mediator/etc/mediator_x_rsa','-oStrictHostKeyChecking=no', '-oUserKnownHostsFile=/dev/null','evertz@' + host_address_ip, 'cp ' +  source_path + file_name + " " + dest_path + dest_file_name);
				if (check_transfer_speed) {
					var diff = Math.abs(new Date() - start);
					diffSeconds = diff / 1000;
					MB = file_size;
					MBs = MB / diffSeconds;
					Mbs = MBs * 8;
					print("Transfer complete - ["+MBs.toFixed(2)+"] MB/s :: ["+Mbs.toFixed(2)+"] Mb/s");
				}
				//Sometimes we are having issues with permissions from the DropBox
				//var rtn_2 = run('/usr/bin/ssh', 'dvssan@' + host_address_ip, 'chmod', '0666', dest_path + dest_file_name); // TODO: We shouldn't have these issues, this should be fixed.
				//print("");
				return rtn;
			} catch(e) {
				retry_count++;
				print("Copy failed: "+e.message+"]");
				if (retry_count <= 3) {
					print("Retry count is at ["+retry_count+"]. Retrying transfer");
					java.lang.Thread.sleep(30000); // JVM DNS Cache is refreshed every 30 seconds
				} else {
					print("Error: Reached copy retry limit");
					throw new Error("File copy at retry limit: "+e.message);
				}
			}
		}
	},


	 // Deletes a Track from a Media
	 //@param - [string] (material_id)
	 //@param - [string] (media)
	 //@return - [xml]
	 materialTrackDelete : function(material_id, media){
	  var matDelete =
	   <PharosCs>
		<CommandList>
		 <Command subsystem="material" method="delete">
		  <ParameterList>
		   <Parameter name="matId" value={material_id}/>
		   <Parameter name="mediaNames">
			<Value>
			 <TextList>
				<Text>{media}</Text>
			 </TextList>
			  </Value>
		   </Parameter>
		   <Parameter name="deleteState">
			<Value>
			 <DeleteState>delete</DeleteState>
			</Value>
		   </Parameter>
		  </ParameterList>
		 </Command>
		</CommandList>
	   </PharosCs>;
	  return(wscall(matDelete));
	 },
	/**
	 *
	 * Makes a directory on a local path
	 * @param [destPath] [Path of directory you wish to make]
	 *
	 */

	makeDirectory	: function(destPath) {
		print("Attempting to make ["+destPath+"]")
	 	if (!fileExists(destPath)) {
		print("Making directory ["+destPath+"]");
			if (!makedir(destPath)) {
				print("Failed to make Directory - Trying once more");
				if (!makedir(destPath)) {
					print("Failed to make Directory again");
					throw new Error("Failed to make Directory");
				}
			}
		} else {
			print("Path already exists.");
		}
	},
	/**
	 * makeSymbolicLink - Makes a Symbloc Link
	 * @param [link_to_make] [The Link you want to make]
	 * @param [target] [The target of the link]
	 **/
	makeSymbolicLink : function(link_to_make, target) {
		output("gmoNBCFunc.makeSymbolicLink()");
		output("Making Link [" + link_to_make + "] -> [" + target + "]");
		try {
			Packages.java.nio.file.Files.deleteIfExists(Packages.java.nio.file.Paths.get(link_to_make));
			Packages.java.nio.file.Files.createSymbolicLink(Packages.java.nio.file.Paths.get(link_to_make), Packages.java.nio.file.Paths.get(target));
		} catch (e) {
			throw new Error("Failed to make Symbolic Link");
		}
	},

	/**
	 * Transitions All Track Types in a state for a Material with a specified requirement
	 * @param [matId] [The Material Id to be transitioned]
	 * @param [fromState] [The state to transition from]
	 * @param [requirement] [The requirement to use]
	 */

	transitionMaterial	: function(matId, fromState, requirement) {
		if (arguments.length !== 3) {
			throw new Error("Not provided enough arguments for transitioning material");
		}
		var trackTypeLinks = new XMLList(), requirementParameter, materialParameter, transitionXml, makeTransition = false;
		var materialXml = materialGet(matId, "tracktypelinks");

		for each (var ttl in materialXml..Material.TrackTypeLink) {
			if (ttl.StateName.toString() === fromState) {
			//materialWorkflowTransition(matId,requirement,ttl.TrackTypeName.toString())
			trackTypeLinks += <TrackTypeLink>
								<TrackTypeName>{ttl.TrackTypeName.toString()}</TrackTypeName>
							  </TrackTypeLink>;
			makeTransition = true;
			}
		}

		if (makeTransition) {
			requirementParameter = <Parameter name="requirement">
										<Value>
											<Requirement>
												<Name>{requirement}</Name>
											</Requirement>
										</Value>
									   </Parameter>;
			materialParameter = <Parameter name="material">
										<Value>
											<Material>
												<MatId>{matId}</MatId>
												{trackTypeLinks}
											</Material>
										</Value>
									</Parameter>;
			transitionXml = <PharosCs>
									<CommandList sessionKey={_sessionKey}>
										<Command subsystem="workflow" method="transition">
											<ParameterList>
											{materialParameter}
											{requirementParameter}
											</ParameterList>
										</Command>
									</CommandList>
								</PharosCs>;
			wscall(transitionXml);
		}
	},

	/**
	 *Returns Boolean based on whether value is in array
	 *@param [arr] [The array to use]
	 *@param [val] [The value to match in array]
	 *@return [Returns Boolean]
	*/

	contains:function(arr, val) {
		if (arguments.length !== 2)
			throw new Error("Missing arr and/or val for #contains.")

		if (typeof arr !== 'object')
			throw new Error("First argument for #contains must be an array.")

		if (arr === val) return true;
		var i = arr.length;
		while (i--) if (arr[i] === val) return true;
		return false;
	},

	containsIgnoreCase:function(arr, val) {
		if (arr === val) return true;
		var i = arr.length;
		while (i--) if (gmoNBCFunc.equalsIgnoreCase(arr[i],val)) return true;
		return false;
	},

	equalsIgnoreCase:function(str1, str2) {
		if (str1.toLowerCase() === str2.toLowerCase()) return true;
		return false;
	},

	// Generic Time Code function to decide which specific function to call
	// @param [string] - file
	// @return [object] - see individual files for details
	// @error - if an unsupported codec is used]
	getTimeCodes : function(file) {
		// Find Extension
		var ext = file.substr(file.lastIndexOf(".")+1,file.length);

		if (ext === "mov") {
			if(typeof MediaInfoHelper == "undefined"){
				load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js");
			}
			var mediainfoxml = gmoNBCFunc.getFileInfoXml(file);
			var mediainfohelper = new MediaInfoHelper();
			mediainfohelper.setMediaInfoXml(mediainfoxml);
			return this.getMovTimeCodes(file,mediainfohelper.getFrameRate());
		} else {
			throw new Error("Cannot currently extract timecodes for [" + ext + "]");
		}
	},
	// Gets the Incode/Outcode/Duration/FrameRate of a Mov File
	// @input  [string] - full path to Mov File
	// @return [object] - showing Incode/Outcode/Duration/FrameRate of file - Warning the key pair values are Java Objects - you made need to String(value)
	// @error if file does no exist
	// @error if the extension is not mov
	getMovTimeCodes:function(file , frame_rate){

		var movExt     = "mov",
			movDotExt  = "."+movExt,
			num_frames,
			incode_str,
			frame_rate;

		if(!fileExists(file)){
			throw new Error("Cannot find file at ["+file+"]");
		}
		if(!file.toLowerCase().endsWith(movDotExt)){
			throw new Error("File ["+file+"] does not end with ["+movDotExt+"]");
		}

		var res = eval('(' + run('/usr/bin/ffprobe', '-i', file, '-show_streams', '-print_format', 'json').output + ')');

			for (var i = 0, len = res.streams.length; i < len; i += 1) {
				var stream = res.streams[i];

				if (stream.codec_type === 'video') {
					num_frames = parseInt(stream.nb_frames);
				} else if (stream.codec_tag_string === 'tmcd') {
					var tcindex = i;
					incode_str = stream.tags.timecode;
				}
			}

			if (num_frames === undefined) {
				throw new Error("Could not find video stream: " + file + " - Check File Format");
			}
			if (incode_str === undefined) {
				throw new Error("Could not find timecode stream: " + file + " - Check File Format");
			}

			var duration = AmountOfTime.parseFrames(frame_rate, new java.lang.Double(num_frames));
			var incode   = FrameLabel.parseText(frame_rate, incode_str);
			// Duration is difference between incode and outcode *inclusive*, so need to subtract 1 frame.
			var outcode = incode.add(duration).subtract(AmountOfTime.parseFrames(frame_rate, new java.lang.Double(1)));

			return {
				duration   : duration,
				incode     : incode,
				outcode    : outcode,
				frame_rate : frame_rate,
				extension  : movExt,
				tcindex    : tcindex
			};
	},

	// Checks None of the Object Key Pairs are undefined
	// @param  [object]
	// @return [boolean] - true if none of the Properties are blank
	// @error - if any of the Properties are undefined
	checkKeyPairsAreDefined:function(obj){
		for(var _prop in obj){
			if(debug) print(_prop+" : "+obj[_prop]);
			if(obj[_prop] === undefined){
				throw new Error("Object Property ["+_prop+"] is ["+obj[_prop]+"]");
			}
		}
		return true;
	},

	//Gets Information relating to File From Media Info in the Form of XML
	// @param  [string] - unix path to the File
	// @return [xml]   - with information
	// @error - if MediaInfo is not installed
	getFileInfoXml	: function(filePath) {
		// Check Mediainfo is installed, and ascertain its install path
		var lookupPaths   = ["/usr/local/bin/", "/usr/bin/"];
		var mediaInfoPath = null;
		var mediaInfoExec = "mediainfo";

		for each( var path in lookupPaths ) {
	  		if( fileExists(path + mediaInfoExec) ) {
	    		mediaInfoPath = path;
	    		break;
	         }
	  	}

	  	if( !mediaInfoPath ) {
	  		throw new Error("Sorry, mediainfo is not currently installed.  Please contact Integration for an RPM.");
	  	}

	  	var xml_java_string = new java.lang.String(run(mediaInfoPath + mediaInfoExec, "-f", "--Output=XML", filePath).output);
	  	var xml = XML(xml_java_string.replaceFirst("<\\?xml[^>]*\\?>[\n\r\t ]*", ""));
	  	return xml.File;
	},


	//Checks whether a match can be made from a Profile to
	// @param  [xml]     - MediaInfo Xml
	// @param  [string]  - Profile to Check
	// @return [boolean] - Indicating whether a Profile has been matched
	runProfileValidation : function(fileInfoXml, contProfileName) {
		print("Evaluating against Profile ["+contProfileName+"]")
		var contProfile = NBCGMO.contributionProfiles[contProfileName];
		//NBCFunc.printObj(contProfile);
		var passedChecks = true;
		for (var prop in contProfile) {
			var setValue = contProfile[prop];
			var typeAndValue = this.getTypeAndValueMediainfoLookup(prop,fileInfoXml);
			if (typeof(typeAndValue) !== "undefined") {
				var prntMsg = "["+prop+ "], specified ["+setValue+"], actual ["+typeAndValue.value+"]";
				if (typeAndValue.type === "equal") {
					if (typeof(setValue) == "object") {
						// This assesses against arrays of properties
						var isAnyValueMatchedInArray = false;
						for (var u=0; u < setValue.length; u++) {
							var prntMsg = "["+prop+ "], specified ["+setValue[u]+"], actual ["+typeAndValue.value+"]";
							if (typeAndValue.value === setValue[u]){
								print("["+contProfileName+"] - Passed: "+prntMsg);
								isAnyValueMatchedInArray = true;
								break;
							}
						}
						if(!isAnyValueMatchedInArray){
							print("["+contProfileName+"] - FAILED: "+prntMsg);
							passedChecks = false;
						}
					} else {
						if (typeAndValue.value === setValue){
							print("["+contProfileName+"] - Passed: "+prntMsg);
						} else {
							print("["+contProfileName+"] - FAILED: "+prntMsg);
							passedChecks = false;
						}
					}
				}
				if (typeAndValue.type === "minimum"){
					if (typeAndValue.value >= setValue){
						print("["+contProfileName+"] - Passed: "+prntMsg);
					} else {
						print("["+contProfileName+"] - FAILED: "+prntMsg);
						passedChecks = false;
					}
				}
				if (typeAndValue.type === "maximum"){
					if (typeAndValue.value <= setValue){
						print("["+contProfileName+"] - Passed: "+prntMsg);
					} else {
						print("["+contProfileName+"] - FAILED: "+prntMsg);
						passedChecks = false;
					}
				}
			} else {
				print("["+contProfileName+"] - Property ["+prop+"] not defined in lookup");
			}
		}
		return passedChecks;
	},

	// Look Up for MediaInfo Validation - designed to be used in conjunction with runProfileValidation
	// Note Specific Values are checked by using XML.Child[1] or Xml.Child.(Val==XXX).Name
	// @param  [string/int] - Used for ascertaining
	// @param  [xml]        - Showing Metadata relating to file
	// @param [object]    {
	//							type  : Showing whether the Param should be equal, greater (minimum) than or less (maximum) than (passed to parent method)
	// 							value :
	//                     }
	getTypeAndValueMediainfoLookup	: function(prop, mediainfoXml) {
		function propertyNotFound(p) {
			return {
				"type"	:	"equal",
				"value"	:	"Warning: Property ["+p+"] Not Found"
			}
		}

		if (prop === "videoFramerate") {
			if (mediainfoXml.track.(@type == "Video").Frame_rate[0]) {
				var value = parseFloat(mediainfoXml.track.(@type == "Video").Frame_rate[0]);
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else{
				propertyNotFound(prop)
			}
		}
		if (prop === "codecsVideo") {
			if (mediainfoXml.track.(@type == "General").Codecs_Video[0]) {
				var value = mediainfoXml.track.(@type == "General").Codecs_Video[0].toString();
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "videoBitDepth") {
			if (mediainfoXml.track.(@type == "Video").BitDepth[0]) {
				var value = mediainfoXml.track.(@type == "Video").BitDepth[0].toString();
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "videoFormatCommercial") {
			if (mediainfoXml.track.(@type == "Video").Format_Commercial[0]) {
				var value = mediainfoXml.track.(@type == "Video").Format_Commercial[0].toString();
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "generalFormat") {
			if (mediainfoXml.track.(@type == "General").Format[0]) {
				var value = mediainfoXml.track.(@type == "General").Format[0].toString();
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "codecID") {
			if (mediainfoXml.track.(@type == "Video").Codec_ID[0]) {
				var value = mediainfoXml.track.(@type == "Video").Codec_ID[0].toString();
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "minVideoBitrate") {
			if (mediainfoXml.track.(@type == "Video").Bit_rate[0]) {
				var value = parseInt(mediainfoXml.track.(@type == "Video").Bit_rate[0]);
				return {
					"type" 	: "minimum",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "maxVideoBitrate") {
			if (mediainfoXml.track.(@type == "Video").Bit_rate[0]) {
				var value = parseInt(mediainfoXml.track.(@type == "Video").Bit_rate[0]);
				return {
					"type" 	: "maximum",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "exactVideoBitrate") {
			if (mediainfoXml.track.(@type == "Video").Bit_rate[0]) {
				var value = parseInt(mediainfoXml.track.(@type == "Video").Bit_rate[0]);
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "minVideoWidth") {
			if (mediainfoXml.track.(@type == "Video").Width[0]) {
				var value = parseInt(mediainfoXml.track.(@type == "Video").Width[0]);
				return {
					"type" 	: "minimum",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "maxVideoWidth") {
			if (mediainfoXml.track.(@type == "Video").Width[0]) {
				var value = parseInt(mediainfoXml.track.(@type == "Video").Width[0]);
				return {
					"type" 	: "maximum",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "exactVideoWidth") {
			if(mediainfoXml.track.(@type == "Video").Original_width[0]) {

				var value = parseInt(mediainfoXml.track.(@type == "Video").Original_width[0]);
				return {
					"type" 	: "equal",
					"value" : value
				}

			}else if (mediainfoXml.track.(@type == "Video").Width[0]) {

				var value = parseInt(mediainfoXml.track.(@type == "Video").Width[0]);
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "minVideoHeight") {
			if (mediainfoXml.track.(@type == "Video").Height[0]) {
				var value = parseInt(mediainfoXml.track.(@type == "Video").Height[0]);
				return {
					"type" 	: "minimum",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "maxVideoHeight") {
			if (mediainfoXml.track.(@type == "Video").Height[0]) {
				var value = parseInt(mediainfoXml.track.(@type == "Video").Height[0]);
				return {
					"type" 	: "maximum",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "exactVideoHeight") {

			if(mediainfoXml.track.(@type == "Video").Original_height[0]) {
				var value = parseInt(mediainfoXml.track.(@type == "Video").Original_height[0]);
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else if (mediainfoXml.track.(@type == "Video").Height[0]) {
				var value = parseInt(mediainfoXml.track.(@type == "Video").Height[0]);
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "exactVideoCount") {
			if (mediainfoXml.track.(@type == "General").Count_of_video_streams) {
				var value = parseInt(mediainfoXml.track.(@type == "General").Count_of_video_streams);
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "minAudioChannels") {
			if (mediainfoXml.track.(@type == "General").Count_of_audio_streams) {
				var value = parseInt(mediainfoXml.track.(@type == "General").Count_of_audio_streams);
				return {
					"type" 	: "minimum",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "videoFormat") {
			if (mediainfoXml.track.(@type == "Video").Format[0]) {
				var value = mediainfoXml.track.(@type == "Video").Format[0].toString();
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "videoChromaSampling") {
			if (mediainfoXml.track.(@type == "Video").Chroma_subsampling[0]) {
				var value = mediainfoXml.track.(@type == "Video").Chroma_subsampling[0].toString();
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "videoFormatProfile") {
			if (mediainfoXml.track.(@type == "Video").Format_profile[0]) {
				var value = mediainfoXml.track.(@type == "Video").Format_profile[0].toString();
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "videoScan") {
			if (mediainfoXml.track.(@type == "Video").Scan_type[0]) {
				var value = mediainfoXml.track.(@type == "Video").Scan_type[0].toString();
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
		if (prop === "channelNum") {
			if (mediainfoXml.track.(@type == "Audio").Channel_s_[0]) {
				var value = mediainfoXml.track.(@type == "Audio").Channel_s_[0].toString();
				return {
					"type" 	: "equal",
					"value" : value
				}
			} else {
				propertyNotFound(prop)
			}
		}
	},


	// Gets the Extension of a File
	// @param  [string]  - of File
	// @param  [boolean] - decicides whether to validate extension
	// @return [string]  - of extension
	// @error - if the optional check parameter is set and the extension isn't valid
	getFileExtension: function(file,validate){
		var ext = file.substr(file.lastIndexOf(".")+1);
		// Optional Param
		if(validate){
			this.validateExt(ext);
		}
		return ext;
	},

	// Looks to see whether an extension is valid in the system
	// @param  [string]  - extension
	// @return [boolean]
	// @error if the extension is not vaild against predefined list
	validateExt:function(ext){
		var valid = NBCGMO.fileExtensions.indexOf(ext);
		if (valid == -1) {
			throw new Error("Extension ["+ext+"] is not Valid in the System");
		}
		return true;
	},

	// Removes Extension from File. (Uses last "." )
	// @param  [string] - fileWithExt (Full File)
	// @return  undefined || string depending on if a match was found
	getBaseFileName : function(fileWithExt) {
		var baseFile = fileWithExt.substr(0, fileWithExt.lastIndexOf("."));
		return baseFile === "" ? undefined : baseFile;
	},

	// Gets the Size of a File in Bytes
	// @param [string]  - full path to file
	// @return [number] - bytes of file
	// @error - if the file does not exist
	// @error - if the amount of bytes is 0
	getFileBytes : function(file) {
        var f = new File(file);
        if (f.exists()) {
                var filebytes = f.length();
                if (filebytes >= 0) {
                        return filebytes;
                } else {
                        throw new Error("Unexpected filebytes ["+filebytes+"] returned from File ["+file+"]");
                }
        } else {
                throw new Error("File ["+file+"] does not exist.");
        }
    },

	// Creates Track Type Link Nodes
	// @param [string] - Name of Track Type
	// @param [string] - Name of State
	// @param [string] - Name of State Machine
	// @return [xml]
	// @error - if not enoigh arguments are provided
	createTrackTypeLinkNode : function(tracktypename,statename,statemachine){

	  	if(arguments.length !== 3) throw new Error("Not enough arguments to build a TrackTypeLink Node");

	    var xml =
	        <TrackTypeLink>
	            <TrackTypeName>{tracktypename}</TrackTypeName>
	            <StateName>{statename}</StateName>
	            <StateMachine>{statemachine}</StateMachine>
	        </TrackTypeLink>;

	    return xml;
	},

	// Saves a simple unencoded (No Incode Outcode) Track on a specified Media with no File Extension or File Bytes
	// @param[string] - matId (Name of the Material)
	// @param[string] - media (Name of the Media)
	// @return[boolean] - indicating the success of the WSCall
	simpleUnencodedTrackSave : function(matId,media){

		var xml =
				<Material>
					<MatId/>
					<Track>
						<FileId/>
						<MediaName/>
					</Track>
				</Material>;

		xml.MatId = matId;
		xml.Track.FileId = this.getSafeFileId(matId);
		xml.Track.MediaName = media;

		print("\nSaving Simple Unencoded Track for Material ["+matId+"] on media ["+media+"]");
		if(debug) print("\nDEBUG:\n"+xml);
		return materialSave(xml);

	},

	// Saves a simple encoded (No Incode Outcode) Track on a specified Media with File Extension and File Bytes
	// @param[string] - matId (Name of the Material)
	// @param[string] - media (Name of the Media)
	// @return[boolean] - indicating the success of the WSCall
	simpleEncodedTrackSave : function(matId,media,frameRate,path){

		var xml =
				<Material>
				   	<MatId/>
				   	<Track>
					   	<MediaName/>
						<FrameRate/>
						<FileId/>
						<FileExtension/>
						<FileBytes/>
						<Encoded/>
					</Track>
				</Material>;

		xml.MatId               = matId;
		xml.Track.MediaName     = media;
		xml.Track.FrameRate     = frameRate;
		xml.Track.FileId        = this.getSafeFileId(matId);
		xml.Track.FileExtension = this.getFileExtension(path);
		xml.Track.FileBytes     = this.getFileBytes(path);
		xml.Track.Encoded       = true;

		print("\nSaving Simple Encoded Track for Material ["+matId+"] on Media ["+media+"]");
		if (debug) print("\nDEBUG: \n"+xml);
		return materialSave(xml);

	},

	/**Saves Unencoded Track on Media (No Track Def cleverness on an unencoded save)
	* @param[string] - matId (Name of the Material)
	* @param[string] - media (Name of the Media)
	* @param[string/javaobj] - frameRate (FrameRate of the Track)
	* @param[string] - incode (Incode of the Track)
	* @prarm[string] - outcode (Outcode of the Track)
	*/
	complexUnencodedTrackSave : function (matId,media,frameRate,incode,outcode){

		var xml =
				<Material>
					<MatId/>
					<Track>
						<FileId/>
						<MediaName/>
						<FrameRate/>
						<Incode/>
						<Outcode/>
					</Track>
				</Material>;

		xml.MatId = matId;
		xml.Track.FileId = this.getSafeFileId(matId);
		xml.Track.MediaName = media;
		xml.Track.FrameRate = frameRate;
		xml.Track.Incode = incode;
		xml.Track.Incode.@rate = frameRate;
		xml.Track.Outcode = outcode;
		xml.Track.Outcode.@rate = frameRate;

		print("\nSaving Complex Unencoded Track for Material ["+matId+"] on Media ["+media+"]");
		if(debug) print("\nDEBUG:\n"+xml);
		return materialSave(xml);
	},

	// Track Save (Full Version)
	// @param [string] 			matId        - Name of the Material
	// @param [string] 			media        - Name of the Media
	// @param [javaobj/string]  frameRate    - Frame Rate of the Track
	// @param [string]          incode       - Incode of the Track
	// @param [string]          outcode      - Outcode of the Track
	// @param [string]          path         - Path to the Source File
	// @param [array]           tracktypes    - List of Track Types
	// @param [profile]         profile    	 - Object containing Details
	// @return [boolean]        Indicating whether the save was a success
	complexEncodedTrackSave : function(matId,media,frameRate,incode,outcode,path,tracktypes,profile,sourceTrackTypes){

		if (debug) print("\nDEBUG : In complexEncodedTrackSave");
		// Get Profile Obj - Links Essence Type and Format for Track / Track Defs
		var profileObj = NBCGMO.contributionProfilesMetaData[profile];
		var videoTrackType = "Video";
		if (!profileObj) throw new Error("Failed to Find MetaData relating to Profile ["+profile+"]");
		// At the moment this function is designed for self contained files
		if (tracktypes.indexOf(videoTrackType) === -1) throw new Error("complexEncodedTrackSave() only handles Self Contained files at the moment. No Video Track Type Specified");
		if (tracktypes[0] !== videoTrackType) throw new Error("complexEncodeTrackSave() must have Video as First Track Type. First Track Type is Currently [" + tracktypes[0] + "]");

		// Call other functions to help
		var systemTrackTypesList = this.getTrackTypes();
		var fileId = this.getSafeFileId(matId);
		var fileExtension = this.getFileExtension(path);
		var fileBytes = this.getFileBytes(path);
		var mediainfoxml = this.getFileInfoXml(path);

		if (debug) {
			print("FileId ["+fileId+"]");
			print("fileExtension ["+fileExtension+"]");
			print("FileBytes ["+fileBytes+"]");
			print("Mediainfoxml ["+mediainfoxml+"]");
		}

		var xml =
				<Material>
				   	<MatId/>
				   	<Track>
					   	<MediaName/>
						<FrameRate/>
						<Incode/>
						<OutCode/>
						<FileId/>
						<FileExtension/>
						<FileBytes/>
						<Encoded/>
					</Track>
				</Material>;

		// Add to the Track Save Stub
		xml.MatId               = matId;
		xml.Track.MediaName     = media;
		xml.Track.FrameRate     = frameRate;
		xml.Track.Incode.@rate  = frameRate;
		xml.Track.Incode        = incode;
		xml.Track.Outcode.@rate = frameRate;
		xml.Track.Outcode       = outcode;
		xml.Track.FileId        = fileId;
		xml.Track.FileExtension = fileExtension
		xml.Track.FileBytes     = fileBytes;
		xml.Track.Encoded       = true;
		// <EssenceType/> Add in when ready

		// Loop through each of the Track Types building up a Track Def
		// i is used to iterate through the Track Types and therefore Track Position
		// j is used to iterate specifically through the Audio Streams
		// k is used to represent the File positions
		for (var i=0,j=0,k=0; i< tracktypes.length; i++) {

			//PUll out the Information from Xml into friendly variables
			var systemTrackTypeInfo = systemTrackTypesList..TrackType.(Name.toString()===tracktypes[i]);
			if(systemTrackTypeInfo.length() === 0) throw new Error("Track Type ["+tracktypes[i]+"] not defined in system");
			var ttClass = systemTrackTypeInfo.ClassId.toString();
			var ttName  = systemTrackTypeInfo.Name.toString();

			var tdXml = <TrackDefinition>
							<TrackTypeName/>
							<Position/>
							<FileId/>
							<FilePosition/>
							<Channels/>
						</TrackDefinition>;

			// Mandatory Elements
			tdXml.TrackTypeName = ttName;
			tdXml.Position      = i + 1;
			tdXml.FileId        = fileId + "." + fileExtension;
			tdXml.FilePosition  = k;

			// Work Out Channels and MetaData Information for the optional Track Definition Columns
			if (ttClass==="VIDEO") {
				tdXml.Channels = 1;
				print('TESTV');
				// Empty Xml Elements cause the WSCall to Fail. Check for Value and if true create Element
				var mediaInfoVideoTrackNode = mediainfoxml.track.(@type.toString()==="Video");
				if (debug) print("\n\n Video HELP j["+j+"] i ["+i+"] \n" + mediaInfoVideoTrackNode);

				// <Format>
				var format = profileObj.format;
				if (format) tdXml.Format = format;
				// <BitRate>
				var bitRate = mediaInfoVideoTrackNode.Bit_rate[0].toString();
				if (bitRate) tdXml.BitRate = bitRate;
				// <Width>
				var width = mediaInfoVideoTrackNode.Width[0].toString();
				if (width) tdXml.Width = width;
				// <Height>
				var height = mediaInfoVideoTrackNode.Height[0].toString();
				if (height) tdXml.Height = height;
				// <ChromaSubsampling>
				var chromaSampling = mediaInfoVideoTrackNode.Chroma_subsampling.toString();
				if (chromaSampling) tdXml.ChromaSubsampling = chromaSampling;
				// <ScanType>
				var scanType = mediaInfoVideoTrackNode.Scan_type[0].toString();

				if(typeof scanType !='undefined' &&  scanType.toUpperCase() == 'INTERLACED'){
					var scanOrder = mediaInfoVideoTrackNode.Scan_order[0];
					if(typeof scanOrder!='undefined' && scanOrder.toUpperCase() == 'TFF' ){
						scanType = "Interlaced_Upper";
					}else if (typeof scanOrder!='undefined' && scanOrder.toUpperCase() == 'BFF' ){
						scanType = "Interlaced_Lower";
					}
				}
				if (scanType) tdXml.ScanType = scanType;
				// <ChannelPositions>
				var channelPos = mediaInfoVideoTrackNode.Channel_positions.toString();
				if (channelPos)	tdXml.ChannelPositions = channelPos;
				// Video is first and set to 0. Increase by 1 so Audio File Positions starts at 1
				k++;
			} else if (ttClass==="AUDIO") {
				// Decide if Track Type is Mono based upon Name - Could add in a mapping object at somepoint if needed
				//Dirty Fix to see where it fails again
				print('TEST');
				print(mediainfoxml..track.(@type.toString()==="Audio"))
				print(mediainfoxml..track.(@type.toString()==="Audio").length())
				if(mediainfoxml..track.(@type.toString()==="Audio").length() == 1){
					var mediaInfoAudioTrackNode = mediainfoxml..track.(@type.toString()==="Audio");
				}else{
					var mediaInfoAudioTrackNode = mediainfoxml..track.(@type.toString()==="Audio")[j];
				}

				if(debug) print("\n\n Audio HELP j["+j+"] i ["+i+"]");
				if (debug) print("\n ["+mediaInfoAudioTrackNode+"]");
				// <Format>
				var format = mediaInfoAudioTrackNode.Format.toString();
				if (format) tdXml.Format = format;
				// <BitRate>
				var bitRate = mediaInfoAudioTrackNode.Bit_rate[0].toString();
				if (bitRate) tdXml.BitRate = bitRate;
				// <BitDepth>
				var bitDepth = mediaInfoAudioTrackNode.Bit_depth[0].toString();
				if (bitDepth) tdXml.BitDepth = bitDepth;
				// <SamplingRate>
				var samplingRate = mediaInfoAudioTrackNode.Sampling_rate[0].toString();
				if (samplingRate) tdXml.SamplingRate = samplingRate;
				// <ChannelPositions>
				var channelPos = mediaInfoAudioTrackNode.Channel_positions.toString();
				var trackType = sourceTrackTypes..TrackType[i];
				print(trackType);
				// Work Out the Number of Channels Depending on Track Type Name
				if (parseInt(trackType.Channels.toString())==1) {
					// Single Channel Represented by Mono Track Type
					tdXml.Channels = 1;
					if (channelPos) tdXml.ChannelPositions = channelPos;
					// Single Channel increment by 1
					j++;
					// Used 1 Channel of Audio. Increment File Position by
					k++;
				} else {
					// Two Channels represented by Stereo Track Type
					tdXml.Channels = 2;
					// Find the Sibling Channel Pos
					var nextChannelPos;
					if (channelPos && typeof mediainfoxml.track.(@type.toString()==="Audio")[j+1]!="undefined") {
						nextChannelPos = mediainfoxml.track.(@type.toString()==="Audio")[j+1].Channel_positions.toString();
					}
					// Concat Channel Pos and Next one since this Track Def represents Streams of Audio
					if (channelPos && nextChannelPos) tdXml.ChannelPositions = channelPos + " + " + nextChannelPos;
					// 2 Channels so increment by 2
					j+=2;
					// Used 2 Channels of Audio. Increment File Position by 2
					k+=2;
				}
			} else {
				throw new Error("complexEncodedTrackSave() Currently Unable to Support TrackType Class ["+ttClass+"]");
			}
			// Add the Track Definition to the Track
			xml.Track.appendChild(tdXml);

            // Add Track Files to each Track Definition
			this.createTrackFileForTrackDefs(xml);
		}

		print("\nSaving Complex Encoded Track for Material ["+matId+"] on Media ["+media+"]");
		print("\n"+xml);
		return materialSave(xml);
	},

    createTrackFileForTrackDefs : function(materialXml) {

		// Used to create a new empty track file, prevents object pointer issues.
		var createEmptyTrackFile = function() {
			return new XML(<TrackFile>
							<Path></Path>
							<Name></Name>
							<Bytes></Bytes>
						  </TrackFile>);
		}

		// Loop over each track in the MaterialXml.
		for each (var track in materialXml..Track){
			var matId = materialXml.MatId.toString();
			var mediaName = track.MediaName.toString();

			// Make sure it has some track def's to update first :)
			if (track.TrackDefinition.length() >= 1){
				var trackFile = createEmptyTrackFile();
				var trackFileId = track.FileId.toString();
				var trackExtension = track.FileExtension.toString();

				trackFile.Path = this.getMediaTrackFilePath(matId, mediaName); //"";
				trackFile.Bytes = track.FileBytes.toString();
				trackFile.Name = trackFileId + "." + trackExtension;

				// Add the track file to each track def.
				for each (var trackDefinition in track.TrackDefinition){
					var trackDefFileId = trackDefinition.FileId.toString();
					// Override the trackFile name if the track def has its own fileId.
					trackFile.Name = trackDefFileId != "" && trackDefFileId != null ? trackDefFileId : trackFileId + "." + trackExtension;

					trackDefinition.TrackFile = trackFile;
				}
			} else {
				// Should we throw an error if a track in the XML doesn't have any track definitions.
				output("Track for Media [" + mediaName + "] has no Track Definitions.");
			}
		}

		return materialXml;
	},

	// Gets all the TrackTypes in the system
	// @return [xml]
	getTrackTypes : function(){

		return wscall(<PharosCs>
						  <CommandList>
						    <Command subsystem="trackType" method="getAll"/>
						  </CommandList>
						</PharosCs>)..Output;
	},

	// Creates a Tag Node for API calls
	// @param [string] - type  (Type of Tag)
	// @param [string] - values (Value to be placed against Tag Type)
	// @return [xml]
	createTagNode : function(type, value){
	    var xml =
	       		<Tag>
	                <TagType>{type}</TagType>
	                <Value>{value}</Value>
	            </Tag>;

	    return xml;
	},

	// Creates a ShortText Node for API calls
	// @param [string] - type  (Type of Tag)
	// @param [string] - values (Value to be placed against Tag Type)
	// @return [xml]
	createShortTextNode : function(type, value){
	   var xml =
	            <ShortText>
	                <ShortTextType>{type}</ShortTextType>
	                <Value>{value}</Value>
	            </ShortText>;

	    return xml;
	},

	// Creates a FullText  Node for API calls
	// @param [string] - type  (Type of Tag)
	// @param [string] - values (Value to be placed against Tag Type)
	// @return [xml]
	createFullTextNode : function(type, value){
	    var xml =
	        <FullText>
	            <FullTextType>{type}</FullTextType>
	            <Value>{value}</Value>
	        </FullText>;

	    return xml;
	},

	// Quasi Class so requires a call with "new" keyword e.g. new WSJobUpdate(); - If you don't know what this means ask!
	// @ return [object] with the following methods
	// @ method updateStatus - param [string] (statusMsg)
	// @ method updateProgress - param [number] (progressPercent) - can't be less than previous progressPercent
	// @ method updateStatusAndProgress - param [string] (statusMsg) param [number] (progressPercent)
	// @ method updateStatusMap - param [object] (keyPaforirs) - used to update custom JobExitStatusParams as defined in the job factory
	WSJobUpdateObject : function(){

	    this.updateStatus = function(statusMsg) {
        	this.updateStatusMap({"JOB__STATUS" : statusMsg});
    	};

    	this.updateProgress = function(progressPercent){
    		this.updateStatusMap({"JOB__PROGRESS" : progressPercent});
    	};

    	this.updateStatusAndProgress = function(statusMsg,progressPercent){
    		this.updateStatusMap({"JOB__STATUS" : statusMsg, "JOB__PROGRESS" : progressPercent});
    	};

    	this.updateStatusMap = function(keyPairs){
    		var __mapping = <Mapping></Mapping>;

			for (var key in keyPairs) {
		        __mapping[key] = keyPairs[key];
			}

			var command = <PharosCs>
				                <CommandList>
			 	                    <Command subsystem="job" method="updateStatusMap">
			 	                        <ParameterList>
			 	                            <Parameter name="jobId" value={_jobId}/>
			 	                            <Parameter name="jobInfo">
			 	                                <Value>
			 	                                    {__mapping}
			 	                                </Value>
			 	                            </Parameter>
			 	                        </ParameterList>
				                    </Command>
			 	                </CommandList>
			 	   			</PharosCs>;
			wscall(command);
		};
    },
    /**
	 *
	 * Taken from nbc_functions.js
	 *
	 * Submits a job to Vantage and Polls the status
	 * @param [vantageobj] [This object can have properties workflowname, jobname and nicknames, nicknames is an object with key:pairs that will be used for the input files]
	 * @return [Returns a boolean based on job success or failure, utilising the JOB__STATUS of Finished jobs also]
	 *
	 * Example:
	 * var vantageObj = {
	 *  	"workflowname" : "XDCAMHD_422_1080i_5994_8ch_latest_xcoder_y_locators_mediator",
	 *		"jobname" : "MediatorTestMarkers7",
	 *		"nicknames" 	: {
	 *			"Original"	: "\\\\100.125.142.15\\dvs-fs\\DVS-RT0\\Vantage_IN\\locator_source\\mediator.mxf",
	 *			"locator_xml"	: "\\\\100.125.142.15\\dvs-fs\\DVS-RT0\\Vantage_IN\\locator_source\\mediator.xml"
	 *		}
	 *	};
	 *
	 * This is for where the Vantage job being ran is a sub-job of another, and you may want to update the main job,
	 * 	as well as not use the entire main jobs progress (So where this is doing a transcode and constitutes 60% of the total uploads percent)
	 * 	It defaults to start at 0% and go to 99%
	 * var jobObj = {
	 * 		"jobId" = "VanillaRunnerJob-c22a40d0-38c8-4f1c-897a-67e8c0f76d52", //This will just be _jobId for WSRunner jobs
	 *		"startPercent" = 40,
	 *		"endPercent" = 80
	 * };
	 *
	 *	var vantageJobSuccess = NBCFunc.makeAndRunVantageJob(vantageObj, jobObj);
	 *	if (vantageJobSuccess) {
	 *		print("Vantage job was successful");
	 *	} else {
	 *		throw new Error("Vantage job failed");
	 *	}
	 *
	 */

	makeAndRunVantageJob	: function(vantageobj, jobObj, useTransferProgress, jobFactory) {
		var statusChangesOnly = true,
		externalJobId,
		vantageJobFactory,
		startPercent = 0,
		endPercent = 99,
		updateExternalJob = false,
		lastJobStatus = "",
		lastJobProgress = 0,
		sleepMS = 30000,
		errorSleepMS = 30000,
		vantageJobName = "",
		jobDesc = 	<JobDescription>
						<Properties>
						 	<Mapping>
						    </Mapping>
						</Properties>
					</JobDescription>;


		//If we are going to update the state of an external job, that is running this vantage job
		if ((typeof(jobObj) !== "undefined") && (jobObj !== null)) {
			if (jobObj.hasOwnProperty("jobId")) {
				externalJobId = jobObj.jobId;
				updateExternalJob = true;

			}
			if (jobObj.hasOwnProperty("startPercent")) {
				startPercent = jobObj.startPercent;

			}
			if (jobObj.hasOwnProperty("endPercent")) {
				endPercent = jobObj.endPercent;

			}
		}

		//if this is set it will print out for Proxy Transfer progress
		if ((typeof(useTransferProgress) === "undefined") || (useTransferProgress === null)) useTransferProgress = false;

		if (typeof(jobFactory) === "undefined") {
			vantageJobFactory = "vantageTestJobFactory";
		} else {
			vantageJobFactory = jobFactory.toString();
		}



		for (var prop in vantageobj) {
			if (prop.toLowerCase() === "workflowname") {
				print("Adding Vantage Workflow Property ["+vantageobj[prop]+"]");
				jobDesc.Properties.Mapping.vantageWorkflowName = vantageobj[prop];
			}
			if (prop.toLowerCase() === "jobname") {
				print("Adding Vantage JobName Property ["+vantageobj[prop]+"]");
				jobDesc.Properties.Mapping.vantageJobName = vantageobj[prop];
				jobDesc.Properties.Mapping.domainKey = vantageobj[prop];
				vantageJobName = vantageobj[prop];
			}
			if (prop.toLowerCase() === "nicknames") {
				var entries = new XMLList();
				for (var nickname in vantageobj[prop]) {
					print("Adding Nickname: Key ["+nickname+"] Value ["+vantageobj[prop][nickname]+"]");
					entries += <Entry>
									<Key>{nickname}</Key>
									<Value>{vantageobj[prop][nickname]}</Value>
								</Entry>;
				}
				jobDesc.Properties.Mapping.vantageNicknames.Map.Entry = entries;
			}
			if (prop.toLowerCase() === "variables") {
				var entries = new XMLList();
				for (var variable in vantageobj[prop]) {
					print("Adding Variable: Key ["+variable+"] Value ["+vantageobj[prop][variable]+"]");
					entries += <Entry>
									<Key>{variable}</Key>
									<Value>{vantageobj[prop][variable]}</Value>
								</Entry>;
				}
				jobDesc.Properties.Mapping.vantageVariables.Map.Entry = entries;
			}
		}

		print("Vantage Job Factory is ["+vantageJobFactory+"]");
		print("Submitting Vantage Job: \n"+jobDesc);
		var jobId = this.executeJob(vantageJobFactory,jobDesc);
		print("Job Submitted - JobId Received ["+jobId+"]");
		print("Status interval is ["+String(sleepMS)+"]");
		print("Polling Job...");

		while (true) {
			try {
				var jobResponse = this.getJob(jobId);
				var error_counter = 0;
			} catch(e) {
				print("makeAndRunVantageJob: Failed to get Vantage job status");
				print(e.message);
				error_counter++
			}
			if (error_counter == 0) {
				var jobStatus = jobResponse..Output.Job.Status.toString();
				var jobProgress = jobResponse..Output.Job.StatusMap.Mapping.hasOwnProperty("JOB__PROGRESS") ? parseInt(jobResponse..Output.Job.StatusMap.Mapping.JOB__PROGRESS) : 0;
				//print(jobResponse);
				if (jobStatus === "Finished") {
					print("JobName ["+vantageJobName+"] JobId ["+jobId+"] has Finished");
					var JOB__STATUS = jobResponse..StatusMap.Mapping.JOB__STATUS.toString();
					print("JOB__STATUS ["+JOB__STATUS+"]");
					if (JOB__STATUS !== "COMPLETE") {
						print("Job Finished with errors : "+ jobResponse..StatusMap.Mapping.JOB__ERROR.toString());
						return false;
					} else {
						java.lang.Thread.sleep(120000); // Sleep for 1min, testing this out because of problems with truncated files
						print("Job Finished without errors.");
						return true;
					}

				} else if (jobStatus === "Failed") {
					print("ERROR: JobName ["+vantageJobName+"] JobId ["+jobId+"] has Failed.");
					print(jobResponse..StatusMap.Mapping.JOB__ERROR.toString());
					/* TODO: You can pull out the error from Vantage to add as a comment
					var str = jobResponse..StatusMap.Mapping.JOB__ERROR.toString();
					var res = str.split("\n");
					for (var t = 0; t < res.length; t++) {
						if (res[t].indexOf('state=FAILED') > 0 && res[t].indexOf('has not been configured to operate when the previous state is:')< 0)  {
							print(res[t].substring(res[t].lastIndexOf('Error:'),res[t].length + 1))
						}
					}*/
					return false;

				} else {
					if (statusChangesOnly) {
						if (jobStatus !== lastJobStatus || jobProgress !== lastJobProgress) {
							print("JobName ["+vantageJobName+"] JobId ["+jobId+"] has Status ["+jobStatus+"] Progress ["+jobProgress+"]");
						}
					} else {
						print("JobName ["+vantageJobName+"] JobId ["+jobId+"] has Status ["+jobStatus+"] Progress ["+jobProgress+"]");
					}
				}

				if (updateExternalJob) {
					//get total percent we're expected to account for
					var totalPercent = endPercent - startPercent;
					var returnPercent = parseInt(((jobProgress/100)*totalPercent) + startPercent);

					//var mappings = {"JOB__PROGRESS" : returnPercent};
					//this.updateJobStatus(externalJobId,mappings);
					this.updateJobProgressPercent(externalJobId,returnPercent);
					//print(externalJobId,returnPercent);
				}
				if (useTransferProgress) {
					print("scriptprogress "+jobProgress);
				}


				lastJobStatus = jobStatus;
				lastJobProgress = jobProgress;
				java.lang.Thread.sleep(sleepMS);
			} else {
				if (error_counter <= 60) {
					print("Holding Vantage job thread ["+error_counter+"]");
					java.lang.Thread.sleep(errorSleepMS);
				} else {
					print("Failing Vantage job polling");
					return false;
				}
			}
		}
	},
	/**
	 *
	 *  Taken from nbc_functions.js (Temporarily commented out all other file sytems as GMO should only be using the Dev Isilon Share the for the Moment)
	 *
	 *	Useful File Object
	 *	@author		Craig Gardner
	 *	@param		string	The absolute file path of the file (in Unix format)
	 *	@return		object	Returns an object with:
	 *							unix_file		:	Absolute path in Unix format
	 *							unix_path	:	Absolute file path in Unix format (excluding the filename)
	 *							filename		:	Filename of the file (including extension)
	 *							basename	:	Filename of the file (excluding extension)
	 *							extension	:	File extension of the file
	 *							win_file		:	Absolute path in Windows format
	 *							win_path		:	Absolute file in Windows format (excluding the filename)
	 *							dvs_file		:	Absolute path in relation to file on DVS.
	 *							dvs_path		:	Absolute file in relation to file on DVS (excluding the filename)
	 *							mac_file		:	Absolute path in relation to file on Mac.
	 *							mac_path		:	Absolute file in relation to file on Mac (excluding the filename)
	 *							faspex_file		:	Absolute file for use with Faspex (excluding the filename)
	 *							faspex_path		:	Absolute path for use with Faspex (excluding the filename)
	 *							filesize 		:	Total size of File in Bytes
	 */
	usefulFileObj	:	function(source_file) {

        if (!gmoNBCFunc.isVarUsable(source_file)) {
            print('usefulFileObj: source file is currently blank, null or ""');
        }
        if (!fileExists(source_file)) {
            print('usefulFileObj: File does not currently exist.')
        }

		//this.storage_path_objects = [lookup.storage.dvs, lookup.storage.nrtisilon, lookup.storage.delivery];
		this.storage_path_objects = lookup.storage;

		this.unixPathToWindowsPath = function(unix_file_path) {
			/*
				For Mediator systems, everything should be mounted under '/srv/' and can be converted to a network fileshare
			*/

			for each (var storage_path_object in this.storage_path_objects){
				if (unix_file_path.indexOf(storage_path_object.unix_root) == 0){
					var win_prefix = storage_path_object.win_prefix;
					var unix_path_to_convert = unix_file_path.split(storage_path_object.unix_root)[1];
				}
			}

			windows_path = win_prefix + unix_path_to_convert.replace(/\//g, '\\');
			return windows_path
		}

		this.unixPathToDvsPath = function(unix_file_path) {
			for each (var storage_path_object in this.storage_path_objects){
				if (unix_file_path.indexOf(storage_path_object.unix_root) == 0){
					var dvs_prefix = storage_path_object.path_on_dvs;
					var unix_path_to_convert = unix_file_path.split(storage_path_object.unix_root)[1];
				}
			}

			dvs_path = dvs_prefix + unix_path_to_convert;
			return dvs_path
		}

		this.unixPathToMacPath = function(unix_file_path) {
			for each (var storage_path_object in this.storage_path_objects){
				if (unix_file_path.indexOf(storage_path_object.unix_root) == 0){
					var mac_prefix = storage_path_object.path_on_mac;
					var unix_path_to_convert = unix_file_path.split(storage_path_object.unix_root)[1];
				}
			}

			mac_path = mac_prefix + unix_path_to_convert;
			//output("mac_path is:    "+ mac_path);
			return mac_path
		}

		this.unixPathToFaspexPath = function(unix_file_path){
			for each (var storage_path_object in this.storage_path_objects){
				if (unix_file_path.indexOf(storage_path_object.unix_root) == 0){
					var unix_root = storage_path_object.unix_root;
					return "/" + unix_file_path.split(storage_path_object.unix_root)[1];
				}
			}
		}

	        this.refresh = function(){
	            return new gmoNBCFunc.usefulFileObj(this.unix_file)
	        }

		var fileObj = new File(source_file);

		this.unix_file = source_file;

		//	Absolute file path
		this.unix_path = String(fileObj.getAbsolutePath()).substring(0, fileObj.getAbsolutePath().lastIndexOf('/') + 1);

		// 	Filename
		this.filename = String(fileObj.getName());

		// 	Get extension
		var dot = fileObj.getName().lastIndexOf('.');
		this.extension = String(fileObj.getName()).substring(dot + 1)

		//	Filename without extension
		this.basename = String(fileObj.getName()).substring(0, dot);

		//	Unix Path to Windows Path
		if (source_file.indexOf('/') == 0) {
			//	It's a unix style path
			this.win_file = this.unixPathToWindowsPath(source_file);
			this.win_path = this.unixPathToWindowsPath(this.unix_path);

			this.dvs_file = this.unixPathToDvsPath(source_file);
			this.dvs_path = this.unixPathToDvsPath(this.unix_path);

			this.mac_file = this.unixPathToMacPath(source_file);
			this.mac_path = this.unixPathToMacPath(this.unix_path);

			this.faspex_file = this.unixPathToFaspexPath(source_file);
			this.faspex_path = this.unixPathToFaspexPath(this.unix_path);
		} else {
			this.win_file = "";
			this.win_path = "";
			this.dvs_file = "";
			this.dvs_path = "";
			this.mac_file = "";
			this.mac_path = "";
			this.faspex_file = "";
			this.faspex_path = "";
		}

		// File size
		this.filesize = fileObj.length();

		// File Exists?
		this.exists = function() {
			print("usefulFileObj.exists(): Checking if [" + this.unix_file + "] exists");
			return fileExists(this.unix_file);
		};

		this.getMd5Sum = function(){
			if (fileObj.exists()){
				output("usefulFileObj.getMd5Sum(): Getting MD5 Sum with command [" + "/usr/bin/md5sum " + this.unix_file + "]");
				return /^[\d\w]+/.exec(run("/usr/bin/md5sum", this.unix_file).output).toString();
			} else {
				throw new Error("File does not exist, can't run MD5 check on file.");
			}
		};
	},

    /**
	 *
	 * Submits a job to be executed
	 * @param [jobFactory] [The Job Factory name for this job]
	 * @param [jobDesc] [JobDescription XML, should have JobDescription as highest element]
	 * @return [Returns the Job Coordination ID (int)]
	 *
	 */
	executeJob : function(jobFactory, jobDesc) {
		var cmdXml = <PharosCs>
						<CommandList>
							<Command subsystem="job" method="executeJob">
								<ParameterList>
									<Parameter name="jobFactoryName" value={jobFactory}/>
									<Parameter name="jobDescription">
										<Value>
											{jobDesc}
										</Value>
									</Parameter>
								</ParameterList>
							</Command>
						</CommandList>
					</PharosCs>;
		// Send to Mediator
		var rtn = wscall(cmdXml)..Output.Integer
		// Output the coordination ID
		return rtn;
	},

	/**
	 *
	 * Returns the job for a provided Job Coordination ID
	 * @param [jobId] [The Job Coordination ID for the job want]
	 * @return [Returns the Job XML]
	 *
	 */
	getJob	: function(jobId) {
		var xml = <PharosCs>
					  <CommandList>
					    <Command subsystem="job" method="getJob">
					      <ParameterList>
					        <Parameter name="coordinationId">
					          <Value>
					            <Integer>{jobId}</Integer>
					          </Value>
					        </Parameter>
					      </ParameterList>
					    </Command>
					  </CommandList>
					</PharosCs>;
		var rtn = wscall(xml);
		return rtn
	},

	isPastThresholdTime : function (pastTime,tresholdSecs){
	   var currentTime = new Date().getTime();
	   var timeDiff = (currentTime - pastTime)/1000;
	   if(timeDiff > tresholdSecs){
		   return true;
	   }

	   return false;
	},

	// Function to help find Track Types from an audio file. Note the file must contain  -<FILETAG>.wav
	// Note since the return is an object - don't use this for ordinality. Better to call from another function
	// @param [string] - (baseFileName) - Base Name of the File e.g. /srv/absolutepath/921892.dir/921892 or 921892
	// @param [array] - (wavArray) - Array containing wavs to match Track Types to
	// @return [object] with key pairs of
	//				{
	//					<File> :  <TrackType>
	//				}
	//
	//  	e.g. {
	//				/srv/isilon/921893-SCN_EN-GB.wav : Surround Front English (UK)
	//				/srv/isilon/921892-SCN_EN-GB.wav : Surround C/LFE English (UK),
	//              /srv/isilon/921893-SRE_EN-GB.wav : Surround Rear English (UK),
	//			}
	//
	//
	//
	// @error - If a file variable without a path can't be found
	// @error - If a file tag could not be found from the file
	// @error - If the File Tag doesn't link to a Track Type
	findTrackTypesFromAudioFiles : function(baseFileName,wavArray){

		print("\nAttemping to find TrackTypes for Files");

		var rtnObj = {};
		var wavExt = "wav";
		var trackTypes = this.getTrackTypes();

		for each(var file in wavArray){

			print("\nSearching for Track Type Match for: \n\tFile ["+file+"]");

			// Account for that fact that an absoloute path may be passed in
			var fileNoPath;
			if(file.lastIndexOf("/")!==-1){
				fileNoPath = file.substr(file.lastIndexOf("/")+1);
			}else{
				fileNoPath = file;
			}
			// Check that there's a file
			if(!fileNoPath) throw new error("Failed to to find a File with no path for ["+file+"]");

			// Strip of Extension and File Tag
			var fileTag = fileNoPath.replace(baseFileName+"-","").replace("."+wavExt,"");
			if(!fileTag) throw new Error("Could not extract File Tag from ["+file+"]");

			// See if a there's a Track Type that Matches the file tag
			print("\tFile Tag ["+fileTag+"]");
			var trackType = trackTypes.TrackTypeList.TrackType.(FileTag.toString()===fileTag).Name.toString()
			if(!trackType) throw new Error("Failed to find a Track Type from File Tag ["+fileTag+"]");

			print("\tSuccess FileTag ["+fileTag+"] matches Track Type ["+trackType+"]");
			rtnObj[file] = trackType;
		}
		if(debug){
			print("\nReturning File / Track Type Object");
			show(rtnObj);
		}
		return rtnObj;
	},

	// Optional [boolean] - saveSilence - will add a Silence TD and Track Type Link
	complexAudioEncodedTrackSave : function(matId,media,frameRate,incode,outcode,wavs,saveSilence){

		// Call other functions to help
		var fileId = this.getSafeFileId(matId);
		var fileExtension = this.getFileExtension(wavs[0]);
		var fileBytes = this.getFileBytes(wavs[0]) * wavs.length;

		var xml =
			<Material>
			   	<MatId/>
			   	<Track>
				   	<MediaName/>
					<FrameRate/>
					<Incode/>
					<OutCode/>
					<FileId/>
					<FileExtension/>
					<FileBytes/>
					<Encoded/>
				</Track>
			</Material>;

		xml.MatId = matId,
		xml.Track.MediaName = media;
		xml.Track.FrameRate = frameRate;
		xml.Track.Incode = incode;
		xml.Track.Incode.@rate = frameRate;
		xml.Track.OutCode = outcode;
		xml.Track.OutCode.@rate = frameRate;
		xml.Track.FileId = fileId;
		xml.Track.FileExtension = fileExtension;
		xml.Track.FileBytes = fileBytes;
		xml.Track.Encoded = true;

		// Find a List of the Track Types against the specified Wav Files
		var trackTypes = gmoNBCFunc.findTrackTypesFromAudioFiles(fileId,wavs)
		show(trackTypes);

		// Build up Track Defs
		for(var i=0; i<wavs.length;i++){

			var ttName = trackTypes[wavs[i]];
			print("\nBuilding a Track Def for Track Type ["+ttName+"]");
			var mediaInfoAudioTrackNode = this.getFileInfoXml(wavs[i]).track.(@type.toString()==="Audio")[0];

			var tdXml =
				<TrackDefinition>
					<TrackTypeName/>
					<Position/>
					<FileId/>
					<FilePosition/>
					<Channels/>
				</TrackDefinition>;

			tdXml.TrackTypeName = ttName;
			tdXml.Position = 0;
			tdXml.FileId = wavs[i].substr(wavs[i].lastIndexOf("/")+1);
			tdXml.FilePosition = 1; // Hard Coded as these are stand alone wavs
			tdXml.Channels = mediaInfoAudioTrackNode.Channel_s_[0].toString();

			// <Format>
			var format = mediaInfoAudioTrackNode.Format.toString();
			if (format) tdXml.Format = format;
			// <BitRate>
			var bitRate = mediaInfoAudioTrackNode.Bit_rate[0].toString();
			if (bitRate) tdXml.BitRate = bitRate;
			// <BitDepth>
			var bitDepth = mediaInfoAudioTrackNode.Bit_depth[0].toString();
			if (bitDepth) tdXml.BitDepth = bitDepth;
			// <SamplingRate>
			var samplingRate = mediaInfoAudioTrackNode.Sampling_rate[0].toString();
			if (samplingRate) tdXml.SamplingRate = samplingRate;
			// Unsure whether it's currently desired to store these in case values are erroneously labeled
			// <ChannelPositions>
			//var channelPos = mediaInfoAudioTrackNode.Channel_positions.toString();

	        xml.Track.appendChild(tdXml);
		}

		// Add Track Files to each Track Definition
		this.createTrackFileForTrackDefs(xml);

		return materialSave(xml);
	},

	// Search for Materiacls that contain a specific data element
	// e.g. To find all Materials that have the Tag Oringinator of GMO OM Upload args would be getMaterialsFromDataElements("tag","Originator","GMO OM Uplaod")
	// @param [string] (classType) - the class type of the Data Element
	// @param [string] (element) - the data element to search
	// @param [string] (value) - the value to match for the Data Element
	// @return [array] - containing any matched materials
	getMaterialsFromDataElements : function(classType,element,value){

	    // Return Holder
	  	var matchingMats = [];

	 	var searchedXml = wscall(
							    <PharosCs>
							    	<CommandList>
							        	<Command subsystem="material" method="searchDataElements">
							          		<ParameterList>
							            		<Parameter name="elementType">
							              			<Value>
							                			<DataElementClass>
							                  				{classType}
							                			</DataElementClass>
							              			</Value>
							            		</Parameter>
							            		<Parameter name="elementName" value={element}/>
							            		<Parameter name="searchString" value={value}/>
							          		</ParameterList>
							        	</Command>
							      	</CommandList>
							    </PharosCs>)..Output;

	  	for each(var mat in searchedXml..Material){
	      	matchingMats.push(mat.MatId.toString());
	  	}
	    return matchingMats;
	},

	getMaterialsByShortText : function(shortTextType,value) {
		runReportXml = <PharosCs>
			  <CommandList>
				<Command method="runReport" subsystem="report">
				  <ParameterList>
					<Parameter name="reportName" value="searchMaterialShortText"/>
					<Parameter name="reportParameters">
						<Value>
						<CustomReportRuntimeParameters>
							<Parameters>
							<StringReportParameter>
								<Name>name</Name>
								<Operator>is</Operator>
								<Values>
									<String>{shortTextType}</String>
								</Values>
							</StringReportParameter>
							<StringReportParameter>
								<Name>value</Name>
								<Values>
									<String>{value}</String>
								</Values>
								<Operator>is</Operator>
							</StringReportParameter>
							</Parameters>
						</CustomReportRuntimeParameters>
						</Value>
					</Parameter>
					<Parameter name="pageSize">
						<Value>
							<Integer>10</Integer>
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

		var rtn = wscall(runReportXml);
		var rtnCount = parseInt(rtn..ResultList.PagedResults.Count);
		var materialList = [];

		if (rtnCount == 0) {
			print("No records found.");
			return [];
		}else{
			var materials = rtn..ResultList..MATERIAL__MAT_ID;
			for each(var matId in materials){
				materialList.push(matId);
			}
		}

		return materialList;
	},

	// Function to get all Tag Values for a specific Tag Type
	// @param [string] - (tagType) - Name of the Tag Type to Search
	// @return [array]
	getTagsForType : function(tagType){
		if(debug) print("\nDebug in getTagsForType()");

		var rtn = [];
		var xml = wscall(
			<PharosCs>
				<CommandList>
					<Command subsystem="tag" method="search">
						<ParameterList>
						    <Parameter name="tagType" value={tagType}/>
						</ParameterList>
					</Command>
				</CommandList>
			</PharosCs>)..TagList;

		if(debug) print("\nTag Search Xml ["+xml+"]");

		for each(var tag in xml.Tag){
			rtn.push(tag.Value.toString());
		}
		return rtn;
	},

	// Function to Generate a Unique Material ID - NOTE this does not create a Material. It simply provides a Unique ID that can be used as a Material ID
	// @return [string] - with a Material Id based upon the script
	generateMatId : function(scriptName,sequenceName){
		return wscall(
			<PharosCs>
			    <CommandList>
				    <Command subsystem="tools" method="generateId">
					    <ParameterList>
						    <Parameter name="script" value={scriptName}/>
						    <Parameter name="sequenceName" value={sequenceName}/>
						</ParameterList>
					</Command>
				</CommandList>
			</PharosCs>)..Output.toString();
	},
	// Function to Generate a Unique Material ID - NOTE this does not create a Material. It simply provides a Unique ID that can be used as a Material ID
	// @return [string] - with a Material Id based upon the script
	generatePromoMatId : function () {
		return wscall(
				<PharosCs>
					<CommandList>
						<Command subsystem="tools" method="generateId">
							<ParameterList>
								<Parameter name="script" value="promo_material_generator"/>
								<Parameter name="sequenceName" value="FREE_SEQUENCE_05"/>
							</ParameterList>
						</Command>
					</CommandList>
				</PharosCs>)..Output.toString();
	},

	// Function to Return Xml of TrackTypes associated with a TrackTypeGroup
	// @param [string] (trackTypeGroupName) - Name of the Track Type Group to lookup
	// @return [xml]
	trackTypeGroupGet : function(trackTypeGroupName){
		if (debug) print("\nDEBUG: In getTrackTypeGroup() Looking Up Track Type Group ["+trackTypeGroupName+"]");
		return wscall(
				<PharosCs>
					<CommandList>
						<Command subsystem="trackType" method="getTrackTypeGroup">
								<ParameterList>
									<Parameter name="name" value={trackTypeGroupName}/>
								</ParameterList>
						</Command>
					</CommandList>
				</PharosCs>)..TrackTypeList;
	},

	// Function to get all Tag Values for a specific Tag Type
	// @param [string] - (tagType) - Name of the Tag Type to Search
	// @return xml
	getTagsForTypeXml : function(tagType){
		if(debug) print("\nDebug in getTagsForType()");
		var xml = wscall(
			<PharosCs>
				<CommandList>
					<Command subsystem="tag" method="search">
						<ParameterList>
						    <Parameter name="tagType" value={tagType}/>
						</ParameterList>
					</Command>
				</CommandList>
			</PharosCs>)..TagList;

		return xml;
	},

	// Function to find out the status of a TVDProduction Number
	// @param [string] - (tvdNumber)
	// @return [object] containing the following
	// 		valid : [boolean] - showing whether the TVDProduction Number is Valid (I.e. unique StudioPostVersionCodes)
	//		fulfilledPostCodes : [array] - showing all the Studio Post Version Codes from all Materials that link to a TVDProductionNumber
	//      vacantPostCodes : [array] - showing all the Studio Post Version Codes that are available
	//      numberOfMatches : [interger] - indicating the amount of Materials linked to a TVDProduction Number
	//      materialObjs : [array] - array of objects showing the matid,studiopostversioncode,and tvproduction number
	//						{
	//							matid : [string]
	//							tvdnumber : [string]
	//							studiopostcode : [string]
	//						}
	//	@error If any of the MaterialGets() fail
	tvdNumberProjectQuery : function(tvdNumber){

		// Return Obj
		var status = {
			"valid" : true,
			"fulfilledPostCodes" : [],
			"vacantPostCodes" : [],
			"materials" : [],
			"materialObjs" : [],
			"numberOfMatches" : 0
		}
		// Data Element Vars
		var tvdProdShortTextType = "TVD Production #";
		var studioPostTagType = "StudioPostVersionCode";

		print("\nQuerying for Status of "+tvdProdShortTextType+" ["+tvdNumber+"]");

		// Query Mediator for Valid StudioPostVersionCode(s)
		print("\nSearching for a list of StudioPostVersionCodes")
		var validPostVersionCodes = this.getTagsForType(studioPostTagType);
		print("\nValid StudioPostVersionCodes ["+validPostVersionCodes+"]");

		// Search Mediator for a list of Materials that match a tvdNumber
		print("\nSearching for Materials that match "+tvdProdShortTextType+" ["+tvdNumber+"]");
		var tvdProdMaterials = this.getMaterialsFromDataElements("shorttext",tvdProdShortTextType,tvdNumber);
		if (tvdProdMaterials.length === 0) {
			print("No materials currently match "+tvdProdShortTextType+" ["+tvdNumber+"]");
			return status;
		}
		print("\nMatching Materials ["+tvdProdMaterials+"]");
		status.numberOfMatches = tvdProdMaterials.length

		// For every Material that matches the TVD Number - extract the Studio Post Code and a few other details
		// and push into an array
		print("\nRunning a Material Get() on each Material to find Studio "+tvdProdShortTextType+" and "+studioPostTagType);
		var materialGetObjs = [];
		for each(var mat in tvdProdMaterials) {
			var matXml = materialGet(mat,"tag","shorttext")..Material;
			if(debug)print(matXml)
			if (matXml) {
				materialGetObjs.push(
					{
						"matid" : matXml.MatId.toString(),
						"tvdnumber" : matXml..ShortTextList.ShortText.(ShortTextType.toString()===tvdProdShortTextType).Value.toString(),
						"studiopostcode": matXml..TagList.Tag.(TagType.toString()===studioPostTagType).Value.toString()
					}
				)
			} else {
				throw new Error("MaterialGet() failed for ["+mat+"]");
			}
		}

		// For each of the Material Objects
		// Check that the StudioPostVersionCodes are unique
		// Add the Items to the return object
		print("\nBuilding return Object")
		for each(var matObj in materialGetObjs){
			if (status.fulfilledPostCodes.indexOf(matObj.studiopostcode) !== -1){
				print("Found a duplicate "+studioPostTagType+" "+tvdProdShortTextType+" is not Valid!");
				status.valid = false;
			}
			status.fulfilledPostCodes.push(matObj.studiopostcode);
			status.materials.push(matObj.matid);
			status.materialObjs.push(matObj);
			status.fulfilledPostCodes.sort();
		}

		// Out of all the valid StudioPostVersionCodes if any haven't been fulfilled add to the return objec
		for each(var validPostCode in validPostVersionCodes) {
			if (status.fulfilledPostCodes.indexOf(validPostCode) === -1) status.vacantPostCodes.push(validPostCode)
		}

		// Log if success
		print("\nSuccess "+tvdProdShortTextType+" is valid\n");

		return status;
	},

	/**
	 * Add a comment to a Material Track Type Link
	 * @param [matId] [Material Id]
	 * @param [commentType] [The Comment Type]
	 * @param [commentDetail] [The Comment Detail to be added(message)]
	 * @param [trackTypeName] [Track Type to add the comment to - Defaults "Video"]
	 * @param [startTc] [Start Timecode of the Comment - Defaults to be excluded]
	 * @param [endTc] [End Timecode of the Comment - Defaults to be excluded]
	 * @param [grade] [0-5 defaults to 0]
	 */
	addComment	: function(matId, commentType, commentDetail, trackTypeName, startTc, endTc, grade) {
		if (arguments.length < 3) throw new Error("Not enough arguments for addComment()");
		//Set Defaults for optional arguments.
		if (typeof trackTypeName === "undefined") var trackTypeName = "Video";
		if (typeof startTc === "undefined") var startTc = "00:00:00:00";
		if (typeof endTc === "undefined") var endTc = "00:00:00:00";
		if (typeof grade === "undefined") var grade = 0;

		var commentXml = <Comment></Comment>;

		commentXml.CommentTypeName = commentType;
		commentXml.TrackTypeName = trackTypeName;
		commentXml.Detail = commentDetail;
		commentXml.Grade = grade;
		if (startTc !== "") commentXml.StartTc = startTc;
		if (endTc !== "") commentXml.EndTc = endTc;

		var addCommentXml =  <PharosCs>
								  <CommandList sessionKey={_sessionKey}>
									<Command subsystem="comment" method="addComments">
									  <ParameterList>
										<Parameter name="commentList">
										  <CommentList>
											{commentXml}
										  </CommentList>
										</Parameter>
										<Parameter name="matId" value={matId}/>
									  </ParameterList>
									</Command>
								  </CommandList>
								</PharosCs>;


		var rtn = wscall(addCommentXml);
		return rtn;
	},

	/** Updates the Material Duration
	* @param[string] - matId (Name of the Material)
	* @param[string] - duration (Duration of the Material)
	* @param[string] - frameRate (Framerate of the Material)
	*/
	updateMaterialDuration : function (matId,duration,frameRate){

		var xml =
				<Material>
					<MatId/>
					<Duration/>
				</Material>;

		xml.MatId = matId;
		xml.Duration = duration;
		xml.Duration.@rate = frameRate;

		print("\nUpdating duration for Material ["+matId+"] to ["+duration+"]");
		if(debug) print("\nDEBUG:\n"+xml);
		return materialSave(xml);
	},

	/** Delete file, optional setting to do it recurisvley
	* @param[string] - directoryPath (Absolute path to directory)
	* @param[boolean] - recursivelyDelete (Whether to recursivly delete all files and folders within directory.) Defaults to false.
	* @return[boolean] - Whether it succesfully removes all files/folders.
	*/
	deleteDirectory : function(directoryPath, recursivelyDelete){
		var directory = new File(directoryPath);
		if (!directory.isDirectory()){
			print("deleteDirectory(): This is not a directory, please use remove() from shellfun.js");
			return false;
		}
		if (recursivelyDelete){
			for each(var file in directory.listFiles()){
				if (file.isDirectory()){
					if (!this.deleteDirectory(file.getAbsoluteFile(), true)){
						print("deleteDirectory(): Failed to remove subdirectory [" + file.getAbsoluteFile() + "], because of this directory will fail to remove failing function.");
						return false;
					}
				} else {
					output("deleteDirectory(): Removing [" + file.getAbsoluteFile() + "]");
					remove(file.getAbsoluteFile());
					if (file.exists()){
						print("deleteDirectory(): Failed to remove file [" + file.getAbsoluteFile() + "], because of this directory will fail to remove failing function.");
						return false;
					} else {
						if (debug) print("deleteDirectory(): Successfully removed file/directory [" + file.getAbsoluteFile() + "]");
					}
				}
			}
		}
		try {
			var fileList = directory.listFiles();
			for (var file in fileList)	{
				output("deleteDirectory(): Removing [" + file.getAbsoluteFile() + "]");
			}
		} catch (e) {
			//
		}
		output("deleteDirectory(): Removing [" + directory.getAbsoluteFile() + "]");
		remove(directory.getAbsoluteFile());
		if (directory.exists()){
			print("deleteDirectory(): Failed to remove [" + directory.getAbsoluteFile() + "].")
			return false;
		} else {
			print("deleteDirectory(): Successfully removed [" + directory.getAbsoluteFile() + "].")
			return true;
		}
	},

	isDirectoryContainsExtension : function(directoryPath, extension){
		var directory = new File(directoryPath);
		if (!directory.isDirectory()){
			print("isDirectoryContainsExtension(): This is not a directory.");
			return false;
		}

		for each(var file in directory.listFiles()){
			var fileName = file.getName();
			var fileExtension = fileName.substring(fileName.indexOf(".") + 1, file.getName().length());
			if(fileExtension == extension){
				print("Found file in directory with extension type [" + extension + "]");
				return true;
			}			
		}

		return false;
	},

	listAndSortFiles : function(dirToSearch,nameFilter,extension){
	    var dirFiles = new File(dirToSearch).listFiles();
	    var files = [];
	        
	    output("\nListing files in ["+dirToSearch+"]");
	    if (!gmoNBCFunc.isVarUsable(dirFiles)) throw new Error("\nFailed to List Files in directory ["+dirToSearch+"]");
	    if (!gmoNBCFunc.isDirectoryContainsExtension(dirToSearch,extension)) throw new Error("No [" + extension + "] extension files found.");

	    // Add Files to Array
	    for each(var file in dirFiles) {
	        if (String(file).indexOf(nameFilter) > -1 && String(file).endsWith("." + extension)) {
	            files.push(file);
	        }
	    }

	    files.sort();
	    output("Files: " + files);
	    return files;    
	},

	listDirectory : function(dir) {
		print("Files in [" + dir + "]:");
		var fileDir = new File(dir);
		var fileList = fileDir.listFiles();
		for (var i = 0; i < fileList.length; i++) {
				print(fileList[i].getName())
		}
		print("### Listing Complete ###");
		return fileList;
	},

	/**
	 * @usage		saveNote(domainType,domainKey,noteType,noteClass,importance,content)
	 * @param		{string}	domainType: the domainType of the note (e.g. Placing)
	 * @param		{string}	 domainKey: the domainKey of the note (e.g. a placingId, MatId, etc)
	 * @param		{string} 	  noteType: name of noteType (e.g. Profile Allocation)
	 * @param		{string}     noteClass: type of note (i.e. COMMENT, DELAY, ERROR, FIX or WARNING)
	 * @param		{string}    importance: level of note (i.e. AVERAGE, CRITICAL, IMPORTANT, TRIVIAL and UNIMPORTANT)
	 * @param		{string}       content: content for the note
	*/
	saveNote : function(domainType,domainKey,noteType,noteClass,importance,content) {
		var xml = <PharosCs>
				  <CommandList>
					<Command subsystem="note" method="saveNote">
					  <ParameterList>
						<Parameter name="note">
						  <Value>
							<Note>
							  <DomainType>{domainType}</DomainType>
							  <DomainKey>{domainKey}</DomainKey>
							  <NoteType>
								<Name>{noteType}</Name>
								<NoteClass>{noteClass}</NoteClass>
							  </NoteType>
							  <Importance>{importance}</Importance>
							  <Content>{content}</Content>
							</Note>
						  </Value>
						</Parameter>
					  </ParameterList>
					</Command>
				  </CommandList>
				</PharosCs>;

		return wscall(xml);
	},

	/** Delete file, optional setting to do it recurisvley
	* @param[string] - matId (Name of the Material)
	* @param[boolean] - mediaName (Name of the media to delete)
	*/
	deleteTrack : function(matId, mediaName){
		var xml =
				<PharosCs>
					<CommandList>
						<Command subsystem="material" method="delete">
							<ParameterList>
								<Parameter name="matId" value={matId}/>
								<Parameter name="mediaNames">
									<Value>
										<TextList>
											<Text>{mediaName}</Text>
										</TextList>
									</Value>
								</Parameter>
								<Parameter name="triggerImmediately">
									<Value>
										<Boolean>true</Boolean>
									</Value>
								</Parameter>
							</ParameterList>
						</Command>
					</CommandList>
				</PharosCs>;

		print("\nDeleting Track [" + mediaName + "] for Material ["+matId+"]");
		if(debug) print("\nDEBUG:\n"+xml);
		return wscall(xml);
	},

	 /**
     * resetTrackTypeLink
     * @param  {String} matId - The Material ID of the material we want to reset
     * @param  {String} ttn   - The TrackType we want to reset
     * Resets a given TackType to 'NotAvailable'
     */
    resetTrackTypeLink	: 	function(matId, ttn) {
		/*
			Reset TTLs
		*/
		var reset_xml = <PharosCs>
						  <CommandList>
							<Command subsystem="workflow" method="reset">
							  <ParameterList>
								<Parameter name="material">
								  <Value>
									<Material>
									  <MatId>{matId}</MatId>
									  <TrackTypeLink>
										<TrackTypeName>{ttn}</TrackTypeName>
									  </TrackTypeLink>
									</Material>
								  </Value>
								</Parameter>
							  </ParameterList>
							</Command>
						  </CommandList>
						</PharosCs>;
		var reset_rtn = wscall(reset_xml);
		if (reset_rtn..Command.@success.toString() == "true") {
		//
		} else {
			throw new Error("Error resetting workflow on TrackType [" + ttn + "]");
		}
	},
	/** Create a map of a track definition and all its positions for a given media.
	* @param[string] - matId (Name of the Material)
	* @param[string] - mediaName (Name of the media to check on)
	*/
	createTrackDefPositionMap : function(matId, mediaName){
		// Get the Material Object, just tracks are needed.
		var materialXml = materialGet(matId, "tracks")..Material;

		// Create an empty object.
		trackDefMap = {}

		// Loop through each Track Definition.
		for each (var trackDef in materialXml.Track.(MediaName == mediaName).TrackDefinition){

			// Get the position and channels for the given Track Def.
			var filePosition = parseInt(trackDef.FilePosition.toString(), 10);
			var channels = parseInt(trackDef.Channels.toString(), 10);

			// For each channel, add it to the object with the given track type name.
			for (i = 0; i < channels; i++){
				var trackTypeName =  trackDef.TrackTypeName.toString();
				var position = filePosition + i;

				// Add the Position as key and TrackTypeName as value.
				trackDefMap[position] = trackTypeName;
			}
		}

		output("Track Definition/Positions Found on Media [" + mediaName + "] for Material [" + matId + "]");
		show(trackDefMap);
		output("\n");

		return trackDefMap;
	},

	startsWith : function(string, value) {
		if (arguments.length !== 2) throw new Error("startsWith() requires two arguments");
		var bStartsWith = string.indexOf(value) === 0;
		return bStartsWith;
	},

	endsWith : function(string, value) {
		if (arguments.length !== 2) throw new Error("endsWith() requires two arguments");
		var bEndsWith = string.lastIndexOf(value) + value.length === string.length;
		return bEndsWith;
	},

	substrAfter : function(string, value) {
	if (arguments.length !== 2) throw new Error("substrAfter() requires two arguments");
	var sRtn = string.substr(string.indexOf(value)+value.length,string.length);
	return sRtn;
	},

	lastSubstrAfter : function(string, value) {
		if (arguments.length !== 2) throw new Error("lastSubstrAfter() requires two arguments");
		var sRtn = string.substr(string.lastIndexOf(value)+value.length,string.length);
		return sRtn;
	},

	substrBefore : function(string, value) {
		if (arguments.length !== 2) throw new Error("substrBefore() requires two arguments");
		var sRtn = string.substr(0, string.indexOf(value));
		return sRtn;
	},

	lastSubstrBefore : function(string, value) {
		if (arguments.length !== 2) throw new Error("lastSubstrBefore() requires two arguments");
		var sRtn = string.substr(0, string.lastIndexOf(value));
		return sRtn;
	},


	/*
	*
	* Returns file tags from the script proxy object
	*/
	getFileTags : function(scriptproxytags){
		if(scriptproxytags == "none" || scriptproxytags == null || scriptproxytags == "" || scriptproxytags == []){
				return [];
		};

		// regex returns array like 1=vid,2=pol...
		//var regexMatches = scriptproxytags.match(/\d*\=(\w*).(\w*[^():,])/g);
		//print("\nDEBUG regexMatches [" + regexMatches + "]");

		//var regexMatches = scriptproxytags.replace(":Audio(","").replace(":Video(","").replace(")","").replace("(","").split(",");    // REGEX ME UP
		var regexMatches = [];
		var reg1 = scriptproxytags.match(/\((.*?)\)/g);		 // get all values in brackets (...)
		for (var i = 0; i < reg1.length; i++){		 // iterate through all values found
			var reg2 = reg1[i].match(/([^()]+)/g);	 // remove brackets around the value
			var reg3 = reg2[0].match(/([^,]+)/g);	 // split value for every comma found
			regexMatches.push(reg3);						 // push each sub-segment to an array
		}

		// Turn into a string.
		regexMatches = regexMatches.join(",");

		var filetags = [];
		for each (var posTagMap in regexMatches.split(",")){
			var postionFileTag = posTagMap.split("=");
			var fileTag = postionFileTag[postionFileTag.length - 1];
			if (fileTag != "MOS"){
				filetags.push(fileTag);
			}
		};

		return filetags
	},

	/**
	* Function to Strip Xml Declaration
	* @param [xml] - (input_xml)
	* @return [xml]
	**/
	removeXmlHeader : function(input_xml) {
		var xml_java_string = new java.lang.String(input_xml)
		var xml = XML(xml_java_string.replaceFirst("<\\?xml[^>]*\\?>[\n\r\t ]*", ""));
		return xml;
	},

 
    removeXmlNameSpace: function(input_xml){
        var xml_java_string = new java.lang.String(input_xml)
        xml_java_string = xml_java_string.replaceFirst("<\\?xml[^>]*\\?>[\n\r\t ]*", "");
        //xml_java_string = xml_java_string.replaceFirst("xmlns=\"(.*)\"", "");
        xml_java_string = xml_java_string.replaceFirst(" xmlns=[^ >]*", "");
        return XML(xml_java_string);
    },

	materialHelper	:	function(matId) {
		print("\nmaterialHelper(): Building Material Helper for [" + matId + "]");
		this.matId = matId;
		this.materialXml = materialGet(matId, 'tracktypeLinks', 'history', 'shorttext', 'tracks', 'episode', 'tag', 'segments', 'brand');
		this.saveXml = <Material>
							<MatId>{this.matId}</MatId>
						</Material>
		/*
			Get information about a material record
		*/
		this.materialExists = function() {
			return this.materialXml..MatId.length() === 1;
		};

		this.getStateOfTtl = function(ttn) {
			var state = this.materialXml..TrackTypeLink.(TrackTypeName.toString() == ttn).StateName.toString();
			// print("materialHelper.getStateOfTtl(): State of [" + ttn + "] is [" + state + "]");
			return state;
		};

		this.getMaterialXml = function() {
			return this.materialXml;
		};

		this.getTransformation = function () {
			return this.materialXml..Transformation.toString();
		}

		this.getSourceFormat = function(){
			var medias = this.materialXml..Material.Track.MediaName.toString();
			var format = "";
			if(medias.indexOf("HD")>-1){
			    format = "HD";
			}else if (medias.indexOf("SD")>-1){
			    format = "SD";
			}
			return format;
		};

		this.getVersionType = function() {
			var versionType = this.materialXml..VersionType.toString();
			// print("materialHelper.getVersionType(): Material Version Type is [" + versionType + "]");
			return versionType;
		};

		this.getFormType = function() {
			var materialType = this.materialXml..MaterialType.toString();
			var formType = NBCGMO.formtypelookup[materialType];
			// print("materialHelper.getFormType(): Material Type [" + materialType + "] is Form Type [" + formType + "]");
			return formType;
		};

		this.getMaterialShortTextValue = function(shortTextType) {
			var shortTextValue = this.materialXml..Material.ShortTextList.ShortText.(ShortTextType.toString() == shortTextType).Value.toString();
			// print("materialHelper.getMaterialShortTextValue(): ShortTextType [" + shortTextType + "] Value is [" + shortTextValue + "]");
			return shortTextValue;
		};

		this.getTrackIncode = function(media_Name) {
			var incode = this.materialXml..Track.(MediaName.toString() == media_Name).Incode.toString();
			// print("materialHelper.getTrackIncode(): Track Incode for [" + media_Name + "] is [" + incode + "]");
			return incode;
		};

		this.getTrackOutcode = function(media_Name) {
			var outcode = this.materialXml..Track.(MediaName.toString() == media_Name).Outcode.toString();
			// print("materialHelper.getTrackIncode(): Track Incode for [" + media_Name + "] is [" + incode + "]");
			return outcode;
		};
		
		this.getMaterialFrameRate = function() {
			// print("materialHelper.getMaterialFrameRate(): Material FrameRate [" + this.materialXml..Material.FrameRate.toString() + "]");
			return this.materialXml..Material.FrameRate.toString();
		};

		this.getFileTag = function(ttn) {
			return this.materialXml..TrackTypeLink.(TrackTypeName.toString() == ttn).TrackType.FileTag.toString();
		};

		this.trackTypeLinkExists = function(ttn) {
			if (this.materialXml..TrackTypeLink.(TrackTypeName.toString() == ttn).length() > 0) {
				return true;
			} else {
				return false;
			}
		};

		this.getTitle = function() {
			return this.materialXml..Material.Title.toString();
		};

		this.getSubTitle = function() {
			return this.materialXml..Material.SubTitle.toString();
		};

		this.getEpisodeId = function() {
			return this.materialXml..Episode.EpisodeId.toString();
		};

		this.getSeriesId = function() {
			return this.materialXml..Episode.Series.SeriesCode.toString();
		};

		this.getAspectRatio = function() {
			return this.materialXml..Material.AspectRatio.toString();
		};

        this.getTvdNum = function() {
            return this.getShortTextValue("TVD Production #");
        };
        
        this.getPrimaryLanguage = function() {
           return this.materialXml..Tag.(TagType.toString() == "Primary Language").Value.toString();

        };
        this.getSecondaryLanguage = function() {
            return this.materialXml..Tag.(TagType.toString() == "Secondary Language").Value.toString();

        };        
        this.getTertiaryLanguage = function() {
            return this.materialXml..Tag.(TagType.toString() == "Tertiary Language").Value.toString();
        };
        this.isUHD = function() {
            return this.materialXml..Tag.(TagType == "UHD/HDR").Value.toString();
        };

		this.getMaterialType = function() {
			return this.materialXml..Material.MaterialType.toString();
		};
		this.getTrackTypes = function() {

			var trackTypes = [];

			for each(var trackTypeLink in this.materialXml..TrackTypeLink) {
				trackTypes.push(trackTypeLink.TrackTypeName.toString());
			}

			return trackTypes;
		};

		this.episodeGet = function() {
			var episodeId = arguments[0];
			var options = <EpisodeOptions/>;
			for(var i = 1; i < arguments.length; i++) {
				option = arguments[i];
				options.Option += <Option>{option}</Option>;
			}
			return wscall(<PharosCs>
				<CommandList sessionKey={_sessionKey}>
			        <Command subsystem="episode" method="get">
			            <ParameterList>
			                <Parameter name="episodeId" value={episodeId}/>
			                <Parameter name="options"><Value>{options}</Value></Parameter>
			            </ParameterList>
			        </Command>
			    </CommandList>
			</PharosCs>);
		}

		this.seriesGet = function() {
			var seriesId = arguments[0];
			var options = <SeriesOptions/>;
			for(var i = 1; i < arguments.length; i++) {
				option = arguments[i];
				options.Option += <Option>{option}</Option>;
			}
			return wscall(<PharosCs>
				<CommandList sessionKey={_sessionKey}>
			        <Command subsystem="series" method="get">
			            <ParameterList>
			                <Parameter name="seriesCode" value={seriesId}/>
			                <Parameter name="options"><Value>{options}</Value></Parameter>
			            </ParameterList>
			        </Command>
			    </CommandList>
			</PharosCs>);
		}

		/*
		 * Get Track Type Link XML list
		 */
		this.getTrackTypeLinkXmlList = function () {
			return this.materialXML..TrackTypeLink;
		};

		/*
			Update a material record
		*/
		this.saveShortTextValue = function(shortTextType, value) {
			return materialSave(<Material>
									<MatId>{this.matId}</MatId>
									<ShortTextList>
										<ShortText>
											<ShortTextType>{shortTextType}</ShortTextType>
											<Value>{value}</Value>
										</ShortText>
									</ShortTextList>
								</Material>);
		};

		this.saveTtlShortTextValue = function(shortTextType, value, ttn) {
			return materialSave(<Material>
									<MatId>{matId}</MatId>
										<TrackTypeLink>
											<TrackTypeName>{ttn}</TrackTypeName>
											<ShortTextList>
												<ShortText>
													<ShortTextType>{shortTextType}</ShortTextType>
													<Value>{value}</Value>
												</ShortText>
											</ShortTextList>
										</TrackTypeLink>
									</Material>);
		};

		this.saveTagValue = function(tagType, value) {
			return materialSave(<Material>
									<MatId>{this.matId}</MatId>
									<TagList>
										<Tag>
											<TagType>{tagType}</TagType>
											<Value>{value}</Value>
										</Tag>
									</TagList>
								</Material>);
		};

		/*
			Build a save XML (really we'd use this as a 'clean' update XML)
		*/
		this.saveUsingSaveXml = function() {
			var rtn = materialSave(this.saveXml);
			return rtn;
		};

		this.printSaveXml = function() {
			print("\n" + this.saveXml);
		};

		this.getSaveXml = function() {
			return this.saveXml;
		}

		this.refresh = function() {
			this.materialXml = materialGet(matId, 'tracktypeLinks', 'history', 'shorttext', 'tracks', 'episode', 'tag', 'segments', 'brand');
		}

		this.addTrackTypeLink = function(ttn, stateName, stateMachineName) {
			this.saveXml.TrackTypeLink += 	<TrackTypeLink>
												<TrackTypeName>{ttn}</TrackTypeName>
												<StateName>{stateName}</StateName>
												<StateMachine>{stateMachineName}</StateMachine>
											</TrackTypeLink>;
			return true;
		};

		this.addFrameRateToSaveXml = function(frameRate) {
			this.saveXml.FrameRate = frameRate;
		};

		this.addOwnerToSaveXml = function(owner) {
			this.saveXml.Owner.Name = owner;
		};

		this.addDurationToSaveXml = function(duration) {
			this.saveXml.Duration = duration;
		};

		this.addMaterialTypeToSaveXml = function(materialType) {
			this.saveXml.MaterialType = materialType;
		};

		this.addVersionTypeToSaveXml = function(versionType) {
			this.saveXml.VersionType = versionType;
		};

		this.addAspectRatioToSaveXml = function(aspectRatio) {
			this.saveXml.AspectRatio = aspectRatio;
		};

		this.addTransformationToSaveXml = function(transformation){
			this.saveXml.Transformation = transformation;
		};

		this.addTitleToSaveXml = function(title) {
			this.saveXml.Title = title;
		}

		this.addEpisodeToSaveXml = function(episodeId) {
			this.saveXml.Episode = <Episode>
										<EpisodeId>{episodeId}</EpisodeId>
									</Episode>;
		};

		this.addSeriesToEpisodeSaveXml = function(episodeId,seriesCode) {
			var node =	<Series>
							<SeriesCode>{seriesCode}</SeriesCode>
						</Series>;
			this.saveXml.Episode.(EpisodeId.toString() == episodeId.toString()).Series += node;
		};

		this.addBrandToSeriesSaveXml = function(seriesCode,brandCode) {
			var node = <Brand><BrandCode>{brandCode}</BrandCode></Brand>;
			this.saveXml.Episode.Series.(SeriesCode.toString() == seriesCode).Brand += node;
		};

		this.addTrackToSaveXml = function(trackXML){
			this.saveXml.Track += trackXML;
		}

		this.addShortTextToSaveXml = function(shortTextType, value) {
            this.saveXml.ShortTextList.ShortText += <ShortText>
                                                        <ShortTextType>{shortTextType}</ShortTextType>
                                                        <Value>{value}</Value>
                                                    </ShortText>;
		};

		this.addTrackTypeLinkShortText = function(ttn, shortTextType, shortTextValue) {
			/*
				Check to see if the TrackTypeLink has previously been added to the saveXml
			*/
			if (this.saveXml.TrackTypeLink.(TrackTypeName.toString() === ttn).length() == 0) {
				/*
					No? Check on our original material XML
				*/
				if (this.materialXml..TrackTypeLink.(TrackTypeName.toString() == ttn).length() == 0) {
					/*
						Not on the save XML or the return from the original materialGet, we can't add shorttext against a non-existent TTL
					*/
					throw new Error("Attempted to add ShortText to a TrackTypeLink that does not exist on the save XML")
				} else {
					/*
						Copy the pertinant information onto our update message
					*/
					this.addTrackTypeLink(ttn, this.getStateOfTtl(ttn), this.materialXml..TrackTypeLink.(TrackTypeName.toString() == ttn).StateMachineName.toString());
				}
			}

			/*
				Now add the ShortText
			*/
			this.saveXml.TrackTypeLink.(TrackTypeName.toString() === ttn).ShortTextList.ShortText +=	<ShortText>
																											<ShortTextType>{shortTextType}</ShortTextType>
																											<Value>{shortTextValue}</Value>
																										</ShortText>;
			return true;
		};

		// Gets all Segments
		this.getSegments = function(){
			return this.materialXml..SegmentList;
		};
		this.getSegmentsWithData = function() {
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
														</CommandList>
												</PharosCs>)..SegmentList;
		};

		// Gets Segments by specific Group - returns as an Xml not an Xml List
		this.getSegmentsByGroup = function(group, withData) {
			// Force a refresh to get latest Segement information. Useful if a script creates a Segment and then wants to check the success
			this.materialXml = materialGet(matId, 'tracktypeLinks', 'history', 'shorttext', 'tracks', 'episode', 'tag','segments');
				if (withData) {
						var segments = this.getSegmentsWithData().Segment.(SegmentGroup.Name.toString()=== group);
				} else {
			var segments = this.getSegments().Segment.(SegmentGroup.Name.toString()=== group);
				}
			var orderedSegments = <SegmentList></SegmentList>;
				if(segments.length()==1){
						orderedSegments.appendChild(segments);
				}else {
			for (var index=1;index<=segments.length();index++){
				orderedSegments.appendChild(segments.(Index==index));
						}
			}
			return orderedSegments;
		};

		this.getSegmentDuration = function(group, index) {
			var segment = this.getSegments().Segment.(SegmentGroup.Name.toString()=== group && Index == index);
			var rtn = wscall(<PharosCs>
							  <CommandList>
								<Command subsystem="timecode" method="calculateDuration">
								  <ParameterList>
									<Parameter name="incode" value={segment.MarkerIn.Absolute.toString()}/>
									<Parameter name="outcode" value={segment.MarkerOut.Absolute.toString()}/>
									<Parameter name="frameRate" value={this.getMaterialFrameRate()}/>
								  </ParameterList>
								</Command>
							  </CommandList>
							</PharosCs>);
			return rtn..Output.toString();
		};
		
		this.getSegmentIncode = function(group, index) {
			var segment = this.getSegments().Segment.(SegmentGroup.Name.toString()=== group && Index == index);
			return segment.MarkerIn.Absolute.toString();
		};
		
		this.getSegmentOutcode = function(group, index) {
			var segment = this.getSegments().Segment.(SegmentGroup.Name.toString()=== group && Index == index);
			return segment.MarkerOut.Absolute.toString();
		};	

		// Get a Track Xml Element by specifying a Media
		this.getTrackXmlByMedia = function(media) {
			return this.materialXml..Track.(MediaName.toString() == media && Encoded.toString()=="true" && DeleteMark.toString()=="0");
		};

		// Get a List of Tracks
		this.getTrackList = function() {
			return this.materialXml..Track;
		};

		// Set the Save Xml back to a Clean State. Means that the same Material Helper can be used over again
		this.resetSaveXml = function() {
			print("\nResetting Save Xml for [" + this.matId + "]");
			this.saveXml = new XML (<Material><MatId>{this.matId}</MatId></Material>);
		};

		this.createShortTextNode = function(type, value){
		   	return (
				<ShortText>
					<ShortTextType>{type}</ShortTextType>
					<Value>{value}</Value>
				</ShortText>
			)
		};

		this.createFullTextNode = function(type, value){
			return (
				<FullText>
					<FullTextType>{type}</FullTextType>
					<Value>{value}</Value>
				</FullText>
			)
		};


		this.createTagNode = function(type, value){
			return (
				<Tag>
	                <TagType>{type}</TagType>
	                <Value>{value}</Value>
	            </Tag>
			);
	    };


		this.addShortTextToSaveXml = function(type, value) {
			// Check Parent Element exists
			if (this.saveXml.ShortTextList.length() === 0) {
				this.saveXml.appendChild(<ShortTextList/>);
			}

			this.saveXml.ShortTextList.appendChild(this.createShortTextNode(type, value));
		};

		this.addFullTextToSaveXml = function(type, value) {
			// Check Parent Element exists
			if (this.saveXml.FullTextList.length() === 0) {
				this.saveXml.appendChild(<FullTextList/>);
			}

			this.saveXml.FullTextList.appendChild(this.createFullTextNode(type, value));
		};

		this.addTagToSaveXml = function(type, value) {
			// Check Parent Element exists
			if (this.saveXml.TagList.length() === 0) {
				this.saveXml.appendChild(<TagList/>);
			}

			this.saveXml.TagList.appendChild(this.createTagNode(type, value));
		};

		this.getShortTextValue = function(type) {

			var shortTextValue = this.materialXml..ShortText.(ShortTextType.toString() === type).Value.toString();
			return shortTextValue === ""  ? undefined : shortTextValue;
		};

		this.getFullTextValue = function(type) {
			
			var fullTextValue = this.materialXml..FullText.(FullTextType.toString() === type).Value.toString();
			return fullTextValue === ""  ? undefined : fullTextValue;
		};

		// Finds the Value of a Specific Tag for a Material
		// @param [string] - type (Indicationg the Tag Type Name)
		// @return [array] (if the Tag Type is Ordinal) otherwise [string] indicating the tag values
		this.getTagValue = function(type) {

			var tagXmls = this.materialXml..Tag.(TagType.toString() === type);

			// Check that there`s at least one Tag Xml so that it`s oridinality can be found
			var firstTagNode = tagXmls[0] === undefined ?  undefined : tagXmls[0];

			if (firstTagNode === undefined) {
				return undefined;
			}

			var dataElementType = firstTagNode.Type.toString();
			var isOrdinal = NBCGMO.ordinalTagTypes.indexOf(dataElementType) > -1;

			if (isOrdinal) {

				var tagValues = [];

				for each (var tag in tagXmls) {
					tagValues.push(tag.Value.toString());
				}

				return tagValues.length === 0 ? undefined : tagValues;

			} else {

				var tagValue =  this.materialXml..Tag.(TagType.toString() === type).Value.toString();
				return tagValue ===  "" ? undefined : tagValue;

			}
		}

		this.getBrandTitle = function() {
			var brandTitle = this.getMaterialXml()..Brand.Title.toString();
			return brandTitle === "" ? undefined : brandTitle;
		}
		// Multiple Scripts need to find the Incode / Outcode from a Main Store / T2 Store Track. For example making a Whole Material Segment
		this.findMainStoreMedia = function(possibleMedias) {

			if(!gmoNBCFunc.isVarUsable(possibleMedias)) possibleMedias = NBCGMO.storeMedias.concat(NBCGMO.t2Medias).concat(NBCGMO.archiveMedias);

			var trackList = this.getTrackList();
			var storeMedia;

			for each(var track in trackList) {
				var trackMediaName = track.Media.Name.toString();
				if (possibleMedias.indexOf(trackMediaName) !== -1) {
					storeMedia = trackMediaName;
					break;
				}
			}
			return storeMedia;
		}

		// Add a Segment to the Save Xml
		// @param [string] incode - Incode of the Segment
		// @param [string] outcode - Outcode of the Segment
		// @param [number] index - Index of the Segment
		// ** optional **  @param [string] frameRate - Frame Rate of the Segment (Defaults to FrameRate of Material)
		// ** optional ** @param [string] segmentName - Name of the Segment (Defaults to values in nbcgmo_settings)
		this.addSegmentToSaveXml = function(incode, outcode, group, index, frameRate, segmentName) {

			// Fill out the optional Values
			var frameRate = frameRate === undefined ? this.getMaterialFrameRate() : frameRate;
			var segmentName = segmentName === undefined ? NBCGMO.defaultSegmentGroup : segmentName;

			// Check Parent Element exists
			if (this.saveXml.SegmentList.length() === 0) {
				this.saveXml.appendChild(<SegmentList/>);
			}

			this.saveXml.SegmentList.appendChild(
					<Segment>
						<MarkerIn>
							<FrameRate>{frameRate}</FrameRate>
							<Absolute>{incode}</Absolute>
						</MarkerIn>
						<MarkerOut>
							<FrameRate>{frameRate}</FrameRate>
							<Absolute>{outcode}</Absolute>
						</MarkerOut>
						<SegmentGroup>
							<Name>{group}</Name>
						</SegmentGroup>
						<SegmentType>
							<Name>{segmentName}</Name>
						</SegmentType>
							<Index>{index}</Index>
					</Segment>
			)
		},


		this.getPathAndFileOfTrackTypeOnMedia = function(mediaName, trackTypeToFind, runFileExist) {

			if (arguments.length < 2) throw new Error("materialHelper.getPathAndFileOfTrackTypeOnMedia() requires at least two arguments");

			var trackXml = this.materialXml..Track.(MediaName.toString() == mediaName);
			var mediaPath = trackXml.Media.AbsolutePath.toString();
			var trackDefXml = trackXml.TrackDefinition.(TrackTypeName.toString() == trackTypeToFind);
			var trackFilePath = trackDefXml.TrackFile.Path.toString();
			var trackFileName =  trackDefXml.TrackFile.Name.toString();
			if(trackFilePath == "" || trackFileName == "") throw new Error("Track Type [" + trackTypeToFind + "] does not exist on Media [" + mediaName + "]");
			var file = mediaPath + "/" + trackFilePath + "/"+  trackFileName;

			if (runFileExist) {
				if (! fileExists(file) ) throw new Error("File does not exist: " + file);
	        	}

			return file;

		},

		this.deleteComments = function(ttn){
			wscall(<PharosCs>
				<CommandList>
				  <Command subsystem="comment" method="deleteComments">
					<ParameterList>
					  <Parameter name="matId" value={this.matId}/>
					  <Parameter name="trackTypeName" value={ttn}/>
					</ParameterList>
				  </Command>
				</CommandList>
			</PharosCs>)
		}
	},

	printObj : function(obj, dl) {
		try {
			var delim = "\t";
			if (typeof(dl) !== "undefined") {
				dl = dl + delim;
			} else {
				dl = "";
			}
			for ( var prop in obj ) {
				if (typeof(obj[prop]) === "object") {
					if (obj[prop] === null) {
						print(dl + prop+"["+"]: null");
					} else if (typeof(obj[prop]) === "undefined"){
						print("Warning [" + obj[prop] + "] is undefined");
					} else {
						print(dl + prop+"["+obj[prop].constructor.name+"]:");
					}
					this.printObj(obj[prop],dl);
				} else {
					if (obj[prop] === null) {
						print(dl + prop+"["+"]: null");
					} else if (typeof(obj[prop]) === "undefined"){
						print("Warning [" + obj[prop] + "] is undefined");
					} else {
						print(dl + prop+"["+obj[prop].constructor.name+"]: "+obj[prop]);
					}
				}
			}
		} catch(e) {
			print("Error in printObj: " + e.message);
		}
	},

	deleteComments : function(matId,trackTypeName,commentTypeNames){

		try {
			print("\nDeleting comments ["+ commentTypeNames +"] for material ["+ matId +"] Track Type ["+ trackTypeName +"]");
			var commentTypeParameter;
			var commentTypeList = <CommentTypeList/>;
			if(typeof(commentTypeNames) != "undefined" && commentTypeNames!=null && commentTypeNames.length>=1){
				for each(var commentTypeName in commentTypeNames){
					commentTypeList.appendChild(<TypeName>{commentTypeName}</TypeName>);
				}
				commentTypeParameter =  <Parameter name="commentTypeNames">
											<Value></Value>
									    </Parameter>
				commentTypeParameter.Value.appendChild(commentTypeList);
			}

			var deleteComments = <PharosCs>
									<CommandList>
										<Command subsystem="comment" method="deleteCommentByCommentTypes">
										  <ParameterList>
											<Parameter name="matId" value={matId}/>
											<Parameter name="trackTypeName" value={trackTypeName}/>
										  </ParameterList>
										</Command>
									 </CommandList>
								 </PharosCs>;
			if(commentTypeParameter)
				deleteComments..ParameterList.appendChild(commentTypeParameter);
			wscall(deleteComments);
		} catch(e){
			print("Error deleting comments ["+ commentTypeNames +"] for material ["+ matId +"] "[+e]);
		}

	},

	getFileNameWithoutExt : function (fileName){
		var pos = fileName.lastIndexOf(".");
		if (pos > 0) {
		   fileName = fileName.substring(0, pos);
		}
		return fileName;
	},

	makeIsoFormattedDateForFilename	:	function() {
       return  gmoNBCFunc.makeIsoFormattedDate(10);
	},
	makeIsoFormattedDate : function(additionalDays) {
		var offset = new Date();
        offset.setDate(offset.getDate() + additionalDays);

        var yyyy = offset.getFullYear();
        // var mm = offset.getMonth() + 1;
        var mm = ("0" + (parseInt(offset.getMonth()) + 1)).slice(-2);
        // var dd = offset.getDate();
        var dd = ("0" + parseInt(offset.getDate())).slice(-2)
        var isoFormattedDate = String(yyyy + "-" + mm + "-" + dd);
		return isoFormattedDate;
	},
	/**
	 *
	 * Moves a file, confirms success
	 * @param [src] [Full path and filename of source e.g. /srv/storage/filename.txt]
	 * @param [dst] [Full path and filename of destination]
	 *
	 */

	moveFile	: function(src, dst) {
		print("Moving src:["+src+"] to dst:["+dst+"]");
		move(src, dst);
		print("Move completed.");
		print("Checking file exists after move");
		if (fileExists(dst)) {
			print("File Exists");
		} else {
			throw new Error("File Move Failed!");
		}
	},
	/**
	 *
	 * Copies a file, after success it will/attempts to delete the source file
	 * @param [src] [Full path and filename of source e.g. /srv/storage/filename.txt]
	 * @param [dst] [Full path and filename of destination]
	 *
	 */

	copyFileDeleteSource	: function(src, dst) {
		print("Copying src:["+src+"] to dst:["+dst+"]");
		copy(src, dst);
		print("Copy completed.");
		print("Checking file exists after copy");
		if (fileExists(dst)) {
			print("File Exists - delete src:["+src+"]");
			remove(src);
			if (fileExists(src)) {
				print("WARN: Could not delete ["+src+"]");
			} else {
				print("Successfully deleted ["+src+"]");
			}
		} else {
			throw new Error("File Failed to copy");
		}
	},

	// Prints an Object (Recursive)
	// @param [object] - (obj) - Object to transverse
	// @ **Optional** param [string] - (dl) - How to print the object props
	// @return - no return
	printObj : function(obj, dl) {
		var delim = "\t";
		if (typeof(dl) !== "undefined") {
			dl = dl + delim;
		} else {
			dl = "";
		}
		for ( var prop in obj ) {
			if (typeof(obj[prop]) === "object") {
				if (obj[prop] === null) {
					print(dl + prop+"["+"]: null");
				} else {
					print(dl + prop+"["+obj[prop].constructor.name+"]:");
				}
				this.printObj(obj[prop],dl);
			} else {
				if (obj[prop] === null) {
					print(dl + prop+"["+"]: null");
				} else {
					print(dl + prop+"["+obj[prop].constructor.name+"]: "+obj[prop]);
				}
			}
		}
	},

	// This will parse a delimited string into an array of
	// arrays. The default delimiter is the comma, but this
	// can be overriden in the second argument.
	CSVToArray : function( strData, strDelimiter ) {
		// Check to see if the delimiter is defined. If not,
		// then default to comma.
		strDelimiter = (strDelimiter || ",");
		// Create a regular expression to parse the CSV values.
		var objPattern = new RegExp(
			(
				// Delimiters.
				"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

				// Quoted fields.
				"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

				// Standard fields.
				"([^\"\\" + strDelimiter + "\\r\\n]*))"
			),
			"gi"
			);
		// Create an array to hold our data. Give the array
		// a default empty first row.
		var arrData = [[]];

		// Create an array to hold our individual pattern
		// matching groups.
		var arrMatches = null;

		// Keep looping over the regular expression matches
		// until we can no longer find a match.
		while (arrMatches = objPattern.exec( strData )){
			// Get the delimiter that was found.
			var strMatchedDelimiter = arrMatches[ 1 ];
			// Check to see if the given delimiter has a length
			// (is not the start of string) and if it matches
			// field delimiter. If id does not, then we know
			// that this delimiter is a row delimiter.
			if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)){
				// Since we have reached a new row of data,
				// add an empty row to our data array.
				arrData.push( [] );
			}
			// Now that we have our delimiter out of the way,
			// let's check to see which kind of value we
			// captured (quoted or unquoted).
			if (arrMatches[ 2 ]){
				// We found a quoted value. When we capture
				// this value, unescape any double quotes.
				var strMatchedValue = arrMatches[ 2 ].replace(new RegExp( "\"\"", "g" ),"\"");
			} else {
				// We found a non-quoted value.
				var strMatchedValue = arrMatches[ 3 ];
			}
			// Now that we have our value string, let's add
			// it to the data array.
			arrData[ arrData.length - 1 ].push( strMatchedValue );
		}
		// Return the parsed data.
		return( arrData );
	},

	getMediasByGroup : function (mediaGroup) {

		return wscall(<PharosCs>
		  <CommandList>
			<Command subsystem="media" method="getMediaGroup">
			  <ParameterList>
				<Parameter name="name" value={mediaGroup}/>
			  </ParameterList>
			</Command>
		  </CommandList>
		</PharosCs>)..Media;
	},

	saveTrackTypeShortTextElement : function (trackTypeName, name , value) {

		materialSaveXml = <Material>
			<MatId>{matId}</MatId>
			<TrackTypeLink>
				<TrackTypeName>{trackTypeName}</TrackTypeName>
				 <ShortTextList>
					<ShortText>
					  <ShortTextType>{name}</ShortTextType>
					  <Value>{value}</Value>
					</ShortText>
				</ShortTextList>
			</TrackTypeLink>
		</Material>;
		materialSave(materialSaveXml);
	},

	sendEmail : function (to, from, subject, body) {

		var emailCommand = <PharosCs>
					  <CommandList>
					    <Command subsystem="job" method="executeJob">
					      <ParameterList>
						<Parameter name="jobFactoryName" value="emailJobFactory"/>
						<Parameter name="jobDescription">
						  <Value>
						    <JobDescription>
							<Properties>
								<Mapping>
									<address>{to}</address>
									<sender>{from}</sender>
									<subject>{subject}</subject>
									<body>{body}</body>
								</Mapping>
							</Properties>
						    </JobDescription>
						  </Value>
						</Parameter>
						<Parameter name="priorityMatId" value=""/>
					      </ParameterList>
					    </Command>
					  </CommandList>
					</PharosCs>;

					return wscall(emailCommand);

	},
	sendCustomEmail : function (to, subject, body) {

		body = new XML("<![CDATA[" + body + "]]>");

		var emailCommand = <PharosCs>
					  <CommandList>
					    <Command subsystem="job" method="executeJob">
					      <ParameterList>
						<Parameter name="jobFactoryName" value="customEmailJobFactory"/>
						<Parameter name="jobDescription">
						  <Value>
						    <JobDescription>
							<Properties>
								<Mapping>
									<address>{to}</address>
									<subject>{subject}</subject>
									<body>{body}</body>
								</Mapping>
							</Properties>
						    </JobDescription>
						  </Value>
						</Parameter>
						<Parameter name="priorityMatId" value=""/>
					      </ParameterList>
					    </Command>
					  </CommandList>
					</PharosCs>;

		return wscall(emailCommand);

	},
	getMatIdFromFilenameTTL : function(fileName, expectedState /*, contextName, searchShortText*/) {
		runReportXml = <PharosCs>
			  <CommandList>
				<Command method="runReport" subsystem="report">
				  <ParameterList>
					<Parameter name="reportName" value="getMatIdFromFilenameTTLReport"/>
					<Parameter name="reportParameters">
						<Value>
						<CustomReportRuntimeParameters>
							<Parameters>
							<StringReportParameter>
								<Name>fileName</Name>
								<Operator>is</Operator>
								<Values>
									<String>{fileName}</String>
								</Values>
							</StringReportParameter>
							<StringReportParameter>
								<Name>stateName</Name>
								<Values>
									<String>{expectedState}</String>
								</Values>
								<Operator>is</Operator>
							</StringReportParameter>
							</Parameters>
						</CustomReportRuntimeParameters>
						</Value>
					</Parameter>
					<Parameter name="pageSize">
						<Value>
							<Integer>10</Integer>
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

		var rtn = wscall(runReportXml);
		var rtnCount = parseInt(rtn..ResultList.PagedResults.Count);

		if (rtnCount > 1) {
			print("Number of returned results is ["+rtnCount+"]. Expecting only 1");
		} else if (rtnCount == 0) {
			print("No Material Id matching for FileName ["+fileName+"]");
			return false;
		}
		var rtnMatId = rtn..ResultList.PagedResults..MATERIAL__ID.toString();
		var rtnTtl = rtn..ResultList.PagedResults..TRACK_TYPE__TYPE_NAME.toString();

		return {
			matId: 		rtnMatId,
			ttl: 		rtnTtl
		}
	},
	isTranslatorShellExists : function (tvdNumber , placingXML) {

		//Added placingXML as a param to use in future if certain licensees can be processed without shell
		//May be define the rule in preset and use that to run some validation or exception case logic
		var isShellExist = false;
		var shortText = "shorttext";
		var shortTextTypeTVDProduction = "TVD Production #";
		var tvdMatIds = gmoNBCFunc.getMaterialsFromDataElements(shortText,shortTextTypeTVDProduction,tvdNumber);

		for each(var mat in tvdMatIds) {

			var matXml = materialGet(mat,"tag")..Material;
			if ("Translation Layer" == matXml.TagList.Tag.(TagType.toString()=="Shell Creator").Value.toString()) {
				isShellExist = true;
				print("Shell Exists for [" + tvdNumber + "]");
				break;
			}
		}
		return isShellExist;
	},
	mediaInfoHelper : function(materialXml){

		this.validFrameRateMap = {
			// P23_976
			"23.976" : "P23_976",

			// DF30
			"29.97" : "DF30",
			"29.970" : "DF30",

			// NDF25
			"25" : "NDF25",

			// NDF30
			"30" : "NDF30",

			// DF60
			"59.94" : "DF60",

			// NDF60
			"60" : "NDF60"
		}

		this.vantageScanTypeMap = {
			"interlaced" : {
				"TFF" : "Interlaced Upper Field First",
				"BFF" : "Interlaced Lower Field First"
			},
			"progressive" : "Progressive"
		}

		this.mediaInfoXml = new XML(materialXml..FullTextList.FullText.(FullTextType == "Media Info Xml").Value.toString());

		if (this.mediaInfoXml != "" && this.mediaInfoXml != null){
			output("Media Info Xml found in materialXml, using that.");
		} else {
			output("Could not find Media Info Xml in materialXml, running materialGet.");
			var materialXml = materialGet(materialXml..MatId.toString(), "fulltext");
			this.mediaInfoXml = new XML(materialXml..FullTextList.FullText.(FullTextType == "Media Info Xml").Value.toString());
		}

		this.getScanType = function(){
			var scanType = this.mediaInfoXml.track.(@type.toString() === "Video").Scan_type[0].toString().toLowerCase();

			return scanType;
		}

		this.getScanOrder = function(){
			var scanOrder = this.mediaInfoXml.track.(@type.toString() === "Video").Scan_order[0].toString();

			return scanOrder;
		}

		this.getVantageScanType = function() {
			var scanType = this.getScanType();
			if (scanType == "interlaced"){
				var scanOrder = this.getScanOrder();
				return this.vantageScanTypeMap[scanType][scanOrder];
			} else {
				return this.vantageScanTypeMap[scanType];
			}
		}

		this.getVideoHeight = function(){

			var videoHeight;
			if (this.mediaInfoXml.track.(@type.toString() == "Video").Original_height[0] != undefined) {
				 videoHeight = this.mediaInfoXml.track.(@type.toString() === "Video").Original_height[0].toString();
			}else {
				 videoHeight = this.mediaInfoXml.track.(@type.toString() === "Video").Height[0].toString();
			}
			return videoHeight.replace(/\s/g, "");
		}

		this.getVideoWidth = function(){
			var videoWidth;
			if (this.mediaInfoXml.track.(@type.toString() == "Video").Original_width[0] != undefined) {
				 videoWidth = this.mediaInfoXml.track.(@type.toString() === "Video").Original_width[0].toString();
			}else {
				 videoWidth = this.mediaInfoXml.track.(@type.toString() === "Video").Width[0].toString();
			}

			return videoWidth.replace(/\s/g, "");
		}

		this.getFrameRate = function(){
			var frameRates = this.mediaInfoXml.track.(@type.toString() === "Video").Frame_rate;

			for each (var frameRateString in frameRates){
				var frameRate = this.validFrameRateMap[frameRateString];
				if (frameRate != "" && frameRate != null){
					return frameRate;
				}
			}
			throw new Error("Frame rate from MediaInfo did not match a valid frame rate.");
		}
	},
	guidGenerator : function() {
		var part  = function() {
			return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		};
		return (part()+"_"+part()+"_"+part()+"_"+part());
	},
	getAllTrackTypes : function() {
		var cmd =
			<PharosCs>
				<CommandList>
					<Command subsystem="trackType" method="getAll"/>
				</CommandList>
			</PharosCs>

		return wscall(cmd)..Output.TrackTypeList;
	},
	getTrackTypeClassFromFileTag : function(fileTag){
		var trackTypeList = this.getAllTrackTypes();

		return trackTypeList.TrackType.(FileTag == fileTag).ClassName.toString();
	},
	// Use to return a certain number of spaces
	// @param [string] - (nSpaces) - Amount of Spaces required
	// @return [string] - with desired amount of spaces
	makeMeSpaces : function(nSpaces) {
      return Array(nSpaces+1).join(" ");
    },
	materialGetFull : function(matId){

		var xml =
		<PharosCs>
			<CommandList>
				<Command subsystem="material" method="get">
					<ParameterList>
						<Parameter name="matId" value={matId}/>
						<Parameter name="options">
							<Value>
								<MaterialOptions>
									<Option>brand</Option>
									<Option>brandLinks</Option>
									<Option>browseInfo</Option>
									<Option>comments</Option>
									<Option>deletedTracks</Option>
									<Option>episode</Option>
									<Option>extraData</Option>
									<Option>files</Option>
									<Option>fulltext</Option>
									<Option>history</Option>
									<Option>markers</Option>
									<Option>nonSegmentMarkers</Option>
									<Option>owners</Option>
									<Option>parcel</Option>
									<Option>placing</Option>
									<Option>playlist</Option>
									<Option>relatedComments</Option>
									<Option>requests</Option>
									<Option>segmentLinks</Option>
									<Option>segments</Option>
									<Option>series</Option>
									<Option>seriesLinks</Option>
									<Option>shorttext</Option>
									<Option>stateGroups</Option>
									<Option>streamDefinitions</Option>
									<Option>tag</Option>
									<Option>tracks</Option>
									<Option>trackTypeLinks</Option>
									<Option>virtualMaterialParcel</Option>
								</MaterialOptions>
							</Value>
						</Parameter>
						<Parameter name="episodeOptions">
							<Value>
								<EpisodeOptions>
									<Option>shorttext</Option>
									<Option>fulltext</Option>
									<Option>tag</Option>
									<Option>owners</Option>
								</EpisodeOptions>
							</Value>
						</Parameter>
						<Parameter name="seriesOptions">
							<Value>
								<SeriesOptions>
									<Option>shorttext</Option>
									<Option>fulltext</Option>
									<Option>tag</Option>
									<Option>owners</Option>
								</SeriesOptions>
							</Value>
						</Parameter>
						<Parameter name="brandOptions">
							<Value>
								<BrandOptions>
									<Option>shorttext</Option>
									<Option>fulltext</Option>
									<Option>tag</Option>
									<Option>owners</Option>
								</BrandOptions>
							</Value>
						</Parameter>
						<Parameter name="segmentOptions">
							<Value>
								<SegmentOptions>
									<Option>shorttext</Option>
									<Option>fulltext</Option>
									<Option>tag</Option>
									<Option>comments</Option>
								</SegmentOptions>
							</Value>
						</Parameter>
					</ParameterList>
				</Command>
			</CommandList>
		</PharosCs>;

		return wscall(xml);

	},
	saveEpisodeXML : function(episodeXML){
		var episodeSaveXml =
					<PharosCs>
					  <CommandList>
						<Command subsystem="episode" method="save">
						  <ParameterList>
							<Parameter name="episode">
							  <Value>
							     {episodeXML}
							  </Value>
							</Parameter>
						  </ParameterList>
						</Command>
					  </CommandList>
					</PharosCs>;

		return wscall(episodeSaveXml).CommandList.Command.@success.toString() === "true";
	},

	saveSeriesXML : function(seriesXML){
		var seriesSaveXml =
					<PharosCs>
					  <CommandList>
						<Command subsystem="series" method="save">
						  <ParameterList>
							<Parameter name="series">
							  <Value>
							     {seriesXML}
							  </Value>
							</Parameter>
						  </ParameterList>
						</Command>
					  </CommandList>
					</PharosCs>;

		return wscall(seriesSaveXml).CommandList.Command.@success.toString() === "true";
	},

	saveBrandXML : function(brandXML){
		var brandSaveXml =
					<PharosCs>
					  <CommandList>
						<Command subsystem="brand" method="save">
						  <ParameterList>
							<Parameter name="brand">
							  <Value>
							     {brandXML}
							  </Value>
							</Parameter>
						  </ParameterList>
						</Command>
					  </CommandList>
					</PharosCs>;

		return wscall(brandSaveXml).CommandList.Command.@success.toString() === "true";
	},

	calculateDuration  : function(inpoint,outpoint, frameRate) {
		var rtn = wscall(<PharosCs>
				  <CommandList>
					<Command subsystem="timecode" method="calculateDuration">
					  <ParameterList>
						<Parameter name="incode" value={inpoint}/>
						<Parameter name="outcode" value={outpoint}/>
						<Parameter name="frameRate" value={frameRate}/>
					  </ParameterList>
					</Command>
				  </CommandList>
				</PharosCs>);

		return rtn..Output.toString();
	},

	/**
	 * @usage		audioFix(filePath,frame,frameRate)
	 * @param		{string}	filePath: the absolute filepath to the source file
	 * @param		{num}		frame: Number of frames to add or drop
	 * @param		{string} 	frameRate: name of frame rate format
	 * @example		Drop 200 frames: audioFix(/home/pharos/test.wav, -200, 'DF30')
	*/
	audioAdjustment : function(filePath,frames,frameRate) {
		var framesToSamplesConv = function(bframe_count, bframe_rate, bsample_rate) {
			output("framesToSamplesConv(): Converting frames [" + bframe_count + "] to samples for frame rate [" + bframe_rate + "] at sampling rate [" + bsample_rate + "]");
			// The MFF sampling rate is 48kHz.
			var second_1 = AmountOfTime.parseText(bframe_rate, "00:00:01:00");
			var timecode_adjust =  AmountOfTime.parseFrames(bframe_rate, Math.abs(bframe_count)).toString();
			var samples_per_frame = (bsample_rate / second_1.asFrames());
			var samples_adjust =  samples_per_frame * Math.abs(bframe_count);

			output("framesToSamplesConv(): Got [" + samples_per_frame + "] samples per frame so [" + samples_adjust + "] total samples");
			return samples_adjust;
		};

		var getSampleRateFromMediaInfoXml = function(xml) {
			for each (var sample_value in xml..Sampling_rate) {
				if (Math.abs(sample_value !== NaN)) {
					return sample_value;
				}
			}
			return 48000 // Default to 48KHz - should be the system default
		};

		//Throw error if no file doesn't exist or zero input for frames param
		if (!fileExists(filePath)) throw new Error("The file: " + filePath + " does not exist.");
		var mediainfoXml = gmoNBCFunc.getFileInfoXml(filePath);
		if (frames === 0) throw new Error("Frames parameter detected as zero. Expecting nonzero input.");
		var backup = filePath.substr(0,filePath.lastIndexOf('.'))+'_backup.wav'

		//Create backup to same directory as original file
		gmoNBCFunc.moveFile(filePath, backup)

		//Decide to add/trim & put number of frames into timecode of form "hh:mm:ss.iii" where iii is milliseconds
		var option = frames > 0 ? '-a' : '-t';
		var numOfSamples = framesToSamplesConv(frames, frameRate, getSampleRateFromMediaInfoXml(mediainfoXml));

		//Run audiomanipulate with pertinent options
		output("Adjusting [" + filePath + "] by [" + frames + "] frames");
		debug = true;
		var runAdjustment = run('/usr/local/bin/audiomanipulate','-i',backup, option, numOfSamples,'-b','24','-f','wav','-v','-o',filePath);
		debug = false;
		if (runAdjustment.exit !== 0){
			throw new Error("Run Command Failed for Audio Manipulate");
		} else {
			output("\n" + runAdjustment.output);
			output("Adjustment successful, removing backup file")
			remove(backup);
		};
	},

	isMateriaStraightToArchiveWorkflow : function(matId){
		var isStraightToArchiveWorkflow = false;
		var materialXml =  materialGet(matId,'tag')..Material;
		var tagName = 'Drop Folder';
		var dropFolder= materialXml..TagList.Tag.(TagType.toString()==tagName).Value.toString()
		if(gmoNBCFunc.contains(NBCGMO.StraightToArchiveFolders,dropFolder)){
			isStraightToArchiveWorkflow = true;
		}
		return isStraightToArchiveWorkflow;
	},
	getMaterialTrackList : function (matId) {
		var mTrackXml = materialGet(matId,"tracks");
		var trackList = [];
		for each(var track in mTrackXml..Track){
			trackList.push(track.MediaName.toString());
		}
		return trackList;
	},
	// Makes and Saves a Segment for a Specified Group - Expand to handle multiple Segments Eventually
	makeSegment : function (matId,frameRate,incode,outcode,group,index) {

		print("Saving Segment for [" + matId + "] Group [" + group + "] Index [" + index + "]");
		print("Segment Incode [" + incode + "] Outcode [" + outcode + "] Frame Rate [" + frameRate + "].");

		var matSaveXml =
			<Material>
				<MatId>{matId}</MatId>
				<SegmentList>
					<Segment>
						<MarkerIn>
							<FrameRate>{frameRate}</FrameRate>
							<Absolute>{incode}</Absolute>
						</MarkerIn>
						<MarkerOut>
							<FrameRate>{frameRate}</FrameRate>
							<Absolute>{outcode}</Absolute>
						</MarkerOut>
						<SegmentGroup>
							<Name>{group}</Name>
						</SegmentGroup>
						<SegmentType>
							<Name>GMO</Name>
						</SegmentType>
							<Index>{index}</Index>
					</Segment>
				</SegmentList>
			</Material>;

		return materialSave(matSaveXml)

	},
	deleteTrackWithDeleteMark : function(matId,mediaName){
		cmdXml=<PharosCs>
				<CommandList>
					<Command subsystem="material" method="delete">
						<ParameterList>
							<Parameter name="matId" value={matId}/>
							<Parameter name="deleteMark">
								<Value>
									<Integer>1</Integer>
								</Value>
							</Parameter>
							<Parameter name="mediaNames">
								<Value>
									<TextList>
									<Text>{mediaName}</Text>
									</TextList>
								</Value>
							</Parameter>
						</ParameterList>
					</Command>
				</CommandList>
			</PharosCs>
		rtn = wscall(cmdXml);
		return rtn..Output;
	},

	resolveAlias : function(aliasName, domainKey){
		var cmd =
		<PharosCs>
		  <CommandList>
			<Command subsystem="alias" method="resolveAlias">
			  <ParameterList>
				<Parameter name="alias">
				  <Value>
					<Alias>
					  <Name>{aliasName}</Name>
					</Alias>
				  </Value>
				</Parameter>

				<Parameter name="domainKey" value={domainKey}/>
			  </ParameterList>
			</Command>
		  </CommandList>
		</PharosCs>;
		return wscall(cmd)..Output.toString();
	},

	// Method to Create a job and monitor its progress for its lifecycle
	// @param [string] jobFactory
	// @param [xml] jobDesc (Note, the calling script is responsibile for building the correct Job Description)
	// ** Optional ** @param[boolean] Indicating whether the job progress should be printed to the log each time its polled or only in the event that the status has changed
	// @return [boolean] Reporting whether the Job Ran Successfully
	createRunAndPollJob : function(jobFactory, jobDesc, statusChangesOnly, updateJobStatus, startPercent, endPercent) {

		// Default to 0 and 100 respectivly if not a valid number, or null. (undefined === NaN, null !== NaN)
		if (isNaN(startPercent) || startPercent === null){
			var startPercent = 0;
		}

		if (isNaN(endPercent) || endPercent === null){
			var endPercent = 100;
		}

		var statusChangesOnly = statusChangesOnly === undefined ? false : true, externalJobId, lastJobStatus = "", lastJobProgress = 0;
		var updateJobStatus = updateJobStatus === undefined ? false : true;

		print("\nCreating Job using Description [" + jobDesc + "]");

		var jobId = this.executeJob(jobFactory, jobDesc);
		print("\nJob Submitted - JobId Received [" + jobId + "]");

		// Taken from Job.Status
		var jobStatusMap = {finished : "Finished", failed : "Failed"};

		// Taken from StatusMap.Mapping
		var jobResultSuccess = "success";

		// Poll the Job
		while (true) {

			var jobResponse = this.getJob(jobId);
			var jobStatus = jobResponse..Output.Job.Status.toString();
			var jobProgress = jobResponse..Output.Job.StatusMap.Mapping.hasOwnProperty("JOB__PROGRESS") ? parseInt(jobResponse..Output.Job.StatusMap.Mapping.JOB__PROGRESS) : 0;

			// Update the jobProgress using the start/end percentages defined.
			var totalPercent = endPercent - startPercent;
			jobProgress = parseInt(((jobProgress / 100) * totalPercent) + startPercent);

			// Mediator has Finished running the Job
			if (jobStatus === jobStatusMap.finished) {

				print("\nJobId [" + jobId + "] has Finished");
				var jobResult = jobResponse..StatusMap.Mapping.JOB__RESULT.toString();
				print("JOB__RESULT [" + jobResult + "]");

				// Jobs will still return a Finished Value as long as Mediator itself didn`t have a problem running it (e.g. No Job Manager disconnect etc). Therefore check that the Finished job was actually successful.
				if (jobResult !== jobResultSuccess) {
					print("Job Finished with errors  [" + jobResponse..StatusMap.Mapping.JOB__ERROR.toString() + "]");
					throw new Error(jobResponse..StatusMap.Mapping.JOB__ERROR.toString());
				} else {
					sleep(1);
					print("Job Finished without errors.");
					return true;
				}

			// Mediator Failed Job
			} else if (jobStatus === jobStatusMap.failed) {

				print("ERROR: JobId [" + jobId + "] has Failed with the following error [" + jobResponse..StatusMap.Mapping.JOB__ERROR.toString() + "]");
				throw new Error(jobResponse..StatusMap.Mapping.JOB__ERROR.toString());
			// Job is still in Progress
			} else {

				if (statusChangesOnly) {
					if (jobStatus !== lastJobStatus || jobProgress !== lastJobProgress) {
						print("JobId [" + jobId + "] has Status [" + jobStatus + "] Progress [" + jobProgress + "]");
						if (updateJobStatus){
							updateStatusMap('JOB__PROGRESS', jobProgress);
						}
					}
				} else {
					print("JobId [" + jobId + "] has Status [" + jobStatus + "] Progress [" + jobProgress + "]");
					if (updateJobStatus){
						updateStatusMap('JOB__PROGRESS', jobProgress);
					}
				}

			}

			lastJobStatus = jobStatus;
			lastJobProgress = jobProgress;
			sleep(60);
		}
	},
	/**
	 * [makeAndRunJob description]
	 * @param  {XML}      jobObj         [XML object defining specific parameters to pass to a Mediator job description]
	 * @param  {XML}      externalJobObj [XML object used to run any external jobs (i.e. run a Vantage job or similar)]
	 * @param  {String}   factory        [The name of the job factory to run the job]
	 * @return {Boolean}                 [Returns true for job success and false for job failure]
	 */
	makeAndRunJob	: function(jobObj,externalJobObj,factory) {
		var statusChangesOnly = true;
		var jobDesc = <JobDescription>
						  <Properties>
						    <Mapping>
						    </Mapping>
						  </Properties>
						</JobDescription>;

		var updateExternalJob = false;
		var externalJobId;
		var sleepMS = jobObj.hasOwnProperty("sleepMS") ? jobObj["sleepMS"] : 60000;
		var errorSleepMS = jobObj.hasOwnProperty("errorSleepMS") ? jobObj["errorSleepMS"] : 30000;
		print("sleepMS: " + sleepMS);
		print("errorSleepMS: " + errorSleepMS);
		var lastJobStatus = "";
		var lastJobProgress = 0;

		//If we are going to update the state of an external job, that is running this signiant job
		if ((typeof(externalJobObj) !== "undefined") && (externalJobObj !== null)) {
			if (externalJobObj.hasOwnProperty("jobId")) {
				externalJobId = jobObj.jobId;
				updateExternalJob = true;
			}
			if (externalJobObj.hasOwnProperty("startPercent")) {
				startPercent = jobObj.startPercent;
			}
			if (externalJobObj.hasOwnProperty("endPercent")) {
				endPercent = jobObj.endPercent;
			}
		}

		for (var prop in jobObj) {
			if (prop === "FileNames") {
				var fileNamesWithPath = new XMLList();
				for each (var file in jobObj[prop]) {
					print("Adding File Name ["+file+"]");
					fileNamesWithPath += <Text>{file}</Text>;
				}
				jobDesc.Properties.Mapping.Files.TextList.Text = fileNamesWithPath;
			}
			else{
				print("Adding " + prop + " Property ["+jobObj[prop]+"]");
				jobDesc.Properties.Mapping[prop] = jobObj[prop];
			}
		}

		print("Job Factory is ["+factory+"]");
		print("Submitting " + factory + " Job: \n"+jobDesc);
		var jobId = gmoNBCFunc.executeJob(factory,jobDesc);
		print("Job Submitted - JobId Received ["+jobId+"]");
		print("Status interval is ["+String(sleepMS)+"]");
		print("Polling Job...");

		while (true) {
			try {
				var jobResponse = gmoNBCFunc.getJob(jobId);
				var error_counter = 0;
			} catch(e) {
				print("makeAndRunJob: Failed to get job status");
				print(e.message);
				error_counter++
			}
			if (error_counter == 0) {
				var jobStatus = jobResponse..Output.Job.Status.toString();
				var jobProgress = jobResponse..Output.Job.StatusMap.Mapping.hasOwnProperty("JOB__PROGRESS") ? parseInt(jobResponse..Output.Job.StatusMap.Mapping.JOB__PROGRESS) : 0;

				if (jobStatus === "Finished") {
					print("JobId ["+jobId+"] has Finished");
					var JOB__STATUS = jobResponse..StatusMap.Mapping.JOB__STATUS.toString();
					print("JOB__STATUS ["+JOB__STATUS+"]");
					if (JOB__STATUS !== "Job Completed Successfully") {
						print("Job Finished with errors : "+ jobResponse..StatusMap.Mapping.JOB__ERROR.toString());
						return false;
					} else {
						print("Job Finished without errors.");
						return true;
					}

				} else if (jobStatus === "Failed") {
					print("ERROR: JobId ["+jobId+"] has Failed.");
					print(jobResponse..StatusMap.Mapping.JOB__ERROR.toString());
					return false;

				} else {
					if (statusChangesOnly) {
						if (jobStatus !== lastJobStatus || jobProgress !== lastJobProgress) {
							print("JobId ["+jobId+"] has Status ["+jobStatus+"] Progress ["+jobProgress+"]");
						}
					} else {
						print("JobId ["+jobId+"] has Status ["+jobStatus+"] Progress ["+jobProgress+"]");
					}
				}

				if (updateExternalJob) {
					//get total percent we're expected to account for
					var totalPercent = endPercent - startPercent;
					var returnPercent = parseInt(((jobProgress/100)*totalPercent) + startPercent);
					this.updateJobProgressPercent(externalJobId,returnPercent);
				}

				lastJobStatus = jobStatus;
				lastJobProgress = jobProgress;
				java.lang.Thread.sleep(sleepMS);
			} else {

				if (error_counter <= 10) {
					print("Holding job thread ["+error_counter+"]");
					java.lang.Thread.sleep(errorSleepMS);
				} else {
					print("Failing job polling");
					return false;
				}
			}
		}
	},

	getTagByTagTypeAndValue : function(tagType,tagValue) {
		var tagSearchResult = wscall(<PharosCs>
			 <CommandList>
			   <Command subsystem="tag" method="search">
			     <ParameterList>
			       <Parameter name="value" value={tagValue}/>
			       <Parameter name="tagType" value={tagType}/>
			     </ParameterList>
			   </Command>
			 </CommandList>
		</PharosCs>);

		if(tagSearchResult..Command.@success.toString() === "true" && tagSearchResult..Output.TagList != "") {
			for each (var tag in tagSearchResult..Output.TagList.Tag.(TagType.toString() == tagType)) {

				if(tag.Value.toString() == tagValue) {
					return tag;
				}
			}
		}
		return;
	},
	totalNumberOfAudioChannelsOnTrack : function(track_xml) {
		output("totalNumberOfAudioChannelsOnTrack()");
		var total = 0;
		for each (var td in track_xml.TrackDefinition.(TrackType.ClassId.toString() == "AUDIO")) {
			total += parseInt(td.Channels[0].toString());
		}
		output("Found [" + total + "] Audio Channels on [" + track_xml.MediaName.toString() + "]");
		return total;
	},
	/**
	 * [addFrameLabels Adds 2 Frame Labels]
	 * @param {[FrameLabel]} frameLabel1
	 * @param {[FrameLabel]} frameLabel2
	 */
	addFrameLabels : function(frameLabel1,frameLabel2){
		var nanos =  frameLabel1.asNanos() + frameLabel2.asNanos()
		return Packages.com.pharos.microtime.FrameLabel.parseNanos(frameLabel1.rate,nanos.toString())
	},

	/**
	 * [isSubset To Check if arr2 is an subset of arr1 ]
	 * @param  {[Array]}  arr1 [1,3,4,5,6,6,7]
	 * @param  {[Array]}  arr2 [3,4,5]
	 * @return {Boolean}   
	 */
	isSubset : function(arr1, arr2){
		return arr2.every(function (val) { return arr1.indexOf(val) >= 0; });
	},
	
	/**
	 * [calculateDF30TimeCode Calculate Drop Frame TimeCode from Seconds]
	 * @param  {[Number]} seconds
	 * @return {[String]} DF30 Time Code
	 */
	calculateDF30TimeCode : function(seconds){
		//print("seconds is ["+seconds+"]");
		var minutes = seconds/60;
		dropFrameCount = 0;
		for(i=1;i<=minutes;i++){
			if(i%10!=0){
				dropFrameCount = dropFrameCount+2 ;
			}
		}
		if(dropFrameCount==0){
			var hrs = "00";
			var minutes = "00";
			var secs = zeroPad(seconds,2);
			var frames = "00";
		}else {
			var hrs = zeroPad(parseInt(seconds/3600),2);
			var minutes = zeroPad((parseInt(seconds/60)%60),2);
			var secs = zeroPad(seconds%60 + parseInt(dropFrameCount/30),2);
			var frames = zeroPad(parseInt(dropFrameCount%30),2);
		}
		var timecode =  hrs + ":" + minutes + ":" + secs + ";" + frames;
		print("Seconds = ["+seconds+"]" + " Timecode = [" + timecode +"]");
		return timecode;
	},
	/**
   * [printOrLog description]
   * @param  {[String]} stmt  [message you want to log]
   * @param  {[boolean]} debug [True or False - Applicable only for logger]
   */
  printOrLog : function(stmt,debug){
          //Had to change it last minute typeof logger was not working
            if(!typeof logger == "undefined"){
	            if(debug)
	                logger.debug(stmt);
	            else
	                logger.info(stmt);
            }else {
            	print(stmt);
            }
    },
    /**
     * [findTranslatorShell Find Shell Material For a Specifiv TVD #]
     * @param  {[String ]} tvdProdNum [TVD Production #]
     * @return {[String]}  [Shell Material ID]
     */
    findTranslatorShell :  function (tvdProdNum){

          const TVD_PRODUCTION_NUM = "TVD Production #";
          const SHORTTEXT = "shorttext";
          const TAG = "tag";
          var shellMaterialId = "";
          this.printOrLog("Searching for all Materials that match (" + TVD_PRODUCTION_NUM + ") [" + tvdProdNum + "]");
          var tvdMatIds = gmoNBCFunc.getMaterialsFromDataElements(SHORTTEXT,TVD_PRODUCTION_NUM,tvdProdNum);
          this.printOrLog("TVD Group Materials ["+tvdMatIds+"]")
          for each(var mat in tvdMatIds) {
                  var matXml = materialGet(mat,TAG)..Material;
                  if ("Translation Layer" == matXml.TagList.Tag.(TagType.toString()=="Shell Creator").Value.toString()) {
                          shellMaterialId = matXml.MatId.toString();
                          this.printOrLog("Shell Material is [" + shellMaterialId + "]");
                          break;
                  }
          }
          return shellMaterialId;
  	},
	copyMetadataFromShell: function (matId,tvdProdNum,materialXML){
		const SHORTTEXT = "shorttext";
		const FULLTEXT = "fulltext";
		const TAG = "tag";
		const EPISODE = "episode";

		var listNotToCopyAcrossTVDGroup = [
			'Asset Creation Date',
			'Audio Profile',
			'Contains Black',
			'Drop Folder',
			'Duplicate Audios',
			'Media Info Xml',
			'Original Aspect Ratio',
			'Original Frame Rate',
			'Original File Name',
			'Telecine',
			'Territory Sub-Type',
			'Textless Complete',
			'Total Run Time',
			'TVD Production #',
			'Daisy ID',
			'Source ID',
			'Parent ID',
			'Primary Language',
			'Daisy Production #',
			'Language Master Type',
			"Shell Creator",
			'Secondary Language',
			'Tertiary Language',
			'Territory Master Insert Types',
			'UHD/HDR'
		]

		if(typeof materialXML == "undefined" || materialXML ==""){
			this.printOrLog("No Material XML Found . Lets Get Material XML ");
			materialXML = materialGet(matId,TAG,SHORTTEXT,FULLTEXT)..Material;
		}

		 //Lets Find the Shell record
		 var shellMaterialId = this.findTranslatorShell(tvdProdNum);
			if(shellMaterialId == matId){
				this.printOrLog("Shell Material ID & Material ID are same");
				return materialXML;
			}

		 if(shellMaterialId!="" && shellMaterialId!=undefined){
		 	this.printOrLog("Shell Material Found - Starting Metadata Copy");
		 	shellMaterialXML = materialGet(shellMaterialId,TAG,SHORTTEXT,FULLTEXT,EPISODE)..Material;

		 	//Lets Get ShortTextList Using E4X and add Missing Short Text in Material XML

		 	shortTextList = shellMaterialXML.ShortTextList;


		 	for each (var shortText in shortTextList.ShortText){
		 		if(!this.contains(listNotToCopyAcrossTVDGroup,shortText.ShortTextType.toString())){
			 		if(materialXML.ShortTextList.ShortText.(ShortTextType == shortText.ShortTextType).toString()!=""){
			 			materialXML.ShortTextList.ShortText.(ShortTextType == shortText.ShortTextType).Value = shortText.Value.toString();
			 		} else{
			 			delete shortText.@id;
			 			materialXML.ShortTextList.appendChild(shortText);
			 		}
			 	}
		 	}


		 	//Lets Get FullTextList Using E4X and add Missing Short Text in Material XML

		 	fullTextList = shellMaterialXML.FullTextList;
		 	for each (var fullText in fullTextList.FullText){
		 		if(!gmoNBCFunc.contains(listNotToCopyAcrossTVDGroup,fullText.FullTextType.toString())){
			 		if(materialXML.FullTextList.FullText.(FullTextType == fullText.FullTextType).toString()!=""){
			 			materialXML.FullTextList.FullText.(FullTextType == fullText.FullTextType).Value = fullText.Value.toString();
			 		} else{
			 			delete fullText.@id;
			 			materialXML.FullTextList.appendChild(fullText);
			 		}
			 	}
		 	}

		 	//Lets Get TagList Using E4X and add Missing Short Text in Material XML

		 	tagList = shellMaterialXML.TagList;

		 	for each (var tag in tagList.Tag){
		 		if(!gmoNBCFunc.contains(listNotToCopyAcrossTVDGroup,tag.TagType.toString())){
			 		if(materialXML.TagList.Tag.(TagType == tag.TagType).toString()!=""){
			 			materialXML.TagList.Tag.(TagType == tag.TagType).Value = tag.Value.toString();
			 		} else{
			 			delete tag.@id;
			 			materialXML.TagList.appendChild(tag);
			 		}
			 	}
		 	}

		 	if(shellMaterialXML.Episode.EpisodeId.toString()!="") {
				materialXML.Episode.EpisodeId = shellMaterialXML.Episode.EpisodeId.toString();
			}

		 } else {
		 	this.printOrLog("No Shell Material Found - Skipping Metadata Copy");
		 }
		return materialXML;
	},

	/**
	 * [getOMMedia Finds the Media Name for Active Video Track ]
	 * @param  {[String]} matId
	 * @param  {[XML]} materialXml
	 * @return {[String]}
	 */
	getOMMedia : function(matId,materialXml){
		print("Evaluating OM Video Media")
		if(typeof materialXml == "undefined"){
			materialXml = materialGet(matId,"tracks")..Material;
		}

		var getMediaName = function(matXml, group) {
			return matXml.Track.((this.contains(group, MediaName.toString())) && Encoded.toString()=="true" && DeleteMark.toString()=="0").MediaName.toString();
		}

		var t2Media = getMediaName(materialXml, NBCGMO.t2Medias);
		print("T2 Media ["+t2Media+"]");
		if(this.isVarUsable(t2Media)) return t2Media;

		var storeMedia = getMediaName(materialXml, NBCGMO.storeMedias);
		print("Store Media ["+storeMedia+"]");
		if(this.isVarUsable(storeMedia)) return storeMedia;

		var divaMedia =  getMediaName(materialXml, NBCGMO.archiveMedias);
		print("Diva Meida [" + divaMedia + "]");
		if(this.isVarUsable(divaMedia)) return divaMedia;

		print("Something Wrong !.Shouldnt have gone this far ")
		return "";
	},

	/**
	 * [getOMAudioMedia Finds the Media Name for Active Audio Track]
	 * @param  {[String]} matId
	 * @param  {[XML]} materialXml
	 * @return {[String]}
	 */
	getOMAudioMedia : function(matId,materialXml){

		print("Evaluating OM Audio Media")
		if(typeof materialXml == "undefined"){
			materialXml = materialGet(matId,"tracks")..Material;
		}

		var getMediaNameAndCount = function(matXml, group) {
			return {
				"name" : matXml.Track.((this.contains(group, MediaName.toString())) && Encoded.toString()=="true" && DeleteMark.toString()=="0").MediaName.toString(), 
				"count" : matXml.Track.((this.contains(group, MediaName.toString())) && Encoded.toString()=="true" && DeleteMark.toString()=="0").TrackDefinition.length()
			}
		}

		var t2MediaCheck = getMediaNameAndCount(materialXml, NBCGMO.t2AudioMedias);
		print("T2 Audio Media ["+t2MediaCheck.name+"]");
		var storeMediaCheck = getMediaNameAndCount(materialXml, NBCGMO.storeAudioMedias);
		print("Store Audio Media ["+storeMediaCheck.name+"]");

		if(this.isVarUsable(t2MediaCheck.name) && t2MediaCheck.count > storeMediaCheck.count) {
			return t2MediaCheck.name;
		} else if (this.isVarUsable(storeMediaCheck.name) && storeMediaCheck.count >= t2MediaCheck.count) { 
			return storeMediaCheck.name;
		}
		
		print("Something Wrong !.Shouldnt have gone this far ")
		return "";
	},

	/**
	 * [logErrorToDisk outputs an error message to a file on disk when the workflow fails. The file is located in the originating folder]
	 * @param {[string]} err [Error message]
	 * @param {[string]} origDir [Original directory where the file was dropped]
	 * @param {[string]} movFile [Media filename]
	 * @param {[string]} tvdNum [TVD number]
     */
	logErrorToDisk : function(err, origDir, movFile, tvdNum) {
		var fullPath = origDir + "/logs/"+ movFile + ".log";
		var errMsg = String(movFile + " : " + (tvdNum==""?"N/A":tvdNum) + " : " + err + " : " + gmoNBCFunc.makeIsoFormattedDate(0) );

		logger.info("Logging error to disk: " + fullPath + " | With message: "+errMsg);

		// Create the logs folder if needed and Always overwrite the file.
		if (!fileExists(origDir + "/logs")) {
			makedir(origDir + "/logs");
		}
		overwrite(errMsg, fullPath);
	},

	// Function to Move a File to the Failed Folder
	// @param [string] - (file) - Name of File Relative to Upload Directory
	failAndMove : function (file, uploadDir, err){
		var srcFile = uploadDir + "/" + file;
		var dstPath = uploadDir + failedDir + gmoNBCFunc.makeIsoFormattedDate(0) + "/";
		if (fileExists(srcFile)) {
			if (!fileExists(dstPath)) makedir(dstPath);
			gmoNBCFunc.printObnoxiously("Moving ["+srcFile+"] to ["+dstPath+"]","File Move to Failed Directory","File Move to Failed Directory");
			move(srcFile,dstPath);
		} else {
			gmoNBCFunc.printObnoxiously("Cannot Move File to Failed Directory. Src ["+srcFile+"] does not exist. Manual Intervention Required","File Move to Failed Directory");
		}
		gmoNBCFunc.logErrorToDisk(err, uploadDir, file, "");
	},

	// Function to Move a File to the Complete Folder
	// @param [string] - (file) - Name of File Relative to Upload Directory
	completeAndMove : function (file, uploadDir){
		var srcFile = uploadDir + "/" + file;
		var dstPath = uploadDir + completedDir + gmoNBCFunc.makeIsoFormattedDate(0) + "/";
		if (fileExists(srcFile)) {
			if (!fileExists(dstPath)) makedir(dstPath);
			gmoNBCFunc.printObnoxiously("Moving ["+srcFile+"] to ["+dstPath+"]","File Move to Complete Directory","File Move to Complete Directory");
			move(srcFile,dstPath);
		} else {
			gmoNBCFunc.printObnoxiously("Cannot Move File to Complete Directory. Src ["+srcFile+"] does not exist. Manual Intervention Required","File Move to Complete Directory");
		}
	},

	// Function to print a string in an obvious manner
	// @param [string] (str) - Error to log to screen
	// **Optional** @param[heading] - Heading to display for message. Will default to "Error" if argument is not present
	printObnoxiously : function (str,heading){
		var heading = heading === undefined ? "Error" : heading;
		print("")
		print("####################################### "+heading+" #######################################");
		print("");
		print(str);
	},

	importWithOutcome : function(importChain, importFile){
		var cmd =
		<PharosCs>
			<CommandList>
				<Command subsystem="dataimport" method="doImportWithOutcome">
					<ParameterList>
						<Parameter name="importChain" value={importChain}/>
						<Parameter name="importFile" value={importFile}/>
					</ParameterList>
				</Command>
			</CommandList>
		</PharosCs>;

		var result = wscall(cmd)..Output.DataImportCommandOutcome;

		// The Job Status could be 'Finished' but still fail if it fails validation. Thus we need to also confirm the job result.
		var jobStatus = result.JobStatus.JobStatusType.toString();
		var jobResult = result.JobResult.toString();

		if (jobStatus == "Finished" && jobResult == "success"){
			output("Import job completed succesfully.");
			return true;
		} else if (jobStatus == "Failed" || jobResult == "failed"){
			var resultMessage = result.ResultMessage.toString();
			output("ERROR: Import job failed with error [" + resultMessage + "]");
			return false;
		} else {
			output("Import is still happening, assuming something has gone wrong as it shouldn't take longer then 60 seconds.");
			return false;
		}
	},
   getComponentAudioMedia : function(matId,materialXml){
		if(!gmoNBCFunc.isVarUsable(materialXml)){
			materialXml = materialGet(matId,"tracks")..Material;
	  }
		var audioStoreMedia = materialXml.Track.(this.contains(NBCGMO.storeAudioMedias,MediaName.toString())==true && parseInt(DeleteMark) === 0 && Encoded.toString() === "true").MediaName.toString();
		print("Store Audio Media ["+audioStoreMedia+"]");
		if(this.isVarUsable(audioStoreMedia)) return audioStoreMedia;
		var t2AudioMedia = materialXml.Track.(this.contains(NBCGMO.t2AudioMedias,MediaName.toString())==true && parseInt(DeleteMark) === 0 && Encoded.toString() === "true").MediaName.toString();
		print("T2 Audio Media ["+t2AudioMedia+"]");
		if(this.isVarUsable(t2AudioMedia)) return t2AudioMedia;
		var storeMedia = materialXml.Track.(this.contains(NBCGMO.storeMedias,MediaName.toString())==true && parseInt(DeleteMark) === 0 && Encoded.toString() === "true").MediaName.toString();
		if(this.isVarUsable(storeMedia)){
			audioStoreMedia = storeMedia.substr(0,storeMedia.lastIndexOf("_")) + "_WAV";
			print("Store Audio Media based from store media ["+audioStoreMedia+"]");
			return audioStoreMedia;
		}
		throw new Error("Could not retrieve Audio Component Media for material [" +matId + "]");
	},

	fireStatusNotification : function (domainId,domainType) {
		print("Firing Status Update Notification Job ");
		print(domainType + " Id is ["+domainId+"]");

		if("MATERIAL" == domainType.toUpperCase()){
			var jobFactoryName = "translatorMaterialUpdateJobFactory";
			var domainKeyType = "matId";
			var initiatedBy = "tlMaterialUpdateRunner";
		} else {
			var jobFactoryName = "translatorPlacingUpdateJobFactory";
			var domainKeyType = "placingId";
			var initiatedBy = "tlPlacingUpdateRunner";
		}  

		try {
			wscall(<PharosCs>
				<CommandList>
				  <Command subsystem="job" method="executeJob">
					<ParameterList>
					  <Parameter name="jobFactoryName" value={jobFactoryName}/>
					  <Parameter name="jobDescription">
					   <Value>
							<JobDescription>
								<Properties>
								  <Mapping>
									<domainType type="String">{domainType}</domainType>
									<initiatedBy type="String">{initiatedBy}</initiatedBy>
									<domainKeyType type="String">{domainKeyType}</domainKeyType>
									<domainKey type="String">{domainId}</domainKey>
								  </Mapping>
							    </Properties>
						    </JobDescription>
						</Value>
					  </Parameter>
				    </ParameterList>
				  </Command>
			   </CommandList>
		    </PharosCs>);
		} catch (e){ 
			print("\nError Firing Status Update Notification Job For ["+domainId+"] "+e);
		}
	}

}

// Global Vars
var buildJSLibDir = "/opt/evertz/mediator/lib/js/";
var localFileDir  = "/opt/evertz/mediator/etc/runners/";
var localUtilsDir = "/opt/evertz/mediator/etc/utils/";

// Extra Libraries to Load if needed
if (typeof(wscall)==="undefined") {
	var shellfunFile = buildJSLibDir + "shellfun.js";
	load(shellfunFile);
    if (typeof(wscall)==="undefined") {
    	throw new Error("Failed to load [" + shellfunFile + "]");
    } else {
    	print("Loaded [" + shellfunFile + "]");
    }
}

if (typeof(lookup) === "undefined") {
	var lookupFile = localFileDir + "lookup.js";
	load(lookupFile);
	if (typeof(lookup)==="undefined") {
		throw new Error("Failed to load [" + lookupFile + "]");
	} else {
		print("Loaded [" + lookupFile + "] from GMOFUN");
	}
}

if (typeof(NBCGMO)==="undefined") {
	var gmoSettingsFile = localFileDir + "nbcgmo_settings.js";
	if (fileExists(gmoSettingsFile)) {
		load(gmoSettingsFile);
    } else {
    	throw new Error("Cannot find Settings File [" + gmoSettingsFile + "]");
    }
    if (typeof(NBCGMO)==="undefined") {
    	throw new Error("Failed to load [" + gmoSettingsFile + "]");
    } else {
    	print("Loaded [" + gmoSettingsFile + "] from GMOFUN");
    }
}

// Load Material Utils
load(localUtilsDir + "transitions.js");
for(var prop in TRANSITIONS_UTILS_LOADER) gmoNBCFunc[prop]=TRANSITIONS_UTILS_LOADER[prop];

// Load File Utils
load(localUtilsDir + "file.js");
for(var prop in FILE_UTILS_LOADER) gmoNBCFunc[prop]=FILE_UTILS_LOADER[prop];

// Load Validation Utils
load(localUtilsDir + "validations.js");
for(var prop in VALIDATIONS_UTILS_LOADER) gmoNBCFunc[prop]=VALIDATIONS_UTILS_LOADER[prop];

// Load Media Utils
load(localUtilsDir + "media.js");
for(var prop in MEDIA_UTILS_LOADER) gmoNBCFunc[prop]=MEDIA_UTILS_LOADER[prop];

print("Object [ gmoNBCFunc ] now available for use");
