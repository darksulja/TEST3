#!/usr/bin/python
'''
Created on 5 Jan 2017
Uses TrackFiles
Uses MediaAccessProvider Default Media Provider Means Use Paths
Works with S3, Diva, Glacier, FTP and LocalMedia
Works with external audio sources
@author: Akshay Kumar, John East, Craig Sloggett
'''
import sys
import stat
import logging
import threading
import json
from evertz.mediator.access.provider_factory import MediaAccessProviderFactory, MediaAccessProviderFunction
from evertz.mediator.transfer.base_transfer import TransferState, TransferJobDescription, AbstractFileTransfer
from evertz.mediator.transfer.transfer_factory import TransferFactory
from evertz.mediator.ws import MediatorHttpClientV1
from evertz.utils.file_utils import FileUtils
from ssh_copy import SSHCopy

# Set up the logging that all transfer objects will inherit
logging.basicConfig(level=logging.INFO, format=' %(message)s')
logger = logging.getLogger("default_transfer")
# Setup the Job information
medclient = None
job_id = ''
# Declare the FileUtils object used to copy files
file_utils = FileUtils()
# Keep Track of the Files Transferred
files_transferred = []
# Keep Track of the Track Index
track_index = 0


def update_job_progress(progress):
    medclient.job_update_status_map(job_id, {'JOB__PROGRESS': progress})


