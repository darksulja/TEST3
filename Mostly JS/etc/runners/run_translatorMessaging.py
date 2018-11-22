#!/usr/bin/python
'''
@author: Karthik
'''

"""
Script will send Material Inserts / Updates to TL
Adds a new record in MEDIATOR_ASSET_NOTIFICATION in TL
Columns -> action, entityid, entitytype, pxf
action -> I, U, or D (i.e. insert, update, delete)
entitytype -> brand, series, episode, material, placing
"""
from shellfun import MediatorXMLHttpClient as MediatorService
import xml.etree.ElementTree as ET
from xml.dom import minidom
from subprocess import call, Popen, PIPE, STDOUT
from shellfun import pp;
import sys;
import datetime;
import uuid;


runner_env = sys.argv[1].split('+')
mediator_ip = runner_env[0]
mediator_session_key = runner_env[1]
mediator_job_id = runner_env[2]

service = MediatorService(mediator_ip)
service.session_key = mediator_session_key

#array of comment types to pull

commentTypes = ["QC","Notes for Referral","Library Clean Up Notes","Rejection Reason"]

def find_system_name():
    try:
      print("Attempting to Self Identify System")
      system_settings_list_xml = u'''<Command subsystem="systemSettings" method="getSystemSettingsList"></Command>'''
      result = service.wscall(system_settings_list_xml);
    except Exception as e:
          print(e)

    dev_system_title = "NBCU GMO X DEV DC"
    qa_system_title = "NBCU GMO X QA DC"
    prod_system_title = "NBCU GMO X PROD EC"

    matchedSystem = None

    # See if any of the Systems Titles Match Dev / QA / Prod
    system_title = result.find("CommandList/Command/Output/SystemSettingsList/SystemSettings/SystemTitle").text;
    print(system_title);

    if system_title == dev_system_title:
      matchedSystem = dev_system_title
      return('jdbc:oracle:thin:MEDIATOR_USER/MEDIATOR_USER_12c@dev-tl.inbcu.com:16120:D336')
    elif system_title == qa_system_title:
      matchedSystem = qa_system_title
      return('jdbc:oracle:thin:MEDIATOR_USER/MEDIATOR_USER_12c@qa-tl.inbcu.com:1521/tl')
    elif system_title == prod_system_title:
      matchedSystem = prod_system_title
      return('jdbc:oracle:thin:MEDIATOR_USER/MEDIATOR_USER_12c@tl.inbcu.com:1521/tl')
    else:
      print('No matching system tiltle')
      pass
    if matchedSystem == None:
      print("System was not found")
      raise Exception('Identity Crisis: Failed to Match a System')

def update_tl_database(entity_id, entity_type, action,xml) :
    try:
        print("update_tl_database(): Enity - "+entity_id);
        print("update_tl_database(): Action - "+action);
        print("update_tl_database(): Entity Type - "+entity_type);
        file_path = "/tmp/"+str(uuid.uuid4())+".txt";
        url = find_system_name();
        with open(file_path,"w") as text_file:
          text_file.write(ET.tostring(xml))
        #print(ET.tostring(xml))
        #call(['java', '-jar',
        #      '/srv/dc-dvs/mediatorTemp/tl-integration.jar',
        #       url, entity_id, entity_type, action, file_path]);
        cmd = "java -jar /srv/dc-dvs/mediatorTemp/tl-integration.jar " + url + " " + entity_id + " " + entity_type + " " + action + " " + file_path
        #print cmd
        p = Popen(cmd, shell=True, stdin=PIPE, stdout=PIPE, stderr=STDOUT, close_fds=True)
        output = p.stdout.read()
        print output
    except Exception as e:
        print(e)

def saveShortTextValue(entity_id, shortTextType, shortTextValue) :
    try:
          save_xml_command = u'''<Command subsystem="material" method="save">
            <ParameterList>
               <Parameter name="material">
                 <Value>
                    <Material>
                         <MatId>%s</MatId>
                         <ShortTextList>
                              <ShortText>
                                   <ShortTextType>%s</ShortTextType>
                                   <Value>%s</Value>
                              </ShortText>
                         </ShortTextList>
                    </Material>
                 </Value>
               </Parameter>
            </ParameterList>
          </Command>''' % (entity_id,shortTextType,shortTextValue);

          service.wscall(save_xml_command);

    except Exception as e:
        print(e)

def saveTrackTypeShortText(entity_id, trackType, shortTextType, shortTextValue) :
    try:
          save_xml_command = u'''<Command subsystem="material" method="save">
            <ParameterList>
               <Parameter name="material">
                 <Value>
                    <Material>
                         <MatId>%s</MatId>
                         <TrackTypeLink>
                         <TrackTypeName>%s</TrackTypeName>
                              <ShortTextList>
                                   <ShortText>
                                        <ShortTextType>%s</ShortTextType>
                                        <Value>%s</Value>
                                   </ShortText>
                              </ShortTextList>
                         </TrackTypeLink>
                    </Material>
                 </Value>
               </Parameter>
            </ParameterList>
          </Command>''' % (entity_id,trackType,shortTextType,shortTextValue);

          service.wscall(save_xml_command);

    except Exception as e:
        print(e)
