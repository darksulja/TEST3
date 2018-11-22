/**
 * DONT RUN THIS IN PRODUCTION - CHANGES ARE NEEDED BECAUSE THE PATHS ARE POINTED AT THE DEV MEDIATOR
 * update_transfer_system.js
 *   by Craig Sloggett
 *   Created 4-18-2017
 *
 *   Update the NBC GMO Transfer System to Support each Media Group
 *       - Add new Medias
 *       - Add new Media Access Providers
 *       - Add new Media Access Links
 *       - Add new Transfer Nodes
 *       - Add new Transfer Routes
 *
 *                                  ** This is a standalone script to be run once (no runner)
 *
 *   The script will take in options to determine which Media groups should be in the system
 *   to implement and create Medias, Media Access Providers, Media Access Links for each group.
 *   A Transfer Node is then setup for the newly created Media and the required transfer routes.
 */

load('/opt/evertz/mediator/lib/js/shellfun.js');
wsLogin('localhost', 'evertzengineer', 'sandals');

/**
 * Parameters used by the script to make decisions.
 *
 *  The parameters are broken into (many) logical groups and subgroups:
 *      - Locations
 *          * The EC location is currently not implemented
 *          * TODO: the paths must not be hard coded (i.e. /srv/dc-dvs)
 *
 *      - Medias
 *          * The medias group contains the bulk of the parameters
 *          * There are different media groups which allow different parameters for each group
 *          * Each Media has an Access Provider, Access Link, Transfer Node and Transfer Route
 *          * Example: to create all of the main store medias you would set the following to
 *                     true:
 *                          parameters.medias.mainStore.create
 *
 *          - Access Providers
 *              * There are different media access provider types, each with an option to enable
 *              * Example: to make a main store media with a local access provider type,
 *                         you would set the following to true:
 *                              parameters.medias.mainStore.accessProvider.local.create
 *          - Access Links
 *              * There are different access links, each with an option to enable them
 *              * Since media access links provide a link between providers and medias,
 *                an option for which provider to link to is given for a given function
 *              * Example: to create a media access link for main store medias using the
 *                         local access provider for the manage function, you would set
 *                         the following to true:
 *                              parameters.medias.mainStore.accessLink.manage.create
 *                         And then set the following to the 'local' access provider type:
 *                              parameters.medias.mainStore.accessLink.manage.accessProvider
 *
 *          - Transfer Nodes
 *              * A transfer node for a given media group can vary so the parameters specific to
 *                the media group are set here, (i.e. maxIncomingTransfers)
 *              * If the parameters is not required, it is not listed
 *              * Example: to set the max incoming transfers to 1 for a main store media transfer
 *                         node, the following is set to 1:
 *                              parameters.medias.mainStore.transferNode.maxIncomingTransfers
 *
 *          - Transfer Routes
 *              * The transfer routes are defined such that each media group has a parameter for
 *                each media group (that does make sense!)
 *              * To use this, we think of the parent media group as the source node and the 
 *                parameters listed are the destination nodes
 *              * We think "do we want X to transfer to Y"?
 *              * Example: If I want all main store medias to be able to transfer to T2 medias,
 *                         I would set the following to true:
 *                              parameters.medias.mainStore.transferRoute.t2.create
 *              * Since the job factories and parameters are setup in the transfer nodes, this
 *                is sufficient to setup a transfer route!
 *
 *      - Frame Rates: 
 *          * Since there is an open discussion about which frame rates should be implemented,
 *            an option to create specific frame rates has been implemented
 *          * TODO: Remove this bucket and workout the frame rate in Media name vs. path in the
 *                  logic
 */
var parameters = {
    'locations' : { 
        'EC' : {
            create : false
        },
        'DC' : {
            create : true
        }    
    },
    'medias' : {
        'mainStore' : {
            'media' : { 
                create : true,
                pathPrefix : '/srv/dc-dvs/',
                totalSpace : '996:00:00:00',
                highMark : '80:00:00:00',
                lowMark : '20:00:00:00',
                directoryNameFactory : 'MaterialDirectoryNameFactory',
                mediaList : []
            },
            'accessProvider' : {
                'local' : {
                    create : true,
                    nameSuffix : '_Local',
                    pathPrefix : '/srv/dc-dvs/'
                },
                'dvsLocal' : {
                    create : true,
                    nameSuffix : '_DVS_Local',
                    pathPrefix : '/media/DVS-RT1/DC/Mediator/dev-mediator/'
                },
                'ssh' : {
                    create : true,
                    nameSuffix : '_SSH',
                    pathPrefix : '/media/DVS-RT1/DC/Mediator/dev-mediator/',
                    hostname : '100.125.141.22',
                    port : 22,
                    username : 'evertz',
                    password : 'evertz1'
                },
                'divaShare' : {
                    create : false                      
                },
                'divaRest' : {
                    create : false
                }
            },
            'accessLink' : {
                'transfer' : {
                    create : true,
                    function : 'TRANSFER',
                    accessProvider : 'local'
                },
                'manage' : {
                    create : true,
                    function : 'MANAGE',
                    accessProvider : 'local'
                },
                'browse' : {
                    create : false,
                    function : 'BROWSE'
                }
            },
            'transferNode' : {
                create : true,
                partialTransfers : true,
                maxIncomingTransfers : 1,
                maxOutgoingTransfers : 1
            },
            'transferRoute' : {
                'mainStore' : {
                    create : false
                },
                'captions' : {
                    create : false
                },
                't2' : {
                    create : true
                },
                'diva' : {
                    create : false
                },
                'staging' : {
                    create : true
                },
                'browse' : {
                    create : true
                },
                'cache' : {
                    create : false
                }
            }
        },
        'captions' : {
            'media' : { 
                create : true,
                pathPrefix : '/srv/dc-dvs/Subs/',
                totalSpace : '996:00:00:00',
                highMark : '80:00:00:00',
                lowMark : '20:00:00:00',
                directoryNameFactory : 'MaterialDirectoryNameFactory',
                mediaList : []
            },
            'accessProvider' : {
                'local' : {
                    create : true,
                    nameSuffix : '_Local',
                    pathPrefix : '/srv/dc-dvs/Subs/'                
                },
                'dvsLocal' : {
                    create : true,
                    nameSuffix : '_DVS_Local',
                    pathPrefix : '/media/DVS-RT1/DC/Mediator/dev-mediator/Subs/'                
                },
                'ssh' : {
                    create : true,
                    nameSuffix : '_SSH',
                    pathPrefix : '/media/DVS-RT1/DC/Mediator/dev-mediator/Subs/',
                    hostname : '100.125.141.22',
                    port : 22,
                    username : 'evertz',
                    password : 'evertz1'
                },
                'divaShare' : {
                    create : false                          
                },
                'divaRest' : {
                    create : false
                }
            },
            'accessLink' : {
                'transfer' : {
                    create : true,
                    function : 'TRANSFER',
                    accessProvider : 'local'
                },
                'manage' : {
                    create : true,
                    function : 'MANAGE',
                    accessProvider : 'local'
                },
                'browse' : {
                    create : false,
                    function : 'BROWSE'
                }
            },
            'transferNode' : {
                create : true,
                partialTransfers : true,
                maxIncomingTransfers : 1,
                maxOutgoingTransfers : 1
            },
            'transferRoute' : {
                'mainStore' : {
                    create : false
                },
                'captions' : {
                    create : false
                },
                't2' : {
                    create : false
                },
                'diva' : {
                    create : false
                },
                'staging' : {
                    create : true
                },
                'browse' : {
                    create : false
                },
                'cache' : {
                    create : false
                }
            }
        },
        't2' : {
            'media' : { 
                create : true,
                pathPrefix : '/srv/dc-isilon/',
                totalSpace : '996:00:00:00',
                highMark : '80:00:00:00',
                lowMark : '20:00:00:00',
                directoryNameFactory : 'MaterialDirectoryNameFactory',
                mediaList : []
            },
            'accessProvider' : {
                'local' : {
                    create : true,
                    nameSuffix : '_Local',
                    pathPrefix : '/srv/dc-isilon/'                
                },
                'dvsLocal' : {
                    create : true,
                    nameSuffix : '_DVS_Local',
                    pathPrefix : '/media/Isilon2/GMO/Mediator/dev-mediator/'                
                },
                'ssh' : {
                    create : true,
                    nameSuffix : '_SSH',
                    pathPrefix : '/media/Isilon2/GMO/Mediator/dev-mediator/',
                    hostname : '100.125.141.22',
                    port : 22,
                    username : 'evertz',
                    password : 'evertz1'
                },
                'divaShare' : {
                    create : true,
                    nameSuffix : '_DIVA_Share',
                    divaShareName: 'GMO_MediatorX_Isilon2',
                    useRelativeMediaPath : true                           
                },
                'divaRest' : {
                    create : false
                }
            },
            'accessLink' : {
                'transfer' : {
                    create : true,
                    function : 'TRANSFER',
                    accessProvider : 'divaShare'
                },
                'manage' : {
                    create : false,
                    function : 'MANAGE'
                },
                'browse' : {
                    create : false,
                    function : 'BROWSE'
                }
            },
            'transferNode' : {
                create : true,
                partialTransfers : true,
                maxIncomingTransfers : 1,
                maxOutgoingTransfers : 1
            },
            'transferRoute' : {
                'mainStore' : {
                    create : true
                },
                'captions' : {
                    create : false
                },
                't2' : {
                    create : false
                },
                'diva' : {
                    create : true
                },
                'staging' : {
                    create : true
                },
                'browse' : {
                    create : true
                },
                'cache' : {
                    create : false
                }
            }
        },
        'diva' : {
            'media' : { 
                create : true,
                pathPrefix : '',
                totalSpace : '996:00:00:00',
                highMark : '80:00:00:00',
                lowMark : '20:00:00:00',
                directoryNameFactory : 'FlatListDirectoryNameFactory',
                mediaList : []
            },
            'accessProvider' : {
                'local' : {
                    create : false               
                },
                'dvsLocal' : {
                    create : false             
                },
                'ssh' : {
                    create : false
                },
                'divaShare' : {
                    create : false                      
                },
                'divaRest' : {
                    create : true,
                    hostname : '100.125.129.141',
                    port : 9763,
                    version : '2.0',
                    category : 'GMO_SERVICING_LIBRARY',
                    divaMedia : 'GMO_Primary',
                    priorityLevel : 30,
                    qos : 2,
                    useRelativeMediaPath : false
                }
            },
            'accessLink' : {
                'transfer' : {
                    create : true,
                    function : 'TRANSFER',
                    accessProvider : 'divaRest'
                },
                'manage' : {
                    create : true,
                    function : 'MANAGE',
                    accessProvider : 'divaRest'
                },
                'browse' : {
                    create : false,
                    function : 'BROWSE'
                }
            },
            'transferNode' : {
                create : true,
                partialTransfers : false,
                maxIncomingTransfers : 1,
                maxOutgoingTransfers : 1,
                validWorkFlowStates : 'Ready'
            },
            'transferRoute' : {
                'mainStore' : {
                    create : false
                },
                'captions' : {
                    create : false
                },
                't2' : {
                    create : true
                },
                'diva' : {
                    create : false
                },
                'staging' : {
                    create : false
                },
                'browse' : {
                    create : false
                },
                'cache' : {
                    create : false
                }
            }
        },
        'staging' : {
            'media' : {
                create : true,
                nameSuffix : {
                    'nld' : 'NLD',
                    'om' : 'OM',
                    'component' : 'COMPONENT'
                },
                pathPrefix : { 
                    'nld' : '/srv/dc-isilon/',
                    'om' : '/srv/dc-delivery/',
                    'component' : '/srv/dc-delivery/'
                },
                pathSuffix : {
                    'nld' : 'NLDStaging/',
                    'om' : 'OM_STAGING/',
                    'component' : 'COMPONENT_STAGING/'  
                },
                totalSpace : '996:00:00:00',
                highMark : '80:00:00:00',
                lowMark : '20:00:00:00',
                directoryNameFactory : 'MaterialDirectoryNameFactory',
                mediaList : []
            },
            'accessProvider' : {
                'local' : {
                    create : true,
                    nameSuffix : '_Local',
                    pathPrefix : { 
                        'nld' : '/srv/dc-isilon/NLDStaging/',
                        'om' : '/srv/dc-delivery/OM_STAGING/',
                        'component' : '/srv/dc-delivery/COMPONENT_STAGING/'
                    }      
                },
                'dvsLocal' : {
                    create : true,
                    nameSuffix : '_DVS_Local',
                    pathPrefix : { 
                        'nld' : '/media/Isilon2/GMO/Mediator/dev-mediator/NLDStaging/',
                        'om' : '/media/Isilon_DEV/OM_STAGING/',
                        'component' : '/media/Isilon_DEV/COMPONENT_STAGING/'
                    }
                },
                'ssh' : {
                    create : true,
                    nameSuffix : '_SSH',
                    pathPrefix : { 
                        'nld' : '/media/Isilon2/GMO/Mediator/dev-mediator/NLDStaging/',
                        'om' : '/media/Isilon_DEV/OM_STAGING/',
                        'component' : '/media/Isilon_DEV/COMPONENT_STAGING/'
                    },
                    hostname : '100.125.141.22',
                    port : 22,
                    username : 'evertz',
                    password : 'evertz1'
                },
                'divaShare' : {
                    create : false                         
                },
                'divaRest' : {
                    create : false
                }
            },
            'accessLink' : {
                'transfer' : {
                    create : true,
                    function : 'TRANSFER',
                    accessProvider : 'local'
                },
                'manage' : {
                    create : true,
                    function : 'MANAGE',
                    accessProvider : 'local'
                },
                'browse' : {
                    create : false,
                    function : 'BROWSE'
                }
            },
            'transferNode' : {
                create : true,
                partialTransfers : true,
                maxIncomingTransfers : 1,
                maxOutgoingTransfers : 1,
                trackDefinitionsCreatedByProxy : true,
                validWorkFlowStates : 'Ready',
                trackTypesRequired : 'Video',
                jobFactory : 'NLDStagingTransferJobFactory'
            },
            'transferRoute' : {
                'mainStore' : {
                    create : true
                },
                'captions' : {
                    create : true
                },
                't2' : {
                    create : false
                },
                'diva' : {
                    create : false
                },
                'staging' : {
                    create : false
                },
                'browse' : {
                    create : false
                },
                'cache' : {
                    create : false
                }
            }
        },
        'browse' : {
            'media' : { 
                create : true,
                pathPrefix : '/srv/browse/',
                totalSpace : '996:00:00:00',
                highMark : '80:00:00:00',
                lowMark : '20:00:00:00',
                directoryNameFactory : 'FlatListDirectoryNameFactory',
                mediaList : []
            },
            'accessProvider' : {
                'local' : {
                    create : true,
                    nameSuffix : '_Local',
                    pathPrefix : '/srv/browse/'                
                },
                'dvsLocal' : {
                    create : false              
                },
                'ssh' : {
                    create : false
                },
                'divaShare' : {
                    create : false                       
                },
                'divaRest' : {
                    create : false
                }
            },
            'accessLink' : {
                'transfer' : {
                    create : true,
                    function : 'TRANSFER',
                    accessProvider : 'local'
                },
                'manage' : {
                    create : true,
                    function : 'MANAGE',
                    accessProvider : 'local'
                },
                'browse' : {
                    create : true,
                    function : 'BROWSE',
                    accessProvider : 'nginx'
                }
            },
            'transferNode' : {
                create : true,
                partialTransfers : true,
                maxIncomingTransfers : 2,
                maxOutgoingTransfers : 1,
                targetFileExtension : 'mp4',
                sourceFileExtension : 'mov',
                jobFactory :    {   'P23_976' : 'renderxBrowseTransferP23_976JobFactory',
                                    'DF30' : 'renderxBrowseTransferDF30JobFactory',
                                    'DF60' : 'renderxBrowseTransferDF60JobFactory',
                                    'NDF25' : 'renderxBrowseTransferNDF25JobFactory'
                                },
                outputPath : '/srv/browse/',
                outputTrackTemplate : 'Browse MP4'
            },
            'transferRoute' : {
                'mainStore' : {
                    create : false
                },
                'captions' : {
                    create : false
                },
                't2' : {
                    create : false
                },
                'diva' : {
                    create : false
                },
                'staging' : {
                    create : false
                },
                'browse' : {
                    create : false
                },
                'cache' : {
                    create : false
                }
            }
        },
        'cache' : {
            'media' : { 
                create : true,
                pathPrefix : '/srv/dc-isilon/',
                totalSpace : '996:00:00:00',
                highMark : '80:00:00:00',
                lowMark : '20:00:00:00',
                directoryNameFactory : 'MaterialDirectoryNameFactory',
                mediaList : []
            },
            'accessProvider' : {
                'local' : {
                    create : true,
                    nameSuffix : '_Local',
                    pathPrefix : '/srv/dc-isilon/'                
                },
                'dvsLocal' : {
                    create : false
                },
                'ssh' : {
                    create : false
                },
                'divaShare' : {
                    create : false
                },
                'divaRest' : {
                    create : false
                }
            },
            'accessLink' : {
                'transfer' : {
                    create : true,
                    function : 'TRANSFER',
                    accessProvider : 'local'
                },
                'manage' : {
                    create : true,
                    function : 'MANAGE',
                    accessProvider : 'local'
                },
                'browse' : {
                    create : false,
                    function : 'BROWSE'
                }
            },
            'transferNode' : {
                create : true,
                partialTransfers : true,
                maxIncomingTransfers : 1,
                maxOutgoingTransfers : 1
            },
            'transferRoute' : {
                'mainStore' : {
                    create : false
                },
                'captions' : {
                    create : false
                },
                't2' : {
                    create : false
                },
                'diva' : {
                    create : false
                },
                'staging' : {
                    create : false
                },
                'browse' : {
                    create : false
                },
                'cache' : {
                    create : false
                }
            }
        }
    },
    'frameRates' : {
        'P23_976' : {
            create : true,
            'inMediaName' : '2398',
            'inMediaPath' : 'P23_98'
        },
        'DF30' : {
            create : true,
            'inMediaName' : 'DF30',
            'inMediaPath' : 'DF30'
        },
        'DF60' : {
            create : false,
            'inMediaName' : 'DF60',
            'inMediaPath' : 'DF60'
        },
        'NDF25' : {
            create : true,
            'inMediaName' : 'NDF25',
            'inMediaPath' : 'NDF25'
        },
        'NDF30' : {
            create : false,
            'inMediaName' : 'NDF30',
            'inMediaPath' : 'NDF30'
        },
        'NDF60' : {
            create : false,
            'inMediaName' : 'NDF60',
            'inMediaPath' : 'NDF60'
        }
    }
};

