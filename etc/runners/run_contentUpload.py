#!/usr/bin/python

""" NBC Production MAM Project. """

import sys
import logging
import hashlib
from collections import OrderedDict
from evertz.public import (MediatorWSHTTPClient, FrameRate, FrameLabel, AmountOfTime)
from pymediainfo import MediaInfo
from Helpers.S3Helper import S3Helper
from Helpers.MaterialHelper import MaterialHelper
from Helpers.MediatorHelper import MediatorHelper

# Logging Details
FORMAT = '[%(levelname)s] %(message)s'
logging.basicConfig(level=logging.INFO, format=FORMAT)
logger = logging.getLogger(sys.argv[0])

# Configuration Parameters
SRC_MEDIA_ACCESS_NAME = 'signiant-pmam-dev'
DST_MEDIA_NAME = 'Main'
DST_MEDIA_ACCESS_NAME = 'mediator-pmam-dev'
DST_S3_BUCKET_NAME = 'mediator-pmam-dev'
DEFAULT_OWNER = 'Default'
DEFAULT_STATE_MACHINE_NAME = 'Ingest'
DEFAULT_STATE_NAME = 'Not Available'


def search_material_track_type_link_short_text(short_text_type, value):
    """ Searches for a (list) of Materials matching a specified Short Text Type and Value within the Track Type Links. """
    # Run a custom report to get Short Text Values within Track Type Links.
    command = {
        "Subsystem": "report",
        "Method": "runReport",
        "ParameterList": {
            "reportName": "searchMaterialTrackTypeLinkShortText",
            "reportParameters": {
                "CustomReportRuntimeParameters": {
                    "Parameters": {
                        "CustomReportParameter": [{
                            "_type": "StringReportParameter",
                            "StringReportParameter": {
                                "Name": "short_text_type",
                                "Column": "Short Text Type Name",
                                "Operator": "is",
                                "Values": [
                                    short_text_type
                                ],
                                "ForceUppercase": False,
                                "CaseSensitive": False,
                                "Editable": True,
                                "Required": True,
                                "Visible": True
                            }
                        },{
                            "_type": "StringReportParameter",
                            "StringReportParameter": {
                                "Name": "value",
                                "Column": "Value",
                                "Operator": "is",
                                "Values": [
                                    value
                                ],
                                "ForceUppercase": False,
                                "CaseSensitive": False,
                                "Editable": True,
                                "Required": True,
                                "Visible": True
                            }
                        }]
                    }
                }
            }
        }
    }
    response = med_client.wscall(command)
    search_results = response['ReportResult']['ResultList']['PagedResults']['Results']

    # Return the Materials returned from the report as a list of strings.
    return [str(mat_id_list['Material ID']) for mat_id_list in search_results]


def generate_new_mat_id():
    """ Calls the tool script to generate a MatId """

    return med_client.generic_call("tools", "generateId", script='materialGenerator',
                                   sequenceName='MAT_ID_SEQUENCE')


def get_default_track_type(file_extension):
    """ Return a Track Type given a file extension. """
    media_type_list = ['Video', 'Image', 'Document', 'Audio', 'Project']
    # Check each Media Type for their valid file extensions.
    for media_type in media_type_list:
        if file_extension in get_all_tag_values('{0} File Extensions'.format(media_type)):
            return media_type

    return 'Unknown'


def get_revision_number(src_file_name):
    """ Get the Revision Number of the File Being Uploaded. """
    mat_id_list = search_material_track_type_link_short_text('File Name', src_file_name)
    if pre_registered:
        revision_list = [0]
        for tmp_mat_id in mat_id_list:
            tmp_material = {'Material': med_client.material.get(tmp_mat_id, ['tracks', 'shorttext', 'tag', 'trackTypeLinks'])}
            # Check if a Revision exists on each Material.
            if 'Revision' in tmp_material['Material']:
                revision_list.append(material['Material']['Revision'])

        max_revision = max(revision_list)
        logger.info('Maximum revision in the system: {0}'.format(str(max_revision)))
        return max_revision + 1
    else:
        return 1


def get_all_tag_values(tag_type):
    """ Returns an unordered set of tag values for a given tag type. """
    tag_list = med_client.generic_call("tag", "search", tagType=tag_type)['TagList']['Tag']

    return {x['Value'] for x in tag_list}


def get_frame_rate_from_media_info(media_info_metadata):
    """ Returns the Frame Rate of a file using MediaInfo. """
    # We need to map the Frame Rate string used by MediaInfo to that used by Mediator.
    frame_rate_map = {
        '29.970': 'DF30',
        '29.97': 'DF30',
        '59.940': 'DF60',
        '60': 'NDF60',
        '25': 'NDF25',
        '25.000': 'NDF25',
        '23.976': 'P23_976',
        '23.98' : 'P23_976'
    }

    for track in media_info_metadata.tracks:
        if track.track_type == 'Video':
            return frame_rate_map.get(str(track.framerate))

    return 'DF30'


