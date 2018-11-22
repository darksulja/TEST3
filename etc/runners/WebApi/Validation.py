from Fields import StringField, TagField, ArrayField, DateTimeField, IntegerField
from Models import Models, ValidationError

"""
Receives metadata and compiles it into either Mediator or TL format, depending on the given destination.
For Mediator: returns a tuple of Metadata objects separated by Tag, ShortText and FullText. For TL:
returns a single, flat list containing all metadata attributes.
"""
def compileMetadata(dest="MEDIATOR", data={}):
    if dest.upper() == "MEDIATOR":
        tags = [{'TagType': m['label'], 'Value': m['value']} for m in data.get('metadata', []) if m['type'] == "Tag"]
        shorttexts = [{'ShortTextType': m['label'], 'Value': m['value']} for m in data.get('metadata', []) if m['type'] == "ShortText"]
        fulltexts = [{'FullTextType': m['label'], 'Value': m['value']} for m in data.get('metadata', []) if m['type'] == "FullText"]

        tagList = Metadata(metadataType="Tag", data=tags)
        shortTextList = Metadata(metadataType="ShortText", data=shorttexts)
        fullTextList = Metadata(metadataType="FullText", data=fulltexts)

        return tagList, shortTextList, fullTextList
    elif dest.upper() == "TL":
        metadata = {'ShortText': data['ShortTextList']['ShortText'], 'Tag': data['TagList']['Tag'], 'FullText' : data['FullTextList']['FullText']}
        md = [[{'label': x[m+'Type'], 'value': x.get('Value', ''), 'type': m} for x in metadata[m]] for m in metadata]

        return md[0] + md[1] + md[2]
    else:
        raise AttributeError('compileMetadata received an invalid destination. Expected "MEDIATOR" or "TL"')

"""
Branding class (not to be confused with Brand). Must be one of the types
'Brand', 'Series', or 'Episode'.
"""
class Branding(object):
    def __init__(self, brandingType):
        types = ['Brand', 'Series', 'Episode']
        if brandingType not in types:
            raise ValidationError(message="Invalid branding type", field="branding", value=brandingType)
        
        self.type = brandingType
        self.body = {
            self.type: {
                    "Title": '',
                    "Description": '',
                    "LastEdited": ''
            }
        }

"""
Metadata class. Must be one of the types 'ShortText', 'FullText', or 'Tag'.
Use addData() to add key/value pairs after object instantiation.
"""
class Metadata(object):
    def __init__(self, metadataType, data=[]):
        types = ['ShortText', 'FullText', 'Tag']
        if metadataType not in types:
            raise ValidationError(message="Invalid metadata type", field="metadata", value=metadataType)

        self.type = metadataType
        self.body = {
            self.type: [] if not data else data
        }

    def __str__(self):
        return self.type

    def addData(self, data):
        self.body[self.type].append(data)

"""
Top-level class used for representing Materials.
"""
class Material(object):
    def __init__(self):
        self.body = {
            "Material": {
                "MatId": '',
                "Title": '',
                "MaterialType": '',
                "Owner": [{"Name": "Default"}]
            }
        }

    def __str__(self):
        return self.body['Material']['MatId']

"""
Top-level class used for representing Placings.
"""
class Placing(object):
    def __init__(self):
        self.body = {
            "Placing": {
                "PlacingId": '',
                "Title": '',
                "StartDate": '',
                "ShortTextList": {},
                "FullTextList": {},
                "TagList": {}
            }
        }

class Video(Material):
    def __init__(self):
        super(Video, self).__init__()
        self.body['Material']['AspectRatio'] = ''
        self.body['Material']['VersionType'] = ''
        self.body['Material']['TrackTypeLink'] = []

class Audio(Material):
    def __init__(self):
        super(Audio, self).__init__()
        self.body['Material']['TrackTypeLink'] = []

class Document(Material):
    def __init__(self):
        super(Document, self).__init__()

class Image(Material):
    def __init__(self):
        super(Image, self).__init__()
        self.body['Material']['AspectRatio'] = ''

