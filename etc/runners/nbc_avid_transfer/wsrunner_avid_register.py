#!/usr/bin/python
__description__ = '''
Created on 25 May 2017
Works with ipws.checkInAAF Register OP1Atom using an AAF file into the Interplay Access Database
Should run as a post process job when transferring files from mediator to avid.
This is the script that will base64 encode the aaf file made by the renderX pass
it to ipws.checkInAAF and set attributes. (Right now just mediator_mat_id)
@author: Jeff Kalbfleisch
'''
import os
import sys
import collections
import json
import hashlib
from evertz.mediator.webservice.http_client import MediatorWSHTTPClient
from evertz.mediator.job.job_updater import JobUpdater
from evertz.mediator.access.provider_factory import MediaAccessProviderFactory, MediaAccessProviderFunction
from evertz.mediator.access.s3_access_provider import S3MediaAccessProvider
from evertz.mediator.access.avid_access_provider import AvidMediaAccessProvider
from evertz.utils.file_utils import FileUtils

import shutil
import stat
from time import sleep
import logging
import base64

# Set up the logging that all transfer objects will inherit
FORMAT = "[%(threadName)-12.12s] - [%(name)s]:%(lineno)s - %(funcName)20s() [%(levelname)-5.5s]] %(message)s"
logging.basicConfig(level=logging.INFO, format=FORMAT)
logger = logging.getLogger()

def get_transfer_provider_for_media(medclient, media_name, provider_type):
    media_access_providers = MediaAccessProviderFactory.get_providers_for_media(medclient,
                                                                                media_name,
                                                                                MediaAccessProviderFunction.Transfer)
    for media_access_provider in media_access_providers:
        if isinstance(media_access_provider, provider_type):
            return media_access_provider


def set_attribute(avid_access_provider, mob_id, attribute_name, attribute_value):
    assets_client = avid_access_provider.get_assets_client()
    logger.info("UserName : " + str(avid_access_provider.authentication.user_name))
    logger.info("Password : " + str(avid_access_provider.authentication.password))
    ipws_attributes = []
    value_collection = collections.OrderedDict()
    value_collection["@Group"] = "USER"
    value_collection["@Name"] = attribute_name
    value_collection["#text"] = attribute_value
    ipws_attributes.append(value_collection)

    soap_call_attributes = {"typ:Attribute": ipws_attributes}

    ingest_uri = "interplay://" + str(avid_access_provider.workgroup) + str(avid_access_provider.interplay_uri)
    clip_to_modify = ingest_uri + "/" + str(mob_id)
    interplay_uri = {"typ:InterplayURI": clip_to_modify}
    interplay_uris = [interplay_uri]

    logger.info("InterplayUris [" + json.dumps(interplay_uris) + "]")
    logger.info("Attributes [" + json.dumps(ipws_attributes) + "]")
    response = assets_client.set_attributes(interplay_uris, soap_call_attributes)

    logger.info("SET ATTR RESPONSE")
    logger.info(response)


def main():
    runner_env = sys.argv[1].split('+')
    mediator_host = runner_env[0]
    session_key = runner_env[1]
    job_id = runner_env[2]
    medclient = MediatorWSHTTPClient(mediator_host, session_key)
    file_utils = FileUtils()
    job_updater = JobUpdater(medclient)
    job_updater.start()
    job = medclient.job.get_job(job_id)

    logger.debug("job_id = [" + str(job_id) + "]")
    logger.info("job = [" + str(job) + "]")

    props = job.get('Job').get('Description').get('Properties')

    logger.info("job['Job']['Description']['Properties'] = " + str(props))
    domain_key = props.get("domainKey")
    track = props.get("Track").get("Track")
    request = props.get("Request").get("Request")
    transfer = props.get("Transfer").get("Transfer")
    mat_id = request.get("MatId")
    media_name = track.get("MediaName")
    source_media_name = transfer.get("Source")
    source_id = transfer.get("Id")
    file_id = track.get("FileId")

    try:
        avid_access_provider = get_transfer_provider_for_media(medclient, media_name, AvidMediaAccessProvider)
        cloudian_access_provider = get_transfer_provider_for_media(medclient, source_media_name, S3MediaAccessProvider)
        cloudian_access_provider._connect()

        logger.debug("Media Access Provider")
        logger.debug(avid_access_provider)

        job_updater.update_job(job_id, 'JOB__PROGRESS', 50)
        interplay_path = ""
        track_file = track.get("TrackFile")
        options = ["tracks"]

        material_command = {
            "Subsystem": "material",
            "Method": "get",
            "ParameterList": {
                  "matId": mat_id,
                  "options": {
                        "MaterialOptions": {
                        "Option": ["tracks"]
                        }
                  },
                  "mediaName": source_media_name,
                  "fileId": file_id
               }
            }
        material = medclient.wscall(material_command)
        track = material.get('Material').get('Track')
        track_definition = track[0].get('TrackDefinition')
        track_file = None

        for td in track_definition:
            track_type = td.get('TrackType').get('ClassId')
            if track_type == 'VIDEO':
                track_file = td.get('TrackFile')

        path = track_file.get('Path')
        name = track_file.get('Name')
        file_path = os.path.join(track_file.get('Path'), track_file.get('Name'))
        logger.info("Track File Path [" + str(file_path) + "]")

        aaf_path = file_path.replace('.mov', '.aaf')
        response = cloudian_access_provider.s3_client.get_object(Bucket=cloudian_access_provider.s3_bucketname, Key=aaf_path)
        streaming_body = response['Body']
        encoded_aaf = base64.b64encode(streaming_body.read())

        logger.info("Track File Path [" + str(file_path) + "]")
        logger.info("AAF Path [" + str(aaf_path) + "]")

        # Some logic here for deciding the Interplay Path that the assets should be regsitered against
        interplay_uri = "interplay://" + avid_access_provider.workgroup + avid_access_provider.interplay_uri
        logger.debug("Calling check_in_aaf: path=[" + str(aaf_path) + "] interplay_uri=[" + str(interplay_uri) + "]")
        assets_client = avid_access_provider.get_assets_client()
        check_in_aff_response = assets_client.check_in_aaf(interplay_uri, encoded_aaf)
        mob_id = check_in_aff_response.get("InterplayURI").split("=")[1]
        logger.debug("[" + str(job_id) + "] JOB__TRACK.FileId = " + mob_id)
        job_track_dict = {"FileId": mob_id}
        job_track = {'Track': job_track_dict }
        logger.debug("Track = " + json.dumps(job_track))
        set_attribute(avid_access_provider, mob_id, "MEDIATOR_MAT_ID", mat_id)
        #cloudian_access_provider.s3_client.delete_object(Bucket=cloudian_access_provider.s3_bucketname, Key=aaf_path)
        #job_updater.update_job(job_id, 'JOB__TRACK', job_track)
        #job_updater.update_job(job_id, 'JOB__PROGRESS', 100)
        #job_updater.update_job(job_id, 'JOB__STATUS', 'Complete')
        status='Complete'
        medclient.job.update_progress(job_id, 100)
        medclient.job.update_status_map(job_id, {'JOB__TRACK': job_track})
        medclient.job.update_status_map(job_id, {'JOB__STATUS': 'Register Job Status [{0}]'.format(status)})
    except Exception, e:
        logger.exception(e)
        medclient.job.update_status_map(job_id, {'JOB__ERROR': str(e)})
        job_updater.terminate()
        return 1
    finally:
        job_updater.terminate()
        return 0


if __name__ == "__main__":
    returnValue = main()
    print "script complete, returning with value ", returnValue
    sys.exit(returnValue)
