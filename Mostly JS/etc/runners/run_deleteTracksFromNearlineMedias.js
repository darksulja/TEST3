load('/opt/evertz/mediator/etc/runners/nbcgmo_fun.js');

// Warn if overriding existing method
if(Array.prototype.equals) {
    output("WARN: Overriding existing Array.prototype.equals.");
}
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}


function getTrackList(media) {
	return wscall(<PharosCs>
					  <CommandList>
						<Command subsystem="media" method="getTrackList">
						  <ParameterList>
							<Parameter name="mediaName" value={media}/>
						  </ParameterList>
						</Command>
					  </CommandList>
					</PharosCs>);
}

function generateReconcileRequest(bMaterialXml, bArchiveMedia) {
	var bMatId = bMaterialXml..MatId.toString();
	output("generateReconcileRequest(): Running for [" + bMatId + "] on [" + bArchiveMedia + "]");
	if (bMaterialXml..Track.(MediaName.toString() == bArchiveMedia).length() > 0) {
		output("generateReconcileRequest(): Removing From Archive Media");
		gmoNBCFunc.deleteTrack(bMatId, bArchiveMedia);		
	} else {
		output("generateReconcileRequest(): Do Not Need to Remove From Archive Media");
	}
	sleep(3);
	output("generateReconcileRequest(): Generating Request to Archive Media");
	var requestId = makeTransferRequest(bMatId, bArchiveMedia, 1);
	requestId = 100000;
	output("generateReconcileRequest(): Request ID is [" + requestId + "]");
	return requestId;
}

function generateHtmlEmailBody(_media, _delete_states, _purge_details){
    var emailHeader = _media + " Purge Notification";
    var emailMessage = "Following Material Tracks are purged as all Materials are in deleteable states [" + _delete_states.join(", ") + "]";
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
		
	for each (var prop in purgeDetails) {
        emailTable.appendChild(generateHtmlTableRow(prop.heading,prop.value));
	}
	
    emailHtml..div[0].appendChild(emailTable);
    print(emailHtml);
    return emailHtml;
};

function generateHtmlTableRow(tda,tdb){
    var tableRow = <tr align="left">
        <th style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;" align="left">{tda}</th>
        <td style="FONT-FAMILY: Arial Unicode MS, Arial, Verdana, Helveltica, Sans Serif, Sans;FONT-SIZE: 10pt; background-color:#f1f1f1;">{tdb}</td>
    </tr>;
    return tableRow;
};

function getTrackDefsAsArray(_matXml, _media, _ignore_classes) {
	TDefs = [];
	for each (var tDef in _matXml..Track.(MediaName.toString() == _media).TrackDefinition) {
		if (!gmoNBCFunc.contains(_ignore_classes, tDef.TrackTypeClass.ClassName.toString().toLowerCase())) {
			print("Found TrackType [" + tDef.TrackTypeName.toString() + "] on Media [" + _media + "]");
			TDefs.push(tDef.TrackTypeName.toString());
		}
	}
	return TDefs
};

function meetsPurgeRuleDays(_matXml, _media, _no_days, _date_from) {
	var utcToDate = function(oUTC) {
        var yyyy = oUTC.substring(0,4);
        var mm = (oUTC.substring(5,7) - 1);
        var dd = oUTC.substring(8,10);
        return new Date(yyyy, mm, dd);
	};

	var daysBetween = function(date1, date2) {
		//Get 1 day in milliseconds
		var one_day=1000*60*60*24;

		// Convert both dates to milliseconds
		var date1_ms = date1.getTime();
		var date2_ms = date2.getTime();

		// Calculate the difference in milliseconds
		var difference_ms = date2_ms - date1_ms;

		// Convert back to days and return
		return Math.round(difference_ms/one_day);
	};
	
	output("Ingest Date [" + _matXml..Track.(MediaName.toString() == _media).IngestDate.toString() + "]");
	var days = daysBetween(utcToDate(_matXml..Track.(MediaName.toString() == _media).IngestDate.toString()), _date_from);
	output("Ingest Date difference [" + days + "]");
	
	if (days >= _no_days) {
		output("Valid for Purge Rule No. Days [" + _no_days + "]");
		return true;
	} else {
		output("NOT Valid for Purge Rule No. Days [" + _no_days + "]");
		return false;
	}
	
};

