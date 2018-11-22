// Transfer Helper, he helps you transfer things

// How to Use transfer helper -
// 1. make a new transfer helper
// 2. populate transfer properties this can be done using a preset by passing in your settings object or by individually setting each property
// 3. Set which files you would like to send using addFilesToTransfer()
// 4. use buildAndSubmitJob() to create a job description and execue the job using the job factory that is determined from the mapping

if (typeof(MediatorBridgeHelper) === "undefined") {
  print("Loading MediatorBridgeHelper");
  load("/opt/evertz/mediator/etc/runners/MediatorBridgeHelper.js");
}

TransferHelper = function() {
	if ((this instanceof TransferHelper) === false) {
		throw new Error("Please call constructor with new() keyword");
	}

	if(typeof(gmoNBCFunc)==="undefined"){
		print("Loading nbcgmo_fun");
		load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
	}

	if(typeof(JSCommons)==="undefined"){
		print("Loading JSCommons js ")
		load("/opt/evertz/mediator/etc/runners/JSCommons.js");
	}

	this.deliverySettings = {};
	this.fileList = [];
	this.methodJobMap = {
		"Aspera-P2P" : "asperaTransferJobFactory",
		"Faspex" : "asperaFaspexTransferJobFactory",
		"Signiant" : "signiantTransferJobFactory",
		"FTP" : "ftpTransferJobFactory",
		"Generic Transfer" : "genericTransferJobFactory"
	}

	// Work out which propert
	this.methodUsefulObjPropMap = {
		"Aspera-P2P" : "unix_file",
		"Faspex" : "unix_file",
		"Signiant" : "dvs_file",
		"FTP" : "dvs_file",
		"Generic Transfer" : "unix_file"
	}

	/**
	*	Multiple mechanism make use of the below properties, albeit in a different manner
	*	K.I.S.S and have generic methods that the calling script sets with the complexity abstracted away
	**/
	this.setIdentifier = function(identifier) {
		this.identifier = identifier;
	}

	this.getIdentifier = function() {
		return this.identifier;
	}

	this.setTransferTitle = function(transferTitle) {
		this.transferTitle = transferTitle;
	}

	this.getTransferTitle = function() {
		return this.transferTitle;
	}

	this.setDeliveryMethod = function(deliveryMethod){
		this.deliveryMethod = deliveryMethod;
	}

	this.getDeliveryMethod = function(){
		return this.deliveryMethod;
	}

	this.selectJobFactory = function(){
		return this.methodJobMap[this.deliveryMethod];
	}

	//Delivery properties setters.
	//Each time we set something we add it to the delivery settings object so that we can easily loop through and populate the job dscription later

	//FASPEX SETERS
    this.setFaspexTransferHost = function(faspexTransferHost){
    	 this.faspexTransferHost = faspexTransferHost;
    	 this.deliverySettings.FaspexTransferHost = faspexTransferHost;
    }

    this.setFaspexWorkgroup = function(faspexWorkgroup){
    	this.faspexWorkgroup = faspexWorkgroup;
    	this.deliverySettings.FaspexWorkgroup = faspexWorkgroup;
    }

    this.setFaspexSourceShareName = function(faspexSourceShareName){
    	this.faspexSourceShareName = faspexSourceShareName;
    	this.deliverySettings.FaspexSourceShareName = faspexSourceShareName;
    }

    this.setFaspexVantageWorkflow = function(faspexVantageWorkflow){
    	this.faspexVantageWorkflow = faspexVantageWorkflow;
    	this.deliverySettings.FaspexVantageWorkflow = faspexVantageWorkflow;
    }

	this.setFaspexTitle = function(title) {
		if (typeof title == "undefined" || typeof title == "") throw new Error("Faspex Deliveries require TransferHelper.setFaspexTitle() to be set in order to create a Faspex Title");
		this.deliverySettings.FaspexTitle = title;
	}

	this.setFaspexNote = function (note) {
		if (typeof note == "undefined" || note == "") throw new Error("Faspex Deliveries require TransferHelper.ssetFaspexNote() to be set in order to create a Faspex Note");
		this.deliverySettings.FaspexNote = note;
	}

    this.setSigniantManager = function(signiantManager){
    	this.signiantManager = signiantManager;
    	this.deliverySettings.SigniantManager = signiantManager;
    }

    this.setSigniantSourceAgent = function(signiantSourceAgent){
    	this.signiantSourceAgent = signiantSourceAgent;
    	this.deliverySettings.SigniantSourceAgent =signiantSourceAgent;
    }

    this.setSigniantTargetAgent = function(signiantTargetAgent){
    	this.signiantTargetAgent = signiantTargetAgent;
    	this.deliverySettings.SigniantTargetAgent = signiantTargetAgent;
    }

    this.setSigniantTargetRelayAgent = function(signiantTargetRelayAgent){
    	this.signiantTargetRelayAgent = signiantTargetRelayAgent;
    	this.deliverySettings.SigniantTargetRelayAgent = signiantTargetRelayAgent;
    }

    this.setSigniantTargetPath = function(signiantTargetPath){
    	this.signiantTargetPath = signiantTargetPath;
    	this.deliverySettings.SigniantTargetPath = signiantTargetPath;
    }

    this.setSigniantJobTemplateName = function(signiantJobTemplateName){
    	this.signiantJobTemplateName = signiantJobTemplateName;
    	this.deliverySettings.SigniantJobTemplateName = signiantJobTemplateName;
    }

    this.setSigniantJobTemplateLibraryName = function(signiantJobTemplateLibraryName){
    	this.signiantJobTemplateLibraryName = signiantJobTemplateLibraryName;
    	this.deliverySettings.SigniantJobTemplateLibraryName = signiantJobTemplateLibraryName;
    }

    this.setSigniantJobGroup = function(signiantJobGroup){
    	this.signiantJobGroup = signiantJobGroup;
    	this.deliverySettings.SigniantJobGroup = signiantJobGroup;
    }

	this.createSigniantJobName = function() {
		return this.getIdentifier().replace(/[^a-zA-Z0-9]/g, "_") + "_" + gmoNBCFunc.guidGenerator();
	}

	this.setSigniantJobName = function () {
		if (typeof this.getIdentifier() == "undefined") throw new Error("Signiant Deliveries require TransferHelper.setPlacingId() to be set in order to create a Signiant Job Name");
		this.deliverySettings.SigniantJobName = this.createSigniantJobName();
	}

	this.getSigniantJobName = function () {
		return this.deliverySettings.SigniantJobName;
	}

    // ASPERA P2P setters
    this.setAsperaTargetNode = function(asperaTargetNode){
    	this.asperaTargetNode = asperaTargetNode;
    	this.deliverySettings.AsperaTargetNode = asperaTargetNode;
    }

    this.setAsperaSourceNode = function(asperaSourceNode){
    	this.asperaSourceNode = asperaSourceNode;
    	this.deliverySettings.AsperaSourceNode = asperaSourceNode;
    }

    this.setAsperaSourceUser = function(asperaSourceUser){
    	this.asperaSourceUser = asperaSourceUser;
    	this.deliverySettings.AsperaSourceUser = asperaSourceUser;
    }

    this.setAsperaTargetUser = function(asperaTargetUser){
    	this.asperaTargetUser = asperaTargetUser;
    	this.deliverySettings.AsperaTargetUser = asperaTargetUser;
    }

    this.setAsperaTargetPath = function(asperaTargetPath){
    	this.asperaTargetPath = asperaTargetPath;
    	this.deliverySettings.AsperaTargetPath = asperaTargetPath;
    }

    this.setAsperaJobName = function(asperaJobName){
    	this.asperaJobName = asperaJobName;
    	this.deliverySettings.AsperaJobName = asperaJobName;
    }

    this.setAsperaSshPort = function(asperaSshPort){
    	this.asperaSshPort = asperaSshPort;
    	this.deliverySettings.AsperaSshPort = asperaSshPort;
    }

    this.setAsperaUdpPort = function(asperaUdpPort){
    	this.asperaUdpPort = asperaUdpPort;
    	this.deliverySettings.AsperaUdpPort = asperaUdpPort;
    }

    this.setAsperaProxy = function(asperaProxy){
    	this.asperaProxy = asperaProxy;
    	this.deliverySettings.AsperaProxy = asperaProxy;
    }

    this.setAsperaBandwidthMax = function(asperaBandwidthMax){
    	this.asperaBandwidthMax = asperaBandwidthMax;
    	this.deliverySettings.AsperaBandwidthMax = asperaBandwidthMax;
    }

    this.setAsperaBandwidthMin = function(asperaBandwidthMin){
    	this.asperaBandwidthMin = asperaBandwidthMin;
    	this.deliverySettings.AsperaBandwidthMin = asperaBandwidthMin;
    }

    // FTP settings
    this.setFtpHost= function(ftpHost){
    	this.ftpHost = ftpHost;
    	this.deliverySettings.FTPHost = ftpHost;
    }

	this.setFtpPort = function(ftpPort){
		this.ftpPort = ftpPort;
		this.deliverySettings.FTPPort = ftpPort;
	}

	this.setFtpTargetPath = function(ftpTargetPath){
		this.ftpTargetPath = ftpTargetPath;
		this.deliverySettings.FTPTargetPath = ftpTargetPath;
	}

	this.setFtpProxy = function(ftpProxy){
		this.ftpProxy = ftpProxy;
		this.deliverySettings.FTPProxy = ftpProxy;
	}

	this.setFtpProxyPort = function(ftpProxyPort){
		this.ftpProxyPort = ftpProxyPort;
		this.deliverySettings.FTPProxyPort = ftpProxyPort;
	}

	this.setFtpsEnabled = function(ftpsEnabled){
		this.ftpsEnabled = ftpsEnabled;
		this.deliverySettings.FtpsEnabled = ftpsEnabled;
	}

  this.setSftpEnabled = function(sFtpEnabled){
		this.sFtpEnabled = sFtpEnabled;
		this.deliverySettings.sFtpEnabled = sFtpEnabled;
	}

	// GENERIC SETTERS

	this.setGenericRemoteTransferHost = function(genericRemoteTransferHost){
		this.genericRemoteTransferHost = genericRemoteTransferHost;
		this.deliverySettings.RemoteTransferHost = genericRemoteTransferHost;
	}

	this.setGenericRemoteTargetPath = function(genericRemoteTargetPath){
		this.genericRemoteTargetPath = genericRemoteTargetPath;
		this.deliverySettings.RemoteTargetPath = genericRemoteTargetPath;
	}

	this.setGenericTransferOption = function (genericTransferOption){
		this.genericTransferOption = genericTransferOption;
		this.deliverySettings.TransferOption = genericTransferOption;
	}
	
	this.setPackagingFormat = function (packagingFormat){		
		this.packagingFormat = packagingFormat;
		this.deliverySettings.PackagingFormat = packagingFormat;
	}

    // GENERAL SETTERS (APPLY TO ALL METHODS)

    this.setBandwidthCeiling = function(bandwidthCeiling){
    	this.bandwidthCeiling = bandwidthCeiling;
    	this.deliverySettings.BandwidthCeiling = bandwidthCeiling;
    }

    this.setBandwidthFloor = function(bandwidthFloor){
    	this.bandwidthFloor = bandwidthFloor;
    	this.deliverySettings.BandwidthFloor = bandwidthFloor;
    }

    this.setTransferOrder = function(transferOrder){
		if(gmoNBCFunc.isVarUsable(transferOrder)){
			var transferOrderArray = [];
			for (var i=0; i<transferOrder.length(); i++) {
				transferOrderArray.push(transferOrder[i].toString());
			}
			var transferOrderCommaSeparated = transferOrderArray.join(",");
			this.transferOrder = transferOrderCommaSeparated;
			this.deliverySettings.TransferOrder = transferOrderCommaSeparated;
		}else{
			this.transferOrder = "";
			this.deliverySettings.TransferOrder = "";
		}
    }

    this.setDeliveryAcknowledgmnetRequired = function(deliveryAcknowledgmnetRequired){
    	this.deliveryAcknowledgmnetRequired = deliveryAcknowledgmnetRequired;
    	this.deliverySettings.DeliveryAcknowledgmnetRequired = deliveryAcknowledgmnetRequired;
    }

    this.addFilesToTransfer = function(files){

		if (files instanceof gmoNBCFunc.usefulFileObj) {
			this.fileList.push(files);
		} else {
    		this.fileList = this.fileList.concat(files);
    	}
    }

    // use preset to populate this expects that the script running this will already of instantiated placing helper and has a settings object to pass us
   	this.populateDeliverySettingsFromPreset = function(settings) {
   		this.setDeliveryMethod(settings.deliveryMethod);
   		this.setBandwidthFloor(settings.bandwidthFloor);
   		this.setBandwidthCeiling(settings.bandwidthCeiling);
   		this.setTransferOrder(settings.transferOrder);
   		this.setDeliveryAcknowledgmnetRequired(settings.deliveryAcknowledgmnetRequired);
		this.setPackagingFormat(settings.packageFormat);

   		switch (settings.deliveryMethod) {
   			case "Signiant":
   				this.setSigniantTargetPath(settings.signiantTargetPath);
   				this.setSigniantTargetRelayAgent(settings.signiantTargetRelayAgent);
   				this.setSigniantJobGroup(settings.signiantJobGroup);
   				this.setSigniantJobTemplateLibraryName(settings.signiantJobTemplateLibraryName);
   				this.setSigniantJobTemplateName(settings.signiantJobTemplateName);
   				this.setSigniantSourceAgent(settings.signiantSourceAgent);
   				this.setSigniantTargetAgent(settings.signiantTargetAgent);
   				this.setSigniantManager(settings.signiantManager);
				break;
   			case "Aspera-P2P":
   				this.setAsperaProxy(settings.asperaProxy);
   				this.setAsperaSourceNode(settings.asperaSourceNode);
   				this.setAsperaTargetNode(settings.asperaTargetNode);
   				this.setAsperaBandwidthMax(settings.asperaBandwidthMax);
				this.setAsperaBandwidthMin(settings.asperaBandwidthMin);
				this.setAsperaSshPort(settings.asperaSshPort);
   				this.setAsperaUdpPort(settings.asperaUdpPort);
   				this.setAsperaTargetPath(settings.asperaTargetPath);
   				this.setAsperaSourceUser(settings.asperaSourceUser);
   				this.setAsperaTargetUser(settings.asperaTargetUser);
   				break;
   			case "Faspex":
   				this.setFaspexVantageWorkflow(settings.faspexVantageWorkflow);
   				this.setFaspexWorkgroup(settings.faspexWorkgroup);
				this.setFaspexTransferHost(settings.faspexTransferHost);
   				this.setFaspexSourceShareName(settings.faspexSourceShareName);
				break;
   			case "FTP":
   				this.setFtpHost(settings.ftpHost);
				this.setFtpPort(settings.ftpPort);
				this.setFtpTargetPath(settings.ftpTargetPath);
				this.setFtpProxy(settings.ftpProxy);
				this.setFtpProxyPort(settings.ftpProxyPort);
				this.setFtpsEnabled(settings.ftpsEnabled);
				this.setSftpEnabled(settings.sFtpEnabled);
				break;
			case "Generic Transfer":
				this.setGenericRemoteTransferHost(settings.genericRemoteTransferHost);
				this.setGenericRemoteTargetPath(settings.genericRemoteTargetPath);
				this.setGenericTransferOption(settings.genericTransferOption);
				break;
   		}
   	}

   	this.getDeliverySettings = function (){
		return this.deliverySettings;
   	}

   	//loop through the settings object and create the xml for the job description
   	this.buildJobDescriptionProperties = function(){
   		var jobDescriptionProperties = new XML('<Properties><Mapping></Mapping></Properties>');

		// Need to add a generic fields for Source/Target Nodes.
		this.setTransferNodes();
   		var deliverySettings = this.getDeliverySettings();

   		for(var prop in deliverySettings){
   			jobDescriptionProperties.Mapping[prop] = deliverySettings[prop];
   		}

    	jobDescriptionProperties.Mapping.appendChild(<Files>{this.buildTextListXml()}</Files>);
   		return jobDescriptionProperties;
   	}

   	// loop through the array of files to send
    this.buildTextListXml = function(){

		// Ensure the Tranfer is set up with the correct file type unix/windows etc
		var deliveryFileUsefulFileProp = this.methodUsefulObjPropMap[this.getDeliveryMethod()];

		var fileListXml = new XML('<TextList></TextList>');

		for each (var file in this.fileList){

			if (file.exists() == false) throw new Error("\nError File [" + file.unix_path + "] does not exist");

			fileListXml.appendChild(<Text>{file[deliveryFileUsefulFileProp]}</Text>);

    	}
    	return fileListXml;
    }

    // plop the properties in the job description
   	this.buildJobDescription = function(){
   		return <JobDescription>{this.buildJobDescriptionProperties()}</JobDescription>;
   	}

	// Use this to add any other necessary data that isn`t set in the preset
	this.addDeliveryMechanismSpecificData = function() {

		if (typeof this.getDeliveryMethod() == "undefined") throw new Error("Delivery Method is currently undefined");

		switch (this.getDeliveryMethod()) {
   			case "Signiant":
				this.setSigniantJobName();
   				break;
   			case "Aspera-P2P":
			    this.setAsperaJobName(this.getIdentifier());
				break; 
   			case "Faspex":
				this.setFaspexTitle(this.getIdentifier());
				this.setFaspexNote(this.getTransferTitle());
   			case "FTP":
   			case "Generic Transfer":
			break;
   		}

	}

   	// FIRE *kaboom*
   	this.buildAndSubmitJob = function(updateJobStatus, startPercent, endPercent){

		// The Preset Data is already set now the remaining info
		this.addDeliveryMechanismSpecificData();

   		return gmoNBCFunc.createRunAndPollJob(this.selectJobFactory(), this.buildJobDescription(), false, updateJobStatus, startPercent, endPercent);
   	}

	this.setTransferNodes = function(){
		switch (this.getDeliveryMethod()) {
   			case "Signiant":
				this.deliverySettings.SourceNode = this.signiantSourceAgent;
				this.deliverySettings.TargetNode = this.signiantTargetAgent;
   				break;
   			case "Aspera-P2P":
				this.deliverySettings.SourceNode = this.asperaSourceNode;
				this.deliverySettings.TargetNode = this.asperaTargetNode;
   				break;
        case "Faspex":
        this.deliverySettings.SourceNode = this.faspexSourceShareName;
        this.deliverySettings.TargetNode = this.faspexTransferHost;
          break;
   			case "FTP":
				this.deliverySettings.SourceNode = this.ftpProxy;
				this.deliverySettings.TargetNode = this.ftpHost;
   				break;
   			case "Generic Transfer": 		
				this.deliverySettings.SourceNode = this.genericRemoteTransferHost;
				this.deliverySettings.TargetNode = this.genericRemoteTransferHost;
   				break;
   		}
	}
	// Get transfer node by type (source/destination)
	this.getTransferNodeByType = function(nodeType){
		this.setTransferNodes();

		if(nodeType.toLowerCase() == "source"){
			return this.deliverySettings.SourceNode;
		} else if (nodeType.toLowerCase() == "target"){
			return this.deliverySettings.TargetNode;
		}
	}

  this.getAsperaCredentials = function (username,asperanode) {
    var mySettings;

    if (gmoNBCFunc.isVarUsable(username)) {
      mySettings = NBCGMO.nldManagerLogins["Aspera-P2P"][username + "-" + asperanode];
    } else {
      mySettings = NBCGMO.nldManagerLogins["Aspera-P2P"][asperanode];
    }

    if(!gmoNBCFunc.isVarUsable(mySettings)) {
      print("Could not locate aspera credentials in settings. Attempting to retrieve from database.");

	  if (!gmoNBCFunc.isVarUsable(username)) {
		  throw new Error("No back-end credentials configured and KeePass search not valid without a username. Please update username settings for node [" + asperanode + "]");
	  }

      var mediatorBridgeHelper = new MediatorBridgeHelper();
      var bridgeResponse = mediatorBridgeHelper.getLoginCredentials(asperanode,username,"keepasssearch");

      if(!gmoNBCFunc.isVarUsable(bridgeResponse) || (!gmoNBCFunc.isVarUsable(bridgeResponse.password))){
        throw new Error("Could not retrieve credentials for user [" + username + "] on node [" + asperanode + "]. Please contact DME support.");
      }

      mySettings = new Object();
      mySettings.localUser = username;
      mySettings.localPassword = bridgeResponse.password;
      mySettings.remoteUser = JSCommons.encodeXML(username);
      mySettings.remotePassword = JSCommons.encodeXML(bridgeResponse.password);

      //if(gmoNBCFunc.isVarUsable(bridgeResponse.sshKeyPath)) mySettings.remoteSSHkeyPath = bridgeResponse.sshKeyPath;

      return mySettings;
    }else {
      print("Retrieved credentials from settings.");
      return mySettings;
    }
  }

}
