'''
Created on May 5, 2016

Factory class for creating Transfer objects from a source and destination
access provider combination

The type name of the source and the type name of the dest are combined
in order to create the class name of the transfer object. For instance,
when the source is an FTPMediaAccessProvider and the destination is
an FTPMediaAccessProvider, the string 'MediaAccessProvider' is removed
and the source and dest are joined together, with the string 'To' in
between in order to make the string 'FTPToFTP'. This is used as the class
name and an instance is created.

Because of the way the introspection works, all of the transfer classes
have to be explicitly imported, otherwise they won't be available in
the 'globals' dictionary
@author: jeast
'''
import logging
from evertz.mediator.transfer.ftp_to_ftp_transfer import FTPToFTP
from evertz.mediator.transfer.ftp_to_S3 import FTPToS3
from evertz.mediator.transfer.S3_to_ftp import S3ToFTP
from evertz.mediator.transfer.S3_to_S3 import S3ToS3
from evertz.mediator.transfer.localmount_to_S3 import LocalMountToS3
from evertz.mediator.transfer.S3_to_localmount import S3ToLocalMount
from evertz.mediator.transfer.localbwlimit_to_S3 import LocalBWLimitToS3
from evertz.mediator.transfer.S3_to_localbwlimit import S3ToLocalBWLimit
from evertz.mediator.transfer.ssh_to_localmount_transfer import SSHToLocalMount
from ssh.localmount_to_ssh_transfer import LocalMountToSSH
from evertz.mediator.transfer.ssh_to_S3 import SSHToS3
from evertz.mediator.transfer.S3_to_ssh import S3ToSSH
from diva.divarest_to_divashare import DivaRESTToDivaShare
from evertz.mediator.transfer.divashare_to_divarest import DivaShareToDivaREST
from evertz.mediator.transfer.mews_to_windows_share import MewsToWindowsShare
from evertz.mediator.transfer.windows_share_to_mews import WindowsShareToMews


class TransferFactory(object):
    '''
    classdocs
    '''

    @staticmethod
    def make_type_name(type_name):
        if type_name.endswith('MediaAccessProvider'):
            return type_name[:-19]
        return type_name

    @staticmethod
    def make_transfer(src_access_providers, dst_access_providers):
        '''Creates a Transfer worker object based on the available source
        and destination media access providers'''
        candidates = []
        for src_ma_provider in src_access_providers:
            src_type = TransferFactory.make_type_name(src_ma_provider.type_name)

            for dst_ma_provider in dst_access_providers:
                dst_type = TransferFactory.make_type_name(dst_ma_provider.type_name)

                transfer_type_name = src_type + 'To' + dst_type
                transfer_constructor = globals().get(transfer_type_name)
                if transfer_constructor is not None:
                    candidates.append((transfer_constructor, src_ma_provider, dst_ma_provider))
        # Should have a list of candidates now
        if len(candidates) > 0:
            # TODO Have some way of choosing the best one
            # For now just choose the first one
            transfer_obj = candidates[0][0]()
            transfer_obj.src_access_provider = candidates[0][1]
            transfer_obj.dst_access_provider = candidates[0][2]
            return transfer_obj

        # TODO Handle some other case
        return None

    @staticmethod
    def get_transfer_class(src_access_providers, dst_access_providers):
        '''Creates a Transfer worker object based on the available source
        and destination media access providers'''
        logger = logging.getLogger("default_transfer.TransferFactory")
        logger.debug("Finding candidates to perform the transfer")

        candidates = []
        for src_ma_provider in src_access_providers:
            logger.debug("Source provider type: " + src_ma_provider.type_name)
            src_type = TransferFactory.make_type_name(src_ma_provider.type_name)

            for dst_ma_provider in dst_access_providers:
                logger.debug("Dest provider type: " + dst_ma_provider.type_name)
                dst_type = TransferFactory.make_type_name(dst_ma_provider.type_name)

                transfer_type_name = src_type + 'To' + dst_type
                logger.debug("Looking for constructor " + transfer_type_name)
                transfer_constructor = globals().get(transfer_type_name)
                if transfer_constructor is not None:
                    logger.debug("Found candidate")
                    candidates.append((transfer_constructor, src_ma_provider, dst_ma_provider))
                else:
                    logger.debug("Not found")

        # Should have a list of candidates now
        if len(candidates) > 0:
            # TODO Have some way of choosing the best one
            # For now just choose the first one
            return candidates[0]

        # TODO Handle some other case
        return None
