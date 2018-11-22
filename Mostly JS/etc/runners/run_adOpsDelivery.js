/*
* @Author: 206466664
* @Date:   2018-10-18 08:35:29
* @Last Modified by:   206466664
* @Last Modified time: 2018-10-18 10:22:00
*/

if(typeof(NBCGMO_CONSTANTS)==="undefined") load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js");
if(typeof(gmoNBCFunc)==="undefined") load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
if(typeof(gmoNBCNLDFunc)==="undefined") load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
if(typeof(PlacingHelper) === "undefined") load("/opt/evertz/mediator/etc/runners/placingHelper.js");
    

try {
    var states = {
        "deliveryRequired"   : "Delivery Required"
    };
    var requirements = {
        toDelivery : "Deliver"
    };
        
    var jobDescription = getJobParameter('jobDescription')..Output.JobDescription;  
    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
    jobDashboard.updateStatusAndProgress("Starting Script",5);
    
    var placingID = jobDescription.Properties.Mapping.domainKey.toString();

    gmoNBCNLDFunc.transitionPlacing(placingID,states.deliveryRequired,requirements.toDelivery);
    sleep(5)  
    jobDashboard.updateStatusAndProgress("Finished Running Script Successfully", 100);
} catch(e) {
    output("An error has occured: " + e.message);
    jobDashboard.updateStatusMap({"JOB__ERROR" : e.message});   
    quit(1);
}