#
def getShortTextValue(xml,shortTextType):
  print "The ShortTextType is ", shortTextType
  shortText = xml.find(".//ShortText[ShortTextType='{value}']".format(value=shortTextType))
  if shortText is not None:
     value = shortText.find('.//Value').text
     print "The ShortTextType Value is ", value
     return  value
  else:
    return ""
#
def checkConditions(entity_id, entity_type):
  debug = False
  result = True
  errorText = ""
  #
  if "TEST" in entity_id:
    errorText =  "* TEST in Entity ID"
    result = False
  else:
    if debug:
      print("No TEST in Enity ID" )

  if "TRANS" in entity_id:
    errorText = errorText + "* TRANS in Entity ID"
    result = False
  else:
    if debug:
      print("No TRANS in Enity ID" )

  if "TRNS" in entity_id:
    errorText = errorText + "* TRNS in Entity ID"
    result = False
  else:
    if debug:
      print("No TRNS in Enity ID" )  
	  
  if "UTS" in entity_id:
    errorText = errorText + "* UTS in Entity ID"
    result = False
  else:
    if debug:
      print("No UTS in Enity ID" )

  if "GMO_PR" in entity_id:
    errorText = errorText + "* GMO_PR in Entity ID"
    result = False
  else:
    if debug:
      print("No GMO_PR in Enity ID" )

  if entity_id.startswith("CNFM"):
    errorText = errorText + "* CNFM in Entity ID"
    result = False
  else:
    if debug:
      print("No CNF in Enity ID" )      
  
  if entity_id.endswith("_01"):
    errorText = errorText + "* Entity ID ends in *_01"
    result = False
  else:
    if debug:
      print("Enity ID does not end in *_01")

  return result, errorText

def getComments(entity_id,trackType,commentType):
  #
  # Comments types : "SUBTITLE","Compliance","QC","VtrError","ingestWarning","Auto QC Failure","Auto QC","Compliance Notes","Edit-BLUR",
  #   "Edit-Break","Edit-Cut","Edit-MASK","Edit-Misc","Edit-MUTE","Edit-Notes","Notes for Referral","Restrictions","Vantage","Upload",
  #   "Library Clean Up Notes","OM Upload","Ingest Review - MSM","Rejection Reason"
  #
  # add new TextList option to include new Comment
  #
  xml_command = u''' <Command subsystem="comment" method="getComments">
        <ParameterList>
          <Parameter name="matId" value="%s"/>
            <Parameter name="trackTypeName" value="%s"/>
            <Parameter name="commentTypeName" value="%s"/>
          </ParameterList>
      </Command>''' % (entity_id,trackType,commentType)

  commentsXml = service.wscall(xml_command)
  #print(xml_command)
  # Build Return object
  return commentsXml;  
