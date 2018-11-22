#!/usr/bin/python

""" Created in October 2018 for the NBC Cable MAM Project
@author: Tomo Nikolovski, Dat Loi """

import sys
import random
import string

from Helpers.NLDHelper import NLDHelper
from Helpers.S3Helper import S3Helper
from Helpers.MaterialHelper import MaterialHelper
from Helpers.MediatorHelper import MediatorHelper


class ProfileAllocation(object):
    """ Profile Allocation class """
    def __init__(self):
        self.nld_helper = NLDHelper()
        self.mediator_helper = MediatorHelper()
        self.s3_helper = S3Helper()
        self.allocate_result = True

    def allocate(self):

        self.mediator_helper.update_job_progress_and_status(0, 'Collecting details about the Placing.')

        job = self.mediator_helper.med_client.job.get(self.mediator_helper.job_id)
        placing_id = self.nld_helper.get_placing_id(job)
        self.mediator_helper.logger.info('Placing ID being processed: [{0}]'.format(placing_id))

        placing = {
            'Placing': self.nld_helper.placing_get(placing_id,
                                                   ['material', 'parcelMaterial', 'cacheDetails', 'parcel',
                                                    'destination', 'profileStatus', 'shorttext', 'fulltext', 'tag',
                                                    'history', 'destinationSpecificMetaData'])['Placing']}
        if not placing['Placing']:
            self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id,
                                                                {'JOB__ERROR: Placing Id does not exist in the system'})
            raise self.MediatorException('Placing Id does not exist in the system.')

        placing_material_id = placing['Placing']['MainMatId']  # For now, the placing only has a single material.
        self.mediator_helper.logger.info('Material in the package: {0}'.format(placing_material_id))
        material_helper = MaterialHelper(self.mediator_helper.med_client, placing_material_id)

        material = {'Material': self.mediator_helper.med_client.material.get(placing_material_id, ['tracks'])}

        """ Gather all necessary info for building the parcel and compile it. """
        pub_def_name = self.nld_helper.get_pub_def_name(placing)
        self.mediator_helper.update_job_progress_and_status(40, 'Building the parcel. MatID: {0}'.
                                                            format(placing_material_id))

        material_frame_rate = material['Material']['FrameRate']
        """ Generate a random name for the parcel composed of 20 uppercase chars, same as the MatID """
        parcel_name = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(20))
        parcel_title = '{0}{1}'.format(parcel_name, ' title')
        material_duration = material_helper.get_duration()
        material_outcode = material_helper.get_outcode('Main')

        self.nld_helper.build_parcel(placing_id, pub_def_name, parcel_name, material_frame_rate, parcel_title,
                                     material_duration, placing_material_id, material_outcode)

        self.mediator_helper.update_job_progress_and_status(60, 'Parcel Built.')

        if material_helper.ttls_in_not_available(placing_material_id):
            self.mediator_helper.logger.info('TTLs of material {0} is in Not Available state.'.format
                                             (placing_material_id))
            self.mediator_helper.update_job_progress_and_status(60, 'TTLs of material in state Not Available')
            self.allocate_result = False

        if not self.allocate_result:
            self.mediator_helper.logger.info(
                'Parcel does not meet all requirements. Transitioning the placing to Awaiting Component')
            self.mediator_helper.update_job_progress_and_status(80, 'Transitioning the placing to Awaiting Component.')
            self.nld_helper.placing_workflow_transition(placing_id, 'Order not Complete')
            self.nld_helper.add_note(placing_id, 'Awaiting Components', 'TTLs of the Material on the Parcel in state '
                                                                        'Not Available.')
        else:
            self.mediator_helper.logger.info(
                'Parcel meets all requirements. Transitioning the placing to Transfer.')
            self.mediator_helper.update_job_progress_and_status(80, 'Transitioning the placing to Transfer')
            self.nld_helper.placing_workflow_transition(placing_id, 'Initiate')

        self.mediator_helper.update_job_progress_and_status(100, 'Job successfully finished.')


if __name__ == '__main__':

    try:
        profileAllocation = ProfileAllocation()
        profileAllocation.allocate()
        sys.exit(0)
    except Exception as e:
        profileAllocation.mediator_helper.logger.info(e)
        sys.exit(1)