/**
 * Generates a PXF formatted command list for media.save and sends it to Mediator
 *
 * @usage   saveMedia(name, machine, frameRate, totalSpace, high, low, absolutePath, relativePath, directoryNameFactory)
 * @param   {string}    name                    name of the Media
 * @param   {integer}   machine                 machine number
 * @param   {integer}   frameRate               frame rate
 * @param   {string}    totalSpace              total space (in timecode format)
 * @param   {string}    high                    high mark (in timecode format)
 * @param   {string}    low                     low mark (in timecode format)
 * @param   {string}    absolutePath            absolute path of the Media
 * @param   {string}    relativePath            relative path of the Media
 * @param   {string}    directoryNameFactory    the directory name factory
 */
function saveMedia(name, machine, frameRate, totalSpace, high, low, absolutePath, relativePath, directoryNameFactory) {
	
    var cmd =
        <PharosCs>
            <CommandList>
                <Command subsystem="media" method="saveServer">
                    <ParameterList>
                        <Parameter name="media">
                            <Value>
                                <Media>
                                    <Name>{name}</Name>
                                    <Title>{name}</Title>
                                    <MediaType>Generic</MediaType>
                                    <MachineNumber>{machine}</MachineNumber>
                                    <FrameRate>{frameRate}</FrameRate>
                                    <PlayWhileRecord>false</PlayWhileRecord>
                                    <Owner>
                                        <Name>NBCU GMO</Name>
                                    </Owner>
                                    <TotalSpace>
                                        <Time>{totalSpace}</Time>
                                    </TotalSpace>
                                    <HighMark>
                                        <Time>{high}</Time>
                                    </HighMark>
                                    <LowMark>
                                        <Time>{low}</Time>
                                    </LowMark>
                                    <AbsolutePath>{absolutePath}</AbsolutePath>
                                    <RelativePath>{relativePath}</RelativePath>
                                    <DirectoryNameFactoryName>{directoryNameFactory}</DirectoryNameFactoryName>
                                </Media>
                            </Value>
                        </Parameter>
                    </ParameterList>
                </Command>
            </CommandList>
        </PharosCs>;

    wscall(cmd); /// MAKE SURE TO ADD THIS BACK TO THE OWNER <Name>NBCU GMO</Name>
};

/**
 * Generates a PXF formatted command list for media.save and sends it to Mediator, used for saving over existing media
 *
 * @usage   overwriteMedia(name, machine, frameRate, totalSpace, high, low, absolutePath, relativePath, directoryNameFactory)
 * @param   {string}    name                    name of the Media
 * @param   {integer}   machine                 machine number
 * @param   {integer}   frameRate               frame rate
 * @param   {string}    totalSpace              total space (in timecode format)
 * @param   {string}    high                    high mark (in timecode format)
 * @param   {string}    low                     low mark (in timecode format)
 * @param   {string}    absolutePath            absolute path of the Media
 * @param   {string}    relativePath            relative path of the Media
 * @param   {string}    directoryNameFactory    the directory name factory
 */
function overwriteMedia(name, machine, frameRate, totalSpace, high, low, absolutePath, relativePath, directoryNameFactory) {
    
    var mediaList = getMediaList();

    for each (var media in mediaList..Media) {
        if (media..Name.toString().indexOf(name) != -1) {
            var mediaId = media.@id;
        }
    }

    var cmd =
        <PharosCs>
            <CommandList>
                <Command subsystem="media" method="saveServer">
                    <ParameterList>
                        <Parameter name="media">
                            <Value>
                                <Media>
                                    <Id>{mediaId}</Id>
                                    <Name>{name}</Name>
                                    <Title>{name}</Title>
                                    <MediaType>Generic</MediaType>
                                    <MachineNumber>{machine}</MachineNumber>
                                    <FrameRate>{frameRate}</FrameRate>
                                    <PlayWhileRecord>false</PlayWhileRecord>
                                    <Owner>
                                        <Name>NBCU GMO</Name>
                                    </Owner>
                                    <TotalSpace>
                                        <Time>{totalSpace}</Time>
                                    </TotalSpace>
                                    <HighMark>
                                        <Time>{high}</Time>
                                    </HighMark>
                                    <LowMark>
                                        <Time>{low}</Time>
                                    </LowMark>
                                    <AbsolutePath>{absolutePath}</AbsolutePath>
                                    <RelativePath>{relativePath}</RelativePath>
                                    <DirectoryNameFactoryName>{directoryNameFactory}</DirectoryNameFactoryName>
                                </Media>
                            </Value>
                        </Parameter>
                    </ParameterList>
                </Command>
            </CommandList>
        </PharosCs>;
		

    wscall(cmd);
}

/**
 * Returns the result of media.getServerList
 *
 * @usage   getMediaList()
 * @return  {XML}   complete list of Media
 */
function getMediaList() {
    var cmd =
        <PharosCs>
            <CommandList>
                <Command>
                    <Subsystem>media</Subsystem>
                    <Method>getServerList</Method>
                </Command>
            </CommandList>
        </PharosCs>; 

    return wscall(cmd)..Output.MediaList; ///
};

/**
 * Returns the result of mediaAccess.getAllMediaAccessProviders
 *
 * @usage   getMediaAccessProviderList()
 * @return  {XML}   complete list of Media Access Providers
 */
function getMediaAccessProviderList() {
    var cmd = 
        <PharosCs>
            <CommandList>
                <Command subsystem="mediaAccess" method="getAllMediaAccessProviders"/>
            </CommandList>
        </PharosCs>
    
    return wscall(cmd)..Output.MediaAccessProviderConfigurationList;
};

/**
 * Generates a PXF formatted command list for saveMediaAccessProvider and sends it to Mediator
 * with the saveMediaAccessProvider function. No need to use both functions.
 *
 * @usage   localMediaAccessProvider(name, path)
 * @param   {String}    the name of the Media Access Provider
 * @param   {String}    the Local Access Path to the Media
 */
function localMediaAccessProvider(name, path) {
    var config = <MediaAccessProviderConfiguration>
                     <Configuration>
                         <_type>LocalMountMediaAccess</_type>
                         <LocalMountMediaAccess>
                             <Path>{path}</Path>
                         </LocalMountMediaAccess>;
                     </Configuration>
                     <Name>{name}</Name>
                 </MediaAccessProviderConfiguration>;

    saveMediaAccessProvider(config);
};

/**
 * Generates a PXF formatted command list for saveMediaAccessProvider and sends it to Mediator
 * with the saveMediaAccessProvider function. No need to use both functions.
 *
 * @usage   sshMediaAccessProvider(name, hostname, port, path, username, password)
 * @param   {String}    the name of the Media Access Provider
 * @param   {String}    hostname used to connect
 * @param   {String}    the port used to connect
 * @param   {String}    the remote path
 * @param   {String}    the username used to connect
 * @param   {String}    the password of the user used to connect
 */
