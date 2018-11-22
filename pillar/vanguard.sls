managed_processes_by_host:
  ip-22-127-253-28.us-west-2.compute.internal:
    foldermonitor_avidBRAVOHotFolderWatcher: # folder monitor job for registering tracks found in a hot folder as tracks on media
      service_description: "folder monitor that watches an ipws hot folder"
      app_name: "foldermonitor"
      instance_name: "avidBRAVOHotFolderWatcher" # 
    wsrunner_avidToCloudianTransfer: 
      service_description: "Avid to cloudian transfer job runner."
      app_name: "wsrunner"
      instance_name: "avidToCloudianTransfer" 
    wsrunner_avidMediaTrackRegisterBRAVO: # Avid Media Track Register
      service_description: "Avid Media Track Registration Script."
      app_name: "wsrunner"
      instance_name: "avidMediaTrackRegisterBRAVO" # This should be unique within app names
    wsrunner_avidRenderX: # Avid RenderX
      service_description: "Avid RenderX."
      app_name: "wsrunner"
      instance_name: "avidRenderX" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_registerAvid: # Process to call ipws
      service_description: "register avid using ipws."
      app_name: "wsrunner"
      instance_name: "registerAvid" # This should be unique within app names
    wsrunner_defaultMapTransfer2:
      service_description: "Default Transfer Runner for the defaultMapTransferJobFactory this one uses the Media Access Providers"
      app_name: "wsrunner"
      instance_name: "defaultMapTransfer2"
      # run_level: "2345"  # This is optional property and controls when the service is started
  ip-22-127-253-61.us-west-2.compute.internal:
    wsrunner_defaultMapTransfer3:
      service_description: "Default Transfer Runner for the defaultMapTransferJobFactory this one uses the Media Access Providers"
      app_name: "wsrunner"
      instance_name: "defaultMapTransfer3"
  ip-22-127-253-53.us-west-2.compute.internal:
    mediafilemanager_Staging:
      service_description: "A process to Manage the Staging Media"
      app_name: "mediafilemanager"
      instance_name: "Staging"
    mediafilemanager_Browse:
      service_description: "A process to Manage the Browse Media"
      app_name: "mediafilemanager"
      instance_name: "Browse"
    mediafilemanager_Main:
      service_description: "A process to Manage the Main Media"
      app_name: "mediafilemanager"
      instance_name: "Main"
    mediafilemanager_BrowseStaging:
      service_description: "A process to Manage the Browse Staging Media"
      app_name: "mediafilemanager"
      instance_name: "BrowseStaging"
    mediafilemanager_Main_S3_Replica:
      service_description: "A process to Manage the Main S3 Replica Media"
      app_name: "mediafilemanager"
      instance_name: "Main_S3_Replica"
    mediafilemanager_BrowseDash:
      service_description: "A process to Manage the Browse Dash Media"
      app_name: "mediafilemanager"
      instance_name: "BrowseDash"
    foldermonitor_contentUpload: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to monitor a folder and initiate Mediator jobs when needed"
      app_name: "foldermonitor"
      instance_name: "contentUpload" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_contentUpload: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "contentUpload" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_videoAnalyze: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "videoAnalyze" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_imageAnalyze: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "imageAnalyze" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    #wsrunner_audioAnalyze: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
    #  service_description: "A process to do stuff when there are things to do."
    #  app_name: "wsrunner"
    #  instance_name: "audioAnalyze" # This should be unique within app names
    #  # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_documentAnalyze: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "documentAnalyze" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_projectAnalyze: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "projectAnalyze" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_defaultMapTransfer:
      service_description: "Default Transfer Runner for the defaultMapTransferJobFactory this one uses the Media Access Providers"
      app_name: "wsrunner"
      instance_name: "defaultMapTransfer"
    wsrunner_defaultMapTransfer1:
      service_description: "Default Transfer Runner for the defaultMapTransferJobFactory this one uses the Media Access Providers"
      app_name: "wsrunner"
      instance_name: "defaultMapTransfer1"
    wsrunner_defaultRenderXTransfer:
      service_description: "Default WSRunner for the defaultRenderXTransfer job factory"
      app_name: "wsrunner"
      instance_name: "defaultRenderXTransfer"
    wsrunner_browseResubmit: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "browseResubmit" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_keyframeImageCreation: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "keyframeImageCreation" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_unknownAnalyze: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "unknownAnalyze" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_nldDelivered: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "nldDelivered" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_nldDelivery: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "nldDelivery" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_nldDeliveryRequired: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "nldDeliveryRequired" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_nldPackaging: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "nldPackaging" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_nldTranscode: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "nldTranscode" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_nldTransfer: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "nldTransfer" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_profileAllocation: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "profileAllocation" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_tlStatusNotify: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "tlStatusNotify" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    wsrunner_tlServicingStatusNotify: # Process names should be <app_name>_<instance_name> - THIS MUST BE UNIQUE !
      service_description: "A process to do stuff when there are things to do."
      app_name: "wsrunner"
      instance_name: "tlServicingStatusNotify" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
    mediafilemanager_AVID_BRAVO:
      service_description: "A process to Manage the AVID BRAVO"
      app_name: "mediafilemanager"
      instance_name: "AVID_BRAVO"
    asyncjobmonitor_evertzio:
      service_description: "AJM"
      app_name: "asyncjobmonitor"
      instance_name: "evertzio"
    wsrunner_hotFolderDelivery: # Process to call ipws
      service_description: "A process for generic hot folder deliveries."
      app_name: "wsrunner"
      instance_name: "hotFolderDelivery" # This should be unique within app names
      # run_level: "2345"  # This is optional property and controls when the service is started
