/*
* @Author: Karthik Rengasamy
* @Date:   2017-08-20 20:40:43
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-08-21 01:13:48
*/

function PresetHelper() {

	if((this instanceof PresetHelper) === false)	throw new Error("Please call constructor with new() keyword")

	if(typeof(gmoNBCFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js")
	if(typeof(Preset)==="undefined")  load("/opt/evertz/mediator/etc/runners/Preset.js")
}

PresetHelper.prototype.constructor = PresetHelper;

PresetHelper.prototype.listPresetsByPresetType = function(presetType){
	
	var presets = [];

	if(!gmoNBCFunc.isVarUsable(presetType )){
		throw new Error("Preset Type is required to List Presets by PresetType ");
	}

	var reportXML = <PharosCs>
		   <CommandList>
		      <Command subsystem="report" method="runReport">
		         <ParameterList>
		            <Parameter name="reportName" value="listPresetsByPresetTypes" />
		            <Parameter name="reportParameters">
		               <Value>
		                  <CustomReportRuntimeParameters>
		                     <Parameters>
		                        <StringReportParameter>
		                           <Name>presetType</Name>
		                           <Operator>in</Operator>
		                           <Values>
		                              <String>{presetType}</String>
		                           </Values>
		                        </StringReportParameter>
		                     </Parameters>
		                  </CustomReportRuntimeParameters>
		               </Value>
		            </Parameter>
		            <Parameter name="pageSize">
		               <Value>
		                  <Integer>100</Integer>
		               </Value>
		            </Parameter>
		            <Parameter name="page">
		               <Value>
		                  <Integer>1</Integer>
		               </Value>
		            </Parameter>
		         </ParameterList>
		      </Command>
		   </CommandList>
		</PharosCs>
	
	var reportResults = wscall(reportXML);
	for each (var row in reportResults..ReportRow){
		presets.push(row.NAME.toString());
	}
	return presets;
}

PresetHelper.prototype.getPreset = function(presetName){
	if(!gmoNBCFunc.isVarUsable(presetName )){
		throw new Error("Preset Name is required to Get Preset");
	}
	var preset = new Preset(presetName);
	var shortTexts = preset.getShortTexts();
	var tags = preset.getTags();
	var presetObject = {};
	presetObject["Name"] = preset.getName();
	presetObject["Description"] = preset.getDescription();

	//Set Short Texts as Key Value Pairs
	for each (shortText in shortTexts){
		presetObject[shortText.ShortTextType.toString()] = shortText.Value.toString();
	}

	//Set Tags as Key Value Arrays
	for each (tag in tags){
		if(tag.Type.toString()=="set"){
			presetObject[tag.TagType.toString()] = tag.Value.toString();
		}else{
			var valueArray = presetObject[tag.TagType.toString()];
			if(!gmoNBCFunc.isVarUsable(valueArray)){
				valueArray = []
			}
			valueArray.push(tag.Value.toString())
			presetObject[tag.TagType.toString()] = valueArray;
		}
	}
	return presetObject;
}
