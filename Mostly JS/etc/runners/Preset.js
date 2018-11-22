/*
* @Author: Mike Ayubi
* @Date:   2017-05-11
* @Last Modified by: Mike Ayubi
*/

if (typeof gmoNBCFunc === "undefined") {
	print("Loading /opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
	load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
} else {
	print("Object [ gmoNBCFunc ] already lodaded");
}

var Preset = function (presetName, options) {

	this.__presetName = presetName;
	if (gmoNBCFunc.isVarUsable(options)){
		this.__options = options;
	}else{
		this.__options = ['shorttext','markup','fulltext','tag'];
	}
	this.__presetXml;
	this.__shorttextXml;
	this.__fulltextXml;
	this.__tagXml;
	this.__markupXml;
	this.__exists;

	//Private method for api call to instatiate - DO NOT CALL OUTSIDE HERE
	this.initialize = function(){
		print("Preset() initialized with preset named [" + this.__presetName + "]");

		var optionXml = <PresetOptions></PresetOptions>;
		for each (var option in this.__options){
			optionXml.appendChild(<Option>{option}</Option>)
		}

		var xml = <PharosCs>
			  <CommandList>
				<Command subsystem="preset" method="get">
				  <ParameterList>
					<Parameter name="presetName" value={this.__presetName}/>
					<Parameter name="options">
					  <Value>{optionXml}</Value>
					</Parameter>
				  </ParameterList>
				</Command>
			  </CommandList>
			</PharosCs>;
		
		
		try{
			var command = wscall(xml);
			this.__exists = command..Command.@success.toString() === "false" ? false : true;
			this.__presetXml = command..Output.Preset;
			this.__shorttextXml = this.__presetXml.ShortTextList;
			this.__fulltextXml = this.__presetXml.FullTextList;
			this.__tagXml = this.__presetXml.TagList;
			this.__markupXml = this.__presetXml.Markup;
		}catch(e){
			this.__exists = false;
			print("WARNING: Preset named [" + this.__presetName + "] does not exist.");
		};
	}

	//PUBLIC METHODS
	this.getName = function (){
		return this.__presetName;
	}

	this.getId = function(){
		if(!this.__exists) throw new Error("Preset [" + this.__presetName + "] does not exist.");
		return this.__presetXml.Preset.@["Id"].toString();
	}

	this.getDescription = function() {
		if(!this.__exists) throw new Error("Preset [" + this.__presetName + "] does not exist.");
		return this.__presetXml.Description.toString();
	}
	
	this.isCommon = function() {
		if(!this.__exists) throw new Error("Preset [" + this.__presetName + "] does not exist.");
		var common =  this.__presetXml.Common.toString().toLowerCase();
		return (common == 'true');
	}
	
	this.getType = function() {
		if(!this.__exists) throw new Error("Preset [" + this.__presetName + "] does not exist.");
		return this.__presetXml.PresetType.toString();
	}

	this.exists = function() {
		return this.__exists;
	}

	this.getDataElementValue = function(type,key){
		if(!this.__exists) throw new Error("Preset [" + this.__presetName + "] does not exist.");

		if(type.toString().toLowerCase() == "shorttext"){
			var value =  this.__shorttextXml.ShortText.(ShortTextType == key.toString());
		}else if(type.toString().toLowerCase() == "fulltext"){
			var value =  this.__fulltextXml.FullText.(FullTextType == key.toString());			
		}
		else if(type.toString().toLowerCase() == "tag"){
			var value =  this.__tagXml.Tag.(TagType == key.toString());			
		}else{
			throw new Error("Invalid data element type [" + type + "] on Preset. Valid options are 'shorttext','fulltext', and 'tag'");
		}
		if(!gmoNBCFunc.isVarUsable(value)) throw new Error("Invalid data element type [" + type + "] and key [" + key + "] supplied. No value found.");

		return value.Value.toString();
	}


	this.getDataElementsByPrefix = function(type,keyPrefix){
		if(!this.__exists) throw new Error("Preset [" + this.__presetName + "] does not exist.");

		if(type.toString().toLowerCase() == "shorttext"){
			var elements =  this.__shorttextXml.ShortText.(gmoNBCFunc.startsWith(ShortTextType.toString(),keyPrefix));
			var dataElementType = "ShortTextType";
		}else if(type.toString().toLowerCase() == "fulltext"){
			var elements =  this.__fulltextXml.FullText.(gmoNBCFunc.startsWith(FullTextType.toString(),keyPrefix));
			var dataElementType = "FullTextType";
		}
		else if(type.toString().toLowerCase() == "tag"){
			var elements =  this.__tagXml.Tag.(gmoNBCFunc.startsWith(TagType.toString(),keyPrefix));
			var dataElementType = "TagType";
		}else{
			throw new Error("Invalid data element type [" + type + "] on Preset. Valid options are 'shorttext','fulltext', and 'tag'");
		}

		var returnElements = [];
		for each (var element in elements){
			var elementObj = new Object();
			elementObj.key = element.Key.toString();
			elementObj.type = element[dataElementType].toString();
			elementObj.value = element.Value.toString();
			elementObj.ordinality = element.Ordinality.toString();
			returnElements.push(elementObj);
		}

		returnElements.sort(function(a, b){
		    var typeA=a.type.toLowerCase();
		    var typeB=b.type.toLowerCase();
		    if (typeA < typeB) return -1;
		    if (typeA > typeB) return 1;
		    return 0 ;
		});

		return returnElements;
	}

	this.getShortTexts = function(){
		return this.__shorttextXml.ShortText;
	}

	this.getTags = function(){
		return this.__tagXml.Tag;
	}

	//Internal Init
	this.initialize();
}

print("Loaded [Preset.js]");
