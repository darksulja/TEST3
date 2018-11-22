#!/usr/bin/python
'''
Created on 5 Jan 2017
Creates a Dummy Staging Track With Zero Byte Files
@author: Akshay Kumar, John East, Craig Sloggett, Karthik Rengasamy
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

# Set up the logging that all transfer objects will inherit
logging.basicConfig(level=logging.INFO, format=' %(message)s')
logger = logging.getLogger("dummyNLDStagingTransfer")
# Setup the Job information
medclient = None
job_id = ''
# Declare the FileUtils object used to copy files
file_utils = FileUtils()
# Keep Track of the Track Index
track_index = 0

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

        # -----------------------------
        # Material
        # -----------------------------
        
        # Get the Material ID
        mat_id = transfer_job_json['matId']
        logger.info('Source Material ID: {}'.format(mat_id))
   
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
        if wav_source_track is None:
            logger.info('No WAV Source Track Found')
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
        # Required Track Definitions
        # -----------------------------

        # Get the Required Track Defs (List)
        required_track_defs = transfer_source['TransferDetailsList'][0]['TransferringTrackTypes']
        
        # Variables used to handle transfer logic
        add_to_existing = transfer_job_json['AddingDefsToExisting']

        '''
        The required tracks to transfer are found in the job description. We iterate over this list of
        track definitions and build the Dummy Statiging Track 
        '''
        for track_def in required_track_defs:
             
            if track_def['TrackType']['ClassId'] == 'AUDIO':
                source_track_def = [wav_td for wav_td in wav_source_track['TrackDefinition'] if wav_td['TrackTypeName'] == track_def['TrackTypeName']][0]
            else :
                source_track_def = track_def
            logger.info('Processing Track Type: {}'.format(source_track_def['TrackTypeName']))
            track_update_required = True
            
            # Set Destination path from the provider path
            dst_path = file_utils.path_join(dst_provider.path, source_track_def['TrackFile'].get('Path', ''))
            dst_file = source_track_def['TrackFile'].get('Name', '')
            logger.info("Destination Path: [{}] \n Destination File: [{}]".format(dst_path, dst_file))
            
            if add_to_existing is True:
                for dest_track_def in dest_tracks:
                    if source_track_def['TrackTypeId'] == dest_track_def['TrackTypeId']:
                        # Track Definition already exists on destination
                        track_update_required = False
                    if dest_track_def['Position'] > track_index:
                        track_index = dest_track_def['Position']
            else: 
                # Check if the Destination Path Exists
                if track_index is 0:
                    logger.info('This is the first track')

            source_track_def['Position'] = track_index + 1
            source_track_def['FilePosition'] = track_index
            del source_track_def['Id']
            del source_track_def['TrackFile']['Id']
            material['Material']['Track'][-1]['TrackDefinition'].append(source_track_def)
            track_index += 1

            # Start the SSH Connection
            ssh = dst_provider.open_connection()
             
            if ssh is not None:
                directory_create_command = "mkdir -p %s" % dst_path
                logger.info("Running Create Directory [{0}]".format(directory_create_command))
                stdin, stdout, stderr = ssh.exec_command(directory_create_command)
                # Determine if any error was recieved from running the directory_create_command.
                error_msg = stderr.read().rstrip()
                if error_msg != "":
                    raise Exception("Error received when running directory_create_command [{0}]. [{1}]".format(directory_create_command, error_msg))
                else:
                    logger.info("No error when running directory_create_command [{0}]. [{1}]".format(directory_create_command, stdout.read().rstrip()))

                file_create_command = "touch %s%s" % (dst_path,dst_file)
                logger.info("Running Create File [{0}]".format(file_create_command))
                stdin, stdout, stderr = ssh.exec_command(file_create_command)
                # Determine if any error was recieved from running the file_create_command.
                error_msg = stderr.read().rstrip()
                if error_msg != "":
                    raise Exception("Error received when running file_create_command [{0}]. [{1}]".format(file_create_command, error_msg))
                else:
                    logger.info("No error when running file_create_command [{0}]. [{1}]".format(file_create_command, stdout.read().rstrip()))

                logger.info("Running Create File [{0}]".format(file_create_command))

            else:
                logger.info('SSH is not defined')

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
