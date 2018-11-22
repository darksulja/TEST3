'''
Created on Jun 29, 2016

@author: jblakeney, craig_gardner (NBCU)
'''
from evertz.mediator.transfer.base_transfer import AbstractFileTransfer
from evertz.utils.file_utils import FileUtils
from evertz.mediator.transfer.ssh.ssh_copy import SSHCopy


class LocalMountToSSH(AbstractFileTransfer):

    def initial_setup(self):
        self.ssh = self.dst_access_provider.open_connection()

        # Utility class for doing things with files.
        self.file_utils = FileUtils()

        self.src_track_file = self.src_track_file_list[0]

        self.src_absolute_path = self.src_access_provider.get_absolute_path(self.src_track.media,
                                                                            self.src_track_file.path)
        self.src_full_file_path = self.get_full_src_file_path()

        # Create the paths using the Media Access Providers and the Track Files.
        self.src_path = self.src_absolute_path
        self.src_file = self.src_track_file.name

        self.dst_absolute_path = self.dst_access_provider.get_absolute_path(self.dst_track.media,
                                                                            self.dst_track_file.path)
        self.dst_full_file_path = self.get_full_dst_file_path()

        self.sftp = self.ssh.open_sftp()

        self.dst_path = self.dst_absolute_path
        self.dst_file = self.dst_track_file.name

    def transfer(self):
        self.logger.debug("TF Path [" + str(self.dst_track_file.path) + "]")
        self.logger.debug("TF File [" + str(self.dst_track_file.name) + "]")
        self.logger.debug("--------------------------------------")
        self.logger.debug(self)

        if self.ssh is not None:
            # Setup the SSH Copy and start that thread.
            ssh_copy = SSHCopy(self.ssh)
            ssh_copy.setup_ssh_copy(self.src_path, self.src_file, self.dst_path, self.dst_file)
            ssh_copy.start()

            ssh_copy.poll_for_progress(self.update_progress)

            ssh_copy.join()
            if ssh_copy.exception is not None:
                raise ssh_copy.exception

            self.finish()
        else:
            self.fail('Failed to obtain the SSH connection')

    def get_file_size(self):
        try:
            file_size = self.sftp.stat(self.dst_path + self.dst_file).st_size
        except:
            file_size = 0
        return file_size

    def get_settling_size(self, src_track_file_item):
        return self.sftp.stat(self.src_path + self.src_file).st_size

    def delete_destination(self):
        self.logger.info("Removing destination file before transfer.")
        self.ssh.exec_command("rm %s%s" % (self.dst_path, self.dst_file))

    def clean_up(self):
        self.src_access_provider.close_connection()
        self.dst_access_provider.close_connection()