function allTrackTypeLinksInDeletableState(_matXml, _delete_states) {
	for each (var ttl in _matXml..TrackTypeLink) {
		if (!gmoNBCFunc.contains(_delete_states, ttl.StateName.toString())) {
			print("[" + ttl.TrackTypeName.toString() + "] is in State [" + ttl.StateName.toString() + "]. IS NOT a Deleteable State");
			return false;
		}
		output("All TrackTypeLinks in Deleteable State");
		return true;
	}
};

var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;

var purgePolicy = jobDescription.Properties.Mapping.PURGE_POLICY.toString();
var reconcileAgainstArchive = jobDescription.Properties.Mapping.RECONCILE_AGAINST_ARCHIVE.toString();
var reconcileLimit = jobDescription.Properties.Mapping.RECONCILE_LIMIT.toString();
var DELETE_STATES = [];
var EMAIL_LISTS = [];
var IGNORE_CLASSES = [];
var MEDIA = jobDescription..MEDIA.toString();
var ARCHIVE_MEDIA = jobDescription..ARCHIVE.toString();
var STATE_MACHINE = "";

for each (var b_delete_state in jobDescription..DELETABLE_STATES.StringList.String) {
    DELETE_STATES.push(b_delete_state.toString());
}

for each (var b_tt_class in jobDescription..IGNORE_TT_CLASSES.StringList.String) {
    IGNORE_CLASSES.push(b_tt_class.toString().toLowerCase());
}

// Setting Purge Notification List from Job Description 
for each (var email in jobDescription..EMAIL_DISTRIBUTION_LIST.StringList.String){
    EMAIL_LISTS.push(email.toString());
}
if(typeof purgePolicy == "undefined" || purgePolicy==""){
	print("No Purge Policy Defined in Job Description. Setting to Default 10 ");
	purgePolicy = 10;
}else {
	purgePolicy = parseInt(purgePolicy);
}

if(typeof reconcileAgainstArchive == "undefined" || reconcileAgainstArchive == "") {
	print("Reconcile Against Archive Not Set - Defaulting to 'false'");
	reconcileAgainstArchive = false;
	reconcileLimit = 0;
} else {
	reconcileAgainstArchive = reconcileAgainstArchive;
	output("Reconcile Against Archive Set to [" + reconcileAgainstArchive + "]");
	if (typeof reconcileLimit == "undefined" || reconcileLimit == "") {
		output("Reconcile Limit is not Set, Defaulting to 10");
		reconcileLimit = 1;
	} else {
		output("Reconcile Limit Set to [" + reconcileLimit + "]");
		reconcileLimit = parseInt(reconcileLimit);
	}
}