function sshMediaAccessProvider(name, hostname, port, path, username, password) {
    var config = <MediaAccessProviderConfiguration>
                     <Configuration>
                         <_type>SSHMediaAccess</_type>
                         <SSHMediaAccess>
                             <Hostname>{hostname}</Hostname>
                             <Port>{port}</Port>
                             <Path>{path}</Path>
                             <Authentication>
                                 <_type>BasicMediaAccessAuthentication</_type>
                                 <BasicMediaAccessAuthentication>
                                     <Username>{username}</Username>
                                     <Password>{password}</Password>
                                 </BasicMediaAccessAuthentication>
                             </Authentication>
                         </SSHMediaAccess>
                     </Configuration>
                     <Name>{name}</Name>
                 </MediaAccessProviderConfiguration>;

    saveMediaAccessProvider(config); ///
};

/**
 * Generates a PXF formatted command list for saveMediaAccessProvider and sends it to Mediator
 * with the saveMediaAccessProvider function. No need to use both functions.
 *
 * @usage   divaMediaAccessProvider(name, sharename, useRelativeMediaPath)
 * @param   {String}    the name of the Media Access Provider
 * @param   {String}    the DIVA sharename used on the DIVA system
 * @param   {Boolean}   use the relative media path or not
 */
function divaShareMediaAccessProvider(name, sharename, useRelativeMediaPath) {
	
	
    var config = <MediaAccessProviderConfiguration>
                     <Configuration>
                         <_type>DivaShareMediaAccess</_type>
                         <DivaShareMediaAccess>
                             <DivaShareName>{sharename}</DivaShareName>
                             <UseMediaRelativePath>{useRelativeMediaPath}</UseMediaRelativePath>
                         </DivaShareMediaAccess>
                     </Configuration>
                     <Name>{name}</Name>
                 </MediaAccessProviderConfiguration>;
				 
                 
    saveMediaAccessProvider(config); ///
};

/**
 * Generates a PXF formatted command list for saveMediaAccessProvider and sends it to Mediator
 * with the saveMediaAccessProvider function. No need to use both functions.
 *
 * @usage   divaRestMediaAccessProvider(name, hostname, port, version, category, divaMedia, priorityLevel, qos, useRelativeMediaPath)
 * @param   {String}    the name of the Media Access Provider
 * @param   {String}    hostname used to connect
 * @param   {String}    the port used to connect
 * @param   {String}    the version of the DIVA REST API
 * @param   {String}    the category used to connect
 * @param   {String}    the DIVA media
 * @param   {String}    the priority level to give the connection
 * @param   {String}    the qos setting to give the connection
 * @param   {Boolean}   use the relative media path or not
 */
function divaRestMediaAccessProvider(name, hostname, port, version, category, divaMedia, priorityLevel, qos, useRelativeMediaPath) {
    var config = <MediaAccessProviderConfiguration>
                     <Configuration>
                         <_type>DivaRESTMediaAccess</_type>
                         <DivaRESTMediaAccess>
                             <Hostname>{hostname}</Hostname>
                             <Port>{port}</Port>
                             <Version>{version}</Version>
                             <Category>{category}</Category>
                             <DivaMedia>{divaMedia}</DivaMedia>
                             <PriorityLevel>{priorityLevel}</PriorityLevel>
                             <QualityOfService>{qos}</QualityOfService>
                             <UseMediaRelativePath>{useRelativeMediaPath}</UseMediaRelativePath>
                         </DivaRESTMediaAccess>
                     </Configuration>
                     <Name>{name}</Name>
                 </MediaAccessProviderConfiguration>;
                 
    saveMediaAccessProvider(config);  ///
};

/**
 * Generates a PXF formatted command list and sends it to Mediator.
 *
 * @usage   saveMediaAccessProvider(config)
 * @param   {XML}   the XML configuration of the Media Access Provider to save
 */
function saveMediaAccessProvider(config) {
    var cmd =
        <PharosCs>
            <CommandList>
                <Command>
                    <Subsystem>mediaAccess</Subsystem>
                    <Method>saveMediaAccessProvider</Method>
                    <ParameterList>
                        <Parameter name="configuration">
                            {config}
                        </Parameter>
                    </ParameterList>
                </Command>
            </CommandList>
        </PharosCs>;

    wscall(cmd); ///
};

/**
 * Returns the result of mediaAccess.getAllMediaAccessLinks
 *
 * @usage   getMediaAccessLinkList()
 * @return  {XML}   complete list of Media Access Links
 */
function getMediaAccessLinkList() {
    var cmd = 
        <PharosCs>
            <CommandList>
                <Command subsystem="mediaAccess" method="getAllMediaAccessLinks"/>
            </CommandList>
        </PharosCs>
    
    return wscall(cmd)..Output.MediaAccessLinkList; ///
};

/**
 * Generates a PXF formatted command list and sends it to Mediator.
 *
 * @usage   saveMediaAccessLink(mediaName, providerName, linkFunction)
 * @param   {String}    the name of the Media
 * @param   {String}    the name of the Media Access Provider
 * @param   {String}    the function used by the Media Access Link
 */
function saveMediaAccessLink(mediaName, providerName, linkFunction) {
	
    var cmd =
        <PharosCs>
            <CommandList>
                <Command>
                    <Subsystem>mediaAccess</Subsystem>
                    <Method>saveMediaAccessLink</Method>
                    <ParameterList>
                        <Parameter name="mediaAccessLink">
                            <MediaAccessLink>
                                <MediaName>{mediaName}</MediaName>
                                <ProviderName>{providerName}</ProviderName>
                                <Function>{linkFunction}</Function>
                            </MediaAccessLink>
                        </Parameter>
                    </ParameterList>
                </Command>
            </CommandList>
        </PharosCs>;

    wscall(cmd); ///
};

/**
 * Returns the result of request.getNodes
 *
 * @usage   getTransferNodeList()
 * @return  {XML}   complete list of Transfer Nodes
 */
function getTransferNodeList() {
    var cmd =
        <PharosCs>
            <CommandList>
                <Command>
                    <Subsystem>request</Subsystem>
                    <Method>getNodes</Method>
                </Command>
            </CommandList>
        </PharosCs>;

    return wscall(cmd)..Output.TransferNodeList; ///
};

/**
 * Generates a PXF formatted command list using the input config
 * and sends it to the request.saveNode Mediator Web Service Call
 *
 * @usage   saveTransferNode(mediaName, jobFactory)
 * @param   {string}    mediaName        the name of the Media
 * @param   {string}    jobFactory       the name of the Job Factory used by the Node
 */
function saveTransferNode(name, partialTransfers, maxIncomingTransfers, maxOutgoingTransfers) {
    var cmd =
        <PharosCs>
            <CommandList>
                <Command>
                    <Subsystem>request</Subsystem>
                    <Method>saveNode</Method>
                    <ParameterList>
                        <Parameter name="node">
                            <TransferNode>
                                <Name>{name}</Name>
                                <MediaName>{name}</MediaName>
                                <MaxIncomingTransfers>{maxIncomingTransfers}</MaxIncomingTransfers>
                                <MaxOutgoingTransfers>{maxOutgoingTransfers}</MaxOutgoingTransfers>
                                <Archive>false</Archive>
                                <NoFileExistsCheck>false</NoFileExistsCheck>
                                <TrackDefinitionsCreatedByProxy>false</TrackDefinitionsCreatedByProxy>
                                <GetFileBytes>false</GetFileBytes>
                                <PartialTransfers>{partialTransfers}</PartialTransfers>
                                <NoDestFileDelete>false</NoDestFileDelete>
                                <ExportFiles>false</ExportFiles>
                                <UseDestinationFrameRate>false</UseDestinationFrameRate>
                                <NoDeleteOnFileExistsTimeout>false</NoDeleteOnFileExistsTimeout>
                                <RenderTransfers>false</RenderTransfers>
                                <UseTransferAfterTime>false</UseTransferAfterTime>
                                <TransferRequirements>
                                    <AllTrackTypesRequired>true</AllTrackTypesRequired>
                                </TransferRequirements>
                            </TransferNode>
                        </Parameter>
                    </ParameterList>
                </Command>
            </CommandList>
        </PharosCs>

    wscall(cmd); ///
};

/**
 * Generates a PXF formatted command list using the input config
 * and sends it to the request.saveNode Mediator Web Service Call
 *
 * @usage   saveTransferNode(mediaName, jobFactory)
 * @param   {string}    mediaName        the name of the Media
 * @param   {string}    jobFactory       the name of the Job Factory used by the Node
 */
function saveDivaTransferNode(name, partialTransfers, maxIncomingTransfers, maxOutgoingTransfers, validWorkFlowStates) {
    var cmd =
        <PharosCs>
            <CommandList>
                <Command>
                    <Subsystem>request</Subsystem>
                    <Method>saveNode</Method>
                    <ParameterList>
                        <Parameter name="node">
                            <TransferNode>
                                <Name>{name}</Name>
                                <MediaName>{name}</MediaName>
                                <MaxIncomingTransfers>{maxIncomingTransfers}</MaxIncomingTransfers>
                                <MaxOutgoingTransfers>{maxOutgoingTransfers}</MaxOutgoingTransfers>
                                <Archive>false</Archive>
                                <NoFileExistsCheck>false</NoFileExistsCheck>
                                <TrackDefinitionsCreatedByProxy>false</TrackDefinitionsCreatedByProxy>
                                <GetFileBytes>false</GetFileBytes>
                                <PartialTransfers>{partialTransfers}</PartialTransfers>
                                <NoDestFileDelete>false</NoDestFileDelete>
                                <ExportFiles>false</ExportFiles>
                                <UseDestinationFrameRate>false</UseDestinationFrameRate>
                                <NoDeleteOnFileExistsTimeout>false</NoDeleteOnFileExistsTimeout>
                                <RenderTransfers>false</RenderTransfers>
                                <ValidWorkflowStates>
                                    <State>
                                        <Name>{validWorkFlowStates}</Name>
                                    </State>
                                </ValidWorkflowStates>
                                <UseTransferAfterTime>false</UseTransferAfterTime>
                                <TransferRequirements>
                                    <AllTrackTypesRequired>true</AllTrackTypesRequired>
                                </TransferRequirements>
                            </TransferNode>
                        </Parameter>
                    </ParameterList>
                </Command>
            </CommandList>
        </PharosCs>

    wscall(cmd); ///
};

/**
 * Generates a PXF formatted command list using the input config
 * and sends it to the request.saveNode Mediator Web Service Call
 *
 * @usage   saveTransferNode(mediaName, jobFactory)
 * @param   {string}    mediaName        the name of the Media
 * @param   {string}    jobFactory       the name of the Job Factory used by the Node
 */
function saveNldStagingTransferNode(name, trackDefinitionsCreatedByProxy, partialTransfers, maxIncomingTransfers, maxOutgoingTransfers, validWorkFlowStates, trackTypesRequired, jobFactory) {
    var cmd =
        <PharosCs>
            <CommandList>
                <Command>
                    <Subsystem>request</Subsystem>
                    <Method>saveNode</Method>
                    <ParameterList>
                        <Parameter name="node">
                            <TransferNode>
                                <Name>{name}</Name>
                                <MediaName>{name}</MediaName>
                                <MaxIncomingTransfers>{maxIncomingTransfers}</MaxIncomingTransfers>
                                <MaxOutgoingTransfers>{maxOutgoingTransfers}</MaxOutgoingTransfers>
                                <Archive>false</Archive>
                                <NoFileExistsCheck>false</NoFileExistsCheck>
                                <TrackDefinitionsCreatedByProxy>{trackDefinitionsCreatedByProxy}</TrackDefinitionsCreatedByProxy>
                                <GetFileBytes>false</GetFileBytes>
                                <PartialTransfers>{partialTransfers}</PartialTransfers>
                                <NoDestFileDelete>false</NoDestFileDelete>
                                <ExportFiles>false</ExportFiles>
                                <UseDestinationFrameRate>false</UseDestinationFrameRate>
                                <NoDeleteOnFileExistsTimeout>false</NoDeleteOnFileExistsTimeout>
                                <RenderTransfers>false</RenderTransfers>
                                <ValidWorkflowStates>
                                    <State>
                                        <Name>{validWorkFlowStates}</Name>
                                    </State>
                                </ValidWorkflowStates>
                                <TransferRequirements>
                                    <TransferRequirement>
                                        <AllTrackTypesRequired>false</AllTrackTypesRequired>
                                        <TrackTypesRequiredOnDest>
                                            <TrackType>
                                                <Name>{trackTypesRequired}</Name>
                                            </TrackType>
                                        </TrackTypesRequiredOnDest>
                                    </TransferRequirement>
                                </TransferRequirements>
                                <UseTransferAfterTime>false</UseTransferAfterTime>
                                <JobFactory>{jobFactory}</JobFactory>
                            </TransferNode>
                        </Parameter>
                    </ParameterList>
                </Command>
            </CommandList>
        </PharosCs>

    wscall(cmd); ///
};

