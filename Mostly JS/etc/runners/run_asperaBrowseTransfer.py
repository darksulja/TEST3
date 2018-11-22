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
from time import sleep
from evertz.mediator.ws import MediatorHttpClientV1
from evertz.utils.file_utils import FileUtils
from evertz.aspera.aspera_node_api import AsperaNodeRestAPI, RequestTransfer

# Set up the logging that all transfer objects will inherit
logging.basicConfig(level=logging.INFO, format=' %(message)s')
logger = logging.getLogger("asperaBrowseTransfer")

# Setup the Job information
medclient = None
job_id = ''

# Declare the FileUtils object used to copy files
file_utils = FileUtils()

# Keep Track of the Files Transferred
files_transferred = []

# One day this script shouldn't exist and should be part of the defaultMapTransfer.
aspera_details = {
    'port': 9092,
    'src_host': '100.125.141.132',
    'src_user': 'mediator',
    'src_pass': 'ph@r0s1',
    'remote_host': '100.116.86.125',
    'remote_user': 'xfer2',
    'token': 'Basic ZjJEenhhc2Z6a1BuZXNWUV9vOGFDeEpWNmd2UDRTczBPc2NxajMydG94SUE6cGhAcjBzMQ=='
}

src_media_path = '/media/Isilon2/GMO/Mediator/prod-mediator/browse'  # Path relative to the Source Aspera Node
dst_media_path = '/media/nrt/mediator/MediatorX/browse'  # Path relative to the Destination Aspera Node


def update_job_progress(progress):
    medclient.job_update_status_map(job_id, {'JOB__PROGRESS': progress})


def main():
    global medclient
    global job_id
    global files_transferred

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
        # Get the Material ID
        mat_id = props['matId']
        logger.info('Source Material ID: {}'.format(mat_id))
        '''
        Since our track definitions for audio tracks are updated for external audio sources,
        the Material must be saved manually with this information. Default behavior is to
        save the track files with the video source for all tracks.
        '''
        # Use the transfer job description Material object as a base
        material = props['Material']
        # Set the Material track to the transfer job destination track definition
        material['Material']['Track'].append(props['DstTrack']['Track'])
        # -----------------------------
        # Destination Media Data
        # -----------------------------

        # Get the Transfer Media Info (Used to get Destination and Source Media)
        transfer_source = props['TransferSources']['TransferSource'][0]

        # -----------------------------
        # Required Track Definitions
        # -----------------------------
        # Get the Required Track Defs (List)
        required_track_defs = transfer_source['TransferDetailsList'][0]['TransferringTrackTypes']

        '''
        The required tracks to transfer are found in the job description. We iterate over this list of
        track definitions to find the Audio tracks. We then set the source media and provider of the
        audio tracks to the WAV media information we gathered earlier.

        Finally some logic is implemented to determine if we need to delete the destination path/file
        or even transfer the files at all.
        '''
        for track_def in required_track_defs:
            if track_def['TrackTypeName'] == "Video":
                # Determine the Source Media Information
                source_track_def = track_def

                # Create the paths using the Media Access Providers and the Track Files.
                src_path = file_utils.path_join(src_media_path, source_track_def['TrackFile'].get('Path', ''))
                src_file = source_track_def['TrackFile'].get('Name', '')
                # Set Destination path from the provider path
                dst_path = file_utils.path_join(dst_media_path, source_track_def['TrackFile'].get('Path', ''))
                dst_file = source_track_def['TrackFile'].get('Name', '')

                logger.info("Source Path: [{}] \n Source File: [{}]".format(src_path, src_file))
                logger.info("Destination Path: [{}] \n Destination File: [{}]".format(dst_path, dst_file))

                logger.info('\nTransferring Track Type: {}\n'.format(track_def['TrackTypeName']))

                # Aspera Transfer Stuff Goes Here.
                logger.info("Starting Aspera Transfer here.")

                # Setup Source Aspera details.
                aspera_node_api = AsperaNodeRestAPI()
                aspera_node_api.host = aspera_details['src_host']
                aspera_node_api.user = aspera_details['src_user']
                aspera_node_api.password = aspera_details['src_pass']

                if aspera_details['port'] is not None:
                    aspera_node_api.port = aspera_details['port']

                # Setup Remote Aspera details.
                request_transfer_cmd = RequestTransfer()
                request_transfer_cmd.direction = "send"
                request_transfer_cmd.remote_host = aspera_details['remote_host']
                request_transfer_cmd.remote_user = aspera_details['remote_user']
                # NOT REQUIRED request_transfer_cmd.remote_password = aspera_details.remote_pass
                # Token used to authenticate, need to remote user and local/user and pass as well.
                request_transfer_cmd.update_body_param("token", aspera_details['token'])

                # Add the source/dest file details.
                request_transfer_cmd.add_path(src_path + src_file, dst_path + dst_file)

                # Run the Aspera command.
                if aspera_node_api.send_command(request_transfer_cmd):
                    transfer_id = request_transfer_cmd.response['id']
                    logger.info("Aspera Transfer Created [{}]".format(transfer_id))
                    not_terminated = True
                    while not_terminated:
                        transfer_status = aspera_node_api.get_transfer(transfer_id).response_json
                        error_code = transfer_status['error_code']
                        error_desc = transfer_status['error_desc']
                        if error_code == 0 and error_desc == "":
                            if transfer_status.get('precalc') is not None:
                                total_size = float(transfer_status['precalc']['bytes_expected'])
                                bytes_written = float(transfer_status['bytes_written'])
                                bytes_transfered = float(transfer_status['bytes_transferred'])

                                logger.info("Total Size [{}] Bytes Written [{}] Bytes Transferred [{}]"
                                            .format(total_size, bytes_written, bytes_transfered))

                                # Calculate progress based on written/transferred bytes compared to total file size.
                                progress = int((bytes_written / total_size) * 100.0)

                                # Update the job progress and log it out.
                                update_job_progress(progress)
                                logger.info("Transfer Job Progress [{}]".format(progress))

                                # Get the number of files transferred vs. expected.
                                files_completed = transfer_status['files_completed']
                                files_expected = transfer_status['precalc']['files_expected']

                                # Check the progress and file transfer count.
                                if progress == 100 and files_completed == files_expected:
                                    logger.info("Transfer completed with no errors and all files transferred.")
                                    not_terminated = False
                            else:
                                logger.info("Waiting for Aspera to analyze source file(s) and start the transfer.")

                            sleep(10)
                        else:
                            logger.exception("Aspera Transfer job failed with error code [{}] error description [{}]"
                                             .format(error_code, error_desc))
                            return 1
                else:
                    logger.exception("Aspera transfer create failed.")
                    return 1

            else:
                logger.info("Only transferring Video since Browse files will be embedded.")

        # Run file exists check here if possible?
        logger.info('\nAll Files exist on Destination Media\n')

        return 0

    except Exception as e:
        logger.exception(e)
        return 1

    except IOError as e:
        logger.exception(e)
        return 1


if __name__ == "__main__":
    returnValue = main()
    logger.info("Script Complete, returning with value [{}]".format(returnValue))
    sys.exit(returnValue)
