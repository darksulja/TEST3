/*
* @Author: Karthik Rengasamy
* @Date:   2017-08-14 22:38:04
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-10-09 23:18:27
*/

var NBCGMO_CONSTANTS = {
        "WAV" : "wav",
        "PDF" : "pdf",
	"CMD" : {
		"AUDIOMANIPULATE" : "/usr/local/bin/audiomanipulate"
        },
	"EXT_APP_JOB_STATUS" :{
		"VANTAGE" : {
			"COMPLETE" : "Complete",
			"CANCELLED" : "StoppedByUser",
			"FAILED" : "Failed"
		}
	},
        "HOUSE_PROFILE_SPECIFICATIONS" : "House Profile Specifications",
        "DOT_DIR" : ".dir/",
        "DOT" : ".",
        "HYPHEN" : "-",
        "UNDERSCORE" : "_",
        "SPACE" : " ",
        "MOV" : "mov",
        "WAV" : "wav",
        "DUMMY_VIDEO_FILE" : "dummy.mov",
        "DUMMY_AUDIO_FILE" : "dummy.wav",
        "GENERATOR_SCRIPTS" : {
            "GMO_MAT_ID" : "material_generator",
                "UNTRUSTED_MAT_ID" : "untrusted_material_generator",
                "UNTRUSTED_COMPONENT_ID" : "untrusted_component_generator"
    },
    "FREE_SEQUENCE_MAPPING" : {
            "GMO_MAT_ID" : "FREE_SEQUENCE_01",
                "UNTRUSTED_MAT_ID" : "FREE_SEQUENCE_07",
                "UNTRUSTED_COMPONENT_ID" : "FREE_SEQUENCE_08",
    },
        "TRIGGERS" : {
                "START" : "Start",
                "COMPLETE" : "Complete",
                "COMPLETE_FIX" : "Complete (Fix)",
                "FAILED" : "Failed",
                "FAILED_FIX" : "Failed (Fix)",
                "UPLOAD" : "Upload",
                "ORDER_PLACED" : "Order Placed",
                "ERROR" : "Error",
                "PASSED" : "Passed",
                "COMPLETE" : "Complete",
                "UPLOAD": "Upload",
                "PURGE": "Purge"
        },
        "OWNERS" : {
                "NBCU_GMO" : "NBCU GMO",
                "AD_OPS" : "Ad Ops"
        },
        "STATE_MACHINES" : {
                "NBC_GMO" : "NBC GMO",
                "AD_OPS_DISTRIBUTION" : "Ad Ops Distribution State Machine",
                "AD_OPS_QC" : "Ad Ops QC State Machine",
                "UNTRUSTED_COMPONENT": "Untrusted Component"   
        },
        "STATES" : {
                "NOT_AVAILABLE" :       "Not available"
        },
        "TRACK_TYPES" : {
                "VIDEO" : "Video",
                "AUDIO" : "Audio",
                "MOS"   : "MOS",
                "MEZZANINE"      : "Mezzanine",
                "HIGH"      : "High",
                "MEDIUM"      : "Medium",
                "LOW"      : "Low",
                "VAST"  : "VAST"
        },
        "COMMENT_TYPES" : {
                "VAST" : "VAST",
                "VAST_AD" : "VAST Ad",
                "VIDEO" : "Video",
                "AUDIO" : "Audio"
        },
        "SHORT_TEXTS" : {
                "AUDIO_PROFILE" : "Audio Profile",
                "ORIGINAL_FILE_NAME" : "Original File Name",
                "SOURCE_ADJUSTED_TO_HOUSE_SPEC" : "Source Adjusted To House Spec",
                "ADOPS_CAMPAIGN_ORDER_NAME" : "Campaign Order Name",
                "ADOPS_CAMPAIGN_ORDER_ID" : "Campaign Order ID",
                "ADOPS_VERTICAL" : "Vertical",
                "ADOPS_ADVERTISER" : "Advertiser",
                "ADOPS_ADVERTISER_ID" : "Advertiser ID",
                "ADOPS_CREATIVE_NAME" : "Creative Name",
                "ADOPS_VAST_UNIQUE_ID" : "VAST Unique ID",
                "ADOPS_TRAFFICKER_NAME" :  "Trafficker Name",
                "ADOPS_TRACKING_ELEMENT_COUNT" : "Tracking Element Count",
                "ADOPS_IMPRESSION_COUNT" : "Impression Count",
                "ADOPS_CREATIVE_ID" : "Creative Id",
                "ADOPS_AD_ID" : "Ad Id",
                "VIDEO_FILE_NAME" : "Video File Name",
                "RESOLUTION" : "Resolution",
                "VIDEO_FILE_SIZE" : "Video File Size",
                "VIDEO_BIT_RATE" : "Video Bit Rate",
                "AUDIO_BIT_RATE" : "Audio Bit Rate",
                "AUDIO_SAMPLING_RATE" : "Audio Sampling Rate",
                "AUDIO_CHANNEL_COUNT" : "Audio Channel Count",
                "DAISY_ID" : "Daisy ID",
                "TVD_PRODUCTION_NUM" : "TVD Production #",
                "PRIMARY_LANGUAGE" : "Primary Language",
                "VAST_ORDER_ID" : "VAST Order Id"

        },
        "TAGS" : {
                "DROP_FOLDER" : "Drop Folder",
                "VALID_MEDIA_UPLOAD_VALUES" : "Valid Media upload values",
                "MSA_REVIEW_VANTAGE_WORKFLOW" : "MSAReviewVantageWorkflow"
        },
        "MEDIAS" : {
                "STAGING" : {
                        "DC_OM_STAGING" : "DC_OM_STAGING",
                        "DC_T2_OM_STAGING" : "DC_T2_OM_STAGING",
                        "DC_DELIVERY1_STAGING" : "DC_DELIVERY1_STAGING",
                        "DC_DELIVERY2_STAGING" : "DC_DELIVERY2_STAGING"
                },
                "WORKING" : {
                        "DC_OM_WORKING" : "DC_OM_WORKING"
                }
        },
        "MEDIATOR_BRIDGE" : {
                "REST_METHODS" : {
                        "TRANSCODE" : {
                                "VANTAGE" : {
                                        "SUBMIT_JOB" : "vantage-transcode",
                                        "POLL_JOB_STATUS" : "vantage-get-job-status",
                                        "GET_ERROR_MESSAGE" : "vantage-get-error-message",
                                        "DOMAIN" : "GMO_Domain"
                                }
                        }
                }
        },
        "FFMPEG_BRIDGE" : {
            "REST_METHODS" : {
                    "TRANSCODE" : {
                            "FFMPEG" : {
                                    "SUBMIT_JOB" : "execute-ffmpeg-job",
                                    "POLL_JOB_STATUS" : "query-ffmpeg-state"
                            }
                    }
            }
        },       
        "BATON_SERVICE" : {
                "REST_METHODS" : {
                        "SUBMIT_JOB" : "submitJob",
                        "POLL_JOB_STATUS" : "status",
                        "GET_VAST_QC_RESULTS" : "getVASTQCResults",
                        "GET_PDF" : "getPDF"
                }
        },    
        "CMD" : {
                "AUDIOMANIPULATE" : "/usr/local/bin/audiomanipulate"
        },
        "EXT_APP_JOB_STATUS" :{
                "VANTAGE" : {
                        "COMPLETE" : "Complete",
                        "CANCELLED" : "StoppedByUser",
                        "FAILED" : "Failed"
                }
        },
        "TRANSCODE_WORKFLOWS":{
                "VANTAGE" :{
                        "AUDIO_EXTRACTION" : "GMO_OM_UPLOAD"
                }
        },
        "VANTAGE" : "VANTAGE",
        "VIDEO" : "Video",
        "AUDIO" : "Audio",
        "VAST"  : "VAST",
        "DEFAULT_FRAME_RATE" : "DF30",
        "DEFAULT_DURATION" : "00:00:00:00",
        "DEFAULT_ADOPS_VAST_MATERIAL_TYPE" : "VAST Creative",
        "MEDIATOR_TEMP_PATH" : "/srv/tmp/"
        }
