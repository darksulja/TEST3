'''
Created on 19 Jan 2018

@author: Jeff Kalbfleisch
'''
import logging
import json
import sys

sys.path.append("../")
from evertz.avid.assets_simple_client import Assets
from sequence.ipws_helper import IPWSHelper
from sequence.clip import AvidClip
logger = logging.getLogger(__name__)
from collections import OrderedDict
import os
import subprocess

ENV_DICT = {
    "PATH": "/usr/local/bin/:/usr/bin/:/usr/local/pharos/bin/",
    "LD_LIBRARY_PATH": "/usr/local/lib/:/usr/lib/"}


class IPWSData:
    """
       A Tool for splitting segment information from ipws.get_segments_from_composition() into
    audio and video ranges to be used for defining renderx video stitching clip information
    """
    def __init__(self,
                 workgroup="EvertzWorkgroup",
                 ipws_server='10.42.10.24',
                 ipws_port='3000',
                 ipws_username='evertz',
                 ipws_password='evertz1',
                 mob_id="060a2b340101010101010f0013-000000-5a1db94ce84f4ce0-060e2b347f7f-2a80"):
        self.workgroup = workgroup
        self.mob_id = mob_id
        self.ipws_server = ipws_server
        self.ipws_port = ipws_port
        self.ipws_username = ipws_username
        self.ipws_password = ipws_password

        self.previous_rendered_effect_end = 0
        self.num_expected_track_files = 0

        self.workgroup_uri = "interplay://" + str(self.workgroup)
        self.interplay_uri = self.workgroup_uri + "?mobid=" + mob_id
        self.video_tracks = None
        self.audio_tracks = None
        self.segments = None
        self.sequence_attributes = None
        self.comp_tracks = {}
        self.seg_tracks = {}

        self.assets = Assets(ipws_server, ipws_port, ipws_username, ipws_password)
        self.master_clips = None
        self.rendered_effects = None
        self.audio_track_types = None
        self.ipws_helper = IPWSHelper()

        self.break_points = None
        self.clip_events = None
        self.highest_video_track = None
        self.highest_audio_track = None
        self.segments_from_compositon_result = None
        self.avid_root = "/storage/avidnexis/"
        self.mxf_root = "/Avid Mediafiles/mxf/"

    def get_segments(self):
        if self.segments is None:
            self.segments = {}
            result = self.assets.get_segments_from_composition(self.interplay_uri, True)
            self.segments_from_composition_result = result
            segments = result['Segments']['Segment']
            self.segments = segments
        return self.segments

    def get_sequence_attribute(self, attr_key):
        for attribute in self.get_sequence_attributes():
            if attribute.get('@Name') == attr_key:
                return attribute.get('#text')
        return

    def get_video_track(self):
        tracks = self.get_sequence_attribute("Tracks")
        track_parts = tracks.split()
        video_track = track_parts[0]
        return video_track

    def get_audio_tracks(self):
        if self.audio_tracks is None:
            audio_tracks = []
            segments = self.get_segments()
            for segment in segments:
                composition_track = str(segment.get("CompositionTrack"))
                if composition_track.startswith('A') and composition_track not in audio_tracks:
                    audio_tracks.append(composition_track) 
            self.audio_tracks = audio_tracks
        return self.audio_tracks

    def get_video_tracks(self):
        if self.video_tracks is None:
            video_tracks = []
            segments = self.get_segments()
            for segment in segments:
                composition_track = str(segment.get("CompositionTrack"))
                logger.info("Video Composition Track [" + str(composition_track) + "]")
                if composition_track.startswith('V') and composition_track not in video_tracks:
                    video_tracks.append(composition_track) 
            return video_tracks

    def get_sequence_attributes(self):
        if self.sequence_attributes is None:
            interplay_uris = {'typ:InterplayURI': self.interplay_uri}
            sequence_attr_result = self.assets.get_attributes(interplay_uris)
            sequence_attributes = sequence_attr_result['Results']['AssetDescription']['Attributes']['Attribute']
            #logger.info("Sequence Attributes [" + str(sequence_attr_result) + "]")
            self.sequence_attributes = sequence_attributes
        return self.sequence_attributes


    def get_file_location(self, avid_clip, track_name):
        interplay_uris = self.get_interplay_uris(avid_clip)
        file_locations = self.get_file_locations(interplay_uris)

        if not isinstance(file_locations, list):
            file_locations = [file_locations]

        for file_location in file_locations:
            if isinstance(file_location, OrderedDict):
                if file_location.get("Track") == track_name:
                    return file_location

    def get_file_locations(self, interplay_uris):
        file_details = self.assets.get_file_details(interplay_uris)
        file_locations = file_details['Results']['FileLocationDetails']['FileLocations']['FileLocation']
        if not isinstance(file_locations, list):
            file_locations = [file_locations]
        return file_locations

    def get_interplay_uris(self, clip):
        interplay_uris = None
        if clip.get_attribute("Type") == 'renderedeffect':
            interplay_uri = "interplay://" + str(self.workgroup) + "?mobid=" + str(clip.get_attribute("MOB ID"))
            interplay_uris = {'typ:InterplayURI': interplay_uri}
        elif clip.get_attribute("Type") == 'masterclip':
            interplay_uri = "interplay://" + str(self.workgroup) + "/" + str(clip.get_attribute('Path'))
            interplay_uris = {'typ:InterplayURI': interplay_uri}
        return interplay_uris

    def init_clip_events(self):
        if self.clip_events is None:
            clip_events = []
            segments = self.get_segments()

            clip_events_info = []
            for segment in segments:
                composition_track = segment.get("CompositionTrack")
                segment_track = segment.get("SegmentTrack")
                composition_duration = segment.get("CompositionDuration")
                composition_position = segment.get("CompositionPosition")
                avid_clip = AvidClip(avid_data=segment)

                tracks_string = avid_clip.get_attribute("Tracks")
                file_locations = self.get_file_locations(self.get_interplay_uris(avid_clip))
                avid_clip.set_file_locations(file_locations)

                clip_event_info = {}
                clip_event_info['segment'] = segment 
                clip_event_info['file_locations'] = file_locations 

                clip_events_info.append(clip_event_info)

                avid_clip.expected_number_of_tracks = self.num_expected_track_files
                clip_events.append(avid_clip)
                self.comp_tracks[str(avid_clip.composition_track)] = True
                self.seg_tracks[str(avid_clip.segment_track)] = True

            #logger.info("Clip Events Info : " + json.dumps(clip_events_info))
            self.clip_events = clip_events

    def get_highest_video_track(self):
        if self.highest_video_track is None:
            highest_video_track = 1
            for segment in self.get_segments():
                composition_track = segment.get("CompositionTrack")
                if "V" in composition_track:
                    comp_track_num = int(composition_track.replace("V", ''))
                    if comp_track_num > highest_video_track:
                        highest_video_track = comp_track_num
            self.highest_video_track = "V" + str(highest_video_track)
        return self.highest_video_track

    def get_num_audio_tracks(self):
        audio_tracks = self.get_audio_tracks()
        return len(audio_tracks)

    def get_highest_audio_track(self):
        audio_tracks = self.get_audio_tracks()
        num_audio_tracks = len(audio_tracks)
        return audio_tracks[num_audio_tracks-1]

    def get_rendered_video_clips(self):
        rendered_video_clips = []
        for clip_event in self.clip_events:
            if clip_event.composition_track.startswith("V") and clip_event.get_attribute("Type") == 'renderedeffect':
                rendered_video_clips.append(clip_event)
        return rendered_video_clips

    def get_master_video_clips(self):
        master_video_clips = []
        for clip_event in self.clip_events:
            if clip_event.composition_track.startswith("V") and clip_event.get_attribute("Type") == 'masterclip':
                master_video_clips.append(clip_event)
        return master_video_clips

    def get_rendered_audio_clips(self):
        rendered_audio_clips = []
        for clip_event in self.clip_events:
            if clip_event.composition_track.startswith("A") and clip_event.get_attribute("Type") == 'renderedeffect':
                rendered_audio_clips.append(clip_event)
        return rendered_audio_clips

    def get_master_audio_clips(self):
        master_audio_clips = []
        for clip_event in self.clip_events:
            if clip_event.composition_track.startswith("A") and clip_event.get_attribute("Type") == 'masterclip':
                master_audio_clips.append(clip_event)
        return master_audio_clips

    def get_break_points(self):
        self.init_clip_events()
        if self.break_points is None:
            break_points = []
            rendered_video_clips = self.get_rendered_video_clips()
            master_video_clips = self.get_master_video_clips()
            rendered_audio_clips = self.get_rendered_audio_clips()
            master_audio_clips = self.get_master_audio_clips()
            logger.debug("Checking rendered video")
            for rendered_video_clip in rendered_video_clips:
                logger.debug("Rendered Video [" + str(rendered_video_clip.composition_position) + "] [" + str(rendered_video_clip.composition_end) + "]")
                if int(rendered_video_clip.composition_position) not in break_points:
                    break_points.append(int(rendered_video_clip.composition_position))
                if int(rendered_video_clip.composition_end) not in break_points:
                    break_points.append(int(rendered_video_clip.composition_end))

            logger.debug("Checking master video")
            for master_video_clip in master_video_clips:
                logger.debug("Master Video [" + str(master_video_clip.composition_position) + "] [" + str(master_video_clip.composition_end) + "]")
                if int(master_video_clip.composition_position) not in break_points:
                    break_points.append(int(master_video_clip.composition_position))
                if int(master_video_clip.composition_end) not in break_points:
                    break_points.append(int(master_video_clip.composition_end))

            logger.debug("Checking rendered audio")
            for rendered_audio_clip in rendered_audio_clips:
                logger.debug("Rendered Audio [" + str(rendered_audio_clip.composition_position) + "] [" + str(rendered_audio_clip.composition_end) + "]")
                if int(rendered_audio_clip.composition_position) not in break_points:
                    break_points.append(int(rendered_audio_clip.composition_position))
                if int(rendered_audio_clip.composition_end) not in break_points:
                    break_points.append(int(rendered_audio_clip.composition_end))

            logger.debug("Checking master audio")
            for master_audio_clip in master_audio_clips:
                logger.debug("Master Audio [" + str(master_audio_clip.composition_position) + "] [" + str(master_audio_clip.composition_end) + "]")
                if int(master_audio_clip.composition_position) not in break_points:
                    break_points.append(int(master_audio_clip.composition_position))
                if int(master_audio_clip.composition_end) not in break_points:
                    break_points.append(int(master_audio_clip.composition_end))

            self.break_points = sorted(break_points)
        return self.break_points

    def get_audio_slot_by_track_type(self, track_type):
        track_type_num = int(track_type.replace("A", ''))
        return "Audio" + str(track_type_num)

    def falls_in_timeline(self, timeline, range_data):
        if (int(timeline[0]) <= int(range_data[0]) < int(timeline[1])) or (int(timeline[0]) < int(range_data[1]) <= int(timeline[1])):
            return True
        return False

    def get_video_for_range(self, frame_range):
        rendered_video_clips = self.get_rendered_video_clips()
        master_video_clips = self.get_master_video_clips()

        video_for_range = []

        for rendered_video_clip in rendered_video_clips:
            if rendered_video_clip.composition_track.startswith("V"):
                if self.falls_in_timeline(frame_range, [int(rendered_video_clip.composition_position), rendered_video_clip.composition_end]):
                    video_for_range.append(rendered_video_clip)

        for master_video_clip in master_video_clips:
            if master_video_clip.composition_track.startswith("V"):
                if self.falls_in_timeline(frame_range, [int(master_video_clip.composition_position), master_video_clip.composition_end]):
                    video_for_range.append(master_video_clip)

        return video_for_range

    def get_video_by_track_for_range(self, range_data, track_name):
        video_for_range = self.get_video_for_range(range_data)
        # First get any rendered effect
        for video_clip in video_for_range:
            if video_clip.composition_track == track_name and video_clip.get_attribute("Type") == 'renderedeffect':
                return video_clip

        # Then Check Masters
        for video_clip in video_for_range:
            if video_clip.composition_track == track_name and video_clip.get_attribute('Type') == 'masterclip':
                return video_clip

    def get_audio_by_track_for_range(self, range_data, track_name):
        audio_clips = self.get_audio_for_range(range_data)
        rendered_audio = audio_clips['rendered']
        master_audio = audio_clips['master']
        # First get any rendered effect
        for audio_clip in rendered_audio:
            if audio_clip.composition_track == track_name:
                return audio_clip

        # Then check for master
        for audio_clip in master_audio:
            if audio_clip.composition_track == track_name:
                return audio_clip

    def get_audio_for_range(self, frame_range):
        rendered_audio_clips = self.get_rendered_audio_clips()
        master_audio_clips = self.get_master_audio_clips()

        audio_clips = {}

        rendered_clips = []
        master_clips = []

        logger.debug("Getting audio for range [" + str(frame_range) + "]")
        for rendered_audio_clip in rendered_audio_clips:
            logger.debug("Considering Rendered [" + str(rendered_audio_clip.short_info()) + "]")
            if self.falls_in_timeline(frame_range, [int(rendered_audio_clip.composition_position), rendered_audio_clip.composition_end]):
                logger.debug("It Fell in the timeline")
                rendered_clips.append(rendered_audio_clip)

        for master_audio_clip in master_audio_clips:
            logger.debug("Considering Master [" + str(master_audio_clip.short_info()) + "]")
            if self.falls_in_timeline(frame_range, [int(master_audio_clip.composition_position), master_audio_clip.composition_end]):
                logger.debug("It Fell in the timeline")
                master_clips.append(master_audio_clip)

        audio_clips['rendered'] = rendered_clips
        audio_clips['master'] = master_clips

        return audio_clips

    def get_all_ranges(self):
        ranges = []
        break_points = self.get_break_points()
        logger.debug("break_points [" + str(break_points) + "]")
        for pos in range(0, len(break_points)-1, 1):
            ranges.append([break_points[pos], break_points[pos+1]])

        logger.debug("ranges [" + str(ranges) + "]")
        return ranges

    def get_workspace(self, lower_basename):
        workspaces = os.listdir(self.avid_root)
        for workspace in workspaces:
            index_of_workspace = lower_basename.lower().find(workspace.lower())
            if index_of_workspace > 0:
                return workspace

    def get_linux_path(self, file_location):
        location_basename = os.path.basename(file_location)
        lower_basename = location_basename.lower()
        workspace = self.get_workspace(lower_basename)
        lower_basename_parts = lower_basename.split(workspace.lower())
        remaining_parts = lower_basename_parts[1]
        current_path = self.avid_root + workspace

        norm_path = remaining_parts.replace("\\","/")
        remaining_path_parts = norm_path.split("/")

        for path_part in remaining_path_parts:
            if path_part == '':
                continue
            current_subfolders = os.listdir(current_path)
            for os_content in current_subfolders:
                if path_part.lower() == os_content.lower():
                    current_path = current_path + os.sep + os_content

        return current_path
