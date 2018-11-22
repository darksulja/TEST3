const MAT_ID_DATA_KEY = "matId";

var java = JavaImporter(
    Packages.com.pharos.core.domain,
    Packages.com.pharos.core.domain.utils
);

with (java) {  
    _logger.info("Running Generic Form Validation Script");

    var matId = _formData.getValue(MAT_ID_DATA_KEY);

    if (matId == null && matId == "") 
    {
        _validationResult.addError("matId", "Material Id cannot be empty.");
    }
    else 
    {
        _logger.info("Checking if Material ID [" + matId + "] is valid before submitting form.");

        var command = new Command("material", "get");
        command.addParameter("matId", matId);
        var result = _commandHelper.runCommand(command);

        // Get the episode from the result
        var material = result.getOutput();

        if (material == null) {
            var errorMsg = "Material [" + matId +"] does not exist.";
            _validationResult.addError("matId", errorMsg);
        }
    }

	// Currently no logic is required, no return necessary.
    _logger.info("Completed Generic Form Validation Script");	
}