/**
 * Generates a PXF formatted command list using the input config
 * and sends it to the request.saveNode Mediator Web Service Call
 *
 * @usage   saveTransferNode(mediaName, jobFactory)
 * @param   {string}    targetExtension     the extension of the file on the target Node
 * @param   {string}    sourceExtension     the extension of the file on the source Node
 * @param   {string}    mediaName           the name of the Media
 * @param   {string}    jobFactory          the name of the Job Factory used by the Node
 * @param   {string}    outputPath          the path of the Rendered Tracks
 * @param   {string}    outputTrackTemplate the template used for the Rendered Tracks
 */
function saveBrowseTransferNode(name, partialTransfers, maxIncomingTransfers, maxOutgoingTransfers, targetExtension, sourceExtension, jobFactory, outputPath, outputTrackTemplate) {
    var cmd =
        <PharosCs>
            <CommandList>
                <Command>
                    <Subsystem>request</Subsystem>
                    <Method>saveNode</Method>
                    <ParameterList>
                        <Parameter name="node">
                            <TransferNode>
                                <Name>{name}</Name>
                                <MediaName>{name}</MediaName>
                                <MaxIncomingTransfers>{maxIncomingTransfers}</MaxIncomingTransfers>
                                <MaxOutgoingTransfers>{maxOutgoingTransfers}</MaxOutgoingTransfers>
                                <Archive>false</Archive>
                                <JobFactory>{jobFactory}</JobFactory>
                                <NoFileExistsCheck>false</NoFileExistsCheck>
                                <TrackDefinitionsCreatedByProxy>false</TrackDefinitionsCreatedByProxy>
                                <GetFileBytes>false</GetFileBytes>
                                <PartialTransfers>{partialTransfers}</PartialTransfers>
                                <NoDestFileDelete>false</NoDestFileDelete>
                                <ExportFiles>false</ExportFiles>
                                <UseDestinationFrameRate>false</UseDestinationFrameRate>
                                <NoDeleteOnFileExistsTimeout>false</NoDeleteOnFileExistsTimeout>
                                <FileExtensionConversionList>
                                    <FileExtensionConversion>
                                        <TargetFileExtension>{targetExtension}</TargetFileExtension>
                                        <SourceFileExtension>{sourceExtension}</SourceFileExtension>
                                    </FileExtensionConversion>
                                </FileExtensionConversionList>
                                <RenderTransfers>true</RenderTransfers>
                                <RenderProfiles>
                                    <RenderXProfile>
                                        <ProfileName>lowres-proxy</ProfileName>
                                        <Generate>true</Generate>
                                        <RegisterTrack>true</RegisterTrack>
                                        <FilePositionMode>FROM_SOURCE</FilePositionMode>
                                        <FailIfMissingTrackDefs>false</FailIfMissingTrackDefs>
                                        <OutputPath>{outputPath}</OutputPath>
                                        <OutputTrackTemplate>{outputTrackTemplate}</OutputTrackTemplate>
                                    </RenderXProfile>
                                </RenderProfiles>
                                <UseTransferAfterTime>false</UseTransferAfterTime>
                            </TransferNode>
                        </Parameter>
                    </ParameterList>
                </Command>
            </CommandList>
        </PharosCs>

    wscall(cmd); ///
};

/**
 * Generates a PXF formatted command list using the input config
 * and sends it to the request.addRoute Mediator Web Service Call
 *
 *    Due to a bug with saving a transfer route, the destination provider doesn't get saved unless
 *    the service call is sent twice
 *
 * @usage   saveTransferRoute(sourceNode, destNode, sourceProvdier, destProvider)
 * @param   {string}    sourceNode        the name of the Source Node
 * @param   {string}    destNode        the name of the Destination Node
 */
function saveTransferRoute(sourceNode, destNode, sourceProvider, destProvider) {
	
    var cmd =
        <PharosCs>
            <CommandList>
                <Command>
                    <Subsystem>request</Subsystem>
                    <Method>addRoute</Method>
                    <ParameterList>
                        <Parameter name="fromnode" value={sourceNode}/>
                        <Parameter name="tonode" value={destNode}/>
                        <Parameter name="route">
                            <TransferRoute>
                                <SourceNode>{sourceNode}</SourceNode>
                                <DestinationNode>{destNode}</DestinationNode>
                                <Weight>1</Weight>
                                <SourceDelete>false</SourceDelete>
                                <SourceAccessProvider>{sourceProvider}</SourceAccessProvider>
                                <DestinationAccessProvider>{destProvider}</DestinationAccessProvider>
                                <MaxTransfers>1</MaxTransfers>
                            </TransferRoute>
                        </Parameter>
                    </ParameterList>
                </Command>
            </CommandList>
        </PharosCs>;
    ///
    wscall(cmd);
    wscall(cmd);
};

/**
 * Generates a PXF formatted command list using the input config
 * and sends it to the request.addRoute Mediator Web Service Call
 *
 *    Due to a bug with saving a transfer route, the destination provider doesn't get saved unless
 *    the service call is sent twice
 *
 * @usage   saveTransferRouteNoProviders(sourceNode, destNode)
 * @param   {string}    sourceNode        the name of the Source Node
 * @param   {string}    destNode        the name of the Destination Node
 */
function saveTransferRouteNoProviders(sourceNode, destNode) {
	
    var cmd =
        <PharosCs>
            <CommandList>
                <Command>
                    <Subsystem>request</Subsystem>
                    <Method>addRoute</Method>
                    <ParameterList>
                        <Parameter name="fromnode" value={sourceNode}/>
                        <Parameter name="tonode" value={destNode}/>
                        <Parameter name="route">
                            <TransferRoute>
                                <SourceNode>{sourceNode}</SourceNode>
                                <DestinationNode>{destNode}</DestinationNode>
                                <Weight>1</Weight>
                                <SourceDelete>false</SourceDelete>
                                <MaxTransfers>1</MaxTransfers>
                            </TransferRoute>
                        </Parameter>
                    </ParameterList>
                </Command>
            </CommandList>
        </PharosCs>;
    ///
    wscall(cmd);
};

/**
 * Determines the highest value set as a machine number in the system in order
 * to decide which machine number should be used next
 *
 * @usage   getMaxMachineNumber()
 * @return  {integer}   maxMachineNumber        the highest value set as a machine number
 */
function getMaxMachineNumber() {

    var mediaList = getMediaList();
    var machineNumberList = [];
    var machineNumber = 0;
    var maxMachineNumber = 0;

    for each (machineNumber in mediaList..MachineNumber) {
        machineNumberList.push(machineNumber);
    }

    machineNumberList.sort(compareNumbers);
    maxMachineNumber = parseInt(machineNumberList[0]);

    return maxMachineNumber + 1;
};

/**
 * Compares two numbers to determine which is greater than the other
 *
 * @usage   compareNumber(a, b)
 * @param   {integer}    a        the first number to compare
 * @param   {integer}    b        the second number to compare
 * @return  {integer}    b - a
 */
function compareNumbers(a, b) {

    return b - a;
};

/**
 * Determines if a Media exists in the system using the name of the media
 *
 * @usage   searchForMedia(mediaName)
 * @param   {String}    mediaName     the name of the Media
 * @return  {Boolean}   returns true if the media exists, false otherwise
 */
function searchForMedia(mediaName) {
    
    var mediaList = getMediaList();
    var mediaExists = false;

    for each (var media in mediaList..Media) {
        if (media..Name.toString().indexOf(mediaName) != -1) {
            mediaExists = true;
        }
    }

    return mediaExists;
};

/**
 * Determines if a Media Access Provider exists in the system using the name and type of provider
 *
 * @usage   searchForMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType)
 * @param   {String}    mediaAccessProviderName     the name of the Media Access Provider
 * @param   {String}    mediaAccessProviderType     the type of the Media Access Provider
 * @return  {Boolean}   returns true if the provider exists, false otherwise
 */
function searchForMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType) {

    var mediaAccessProviderTypeConfigurationName = {
        'local' : 'LocalMountMediaAccess',
        'dvsLocal' : 'LocalMountMediaAccess',
        'ssh' : 'SSHMediaAccess',
        'divaShare' : 'DivaShareMediaAccess',
        'divaRest' : 'DivaRESTMediaAccess'
    };
    
    var mediaAccessProviderList = getMediaAccessProviderList();
    var mediaAccessProviderExists = false;

    for each (var mediaAccessProvider in mediaAccessProviderList..Configuration[mediaAccessProviderTypeConfigurationName[mediaAccessProviderType]]) {
        if (mediaAccessProvider..Name.toString().indexOf(mediaAccessProviderName) != -1) {
            mediaAccessProviderExists = true;
        }
    }

    return mediaAccessProviderExists;
};

/**
 * Determines if a Media Access Link exists in the system using the media name, media access
 * provider name and the function of the media access link
 *
 * @usage   searchForMediaAccessLink(mediaName, mediaAccessProviderName, mediaAccessLinkFuntion)
 * @param   {String}    mediaName                   the name of the Media
 * @param   {String}    mediaAccessProviderName     the name of the Media Access Provider
 * @param   {String}    mediaAccessLinkFuntion      the function of the Media Access Link
 * @return  {Boolean}   returns true if the provider exists, false otherwise
 */
function searchForMediaAccessLink(mediaName, mediaAccessProviderName, mediaAccessLinkFunction) {
    
    var mediaAccessLinkList = getMediaAccessLinkList();
    var mediaAccessLinkExists = false;

    for each (var mediaAccessLink in mediaAccessLinkList..MediaAccessLink) {
        if (mediaAccessLink..MediaName.toString().indexOf(mediaName) != -1) {
            if (mediaAccessLink..ProviderName.toString().indexOf(mediaAccessProviderName) != -1) {
                if (mediaAccessLink..Function.toString().indexOf(mediaAccessLinkFunction) != -1) {
                    mediaAccessLinkExists = true;
                }
            }
        }
        
    }

    return mediaAccessLinkExists;
};

/**
 * Determines if a Transfer Node exists in the system using the media name
 *
 * @usage   searchForTransferNode(mediaName)
 * @param   {String}    mediaName                   the name of the Media
 * @return  {Boolean}   returns true if the node exists, false otherwise
 */
function searchForTransferNode(mediaName) {
    
    var transferNodeList = getTransferNodeList();
    var transferNodeExists = false;

    for each (var transferNode in transferNodeList..TransferNode) {
        if (transferNode..MediaName.toString().indexOf(mediaName) != -1) {
            transferNodeExists = true;
        }
    }

    return transferNodeExists;
};

/**
 * Create a Media Access Provider based on the Media Access Provider Type and Media Grouping
 *
 * @usage   createMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType, mediaAccessProviderPath, mediaGroup)
 * @param   {String}    the name of the media access provider to create
 * @param   {String}    the type of media access provider to create
 * @param   {String}    the path used for the media access provider
 * @param   {String}    the media grouping
 */
function createMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType, mediaAccessProviderPath, mediaGroup) {
	
    if (mediaAccessProviderType == "local" || mediaAccessProviderType == "dvsLocal") {
        
        localMediaAccessProvider(mediaAccessProviderName, 
                                 mediaAccessProviderPath);
        
    } else if (mediaAccessProviderType == "ssh") {
        
        sshMediaAccessProvider(mediaAccessProviderName,
                               parameters.medias[mediaGroup].accessProvider.ssh.hostname, 
                               parameters.medias[mediaGroup].accessProvider.ssh.port, 
                               mediaAccessProviderPath, 
                               parameters.medias[mediaGroup].accessProvider.ssh.username, 
                               parameters.medias[mediaGroup].accessProvider.ssh.password);
        
    } else if (mediaAccessProviderType == "divaShare") {
        
        divaShareMediaAccessProvider(mediaAccessProviderName, 
                                     parameters.medias[mediaGroup].accessProvider.divaShare.divaShareName, 
                                     parameters.medias[mediaGroup].accessProvider.divaShare.useRelativeMediaPath);
                                     
    } else if (mediaAccessProviderType == "divaRest") {
        
        divaRestMediaAccessProvider(mediaAccessProviderName, 
                                    parameters.medias[mediaGroup].accessProvider.divaRest.hostname, 
                                    parameters.medias[mediaGroup].accessProvider.divaRest.port, 
                                    parameters.medias[mediaGroup].accessProvider.divaRest.version, 
                                    parameters.medias[mediaGroup].accessProvider.divaRest.category, 
                                    parameters.medias[mediaGroup].accessProvider.divaRest.divaMedia, 
                                    parameters.medias[mediaGroup].accessProvider.divaRest.priorityLevel, 
                                    parameters.medias[mediaGroup].accessProvider.divaRest.qos, 
                                    parameters.medias[mediaGroup].accessProvider.divaRest.useRelativeMediaPath);
    }
};

