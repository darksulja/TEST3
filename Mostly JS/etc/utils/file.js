var FILE_UTILS_LOADER = {
	// Replaces '/' with UnderScores
	// @param  [string] - of Material Id
	// @return [stirng] - with slashes replaced with underscored
	getSafeFileId : function(matId) {
		if(debug) print("\nDEBUG: Changing MatId ["+matId+"] to Safe File Id ["+matId.replace(/\//g,"_")+"]");
		return matId.replace(/\//g,"_");
	},

	// Makes a directory on a local path
	// @param [destPath] [Path of directory you wish to make]
	makeDirectory	: function(destPath) {
		print("Attempting to make ["+destPath+"]")
	 	if (!fileExists(destPath)) {
		print("Making directory ["+destPath+"]");
			if (!makedir(destPath)) {
				print("Failed to make Directory - Trying once more");
				if (!makedir(destPath)) {
					print("Failed to make Directory again");
					throw new Error("Failed to make Directory");
				}
			}
		} else {
			print("Path already exists.");
		}
	}
}
