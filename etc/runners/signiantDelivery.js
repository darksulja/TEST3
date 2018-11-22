function signiantExitCodeDetails(code){
    switch (String(code)){
        case  "0" : 
            break;
        case  "2" :
            throw new Error("Scanning Error:\n\t One or more problems were encountered while scanning entries in the \
            specified remote directory."); 
        case "10" :
            throw new Error("Parameter Error:\n\t An invalid option was specified on the command line."); 
        case "11" :
            throw new Error("Initialization Error:\n\t An unexpected error occured during initialization.  Using the \
            -trace option may provide details on the failure."); 
        case "12" :
            throw new Error("Memory Allocation Error:\n\tThe dds_browse command or the remote browsing process was \
            unable to allocate enough memory for the operation."); 
        case "13" :
            throw new Error("OS Error:\n\tThe operating system reports an unexpected error."); 
        case "16" : 
            throw new Error("Prompt Error:\n\tAn unexpected error occurred.  Using the -trace option may provide \
            details on the failure."); 
        case "19" : 
            throw new Error("Configuration File Error:\n\tThe configuration file specified using the -O option is not \
            correctly formatted.");
        case "21" : 
            throw new Error("Abort Requested:\n\tThe browse process received an abort request before operations were \
            completed.")
        case "22" : 
            throw new Error("Internal Error:\n\tAn unexpected error occurred.  Using the -trace option may provide \
            details on the failure.");
        case "23" : 
            throw new Error("Process Start Error:\n\tAn unexpected error occurred.  Using the -trace option may \
            provide details on the failure.");
        case "30" :
            throw new Error("Session Dead Error:\n\tAn unexpected error occurred.  Using the -trace option may \
            provide details on the failure.");
        case "33" :
            throw new Error("Authorization Error:\n\tThe agent does not accept connections from the manager OR \
            the agent does not have a grant for the manager to operate as the specified user.");
        case "40" :
            throw new Error("Version Mismatch:\n\tThe manager and agent versions of the Signiant software are not \
            compatible.");
        default: 
            throw new Error("Unknown Error has occurred. ")
    }
}


function updateSigniantJobStatus(signiantJob, user, password, jobGroup, signiantJobName) {
    /*
     * Here we begin the job straight away, we use the jobName that we have assigned
     * and the option force, this means the job occurs immediately.
     */
    var startJob = signiantJob.commandForJob(user, password, jobGroup, signiantJobName, "force");

    if(!startJob){
        throw new Error("Failed To Start Signiant Job.");
    }

    /*
     * Here the status of the job is evaluated, the jobstate has a few a list of values
     * that it can be at certain stages of the transfer, IDLE means that no job is
     * currently active.
     */
    var jobState = "Unknown"; // Set to an unknown state before entering the loop.
    while(jobState != "IDLE"){
        print("=============================================");
        jobState = signiantJob.getJobActiveState(user, password, signiantJobName, jobGroup);

        var requestedStats = "byte_count,files_transferred,effective_bytes,files_skipped"
        var statsString = signiantJob.getStats(user, password, signiantJobName, jobGroup, 0, requestedStats, ",", "\n");
        print("statsString is" + statsString);
        var statsArray = statsString.split('\n');
        print("before join and split" + statsArray);
        statsArray = statsArray.join(",").split(',');
        print("After join and Split" + statsArray);
        // Need to work out the position of the FILE_TRF in the stats to get all information relative to it.
        var fileTrfIndex = statsArray.indexOf("FILE_TRF");
        print("file trf indesx is" + fileTrfIndex);
        try {
            if(statsArray != null && statsArray.length > 6){

                var totalBytes = statsArray[3 + fileTrfIndex]; // Signiant calls this "byte_count"
                var filesTransferred = statsArray[4 + fileTrfIndex];
                var bytesTransferred = statsArray[5 + fileTrfIndex]; // Signiant calls this "effective_bytes"
                var filesSkipped = statsArray[6 + fileTrfIndex];

                print("Files Transferred [" + filesTransferred + "] Files Skipped [" + filesSkipped + "]");
                print("Total Bytes [" + totalBytes + "] Bytes Transferred [" + bytesTransferred + "]");

                if(totalBytes != 0){
                    var percentComplete = Math.round(((bytesTransferred / totalBytes) * 100));

                    var startPercent = 41;var signiantJobParamsXML = placingXML..Preset.(PresetType == 'Delivery');
                    var endPercent = 94;
                    var totalPercent = endPercent - startPercent;
                    var returnPercent = parseInt(((percentComplete/100)*totalPercent) + startPercent);
                    print("Percent Complete [" + returnPercent + "]");
                    updateStatus({"JOB__PROGRESS" : returnPercent})
                }
            }
            sleep(5);
        } catch(e){
            print("Warning Non Fatal Occured: " + e);
        }
    }
}

