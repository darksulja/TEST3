#!/usr/bin/python
__description__ = '''
Created on 08 June 2018
Uses TrackFiles
Uses MediaAccessProvider Default Media Provider Means Use Paths
Works with Avid IPWS to stitch rendered content
@author: Jeff Kalbfleisch
example:
    /opt/evertz/mediator/scripts/wsrunner_avid_renderx.py medx-dev+Z-medx-dev-08b9ccca-c73e-4a91-9ce1-931b601ef517+VanillaRunnerJob-55476-21313ec9-e332-460b-a34e-8d268464894a --test_mode true --log_level DEBUG --srcMAP AvidMAP --dstMAP StoreHD
'''
import sys
import logging
import argparse
import json

# Set up the logging that all transfer objects will inherit
FORMAT = "[%(threadName)-12.12s] - [%(name)s]:%(lineno)s - %(funcName)20s() [%(levelname)-5.5s]] %(message)s"
logging.basicConfig(level=logging.INFO, format=FORMAT)
logger = logging.getLogger()

from evertz.mediator.job.job_updater import JobUpdater
from evertz.renderx import *
from evertz.avid.sequence.ipws_data import IPWSData
from evertz.mediator.webservice.http_client import MediatorWSHTTPClient
from evertz.mediator.access.provider_factory import MediaAccessProviderFactory, MediaAccessProviderFunction
from evertz.utils.file_utils import FileUtils
from evertz.mediator.access.avid_access_provider import AvidMediaAccessProvider

medclient = None
job_updater = None


class RenderRunner:
    global job_updater

    def __init__(self,
                 mediator_host='medx-dev',
                 session_key='ded6dc22-5a3e-4d1d-8ddb-e1234b464bca',
                 job_id='VanillaRunnerJob-214-349a895f-76fe-4ad4-940d-4a135108616b',
                 out_file="/storage/RENDERED_OUTPUT.mxf"):
        self.mediator_host = mediator_host
        self.session_key = session_key
        self.job_id = job_id
        self.med_client = MediatorWSHTTPClient(mediator_host, session_key)
        self.job_progress = 0
        self.render_x_client = None
        self.job_progress = 0
        self.props = None
        self.out_file = out_file
        self.event_data = {}
        self.avid_map = None
        self.mob_id = None
        self.video_track = None
        self.audio_tracks = None
        self.source_media = None
        self.avid_access_provider = None
        self.ipws_data = None

    def update_job(self, progress=None, status=None):
        job_updater.update_job(self.job_id, 'JOB__PROGRESS', progress)
        job_updater.update_job(self.job_id, 'JOB__STATUS', status)

    def fail_callback(self, error_msg):
        logger.debug("Updating Job Error")
        job_updater.update_job(self.job_id, 'JOB__ERROR', error_msg)

    def get_prop(self, prop_key):
        if self.props is None:
            job = self.med_client.job.get_job(self.job_id)
            self.props = job['Job']['Description']['Properties']
        return self.props.get(prop_key)

    def get_avid_access_provider(self):
        if self.avid_access_provider is None:
            if self.avid_map is not None and self.avid_map != '':
                self.avid_access_provider = MediaAccessProviderFactory.get_provider_by_name(self.med_client,
                                                                                            self.avid_map)
            else:
                logger.debug("Getting transfer media access provider for media [" + str(self.source_media) + "]")
                media_access_providers = MediaAccessProviderFactory.get_providers_for_media(self.med_client,
                                                                                            self.source_media,
                                                                                            MediaAccessProviderFunction.Transfer)
                for media_access_provider in media_access_providers:
                    if isinstance(media_access_provider, AvidMediaAccessProvider):
                        self.avid_access_provider = media_access_provider
        return self.avid_access_provider

    def get_ipws_data(self):
        if self.ipws_data is None:
            avid_access_provider = self.get_avid_access_provider()
            if avid_access_provider is None:
                message = "Your configured transfer route did not have a SourceAccessProvider"
                message += " And there is no media access provider configured for media "
                message += "[" + str(self.source_media) + "] for transfer with type name Avid"
                logger.error(message)

            self.ipws_data = IPWSData(mob_id=self.mob_id,
                                      workgroup=avid_access_provider.workgroup,
                                      ipws_server=avid_access_provider.host_name,
                                      ipws_port=avid_access_provider.port,
                                      ipws_username=avid_access_provider.authentication.user_name,
                                      ipws_password=avid_access_provider.authentication.password)
        return self.ipws_data


