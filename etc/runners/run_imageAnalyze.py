#!/usr/bin/python

""" Created in June 2018 for the NBC Cable MAM Project
@author: Tomo Nikolovski, Dat Loi """

import sys
import os
import json

from Helpers.MediatorHelper import MediatorHelper
from Helpers.AnalyzeHelper import AbstractAnalyzeHelper, AnalyzeException
from Helpers.S3Helper import S3Helper, S3HelperException

# Configuration Parameters
SRC_MEDIA_ACCESS_NAME = 'signiant-pmam-dev'
DST_MEDIA_NAME = 'Main'
DST_MEDIA_ACCESS_NAME = 'mediator-pmam-dev'
DST_S3_BUCKET_NAME = 'mediator-pmam-dev'
DEFAULT_OWNER = 'Default'
DEFAULT_STATE_MACHINE_NAME = 'Ingest'
DEFAULT_STATE_NAME = 'Not Available'


class ImageAnalyzeHelper(AbstractAnalyzeHelper):

    def __init__(self):
        """ Initialization """
        super(ImageAnalyzeHelper, self).__init__()

        # Initialize an S3 Helper object to work with the S3/Cloudian storage.
        med_client = self.mediator_helper.med_client
        src_s3_media_access_provider = med_client.media_access.get_access(DST_S3_BUCKET_NAME )['S3MediaAccessProvider']
        src_s3_access_key = src_s3_media_access_provider['Authentication']['AWSMediaAccessAuthentication']['AccessKeyId']
        src_s3_secret_key = src_s3_media_access_provider['Authentication']['AWSMediaAccessAuthentication']['SecretKey']
        src_s3_endpoint = src_s3_media_access_provider['EndPoint']
        self.s3_helper = S3Helper(access_key=src_s3_access_key, secret_key=src_s3_secret_key, endpoint=src_s3_endpoint)

    def collect_metadata(self):
        """ Collect metadata using ExifTool. """
        self.mediator_helper.logger.info('Attempting to collect metadata using ExifTool.')
        material_type = str(self.material_helper.get_track_types()[0])
        track_file = self.material_helper.get_track_file(self.MEDIA_NAME, material_type)
        #s3_bucket_name = self.s3_helper.get_bucket_name(self.MEDIA_NAME)
        file_ext = self.material_helper.material['Material']['Track'][0]['FileExtension'].lower()

        # Download the file temporarily in order to run ExifTool over it.
        temp_file_name = '{0}.{1}'.format(self.material_helper.material['Material']['MatId'], file_ext)
        s3_object_location = '{0}/{1}'.format(track_file['Path'], track_file['Name'])
        local_file_location = '{0}{1}'.format(self.temporary_directory, temp_file_name)

        self.mediator_helper.create_directory(self.temporary_directory)
        self.s3_helper.object_download(DST_S3_BUCKET_NAME, s3_object_location, local_file_location)

        self.mediator_helper.file_exist(local_file_location)
        raw_data = self.mediator_helper.run_command(['exiftool', '-j', os.path.abspath(local_file_location)])
        metadata = json.loads(raw_data)[0]

        # Delete the temporary file.
        self.mediator_helper.delete_file(local_file_location)

        return metadata


    def update_material_object_with_metadata(self):
        """ Update the Material Object with metadata from MediaInfo and ExifTool. """
        super(ImageAnalyzeHelper, self).update_material_object_with_metadata()
        metadata = self.collect_metadata()
        material = self.material_helper.material

        duration = '00:00:00;01'
        incode = '00:00:00;00'  # Hard Code incode to 0 because information is not available from MediaInfo.
        outcode = '00:00:00;01'
        
        self.material_helper.set_duration(duration)
        self.material_helper.set_incode(self.MEDIA_NAME, incode)
        self.material_helper.set_outcode(self.MEDIA_NAME, outcode)
        self.material_helper.set_encoded(self.MEDIA_NAME, True)


        for ttl in material['Material'].get('TrackTypeLink'):
            if ttl.get('TrackTypeName') == self.triggered_ttl:
                self.material_helper.set_short_text_value_on_ttl('Display Width', metadata.get('ImageWidth'), ttl)
                self.material_helper.set_short_text_value_on_ttl('Display Height', metadata.get('ImageHeight'), ttl)
                self.material_helper.set_short_text_value_on_ttl('Date Created', metadata.get('DateCreated'), ttl)
                self.material_helper.set_short_text_value_on_ttl('Serial #', metadata.get('SerialNumber'), ttl)
                self.material_helper.set_short_text_value_on_ttl('Firmware', metadata.get('Firmware'), ttl)
                self.material_helper.set_short_text_value_on_ttl('Contrast', metadata.get('Contrast2012'), ttl)
                self.material_helper.set_short_text_value_on_ttl('Creator', metadata.get('Creator'), ttl)
                self.material_helper.set_short_text_value_on_ttl('Longitude', metadata.get('GPSLongitude'), ttl)
                self.material_helper.set_short_text_value_on_ttl('Latitude', metadata.get('GPSLatitude'), ttl)
                self.material_helper.set_short_text_value_on_ttl('ISO', metadata.get('ISO'), ttl)
                self.material_helper.set_tag_value_on_ttl('ICC Profile', metadata.get('ICCProfileName'), ttl) #causes problems as well for some images
                self.material_helper.set_tag_value_on_ttl('White Balance', metadata.get('WhiteBalance'), ttl)
                self.material_helper.set_tag_value_on_ttl('Exposure Program', metadata.get('ExposureProgram'), ttl)
                self.material_helper.set_tag_value_on_ttl('Aperture', metadata.get('ApertureValue'), ttl)
                self.material_helper.set_tag_value_on_ttl('Shutter', metadata.get('ShutterSpeedValue'), ttl)
                self.material_helper.set_tag_value_on_ttl('Exposure Compensation', metadata.get('ExposureCompensation'), ttl)
                self.material_helper.set_tag_value_on_ttl('Flash Compensation', metadata.get('FlashCompensation'), ttl)
                self.material_helper.set_tag_value_on_ttl('Color Space', metadata.get('ColorSpace'), ttl)
                self.material_helper.set_tag_value_on_ttl('Compression Mode', metadata.get('Compression'), ttl)
                self.material_helper.set_tag_value_on_ttl('Camera Model', metadata.get('Model'), ttl)
                self.material_helper.set_tag_value_on_ttl('Lens (mm)', metadata.get('LensInfo', '').split(' ')[0], ttl) #THIS CAUSES PROBLEMS FOR SOME IMGS
                # Orientation
                if metadata.get('Orientation') is None:
                    image_height = metadata.get('ImageHeight')
                    image_width = metadata.get('ImageWidth')
                    if image_height == image_width:
                        self.material_helper.set_tag_value_on_ttl('Orientation', 'Square', ttl)
                    elif image_height > image_width:
                        self.material_helper.set_tag_value_on_ttl('Orientation', 'Portrait', ttl)
                    else:
                        self.material_helper.set_tag_value_on_ttl('Orientation', 'Landscape', ttl)
                else:
                    self.material_helper.set_tag_value_on_ttl('Orientation', metadata.get('Orientation'), ttl)
                # The Territory should be composed of both, Location Name and Code. Ex. Germany-DEU
                territory_name = metadata.get('Country-PrimaryLocationName')
                territory_code = metadata.get('Country-PrimaryLocationCode')
                if territory_name and territory_code:
                    territory_tag = '{0}-{1}'.format(territory_name, territory_code)
                    self.material_helper.set_tag_value_on_ttl('Territory', territory_tag, ttl)

if __name__ == "__main__":

    try:
        imageAnalyze = ImageAnalyzeHelper()
        imageAnalyze.analyze()
        sys.exit()
    except S3HelperException as e:
        imageAnalyze.mediator_helper.logger.exception(e)
        sys.exit(1)
    except AnalyzeException as e:
        imageAnalyze.mediator_helper.logger.exception(e)
        sys.exit(1)
    except Exception as e:
        imageAnalyze.mediator_helper.logger.exception(e)
        sys.exit(1)
