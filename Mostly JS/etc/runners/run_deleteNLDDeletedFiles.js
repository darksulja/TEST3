load("/opt/evertz/mediator/lib/js/shellfun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/NLDCleanupHelper.js");

var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
if (debug) print("Job Description: " + jobDescription);

var cleanupHelper = new NLDCleanupHelper();
cleanupHelper.setRuleName(jobDescription.Properties.Mapping.RULE_NAME.toString());

var ruleName = cleanupHelper.getRuleName();
var purgePolicy = jobDescription.Properties.Mapping.PURGE_POLICY.toString();
var purgeDirectories = [];
var emailLists = [];
var workflowStates = [];
var purgedFolders = [];
var orphanFolders = [];
var retainFilesWithExtension = [];

// Setting Purge Policy from Job Description or Default Value 
print("Running NLD Delete Rule [" + ruleName + "]");
print("Purge Policy Defined in Job Description is ["+purgePolicy+"]");

if(typeof purgePolicy == "undefined" || purgePolicy==""){
	print("No Purge Policy Defined in Job Description. Setting to Default 10 ");
	purgePolicy = 10;
}else {
	purgePolicy = parseInt(purgePolicy);
}

cleanupHelper.setPurgePolicy(purgePolicy);

// Setting Purge Directories from Job Description or throw Error if none defined 
for each (var directory in jobDescription..DIRECTORY_LIST.StringList.String){
	purgeDirectories.push(directory.toString());
}

cleanupHelper.setDeleteDirectoryList(purgeDirectories);

print("Configured Purge Directories are ["+purgeDirectories+"]");
if(purgeDirectories.length==0){
	throw new Error("No Purge Directories Configured "); 
}

// Setting Workflow states, if one is not detected, script will ignore the need for a state 
for each (var state in jobDescription..WORKFLOW_STATE_LIST.StringList.String){
	workflowStates.push(state.toString());
}
cleanupHelper.setStateList(workflowStates);

// Setting extensions to retain during delete, script will not delete files with this extension or folders containing them 
for each (var ext in jobDescription..RETAIN_EXTENSION_LIST.StringList.String){
	retainFilesWithExtension.push(ext.toString());
}
cleanupHelper.setSkippedExtensions(retainFilesWithExtension);

// Setting Purge Notification List from Job Description 
for each (var email in jobDescription..EMAIL_DISTRIBUTION_LIST.StringList.String){
	emailLists.push(email.toString());
}

try {
        var result = cleanupHelper.runDeleteRule();
        print("Purged Folders = "+result.purgedFolders.length);
		print("Orphan Folders = "+result.orphanFolders.length);
        if(result.purgedFolders.length>=1 || result.orphanFolders.length>=1 ) {
                emailSubject = "ECGMO NLD Purge Notification";
                emailBody = cleanupHelper.generateHtmlEmailBody(result.purgedFolders, result.orphanFolders, cleanupHelper.getRuleName());
                gmoNBCFunc.sendCustomEmail(emailLists.join(";"), emailSubject, emailBody);
        }
}catch(e){
	print("NLDWorking Clean up Failed ",e)
}
