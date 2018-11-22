#!/usr/bin/python

import sys
import json
from pprint import pprint
from evertz.mediator.webservice import MediatorException  # Currently not a public module.
from evertz.public import MediatorWSHTTPClient
from Helpers.MediatorHelper import MediatorHelper
from WebApi.MediatorHttpClient import MediatorHttpClientJson
from WebApi.MediatorConstants import constants
from WebApi.Validation import compileMetadata
from WebApi.HttpConnect import HttpConnection
from WebApi.AuthToken import AuthToken

DEBUG = False

class StatusNotify:
    def __init__(self, matId):
        self.matId = matId
        self.ttlStates = []

    def trackTypeLinksFormat(self, ttl, history={}):
        ttlName = ttl.get('TrackTypeName', '')
        ttlState = ttl.get('StateName', '')
        self.ttlStates.append({"name": ttlName, "state": ttlState})

        return {
            "name"                  : ttlName,
            "code"                  : constants['MEDIATOR']['TRACK_TYPE_LINK']['CODES'].get(ttlName, ''),
            "state"                 : ttlState,
            "userName"              : history.get('UserName', ''),
            "transitionDateTime"    : history.get('TimeOccurred', ''),
            "transitionComment"     : ttl['Comment'].pop().get('Detail', '') if 'Comment' in ttl else '',
            "metadata"              : compileMetadata("TL", ttl)
        }

    def formatResponse(self, jsonBody):
        body = jsonBody.get('Material', {})
        ttls = body.get('TrackTypeLink', {})
        lastHistory = body['StateHistoryGroup'].pop(0) if body['StateHistoryGroup'] else {}

        res = {
            "id"                : self.matId,
            "title"             : body.get('Title', ''),
            "duration"          : body.get('Duration', {}).get('Time', ''),
            "frameRate"         : body.get('FrameRate', '') if body.get('MaterialType') == 'Video' else 'N/A',
            "aspectRatio"       : body.get('AspectRatio', ''),
            "transformation"    : body.get('Transformation', ''),
            "materialType"      : body.get('MaterialType', ''),
            "versionType"       : body.get('VersionType', ''),
            "revision"          : body.get('Revision', ''),
            "episodeId"         : body.get('EpisodeId', ''),
            "lastEdited"        : body.get('LastEdited', ''),
            "trackTypeLinks"    : [self.trackTypeLinksFormat(ttl, lastHistory) for ttl in ttls],
            "metadata"          : compileMetadata("TL", body)
        }

        return res

    def notify(self):
        client = MediatorHttpClientJson(constants['MEDIATOR']['CLIENT']['IP'], constants['MEDIATOR']['CLIENT']['PASSWORD'])
        mediatorResponse = client.material_get(self.matId, ["trackTypeLinks", "history", "shorttext", "fulltext", "tag"])
        client.logout

        if mediatorResponse == None:
            res = {"Errors": ["Material ID not found."]}
            return res
        else:
            res = self.formatResponse(mediatorResponse)
            for i in ["Track: [%s], State: [%s]" % (track['name'], track['state']) for track in self.ttlStates]: print(i)
            return res

if __name__ == '__main__':
    mediatorHelper = MediatorHelper()
    job = mediatorHelper.med_client.job.get(mediatorHelper.job_id)
    host, skey, job_id = sys.argv[1].split('+')
    med_client = MediatorWSHTTPClient(host, skey)

    matId = job['Job']['Description']['Properties']['material']['Material']['MatId']
    clientId = job['Job']['Description']['Properties']['clientId']
    clientSecret = job['Job']['Description']['Properties']['clientSecret']

    statusNotify = StatusNotify(matId)

    try:
        body = statusNotify.notify()
        print "[Notification], ID: [%s]" % matId
        pprint(body)

        tlEndpointTags = med_client.generic_call("tag", "search", tagType="TL Endpoint")['TagList']['Tag']
        notify = {"Headers": {}}
        notify['Path'] = next((tag['Description'] for tag in tlEndpointTags if tag['Value'] == 'AssetPath'))
        notify['URL'] = next((tag['Description'] for tag in tlEndpointTags if tag['Value'] == 'URL'))
        notify['TokenHost'] = next((tag['Description'] for tag in tlEndpointTags if tag['Value'] == 'TokenHost'))
        notify['Headers']['Host'] = next((tag['Description'] for tag in tlEndpointTags if tag['Value'] == 'AssetHost'))
        notify['Headers']['Token'] = AuthToken(clientId, clientSecret, notify['TokenHost']).get_token()
        conn = HttpConnection(notify['URL'])
        res = conn.connect(
            method="POST",
            path=notify['Path'],
            body=json.dumps(body),
            headers={"Host": notify['Headers']['Host'], "Authorization": notify['Headers']['Token']}
        )
        print "[TL Reply]"
        pprint(res)
        sys.exit(0)
    except MediatorException as e:
        error_message = "An unknown error has occurred."
        if len(e.args) > 0:
            error_message = e.args[0]
        mediatorHelper.med_client.job.update_status_map(mediatorHelper.job_id, {'JOB__ERROR': error_message})
        mediatorHelper.logger.exception(error_message)
        sys.exit(1)
    except Exception as e:
        mediatorHelper.logger.exception('An unknown error has occurred.')
        sys.exit(1)