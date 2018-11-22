load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/lookup.js");
load("/opt/evertz/mediator/lib/js/shellfun.js");
importPackage(Packages.org.apache.log4j);
var logger;             // Interface to the log4J logger class

//Global Script Vars 
var debug = false;
var matId; 
var materialXml;
var dropFolderFileObj;
var failedDir =  "/failed/";
var completedDir = "/completed/";

//////////////////////////////////////////////////////////////////////////////    Start of Script   ////////////////////////////////////////////////////////////////////// 
try { 
    print("\nStarting run_QCReportUploadScript.js");
    var jobDesc = getJobParameter("jobDescription");
    if (debug) print("\nJobDesc\n"+ jobDesc +"]");
    var jobDashboard = new gmoNBCFunc.WSJobUpdateObject();
    jobDashboard.updateStatusAndProgress("Starting Script",10);  
    // Extracting data from Job Description
    var matId = jobDesc..FolderMonitorMatId.toString();
    var filePath = jobDesc..Path.toString() + "/";
    var fileName = jobDesc..File.toString();

    print("\nRunning QC Report for Material ["+ matId +"]");
    print("\nFileName  ["+ fileName +"] and FilePath ["+ filePath +"]");   

    jobDashboard.updateStatusMap({"Script_MatId":matId});
    jobDashboard.updateStatusMap({"Script_FileName":fileName});
    materialXml = materialGet(matId);
    var dropFolderFileObj = new gmoNBCFunc.usefulFileObj(filePath + fileName);
    var report_date = now("yyyyMMdd_HHmmss");
    var pdf_file_path = "/srv/dc-dvs/mediatorTemp/QC_Report_" + report_date + ".pdf";
    output("Copying file [" + dropFolderFileObj.unix_file + "] to [" + pdf_file_path + "]");
    jobDashboard.updateStatusAndProgress("Copying QC file into upload location",30);
    copy(dropFolderFileObj.unix_file, pdf_file_path);
    // Wait a bit to make sure the file is there
    sleep(2);
    // Get Baton information from lookup.js
    var batonSettings = lookup.baton["BATON_INFORMATION"];
    var remote_user = batonSettings.remoteWSUser;
    var remote_pass = batonSettings.remoteWSPass;
    var remote_ip = batonSettings.loadBalancerIP; // loadBalancerIP is only available on prod, local copy will be used for DEV/QA

    if (remote_ip !== "" && remote_ip !== null && typeof(remote_ip) !== 'undefined') {
        output("Remote settings have been provided, report will be attatched remotely");
        output("Connecting to: " + remote_ip + "with the following credentials: Username: " + remote_user + "Password: " + remote_pass);
        try{
            var remoteWebService = new gmoNBCFunc.remoteWebService();
            remoteWebService.wsLogin(remote_ip, remote_user, remote_pass);
            remoteWebService.attachFile(pdf_file_path, "MATERIAL", matId);
            remoteWebService.wsLogout();
        } catch (e){
            jobDashboard.updateStatusAndProgress("Eror uploading file remotely",90);  
            print("Error uploading QC Report PDF using Baton upload, moving to failed folder: "+e.message);
            path = dropFolderFileObj.unix_file  + failedDir;
            gmoNBCFunc.failAndMove(pdf_file_path,path,e);
        }
    } else{
        output("Remote settings have not been provided, report will be attached locally");
        try{
            output("---------------ATTACHING FILE----------------")
            attachFile(pdf_file_path, "MATERIAL", matId);
        } catch(e){
            jobDashboard.updateStatusAndProgress("Eror uploading file locally",90);  
            print("Error uploading Baton report: " + e.message);
        }
    }

    output("PDF filename for uploading is : " + pdf_file_path);
    output("Mat ID is : " + matId);

    // Remove the Original Report from drop folder
    print("\nFinished Processing Material ["+ matId +"] from File ["+ fileName +"]. Moving report to completed folder");
    jobDashboard.updateStatusAndProgress("Cleaning Up Files",95);
    gmoNBCFunc.completeAndMove(fileName,dropFolderFileObj.unix_path);

    print("\n-----------Ending run_QCReportUploadScript.js----------------");
    jobDashboard.updateStatusAndProgress("Finishing Script",100);
    
    } catch(e) {
        print("\nQC Report Job Failed ["+ matId +"]" + e);
        output ("Error failing script : " + e.message);
        jobDashboard.updateStatusAndProgress("Eror in QC Report upload",90);  
        print("Error in QC Report, moving PDF to failed folder: "+e.message);
        path = dropFolderFileObj.unix_file  + failedDir;
        gmoNBCFunc.failAndMove(fileName,dropFolderFileObj.unix_path,e);
        updateStatusMap("JOB__ERROR", e.message);
        throw e;
        quit(1);     
}
