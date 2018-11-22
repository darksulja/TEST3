if (typeof gmoNBCFunc === "undefined") {
	print("Loading /opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
	load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
} else {
	print("Object [ gmoNBCFunc ] already lodaded");
}
if(typeof(MediaInfoHelper)==="undefined")  load("/opt/evertz/mediator/etc/runners/MediaInfoHelper.js")

var TVDInspector = function (tvd) {
	
	// Private methods do not use in your code
	this.__createMaterialObjects = function() {
        var rtn = [];
        for each (var material in this.materialList) {
            var mgetXml = materialGet(material, this.shortTextType, this.tagType, this.tracks, this.trackTypeLinks);
            var videoHeight;
            var source_format = "HD";
            if (mgetXml.track.(@type.toString() == "Video").Original_height[0] != undefined) {
                 videoHeight = mgetXml.track.(@type.toString() === "Video").Original_height[0].toString();
            } else if ( mgetXml.track.(@type.toString() === "Video").Height[0] != undefined)  {
                 videoHeight = mgetXml.track.(@type.toString() === "Video").Height[0].toString();
            // There is no media most likely
            } else {
                videoHeight = undefined;
            }

            if (gmoNBCFunc.isVarUsable(videoHeight)) {
                if (parseInt(videoHeight, 10) >= 1080 ){
                    source_format = "HD";
                } else {
                    source_format = "SD";
                }
            }

            var rtnObj = {
                matid : material,
                versiontype : mgetXml..Output.Material.VersionType.toString(),
                aspectratio : mgetXml..Output.Material.AspectRatio.toString(),
                tvdproductionnumber : mgetXml..ShortText.(ShortTextType.toString() === this.tvdShortTextType).Value.toString(),
                framerate : mgetXml..Output.Material.FrameRate.toString(),
                UHD : mgetXml..Tag.(TagType == "UHD/HDR").Value.toString(),
                source_format : source_format,
                transformation:  mgetXml..Output.Material.Transformation.Value.toString(),
                primaryLanguage : mgetXml..Tag.(TagType.toString() == "Primary Language").Value.toString(),
                secondaryLanguage : mgetXml..Tag.(TagType.toString() == "Secondary Language").Value.toString(),
                tertiaryLanguage : mgetXml..Tag.(TagType.toString() == "Tertiary Language").Value.toString(),
                territorytype : mgetXml..Tag.(TagType.toString() === this.territoryMasterTagType).Value.toString(),
                trackDefinitionList : mgetXml..TrackDefinition,
                trackTypeLinkList : mgetXml..TrackTypeLink,
                priority : 0
			}
			rtn.push(rtnObj);
		}
		return rtn;
	}

    this.__getNldStagingMediaId = function() {
        var cmd =
            <PharosCs>
                <CommandList>
                    <Command>
                        <Subsystem>media</Subsystem>
                        <Method>get</Method>
                        <ParameterList>
                            <Parameter name="media">
                                <Media>
                                    <Name>"DC_NLDStaging"</Name>
                                </Media>
                            </Parameter>
                        </ParameterList>
                    </Command>
                </CommandList>
            </PharosCs>;
        return wscall(cmd)..Output.Media.Id;
	}
		
	// Check it's possible to examine the TVD Production # specified
	if (! (this instanceof TVDInspector)) throw new Error("Please call with new() Keyword");
	if (tvd === "" || tvd === undefined) throw new Error("Cannot Inspect specified TVD # with Values [" + tvd + "]");
		
	// Fields
	this.shortTextType = "shorttext";
	this.tvdShortTextType = "TVD Production #";
	this.tagType = "tag";
    this.tracks = "tracks";
    this.trackTypeLinks = "trackTypeLinks";
	this.territoryMasterTagType = "Territory Sub-Type";
	this.telementVerType = "OM-TELEMENTS";
	this.tvdNumber = tvd;
    this.nldStagingMediaId = this.__getNldStagingMediaId();
	this.materialList = gmoNBCFunc.getMaterialsFromDataElements(this.shortTextType,this.tvdShortTextType,tvd);
	this.materialObjectsList = this.__createMaterialObjects();
	
	// Ye Olde Public Methods
	this.getMaterialList = function() {
		return this.materialList;
	}
	
	this.getMaterialObjectsList = function() {
		return this.materialObjectsList;
	}
	
	this.getNumberOfMaterials = function() {
		return this.materialList.length;
	}
		
	this.getMaterialObjectsListByAspectRatio = function(aspectRatio) {
		function matchesAspectRatio(obj) {
			return obj.aspectratio === aspectRatio;
		}
		return this.getMaterialObjectsList().filter(matchesAspectRatio);
	}
	
	this.getMaterialObjectsListByVersionType = function (versionType) {
		function matchesVersionType (obj) {
			return obj.versiontype === versionType;
		}
		return this.getMaterialObjectsList().filter(matchesVersionType);
	}
    this.getMaterialObjectsListByTrackTypeName = function(trackTypeName) {
        function matchesTrackTypeName(obj) {
            for each (var trackTypeLink in obj.trackTypeLinkList) {
                if (trackTypeLink.TrackTypeName.toString() === trackTypeName) {
                    return obj.trackTypeLinkList[trackTypeLink];
                }
            }
        }
        var materialObjectsListByTrackTypeName = this.getMaterialObjectsList().filter(matchesTrackTypeName);
        var priorityList = [];
        for each (var materialObject in materialObjectsListByTrackTypeName) {
            for each (var trackDefinition in materialObject.trackDefinitionList) {  // 1) We prioritize tracks located on the Staging Media
                if (trackDefinition.TrackTypeName == trackTypeName) {
                    if (trackDefinition..MediaId == this.nldStagingMediaId) {
                        output("Track is on the Staging Media");
                        output("Increased " + trackDefinition.TrackTypeName + " track priority for " + materialObject.matid);
                        materialObject.priority += 1;
                    }
                }
            }
            for each (var trackTypeLink in materialObject.trackTypeLinkList) {      // 2) We prioritize tracks in the state of Ready
                if (trackTypeLink.TrackTypeName == trackTypeName) {
                    if (trackTypeLink.StateName == "Ready") {
                        output("Track is in the Ready status");
                        output("Increased " + trackTypeLink.TrackTypeName + " track priority for " + materialObject.matid);
                        materialObject.priority += 1;
                    }
                }
            }
            priorityList.push(materialObject.priority); // Keep track of each material object's priority
        }
        var highestPriority = Math.max.apply(Math, priorityList);
        function matchesPriority(obj) {
            return obj.priority === highestPriority;
        }       
        return this.getMaterialObjectsList().filter(matchesTrackTypeName).filter(matchesPriority);
	}
	
	this.getMaterialObjectsByVersionTypeAndAspectRatio = function(versionType,aspectRatio) {
		function matchesVersionType (obj) {
			return obj.versiontype === versionType;
		}
		function matchesAspectRatio(obj) {
			return obj.aspectratio === aspectRatio;
		}
		return this.getMaterialObjectsList().filter(matchesVersionType).filter(matchesAspectRatio); // Should only be one 
	}
    this.getMaterialObjectsListByVersionTypeAndTrackTypeName = function(versionType, trackTypeName) {
        function matchesVersionType (obj) {
			return obj.versiontype === versionType;
		}
		function matchesTrackTypeName(obj) {
            for each (var trackDefinition in obj.trackDefinitionList) {
                if (trackDefinition.TrackTypeName == trackTypeName) {
                    return obj.trackDefinitionList[trackDefinition];
                }
            }
		}
		return this.getMaterialObjectsList().filter(matchesVersionType).filter(matchesTrackTypeName);
    }
    this.getMaterialObjectsListByAspectRatioAndTrackTypeName = function(aspectRatio, trackTypeName) {
		function matchesAspectRatio(obj) {
			return obj.aspectratio === aspectRatio;
		}
		function matchesTrackTypeName(obj) {
            for each (var trackDefinition in obj.trackDefinitionList) {
                if (trackDefinition.TrackTypeName == trackTypeName) {
                    return obj.trackDefinitionList[trackDefinition];
                }
            }
		}
		return this.getMaterialObjectsList().filter(matchesAspectRatio).filter(matchesTrackTypeName); 
    }
    this.getMaterialObjectsListByVersionTypeAspectRatioAndTrackTypeName = function(versionType, aspectRatio, trackTypeName) {
        function matchesVersionType (obj) {
			return obj.versiontype === versionType;
		}
        function matchesAspectRatio(obj) {
			return obj.aspectratio === aspectRatio;
		}
		function matchesTrackTypeName(obj) {
            for each (var trackDefinition in obj.trackDefinitionList) {
                if (trackDefinition.TrackTypeName == trackTypeName) {
                    return obj.trackDefinitionList[trackDefinition];
                }
            }
		}
		return this.getMaterialObjectsList().filter(matchesVersionType).filter(matchesAspectRatio).filter(matchesTrackTypeName);
	}

	this.getTerritoryMasterObjectsByVersionType = function(versionType, territoryMasterType) {
		function matchesVersionType (obj) {
			return obj.versiontype === versionType;
		}
		function matchesTerritoryMasterType(obj) {
			return obj.territorytype === territoryMasterType;
		}
		return this.getMaterialObjectsList().filter(matchesVersionType).filter(matchesTerritoryMasterType); // Should only be one 
	}
	
	this.getTerritoryMasterObjectsListByAspectRatio = function(aspectRatio, territoryMasterType) {
		function matchesAspectRatio(obj) {
			return obj.aspectratio === aspectRatio;
		}
		function matchesTerritoryMasterType(obj) {
			return obj.territorytype === territoryMasterType;
		}
		return this.getMaterialObjectsList().filter(matchesAspectRatio).filter(matchesTerritoryMasterType); // Should only be one 
	}	
	
	this.getTerritoryMasterObjectsByVersionTypeAspectRatio = function(versionType, aspectRatio, territoryMasterType) {
		function matchesVersionType (obj) {
			return obj.versiontype === versionType;
		}
		function matchesAspectRatio(obj) {
			return obj.aspectratio === aspectRatio;
		}
		function matchesTerritoryMasterType(obj) {
			return obj.territorytype === territoryMasterType;
		}
		return this.getMaterialObjectsList().filter(matchesVersionType).filter(matchesAspectRatio).filter(matchesTerritoryMasterType); // Should only be one 
	}
	
	this.containsVersionTypeAndAspectRatio = function(versionType,aspectRatio) {
		var __matList = this.getMaterialObjectsByVersionTypeAndAspectRatio(versionType,aspectRatio);
		return __matList.length === 1;
	}
		
}

print("Loaded [TVDInspector.js]");
