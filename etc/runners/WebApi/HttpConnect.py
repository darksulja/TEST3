import httplib
import json

class HttpConnection:
    """Generic HTTP connection module."""
    
    def __init__(self, server):
        self.server = server
    
    def __str__(self):
        return self.server

    def connect(self, method="GET", path="", body="", headers={}):
        self._conn = httplib.HTTPConnection(self.server)
        self._conn.request(method, path, body, headers)
        self.res = self._conn.getresponse()

        return {
            "status"    : self.res.status,
            "message"   : self.res.reason,
            "body"      : self.res.read()
        }