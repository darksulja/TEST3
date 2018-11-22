#!/usr/bin/python

""" Created in May 2018 for the NBC Cable MAM Project
@author: Dat Loi, Tomo Nikolovski """

import sys
import datetime

from Helpers.AnalyzeHelper import AbstractAnalyzeHelper, AnalyzeException
from Helpers.S3Helper import S3Helper, S3HelperException
from pymediainfo import MediaInfo

# Configuration Parameters
SRC_MEDIA_ACCESS_NAME = 'signiant-pmam-dev'
DST_MEDIA_NAME = 'Main'
DST_MEDIA_ACCESS_NAME = 'mediator-pmam-dev'
DST_S3_BUCKET_NAME = 'mediator-pmam-dev'
DEFAULT_OWNER = 'Default'
DEFAULT_STATE_MACHINE_NAME = 'Ingest'
DEFAULT_STATE_NAME = 'Not Available'


class AudioAnalyzeHelper(AbstractAnalyzeHelper):

    def __init__(self):
        super(AudioAnalyzeHelper, self).__init__()
        self.material_type = str(self.material_helper.get_track_types()[0])
        self.track_file = self.material_helper.get_track_file(
            self.MEDIA_NAME, self.material_type)

        # Initialize an S3 Helper object to work with the S3/Cloudian storage.
        med_client = self.mediator_helper.med_client
        src_s3_media_access_provider = med_client.media_access.get_access(DST_S3_BUCKET_NAME )['S3MediaAccessProvider']
        src_s3_access_key = src_s3_media_access_provider['Authentication']['AWSMediaAccessAuthentication']['AccessKeyId']
        src_s3_secret_key = src_s3_media_access_provider['Authentication']['AWSMediaAccessAuthentication']['SecretKey']
        src_s3_endpoint = src_s3_media_access_provider['EndPoint']
        self.s3_helper = S3Helper(access_key=src_s3_access_key, secret_key=src_s3_secret_key, endpoint=src_s3_endpoint)


    def collect_metadata(self):
        """ Collect metadata using MediaInfo. """
        self.mediator_helper.logger.info(
            'Attempting to collect metadata using MediaInfo.')
        s3_object_location = '{0}/{1}'.format(
            self.track_file['Path'], self.track_file['Name'])

        s3_presigned_url = self.s3_helper.get_presigned_url(
            DST_S3_BUCKET_NAME, s3_object_location)

        self.mediator_helper.logger.info(
            'S3 Presigned URL: {0}'.format(s3_presigned_url))
        metadata = MediaInfo.parse(s3_presigned_url)

        return metadata

    def get_audio_file_duration_from_media_info(self, track):
        """ Get the duration of an audio track from MediaInfo. """
        media_info_duration = track.duration.replace("'", "")
        # Frame rate is set to 0
        duration = str("{:0>8}".format(datetime.timedelta(
            seconds=int(media_info_duration.split(".")[0])))) + ":00"

        return duration

    def update_material_object_with_metadata(self):
        """ Update the Material Object with metadata from MediaInfo. """
        super(AudioAnalyzeHelper, self).update_material_object_with_metadata()
        metadata = self.collect_metadata()
        material = self.material_helper.material

        duration = None
        # Hard Code incode to 0 because information is not available from MediaInfo.
        incode = '00:00:00;00'

        for ttl in material['Material'].get('TrackTypeLink'):
            if ttl.get('TrackTypeName') == self.triggered_ttl:
                for track in metadata.tracks:
                    if track.track_type == 'Audio':
                        # This assumes there is a single audio track per audio file.
                        self.mediator_helper.logger.info(
                            'Found an Audio Track Type, collecting the relevant metadata.')
                        duration = self.get_audio_file_duration_from_media_info(track)
                        self.material_helper.set_duration(duration)
                        self.material_helper.set_incode(self.MEDIA_NAME, incode)
                        self.material_helper.set_short_text_value_on_ttl('Total Run Time', duration, ttl)
                        self.material_helper.set_short_text_value_on_ttl('Audio Bit Rate', track.bitrate, ttl)
                        self.material_helper.set_short_text_value_on_ttl('Sampling Rate', track.samplingrate, ttl)
                        self.material_helper.set_short_text_value_on_ttl(
                            'Number of Audio Channels', track.channels, ttl)

        outcode = duration
        self.material_helper.set_outcode(self.MEDIA_NAME, outcode)
        self.material_helper.set_encoded(self.MEDIA_NAME, True)


if __name__ == "__main__":

    try:
        audioAnalyze = AudioAnalyzeHelper()
        audioAnalyze.analyze()
        sys.exit()
    except S3HelperException as e:
        audioAnalyze.mediator_helper.logger.exception(e)
        sys.exit(1)
    except AnalyzeException as e:
        audioAnalyze.mediator_helper.logger.exception(e)
        sys.exit(1)
    except Exception as e:
        audioAnalyze.mediator_helper.logger.exception(e)
        sys.exit(1)
