var TRANSITIONS_UTILS_LOADER = {
	/**
	 * Transitions All Track Types in a state for a Material with a specified requirement
	 * @param [matId] [The Material Id to be transitioned]
	 * @param [fromState] [The state to transition from]
	 * @param [requirement] [The requirement to use]
	 */

	// transitionMaterial : function(matId, fromState, requirement) {
	// 	if (arguments.length !== 3)
	// 		throw new Error("Missing matId, fromState, and/or requirement for #transitionMaterial.");

	// 	var trackTypeLinks = new XMLList(),
	// 			requirementParameter,
	// 			materialParameter,
	// 			transitionXml,
	// 			makeTransition = false,
	// 			materialXml = materialGet(matId, "tracktypelinks");

	// 	for each (var ttl in materialXml..Material.TrackTypeLink) {
	// 		if (ttl.StateName.toString() === fromState) {
	// 			trackTypeLinks += this.buildTrackTypeLink(ttl.TrackTypeName);
	// 			makeTransition = true;
	// 		}
	// 	}

	// 	if (makeTransition) {
	// 		requirementParameter = this.buildRequirementParameter(requirement);
	// 		materialParameter = this.buildMaterialParameter(matId, trackTypeLinks);
	// 		transitionXml = this.buildTransitionXML(materialParameter, requirementParameter);

	// 		wscall(transitionXml);
	// 	}
	// },

	// Transistions specified Track Types
	// @param [string] - of the Material Mat Id
	// @param [string] - of the requirement
	// @param [array/string] - of the track types
	// @error if less than 3 params are provided
	transitionTrackTypes : function(matId, requirement, tracktypes) {
		if (arguments.length !== 3)
			throw new Error("Missing matId, requirement, and/or tracktypes for #transitionTrackTypes.");

		// TODO: Wrap these in if statement so they don't print during tests
		// TODO: Change these to logger.info methods (throwing undefined in tests)
		print("\nAttempting to Transition Material [" + matId + "]");
		print("\nTrackTypes [" + tracktypes + "]");
		print("\nUsing Requirement [" + requirement + "]");

		var trackTypeLinks = new XMLList();

		//If they pass in one item or a string comma seperated list, make it into an array
		if ( typeof(tracktypes) === "string" ) {
            tracktypes = tracktypes.split(",");
        }
        print("\tracktypes is now an array:  [" + tracktypes + "]");
    
        if ( tracktypes.length > 0 ) {
            for each (var tt in tracktypes) {
                if (gmoNBCFunc.isVarUsable(tt)) {
                    trackTypeLinks += this.buildTrackTypeLink(tt);
                    print('Adding a tracktype, trackTypeLinks are now:' + trackTypeLinks );
                } else {
                    print('trackType value is not useful, skipping' );
                }
            }
        } else {
            throw new Error("Tracktypes list has no values, cannot transition,");
        }
		var requirementParameter = this.buildRequirementParameter(requirement),
				materialParameter = this.buildMaterialParameter(matId, trackTypeLinks),
				transitionXml = this.buildTransitionXML(materialParameter, requirementParameter);

		wscall(transitionXml);
	},

	buildTrackTypeLink : function(trackTypeName) {
		if ( !trackTypeName )
			throw new Error("Missing trackTypeName for #buildTrackTypeLink.");

		return <TrackTypeLink><TrackTypeName>{trackTypeName}</TrackTypeName></TrackTypeLink>;
	},

	buildRequirementParameter : function(requirement) {
		if ( !requirement )
			throw new Error("Missing requirement for #buildRequirementParameter.");

		return <Parameter name="requirement">
						<Value>
							<Requirement>
								<Name>{requirement}</Name>
							</Requirement>
						</Value>
					</Parameter>;
	},

	buildMaterialParameter : function(materialId, trackTypeLinks) {
		if (arguments.length !== 2)
			throw new Error("Missing materialId and/or trackTypeLinks for #buildMaterialParameter.");

		return <Parameter name="material">
						<Value>
							<Material>
								<MatId>{materialId}</MatId>
								{trackTypeLinks}
							</Material>
						</Value>
					</Parameter>;
	},

	buildTransitionXML : function(materialParameter, requirementParameter) {
		if (arguments.length !== 2)
			throw new Error("Missing materialParameter and/or requirementParameter for #buildTransitionXML.");

		return <PharosCs>
						<CommandList sessionKey={_sessionKey}>
							<Command subsystem="workflow" method="transition">
								<ParameterList>
								{materialParameter}
								{requirementParameter}
								</ParameterList>
							</Command>
						</CommandList>
					</PharosCs>;
	}
}
