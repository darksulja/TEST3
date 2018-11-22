var MEDIA_UTILS_LOADER = {
	/**
	 * Get media track file paths
	 * @param [matId] [The Material Id to be transitioned]
	 * @param [mediaName] [The media name]
	 */
	getMediaTrackFilePath : function(matId, mediaName) {
		if (arguments.length !== 2)
			throw new Error("Missing matId, and/or mediaName for #getMediaTrackFilePath.");

		var dirNameFactory = wscall(this.buildMediaNameCommand(mediaName))..Output.Media.DirectoryNameFactoryName.toString();

		if (dirNameFactory == "MaterialDirectoryNameFactory") {
			return "/" + matId + ".dir/";
		} else if (dirNameFactory == "Md5SumDirectoryNameFactory") {
			return "/" + Packages.org.apache.commons.codec.digest.DigestUtils.md5Hex(matId).substring(29) + "/" + matId + "/";
		} else if (dirNameFactory == "MaterialMd5AndMediaDirectoryNameFactory") {
			throw new Error("This directory name is not supported at the moment.");
		}

		// FlatListDirectoryNameFactory and not listed return empty string.
		return "";
	},

	buildMediaNameCommand : function(mediaName) {
		if (arguments.length !== 1)
			throw new Error("Missing mediaName for #buildMediaNameCommand.");

		return new XML(<PharosCs>
					  <CommandList>
							<Command subsystem="media" method="get">
							  <ParameterList>
								<Parameter name="media">
								  <Value>
									<Media>
										<Name>{mediaName}</Name>
									</Media>
								  </Value>
								</Parameter>
							  </ParameterList>
							</Command>
					  </CommandList>
					</PharosCs>);
	}
};
