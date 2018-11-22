#!/usr/bin/python

""" Created in June 2018 for the NBC Cable MAM Project.
@author: Sara Alizadeh """

import sys

from Helpers.AnalyzeHelper import AbstractAnalyzeHelper, AnalyzeException
from evertz.mediator.webservice import MediatorException


class UnknownAnalyzeHelper(AbstractAnalyzeHelper):

    def __init__(self):
        super(UnknownAnalyzeHelper, self).__init__()
        self.material_type = str(self.material_helper.get_track_types()[0])
        self.track_file = self.material_helper.get_track_file(self.MEDIA_NAME, self.material_type)

    def collect_metadata(self):
        pass
        
    def update_material_object_with_metadata(self):
        pass


if __name__ == "__main__":

    try:
        unknownAnalyze = UnknownAnalyzeHelper()
        unknownAnalyze.analyze()
        sys.exit()
    except AnalyzeException as e:
        unknownAnalyze.logger.exception(e)
        sys.exit(1)
    except Exception as e:
        unknownAnalyze.logger.exception(e)
        sys.exit(1)
