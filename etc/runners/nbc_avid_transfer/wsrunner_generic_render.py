#!/usr/bin/python

__description__ = '''
Created on 17 July 2018
a version of generic render runner that will submit a job to renderX for converting prores/OP1A content into
component OP1Atom files, and an associated MXF path.
uses the Avid Media Access Provider Nexis Path to embed the nexis paths into the aaf file for each of the
OP Atom files.
@author: Jeff Kalbfleisch
'''
import sys
import json
import os
import logging
import collections
import argparse
from evertz.renderx.render_x_rest_client import RenderXRestClient, RecordEvent, Stream, AudioConfig, ClipEvent, Config, Timeline, zero_frame_label
from evertz.mediator.webservice.http_client import MediatorWSHTTPClient
from evertz.renderx.output_definitions import output_definitions, profiles, base_standards
from evertz.mediator.job.job_updater import JobUpdater
from evertz.mediator.access.provider_factory import MediaAccessProviderFactory, MediaAccessProviderFunction
from evertz.mediator.access.avid_access_provider import AvidMediaAccessProvider
from evertz.mediator.access.local_access_provider import LocalMountMediaAccessProvider
from evertz.mediator.access.s3_access_provider import S3MediaAccessProvider
from evertz.utils.file_utils import FileUtils
from evertz.mediator.ws import MediatorException

FORMAT = "[%(threadName)-12.12s] - [%(name)s]:%(lineno)s - %(funcName)20s() [%(levelname)-5.5s]] %(message)s"
logging.basicConfig(level=logging.DEBUG, format=FORMAT)
logger = logging.getLogger()
med_client = None
job_id = ''
job_progress = 0


class AudioClip(object):
    def __init__(self):
        self.streams = None
        self.audio_layout = None
        self.processing = None

    def get_dict(self):
        result = {}
        if self.streams is not None:
            result.update({"streams": self.streams})
        if self.audio_layout is not None:
            result.update({"layout": self.audio_layout})
        if self.processing is not None:
            result.update({"processing": self.processing})
        return result


def get_renderx_connection_details(med_client, apparatus_locator):
    logger.info("Fetching RenderX connection details for Apparatus [{0}]".format(apparatus_locator))
    try:
        # Since apparatus.get doesnt retrieve the full external config, lets get the latest/greatest.
        apparatus = med_client.generic_call(subsystem="apparatus",
                                                method="query",
                                                apparatusLocator={"Locator": apparatus_locator})
    except MediatorException as e:
        raise e

    net_address = None
    if apparatus is None:
        raise Exception("Apparatus [{0}] does not exist")
    elif 'Properties' in apparatus['Apparatus']:
        properties = apparatus['Apparatus']['Properties']
        if 'renderXServiceAddress' in properties:
            net_address = properties['renderXServiceAddress']['NetAddress']
    if net_address is None:
        raise Exception("Unable to retrieve renderXServiceAddress from apparatus [{0}]. Please ensure the configuration is correct.".format(apparatus_locator))
    
    render_x_server_ip = net_address.get('HostName')
    render_x_server_port = net_address.get('Port')
    logger.info("Retrieved connection details from Apparatus IP [{0}] Port [{1}].".format(render_x_server_ip, render_x_server_port))
    return render_x_server_ip, render_x_server_port

