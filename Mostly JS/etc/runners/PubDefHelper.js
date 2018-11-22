
PubDefHelper = function(pubDefName) {
    
    if ((this instanceof PubDefHelper) === false) {
		throw new Error("Please call constructor with new() keyword");
	}
    
    
    this.pubDefXml = wscall(
        <PharosCs>
          <CommandList>
            <Command subsystem="placing" method="getPublicationDefinition">
              <ParameterList>
                <Parameter name="publicationDefinition">
                  <Value>
                    <PublicationDefinition>
                      <Name>{pubDefName}</Name>
                    </PublicationDefinition>
                  </Value>
                </Parameter>
              </ParameterList>
            </Command>
          </CommandList>
        </PharosCs>
    );
    
    this.getPresetByType = function(presetType) {
        
        return this.pubDefXml..Preset.(PresetType.toString() == presetType);
        
    };
    
};
