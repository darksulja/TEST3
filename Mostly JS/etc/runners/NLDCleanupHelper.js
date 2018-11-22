load("/opt/evertz/mediator/lib/js/shellfun.js");
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");

NLDCleanupHelper = function() {
        this.__debug = false;
        this.__deleteRule = null;
        this.__deleteDirs = [];
        this.__purgePolicy = null;
        this.__skippedExtensions = [];
        this.__states = [];
        this.FIND_EXE = ["/usr/bin/find"];

        /*
         * Sets the rule that is being run.
         */
        this.setRuleName = function(rule) {
                print("Active rule name: " + rule);
                this.__deleteRule = rule;
        }

        /*
         * Returns the current rule.
         */
        this.getRuleName = function() {
                return this.__deleteRule;
        }

        /*
         * Sets the directories being deleted by the active rule.
         */
        this.setDeleteDirectoryList = function(deleteDirs) {
                print("Directories considered for deletion: " + deleteDirs);
                this.__deleteDirs = deleteDirs;
        }

        /*
         * Sets the workflow states that delete candidate placings must match. If blank, state will be ignored.
         */
        this.setStateList = function(states) {
                print("Matching workflow states: " + states);
                this.__states = states;
        }

        /*
         * Sets the extensions that are skipped during deletion.
         */
        this.setSkippedExtensions = function(extensions) {
                print("Configured to retain filed with these extensions: " + extensions);
                this.__skippedExtensions = extensions;
        }

        /*
         * Sets the purge policy.
         */
        this.setPurgePolicy = function(policy) {
                print("Purge policy: " + policy);
                this.__purgePolicy = policy;
        }

        /*
         * Helper methods for date arithmetic and formatting.
         */
        this.parseISOLocal = function(datestring) {
	        var b = datestring.split(/\D/);
	        return new Date(b[0],b[1]-1,b[2]);
        }

        this.dayDiff = function(date) {
                return Math.round((new Date()-date)/(1000*60*60*24));
        }

        /*
         * Printout helpers.
         */
        this.printObnoxiously = function(str,heading){
	        var heading = heading === undefined ? "Error" : heading;
	        print("")
	        print("####################################### "+heading+" #######################################");
	        print("");
	        print(str);
        }

        this.printDebugLog = function(str) {
                if (this.__debug) print(str)
        }

        /*
         * Helper methods for email.
         */
        this.generateHtmlEmailBody = function(purgedFoldersArray, orphanedFoldersArray, ruleName) {
        	var emailHeader = "Purge Notification - " + ruleName;
        	var emailMessage = "Following Work Orders are purged as it meets policies of the rule [" + ruleName + "]" ;
        	var emailHtml = <html>
        		<body style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans; font-size:15px;margin:0 auto ;border: 0;">
        			<div style="margin: 20px auto;width: 980px;">
        				<div style="vertical-align:middle;padding-top:5px;"><h3 style="text-align: center;"><strong>{emailHeader}</strong></h3></div>
        				<p style="text-align: center;">{emailMessage}</p>
        				<br></br>
        			</div>
        		</body>
        	</html>;

        	var emailTable = <table style="width:100%;line-height: 1.5;height: 15%;">
        		</table>;
        	emailTable.appendChild(this.generateHtmlTableHeader("Placing ID","Folder Path","Current State","No of Days","Comments"));
        	for each (var folder in purgedFoldersArray){
        		if(folder.isPartialPurge){
        			emailTable.appendChild(this.generateHtmlTableRow(folder.placingID,folder.folder,folder.lastState,folder.days,"Purged with exclusions. Some files may remain."));
        		}else{
        			emailTable.appendChild(this.generateHtmlTableRow(folder.placingID,folder.folder,folder.lastState,folder.days,""));
        		}
        	}
        	for each (var folder in orphanedFoldersArray){
        		emailTable.appendChild(this.generateHtmlTableRow(folder.placingID,folder.folder,"Orphan","","Needs Action"));
        	}
        	emailHtml..div[0].appendChild(emailTable);
        	print(emailHtml);
        	return emailHtml;
        }

        this.generateHtmlTableHeader = function(tda, tdb, tdc, tdd, tde) {
	        var tableRow = <tr align="left">
	        	<th style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;" >{tda}</th>
	        	<th style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;">{tdb}</th>
	        	<th style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;" >{tdc}</th>
	        	<th style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;" >{tdd}</th>
	        	<th style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;" >{tde}</th>
	        </tr>;
	        return tableRow;
        }

        this.generateHtmlTableRow = function(tda ,tdb ,tdc ,tdd ,tde) {
	        var tableRow = <tr align="left">
	        	<td style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;" >{tda}</td>
	        	<td style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;">{tdb}</td>
	        	<td style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;" >{tdc}</td>
	        	<td style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;" >{tdd}</td>
	        	<td style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1; color:red" >{tde}</td>
	        </tr>;
	        return tableRow;
        }

        /*
         * Deletes a given folder. Returns outcome as boolean.
         */
        this.purgeFolder = function(folder) {
                try {
                        print("Purging Directory ["+folder+"]")
	                gmoNBCFunc.deleteDirectory(folder,true);
                        return true;
                } catch(e) {
                        print("Error purging folder: " + e);
                        return false;
                }
        }

        /*
         * Deletes files in a given folder, excluding those with certain extensions. Does not delete the folder itself.
         * Returns the number of files deleted.
         */
        this.purgeFilesInFolder = function(folder, retainFilesWithExtension) {
                print("Purging files with exclusions based on rule. Excluding files for purge with extensions " + retainFilesWithExtension);
	        var deleteCount = 0;
	        var filesToRemove = [];
	        var removeFiles = this.getNLDFilesForRemoval(folder,filesToRemove,retainFilesWithExtension);

	        for each (var removalFile in removeFiles){
	        	print("Deleting file ["+ String(removalFile) + "]");
	        	deleteCount++;
	        	remove(removalFile.getAbsoluteFile());
	        }

	        return deleteCount;
        }

        /*
         * Returns an array of Useful File Objects for each valid file
         * in a given dir (excluding those with a specified extension).
         */
        this.getNLDFilesForRemoval = function(folder, filesToRemove, retainFilesWithExtension) {
	        var filesToRemoveDir = new File(folder).listFiles();

	        // Create a useful file object for each delivery
	        for each(var fileToRemove in filesToRemoveDir) {
	        	if(!fileToRemove.isHidden()){
	        		if (fileToRemove.isDirectory()) {
	        			this.getNLDFilesForRemoval(String(fileToRemove),filesToRemove,retainFilesWithExtension);
	        		}
                                else {
	        			var fileInDirObj = new gmoNBCFunc.usefulFileObj(String(fileToRemove));
	        			if (gmoNBCFunc.contains(retainFilesWithExtension, fileInDirObj.extension)) {
	        				print("Excluding [" + fileInDirObj.unix_file + "] from deletion.");
	        			} else {
	        				filesToRemove.push(fileToRemove);
	        			}
	        		}
	        	}
	        }

	        return filesToRemove;
        }

        /*
         * Validates and deletes placings.
         */
        this.validateAndDeletePlacings = function(listOfFolderPaths,workflowStates,retainFilesWithExtension,purgePolicy) {
                var purgedFolders = [];
                var orphanFolders = [];

	        for each (var folder in listOfFolderPaths) {
	        	this.printDebugLog("Processing folder "+folder);
	        	var folderArray = folder.split("/");
	        	var placingID = folderArray[folderArray.length-1].split(".dir")[0];

	        	this.printDebugLog("Identified as Placing  "+placingID);

	        	if(placingID!="" && placingID.length>1) {

	        		var placingXML = placingGet(placingID,"history")..Placing;

	        		if (placingXML.PlacingId.toString()!="" && placingXML.PlacingId.toString().length>1) {
	        			var purgedFolder;
	        			var lastState = placingXML.WorkflowStateHistoryList.WorkflowStateHistory[0].ToState.toString();
	        			var lastChangeDate = placingXML.WorkflowStateHistoryList.WorkflowStateHistory[0].TimeOccurred.toString().substring(0,10);
	        			var days = this.dayDiff(this.parseISOLocal(lastChangeDate))

	        			this.printDebugLog("Last State "+lastState);
	        			this.printDebugLog("Last State Change "+lastChangeDate)

	        			// Meet either, the day and state requirement combined, or if no states specified assume all states are fine and only go by days
	        			if ((gmoNBCFunc.contains(workflowStates, lastState) && days>=purgePolicy)|| (workflowStates.length == 0 && days>=purgePolicy)) {
	        				print("Placing meets purge policy requirement. Last action was [" + days + "] days ago. Threshold is [" + purgePolicy + "]");

	        				if(retainFilesWithExtension.length == 0){
	                                                print("Purging placing folder for ["+placingID+"]");
                                                        var result = this.purgeFolder(folder);
                                                        if (result) purgedFolders.push({placingID: placingID, folder: folder, lastState: lastState, days: days, isPartialPurge: false})
	        				}
	        				else {
                                                        var deleteCount = this.purgeFilesInFolder(folder, retainFilesWithExtension);
	        				        if (deleteCount > 0) purgedFolders.push({placingID: placingID, folder: folder, lastState: lastState, days: days, isPartialPurge: true});
                                                }
	        			}
	        			else {
	        				print("Placing ["+placingID+"] does not yet meet requirements for policy.");
	        			}
	        		}
	        		else {
	        			print("Not Removing Placing ["+placingID+"] as it is [ Not a Managed Directorry ]");
	        			var orphanFolder = {
	        				"folder" : folder,
	        				"placingID":placingID
	        			}
	        			orphanFolders.push(orphanFolder);
	        		}
	        	}
	        }

                return {purgedFolders: purgedFolders, orphanFolders: orphanFolders}
        }

        /*
         * Runs the deletion logic. Returns an object of two arrays: deleted folders, and orphaned folders.
         */
        this.runDeleteRule = function() {
                if (!this.__deleteDirs) {
                        throw new Error("Deletion directories undefined.");
                }

	        for each (var directory in this.__deleteDirs){
	        	directory = lookup.nld[directory].mount;
	        	this.printObnoxiously("","Processing Directory ["+directory+"]");
	        	var commands = [];
	        	commands = commands.concat(directory);
	        	commands = commands.concat("-maxdepth");
	        	commands = commands.concat("2");
	        	commands = commands.concat("-name");
	        	commands = commands.concat("*.dir")
	        	try{
	        		var result = run(this.FIND_EXE, commands);
	        		this.printDebugLog(result.output);
	        		var listOfFolderPaths = result.output.split("\n");
	        		var deleteResults = this.validateAndDeletePlacings(listOfFolderPaths, this.__states, this.__skippedExtensions, this.__purgePolicy);
	        	}catch(e) {
                                throw new Error(e);
	        	}
	        }

                return deleteResults;
        }
}

