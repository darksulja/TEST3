//==================================================================//
// 				LookUps and Settings for NBCGMO					    //
//==================================================================//



var NBCGMO = {

	formtypelookup 	: {
		"Episodic" : "LF",
		"Program" : "LF",
		"Programme"	: "LF",
		"Movie"	: "LF",
		"Episode" : "LF",
		"Feature" : "LF",
		"Promo" : "SF",
		"Promotion"	: "SF",
		"Commercial" : "SF",
		"Filler" : "SF",
		"Menu"  : "SF",
		"Warning Board" : "SF",
		"Spot" : "SF",
		"Bumper" : "SF",
		"Interstitial" : "SF",
		"Credits" : "SF",
		"Animations" : "SF",
		"Lower Third" : "SF",
		"Ident" : "SF",
		"Promo Clip" : "SF",
		"Promo/PSA"	: "SF",
		"Trailer" : "SF",
		"Voiceover"	     : "VO",
		"Insert Reel" : "IR",
	},

	// List of the Profile Groups
	contributionProfileGroups : {
		"HouseProfiles"	: [
			"ProRes422HQ_HD_2398",
			"ProRes422HQ_HD_NDF25",
			"ProRes422HQ_SD_NDF25",
			"ProRes422SQ_HD_NDF25",
			"ProRes422HQ_SD_2398",
			"ProRes422HQ_HD_2997",
			"ProRes422HQ_SD_2997",
			"XDCAM422_HD_2997",
			"XDCAM422_HD_2398",
			"ProRes422SQ_HD_2398",
			"ProRes422SQ_HD_2997",
			"ProRes4444HQ_UHD_2398",
			"ProRes4444HQ_UHD_NDF25",
			"ProRes4444HQ_UHD_DF30",
			"ProRes422HQ_SDR_DF30"
		]
	},

	// List of Profiles
	contributionProfiles : {
		"ProRes422HQ_HD_2398" : {
			  "generalFormat" : ["MPEG-4","QuickTime"],
			  "codecsVideo" : "apch",
			  "videoFramerate" : 23.976,
			  "exactVideoWidth" : 1920,
			  "exactVideoHeight" : 1080,
			  "minVideoBitrate" : 0,
	  		  "maxVideoBitrate" : 200000000,
			  "videoFormat" : "ProRes",
			  "videoFormatProfile" : ["422 HQ","High"],
			  "videoChromaSampling" : "4:2:2",
			  "videoScan" : "Progressive"
		},
		"ProRes422HQ_SD_2398" : {
			  "generalFormat" : ["MPEG-4","QuickTime"],
			  "codecsVideo" : "apch",
			  "videoFramerate" : 23.976,
			  "exactVideoWidth" : 720,
			  "exactVideoHeight" : 486,
			  "minVideoBitrate" : 0,
			  "maxVideoBitrate" : 200000000,
			  "videoFormat" : "ProRes",
			  "videoFormatProfile" : ["422 HQ","High"],
			  "videoChromaSampling" : "4:2:2",
			  "videoScan" : "Progressive"
		},
		"ProRes422HQ_HD_2997" : {
			"generalFormat" : ["MPEG-4","QuickTime"],
			  "codecsVideo" : "apch",
			  "videoFramerate" : 29.970,
			  "exactVideoWidth" : 1920,
			  "exactVideoHeight" : 1080,
			  "minVideoBitrate" : 80000000,
			  "maxVideoBitrate" : 300000000,
			  "videoFormat" : "ProRes",
			  "videoFormatProfile" : ["422 HQ","High"],
			  "videoChromaSampling" : "4:2:2",
			  "videoScan" : ["Interlaced","Progressive"]

		},
		"ProRes422HQ_SD_2997" : {
			"generalFormat" : ["MPEG-4","QuickTime"],
			  "codecsVideo" : "apch",
			  "videoFramerate" : 29.970,
			  "exactVideoWidth" : 720,
			  "exactVideoHeight" : 486,
			  "minVideoBitrate" : 20000000,
			  "maxVideoBitrate" : 220100000,
			  "videoFormat" : "ProRes",
			  "videoFormatProfile" : ["422 HQ","High"],
			  "videoChromaSampling" : "4:2:2",
			  "videoScan" : ["Interlaced","Progressive"]
		},
		"XDCAM422_HD_2997" : {
			 "generalFormat" : ["MPEG-4","QuickTime"],
			  "codecsVideo" : "MPEG-2 Video",
			  "videoFramerate" : 29.970,
			  "exactVideoWidth" : 1920,
			  "exactVideoHeight" : 1080,
			  "minVideoBitrate" : 45000000,
			  "videoFormat" : "MPEG Video",
			  "videoFormatProfile" : "4:2:2@High",
			  "videoChromaSampling" : "4:2:2",
			  "videoScan" : ["Interlaced","Progressive"]
		},
		"XDCAM422_HD_2398" : {
			 "generalFormat" : ["MPEG-4","QuickTime"],
			  "codecsVideo" : "MPEG-2 Video",
			  "videoFramerate" : 23.976,
			  "exactVideoWidth" : 1920,
			  "exactVideoHeight" : 1080,
			  "minVideoBitrate" : 45000000,
			  "videoFormat" : "MPEG Video",
			  "videoFormatProfile" : "4:2:2@High",
			  "videoChromaSampling" : "4:2:2",
			  "videoScan" : "Progressive"
		},
		"ProRes422SQ_HD_2997" : {
			  "generalFormat" : ["MPEG-4","QuickTime"],
			  "codecsVideo" : "apcn",
			  "videoFramerate" : 29.970,
			  "exactVideoWidth" : 1920,
			  "exactVideoHeight" : 1080,
			  "minVideoBitrate" : 120000000,
			  "maxVideoBitrate" : 150000000,
			  "videoFormat" : "ProRes",
			  "videoFormatProfile" : ["422 HQ","High"],
			  "videoChromaSampling" : "4:2:2",
			  "videoScan" : ["Interlaced","Progressive"]
		},
		"ProRes422SQ_HD_2398" : {
			  "generalFormat" : ["MPEG-4","QuickTime"],
			  "codecsVideo" : "apcn",
			  "videoFramerate" : 23.976,
			  "exactVideoWidth" : 1920,
			  "exactVideoHeight" : 1080,
			  "minVideoBitrate" : 100000000,
			  "maxVideoBitrate" : 120000000,
			  "videoFormat" : "ProRes",
			  "videoFormatProfile" : ["422 HQ","High"],
			  "videoChromaSampling" : "4:2:2",
			  "videoScan" : "Progressive"
		},
		"ProRes422HQ_HD_NDF25" : {
			"generalFormat" : ["MPEG-4","QuickTime"],
			"codecsVideo" : "apch",
			"videoFramerate" : 25.000,
			"exactVideoWidth" : 1920,
			"exactVideoHeight" : 1080,
			"minVideoBitrate" : 75000000,
			"maxVideoBitrate" : 200000000,
			"videoFormat" : "ProRes",
			"videoFormatProfile" : ["422 HQ","High"],
			"videoChromaSampling" : "4:2:2",
			"videoScan" : ["Interlaced","Progressive"]
		},
		"ProRes422HQ_SD_NDF25" : {
			"generalFormat" : ["MPEG-4","QuickTime"],
			"codecsVideo" : "apch",
			"videoFramerate" : 25.000,
			"exactVideoWidth" : 720,
			"exactVideoHeight" : 576,
			"minVideoBitrate" : 0,
			"maxVideoBitrate" : 200000000,
			"videoFormat" : "ProRes",
			"videoFormatProfile" : ["422 HQ","High"],
			"videoChromaSampling" : "4:2:2",
			"videoScan" : ["Interlaced","Progressive"]
		},
		"ProRes422SQ_HD_NDF25" : {
			"generalFormat" : ["MPEG-4","QuickTime"],
			"codecsVideo" : "apcn",
			"videoFramerate" : 25.000,
			"exactVideoWidth" : 1920,
			"exactVideoHeight" : 1080,
			"minVideoBitrate" : 100000000,
			"maxVideoBitrate" : 120000000,
			"videoFormat" : "ProRes",
			"videoFormatProfile" : ["422 HQ","High"],
			"videoChromaSampling" : "4:2:2",
			"videoScan" : ["Interlaced","Progressive"]
		},
		"IMX_SD_DF30" : {
			"generalFormat" : ["MPEG-4","QuickTime"],
			"codecsVideo" : ["MPEG-2 Video","mx5n"],
			"codecID" : ["mx5n"],
			"videoFramerate" : 29.970,
			"exactVideoWidth" : 720,
			"exactVideoHeight" : 486,
			"minVideoBitrate" : 0,
			"maxVideoBitrate" : 60000000,
			"videoFormat" : "MPEG Video",
			"videoScan" : ["Interlaced"]
		},
		"ProRes4444HQ_UHD_2398" : {
			"generalFormat" : ["MPEG-4","QuickTime"],
			"codecsVideo" : ["ap4h", "apch"],
			"videoFramerate" : 23.976,
			"exactVideoWidth" : 3840,
			"exactVideoHeight" : 2160,
			"minVideoBitrate" : 0,
			"maxVideoBitrate" : 1501264741,
			"videoFormat" : "ProRes",
			"videoFormatProfile" : ["4444"],
			"videoChromaSampling" : "4:4:4",
			"videoScan" : ["Interlaced","Progressive"]
		},
		"ProRes4444HQ_UHD_NDF25" : {
			"generalFormat" : ["MPEG-4","QuickTime"],
			"codecsVideo" : ["ap4h", "apch"],
			"videoFramerate" : 25.000,
			"exactVideoWidth" : 3840,
			"exactVideoHeight" : 2160,
			"minVideoBitrate" : 0,
			"maxVideoBitrate" : 1501264741,
			"videoFormat" : "ProRes",
			"videoFormatProfile" : ["4444"],
			"videoChromaSampling" : "4:4:4",
			"videoScan" : ["Interlaced","Progressive"]
		},
		"ProRes4444HQ_UHD_DF30" : {
			"generalFormat" : ["MPEG-4","QuickTime"],
			"codecsVideo" : ["ap4h", "apch"],
			"videoFramerate" : 29.970,
			"exactVideoWidth" : 3840,
			"exactVideoHeight" : 2160,
			"minVideoBitrate" : 0,
			"maxVideoBitrate" : 1501264741,
			"videoFormat" : "ProRes",
			"videoFormatProfile" : ["4444"],
			"videoChromaSampling" : "4:4:4",
			"videoScan" : ["Interlaced","Progressive"]
		},
		"ProRes422HQ_SDR_DF30" : {
			"generalFormat" : ["MPEG-4","QuickTime"],
			"codecsVideo" : ["ap4h", "apch"],
			"videoFramerate" : 29.970,
			"exactVideoWidth" : 3840,
			"exactVideoHeight" : 2160,
			"minVideoBitrate" : 0,
			"maxVideoBitrate" : 1501264741,
			"videoFormat" : "ProRes",
			"videoFormatProfile" : ["422 HQ"],
			"videoChromaSampling" : "4:2:2",
			"videoScan" : "Interlaced"
		}
	},

	// Maps Audio Standards to a Profile
	contributionProfilesAudioSettings : {
		"ProRes422HQ_HD_2398" : {
			"Codec" : "PCM",
			"BitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"ProRes422HQ_SD_2398" : {
			"Codec" : "PCM",
			"BitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"ProRes422HQ_HD_2997" : {
			"Codec" : "PCM",
			"minBitRate" : 750000,
			"BitRate" : 2500000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"ProRes422HQ_SD_2997" : {
			"Codec" : "PCM",
			"BitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"XDCAM422_HD_2997" : {
			"Codec" : "PCM",
			"BitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"XDCAM422_HD_2997" : {
			"Codec" : "PCM",
			"BitRate" : 5052000,
			"minBitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"XDCAM422_HD_2398" : {
			"Codec" : "PCM",
			"BitRate" : 5052000,
			"minBitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"XDCAM422_HD_2398" : {
			"Codec" : "PCM",
			"BitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"ProRes422SQ_HD_2398" : {
			"Codec" : "PCM",
			"BitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"ProRes422SQ_HD_2997" : {
			"Codec" : "PCM",
			"BitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"ProRes422HQ_HD_NDF25" : {
			"Codec" : "PCM",
			"BitRate" : 5052000,
			"minBitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"ProRes422HQ_SD_NDF25" : {
			"Codec" : "PCM",
			"BitRate" : 5052000,
			"minBitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"ProRes422SQ_HD_NDF25" : {
			"Codec" : "PCM",
			"BitRate" : 5052000,
			"minBitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"IMX_SD_DF30" : {
			"Codec" : "PCM",
			"minBitRate" : 750000,
			"BitRate" : 4000000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"ProRes4444HQ_UHD_2398" : {
			"Codec" : "PCM",
			"BitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"ProRes4444HQ_UHD_NDF25" : {
			"Codec" : "PCM",
			"BitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"ProRes4444HQ_UHD_DF30" : {
			"Codec" : "PCM",
			"BitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		},
		"ProRes422HQ_SDR_DF30" : {
			"Codec" : "PCM",
			"BitRate" : 1152000,
			"SamplingRate" : 48000,
			"Resolution" : 24,
			"ChannelsPerStream" : 1
		}
	},

	// Maps Specific MetaData to Contribution Profiles
	contributionProfilesMetaData : {
		"ProRes422HQ_HD_2398"  : {
			"tags" : [{"Definition":"HD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "PRORES",
			"essenceformatvideo" : "PRORES",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_2398_LF_HD_PRORES",
			"defautAudioStorageMedia" : "DC_2398_LF_HD_WAV",
			"defaultStorageMediaSF" : "DC_2398_SF_HD_PRORES",
			"defautAudioStorageMediaSF" : "DC_2398_SF_HD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "ProRes"
		},
		"ProRes422HQ_HD_NDF25"  : {
			"tags" : [{"Definition":"HD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "PRORES",
			"essenceformatvideo" : "PRORES",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_NDF25_LF_HD_PRORES",
			"defautAudioStorageMedia" : "DC_NDF25_LF_HD_WAV",
			"defaultStorageMediaSF" : "DC_NDF25_SF_HD_PRORES",
			"defautAudioStorageMediaSF" : "DC_NDF25_SF_HD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "ProRes"
		},
		"ProRes422HQ_SD_NDF25"  : {
			"tags" : [{"Definition":"SD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "PRORES",
			"essenceformatvideo" : "PRORES",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_NDF25_LF_SD_PRORES",
			"defautAudioStorageMedia" : "DC_NDF25_LF_SD_WAV",
			"defaultStorageMediaSF" : "DC_NDF25_SF_SD_PRORES",
			"defautAudioStorageMediaSF" : "DC_NDF25_SF_SD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "ProRes"
		},
		"ProRes422SQ_HD_NDF25"  : {
			"tags" : [{"Definition":"HD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "PRORES",
			"essenceformatvideo" : "PRORES",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_NDF25_LF_HD_PRORES",
			"defautAudioStorageMedia" : "DC_NDF25_LF_HD_WAV",
			"defaultStorageMediaSF" : "DC_NDF25_SF_HD_PRORES",
			"defautAudioStorageMediaSF" : "DC_NDF25_SF_HD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "ProRes"
		},
		"ProRes422HQ_SD_2398" : {
			"tags" : [{"Definition":"SD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "PRORES",
			"essenceformatvideo" : "PRORES",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_2398_LF_SD_PRORES",
			"defautAudioStorageMedia" : "DC_2398_LF_SD_WAV",
			"defaultStorageMediaSF" : "DC_2398_SF_SD_PRORES",
			"defautAudioStorageMediaSF" : "DC_2398_SF_SD_WAV",
			"aspectratio"         : "",
			"transformation"      : "",
			"format" : "ProRes"
		},
		"ProRes422HQ_HD_2997"  : {
			"tags" : [{"Definition":"HD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "PRORES",
			"essenceformatvideo" : "PRORES",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_DF30_LF_HD_PRORES",
			"defautAudioStorageMedia" : "DC_DF30_LF_HD_WAV",
			"defaultStorageMediaSF" : "DC_DF30_SF_HD_PRORES",
			"defautAudioStorageMediaSF" : "DC_DF30_SF_HD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "ProRes"
		},
		"ProRes422HQ_SD_2997"  : {
			"tags" : [{"Definition":"SD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "PRORES",
			"essenceformatvideo" : "PRORES",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_DF30_LF_SD_PRORES",
			"defautAudioStorageMedia" : "DC_DF30_LF_SD_WAV",
			"defaultStorageMediaSF" : "DC_DF30_SF_SD_PRORES",
			"defautAudioStorageMediaSF" : "DC_DF30_SF_SD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "ProRes"
		},
		"XDCAM422_HD_2997"  : {
			"tags" : [{"Definition":"HD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "XDCAM",
			"essenceformatvideo" : "XDCAM",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_DF30_LF_HD_XDCAM",
			"defautAudioStorageMedia" : "DC_DF30_LF_HD_WAV",
			"defaultStorageMediaSF" : "DC_DF30_SF_HD_XDCAM",
			"defautAudioStorageMediaSF" : "DC_DF30_SF_HD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "MPEG2"
		},
		"XDCAM422_HD_2398"  : {
			"tags" : [{"Definition":"HD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "XDCAM",
			"essenceformatvideo" : "XDCAM",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_2398_LF_HD_XDCAM",
			"defautAudioStorageMedia" : "DC_2398_LF_HD_WAV",
			"defaultStorageMediaSF" : "DC_2398_SF_HD_XDCAM",
			"defautAudioStorageMediaSF" : "DC_2398_SF_HD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "MPEG2"
		},
		"ProRes422SQ_HD_2398"  : {
			"tags" : [{"Definition":"HD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "PRORES",
			"essenceformatvideo" : "PRORES",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_2398_LF_HD_PRORES",
			"defautAudioStorageMedia" : "DC_2398_LF_HD_WAV",
			"defaultStorageMediaSF" : "DC_2398_SF_HD_PRORES",
			"defautAudioStorageMediaSF" : "DC_2398_SF_HD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "ProRes"
		},
		"ProRes422SQ_HD_2997"  : {
			"tags" : [{"Definition":"HD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "PRORES",
			"essenceformatvideo" : "PRORES",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_GMO_Isilon_Staging",
			"defaultStorageMedia" : "DC_DF30_LF_HD_PRORES",
			"defautAudioStorageMedia" : "DC_DF30_LF_HD_WAV",
			"defaultStorageMediaSF" : "DC_DF30_SF_HD_PRORES",
			"defautAudioStorageMediaSF" : "DC_DF30_SF_HD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "ProRes"
		},
		"ProRes4444HQ_UHD_2398"  : {
			"tags" : [{"Definition":"UHD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "PRORES",
			"essenceformatvideo" : "PRORES",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_2398_LF_HD_PRORES",
			"defautAudioStorageMedia" : "DC_2398_LF_HD_WAV",
			"defaultStorageMediaSF" : "DC_2398_SF_HD_PRORES",
			"defautAudioStorageMediaSF" : "DC_2398_SF_HD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "ProRes"
		},
		"ProRes4444HQ_UHD_NDF25"  : {
			"tags" : [{"Definition":"UHD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "PRORES",
			"essenceformatvideo" : "PRORES",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_NDF25_LF_HD_PRORES",
			"defautAudioStorageMedia" : "DC_NDF25_LF_HD_WAV",
			"defaultStorageMediaSF" : "DC_NDF25_SF_HD_PRORES",
			"defautAudioStorageMediaSF" : "DC_NDF25_SF_HD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "ProRes"
		},
		"ProRes4444HQ_UHD_DF30"  : {
			"tags" : [{"Definition":"UHD"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "PRORES",
			"essenceformatvideo" : "PRORES",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_DF30_LF_HD_PRORES",
			"defautAudioStorageMedia" : "DC_DF30_LF_HD_WAV",
			"defaultStorageMediaSF" : "DC_DF30_SF_HD_PRORES",
			"defautAudioStorageMediaSF" : "DC_DF30_SF_HD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "ProRes"
		},
		"ProRes422HQ_SDR_DF30"  : {
			"tags" : [{"Definition":"UHD SDR"}],
			"shorttexts" : [],
			"fulltexts" : [],
			"essencetype" : "PRORES",
			"essenceformatvideo" : "PRORES",
			"essenceformataudio" : "PCM",
			"form" : "LF",
			"defaultStagingMedia" : "DC_OM_STAGING",
			"defaultStorageMedia" : "DC_DF30_LF_HD_PRORES",
			"defautAudioStorageMedia" : "DC_DF30_LF_HD_WAV",
			"defaultStorageMediaSF" : "DC_DF30_SF_HD_PRORES",
			"defautAudioStorageMediaSF" : "DC_DF30_SF_HD_WAV",
			"aspectratio" : "",
			"transformation" : "",
			"format" : "ProRes"
		}
	},

	frameRateLookup : {
		"DF30"		:	"29.97",
		"DF60"		:	"59.94",
		"NDF25"		:	"25",
		"P23_976"	:	"23.976"
	},

	// Valid File Extension
	fileExtensions : ["mov"],

	// Host Settings
	hosts : {
		"dvs" : "den-dvs.moc.net"
	},

	// validQCmedias stores all the medias located on DVS (medias must be on DVS to QC)
	    validQCmedias : [
        "DC_2398_LF_HD_PRORES",
        "DC_2398_LF_HD_XDCAM",
        "DC_2398_SF_HD_PRORES",
        "DC_2398_SF_HD_XDCAM",
        "DC_DF30_LF_HD_PRORES",
        "DC_DF30_LF_HD_XDCAM",
        "DC_2398_LF_SD_PRORES",
        "DC_DF30_LF_SD_PRORES",
        "DC_NDF25_LF_HD_PRORES",
        "DC_NDF25_LF_SD_PRORES",
        "DC_NDF25_SF_HD_PRORES",
        "DC_NDF25_SF_SD_PRORES",
        "DC_DF30_LF_SD_IMX",
        "DC_DF30_SF_SD_IMX"
    ],

	defaultBatonCommentType : "Auto QC",
	validBatonMedias :  [
        "DC_T2_2398_LF_HD_PRORES",
        "DC_T2_2398_LF_HD_XDCAM",
        "DC_T2_2398_SF_HD_PRORES",
        "DC_T2_2398_SF_HD_XDCAM",
        "DC_T2_DF30_LF_HD_PRORES",
        "DC_T2_DF30_LF_HD_XDCAM",
        "DC_T2_2398_LF_SD_PRORES",
        "DC_T2_DF30_LF_SD_PRORES",
        "DC_2398_LF_HD_PRORES",
        "DC_2398_LF_HD_XDCAM",
        "DC_2398_SF_HD_PRORES",
        "DC_2398_SF_HD_XDCAM",
        "DC_DF30_LF_HD_PRORES",
        "DC_DF30_LF_HD_XDCAM",
        "DC_2398_LF_SD_PRORES",
        "DC_DF30_LF_SD_PRORES",
        "DC_NDF25_LF_HD_PRORES",
        "DC_NDF25_LF_SD_PRORES",
        "DC_NDF25_SF_HD_PRORES",
        "DC_NDF25_SF_SD_PRORES",
        "DC_T2_NDF25_LF_HD_PRORES",
        "DC_T2_NDF25_LF_SD_PRORES",
        "DC_T2_NDF25_SF_HD_PRORES",
        "DC_T2_NDF25_SF_SD_PRORES",
	"DC_DF30_SF_HD_PRORES",
        "DC_DF30_LF_SD_IMX",
        "DC_DF30_SF_SD_IMX",
        "DC_T2_DF30_LF_SD_IMX",
        "DC_T2_DF30_SF_SD_IMX"
	],
	
	validCaptionMedias : [
		"DC_Sub_SCC", 
		"DC_Sub_CAP", 
		"DC_Sub_PAC", 
		"DC_Sub_SMPTE-TT", 
		"DC_Sub_STL",
		"DC_T2_Sub_SCC",
		"DC_T2_Sub_SCC", 
		"DC_T2_Sub_CAP", 
		"DC_T2_Sub_PAC", 
		"DC_T2_Sub_SMPTE-TT", 
		"DC_T2_Sub_STL"
	],

	// Still used by use the more generic setting object below
	omUploadSettings : {
		"defaultVideoStagingMedia" : "DC_OM_STAGING"  // These will need to be regionalised
	},

	defaultUploadSettings : {
		stagingMedia : "DC_OM_STAGING"  // These will need to to be registered
	},

	// Used by Component Upload
	componentUploadSettings : {
		"defaultComponentStagingMedia" : "DC_COMPONENT_STAGING"
	},

	// Vantage Job Factory Maps
	vantageJobFactoryMap : {
		"GMO_VANTAGE_FARM"	: "vantageGatewayJobFactory"
	},

	// Properly ordered list of all Pipeline states.
	nldStates : [
		"Transfer",
		"Preprocessing",
		"Conform",
		"Post Processing",
		"Transcode",
		"Packaging",
		"Delivery",
		"Archive Order"
	],

	defaultNldStagingMedia : "NLDStaging",

	systemFailureEmailList : "Karthik.Rengasamy@nbcuni.com;C.Gardner@nbcuni.com;Carlos.Costa@nbcuni.com",

	storeMedias : [
		'DC_2398_LF_HD_PRORES',
		'DC_2398_SF_HD_PRORES',
		'DC_2398_LF_HD_XDCAM',
		'DC_2398_SF_HD_XDCAM',
		'DC_2398_LF_SD_PRORES',
		'DC_2398_SF_SD_PRORES',
		'DC_DF30_LF_HD_PRORES',
		'DC_DF30_LF_HD_XDCAM',
		'DC_DF30_LF_SD_PRORES',
		'DC_DF30_SF_HD_PRORES',
		'DC_DF30_SF_HD_XDCAM',
		'DC_DF30_SF_SD_PRORES',
		'DC_DF60_LF_HD_PRORES',
		'DC_DF60_LF_HD_XDCAM',
		'DC_DF60_LF_SD_PRORES',
		'DC_DF60_SF_HD_PRORES',
		'DC_DF60_SF_HD_XDCAM',
		'DC_DF60_SF_SD_PRORES',
		'DC_NDF25_LF_HD_PRORES',
		'DC_NDF25_LF_HD_XDCAM',
		'DC_NDF25_LF_SD_PRORES',
		'DC_NDF25_SF_HD_PRORES',
		'DC_NDF25_SF_HD_XDCAM',
		'DC_NDF25_SF_SD_PRORES',
		'DC_NDF30_LF_HD_PRORES',
		'DC_NDF30_LF_HD_XDCAM',
		'DC_NDF30_LF_SD_PRORES',
		'DC_NDF30_SF_HD_PRORES',
		'DC_NDF30_SF_HD_XDCAM',
		'DC_NDF30_SF_SD_PRORES',
		'DC_NDF60_LF_HD_PRORES',
		'DC_NDF60_LF_HD_XDCAM',
		'DC_NDF60_LF_SD_PRORES',
		'DC_NDF60_SF_HD_PRORES',
		'DC_NDF60_SF_HD_XDCAM',
		'DC_NDF60_SF_SD_PRORES',
		'DC_DUB_CARD'
	],
	storeAudioMedias : [
	'DC_2398_LF_HD_WAV',
	'DC_2398_SF_HD_WAV',
	'DC_2398_LF_SD_WAV',
	'DC_2398_SF_SD_WAV',
	'DC_DF30_LF_HD_WAV',
	'DC_DF30_LF_SD_WAV',
	'DC_DF30_SF_HD_WAV',
	'DC_DF30_SF_SD_WAV',
	'DC_DF60_LF_HD_WAV',
	'DC_DF60_LF_SD_WAV',
	'DC_DF60_SF_HD_WAV',
	'DC_DF60_SF_SD_WAV',
	'DC_NDF25_LF_HD_WAV',
	'DC_NDF25_LF_SD_WAV',
	'DC_NDF25_SF_HD_WAV',
	'DC_NDF25_SF_SD_WAV',
	'DC_NDF30_LF_HD_WAV',
	'DC_NDF30_LF_SD_WAV',
	'DC_NDF30_SF_HD_WAV',
	'DC_NDF30_SF_SD_WAV',
	'DC_NDF60_LF_HD_WAV',
	'DC_NDF60_LF_SD_WAV',
	'DC_NDF60_SF_HD_WAV',
	'DC_NDF60_SF_SD_WAV',
	],

	archiveMedias : [
		"DC_DIVA_2398_LF_HD_PRORES",
		"DC_DIVA_2398_LF_HD_XDCAM",
		"DC_DIVA_2398_LF_SD_PRORES",
		"DC_DIVA_2398_LF_SD_XDCAM",
		"DC_DIVA_2398_SF_HD_PRORES",
		"DC_DIVA_2398_SF_HD_XDCAM",
		"DC_DIVA_2398_SF_SD_PRORES",
		"DC_DIVA_2398_SF_SD_XDCAM",
		"DC_DIVA_DF30_LF_HD_PRORES",
		"DC_DIVA_DF30_LF_HD_XDCAM",
		"DC_DIVA_DF30_LF_SD_PRORES",
		"DC_DIVA_DF30_LF_SD_XDCAM",
		"DC_DIVA_DF30_SF_HD_PRORES",
		"DC_DIVA_DF30_SF_HD_XDCAM",
		"DC_DIVA_DF30_SF_SD_PRORES",
		"DC_DIVA_DF30_SF_SD_XDCAM",
		"DC_DIVA_NDF25_LF_HD_PRORES",
		"DC_DIVA_NDF25_LF_HD_XDCAM",
		"DC_DIVA_NDF25_LF_SD_PRORES",
		"DC_DIVA_NDF25_LF_SD_XDCAM",
		"DC_DIVA_NDF25_SF_HD_PRORES",
		"DC_DIVA_NDF25_SF_HD_XDCAM",
		"DC_DIVA_NDF25_SF_SD_PRORES",
		"DC_DIVA_NDF25_SF_SD_XDCAM",
	],

	t2Medias : [
		"DC_T2_2398_LF_HD_PRORES",
		"DC_T2_2398_LF_HD_XDCAM",
		"DC_T2_2398_LF_SD_PRORES",
		"DC_T2_2398_LF_SD_XDCAM",
		"DC_T2_2398_SF_HD_PRORES",
		"DC_T2_2398_SF_HD_XDCAM",
		"DC_T2_2398_SF_SD_PRORES",
		"DC_T2_2398_SF_SD_XDCAM",
		"DC_T2_DF30_LF_HD_PRORES",
		"DC_T2_DF30_LF_HD_XDCAM",
		"DC_T2_DF30_LF_SD_PRORES",
		"DC_T2_DF30_LF_SD_XDCAM",
		"DC_T2_DF30_SF_HD_PRORES",
		"DC_T2_DF30_SF_HD_XDCAM",
		"DC_T2_DF30_SF_SD_PRORES",
		"DC_T2_DF30_SF_SD_XDCAM",
		"DC_T2_NDF25_LF_HD_PRORES",
		"DC_T2_NDF25_LF_HD_XDCAM",
		"DC_T2_NDF25_LF_SD_PRORES",
		"DC_T2_NDF25_LF_SD_XDCAM",
		"DC_T2_NDF25_SF_HD_PRORES",
		"DC_T2_NDF25_SF_HD_XDCAM",
		"DC_T2_NDF25_SF_SD_PRORES",
		"DC_T2_NDF25_SF_SD_XDCAM",
	],
	t2AudioMedias : [
		"DC_T2_2398_LF_HD_WAV",
		"DC_T2_2398_LF_SD_WAV",
		"DC_T2_2398_SF_HD_WAV",
		"DC_T2_2398_SF_SD_WAV",
		"DC_T2_DF30_LF_HD_WAV",
		"DC_T2_DF30_LF_SD_WAV",
		"DC_T2_DF30_SF_HD_WAV",
		"DC_T2_DF30_SF_SD_WAV",
		'DC_T2_DF60_LF_HD_WAV',
		'DC_T2_DF60_LF_SD_WAV',
		'DC_T2_DF60_SF_HD_WAV',
		'DC_T2_DF60_SF_SD_WAV',
		'DC_T2_NDF25_LF_HD_WAV',
		'DC_T2_NDF25_LF_SD_WAV',
		'DC_T2_NDF25_SF_HD_WAV',
		'DC_T2_NDF25_SF_SD_WAV',
		'DC_T2_NDF60_LF_HD_WAV',
		'DC_T2_NDF60_LF_SD_WAV',
		'DC_T2_NDF60_SF_HD_WAV',
		'DC_T2_NDF60_SF_SD_WAV',
		'DC_T2_NDF25_LF_HD_WAV',
		'DC_T2_NDF25_LF_SD_WAV',
		'DC_T2_NDF25_SF_HD_WAV',
		'DC_T2_NDF25_SF_SD_WAV',
	],

	dcBrowseMedias : [
		"DC_Browse_DF30",
		"DC_Browse_DF60",
		"DC_Browse_NDF25",
		"DC_Browse_P23_976",
	],
	
	nldManagerLogins : {

		"FTP" : {
			"50.200.194.149" : {
				user : "outbox",
				password : "BqYMi1rU6S"
			},
			"216.178.104.92" : {
				user : "outbox",
				password : "LgYc5acr6o"
			},
			"50.207.32.4" : {
				user : "outbox",
				password : "MXdT0NvfFT"
			},
			"3.156.105.31" : { // M2M (BCE)
				user : "gmodenver",
				password : "#movie2M3!"
			},
			"3.156.105.32" : { // M2M (TRL)
				user : "m2m",
				password : "!m2m2013#"
			}
			/*

				Comment out EC ftp

			"100.116.76.250" : {
				user : "smartjoguser",
				password : "smartjogpass"
			},
			"54.218.101.143" : {
				user : "ftpuser",
				password : "ftpuser!@#"
			},
			"216.178.104.92" : {
				user : "outbox",
				password : "LgYc5acr6o"
			}*/
		},
		"Signiant" : {
			"3.44.40.52" : {
				user : "mediator",
				password : "mediator"
			},
			"useclpapl103.nbcuni.ge.com" : {
				user : "mediator",
				password : "mediator"
			}
		},
		"Aspera-P2P" : {
			"78.11.70.1" : {
					localUser : "NBCU-SPORT",
					localPassword : "",
					remoteUser : "NBCU-SPORT",
					remotePassword : "",
					remoteSSHkeyPath:"/home/svcaspera/.ssh/iti_neovision"
			},
			"Cmore_NBCUni_WCMO-192.36.29.64" : {
				localUser : "Cmore_NBCUni_WCMO",
				localPassword : "",
				remoteUser : "Cmore_NBCUni_WCMO",
				remotePassword : "",
				remoteSSHkeyPath : "/home/svcaspera/.ssh/cmore_nbcu"
            },
            "xfer-ats-aws-us-east-1.aspera.io":{
				remoteUser	:	"xfer",
				remoteSSHToken : "ATB3_AEAseUfou7FKahjJk_B8eQkx6QddYu6PSzGRbHkP0Vr2NcRFaqH_W5bO3NtRpaMUtuHAAG5tBDnhclVxf9yZElzBdLp_3BTA",
				remoteAuthorization :"Basic QXBHa1V2YzJmZmdrb09jZVYwQlFOVVc1OlFncEMxamktbjFNdDhCUXlPczZYUC1wSU1LSXNFNUJudjdTYlE4aF9yTw=="
			},
			"100.125.235.23" : {
				localUser : "svcaspera",
				localPassword : "Ch8ng3M39!",
				remoteUser : "svcaspera",
				remotePassword: "Ch8ng3M39!"
			},
			"100.125.235.24" : {
				localUser : "svcaspera",
				localPassword : "Ch8ng3M39!",
				remoteUser : "svcaspera",
				remotePassword: "Ch8ng3M39!"
			},
			"100.125.235.108" : {
				localUser : "svcaspera",
				localPassword : "Ch8ng3M39!",
				remoteUser : "svcaspera",
				remotePassword: "Ch8ng3M39!"
			},
			"100.125.235.109" : {
				localUser : "svcaspera",
				localPassword : "Ch8ng3M39!",
				remoteUser : "svcaspera",
				remotePassword: "Ch8ng3M39!"
			},
			"100.116.84.200" : {
				localUser : "svcaspera",
				localPassword : "Ch8ng3M39!",
				remoteUser : "svcaspera",
				remotePassword: "Ch8ng3M39!"
			},
			"64.125.171.6" :{
                localUser : "D3NW\\NBCU_aspera",
                localPassword : "dramA8r7",
                remoteUser : "D3NW\\NBCU_aspera",
                remotePassword: "dramA8r7"
			},
			"100.116.84.201" : {
				localUser : "svcaspera",
				localPassword : "Ch8ng3M39!",
				remoteUser : "svcaspera",
				remotePassword: "Ch8ng3M39!"
			},
			"198.72.46.114" : {
				localUser : "NBCUniversal",
				localPassword : "ali3n500",
				remoteUser : "NBCUniversal",
				remotePassword: "ali3n500"
			},
			"157.254.211.53" : {
				localUser : "uni_sky_xfer",
				localPassword : "73c4!$k48",
				remoteUser : "uni_sky_xfer",
				remotePassword: "73c4!$k48"
			},
			"177.69.154.251" : {
				localUser : "distribuidornbc",
				localPassword : "D1str1bu1d0rnbc!",
				remoteUser : "distribuidornbc",
				remotePassword: "D1str1bu1d0rnbc!"
			},
			"208.91.157.148":{
				localUser : "nbcutv",
				localPassword : "dFQCGZAzYJ0DiF2qouAp",
				remoteUser : "nbcutv",
				remotePassword: "dFQCGZAzYJ0DiF2qouAp"
			},
			"200.31.4.219":{
				localUser : "nbcuni",
				localPassword : "Un1v3rs@l",
				remoteUser : "nbcuni",
				remotePassword: "Un1v3rs@l"
			},
			"212.252.206.50":{
				localUser : "Digiturk_Universal",
				localPassword : "Universal_dp@2015+BS@",
				remoteUser : "Digiturk_Universal",
				remotePassword: "Universal_dp@2015+BS@"
			},
			"62.48.189.162":{
				localUser : "universal",
				localPassword : ":,L4dk*7qv5#",
				remoteUser : "universal",
				remotePassword: ":,L4dk*7qv5#"
			},
			"78.47.68.243" : {
				localUser : "nbc",
				localPassword : "ESo1Te7eath7ri",
				remoteUser : "nbc",
				remotePassword: "ESo1Te7eath7ri"
			},
			"213.161.73.213" : {
				localUser : "aspera_nbcuniversal",
				localPassword : "u9vDr43Tda",
				remoteUser : "aspera_nbcuniversal",
				remotePassword: "u9vDr43Tda"
			},
			"104.244.226.57" :	{
				localUser	:	"nbcuniversal",
				localPassword	:	"sportsmax",
				remoteUser	:	"nbcuniversal",
				remotePassword	:	"sprotsmax"
			},
			"195.176.132.49" : {
				localUser : "aspmoderndigi",
				localPassword : "Mdi3L8vL",
				remoteUser : "aspmoderndigi",
				remotePassword: "Mdi3L8vL"
			},
			"201.217.152.154" : {
				localUser : "NBCUniversal",
				localPassword : "NBCTeledoceAD3221",
				remoteUser : "NBCUniversal",
				remotePassword: "NBCTeledoceAD3221"
			},
			"185.60.71.52" : {
				localUser : "nbcuniversal",
				localPassword : "kPqZCcJ2",
				remoteUser : "nbcuniversal",
				remotePassword: "kPqZCcJ2"
			},
			"54.76.162.234" : {
				localUser : "Universal",
				localPassword : "P3gUN19rS3L",
				remoteUser : "Universal",
				remotePassword: "P3gUN19rS3L"
			},
			"185.53.65.4" : {
				localUser : "nbcuniversal",
				localPassword : "&lt;et5gHYi0",
				remoteUser : "nbcuniversal",
				remotePassword: "&lt;et5gHYi0"
			},

			// Bulk Load - 1
			"62.38.102.70" :{
          localUser : "CP_Universal",
          localPassword : "xzSGHrm6A8$L",
          remoteUser : "CP_Universal",
          remotePassword: "xzSGHrm6A8$L"
      },
			"91.199.177.156" :{
          localUser : "POST\\teg_universal",
          localPassword : "natephA7",
          remoteUser : "POST\\teg_universal",
          remotePassword: "natephA7"
      },
			"206.​41.​10.​161" :{
        localUser : "spe_nbc",
        localPassword : "spe@nbc15#$",
        remoteUser : "spe_nbc",
        remotePassword: "spe@nbc15#$"
      },
			"184.150.190.45" :{
        localUser : "NBCUniversal_com",
        localPassword : "$C0ntent4B3||1999#",
        remoteUser : "NBCUniversal_com",
        remotePassword: "$C0ntent4B3||1999#"
			},
			"185.53.65.4" : {
				localUser : "nbcuniversal",
				localPassword : "&lt;et5gHYi0",
				remoteUser : "nbcuniversal",
				remotePassword: "&lt;et5gHYi0"
			},
			"80.62.121.138" : {
				localUser : "NBCU",
				localPassword : "tgfQbMjsFdGUjKo",
				remoteUser : "NBCU",
				remotePassword: "tgfQbMjsFdGUjKo"
			},
			"208.86.111.102" :{
        localUser : "NBCU",
        localPassword : "45jANKy9",
        remoteUser : "NBCU",
        remotePassword: "45jANKy9"
			},
			"207.66.146.17" :{
        localUser : "NBCU_StudioPost",
        localPassword : "Gx!pqKo2XDvs?uX",
        remoteUser : "NBCU_StudioPost",
        remotePassword: "Gx!pqKo2XDvs?uX"
			},
			"94.31.60.181" :{
        localUser : "nbc_in",
        localPassword : "Cm9%WCb~",
        remoteUser : "nbc_in",
        remotePassword: "Cm9%WCb~"
			},
			"​192.​67.​169.​31" :{
        localUser : "NBCUniversal",
        localPassword : "GUba85/l",
        remoteUser : "NBCUniversal",
        remotePassword: "GUba85/l"
			},
      "aspera.mc.spe.sony.com": {
				localUser : "NBCUMediaSupportSpain-P2P",
				localPassword : "H@emiOU3yc",
				remoteUser : "NBCUMediaSupportSpain-P2P",
				remotePassword: "H@emiOU3yc"
			},
			"tv7acs01.teletica.com": {
				localUser : "nbcuni",
				localPassword : "G4kdSE83",
				remoteUser : "nbcuni",
				remotePassword: "G4kdSE83"
			},
			"206.132.227.15": {
				localUser : "nbcu",
				localPassword : "fR0mNbcu!",
				remoteUser : "nbcu",
				remotePassword: "fR0mNbcu!"
			},
			"189.247.171.154": {
				localUser : "universal",
				localPassword : "Eh8hqu5EF",
				remoteUser : "universal",
				remotePassword: "Eh8hqu5EF"
			},
			"93.51.223.187" : {
				  localUser : "universal-studiopost",
				  localPassword : "1spost&-1b7f4",
				  remoteUser : "universal-studiopost",
				  remotePassword: "1spost&-1b7f4"
			},
			"213.61.103.227" :{
                localUser : "Universal_vc",
                localPassword : "g-CfoZxE",
                remoteUser : "Universal_vc",
                remotePassword: "g-CfoZxE"
			},
			"207.253.68.11" :{
                localUser : "SETTEINC\nbcuniversal",
                localPassword : "PBR9gxqeyI9Q",
                remoteUser : "SETTEINC\nbcuniversal",
                remotePassword: "PBR9gxqeyI9Q"
			},
			"199.85.71.195" :{
                localUser : "tmn_nbcu",
                localPassword : "nBcuD3L!vER1e$#",
                remoteUser : "tmn_nbcu",
                remotePassword: "nBcuD3L!vER1e$#"
			},
			"149.7.112.163" :{
                localUser : "universal",
                localPassword : "tW1W1mOy",
                remoteUser : "universal",
                remotePassword: "tW1W1mOy"
			},
			"193.138.67.202" :{
                localUser : "universal",
                localPassword : "c3uHeThA",
                remoteUser : "universal",
                remotePassword: "c3uHeThA"
            },
			"69.74.159.84" :{
                localUser : "international1",
                localPassword : "global1",
                remoteUser : "international1",
                remotePassword: "global1"
            },
			"149.7.112.163" :{
             localUser : "universal",
                localPassword : "tW1W1mOy",
                remoteUser : "universal",
                remotePassword: "tW1W1mOy"
			},
            "54.72.248.66" : {
            	localUser : "nbcuniversal-latam-p2p",
            	localPassword : "2rW-ZH:en7",
            	remoteUser : "nbcuniversal-latam-p2p",
            	remotePassword : "2rW-ZH:en7"
            },
			"UPHE_R60-38.128.75.9" : {
				localUser : "UPHE_R60",
				localPassword : "xq&amp;H9c$B",
			    remoteUser : "UPHE_R60",
			    remotePassword: "xq&amp;H9c$B"
 			},
			"62.162.132.130"	: {
				localUser	: "IPTV_VoD",
				localPassword	: "Univers@lP2P",
				remoteUser	: "IPTV_VoD",
				remotePassword	: "Univers@lP2P"
			},
			"AS97352d266c5241b6a87522c20802c9-cu01.msv.microsoft.com" : {
				remoteUser	:	"AS97352d266c5241b6a87522c20802c9",
				remotePassword : "OTI3MjBlMmE1NDE1NGQ5ZmJjMDM4YTVlMjFjNmI2YWM0",
				remoteFileProtection : "Encrypt",
				remoteFilePassphrase : "NbYYby67_3RXBDPn3CmwLe67gaLBL9",
				remoteEncryptionCipher : "AES-128"
			}
		},
		"Faspex" : {
			"transferwest.nbcuni.com" : {
				user : "ecgmomediator@nbcuni.com",
				password : "IvQ&xD55JesAmCe"
			},
			"transfereast.nbcuni.com" : {
				user : "ecgmomediator@nbcuni.com",
				password : "Mu0^t7tSHEgtMsK"
			}
		}
	},

	waterMarkingSettings : {
		"Episodic" : {
			waterMark : "Rule",
			offset : "24",
			dates : [
				"GCO: Original Air Date",
				"Compass: Original Air Date",
				"SMAT: Original Air Date (NA|US)",
				"GTM: Original Air Date"
			]
		},
		"Feature" : {
			waterMark : "Always"
		},
		"Trailer" : {
			waterMark : "Always"
		}
	},

	"StraightToArchiveFolders" : [
		"StudioPost",
		"MediatorTest"
	],

	CadencePatterns : [
		"2-3",
		"3-2"
	] ,

	contentPrepDefaultStateMachine : "NBC GMO",
	servicingDefaultStateMachine : "Content Distribution",
	defaultSegmentGroup : "GMO",

	ordinalTagTypes : ["ordinal set","ordinal expanding set"],

	// For use in NLD. Black Insertion / Watermarking / VChipping until a better solution (RenderX) is done

	blackMaterials : {
		"P23_976" : "BLACK_P23_976",
		"DF30" : "BLACK_DF30",
		"NDF25" : "BLACK_NDF25",
		"all" : ["BLACK_P23_976", "BLACK_DF30", "BLACK_NDF25"]
	},

	waterMarkingMaterials : {
		"P23_976" : "WATERMARKING_P23_976",
		"DF30" : "WATERMARKING_DF30",
		"NDF25" : "WATERMARKING_NDF25",
		"all" : ["WATERMARKING_P23_976", "WATERMARKING_DF30", "WATERMARKING_NDF25"]
	},

	vchipMaterials : {
		"P23_976" : "VCHIP_P23_976",
		"DF30" : "VCHIP_DF30",
		"NDF25" : "VCHIP_NDF25",
		"all" : ["VCHIP_P23_976", "VCHIP_DF30", "VCHIP_NDF25"]
	},

	barsAndTonesMaterials : {
		"P23_976" : "BARS_TONE_P23_976",
		"DF30" : "BARS_TONE_DF30",
		"NDF25" : "BARS_TONE_NDF25",
		"all" : ["BARS_TONE_P23_976", "BARS_TONE_DF30", "BARS_TONE_NDF25"]
	},

	slateMaterials : {
		"GMO_SLATE" : {
			"P23_976" : "GMO_SLATE_P23_976",
			"DF30" : "GMO_SLATE_DF30",
			"NDF25" : "GMO_SLATE_NDF25"
		},
		"all" : ["GMO_SLATE_P23_976", "GMO_SLATE_DF30", "GMO_SLATE_NDF25"]
	},

	dubCardMaterials : {
		"P23_976" : "DUB_CARDS_P23_976",
        "DF30" : "DUB_CARDS_DF30",
        "NDF25" : "DUB_CARDS_NDF25",
        "all" : ["DUB_CARDS_P23_976", "DUB_CARDS_DF30", "DUB_CARDS_NDF25"]
	},

	versionTypeMap : {
		lmFtexted : "LM-FTEXTED",
		lmFtless : "LM-FTLESS",
		lmTatend : "LM-TATEND",
		lmTelements : "LM-TELEMENTS",
		omFtexted : "OM-FTEXTED",
		omFtless : "OM-FTLESS",
		omTatend : "OM-TATEND",
		omTelements : "OM-TELEMENTS",
		prFtexted : "PR-FTEXTED",
		prFtless : "PR-FTLESS",
		prTatend : "PR-TATEND",
		prTelements : "PR-TELEMENTS",
		cvFtextedWEndCredits : "CV-TXTCREDITS",
    cvFtexted : "CV-FTEXTED"
	},

	safeStandards : {
		"PAL" : {
			"Resolution" : "1080p",
			"Format" : "HD"
		},
		"HD 720 59.94P" : {
			"Resolution" : "720p",
			"Format" : "HD"
		},
		"HD 1080 23.98P" : {
			"Resolution" : "1080p",
			"Format" : "HD"
		},
		"HD 1080 25P" : {
			"Resolution" : "1080p",
			"Format" : "HD"
		},
		"HD 1080 50I" : {
			"Resolution" : "1080i",
			"Format" : "HD"
		},
		"HD 1080 59.94I" : {
			"Resolution" : "1080i",
			"Format" : "HD"
		},
		"J2K" : {
			"Resolution" : "J2K",
			"Format" : "HD"
		},
		"HD 480P" : {
			"Resolution" : "480p",
			"Format" : "HD"
		},
		"HD 1080I" : {
			"Resolution" : "1080i",
			"Format" : "HD"
		},
		"HD 1024P" : {
			"Resolution" : "1024p",
			"Format" : "HD"
		},
		"NTSC" : {
			"Resolution" : "",
			"Format" : "SD"
		}
	},
		nbcPipelineSupportEmailAddresses : ["gmosupport@nbcuni.com"]
}
