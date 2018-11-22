# Due to sentinel being written in delphi we are temporarily left in a slightly awkward position.
# Until we complete our move into the dynamic world where processes will be controlled by mesos, we need an interim solution.
# This is that interim solution
managed_processes_by_host:
  MEDX-QA-C1:
  MEDX-QA-C2:
  MEDX-QA-C3:
  MEDX-QA-COM1:
    wsrunner_defaultMapTransfer:
      service_description: "Default Transfer Runner for the defaultMapTransferJobFactory this one uses the Media Access Providers"
      app_name: "wsrunner"
      instance_name: "defaultMapTransfer"
    wsrunner_batonAutoQC:
      service_description: "Runner used for autoQC via Baton"
      app_name: "wsrunner"
      instance_name: "batonAutoQC"
    wsrunner_priorityBatonAutoQCRunner:
      service_description: "Runner used for autoQC via Baton"
      app_name: "wsrunner"
      instance_name: "priorityBatonAutoQC"
    wsrunner_exportVeniceQCXmlRunner:
      service_description: "Runner used to export VeniceQC XML file"
      app_name: "wsrunner"
      instance_name: "exportVeniceQCXml"
    wsrunner_signiantTransferRunner:
      service_description: "Runner used to run signiant delivery jobs"
      app_name: "wsrunner"
      instance_name: "signiantTransferRunner"
    wsrunner_priorityOMUploadRunner:
      service_description: "Runner used to Upload OM to the system"
      app_name: "wsrunner"
      instance_name: "priorityOMUpload"
    wsrunner_ftpTransferRunner:
      service_description: "Runner used to run ftp transfer jobs"
      app_name: "wsrunner"
      instance_name: "ftpTransferRunner"
    wsrunner_promoUploadRunner:
      service_description: "Runner used to Upload Promo to the system"
      app_name: "wsrunner"
      instance_name: "promoUpload"
    wsrunner_omUploadRunner:
      service_description: "Runner used to Upload OM to the system"
      app_name: "wsrunner"
      instance_name: "omUpload"
    wsrunner_omUploadRunnerWithoutSidecar:
      service_description: "Runner used to Upload OM to the system v2"
      app_name: "wsrunner"
      instance_name: "omUploadRunnerWithoutSidecar"
    wsrunner_beforeReadyJobRunner:
      service_description: " "
      app_name: "wsrunner"
      instance_name: "beforeReadyJob"
    wsrunner_materialRedeliverRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "materialRedeliver"
    wsrunner_tlDatabaseUpdateRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "translatorMessaging"
    wsrunner_componentUploadRunner01:
      service_description: "Runner used to Upload component to the system"
      app_name: "wsrunner"
      instance_name: "componentUpload"
    wsrunner_dubCardUploadRunner01:
      service_description: "Runner used to Upload dub cards to the system"
      app_name: "wsrunner"
      instance_name: "dubCardUpload"
    wsrunner_spotCheckWFDecisionRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "spotCheckWFDecision"
    wsrunner_tlMaterialUpdateRunner:
      service_description: "Runner used to update the material"
      app_name: "wsrunner"
      instance_name: "tlMaterialUpdate"
    wsrunner_tlPlacingUpdateRunner:
      service_description: "Runner used to update the placing"
      app_name: "wsrunner"
      instance_name: "tlPlacingUpdate"
    wsrunner_nldStagingTransfer:
      service_description: "NLD Staging Transfer Runner Used for External Audio Sources"
      app_name: "wsrunner"
      instance_name: "nldStagingTransfer"
    wsrunner_dummyNLDStagingTransfer:
      service_description: "Dummy Staging Transfer And Just Create a Pid File"
      app_name: "wsrunner"
      instance_name: "dummyNLDStagingTransfer"
    wsrunner_sshCommands:
      service_description: "Runner used to run an SSH command."
      app_name: "wsrunner"
      instance_name: "sshCommands"
    wsrunner_testStagingTransfer:
      service_description: "Test Staging Transfer Runner Used for External Audio Sources"
      app_name: "wsrunner"
      instance_name: "testStagingTransfer"
    wsrunner_ecUploadRunner:
      service_description: "Runner used to Upload EC content to the system"
      app_name: "wsrunner"
      instance_name: "ecUpload"
    wsrunner_mediatorBridgeNotification:
      service_description: "Mediator Bridge Notification"
      app_name: "wsrunner"
      instance_name: "mediatorBridgeNotification"
    wsrunner_imageUpload:
      service_description: "Image Uploads"
      app_name: "wsrunner"
      instance_name: "imageUpload"
    wsrunner_genericOMUpload:
      service_description: "Runner used to Upload Generic OM to the system"
      app_name: "wsrunner"
      instance_name: "genericOMUpload"
    wsrunner_asperaTransferRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "asperaTransferRunner"
    wsrunner_placingDeliveryEvaluation:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "placingDeliveryEvaluation"
    wsrunner_materialRegistration:
      service_description: "Runner used generate GMO id based from Untrusted OM"
      app_name: "wsrunner"
      instance_name: "materialRegistration"
    wsrunner_fixVantageTranscode:
      service_description: "Runner used to fix untrusted source files to meet House Profiles"
      app_name: "wsrunner"
      instance_name: "fixVantageTranscode"
    wsrunner_purgeMaterial:
      service_description: "Purge material and delete from database"
      app_name: "wsrunner"
      instance_name: "purgeMaterial"
    wsrunner_deliveryCallback:
      service_description: "Delivery Callback"
      app_name: "wsrunner"
      instance_name: "deliveryCallback"
    foldermonitor_QCReportUpload:
      service_description: "Monitors QC Report PDF Drops"
      app_name: "foldermonitor"
      instance_name: "QCReportUpload" 
    wsrunner_untrustedOMUpload:
      service_description: "Runner used to Upload Untrusted OM"
      app_name: "wsrunner"
      instance_name: "untrustedOMUpload"
    wsrunner_adOpsPlacingUpdateRunner:
      service_description: "Run Ad Ops Placing Update"
      app_name: "wsrunner"
      instance_name: "adOpsPlacingUpdateRunner"    
  MEDX-QA-COM2:
    wsrunner_contentDistributionTransfer:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "contentDistributionTransfer"
    wsrunner_divaVideoArchiveTransfer:
      service_description: "Video Archives to DIVA"
      app_name: "wsrunner"
      instance_name: "divaVideoArchiveTransfer"
    wsrunner_divaVideoRestoreTransfer:
      service_description: "Video Restores from DIVA"
      app_name: "wsrunner"
      instance_name: "divaVideoRestoreTransfer"
    wsrunner_contentRestripe:
      service_description: "Restripe material timecodes from Spot Check"
      app_name: "wsrunner"
      instance_name: "contentRestripe"
    wsrunner_macCaptionRunner:
      service_description: "Runner used to"
      app_name: "wsrunner"
      instance_name: "macCaption"
    wsrunner_nearlineMediaDeleteManagement:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "nearlineMediaDeleteManagement"
    wsrunner_customEmailJobRunner:
      service_description: "Runner used to send an email"
      app_name: "wsrunner"
      instance_name: "customEmailJob"
    wsrunner_vantageCaptionExtractRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "vantageCaptionExtract"
    wsrunner_audioAdjustmenRunnert:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "audioAdjustment"
    wsrunner_omVantageTranscodeRunner:
      service_description: "Runner used to "
      app_name: "wsrunner"
      instance_name: "omVantageTranscode"
    wsrunner_priorityOMVantageTranscodeRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "priorityOMVantageTranscode"
    wsrunner_failureWFDecisionRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "failureWFDecision"
    wsrunner_asperaFaspexTransfer:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "asperaFaspexTransfer"
    mediafilemanager_DC_2398:
      service_description: "A process to Manage files on DC Medias with 2398 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_2398"
    mediafilemanager_DC_DF30:
      service_description: "A process to Manage files on DC Medias with DF30 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_DF30"
    mediafilemanager_DC_DF60:
      service_description: "A process to Manage files on DC Medias with DF60 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_DF60"
    mediafilemanager_DC_DIVA:
      service_description: "A process to Manage files on DIVA Medias"
      app_name: "mediafilemanager"
      instance_name: "DC_DIVA"
    mediafilemanager_DC_General:
      service_description: "A process to Manage files on DC Medias with General Content"
      app_name: "mediafilemanager"
      instance_name: "DC_General"
    mediafilemanager_DC_NDF25:
      service_description: "A process to Manage files on DC Medias with NDF25 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_NDF25"
    mediafilemanager_DC_NDF30:
      service_description: "A process to Manage files on DC Medias with NDF30 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_NDF30"
    mediafilemanager_DC_NDF60:
      service_description: "A process to Manage files on DC Medias with NDF60 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_NDF60"
    mediafilemanager_DC_T2_2398:
      service_description: "A process to Manage files on DC Medias with T2_2398 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_T2_2398"
    mediafilemanager_DC_T2_DF30:
      service_description: "A process to Manage files on DC Medias with T2_DF30 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_T2_DF30"
    mediafilemanager_DC_T2_NDF25:
      service_description: "A process to Manage files on DC Medias with T2_NDF25 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_T2_NDF25"
    mediafilemanager_DC_Browse:
      service_description: "A process to Manage files on DC Medias with browse Content"
      app_name: "mediafilemanager"
      instance_name: "DC_Browse"
    mediafilemanager_DC_T3_2398:
      service_description: "A process to Manage files on DC Medias with T3_2398 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_T3_2398"
    mediafilemanager_DC_T3_DF30:
      service_description: "A process to Manage files on DC Medias with T3_DF30 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_T3_DF30"
    mediafilemanager_DC_T3_DF60:
      service_description: "A process to Manage files on DC Medias with T3_DF60 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_T3_DF60"
    mediafilemanager_DC_T3_NDF25:
      service_description: "A process to Manage files on DC Medias with T3_NDF25 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_T3_NDF25"
    mediafilemanager_DC_T3_NDF30:
      service_description: "A process to Manage files on DC Medias with T3_NDF30 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_T3_NDF30"
    mediafilemanager_DC_T3_NDF60:
      service_description: "A process to Manage files on DC Medias with T3_NDF60 Content"
      app_name: "mediafilemanager"
      instance_name: "DC_T3_NDF60"
    wsrunner_deliveryConnectivityTest:
      service_description: "Delivery Connectivity Test"
      app_name: "wsrunner"
      instance_name: "deliveryConnectivityTest"
    wsrunner_audioExtraction:
      service_description: "audioExtraction"
      app_name: "wsrunner"
      instance_name: "audioExtraction"
    wsrunner_confidenceLevel:
      service_description: "Confidence Level "
      app_name: "wsrunner"
      instance_name: "confidenceLevel"
    wsrunner_dcCS3AudioArchiveTransfer:
      service_description: "Audio Archive To Cloudian"
      app_name: "wsrunner"
      instance_name: "dcCS3AudioArchiveTransfer"
    wsrunner_dcCS3AudioRestoreTransfer:
      service_description: "Audio Restore To Cloudian"
      app_name: "wsrunner"
      instance_name: "dcCS3AudioRestoreTransfer"
    wsrunner_QCReportUpload:
      service_description: "Monitors QC Report PDF Drops"
      app_name: "wsrunner"
      instance_name: "QCReportUpload"
    wsrunner_componentUploadUTS:
      service_description: "Upload WAV and subtitle files for Untrusted workflow"
      app_name: "wsrunner"
      instance_name: "componentUploadUTS"  
  MEDX-QA-COM3:
    wsrunner_contentDistributionDeliveryRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "contentDistributionDelivery"
    wsrunner_contentDistributionPreparationConformCacheRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "contentDistributionPreparationConformCache"
    wsrunner_contentDistributionPreparationPostProcessingRunner:
      service_description: "Runner used to "
      app_name: "wsrunner"
      instance_name: "contentDistributionPreparationPostProcessing"
    wsrunner_contentDistributionPreparationTranscodeCacheRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "contentDistributionPreparationTranscodeCache"
    wsrunner_checkPlacingAwaitingComponentsRunner:
      service_description: "Runner used to "
      app_name: "wsrunner"
      instance_name: "checkPlacingAwaitingComponents"
    wsrunner_contentDistributionPreparationPackagingRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "contentDistributionPreparationPackaging"
    wsrunner_contentDistributionPreparationPreprocessingCacheRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "contentDistributionPreparationPreprocessingCache"
    wsrunner_contentDistributionPreparationRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "contentDistributionPreparation"
    wsrunner_placingValidationRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "placingValidation"
    wsrunner_profileAllocationRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "profileAllocation"
    wsrunner_profileAllocationDecision:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "profileAllocationDecision"
    wsrunner_newProfileAllocationRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "newProfileAllocation"
    wsrunner_packageQcDecisionRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "packageQcDecision"
    wsrunner_nldDeleteRunner:
      service_description: "Deletes NLD Working Files"
      app_name: "wsrunner"
      instance_name: "nldDelete"
    wsrunner_genericTransferRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "genericTransferRunner"
    wsrunner_audioCopyTrackTypeGroup:
      service_description: "Copy Audio Media"
      app_name: "wsrunner"
      instance_name: "audioCopyTrackTypeGroup"
    wsrunner_mediaValidation:
      service_description: "Runner used to Validate Media Against House Specs"
      app_name: "wsrunner"
      instance_name: "mediaValidation"
    wsrunner_contentDistributionPreparationTransferDecision:
      service_description: "Decides if DIVA restore is necessary for a placing"
      app_name: "wsrunner"
      instance_name: "contentDistributionPreparationTransferDecision"
    wsrunner_contentDistributionPreparationRestoreRequest:
      service_description: "Triggers a DIVA restore for a placing should one be needed"
      app_name: "wsrunner"
      instance_name: "contentDistributionPreparationRestoreRequest"
    wsrunner_contentExportDeliveryRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "contentExportDeliveryRunner"
    wsrunner_contentExportPackagingRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "contentExportPackagingRunner"
    wsrunner_contentExportPreparationRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "contentExportPreparationRunner"
    wsrunner_contentExportProfileAllocation:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "contentExportProfileAllocation"
    wsrunner_contentExportTranscodeRunner:
      service_description: ""
      app_name: "wsrunner"
      instance_name: "contentExportTranscodeRunner"
    foldermonitor_omUpload:
     service_description: "Monitors incoming Studio Post Content"
     app_name: "foldermonitor"
     instance_name: "omUpload"
    foldermonitor_untrustedSourceFile:
     service_description: "Monitors that dont already exist in mediator"
     app_name: "foldermonitor"
     instance_name: "untrustedSourceFile"
    foldermonitor_componentUpload:
     service_description: ""
     app_name: "foldermonitor"
     instance_name: "componentUpload"
    foldermonitor_dubCardUpload:
     service_description: ""
     app_name: "foldermonitor"
     instance_name: "dubCardUpload"
    foldermonitor_CSVtoSideCarXmlParser:
     service_description: "Generates SideCar XML files from CSV files"
     app_name: "foldermonitor"
     instance_name: "sidecarCsvXml"
    foldermonitor_omUploadT2:
     service_description: "Monitors Incoming content in T2"
     app_name: "foldermonitor"
     instance_name: "omUploadT2"
    foldermonitor_omUploadT2__Legacy:
     service_description: "Monitors Incoming content in T2 Legacy"
     app_name: "foldermonitor"
     instance_name: "omUploadT2_Legacy"
    foldermonitor_ecUpload:
     service_description: "Monitors incoming EC System Assets for import"
     app_name: "foldermonitor"
     instance_name: "ecUpload"
    foldermonitor_cvUpload:
     service_description: "Monitors Incoming content for Content Vesrioning"
     app_name: "foldermonitor"
     instance_name: "cvUpload"
    foldermonitor_omUploadDCDelivery01:
     service_description: "Monitors Incoming OM content"
     app_name: "foldermonitor"
     instance_name: "omUploadDCDelivery01"
    foldermonitor_omUploadDCDelivery02:
     service_description: "Monitors Incoming OM content"
     app_name: "foldermonitor"
     instance_name: "omUploadDCDelivery02"
    foldermonitor_componentUploadUTS:
      service_description: "Passes WAV and subtitles to componentUploadUTS runner"
      app_name: "foldermonitor"
      instance_name: "componentUploadUTS"
    wsrunner_checkPlacingAwaitingUTSDeletionRunner:
      service_description: "Runner used to transition UTS records for deletion"
      app_name: "wsrunner"
      instance_name: "checkUTSAwaitingDeletion"
    wsrunner_saveNote:
      service_description: "Save Note"
      app_name: "wsrunner"
      instance_name: "saveNote"      
    wsrunner_deleteNote:
      service_description: "Delete Note"
      app_name: "wsrunner"
      instance_name: "deleteNote"
    wsrunner_batonQC:
      service_description: "Run qc using services"
      app_name: "wsrunner"
      instance_name: "batonQC"      
    wsrunner_dcCS3VideoArchiveTransfer:
      service_description: "Video Archive To Cloudian"
      app_name: "wsrunner"
      instance_name: "dcCS3VideoArchiveTransfer"
    wsrunner_dcCS3VideoRestoreTransfer:
      service_description: "Video Restore To Cloudian"
      app_name: "wsrunner"
      instance_name: "dcCS3VideoRestoreTransfer"
    wsrunner_vastValidation:
      service_description: "Run Vast Validation"
      app_name: "wsrunner"
      instance_name: "vastValidation"    
    wsrunner_ffmpeg:
      service_description: "FFMEG Runner"
      app_name: "wsrunner"
      instance_name: "ffmpeg"
    wsrunner_serviceManually:
      service_description: "Run Service Manually"
      app_name: "wsrunner"
      instance_name: "serviceManually"
    wsrunner_adOpsTranslatorMessaging:
      service_description: "Run Ad Ops Translator Messaging"
      app_name: "wsrunner"
      instance_name: "adOpsTranslatorMessaging"       
    wsrunner_untrustedComponentReview:
      service_description: "Try to register Untrusted Components Against GMO"
      app_name: "wsrunner"
      instance_name: "untrustedComponentReview"
    wsrunner_checkCreativeSpotCheckTrigger:
      service_description: "vast spot check queue"
      app_name: "wsrunner"
      instance_name: "checkCreativeSpotCheckTrigger"
    wsrunner_gmoReadyCheckUTSRegistration:
      service_description: "Try to register Untrusted Components Against GMO"
      app_name: "wsrunner"
      instance_name: "gmoReadyCheckUTSRegistration"
    wsrunner_wsrunner_adOpsDelivery:
      service_description: "Ad Ops Delivery Script"
      app_name: "wsrunner"
      instance_name: "adOpsDelivery"         