/**
 * Create a Transfer Node based on the Media Grouping
 *   - The stagingType and frameRate function parameters are optional depending on which Media Group
 *     is being used
 *
 * @usage   createTransferNode(mediaName, mediaGroup, stagingType, frameRate)
 * @param   {String}    the name of the media used
 * @param   {String}    the media grouping
 * @param   {String}    the type of staging media (used only for the NLD staging media)
 * @param   {String}    the frame rate (used to determine the Browse render X job)
 */
function createTransferNode(mediaName, mediaGroup, stagingType, frameRate) {
	

    if (mediaGroup == "mainStore" || mediaGroup == "captions" || mediaGroup == "t2" || mediaGroup == "cache") {

        saveTransferNode(mediaName, 
                         parameters.medias[mediaGroup].transferNode.partialTransfers, 
                         parameters.medias[mediaGroup].transferNode.maxIncomingTransfers, 
                         parameters.medias[mediaGroup].transferNode.maxOutgoingTransfers);
        
    } else if (mediaGroup == "diva") {
        
        saveDivaTransferNode(mediaName, 
                             parameters.medias[mediaGroup].transferNode.partialTransfers, 
                             parameters.medias[mediaGroup].transferNode.maxIncomingTransfers, 
                             parameters.medias[mediaGroup].transferNode.maxOutgoingTransfers, 
                             parameters.medias[mediaGroup].transferNode.validWorkFlowStates);
        
    } else if (mediaGroup == "staging") {

        if (stagingType == "nld") {

            saveNldStagingTransferNode(mediaName, 
                                       parameters.medias[mediaGroup].transferNode.trackDefinitionsCreatedByProxy, 
                                       parameters.medias[mediaGroup].transferNode.partialTransfers, 
                                       parameters.medias[mediaGroup].transferNode.maxIncomingTransfers, 
                                       parameters.medias[mediaGroup].transferNode.maxOutgoingTransfers, 
                                       parameters.medias[mediaGroup].transferNode.validWorkFlowStates, 
                                       parameters.medias[mediaGroup].transferNode.trackTypesRequired, 
                                       parameters.medias[mediaGroup].transferNode.jobFactory);
        } else {

            saveTransferNode(mediaName, 
                             parameters.medias[mediaGroup].transferNode.partialTransfers, 
                             parameters.medias[mediaGroup].transferNode.maxIncomingTransfers, 
                             parameters.medias[mediaGroup].transferNode.maxOutgoingTransfers);
        }
        
    } else if (mediaGroup == "browse") {
        
        saveBrowseTransferNode(mediaName, 
                               parameters.medias[mediaGroup].transferNode.partialTransfers, 
                               parameters.medias[mediaGroup].transferNode.maxIncomingTransfers, 
                               parameters.medias[mediaGroup].transferNode.maxOutgoingTransfers, 
                               parameters.medias[mediaGroup].transferNode.targetFileExtension, 
                               parameters.medias[mediaGroup].transferNode.sourceFileExtension, 
                               parameters.medias[mediaGroup].transferNode.jobFactory[frameRate], 
                               parameters.medias[mediaGroup].transferNode.outputPath, 
                               parameters.medias[mediaGroup].transferNode.outputTrackTemplate);
        
    }
};

/**
Functions below are used to perform a "diff" on the parameters being saved
versus what is being already present on the system, then log the differences to a particular file
**/

function logToFile(text) {
	overwrite(text, '/home/evertz/transfer_sys_gen.log', 'UTF8', true);
}

function logExistingMediaVsNew(mediaName, newMedia) {
	var cmd = 
		<PharosCs>
		  <CommandList>
			<Command subsystem="media" method="getServer">
			  <ParameterList>
				<Parameter name="media">
				  <Value>
					<Media>
					  <Name>{mediaName}</Name>
					</Media>
				  </Value>
				</Parameter>
			  </ParameterList>
			</Command>
		  </CommandList>
		</PharosCs>;
		
	var currentMedia = wscall(cmd)..Media;
	var mediaProperties = ["AbsolutePath", "RelativePath", "DirectoryNameFactoryName"];
	var differenceList = [];
	
	for each (var prop in mediaProperties) {
		var currentValue = currentMedia.elements(prop).toString();
		var overwriteValue = newMedia[prop].toString();
		
		if (currentValue != overwriteValue) differenceList.push(prop + " difference: Old Value = " + currentValue + " Overwriting Value = " + overwriteValue); 
	}
	
	if (differenceList.length > 0) {
		
		logToFile("\n*********************");
		logToFile("Media to compare is " + mediaName);
		
		for each (var diff in differenceList) {
			logToFile(diff);
		}
	}
}  

function logNewMAPDifferences(differenceList, mediaAccessProviderName) {
	
	if (differenceList.length > 0) {
		logToFile(" ");
		logToFile("Media Access Provider to compare is " + mediaAccessProviderName);
		
		for each (var diff in differenceList) {
			logToFile(diff);
		}
	}
}

function logExistingMAPvsNew(mediaAccessProviderName, mediaAccessProviderName, mediaAccessProviderType, mediaAccessProviderPath, mediaGroup ) {
	
	var cmd = 
		<PharosCs>
		  <CommandList>
			<Command subsystem="mediaAccess" method="getMediaAccessProvider">
			  <ParameterList>
				<Parameter name="providerName" value={mediaAccessProviderName}/>
			  </ParameterList>
			</Command>
		  </CommandList>
		</PharosCs>;
		
	var currentMediaAccessProvider = wscall(cmd)..MediaAccessProviderConfiguration;
	var differenceList = []; 
	
	if (mediaAccessProviderType == "local" || mediaAccessProviderType == "dvsLocal") {
		if (currentMediaAccessProvider..Path[0] != mediaAccessProviderPath) {
			differenceList.push("Path difference: Old Value = " + currentMediaAccessProvider..Path[0] + " Overwriting Value = " + mediaAccessProviderPath);
		} 
	} else if (mediaAccessProviderType == "ssh") {
		
		var newMAPProperties = {
			"Hostname": parameters.medias[mediaGroup].accessProvider.ssh.hostname, 
			"Port": parameters.medias[mediaGroup].accessProvider.ssh.port, 
			"Path": mediaAccessProviderPath, 
			"Username": parameters.medias[mediaGroup].accessProvider.ssh.username, 
			"Password": parameters.medias[mediaGroup].accessProvider.ssh.password
		}
		
		for (var prop in newMAPProperties) {
			var currentValue = currentMediaAccessProvider.descendants(prop).toString(); 
			var overwriteValue = newMAPProperties[prop].toString();
			
			if (currentValue != overwriteValue) differenceList.push(prop + " difference: Old Value = " + currentValue + " Overwriting Value = " + overwriteValue); 
		}
		
	} else if (mediaAccessProviderType == "divaShare") {
		
		var newMAPProperties = {
			"DivaShareName": parameters.medias[mediaGroup].accessProvider.divaShare.divaShareName, 
			"UseMediaRelativePath": parameters.medias[mediaGroup].accessProvider.divaShare.useRelativeMediaPath
		}
		
		for (var prop in newMAPProperties) {
			var currentValue = currentMediaAccessProvider.descendants(prop).toString(); 
			var overwriteValue = newMAPProperties[prop].toString();
			
			if (currentValue != overwriteValue) differenceList.push(prop + " difference: Old Value = " + currentValue + " Overwriting Value = " + overwriteValue);
		}
		
		
	} else if (mediaAccessProviderType == "divaRest") {
		var newMAPProperties = {
			"Hostname": parameters.medias[mediaGroup].accessProvider.divaRest.hostname, 
			"Port": parameters.medias[mediaGroup].accessProvider.divaRest.port, 
			"Version": parameters.medias[mediaGroup].accessProvider.divaRest.version, 
			"Category": parameters.medias[mediaGroup].accessProvider.divaRest.category, 
			"DivaMedia": parameters.medias[mediaGroup].accessProvider.divaRest.divaMedia, 
			"PriorityLevel": parameters.medias[mediaGroup].accessProvider.divaRest.priorityLevel, 
			"QualityOfService": parameters.medias[mediaGroup].accessProvider.divaRest.qos, 
			"UseMediaRelativePath": parameters.medias[mediaGroup].accessProvider.divaRest.useRelativeMediaPath
		}
		
		for (var prop in newMAPProperties) {
			var currentValue = currentMediaAccessProvider.descendants(prop).toString(); 
			var overwriteValue = newMAPProperties[prop].toString();
			
			if (currentValue != overwriteValue) differenceList.push(prop + " difference: Old Value = " + currentValue + " Overwriting Value = " + overwriteValue);
		}
	}
	logNewMAPDifferences(differenceList, mediaAccessProviderName);
}

function logNewNodeDifferences(differenceList, nodeName, mediaGroup) {
	
	if (differenceList.length > 0) {
		logToFile(" ");
		logToFile("Transfer Node to compare is " + nodeName + "\t" + "MediaGroup: "+ mediaGroup);
		
		for each (var diff in differenceList) {
			logToFile(diff);
		}
	}
}

function logExistingTransferNodeVsNew(transferNodeList, nodeName, mediaGroup, stagingType, frameRate) {
	
	var currentTransferNode = transferNodeList.TransferNode.(Name==nodeName);
	var differenceList = [];
	
	
	if (mediaGroup == "mainStore" || mediaGroup == "captions" || mediaGroup == "t2" || mediaGroup == "cache") {
		var newNodeProperties = {
			"MediaName": mediaName,
			"PartialTransfers": parameters.medias[mediaGroup].transferNode.partialTransfers, 
			"MaxIncomingTransfers": parameters.medias[mediaGroup].transferNode.maxIncomingTransfers, 
            "MaxOutgoingTransfers": parameters.medias[mediaGroup].transferNode.maxOutgoingTransfers
		}
		
		for (var prop in newNodeProperties) {
			var currentValue = currentTransferNode.descendants(prop).toString();
			var overwriteValue = newNodeProperties[prop].toString();
			
			if (currentValue != overwriteValue) differenceList.push(prop + " difference: Old Value = " + currentValue + " Overwriting Value = " + overwriteValue);
		}
		
	} else if (mediaGroup == "diva") {
		var newNodeProperties = {
			"MediaName": mediaName,
			"PartialTransfers": parameters.medias[mediaGroup].transferNode.partialTransfers, 
			"MaxIncomingTransfers": parameters.medias[mediaGroup].transferNode.maxIncomingTransfers, 
            "MaxOutgoingTransfers": parameters.medias[mediaGroup].transferNode.maxOutgoingTransfers,
			"ValidWorkflowStates": parameters.medias[mediaGroup].transferNode.validWorkFlowStates,
			
		}
		
		for (var prop in newNodeProperties) {
			if (prop === "ValidWorkflowStates") var currentValue = currentTransferNode.ValidWorkflowStates..Name[0].toString();
			else var currentValue = currentTransferNode.descendants(prop).toString();
			var overwriteValue = newNodeProperties[prop].toString();
			
			
			if (currentValue != overwriteValue) differenceList.push(prop + " difference: Old Value = " + currentValue + " Overwriting Value = " + overwriteValue);
		}
		
	} else if (mediaGroup == "staging") {
		
		if (stagingType == "nld") {
			var newNodeProperties = {
				"MediaName": mediaName,
				"PartialTransfers": parameters.medias[mediaGroup].transferNode.partialTransfers, 
				"MaxIncomingTransfers": parameters.medias[mediaGroup].transferNode.maxIncomingTransfers, 
				"MaxOutgoingTransfers": parameters.medias[mediaGroup].transferNode.maxOutgoingTransfers,
				"ValidWorkflowStates": parameters.medias[mediaGroup].transferNode.validWorkFlowStates,
				"TrackTypesRequiredOnDest": parameters.medias[mediaGroup].transferNode.trackTypesRequired, 
				"JobFactory": parameters.medias[mediaGroup].transferNode.jobFactory
			}
		
			for (var prop in newNodeProperties) {
				
				if (prop === "ValidWorkflowStates") { 
					var currentValue = currentTransferNode.ValidWorkflowStates..Name[0].toString();
				} else if (prop === "TrackTypesRequiredOnDest") {
					var currentValue = currentTransferNode..TrackTypesRequiredOnDest[0]..Name[0].toString();
				} else {
					var currentValue = currentTransferNode.descendants(prop).toString();
				}	
				var overwriteValue = newNodeProperties[prop].toString();
				
				if (currentValue != overwriteValue) differenceList.push(prop + " difference: Old Value = " + currentValue + " Overwriting Value = " + overwriteValue);
			}
			
		} else {
			var newNodeProperties = {
				"MediaName": mediaName,
				"PartialTransfers": parameters.medias[mediaGroup].transferNode.partialTransfers, 
				"MaxIncomingTransfers": parameters.medias[mediaGroup].transferNode.maxIncomingTransfers, 
				"MaxOutgoingTransfers": parameters.medias[mediaGroup].transferNode.maxOutgoingTransfers
			}
		
			for (var prop in newNodeProperties) {
				var currentValue = currentTransferNode.descendants(prop).toString();
				var overwriteValue = newNodeProperties[prop].toString();
				
				if (currentValue != overwriteValue) differenceList.push(prop + " difference: Old Value = " + currentValue + " Overwriting Value = " + overwriteValue);
			}
		}
	} else if (mediaGroup == "browse") {
		var newNodeProperties = {
			"MediaName": mediaName,
			"PartialTransfers": parameters.medias[mediaGroup].transferNode.partialTransfers, 
			"MaxIncomingTransfers": parameters.medias[mediaGroup].transferNode.maxIncomingTransfers, 
            "MaxOutgoingTransfers": parameters.medias[mediaGroup].transferNode.maxOutgoingTransfers,
			"TargetFileExtension": parameters.medias[mediaGroup].transferNode.targetFileExtension, 
		    "SourceFileExtension": parameters.medias[mediaGroup].transferNode.sourceFileExtension, 
		    "JobFactory": parameters.medias[mediaGroup].transferNode.jobFactory[frameRate], 
		    "OutputPath": parameters.medias[mediaGroup].transferNode.outputPath, 
		    "OutputTrackTemplate": parameters.medias[mediaGroup].transferNode.outputTrackTemplate
		}
		
		for (var prop in newNodeProperties) {
			var currentValue = currentTransferNode.descendants(prop).toString();
			var overwriteValue = newNodeProperties[prop].toString();
			
			if (currentValue != overwriteValue) differenceList.push(prop + " difference: Old Value = " + currentValue + " Overwriting Value = " + overwriteValue);
		}
	}
	logNewNodeDifferences(differenceList, nodeName, mediaGroup);
}

