import httplib
import os
import json

class MediatorExceptionJson(Exception):
    """Base of all exceptions in Mediator."""
    def parse(self, element):
        self.code = element["Code"]
        self.message = element["Message"]
        self.cause = element.get("Cause")
        return self

    def __str__(self):
        return self.message

class MediatorHttpClientJson:
    """JSON Object in, JSON Object out, HTTP connection to Mediator"""
    def __init__(self, server, password):
        self.server = server
        self._headers = {"Content-type": "application/json"}
        self.session_key = password

    def wscall(self, command):
        '''Wraps the incoming Command in the CommandList and PharosCs nodes with the SessionKey.
           Sends the request to the Mediator server and returns the Output node.
           Raises a MediatorExceptionJson if there is an error (typically due to a CommandException)'''
        try:
            # Wrap the command part in the CommandList and PharosCS nodes.
            req = {u'PharosCs': {u'CommandList': {u'SessionKey': self.session_key, u'Command': [command]}}}
            # HTTP POST the UTF-8 encoded document to the web services url with the JSON content-type header.
            self._conn = httplib.HTTPConnection(self.server)
            self._conn.request("POST", '/mediator/main/ws', json.dumps(req), self._headers)
            result = self._conn.getresponse()
            # Print out the HTTP response codes to check for HTTP errors - (should be 200 OK)
            if (result.status != 200):
                print 'HTTP response: %s %s' % (result.status, result.reason)
            # Parse the JSON body of the response into an Object
            # Can throw an exception if it can't parse (empty result for example)
            root = json.load(result)
        except Exception as e:
            self._conn.close()
            #print "REQUEST FAILED: [%s--%s]" % (type(e), str(e))
            raise
        else:
            self._conn.close()
            output = root['PharosCs']['CommandList']['Command'][0].get('Output')
            if output and 'CommandException' in output:
                exception = output['CommandException']
                #print 'ERROR: [%s] %s' % (exception['Code'], exception['Message'])
                raise MediatorExceptionJson().parse(exception)
            else:
                return output

    def login(self, user_name, password, api_token):
        login_command = {"Subsystem": "login", "Method": "login",
                "ParameterList": {
                    "userName": user_name,
                    "password": password,
                    "apiVersion": '7',
                    "sessionType": api_token

                }
            }

        login_result = self.wscall(login_command)
        self.session_key = login_result
    	return self.session_key
    def logout(self):
        self.wscall({"Subsystem": "login", "Method": "logout"})

    def generate_matId(self):
        cmd = {"Subsystem": "tools", "Method": "generateId", "ParameterList": {"script": "materialGenerator", "sequenceName": "SEQUENCE_NAME"}}
        return self.wscall(cmd)

    def material_get(self, mat_id, options):
        cmd = {"Subsystem": "material", "Method": "get", "ParameterList": {"matId": mat_id, "options": {"MaterialOptions": {"Option": options} } }}
        return self.wscall(cmd)

    def placing_get(self, placingId, options):
        cmd = {"Subsystem": "placing", "Method": "get", "ParameterList": {"placingId": placingId, "options": {"PlacingOptions": {"Option": options} } }}
        return self.wscall(cmd)

    def brand_get(self, code, options):
        cmd = {"Subsystem": "brand", "Method": "get", "ParameterList": {"brandCode": code, "options": {"BrandOptions": {"Option": options} } }}
        return self.wscall(cmd)

    def series_get(self, code, options):
        cmd = {"Subsystem": "series", "Method": "get", "ParameterList": {"seriesCode": code, "options": {"SeriesOptions": {"Option": options} } }}
        return self.wscall(cmd)

    def episode_get(self, id, options):
        cmd = {"Subsystem": "episode", "Method": "get", "ParameterList": {"episodeId": id, "options": {"EpisodeOptions": {"Option": options} } }}
        return self.wscall(cmd)

    def material_save(self, materialBody):
        cmd = {"Subsystem": "material", "Method": "save", "ParameterList": {"material": materialBody}}
        return self.wscall(cmd)

    def placing_save(self, placingBody):
        cmd = {"Subsystem": "placing", "Method": "save", "ParameterList": {"placing": placingBody}}
        return self.wscall(cmd)

    def brand_save(self, brandBody):
        cmd = {"Subsystem": "brand", "Method": "save", "ParameterList": {"brand": brandBody}}
        return self.wscall(cmd)

    def episode_save(self, episodeBody):
        cmd = {"Subsystem": "episode", "Method": "save", "ParameterList": {"episode": episodeBody}}
        return self.wscall(cmd)

    def series_save(self, seriesBody):
        cmd = {"Subsystem": "series", "Method": "save", "ParameterList": {"series": seriesBody}}
        return self.wscall(cmd)