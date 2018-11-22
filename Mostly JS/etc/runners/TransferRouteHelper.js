/**
 * @Author: Craig Gardner <Craig_Gardner>
 * @Date:   2017-09-14
 * @Email:  c.gardner@nbcuni.com
 * @Filename: TransferRouteHelper.js
 * @Last modified by:   Craig_Gardner
 * @Last modified time: 2017-09-14
 */

var TransferRouteHelper = function(medianame) {
    /*
    trh = new TransferRouteHelper("DC_2398_LF_HD_PRORES");

    */

    if(typeof(gmoNBCFunc)==="undefined"){
        load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
    }

    this.__medianame = medianame;
    this.__validqc_media

    if (gmoNBCFunc.contains(NBCGMO.storeMedias, medianame)) {
        this.__mediacomponenttype = "MAIN ASSET";
        this.__mediatype = "DVS";
    } else if (gmoNBCFunc.contains(NBCGMO.storeAudioMedias, medianame)) {
        this.__mediacomponenttype = "AUDIO";
        this.__mediatype = "DVS";
    } else if (gmoNBCFunc.contains(NBCGMO.archiveMedias, medianame)) {
        this.__mediacomponenttype = "MAIN ASSET";
        this.__mediatype = "LTO";
    } else if (gmoNBCFunc.contains(NBCGMO.t2Medias, medianame)) {
        this.__mediacomponenttype = "MAIN ASSET";
        this.__mediatype = "T2";
    } else if (gmoNBCFunc.contains(NBCGMO.t2AudioMedias, medianame)) {
        this.__mediacomponenttype = "AUDIO";
        this.__mediatype = "T2";
    } else {
        throw new Error("Unrecognized/Un-Configured Media [" + medianame + "]");
    }

    this.getMediaComponentType = function() {
        return this.__mediacomponenttype;
    }

    this.getMediaType = function() {
        return this.__mediatype
    }

    this.getMediaName = function() {
        return this.__medianame;
    }

    this.isValidQCMedia = function() {
        if (gmoNBCFunc.isVarUsable(this.__validqc_media)) {
            return this.__validqc_media;
        } else if (gmoNBCFunc.contains(NBCGMO.validQCmedias, this.__medianame)) {
            this.__validqc_media = true;
            return true;
        } else {
            this.__validqc_media = false;
            return false;
        }
    }

    this.isT2Media = function() {
        return (this.getMediaType() === "T2");
    }

    this.getTargetQCMedia = function(medianame) {
        if (this.isValidQCMedia()) {
            return true
        } else if (this.getMediaType() === "T2") {
            return this.getMediaName().replace("_T2","");
        } else if (this.getMediaType() == "LTO") {
            return this.getMediaName().replace("DIVA_","");
        } else {
            print("getTargetQCMedia(): No Target QC Media Configured for [" + this.getMediaName() + "]");
            return this.getMediaName();
        }
    }
}