try {
	/*
		LOOP THROUGH EACH MEDIA IN JOB DESCRIPTION
	*/
	var trackList = getTrackList(MEDIA);

	var tracks_removed = 0;
	var tracks_not_removed = 0;
	var tracks_ignored = 0;
	var tracks_error = 0;
	var tracks_within_purge_date = 0;
	var tracks_not_in_deletable_state = 0;
	var tracks_with_tds_not_matching = 0;
	var tracks_reconciled = 0;
	var error_detail = [];
	var today = new Date();
	var counter = 0;
	output("Nearline Media [" + MEDIA + "]");
	output("Archive Media [" + ARCHIVE_MEDIA + "]\n");
	
	for each (var mat_track in trackList..MatTrackList) {
		try {

			var matId = mat_track.@matId.toString();
			print("MatId [" + matId + "]");
			
			var materialXml = materialGet(matId,'trackTypeLinks','tracks','shorttext');
			
			output("Finding out if we can delete..");
			/*
				---------------------------------------------------------
				Check the last modified date
				Check all the workflow states are in a deleteable state
				Check Track Types are on the Source and Archive
				---------------------------------------------------------
				Before we do anything - check how long the file has been on the storage
			*/
			if (meetsPurgeRuleDays(materialXml, MEDIA, purgePolicy, today)) {
				/*
					Check all the track type links are in a deleteable state
				*/
				if (allTrackTypeLinksInDeletableState(materialXml, DELETE_STATES)) {
					/*
						Go through the track definitions on the Nearline Media and see if they exist on the DIVA
					*/
					output("Checking Track Definitions on the Nearline Media");
					var nl_TDefs = getTrackDefsAsArray(materialXml, MEDIA, IGNORE_CLASSES);
					output("");
					
					/*
						Go through the track definitions on the Archive Media and see if they exist on the DIVA
					*/
					output("Checking Track Definitions on the Archive Media");
					var archive_TDefs = getTrackDefsAsArray(materialXml, ARCHIVE_MEDIA, IGNORE_CLASSES);
					output("");
					
					/*
						Find which track defs exist on the nearline but not on the Diva
					*/
					nl_TDefs.sort();
					archive_TDefs.sort();
					if (nl_TDefs.length > 0) {
						print(nl_TDefs.length)
						if (nl_TDefs.equals(archive_TDefs)) {
							output("Track Definitions on [" + MEDIA + "] MATCH Track Definitions on [" + ARCHIVE_MEDIA + "]");
	
								
								// Have all track types on both store and archive and all states in a deleteable state
								output("Delete Checks Successful - Removing Track from [" + MEDIA + "]");
								try {
									sleep(3)
									gmoNBCFunc.deleteTrackWithDeleteMark(matId, MEDIA);				
								} catch (e) {
									error_detail.push(e.message);
									tracks_error++;
								}
								sleep(1);
								counter++;
								tracks_removed++;
						} else {
							output("Track Definitions on [" + MEDIA + "] do NOT MATCH Track Definitions on [" + ARCHIVE_MEDIA + "]");
							tracks_with_tds_not_matching++;
							tracks_not_removed++;
							if (reconcileAgainstArchive) {
								if (tracks_reconciled < reconcileLimit) {
									output("Reconciling to the Archive");
									generateReconcileRequest(materialXml, ARCHIVE_MEDIA);
									tracks_reconciled++;
								} else {
									output("Reconcile Limit Reached");
								}
							}
						}
					} else {
						throw new Error("0 Track Defs on Nearline Media");
					}	
				} else {
					tracks_not_in_deletable_state++;
					tracks_not_removed++;			
				}	
			} else {
				tracks_within_purge_date++;
				tracks_not_removed++;			
			}
			print("");
		} catch (e) {
			output("Error During Delete Validation: " + e.message);
		}
	}

	var purgeDetails = {
		"total_tracks"	:	{
			"heading"	:	"Total # of Tracks on Source Media",
			"value"		:	trackList..MatTrackList.length()
		},
		"tracks_deleted"	:	{
			"heading"	:	"Total # of Tracks Deleted",
			"value"		:	tracks_removed
		},
		"tracks_not_deleted"	:	{
			"heading"	:	"Total # of Tracks Not Deleted",
			"value"		:	tracks_not_removed
		},		
		"tracks_with_tds_not_matching"	:	{
			"heading"	:	"Tracks Are: Within Purge Date, Have All Track Types Are in Deleteable State BUT The Nearline Track Defs DO NOT Match Archive Track Defs",
			"value"		:	(tracks_with_tds_not_matching + "/" + tracks_reconciled)
		},
		"tracks_not_in_deletable_state"	:	{
			"heading"	:	"Tracks Are: Within Purge Date BUT All Track Types ARE NOT in a Deleteable State",
			"value"		:	tracks_not_in_deletable_state
		},
		"tracks_within_purge_date"	:	{
			"heading"	:	"Tracks Are: NOT Within Purge Date",
			"value"		:	tracks_within_purge_date
		},			
		"tracks_errored"	:	{
			"heading"	:	"Tracks Errored",
			"value"		:	tracks_error
		},
		"error_detail"	:	{
			"heading"	:	"Error Detail",
			"value"		:	error_detail
		}		
	};
	
	output("[" + MEDIA + "] Results:");
	for each (var prop in purgeDetails) {
		output("    " + prop.heading + "        : " + prop.value + ""); 
	}
	
	/*
		SEND EMAIL
	*/
	if(purgeDetails["total_tracks"].value > 0)   {  
		emailSubject = "Studio Fufillment - MX " + MEDIA + " Purge Notification";
		emailBody = generateHtmlEmailBody(MEDIA, DELETE_STATES, purgeDetails);
		gmoNBCFunc.sendCustomEmail(EMAIL_LISTS.join(";"), emailSubject, emailBody);
	}
} catch(e) {
	print("Clean up Failed " + e.message);
}
