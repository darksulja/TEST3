const EPISODE_ID_DATA_KEY = "episodeId";
const SERIES_CODE_DATA_KEY = "seriesCode";



var java = JavaImporter(
    Packages.com.pharos.core.domain,
    Packages.com.pharos.core.domain.utils
);

with (java) {  
    _logger.info("Running Generic Form Validation Script");

    var episodeId = _formData.getValue(EPISODE_ID_DATA_KEY);

    if (episodeId != null && episodeId != ""){
        _logger.info("Checking if Episode [" + episodeId + "] is valid before submitting form.");

        var command = new Command("episode", "get");
        command.addParameter("episodeId", episodeId);
        var result = _commandHelper.runCommand(command);

        // Get the episode from the result
        var episode = result.getOutput();

        if (episode == null) {
            var errorMsg = "Episode [" + episodeId +"] does not exist.";
            _validationResult.addError("episodeId", errorMsg);
        }
    }
    
    var seriesCode = _formData.getValue(SERIES_CODE_DATA_KEY);

    if (seriesCode != null && seriesCode != ""){
        _logger.info("Checking if Series [" + seriesCode + "] is valid before submitting form.");

        var command = new Command("series", "get");
        command.addParameter("seriesCode", seriesCode);
        var result = _commandHelper.runCommand(command);

        // Get the episode from the result
        var series = result.getOutput();

        if (series == null) {
            var errorMsg = "Series [" + seriesCode +"] does not exist.";
            _validationResult.addError("seriesCode", errorMsg);
        }
    }   

	// Currently no logic is required, no return necessary.
    _logger.info("Completed Generic Form Validation Script");	
}