if __name__ == '__main__':

    # Gather details from the WSRunner environment variables.
    runner_env = sys.argv[1].split('+')
    host = runner_env[0]
    skey = runner_env[1]
    job_id = runner_env[2]
    # Create a Mediator Web Service HTTP Client.
    med_client = MediatorWSHTTPClient(host, skey)
    # Get the Job Properties from the Job ID.
    job_properties = med_client.job.get(job_id)['Job']['Description']['Properties']

    try:
        # Pull relevant details of the file from the job description.
        src_s3_bucket_name = job_properties['Path']
        src_file_name = job_properties['Files'].split('/')[-1]
        src_file_path = '{0}'.format(job_properties['Files'].replace(src_file_name, ''))  # TODO: Handle no file extension.
        src_file_ext = src_file_name.split('.')[-1].lower()

        # Initialize an S3 Helper object to work with the S3/Cloudian storage.
        src_s3_media_access_provider = med_client.media_access.get_access(SRC_MEDIA_ACCESS_NAME)['S3MediaAccessProvider']
        src_s3_access_key = src_s3_media_access_provider['Authentication']['AWSMediaAccessAuthentication']['AccessKeyId']
        src_s3_secret_key = src_s3_media_access_provider['Authentication']['AWSMediaAccessAuthentication']['SecretKey']
        src_s3_endpoint = src_s3_media_access_provider['EndPoint']
        src_s3_helper = S3Helper(access_key=src_s3_access_key, secret_key=src_s3_secret_key, endpoint=src_s3_endpoint)

        # Get the File Size from the source Media.
        src_file_size = src_s3_helper.get_object_size(src_s3_bucket_name, '{0}{1}'.format(src_file_path, src_file_name))

        # Check if the file has been registered in the system.
        mat_id = search_material_track_type_link_short_text('File Name', src_file_name)

        if len(mat_id):
            # Using the implicit booleanness of a list is quite pythonic.
            pre_registered = True
            # Just take the first Material ID. Handling multiple Material uploads is left as an exercise for the reader.
            mat_id = mat_id[0]
            # Upload the file against the existing Material, using an existing Material object.
            ############################TESTING##########################
            print("THIS IS THE MAT ID: ")
            print(mat_id)
            #############################################################
            mat_get =  med_client.material.get(mat_id, ['tracks', 'shorttext', 'tag', 'trackTypeLinks', 'history'])
            if not mat_get: 
                raise Exception("Material get call returned None")
            material = {'Material': mat_get}

        else:
            pre_registered = False
            # Upload the file against a new Material, first generating a new Material ID.
            mat_id = generate_new_mat_id()
            # Determine the Track Type of the file being uploaded.
            default_track_type = get_default_track_type(src_file_ext)
            # Determine the Material Type of the file being uploaded.
            default_material_type = 'Unknown'  # TODO: Determine if we need to set a default value for a given file extension.
            # Start building the Material object.
            material = {'Material': {}}
            material['Material']['MatId'] = mat_id
            material['Material']['Owner'] = [{'Name': DEFAULT_OWNER}]
            material['Material']['MaterialType'] = default_material_type
            material['Material']['TrackTypeLink'] = [{}]
            material['Material']['TrackTypeLink'][0]['TrackTypeName'] = default_track_type
            material['Material']['TrackTypeLink'][0]['StateMachine'] = DEFAULT_STATE_MACHINE_NAME
            material['Material']['TrackTypeLink'][0]['StateName'] = DEFAULT_STATE_NAME
            material['Material']['TrackTypeLink'][0]['ShortTextList'] = {'ShortText': [{'ShortTextType': 'File Name', 'Value': src_file_name}]}

        # Temporary Material Helper
        material_helper = MaterialHelper(med_client, material, True)

        # Build the destination file properties used to copy the file to the destination Media.
        dst_file_ext = src_file_ext
        dst_file_name = '{0}.{1}'.format(mat_id, dst_file_ext)  # TODO: Do we need to add the file_tag to differentiate auxiliary files?
        dst_file_path = '{0}/{1}/{2}/'.format(hashlib.md5(mat_id).hexdigest()[:4], DST_MEDIA_NAME, mat_id)

        # Initialize an S3 Helper object to work with the S3/Cloudian storage.
        dst_s3_media_access_provider = med_client.media_access.get_access(DST_MEDIA_ACCESS_NAME)['S3MediaAccessProvider']
        dst_s3_access_key = dst_s3_media_access_provider['Authentication']['AWSMediaAccessAuthentication']['AccessKeyId']
        dst_s3_secret_key = dst_s3_media_access_provider['Authentication']['AWSMediaAccessAuthentication']['SecretKey']
        dst_s3_endpoint = dst_s3_media_access_provider['EndPoint']
        dst_s3_helper = S3Helper(access_key=dst_s3_access_key, secret_key=dst_s3_secret_key, endpoint=dst_s3_endpoint)

        # Set the Revision Number
        #material['Material']['Revision'] = get_revision_number(src_file_name)

        # Use MediaInfo to get the Frame Rate.
        media_info_metadata = MediaInfo.parse(src_s3_helper.get_presigned_url(src_s3_bucket_name, '{0}{1}'.format(src_file_path, src_file_name)))
        src_file_frame_rate = get_frame_rate_from_media_info(media_info_metadata)

        # Set the metadata at the Material level.
        material['Material']['FrameRate'] = src_file_frame_rate

        audio_layout_map = {}
        if not material_helper.has_track_type_class('AUDIO'):
            audio_layout_map = material_helper.generate_audio_layout(media_info_metadata)
            material = material_helper.build_original_audio_ttls(material, audio_layout_map, src_file_name, DEFAULT_STATE_MACHINE_NAME, DEFAULT_STATE_NAME)

        # Get the Track Types that are to be uploaded against.
        track_types = material_helper.get_track_types_to_upload_against(material, src_file_name)

        # Get the Media Type based on the file extension.
        media_type = get_default_track_type(src_file_ext)
        material_helper.set_material_short_text_value(material, 'Media Type', media_type)

        # Set the Pre Registered Short Text Value
        material_helper.set_material_short_text_value(material, 'Pre Registered', str(pre_registered))

        # Set the metadata at the Track Type Link level.
        for track_type_name in track_types:
            material_helper.set_track_type_link_short_text_value(material, track_type_name, 'Parent Path', src_file_path)
            material_helper.set_track_type_link_short_text_value(material, track_type_name, 'File Size', src_file_size)

        # Build the Track for the Destination Media.
        material['Material'].setdefault('Track', [{}])
        if len(material['Material']['Track']) == 0:
            material['Material']['Track'] = [{}]
        material['Material']['Track'][0].setdefault('Encoded', False)
        logger.info('ENCODED: ' + str(material['Material']['Track'][0]['Encoded']))
        material['Material']['Track'][0]['FileId'] = mat_id
        material['Material']['Track'][0]['FileExtension'] = dst_file_ext
        material['Material']['Track'][0]['MediaName'] = DST_MEDIA_NAME
        material['Material']['Track'][0]['DeleteMark'] = 0

        # Build the Track Definitions for each Track Type.
        material['Material']['Track'][0]['TrackDefinition'] = material_helper.build_default_track_definitions(track_types, audio_layout_map)  # Need to handle auxiliary files coming in and a Track exists.
        # Build the Track Files for each Track Definition.
        for track_definition in material['Material']['Track'][0]['TrackDefinition']:
            track_definition['TrackFile'] = {}
            track_definition['TrackFile']['Name'] = dst_file_name
            track_definition['TrackFile']['Path'] = dst_file_path

        # Copy the file to the destination Media.
        logger.info('UPLOADING TO ' + DST_S3_BUCKET_NAME +' FROM ' + SRC_MEDIA_ACCESS_NAME)
        logger.info('{0}{1}'.format(src_file_path, src_file_name))
        logger.info('{0}{1}'.format(dst_file_path, dst_file_name))

        temp_file = '{0}{1}'.format(dst_file_path, dst_file_name).split("/")[-1]
        src_s3_helper.copy(src_s3_bucket_name, DST_S3_BUCKET_NAME, '{0}{1}'.format(src_file_path, src_file_name), '{0}{1}'.format(dst_file_path, dst_file_name))

        # Remove file after copy is complete, this will indicate a successful copy was completed.
        src_s3_helper.delete(src_s3_bucket_name, '{0}{1}'.format(src_file_path, src_file_name))

        # Save the Material record.
        med_client.material.save(material)

        # Transition the Material through the Workflow.
        med_client.workflow.transition(mat_id, track_types, 'Order Placed')
        med_client.workflow.transition(mat_id, track_types, 'Upload')
        med_client.workflow.transition(mat_id, track_types, 'Upload complete')
        med_client.workflow.transition(mat_id, track_types, 'Analyze')

        # Update the Job Status Dashboard.
        med_client.job.update_status_map(job_id, {'MATERIAL__ID': mat_id})
        med_client.job.update_status_map(job_id, {'MEDIA__TYPE': media_type})

        sys.exit(0)

    except Exception as e:
        logger.exception(e)
        sys.exit(1)