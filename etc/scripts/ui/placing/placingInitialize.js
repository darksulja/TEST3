const PLACING_ID_DATA_KEY = "placingId";

const SEQUENCE_NAME = "PLACING_ID_SEQUENCE";
const SCRIPT_NAME = "placingGenerator";

var java = JavaImporter(
	Packages.com.pharos.core.domain,
	Packages.com.pharos.poxclient
);

with (java) {
    _logger.info("Running Generic Form Initialize Script");

	var command = new Command("tools", "generateId");
	command.addParameter("script", SCRIPT_NAME);
	command.addParameter("sequenceName", SEQUENCE_NAME);
	var result = _commandHelper.runCommand(command);

	// a simple text field
	if (result.getSuccess() == true) {
		// If success is true, we must of got a PlacingId :)
		var generatePlacingId = result.getOutput();
		_logger.info("Setting data field [" + PLACING_ID_DATA_KEY + "] to value [" + generatePlacingId + "].");

		_formData.addDataField(PLACING_ID_DATA_KEY, generatePlacingId);
	} else {
		// Assume we got a command exception
		_logger.info("Unable to generate PlacingId because [" + result.getOutput().getCauseMessage() + "].");
	}

	_logger.info("Completed Generic Form Initialize Script");
}
