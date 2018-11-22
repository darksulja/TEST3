#!/usr/bin/python
'''
Created on 5 Jan 2016
Uses TrackFiles
Uses MediaAccessProvider Default Media Provider Means Use Paths
Works with S3, Diva, Glacier, FTP and LocalMedia
@author: Akshay Kumar, John East
'''
import sys
import os
from evertz.mediator.ws import MediatorHttpClientV1
import shutil
import stat
from time import sleep
import logging
from evertz.mediator.transfer.base_transfer import TransferState, TransferJobDescription
from evertz.mediator.domain.media import Media
from transfer_factory import TransferFactory
from access.provider_factory import MediaAccessProviderFactory, MediaAccessProviderFunction
from evertz.mediator.job.job_updater import JobUpdater, JobStatusUpdate

# Set up the logging that all transfer objects will inherit
FORMAT = "[%(threadName)-12.12s] - [%(name)s]:%(lineno)s - %(funcName)20s() [%(levelname)-5.5s]] %(message)s"
logging.basicConfig(level=logging.DEBUG, format=FORMAT)
logger = logging.getLogger("default_transfer")

medclient = None
transfer_list = []
job_progress = 0
job_id = ''
# When test mode = true Transfer objects will be created and progress will be updated, but no transfers will occur
test_mode = False
job_updater = None


def update_job_progress(progress):
    global job_progress

    if progress != job_progress:
        job_progress = progress
        job_updater.update_job(job_id, 'JOB__PROGRESS', job_progress)


def progress_callback(transfer, progress):
    # A transfer has changed the progress. Work out the overall progress
    overall_progress = 0
    for transfer in transfer_list:
        overall_progress += transfer.progress
    update_job_progress(overall_progress / len(transfer_list))


def complete_callback(transfer):
    pass


def fail_callback(transfer, error_msg):
    pass


def main():
    global medclient
    global job_id
    global test_mode
    global transfer_list
    global job_updater

    logger.info('setting variables')

    logger.info('validating arguments')
    if len(sys.argv) < 2 or '+' not in sys.argv[1]:
        logger.error('performs Transfer Jobs .\n\n   Usage: '
                     'wsrunner_defaultTransfer.py runner-environment [testmode]')
        exit('performs Transfer Jobs .\n\n   '
             'Usage: wsrunner_defaultTransfer.py runner-environment [testmode]')

    logger.info('reading mediator_host skey and jobid from arguments')

    runner_env = sys.argv[1].split('+')
    if len(sys.argv) > 2:
        test_mode = sys.argv[2] == 'testmode'

    if test_mode is True:
        logger.info("Running in testmode")
    logger.info("runner_env ")
    logger.info(runner_env)
    mediator_host = runner_env[0]
    skey = runner_env[1]
    job_id = runner_env[2]
    logger.info('job id = ' + str(job_id))

    logger.info('create mediator client')
    medclient = MediatorHttpClientV1(mediator_host, skey)
    job_updater = JobUpdater(medclient)

    # Testing code. Do the log in and get job by coord id
