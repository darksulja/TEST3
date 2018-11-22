load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
output("Running run_tlMaterialUpdateRunner.js");

function createDataElements(material,dataElement){
	
		if("shorttext" == dataElement.Type.toString()) {
			 material..ShortTextList.appendChild(gmoNBCFunc.createShortTextNode(dataElement.Name.toString(),dataElement.Value.toString()));
		}	
		if("tag" == dataElement.Type.toString() || "set" == dataElement.Type.toString()) {
			material..TagList.appendChild(gmoNBCFunc.createTagNode(dataElement.Name.toString(),dataElement.Value.toString()));
		}
		if("fulltext" == dataElement.Type.toString()){
			material..FullTextList.appendChild(gmoNBCFunc.createFullTextNode(dataElement.Name.toString(),dataElement.Value.toString()));
		}
	return material
}

try {
	const SHORTTEXT = "shorttext";
	
	var shortTextTypeTVDProduction = "TVD Production #";
	var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;
	print("Job Description: " + jobDescription);
	
	var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
	jobDashboard.updateStatusAndProgress("Starting Script",5);
	
	var commonDataElemetsForTVDProdNo = [
	'GTM Title Version',
	'Daisy Production #',
	'Compass Title Version #',
	'Original Air Date',
	'Compass Title',
	'Compass Original Air Date',
	'GCO Original Air Date',
	'GTM Original Air Date',
	'SMAT Original Air Date',
	'US Rating',
	"GTM: TVD Production #",
	"GTM: Title Version",
	"Compass: Title Version #",
	"Compass: Title",
	"Compass: Original Air Date",
	"GTM: Original Air Date",
	"Compass: US Rating",
	"SMAT: Original Air Date (NA|US)",
	"SMAT: Original Air Date (NA|CA)",
	"SMAT: Original Air Date (NA|AU)"
	];
	
	var materialOnlyDataElements = [
		'EIDR',
		'EIDRV',
		'Compass Material ID',	
		'Daisy ID',
		'GTM Original Version'
	];
	
	var materialXML = new XML(jobDescription..Update.toString());
	print(materialXML);
	var updateMatId = materialXML.MatId.toString();
	var hasEpisodeId = false;
	var tvdProductionNumber = materialXML.DataElementList.DataElement.(shortTextTypeTVDProduction === Name.toString()).Value.toString();
	print(tvdProductionNumber);
	if(!tvdProductionNumber) throw new Error("Failed to extract a TVD Production # from the Job Description -> Material ");
	
	print("\n["+shortTextTypeTVDProduction+"] is ["+tvdProductionNumber+"]");

	if(materialXML.Episode.EpisodeId.toString() != "") {
		hasEpisodeId = true;
	}
	
	//List All Materials with Same TVD #
	
	var tvdMaterials = gmoNBCFunc.getMaterialsFromDataElements(SHORTTEXT,shortTextTypeTVDProduction,tvdProductionNumber);

	if(!hasEpisodeId) {
		for each (var matId in tvdMaterials){
			if(matId != updateMatId) {
				var tvdMatXML = materialGet(matId, "episode");

				// Getting the EpisodeId from another shell record if it exists
				if(tvdMatXML..Episode.EpisodeId.toString() != "") {
					var episodeId = tvdMatXML..Episode.EpisodeId.toString();
					print("Episode information not found for [" + updateMatId + "] but located on another in the TVD Group. Adding it now");

					materialXML.Episode = <Episode>
											<EpisodeId>{episodeId}</EpisodeId>
									 	  </Episode>;

					print("Episode [" + episodeId + "] added to updated Material");
					break;
				}
			}
		}
	}
	
	for each (var matId in tvdMaterials){
		print("\n matId is ["+matId+"]"); 
		material = <Material >
			<MatId>{matId}</MatId>
			<ShortTextList/>
			<TagList/>
			<FullTextList/>
		</Material>
		
		//1 - Elements against Material
		print("\nAdding Material Elements ")
		if(materialXML.Title.toString()) material.Title = materialXML.Title.toString();
		if(materialXML.MaterialType.toString()) material.MaterialType = materialXML.MaterialType.toString();
		if(materialXML.Episode.EpisodeId.toString()) material.Episode = materialXML.Episode;
		
		//2 - Iterate through Data Elements and build the Material XML for Save
		print("\n Adding TVD Group Common Data Elements & MaterialOnlyDataElements ");
		for each (var dataElement in materialXML.DataElementList.DataElement){
			//TVD Group Updates 

			if(gmoNBCFunc.contains(commonDataElemetsForTVDProdNo,dataElement.Name.toString())) {
				createDataElements(material,dataElement);
			} else if (gmoNBCFunc.contains(materialOnlyDataElements,dataElement.Name.toString()) && matId == updateMatId ){
				//Material Only Updates 
				createDataElements(material,dataElement);
			} 
		}
		print(material);
		print("\nSave Material");
		try {
			materialSave(material);
		} catch (e){
			print("\nError Saving Material ["+matId+"] "+e);
		}
		
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
									<initiatedBy type="String">tlMaterialUpdateRunner</initiatedBy>
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
	
	jobDashboard.updateStatusAndProgress("Finishing Script",100);
	
} catch(e) {
	output("An error has occured: " + e.message);
	jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});	
	quit(1);
}