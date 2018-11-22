/*
* @Author: Chad Lundgren
* @Date:   2018-06-26 23:26:09
* @Last Modified by:  Chad Lundgren
* @Last Modified time: 2018-06-26 12:18:29
*/
var dry_run = false;

function FfmpegBridgeTranscodeHelper() {
    if((this instanceof FfmpegBridgeTranscodeHelper) === false)    throw new Error("Please call constructor with new() keyword")
    if(typeof(gmoNBCFunc)==="undefined")  load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js")
    if(typeof(FfmpegBridgeInterface)==="undefined")  load("/opt/evertz/mediator/etc/runners/FfmpegBridgeInterface.js")
    if(typeof(NBCGMO_CONSTANTS)==="undefined")  load("/opt/evertz/mediator/etc/helpers/nbcgmo_constants.js")
       if(typeof(JRAPI)==="undefined"){
              load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js');
        }
        
    this.__JRAPI = new JRAPI();
    this.__FfmpegBridgeInterface = new FfmpegBridgeInterface();
    this.__FfmpegBridgeInterface.initializeFfmpegBridge();
    var transcoderRestProperties = NBCGMO_CONSTANTS['FFMPEG_BRIDGE']['REST_METHODS']['TRANSCODE']['FFMPEG'];
    FfmpegBridgeTranscodeHelper.prototype.constructor = FfmpegBridgeTranscodeHelper;
    print('FfmpegBridgeTranscodeHelper started');

    /**
     * [getFfmpegBridgeInterface Returns an instance of FfmpegBridgeInterface]
     * @return {[FfmpegBridgeInterface]}
     */
    FfmpegBridgeTranscodeHelper.prototype.getFfmpegBridgeInterface = function(){
        return this.__FfmpegBridgeInterface;
    };

    /**
     * [submitTranscodeJob Submits a Trancode Job]
     * @param  {[string]} inputFile   
     * @param  {[string]} inputOptions 
     * @param  {[string]} outputFile
     * @param {[string]}  outputOptions
     * @return {[string]} reponse
     */
    FfmpegBridgeTranscodeHelper.prototype.submitFfmpegJob = function(inputFile,inputOptions,outputFile,outputOptions) {
        output("submitFfmpegJob - start");
         this.__JRAPI = new JRAPI()
        var response;

        if (gmoNBCFunc.isVarUsable(transcoderRestProperties)) {
            var method = transcoderRestProperties.SUBMIT_JOB;
            print('FFMPEG final arguments for POST are: inputFile: ' + inputFile + ' inputOptions: ' +  inputOptions + ' outputFile: ' + outputFile + ' outputOptions: [' + outputOptions + ']' );
            output("Rest method to submitFfmpegJob is ["+method+"]");
            try {
                var request = {
                    inputFile                :   inputFile,
                    inputOptions              :  inputOptions,
                    outputFile                :  outputFile,
                    outputOptions             :  outputOptions
                }
                if (dry_run == true) {
                    throw new Error("Dry run, exiting before actual postMessage");  
                }
                var response = this.getFfmpegBridgeInterface().postMessage(request, method, dry_run);
    
                if (response == false) {
                    throw new Error(response);
                }

                if (response.errmsg == "Failed") {
                    throw new Error(response);
                }

            } catch(TranscodeJobSubmitException) {
                output("FFMPEG Job Submit Exception: - " + TranscodeJobSubmitException); 
                throw new Error("FFMPEG Job Submit Exception: - " + TranscodeJobSubmitException);
            }

        } else { 
            throw new Error("No Rest Properties Defined for the Transcoder Type [FFMPEG]")
        }
        output("submitTranscodeJob - end");
        return response;
    }
    /**
     * [getTranscodeJobStatus Gets the Status Of Transcode Job]
     * @param  {[string]} jobId 
     * @return {[object]}      
     */
    FfmpegBridgeTranscodeHelper.prototype.getTranscodeJobStatus = function(jobId) {
        output("getTranscodeJobStatus - start");
        var response;
        if(gmoNBCFunc.isVarUsable(transcoderRestProperties)){
            var method = transcoderRestProperties.POLL_JOB_STATUS;
            output("Rest method to getTranscodeJobStatus is ["+method+"]");
            try {
                var request = { "jobId": jobId };
                response = this.getFfmpegBridgeInterface().postMessage(request, method, dry_run); 
                if (typeof response != "undefined" && response == false ) {
                    throw new Error('Response returned false');
                }
            } catch (TranscodeJobGetStatusException) {
                throw new Error("Transcode Job Get Status Exception: Failed To Get Status of a Transcode Job [FFMPEG+] - " + TranscodeJobGetStatusException );
            }
        } else {
            throw new Error("No Rest Properties Defined for the Transcoder Type ["+ FFMPEG +"]");
        }
        output("getTranscodeJobStatus - end");
        return response;
    }

    /**
     * [makeFfmpegOutputOptions: Utility function to make options]
     * @param  {[string]} tag
     * @param  {object} optionArray 
     * @return {[string]}
     */
    FfmpegBridgeTranscodeHelper.prototype.makeFfmpegOutputOptions = function(tag, optionArray) {
        var filesString = ' ';
            for each (var item in optionArray ) {
            filesString += (tag + ' ' + item + ' ');
            }
            return filesString;
     }

}
 