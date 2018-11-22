#!/usr/bin/python

""" Created in May 2018 for the NBC Cable MAM Project.
@author: Craig Sloggett, Tomo Nikolovski """

import sys

from Helpers.MediatorHelper import MediatorHelper
from Helpers.AnalyzeHelper import AbstractAnalyzeHelper, AnalyzeException
from Helpers.S3Helper import S3Helper, S3HelperException
from evertz.public import (AmountOfTime, FrameLabel)
from pymediainfo import MediaInfo

# Configuration Parameters
SRC_MEDIA_ACCESS_NAME = 'signiant-pmam-dev'
DST_MEDIA_NAME = 'Main'
DST_MEDIA_ACCESS_NAME = 'mediator-pmam-dev'
DST_S3_BUCKET_NAME = 'mediator-pmam-dev'
DEFAULT_OWNER = 'Default'
DEFAULT_STATE_MACHINE_NAME = 'Ingest'
DEFAULT_STATE_NAME = 'Not Available'


class VideoAnalyzeHelper(AbstractAnalyzeHelper):

    def __init__(self):
        """ Initialization """
        super(VideoAnalyzeHelper, self).__init__()
        # Initialize an S3 Helper object to work with the S3/Cloudian storage.
        med_client = self.mediator_helper.med_client
        src_s3_media_access_provider = med_client.media_access.get_access(DST_MEDIA_ACCESS_NAME )['S3MediaAccessProvider']
        src_s3_access_key = src_s3_media_access_provider['Authentication']['AWSMediaAccessAuthentication']['AccessKeyId']
        src_s3_secret_key = src_s3_media_access_provider['Authentication']['AWSMediaAccessAuthentication']['SecretKey']
        src_s3_endpoint = src_s3_media_access_provider['EndPoint']
        self.s3_helper = S3Helper(access_key=src_s3_access_key, secret_key=src_s3_secret_key, endpoint=src_s3_endpoint)

    def collect_metadata(self):
        """ Collect metadata using MediaInfo. """
        self.mediator_helper.logger.info('Attempting to collect metadata using MediaInfo.')
        material_type = 'Video'
        track_file = self.material_helper.get_track_file(self.MEDIA_NAME, material_type)
        #s3_bucket_name = self.s3_helper.get_bucket_name(self.MEDIA_NAME)

        s3_object_location = '{0}/{1}'.format(track_file['Path'], track_file['Name'])
        s3_presigned_url = self.s3_helper.get_presigned_url(DST_S3_BUCKET_NAME , s3_object_location)

        metadata = MediaInfo.parse(s3_presigned_url)
        self.mediator_helper.logger.info("\n\n********************\n\n")
        self.mediator_helper.logger.info(str(metadata.to_json()))
        self.mediator_helper.logger.info("\n\n********************\n\n")

        return metadata
        
    def codec_tag_save(self, video_or_audio, codec):
        """ Saves a new or existing codec"""
        med_client = self.mediator_helper.med_client
        command = {
          "Subsystem": "tag",
          "Method": "save",
          "ParameterList": {
            "tagType": video_or_audio + " Codec",
            "value": codec
          }
        }
        response = med_client.wscall(command)

    def audio_channels_validation(self, material, metadata):
        """ Compare the total number of audio channels on the file vs. the track type links. """
        total_number_of_file_audio_channels = 0
        for track in metadata.tracks:
            if track.track_type == 'Audio':
                total_number_of_file_audio_channels += int(track.channels)

        self.mediator_helper.logger.info('Number of audio channels on the file: {0}'.format(total_number_of_file_audio_channels))

        total_number_of_ttl_audio_channels = 0
        for ttl in material['Material'].get('TrackTypeLink'):
            if ttl.get('TrackType').get('ClassId') == 'AUDIO':
                total_number_of_ttl_audio_channels += self.material_helper.get_number_of_channels(ttl.get('TrackTypeName'))

        self.mediator_helper.logger.info('Number of audio channels on the TTLs: {0}'.format(total_number_of_ttl_audio_channels))

        if total_number_of_file_audio_channels != total_number_of_ttl_audio_channels:
            self.comments.append({'TrackTypeName': self.material_helper.get_track_types()[0],
                                  'CommentTypeName': 'Analyze',
                                  'Detail': 'Invalid Audio Layout Mapping. Mediainfo: {0}, TTLs: {1}'.
                                 format(total_number_of_file_audio_channels, total_number_of_ttl_audio_channels)})

    def update_material_object_with_metadata(self):
        """ Update the Material Object with metadata from MediaInfo. """
        super(VideoAnalyzeHelper, self).update_material_object_with_metadata()
        metadata = self.collect_metadata()
        duration = None  # Used to check if the duration has been set.
        incode = None  # Used to check if either: 1) the incode has been set, OR 2) the material has a valid duration
        material = self.material_helper.material
        self.mediator_helper.logger.info('The track type link that triggered the job{0}'.format(self.triggered_ttl))
        for ttl in material['Material'].get('TrackTypeLink'):
            if ttl.get('TrackTypeName') == self.triggered_ttl:
                for track in metadata.tracks:
                    if track.track_type == 'Video':
                        self.mediator_helper.logger.info('Found a Video Track Type, collecting the relevant metadata.')
                        duration = AmountOfTime.parse_frames(self.material_helper.get_frame_rate_object(), int(track.framecount))
                        self.material_helper.set_duration(duration.as_text())
                        self.material_helper.set_short_text_value_on_ttl('Total Run Time', duration.as_text(), ttl)
                        self.material_helper.set_short_text_value_on_ttl('Video Bit Rate', track.bitrate, ttl)
                        self.material_helper.set_short_text_value_on_ttl('Video Bit Depth', track.bitdepth, ttl)
                        self.material_helper.set_short_text_value_on_ttl('Display Height', track.height, ttl)
                        self.material_helper.set_short_text_value_on_ttl('Display Width', track.width, ttl)
                        self.material_helper.set_tag_value_on_ttl('Video Codec', track.codecid, ttl)
                        self.codec_tag_save('Video', str(track.codecid))
                        self.material_helper.set_aspect_ratio(AbstractAnalyzeHelper.calculate_aspect_ratio(track.width, track.height))

                    if track.track_type == 'Audio':
                        self.mediator_helper.logger.info('Found an Audio Track Type, collecting the relevant metadata.')
                        self.material_helper.set_short_text_value_on_ttl('Audio Bit Rate', track.bitrate, ttl)
                        self.material_helper.set_short_text_value_on_ttl('Audio Bit Depth', track.bitdepth, ttl)
                        self.material_helper.set_short_text_value_on_ttl('Sampling Rate', track.samplingrate, ttl)
                        self.material_helper.set_tag_value_on_ttl('Audio Codec', track.codecid, ttl)
                        self.codec_tag_save('Audio', str(track.codecid))
                    if track.track_type == 'Other' and track.type == 'Time code':
                        incode = FrameLabel.parse_text(self.material_helper.get_frame_rate_object(), track.timecode_firstframe)

                        self.material_helper.set_incode(self.MEDIA_NAME, incode.as_text())

                    if track.track_type == 'General':
                        self.material_helper.set_short_text_value_on_ttl('Wrapper', track.fileextension.split('?')[0].lower(), ttl)
                        self.material_helper.set_short_text_value_on_ttl('Number of Audio Channels', track.audiocount, ttl)
        #As long as the track has either 1) "Time code" AND duration OR 2) the marterial has a valid duration, the tracks will be encoded
        if incode and duration:
            outcode = (duration + incode) - FrameLabel.parse_frames(duration.get_rate(), 1)
        else:
            if duration:
                incode = duration - duration #implicitly set to 00:00:00:00 incode
                outcode = duration + incode
            else:
                self.cleanup_on_error('Unable to determine time code information.')
                raise AnalyzeException('Unable to determine time code information.')

        self.material_helper.set_outcode(self.MEDIA_NAME, outcode.as_text())
        self.material_helper.set_encoded(self.MEDIA_NAME, True)

        self.audio_channels_validation(material, metadata)


if __name__ == "__main__":

    try:
        videoAnalyze = VideoAnalyzeHelper()
        videoAnalyze.analyze()
        sys.exit()
    except S3HelperException as e:
        videoAnalyze.mediator_helper.logger.error(e)
        sys.exit(1)
    except AnalyzeException as e:
        videoAnalyze.mediator_helper.logger.exception(e)
        sys.exit(1)
    except Exception as e:
        videoAnalyze.mediator_helper.logger.exception(e)
        sys.exit(1)
