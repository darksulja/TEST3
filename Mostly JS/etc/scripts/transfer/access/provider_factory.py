'''
Created on May 6, 2016

@author: jeast
'''
# In order for the 'reflection' to work, all of the access providers need
# to be explicitly imported, otherwise their constructor method won't be loaded into
# globals().
# DON'T CLEAN UP THE IMPORTS!!!
from evertz.mediator.access.ftp_access_provider import FTPMediaAccessProvider
from evertz.mediator.access.local_bw_limit_access_provider import LocalBWLimitMediaAccessProvider
from evertz.mediator.access.s3_access_provider import S3MediaAccessProvider
from evertz.mediator.access.ssh_access_provider import SSHMediaAccessProvider
from evertz.mediator.access.local_access_provider import LocalMountMediaAccessProvider
from diva_rest_access_provider import DivaRESTMediaAccessProvider
from evertz.mediator.access.diva_share_access_provider import DivaShareMediaAccessProvider
from evertz.mediator.access.overture_access_provider import OvertureMediaAccessProvider
from evertz.mediator.access.mews_access_provider import MewsMediaAccessProvider
from evertz.mediator.access.windows_share_access_provider import WindowsShareMediaAccessProvider


# Authentication objects
from evertz.mediator.access.authentication import *


class MediaAccessProviderFunction:
    Browse = "BROWSE"
    Transfer = "TRANSFER"
    Upload = "UPLOAD"
    Manage = "MANAGE"


class MediaAccessProviderFactory(object):
    '''
    Factory class for creating MediaAccessProviders from incoming Mediator JSON
    '''

    def __init__(self, params):
        '''
        Constructor
        '''

    @staticmethod
    def make_media_access_provider(json):
        """
        make media access provider object from json
        :param json: dict
        :return: media access provider object
        :rtype: evertz.mediator.access.access_provider.AbstractAccessProvider
        """
        type_name = json.get('_type')
        # The MediaAccessProvider in a list has a _type setting
        # The output from a WS for single entries does not
        if type_name is None:
            keys = json.keys()
            type_name = keys[0]

        constructor = globals().get(type_name)
        if constructor is not None:
            provider = constructor(json.get(type_name))
            provider.type_name = type_name

            # If there is an authentication object, make that as well
            if 'Authentication' in json.get(type_name):
                auth = json.get(type_name).get('Authentication')
                if auth is not None:
                    auth_type = auth.get('_type')
                    auth_constructor = globals().get(auth_type)
                    if auth_constructor is not None:
                        provider.authentication = auth_constructor(auth.get(auth_type))
            return provider
        return None

    @staticmethod
    def get_provider_by_name(med_client, provider_name):
        cmd = {"Subsystem": "mediaAccess",
               "Method": "getAccess",
               "ParameterList": {"name": provider_name}}
        result = med_client.wscall(cmd)
        provider = MediaAccessProviderFactory.make_media_access_provider(result)
        return provider

    @staticmethod
    def get_providers_for_media(med_client, media_name, access_type):
        """Makes the 'getMediaAccess' call to Mediator and returns
        a list of MediaAccessProviders
        :param med_client:
        :param media_name:
        :param access_type:
        :return: media access providers
        :rtype: list[evertz.mediator.access.access_provider.AbstractAccessProvider]
        """
        cmd = {"Subsystem": "mediaAccess",
               "Method": "getMediaAccess",
               "ParameterList": {"mediaName": media_name,
                                 "accessType": access_type}}
        result = med_client.wscall(cmd)
        # Was a MediaAccessProviderList returned
        mapList = []
        if 'MediaAccessProviderList' in result:
            for mapJson in result.get('MediaAccessProviderList').get('MediaAccessProvider'):
                provider = MediaAccessProviderFactory.make_media_access_provider(mapJson)
                if provider is not None:
                    mapList.append(provider)
        return mapList

    @staticmethod
    def make_media_access_providers(media_access_providers_json):
        """Makes the 'getMediaAccess' call to Mediator and returns
        a list of MediaAccessProviders
        :rtype: list[evertz.mediator.access.access_provider.AbstractAccessProvider]
        """
        mapList = []
        for media_access_provider_json in media_access_providers_json:
            provider = MediaAccessProviderFactory.make_media_access_provider(media_access_provider_json)
            if provider is not None:
                mapList.append(provider)
        return mapList
