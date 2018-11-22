""" Created in August 2018 for the NBC Cable MAM Project.
@author: Dat Loi """


from evertz.aspera.aspera_node_api import AsperaNodeRestAPI, RequestTransfer
from Helpers.MediatorHelper import MediatorHelper


class MAMAsperaTransfer():
    """ Helper for Aspera Transfer """

    def __init__(self):
        """ Initialization for Aspera Transfer """
        self.mediator_helper = MediatorHelper()
        self.aspera_node_api = AsperaNodeRestAPI()
        self.request_transfer_cmd = RequestTransfer()

    def aspera_node_initialization(self, host, user, password, port):
        """ Initialize Aspera Node """
        self.aspera_node_api.host = host
        self.aspera_node_api.user = user
        self.aspera_node_api.password = password
        self.aspera_node_api.port = port
    
    def request_transfer_initialization(self, file_paths, tag, destination_root, remote_host, remote_user, remote_password, remote_access_key):
        """ Initialize Request Transfer """
        self.request_transfer_cmd.direction = 'send'
        self.request_transfer_cmd.remote_host = remote_host
        self.request_transfer_cmd.remote_user = remote_user
        self.request_transfer_cmd.remote_password = remote_password
        self.request_transfer_cmd.remote_access_key = remote_access_key

        for path_pair in file_paths:
            self.request_transfer_cmd.add_path(path_pair[0], None if len(path_pair) < 2 else path_pair[1])

        if destination_root:
            self.request_transfer_cmd.destination_root = destination_root

        if tag is not None and len(tag) > 0:
            for tag_pair in tag:
                if len(tag_pair) == 2:
                    self.request_transfer_cmd.add_tag(tag_pair[0], tag_pair[1])

    def send_transfer_command(self):
        self.aspera_node_api.send_command(self.request_transfer_cmd)