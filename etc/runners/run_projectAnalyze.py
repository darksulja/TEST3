#!/usr/bin/python

import sys
from AnalyzeHelper import AbstractAnalyzeHelper, AnalyzeException

class ProjectAnalyzeHelper(AbstractAnalyzeHelper):
    def __init__(self):
        super(ProjectAnalyzeHelper, self).__init__()

    def collect_metadata(self):
        pass
        
    def update_material_object_with_metadata(self):
        """ Update the Material Object with metadata. Metadata collection is defined in the implementation
        class to allow flexibility of metadata sources. """

        # Use a fixed Duration, Incode and Outcode values because it is a single Project. Encode the Track.
        duration = '00:00:00;01'
        incode = '00:00:00;00'
        outcode = '00:00:00;01'
        self.material_helper.set_duration(duration)
        self.material_helper.set_outcode(self.MEDIA_NAME, outcode)
        self.material_helper.set_incode(self.MEDIA_NAME, incode)
        self.material_helper.set_encoded(self.MEDIA_NAME, True)


if __name__ == "__main__":
    try:
        projectAnalyze = ProjectAnalyzeHelper()
        projectAnalyze.analyze()
        sys.exit()
    except AnalyzeException as e:
        projectAnalyze.mediator_helper.logger.exception(e)
        sys.exit(1)
    except Exception as e:
        projectAnalyze.mediator_helper.logger.exception(e)
        sys.exit(1)
