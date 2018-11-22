#!/usr/bin/python
__description__ = '''
Created on 17 July 2018
Used to register a track on the avid media in mediator. Should be run as a result of folder monitor setup to watch an
interplayURI which would use a Job Factory to call this script to register a track with the track.file_id set
to the mob_id of the file that was found in interplay.

@author: Jeff Kalbfleisch
'''
import sys
import json
import random
import logging
import argparse
import collections
from evertz.mediator.access.provider_factory import MediaAccessProviderFactory, MediaAccessProviderFunction
from evertz.mediator.webservice.http_client import MediatorWSHTTPClient
from evertz.avid.assets_simple_client import Assets
from evertz.mediator.job.job_updater import JobUpdater

FORMAT = "[%(threadName)-12.12s] - [%(name)s]:%(lineno)s - %(funcName)20s() [%(levelname)-5.5s]] %(message)s"
logging.basicConfig(level=logging.INFO, format=FORMAT)
logger = logging.getLogger()
med_client = None
job_updater = None
job_id = ''
job_progress = 0

def get_attribute(attributes, attr_key):
    for attribute in attributes:
        if attribute.get('@Name') == attr_key:
            return attribute.get('#text')
    return

def get_material_json(save_mat_params):
    mat_id = save_mat_params.get("MAT_ID", '')
    media_name = save_mat_params.get("MEDIA", '')
    tds = save_mat_params.get("TDS", '')
    mob_id = save_mat_params.get("MOB_ID", '')
    frame_rate = save_mat_params.get("FRAME_RATE", '')
    duration = save_mat_params.get("DURATION", '')
    incode = save_mat_params.get("INCODE", '')
    outcode = save_mat_params.get("OUTCODE", '')
    state_machine = save_mat_params.get("STATE_MACHINE", '')
    file_format = save_mat_params.get("FILE_FORMAT", '')

    track_definitions = []
    track_type_links = []

    for td_pair in tds:
        [td, track_type_name] = td_pair
        td_name = mat_id + "_" + td + "." + file_format
        td_path = mat_id + ".dir"
        bytes = random.randint(5000, 10000)
        td_dict = {"TrackTypeName": track_type_name,
                                    "TrackFile": {
                                    "Name": td_name,
                                    "Path": td_path,
                                    "FileFormatName": file_format,
                                    "Bytes": bytes
                  },
                  "Position": 1,
                  "FilePosition": 0,
                  "Channels": 1,
                  "ScanType": "Interlaced_Lower"
                  }
        track_definitions.append(td_dict)

        track_type_dict = {"TrackTypeName": track_type_name,
                           "StateName": "Ready",
                           "StateMachine": state_machine}
        track_type_links.append(track_type_dict)

    title = "AVID MATERIAL " + mat_id
    logger.debug("file_format [" + file_format + "] DURATION [" + duration + "]")
    material = {
              "Material": {
                "MatId": mat_id,
                "Title": title,
                "Duration": {
                  "Time": duration,
                  "Rate": frame_rate
                },
                "FrameRate": frame_rate,
                "MaterialType": "Programme",
                "AspectRatio": "16:9",
                "Owner": [
                  {
                    "Name": "Default"
                  }
                ],
                "TrackTypeLink": track_type_links,
                "Track": [
                  {
                    "TrackFile": {
                      "Name": mat_id + ".aaf",
                      "Path": mat_id + ".dir",
                      "FileFormatName": file_format,
                      "Bytes": bytes
                    },
                    "FileId": str(mob_id),
                    "Incode": {
                      "Text": incode,
                      "Rate": frame_rate
                    },
                    "Outcode": {
                      "Text": outcode,
                      "Rate": frame_rate
                    },
                    "FrameRate": frame_rate,
                    "Encoded": True,
                    "MediaName": media_name,
                    "FileExtension": file_format,
                    "FilePath": mat_id + ".dir",
                    "TrackDefinition": track_definitions
                  }
                ]
              }
            }
    logger.debug("Material : " + json.dumps(material))
    return material

