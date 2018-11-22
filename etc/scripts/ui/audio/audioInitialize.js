const MAT_ID_DATA_KEY = "matId";
const UPLOAD_TYPE_DATA_KEY = "uploadType";

const SEQUENCE_NAME = "MAT_ID_SEQUENCE";
const SCRIPT_NAME = "materialGenerator";

var java = JavaImporter(
	Packages.com.pharos.core.domain,
	Packages.com.pharos.poxclient
);

with (java) {
    _logger.info("Running Generic Form Initialize Script");

	// A hidden form field, used to help determine if its an Image/Video/Document/etc.
	_formData.addDataField(UPLOAD_TYPE_DATA_KEY, 'Audio');

	var command = new Command("tools", "generateId");
	command.addParameter("script", SCRIPT_NAME);
	command.addParameter("sequenceName", SEQUENCE_NAME);
	var result = _commandHelper.runCommand(command);

	// a simple text field
	if (result.getSuccess() == true) {
		// If success is true, we must of got a MatId :)
		var generateMatId = result.getOutput();
		_logger.info("Setting data field [" + MAT_ID_DATA_KEY + "] to value [" + generateMatId + "].");

		_formData.addDataField(MAT_ID_DATA_KEY, generateMatId);
	} else {
		// Assume we got a command exception
		_logger.info("Unable to generate MatId because [" + result.getOutput().getCauseMessage() + "].");
	}

	_logger.info("Completed Generic Form Initialize Script");
}
