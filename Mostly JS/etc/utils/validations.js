var VALIDATIONS_UTILS_LOADER = {
	/**
	 *	[isVarUsable - Checks whether a given argument is null, undefined or an empty string]
	 *	@param	{?} - The variable you wish to test
	 *	@return {Boolean} - Whether the variable is 'useable'
	 **/
	isVarUsable : function(v) {
		if (arguments.length !== 1)
			throw new Error("Missing variable for #isVarUsable.");

		// Lazy check for undefined, null and emptystrings
		if (typeof v === "undefined" || v === null || v === "")
			return false;

		return true;
	}
}
