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

class ServicingStatusNotify:
    def __init__(self, placingId):
        self.placingId = placingId

    # This function may or may not be used, pending a decision on how we're going to extract the main material
    # from a placing. We will likely use MainMaterial and this will go away. For now we're returning an empty list.
    def parseParcel(self, parcels):
        events = [parcel.get('Parcel', {}).get('ParcelEventList', {}).get('Event', []) for parcel in parcels.get('PlacingParcel', [])][0]
        materials = [
            {
                "id"        : event.get('TrimMaterialId', ''),
                "inCode:"   : event.get('EventTrim', {}).get('Text', ''),
                "outCode"   : event.get('Outcode', {}).get('Text', '')
            }
        for event in events]

        return []

    def formatResponse(self, jsonBody):
        body = jsonBody.get('Placing', {})

        res = {
            "id"                : self.placingId,
            "title"             : body.get('Title', ''),
            "dueDate"           : body.get('StartDate', ''),
            "licensee"          : next((st['Value'] for st in body['ShortTextList']['ShortText'] if st['ShortTextType'] == 'Licensee'), ""),
            "profile"           : next((st['Value'] for st in body['ShortTextList']['ShortText'] if st['ShortTextType'] == 'Profile'), ""),
            "lastEdited"        : body.get('LastEdited', ''),
            "userName"          : body.get('UserName', ''),
            "state"             : body.get('StateName', ''),
            "materials"         : [body.get('MainMatId')],
            "metadata"          : compileMetadata("TL", body)
        }

        return res

    def notify(self):
        client = MediatorHttpClientJson(constants['MEDIATOR']['CLIENT']['IP'], constants['MEDIATOR']['CLIENT']['PASSWORD'])
        mediatorResponse = client.placing_get(self.placingId, ["history", "parcel", "shorttext", "fulltext", "tag"])
        client.logout

        if mediatorResponse == None:
            res = {"Errors": ["Order ID not found."]}
            return res
        else:
            res = self.formatResponse(mediatorResponse)
            print("Placing ID [%s], State: [%s]" % (res.get('id'), res.get('state')))
            return res


if __name__ == '__main__':
    mediatorHelper = MediatorHelper()
    job = mediatorHelper.med_client.job.get(mediatorHelper.job_id)
    host, skey, job_id = sys.argv[1].split('+')
    med_client = MediatorWSHTTPClient(host, skey)

    placingId = job['Job']['Description']['Properties']['domainKey']
    clientId = job['Job']['Description']['Properties']['clientId']
    clientSecret = job['Job']['Description']['Properties']['clientSecret']

    servicingNotify = ServicingStatusNotify(placingId)

    try:
        body = servicingNotify.notify()
        print "[Notification], ID: [%s]" % placingId
        pprint(body)

        tlEndpointTags = med_client.generic_call("tag", "search", tagType="TL Endpoint")['TagList']['Tag']
        notify = {"Headers": {}}
        notify['Path'] = next((tag['Description'] for tag in tlEndpointTags if tag['Value'] == 'OrderPath'))
        notify['URL'] = next((tag['Description'] for tag in tlEndpointTags if tag['Value'] == 'URL'))
        notify['TokenHost'] = next((tag['Description'] for tag in tlEndpointTags if tag['Value'] == 'TokenHost'))
        notify['Headers']['Host'] = next((tag['Description'] for tag in tlEndpointTags if tag['Value'] == 'OrderHost'))
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