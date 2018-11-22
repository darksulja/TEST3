#!/usr/bin/python
__description__ = '''
Created on Nov 05 2018
Stitch media composer rendered effects into a mediator ingestable file. The class works by building up a job submission 
for sending to renderx which does the work of stitching together all of the media composer rendered content into one file 
which is then registered onto the destination cloudian media in mediator.

Uses:
IPWS.get_segments_from_composition
IPWSData
TrackFiles
renderx
AvidMediaAccessProvider To Cloudian s3 media access end_point

Required Job Description Properties                                | Example
-------------------------------------------------------------------|------------------
job['Job']['Description']['CreateProperties']['ApparatusLocator']  | AvidRenderX2
job['Job']['Description']['Properties']['OutputDefinitionName']    | Screener_2997_mov
job['Job']['Description']['Properties']['OutputProfile']           | DNXHD220

@author: Jeff Kalbfleisch
example:
    /opt/evertz/mediator/scripts/avid/wsrunner_avid_to_cloudian_transfer.py medx-dev+Z-medx-dev-08b9ccca-c73e-4a91-9ce1-931b601ef517+VanillaRunnerJob-55476-21313ec9-e332-460b-a34e-8d268464894a
'''
import sys
import json
import logging
import argparse

sys.path.append(".")

# Set up the logging that all transfer objects will inherit
FORMAT = "[%(threadName)-12.12s] - [%(name)s]:%(lineno)s - %(funcName)20s() [%(levelname)-5.5s]] %(message)s"
logging.basicConfig(level=logging.INFO, format=FORMAT)
logger = logging.getLogger()

from evertz.mediator.job.job_updater import JobUpdater
from evertz.renderx import *
from sequence.ipws_data import IPWSData
from evertz.mediator.webservice.http_client import MediatorWSHTTPClient
from evertz.mediator.access.provider_factory import MediaAccessProviderFactory, MediaAccessProviderFunction
from evertz.utils.file_utils import FileUtils
from evertz.mediator.access.avid_access_provider import AvidMediaAccessProvider
from evertz.mediator.webservice import MediatorException

medclient = None
job_updater = None


class RenderRunner:
    global job_updater

    def __init__(self,
                 med_client=None,
                 job_id=None,
                 out_file="/storage/RENDERED_OUTPUT.mxf"):
        self.med_client = med_client
        self.job_progress = 0
        self.render_x_client = None
        self.job_progress = 0
        self.job_id = job_id
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

    def get_renderx_connection_details(self, apparatus_locator):
        logger.info("Fetching RenderX connection details for Apparatus [{0}]".format(apparatus_locator))
        try:
            # Since apparatus.get doesnt retrieve the full external config, lets get the latest/greatest.
            apparatus = self.med_client.generic_call(subsystem="apparatus",
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
            raise Exception(
                "Unable to retrieve renderXServiceAddress from apparatus [{0}]. Please ensure the configuration is correct.".format(
                    apparatus_locator))

        render_x_server_ip = net_address.get('HostName')
        render_x_server_port = net_address.get('Port')
        logger.info("Retrieved connection details from Apparatus IP [{0}] Port [{1}].".format(render_x_server_ip,
                                                                                              render_x_server_port))
        return render_x_server_ip, render_x_server_port


if __name__ == "__main__":
    runner_env = sys.argv[1].split('+')
    mediator_host_env = runner_env[0]
    session_key_env = runner_env[1]
    job_id_env = runner_env[2]
    med_client = MediatorWSHTTPClient(mediator_host_env, session_key_env)
    job_updater = JobUpdater(med_client)
    job_updater.start()

    render_runner = RenderRunner(med_client=med_client,
                                 job_id=job_id_env,
                                 out_file="/storage/JEFFS_OUTPUT.mxf")
    try:
        logger.debug('getting job description')
        job = render_runner.med_client.job.get_job(job_id_env)
        logger.info("job = " + str(job))
        props = job['Job']['Description']['Properties']
        create_properties = job['Job']['Description']['CreateProperties']

        dst_track = props.get("DstTrack")
        output_definition_name = props.get("OutputDefinitionName")
        output_profile = props.get("OutputProfile")

        render_x_apparatus = create_properties.get("ApparatusLocator")
        if output_definition_name is None:
            raise Exception("Job property OutputDefinitionName not found")
        if output_profile is None:
            raise Exception("Job property OutputProfile not found")
        if render_x_apparatus is None:
            raise Exception("Job Create property ApparatusLocator not found")

        media = dst_track.get("Track").get("Media")
        media_relative_path = media.get("RelativePath")

        (renderx_ip, renderx_port) = render_runner.get_renderx_connection_details(render_x_apparatus)
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

        video_tracks = ipws_data.get_video_tracks()
        audio_tracks = ipws_data.get_audio_tracks()
        render_runner.audio_tracks = audio_tracks
        render_runner.video_track = ipws_data.get_video_track()

        logger.info("Processing Display Name [" + str(ipws_data.get_sequence_attribute('DisplayName')) + "]")
        logger.info("At Path [" + str(ipws_data.get_sequence_attribute('Path')) + "]")
        logger.info("Type [" + str(ipws_data.get_sequence_attribute('Type')) + "]")
        logger.info("Video Track [" + str(render_runner.video_track) + "]")
        logger.info("Video Tracks [" + str(video_tracks) + "]")
        logger.info("Audio Tracks [" + str(audio_tracks) + "]")

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
        (renderx_ip, renderx_port)
        render_x_client = RenderXRestClient(renderx_ip, renderx_port)
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
                                                      str(1))

        renderx_audio_config.add_audio_definition("StereoOutput",
                                                  len(audio_tracks))

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
        video_track = "V11"
        for range_data in all_ranges:
            range_clip_event = None
            video_for_range = ipws_data.get_video_for_range(range_data)
            video_event = ipws_data.get_video_by_track_for_range(range_data, video_track)
            if video_event is None:
                logger.info("Video For [" + str(range_data) + "] :" + json.dumps(video_for_range))
                video_exception_message = "Range [" + str(range_data) + "] [" + str(video_track) + "] No Video Event"
                raise Exception(video_exception_message)

            logger.debug("Video Event :")
            logger.debug(video_event.short_info())
            audio_events = []
            for audio_track in audio_tracks:
                audio_event_for_track = ipws_data.get_audio_by_track_for_range(range_data, audio_track)
                audio_for_range = ipws_data.get_audio_for_range(range_data)
                logger.info("Audio For [" + str(range_data) + "] :" + str(audio_for_range))
                logger.info("Audio Event For Track :" + str(audio_event_for_track))
                if audio_event_for_track is None:
                    audio_exception_message = "Range [" + str(range_data) + "] [" + str(audio_track) + "] No Audio Event"
                    raise Exception(Exception_Message)
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

            if video_event is None or video_event.get_file_location(video_track) is None:
                continue

            video_file_location = video_event.get_file_location(video_track).get('FilePath')
            logger.debug("Video File Location [" + str(video_file_location) + "]")
            video_file_linux_path = ipws_data.get_linux_path(video_file_location)
            logger.debug("Video File Linux Path [" + str(video_file_linux_path) + "]")

            timeline_event_clip.set_clip_file(video_file_linux_path,
                                              duration_frames=duration_frames,
                                              cue_frame=cue_frame)

            external = []
            cue_object = None
            for audio_clip in audio_events:
                if audio_clip.get_file_location(audio_clip.segment_track) is None:
                    continue
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
