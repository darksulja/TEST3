try { 
	jobDashboard.updateStatusAndProgress("Starting Generic Transfer Module",25);
	
	// Get the information from the Preset/Settings script.
	var remoteTransferHost = settings.genericRemoteTransferHost;
	var targetPath = settings.genericRemoteTargetPath; 
	var transferOption = settings.genericTransferOption;
	var transferOrder = settings.transferOrder;
	var packagingFormat = settings.packageFormat;
	
	jobDashboard.updateStatusAndProgress("Starting GenericTransfer",35);
	
	print(
		"Remote Transfer Host [" + remoteTransferHost + "] \n" +
		"Target Path [" + targetPath + "] \n" +
		"Transfer Option  [" + transferOption + "] \n" +
		"Transfer Order [" + transferOrder + "] \n" +
		"Packaging Format [" + packagingFormat + "] \n"
	);	
	
	var orderOfDelivery = [];
	
	for (var i=0; i<transferOrder.length(); i++) {
		orderOfDelivery.push(transferOrder[i].toString());
	}
	
	var transferFile = function (operation,file,remotehost,targetPath){
		var command = [];
		if(operation == "Move")
			operation = "mv";
		else 
			operation = "cp"
		
		command.push('/usr/bin/ssh');
		command.push('-t');
		command.push('dvssan@' + remotehost);
		command.push('mkdir');
		command.push('-p');
		command.push(targetPath);
		output("[" + command.join(" ") + "]");
		run.apply(this, command);
		print("Target Directory Created ["+targetPath+"]");
		
		command = [];
		
		command.push('/usr/bin/ssh');
		command.push('-t');
		command.push('dvssan@' + remotehost);
		command.push(operation);
		command.push(file.dvs_path + "/" + file.filename);
		command.push(targetPath);
		output("[" + command.join(" ") + "]");
		run.apply(this, command);
		print("File ["+file.filename+"] is transferred to  ["+targetPath+"]");
	}
	
	var reArrangeFilesByDeliveryOrder= function (files,deliveryOrder){
		var filesByDeliveryOrder = []
		if(deliveryOrder.length == 0){
			filesByDeliveryOrder = files;
		} else {
			for each (var order in deliveryOrder){
				for each (var file in files){
					if(file.extension == order ){
						filesByDeliveryOrder.push(file);
					}
				}
			}
		}
		return filesByDeliveryOrder;
	}
	
	var filesByDeliveryOrder = []
	
	if (settings.packageFormat == "itmsp" || settings.packageFormat == "dir"){
		var folderName = sourceFiles[0].filename;
		print("Folder Name ["+folderName+"]");
		var directoryFiles = gmoNBCNLDFunc.createContentDistDeliveryObjects(sourceFiles[0].unix_file);
		filesByDeliveryOrder = reArrangeFilesByDeliveryOrder(directoryFiles,orderOfDelivery);
		targetPath = targetPath + "/" + folderName + "/";
	} else {
		filesByDeliveryOrder = reArrangeFilesByDeliveryOrder(sourceFiles,orderOfDelivery)
		targetPath = targetPath + "/"
	}
	
	//Copy or Move files to destination based on transferOption
	for each (var file in filesByDeliveryOrder){
		transferFile(transferOption,file,remoteTransferHost,targetPath)
	}
		
	jobDashboard.updateStatusAndProgress("Generic Transfer Completed Successfully",95);
	var transferResult = [0, "Generic Transfer Completed Successfully"];
} catch(e) {
	var transferResult = [1, e.message];
	output(e.message);
}
