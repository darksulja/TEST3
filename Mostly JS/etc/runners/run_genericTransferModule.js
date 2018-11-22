load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");

print("Running run_genericTransferModule.js");




    /*
     * Parameters passed in the job description.
     */





    var transferFile = function (operation,file,remotehost,targetPath){
    print("transferFile -Started")
    var command = [];
    if(operation == "Move")
        operation = "mv";
    else
        operation = "cp"
	
    command.push('/usr/bin/ssh');
    command.push('-i');
    command.push('/opt/evertz/mediator/etc/mediator_x_rsa');
    command.push('-oStrictHostKeyChecking=no');
    command.push('-oUserKnownHostsFile=/dev/null');
    command.push('evertz@' + remotehost);
    command.push('mkdir');
    command.push('-p');
    command.push(targetPath);
    output("[" + command.join(" ") + "]");
    run.apply(this, command);
    print("Target Directory Created ["+targetPath+"]");
	
    command = [];

    command.push('/usr/bin/ssh');
    command.push('-i');
    command.push('/opt/evertz/mediator/etc/mediator_x_rsa');
    command.push('-oStrictHostKeyChecking=no');
    command.push('-oUserKnownHostsFile=/dev/null');
    command.push('evertz@' + remotehost);
    command.push(operation);
    command.push(file.dvs_path + "/" + file.filename);
    command.push(targetPath);
    output("[" + command.join(" ") + "]");
    run.apply(this, command);
    print("File ["+file.filename+"] is transferred to  ["+targetPath+"]");
}
	var reArrangeFilesByDeliveryOrder= function (files,deliveryOrder){
		print("reArrangeFilesByDeliveryOrder -Start")
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
		print("filesByDeliveryOrder -["+filesByDeliveryOrder+"]");
		print("reArrangeFilesByDeliveryOrder -End")
		return filesByDeliveryOrder;
	}

try {
    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
    jobDashboard.updateStatusAndProgress("Starting Script", 5);
    print("Job Description: " + jobDescription);
	jobDashboard.updateStatusAndProgress("Starting Generic Transfer Module", 35);
    var remoteTransferHost  = jobDescription.Properties.Mapping.RemoteTransferHost.toString();
    var targetPath          = jobDescription.Properties.Mapping.RemoteTargetPath.toString();
    var transferOption      = jobDescription.Properties.Mapping.TransferOption.toString() || "cp";
    var transferOrder       = jobDescription.Properties.Mapping.TransferOrder.toString();
    var packagingFormat     = jobDescription.Properties.Mapping.PackagingFormat.toString();
    var _sourceFiles        = jobDescription.Properties.Mapping.Files.TextList || [];
    remoteTransferHost = gmoNBCNLDFunc.getEndPointFromLoadBalancer('DVS', remoteTransferHost);
	print(
		"Remote Transfer Host [" + remoteTransferHost + "] \n" +
		"Target Path [" + targetPath + "] \n" +
		"Transfer Option  [" + transferOption + "] \n" +
		"Transfer Order [" + transferOrder + "] \n" +
		"Packaging Format [" + packagingFormat + "] \n"
	);
    var sourceFiles = [];
    for each (var i in _sourceFiles..Text) {
        sourceFiles.push(new gmoNBCFunc.usefulFileObj(i));
    }
	var orderOfDelivery = gmoNBCFunc.isVarUsable(transferOrder)? transferOrder.split(","):[];
	var filesByDeliveryOrder = []

	if (packagingFormat == "itmsp" || packagingFormat == "dir"){
		print("packagingFormat -Action");
		var folderName = sourceFiles[0].filename;
		print("Folder Name ["+folderName+"]");
		var directoryFiles = gmoNBCNLDFunc.createContentDistDeliveryObjects(sourceFiles[0].unix_file);
		filesByDeliveryOrder = reArrangeFilesByDeliveryOrder(directoryFiles,orderOfDelivery);
		targetPath = targetPath + "/" + folderName + "/";
	} else {
		print("No packagingFormat -Action");
		filesByDeliveryOrder = reArrangeFilesByDeliveryOrder(sourceFiles,orderOfDelivery)
		targetPath = targetPath + "/";
	}

	//Copy or Move files to destination based on transferOption
	for each (var file in filesByDeliveryOrder){
		transferFile(transferOption,file,remoteTransferHost,targetPath)
	}

	jobDashboard.updateStatusAndProgress("Generic Transfer Completed Successfully", 95);
	
} catch(e) {
    print("Error in run_genericTransferModule.js: " + e.message);
    jobDashboard.updateStatusMap({"JOB__ERROR": e.message});
    quit(-1);
}
