var java = JavaImporter(
	Packages.com.pharos.core.domain,
	Packages.com.pharos.core.domain.list,
	Packages.com.pharos.core.domain.utils,
	Packages.com.pharos.core.domain.job,
	Packages.com.pharos.microtime
	);
const PLACING_ID = "Placing.PlacingId";
const HOUSE_ID = "Licensee House ID"; 
with(java) {
	_logger.info("Running Work Order Metadata Update Script."); 
	var placingId = _formData.getValue(PLACING_ID);
	var houseId = _formData.getValue(HOUSE_ID); 
	var command = new Command("placing","save");
	_logger.info("Placing id is: " + placingId); 
	_logger.info("Licensee House ID is: " + houseId); 
	var placing_obj = new Placing();
	var shortTextList = new ShortTextList();
	var shorttext_obj = new ShortText();
	placing_obj.setPlacingId(placingId);
	shorttext_obj.setShortTextType("Licensee House ID");
	shorttext_obj.setShortText(houseId);
	shortTextList.add(shorttext_obj);
	placing_obj.setShortTextList(shortTextList);
	_logger.info("placing_obj is : " + placing_obj.PlacingId); 
	command.addParameter("placing",placing_obj);
	var jobResult = _commandHelper.runCommand(command);
	_result.setSuccess(true);
    _result.setOutcome("Placing Update is Successful");
	_logger.info("WorkFlowMetadataUpdate is Complete"); 
}
