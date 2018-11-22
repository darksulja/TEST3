load ("/usr/local/pharos/etc/runners/confidenceHelper.js");

try {
	//
	// runner for confidence level helper
	//
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	output("Job Description: " + jobDescription);
	var placingId = jobDescription.Properties.Mapping.domainKey.toString();
	output("placing Id: " + placingId);
	output("Confidence start ");
	var CI = new confidenceHelper(placingId);
	var CIString = CI.buildRawString();
	var CIHash = CI.calcHashcode(CIString);
	var Placings = CI.countConfidenceHash(CIHash);
	var setCount = CI.setConfidenceCountValue(Placings);
	var setHash = CI.setConfidenceHash(CIHash);
	var settext = CI.setConfidenceTextValue(CIString,placingId);
	output("Confidence end ");	
} catch(e){
	print(e.message);
}