var DestSpecificMetadataModule = function (domainType, domainObject, pubDefName) {
		
	if (!(this instanceof DestSpecificMetadataModule)) throw new Error("\nPlease call with new () keyword");
		
	// Check Domain Type is valid
	this.acceptedDomainTypes = ["material"];
	if (this.acceptedDomainTypes.indexOf(domainType) === -1) throw new Error("\nError: Domain Type is not supported");
	if (pubDefName === undefined) throw new Error("\nError: Pub Def set to [" + pubDefName + "] in DestSpecificMetadataModule");
		
	// Main Properties
	this.pubDef = pubDefName;
	this.domainType = domainType;
	this.domainObject = domainObject;
	this.hasDestSpecificMetadata = false;
	this.debug = debug === false  || debug === undefined ? false : true;
	this.searchableDomainTypeList  = { episode : "Episode", brand : "Brand", series : "Series" };
	this.webServiceGetXml = { 
		
		material : <PharosCs>
						  <CommandList>
							<Command subsystem="material" method="get">
							  <ParameterList>
								<Parameter name="matId" value={this.domainObject}/>
								 <Parameter name="options">
								  <Value>
									<MaterialOptions>
									  <Option>brand</Option>
									  <Option>series</Option>
									  <Option>episode</Option>
									</MaterialOptions>
								  </Value>
								</Parameter>
								  <Parameter name="episodeOptions">
								  <Value>
									<EpisodeOptions>
									  <Option>destinationSpecificMetadata</Option>
									</EpisodeOptions>
								  </Value>
								</Parameter>
								<Parameter name="seriesOptions">
								  <Value>
									<SeriesOptions>
									  <Option>destinationSpecificMetadata</Option>
									</SeriesOptions>
								  </Value>
								</Parameter>
								<Parameter name="brandOptions">
								  <Value>
									<BrandOptions>
									  <Option>destinationSpecificMetadata</Option>
									</BrandOptions>
								  </Value>
								</Parameter>
								</ParameterList>
							  </Command>
							</CommandList>
						</PharosCs>
	}
		
	this.domainObjectGetXml = wscall(this.webServiceGetXml[this.domainType]);
	this.hasDestSpecificMetadata = this.domainObjectGetXml..DestinationSpecificMetadataLink.(PubDefName.toString() === this.pubDef).length() > 0;
	
	// Public Methods 
		
	// Checks to see whether the Specicied Entity is linked to any Destination Specific Metadata
	// @return [boolean] - Indicating whether Dest Specific Metadata exits
	this.containsDestSpecificMetadata = function() {
		return this.hasDestSpecificMetadata;
	}
		
	// Extract Destination Specifc Metadata for a Material
	// @return [object] (Blank if no associated Destination Specific Metadata) - Do not change this. This is useful as the calling scripts can use the fact that a speicifc proerty is undefined to make decisions
	// @return [object] Containing 3 properties. Each an object containing the associated Destination Specific Metadata
	this.extractDestinationSpecificMetaData__Material = function () {
		if(debug) print("\nDestSpecificMetadataHelper.extractDestinationSpecificMetaData__Material()");
		
		if (this.hasDestSpecificMetadata === false) {
			print("\nDestination Specific Metadata Links do not exist. Returning Empty Object so Script can make use of certain propeties being undefined");
			return {};
		}
			
		var allEntitySpecificPubDefXml = this.domainObjectGetXml..DestinationSpecificMetadataLink.(PubDefName.toString() === this.pubDef);
			
		var rtnObj = {};
		// Find Values for Episode
		rtnObj["episodeMetadata"] = this.__extractDestSpecificMetadataByEntity(allEntitySpecificPubDefXml, this.searchableDomainTypeList.episode);
		// Find Values for Series
		rtnObj["seriesMetadata"] = this.__extractDestSpecificMetadataByEntity(allEntitySpecificPubDefXml, this.searchableDomainTypeList.series);
		// Find Values for Brand
		rtnObj["brandMetadata"] = this.__extractDestSpecificMetadataByEntity(allEntitySpecificPubDefXml, this.searchableDomainTypeList.brand);
		
		return rtnObj;
	}
		
	// Extract Destination Specifc Metadata for a Material but return the most appropriate value // Episode --> Series --> Brand
	// @return [object] (Blank if no associated Destination Specific Metadata) This is useful as the calling scripts can use the fact that a speicifc proerty is undefined to make decisions
	// @return [object] containing the associated Destination Specific Metadata
	this.extractDestinationSpecicMetadataEpisodeToBrandHierarchy__Material = function() {
			
		if (this.hasDestSpecificMetadata === false) {
			print("\nDestination Specific Metadata Links do not exist. Returning Empty Object so Script can make use of certain propeties being undefined");
			return {};
		}
			
		// Once a data element is used store it here to avoid it being used again
		var usedDataElements = [];
		
		// Get all the Dest Specific Metadata 
		var noneHierarchialMetaDataObj = this.extractDestinationSpecificMetaData__Material();
			
		// Define the Return Props and object
		var hierarchialMetaDataObj = {};
	
		// Episode
		for (var episodeKeyPairProp in noneHierarchialMetaDataObj.episodeMetadata) {
				
			// Don`t add a data elemnt already used
			if (usedDataElements.indexOf(episodeKeyPairProp) > -1) {
				continue;
			}
			// Add to return object
			hierarchialMetaDataObj[episodeKeyPairProp] = noneHierarchialMetaDataObj.episodeMetadata[episodeKeyPairProp];
			// Indicate that Values has now been used
			usedDataElements.push(episodeKeyPairProp)
		}
			
		// Series
		for (var seriesKeyPairProp in noneHierarchialMetaDataObj.seriesMetadata) {
				
			// Don`t add a data elemnt already used
			if (usedDataElements.indexOf(seriesKeyPairProp) > -1) {
				continue;
			}
			// Add to return object
			hierarchialMetaDataObj[seriesKeyPairProp] = noneHierarchialMetaDataObj.seriesMetadata[seriesKeyPairProp];
			// Indicate that Values has now been used
			usedDataElements.push(seriesKeyPairProp);
		}
			
		// Brand
		for (var brandKeyPairProp in noneHierarchialMetaDataObj.brandMetadata) {
				
			// Don`t add a data elemnt already used
			if (usedDataElements.indexOf(brandKeyPairProp) > -1) {
				continue;
			}
			// Add to return object
			hierarchialMetaDataObj[brandKeyPairProp] = noneHierarchialMetaDataObj.brandMetadata[brandKeyPairProp];
			// Indicate that Values has now been used
			usedDataElements.push(brandKeyPairProp);
		}
			
		return hierarchialMetaDataObj;
	}	
		
	// Extract Metadata by entity
	// @param [xml] - Xml of Dest Specific Metadata. Outter node should be <DestinationSpecificMetadataLinks>
	// @param [string] - Name of the Domain Type to extract. 
	// @return [object] containing Data Element Type : Value
	this.__extractDestSpecificMetadataByEntity = function(desSpecificPubDefXmlList , entity) {
		if (debug) print("\nPlacingHelper.__extractDestSpecificMetadataByEntity()");
			
		var rtnObj = {};
		var ordinalTypes = ["ordinal set", "ordinal expanding set"];
		
		var specificEntityXml = desSpecificPubDefXmlList.(DomainType.toString() === entity);
		if (debug) print("\nDebug: Entity [" + entity + "] Xml \n" + specificEntityXml + "\n"); 				
			
		// Full Text
		for each(var fullText in specificEntityXml..FullText) {
				
			var fullTextType = fullText.FullTextType.toString();
			var fullTextValue = fullText.Value.toString();
			if(debug) print("\nDebug: Adding FullText Type [" + fullTextType + "] with Value [" + fullTextValue + "]");
			rtnObj[fullTextType] = fullTextValue;
				
		}
		//Short Text 
		for each (var shortText in specificEntityXml..ShortText) {
				
			var shortTextType = shortText.ShortTextType.toString();
			var shortTextValue = shortText.Value.toString();
			var shortTextValuePopulated = shortTextValue !== "";
			if(debug) print("\nDebug: Adding ShortText Type [" + shortTextType + "] with Value [" + shortTextValue + "]");
			rtnObj[shortTextType] = shortTextValue;
			
		}
		// Tag
		for each(var tag in specificEntityXml..Tag) {
				
			var tagType = tag.TagType.toString();
			var tagValue = tag.Value.toString();
			var isOrdinal = ordinalTypes.indexOf(tagType);
			if(debug) print("\nDebug: Adding Tag [" + tagType + "] with Value [" + tagValue + "] Ordinal? [" + isOrdinal + "]");
			
			if (isOrdinal && rtnObj[tagType] === undefined) { // Ordinal not encountered before make array
					
				rtnObj[tagType] = [];
				rtnObj[tagType].push(tagValue);
					
			} else if (isOrdinal) { // Ordinal encoutered before adding to array
					
				rtnObj[tagType].push(tagValue);
					
			} else { // Standard Tag with one value
					
				rtnObj[tagType] = tagValue;
			}
		}
		return rtnObj;
	}
		
}