function transferRouteExists(sourceNode, destNode, transferRouteList) {
	logToFile("*********************");
	
	var transferRouteWithSourceAndDest = transferRouteList.TransferRoute.(SourceNode==sourceNode && DestinationNode==destNode);
	
	if (transferRouteWithSourceAndDest.length() === 0) return "TRANSFER ROUTE FROM [" + sourceNode + "] TO [" + destNode + "] DOES NOT EXIST CURRENTLY";
	else return "TRANSFER ROUTE FROM [" + sourceNode + "] TO [" + destNode + "] EXISTS";
}

function getTransferRouteList() {
	var cmd = 
		<PharosCs>
		  <CommandList>
			<Command subsystem="request" method="getRoutes"/>
		  </CommandList>
		</PharosCs>;
	
	return wscall(cmd)..TransferRouteList;
}


// Get all of the lists used to iterate through
var mediaList = getMediaList();
var mediaAccessProviderList = getMediaAccessProviderList();
var mediaAccessLinkList = getMediaAccessLinkList();
var transferNodeList = getTransferNodeList();
var transferRouteList = getTransferRouteList();

// Set the stage for each media differentiator, these are mostly used to build media names
var locations = ["DC", "EC"];
var mediaGroups = ["mainStore", "captions", "t2", "diva", "staging", "browse", "cache"];
var mediaAccessProviderTypes = ["local", "dvsLocal", "ssh", "divaShare", "divaRest"];
var mediaAccessLinkTypes = ["transfer", "manage", "browse"];
var frameRates = ["P23_976", "DF30", "DF60", "NDF25"];
var contentTypes = ["LF", "SF"];
var resolutions = ["HD","SD"];
var formats = ["PRORES","XDCAM","WAV"];
var captionTypes = ["CAP", "PAC", "SCC", "SMPTE-TT", "STL"];
var stagingTypes = ["component", "om", "nld"];
var cacheTypes = ["Preprocessing", "Conform", "Transcode", "Postprocessing"];

/**
 * Creating the transfer system elements including:
 *  - Medias
 *  - Media Access Providers
 *  - Media Access Links
 *  - Transfer Nodes
 *
 *  The script is implemented such that we iterate through each Media Group and build up the
 *  Medias using the differentiating criteria (i.e. frame rates or resolutions)
 *
 *      For example, to build all of the main storage medias, we know they differ by frame rate
 *      content type (LF vs. SF), resolution (HD vs. SD) and format (i.e. ProRes)
 *      With this information we iterate through a list of each of these differentiators and
 *      create a single media for each one
 *
 *  The next step is to build a media access provider for the new Media which goes through the
 *  same process of building the name (taking the suffix from the parameters above)
 *
 *  Next, we setup the Media Access Link
 *  Finally, we setup the Transfer Node
 *
 *  The pseudo code looks something like this:
 *
 *      Loop through the media differentiators
 *          Create a media (if required)
 *              Loop through the media access provider types
 *                  Create an access provider (if required)
 *                      Loop through the media access link types
 *                          Create a media access link (if required)
 *          Create a transfer node (if required)
 *
 *  Each step along the way, we check if the desired element exists already
 *      TODO: Implement an output when the check if exists is made and show the differences
 *            between what is currently implemented vs. what will be saved (from the parameters)
 *
 */
