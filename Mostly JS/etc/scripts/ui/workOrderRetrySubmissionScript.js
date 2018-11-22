var java = JavaImporter(
	Packages.com.pharos.core.domain,
	Packages.com.pharos.core.domain.list,
	Packages.com.pharos.core.domain.utils,
	Packages.com.pharos.core.domain.job,
	Packages.com.pharos.microtime,
	Packages.java.text.SimpleDateFormat
);

const PLACING_ID = "Placing.PlacingId";
const TRIGGER = "NonDomain.Trigger";

with (java) {

	function createPlacingObj(placingId){
		var placing = new Placing();
		placing.setPlacingId(placingId);
		return placing;
	}

	function runWorkflowTransition(trigger,entityType,entityObject){
		var command = new Command("workflow","transition");
		var requirement = new WorkflowRequirement();
		requirement.setName(trigger);
		command.addParameter(entityType,entityObject);
		command.addParameter("requirement",requirement);
		var jobResult = _commandHelper.runCommand(command);
		return jobResult;
	}

	var placingID = _formData.getValue(PLACING_ID);
	var trigger = _formData.getValue(TRIGGER);

	//Run the Retry Transition for the Placing
	 var result = runWorkflowTransition(trigger, "placing", createPlacingObj(placingID));
	_result.setSuccess(true);
	_result.setOutcome("[" + placingID + "] has been triggered with workflow action [" + trigger + "]. Please check the dashboard for status");
}
