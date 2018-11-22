const MAT_ID_DATA_KEY = "matId";
const EPISODE_ID_DATA_KEY = "episodeId";
const SERIES_CODE_DATA_KEY = "seriesCode";

var java = JavaImporter(
    Packages.com.pharos.core.domain,
    Packages.com.pharos.core.domain.utils
);

with (java) {  
    _logger.info("Running Generic Form Validation Script");
	
	var matId = _formData.getValue(MAT_ID_DATA_KEY);
	if (matId != null && matId != "") {
		_logger.info("Checking if Material [" + matId + "] already exists, before submitting form.");
		
		var command = new Command("material", "get");
		command.addParameter("matId", matId);		
		var result = _commandHelper.runCommand(command);
		
        // Get the material from the result
        var material = result.getOutput();
		
		if (material != null) {
            var errorMsg = "Material [" + episodeId +"] already exists, please reset the form and try again.";
            _validationResult.addError(MAT_ID_DATA_KEY, errorMsg);
		}
	}

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
            _validationResult.addError(EPISODE_ID_DATA_KEY, errorMsg);
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
            _validationResult.addError(SERIES_CODE_DATA_KEY, errorMsg);
        }
    }   

	// Currently no logic is required, no return necessary.
    _logger.info("Completed Generic Form Validation Script");	
}
