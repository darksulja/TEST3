from evertz.mediator.transfer.base_transfer import TrackBasedTransferCreator, DefaultTransferCreator
from evertz.mediator.transfer.divashare_to_divarest import DivaShareToDivaREST
from datetime import datetime

from evertz.diva.rest_interface import DivaRestInterface
import re
import os

class DivaRESTToDivaShare(DivaShareToDivaREST):
    """Abstract base class of all file transfer classes
    for use in transfer jobs"""
    _mega_byte = 1024 ** 2
    _share_name = None
    _diva_path = None
    _category = None
    _hostname = None
    _port = None
    _version = None

    @classmethod
    def get_transfer_creator(cls, dst_node, src_node):
        """Creates and returns the object used to create transfer objects from the incoming source track files.
        If behaviour other than the default (one transfer object per source track file) is needed, then descending
        classes can create the necessary object"""
        if src_node.partial_transfers:
            return DefaultTransferCreator(cls)
        else:
            return TrackBasedTransferCreator(cls)

    def initial_setup(self):
        self.logger.info('INITIALIZING SETUP : ' + datetime.utcnow().strftime("%a %b %d %H:%M:%S %Z %Y"))
        self._start_time = datetime.utcnow()
        self._share_name = self.dst_access_provider.share_name
        self._category = self.src_access_provider.category
        self._hostname = self.src_access_provider.hostname
        self._port = self.src_access_provider.port
        self._version = self.src_access_provider.version
        self._source_track_file = self.src_track_file_list[0]
        self.progress_check_seconds = 10

        self.src_access_provider.open_connection()
        self.diva_rest_client = DivaRestInterface(self.src_access_provider, self.dst_access_provider)
        self.src_access_provider.diva_rest_client = self.diva_rest_client
        
    def get_files_path_root(self):
        return ''       

    def get_object_name(self):
        if self.src_node.partial_transfers:
            src_track_file_item = self.src_track_file_list[0].name
            return src_track_file_item
        else:
            return self.dst_track.file_id

    def get_object_name_ignore_partial(self):
        return self.dst_track.file_id

    def transfer(self):
        try:
            self.diva_rest_client.register_client()
            object_name = self.get_object_name()
            self.logger.debug(self)

            files_path_root = ""
            if self.dst_track_file.path and self.dst_track_file.path != '':
                files_path_root = self.dst_track_file.path
                files_path_root = re.sub(r'/+', r'\\', files_path_root)

            if self.dst_access_provider.use_media_relative_path:
                self.logger.debug("Media.RelativePath [" +
                                  str(self.dst_track.media.relative_path) + "]")
                files_path_root = str(self.dst_track.media.relative_path) + "\\" + files_path_root

            full_path = str(self.dst_access_provider.diva_share_path) + "/" + str(files_path_root)
            full_path = re.sub(r'\\+', r'/', full_path)
            self.logger.debug('----- FULL PATH [' + str(full_path) + ']')
            self.logger.debug('----- FILES_PATH_ROOT [' + str(files_path_root) + ']')
            try:
                if not os.path.exists(full_path):
                    os.makedirs(full_path)
            except Exception as ex:
                self.logger.error("Exception making the folder for a diva restore : " + str(ex))
                self.logger.error("Full Path [" + str(full_path) + "]")
                self.logger.error("Perhaps you have not defined diva_share_path on your access provider.")
                self.logger.error("(Note that path is used soley for making the folder before a restore,")
                self.logger.error("and not used during the archive process)")
                self.logger.error("Restore path is made up of: ")
                self.logger.error("DivaShareMediaAccessProvider.diva_share_path [" +
                                  str(self.dst_access_provider.diva_share_path) + "]")
                self.logger.error(" + optional Media.RelativePath [" + str(self.dst_track.media.relative_path) + "]")
                self.logger.error(" + Filespathroot [" + str(files_path_root) + "]")

                raise

            restore_status = self.diva_rest_client.restore_object(object_name, files_path_root)
            diva_status = self.diva_rest_client.get_XML_value(restore_status, 'divaStatus')
            request_number = self.diva_rest_client.get_XML_value(restore_status, 'requestNumber')
            diva_status_text = self.diva_rest_client.DivaStatus[int(diva_status)]
            
            if diva_status_text == 'DIVA_ERR_NO_SUCH_REQUEST':
                raise Exception("\n divarest_to_divashare - checking the state of a non-existant request : " + str(request_number))
    
            if diva_status_text == 'DIVA_ERR_NOT_CONNECTED':
                self.diva_rest_client.register_client()
                restore_status = self.diva_rest_client.restore_object(self.get_object_name(), files_path_root)
                diva_status = self.diva_rest_client.get_XML_value(restore_status, 'divaStatus')
                request_number = self.diva_rest_client.get_XML_value(restore_status, 'requestNumber')
                diva_status_text = self.diva_rest_client.DivaStatus[int(diva_status)]

            # NBCU Custom Code to handle objects that do not have extensions on them
            if diva_status_text == 'DIVA_ERR_OBJECT_DOES_NOT_EXIST':
                self.logger.debug('DIVA Status [' + str(diva_status_text) + '] :: Retrying Transfer Using Different Object Name [' + str(self.get_object_name_ignore_partial()) + ']')
                restore_status = self.diva_rest_client.restore_object(self.get_object_name_ignore_partial(), files_path_root)
                diva_status = self.diva_rest_client.get_XML_value(restore_status, 'divaStatus')
                request_number = self.diva_rest_client.get_XML_value(restore_status, 'requestNumber')
                diva_status_text = self.diva_rest_client.DivaStatus[int(diva_status)]
 
            self.logger.debug('----- Request Number [' + str(request_number) + ']')
            self.logger.debug('DIVA Status [' + str(diva_status_text) + ']')
            self.monitor_request(request_number, 'RESTORE')

        except Exception, e:
            self.fail("An Exception Occurred,%s"%e)
        
        self.logger.info("ABOUT TO FINISH RESTORE")
        self.src_access_provider.close_connection()
        self.logger.info("FINISHED RESTORE > [" + self.get_object_name() + "]")
        
    def delete_destination(self):
        pass
