#!/usr/bin/python
'''
@author: Jeremy, Karthik
'''

"""
ShellFun: Python Version of Mediator Webservice Client
"""

import xml.etree.ElementTree as ET
from xml.dom import minidom
import httplib
import sys
import os

def pp(elem):
    """Return a pretty-printed XML string for the Element."""
    rough_string = ET.tostring(elem, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    print reparsed.toprettyxml(indent="  ",newl="\n")

class MediatorXMLException(Exception):
    """Base of all exceptions in Mediator."""
    def parse(self, element):
        self.code = element.findtext("Code")
        self.message = element.findtext("Message")
        self.cause = element.findtext("Cause")
        return self

    def __str__(self):
        return self.message

class MediatorXMLHttpClient:
    """String in, XML out, HTTP connection to Mediator"""
    def __init__(self, server):
        self.server = server
        self._headers = {"Content-type": "text/xml"}
        self.session_key = "no session yet"

    def wscall(self, xml_command):
        '''Wraps the incoming Command XML in the CommandList and PharosCs nodes with the SessionKey.
           Sends the XML request to the Mediator server and returns the Output node.
           Raises a MediatorXMLException if there is an error (typically due to a CommandException)'''
        try:
            # Wrap the command part in the CommandList and PharosCS nodes.
            xml_request = u'''
                <PharosCs>
                  <CommandList sessionKey="%s">
                    %s
                  </CommandList>
                </PharosCs>''' % (self.session_key, xml_command)

            # HTTP POST the UTF-8 encoded document to the web services url with the XML content-type header.
            self._conn = httplib.HTTPConnection(self.server)
            self._conn.request("POST", '/mediator/main/ws', xml_request.encode('utf-8'), self._headers)
            result = self._conn.getresponse()
            # Print out the HTTP response codes to check for HTTP errors - (should be 200 OK)
            #print 'HTTP response: %s %s' % (result.status, result.reason)
            # Parse the XML body of the response into ElementTree
            # Can throw an exception if it can't parse (empty result for example)
            root = ET.parse(result).getroot()
        except Exception as e:
            self._conn.close()
            #print "REQUEST FAILED: [%s--%s]" % (type(e), str(e))
            raise
        else:
            self._conn.close()
            #print "RECEIVED:\n"+ET.tostring(root)
            exception = root.find('CommandList/Command/Output/CommandException')
            if exception is None:
                #print "COMMAND OK!"
                return root
            else:
                #print 'ERROR: [%s] %s' % (exception.findtext('Code'), exception.findtext('Message'))
                raise MediatorXMLException().parse(exception)
                
    def login(self, user_name, password):
        """Mediator Web Services Login.
           Login to Services using username and password and sets the session key.
           Args:
               user_name: The name of this user
               password: The password for this user
           Returns:
               None
        """
        command = u'''
            <Command subsystem="login" method="login">
              <ParameterList>
                <Parameter name="userName" value="%s"/>
                <Parameter name="password" value="%s"/>
              </ParameterList>
            </Command>''' % (user_name, password)
        result = self.wscall(command)
        self.session_key = result.find('CommandList/Command/Output').text
        #print 'Session key: %s' % self.session_key

    def material_get(self, mat_id, *args):
        """Get a material.
           Args:
               mat_id: material ID to get
               *args: 0 or more options (extraData, comments, markers, playlist, requests, history, tracks, trackTypeLinks, stateGroups, owners, episode, browseInfo, tag, fulltext, shorttext, placing)
           Returns:
               	Full command response containing a Material
        """
        # Constructing Options
        material_options = ""
        for option in args:
            material_options = material_options + u'''<Option>%s</Option>''' % (option)
        #Constructing Command & Substituting mat_id & material_options
        command = u'''
            <Command subsystem="material" method="get">
              <ParameterList>
                <Parameter name="matId" value="%s"/>
                <Parameter name="options">
                  <Value>
                    <MaterialOptions>
                      %s
                    </MaterialOptions>
                  </Value>
                </Parameter>
              </ParameterList>
            </Command>''' % (mat_id, material_options)
        return self.wscall(command)

    def material_get_comment_filter(self, mat_id, comment_type, *args):
        """Get a material.
           Args:
                mat_id: material ID to get
                comment_type: for filtering, needs different spot in XML
                *args: 0 or more options (comments, shorttext, etc)
           Returns:
            Full command response containing a Material
        """
        # Constructing Options
        material_options = ""
        for option in args:
            material_options = material_options + u'''<Option>%s</Option>''' % (option)
        # Constructing Command & Substituting mat_id & material_options
        command = u'''
            <Command subsystem="material" method="get">
              <ParameterList>
                <Parameter name="matId" value="%s"/>
                <Parameter name="options">
                    <Value>
                    <MaterialOptions>
                        %s
                    </MaterialOptions>
                    </Value>
                </Parameter>
                <Parameter name="commentTypes">
                        <Value>
                        <TextList>
                            <Text>%s</Text>
                                </TextList>
                            </Value>
                </Parameter>
              </ParameterList>
            </Command>''' % (mat_id, material_options, comment_type )
        return self.wscall(command)

    def placing_get(self, placing_id, *args):
        """Get a placing.
           Args:
               placing_id: placing ID to get
               *args: 0 or more options (children, childrenLight, destination, destinationSpecificMetadata,fulltext, history, logging, master, material, owners, parcel,parcelMaterial, profileStatus, shorttext, tag)
           Returns:
               	Full command response containing a Placing
        """
        # Constructing Options
        placing_options = ""
        for option in args:
            placing_options = placing_options + u'''<Option>%s</Option>''' % (option)
        #Constructing Command & Substituting placing_id & placing_options
        command = u'''
            <Command subsystem="placing" method="get">
              <ParameterList>
                <Parameter name="placingId" value="%s"/>
                <Parameter name="options">
                  <Value>
                    <PlacingOptions>
                      %s
                    </PlacingOptions>
                  </Value>
                </Parameter>
              </ParameterList>
            </Command>''' % (placing_id, placing_options)
        return self.wscall(command)

    def brand_get(self, brandCode, *args):
        """Get a brand.
           Args:
               code: brand code to get
               *args: 0 or more options (shorttext, fulltext, tag)
           Returns:
               	Full command response containing a brand
        """
        # Constructing Options
        brand_options = ""
        for option in args:
            brand_options = brand_options + u'''<Option>%s</Option>''' % (option)
        #Constructing Command & Substituting code & brand_options
        command = u'''
            <Command subsystem="brand" method="get">
              <ParameterList>
                <Parameter name="brandCode" value="%s"/>
                <Parameter name="options">
                  <Value>
                    <BrandOptions>
                      %s
                    </BrandOptions>
                  </Value>
                </Parameter>
              </ParameterList>
            </Command>''' % (brandCode, brand_options)
        return self.wscall(command)

    def series_get(self, seriesCode, *args):
        """Get a series.
           Args:
               code: series code to get
               *args: 0 or more options (shorttext, fulltext, tag)
           Returns:
               	Full command response containing a series
        """
        # Constructing Options
        series_options = ""
        for option in args:
            series_options = series_options + u'''<Option>%s</Option>''' % (option)
        #Constructing Command & Substituting code & series_options
        command = u'''
            <Command subsystem="series" method="get">
              <ParameterList>
                <Parameter name="seriesCode" value="%s"/>
                <Parameter name="options">
                  <Value>
                    <SeriesOptions>
                      %s
                    </SeriesOptions>
                  </Value>
                </Parameter>
              </ParameterList>
            </Command>''' % (seriesCode, series_options)
        return self.wscall(command)

    def episode_get(self, episodeId, *args):
        """Get a episode.
           Args:
               code: episode code to get
               *args: 0 or more options (shorttext, fulltext, tag)
           Returns:
               	Full command response containing a episode
        """
        # Constructing Options
        episode_options = ""
        for option in args:
            episode_options = episode_options + u'''<Option>%s</Option>''' % (option)
        #Constructing Command & Substituting code & episode_options
        command = u'''
            <Command subsystem="episode" method="get">
              <ParameterList>
                <Parameter name="episodeId" value="%s"/>
                <Parameter name="options">
                  <Value>
                    <EpisodeOptions>
                      %s
                    </EpisodeOptions>
                  </Value>
                </Parameter>
              </ParameterList>
            </Command>''' % (episodeId, episode_options)
        return self.wscall(command)


    def job_parameter_get(self, job_id, param):
        """Get a Job Paraneter for Job ID .
           Args:
               job_id: job id to get
               param: job parameter name
           Returns:
               	Full command response containing the param namd & value
        """
        #Constructing Command & Substituting job_id & param
        command = u'''
            <Command subsystem="job" method="getJobParameter">
              <ParameterList>
                <Parameter name="jobId" value="%s"/>
                <Parameter name="parameterName" value="%s"/>
              </ParameterList>
            </Command>''' % (job_id, param)
        return self.wscall(command)


    def make_workflow_transistion(self, requirement, mat_id, track_Type_Name ):
        """Make Workflow Transition for a Material
            Args:
                requirement: Trigger Name
                mat_id: Material Identifier
                track_Type_Name: Track Type Name
        """
        command = u'''
            <Command subsystem="workflow" method="transition">
                <ParameterList>
                    <Parameter name="requirement">
                    	<Value>
                    		<Requirement>
                    			<Name>%s</Name>
                    		</Requirement>
                    	</Value>
                    </Parameter>
                    <Parameter name="material">
                    	<Value>
                    		<Material>
                    			<MatId>%s</MatId>
                				<TrackTypeLink>
                            		<TrackTypeName>%s</TrackTypeName>
                            	</TrackTypeLink>
                        	</Material>
                    	</Value>
                    </Parameter>
                </ParameterList>
            </Command>''' % (requirement, mat_id, track_Type_Name )
        return self.wscall(command)
		
    def get_notes(self,placing_id):
        """Get Notes for Placing
                Args:
                placing_id :  Domain Key to Get Notes
        """
        command = u'''
            <Command subsystem="note" method="getNotes">
                <ParameterList>
                <Parameter name="domainKey" value="%s"/>
                    <Parameter name="domainType">
                        <Value>
                    <NoteDomainType>
                        Placing
                    </NoteDomainType>
                        </Value>
                    </Parameter>
                </ParameterList>
            </Command>''' % (placing_id)
        return self.wscall(command)

    def logout(self):
        """Mediator Web Services Logout.
           Logs out of the existing mediator session.
           Args:
               None
           Returns:
               None
        """
        self.wscall('<Command subsystem="login" method="logout"/>')
#if __name__ == "__main__":
#    client = MediatorXMLHttpClient("100.125.130.82")
#    client.login("wsuser", "wspass")
#    pp(client.material_get("GMO_00000000000339_01","tracktypelinks"))
#    client.placing_get("CANAL_SYFY0000000000002576","parcel");
#    client.logout
