/*
* @Author: Karthik Rengasamy
* @Date:   2017-03-26 17:54:12
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-04-05 23:05:04
*/

FileNameHelper = function(entityId,entityType) {

	if ((this instanceof FileNameHelper) === false) {
		throw new Error("Please call constructor with new() keyword");
	}
	
	if(typeof(gmoNBCFunc)==="undefined"){
		print("Loading nbcgmo_fun")
		load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");	
	}

	print("\FileNameHelper() initialization");
	
    this.__matId = "";
    this.__placingId = "";
    this.__fileNameOptions = "";
    this.__fileNameSeparator = "";
    this.__fileNameTagDataElement = "";
	this.__fileNameIterator = "";
	this.__fileNameOverrides = ""; 

    if(entityType == "Placing"){
        //Set Placing Identifier & Load Placing
        this.__placingId = entityId;
    }else if (entityType == "Material"){
        //Set Material Identifier & Load Material
        this.__matId = entityId;
        this.__material = gmoNBCFunc.materialGetFull(this.__matId)..Material;
        this.__episode  = this.__material.Episode;
        this.__series  = this.__episode.Series;
        this.__brand  = this.__series.Brand;

    }else {
        throw new Error("Unrecognized Entity Type for FileNameHelper");
    }

    const  FRAME_RATE = {"DF30"	: "2997DF", "NDF25"	: "25", "P23_976" : "2398"};


    this.setFileNameOptions = function(fileNameOptions){
        this.__fileNameOptions = fileNameOptions;
    }

    this.setFileNameSeparator = function(fileNameSeparator){
        this.__fileNameSeparator = fileNameSeparator;
    }

    this.setFileNameTagDataElement = function(fileNameTagDataElement){
        this.__fileNameTagDataElement = fileNameTagDataElement;
    }
	
	this.setFileNameIterator = function(fileNameIterator) {
		this.__fileNameIterator = fileNameIterator; 
	}
	
	this.setFileNameOverrides = function(placingXml) {
		this.__fileNameOverrides = {
			"Video File Name Override" : placingXml..ShortText.(ShortTextType.toString()== "Video File Name Override").Value.toString(),
			"Audio 1 File Name Override" : placingXml..ShortText.(ShortTextType.toString()== "Audio 1 File Name Override").Value.toString(),
			"Audio 2 File Name Override" : placingXml..ShortText.(ShortTextType.toString()== "Audio 2 File Name Override").Value.toString(),
			"Caption 1 File Name Override" : placingXml..ShortText.(ShortTextType.toString()== "Caption 1 File Name Override").Value.toString(),
			"Caption 2 File Name Override" : placingXml..ShortText.(ShortTextType.toString()== "Caption 2 File Name Override").Value.toString(),
			"Package File Name Override" : placingXml..ShortText.(ShortTextType.toString() == "Package File Name Override").Value.toString()
		}
		for(override in this.__fileNameOverrides) {
			if (this.__fileNameOverrides[override] == "") {
				this.__fileNameOverrides[override] = undefined; 
			}
		}
		print("fileNameHelper.fileNameOverrides are: " + JSON.stringify(this.__fileNameOverrides));
	}

    this.__checkIsStaticAndUseStaticData =  function(option){

        var tag = gmoNBCFunc.getTagByTagTypeAndValue(this.__fileNameTagDataElement,option);
        if(tag==undefined){
            return "";
        } else {
            if(tag.Description.toString().toUpperCase().indexOf("STATIC")>=0){
                return tag.Value.toString();
            }
        }
        return "";
    }

    this.__getTitle = function(){
        var type = this.__material.MaterialType.toString().toUpperCase();
        var title = "";
        if(type == "EPISODIC"){
           if(gmoNBCFunc.isVarUsable(this.__placingId)){
                title =  gmoNBCFunc.resolveAlias("Brand_SMAT_Series_Title_ENGUS",this.__placingId);
            }else{
                 title =  this.__brand.ShortTextList.ShortText.(ShortTextType == "SMAT: Series Title (ENG|US)").Value.toString();
            }
            if(!gmoNBCFunc.isVarUsable(title)){
                 title =  this.__brand.Title.toString();
            }
        }else if (type == "FEATURE"){
            title = this.__material.Title.toString();
        }

        return title;
    }

    this.__getEpisodeTitle = function(){
         var title = "";
         title =  this.__episode.Title.toString();
         if(!gmoNBCFunc.isVarUsable(title)){
             title =  this.__material.Title.toString();
         }
         return title;
    }

    this.__getCurrentDate = function(timeZone,format) {
        importPackage(Packages.java.text);
        var date = new java.util.Date();
        var formatter = new SimpleDateFormat(format);
        formatter.setTimeZone(java.util.TimeZone.getTimeZone(timeZone));
        var currentDate = formatter.format(date)
        return String(currentDate.toString());
    }

    this.__normalizeValue = function(value){		
        return value.replace(/[^A-Za-z0-9._-]/g,"");
    }

    this.evaluateFileName = function(){

        var fileName = "";
        var separators = ["-", "_"];
        var fileNameMapping = {

            "Episode Title"	:	this.__getEpisodeTitle(),
            "Title" : this.__getTitle(),
            "Current Date (EST)" : this.__getCurrentDate('EST','yyyyMdd'),
            "Current Date (PST)" : this.__getCurrentDate('PST','yyyyMdd'),
            "Current Date (CST)" : this.__getCurrentDate('CST','yyyyMdd'),
            "Current Date (GMT)" : this.__getCurrentDate('GMT','yyyyMdd'),
            "Current Date (MST)" : this.__getCurrentDate('MST','yyyyMdd'),
            "Frame Rate"	:	FRAME_RATE[this.__material.FrameRate.toString()],
            "GMO Mat ID" : this.__matId
        }

        var emptyOrNullNameOptions = [];
        var excludeFromEmptyCheck = [];
        for (var i=0; i<this.__fileNameOptions.length(); i++) {
            var option = this.__fileNameOptions[i].toString();
            var optionValue = fileNameMapping[option];
            if(optionValue == undefined){
                optionValue = this.__checkIsStaticAndUseStaticData(option);
            }else{
                optionValue = this.__normalizeValue(optionValue);
            }
            
            if(!gmoNBCFunc.isVarUsable(optionValue)){
                if(!gmoNBCFunc.contains(excludeFromEmptyCheck,option)){
                    emptyOrNullNameOptions.push(option);		
                }
            }
            output("Value for [" + option + "] is [" + optionValue + "]")
            
            // If it has a separator prepended to it, lets not add another separator.
            // Also if its the first field, lets not add a separator either.
            if (i != 0 && optionValue!="" && separators.indexOf(optionValue.substr(0,1)) < 0){
                fileName += this.__fileNameSeparator;									
            }			
            fileName += optionValue;			
        }
    
        if(emptyOrNullNameOptions.length > 0){
            print("EMPTY FIELD ERROR: Cannot construct valid filename. The following field(s) are empty or null: " + emptyOrNullNameOptions);
        }
        
        output("Filename is [" + fileName + "]");

        return fileName;
    }

	this.checkFileNameOverride = function(type) {
		print("Entering FileNameHelper.checkFileNameOverride()")
		switch (type) {
			case "Video" : 
				print("using " + this.__fileNameOverrides["Video File Name Override"] + " to Override Video FileName.");
				return this.__fileNameOverrides["Video File Name Override"]; 
			case "Audio" :
				if (this.__fileNameIterator == 1 || this.__fileNameIterator == "") {
					print("using " + this.__fileNameOverrides["Audio 1 File Name Override"] + " to Override Audio 1 FileName.");
					return this.__fileNameOverrides["Audio 1 File Name Override"]
				} else if (this.__fileNameIterator == 2) {
					print("using " + this.__fileNameOverrides["Audio 2 File Name Override"] + " to Override Audio 2 FileName.");
					return this.__fileNameOverrides["Audio 2 File Name Override"]
				}
			case "Caption" :
				if (this.__fileNameIterator == 1 || this.__fileNameIterator == "") { 
					print("using " + this.__fileNameOverrides["Caption 1 File Name Override"] + " to Override Caption 1 FileName.");
					return this.__fileNameOverrides["Caption 1 File Name Override"]
				} else if(this.__fileNameIterator == 2) { 
					print("using " + this.__fileNameOverrides["Caption 2 File Name Override"] + " to Override Caption 2 FileName.");
					return this.__fileNameOverrides["Caption 2 File Name Override"]
				}
			case "Tar" :
			case "Package"  : 
				print("using " + this.__fileNameOverrides["Package File Name Override"] + " to Override Package FileName.");
				return this.__fileNameOverrides["Package File Name Override"];
			default : 
				print("No Override Value Found.")
				return undefined; 
		}
	}
}
