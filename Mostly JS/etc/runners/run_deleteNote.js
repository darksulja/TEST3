load ("/usr/local/pharos/etc/helpers/NoteHelper.js");

try {
    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
    output("Job Description: " + jobDescription);
    var placingId = jobDescription.Properties.Mapping.domainKey.toString();
    output("placing Id: " + placingId);

        const noteHelper = new NoteHelper(placingId);
        const allNotes = noteHelper.getAllNotes(placingId);
        const NoteId = allNotes..Note.(NoteType.Name == noteType).@id;
   
        if (gmoNBCFunc.isVarUsable(NoteId) && gmoNBCFunc.isVarUsable(noteType) ) {
            print('Note deleter: found Id for note, deleting NoteId: ' + NoteId);
            noteHelper.deleteNote(placingId, NoteId);
        }  else {
            print('Note deleter: did not find a note to delete');  
        } 
} catch(e) {
    print('Note deleter error:' + e.message);
}