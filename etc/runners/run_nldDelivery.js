importPackage(Packages.com.pharos.poxclient.signiant.services.scheduler);
load("/opt/evertz/mediator/etc/runners/signiantDelivery.js");
load("/opt/evertz/mediator/etc/runners/asperaFaspexDelivery.js");
load("/opt/evertz/mediator/etc/runners/Helpers/DeliveryHelper.js");

try  {  
	print("STARTING DELIVERY SCRIPT")
    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
    print(_jobId);

    // Get the details for the transfer from the preset. 
	var placingXML = getPlacingXML(String(jobDescription..PlacingId));
	
	//Get the details about the placing, including main material id and file path
	var matId = String(placingXML..MainMatId);
	if (matId === ""){
		throw new Error("The placing does not have a main material.")
	}
	var materialXML = getMaterialXML(matId);
	
	if (! materialXML..ShortText.(ShortTextType == "File Name").length()){
		throw new Error("Source File not found. ");
	}
	var fileName = String(materialXML..ShortText.(ShortTextType == "File Name")[0].Value)

	var path = String(materialXML..Track.(MediaName == "Main")..TrackFile.Path[0]).replace("Main", "Packaging");
	print(path + "/" + fileName);
	
	// Get all the presets from the placing XML with the Delivery Type 
	var transferPresets = placingXML..Preset.(PresetType == "Delivery"); 
	if (!transferPresets.length()) { 
		throw new Error("No Delivery Preset Found.")
	} 

	for each (var transfer in transferPresets){
		var transferType = String(transfer..Tag.(TagType == "Delivery Method").Value);
		print(transferType);
		switch(transferType){
			case "Signiant":
				signiantTransfer(placingXML, path, fileName);
				break;
			case "Faspex": 
				asperaFaspexTransfer(placingXML, path, fileName);
				break;
			default:
				throw new Error("Failed to Find transfer type: " + transferType);
		}
	}
	
} catch(e) {
	updateStatus({"JOB__ERROR": e.message.substring(0, 50)});
    print(e.message);
    quit(-1);
}