function signiantTransfer(placingXML, path, fileName){
    //Get the details for the transfer from the preset.
    var preset = String(placingXML..Preset.(PresetType == 'Delivery').Name);
    var signiantJobParamsXML = placingXML..Preset.(PresetType == 'Delivery');

    var user = "mediator";
    var password = "mediator";
    var signiantJobName = (String(jobDescription..PlacingId) +"_"+ _jobId.replace(/[^0-9]/g,"")).replace(/[-]/g, "_");
    var sourceAgent = signiantJobParamsXML..Tag.(TagType == "NLD Signiant Source Agent").Value;
    var targetAgent = signiantJobParamsXML..Tag.(TagType == "NLD Signiant Target Agent").Value;
    var bandwidthCeiling =  parseInt(signiantJobParamsXML..ShortText.(ShortTextType == "NLD Bandwidth Ceiling").Value); // Bytes represetation of 100Mb
    var bandwidthFloor = parseInt(signiantJobParamsXML..ShortText.(ShortTextType == "NLD Bandwidth Floor").Value);
    var targetRelayAgent = signiantJobParamsXML..ShortText.(ShortTextType == "NLD Signiant Target Relay Agent").Value;   //Can be empty or an IP
    var targetPath = signiantJobParamsXML..ShortText.(ShortTextType == "NLD Signiant Target Path").Value; //Test folder created on the same bucket
    var jobTemplateName = signiantJobParamsXML..Tag.(TagType == "NLD Signiant Job Template Name").Value;
    var jobTemplateLibraryName = signiantJobParamsXML..Tag.(TagType =="NLD Signiant Job Template Library Name").Value;
    var jobGroup = signiantJobParamsXML..Tag.(TagType =="NLD Signiant Job Group").Value;
    var fileListPath = signiantJobParamsXML..ShortText.(ShortTextType == "NLD Signiant File List").Value;

    var managerIp = signiantJobParamsXML..Tag.(TagType == "NLD Signiant Manager").Value; 
    var signiantManagerUrl = "http://" + managerIp + "/signiant_customizer/services";

    var signiantJob = new RunService(signiantManagerUrl);

    var connectToSigniant = signiantJob.createService();
    if (!connectToSigniant){
        throw new Error("Connection To Signiant Manager Failed");
    }

    print("Connected to Signiant");
    var fileList = [fileListPath  + path + "/" + fileName];


    //Variables used for the sigiant job
    var jobVariables = [
        jobTemplateName + ".Schedule.sourceAgent",
        jobTemplateName + ".Schedule.targetAgent",
        jobTemplateName + ".Schedule.fileList",
        jobTemplateName + ".Schedule.targetDirectory",
        jobTemplateName + ".Schedule.bandwidthCeiling",
        jobTemplateName + ".Schedule.bandwidthFloor",
        jobTemplateName + ".Schedule.targetRelayAgent"
    ];

    var jobVariableValues = [
        sourceAgent,
        targetAgent,
        fileList,
        targetPath,
        bandwidthCeiling,
        bandwidthFloor,
        targetRelayAgent
    ];



    var retryCount = 1;
    var createJob = false;
    while (retryCount <= 3 && createJob == false){
        print("Trying to create Signaint Job, Attemt [" + retryCount + "]");
        /*
         * Here we create the Signiant job. This does not start the job but sets all the required settings.
         */
        var createJob = signiantJob.createShortJob(
            user,
            password,
            signiantJobName,
            jobGroup,
            jobTemplateLibraryName,
            jobTemplateName,
            'UTC',
            jobVariables,
            jobVariableValues
        );
        retryCount++;
    }
    updateStatusMap("Signiant Job Created",35);

    if(!createJob){
        throw new Error("Failed to Create Signiant Job.");
    }
    
    updateStatusMap("Signiant Job Started",40);
    print("Signiant Job Created");

    var filesTransferred = updateSigniantJobStatus(signiantJob, user, password, jobGroup, signiantJobName);

    var jobExitCode = signiantJob.getLastJobResult(user, password, signiantJobName, jobGroup);
    
    print("Job Exit Code [" + jobExitCode + "]");
    signiantExitCodeDetails(jobExitCode);
    updateStatusMap("Signiant Job Completed Successfully",95);
    print("Signiant Job Completed Successfully");
    
}