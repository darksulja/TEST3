'''
Created on Nov 23, 2017

@author: Jeff Kalbfleisch
'''
import logging
logger = logging.getLogger(__name__)


class IPWSHelper:
    def __init__(self):
        logger.debug("Init IPWS Helper")

    def find_matching_assets(self, list_of_assets, filters):
        matching_assets = []
        for asset in list_of_assets:
            asset_description = asset['AssetDescription']
            match = True
            for filter in filters:
                if not self.does_asset_match(asset_description, filter):
                    match = False
            if match:
                matching_assets.append(asset)
        return matching_assets

    def does_asset_match(self, asset_description, filter):
        filter_key, filter_value = filter
        root_value = asset_description.get(filter_key)
        if root_value is not None and root_value == filter_value:
            return True

        attributes = asset_description['Attributes']['Attribute']
        for attribute in attributes:
            name = attribute["@Name"]
            text = attribute["#text"]
            if name == filter_key and text == filter_value:
                return True

        return False

    def get_value(self, asset_description, key):
        root_value = asset_description.get(key)
        if root_value is not None:
            return root_value

        attributes = asset_description['AssetDescription']['Attributes']['Attribute']
        for attribute in attributes:
            name = attribute["@Name"]
            text = attribute["#text"]
            if name == key:
                return text