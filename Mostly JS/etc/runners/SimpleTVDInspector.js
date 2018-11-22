/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-14 21:54:29
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-05-15 00:34:51
*/


var TVDInspector = function (obj) {
	
	if ((this instanceof TVDInspector) === false) {
		throw new Error("Please call constructor with new() keyword");
	}

	if(typeof(wscall)==="undefined"){
		print("Loading ShellFun js ")
		load("/opt/evertz/mediator/lib/js/shellfun.js");	
	}

	if(typeof(JSCommons)==="undefined"){
		print("Loading JSCommons js ")
		load("/opt/evertz/mediator/etc/helpers/JSCommons.js");	
	}

	this.__obj = obj;
}

TVDInspector.prototype.constructor = TVDInspector;

TVDInspector.prototype.log = function (functionName, message)  {
	print("TVDInspector # " + functionName + " : " + message);
}

TVDInspector.prototype.printSearchCriteria = function(){
	var functionName = "printSearchCriteria";
	this.log(functionName, "Start");
	for (var prop in this.__obj){
		if(this.__obj[prop] == false){
			this.log(functionName, "Cannot find Value in Object for Property ["+prop+"]");
		}else {
			if(typeof this.__obj[prop] != "xml" && typeof this.__obj[prop] != "object"){
				this.log(functionName, prop + " has value ["+this.__obj[prop]+"]");
			}else{
				this.log(functionName, prop + "is a complex object and not printing in logs");
			}
		}
	}
	this.log(functionName, "End");
}

TVDInspector.prototype.runSourceSelectionByCriteria = function(){
	var functionName = "runSourceSelectionByCriteria";
	const REPORT_NAME = "SourceSelectionByCriteria";
	const TVD_PARAM = "tvd_production_param";
	const VERSION_TYPE_PARAM = "version_type_param";
	const OAR_PARAM = "oar_param";
	const ASPECT_RATIO_PARAM = "aspect_ratio_param";
	this.log(functionName, "Start");

	var reportRequest = <PharosCs>
			<CommandList>
				<Command subsystem="report" method="runReport">
					<ParameterList>
						<Parameter name="reportName" value={REPORT_NAME}/>
						<Parameter name="reportParameters">
							<Value>
								<CustomReportRuntimeParameters>
									<Parameters>
										<StringReportParameter>
											<Name>{TVD_PARAM}</Name>
											<Operator>is</Operator>
											<Values>
												<String></String>
											</Values>
										</StringReportParameter>
										<StringReportParameter>
											<Name>{VERSION_TYPE_PARAM}</Name>
											<Operator>in</Operator>
											<Values>
											</Values>
										</StringReportParameter>
										<StringReportParameter>
											<Name>{ASPECT_RATIO_PARAM}</Name>
											<Operator>is</Operator>
											<Values>
												<String></String>
											</Values>
										</StringReportParameter>
										<StringReportParameter>
											<Name>{OAR_PARAM}</Name>
											<Operator>is</Operator>
											<Values>
												<String></String>
											</Values>
										</StringReportParameter>
									</Parameters>
								</CustomReportRuntimeParameters>
							</Value>
						</Parameter>
					</ParameterList>
				</Command>
			</CommandList>
		</PharosCs>;

	if(JSCommons.isVarUsable(this.__obj["TVD#"])){
		var tvdParameter = reportRequest..StringReportParameter.(Name == TVD_PARAM);
		tvdParameter.Values.String = this.__obj["TVD#"];
	}else{
		throw new Error("TVD # is Manadatory Search Parameter");
	}

	if(JSCommons.isVarUsable(this.__obj["VERSION_TYPE"])){
		var versionTypeParameter = reportRequest..StringReportParameter.(Name == VERSION_TYPE_PARAM);
		var versionTypes = this.__obj["VERSION_TYPE"];
		for each(version in versionTypes){
			versionTypeParameter.Values.appendChild(<String>{version}</String>);
		}
	}else{
		var versionTypeParameter = reportRequest..StringReportParameter.(Name == VERSION_TYPE_PARAM); 
		versionTypeParameter.Values.String = "";
	}

	if(JSCommons.isVarUsable(this.__obj["ASPECT_RATIO"])){
		var aspectRatioParameter = reportRequest..StringReportParameter.(Name == ASPECT_RATIO_PARAM);
		aspectRatioParameter.Values.String = this.__obj["ASPECT_RATIO"];
	}

	if(JSCommons.isVarUsable(this.__obj["OAR"])){
		var originalAspectRatioParameter = reportRequest..StringReportParameter.(Name == OAR_PARAM);
		originalAspectRatioParameter.Values.String = this.__obj["OAR"];
	}
	output(reportRequest);
	var reportResponse = wscall(reportRequest)..ResultList;
	if(parseInt(reportResponse..Count.toString())>0){
		this.log(functionName,"TVD Search Results Returned "+reportResponse..Count.toString()+" Records");
		this.log(functionName,"TVD Search Results");
		for each(row in reportResponse..Results.ReportRow){
			this.log(functionName,"__RNUM "+ row.__RNUM.toString());
			this.log(functionName,"__MAT_ID "+ row.__MAT_ID.toString());
			this.log(functionName,"__VERSION_TYPE "+ row.__VERSION_TYPE.toString());
			this.log(functionName,"__ASPECT_RATIO "+ row.__ASPECT_RATIO.toString());
			this.log(functionName,"__OAR "+ row.__OAR.toString());
		}
	}else {
		this.log(functionName,"TVD Search Results Returned 0 Records")
	}
	return reportResponse;
	this.log(functionName, "End");
}

