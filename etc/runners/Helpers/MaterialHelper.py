""" Created in May 2018 for the NBC Cable MAM Project.
@author: Craig Sloggett, Ian Wiggins """

import json
from datetime import datetime
from collections import OrderedDict
from evertz.mediator.webservice import MediatorException
from evertz.public import FrameRate
from Helpers.MediatorHelper import MediatorHelper


class MaterialHelper:

    def __init__(self, med_client, matid_or_material_object, construct_from_existing_material_object=False):
        """ 2 Branch Constructor.
            The two branches are differentiated by the <construct_from_existing_material_object> flag.

            if <construct_from_existing_material_object> is False (Default):
                <matId_or_material_object> is assumed to be a MatId and the <med_client> is used to perform a
                Material Get command in order to populate an internal material object.

            if <construct_from_existing_material_object> is True:
                <matId_or_material_object> is assumed to be a Material object  from an external source such as a
                Material Get command or a job description and the internal material object is populated using its data.
                A material object is a dictionary/JSON object such as the one returned from a standard Material Get. """

        self.med_client = med_client
        self.mediator_helper = MediatorHelper()
        if construct_from_existing_material_object is True:
            """ This version of the constructor treats <matid_or_material_object> as a material object,
                and populates the internal material object using its data. """

            self.material = matid_or_material_object

        else:
            """ This version of the constructor treats <matid_or_material_object> as a MatId,
                and uses a Material Get command on that MatId in order to populate the internal material object. """

            self.material = {
                'Material': med_client.material.get(matid_or_material_object,
                                                    ['tracks', 'shorttext', 'tag', 'trackTypeLinks', 'history'])}

            if not self.material['Material']:
                raise MediatorException('Material Id does not exist in the system.')

    def __str__(self):
        return json.dumps(self.material, sort_keys=True, indent=4)

    def material_save(self):
        """ Save the Material Object. """
        self.med_client.material.save(self.material)

    def get_material_type(self):
        return self.material['Material'].get('MaterialType', None)

    def get_media_type_shorttext(self):
        short_text_list = self.material['Material']['ShortTextList']['ShortText']
        for short_text in short_text_list:
            if short_text['ShortTextType'] == 'Media Type':
                return short_text['Value']
        return None

    def get_frame_rate_object(self):
        """ Get the FrameRate Object based on the current Material's frame rate. """
        frame_rate = self.material['Material']['FrameRate']
        frame_rate_map = {
            'DF30': FrameRate.DF30,
            'DF60': FrameRate.DF60,
            'NDF25': FrameRate.NDF25,
            'P23_976': FrameRate.P23_976
        }

        return frame_rate_map.get(str(frame_rate))

    def get_track_types_to_upload_against(self, material, file_name):
        """ Return a list of Track Types that have a given file name registered against them. """
        track_types = []
        for track_type_link in material['Material']['TrackTypeLink']:
            for short_text in track_type_link['ShortTextList']['ShortText']:
                if short_text['ShortTextType'] == 'File Name':
                    if short_text['Value'] == file_name:
                        track_types.append(track_type_link['TrackTypeName'])
        return track_types

    def get_track_types(self):
        """ Return a list of Track Types from the Material Object's Track Type Links. """
        track_types = []
        for track_type_link in self.material['Material']['TrackTypeLink']:
            track_types.append(track_type_link['TrackTypeName'])

        return track_types

    def get_track(self, media_name):
        """ Return the Track Object corresponding to a given Media Name. """
        track = [track for track in self.material['Material']['Track']
                 if track['MediaName'] == media_name]

        return track[0]  # Return the first entry of the resulting list comprehension.

    def get_track_definition(self, media_name, track_type_name):
        """ Return the TrackDefinition Object corresponding to a given TrackTypeName. """
        track = self.get_track(media_name)
        track_definition = [track_definition for track_definition in track['TrackDefinition']
                            if track_definition['TrackTypeName'] == track_type_name]

        return track_definition[0]  # Return the first entry of the resulting list comprehension.

    def get_track_file(self, media_name, track_type_name):
        """ Return a TrackFile Object specified by TrackTypeName and Media. """
        track_definition = self.get_track_definition(media_name, track_type_name)

        return track_definition['TrackFile']

    def has_track_type_class(self, track_type_class):
        """ Return a flag to indicate if the Material contains track types of a certain class (AUDIO, VIDEO, etc.). """
        has_track_type_class = False

        track_types = self.get_track_types()

        for track_type_name in track_types:
            if self.mediator_helper.get_track_type_class_id(track_type_name) == track_type_class:
                has_track_type_class = True

        return has_track_type_class

    def get_short_text_value(self, short_text_type):
        """ Return the value of the given ShortTextType.
            If the ShortTextList is unpopulated (such as if the alternate constructor
            was used) then return None."""
        if 'ShortTextList' not in self.material['Material']:
            return None

        short_text_value = None
        for short_text in self.material['Material']['ShortTextList']['ShortText']:
            if short_text['ShortTextType'] == short_text_type:
                short_text_value = short_text['Value']

        return short_text_value

    def get_tag_value(self, tag_type):
        """ Return the value of the given ShortTextType. """
        tag_value = None
        for tag in self.material['Material']['TagList']['Tag']:
            if tag['TagType'] == tag_type:
                tag_value = tag['Value']

        return tag_value

    def get_latest_workflow_state(self):
        """ Return the most recent Workflow State History object. """
        state_history = self.material['Material']['StateHistoryGroup']
        time_occurrences = []
        for to in state_history:
            time_occurrences.append(datetime.strptime(to['TimeOccurred'], '%Y-%m-%dT%H:%M:%S.%f'))

        most_recent_index = time_occurrences.index(max(time_occurrences))

        return state_history[most_recent_index]['FromState']

    def set_duration(self, duration):
        """ Set the Material Duration. """
        del self.material['Material']['Duration']['Nanos']
        self.material['Material']['Duration'] = {
            'Rate': self.get_frame_rate_object().rate,
            'Time': duration
        }

    def get_duration(self):
        """ Get the Material Duration. """
        return self.material['Material']['Duration']['Time']

    def set_aspect_ratio(self, aspect_ratio):
        """ Set the Material Aspect Ratio. """
        self.material['Material']['AspectRatio'] = aspect_ratio

    def set_incode(self, media_name, incode):
        """ Set the Material Incode. """
        track = self.get_track(media_name)
        track.update({
            'Incode': {
                'Rate': self.get_frame_rate_object().rate,
                'Text': incode
            }
        })

    def set_outcode(self, media_name, outcode):
        """ Set the Material Outcode. """
        track = self.get_track(media_name)
        track.update({
            'Outcode': {
                'Rate': self.get_frame_rate_object().rate,
                'Text': outcode
            }
        })

    def get_incode(self, media_name):
        """ Get incode from a Material track. """
        try:
            track = self.get_track(media_name)
            return track['Incode']['Text']
        except IndexError:
            return None

    def get_outcode(self, media_name):
        """ Get outcode from a Material track. """
        try:
            track = self.get_track(media_name)
            return track['Outcode']['Text']
        except IndexError:
            return None

    def set_encoded(self, media_name, encoded):
        """ Set the Material Track Encoded Value. """
        track = self.get_track(media_name)
        track['Encoded'] = encoded

    def set_short_text_value(self, short_text_type, value):
        """ Determine if a ShortTextType exists, then update the value accordingly. """

        if value is None:
            string_value = None
        else:
            string_value = str(value)

        if 'ShortTextList' not in self.material['Material']:
            self.material['Material']['ShortTextList'] = {'ShortText': [{
                'ShortTextType': short_text_type,
                'Value': string_value
            }]}
        else:
            short_text_list = self.material['Material']['ShortTextList']['ShortText']
            matched = [st for st in short_text_list if st['ShortTextType'] == short_text_type]
            if len(matched) > 0:
                matched[0]['Value'] = string_value
            else:
                short_text_list.append({
                    'ShortTextType': short_text_type,
                    'Value': string_value
                })

    def set_tag_value(self, tag_type, value):
        """ Determine if a TagType exists, then update the value accordingly. """

        if value is None:
            string_value = None
        else:
            string_value = str(value)

        self.material['Material']['TagList'] = self.material['Material'].get('TagList', {'Tag': []})
        tag_list = self.material['Material']['TagList']['Tag']
        matched = [tag for tag in tag_list if tag['TagType'] == tag_type]
        if len(matched) > 0:
            matched[0]['Value'] = string_value
        else:
            tag_list.append({
                'TagType': tag_type,
                'Value': string_value
            })

    def set_material_type(self, material_type):
        self.material['Material']['MaterialType'] = material_type

    def set_owner(self, owner):
        """Takes a string name and saves it as the owner of this material."""
        self.material['Material']['Owner'] = [{'Name': owner}]

    def set_frame_rate(self, frame_rate_str):
        self.material['Material']['FrameRate'] = frame_rate_str

    def set_short_text_value_on_ttl(self, short_text_type, value, ttl_obj):
        """ Determine if a ShortTextType on a ttl exists, then update the value accordingly. """
        if not any([st.get('ShortTextType') == short_text_type for st in ttl_obj['ShortTextList']['ShortText']]) and value is not None:
            # The short text type on the tll already exists, assuming we do not need to update
            ttl_obj['ShortTextList']['ShortText'].append({'ShortTextType': short_text_type, 'Value': str(value)})

    def set_tag_value_on_ttl(self, tag_type, value, ttl_obj):
        """ Determine if a TagType on a ttl exists, then update the value accordingly if it does not exist. """
        if not any([tag.get('TagType') == tag_type for tag in ttl_obj['TagList']['Tag']]) and value is not None:
            ttl_obj['TagList']['Tag'].append({'TagType': tag_type, 'Value': str(value)})
        """ Saves a new or existing tags"""
        if str(value):
            command = {
              "Subsystem": "tag",
              "Method": "save",
              "ParameterList": {
                "tagType": str(tag_type),
                "value": str(value)
              }
            }
            response = self.med_client.wscall(command)

    def set_track_type_link_short_text_value(self, material, track_type_name, short_text_type, value):
        """ Determine if a ShortTextType exists, then update the value accordingly. """
        short_text_type_exists = False  # Determine if the short text type exists before we update anything.
        for i, track_type_link in enumerate(material['Material']['TrackTypeLink']):
            if track_type_link['TrackTypeName'] == track_type_name:
                index = i  # Keep track of the index of the track type name in question.
                for short_text in track_type_link['ShortTextList']['ShortText']:
                    if short_text['ShortTextType'] == short_text_type:
                        # The Short Text Type exists, and most likely has a value set already.
                        short_text_type_exists = True
                        break
        if not short_text_type_exists:
            # Create a new short text type on the track type link.
            material['Material']['TrackTypeLink'][index]['ShortTextList']['ShortText'].append({'ShortTextType': short_text_type, 'Value': str(value)})

    def set_material_short_text_value(self, material, short_text_type, value):
        """ Determine if a ShortTextType exists, then update the value accordingly. """
        if value is not None:
            if 'ShortTextList' not in material['Material']:
                material['Material']['ShortTextList'] = {'ShortText': [{'ShortTextType': short_text_type, 'Value': str(value)}]}
            else:
                short_text_list = material['Material']['ShortTextList']['ShortText']
                matched = [st for st in short_text_list if st['ShortTextType'] == short_text_type]
                if len(matched) > 0:
                    matched[0]['Value'] = str(value)
                else:
                    short_text_list.append({'ShortTextType': short_text_type, 'Value': str(value)})

    def ttls_in_not_available(self, material):
        """ Check if any of the TTLs in the material are in "Not Available" state """
        material_helper = MaterialHelper(self.mediator_helper.med_client, material)
        for track_type_name in material_helper.material['Material']['TrackTypeLink']:
            if track_type_name['StateName'] == 'Not Available':
                return True
        return False

    def get_number_of_channels(self, track_type_name):
        """ Determine the number of audio channels based on the track type name. """
        if 'Mono' in track_type_name:
            return 1
        if 'Stereo' in track_type_name or 'Surround' in track_type_name or \
                'Audio Description English (US)' in track_type_name or 'OrginalAudio' in track_type_name:
            return 2
        else:
            return 0

    def build_default_track_definitions(self, track_types, audio_layout):
        """ Return a list of Track Definitions that can be added to a Material Object. """
        track_definitions = []
        file_position = 1
        position = 2

        for track_type_name in track_types:
            class_id = self.med_client.generic_call("trackType", "get", trackTypeName=track_type_name)['TrackType']['ClassId']
            if class_id == 'AUDIO':
                number_of_audio_channels = audio_layout[track_type_name] if bool(audio_layout) \
                    else self.get_number_of_channels(track_type_name)

                track_definitions.append({
                    'TrackTypeName': track_type_name,
                    'Position': position,
                    'FilePosition': file_position,
                    'Channels': number_of_audio_channels
                })
                position += 1
                file_position += number_of_audio_channels
            else:
                track_definitions.append({
                    'TrackTypeName': track_type_name,
                    'Position': 1,
                    'FilePosition': 0,
                    'Channels': 0
                })

        return track_definitions

    def generate_audio_layout(self, media_info_metadata):
        """ Generate Audio Layout map based on the Mediainfo audio streams metadata. """
        audio_layout_map = OrderedDict()
        index = 1
        for track in media_info_metadata.tracks:
            if track.track_type == 'Audio':
                audio_layout_map.update({'OriginalAudio{0}'.format(index): int(track.channels)})
                index += 1

        return audio_layout_map

    def build_original_audio_ttls(self, material, audio_layout_map, src_file_name, default_state_machine_name, default_state_name):
        """Build Audio Tracks based on the Mediainfo audio streams on the file. """
        index = 1
        track_type = ''
        for track_type_name, num_of_channels in audio_layout_map.iteritems():
            material['Material']['TrackTypeLink'].append({})
            material['Material']['TrackTypeLink'][index]['TrackTypeName'] = track_type_name
            material['Material']['TrackTypeLink'][index]['StateMachine'] = default_state_machine_name
            material['Material']['TrackTypeLink'][index]['StateName'] = default_state_name
            material['Material']['TrackTypeLink'][index]['ShortTextList'] = {'ShortText': [{'ShortTextType': 'File Name', 'Value': src_file_name}]}
            index += 1

        return material