if __name__ == "__main__":
    runner_env = sys.argv[1].split('+')
    mediator_host_env = runner_env[0]
    session_key_env = runner_env[1]
    job_id_env = runner_env[2]

    parser = argparse.ArgumentParser(prog='wsrunner_avid_renderx', description=__description__)
    parser.add_argument('--src_map', metavar='AvidMAP', help='source Media Access Provider')
    parser.add_argument('--dst_map', metavar='Store HD', help='destination Media Access Provider')
    parser.add_argument('--render_x_server_ip', metavar='172.17.124.108', help='Render X Server')
    parser.add_argument('--render_x_server_port', metavar='9002', help='RenderX Port')
    parser.add_argument('--output_definition_name', metavar='V1', help='Output definition name')
    parser.add_argument('--output_profile', metavar='V1', help='Output profile')

    parser.add_argument('--medclient_host', metavar='medx-dev', help='host to use for medclient')
    parser.add_argument('--log_level', default='INFO',
                        choices=['CRITICAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'NOTSET'], metavar='INFO',
                        required=False, help='specify the log level for this application')

    args, unknown = parser.parse_known_args()

    if args.src_map is not None:
        logger.debug('PARAM - src_map : ' + str(args.src_map))
    if args.dst_map is not None:
        logger.debug('PARAM - dst_map : ' + str(args.dst_map))
    if args.render_x_server_ip is not None:
        logger.debug('PARAM - render_x_server_ip : ' + str(args.render_x_server_ip))
    if args.render_x_server_port is not None:
        logger.debug('PARAM - render_x_server_port : ' + str(args.render_x_server_port))

    render_runner = RenderRunner(mediator_host=mediator_host_env,
                                 session_key=session_key_env,
                                 job_id=job_id_env,
                                 out_file="/storage/JEFFS_OUTPUT.mxf")
    try:
        logger.debug('getting job description')
        job = render_runner.med_client.job.get_job(job_id_env)
        logger.info("job = " + str(job))
        props = job['Job']['Description']['Properties']
        logger.debug("job['Job']['Description']['Properties'] = " + str(props))
        job_updater = JobUpdater(render_runner.med_client)
        job_updater.start()

        dst_track = props.get("DstTrack")
        media = dst_track.get("Track").get("Media")
        media_relative_path = media.get("RelativePath")

        transfer_source = props.get("TransferSources").get("TransferSource")[0]
        transfer_details = transfer_source.get("TransferDetailsList")[0]
        transfer_route = transfer_source.get("TransferRoute")
        transfer_source_node = transfer_source.get("TransferSourceNode")

        logger.debug("Transfer Source : " + str(transfer_source))
        required_dest_track_defs = props.get("RequiredDestTrackDefs")

        transfer = transfer_details.get("Transfer")
        transferring_track_types = transfer_details.get("TransferringTrackTypes")
        source_track = transfer_details.get("SourceTrack")

        material = props.get("Material").get("Material")
        mat_id = material.get("MatId")

        mob_id = source_track.get("FileId")

        if mob_id is None or mob_id == "":
            mob_id = render_runner.get_prop('mob_id')

        output_definition_name = args.output_definition_name
        output_profile = args.output_profile

        if output_definition_name is None or output_definition_name == "":
            output_definition_name = render_runner.get_prop('output_definition_name')

        if output_profile is None or output_profile == "":
            output_profile = render_runner.get_prop('output_profile')

        avid_map = transfer_route.get('SourceAccessProvider')

        source_media = transfer_source.get("TransferSourceNode").get("MediaName")
        logger.debug("Source Media : " + source_media)

        render_runner.avid_map = avid_map
        render_runner.source_media = source_media
        render_runner.mob_id = mob_id

        render_runner.output_definition_name = output_definition_name
        render_runner.output_profile = output_profile
        logger.debug("required_dest_track_defs = " + json.dumps(required_dest_track_defs))

        ipws_data = render_runner.get_ipws_data()

        render_runner.video_track = ipws_data.get_video_track()
        render_runner.audio_tracks = ipws_data.get_audio_tracks()

        logger.info("Processing Display Name [" + str(ipws_data.get_sequence_attribute('DisplayName')) + "]")
        logger.info("Type [" + str(ipws_data.get_sequence_attribute('Type')) + "]")
        logger.info("Video Track [" + str(render_runner.video_track) + "]")
        logger.info("Audio Tracks [" + str(render_runner.audio_tracks) + "]")
        logger.info("At Path [" + str(ipws_data.get_sequence_attribute('Path')) + "]")

        break_points = ipws_data.get_break_points()
        logger.info("Break Points [" + str(break_points) + "]")

        dst_track_file = required_dest_track_defs.get("TrackDefinition")[0].get("TrackFile")

        file_utils = FileUtils()

        logger.info("Media Relative Path [" + str(media_relative_path) + "] DST Track File Path [" + str(
            dst_track_file.get("Path")) + "]")

        if media_relative_path is None:
            output_folder = dst_track_file.get("Path")
        else:
            output_folder = file_utils.path_join(media_relative_path, dst_track_file.get("Path"))

        output_file_name = file_utils.path_join(output_folder, dst_track_file.get("Name"))
        if output_file_name.endswith('/'):
            output_file_name = output_file_name[:-1]

        avid_access_provider = render_runner.get_avid_access_provider()
        output_file_name = "/srv/storage/" + output_file_name
        logger.info("output_file_name [" + output_file_name + "]")
        logger.info("Avid Map [" + str(avid_map) + "]")
        logger.info("MOB ID [" + mob_id + "]")
        logger.info("output_definition_name [" + output_definition_name + "]")
        logger.info("output_profile [" + output_profile + "]")

        all_ranges = ipws_data.get_all_ranges()

        logger.info("All Ranges [" + str(all_ranges) + "]")

        render_x_client = RenderXRestClient(args.render_x_server_ip, args.render_x_server_port)
        renderx_job = RenderXTranscodeJob()
        renderx_config = RenderXConfig()
        renderx_config.add_output_def_by_name(output_definition_name, render_runner.med_client)
        renderx_audio_config = RenderXAudioConfig()

        audio_tracks = ipws_data.get_audio_tracks()
        num_audio_tracks = ipws_data.get_num_audio_tracks()
        language = 'eng'

        for audio_track_type in audio_tracks:
            audio_slot = ipws_data.get_audio_slot_by_track_type(audio_track_type)

            renderx_audio_config.add_audio_definition(audio_slot,
                                                      str(1),
                                                      language=language)

        renderx_audio_config.add_audio_definition("StereoOutput",
                                                  len(audio_tracks),
                                                  language=language)

        record_timeline_event = RenderXTimelineItem()
        renderx_config.set_audio_config(renderx_audio_config)

        record_event = RenderXRecordEvent()
        record_event.add_record(output_file_name, output_definition_name)
        record_timeline_event.add_event(record_event)
        renderx_job.add_timeline_item(record_timeline_event)

        processing = {"mapping": {"inputs": [{"channel": 0, "slot": "Audio1"}, {"channel": 0, "slot": "Audio2"}],
                                  "output": "StereoOutput"}}

        previous_composition_position = 0
        previous_duration = 0
        for range_data in all_ranges:
            range_clip_event = None
            logger.debug("Range [" + str(range_data) + "] [" + str(render_runner.video_track) + "]")
            video_event = ipws_data.get_video_by_track_for_range(range_data, render_runner.video_track)

            logger.debug("Video Event :")
            logger.debug(video_event.short_info())
            audio_events = []
            for audio_track in audio_tracks:
                audio_event_for_track = ipws_data.get_audio_by_track_for_range(range_data, audio_track)
                audio_events.append(audio_event_for_track)

            range_start = range_data[0]
            range_end = range_data[1]
            timeline_event = RenderXTimelineItem()
            timeline_event.set_frame(range_start)

            slot_name = "SLOT_NAME"
            channels = 1
            timeline_event_clip = RenderXClipEvent()

            cue_frame = int(video_event.segment_mark_in)
            duration_frames = int(video_event.segment_duration)

            # If the range stops before the duration of the clip chop content off at the range
            if int(range_data[1]) < int(duration_frames):
                duration_frames = int(range_data[1])

            video_needed_offset = int(range_data[0]) - int(video_event.composition_position)
            cue_frame += int(video_needed_offset)
            duration_frames -= int(video_needed_offset)

            logger.info("Video Composition Position [" + str(
                video_event.composition_position) + "] video needed offset [" + str(video_needed_offset) + "]")
            logger.info("Video Cue Frame [" + str(cue_frame) + "]")
            logger.info("Duration Frames [" + str(duration_frames) + "]")

            previous_composition_position = int(video_event.composition_position)
            previous_duration = int(duration_frames)

            video_file_location = video_event.get_file_location(render_runner.video_track).get('FilePath')
            logger.debug("Video File Location [" + str(video_file_location) + "]")
            video_file_linux_path = ipws_data.get_linux_path(video_file_location)
            logger.debug("Video File Linux Path [" + str(video_file_linux_path) + "]")

            timeline_event_clip.set_clip_file(video_file_linux_path,
                                              duration_frames=duration_frames,
                                              cue_frame=cue_frame)

            external = []
            cue_object = None
            for audio_clip in audio_events:
                audio_file_location = audio_clip.get_file_location(audio_clip.segment_track)
                audio_linux_path = ipws_data.get_linux_path(audio_file_location.get('FilePath'))
                audio_slot = ipws_data.get_audio_slot_by_track_type(audio_clip.composition_track)

                audio_needed_offset = int(range_data[0]) - int(audio_clip.composition_position)
                audio_cue_frame = int(audio_clip.segment_mark_in) + int(audio_needed_offset)

                logger.info("Audio File Linux Path [" + str(audio_linux_path) + "]")
                logger.info("Audio Slot [" + str(audio_slot) + "]")
                cue_object = {'denominator': str(30000), 'numerator': str(int(audio_cue_frame) * 1001)}
                logger.info("Segment Mark In [" + str(audio_clip.segment_mark_in) + "] -- [" + str(
                    audio_cue_frame) + "] [" + str(cue_object) + "]")
                logger.info("--------------------------------------------")
                audio = {"filename": audio_linux_path, "slot": audio_slot}
                external.append(audio)

            timeline_event_clip.add_clip_audio(num_channels=str(1),
                                               start_channel=str(0),
                                               external_audio_file=external,
                                               cue=cue_object,
                                               processing=processing)

            timeline_event.add_event(timeline_event_clip)
            renderx_job.add_timeline_item(timeline_event)
            logger.debug("External [" + json.dumps(external) + "]")
            logger.debug("Timeline Event [" + json.dumps(timeline_event.get_payload()) + "]")

        renderx_job.add_config(renderx_config)

        logger.info("RenderX Payload : " + json.dumps(renderx_job.get_payload()))
        renderx_job_result = render_x_client.submit_job_and_wait_for_completion(renderx_job.get_payload(),
                                                                                render_runner.update_job)

        if not renderx_job_result.success:
            raise Exception("Job failed: {0}".format(renderx_job_result.message))
        else:
            logger.debug("Job finished")
    except Exception, e:
        logger.exception(e)
        render_runner.fail_callback(str(e))
        sys.exit(1)
    finally:
        job_updater.terminate()

sys.exit(0)
