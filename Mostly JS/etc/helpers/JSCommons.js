/*
* @Author: Karthik Rengasamy
* @Date:   2017-12-13 16:51:28
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-12-13 16:52:49
*/

var JSCommons = {
	
	log : function(functionName,message){
		print("JSCommons # " + functionName + " : " + message);
	},

	isVarUsable : function(v) {
		var functionName = "isVarUsable";
		this.log(functionName,"variable ["+v+"]")
		// Lazy check for undefined, null and emptystrings
		if (typeof v === "undefined" || v === null || v === "") {
			return false;
		} else {
			return true;
		}
	},

	logObject : function(obj){
		var functionName = "logObject";
		this.log(functionName,"Start");
		for (var prop in obj){
			if(typeof obj[prop] != "xml" && typeof obj[prop] != "object"){
				this.log(functionName, prop + " has value ["+obj[prop]+"]");
			}else{
				this.log(functionName, prop + " is a complex object and not printing in logs");
			}
		}
		this.log(functionName,"End");
	},

	normalizeText : function(text){		
		return text.replace(/[^A-Za-z0-9 ]/g,"");
	},

	encodeXML : function(text) {
		return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/'/g, "&apos;")
		.replace(/"/g, "&quot;");
	},
	
	escapeUnicodeXML : function(text) {
		return text.replace(/[^\x00-\x7F]/g, "");
	}
	
}

if(typeof(wscall)==="undefined"){
	print("Loading ShellFun js ")
	load("/opt/evertz/mediator/lib/js/shellfun.js");	
}