def main():
    global med_client
    global job_updater
    global job_id

    runner_env = sys.argv[1].split('+')
    mediator_host = runner_env[0]
    skey = runner_env[1]
    job_id = runner_env[2]

    parser = argparse.ArgumentParser(prog='wsrunner_avid_media_track_register', description=__description__)
    parser.add_argument('--media', metavar='AVID_BRAVO', help='Name of the media to register the track to')
    parser.add_argument('--media_access_provider', metavar='AvidBRAVOMap', help='Media Access Provider, for connection details.')
    args, unknown = parser.parse_known_args()

    if args.media is not None:
        logger.debug('PARAM - media : ' + str(args.media))
    if args.media_access_provider is not None:
        logger.debug('PARAM - media_access_provider : ' + str(args.media_access_provider))

    logger.debug('job id = ' + str(job_id))

    med_client = MediatorWSHTTPClient(mediator_host, skey)
    job_updater = JobUpdater(med_client)
    job_updater.start()

    logger.debug('getting job description')
    job = med_client.job.get_job(job_id)

    job_updater.update_job(job_id, 'JOB__PROGRESS', 50)
    logger.info("job = " + str(job))
    props = job['Job']['Description']['Properties']
    logger.info("job['Job']['Description']['Properties'] = " + str(props))

    text = props.get('Files').get('TextList').get('Text')
    logger.debug("TEXT = " + str(text))
    mob_id = text[0].get('Value')
    path = props.get('Path')
    identifier = props.get('Identifier')
    message_id = props.get('MessageId')
    trigger_host = props.get('triggerHost')
    media = args.media
    media_access_provider_name = args.media_access_provider
    media_access_provider = MediaAccessProviderFactory.get_provider_by_name(med_client, str(media_access_provider_name))

    workgroup = media_access_provider.workgroup
    interplay_uri = "interplay://" + str(workgroup) + "?mobid=" + str(mob_id)
    interplay_uris = {'typ:InterplayURI': interplay_uri}
    assets_simple_client = Assets(media_access_provider.host_name, media_access_provider.port, media_access_provider.authentication.user_name, media_access_provider.authentication.password)

    get_attributes_result = assets_simple_client.get_attributes(interplay_uris)

    attributes = get_attributes_result.get('Results').get('AssetDescription').get('Attributes').get('Attribute')
    display_name = get_attribute(attributes, "Display Name")
    duration = get_attribute(attributes, "Duration")
    avid_asset_type = get_attribute(attributes, "Type")

    material_to_make = display_name.replace(r'[^0-9a-zA-Z]', '_')
    material_to_make = material_to_make.replace(r' ', '_')

    logger.info("MOB_ID = " + str(mob_id))
    logger.info("PATH = " + str(path))
    logger.info("IDENTIFIER = " + str(identifier))
    logger.info("MESSAGE_ID = " + str(message_id))
    logger.info("TRIGGER_HOST = " + str(trigger_host))
    logger.info("MEDIA = " + str(media))
    logger.info("Material [" + json.dumps(material_to_make) + "]")

    renderx_client = None
    try:
        track_definitions = [["v1", "Video"], ["a1", "OriginalAudio"]]

        save_material_params = {"MAT_ID": material_to_make,
                                "MEDIA": media,
                                "MOB_ID": str(mob_id),
                                "FRAME_RATE": "DF30",
                                "DURATION": str(get_attribute(attributes, "Duration")),
                                "INCODE": str(get_attribute(attributes, "Start")),
                                "OUTCODE": str(get_attribute(attributes, "End")),
                                "STATE_MACHINE": "Ingest",
                                "FILE_FORMAT": "MXF",
                                "TDS": track_definitions}

        material_json = get_material_json(save_material_params)
        material_save_result = med_client.material.save(material_json)

        return 0
    except:
        logger.exception("Caught exception:")
        return 1

if __name__ == "__main__":
    returnValue = main()
    job_updater.terminate()
    print "script complete, returning with value", returnValue
    sys.exit(returnValue)