def main():
    global medclient
    global job_id
    global files_transferred
    global track_index

    # -----------------------------
    # Initial Setup
    # -----------------------------
    # Validate Arguments Passed
    logger.info('\nInitial Setup\n')

    # Validating Arguments
    if len(sys.argv) < 2 or '+' not in sys.argv[1]:
        logger.error('performs Transfer Jobs .\n\n   Usage: '
                     'wsrunner_defaultTransfer.py runner-environment')
        exit('performs Transfer Jobs .\n\n   '
             'Usage: wsrunner_defaultTransfer.py runner-environment')

    # Parsing Arguments Passed
    runner_env = sys.argv[1].split('+')
    mediator_host = runner_env[0]
    skey = runner_env[1]
    job_id = runner_env[2]

    logger.info('mediator_host: {}'.format(str(mediator_host)))
    logger.info('skey: {}'.format(str(skey)))
    logger.info('job_id: {}'.format(str(job_id)))

    # Create a Mediator Client
    medclient = MediatorHttpClientV1(mediator_host, skey)
    # Get the Job Description
    job = medclient.get_job(job_id)
    # Parse the Job Description for the Job Properties
    props = job['Job']['Description']['Properties']
    logger.debug('Job Properties: ' + json.dumps(props, indent=2, sort_keys=True))
    # Inherit the Logging Level from the Job Description Properties
    logger.info('Checking Job Description for Log Level...')
    job_log_level = props.get('LogLevel')
    logger.info("Job Log Level: {}".format(str(job_log_level)))
    if job_log_level is not None:
        logger.info('Log Level Inherited from Job Description')
        logger.setLevel(logging.getLevelName(job_log_level))
    else:
        logger.info('No Change to Current Log Level')

    # -----------------------------
    # Gather Transfer Data
    # -----------------------------
    logger.info('\nGather Transfer Data\n')
    try:
        # Convert the Job Properties into a formatted JSON string
        transfer_job_formatted = json.dumps(props, indent=2, sort_keys=True)
        # Convert the JSON string to a Python JSON object
        transfer_job_json = json.loads(transfer_job_formatted)
        
        # Get the Material ID
        mat_id = transfer_job_json['matId']
        logger.info('Source Material ID: {}'.format(mat_id))
        '''
        Since our track definitions for audio tracks are updated for external audio sources,
        the Material must be saved manually with this information. Default behavior is to 
        save the track files with the video source for all tracks.
        '''
        # Use the transfer job description Material object as a base
        material = transfer_job_json['Material']
        # Set the Material track to the transfer job destination track definition
        material['Material']['Track'].append(transfer_job_json['DstTrack']['Track'])

        # -----------------------------
        # WAV Source Media
        # -----------------------------
        # Search the Material Tracks for the WAV Source Media
        material_tracks = medclient.material_get(mat_id, ['tracks'])
        '''
        Audio tracks are sourced from the WAV medias. We need to determine
        what the name of the WAV medias are in order to source the 
        transfer appropriately.
        '''
        for track in material_tracks['Material']['Track']:
            if "_WAV" in track['MediaName']:
                wav_source_track = track
                wav_source_media = track['MediaName']
        if wav_source_media is None:
            logger.info('No WAV Source Media Found')
            #TODO Throw an Exception?

        # -----------------------------
        # Destination Media Data
        # -----------------------------

        # Get the Destination Tracks
        dest_tracks = transfer_job_json['DstTrack']['Track']['TrackDefinition']
        # Get the Transfer Media Info (Used to get Destination and Source Media)
        transfer_source = transfer_job_json['TransferSources']['TransferSource'][0]
        # Searching Transfer Job for Destination Media...
        dest_media = transfer_source['TransferRoute']['DestinationNode']
        # Searching Transfer Job for Destination Access Provider...
        dest_media_access = transfer_source['TransferRoute']['DestinationAccessProvider']
        # Get the Access Provider details
        dst_provider = MediaAccessProviderFactory.get_provider_by_name(medclient, dest_media_access) 

        logger.info('Destination Media: {}'.format(dest_media))
        logger.info('Destination Access Provider: {}'.format(dest_media_access))

        # -----------------------------
        # WAV Source Access Provider
        # -----------------------------

        # Get the Access Provider for the WAV Source Media
        media_routes = medclient.wscall({ "Subsystem": "request", "Method": "getRoutes" })
        # Searching Media Routes for WAV Source Access Provider...
        for route in media_routes['TransferRouteList']['TransferRoute']:
            if wav_source_media == route['SourceNode']:
                if dest_media == route['DestinationNode']:
                    if route.get('SourceAccessProvider', None) is not None:
                        wav_source_media_access = route.get('SourceAccessProvider', None)

        logger.info('WAV Source Media: {}'.format(wav_source_media))
        logger.info('WAV Source Access Provider: {}'.format(wav_source_media_access))

        # -----------------------------
        # Required Track Definitions
        # -----------------------------

        # Get the Required Track Defs (List)
        required_track_defs = transfer_source['TransferDetailsList'][0]['TransferringTrackTypes']
        
        # Variables used to handle transfer logic
        add_to_existing = transfer_job_json['AddingDefsToExisting']

        '''
        The required tracks to transfer are found in the job description. We iterate over this list of
        track definitions to find the Audio tracks. We then set the source media and provider of the
        audio tracks to the WAV media information we gathered earlier.
        
        Finally some logic is implemented to determine if we need to delete the destination path/file
        or even transfer the files at all.
        '''
        for track_def in required_track_defs:
            logger.info(' ')
            # Determine the Source Media Information
            source_track_def = track_def
            if track_def['TrackType']['ClassId'] == 'AUDIO':
                source_media = wav_source_media
                source_media_access = wav_source_media_access
                # The source track definition list is updated to be the wav track definition list
                source_track_def = [wav_td for wav_td in wav_source_track['TrackDefinition'] if wav_td['TrackTypeName'] == track_def['TrackTypeName']][0]
            else:
                source_media = transfer_source['TransferSourceNode']['MediaName']
                source_media_access = transfer_source['TransferRoute']['SourceAccessProvider']
            
            logger.info('Source Media: {}'.format(source_media))
            logger.info('Source Access Provider: {}'.format(source_media_access))

            # Get the Source Access Provider details
            src_provider = MediaAccessProviderFactory.get_provider_by_name(medclient, source_media_access) 
            # Create the paths using the Media Access Providers and the Track Files.
            src_path = file_utils.path_join(src_provider.path, source_track_def['TrackFile'].get('Path', ''))
            src_file = source_track_def['TrackFile'].get('Name', '')
            # Set Destination path from the provider path
            dst_path = file_utils.path_join(dst_provider.path, source_track_def['TrackFile'].get('Path', ''))
            dst_file = source_track_def['TrackFile'].get('Name', '')
             
            logger.info("Source Path: [{}] \n Source File: [{}]".format(src_path, src_file))
            logger.info("Destination Path: [{}] \n Destination File: [{}]".format(dst_path, dst_file))
        
            logger.info('\nTransferring Track Type: {}\n'.format(track_def['TrackTypeName']))
            '''
            The actual file transfer depends on the destination track definitions. 
            The script will loop through the destination tracks to determine the following:
                - Are we adding track definitions to an existing track?
                - Does the path exist on the destination media?
                    - We may want to remove the path
                - Does the file exist on the destination media?
                    - We will need to remove existing files that aren't defined 
                      in the destination track definition before any transfer
                - Is a transfer required?
                    - Certain track types won't need a file transfer (i.e. MOS)
            '''
            # Assume a transfer is required for each required track
            transfer_required = True
            track_update_required = True
            remove_path_required = False
            remove_file_required = False

            # Start the SSH Transfer
            ssh = dst_provider.open_connection()

            if ssh is not None:
                # Setup the SSH Copy and start that thread.
                ssh_copy = SSHCopy(ssh)

                # Check if we are adding track definitions to existing tracks
                if add_to_existing is True:
                    for dest_track_def in dest_tracks:
                        # If the Track File exists on the destination, then no need to transfer
                        if source_track_def['TrackFile']['Id'] == dest_track_def['TrackFile']['Id']:
                            # Track File already exists on destination
                            transfer_required = False
                        if source_track_def['TrackTypeId'] == dest_track_def['TrackTypeId']:
                            # Track Definition already exists on destination
                            track_update_required = False
                        if dest_track_def['Position'] > track_index:
                            track_index = dest_track_def['Position']
                else: 
                    # Check if the Destination Path Exists
                    if track_index is 0:
                        logger.info('This is the first track, remove the directory if it exists already.')
                        if ssh_copy.check_file_exists(dst_path) is True:
                            # Remove Path
                            remove_path_required = True

                # Do we need to transfer anything?
                if transfer_required is True:
                    # Do we need to remove a path before we transfer?
                    if remove_path_required is True:
                        # Remove the destination path
                        logger.info('Deleting Path Before Proceeding...')
                        ssh_copy.delete_file(dst_path)
                            
                    # Do we need to remove a file before we transfer?
                    if ssh_copy.check_file_exists(dst_path + dst_file) is True:
                        # Remove the destination file                    
                        logger.info('Deleting File Before Proceeding...')
                        ssh_copy.delete_file(dst_path + dst_file)
                        if ssh_copy.check_file_exists(dst_path + dst_file) is True:
                            raise IOError('Failed to Delete File on Destination')
                        
                    # Begin Transfer
                    ssh_copy.setup_ssh_copy(src_path, src_file, dst_path, dst_file)
                    ssh_copy.start()
                    ssh_copy.poll_for_progress(update_job_progress)
                    ssh_copy.join()
            else:
                logger.info('SSH is not defined')

            # Validate the file transfer was successful
            if ssh_copy.check_file_exists(dst_path + dst_file) is False:
                logger.info('File transfer failed to copy file to destination media')
                logger.info('Failing transfer...')
                raise IOError('Failed to Transfer File to Destination Media')

            # Update the List of Files Transferred
            files_transferred.append(dst_path + dst_file)

            # Update the Material object with the new tracks being transferred.
            if track_update_required is True:
                logger.info('\n    Track Index: {}'.format(track_index))
                source_track_def['Position'] = track_index + 1
                source_track_def['FilePosition'] = track_index
                material['Material']['Track'][-1]['TrackDefinition'].append(source_track_def)
                track_index += 1

        # Validate all files exist on the destination media
        logger.info('\nConfirm all files have successfully transferred to the destination media...\n')
        for files in files_transferred:
            if ssh_copy.check_file_exists(files) is False:
                raise IOError('Failed to Transfer File to Destination Media')

        logger.info('\nAll Files exist on Destination Media\n')
            
        # Material save the Material object manually (which uses external audio sources)
        medclient.material_save(material)

        return 0

    except Exception as e:
        logger.exception(e)
        return 1
        
    except IOError as e:
        logger.exception(e)
        return 1


if __name__ == "__main__":
    returnValue = main()
    print "Script Complete, returning with value", returnValue
    sys.exit(returnValue)
