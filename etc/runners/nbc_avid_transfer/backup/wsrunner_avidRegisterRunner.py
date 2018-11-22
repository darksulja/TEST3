#!/usr/bin/python
import sys
import json
import random
import logging
import collections
from evertz.renderx.render_x_rest_client import RenderXRestClient, RecordEvent, Stream, AudioConfig, ClipEvent, Config, Timeline, zero_frame_label
from evertz.mediator.webservice.http_client import MediatorWSHTTPClient
from evertz.renderx.output_definitions import output_definitions, profiles, base_standards
from evertz.mediator.job.job_updater import JobUpdater
FORMAT = "[%(threadName)-12.12s] - [%(name)s]:%(lineno)s - %(funcName)20s() [%(levelname)-5.5s]] %(message)s"
logging.basicConfig(level=logging.DEBUG, format=FORMAT)
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

    track_definitions = []
    track_type_links = []

    for td_pair in tds:
        [td, track_type_name] = td_pair
        td_name = mat_id + "_" + td + ".MXF"
        td_path = mat_id + ".dir"
        bytes = random.randint(5000, 10000)
        td_dict = {"TrackTypeName": track_type_name,
                                    "TrackFile": {
                                    "Name": td_name,
                                    "Path": td_path,
                                    "FileFormatName": "MXF",
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
                           "StateMachine": "Default state machine"}
        track_type_links.append(track_type_dict)


    bytes = random.randint(5000, 10000)
    dur_hours = random.randint(1, 10)
    dur_mins = random.randint(1, 59)
    dur_secs = random.randint(1, 59)

    duration = "01:" + str(dur_mins).zfill(2) + ":" + str(dur_secs).zfill(2) + ":00"
    duration = "01:00:05;00"
    file_format = "MXF"
    title = "AVID MATERIAL " + mat_id
    logger.info("file_format [" + file_format + "] DURATION [" + duration + "]")
    material = {
              "Material": {
                "MatId": mat_id,
                "Title": title,
                "Duration": {
                  "Time": duration,
                  "Rate": "NDF25"
                },
                "FrameRate": "NDF25",
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
                      "FileFormatName": "MXF",
                      "Bytes": bytes
                    },
                    "FileId": str(mob_id),
                    "Incode": {
                      "Text": "00:00:00:00",
                      "Rate": "NDF25"
                    },
                    "Outcode": {
                      "Text": duration,
                      "Rate": "NDF25"
                    },
                    "FrameRate": "NDF25",
                    "Encoded": True,
                    "MediaName": media_name,
                    "FileExtension": "MXF",
                    "FilePath": mat_id + ".dir",
                    "TrackDefinition": track_definitions
                  }
                ]
              }
            }
    logger.info("Material : " + json.dumps(material))
    return material

def main():
    global med_client
    global job_updater
    global job_id

    runner_env = sys.argv[1].split('+')
    mediator_host = runner_env[0]
    skey = runner_env[1]
    job_id = runner_env[2]

    logger.info('job id = ' + str(job_id))

    med_client = MediatorWSHTTPClient(mediator_host, skey)
    job_updater = JobUpdater(med_client)
    job_updater.start()

    logger.info('getting job description')
    job = med_client.job.get_job(job_id)

    logger.info("job = " + str(job))
    props = job['Job']['Description']['Properties']
    logger.info("job['Job']['Description']['Properties'] = " + str(props))

    text = props.get('Files').get('TextList').get('Text')
    logger.info("TEXT = " + str(text))
    mob_id = text[0].get('Value')
    path = props.get('Path')
    identifier = props.get('Identifier')
    message_id = props.get('MessageId')
    trigger_host = props.get('triggerHost')

    material_to_make = "DEMO_MATERIAL_00005"

    logger.info("MOB_ID = " + str(mob_id))
    logger.info("PATH = " + str(path))
    logger.info("IDENTIFIER = " + str(identifier))
    logger.info("MESSAGE_ID = " + str(message_id))
    logger.info("TRIGGER_HOST = " + str(trigger_host))
    renderx_client = None
    try:
        track_definitions = [["v1", "Video"], ["a1", "OriginalAudio"]]
        save_material_params = {"MAT_ID": material_to_make,
                                "MEDIA": "Avid",
                                "MOB_ID": str(mob_id),
                                "TDS": track_definitions}

        material_json = get_material_json(save_material_params)
        material_save_result = med_client.material.save(material_json)

        logger.info("SAVE RESULT")
        logger.info(material_save_result)
    except:
        logger.exception("Caught exception:")
        return 1
    return 1


if __name__ == "__main__":
    returnValue = main()
    print "script complete, returning with value", returnValue
    sys.exit(returnValue)
