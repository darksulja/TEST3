""" Created in April 2018 for the NBC Cable MAM Project.
@author: Craig Sloggett, Dat Loi """



from abc import ABCMeta, abstractmethod
from Helpers.MaterialHelper import MaterialHelper
from Helpers.MediatorHelper import MediatorHelper
from evertz.mediator.webservice import MediatorException


class AnalyzeException(Exception):
    pass


class AbstractAnalyzeHelper(object):
    __metaclass__ = ABCMeta

    # Class Fields.
    MEDIA_NAME = 'Main'
    PASSED_TRIGGER = 'Done'
    FAILED_TRIGGER = 'Failed'
    BROWSE_MEDIA = 'Browse'

    def __init__(self):
        """ Initialize class fields dynamically. """
        self.mediator_helper = MediatorHelper()
        self._parse_job_description()
        self.temporary_directory = '/tmp/analyze/temporary_files/'
        self.temporary_keyframes_directory = '/tmp/analyze/temporary_keyframe_files/'
        self.comments = []

    def _parse_job_description(self):
        """ Parse the Job Description to pull relevant details about the job. """
        job = self.mediator_helper.med_client.job.get(self.mediator_helper.job_id)

        self.mat_id = job['Job']['Description']['Properties']['material']['Material']['MatId']
        self.triggered_ttl = job['Job']['Description']['Properties']['trackTypeLink']['TrackTypeLink']['TrackTypeName']

        try:
            self.material_helper = MaterialHelper(self.mediator_helper.med_client, self.mat_id)
        except MediatorException as e:
            self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__ERROR': e})
            raise AnalyzeException(e)

    @staticmethod
    def get_frame_rate_string(mediainfo_frame_rate):
        """ Get the FrameRate string used by Mediator from the MediaInfo string. """
        frame_rate_map = {
            '29.970': 'DF30',
            '59.940': 'DF60',
            '25': 'NDF25',
            '23.976': 'P23_976'
        }
        return frame_rate_map.get(str(mediainfo_frame_rate))

    @staticmethod
    def calculate_aspect_ratio(width, height):
        """ Calculate Aspect Ratio. """
        aspect_ratio = '{:.2f}'.format(float(width) / float(height))

        aspect_ratio_map = {
            '1.78': '16:9',
            '1.33': '4:3',
            '1.56': '14:9'
        }

        return aspect_ratio_map.get(aspect_ratio, 'Unknown')

    @abstractmethod
    def collect_metadata(self):
        """ Abstract method to collect metadata. """
        pass

    @abstractmethod
    def update_material_object_with_metadata(self):
        """ Update the Material Object with metadata. Metadata collection is defined in the implementation
        class to allow flexibility of metadata sources. """
        pass

    def initialize(self):
        """ Initialize. """
        self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__PROGRESS': 0})
        self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__STATUS': 'Collecting metadata from the incoming file.'})

    def workflow_decision(self):
        """ Determine if the workflow is passes or fails and send the TTLs through the workflow. """
        self.mediator_helper.logger.info('Starting decision logic to determine the next workflow state.')

        material_track_type = self.material_helper.get_track_types()[0]

        latest_workflow_state = self.material_helper.get_latest_workflow_state()
        pre_registered = self.material_helper.get_short_text_value('Pre Registered').upper() == 'TRUE'
        browse_capable = True

        media_type = self.material_helper.get_short_text_value('Media Type')

        if 'OriginalAudio1' in self.material_helper.get_track_types():
            self.mediator_helper.logger.info('OriginalAudio TTLs present on the material.')
            self.comments.append({'TrackTypeName': material_track_type, 'CommentTypeName': 'Analyze',
                                  'Detail': 'OriginalAudio TTLs present on the material.'})
            self.mediator_helper.logger.info('COMMENT SS1')

        if media_type == 'Video' or media_type == 'Audio':
            if not self.material_helper.has_track_type_class('AUDIO'):
                self.mediator_helper.logger.info('Missing audio layout mapping.')
                self.comments.append({'TrackTypeName': material_track_type, 'CommentTypeName': 'Analyze', 'Detail': 'Missing audio layout mapping.'})
                self.mediator_helper.logger.info('COMMENT SS2')

        if not pre_registered and not latest_workflow_state == 'Update Metadata':
            self.mediator_helper.logger.info('Asset was not pre-registered.')
            self.comments.append({'TrackTypeName': material_track_type, 'CommentTypeName': 'Analyze', 'Detail': 'Asset was not pre-registered.'})
            self.mediator_helper.logger.info('COMMENT SS3')

        if not browse_capable:
            self.mediator_helper.logger.info('Failed to make Browse.')
            self.comments.append({'TrackTypeName': material_track_type, 'CommentTypeName': 'Analyze', 'Detail': 'Failed to make Browse.'})

        if media_type not in ['Video', 'Image', 'Audio', 'Document']:
            self.mediator_helper.logger.info('Unknown file extension.')
            if latest_workflow_state == 'Update Metadata':
                self.comments.append({'TrackTypeName': material_track_type,
                                 'CommentTypeName': 'Analyze',
                                 'Detail': 'Media Type has changed to an unknown during metadata update.'})
            else:
                self.comments.append({'TrackTypeName': material_track_type,
                                 'CommentTypeName': 'Analyze',
                                 'Detail': 'Unknown file extension.'})

        if len(self.comments) > 0:
            self.mediator_helper.logger.info('Material has failed the Analyze workflow state.')

            self.mediator_helper.logger.info('Comments List: ')
            for i in range(0, len(self.comments)):
                self.mediator_helper.logger.info('{0}'.format(self.comments[i]))

            param = {'CommentList': {'Comment': self.comments}}
            self.mediator_helper.med_client.generic_call('comment', 'addComments', matId=self.mat_id, commentList=param)
            self.analyze_result = False
        else:
            self.mediator_helper.logger.info('Material has passed the Analyze workflow state.')
            self.analyze_result = True

    def safe_set_shorttext(self, short_text, metadata):
        """ A function to safely add a shorttext """
        if metadata:
            self.material_helper.set_short_text_value(short_text, metadata)

    def safe_set_tag(self, tag, metadata):
        """ A function to safely add a tag """
        if metadata:
            self.material_helper.set_tag_value(tag, metadata)

    def finalize(self):
        """ Finalize. """

        param_ttl = []
        for ttl in self.material_helper.get_track_types():
            param_ttl.append({'TrackTypeName': ttl})
        param_material = {'Material': {'MatId': self.mat_id, 'TrackTypeLink': param_ttl}}

        if self.analyze_result:
            """self.mediator_helper.med_client.workflow.transition(self.mat_id, self.material_helper.get_track_types(), self.PASSED_TRIGGER)"""
            param_requirement = {'Requirement': {'Name': 'Done', 'Ordinality': 0}}
            self.mediator_helper.med_client.generic_call('workflow', 'transition', material=param_material, requirement=param_requirement)
            status = 'Passed the Analyze State.'
            self.mediator_helper.logger.info('FINALIZE PASS')
        else:
            """self.mediator_helper.med_client.workflow.transition(self.mat_id, self.material_helper.get_track_types(), 'Failed')"""

            param_requirement = {'Requirement': {'Name': 'Failed', 'Ordinality': 0}}
            self.mediator_helper.med_client.generic_call('workflow', 'transition', material=param_material, requirement=param_requirement)

            status = 'Failed the Analyze State.'
            self.mediator_helper.logger.info('FINALIZE FAIL')
        self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__PROGRESS': 100})
        self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__STATUS': status})

    def analyze(self):
        """ Main method to handle the Analyze workflow state. """
        self.initialize()

        self.mediator_helper.logger.info('Material Id: {0}'.format(self.mat_id))
        self.mediator_helper.logger.info('Collecting metadata from the incoming file.')

        self.update_material_object_with_metadata()
        self.mediator_helper.logger.info('Metadata has been successfully collected.')

        self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__PROGRESS': 50})
        self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__STATUS': 'Saving the metadata against the material.'})
        self.mediator_helper.logger.info('Saving the metadata against the material.')

        self.mediator_helper.logger.debug('The following material object will be saved:')
        self.mediator_helper.logger.debug(self.material_helper)

        try:
            self.material_helper.material_save()

            self.mediator_helper.logger.info('MATERIAL SAVE:')
            self.mediator_helper.logger.info(self.material_helper.material)

        except MediatorException as e:
            self.cleanup_on_error(e)
            raise AnalyzeException(e)

        self.mediator_helper.logger.info('The material has been saved successfully.')
        self.workflow_decision()
        self.finalize() 

    def cleanup_on_error(self, e):
        """ Transition the Material and update the Job Status. """
        self.mediator_helper.med_client.workflow.transition(self.mat_id, self.material_helper.get_track_types(),
                                                            self.FAILED_TRIGGER)
        # Type checking because someone wanted to pass Strings into this function.
        if isinstance(e, basestring):
            error_message = e
        elif (len(e.args) > 0):
            error_message = e.args[0]
        else:
            error_message = "An unknown error has occurred."
        self.mediator_helper.med_client.job.update_status_map(self.mediator_helper.job_id, {'JOB__ERROR': error_message})
