//Script written by Nathaniel (Projects). Example documents are pasted at the bottom of the script. Including example Venice Playlist, job desc, and material XML.
//This scrip is written to only support external audio. There is no case for embedded audio.
// modified 4/10/18 Chris Filippone
// 
if(typeof(gmoNBCFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")
//
var debug = false;

output("Running run_exportVeniceQCXml.js");

try {

	//Set main variables for the script
	var jobDesc = getJobParameter("jobDescription");
	var matId = jobDesc..matId.toString();

	//Get Material information in order to determine src file location
	var matHelper = new gmoNBCFunc.materialHelper(matId);
	var materialXml = matHelper.getMaterialXml();
	if (materialXml..Command.@success.toString() === "true") {
		var frameRate = matHelper.getMaterialFrameRate();
		var materialType = matHelper.getMaterialType();
		var materialVersionType = matHelper.getVersionType();
		
		//Main output path for where the Venice Playlist file will be written. This will be a mount path. Ensure it is mounted correctly on the Gateway blade
		var veniceFileOutputLocation = lookup.venice["VENICE_OUTPUT_FILE"].fileLocation;

		var mainMedia = matHelper.findMainStoreMedia(NBCGMO.storeMedias);
		var t2Media = matHelper.findMainStoreMedia(NBCGMO.t2Medias);
		var archiveMedia = matHelper.findMainStoreMedia(NBCGMO.archiveMedias);
		var browseMedia = matHelper.findMainStoreMedia(NBCGMO.dcBrowseMedias);
		var workingMedia = matHelper.findMainStoreMedia(NBCGMO_CONSTANTS.MEDIAS.WORKING.DC_OM_WORKING);
		var prefix = matId.substr(0,3) ;
		var stageMedia = undefined;
		var stageMediaPath = undefined;
		var workingMediaPath = undefined;
		var xmlMedias = [];

		var trackList = matHelper.getTrackList();
		//
		for each(var track in trackList) {
			var trackMediaName = track.Media.Name.toString();
			if (trackMediaName.indexOf("STAGING") !== -1) {
				stageMedia = trackMediaName;
				break;
			}
		}

		output("Main Media"+mainMedia);
		output("T2 Media"+t2Media);
		output("archive Media"+archiveMedia);
		output("Working Dir "+ workingMedia);
		output("Working Dir Path "+ workingMediaPath);
		output("Staging Dir "+ stageMedia);
		output("Staging Dir Path "+ stageMediaPath);
		output("Prefix "+ prefix );
		
	 	if(prefix =="UTS"){
			if (gmoNBCFunc.isVarUsable(stageMedia)  ){
				xmlMedias.push(stageMedia);
				output("Working media found "+stageMedia )
			} else if (gmoNBCFunc.isVarUsable(workingMedia) ){
				xmlMedias.push(workingMedia);
				output("Working media found "+workingMedia )
			}
		} else {
			// GMO prob
			if(!gmoNBCFunc.isVarUsable(mainMedia)){
				if(gmoNBCFunc.isVarUsable(archiveMedia) && !gmoNBCFunc.isVarUsable(t2Media)){
					var restoreMedia = archiveMedia.replace("DIVA_","");
					output("Restoring DVS Media  [" + restoreMedia + "]");
					makeTransferRequest(matId, restoreMedia, 60);
				}
				
				if(gmoNBCFunc.isVarUsable(browseMedia)){
					xmlMedias.push(browseMedia);
					output("Using Browse track for playlist because storage track could not be found.");
				} else if (gmoNBCFunc.isVarUsable(workingMedia) ){
					xmlMedias.push(workingMedia);
					output("Working media found "+workingMedia )
				} else if (gmoNBCFunc.isVarUsable(stageMedia)  ){
					xmlMedias.push(stageMedia);
					output("Working media found "+stageMedia )
				} else{
					throw new Error("Could not find valid storage or browse track for playlist.");
				}
				
			} else {
				xmlMedias.push(mainMedia);
				if(!gmoNBCFunc.isVarUsable(browseMedia)){
					var restoreMedia = "DC_Browse_" + frameRate;
					output("Restoring Browse Media  [" + restoreMedia + "]");
					makeTransferRequest(matId, restoreMedia, 60);
				}else{
					xmlMedias.push(browseMedia);
				}
			}
		}
		for each (var xmlMedia in xmlMedias){
			output("Generating vpslt file for media [" + xmlMedia + "]");
			var extension = materialXml..Track.(MediaName.toString() == xmlMedia).FileExtension.toString();
			var veniceMainContentPath = lookup.media[xmlMedia].mount + matId + ".dir/" + matId + "." + extension;
			// for UTS
			var WAVmedia = materialXml..Material.Track.(FileExtension == "wav").Media.Name.toString();
			//
			if (prefix =="UTS") {
				output("UTS material - mov file pointed to "+ WAVmedia + "  instead of "+ xmlMedia);
				xmlMedia = WAVmedia;
				var postfix = "";
				print(xmlMedia)
				if (extension == "mov"){
					postfix = "Video/"
				}
				else{
					postfix = "Audio/"
				}
				if (lookup.media[xmlMedia].usesMatIdDir || gmoNBCFunc.isVarUsable(stageMedia)||gmoNBCFunc.isVarUsable(workingMedia) ) {					
					var veniceMainContentPath = lookup.media[xmlMedia].mount + matId + ".dir/" + postfix + matId + "." + extension;
				}else{
					var veniceMainContentPath = lookup.media[xmlMedia].mount+ postfix + matId + "." + extension;
				}
			}
			else			
			{
				if (lookup.media[xmlMedia].usesMatIdDir || gmoNBCFunc.isVarUsable(stageMedia)||gmoNBCFunc.isVarUsable(workingMedia) ) {
					var veniceMainContentPath = lookup.media[xmlMedia].mount + matId + ".dir/" + matId + "." + extension;
				}else{
					var veniceMainContentPath = lookup.media[xmlMedia].mount + matId + "." + extension;
				}
			}
			var vplstExtension = "vplst";
			var outputFile = matId + "_" + frameRate;
			if(xmlMedia.toUpperCase().indexOf("BROWSE") > -1) outputFile = outputFile + "_proxy";			
			var outputFullPath = veniceFileOutputLocation + outputFile + "." + vplstExtension;
			var materialInfoObject = new gmoNBCFunc.usefulFileObj(veniceMainContentPath);
			var fileName = materialInfoObject.filename;
			var dvsFilePath = materialInfoObject.dvs_path;
			var clipName = matId;
			var dvsFullPath = dvsFilePath + fileName;

			//output important info for logs
			output ("------------Material XML-----------------");
			//output ("Material XML: " + materialXml);
			output ("-----------------------------");
			//output ("Printing Job Description:-------------------------------- " + jobDesc);
			output ("Done Printing Job Description --------------------------- ")
			output ("MatId: " + matId);
			output ("Clip Name: " + clipName);
			output ("Material Type: " + materialType);
			output ("Material Version Type: " + materialVersionType);
			output ("Frame Rate: " + frameRate);
			output ("Venice File Output Location: " + veniceFileOutputLocation);
			output ("The output file name: " + outputFile);
			output ("The full path to the output file: " + outputFullPath);
			output ("The full path to the video file: " + dvsFullPath);
			output ("The filename is " + fileName);

			//These are the different parts of the venice playlist. See bottom of file for example playlist.
			var veniceQcXml = <playlist version="3.0.2.3">
								<playlistitems></playlistitems>
								<thumbwidth>160</thumbwidth>
								<index>1</index>
								<speed>1</speed>
								<inpoint>-1</inpoint>
								<outpoint>-1</outpoint>
								<name>{matId}</name>
								<eventcounter/>
							  </playlist>;

			var part_VenicePlaylistXml = <playlistitem selected="false">
											<timecode>
												<enabled>true</enabled>
											</timecode>
										</playlistitem>;

			var part_VeniceglobalXml = <global>
					<clipname/>
					<description/>
					<comment/>
					<speed>1</speed>
					<userstartindex>-1</userstartindex>
					<userstopindex>-1</userstopindex>
					<contenttype>Prg</contenttype>
					<eventnumber>2</eventnumber>
					<reel/>
				</global>;

			var part_VeniceVideoXml = <video>
					<name/>
					<enabled>true</enabled>
					<autoenable>false</autoenable>
					<alphaonly>false</alphaonly>
					<framestart>0</framestart>
					<frame>0</frame>
					<inpoint>-1</inpoint>
					<outpoint>-1</outpoint>
				</video>;

			var part_VeniceAudioXml = <audio>
					<name/>
					<autoenable>false</autoenable>
					<start>0</start>
					<frequency/>
					<bits/>
					<monochannel>false</monochannel>
				</audio>;

			var part_VeniceAudioRoutingXml = <audioroutingconfig outputsize="2" inputsize="2">
					<inputchannels>
						<channel>
							<id>0</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
						<channel>
							<id>1</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
					</inputchannels>
					<outputchannels>
						<channel>
							<id>0</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
						<channel>
							<id>1</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
					</outputchannels>
				</audioroutingconfig>;

			var part_VeniceAudioRoutingSurroundXml = <audioroutingconfig outputsize="6" inputsize="6">
					<inputchannels>
						<channel>
							<id>0</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
						<channel>
							<id>1</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
						<channel>
							<id>2</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
						<channel>
							<id>3</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
						<channel>
							<id>4</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
						<channel>
							<id>5</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
					</inputchannels>
					<outputchannels>
						<channel>
							<id>0</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
						<channel>
							<id>1</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
						<channel>
							<id>2</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
						<channel>
							<id>3</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
						<channel>
							<id>4</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
						<channel>
							<id>5</id>
							<decibel>0</decibel>
							<mute>false</mute>
							<solo>false</solo>
						</channel>
					</outputchannels>
				</audioroutingconfig>;

			output("Audio track Definition info: ");

			var i = 0;
			for each (var trackDefinition in materialXml..Material.Track.(FileExtension.toString() == "wav").TrackDefinition) {
				var fileTag = trackDefinition.TrackType.FileTag.toString();
				var trackTypeName = trackDefinition.TrackType.Name.toString();
				var fileId = trackDefinition.FileId.toString();
				if(fileId=="")
					fileId = matId + "-" + fileTag + ".wav";

				var absolutePath = materialXml..Material.Track.(FileExtension == "wav").Media.AbsolutePath.toString();
				var materialDirectory = matId + ".dir/";
				if (prefix =="UTS"){
					
					materialDirectory = materialDirectory + "Audio/";
				}
				var filePath = absolutePath + materialDirectory + fileId;
				var bitDepth = trackDefinition.BitDepth.toString();
				var sampleRate = trackDefinition.SamplingRate.toString();


				//Check to ensure the trackType is on DVS and not silent audio!
				// Changing this to /srv/dc-dvs is very much a temporary fix it matches the EC system but we should look at refining this in future 
				if (trackTypeName !== "MOS" && trackTypeName !== "Video") {

					var newAudioInfoObject = new gmoNBCFunc.usefulFileObj(filePath);
					var dvsAudioFilePath = newAudioInfoObject.dvs_path;
					var dvsAudioFullPath = dvsAudioFilePath + matId + "-" + fileTag + ".wav";


					output("File Tag: " + fileTag);
					output("Track Type Name: " + trackTypeName);
					output("File Id: " + fileId);
					output ("File Path: " + filePath);
					output("Bit Depth: " + bitDepth);
					output("Sample Rate: " + sampleRate);
					output ("DVS Full Path: " + dvsAudioFullPath);
					output("------------------------------");

					var newGlobalPart = <global>
						<clipname/>
						<description/>
						<comment/>
						<speed>1</speed>
						<userstartindex>-1</userstartindex>
						<userstopindex>-1</userstopindex>
						<contenttype>Prg</contenttype>
						<eventnumber>2</eventnumber>
						<reel/>
					</global>;

					var newVideoPart = <video>
						<name/>
						<enabled>true</enabled>
						<autoenable>false</autoenable>
						<alphaonly>false</alphaonly>
						<framestart>0</framestart>
						<frame>0</frame>
						<inpoint>-1</inpoint>
						<outpoint>-1</outpoint>
					</video>;

					var newAudioPart = <audio>
						<name/>
						<autoenable>false</autoenable>
						<start>0</start>
						<frequency/>
						<bits/>
						<monochannel>false</monochannel>
					</audio>;

					newGlobalPart.clipname = matId;
					newGlobalPart.description = trackTypeName;

					newVideoPart.name =  dvsFullPath;

					newAudioPart.name = dvsAudioFullPath;
					newAudioPart.frequency = sampleRate;
					newAudioPart.bits = bitDepth;

					var newplaylistItem = <playlistitem selected="false">
									<timecode>
										<enabled>true</enabled>
									</timecode>
								</playlistitem>;

					newplaylistItem.global += newGlobalPart;
					newplaylistItem.video += newVideoPart;
					newplaylistItem.audio += newAudioPart;
					newplaylistItem.audioroutingconfig += part_VeniceAudioRoutingXml;
					if (i === 0) {
						veniceQcXml.playlistitems.playlistitem += newplaylistItem;
					} else {
						veniceQcXml.playlistitems.playlistitem += newplaylistItem;
					}
					i++
				}
			};

			//Adding in a playlist item for the original embedded audio March 28th
			var newGlobalPart = <global>
						<clipname/>
						<description/>
						<comment/>
						<speed>1</speed>
						<userstartindex>-1</userstartindex>
						<userstopindex>-1</userstopindex>
						<contenttype>Prg</contenttype>
						<eventnumber>2</eventnumber>
						<reel/>
					</global>;

			var newVideoPart = <video>
				<name/>
				<enabled>true</enabled>
				<autoenable>false</autoenable>
				<alphaonly>false</alphaonly>
				<framestart>0</framestart>
				<frame>0</frame>
				<inpoint>-1</inpoint>
				<outpoint>-1</outpoint>
			</video>;

			var newAudioPart = <audio>
				<name/>
				<autoenable>false</autoenable>
				<start>0</start>
				<frequency/>
				<bits/>
				<monochannel>false</monochannel>
			</audio>;

			newGlobalPart.clipname = matId;
			newGlobalPart.description = "Original Audio";

			newVideoPart.name =  dvsFullPath;
			newAudioPart.name = dvsFullPath;
			newAudioPart.frequency = "48000";
			newAudioPart.bits = "24";

			var newplaylistItem = <playlistitem selected="false">
							<timecode>
								<enabled>true</enabled>
							</timecode>
						</playlistitem>;

			newplaylistItem.global += newGlobalPart;
			newplaylistItem.video += newVideoPart;
			newplaylistItem.audio += newAudioPart;
			newplaylistItem.audioroutingconfig += part_VeniceAudioRoutingSurroundXml;

			veniceQcXml.playlistitems.playlistitem += newplaylistItem;

			//---------------------------------------------------------

			output("Outputting Venice Playlist XML")
			output("------------------------------")
			output(veniceQcXml);
			output("------------------------------")

			/**
			*
			*	Output Venice Playlist
			*
			**/

			output("\nWriting file: " + outputFullPath);
			overwrite(veniceQcXml.toString(), outputFullPath);
			if (fileExists(outputFullPath)){
				output("-----------------------FILE WRITTEN COMPLETE-----------------------");
			} else {
				throw new Error("No VPLST File found [" + outputFullPath + "]. Please check directory.");
			}
		}
		output("-----------------------EXITING SCRIPT-----------------------");
	}
} catch(e){
	print(e.message);
}

//Example Job Description:
/* <Job>
	<Id>2372867</Id>
	<UniqueId>VanillaRunnerJob-2372867-dc0d7f24-11f5-41ff-a131-89ab888d3e60</UniqueId>
	<Factory>
		<JobFactory>
			<Name>exportVeniceQCXml</Name>
		</JobFactory>
	</Factory>
	<Manager>x-gateway-1</Manager>
	<Status>Finished</Status>
	<SubmittedTime>2016-03-10T14:33:19.000</SubmittedTime>
	<CreatedTime>2016-03-10T14:33:22.000</CreatedTime>
	<StartedTime>2016-03-10T14:33:22.000</StartedTime>
	<FinishedTime>2016-03-10T14:33:25.000</FinishedTime>
	<Description>
		<JobDescription>
			<Properties>
				<Mapping>
					<domainType type="String">Material</domainType>
					<initiatedBy type="String">WorkflowAction</initiatedBy>
					<trackTypeLink>
						<TrackTypeLink id="1000361693">
							<StateNameI18nKey>state.omspotcheckrequired</StateNameI18nKey>
							<StateMachineId>1</StateMachineId>
							<StateId>69</StateId>
							<TrackTypeName>Surround Rear Spanish (Spain)</TrackTypeName>
							<TrackType>
								<ClassId>AUDIO</ClassId>
								<Name>Surround Rear Spanish (Spain)</Name>
								<Id>60</Id>
								<DefaultPosition>0</DefaultPosition>
								<FileTag>SRE_ES-ES</FileTag>
								<LanguageId>412</LanguageId>
								<Ordinality>0</Ordinality>
							</TrackType>
							<StateName>OMSpotCheckRequired</StateName>
							<TrackTypeClass>
								<ClassName>Audio</ClassName>
								<Id>2</Id>
							</TrackTypeClass>
							<StateMachine>NBCHub State Machine</StateMachine>
							<TrackTypeId>60</TrackTypeId>
							<UserName>CHudson</UserName>
							<FullTextList/>
							<ShortTextList/>
							<TagList/>
						</TrackTypeLink>
					</trackTypeLink>
					<triggerHost type="String">u-ui-1</triggerHost>
					<matId type="String">TCMH43943</matId>
					<domainKeyType type="String">matId</domainKeyType>
					<material>
						<Material id="1000122702">
							<MatId>TCMH43943</MatId>
							<MaterialTypeNameI18n>material_type.commercial</MaterialTypeNameI18n>
							<TransformationId>0</TransformationId>
							<Title>LA VUELTA DEL MEXICANO</Title>
							<Duration nanos="15015000150" rate="DF30">00:00:15:00</Duration>
							<FrameRate>DF30</FrameRate>
							<MaterialType>Commercial</MaterialType>
							<AspectRatio>16:9</AspectRatio>
							<VersionType>OM</VersionType>
							<KeyframeBaseUrl/>
							<VersionDescription>Original Master</VersionDescription>
							<Transformation>none</Transformation>
							<LastEdited>2016-03-10T13:16:49.000</LastEdited>
							<Owner id="1">
								<Name>NBCHub</Name>
							</Owner>
							<TrackTypeLink id="1000256467">
								<StateNameI18nKey>state.omspotcheck</StateNameI18nKey>
								<StateMachineId>1</StateMachineId>
								<StateId>70</StateId>
								<TrackTypeName>Video</TrackTypeName>
								<TrackType>
									<ClassId>VIDEO</ClassId>
									<Name>Video</Name>
									<Id>1</Id>
									<DefaultPosition>0</DefaultPosition>
									<FileTag>vid</FileTag>
									<LanguageId>0</LanguageId>
									<Ordinality>0</Ordinality>
								</TrackType>
								<StateName>OMSpotCheck</StateName>
								<TrackTypeClass>
									<ClassName>Video</ClassName>
									<Id>1</Id>
								</TrackTypeClass>
								<StateMachine>NBCHub State Machine</StateMachine>
								<TrackTypeId>1</TrackTypeId>
								<UserName>CHudson</UserName>
							</TrackTypeLink>
							<TrackTypeLink id="1000361694">
								<StateNameI18nKey>state.omspotcheck</StateNameI18nKey>
								<StateMachineId>1</StateMachineId>
								<StateId>70</StateId>
								<TrackTypeName>Audio Description Spanish (Spain)</TrackTypeName>
								<TrackType>
									<ClassId>AUDIO</ClassId>
									<Name>Audio Description Spanish (Spain)</Name>
									<Id>11</Id>
									<DefaultPosition>0</DefaultPosition>
									<FileTag>AUD_ES-ES</FileTag>
									<LanguageId>412</LanguageId>
									<Ordinality>0</Ordinality>
								</TrackType>
								<StateName>OMSpotCheck</StateName>
								<TrackTypeClass>
									<ClassName>Audio</ClassName>
									<Id>2</Id>
								</TrackTypeClass>
								<StateMachine>NBCHub State Machine</StateMachine>
								<TrackTypeId>11</TrackTypeId>
								<UserName>CHudson</UserName>
							</TrackTypeLink>
							<TrackTypeLink id="1000361691">
								<StateNameI18nKey>state.omspotcheck</StateNameI18nKey>
								<StateMachineId>1</StateMachineId>
								<StateId>70</StateId>
								<TrackTypeName>Surround Front Spanish (Spain)</TrackTypeName>
								<TrackType>
									<ClassId>AUDIO</ClassId>
									<Name>Surround Front Spanish (Spain)</Name>
									<Id>52</Id>
									<DefaultPosition>0</DefaultPosition>
									<FileTag>SFR_ES-ES</FileTag>
									<LanguageId>412</LanguageId>
									<Ordinality>0</Ordinality>
								</TrackType>
								<StateName>OMSpotCheck</StateName>
								<TrackTypeClass>
									<ClassName>Audio</ClassName>
									<Id>2</Id>
								</TrackTypeClass>
								<StateMachine>NBCHub State Machine</StateMachine>
								<TrackTypeId>52</TrackTypeId>
								<UserName>CHudson</UserName>
							</TrackTypeLink>
							<TrackTypeLink id="1000361692">
								<StateNameI18nKey>state.omspotcheck</StateNameI18nKey>
								<StateMachineId>1</StateMachineId>
								<StateId>70</StateId>
								<TrackTypeName>Surround C/LFE Spanish (Spain)</TrackTypeName>
								<TrackType>
									<ClassId>AUDIO</ClassId>
									<Name>Surround C/LFE Spanish (Spain)</Name>
									<Id>44</Id>
									<DefaultPosition>0</DefaultPosition>
									<FileTag>SCN_ES-ES</FileTag>
									<LanguageId>412</LanguageId>
									<Ordinality>0</Ordinality>
								</TrackType>
								<StateName>OMSpotCheck</StateName>
								<TrackTypeClass>
									<ClassName>Audio</ClassName>
									<Id>2</Id>
								</TrackTypeClass>
								<StateMachine>NBCHub State Machine</StateMachine>
								<TrackTypeId>44</TrackTypeId>
								<UserName>CHudson</UserName>
							</TrackTypeLink>
							<TrackTypeLink id="1000361693">
								<StateNameI18nKey>state.omspotcheck</StateNameI18nKey>
								<StateMachineId>1</StateMachineId>
								<StateId>70</StateId>
								<TrackTypeName>Surround Rear Spanish (Spain)</TrackTypeName>
								<TrackType>
									<ClassId>AUDIO</ClassId>
									<Name>Surround Rear Spanish (Spain)</Name>
									<Id>60</Id>
									<DefaultPosition>0</DefaultPosition>
									<FileTag>SRE_ES-ES</FileTag>
									<LanguageId>412</LanguageId>
									<Ordinality>0</Ordinality>
								</TrackType>
								<StateName>OMSpotCheck</StateName>
								<TrackTypeClass>
									<ClassName>Audio</ClassName>
									<Id>2</Id>
								</TrackTypeClass>
								<StateMachine>NBCHub State Machine</StateMachine>
								<TrackTypeId>60</TrackTypeId>
								<UserName>CHudson</UserName>
							</TrackTypeLink>
							<SegmentList/>
							<Marker id="1000167635">
								<MarkerType>Single|SOM</MarkerType>
								<Absolute nanos="0" rate="DF30">00:00:00;00</Absolute>
								<Timecode nanos="0" rate="DF30">00:00:00:00</Timecode>
								<RefInCode nanos="0" rate="DF30">00:00:00;00</RefInCode>
								<Notes>Single|SOM</Notes>
								<FrameRate>DF30</FrameRate>
							</Marker>
							<Marker id="1000167636">
								<MarkerType>Single|EOM</MarkerType>
								<Absolute nanos="14981633483" rate="DF30">00:00:14;29</Absolute>
								<Timecode nanos="0" rate="DF30">00:00:00:00</Timecode>
								<RefInCode nanos="14981633483" rate="DF30">00:00:14;29</RefInCode>
								<Notes>Single|EOM</Notes>
								<FrameRate>DF30</FrameRate>
							</Marker>
							<MetaDataGroup/>
						</Material>
					</material>
					<domainKey type="String">TCMH43943</domainKey>
					<materialId type="Integer">1000122702</materialId>
				</Mapping>
			</Properties>
		</JobDescription>
	</Description>
	<DescriptionExtract>
		<Properties>
			<LinkedHashMap>
				<Entry>
					<Key>Trigger host</Key>
					<Value>u-ui-1</Value>
				</Entry>
			</LinkedHashMap>
		</Properties>
	</DescriptionExtract>
	<StatusMap>
		<Mapping>
			<ScriptRunner type="String">exportVeniceQCXmlRunner</ScriptRunner>
			<ScriptExitCode type="Integer">0</ScriptExitCode>
			<ExitCode type="Integer">0</ExitCode>
			<JOB__RESULT type="String">success</JOB__RESULT>
		</Mapping>
	</StatusMap>
	<PriorityMatId>1000122702</PriorityMatId>
	<DomainKeyType>matId</DomainKeyType>
	<DomainKey>TCMH43943</DomainKey>
	<XFactor>5.0</XFactor>
</Job> */
//Example Venice Playlist:
/* <playlist version="3.0.2.3">
	<playlistitems>
		<playlistitem selected="false">
			<global>
				<clipname>NBCU_0000044416AC_01</clipname>
				<description>STEREO ENGLISH (US)</description>
				<comment/>
				<speed>1</speed>
				<userstartindex>-1</userstartindex>
				<userstopindex>-1</userstopindex>
				<contenttype>Prg</contenttype>
				<eventnumber>2</eventnumber>
			</global>
			<video>
				<name>/media/DVS-RT0/evertz/DF30/LF/HD/NBCU_0000044416AC_01.dir/NBCU_0000044416AC_01.mxf</name>
				<enabled>true</enabled>
				<autoenable>false</autoenable>
				<alphaonly>false</alphaonly>
				<framestart>0</framestart>
				<frame>0</frame>
				<inpoint>-1</inpoint>
				<outpoint>-1</outpoint>
			</video>
			<audio>
				<name>/media/DVS-RT0/evertz/DF30/LF/HD/NBCU_0000044416AC_01.dir/NBCU_0000044416AC_01.mxf</name>
				<autoenable>false</autoenable>
				<start>0</start>
				<frequency>48000</frequency>
				<bits>24</bits>
				<monochannel>false</monochannel>
			</audio>
			<audioroutingconfig inputsize="4" outputsize="4">
				<outputchannels>
					<channel>
						<id>0</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
					<channel>
						<id>1</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
					<channel>
						<id>2</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
					<channel>
						<id>3</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
				</outputchannels>
				<inputchannels>
					<channel>
						<id>0</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
					<channel>
						<id>1</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
					<channel>
						<id>2</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
					<channel>
						<id>3</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
				</inputchannels>
			</audioroutingconfig>
			<timecode>
				<enabled>true</enabled>
			</timecode>
		</playlistitem>
		<playlistitem selected="false">
			<global>
				<clipname>NBCU_0000044416AC_01</clipname>
				<description>STEREO PORTUGUESE (BR)</description>
				<comment/>
				<speed>1</speed>
				<userstartindex>-1</userstartindex>
				<userstopindex>-1</userstopindex>
				<contenttype>Prg</contenttype>
				<eventnumber>2</eventnumber>
				<reel/>
			</global>
			<video>
				<enabled>true</enabled>
				<autoenable>false</autoenable>
				<alphaonly>false</alphaonly>
				<name>/media/DVS-RT0/evertz/DF30/LF/HD/NBCU_0000044416AC_01.dir/NBCU_0000044416AC_01.mxf</name>
				<framestart>0</framestart>
				<frame>0</frame>
				<inpoint>-1</inpoint>
				<outpoint>-1</outpoint>
			</video>
			<audio>
				<name>/media/DVS-RT0/evertz/DF30/LF/HD/NBCU_0000044416AC_01.dir/NBCU_0000044416AC_01_STE_PT-BR.wav</name>
				<autoenable>false</autoenable>
				<start>0</start>
				<frequency>48000</frequency>
				<bits>24</bits>
				<monochannel>false</monochannel>
			</audio>
			<audioroutingconfig inputsize="2" outputsize="2">
				<inputchannels>
					<channel>
						<id>0</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
					<channel>
						<id>1</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
				</inputchannels>
				<outputchannels>
					<channel>
						<id>0</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
					<channel>
						<id>1</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
				</outputchannels>
			</audioroutingconfig>
			<timecode>
				<enabled>true</enabled>
			</timecode>
			<descriptivemetadata/>
		</playlistitem>
		<playlistitem selected="false">
			<global>
				<clipname>NBCU_0000044416AC_01</clipname>
				<description>STEREO SPANISH (AR)</description>
				<comment/>
				<speed>1</speed>
				<userstartindex>-1</userstartindex>
				<userstopindex>-1</userstopindex>
				<contenttype>Prg</contenttype>
				<eventnumber>2</eventnumber>
				<reel/>
			</global>
			<video>
				<enabled>true</enabled>
				<autoenable>false</autoenable>
				<alphaonly>false</alphaonly>
				<name>/media/DVS-RT0/evertz/DF30/LF/HD/NBCU_0000044416AC_01.dir/NBCU_0000044416AC_01.mxf</name>
				<framestart>0</framestart>
				<frame>0</frame>
				<inpoint>-1</inpoint>
				<outpoint>-1</outpoint>
			</video>
			<audio>
				<name>/media/DVS-RT0/evertz/DF30/LF/HD/NBCU_0000044416AC_01.dir/NBCU_0000044416AC_01_STE_ES-AR.wav</name>
				<autoenable>false</autoenable>
				<start>0</start>
				<frequency>48000</frequency>
				<bits>24</bits>
				<monochannel>false</monochannel>
			</audio>
			<audioroutingconfig inputsize="2" outputsize="2">
				<inputchannels>
					<channel>
						<id>0</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
					<channel>
						<id>1</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
				</inputchannels>
				<outputchannels>
					<channel>
						<id>0</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
					<channel>
						<id>1</id>
						<decibel>0</decibel>
						<mute>false</mute>
						<solo>false</solo>
					</channel>
				</outputchannels>
			</audioroutingconfig>
			<timecode>
				<enabled>true</enabled>
			</timecode>
			<descriptivemetadata/>
		</playlistitem>
	</playlistitems>
	<thumbwidth>160</thumbwidth>
	<index>1</index>
	<speed>1</speed>
	<inpoint>-1</inpoint>
	<outpoint>-1</outpoint>
	<name>NBCU_0000044416AC_01</name>
	<eventcounter/>
</playlist> */
//Example Material XML
/* <PharosCs>
  <CommandList sessionKey="f82a7e98-3d58-488f-9b92-8ce59d2ff064">
    <Command generalType="Material" method="get" subsystem="material" success="true" type="response">
      <Output>
        <Material id="1000000391">
          <MatId>GMO_00000000001199_01</MatId>
          <MaterialTypeNameI18n>material_type.programme</MaterialTypeNameI18n>
          <TransformationId>0</TransformationId>
          <Title>A MILLION WAYS TO DIE IN THE WEST</Title>
          <Duration nanos="7644636938904" rate="P23_976">02:07:24:15</Duration>
          <FrameRate>P23_976</FrameRate>
          <MaterialType>Programme</MaterialType>
          <AspectRatio>2.35</AspectRatio>
          <VersionType>OM-TATEND</VersionType>
          <VersionDescription>OM Textless at End</VersionDescription>
          <LastEdited>2016-03-10T16:02:29.000</LastEdited>
          <Track id="1000000646">
            <FileId>GMO_00000000001199_01</FileId>
            <Incode nanos="3453449972400" rate="P23_976">00:57:30:00</Incode>
            <Outcode nanos="11098045202971" rate="P23_976">03:04:46:23</Outcode>
            <DeleteMark>0</DeleteMark>
            <FrameRate>P23_976</FrameRate>
            <Encoded>true</Encoded>
            <MediaName>Browse</MediaName>
            <Media id="3">
              <Name>Browse</Name>
              <MediaType>Generic</MediaType>
              <MediaClassName>Data disk</MediaClassName>
              <FrameRate>DF30</FrameRate>
              <MachineNumber>0</MachineNumber>
              <AbsolutePath>/srv/browse/</AbsolutePath>
              <RelativePath>/srv/browse/</RelativePath>
              <PlayWhileRecord>false</PlayWhileRecord>
              <FilenameFactoryName/>
              <Materials/>
              <DirectoryNameFactoryName>FlatListDirectoryNameFactory</DirectoryNameFactoryName>
              <MetaDataGroup/>
            </Media>
            <FileExtension>mov</FileExtension>
            <PartIndex>0</PartIndex>
            <PartCount>0</PartCount>
            <IngestDate>2016-03-09T23:11:41.000</IngestDate>
            <FileBytes>0</FileBytes>
            <TrackDefinition id="1000001248">
              <BitRate>168745939</BitRate>
              <Height>1080</Height>
              <ScanType>Progressive</ScanType>
              <Width>1920</Width>
              <Format>ProRes</Format>
              <ChromaSubsampling>4:2:2</ChromaSubsampling>
              <TrackTypeName>Video</TrackTypeName>
              <TrackType>
                <ClassId>VIDEO</ClassId>
                <Name>Video</Name>
                <Id>1</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>vid</FileTag>
                <LanguageId>0</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>1</TrackTypeId>
              <Position>1</Position>
              <FilePosition>0</FilePosition>
              <Channels>1</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001249">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Front: L + Front: R</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Surround Front English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Surround Front English (US)</Name>
                <Id>207</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>SFR_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>207</TrackTypeId>
              <Position>2</Position>
              <FilePosition>1</FilePosition>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001250">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Front: C + LFE</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Surround C/LFE English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Surround C/LFE English (US)</Name>
                <Id>206</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>SCN_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>206</TrackTypeId>
              <Position>3</Position>
              <FilePosition>3</FilePosition>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001251">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Back: L + Back: R</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Surround Rear English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Surround Rear English (US)</Name>
                <Id>208</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>SRE_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>208</TrackTypeId>
              <Position>4</Position>
              <FilePosition>5</FilePosition>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001252">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Front: L (Matrix) + Front: R (Matrix)</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Stereo English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Stereo English (US)</Name>
                <Id>195</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>STE_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>195</TrackTypeId>
              <Position>5</Position>
              <FilePosition>7</FilePosition>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001253">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Front: L (Matrix) + Front: R (Matrix)</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Stereo M&amp;E</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Stereo M&amp;E</Name>
                <Id>399</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>STE_MNE</FileTag>
                <LanguageId>632</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>399</TrackTypeId>
              <Position>6</Position>
              <FilePosition>9</FilePosition>
              <Channels>2</Channels>
            </TrackDefinition>
          </Track>
          <Track id="1000000645">
            <FileId>GMO_00000000001199_01</FileId>
            <Incode nanos="3453449972400" rate="P23_976">00:57:30:00</Incode>
            <Outcode nanos="11098045202971" rate="P23_976">03:04:46:23</Outcode>
            <DeleteMark>0</DeleteMark>
            <FrameRate>P23_976</FrameRate>
            <Encoded>true</Encoded>
            <MediaName>2398_LF_HD_PRORES</MediaName>
            <Media id="8">
              <Name>2398_LF_HD_PRORES</Name>
              <MediaType>Generic</MediaType>
              <MediaClassName>Data disk</MediaClassName>
              <FrameRate>DF30</FrameRate>
              <MachineNumber>0</MachineNumber>
              <AbsolutePath>/srv/storage/P23_98/LF/HD/PRORES/</AbsolutePath>
              <RelativePath>/srv/storage/P23_98/LF/HD/PRORES/</RelativePath>
              <PlayWhileRecord>false</PlayWhileRecord>
              <FilenameFactoryName/>
              <Materials/>
              <DirectoryNameFactoryName>MaterialDirectoryNameFactory</DirectoryNameFactoryName>
              <MetaDataGroup/>
            </Media>
            <FileExtension>mov</FileExtension>
            <IngestDate>2016-03-09T23:11:33.000</IngestDate>
            <FileBytes>172264608549</FileBytes>
            <TrackDefinition id="1000001220">
              <BitRate>168745939</BitRate>
              <Height>1080</Height>
              <ScanType>Progressive</ScanType>
              <Width>1920</Width>
              <Format>ProRes</Format>
              <ChromaSubsampling>4:2:2</ChromaSubsampling>
              <TrackTypeName>Video</TrackTypeName>
              <TrackType>
                <ClassId>VIDEO</ClassId>
                <Name>Video</Name>
                <Id>1</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>vid</FileTag>
                <LanguageId>0</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>1</TrackTypeId>
              <Position>1</Position>
              <FilePosition>0</FilePosition>
              <FileId>GMO_00000000001199_01.mov</FileId>
              <Channels>1</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001221">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Front: L + Front: R</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Surround Front English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Surround Front English (US)</Name>
                <Id>207</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>SFR_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>207</TrackTypeId>
              <Position>2</Position>
              <FilePosition>1</FilePosition>
              <FileId>GMO_00000000001199_01.mov</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001222">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Front: C + LFE</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Surround C/LFE English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Surround C/LFE English (US)</Name>
                <Id>206</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>SCN_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>206</TrackTypeId>
              <Position>3</Position>
              <FilePosition>3</FilePosition>
              <FileId>GMO_00000000001199_01.mov</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001223">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Back: L + Back: R</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Surround Rear English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Surround Rear English (US)</Name>
                <Id>208</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>SRE_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>208</TrackTypeId>
              <Position>4</Position>
              <FilePosition>5</FilePosition>
              <FileId>GMO_00000000001199_01.mov</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001224">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Front: L (Matrix) + Front: R (Matrix)</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Stereo English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Stereo English (US)</Name>
                <Id>195</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>STE_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>195</TrackTypeId>
              <Position>5</Position>
              <FilePosition>7</FilePosition>
              <FileId>GMO_00000000001199_01.mov</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001225">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Front: L (Matrix) + Front: R (Matrix)</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Stereo M&amp;E</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Stereo M&amp;E</Name>
                <Id>399</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>STE_MNE</FileTag>
                <LanguageId>632</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>399</TrackTypeId>
              <Position>6</Position>
              <FilePosition>9</FilePosition>
              <FileId>GMO_00000000001199_01.mov</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
          </Track>
          <Track id="1000000644">
            <FileId>GMO_00000000001199_01</FileId>
            <Incode nanos="3453449972400" rate="P23_976">00:57:30:00</Incode>
            <Outcode nanos="11098045202971" rate="P23_976">03:04:46:23</Outcode>
            <DeleteMark>0</DeleteMark>
            <FrameRate>P23_976</FrameRate>
            <Encoded>true</Encoded>
            <MediaName>2398_LF_HD_WAV</MediaName>
            <Media id="10">
              <Name>2398_LF_HD_WAV</Name>
              <MediaType>Generic</MediaType>
              <MediaClassName>Data disk</MediaClassName>
              <FrameRate>DF30</FrameRate>
              <MachineNumber>0</MachineNumber>
              <AbsolutePath>/srv/storage/P23_98/LF/HD/WAV/</AbsolutePath>
              <RelativePath>/srv/storage/P23_98/LF/HD/WAV/</RelativePath>
              <PlayWhileRecord>false</PlayWhileRecord>
              <FilenameFactoryName/>
              <Materials/>
              <DirectoryNameFactoryName>MaterialDirectoryNameFactory</DirectoryNameFactoryName>
              <MetaDataGroup/>
            </Media>
            <FileExtension>wav</FileExtension>
            <IngestDate>2016-03-09T23:11:33.000</IngestDate>
            <FileBytes>11008277500</FileBytes>
            <TrackDefinition id="1000001237">
              <BitRate>2304000</BitRate>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Surround Front English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Surround Front English (US)</Name>
                <Id>207</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>SFR_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>207</TrackTypeId>
              <Position>1</Position>
              <FilePosition>1</FilePosition>
              <FileId>GMO_00000000001199_01-SFR_EN-US.wav</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001238">
              <BitRate>2304000</BitRate>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Surround C/LFE English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Surround C/LFE English (US)</Name>
                <Id>206</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>SCN_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>206</TrackTypeId>
              <Position>2</Position>
              <FilePosition>1</FilePosition>
              <FileId>GMO_00000000001199_01-SCN_EN-US.wav</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001239">
              <BitRate>2304000</BitRate>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Surround Rear English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Surround Rear English (US)</Name>
                <Id>208</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>SRE_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>208</TrackTypeId>
              <Position>3</Position>
              <FilePosition>1</FilePosition>
              <FileId>GMO_00000000001199_01-SRE_EN-US.wav</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001240">
              <BitRate>2304000</BitRate>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Stereo English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Stereo English (US)</Name>
                <Id>195</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>STE_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>195</TrackTypeId>
              <Position>4</Position>
              <FilePosition>1</FilePosition>
              <FileId>GMO_00000000001199_01-STE_EN-US.wav</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001241">
              <BitRate>2304000</BitRate>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Stereo M&amp;E</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Stereo M&amp;E</Name>
                <Id>399</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>STE_MNE</FileTag>
                <LanguageId>632</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>399</TrackTypeId>
              <Position>5</Position>
              <FilePosition>1</FilePosition>
              <FileId>GMO_00000000001199_01-STE_MNE.wav</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
          </Track>
          <Track id="1000000634">
            <FileId>GMO_00000000001199_01</FileId>
            <Incode nanos="3453449972400" rate="P23_976">00:57:30:00</Incode>
            <Outcode nanos="11098045202971" rate="P23_976">03:04:46:23</Outcode>
            <DeleteMark>0</DeleteMark>
            <FrameRate>P23_976</FrameRate>
            <Encoded>true</Encoded>
            <MediaName>OM_STAGING</MediaName>
            <Media id="20">
              <Name>OM_STAGING</Name>
              <MediaType>Generic</MediaType>
              <MediaClassName>Data disk</MediaClassName>
              <FrameRate>DF30</FrameRate>
              <MachineNumber>0</MachineNumber>
              <AbsolutePath>/srv/delivery/OM_STAGING/</AbsolutePath>
              <RelativePath/>
              <PlayWhileRecord>false</PlayWhileRecord>
              <FilenameFactoryName/>
              <Materials/>
              <DirectoryNameFactoryName>MaterialDirectoryNameFactory</DirectoryNameFactoryName>
              <MetaDataGroup/>
            </Media>
            <FileExtension>mov</FileExtension>
            <IngestDate>2016-03-09T22:02:18.000</IngestDate>
            <FileBytes>172264608549</FileBytes>
            <TrackDefinition id="1000001185">
              <BitRate>168745939</BitRate>
              <Height>1080</Height>
              <ScanType>Progressive</ScanType>
              <Width>1920</Width>
              <Format>ProRes</Format>
              <ChromaSubsampling>4:2:2</ChromaSubsampling>
              <TrackTypeName>Video</TrackTypeName>
              <TrackType>
                <ClassId>VIDEO</ClassId>
                <Name>Video</Name>
                <Id>1</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>vid</FileTag>
                <LanguageId>0</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>1</TrackTypeId>
              <Position>1</Position>
              <FilePosition>0</FilePosition>
              <FileId>GMO_00000000001199_01.mov</FileId>
              <Channels>1</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001186">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Front: L + Front: R</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Surround Front English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Surround Front English (US)</Name>
                <Id>207</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>SFR_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>207</TrackTypeId>
              <Position>2</Position>
              <FilePosition>1</FilePosition>
              <FileId>GMO_00000000001199_01.mov</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001187">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Front: C + LFE</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Surround C/LFE English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Surround C/LFE English (US)</Name>
                <Id>206</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>SCN_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>206</TrackTypeId>
              <Position>3</Position>
              <FilePosition>3</FilePosition>
              <FileId>GMO_00000000001199_01.mov</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001188">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Back: L + Back: R</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Surround Rear English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Surround Rear English (US)</Name>
                <Id>208</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>SRE_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>208</TrackTypeId>
              <Position>4</Position>
              <FilePosition>5</FilePosition>
              <FileId>GMO_00000000001199_01.mov</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001189">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Front: L (Matrix) + Front: R (Matrix)</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Stereo English (US)</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Stereo English (US)</Name>
                <Id>195</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>STE_EN-US</FileTag>
                <LanguageId>487</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>195</TrackTypeId>
              <Position>5</Position>
              <FilePosition>7</FilePosition>
              <FileId>GMO_00000000001199_01.mov</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
            <TrackDefinition id="1000001190">
              <BitRate>1152000</BitRate>
              <ChannelPositions>Front: L (Matrix) + Front: R (Matrix)</ChannelPositions>
              <BitDepth>24</BitDepth>
              <Format>PCM</Format>
              <SamplingRate>48000</SamplingRate>
              <TrackTypeName>Stereo M&amp;E</TrackTypeName>
              <TrackType>
                <ClassId>AUDIO</ClassId>
                <Name>Stereo M&amp;E</Name>
                <Id>399</Id>
                <DefaultPosition>0</DefaultPosition>
                <FileTag>STE_MNE</FileTag>
                <LanguageId>632</LanguageId>
                <Ordinality>0</Ordinality>
              </TrackType>
              <TrackTypeId>399</TrackTypeId>
              <Position>6</Position>
              <FilePosition>9</FilePosition>
              <FileId>GMO_00000000001199_01.mov</FileId>
              <Channels>2</Channels>
            </TrackDefinition>
          </Track>
          <SegmentList/>
          <MetaDataGroup/>
        </Material>
      </Output>
    </Command>
  </CommandList>
</PharosCs> */
