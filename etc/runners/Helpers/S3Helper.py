""" Created on 27th of June 2018 for the NBC Cable MAM Project.
@author: Tomo Nikolovski, Dat Loi """

import boto3
import botocore

from botocore.exceptions import ClientError
from evertz.mediator.webservice import MediatorException
from Helpers.MediatorHelper import MediatorHelper


class S3HelperException(Exception):
    pass


class S3Helper():

    def __init__(self, access_key=None,
                 secret_key=None,
                 endpoint=None):
        """ Initialize class fields dynamically. """
        self.s3_client = boto3.client('s3', aws_access_key_id=access_key,
                                      aws_secret_access_key=secret_key,
                                      endpoint_url=endpoint)
        self.s3_resource = boto3.resource('s3', aws_access_key_id=access_key,
                                          aws_secret_access_key=secret_key,
                                          endpoint_url=endpoint)
		#This extra object is needed for the delete method - delete requires signiant creds, copy uses mediator creds
        self.s3_resource_signiant = boto3.resource('s3', aws_access_key_id="50cd2796bd6110aca8af",
                                          aws_secret_access_key="5nXWGeTb77XRXfe+0kvaA1GBHgYKTe3tctevyKd+",
                                          endpoint_url="http://s3-prodmam.mediasys.io")
        self.mediator_helper = MediatorHelper()

    def get_presigned_url(self, bucket, key):
        """ Get a pre-signed URL to access a file on a S3 bucket. """
        s3_parameters = {
            'Bucket': bucket,
            'Key': key
        }
        try:
            presigned_url = self.s3_client.generate_presigned_url('get_object', Params=s3_parameters, ExpiresIn=500)
        except ClientError as e:
            raise S3HelperException(e)

        return presigned_url

    def get_object_size(self, bucket, key):
        """ Get the file size of an S3 object. """
        try:
            object_data = self.s3_client.head_object(Bucket=bucket, Key=key)
            object_size = object_data['ContentLength']
        except ClientError as e:
            raise S3HelperException(e)

        return object_size

    def get_bucket_name(self, media, function='TRANSFER'):
        """ Return the bucket name of a media. """
        try:
            media_access_list = self.mediator_helper.med_client.generic_call("mediaAccess", "getAllMediaAccessLinks")['MediaAccessLinkList']['MediaAccessLink']
        except MediatorException as e:
            raise S3HelperException(e)

        for media_access in media_access_list:
            if media_access['MediaName'] == media and media_access['Function'] == function:
                provider_name = media_access['ProviderName']
                break

        try:
            media_access = self.mediator_helper.med_client.generic_call("mediaAccess", "getAccess", name=provider_name)
        except MediatorException as e:
            raise S3HelperException(e)
        except NameError as e:
            raise S3HelperException(e)

        return media_access['S3MediaAccessProvider']['BucketName']

    def object_download(self, bucket, key, file_location):
        """ Download an object from an S3 bucket using multipart download. """
        bucket = self.s3_resource.Bucket(bucket)
        try:
            with open(file_location, 'wb') as data:
                bucket.download_fileobj(key, data)
        except ClientError as e:
            raise S3HelperException(e)

    def object_upload(self, bucket, file_location, key):
        """ Upload an object to an S3 bucket using multipart upload. """
        bucket = self.s3_resource.Bucket(bucket)
        try:
            with open(file_location, 'rb') as data:
                bucket.upload_fileobj(data, key, ExtraArgs={'ServerSideEncryption': 'AES256'})
        except ClientError as e:
            raise S3HelperException(e)

    def copy(self, src_bucket, dst_bucket, src_key, dst_key):
        """ Copy objects from one to another S3 bucket using multipart copy. """
        src_copy_object = {
            'Bucket': src_bucket,
            'Key': src_key
        }
        dst_bucket_object = self.s3_resource.Bucket(dst_bucket)
        dst_copy_object = dst_bucket_object.Object(dst_key)

        try:
            dst_copy_object.copy(src_copy_object, ExtraArgs={'ServerSideEncryption': 'AES256'}) #added ACL
        except ClientError as e:
            raise S3HelperException(e)

    def delete(self, bucket, key):
        """ Remove an object from a S3 bucket. """
		#Can't delete using the mediator creds ... need to delete using signiant creds
        bucket = self.s3_resource_signiant.Bucket(bucket) # signiant bucket using signiant creds
        s3_object = bucket.Object(key)
        try:
            s3_object.delete()
        except ClientError as e:
            raise S3HelperException(e)
