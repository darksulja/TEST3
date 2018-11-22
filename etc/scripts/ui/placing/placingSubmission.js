const PLACING_ID_DATA_KEY = "placingId";
const PLACING_PARCEL_LIST_DATA_KEY = "placingParcelList";
const PLACING_PUBLICATION_DATA_KEY = "placingPublication";
const START_DATE_DATA_KEY = "startDate";
const END_DATE_DATA_KEY = "endDate";


var java = JavaImporter(
    Packages.com.pharos.core.domain,
    Packages.com.pharos.core.domain.list,
    Packages.com.pharos.core.domain.job,
    Packages.com.pharos.core.domain.utils,
    Packages.com.pharos.moxb.containers,
    Packages.com.pharos.microtime
);

function isValid(value) {
    return value !== null & value !== "" && value !== undefined;
}

with(java) {
    _logger.info("Running Generic Form Upload Submission Script");
    try {
        var placingId = _formData.getValue(PLACING_ID_DATA_KEY);
        var placingParcelList = _formData.getValue(PLACING_PARCEL_LIST_DATA_KEY);
        var placingPublicationList = _formData.getValue(PLACING_PUBLICATION_DATA_KEY);
        var startDate = _formData.getValue(START_DATE_DATA_KEY);
        var endDate = _formData.getValue(END_DATE_DATA_KEY);

        _logger.info(placingParcelList);
        var placing = new Placing();

        if (isValid(placingId)) {
            placing.setPlacingId(placingId);
        } else {
            throw new Error("PlacingId must be provided");
        }

        placing.setStateName('Not Available');
        placing.setStateMachineName('Servicing');

        // Save the Placing
        var command = new Command("placing", "save");
        command.addParameter("placing", placing);
        _commandHelper.runCommand(command);

        _logger.info("Completed Placing Registration Submission Script");

        // Currently no logic is required, just return true.
        _result.setSuccess(true);
        _result.setOutcome("Placing successfully registered.");
    } catch (e) {
        _result.setSuccess(false);
        _result.setOutcome("Error occured: [" + e.message + "].");
        _logger.info("Error occured: [" + e.message + "].");
    }
}