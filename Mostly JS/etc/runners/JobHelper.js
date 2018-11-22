/*
* @Author: Karthik Rengasamy
* @Date:   2017-05-11 20:48:36
* @Last Modified by:   Ray Olsen
* @Last Modified time: 2018-04-11 17:21:00
*/

function JobHelper () {

	if ((this instanceof JobHelper) === false) {
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
}

JobHelper.prototype.constructor = JobHelper;

JobHelper.prototype.log = function (functionName, message)  {
	print("JobHelper # " + functionName + " : " + message);
};

JobHelper.prototype.getJobDescription = function(){
	return getJobParameter('jobDescription')..Output.JobDescription;
}

JobHelper.prototype.setJobDescription = function(jobDescription ){
	this.__jobDescription = jobDescription ;
}

JobHelper.prototype.setJobFactory = function(jobFactoryName){
	this.__jobFactoryName = jobFactoryName;
}

JobHelper.prototype.executeJob = function(){
	var functionName = "executeJob";
	this.log(functionName, "Start");
	this.log(functionName, "JobFactoryName : "+this.__jobFactoryName);
	var payload = <PharosCs>
	  <CommandList>
	    <Command subsystem="job" method="executeJob">
		    <ParameterList>
				<Parameter name="jobFactoryName" value={this.__jobFactoryName}/>
					<Parameter name="jobDescription">
				 	 <Value>{this.__jobDescription}</Value>
					</Parameter>
				<Parameter name="priorityMatId" value=""/>
		    </ParameterList>
	    </Command>
	  </CommandList>
	</PharosCs>;
	this.log(functionName, "End");
	return wscall(payload);
}

JobHelper.prototype.WSJobUpdateObject =  function(){
	
    this.updateStatus = function(statusMsg) {
    	this.updateStatusMap({"JOB__STATUS" : statusMsg});
	};

	this.updateProgress = function(progressPercent){
		this.updateStatusMap({"JOB__PROGRESS" : progressPercent});
	};

	this.updateStatusAndProgress = function(statusMsg,progressPercent){
		this.updateStatusMap({"JOB__STATUS" : statusMsg, "JOB__PROGRESS" : progressPercent});
	};

	this.updateStatusMap = function(keyPairs){
		var __mapping = <Mapping></Mapping>;

		for (var key in keyPairs) {
	        __mapping[key] = keyPairs[key];
		}

		var command = <PharosCs>
			                <CommandList>
		 	                    <Command subsystem="job" method="updateStatusMap">
		 	                        <ParameterList>
		 	                            <Parameter name="jobId" value={_jobId}/>
		 	                            <Parameter name="jobInfo">
		 	                                <Value>
		 	                                    {__mapping}
		 	                                </Value>
		 	                            </Parameter>
		 	                        </ParameterList>
			                    </Command>
		 	                </CommandList>
		 	   			</PharosCs>;
		wscall(command);
	};
};
