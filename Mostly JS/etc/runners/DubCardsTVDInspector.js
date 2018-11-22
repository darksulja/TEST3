/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-14 21:54:29
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-07-11 17:12:12
*/


var DubTVDInspector = function (obj) {
	
	if ((this instanceof DubTVDInspector) === false) {
		throw new Error("Please call constructor with new() keyword");
	}

	if(typeof(wscall)==="undefined"){
		print("Loading ShellFun js ")
		load("/opt/evertz/mediator/lib/js/shellfun.js");	
	}

	if(typeof(gmoNBCFunc)==="undefined"){
		print("Loading gmoNBCFunc js ")
		load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");	
	}

	this.__obj = obj;
}

DubTVDInspector.prototype.constructor = DubTVDInspector;

DubTVDInspector.prototype.log = function (functionName, message)  {
	print("DubTVDInspector # " + functionName + " : " + message);
}

DubTVDInspector.prototype.printSearchCriteria = function(){
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

DubTVDInspector.prototype.runSourceSelectionByCriteria = function(){
	var functionName = "runSourceSelectionByCriteria";
	const REPORT_NAME = "DubCardsTVDInspector";
	const TVD_PARAM = "tvd_production_param";
	const VERSION_TYPE_PARAM = "version_type_param";
	const TERRITOTY_SUB_TYPE_PARAM = "territory_sub_type_param";
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
											<Name>{TERRITOTY_SUB_TYPE_PARAM}</Name>
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

	if(gmoNBCFunc.isVarUsable(this.__obj["TVD#"])){
		var tvdParameter = reportRequest..StringReportParameter.(Name == TVD_PARAM);
		tvdParameter.Values.String = this.__obj["TVD#"];
	}else{
		throw new Error("TVD # is Manadatory Search Parameter");
	}

	if(gmoNBCFunc.isVarUsable(this.__obj["VERSION_TYPE"])){
		var versionTypeParameter = reportRequest..StringReportParameter.(Name == VERSION_TYPE_PARAM);
		var versionTypes = this.__obj["VERSION_TYPE"];
		for each(version in versionTypes){
			versionTypeParameter.Values.appendChild(<String>{version}</String>);
		}
	}else{
		var versionTypeParameter = reportRequest..StringReportParameter.(Name == VERSION_TYPE_PARAM); 
		versionTypeParameter.Values.String = "";
	}

	if(gmoNBCFunc.isVarUsable(this.__obj["ASPECT_RATIO"])){
		var aspectRatioParameter = reportRequest..StringReportParameter.(Name == ASPECT_RATIO_PARAM);
		aspectRatioParameter.Values.String = this.__obj["ASPECT_RATIO"];
	}

	if(gmoNBCFunc.isVarUsable(this.__obj["TERRITOTY_SUB_TYPE"])){
		var originalAspectRatioParameter = reportRequest..StringReportParameter.(Name == TERRITOTY_SUB_TYPE_PARAM);
		originalAspectRatioParameter.Values.String = this.__obj["TERRITOTY_SUB_TYPE"];
	}
	var reportResponse = wscall(reportRequest)..ResultList;
	if(parseInt(reportResponse..Count.toString())>0){
		this.log(functionName,"TVD Search Results Returned "+reportResponse..Count.toString()+" Records");
	}else {
		this.log(functionName,"TVD Search Results Returned 0 Records")
	}
	return reportResponse;
	this.log(functionName, "End");
}