class TrackTypeLink:
    def __init__(self, trackTypeName, stateName="Not available", stateMachine="NBCU Cable MAM"):
        self.body = {
            "TrackTypeName": trackTypeName,
            "StateName": stateName,
            "StateMachine": stateMachine
        }

class Validate:
    """Validate fields and values of JSON input."""
    def __init__(self, jsonData, functionName):
        self.data = jsonData
        self.models = Models()
        self.functionName = functionName

        if not self.functionName:
            raise ValidationError(message="No API function name defined", field="functionName", value=False)

    """
    Map and validate incoming Placing (aka, "Order") JSON into the Placing Save format expected by Mediator.
    """
    def placingSave(self, data):
        try:
            placing = Placing()
            placing.body['Placing']['PlacingId'] = StringField(name='id', value=data.get('id', '')).validate()
            placing.body['Placing']['Title'] = StringField(name='title', value=data.get('title', '')).validate()
            placing.body['Placing']['StartDate'] = DateTimeField(name='dueDate', value=data.get('dueDate', '')).validate()

            tagList, shortTextList, fullTextList = compileMetadata(data=data)

            shortTextList.addData({'Licensee': data.get('licensee', '')})
            shortTextList.addData({'Profile': data.get('profile', '')})
            shortTextList.addData({'Work Order Title': placing.body['Placing']['Title']})
            shortTextList.addData({'Due Date': placing.body['Placing']['StartDate']})
            fullTextList.addData({'Materials': data.get('materials', [])})

            placing.body['Placing']['TagList'] = tagList.body
            placing.body['Placing']['ShortTextList'] = shortTextList.body
            placing.body['Placing']['FullTextList'] = fullTextList.body

            return placing
        except ValidationError as err:
            raise ValidationError(message=err.message, field=err.field, value=err.value)


    """
    Map and validate incoming JSON into the Material Save format expected by Mediator.
    Format depends on Material type.
    """
    def materialSave(self, data):
        registrationClass = data.get('registrationClass', False)
        if registrationClass == "video":
            material = Video()
            material.body['Material']['MatId'] = StringField(name='id', value=data.get('id', '')).validate()
            material.body['Material']['Title'] = StringField(name='title', value=data.get('title', '')).validate()
            material.body['Material']['MaterialType'] = TagField(name='materialType', value=data.get('materialType', '')).validate()
            material.body['Material']['AspectRatio'] = TagField(name='aspectRatio', value=data.get('aspectRatio', '')).validate()
            material.body['Material']['VersionType'] = TagField(name='versionType', value=data.get('versionType', '')).validate()
            material.body['Material']['TrackTypeLink'] = ArrayField(name='trackTypeLinks', value=map(lambda x: TrackTypeLink(x['trackTypeName']).body,
                                                            data.get("trackTypeLinks", {}))).validate()
        elif registrationClass == "audio":
            material = Audio()
            material.body['Material']['MatId'] = StringField(name='id', value=data.get('id', '')).validate()
            material.body['Material']['Title'] = StringField(name='title', value=data.get('title', '')).validate()
            material.body['Material']['MaterialType'] = TagField(name='materialType', value=data.get('materialType', '')).validate()
            material.body['Material']['TrackTypeLink'] = ArrayField(name='trackTypeLinks', value=map(lambda x: TrackTypeLink(x['trackTypeName']).body,
                                                            data.get("trackTypeLinks", {}))).validate()
        elif registrationClass == "document":
            material = Document()
            material.body['Material']['MatId'] = StringField(name='id', value=data.get('id', '')).validate()
            material.body['Material']['Title'] = StringField(name='title', value=data.get('title', '')).validate()
            material.body['Material']['MaterialType'] = TagField(name='materialType', value=data.get('materialType', '')).validate()
        elif registrationClass == "image":
            material = Image()
            material.body['Material']['MatId'] = StringField(name='id', value=data.get('id', '')).validate()
            material.body['Material']['Title'] = StringField(name='title', value=data.get('title', '')).validate()
            material.body['Material']['MaterialType'] = TagField(name='materialType', value=data.get('materialType', '')).validate()
            material.body['Material']['AspectRatio'] = TagField(name='aspectRatio', value=data.get('aspectRatio', '')).validate()
        else:
            raise ValidationError(message="No registration class defined", field="registrationClass", value=False)

        tagList, shortTextList, fullTextList = compileMetadata(data=data)

        material.body['Material']['TagList'] = tagList.body
        material.body['Material']['ShortTextList'] = shortTextList.body
        material.body['Material']['FullTextList'] = fullTextList.body

        return material

    def brandSave(self, data):
        try:
            brand = Branding(brandingType="Brand")
            brand.body['Brand']['BrandCode'] = StringField(name='id', value=data.get('id', '')).validate()
            brand.body['Brand']['Title'] = StringField(name='title', value=data.get('title', '')).validate()
            brand.body['Brand']['Description'] = StringField(name='description', value=data.get('description', '')).validate()
            brand.body['Brand']['LastEdited'] = DateTimeField(name='lastEdited', value=data.get('lastEdited', '')).validate()

            tagList, shortTextList, fullTextList = compileMetadata(data=data)

            brand.body['Brand']['TagList'] = tagList.body
            brand.body['Brand']['ShortTextList'] = shortTextList.body
            brand.body['Brand']['FullTextList'] = fullTextList.body

            return brand
        except ValidationError as err:
            raise ValidationError(message=err.message, field=err.field, value=err.value)

    def episodeSave(self, data):
        try:
            episode = Branding(brandingType="Episode")
            episode.body['Episode']['EpisodeId'] = StringField(name='id', value=data.get('id', '')).validate()
            episode.body['Episode']['Title'] = StringField(name='title', value=data.get('title', '')).validate()
            episode.body['Episode']['Description'] = StringField(name='description', value=data.get('description', '')).validate()
            episode.body['Episode']['LastEdited'] = DateTimeField(name='lastEdited', value=data.get('lastEdited', '')).validate()
            episode.body['Episode']['EpisodeNuber'] = IntegerField(name='episodeNumber', value=data.get('episodeNumber', '')).validate()
            episode.body['Episode']['Series'] = {
                'SeriesCode': StringField(name='seriesId', value=data.get('seriesId', '')).validate()
            }

            tagList, shortTextList, fullTextList = compileMetadata(data=data)

            episode.body['Episode']['TagList'] = tagList.body
            episode.body['Episode']['ShortTextList'] = shortTextList.body
            episode.body['Episode']['FullTextList'] = fullTextList.body

            return episode
        except ValidationError as err:
            raise ValidationError(message=err.message, field=err.field, value=err.value)

    def seriesSave(self, data):
        try:
            series = Branding(brandingType="Series")
            series.body['Series']['SeriesCode'] = StringField(name='id', value=data.get('id', '')).validate()
            series.body['Series']['Title'] = StringField(name='title', value=data.get('title', '')).validate()
            series.body['Series']['Description'] = StringField(name='description', value=data.get('description', '')).validate()
            series.body['Series']['LastEdited'] = DateTimeField(name='lastEdited', value=data.get('lastEdited', '')).validate()
            series.body['Series']['SeriesNumber'] = IntegerField(name='seriesNumber', value=data.get('seriesNumber', '')).validate()
            series.body['Series']['Brand'] = { # save must be called with the 'brand' option!
                'BrandCode': StringField(name='brandId', value=data.get('brandId', '')).validate()
            }

            tagList, shortTextList, fullTextList = compileMetadata(data=data)

            series.body['Series']['TagList'] = tagList.body
            series.body['Series']['ShortTextList'] = shortTextList.body
            series.body['Series']['FullTextList'] = fullTextList.body

            return series
        except ValidationError as err:
            raise ValidationError(message=err.message, field=err.field, value=err.value)

    def validate(self):
        try:
            return getattr(self, self.functionName)(data=self.data)
        except AttributeError as err:
            print "[Error]", err
            raise ValidationError(message="Function name not found in validation class", field="functionName", value="%s" % self.functionName)
        except ValidationError as err:
            raise err