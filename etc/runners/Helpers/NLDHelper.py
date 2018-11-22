""" Created in October 2018 for the NBC Cable MAM Project
@author: Tomo Nikolovski, Dat Loi """

from Helpers.MediatorHelper import MediatorHelper
from evertz.mediator.webservice import MediatorException


class NLDHelperException(Exception):
    pass


class NLDHelper(object):
    """ NLD Helper class """

    def __init__(self):
        self.mediator_helper = MediatorHelper()
        
    def material_get(self, matId, options):
        """ Get material information """
        cmd =  {
          "Subsystem": "material",
          "Method": "get",
          "ParameterList": {
            "matId": matId,
            "options": {
              "MaterialOptions": {
                "Option": options
              }
            }
          }
        }
        return self.mediator_helper.med_client.wscall(cmd)

    def placing_get(self, placing_id, options):
        """ Get placing information  """
        cmd = {
            "Subsystem": "placing",
            "Method": "get",
            "ParameterList": {
                "placingId": placing_id,
                "options": {"PlacingOptions": {"Option": options}}}}
        return self.mediator_helper.med_client.wscall(cmd)

    def placing_workflow_transition(self, placing_id, requirement):
        cmd = {
            "Subsystem": "workflow",
            "Method": "transition",
            "ParameterList": {
                "placing": {
                    "Placing": {
                        "PlacingId": placing_id,
                        "StateMachine": "Servicing"
                    }
                },
                "requirement": {
                    "Requirement": {
                        "Name": requirement,
                        "Ordinality": 0
                    }
                }
            }
        }
        return self.mediator_helper.med_client.wscall(cmd)

    def get_placing_id(self, job_desc):
        """ Return placing id """
        return job_desc['Job']['Description']['Properties']['PlacingId']

    def get_placing_start_date(self, placing):
        """ Return start date of the placing """
        return placing['Placing']['StartDate']

    def get_placing_end_date(self, placing):
        """ Return end date of the placing """
        return placing['Placing']['EndDate']

    def get_placing_current_state(self, placing):
        """ Return the current state of the placing """
        return placing['Placing']['StateName']

    def get_placing_created_date(self, placing):
        """ Return the created date of the placing """
        return placing['Placing']['CreatedDate']

    def get_last_edited_date(self, placing):
        """ Return the last edited date of the placing """
        return placing['Placing']['LastEdited']

    def get_pub_def_name(self, placing):
        """ Return the publication definition name of the placing """
        return placing['Placing']['PlacingPublicationList']['PlacingPublication'][0]['PublicationDefinition']['Name']

    def get_material_type_profile_list(self, pub_def_name):
        """ Return the profile map of the placing """
        get_pub_def_cmd = {
            "Subsystem": "placing",
            "Method": "getPublicationDefinition",
            "ParameterList": {
                "publicationDefinition": {
                    "PublicationDefinition": {
                        "Name": pub_def_name,
                        "UsesParcel": True
                    }
                }
            }
        }
        pub_def = self.mediator_helper.med_client.wscall(get_pub_def_cmd)
        return pub_def['PublicationDefinition']['MaterialTypeProfileMap']

    def get_ttls_from_profile_map(self, profile_name):
        """ Get the Track Type Links from a given profile map. """
        profile_cmd = {
            "Subsystem": "trackType",
            "Method": "getProfile",
            "ParameterList": {
                "profileName": profile_name
            }
        }
        profile_ttls = self.mediator_helper.med_client.wscall(profile_cmd)['Profile']['TrackTypeGroupList'][0][
            'TrackTypeList']
        ttl_list_in_profile = [ttl['Name'] for ttl in profile_ttls]
        return ttl_list_in_profile

    def get_packaging_folder(self, placing):
        """ Return files directory. """
        return placing['Placing']['placingId'] + '.dir/'

    def get_parcel_name(self, placing):
        """ Return parcel name """
        return placing['Placing']['PlacingParcelList']['PlacingParcel'][0]['Parcel']['ParcelName']

    def get_preset_list(self, placing):
        """ Return the list of preset in the placing """
        preset_group = placing['Placing']['PlacingPublicationList']['PlacingPublication'][0]['PublicationDefinition']
        ['Presets']['Preset']
        preset_list = [preset['Name'] for preset in preset_group]
        return preset_list

    def get_preset_tags(self, name):
        """ Return a list of the tags from a preset """
        custom_option = {
            "PresetOptions": {
                "Option": [
                    "tag"
                ]
            }
        }
        tag_list = self.mediator_helper.med_client.generic_call('preset', 'get', presetName=name,
                                                                options=custom_option)['Preset']['TagList']['Tag']
        return tag_list

    def get_preset_shorttext(self, name):
        """ Return a list of the shorttext from a preset """
        custom_option = {
            "PresetOptions": {
                "Option": [
                    "shorttext"
                ]
            }
        }
        short_text_list = self.mediator_helper.med_client.generic_call("preset", "get", presetName=name,
                                                        options=custom_option)['Preset']['ShortTextList']['ShortText']

        return short_text_list

    def placing_save(self, placing):
        """ Save Placing """
        cmd = {
            "Subsystem": "placing",
            "Method": "save",
            "ParameterList": {
                "placing": {
                    placing
                }
            }
        }
        return self.mediator_helper.med_client.wscall(cmd)

    def add_note(self, placing_id, note_type, content):
        """ Add notes to the placing. """
        cmd = {
                "Subsystem": "note",
                "Method": "saveNote",
                "ParameterList": {
                    "note": {
                        "Note": {
                            "DomainType": "Placing",
                            "DomainKey": placing_id,
                            "NoteType": {
                                "Name": note_type,
                                "NoteClass": "ERROR"
                            },
                            "Importance": "AVERAGE",
                            "Content": content
                        }
                    }
                }
            }
        return self.mediator_helper.med_client.wscall(cmd)

    def build_parcel(self, placing_id, pub_def_name, parcel_name, frame_rate, parcel_title, duration, mat_id, outcode):
        """ A compilePlacing WS call to create the parcel within the given placing.
        For now a placing would always have one material. Hence, the same duration and frame rate is used
        everywhere across the WS call"""

        cmd = {
            "Subsystem": "placing",
            "Method": "compilePlacing",
            "ParameterList": {
                "masterPlacing": {
                    "Placing": {
                        "PlacingId": placing_id,
                        "PlacingPublicationList": {
                            "PlacingPublication": [
                                {
                                    "PublicationDefinition": {
                                        "Name": pub_def_name
                                    }
                                }
                            ]
                        },
                        "PlacingParcelList": {
                            "PlacingParcel": [
                                {
                                    "Ordinality": 1,
                                    "Parcel": {
                                        "ParcelName": parcel_name,
                                        "ParcelType": "Placing",
                                        "FrameRate": frame_rate,
                                        "Title": parcel_title,
                                        "Duration": {
                                            "Time": duration,
                                            "Rate": frame_rate
                                        },
                                        "ParcelEventList": {
                                            "Event": [
                                                {
                                                    "EventType": 'Video',
                                                    "FrameRate": frame_rate,
                                                    "TrimMaterialId": mat_id,
                                                    "ParcelOffset": {
                                                        "Time": "00:00:00:00",
                                                        "Rate": frame_rate
                                                    },
                                                    "Outcode": {
                                                        "Text": outcode,
                                                        "Rate": frame_rate
                                                    },
                                                    "Duration": {
                                                        "Time": duration,
                                                        "Rate": frame_rate
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        }

        return self.mediator_helper.med_client.wscall(cmd)
