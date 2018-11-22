""" Created in June 2018 for the NBC Cable MAM Project.
@author: Ian Wiggins, Dat Loi
"""

import subprocess
import os
import sys
import logging

from evertz.public import MediatorWSHTTPClient


class MediatorHelper(object):
    """ A collection of common Mediator functionality. """

    def __init__(self):
        """ Initialization. """
        self._parse_runner_env_variables()
        self._setup_logging()

    def _parse_runner_env_variables(self):
        """ Parse the Runner Environment Variables to pull relevant details about the runner. Then initialize
            <self.job_id> and <self.med_client>"""
        runner_env = sys.argv[1].split('+')
        host = runner_env[0]
        skey = runner_env[1]
        self.job_id = runner_env[2]
        self.med_client = MediatorWSHTTPClient(host, skey)

    def _setup_logging(self):
        """ Setup logging. """
        log_level = logging.INFO
        log_format = '[%(levelname)s] %(message)s'
        logging.basicConfig(level=log_level, format=log_format)
        self.logger = logging.getLogger(sys.argv[0])

    def update_job_progress_and_status(self, progress, status):
        """ Update the job progress and status with a single method. """
        self.med_client.job.update_status_map(self.job_id, {'JOB__PROGRESS': '{0}'.format(progress)})
        self.med_client.job.update_status_map(self.job_id, {'JOB__STATUS': '{0}'.format(status)})

    def run_command(self, cmd, shell_flag=False):
        """ Run terminal commands from Python. """
        try:
            s = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=shell_flag)
            s = s.stdout.read()
            return s.strip()
        except subprocess.CalledProcessError as e:
            self.logger.error(e)
            return False

    def file_exist(self, file_path):
        """ Checks if a file exists in a given file path. """
        file_path = os.path.abspath(file_path)
        if os.path.exists(file_path) is True and os.path.isdir(file_path) is False:
            return True
        self.logger.error('The filename given was either non existent or was a directory')
        return False

    def delete_file(self, file_path):
        """ Delete a file from a given file path. """
        if os.path.isfile(file_path):
            os.unlink(file_path)
            return True
        self.logger.error('Cannot find the temporary file [{0}] to be deleted.'.format(file_path))
        return False

    def create_directory(self, path):
        """ Create a system directory. """
        if os.path.isdir(path) is False:
            try:
                os.makedirs(path)
                return True
            except OSError as err:
                self.logger.error(err)
                return False
        else:
            return True

    def get_all_tag_values(self, tag_type):
        """ Returns an unordered set of tag values for a given tag type. """
        tag_list = self.med_client.generic_call("tag", "search", tagType=tag_type)['TagList']['Tag']
        return [x['Value'] for x in tag_list]

    def get_track_type_class_id(self, track_type_name):
        """ Return the Class ID of a given Track Type. """
        return self.med_client.generic_call("trackType", "get", trackTypeName=track_type_name)['TrackType']['ClassId']

    def search_material_ttl_shorttext(self, short_text_type, short_text_value):
        """ Searches short texts of the specified type on Track Type Links for the specified value,
            then returns the MatId of the linked material.
            If not found, returns False. """
        command = {
            "Subsystem": "search",
            "Method": "executeSearchRequest",
            "ParameterList": {
                "request": {
                    "GenericSearchRequest": {
                        "ProviderId": "Local",
                        "SearchClauseList": {
                            "Operator": "and",
                            "Clause": [
                                {
                                    "SearchTargetId": "Material",
                                    "SearchClauseList": {
                                        "Operator": "and",
                                        "Clause": [
                                            {
                                                "SearchTargetId": "TrackTypeLink",
                                                "SearchClauseList": {
                                                    "Operator": "and",
                                                    "Clause": [
                                                        {
                                                            "ClauseDefId": "ShortText.{0}".format(short_text_type),
                                                            "ClauseValue": short_text_value
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        },
                        "ResultTypeList": {
                            "SearchResultType": [
                                {
                                    "Id": "Material",
                                    "FieldsToReturn": [
                                        "MatId"
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
        }

        response = self.med_client.wscall(command)

        search_results = response['SearchResultContainer']['ResultList']['SearchResult']

        mat_id_list = []
        for result in search_results:
            mat_id_list.append(result['Material']['MatId'])

        return mat_id_list