'''
Created on Nov 23, 2017

@author: Jeff Kalbfleisch
'''
import logging
import json
logger = logging.getLogger(__name__)


class AvidClip:

    def __init__(self, avid_data=None):
        self.avid_data = avid_data
        self.interplay_uri = avid_data.get('InterplayURI', '')
        self.segment_mark_in = avid_data.get('SegmentMarkIn', '')
        self.segment_duration = avid_data.get('SegmentDuration', '')
        self.segment_end = int(self.segment_mark_in) + int(self.segment_duration)
        self.segment_track = avid_data.get('SegmentTrack', '')
        self.segment_file_mob_id = avid_data.get('SegmentFileMOB', '')
        self.segment_start_offset = avid_data.get('SegmentStartOffset', '')
        self.composition_position = avid_data.get('CompositionPosition', '')
        self.composition_track = avid_data.get('CompositionTrack', '')
        self.composition_duration = avid_data.get('CompositionDuration', '')

        self.composition_end = int(self.composition_position) + int(self.composition_duration)
        self.expected_number_of_tracks = 0

        self.avid_attributes = avid_data.get('AssetDescription', '').get('Attributes', '').get('Attribute', '')

        self.attributes = {}
        for avid_attribute in self.avid_attributes:
            self.attributes[avid_attribute.get("@Name", "")] = avid_attribute.get("#text", "")

        self.clip_duration = self.composition_duration
        self.next_clip_start = None
        self.file_locations = None

    def get_attribute(self, attribute_key):
        for avid_attribute in self.avid_attributes:
            if avid_attribute.get("@Name", "") == attribute_key:
                return avid_attribute.get("#text", "")
        return None

    def get_track_names(self, tracks_string):
        track_string_parts = tracks_string.split()
        track_names = []
        track_names.append(track_string_parts[0])
        if len(track_string_parts) > 1:
            audio_tracks = track_string_parts[1]
            audio_tracks = audio_tracks.replace("A", "")
            audio_track_integers = audio_tracks.split("-")
            for i in range(int(audio_track_integers[1])):
                track_names.append("A" + str(i+1))
        return track_names

    def __str__(self):
        message = "\n    Composition Position [" + str(self.composition_position) + "]"
        message += "\n    Clip Duration [" + str(self.clip_duration) + "]"
        message += "\n    InterplayURI [" + str(self.interplay_uri) + "]"
        message += "\n    Segment Mark In [" + str(self.segment_mark_in) + "]"
        message += "\n    Segment Duration [" + str(self.segment_duration) + "]"
        message += "\n    Segment End [" + str(self.segment_end) + "]"

        message += "\n    Segment Track [" + str(self.segment_track) + "]"
        message += "\n    Segment File Mob Id [" + str(self.segment_file_mob_id) + "]"
        message += "\n    Segment Start Offset [" + str(self.segment_start_offset) + "]"

        message += "\n    Composition Track [" + str(self.composition_track) + "]"
        message += "\n    Composition Duration [" + str(self.composition_duration) + "]"

        message += "\n\n    Attributes"

        for avid_attribute in self.avid_attributes:
            message += "\n    [" + avid_attribute.get("@Name", "") + "] => [" + avid_attribute.get("#text", "") + "]"

        if self.file_locations is not None:
            for track_name, file_location in self.file_locations.iteritems():
                message += "\n\n    File Location [" + str(track_name) + "]"
                message += "\n    ----------------------------------------------------------"
                message += "\n    Interplay URI => [" + str(file_location.get('InterplayURI', '')) + "]"
                message += "\n    Name => [" + str(file_location.get('Name', '')) + "]"
                message += "\n    Track => [" + str(file_location.get('Track', '')) + "]"
                message += "\n    Status => [" + str(file_location.get('Status', '')) + "]"
                message += "\n    FilePath => [" + json.dumps(file_location.get('FilePath', '')) + "]"
                message += "\n    Type => [" + str(file_location.get('Type', '')) + "]"
                message += "\n    CreatedBy => [" + str(file_location.get('CreatedBy', '')) + "]"
                message += "\n    Format => [" + str(file_location.get('Format', '')) + "]"
                message += "\n    Size => [" + str(file_location.get('Size', '')) + "]"

        return message

    def short_info(self):
        message = "\n------------------------------------------------------------------"
        message += "\n                             " + str(self.get_attribute("Type")) + " -> [" + str(self.composition_position).zfill(6) + "][" + str(self.composition_end).zfill(6) + "]"
        message += "\n                             Segment [" + str(self.segment_mark_in) + "-" + str(self.segment_end) + "] -> " + str(self.segment_duration)
        message += "\n                             TRACK : COMP [" + str(self.composition_track) + "] SEG [" + str(self.segment_track) + "]"
        message += "\n                             SEGMENT (ClipFile Position): [" + str(self.segment_mark_in).zfill(6) + ", " + str(self.segment_end).zfill(6) + "] [" + str(self.segment_duration).zfill(6) + "]"
        message += "\n                             CLIP DURATION : [" + str(self.composition_duration).zfill(6) + "]"
        message += "\n                             TRACKS : [" + str(self.get_attribute("Tracks")) + "]"
        message += "\n                             Media Status : [" + str(self.get_attribute("Media Status")) + "]"

        if self.file_locations is not None:
            for track_name, file_location in self.file_locations.iteritems():
                message += "\n                             FilePath [" + track_name + "] => [" + json.dumps(file_location.get('FilePath', '')) + "]"
        message += "\n------------------------------------------------------------------"
        return message


    def get_clip_definition(self):
       clip_def = {'AvidData': self.avid_data}
       clip_def['Files'] = self.file_locations
       return clip_def

    def set_file_locations(self, file_locations):
        file_location_dict = {}
        for file_location in file_locations:
            track_name = file_location.get('Track', '')
            file_location_dict[track_name] = file_location
        self.file_locations = file_location_dict

    def get_file_location(self, track_name):
        for fl_track_name, file_location in self.file_locations.iteritems():
            if track_name == fl_track_name:
                return file_location
        return None

    def show_file_location(self, track_name):
        logger.debug("File Location : " + json.dumps(self.file_locations[track_name]))

    def add_file_location(self, track_name, file_location):
        self.file_locations[track_name] = file_location

    def get_num_audio_tracks(self):
        num_audios = 0
        for track_name, file_location in self.file_locations.iteritems():
            logger.debug("File Location : " + str(file_location))
            if "A" in track_name:
                num_audios += 1
        return num_audios

    def get_audio_file_locations(self):
        audio_file_locations = []
        for track_name, file_location in self.file_locations.iteritems():
            if "A" in track_name:
                audio_file_locations.append(file_location)
        return audio_file_locations

    def get_video_file_location(self):
        for track_name, file_location in self.file_locations.iteritems():
            if "V" in track_name:
                return file_location
        return None

    def has_correct_number_of_tracks(self):
        track_count = 0
        for track_name, file_location in self.file_locations.iteritems():
            track_count += 1

        if track_count == self.expected_number_of_tracks:
            return True
        return False
