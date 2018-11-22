const UPLOAD_TYPE_DATA_KEY = "uploadType";

var java = JavaImporter(
	Packages.com.pharos.core.domain,
	Packages.com.pharos.poxclient
);

with (java) {
    _logger.info("Running Generic Form Initialize Script");

	// A hidden form field, used to help determine if its an Image/Video/Document/etc.
	_formData.addDataField(UPLOAD_TYPE_DATA_KEY, 'AudioComponent');

	_logger.info("Completed Generic Form Initialize Script");
}