#    medclient.login('admin', 'admin', '')
#    cmd = {"Subsystem": "job", "Method": "getJob", "ParameterList": {"coordinationId": int(job_id)}}
#    job = medclient.wscall(cmd)

    logger.info('getting job description')
    job = medclient.get_job(job_id)

    props = job['Job']['Description']['Properties']
    logger.info("job['Job']['Description']['Properties'] = " + str(props))

    # Check the job description for a logging level and apply it if it is set
    job_log_level = props.get('LogLevel')
    logger.info("JOB LOG LEVEL = " + str(job_log_level))

    if job_log_level is not None:
        logger.setLevel(logging.getLevelName(job_log_level))

    logger.debug('extracting properties from job description')
    transfer_job_desc = TransferJobDescription(props)

    try:
        # Get the access provider for the destination media
        dst_node_access_providers = MediaAccessProviderFactory.get_providers_for_media(medclient, transfer_job_desc.transfer_destination_node.media_name,
                                                                                       MediaAccessProviderFunction.Transfer)

        #Add a media to all src_tracks. so you can use src_track.media in the transfer route scripts.
        for transfer_source in transfer_job_desc.transfer_sources:
            for transfer_detail in transfer_source.transfer_details:
                transfer_detail.source_track.media = Media(medclient.generic_call("media", "get", media={"Media": {"Name": transfer_detail.source_track.media_name}})["Media"])

        # Add a media to the dst track so you can use dst_track.media in the transfer route scripts
        transfer_job_desc.dst_track.media = Media(medclient.generic_call("media", "get", media={"Media": {"Name": transfer_job_desc.dst_track.media_name}})["Media"])

        # Go through each transfer source for this job and create the necessary transfer objects based on the
        # source and destination media access providers
        for transfer_source in transfer_job_desc.transfer_sources:
            logger.debug(transfer_source)

            # Does the route specify a destination access provider?
            if transfer_source.transfer_route.destination_access_provider_name is None:
                # No it doesn't, use the ones configured against the media
                dst_access_providers = dst_node_access_providers
            else:
                # The route specifies a destination access provider, use that one
                logger.info("Route configured with destination access provider [" + transfer_source.transfer_route.destination_access_provider_name + "]")
                dst_access_providers = []
                dst_provider = MediaAccessProviderFactory.get_provider_by_name(medclient, transfer_source.transfer_route.destination_access_provider_name)
                if dst_provider is not None:
                    dst_access_providers.append(dst_provider)

            # Get the source media access provider
            src_access_providers = []
            if transfer_source.transfer_route.source_access_provider_name is None:
                src_access_providers = MediaAccessProviderFactory.get_providers_for_media(medclient, transfer_source.transfer_node.media_name,
                                                                                          MediaAccessProviderFunction.Transfer)
            else:
                # The route specifies which source access provider to use, filter out all others
                logger.info("Route configured with source access provider [" + transfer_source.transfer_route.source_access_provider_name + "]")
                src_provider = MediaAccessProviderFactory.get_provider_by_name(medclient, transfer_source.transfer_route.source_access_provider_name)
                if src_provider is not None:
                    src_access_providers.append(src_provider)

            # For this transfer source we now have all the source and destination media access providers.
            # Find the type of transfer that will be performed and the media access providers that will be used
            logger.debug("Sources=" + str(src_access_providers))
            logger.debug("Destinations=" + str(dst_access_providers))

            transfer_class_tuple = TransferFactory.get_transfer_class(src_access_providers, dst_access_providers)
            if transfer_class_tuple is None:
                logger.error("No compatible transfer object found. Src=" + transfer_source.transfer_node.media_name + " Dst=" + transfer_job_desc.transfer_destination_node.media_name)
                return 1

            transfer_class = transfer_class_tuple[0]
            transfer_source_provider = transfer_class_tuple[1]
            transfer_destination_provider = transfer_class_tuple[2]
            transfer_creator = transfer_class.get_transfer_creator(transfer_job_desc.transfer_destination_node, transfer_source.transfer_node)
            transfer_list = transfer_creator.create_transfers(transfer_source_provider, transfer_destination_provider, transfer_source, transfer_job_desc)
            logger.info("Number of transfers to perform: " + str(len(transfer_list)))

        # Attach the callback functions to each transfer
        for transfer in transfer_list:
            transfer.progress_callback = progress_callback
            transfer.wait_for_src_files_ready()

        job_updater.start()
        try:
            # Run each transfer and wait for all transfers to finish
            failed = False
            for transfer in transfer_list:
                if failed is False:
                    # start the transfer and wait for it to finish
                    transfer.start()
                    transfer.join()
                    if transfer.state == TransferState.failed:
                        failed = True
                else:
                    transfer.cancel()
        finally:
            job_updater.terminate()

        # TODO Now update the job exit status with any file sizes and checksums generated.
        return 1 if failed is True else 0
    except Exception, e:
        logger.exception(e)
        return 1


def on_rm_error(func, path, exc_info):
    # path contains the path of the file that couldn't be removed
    # let's just assume that it's read-only and unlink it.
    os.chmod(path, stat.S_IWRITE)
    sleep(30)
    shutil.rmtree(path)

if __name__ == "__main__":
    returnValue = main()
    print "script complete, returning with value", returnValue
    sys.exit(returnValue)
