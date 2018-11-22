load("/opt/evertz/mediator/etc/runners/AsperaFaspex.js");

function pollStatus (link, faspex){
    while (true){
        
        var job = faspex.getJobStatus(link);
        var stat = String(job.status).toLowerCase();
        print("Status "+job.status);
        print("Progress Percent"+ job.progress);
        
        if (job.status === 'Completed') {
            print('Transfer completed Successfully');
            break;
        }else {
            updateStatusMap("INPROGRESS", parseInt(job.progress));
        }

        //if (job.status === 'Error' || job.status === 'Stopped') {
        if (stat.match(/.*error.*/) || stat.match(/.*stopped.*/) || stat === ""){
            print(job.errorCode)
            print('Transfer ended with status ['+job.status+'] and message ['+job.errorMessage+']');
            throw new Error("Transfer Errored "+job.errorMessage);
        }

        print("Waiting to check Status Again");
        sleep(STATUS_POLL_TIME);
    }
}

const STATUS_POLL_TIME = 10;

function asperaFaspexTransfer(presetXML, path, fileName){
    var jobDesc = getJobParameter("jobDescription")
    var faspexJobParamsXML = placingXML..Preset.(PresetType == 'Delivery');
    updateStatusMap("STARTED",1);

    /** ******************************************************** **/
    /**                            FASPEX!                       **/
    /** ******************************************************** **/
    var faspexTransferHost = String(faspexJobParamsXML..Tag.(TagType == "Faspex Transfer Host").Value);
    var faspexWorkgroup =  String(faspexJobParamsXML..ShortText.(ShortTextType == "Faspex Workgroup").Value);
    var faspexSourceShareName = String(faspexJobParamsXML..Tag.(TagType == "Faspex Source Share Name").Value);
    output("faspexSourceShareName ["+faspexSourceShareName+"]");

    output("faspexSourceShareName ["+faspexSourceShareName+"]");
    var faspexTitle = (String(jobDescription..PlacingId) +"_"+ _jobId.replace(/[^0-9]/g,"")).replace(/[-]/g, "_");
    var faspexNote = "NOTE";
    var user = String(faspexJobParamsXML..ShortText.(ShortTextType == "Faspex User Name").Value);
    var password = "LX4k!&q-S-";
    var mountPoints = String(faspexJobParamsXML..ShortText.(ShortTextType == "Faspex Mount Points").Value);
    
    var proxyHost = "";
    var proxyPort = "";
    
    if (faspexTransferHost == "" || faspexTransferHost == null){
        throw new Error("No Faspex Transfer Server provided, cannot continue.");
    }
    
    if (faspexWorkgroup == "" || faspexWorkgroup == null){
        throw new Error("No Faspex Workgroup provided, cannot continue.");
    }
    
    if (faspexSourceShareName == "" || faspexSourceShareName == null){
        throw new Error("No Faspex Source Share Name provided, cannot continue.");
    }
    
    if (user == "" || user == null){
        throw new Error("No Faspex Account Name provided, cannot continue.");
    }
    
    if (password == "" || password == null){
        throw new Error("No Faspex Account Password provided, cannot continue.");
    }

    print("Aspera Faspex Settings:\n" +
        "faspexTransferHost     : " + faspexTransferHost + "\n" +
        "faspexSourceShareName  : " + faspexSourceShareName + "\n" +
        "user                   : " + user + "\n" +
        "password               : " + password + "\n" +
        "proxyHost              : " + proxyHost + "\n" +
        "proxyPort              : " + proxyPort + "\n" +
        "faspexTitle            : " + faspexTitle + "\n" +
        "faspexNote             : " + faspexNote + "\n" +
        "faspexWorkgroup        : " + faspexWorkgroup + "\n");
    
    var faspex = new NBCAsperaFaspex();
    // Faspex Job Creation Required Details
    faspex.setHost(faspexTransferHost);
    faspex.setSourceShareName(faspexSourceShareName);
    faspex.setUsername(user);
    faspex.setPassword(password);
    faspex.setProxyHost(proxyHost);
    faspex.setProxyPort(proxyPort);
    
    // Faspex Job Details
    faspex.setTitle(faspexTitle);
    faspex.setNote(faspexNote);
    

    var recipients = [];
    recipients.push(faspexWorkgroup);
    faspex.setRecipients(recipients);
    
    
    var paths = [mountPoints + path + "/"+ fileName];
    
    faspex.setPaths(paths);

    var link = faspex.startTransfer();
    
    if (link == "" || link == null){
        throw new Error("Faspex Job Creation Failed, cannot continue.");
    }
    updateStatusMap("Faspex Job Created ", 1);
    sleep(STATUS_POLL_TIME);
    updateStatusMap("Faspex Job Monitoring Started ", 1);
    pollStatus(link, faspex);
    
    updateStatusMap("Aspera Faspex Job Completed Successfully.", 100);    
    
}
