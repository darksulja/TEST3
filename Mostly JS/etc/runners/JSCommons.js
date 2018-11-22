/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-09 23:00:26
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-05-16 19:50:05
*/

var JSCommons = {
	
	log : function(functionName,message){
		print("JSCommons # " + functionName + " : " + message);
	},
	

	encodeXML : function(text) {
		return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/'/g, "&apos;")
		.replace(/"/g, "&quot;");		
	}
	
}

if(typeof(wscall)==="undefined"){
	print("Loading ShellFun js ")
	load("/opt/evertz/mediator/lib/js/shellfun.js");	
}