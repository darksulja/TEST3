/*
* @Author: Karthik Rengasamy
* @Date:   2017-04-16 18:45:03
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-04-16 18:58:08
*/


MediatorBridgeHelper = function() {
	
	if ((this instanceof MediatorBridgeHelper) === false) {
		throw new Error("Please call constructor with new() keyword");
	}
	
	if(typeof(gmoNBCFunc)==="undefined"){
		print("Loading nbcgmo_fun")
		load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");		
	}
	if(typeof(MediatorBridgeInterface) === "undefined") {
		print("Loading MediatorBridgeInterface"); 
		load("/opt/evertz/mediator/etc/runners/MediatorBridgeInterface.js"); 
	}

	this.getPayloadForMaterialRegistration = function(matId){
		var material = materialGet(matId,"shorttext")..Material

		var materialForPayload = <Material>
				<MatId>{material.MatId.toString()}</MatId>
				<Title>{material.Title.toString()}</Title>
				<Trim nanos="0" rate={material.FrameRate.toString()}>00:00:00:00</Trim>
				<Duration nanos="0" rate={material.FrameRate.toString()}>00:00:00:00</Duration>
				<FrameRate>{material.FrameRate.toString()}</FrameRate>
				<MaterialType>{material.MaterialType.toString()}</MaterialType>
				<AspectRatio>{material.AspectRatio.toString()}</AspectRatio>
				<VersionType>{material.VersionType.toString()}</VersionType>
				<Transformation>{material.Transformation.toString()}</Transformation>
				<Owner>
					<Name>NBCU GMO</Name>
				</Owner>
				<TrackTypeLink>
					<TrackTypeName>Video</TrackTypeName>
					<TrackType>
						<Name>Video</Name>
					</TrackType>
					<StateName>Order Placed</StateName>
					<StateMachine>NBC GMO</StateMachine>
				</TrackTypeLink>
				<SegmentList></SegmentList>
				<ShortTextList>
					<ShortText>
						<ShortTextType>Original File Name</ShortTextType>
						<Value>{material.ShortTextList.ShortText.(ShortTextType == "Original File Name").Value.toString()}</Value>
					</ShortText>
					<ShortText>
						<ShortTextType>TVD Production #</ShortTextType>
						<Value>{material.ShortTextList.ShortText.(ShortTextType == "TVD Production #").Value.toString()}</Value>
					</ShortText>
				</ShortTextList>
				<MetaDataGroup></MetaDataGroup>
			</Material>
		return materialForPayload;
	}

	this.getLoginCredentials = function(host, username, method){
		var bridgeInterface = new MediatorBridgeInterface(); 
		var method = method || "keepasssearch"; 
		var request = {
				Host		:	host, 
				UserName	:	username
		}
		bridgeInterface.initializeMediatorBridge();
		try {
			var res = bridgeInterface.postMessage(request, method); 
			return {
				username		:	res["Username"], 
				password		:	res["Password"], 
				basicAuth		:	res["Basic Authorization"], 
				title 			:	res["Title"], 
				sshToken		:	res["SSH Token"], 
				lastModified	:	res["LastModificationTime"], 
				creationTime	:	res["CreationTime"], 
				url				:	res["URL"], 
				notes			:	res["Notes"], 
				hostname		:	res["Host Name"], 
				encryptionPass	:	res["EncryptionPassphrase"]
			}
		}
		catch(e) {
			print("Error retrieving login credentials: " + e); 
			return false
		}
	}
}
	