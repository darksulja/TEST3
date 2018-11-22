#!/usr/bin/python

import sys
import logging
from Helpers.NLDHelper import NLDHelper
from Helpers.S3Helper import S3Helper, S3HelperException
from evertz.public import MediatorWSHTTPClient

DEBUG = False

HOT_FOLDER_PRESET = 'Generic Hot Folder Copy'

if __name__ == '__main__':
    try:
        print "Running hotFolderDelivery..."

        nldHelper = NLDHelper()
        host, skey, job_id = sys.argv[1].split('+')
        med_client = MediatorWSHTTPClient(host, skey)
        job = med_client.job.get(job_id)

        # Placing and material properties.
        placingId = nldHelper.get_placing_id(job)
        placing = nldHelper.placing_get(placingId, ['shorttext', 'fulltext', 'tag', 'destination'])
        matId = placing['Placing']['MainMatId']
        material = nldHelper.material_get(matId, ['tracks', 'shorttext', 'tag', 'trackTypeLinks'])
        trackShortTextList = material['Material']['TrackTypeLink'][0]['ShortTextList']['ShortText'] # we only want the first TTL
        
        # Preset options.
        preset = {'shortText': []}
        preset['shortText'] = nldHelper.get_preset_shorttext(HOT_FOLDER_PRESET)
        srcAccessProviderName = next((st['Value'] for st in preset['shortText'] if st['ShortTextType'] == 'Source Bucket'), None)
        dstAccessProviderName = next((st['Value'] for st in preset['shortText'] if st['ShortTextType'] == 'Destination Bucket'), None)
        dstMediaPath = next((st['Value'] for st in preset['shortText'] if st['ShortTextType'] == 'Bucket Path'), None)

        if filter(lambda x: x is None, [srcAccessProviderName, dstAccessProviderName, dstMediaPath]):
            raise ValueError("A preset value in [%s] is blank." % HOT_FOLDER_PRESET)

        print "Got destination access provider [%s] and bucket path [%s] from preset [%s]." % (dstAccessProviderName, dstMediaPath, HOT_FOLDER_PRESET)

        # Build destination properties
        dstAccessProvider   = med_client.media_access.get_access(dstAccessProviderName)['S3MediaAccessProvider']
        dstAccessKey        = dstAccessProvider['Authentication']['AWSMediaAccessAuthentication']['AccessKeyId']
        dstAccessSecret     = dstAccessProvider['Authentication']['AWSMediaAccessAuthentication']['SecretKey']
        dstAccessEndPoint   = dstAccessProvider['EndPoint']
        dstS3Helper = S3Helper(access_key=dstAccessKey, secret_key=dstAccessSecret, endpoint=dstAccessEndPoint)

        # Compile the relevant file information.
        origFileName    = next((st['Value'] for st in trackShortTextList if st['ShortTextType'] == 'File Name'), False)
        srcFilePath     = material['Material']['Track'][0]['TrackDefinition'][0]['TrackFile']['Path']
        srcFile         = srcFilePath + '/' + material['Material']['Track'][0]['TrackDefinition'][0]['TrackFile']['Name']
        dstFile         = '/'.join([dstMediaPath, origFileName])

        print "Copying original file name [%s] to delivery location [%s]..." % (origFileName, dstMediaPath)

        try:
            dstS3Helper.copy(srcAccessProviderName, dstAccessProviderName, srcFile, dstFile)
        except S3HelperException as err:
            print "Error copying file: %s" % err
            raise err

        print "Finished hot folder delivery for placingId [%s]." % placingId
        sys.exit(0)

    except Exception as err:
        print err
        sys.exit(1)