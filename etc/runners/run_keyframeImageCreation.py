#!/usr/bin/python

""" Created on 20th of June 2018 for the NBC Cable MAM Project
@author: Tomo Nikolovski, Dat Loi """

import sys

from Helpers.S3Helper import S3Helper, S3HelperException
from Helpers.AnalyzeHelper import AbstractAnalyzeHelper, AnalyzeException

MAT_CARD_KF_WIDTH = '448'
TRIPTYCH_KF_WIDTH = '48'
RESIZED_IMAGE_HEIGHT = '-1'  # When set to -1, FFmpeg is going to scale by keeping the same aspect ratio of the image.
MAT_CARD_KF_NAME_PATTERN = '_00000100-448'
TRIPTYCH_KF_NAME_PATTERN = '_00000000-48'
KF_EXT = 'jpg'


class KeyFrameImageCreation(AbstractAnalyzeHelper):

    def __init__(self):
        """ Initialization """
        super(KeyFrameImageCreation, self).__init__()
        self.src_cloudian_helper = S3Helper(access_key='105e4c431859c32470f1',
                                            secret_key='h8Swk1WfCPoRZbEbK6kPhkPF5jRFHVXcvh4GSvDe',
                                            endpoint='http://s3-prodmam.mediasys.io')
        self.dst_s3_helper = S3Helper()
        #self.s3_bucket_name = self.src_cloudian_helper.get_bucket_name(self.MEDIA_NAME)

    def update_material_object_with_metadata(self):
        pass
    
    def collect_metadata(self):
        pass

    def resize_image(self, file, width, height, destination_file):
        """ Resize an image using FFmpeg tool. """
        self.mediator_helper.file_exist(file)
        self.mediator_helper.logger.info('File here {0}'.format(file))
        self.mediator_helper.run_command(['ffmpeg -y -i {0} -vf scale={1}:{2} {3}'.format(file, width, height, destination_file)], shell_flag=True)

    def create_keyframe(self):
        self.mediator_helper.logger.info('Attempting to create keyframe')
        material_type = str(self.material_helper.get_track_types()[0])
        track_file = self.material_helper.get_track_file(self.MEDIA_NAME, material_type)
        cloudian_bucket_name = 'mediator-pmam-dev'
        s3_bucket_name = 'mediator-s3-pmam-dev'
        file_ext = self.material_helper.material['Material']['Track'][0]['FileExtension'].lower()

        # Download the file
        temp_file_name = '{0}.{1}'.format(self.material_helper.material['Material']['MatId'], file_ext)
        s3_object = '{0}/{1}'.format(track_file['Path'], track_file['Name'])
        local_file_location = '{0}{1}'.format(self.temporary_keyframes_directory, temp_file_name)

        self.mediator_helper.create_directory(self.temporary_keyframes_directory)
        self.src_cloudian_helper.object_download(cloudian_bucket_name, s3_object, local_file_location)

        # Generate two keyframes of the original image. One for the material card, other for the triptych.
        self.mediator_helper.logger.info('{0}{1}.{2}'.format(local_file_location.split('.')[0], MAT_CARD_KF_NAME_PATTERN, KF_EXT))

        self.resize_image(local_file_location, MAT_CARD_KF_WIDTH, RESIZED_IMAGE_HEIGHT, '{0}{1}.{2}'.format(local_file_location.split('.')[0],
                                                                                                            MAT_CARD_KF_NAME_PATTERN,
                                                                                                            KF_EXT))
        self.resize_image(local_file_location, TRIPTYCH_KF_WIDTH, RESIZED_IMAGE_HEIGHT, '{0}{1}.{2}'.format(local_file_location.split('.')[0],
                                                                                                            TRIPTYCH_KF_NAME_PATTERN,
                                                                                                            KF_EXT))

        # Upload the keyframe files to the S3 Bucket.
        mat_card_kf_s3_object = '{0}/{1}/{2}/{2}{3}.{4}'.format(track_file['Path'].split('/')[0], self.BROWSE_MEDIA, self.mat_id,
                                                                MAT_CARD_KF_NAME_PATTERN, KF_EXT)
        triptych_kf_s3_object = '{0}/{1}/{2}/{2}{3}.{4}'.format(track_file['Path'].split('/')[0], self.BROWSE_MEDIA, self.mat_id,
                                                                TRIPTYCH_KF_NAME_PATTERN, KF_EXT)

        self.dst_s3_helper.object_upload(s3_bucket_name, '{0}{1}.{2}'.format(local_file_location.split('.')[0],
                                                                                   MAT_CARD_KF_NAME_PATTERN, KF_EXT), mat_card_kf_s3_object)

        self.dst_s3_helper.object_upload(s3_bucket_name, '{0}{1}.{2}'.format(local_file_location.split('.')[0],
                                                                                   TRIPTYCH_KF_NAME_PATTERN, KF_EXT), triptych_kf_s3_object)

        # Cleanup the temporary files.
        self.mediator_helper.delete_file(local_file_location)  # Original image file.
        self.mediator_helper.delete_file('{0}{1}.{2}'.format(local_file_location.split('.')[0], MAT_CARD_KF_NAME_PATTERN, KF_EXT))  # Material Card keyframe file.
        self.mediator_helper.delete_file('{0}{1}.{2}'.format(local_file_location.split('.')[0], TRIPTYCH_KF_NAME_PATTERN, KF_EXT))  # Triptych keyframe file.


if __name__ == "__main__":

    try:
        keyFrame = KeyFrameImageCreation()
        keyFrame.create_keyframe()
        sys.exit()
    except S3HelperException as e:
        keyFrame.mediator_helper.logger.exception(e)
        sys.exit(1)
    except AnalyzeException as e:
        keyFrame.mediator_helper.logger.exception(e)
        sys.exit(1)
    except Exception as e:
        keyFrame.mediator_helper.logger.exception(e)
        sys.exit(1)
