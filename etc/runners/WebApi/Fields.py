import json
from Models import Models, ValidationError
from datetime import datetime
from dateutil.parser import parse as dateParse

class Field(object):
    def __init__(self, name=None, value=None, fieldType=None):
        self.type = fieldType
        self.name = name
        self.value = value

    def __str__(self):
        return self.value

    def validate(self):
        if isinstance(self.value, self.type):
            return self.value
        else:
            raise ValidationError("Type mismatch: expected [%s]" % (str(self.type)),
                self.name,
                self.value)

class StringField(Field):
    def __init__(self, name=None, value=None):
        super(StringField, self).__init__(name, value, basestring)

class IntegerField(Field):
    def __init__(self, name=None, value=None):
        super(IntegerField, self).__init__(name, value, int)

class ArrayField(Field):
    def __init__(self, name=None, value=None):
        super(ArrayField, self).__init__(name, value, list)

class DictField(Field):
    def __init__(self, name=None, value=None):
        super(DictField, self).__init__(name, value, dict)

class BooleanField(Field):
    def __init__(self, name=None, value=None):
        super(BooleanField, self).__init__(name, value, bool)

class TagField(Field):
    def __init__(self, name=None, value=None):
        super(TagField, self).__init__(name, value, basestring)

    def validate(self):
        model = Models()
        if self.value in model.materialSave[self.name]['values']:
            return self.value
        else:
            raise ValidationError(
                "Invalid value [%s] for field [%s]" % (self.value, self.name),
                self.name,
                self.value
            )

class DateTimeField(Field):
    def __init__(self, name=None, value=None):
        super(DateTimeField, self).__init__(name, value, datetime)

    def validate(self):
        try:
            if isinstance(dateParse(self.value), self.type):
                return self.value
            else:
                raise ValidationError("Error parsing date", self.name, self.value)
        except ValueError as err:
            raise ValidationError(err, self.name, self.value)

class HttpResponse(object):
    def __init__(self, statusCode, body={}, headers={}, base64=False):
        self._statusCode = IntegerField(name="statusCode", value=statusCode).validate()
        self._body = DictField(name="body", value=body).validate()
        self._headers = DictField(name="headers", value=headers).validate()
        self._base64 = BooleanField(name="base64", value=base64).validate()

    """
    Returns a Lambda Proxy-friendly object. Only the body is serialized,
    not the entire object.
    """
    def serialize(self):
        return {
            'isBase64Encoded'   : self._base64,
            'statusCode'        : self._statusCode,
            'headers'           : self._headers,
            'body'              : json.dumps(self._body)
        }

    @property
    def statusCode(self):
        return self._statusCode

    @statusCode.setter
    def statusCode(self, value):
        self._statusCode = IntegerField(name="statusCode", value=value).validate()

    @property
    def base64(self):
        return self._base64

    @base64.setter
    def base64(self, value):
        self._base64 = BooleanField(name="base64", value=value).validate()

    @property
    def headers(self):
        return self._headers

    @headers.setter
    def headers(self, value):
        self._headers = DictField(name="headers", value=value).validate()

    @property
    def body(self):
        return self._body

    @body.setter
    def body(self, value):
        self._body = DictField(name="body", value=value).validate()