#
#Main
#
try:
    print("Job ID -"+mediator_job_id)
    result = service.job_parameter_get(mediator_job_id,"jobDescription")
    entity_type = result.find("CommandList/Command/Output/JobDescription/Properties/Mapping/Entity").text
    action = result.find("CommandList/Command/Output/JobDescription/Properties/Mapping/EntityAction").text
    print("Entity Type from Job Description - "+entity_type)
    print("Action from Job Description - "+action)
    if entity_type == 'material':
        entity_id = result.find("CommandList/Command/Output/JobDescription/Properties/Mapping/domainKey").text
         # Add Data Element -> Asset Creation Date
        if action == "I" :
              saveShortTextValue(entity_id, "Asset Creation Date", datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S'));

        trigger = result.find("CommandList/Command/Output/JobDescription/Properties/Mapping/trackTypeLink/TrackTypeLink/TrackTypeName")
        if trigger is not None :
              trigger = trigger.text

        print(trigger)

        if trigger == "Video" :
              saveTrackTypeShortText(entity_id, trigger, "Transition Date", datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S'));

        xml_command = u'''<Command subsystem="material" method="get">
              <ParameterList>
                <Parameter name="matId" value="%s"/>
               <Parameter name="options">
                  <Value>
                    <MaterialOptions>
                      <Option>brand</Option>
                      <Option>brandLinks</Option>
                      <Option>browseInfo</Option>
                      <Option>deletedTracks</Option>
                      <Option>episode</Option>
                      <Option>extraData</Option>
                      <Option>files</Option>
                      <Option>nonSegmentMarkers</Option>
                      <Option>owners</Option>
                      <Option>playlist</Option>
                      <Option>relatedComments</Option>
                      <Option>requests</Option>
                      <Option>segmentLinks</Option>
                      <Option>segments</Option>
                      <Option>series</Option>
                      <Option>seriesLinks</Option>
                      <Option>shorttext</Option>
                      <Option>stateGroups</Option>
                      <Option>streamDefinitions</Option>
                      <Option>tag</Option>
                      <Option>tracks</Option>
                      <Option>trackTypeLinks</Option>
                      <Option>virtualMaterialParcel</Option>
                    </MaterialOptions>
                  </Value>
                </Parameter>
                 <Parameter name="episodeOptions">
                  <Value>
                    <EpisodeOptions>
                     <Option>shorttext</Option>
                     <Option>fulltext</Option>
                     <Option>tag</Option>
                    </EpisodeOptions>
                  </Value>
                </Parameter>
                <Parameter name="brandOptions">
                  <Value>
                    <BrandOptions>
                     <Option>shorttext</Option>
                     <Option>fulltext</Option>
                     <Option>tag</Option>
                    </BrandOptions>
                  </Value>
                </Parameter>
                 <Parameter name="seriesOptions">
                  <Value>
                    <SeriesOptions>
                     <Option>shorttext</Option>
                     <Option>fulltext</Option>
                     <Option>tag</Option>
                    </SeriesOptions>
                  </Value>
                </Parameter>
              </ParameterList>
        </Command>''' % (entity_id)
        xml = service.wscall(xml_command);
        # Material Transition -> As Automatic Transition is broken in Mediator for GMOShellOrder
        try:
          if action == "I" :
              isVideoTrackType = False
              stateName = ""
              for trackTypeLinks in xml.iter(tag='TrackTypeLink'):
                  isVideoTrackType = False
                  stateName = ""
                  for element in trackTypeLinks.iter():
                      if element.tag == "TrackTypeName" and element.text == "Video" :
                          isVideoTrackType = True
                          print "TrackTypeName - " +  element.text
                      if isVideoTrackType and element.tag == "StateName" :
                          stateName = element.text
                          print "StateName - " +  element.text
                          break
                  if isVideoTrackType :
                      break
              if (stateName == "Not available") and ("UTS" not in entity_id) :
                  service.make_workflow_transistion("Order Placed",entity_id,"Video")
        except Exception as e:
          print(e)
        
            #
        #Comments for material
        comments = ET.Element("Comments");
        
        for trackTypeLinks in xml.iter(tag='TrackTypeLink'):
          for element in trackTypeLinks.iter():
              if element.tag == "TrackTypeName":
                for commentType in commentTypes:
                  comment = getComments(entity_id,element.text.replace('&','&amp;'),commentType).findall('.//Comment');
                  if comment is not None :
                    print "TrackTypeName - " +  element.text
                    print "Comment Type - " + commentType
                    for detail in comment:
                      detail.TrackType = element.text
                      comments.append(detail)

        if comments is not None and action != "D":
          #print ET.tostring(comments)
          xml.find('.//Material').append(comments)
               
    elif entity_type == 'workorder':
        entity_id = result.find("CommandList/Command/Output/JobDescription/Properties/Mapping/domainKey").text
        xml = service.placing_get(entity_id,'profileStatus','tag','shorttext','parcel','fulltext')
        parcelList = xml.find('.//ParcelEventList')
        if parcelList is not None :
            parcelList.clear()
        presets = xml.find('.//Presets')
        if presets is not None :
            presets.clear();
        if action != "D":
            notes = ET.Element("Notes");
            notesList = service.get_notes(entity_id).findall('.//Note');
            if notesList is not None :
                for note in notesList:
                    notes.append(note)
                xml.find('.//Placing').append(notes)
    #Adding Additional Logic to update brand , series , episode in TL
    #
    # checkConditions was a move of two IF statements to define,
    # Turn on debug = true for more detail in logs
    #
    # compareSortListTypeValue looks for ShortText entity MX TL Status Override or any other text value
    # and will always over ride the results of checkConditions
    #
    
    get_result, get_errorText = checkConditions(entity_id, entity_type);
    print "DEBUG get_result, get_errorText", get_result, get_errorText
    print "Entity ID -"+entity_id
    if "TEST" not in entity_id:
        print "DEBUG: Running checkCondition"
        checkCondition = getShortTextValue(xml,"MX TL Status Override").lower() =="true"
        print "DEBUG: Value of checkCondition -", checkCondition
    else:
        get_errorText = get_errorText + "** TEST in entry ID"
        checkCondition = False
    #
    if get_result is True or checkCondition is True:
        try :
              brand = xml.find(".//BrandCode")
              if brand is not None :
                  brand_xml = service.brand_get(brand.text,"shorttext","fulltext","tag");
                  update_tl_database(brand.text, "brand", "U", brand_xml);
        except Exception as e:
              print("Error Updating brand"+e)

        try :
              series = xml.find(".//SeriesCode")
              if series is not None :
                  series_xml = service.series_get(series.text,"shorttext","fulltext","tag","brand");
                  update_tl_database(series.text, "series", "U", series_xml);
        except Exception as e:
              print("Error Updating series"+e)

        try :
              episode = xml.find(".//EpisodeId")
              if episode is not None :
                  episode_xml = service.episode_get(episode.text,"shorttext","fulltext","tag","series");
                  update_tl_database(episode.text, "episode", "U", episode_xml);
        except Exception as e:
              print("Error Updating episode"+e)
    # Finally all other Material types
        update_tl_database(entity_id, entity_type, action,xml);
    else:
        print("Ignoring Status Update " + get_errorText)
except Exception as e:
    raise
