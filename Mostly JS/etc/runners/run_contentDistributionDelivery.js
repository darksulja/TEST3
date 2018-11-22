load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
load("/opt/evertz/mediator/etc/runners/placingHelper.js");
load("/opt/evertz/mediator/etc/runners/pipelineHelper.js");
load("/opt/evertz/mediator/etc/helpers/ErrorHandlerHelper.js");

output("Running run_contentDistributionDelivery.js");

function generateHtmlEmailBody(placingXml,isFailure,sourceFilesString){

	var tagType = placingXml..TagList.Tag.(TagType.toString() == "PO/AL Type").Value.toString();
	var licenseNumber = placingXml..ShortText.(ShortTextType.toString() == "Licensee Number").Value.toString();
	var tagTypeNumber = placingXml..ShortText.(ShortTextType.toString() == "PO/AL #").Value.toString();
	var tvdProductionNumber = placingXml..ShortText.(ShortTextType.toString() == "TVD Production #").Value.toString();

	var shortTextElementsForEmail = [
		'Work Order Title',
		'Licensee',
		'Licensee Category',
		'TVD Production #',
		'Due Date',
		'Requestor Name'
	];

	var emailHeader = "Mediator Delivery Success Notification";
	var emailMessage = "Successful Delivery for Placing "+placingXml.PlacingId.toString()+ " \n\n";


	if(isFailure){
		emailHeader = "Mediator Delivery Failure Notification";
		emailMessage = "A delivery failed for Placing "+placingXml.PlacingId.toString()+ " \n\n";

	}

	var emailHtml = <html>
		<body style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans; font-size:15px;margin:0 auto ;border: 0;">
			<div style="margin: 20px auto;width: 980px;">
				<div style="vertical-align:middle;padding-top:5px;"><h3 style="text-align: center;"><strong>{emailHeader}</strong></h3></div>
				<p style="text-align: center;">{emailMessage}</p>
				<br></br>
			</div>
		</body>
	</html>;

	var emailTable = <table style="width:100%;line-height: 1.5;height: 15%;">
		</table>;

	emailTable.appendChild(generateHtmlTableRow('Placing ID #',placingXml.PlacingId.toString()));

	for each (var shortTextElement in shortTextElementsForEmail ) {
		var shortTextElementValue =  placingXml..ShortText.(ShortTextType.toString() == shortTextElement).Value.toString();
		if(shortTextElementValue){
				emailTable.appendChild(generateHtmlTableRow(shortTextElement,shortTextElementValue));
		}
	}

	emailTable.appendChild(generateHtmlTableRow('Placing Status',placingXml.StateName.toString()));
	emailTable.appendChild(generateHtmlTableRow('File List',sourceFilesString));
	emailHtml..div[0].appendChild(emailTable);
	return emailHtml;
};

function generateHtmlTableRow(name,value){
	var tableRow = <tr align="left">
		<th style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;" >{name}</th>
		<td style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;">{value}</td>
	</tr>;
	return tableRow;
};