try {
    // Create the Transfer System Elements (Medias, Media Access Providers, Media Access Links and Transfer Nodes)
    for each (var location in locations) {                                              // We are able to enable EC and DC in the parameters above
        if (parameters.locations[location].create == true) {

            for each (var mediaGroup in mediaGroups) {
                if (parameters.medias[mediaGroup].media.create == true) {

                    if (mediaGroup.indexOf("mainStore") != -1 || mediaGroup.indexOf("t2") != -1 || mediaGroup.indexOf("diva") != -1) {

                        // Media Creation Begins

                        // Work out the name of the Media
                        //  - we create a media for each frame rate, content type, resolution and format
                        for each (var frameRate in frameRates) {                        // We have to build up the Media names with:
                            if (parameters.frameRates[frameRate].create == true) {      // frame rate (there is an open discussion about which frame rates should be included so this is currently optional)

                                for each (var contentType in contentTypes) {            // content type (Long Form & Short Form)
                                    for each (var resolution in resolutions) {          // resolution (HD & SD)
                                        for each (var format in formats) {              // formats (ProRes, XDCAM or WAV)

                                            var mediaName = "";
                                            var mediaAbsolutePath = "";
                                            var mediaRelativePath = "";

                                            // Work out if we want to save a Main Store, T2 or DIVA Media and set the name and paths accordingly
                                            if (mediaGroup.indexOf("mainStore") != -1) {
                                                mediaName = location + "_" + parameters.frameRates[frameRate].inMediaName + "_" + contentType + "_" + resolution + "_" + format;
                                                mediaAbsolutePath = parameters.medias[mediaGroup].media.pathPrefix + parameters.frameRates[frameRate].inMediaPath + "/" + contentType + "/" + resolution + "/" + format + "/";
                                                mediaRelativePath = parameters.frameRates[frameRate].inMediaPath + "/" + contentType + "/" + resolution + "/" + format + "/";
                                            } else if (mediaGroup.indexOf("t2") != -1) {
                                                mediaName = location + "_T2_" + parameters.frameRates[frameRate].inMediaName + "_" + contentType + "_" + resolution + "_" + format;
                                                mediaAbsolutePath = parameters.medias[mediaGroup].media.pathPrefix + parameters.frameRates[frameRate].inMediaPath + "/" + contentType + "/" + resolution + "/" + format + "/";
                                                mediaRelativePath = parameters.frameRates[frameRate].inMediaPath + "/" + contentType + "/" + resolution + "/" + format + "/";
                                            } else if (mediaGroup.indexOf("diva") != -1) {
                                                mediaName = location + "_DIVA_" + parameters.frameRates[frameRate].inMediaName + "_" + contentType + "_" + resolution + "_" + format;
                                                mediaAbsolutePath = "";
                                                mediaRelativePath = "";
                                            }

                                            // In order to keep track of which Medias belong to which Media Group
                                            // we save the mediaName to a list of medias for each Media Group
                                            // This is later used by the Transfer Routing portion of the script
                                            parameters.medias[mediaGroup].media.mediaList.push(mediaName);    // Keep track of the Medias
                                            
                                            output(mediaName);
                                            
                                            // Before each media is created, we check if it exists (if it does we don't write over it)
                                            if (searchForMedia(mediaName) == false) {  
                                                saveMedia(mediaName,
                                                          getMaxMachineNumber(),
                                                          frameRate,
                                                          parameters.medias[mediaGroup].media.totalSpace,
                                                          parameters.medias[mediaGroup].media.highMark,
                                                          parameters.medias[mediaGroup].media.lowMark,
                                                          mediaAbsolutePath,
                                                          mediaRelativePath,
                                                          parameters.medias[mediaGroup].media.directoryNameFactory); 
												
                                            } else { 			// TODO: Implement the ability to overwrite Medias (input ID?)
												var newMediaToBeCreated = {
													"Name"	: mediaName,
													"MachineNumber": getMaxMachineNumber(),
													"FrameRate": frameRate,
													"TotalSpace": parameters.medias[mediaGroup].media.totalSpace, 
													"HighMark": parameters.medias[mediaGroup].media.highMark, 
													"LowMark": parameters.medias[mediaGroup].media.lowMark, 
													"AbsolutePath": mediaAbsolutePath, 
													"RelativePath": mediaRelativePath, 
													"DirectoryNameFactoryName": parameters.medias[mediaGroup].media.directoryNameFactory
												}
												
												logExistingMediaVsNew(mediaName, newMediaToBeCreated);
												
												overwriteMedia(mediaName,
                                                          getMaxMachineNumber(),
                                                          frameRate,
                                                          parameters.medias[mediaGroup].media.totalSpace,
                                                          parameters.medias[mediaGroup].media.highMark,
                                                          parameters.medias[mediaGroup].media.lowMark,
                                                          mediaAbsolutePath,
                                                          mediaRelativePath,
                                                          parameters.medias[mediaGroup].media.directoryNameFactory);
											}

                                            // Media Access Provider Creation Begins
                                            
                                            // We want to create all of the Media Access Providers required for the newly saved Media
                                            for each (var mediaAccessProviderType in mediaAccessProviderTypes) {
                                                if (parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].create == true) {

                                                    var mediaAccessProviderName = "";
                                                    var mediaAccessProviderPath = parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].pathPrefix + parameters.frameRates[frameRate].inMediaPath + "/" + contentType + "/" + resolution + "/" + format + "/";
                                                    
                                                    // The Media Access Providers for DIVA_REST and DIVA_Share are hardcoded since there's only one of each
                                                    if (mediaAccessProviderType.indexOf("divaRest") != -1) {
                                                        mediaAccessProviderName = "DIVA_REST_Main";
                                                    } else if (mediaAccessProviderType.indexOf("divaShare") != -1) {
                                                        mediaAccessProviderName = "DIVA_Share_Main";
                                                    } else {
                                                        mediaAccessProviderName = mediaName + parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].nameSuffix;
                                                    }

                                                    // This save function will be executed multiple times for a single Media
                                                    // to create all of the Access Providers at one time
                                                    if (searchForMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType) == false) {
                                              
                                                        createMediaAccessProvider(mediaAccessProviderName, 
                                                                                  mediaAccessProviderType, 
                                                                                  mediaAccessProviderPath, 
                                                                                  mediaGroup);
                                                    } else {
														
														logExistingMAPvsNew(mediaAccessProviderName, 
																			mediaAccessProviderName, 
																			mediaAccessProviderType, 
																			mediaAccessProviderPath, 
																			mediaGroup);
														
														createMediaAccessProvider(mediaAccessProviderName, 
                                                                                  mediaAccessProviderType, 
                                                                                  mediaAccessProviderPath, 
                                                                                  mediaGroup);
													}
                                                }

                                                // Media Access Link Creation Begins

                                                // Note that this loop is still within the Media Access Provider creation loop
                                                // This is because we potentially want to create a link function for each access provider
                                                for each (var mediaAccessLinkType in mediaAccessLinkTypes) {
                                                    if (parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].create == true) {
                                                        // Check if the current Access Provider Type is assigned to the current Access Link 
                                                        if (parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].accessProvider == mediaAccessProviderType) {
                                                            // We must ensure the required Access Provider exists, and the new Access Link doesn't already exist
                                                            if (searchForMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType) == true) {
                                                                if (searchForMediaAccessLink(mediaName, mediaAccessProviderName, parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].function) == false) {

                                                                    saveMediaAccessLink(mediaName,
                                                                                        mediaAccessProviderName,
                                                                                        parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].function);
                                                                } 
                                                            }
                                                        }
                                                    }
                                                }
                                            }

                                            // Transfer Node Creation Begins

                                            // Note that this loop is outside of the access provider loop, but within the media
                                            // creation loop (1 transfer node per media)
                                            if (parameters.medias[mediaGroup].transferNode.create == true) {
                                                if (searchForTransferNode(mediaName) == false) {
                                                    createTransferNode(mediaName, mediaGroup);
                                                } else {
													logExistingTransferNodeVsNew(transferNodeList, mediaName, mediaGroup);
													createTransferNode(mediaName, mediaGroup);
												}
                                            }


                                        }
                                    }
                                }
                            }
                        }
                    } else if (mediaGroup.indexOf("captions") != -1) {
                        
                        // Media Creation Begins

                        for each (var captionType in captionTypes) {        // Caption Medias don't require as many variables in their name

                            var mediaName = location + "_Sub_" + captionType;
                            var mediaAbsolutePath = parameters.medias[mediaGroup].media.pathPrefix + captionType + "/";
                            var mediaRelativePath = "Subs/" + captionType + "/";

                            // In order to keep track of which Medias belong to which Media Group
                            // we save the mediaName to a list of medias for each Media Group
                            // This is later used by the Transfer Routing portion of the script
                            parameters.medias[mediaGroup].media.mediaList.push(mediaName);    // Keep track of the Medias
                            
                            output(mediaName);
                            
                            // Check if the Media doesn't exist already before attempting to save it
                            if (searchForMedia(mediaName) == false) {
                                saveMedia(mediaName,
                                          getMaxMachineNumber(),
                                          "DF30",
                                          parameters.medias[mediaGroup].media.totalSpace,
                                          parameters.medias[mediaGroup].media.highMark,
                                          parameters.medias[mediaGroup].media.lowMark,
                                          mediaAbsolutePath,
                                          mediaRelativePath,
                                          parameters.medias[mediaGroup].media.directoryNameFactory);
                            } else {
								
								var newMediaToBeCreated = {
									"Name"	: mediaName,
									"MachineNumber": getMaxMachineNumber(),
									"FrameRate": "DF30",
									"TotalSpace": parameters.medias[mediaGroup].media.totalSpace, 
									"HighMark": parameters.medias[mediaGroup].media.highMark, 
									"LowMark": parameters.medias[mediaGroup].media.lowMark, 
									"AbsolutePath": mediaAbsolutePath, 
									"RelativePath": mediaRelativePath, 
									"DirectoryNameFactoryName": parameters.medias[mediaGroup].media.directoryNameFactory
								}
								
								logExistingMediaVsNew(mediaName, newMediaToBeCreated);
								
								overwriteMedia(mediaName,
                                          getMaxMachineNumber(),
                                          "DF30",
                                          parameters.medias[mediaGroup].media.totalSpace,
                                          parameters.medias[mediaGroup].media.highMark,
                                          parameters.medias[mediaGroup].media.lowMark,
                                          mediaAbsolutePath,
                                          mediaRelativePath,
                                          parameters.medias[mediaGroup].media.directoryNameFactory);
							}                                        

                            // Media Access Provider Creation Begins
                            
                            // We want to create all of the Media Access Providers required for the newly saved Media
                            for each (var mediaAccessProviderType in mediaAccessProviderTypes) {

                                if (parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].create == true) {

                                    var mediaAccessProviderName = mediaName + parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].nameSuffix;
                                    var mediaAccessProviderPath = parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].pathPrefix + captionType + "/";

                                    // This save function will be executed multiple times for a single Media
                                    // to create all of the Access Providers at one time
                                    if (searchForMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType) == false) {
                              
                                        createMediaAccessProvider(mediaAccessProviderName, 
                                                                  mediaAccessProviderType, 
                                                                  mediaAccessProviderPath, 
                                                                  mediaGroup);
                                    } else {
										
										logExistingMAPvsNew(mediaAccessProviderName, 
															mediaAccessProviderName, 
															mediaAccessProviderType, 
															mediaAccessProviderPath, 
															mediaGroup);
										
										createMediaAccessProvider(mediaAccessProviderName, 
                                                                  mediaAccessProviderType, 
                                                                  mediaAccessProviderPath, 
                                                                  mediaGroup);
									}
                                }

                                // Media Access Link Creation Begins

                                // Note that this loop is still within the Media Access Provider creation loop
                                // This is because we potentially want to create a link function for each access provider
                                for each (var mediaAccessLinkType in mediaAccessLinkTypes) {
                                    
                                    if (parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].create == true) {
                                        if (parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].accessProvider == mediaAccessProviderType) {
                                            if (searchForMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType) == true) {
                                                if (searchForMediaAccessLink(mediaName, mediaAccessProviderName, parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].function) == false) {
                                                    
                                                    saveMediaAccessLink(mediaName,
                                                                        mediaAccessProviderName,
                                                                        parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].function);
                                                } 
                                            }    
                                        }
                                    }
                                }
                            }

                            // Transfer Node Creation Begins

                            // Note that this loop is outside of the access provider loop, but within the media
                            // creation loop (1 transfer node per media)
                            if (parameters.medias[mediaGroup].transferNode.create == true) {
                                if (searchForTransferNode(mediaName) == false) {
                                    createTransferNode(mediaName, mediaGroup);
                                } else {
									logExistingTransferNodeVsNew(transferNodeList, mediaName, mediaGroup);
									createTransferNode(mediaName, mediaGroup);
								}
                            }
                        }
                    } else if (mediaGroup.indexOf("staging") != -1) {
                        
                        // Media Creation Begins

                        for each (var stagingType in stagingTypes) {
							
							var stagingMediaNameEnding = {
									"nld" : "Staging",
									"om" : "_STAGING",
									"component" : "_STAGING"
							};
							
                            var mediaName = location + "_" + parameters.medias[mediaGroup].media.nameSuffix[stagingType] + stagingMediaNameEnding[stagingType];
                            var mediaAbsolutePath = parameters.medias[mediaGroup].media.pathPrefix[stagingType] + parameters.medias[mediaGroup].media.pathSuffix[stagingType];
                            var mediaRelativePath = parameters.medias[mediaGroup].media.pathSuffix[stagingType];
                            
                            // In order to keep track of which Medias belong to which Media Group
                            // we save the mediaName to a list of medias for each Media Group
                            // This is later used by the Transfer Routing portion of the script
                            parameters.medias[mediaGroup].media.mediaList.push(mediaName);    // Keep track of the Medias

                            output(mediaName);
                            
                            if (searchForMedia(mediaName) == false) {
                                saveMedia(mediaName,
                                          getMaxMachineNumber(),
                                          "DF30",
                                          parameters.medias[mediaGroup].media.totalSpace,
                                          parameters.medias[mediaGroup].media.highMark,
                                          parameters.medias[mediaGroup].media.lowMark,
                                          mediaAbsolutePath,
                                          mediaRelativePath,
                                          parameters.medias[mediaGroup].media.directoryNameFactory);
                            } else {
								var newMediaToBeCreated = {
									"Name"	: mediaName,
									"MachineNumber": getMaxMachineNumber(),
									"FrameRate": "DF30",
									"TotalSpace": parameters.medias[mediaGroup].media.totalSpace, 
									"HighMark": parameters.medias[mediaGroup].media.highMark, 
									"LowMark": parameters.medias[mediaGroup].media.lowMark, 
									"AbsolutePath": mediaAbsolutePath, 
									"RelativePath": mediaRelativePath, 
									"DirectoryNameFactoryName": parameters.medias[mediaGroup].media.directoryNameFactory
								}
								
								logExistingMediaVsNew(mediaName, newMediaToBeCreated);
								
								overwriteMedia(mediaName,
                                          getMaxMachineNumber(),
                                          "DF30",
                                          parameters.medias[mediaGroup].media.totalSpace,
                                          parameters.medias[mediaGroup].media.highMark,
                                          parameters.medias[mediaGroup].media.lowMark,
                                          mediaAbsolutePath,
                                          mediaRelativePath,
                                          parameters.medias[mediaGroup].media.directoryNameFactory);
							}                                    

                            // Media Access Provider Creation Begins
                            
                            for each (var mediaAccessProviderType in mediaAccessProviderTypes) {
                                if (parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].create == true) {

                                    var mediaAccessProviderName = mediaName + parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].nameSuffix;
                                    var mediaAccessProviderPath = parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].pathPrefix[stagingType];

                                    // This save function will be executed multiple times for a single Media
                                    // to create all of the Access Providers at one time
                                    if (searchForMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType) == false) {
                              
                                        createMediaAccessProvider(mediaAccessProviderName, 
                                                                  mediaAccessProviderType, 
                                                                  mediaAccessProviderPath, 
                                                                  mediaGroup);
                                    } else {
										logExistingMAPvsNew(mediaAccessProviderName, 
															mediaAccessProviderName, 
															mediaAccessProviderType, 
															mediaAccessProviderPath, 
															mediaGroup);
															
										createMediaAccessProvider(mediaAccessProviderName, 
                                                                  mediaAccessProviderType, 
                                                                  mediaAccessProviderPath, 
                                                                  mediaGroup);
									}
                                }

                                // Media Access Link Creation Begins

                                // Note that this loop is still within the Media Access Provider creation loop
                                // This is because we potentially want to create a link function for each access provider
                                for each (var mediaAccessLinkType in mediaAccessLinkTypes) {                                
                                    if (parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].create == true) {
                                        if (parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].accessProvider == mediaAccessProviderType) {
                                            if (searchForMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType) == true) {
                                                if (searchForMediaAccessLink(mediaName, mediaAccessProviderName, parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].function) == false) {

                                                    saveMediaAccessLink(mediaName,
                                                                        mediaAccessProviderName,
                                                                        parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].function);
                                                } 
                                            }    
                                        }
                                    }
                                }
                            }

                            // Transfer Node Creation Begins

                            // Note that this loop is outside of the access provider loop, but within the media
                            // creation loop (1 transfer node per media)
                            if (parameters.medias[mediaGroup].transferNode.create == true) {
                                if (searchForTransferNode(mediaName) == false) {
                                    createTransferNode(mediaName, mediaGroup, stagingType);
                                } else {
									logExistingTransferNodeVsNew(transferNodeList, mediaName, mediaGroup, stagingType);
									createTransferNode(mediaName, mediaGroup, stagingType);
								}
                            }
                        }
                    } else if (mediaGroup.indexOf("browse") != -1) {

                        // Media Creation Begins

                        for each (var frameRate in frameRates) {
                            if (parameters.frameRates[frameRate].create == true) {

                                var mediaName = location + "_Browse_" + frameRate;
                                var mediaAbsolutePath = parameters.medias[mediaGroup].media.pathPrefix;
                                var mediaRelativePath = "browse/";

                                // In order to keep track of which Medias belong to which Media Group
                                // we save the mediaName to a list of medias for each Media Group
                                // This is later used by the Transfer Routing portion of the script
                                parameters.medias[mediaGroup].media.mediaList.push(mediaName);    // Keep track of the Medias

                                output(mediaName);
                                
                                if (searchForMedia(mediaName) == false) {
                                    saveMedia(mediaName,
                                              getMaxMachineNumber(),
                                              frameRate,
                                              parameters.medias[mediaGroup].media.totalSpace,
                                              parameters.medias[mediaGroup].media.highMark,
                                              parameters.medias[mediaGroup].media.lowMark,
                                              mediaAbsolutePath,
                                              mediaRelativePath,
                                              parameters.medias[mediaGroup].media.directoryNameFactory);
                                } else {
									var newMediaToBeCreated = {
										"Name"	: mediaName,
										"MachineNumber": getMaxMachineNumber(),
										"FrameRate": frameRate,
										"TotalSpace": parameters.medias[mediaGroup].media.totalSpace, 
										"HighMark": parameters.medias[mediaGroup].media.highMark, 
										"LowMark": parameters.medias[mediaGroup].media.lowMark, 
										"AbsolutePath": mediaAbsolutePath, 
										"RelativePath": mediaRelativePath, 
										"DirectoryNameFactoryName": parameters.medias[mediaGroup].media.directoryNameFactory
									}
									logExistingMediaVsNew(mediaName, newMediaToBeCreated);
									
									overwriteMedia(mediaName,
												  getMaxMachineNumber(),
												  frameRate,
												  parameters.medias[mediaGroup].media.totalSpace,
												  parameters.medias[mediaGroup].media.highMark,
												  parameters.medias[mediaGroup].media.lowMark,
												  mediaAbsolutePath,
												  mediaRelativePath,
												  parameters.medias[mediaGroup].media.directoryNameFactory);
								}                                  

                                // Media Access Provider Creation Begins
                                
                                for each (var mediaAccessProviderType in mediaAccessProviderTypes) {
                                    if (parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].create == true) {

                                        var mediaAccessProviderName = mediaName + parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].nameSuffix;
                                        var mediaAccessProviderPath = parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].pathPrefix;

                                        // This save function will be executed multiple times for a single Media
                                        // to create all of the Access Providers at one time
                                        if (searchForMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType) == false) {
                                  
                                            createMediaAccessProvider(mediaAccessProviderName, 
                                                                      mediaAccessProviderType, 
                                                                      mediaAccessProviderPath, 
                                                                      mediaGroup);
                                        } else {
											logExistingMAPvsNew(mediaAccessProviderName, 
																mediaAccessProviderName, 
																mediaAccessProviderType, 
																mediaAccessProviderPath, 
																mediaGroup);
																
											createMediaAccessProvider(mediaAccessProviderName, 
                                                                      mediaAccessProviderType, 
                                                                      mediaAccessProviderPath, 
                                                                      mediaGroup);
										}
                                    }

                                    // Media Access Link Creation Begins

                                    // Note that this loop is still within the Media Access Provider creation loop
                                    // This is because we potentially want to create a link function for each access provider
                                    for each (var mediaAccessLinkType in mediaAccessLinkTypes) {                                
                                        if (parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].create == true) {
                                            if (parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].accessProvider == mediaAccessProviderType) {
                                                if (searchForMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType) == true) {
                                                    if (searchForMediaAccessLink(mediaName, mediaAccessProviderName, parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].function) == false) {

                                                        saveMediaAccessLink(mediaName,
                                                                            mediaAccessProviderName,
                                                                            parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].function);
                                                    } 
                                                }    
                                            }
                                        }
                                    }
                                }

                                // Transfer Node Creation Begins

                                // Note that this loop is outside of the access provider loop, but within the media
                                // creation loop (1 transfer node per media)
                                if (parameters.medias[mediaGroup].transferNode.create == true) {
                                    if (searchForTransferNode(mediaName) == false) {
                                        createTransferNode(mediaName, mediaGroup, "", frameRate);
                                    } else {
										logExistingTransferNodeVsNew(transferNodeList, mediaName, mediaGroup, "", frameRate);
										createTransferNode(mediaName, mediaGroup, "", frameRate);
									}
                                }
                            }
                        }
                    } else if (mediaGroup.indexOf("cache") != -1) {

                        // Media Creation Begins

                        for each (var cacheType in cacheTypes) {

                            var mediaName = location + "_" + cacheType + "Cache";
                            var mediaAbsolutePath = parameters.medias[mediaGroup].media.pathPrefix + cacheType + "Cache/";
                            var mediaRelativePath = cacheType + "Cache/";

                            // In order to keep track of which Medias belong to which Media Group
                            // we save the mediaName to a list of medias for each Media Group
                            // This is later used by the Transfer Routing portion of the script
                            parameters.medias[mediaGroup].media.mediaList.push(mediaName);    // Keep track of the Medias

                            output(mediaName);
                            
                            if (searchForMedia(mediaName) == false) {
                                saveMedia(mediaName,
                                          getMaxMachineNumber(),
                                          frameRate,
                                          parameters.medias[mediaGroup].media.totalSpace,
                                          parameters.medias[mediaGroup].media.highMark,
                                          parameters.medias[mediaGroup].media.lowMark,
                                          mediaAbsolutePath,
                                          mediaRelativePath,
                                          parameters.medias[mediaGroup].media.directoryNameFactory);
                            } else {
								var newMediaToBeCreated = {
									"Name"	: mediaName,
									"MachineNumber": getMaxMachineNumber(),
									"FrameRate": frameRate,
									"TotalSpace": parameters.medias[mediaGroup].media.totalSpace, 
									"HighMark": parameters.medias[mediaGroup].media.highMark, 
									"LowMark": parameters.medias[mediaGroup].media.lowMark, 
									"AbsolutePath": mediaAbsolutePath, 
									"RelativePath": mediaRelativePath, 
									"DirectoryNameFactoryName": parameters.medias[mediaGroup].media.directoryNameFactory
								}
								
								logExistingMediaVsNew(mediaName, newMediaToBeCreated);
								
								overwriteMedia(mediaName,
                                          getMaxMachineNumber(),
                                          frameRate,
                                          parameters.medias[mediaGroup].media.totalSpace,
                                          parameters.medias[mediaGroup].media.highMark,
                                          parameters.medias[mediaGroup].media.lowMark,
                                          mediaAbsolutePath,
                                          mediaRelativePath,
                                          parameters.medias[mediaGroup].media.directoryNameFactory);
							}                                     

                            // Media Access Provider Creation Begins
                            
                            for each (var mediaAccessProviderType in mediaAccessProviderTypes) {
                                if (parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].create == true) {

                                    var mediaAccessProviderName = mediaName + parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].nameSuffix;
                                    var mediaAccessProviderPath = parameters.medias[mediaGroup].accessProvider[mediaAccessProviderType].pathPrefix + cacheType + "Cache/";

                                    // This save function will be executed multiple times for a single Media
                                    // to create all of the Access Providers at one time
                                    if (searchForMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType) == false) {
                              
                                        createMediaAccessProvider(mediaAccessProviderName, 
                                                                  mediaAccessProviderType, 
                                                                  mediaAccessProviderPath, 
                                                                  mediaGroup);
                                    } else {
										logExistingMAPvsNew(mediaAccessProviderName, 
															mediaAccessProviderName, 
															mediaAccessProviderType, 
															mediaAccessProviderPath, 
															mediaGroup);
										
										createMediaAccessProvider(mediaAccessProviderName, 
                                                                  mediaAccessProviderType, 
                                                                  mediaAccessProviderPath, 
                                                                  mediaGroup);
									}
                                }

                                // Media Access Link Creation Begins

                                // Note that this loop is still within the Media Access Provider creation loop
                                // This is because we potentially want to create a link function for each access provider
                                for each (var mediaAccessLinkType in mediaAccessLinkTypes) {                                
                                    if (parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].create == true) {
                                        if (parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].accessProvider == mediaAccessProviderType) {
                                            if (searchForMediaAccessProvider(mediaAccessProviderName, mediaAccessProviderType) == true) {
                                                if (searchForMediaAccessLink(mediaName, mediaAccessProviderName, parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].function) == false) {

                                                    saveMediaAccessLink(mediaName,
                                                                        mediaAccessProviderName,
                                                                        parameters.medias[mediaGroup].accessLink[mediaAccessLinkType].function);
                                                } 
                                            }    
                                        }
                                    }
                                }
                            }

                            // Transfer Node Creation Begins

                            // Note that this loop is outside of the access provider loop, but within the media
                            // creation loop (1 transfer node per media)
                            if (parameters.medias[mediaGroup].transferNode.create == true) {
                                if (searchForTransferNode(mediaName) == false) {
                                    createTransferNode(mediaName, mediaGroup);
                                } else {
									logExistingTransferNodeVsNew(transferNodeList, mediaName, mediaGroup);
									createTransferNode(mediaName, mediaGroup);
								}
                            }
                        }
                    }
                }
            }
        }
    }
} catch(e) {
    print(e.name);
    print(e.message);
}

