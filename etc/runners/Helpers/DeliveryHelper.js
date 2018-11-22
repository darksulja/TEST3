function updateStatusMap(message, percent){ 
    /*
     * Updates the job status board with the given parameters 
     * "JOB__STATUS", "JOB__PROGRESS" 
     */
	var keyPairs = {"JOB__STATUS" : message, "JOB__PROGRESS" : percent};
	updateStatus(keyPairs);
}

function updateStatus(keyPairs){
    var mapping = <Mapping></Mapping>;

    for (var key in keyPairs) {
        mapping[key] = keyPairs[key];
    }
    var command = <PharosCs>
                        <CommandList>
                            <Command subsystem="job" method="updateStatusMap">
                                <ParameterList>
                                    <Parameter name="jobId" value={_jobId}/>
                                    <Parameter name="jobInfo">
                                        <Value>
                                            {mapping}
                                        </Value>
                                    </Parameter>
                                </ParameterList>
                            </Command>
                        </CommandList>
                    </PharosCs>;
    wscall(command);
}


function getPresetXML(presetName){
    /*
     * Returns an XML of the preset.
     */
    var cmd = <PharosCs>
        <CommandList>
        <Command subsystem="preset" method="get">
            <ParameterList>
            <Parameter name="presetName" value={presetName}/>
            <Parameter name="options">
                <Value>
                <PresetOptions>
                    <Option>shorttext</Option>
                    <Option>tag</Option>
                </PresetOptions>
                </Value>
            </Parameter>
            </ParameterList>
        </Command>
        </CommandList>
    </PharosCs>;

 
    return wscall(cmd);
}

function getPlacingXML(placingId){
	/*
	 * Returns the main material Id given the placingId. Throws an
	 * error if the placing does not have a main material.
	 */
	var cmd = <PharosCs>
		<CommandList>
			<Command subsystem="placing" method="get">
			<ParameterList>
				<Parameter name="placingId" value={placingId}/>
				<Parameter name="options">
				  <Value>
					<PlacingOptions>
					  <Option>destination</Option>
					</PlacingOptions>
				  </Value>
				</Parameter>
			</ParameterList>
			</Command>
		</CommandList>
	</PharosCs>

	return wscall(cmd);
}

function getMaterialXML(matId){
	/*
	 * Returns the material xml given the material Id.
	 */
	var cmd =
	<PharosCs>
		<CommandList>
		<Command subsystem="material" method="get">
		  <ParameterList>
			<Parameter name="matId" value={matId}/>
			<Parameter name="options">
			  <Value>
				<MaterialOptions>
                  <Option>tracks</Option>
				  <Option>shorttext</Option>
				  <Option>tracktypelinks</Option>
				</MaterialOptions>
			  </Value>
			</Parameter>
		  </ParameterList>
		</Command>
	  </CommandList>
    </PharosCs>
    return wscall(cmd);
}
