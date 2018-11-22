if (typeof(NBCGMO_CONSTANTS) === "undefined") {
    load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js");
}
if (typeof(gmoNBCFunc) === "undefined") {
    load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
}

if (typeof(gmoNBCNLDFunc) === "undefined")  {
    load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
}
if (typeof PlacingHelper === "undefined") {
    load("/opt/evertz/mediator/etc/runners/placingHelper.js");
}

/**
 * Function to create Note Saving object
 * 
 * @usage new noteSaver(placingId)
 * example :
 * 
 * var noteSaver = new NoteHelper("TEST-3AD532B3-46EF-443A-BA63-96874FF6E75A");
 * var result = noteSaver.deleteExistingPackageQCNote(placingId);
 * var result2 = noteSaver.savePackageQcNote(noteSaveString,placingId);
 * 
/*
* @Author: Chad Lundgren
* @Date:   2018-06-06 09:08:38
* @Last Modified by:   
* @Last Modified time: 
*/
//
//

// degugging info
var debug = false;

var NoteHelper = function (placingId) {
    if ((this instanceof NoteHelper) === false) {
        throw new Error("Please call constructor with new() keyword");
    }

    if (gmoNBCFunc.isVarUsable(placingId)){
        output("\nInstantiating Note Saving Helper\n");
        this.placingId = placingId;
        this.placingHelper = new PlacingHelper(placingId);
        var placingXml = this.placingHelper.getPlacingXml();

    } else{  
        throw new Error ("Placing Id is required to create Note Saving object.");
    }

	/**
	 * @usage		getAllNotes(placingId)
	 * @param		{string}	 placingId: (a placingId)
	 *  Note: There appears to be no way to filter which notes you receive, could take a while
	 *  Assumes only Placings have Notes (currently the case as of 06/06/2018)
	*/ 
	this.getAllNotes = function(placingId) {
		var xml = 	<PharosCs>
		<CommandList>
			<Command subsystem="note" method="getAllNotes">
			<ParameterList>
				<Parameter name="domainKey" value={placingId}/>
				<Parameter name="domainType">
					<Value>
						<NoteDomainType>Placing</NoteDomainType>
					</Value>
				</Parameter>
			</ParameterList>
			</Command>
		</CommandList>
		</PharosCs>;

		return wscall(xml);
	}

	/**
	 * @usage		deleteNote(placingId,noteId)
	 *  Note: NoteID is *required* for deletion, will need to call getAllNotes first and pick the right id
	 * Assumes only Placings have Notes (currently the case as of 06/06/2018)
	*/
	this.deleteNote = function(placingId, noteId) {
        if (gmoNBCFunc.isVarUsable(placingId) && gmoNBCFunc.isVarUsable(noteId)) {
 		var xml = 	<PharosCs>
		<CommandList>
			<Command subsystem="note" method="deleteNote">
			<ParameterList>
				<Parameter name="note">
					<Value>
						<Note id={noteId}>
							<DomainType>Placing</DomainType>
							<DomainKey>{placingId}</DomainKey>
						</Note>
					</Value>
				</Parameter>
			</ParameterList>
			</Command>
		</CommandList>
		</PharosCs>;
		return wscall(xml);
        } else {
            throw new Error("noteId and placingId both need to be usable variables");
        }
    }

    this.saveNoteType = function(placingId, noteText, noteType) {
        if (gmoNBCFunc.isVarUsable(placingId) && gmoNBCFunc.isVarUsable(noteText) && gmoNBCFunc.isVarUsable(noteType) ) {
            if (debug) output("Note Text for " + noteType + "is :" + noteText + "\n" );
			gmoNBCFunc.saveNote('Placing',placingId,noteType,'COMMENT','AVERAGE',noteText);
			// Fire notifcation always - if a new comment is saved, Translator wants to know
			gmoNBCFunc.fireStatusNotification(placingId, 'Placing')
        } else {
            throw new Error("placingID, noteText or notetype all have to be usable variables");
        }
    }
};