def main():
    global med_client
    global job_id

    runner_env = sys.argv[1].split('+')
    mediator_host = runner_env[0]
    skey = runner_env[1]
    job_id = runner_env[2]
    logger.info('job id = ' + str(job_id))

    parser = argparse.ArgumentParser(prog='generic_renderx', description=__description__)
    parser.add_argument('--render_x_apparatus', metavar='AvidRenderX2', help='Apparatus Name of the renderX')
    parser.add_argument('--log_level', default='INFO',
                        choices=['CRITICAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'NOTSET'], metavar='INFO',
                        required=False, help='specify the log level for this application')

    args, unknown = parser.parse_known_args()

    if args.render_x_apparatus is not None:
        logger.info('PARAM - render_x_apparatus : ' + str(args.render_x_apparatus))

    med_client = MediatorWSHTTPClient(mediator_host, skey)
    job_updater = JobUpdater(med_client)
    job_updater.start()

    logger.info('getting job description')
    job = med_client.job.get_job(job_id)

    (renderx_server_ip, renderx_server_port) = get_renderx_connection_details(med_client,args.render_x_apparatus)
    logger.info("RENDER X SERVER IP [" + str(renderx_server_ip) + "]")
    logger.info("RENDER X SERVER PORT [" + str(renderx_server_port) + "]")

    logger.info("job = " + str(job))
    props = job['Job']['Description']['Properties']

    start_job = create_renderx_job(props)

    renderx_client = None
    try:
        renderx_client = RenderXRestClient(renderx_server_ip, renderx_server_port)
        logger.info("Starting Render-X job")
        renderx_job_result = renderx_client.submit_job_and_wait_for_completion(start_job, update_progress)
        med_client.job.update_status_map(job_id, {"StartWorkPayload": json.dumps(start_job)})

        if not renderx_job_result.success:
            raise Exception("Job failed: {0}".format(renderx_job_result.message))
        else:
            logger.info("Job finished -> RenderX Message [" + str(renderx_job_result.message) + "]")
            logger.info("Result [" + str(renderx_job_result) + "]")
    except Exception as e:
        logger.exception("Caught exception:")
        med_client.job.update_status_map(job_id, {'JOB__ERROR': str(e)})
        job_updater.terminate()
        return 1
    finally:
        job_updater.terminate()
        return 0

def update_progress(progress=None, status=None):
    if progress is not None:
        global job_progress

        if progress < 0:
            progress = 0
        if progress > 100:
            progress = 100

        if job_progress != progress:
            logger.debug('progress update: %d', progress)
            job_progress = progress
            med_client.job.update_progress(job_id, progress)

        if status is not None:
            med_client.job.update_status_map(job_id, {'JOB__STATUS': 'RenderX Job Status [{0}]'.format(status)})


def get_transfer_provider_for_media(media_name, provider_type):
    media_access_providers = MediaAccessProviderFactory.get_providers_for_media(med_client,
                                                                                media_name,
                                                                                MediaAccessProviderFunction.Transfer)
    for media_access_provider in media_access_providers:
        if isinstance(media_access_provider, provider_type):
            return media_access_provider 


def create_renderx_job(props):
    logger.info("Creating start job message for generic transcode RenderX job")    

    file_utils = FileUtils()
    transfer_source = props.get("TransferSources").get("TransferSource")[0]
    transfer_details = transfer_source.get("TransferDetailsList")[0]
    transfer_route = transfer_source.get("TransferRoute")
    transfer_source_node = transfer_source.get("TransferSourceNode")

    source_media = transfer_source.get("TransferSourceNode").get("MediaName")
    source_track = transfer_details.get("SourceTrack")
    required_dest_track_defs = props.get("RequiredDestTrackDefs")
    dest_media = props.get("DstTrack").get("Track").get("MediaName")

    request = props.get("Request").get("Request")
    mat_id = request.get("MatId")

    src_access_provider = get_transfer_provider_for_media(source_media, S3MediaAccessProvider)
    dst_access_provider = get_transfer_provider_for_media(dest_media, AvidMediaAccessProvider)

    logger.info("Source Access Provider [" + str(src_access_provider) + "]")
    logger.info("Dest Access Provider [" + str(dst_access_provider) + "]")

    aaf_path = None
    audio_layout = None
    audio_definitions = None
    if 'ParentJobDescription' in props:
        (audio_layout, audio_definitions) = create_audio_layout(props)

    if 'FrameRate' not in props:
        frame_rate = props['Material']['Material']['FrameRate']
        if frame_rate is None:
            raise Exception("Missing parameter from Job description: FrameRate")
    else:
        frame_rate = props["FrameRate"]

    if 'SourceFile' in props and 'DestFile' in props:
        source_file = props['SourceFile']
        output_file = props['DestFile']
    else:
        # source_file = "/srv/storage/P23_98/SF/HD/PRORES/GMO_PR_00000000034_01.dir/GMO_PR_00000000034_01.mov" 
        source_track_file_path = source_track.get('TrackDefinition')[0].get('TrackFile').get('Path').rstrip('\r\n')
        source_track_file_name = source_track.get('TrackDefinition')[0].get('TrackFile').get('Name').rstrip('\r\n')
        file_path = os.path.join(source_track_file_path, source_track_file_name).rstrip('/')
        source_file = "s3://{}/{}".format(src_access_provider.s3_bucketname, file_path).rstrip('/')
        aaf_path = source_file.replace('.mov', '.aaf')

        #source_file = s3://mediator-pmam-dev/4103/Main/PM_00000000019758_01/PM_00000000019758_01.mov
        #aaf_path = 's3://mediator-pmam-dev/4103/Main/PM_00000000019758_01/PM_00000000019758_01.aaf'

        output_media_path = dst_access_provider.path
        output_track_path = props.get("DstTrack").get("Track").get("TrackFile").get("Path")
        output_file = file_utils.path_join(output_media_path, output_track_path, mat_id)
        # raise Exception("Missing parameters from Job description: SourceFile and DestFile")

    logger.info("Source file: " + source_file)
    logger.info("Output file: " + output_file)
    logger.info("Nexis Path" + dst_access_provider.nexis_path)

    output_definition_name = None
    encoder = None
    container = None
    if 'Profile' not in props:
        if 'SccOption' in props and props['SccOption'] == 'Extraction':
            logger.info("Profile parameter not provided - compatible with scc extraction job")
        else:
            encoder = "DNxHD"
            od_frame_rate = "29.97"
            container = "aaf"
            output_definition_name = encoder + "_" + od_frame_rate + "_" + container
            #(encoder, frame_rate_profile, container) = output_definition_name.split("_")
            # raise Exception("Missing parameter from Job description: Profile")
    else:
        output_definition_name = props['Profile']
        (encoder, frame_rate_profile, container) = output_definition_name.split("_")

    logger.debug("Output definition name: " + output_definition_name)

    incode = None
    if "Incode" in props:
        incode = props["Incode"]

    dest_incode = None
    if "DestIncode" in props:
        dest_incode = props["DestIncode"]
    elif incode is not None:
        dest_incode = incode

    duration = None
    if "Duration" in props:
        duration = props["Duration"]

    reference_folder = dst_access_provider.nexis_path + "\\" + mat_id + "\\"
    logger.info("referenceFolder : " + str(reference_folder))
    mat_id = props['matId']
    aaf_metadata = None
    if ("ProjectName" in props and "NexisPath" in props) or (container == "aaf"):
        logger.debug("Using [" + mat_id + "] as project name for AVID")
        aaf_metadata = {
            "projectName": mat_id,
            "packageName": mat_id,
            # This needs to come from the MAP of the final destination media...
            "referenceFolder": reference_folder
        }

    timecode_burn_in = None
    if "TimecodeBurnInFollowInput" in props:
        timecode_burn_in_string = props["TimecodeBurnInFollowInput"]
        if timecode_burn_in_string != 'true' and timecode_burn_in_string != 'false':
            raise Exception("Invalid value for TimecodeBurnInFollowInput (boolean) [" + timecode_burn_in_string + "]")
        else:
            timecode_burn_in = (timecode_burn_in_string == 'true')

    frame_rate_event = None
    if "TargetFrameRate" in props:
        if frame_rate_conversion(props["TargetFrameRate"]) is None:
            logger.error("Frame rate conversion from [" + frame_rate + "] to [" + props["TargetFrameRate"] + "] not supported")
        else:
            if frame_rate == props["TargetFrameRate"]:
                logger.info("Frame rate and target frame rate are the same [" + frame_rate + "]: no frame rate conversion needed")
            else:
                # Using target frame rate as frame_rate so that timecodes are specified correctly
                frame_rate = props["TargetFrameRate"]
                frame_rate_event = {
                    "frameRate": frame_rate_conversion(props["TargetFrameRate"]),
                    "implementation": "Tachyon"
                }

    clip_event = create_clip_event(source_file=source_file, incode=incode, duration=duration, frame_rate_conversion_object=frame_rate_event)

    if audio_layout is not None:
        audio_clip = AudioClip()
        audio_clip.audio_layout = audio_layout
        clip_event.audio = audio_clip.get_dict()

    if container == 'gxf':
        if encoder == 'DolbyStereo' or encoder == 'DolbySurround':
            add_audio_clip_event(clip_event, encoder)

    timeline = Timeline()
    timeline.timecode = zero_frame_label(frame_rate)
    timeline.events.append(clip_event.get_dict())

    if output_definition_name is not None:
        record_event = create_record_event(output_file=output_file, output_definition_name=output_definition_name, dest_incode=dest_incode, aaf_metadata=aaf_metadata)
        timeline.events.append(record_event.get_dict())
        config = create_config(output_definition_name, encoder, timecode_burn_in, audio_definitions)
    else:
        config = Config()
        config.output_definitions = {}

    base_standard = base_standards(frame_rate)
    config.base_standard = base_standard

    if 'SccOption' in props:
        logger.info("Scc option [" + props['SccOption'] + "]")
        if props['SccOption'] == 'Extraction':
            if 'CaptionDest' in props:
                caption_dest = props['CaptionDest']
            else:
                raise Exception("Missing parameter from Job description for scc authoring: CaptionDest")
            scc_extraction_job(config=config, timeline=timeline, output_file=caption_dest)
        elif props['SccOption'] == 'Stripping':
            scc_stripping_job(config, output_definition_name)
        elif props['SccOption'] == 'Authoring':
            if 'CaptionSource' in props:
                if 'CaptionDest' in props:
                    caption_dest = props['CaptionDest']
                else:
                    caption_dest = None
                scc_authoring_job(config, timeline, props['CaptionSource'], caption_dest, output_definition_name, container)
            else:
                raise Exception("Missing parameter from Job description for scc authoring: CaptionSource")
        else:
            logger.warn("Scc option [" + props['SccOption'] + "] not supported: only Extraction, Stripping and Authoring allowed")

    if 'WatermarkDetails' in props:
        watermark_details = props["WatermarkDetails"]
        logger.info("Applying Watermark using properties in external object [" + watermark_details + "]")
        watermark_event = med_client.generic_call('moxb', 'getExternalObject', name=watermark_details)

        if watermark_event is None or "civolution" not in watermark_event:
            logger.error("Watermark details [" + watermark_details + "] not provided or specified with the wrong type")
        else:
            if "WatermarkId" in props:
                logger.debug("Using incoming WatermarkId [" + props["WatermarkId"] + "]")
                watermark_event["civolution"]["payload"] = props["WatermarkId"]
            if "WatermarkKey" in props:
                logger.debug("Using incoming License Key")
                watermark_event["civolution"]["licenseKeyName"] = props["WatermarkKey"]

            timeline.events.append(watermark_event)

    renderx_timeline = timeline.get_dict()
    clip = renderx_timeline['events'][0]['clip']
    
    clip_filename = clip.get('filename')

    logger.info("Before RenderX Timeline : " + json.dumps(renderx_timeline))
    clip = renderx_timeline['events'][0]['clip']

    clip_filename = clip.get('filename')

    renderx_timeline['events'][0]['clip'] = { "filename": {
                                                          "s3" : {
                                                          "uri" : clip_filename,
                                                          "aws" : {
                                                                  "endpoint": "http://s3-prodmam.mediasys.io",
                                                                  "profile": "evertz"
                                                                  }
                                                          }
                                                }
                                            }
    renderx_timeline['events'][1]['record']['aafMetadata']['aafPath'] = {
                                    "s3":
                                    {
                                        "uri": aaf_path,
                                        "aws": {
                                            "endpoint": "http://s3-prodmam.mediasys.io",
                                            "profile": "evertz"
                                        }
                                    }
                                }

    renderx_timeline['events'][1]['record']['aafMetadata'] = aaf_metadata
    logger.info("After RenderX Timeline : " + json.dumps(renderx_timeline))

    transcode_job = {
        "transcodeJob": {
            "config": config.get_dict(),
            "timeline": [
                renderx_timeline
            ]
        }
    }
    return transcode_job


def create_audio_layout(props):
    audio_layout = []
    audio_definitions = collections.OrderedDict()

    parent_job_desc = props['ParentJobDescription']['JobDescription']['Properties']
    required_track_defs = parent_job_desc['RequiredDestTrackDefs']
    transfer_sources = parent_job_desc['TransferSources']['TransferSource']
    for transfer_source in transfer_sources:
        for details in transfer_source['TransferDetailsList']:
            transferring_track_types = details['TransferringTrackTypes']
            if transferring_track_types is not None:
                for track_def in transferring_track_types:
                    if track_def["TrackType"]["ClassId"] == "AUDIO":
                        file_position = track_def["FilePosition"] - 1
                        channels = track_def["Channels"]
                        track_type_name = track_def["TrackTypeName"]
                        logger.info("source track def info: " + track_type_name + " - position: " + str(file_position) + " - channels: " + str(channels))

                        audio_definitions[track_type_name] = {"channels": channels}

                        layout = {
                            "numChannels": channels,
                            "slot": track_type_name,
                            "startChannel": file_position
                        }

                        audio_layout.append(layout)

    return audio_layout, audio_definitions


def create_clip_event(source_file, incode, duration, frame_rate_conversion_object):
    clip = ClipEvent()
    clip.filename = source_file
    if duration is not None:
        clip.duration = duration
    if incode is not None:
        clip.cue = incode
    if frame_rate_conversion_object is not None:
        clip.frame_rate_conversion = frame_rate_conversion_object

    return clip


def create_record_event(output_file, output_definition_name, dest_incode, aaf_metadata=None):
    record = RecordEvent()
    record.filename = output_file
    record.output_definition = output_definition_name
    record.som = dest_incode

    if aaf_metadata is not None:
        record.aaf_metadata = aaf_metadata

    return record


def create_config(output_definition_name, encoder, timecode_burn_in, audio_definitions=None):
    config = Config()
    config.output_definitions = {}
    config.profiles = {}
    output_def = output_definitions(output_definition_name)

    if output_def is None:
        raise Exception("Output definition [" + output_definition_name + "] not currently supported")

    if audio_definitions is not None:
        config.audio = {
            "definitions": audio_definitions
        }
        # extract the audio object from the output definition to add one entry per audio definition
        audio_output_def = output_def.get("audio")
        audio_item_template = audio_output_def.pop()
        for audio_track_def_name in audio_definitions.keys():
            audio_item = audio_item_template.copy()
            audio_item["slot"] = audio_track_def_name
            audio_output_def.append(audio_item)

    if timecode_burn_in is not None:
        logger.debug("Timecode burn-in option on: follow input [" + str(timecode_burn_in) + "]")
        output_def["video"]["timecodeBurnIn"] = {
            "followInput": timecode_burn_in
        }

    profile_name = output_def["video"]["encoder"]["profile"]
    profile = profiles(profile_name)
    if profile is None:
        raise Exception("Profile [" + profile_name + "] not currently supported")

    if "profile" in output_def["muxer"]:
        muxer_profile_name = output_def["muxer"]["profile"]
        muxer_profile = profiles(muxer_profile_name)
        if muxer_profile is None:
            raise Exception("Muxer profile [" + muxer_profile_name + "] not currently supported")
        else:
            config.profiles[muxer_profile_name] = muxer_profile

    if "profile" in output_def["audio"][0]["encoder"]:
        audio_profile_name = output_def["audio"][0]["encoder"]["profile"]
        audio_profile = profiles(audio_profile_name)
        if audio_profile is None:
            raise Exception("Audio profile [" + audio_profile_name + "] not currently supported")
        else:
            config.profiles[audio_profile_name] = audio_profile

    config.output_definitions[output_definition_name] = output_def
    config.profiles[profile_name] = profile

    if encoder == 'DolbyStereo':
        config_audio_dolby = create_audio_dolby_stereo_config()
        config.audio = config_audio_dolby.get_dict()
    elif encoder == 'DolbySurround':
        config_audio_dolby = create_audio_dolby_surround_config()
        config.audio = config_audio_dolby.get_dict()

    return config


def create_audio_dolby_stereo_config():
    config_audio = AudioConfig()
    config_audio.definitions = {
        "Tone": {
            "channels": 2
        },
        "Tone 5.1 Discrete": {
            "channels": 6
        },
        "Tone 5.1 + 2 Discrete": {
            "channels": 8
        },
        "Tone Dolby E": {
            "channels": 2
        },
        "Tone Dolby E 0": {
            "channels": 1
        },
        "Tone Dolby E 1": {
            "channels": 1
        }
    }
    config_audio.processing = [
        {
            "mapping": {
                "inputs": [
                    {
                        "slot": "Tone 5.1 Discrete",
                        "channel": 0
                    }, {
                        "slot": "Tone 5.1 Discrete",
                        "channel": 1
                    }, {
                        "slot": "Tone 5.1 Discrete",
                        "channel": 2
                    }, {
                        "slot": "Tone 5.1 Discrete",
                        "channel": 3
                    }, {
                        "slot": "Tone 5.1 Discrete",
                        "channel": 4
                    }, {
                        "slot": "Tone 5.1 Discrete",
                        "channel": 5
                    }, {
                        "slot": "Tone",
                        "channel": 0
                    }, {
                        "slot": "Tone",
                        "channel": 1
                    }
                ],
                "output": "Tone 5.1 + 2 Discrete"
            }
        },
        {
            "dolbyEEncode": {
                "input": "Tone 5.1 + 2 Discrete",
                "output": "Tone Dolby E",
                "parameters": {
                    "programConfig": "5.1+2"
                }
            }
        },
        {
            "mapping": {
                "inputs": [
                    {
                        "slot": "Tone Dolby E",
                        "channel": 0
                    }
                ],
                "output": "Tone Dolby E 0"
            }
        },
        {
            "mapping": {
                "inputs": [
                    {
                        "slot": "Tone Dolby E",
                        "channel": 1
                    }
                ],
                "output": "Tone Dolby E 1"
            }
        }
    ]

    return config_audio


def create_audio_dolby_surround_config():
    config_audio = AudioConfig()
    config_audio.definitions = {
        "Stereo": {
            "channels": 2
        },
        "Front Left": {
            "channels": 1
        },
        "Front Right": {
            "channels": 1
        },
        "Center": {
            "channels": 1
        },
        "LFE": {
            "channels": 1
        },
        "Surround Left": {
            "channels": 1
        },
        "Surround Right": {
            "channels": 1
        },
        "Stereo 5.1 + 2 Discrete": {
            "channels": 8
        },
        "Stereo Dolby E": {
            "channels": 2
        },
        "Stereo Dolby E 0": {
            "channels": 1
        },
        "Stereo Dolby E 1": {
            "channels": 1
        }
    }
    config_audio.processing = [
        {
            "mapping": {
                "inputs": [
                    {
                        "slot": "Front Left",
                        "channel": 0
                    }, {
                        "slot": "Front Right",
                        "channel": 0
                    }, {
                        "slot": "Center",
                        "channel": 0
                    }, {
                        "slot": "LFE",
                        "channel": 0
                    }, {
                        "slot": "Surround Left",
                        "channel": 0
                    }, {
                        "slot": "Surround Right",
                        "channel": 0
                    }, {
                        "slot": "Stereo",
                        "channel": 0
                    }, {
                        "slot": "Stereo",
                        "channel": 1
                    }
                ],
                "output": "Stereo 5.1 + 2 Discrete"
            }
        },
        {
            "dolbyEEncode": {
                "input": "Stereo 5.1 + 2 Discrete",
                "output": "Stereo Dolby E",
                "parameters": {
                    "programConfig": "5.1+2"
                }
            }
        },
        {
            "mapping": {
                "inputs": [
                    {
                        "slot": "Stereo Dolby E",
                        "channel": 0
                    }
                ],
                "output": "Stereo Dolby E 0"
            }
        },
        {
            "mapping": {
                "inputs": [
                    {
                        "slot": "Stereo Dolby E",
                        "channel": 1
                    }
                ],
                "output": "Stereo Dolby E 1"
            }
        }
    ]

    return config_audio


def scc_authoring_job(config, timeline, caption_source, caption_dest, output_definition_name, container):
    record_scc = None
    if caption_dest is not None:
        record_scc = RecordEvent()
        record_scc.filename = caption_dest
        record_scc.output_definition = "scc"

    for event in timeline.events:
        if "clip" in event:
            event["clip"]["externalCaption"] = [
                {
                    "filename": caption_source,
                    "slot": "external_scc"
                }
            ]

    if record_scc is not None:
        timeline.events.append(record_scc.get_dict())

    if container == "gxf":
        encoder_codec = "gxf_anc"
    else:
        encoder_codec = "mxf_anc"

    output_definition = config.output_definitions[output_definition_name]
    output_definition["anc"] = [{
        "encoder": {
            "codec": encoder_codec
        },
        "cc": [
            {
                "slot": "external_scc"
            }
        ]
    }]

    if record_scc is not None:
        config.output_definitions["scc"] = {
            "anc": [
                {
                    "encoder": {
                        "codec": "scc"
                    },
                    "cc": [
                        {
                            "slot": "external_scc"
                        }
                    ]
                }
            ]
        }


def scc_stripping_job(config, output_definition_name):
    output_definition = config.output_definitions[output_definition_name]
    output_definition["anc"] = [
        {
            "encoder": {
                "codec": "mxf_anc"
            },
            "cc": "suppressed"
        }
    ]


def scc_extraction_job(config, timeline, output_file):
    record = RecordEvent()
    record.filename = output_file
    record.output_definition = "scc"
    timeline.events.append(record.get_dict())

    config.output_definitions["scc"] = {
        "anc": [
            {
                "encoder": {
                    "codec": "scc"
                }
            }
        ]
    }


def add_audio_clip_event(clip_event, encoder):
    if encoder == "DolbyStereo":
        clip_event.audio = {
            "processing": [
                {
                    "mapping": {
                        "inputs": [
                            {
                                "channel": 0,
                                "slot": "Tone Left"
                            },
                            {
                                "channel": 0,
                                "slot": "Tone Right"
                            }
                        ],
                        "output": "Tone"
                    }
                }
            ],
            "streams": [
                {
                    "slot": "Tone Left",
                    "streamIdx": 0
                },
                {
                    "slot": "Tone Right",
                    "streamIdx": 1
                }
            ]
        }
    elif encoder == "DolbySurround":
        clip_event.audio = {
            "streams": [
                {
                    "streamIdx": 0,
                    "slot": "Front Left"
                },
                {
                    "streamIdx": 1,
                    "slot": "Front Right"
                },
                {
                    "streamIdx": 2,
                    "slot": "Center"
                },
                {
                    "streamIdx": 3,
                    "slot": "LFE"
                },
                {
                    "streamIdx": 4,
                    "slot": "Surround Left"
                },
                {
                    "streamIdx": 5,
                    "slot": "Surround Right"
                },
                {
                    "streamIdx": 6,
                    "slot": "Stereo Left"
                },
                {
                    "streamIdx": 7,
                    "slot": "Stereo Right"
                }
            ],
            "processing": [
                {
                    "mapping": {
                        "inputs": [
                            {
                                "slot": "Stereo Left",
                                "channel": 0
                            }, {
                                "slot": "Stereo Right",
                                "channel": 0
                            }
                        ],
                        "output": "Stereo"
                    }
                }
            ]
        }


if __name__ == "__main__":
    returnValue = main()
    print "script complete, returning with value", returnValue
    sys.exit(returnValue)
