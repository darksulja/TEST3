load ("/usr/local/pharos/etc/helpers/NoteHelper.js");

try {
    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
    output("Job Description: " + jobDescription);
 
    var placingId = jobDescription.Properties.Mapping.domainKey.toString();
    var noteType = jobDescription.Properties.Mapping.noteType.toString();
    var fullTextType = jobDescription.Properties.Mapping.fullTextType.toString();

    output("placingId: " + placingId);
    print('noteType is: ' + noteType)

    const placingHelper = new PlacingHelper(placingId);
    placingHelper.refresh();
    const noteText = placingHelper.getFullTextValueByType(fullTextType)
    print('value for noteText is: ' + noteText);
    if (gmoNBCFunc.isVarUsable(noteText)) {
        const noteHelper = new NoteHelper(placingId);
        const allNotes = noteHelper.getAllNotes(placingId);
        const specificNoteType = allNotes..Note.(NoteType.Name == noteType).Content;
        print('specificNoteType: ' + specificNoteType );

        var NoteId = allNotes..Note.(NoteType.Name == noteType).@id;

        if (gmoNBCFunc.isVarUsable(NoteId) && gmoNBCFunc.isVarUsable(placingId)   ) {
            noteHelper.deleteNote(placingId, NoteId);
            sleep(1);
            noteHelper.saveNoteType(placingId, noteText, noteType);
        }
        else {
            print('found no Id for existing comment, only saving new note')
            noteHelper.saveNoteType(placingId, newPackageQcComment);
        }
    } 
    //Wait to send so that we don't have an AJAX race condition on after action send to Translator

} catch(e) {
    print('Note Saver error:' + e.message);
}