'''
Created on June 29, 2016

@author: Jeff Kalbfleisch
'''
from evertz.mediator.access.access_provider import AbstractAccessProvider
import httplib
from evertz.diva.rest_interface import DivaRestInterface


class DivaRESTMediaAccessProvider(AbstractAccessProvider):

    def __init__(self, json):
        AbstractAccessProvider.__init__(self, json)
        self.category = json.get('Category')
        self.hostname = json.get('Hostname')
        self.port = json.get('Port')
        self.version = json.get('Version')
        self.diva_media_name = json.get('DivaMedia')
        self.priority_level = json.get('PriorityLevel')
        self.quality_of_service = json.get('QualityOfService')
        self.diva_rest_client = None
        self.conn = None

    def __str__(self):
        message = "\n\n *** [" + str(type(self)) + "]"
        message += "\n--------------------------------------"
        if self.category is not None:
            message += "\n        Category [" + str(self.category) + "]"
        if self.hostname is not None:
            message += "\n        Hostname [" + str(self.hostname) + "]"
        if self.port is not None:
            message += "\n        Port [" + str(self.port) + "]"
        if self.version is not None:
            message += "\n        Version [" + str(self.version) + "]"
        if self.diva_media_name is not None:
            message += "\n        Diva Media Name [" + str(self.diva_media_name) + "]"
        if self.priority_level is not None:
            message += "\n        Priority Level [" + str(self.priority_level) + "]"
        if self.quality_of_service is not None:
            message += "\n        Quality Of Service [" + str(self.quality_of_service) + "]\n"
        message += str(AbstractAccessProvider)
        return message

    def _connect(self):
        '''Connects to DIVA using the given settings this method requires that you connect
        to a REST WEBAPI Server that is connected to and part of diva.
        '''

        connection_string = self.hostname + ":" + str(self.port)
        self.conn = httplib.HTTPConnection(connection_string)

        return self.conn

    def _disconnect(self):
        self.conn.close()

    def supports_file_size(self):
        # NBCU Custom
        # return True
        return False

    def get_diva_rest_client(self):
        if self.diva_rest_client is None:
            self.diva_rest_client = DivaRestInterface(self)
        return self.diva_rest_client

    def get_file_size(self, path, object_name):
        self.get_diva_rest_client().register_client()
        object_info = self.diva_rest_client.get_object_info(object_name)
        file_bytes = self.diva_rest_client.get_XML_value(object_info, 'objectSizeBytes')
        return int(file_bytes)
