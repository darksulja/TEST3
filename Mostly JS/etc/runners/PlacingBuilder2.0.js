var ReturnOfThePlacingBuilder = function () {
	// Check new keyword was used
	if (!( this instanceof ReturnOfThePlacingBuilder)) {
		throw new Error("Please call with new () keyword");
	}

	this.templateName;
	
	// Static empty XML's of one's we dont need to make multiple's of.
	this.templateParameterList = new XML(<TemplateParameterList></TemplateParameterList>);
	this.segmentBlockList = new XML(<SegmentBlockList></SegmentBlockList>);
	
	// Create empty XML objects. Need to do it like this so we don't have Java pointer issues :( <--- they suck
	// These one's are made from functions as we might need to make multiples of them.
	this.makeEmptySegmentBlock = function(){
		return new XML(<SegmentBlock></SegmentBlock>);
	},
	
	this.makeEmptySegmentLink = function(){
		return new XML(<SegmentLink></SegmentLink>);
	},
		
	
	/**
			Functions below for creating the template parameters.
	**/
	this.setTemplateName = function(templateName){
		this.templateName = templateName;
	}
	
	// Add properties :)	
	this.addTemplateParameter = function(name, value){
		var templateParameter = new XML(
		<TemplateParameter>
			<Name>{name}</Name>
			<Value>{value}</Value>
		</TemplateParameter>);
		this.templateParameterList.TemplateParameter += templateParameter;
	},
	
	this.generateWsXml = function(){
		return new XML(
			<PharosCs>
				<CommandList>
					<Command subsystem="template" method="runComponentTemplate">
						<ParameterList>
							<Parameter name="templateForm">
								<Value>
									<TemplateForm>
										<TemplateName>{this.templateName}</TemplateName>
										{this.templateParameterList}
									</TemplateForm>
								</Value>
							</Parameter>
						</ParameterList>
					</Command>
				</CommandList>
			</PharosCs>);
	},	

	/**
	*	Global "helper" template parameters
	**/
	this.setPlacingIdParam = function(placingId){
		this.addTemplateParameter("placing-id", placingId);
	},

	this.setParcelFrameRateParam = function(parcelFrameRateString){
		var parcelFrameRate = <FrameRate>{parcelFrameRateString}</FrameRate>;
        this.addTemplateParameter("parcel-framerate", parcelFrameRate);
    },
	
	this.setSegmentBlockList = function(segmentBlockXml){
		this.addTemplateParameter("segment-blockList", segmentBlockXml);
	},
	
	this.setWatermarkRequired = function(isWaterMarkRequired){
		this.addTemplateParameter("watermark-required", isWaterMarkRequired);
	},
	

	/**
		Functions below for creating the XML for segments.
	**/
	
	this.makeTempSegment = function(matId, incode, outcode, frameRate){			
		return new XML(
			<Segment>
				<Material>
					<MatId>{matId}</MatId>
				</Material>
				<MarkerIn>
					<Absolute rate={frameRate}>{incode}</Absolute>
					<FrameRate>{frameRate}</FrameRate>
				</MarkerIn>
				<MarkerOut>
					<Absolute rate={frameRate}>{outcode}</Absolute>
					<FrameRate>{frameRate}</FrameRate>
				</MarkerOut>
			</Segment>);
	},
	
	this.addSegmentBlock = function(segmentBlock){
		this.segmentBlockList += segmentBlock;
	},
	
	this.addSegmentFromTimecodes = function(matId, incode, outcode, frameRate, trackTypeName, segmentBlock){
		if (segmentBlock === undefined || segmentBlock === null){
			var segmentBlock = this.makeEmptySegmentBlock();
		}
		
		var segmentLink = this.makeEmptySegmentLink();		
		
		// Create the segment, this is likely because were "making" a segment instead of using an existing one		
		segmentLink.Segment = this.makeTempSegment(matId, incode, outcode, frameRate);
		if (trackTypeName !== undefined && trackTypeName !== null){
			segmentLink.TrackType.Name = trackTypeName;
		}
		// Auto set the StreamIndex, will this ever cause us a problem? Do we use it in the customScriptComponent?
		segmentLink.StreamIndex = segmentBlock.SegmentLink.length();
		segmentBlock.SegmentLink += segmentLink;
		return segmentBlock;
	},
	
	// Add a new segment block, or add segment to an existing segmentBlock if undefined.
	this.addSegmentFromSegmentXml = function(matId, segmentXml, trackTypeName, segmentBlock){
		if (segmentBlock === undefined || segmentBlock === null){
			var segmentBlock = this.makeEmptySegmentBlock();
		}
		
		var segmentLink = this.makeEmptySegmentLink();		
		
		// Real segments dont have MatId's in them, lets add it for now.
		segmentXml.Material.MatId = <MatId>{matId}</MatId>;
		
		segmentLink.Segment = segmentXml;
		if (trackTypeName !== undefined && trackTypeName !== null){
			segmentLink.TrackType.Name = trackTypeName;
		}
		segmentLink.StreamIndex = segmentBlock.SegmentLink.length();
		segmentBlock.SegmentLink += segmentLink;
		return segmentBlock;
	},
	
	this.addBlackSegment = function(duration, frameRate){
		var blackMatId = "BLACK_" + frameRate;
		var blackSegmentIncode = FrameLabel.parseFrames(frameRate, 0);
		var blackSegmentDuration = AmountOfTime.parseText(frameRate, duration);

		// Need to minus one frame as the system is Inclusive
		var blackSegmentOutcode = blackSegmentIncode.add(blackSegmentDuration).subtract(AmountOfTime.parseFrames(frameRate, 1));

		return this.addSegmentFromTimecodes(blackMatId, blackSegmentIncode, blackSegmentOutcode, frameRate);
	},
	
	this.addSegmentBlock = function(segmentBlock){
		this.segmentBlockList.SegmentBlock += segmentBlock;
	}

    /**
	 * Misc functions
     */
    this.saveSkeletonPlacing = function(placingId, pubDefName) {

        var placingSaveXml =
        <PharosCs>
			<CommandList>
				<Command subsystem="placing" method="save">
					<ParameterList>
						<Parameter name="placing">
							<Value>
								<Placing>
									<PlacingId>{placingId}</PlacingId>
									<PlacingPublicationList>
										<PlacingPublication>
											<PublicationDefinition>
												<Name>{pubDefName}</Name>
											</PublicationDefinition>
										</PlacingPublication>
									</PlacingPublicationList>
								</Placing>
							</Value>
						</Parameter>
					</ParameterList>
				</Command>
			</CommandList>
		</PharosCs>;

        if(debug) print("\n Placing Save Xml [" + placingSaveXml + "]");
        print("\nAttempting Placing Save for [" + placingId + "] for Profile [" + pubDefName + "]");
        return wscall(placingSaveXml).CommandList.Command.@success.toString() === "true";
    }
}
