load("/usr/local/pharos/etc/scripts/nbcgmo_fun.js");

output("Running run_beforeReadyJobRunner.js");

const TOTAL_RUN_TIME = "Total Run Time";

function calculateTotalRunTime(matId){
	var totalRunTime="";
	print("Starting Process for Material ID "+matId);
	try {
		print("Starting Process for Material ID "+matId);
		var materialXML = materialGet(matId,'markers','segments')..Material;
		if(materialXML.SegmentList.Segment.(SegmentGroup.Name.toString()=='Break Patterns').length()>=1){
			print("Material Has Break Patterns");
			for each (segment in materialXML.SegmentList.Segment.(SegmentGroup.Name.toString()=='Break Patterns')){
				markin = AmountOfTime.parseText(materialXML.FrameRate.toString(),segment.MarkerIn.Absolute.toString());
				//print("markin"+markin)
				markout = AmountOfTime.parseText(materialXML.FrameRate.toString(),segment.MarkerOut.Absolute.toString());
				//print("markout"+markout)
				//print("subtract"+markout.subtract(markin));
				if(totalRunTime)totalRunTime = totalRunTime.add(markout.subtract(markin));
				else totalRunTime = markout.subtract(markin)
				//print("totalRunTime"+totalRunTime);
			}
		}else if (materialXML.MaterialType.toString()=='Feature'){
			print("Material is a Feature and has no break patterns - using SOM /EOM ");
			for each (segment in materialXML.SegmentList.Segment.(SegmentGroup.Name.toString()=='SOM / EOM')){
				markin = AmountOfTime.parseText(materialXML.FrameRate.toString(),segment.MarkerIn.Absolute.toString());
				//print("markin"+markin)
				markout = AmountOfTime.parseText(materialXML.FrameRate.toString(),segment.MarkerOut.Absolute.toString());
				//print("markout"+markout)
				//print("subtract"+markout.subtract(markin));
				if(totalRunTime)totalRunTime = totalRunTime.add(markout.subtract(markin));
				else totalRunTime = markout.subtract(markin)
				//print("totalRunTime"+totalRunTime);
			}
		}
	}catch(e){
		print("Error Calculating TotalRunTime"+e);
		totalRunTime ="";
	}
	return totalRunTime;
}

try {
	var debug = false;
	var jobDesc = getJobParameter("jobDescription");
	
	if(debug) print("\nJobDesc\n"+jobDesc+"\n");

	var material = jobDesc..material.Material;
	var matId = material..MatId.toString();
	output("MatId [" + matId + "]");
	var totalRunTime = calculateTotalRunTime(matId);
	print("Total Run Time for Material ["+matId+"] is "+totalRunTime);
	
	
	if(totalRunTime!=""){
		var thisMaterialHelper = new gmoNBCFunc.materialHelper(matId);
		thisMaterialHelper.saveShortTextValue(TOTAL_RUN_TIME,totalRunTime);
		print("\nFiring Status Update Notification Job ");
		try {
			wscall(<PharosCs>
				<CommandList>
				  <Command subsystem="job" method="executeJob">
					<ParameterList>
					  <Parameter name="jobFactoryName" value="translatorMaterialUpdateJobFactory"/>
					  <Parameter name="jobDescription">
					   <Value>
							<JobDescription>
								<Properties>
								  <Mapping>
									<domainType type="String">Material</domainType>
									<initiatedBy type="String">beforeReadyJobRunner</initiatedBy>
									<matId type="String">{matId}</matId>
									<domainKeyType type="String">matId</domainKeyType>
									<domainKey type="String">{matId}</domainKey>
								  </Mapping>
							    </Properties>
						    </JobDescription>
						</Value>
					  </Parameter>
				    </ParameterList>
				  </Command>
			   </CommandList>
		    </PharosCs>);
		} catch (e){ 
			print("\nError Firing Status Update Notification Job For Material ["+matId+"] "+e);
		}
	}
	
	quit(0);
} catch(e) {
	output("Ruh-roh. Something went wrong here.")
	quit(1);
}