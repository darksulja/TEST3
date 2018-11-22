#!/usr/bin/python

import sys
import logging
from Helpers.NLDHelper import NLDHelper
from Helpers.S3Helper import S3Helper, S3HelperException
from evertz.public import MediatorWSHTTPClient

DEBUG = False

PACKAGING_PRESET = 'EOC MOC Bravo'

if __name__ == '__main__':
    try:
        print "Running nldPackaging..."

        nldHelper = NLDHelper()
        host, skey, job_id = sys.argv[1].split('+')
        med_client = MediatorWSHTTPClient(host, skey)
        job = med_client.job.get(job_id)

        # Placing and material properties.
        placingId = nldHelper.get_placing_id(job)
        placing = nldHelper.placing_get(placingId, ['shorttext', 'fulltext', 'tag', 'destination'])
        matId = placing['Placing']['MainMatId']
        material = nldHelper.material_get(matId, ['tracks', 'shorttext', 'tag', 'trackTypeLinks'])
        if not material:
            nldHelper.add_note(placingId, 'Info', 'Could not package: no main material found on placing.')
            raise ValueError("No parcel found on this placing.")
        shortTextList = material['Material']['TrackTypeLink'][0]['ShortTextList']['ShortText'] # we only want the first TTL
        
        # Preset options.
        preset = {'shortText': []}
        preset['shortText'] = nldHelper.get_preset_shorttext(PACKAGING_PRESET)
        srcAccessProviderName = next((st['Value'] for st in preset['shortText'] if st['ShortTextType'] == 'Source Bucket'), False)

        print "Got source access provider [%s] from preset [%s]." % (srcAccessProviderName, PACKAGING_PRESET)

        # Build source and destination properties. Same endpoint for both, but different path and filename.
        srcAccessProvider = med_client.media_access.get_access(srcAccessProviderName)['S3MediaAccessProvider']
        srcAccessKey      = srcAccessProvider['Authentication']['AWSMediaAccessAuthentication']['AccessKeyId']
        srcAccessSecret   = srcAccessProvider['Authentication']['AWSMediaAccessAuthentication']['SecretKey']
        srcAccessEndPoint = srcAccessProvider['EndPoint']
        s3Helper = S3Helper(access_key=srcAccessKey, secret_key=srcAccessSecret, endpoint=srcAccessEndPoint)

        # Compile the relevant file information.
        origFileName    = next((st['Value'] for st in shortTextList if st['ShortTextType'] == 'File Name'), False)
        srcFilePath     = material['Material']['Track'][0]['TrackDefinition'][0]['TrackFile']['Path']
        srcFile         = srcFilePath + '/' + material['Material']['Track'][0]['TrackDefinition'][0]['TrackFile']['Name']
        stagingPath     = '/'.join(srcFilePath.replace('Main', 'Packaging').split('/'))
        dstFile         = stagingPath + '/' + origFileName

        # Check if the file already exists on the destination path.
        try:
            dstFileSize = s3Helper.get_object_size(srcAccessProviderName, dstFile)
            print "Staging file [%s] found, size: [%s]. Skipping copy." % (dstFile, dstFileSize)
        except S3HelperException as err:
            if "404" in str(err):
                dstFileSize = None
                print "Staging file [%s] not found." % origFileName
            else:
                raise err

        # File doesn't exist already, so copy.
        if dstFileSize is None:
            print "Copying original file name [%s] to staging location [%s]..." % (origFileName, dstFile)
            s3Helper.copy(srcAccessProviderName, srcAccessProviderName, srcFile, dstFile)

        print "Finished packaging placingId [%s]." % placingId
        sys.exit(0)

    except Exception as err:
        print err
        sys.exit(1)