#!/usr/bin/python

""" Created on 2018/04/16 for the NBC Cable MAM Project
@author: Tomo Nikolovski, Ian Wiggins, Dat Loi """

import sys
from datetime import datetime
from evertz.public import CalendarTime  # Currently not a public module.
from Helpers.AnalyzeHelper import AbstractAnalyzeHelper, AnalyzeException

class browseResubmitHelper(AbstractAnalyzeHelper):

    def __init__(self):
        """ Initialization """
        super(browseResubmitHelper, self).__init__()
    
    def collect_metadata(self):
        pass

    def update_material_object_with_metadata(self):
        pass
        
    def process_browse(self):
        """ Delete current material in Browse media and send new transfer request. """
        self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__PROGRESS': 0})
        self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__STATUS': 'Initializing'})
        # Process the job description and extract the MatID
        job = self.mediator_helper.med_client.job.get(self.mediator_helper.job_id)
        mat_id = job['Job']['Description']['Properties']['material']['Material']['MatId']

        # Delete the material from Browse.
        self.mediator_helper.med_client.material.delete(mat_id, media_names=[self.BROWSE_MEDIA], delete_state="delete", trigger_immediately=True)

        self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__PROGRESS': 40})
        self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__STATUS': 'Existing material deleted. Submitting the '
                                                              'transfer request to {0}'.format(self.BROWSE_MEDIA)})

        # Request a new transfer to the Browse media.
        time_required = str(CalendarTime.parse_date_time('DF30', datetime.now()))
        self.mediator_helper.med_client.generic_call("transfer", "makeRequest", matId=mat_id,
                                                     destinationMedia=self.BROWSE_MEDIA, timeRequired=time_required)

        self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__PROGRESS': 100})
        self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__STATUS': 'Job Done'})


if __name__ == "__main__":

    try:
        browseResubmit = browseResubmitHelper()
        browseResubmit.process_browse()
        sys.exit()
    except AnalyzeException as e:
        browseResubmit.logger.exception(e)
        sys.exit(1)
    except Exception as e:
        browseResubmit.logger.exception(e)
        sys.exit(1)
