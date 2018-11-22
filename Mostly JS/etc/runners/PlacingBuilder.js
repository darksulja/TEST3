var PlacingBuilder = function (placingId, pubDefName, materialSegmentGroupPairObjList, templateName, parcelFrameRate, headerRequired, destSpecificMetadataObj, debug) {
	// Check new keyword was used
	if (!( this instanceof PlacingBuilder)) {
		throw new Error("Please call with new () keyword");
	}
		
	//Methods that are involved in init
	this.__checkForPromo = function() {
		// If no Dest Specific Metadata passed in look
		if (destSpecificMetadataObj === undefined ) {
			return false;
		}
		
		var promoMatId = this.destSpecificMetadataObj["Main Promo Material"]; // Hard Coding is left in whilst the a decision is made as to how to handle this. Most likely a Mapping Object in the Setting File
		return promoMatId === undefined ? false : true;
	} 
		
	// "Init "Fields - no decent init method in JS so set explicity from args to avoid confusion
	this.placingId = placingId;
	this.pubDefName = pubDefName;
	this.materialSegmentGroupPairObjList = materialSegmentGroupPairObjList;
	this.templateName = templateName;
	this.parcelFrameRate = parcelFrameRate;
	this.headerRequired = headerRequired;
	this.destSpecificMetadataObj = destSpecificMetadataObj;
	this.insertPromo = this.__checkForPromo(); 
	this.debug = debug === false  || debug === undefined ? false : true;
		
	// Other Fields
	this.templateParamListCompound = <TemplateParameterListCompound/>;
	this.segmentMatIdParamName = "segment-matId";
	this.segmentGroupParamName = "segment-segmentGroup";
	this.segmentIndexParamName = "segment-segmentIndex";
	this.templateParameterType = "template parameter";
	this.defaultWholeMaterialSegmentGroup = "Whole Material";
	this.defaultWholeMaterialIndex = 1;
	this.defaultHeaderSegmentGroup = "Header";
	this.defaultHeaderIndex = 1;
	this.somEOMSegmentGroup = "SOM / EOM";
	this.breakPatternGroup = "Break Patterns";
	
	// Methods
		
	this.__getPromoMatId = function() {
		var promoMatId = this.destSpecificMetadataObj["Main Promo Material"];
		return promoMatId === undefined ? undefined : promoMatId;
	}
		
	this.__buildPromoTemplateXml = function() {
			
		if(this.debug) this.__debugOutput("this.__buildPromoTemplateXml()");
		print("\nPromo Required - Building Template Xml");
		
		var promoMatId = this.__getPromoMatId();
		var promoMaterialHelper = new gmoNBCFunc.materialHelper(promoMatId);
		
		var hasWholeMaterialSegmentAtDefaultIndex = promoMaterialHelper.getSegmentsByGroup(this.defaultWholeMaterialSegmentGroup).Segment.(parseInt(Index) === this.defaultWholeMaterialIndex).length() === 1;
		
		if (hasWholeMaterialSegmentAtDefaultIndex === false) {
			
			print("\nNo [" + this.defaultWholeMaterialSegmentGroup + "] Segment at Index [" + this.defaultWholeMaterialIndex + "] currently exists for [" + promoMatId + "] Creating...");
			var mainMedia = promoMaterialHelper.findMainStoreMedia();
			if (mainMedia === undefined) throw new Error("\nPromo Material [" + promoMatId + "] does not exist on a Valid Store / T2 Media to get Incode / Outocde From");
			
			var mainMediaTrackXml = promoMaterialHelper.getTrackXmlByMedia(mainMedia);
			var incode = mainMediaTrackXml.Incode.toString();
			var outcode = mainMediaTrackXml.Outcode.toString();
			
			// Add and Save Segment
			promoMaterialHelper.addSegmentToSaveXml(incode, outcode, this.defaultWholeMaterialSegmentGroup, this.defaultWholeMaterialIndex);
			var saveWholeMaterialSegment = promoMaterialHelper.saveUsingSaveXml();
			if (saveWholeMaterialSegment === false) throw new Error("\nFailed to save [" + this.defaultWholeMaterialSegmentGroup + "] Segment for [" + promoMatId + "]");
			
		} else {
			
			print("\nSuccess [" + this.defaultWholeMaterialSegmentGroup + "] Segment at Index [" + this.defaultWholeMaterialIndex + "] currently exists for [" + promoMatId + "] Using.");
			
		}
	
		// Create a TemplateParamXml
		print("Creating Template Xml for Material [" + promoMatId + "] Segment Group [" + this.defaultWholeMaterialSegmentGroup + "]\n\tCreating Segment at Index [" + this.defaultWholeMaterialIndex + "]");
		var promoTemplateListParamXml = this.__createTemplateListParamXml_MATSEGMENT(promoMatId, this.defaultWholeMaterialSegmentGroup, this.defaultWholeMaterialIndex);
		if (this.debug) this.__debugOutput("Adding Promo Template to List");
		this.addtoTemplateParameterListCompound(promoTemplateListParamXml); 
			
		return true;
	}
		
	// Public Methods	
	// Quick way of attching Placing to Pub Def.
	this.buildSkeletonPlacing = function() {
		return (this.__saveSkeletonPlacing());
	}
			
	// Full on Build Method
	this.buildPlacing = function() {
		print("\nBuilding Placing for [" + this.placingId + "]");		
			
		// Check to See if a Header was required and build a TemplateParameterListXml
		if(this.headerRequired) {
			if (this.debug) this.__debugOutput("Building Header");
			var headerBuilt = this.__buildHeaderTemplateXml();
			if (headerBuilt !== true) throw new Error("Failed to Build Header Template");
		}
		
		// Check to see whether a Promo Should be inersted
		if (this.insertPromo) {
			if (this.debug) this.__debugOutput("Building Promo");
			var promoEventBuilt = this.__buildPromoTemplateXml(); 
			if (promoEventBuilt !== true) throw new Error("Failed to Build Promo Template");
		}
			
		// Build TemplateParameterListXml for the Specified Materials
		if (this.debug) this.__debugOutput("Building Templates from Specified Materials");
		var materialTemplateXmlBuilt = this.__buildMaterialTemplateXml();
		if (materialTemplateXmlBuilt !== true) throw Error("Failed to Build Template Xml from Materials");
			
		// Save Placing		
		return (this.__savePlacing());			
	}
		
	// Private Methods
	this.__debugOutput = function(str) {
		var debugPrefix = "\nPLACING BUILDER DEBUG LOG: ";
		print(debugPrefix + str);
	}
				
	this.__buildHeaderTemplateXml = function () {
			
		if(this.debug) this.__debugOutput("this.__buildHeaderTemplateXml()");
		print("\nHeader Required - Building");
			
		// Currently assumed to be the first Material
		var headerMatId = this.materialSegmentGroupPairObjList[0].matid;
		var headerMatIdMaterialHelper = new gmoNBCFunc.materialHelper(headerMatId);
		
		var hasHeaderSegmentAtDefaultIndex = headerMatIdMaterialHelper.getSegmentsByGroup(this.defaultHeaderSegmentGroup).Segment.(parseInt(Index) === this.defaultHeaderIndex).length() === 1;
		
		if (hasHeaderSegmentAtDefaultIndex === false) {
			
			print("\nNo [" + this.defaultHeaderSegmentGroup + "] Segment at Index [" + this.defaultHeaderIndex + "] currently exists for [" + headerMatId + "] Creating...");
			var mainMedia = headerMatIdMaterialHelper.findMainStoreMedia();
			if (mainMedia === undefined) throw new Error("\nHeader Material [" + headerMatId + "] does not exist on a Valid Store / T2 Media to get Incode / Outocde From");
			
			var mainMediaTrackXml = headerMatIdMaterialHelper.getTrackXmlByMedia(mainMedia);
			var somEOMSegmentList = headerMatIdMaterialHelper.getSegmentsByGroup(this.somEOMSegmentGroup);
			if (somEOMSegmentList.Segment.length() == 0) {
				// No SOM /  EOM Segment - try Break Patterns			
				output("No SOM/EOM Segment - Trying using [" + this.breakPatternGroup + "]");
				somEOMSegmentList = headerMatIdMaterialHelper.getSegmentsByGroup(this.breakPatternGroup);
				if (somEOMSegmentList.Segment.length() == 0) {
					// Final Check
					throw new Error("Trying to add Header but could not find Segment information for [" + this.somEOMSegmentGroup + "] or [" + this.breakPatternGroup + "]");
				} else {
					// First Segment From Break Patterns
					var somEomSegmentIncode = somEOMSegmentList.Segment.(Index == 1).MarkerIn.Absolute; // Taken From Segment 1
				}
			} else {
				// First Segment From SOM / EOM
				var somEomSegmentIncode = somEOMSegmentList.Segment[0].MarkerIn.Absolute; // Use the first for the Time Being
			}

			// Take Incode from Main Store Track In / Calculate outcode by subtracting 1 frame from the SOM / EOM Segment Group
			var incode = mainMediaTrackXml.Incode.toString();
			
			if (somEomSegmentIncode == false) throw new Error("\nFailed to Find Incode for a Segment with Group [" + this.somEOMSegmentGroup + "]");
			var outcode = FrameLabel.parseText(headerMatIdMaterialHelper.getMaterialFrameRate(), somEomSegmentIncode).subtract("00:00:00:01").toString();
				
			
			if (incode == somEomSegmentIncode) {
				print("Track Incode is the Same as SOM/EOM Incode - Material Must Have No Header - Not Adding");
				return true;
			}
			
			// Add and Save Segment
			headerMatIdMaterialHelper.addSegmentToSaveXml(incode, outcode, this.defaultHeaderSegmentGroup, this.defaultHeaderIndex);
			var saveHeaderMaterialSegment = headerMatIdMaterialHelper.saveUsingSaveXml();
			if (saveHeaderMaterialSegment === false) throw new Error("\nFailed to save [" + this.defaultHeaderSegmentGroup + "] Segment for [" + headerMatId + "]");
			
		} else {
			
			print("\nSuccess [" + this.defaultHeaderSegmentGroup + "] Segment at Index [" + this.defaultHeaderIndex + "] currently exists for [" + headerMatId + "] Using.");
			
		}
	
		// Create a TemplateParamXml
		print("Creating Template Xml for Material [" + headerMatId + "] Segment Group [" + this.defaultHeaderSegmentGroup + "]\n\tCreating Segment at Index [" + this.defaultHeaderIndex + "]");
		var headerTemplateListParamXml = this.__createTemplateListParamXml_MATSEGMENT(headerMatId, this.defaultHeaderSegmentGroup, this.defaultHeaderIndex);
		if (this.debug) this.__debugOutput("Adding Header Template to List");
		this.addtoTemplateParameterListCompound(headerTemplateListParamXml); 
		
		return true;
	}
		
	this.__buildMaterialTemplateXml = function() {
		if(this.debug) this.__debugOutput("this.__buildMaterialTemplateXml()");
		// Build a TemplateParameterListXml for each specified Material and Segement Group Pairing
		for each (var materialSegmentGroupPairObj in this.materialSegmentGroupPairObjList) {
			var matId = materialSegmentGroupPairObj.matid;
			var segmentGroup = materialSegmentGroupPairObj.segmentgroup;
			// Get Segment group of interest 
			print("\n");
			var segmentXml = new gmoNBCFunc.materialHelper(matId).getSegmentsByGroup(segmentGroup);
			print("Creating Template Xml for Material [" + matId + "] Segment Group [" + segmentGroup + "]");
			// Check there are Segments
			if (segmentXml.Segment.length() === 0) throw new Error("No Segments defined for Group [" + segmentGroup + "] on Material [" + matId + "]");
			// Create an Xml List of Template Paramater Xml Nodes - for Material and Segments for Group
			var matSegmentGroupPairTemplateParamXml = this.__createTemplateParamListFromMaterialSegmentGroup(matId,segmentXml);
			// Add to the Ongoing Xml List Object that's being created
			this.addtoTemplateParameterListCompound(matSegmentGroupPairTemplateParamXml);
		}
		return true;
	}
		
	this.__createTemplateParamListFromMaterialSegmentGroup = function(matId,segmentXml) {
		if(this.debug) this.__debugOutput("this.__createTemplateParamListFromMaterialSegmentGroup()");
		var rtn = new XMLList();
		// Loop through each Segment creating a Template Parameter List Xml for each Segment contained in the Group. 
		// Check at lest one segmetn extis for the group
		for each(var segment in segmentXml.Segment){
			var segmentIndex = segment.Index.toString();
			var segmentGroup = segment.SegmentGroup.Name.toString();
			var segmentIncode = segment.MarkerIn.Absolute.toString();
			var segmentOutcode = segment.MarkerOut.Absolute.toString();
			print("\t Creating Segment at Index [" + segmentIndex + "] Incode [" + segmentIncode + "] Outcode [" + segmentOutcode + "]");
			rtn += this.__createTemplateListParamXml_MATSEGMENT(matId,segmentGroup,segmentIndex);
		}
		return rtn;
	}
		
	this.__createTemplateListParamXml_MATSEGMENT = function (value1,value2,value3) {
		if(this.debug) this.__debugOutput("this.__createTemplateListParamXml_MATSEGMENT()");
		
		var templateParamObj1 = {value : value1, name : this.segmentMatIdParamName, type : this.templateParameterType};
		var templateParamObj2 = {value : value2, name : this.segmentGroupParamName, type : this.templateParameterType};
		var templateParamObj3 = {value : value3, name : this.segmentIndexParamName, type : this.templateParameterType};
		
		return this.__createTemplateParameterFromTemplateObjects(templateParamObj1,templateParamObj2,templateParamObj3);
	}
		
	this.__createTemplateParameterFromTemplateObjects = function(templateParamObj1,templateParamObj2,templateParamObj3) {
		if(this.debug) this.__debugOutput("this.__createTemplateParameterFromTemplateObjects()");
	
		var __templateParamList = this.__makeEmptyTemplateParameterList();
		if (arguments.length !== 3) throw new Error("this.__createTemplateParameterList requires exactly 3 arguments [" + arguments.length + "] specified");
		
		for (var i=0; i<arguments.length;i++) {
			__templateParamList.TemplateParameter[i].Value = arguments[i].value;
			__templateParamList.TemplateParameter[i].Name = arguments[i].name;
			__templateParamList.TemplateParameter[i].Type = arguments[i].type;
		}
			
		return __templateParamList;
	}
		
	this.addtoTemplateParameterListCompound = function(templateParamListXml){
		if(this.debug) this.__debugOutput("this.addtoTemplateParameterListCompound()");
		this.templateParamListCompound.appendChild(templateParamListXml);
	}
		
	this.getTemplateParameterCompoundList = function() {
		if(this.debug) this.__debugOutput("this.addtoTemplateParameterListCompound()");
		return this.templateParamListCompound;
	}
				
	this.__makeEmptyTemplateParameter = function() {
		if(this.debug) this.__debugOutput("this.__makeEmptyTemplateParameter()");
		return <TemplateParameter><Value/><Name/><Type>template parameter</Type></TemplateParameter>;
	}
		
	this.__makeEmptyTemplateParameterList = function(){
		if(this.debug) this.__debugOutput("this.__makeEmptyTemplateParameterList()");
		return <TemplateParameterList>{this.__makeEmptyTemplateParameter()}{this.__makeEmptyTemplateParameter()}{this.__makeEmptyTemplateParameter()}</TemplateParameterList>;
	}
		
	this.__saveSkeletonPlacing = function() {
			
		var placingSaveXml = 
			<Placing>
				<PlacingId>{this.placingId}</PlacingId>
				<PlacingPublicationList>
					<PlacingPublication>
						<PublicationDefinition>
								<Name>{this.pubDefName}</Name>
						</PublicationDefinition>
					</PlacingPublication>
				</PlacingPublicationList>
			</Placing>;	
				
		var placingSaveXml =
	    		<PharosCs>
				  <CommandList>
					<Command subsystem="placing" method="save">
					  <ParameterList>
						<Parameter name="placing">
						  <Value>
							 {placingSaveXml}
						  </Value>
						</Parameter>
					  </ParameterList>
						</Command>
					  </CommandList>
					</PharosCs>;
					
		if(this.debug) this.__debugOutput("\n Placing Save Xml [" + placingSaveXml + "]");
		print("\nAttempting Placing Save for [" + this.placingId + "] for Profile [" + this.pubDefName + "]");
		return wscall(placingSaveXml).CommandList.Command.@success.toString() === "true";			
	}
		
	this.__savePlacing = function() {
			
		var templateXml = this.getTemplateParameterCompoundList();
		print("\nBuilding Placing Save Xml");
		var placingSaveXml = 
				<Placing>
					<PlacingId>{this.placingId}</PlacingId>
					<PlacingPublicationList>
						<PlacingPublication>
							<PublicationDefinition>
									<Name>{this.pubDefName}</Name>
							</PublicationDefinition>
						</PlacingPublication>
					</PlacingPublicationList>
					<PlacingParcelList>
						<PlacingParcel>
							<Parcel>
								<ParcelType>Placing</ParcelType>
								<FrameRate>{this.parcelFrameRate}</FrameRate>
								<TemplateName>{this.templateName}</TemplateName>
								<TemplateParameterList>
									<TemplateParameter>
										<Name>materials-compoundList</Name>
											<Value>
												{templateXml}
											</Value>
										<Name>list-compoundList</Name>
										<Type>template parameter</Type>
									</TemplateParameter>
								</TemplateParameterList>
							</Parcel>
						</PlacingParcel>
					</PlacingParcelList>
				</Placing>;
						
		var placingSaveXml =
				<PharosCs>
				  <CommandList>
					<Command subsystem="placing" method="save">
					  <ParameterList>
						<Parameter name="placing">
						  <Value>
						     {placingSaveXml}
						  </Value>
						</Parameter>
					  </ParameterList>
					</Command>
				  </CommandList>
				</PharosCs>;
			
		if(this.debug) this.__debugOutput("\n Placing Save Xml [" + placingSaveXml + "]") ;
		print("\nAttempting Placing Save for [" + this.placingId + "] for Profile [" + this.pubDefName + "] at Frame Rate [" + this.parcelFrameRate + "] using Template [" +this.templateName + "]");
		return wscall(placingSaveXml).CommandList.Command.@success.toString() === "true";								 
	} 
}
	