/**
 * Creating the transfer routes:
 *
 *  The script is designed to run through each media group and determine which media group to transfer
 *  to. Using the script parameters we can choose which media groups will be marked as destinations.
 *
 *  Pseudo Code would look something like this:
 *
 *      Loop through the media groups (these are the source groups)
 *          Loop through the individual medias for a given media group (these are the source nodes)
 *              Loop through the media groups again (these are the destination groups)
 *                  Loop through the individual medias for a given media group (these are the destination nodes)
 *                      
 *                      Check to see if the source media group should be delivered to a given destination media group
 *                          Implement media group specific logic (edge cases)
 *                          Create the transfer route between the source and destination nodes*
 *
 */

try {
    // Create the Transfer System Routes
    for each (var sourceMediaGroup in mediaGroups) {
        for each (var sourceNode in parameters.medias[sourceMediaGroup].media.mediaList) {

            // Match them to the Destination Nodes
            for each (var destMediaGroup in mediaGroups) {
                for each (var destNode in parameters.medias[destMediaGroup].media.mediaList) {

                    // Check if the parameters are set to create the link between source and destination
                    if (parameters.medias[sourceMediaGroup].transferRoute[destMediaGroup].create == true) {

                        var sourceMediaAccessProvider = sourceNode + parameters.medias[sourceMediaGroup].accessProvider.dvsLocal.nameSuffix;
                        var destMediaAccessProvider = destNode + parameters.medias[destMediaGroup].accessProvider.ssh.nameSuffix;
        
                        // Media Group specific edge cases

                        // Delivering from the Staging Medias, we deliver from the Component Staging Media:
                        //  - TO Main Store WAV Medias
                        //  - TO Caption Medias
                        if (destMediaGroup.indexOf("mainStore") != -1) {
                            if (destNode.indexOf("WAV") != -1) {
                                if (sourceNode.indexOf("Component") != -1) {
                                    output("Saving Transfer Route: " + sourceNode + " -> " + destNode);
									logToFile(transferRouteExists(sourceNode, destNode, transferRouteList));
                                    saveTransferRoute(sourceNode, destNode, sourceMediaAccessProvider, destMediaAccessProvider);              
                                }
                            }
                            if (sourceNode.indexOf("T2") != -1) {
                                // Make sure we only do a route between the equivalent medias
                                if (sourceNode.substring(6).indexOf(destNode.substring(3)) != -1) {
                                    output("Saving Transfer Route: " + sourceNode + " -> " + destNode);
									logToFile(transferRouteExists(sourceNode, destNode, transferRouteList));
                                    saveTransferRoute(sourceNode, destNode, sourceMediaAccessProvider, destMediaAccessProvider);
                                }
                            }
                        }
                        if (destMediaGroup.indexOf("captions") != -1) {
                            if (sourceNode.indexOf("Component") != -1) {
                                output("Saving Transfer Route: " + sourceNode + " -> " + destNode);
								logToFile(transferRouteExists(sourceNode, destNode, transferRouteList));
                                saveTransferRoute(sourceNode, destNode, sourceMediaAccessProvider, destMediaAccessProvider);
                            }      
                        }

                        // Delivering to the T2 Medias, we deliver from the Main Storage Medias and DIVA
                        if (destMediaGroup.indexOf("t2") != -1) {
                            if (sourceNode.indexOf("DIVA") != -1) {
                                sourceMediaAccessProvider = "";
                                destMediaAccessProvider = "";

                                // Make sure we only do a route between the equivalent medias
                                if (sourceNode.substring(8).indexOf(destNode.substring(6)) != -1) {
                                    output("Saving Transfer Route: " + sourceNode + " -> " + destNode);
									logToFile(transferRouteExists(sourceNode, destNode, transferRouteList));
                                    saveTransferRouteNoProviders(sourceNode, destNode);
                                }
                            }
                            if (sourceMediaGroup.indexOf("mainStore") != -1) {
                                // Make sure we only do a route between the equivalent medias
                                if (sourceNode.substring(3).indexOf(destNode.substring(6)) != -1) {
                                    output("Saving Transfer Route: " + sourceNode + " -> " + destNode);
									logToFile(transferRouteExists(sourceNode, destNode, transferRouteList));
                                    saveTransferRoute(sourceNode, destNode, sourceMediaAccessProvider, destMediaAccessProvider);
                                }
                            }
                        }

                        // Delivering to the DIVA Medias, we deliver from T2
                        if (destMediaGroup.indexOf("diva") != -1) {
                            if (sourceNode.indexOf("T2") != -1) {
                                sourceMediaAccessProvider = "";
                                destMediaAccessProvider = "";

                                // Make sure we only do a route between the equivalent medias
                                if (sourceNode.substring(6).indexOf(destNode.substring(8)) != -1) {
                                    output("Saving Transfer Route: " + sourceNode + " -> " + destNode);
									logToFile(transferRouteExists(sourceNode, destNode, transferRouteList));
                                    saveTransferRouteNoProviders(sourceNode, destNode);
                                }
                            }
                        }

                        // Delivering to the Staging Medias, we deliver to the NLD Staging Media
                        if (destMediaGroup.indexOf("staging") != -1) {
                            if (destNode.indexOf("NLD") != -1) {
                                output("Saving Transfer Route: " + sourceNode + " -> " + destNode);
								logToFile(transferRouteExists(sourceNode, destNode, transferRouteList));
                                saveTransferRoute(sourceNode, destNode, sourceMediaAccessProvider, destMediaAccessProvider);
                            }
                        }
                        
                        // Delivering to the Browse Medias, we deliver from the Main Storage Medias and T2
                        if (destMediaGroup.indexOf("browse") != -1) {
                            sourceMediaAccessProvider = "";
                            destMediaAccessProvider = "";

                            // Make sure we only do a route between the equivalent medias
                            if (sourceNode.indexOf(parameters.frameRates[destNode.substring(10)].inMediaName) != -1) {
                                output("Saving Transfer Route: " + sourceNode + " -> " + destNode);
								logToFile(transferRouteExists(sourceNode, destNode, transferRouteList));
                                saveTransferRouteNoProviders(sourceNode, destNode);
                            }        
                        }
                    }
                }
            }
        }
    }
} catch(e) { 
    print(e.name);
    print(e.message);
}   










