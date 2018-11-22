import sys
import requests
import requests.auth
from evertz.public import MediatorWSHTTPClient

class AuthToken:
    """Requests an authorization token from TL for use in the header of notifications."""
    def __init__(self, cid, secret, endpoint):
        self.CLIENT_ID = cid
        self.CLIENT_SECRET = secret
        self.TOKEN_ENDPOINT = endpoint

    def get_token(self):
        client_auth = requests.auth.HTTPBasicAuth(self.CLIENT_ID, self.CLIENT_SECRET)
        post_data = {
            "grant_type": "client_credentials",
            "scope": "tl-mam-asset-service/assets.read"
        }
    	response = requests.post(self.TOKEN_ENDPOINT,
            auth = client_auth,
            data = post_data)

    	token_json = response.json()
        return "Bearer " + token_json["access_token"]