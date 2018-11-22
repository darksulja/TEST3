#!/usr/bin/python
'''
Created on 5 Jan 2017
Uses TrackFiles
Uses MediaAccessProvider Default Media Provider Means Use Paths
Works with S3, Diva, Glacier, FTP and LocalMedia
Works with external audio sources
@author: Akshay Kumar, John East, Craig Sloggett

Updated to include file exists checks using sftp.stat and IOError exception
'''
import logging
import threading
import errno
from time import sleep

class SSHCopy(threading.Thread):
        
    def __init__(self, ssh):
        threading.Thread.__init__(self)

        self.logger = logging.getLogger("default_transfer" + type(self).__name__)
        self.ssh = ssh

        
    def setup_ssh_copy(self, src_path, src_file, dst_path, dst_file):
        ''' This will setup an SSH Copy transfer by changing setting the correct paths/file(s). '''
        
        self.logger.info("Setting up SSH Copy Transfer.")
        
        self.src_path = src_path
        self.src_file = src_file
        self.dst_path = dst_path
        self.dst_file = dst_file


    def poll_for_progress(self, progress_callback):   
        # Create an SFTP client to get file size during transfer.
        sftp = self.ssh.open_sftp()           
        src_file_size = float(sftp.stat(self.src_path + self.src_file).st_size) 
        
        while self.is_alive():
            try:
                # Get the growing destination file size.
                dst_file_size = float(sftp.stat(self.dst_path + self.dst_file).st_size)
                
                # Create a percentage out of 100 for the current file size progress.
                progress = ((dst_file_size/src_file_size) * 100)
                self.logger.info("Dst File Size [%d] Progress [%d]" % (dst_file_size, progress))
                
                # Update the transfer with the file size.
                progress_callback(progress)
            except IOError:
                # Skip this error as its likely the file might not exist yet.
                pass
            
            sleep(5)
        
        sftp.close()
        return None


    def check_file_exists(self, path):
        # Create an SFTP client to determine if the destination paths exist
        sftp = self.ssh.open_sftp()
        self.logger.info('Checking if the following path exists:\n {}'.format(path))
        # Check if the Path exists on the destination media
        try:
            # Stat the directory to raise an IO exception, otherwise the directory exists.
            stat = sftp.stat(path)
            self.logger.info('Path exists.')
            return True

        except IOError, e:
            if e.errno == errno.ENOENT:
                # Check the error for specifically File or Directory does not exist
                self.logger.info('Path not found.')
                return False
            else:
                # The file check did not succeed, unknown if exists
                self.logger.info('Failed to check path.')
                return None

    def delete_file(self, path):
        # Execute the delete function on the path specified
        stdin, stdout, stderr = self.ssh.exec_command("rm -rf %s" % path)
        self.logger.info('File Deleted')


    def run(self):
        # Create the directory
        self.logger.info('Creating destination directory...')
        stdin, stdout, stderr = self.ssh.exec_command("mkdir -p %s" % self.dst_path)
        # Check if there were any errors when creating the directory 
        dir_error = stderr.read()
        if dir_error != "":
            self.logger.error(dir_error)
        else:
            self.logger.info("Directory made successfully.")
            
        # Copy the source file to the destination media
        stdin, stdout, stderr = self.ssh.exec_command("cp %s%s %s%s" % (self.src_path, self.src_file, self.dst_path, self.dst_file))
        # Check if there were any errors copying the file to the destination 
        cp_error = stderr.read()                                           
        if cp_error != "":
            self.logger.error(cp_error)
        else:
            self.logger.info("Copy was successful.") 
            