try {
	var exitCode = 0;

	// Don't do this. However, desperate times call for desperate measures. Python Module coming soon...
	_jobId = arguments[0].split("+")[2];
	print("\nSetting _jobId to [" + _jobId + "]");

	_sessionKey = arguments[0].split("+")[1];
	print("\nSetting _sessionKey to [" + _sessionKey + "]");

	var states = {
		delivery : "Delivery"
	};

	var requirements = {
		start : "Start"
	};

	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);

	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);

	// Get required values from Job Description.
	var placingId = jobDescription.Properties.Mapping.domainKey.toString();

	// Key used for NLD settings in lookup.js regarding working directories.
	var vodWorking = "NLD_WORKING_DIR"

	//create placing and pipeline helpers
	var placingHelper = new PlacingHelper(placingId);
	var pipelineHelper = new PipelineHelper(placingHelper, vodWorking);

	// Get the placing details, include everything so we don't need to add things later.
	var placingXml = placingHelper.getPlacingXml();
	// Using the presets/placing metadata, lets get a list of settings that we need to use later.
	var settings = placingHelper.getSettings();

	//Check if pipeline state is required. Will exit here if not.

	var pipelineState = placingHelper.getPlacingState();
	gmoNBCNLDFunc.checkPipelineStateRequired(placingId, pipelineState);

	if (debug) print("PlacingXml: " + placingXml);

	print(
		"Placing Id [" + placingId + "] \n" +
		"Current Pipeline State [" + pipelineState + "] \n"
	);

	jobDashboard.updateStatusAndProgress("Gathering Placing Details/Settings",10);

	var pubDefName = placingHelper.getPubDef();

	print("\n" +
		"Publication Definition Name [" + pubDefName + "] \n"
	);

	// This will likely need to be some logic to work out the last pipeline stage that updated the current file we need to use. I.e. skipped conform, but pre-processing has a new file for us to use.
	var previousPipelineState = pipelineHelper.getPreviousPipelineState();

	print("\n" +
		"Previous Pipeline State [" + previousPipelineState + "] \n"
	);

	/* Commented out for Content Exports
	if (previousPipelineState == "Packaging") {
		var sourceFiles = gmoNBCNLDFunc.createContentDistDeliveryObjects(pipelineHelper.getPackagingFolder());
	} else {
		throw new Error("Failing Delivery: Previous Pipeline State [" + previousPipelineState + "] is unsupported");
	}
	*/
	jobDashboard.updateStatusAndProgress("Checking if Source Files Exist",15);

	var delivery`Method = settings.deliveryMethod;

	print("\n" +
		"Placing Id [" + placingId + "]" +
		"Delivery Method [" + deliveryMethod + "]"
	);

	print("---- FILE INFORMATION ----");
	for each (var file in sourceFiles){
		if (file.exists()){
			print("Source File Path [" + file.unix_file + "]");
			print("Folder Path [" + file.unix_path + "]");
			print("File Extension [" + file.extension + "]");
			print("File Basename [" + file.basename + "]");
			print("File Size [" + file.filesize + "] Bytes");

		} else {
			throw new Error("Source File [" + file.unix_file + "] does not exist.");
		}
	}
	print("-------------");


	print ("------------- Loading Module for [" + deliveryMethod +"] -------------");
	jobDashboard.updateStatusAndProgress("Loading Transfer Module for: " +  deliveryMethod,20);


	/* Here is where the delivery method modules is loaded. Details Below;

	Useful Variables:
	placingId - The placingId being delivered.
	placingXml - A fully loaded XML for all placing details.
	settings - A settings object, containing all set variables from the preset linked to the Publication Definition.
	sourceFiles - A list of usefulFileObj for the files to be transferred.
	jobDashboard - An object used to update progress/errors/status. Use this over the shellfun.js methods.

	The progress of your script should be updated between 20-95.

	You need to return a array variable called "transferResult" of the following;
	[Integer exit_code, String result_message]

	*/
	load("/opt/evertz/mediator/etc/runners/" + deliveryMethod + "Module.js");

	// Now that the module is complete, lets check the result :)
	if (typeof transferResult != 'undefined') {

		var transferResultExitCode = transferResult[0];
		var transferResultMessage = transferResult[1];
		print("Transfer Result Message: " + transferResultMessage);

		var sourceFilesString = "";
		for each (var sourceFile in sourceFiles){
			sourceFilesString += sourceFile.filename + "\n";
		}

		var sendEmail = false;

		if (transferResultExitCode == 0) {
			print("Transfer was a success using [" + deliveryMethod + "]");
			var emailSubject = "Delivery Success for [" + placingId + "] Notification";
			var emailBody = generateHtmlEmailBody(placingXml,false,sourceFilesString);

			// Get the list of emails to send to for a success.
			var emailAddresses = ["denver.gmoclientoperations@nbcuni.com"];
			for each (var emailAddress in settings.successEmailAddresses){
				print("Adding Email [" + emailAddress.toString() + "] to list of emails to send to.");
				emailAddresses.push(emailAddress.toString());
			}

			// Indicate we are good to send an email :)
			var sendEmail = true;
		} else {
			
			print("Transfer was a failure using [" + deliveryMethod + "]");

			var sendEmail = true;
				var emailSubject = "Delivery Failed for [" + placingId + "] Notification";
				var emailBody = generateHtmlEmailBody(placingXml,true,sourceFilesString);
			var emailAddresses = [];

			// Specific Users
			if (settings.sendFailureEmail  == true) {
				for each (var emailAddress in settings.failureEmailAddresses){
					print("Adding Email [" + emailAddress.toString() + "] to list of emails to send to.");
					emailAddresses.push(emailAddress.toString());
				}
			}

			// Always add the Support Teams
			for each (var nbcSupportEmailAddress in NBCGMO["nbcPipelineSupportEmailAddresses"]) {
				print("Adding Email [" + nbcSupportEmailAddress + "] to list of emails to sent to.");
				emailAddresses.push(nbcSupportEmailAddress);
			}
			
		}
		debug = true;
		if (sendEmail == true){
			//Sending E-mail
			var emailTo = emailAddresses.join(";");

			print("------------------\n" +
			"Sending Email \n" +
			"To: " + emailTo + "\n" +
			"\n" +
			"Subject: " + emailSubject + "\n" +
			"Body: " + "\n" +
			emailBody + "\n" +
			"------------------\n"
			);

			if (emailTo != null && emailTo != "" && emailTo != []){

				var result = gmoNBCFunc.sendCustomEmail(emailTo, emailSubject, emailBody);
				print("Email Job Created Succesfully, Job Id [" + result..Output.Integer.toString() + "]");
			} else {
				print("WARNING: No email job created cause the 'To Email Address' was not supplied.");
			}

		}

		if (transferResultExitCode != 0){
			throw new Error(transferResultMessage);
		} else {

			//If Delivery Acknowledgment Required Then We will transistion it to Wait for Response from Delivery System
			if(settings.deliveryAcknowledgmnetRequired){
				//Run an Intermediate State Transistion
				gmoNBCNLDFunc.transitionPlacing(placingId.toString(),states.delivery,requirements.start);
			}else {
				gmoNBCNLDFunc.saveDeliveryRevision(placingXml);
			}
		}
	} else {
		throw new Error("No transfer result found from module, failing delivery.");
	}

	jobDashboard.updateStatusAndProgress("Finished Running Script Successfully", 100);


} catch(e) {

	exitCode = -1;
	print("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});

	var ehh = new ErrorHandlerHelper("Delivery",placingId,"Placing");
	if (gmoNBCFunc.isVarUsable(e.code)) {
		errorMsg = ehh.getError(e.code, e.parameters).message;
		output("Error caught in Transfer: Error Code ["+e.code+"] Message ["+errorMsg+"]");
	} else {
		errorMsg = e.message;
		output("An error has occurred: " + errorMsg);
	}
	ehh.saveNote(errorMsg);

} finally {

	//wsLogout();
	print("\nQuitting with [" +  exitCode + "]");
	quit(exitCode);
}
