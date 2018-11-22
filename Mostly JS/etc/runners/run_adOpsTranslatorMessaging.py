#!/usr/bin/python
'''
@author: Karthik
'''

"""
Script will send Material Inserts / Updates to TL
Adds a new record in MEDIATOR_ASSET_NOTIFICATION in TL
Columns -> action, entityid, entitytype, pxf
action -> I, U, or D (i.e. insert, update, delete)
entitytype -> adops_qc_workorder
"""
from shellfun import MediatorXMLHttpClient as MediatorService
import xml.etree.ElementTree as ET

from xml.dom import minidom
from subprocess import call, Popen, PIPE, STDOUT
from shellfun import pp
import sys
import datetime
import uuid


runner_env = sys.argv[1].split('+')
mediator_ip = runner_env[0]
mediator_session_key = runner_env[1]
mediator_job_id = runner_env[2]

service = MediatorService(mediator_ip)
service.session_key = mediator_session_key

def find_system_name():
    try:
      print("Attempting to Self Identify System")
      system_settings_list_xml = u'''<Command subsystem="systemSettings" method="getSystemSettingsList"></Command>'''
      result = service.wscall(system_settings_list_xml)
    except Exception as e:
          print(e)

    dev_system_title = "NBCU GMO X DEV DC"
    qa_system_title = "NBCU GMO X QA DC"
    prod_system_title = "NBCU GMO X PROD EC"

    matchedSystem = None

    # See if any of the Systems Titles Match Dev / QA / Prod
    system_title = result.find("CommandList/Command/Output/SystemSettingsList/SystemSettings/SystemTitle").text
    print(system_title)

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
        print("update_tl_database(): Enity - "+entity_id)
        print("update_tl_database(): Action - "+action)
        print("update_tl_database(): Entity Type - "+entity_type)
        file_path = "/tmp/"+str(uuid.uuid4())+".txt"
        url = find_system_name()
        with open(file_path,"w") as text_file:
          text_file.write(ET.tostring(xml))
        # print(ET.tostring(xml))
        cmd = "java -jar /srv/dc-dvs/mediatorTemp/tl-integration.jar " + url + " " + entity_id + " " + entity_type + " " + action + " " + file_path
        #print cmd
        p = Popen(cmd, shell=True, stdin=PIPE, stdout=PIPE, stderr=STDOUT, close_fds=True)
        output = p.stdout.read()
        print output
    except Exception as e:
        print(e)
#
#Main
#
try:   
    result = service.job_parameter_get(mediator_job_id,"jobDescription")
    entity_type = result.find("CommandList/Command/Output/JobDescription/Properties/Mapping/Entity").text
    action = result.find("CommandList/Command/Output/JobDescription/Properties/Mapping/EntityAction").text
    entity_id = result.find("CommandList/Command/Output/JobDescription/Properties/Mapping/domainKey").text
    
    print("Job ID - "+mediator_job_id)
    print("Entity ID from Job Description - "+entity_id)
    print("Entity Type from Job Description - "+entity_type)
    print("Entity Action from Job Description - "+action)
    
    # Now call the placing either way
    xml = service.placing_get(entity_id,'parcelMaterial')

    for Event in xml.iter(tag='Event'):
        # Find each materialID in TrimMaterialId
        trim_mat_id = Event.find('.//TrimMaterialId').text
        print('trim_mat_id - ' + trim_mat_id)
        # Filter by QC Comments
        comment_type = "QC Comments"
        trim_mat_xml = service.material_get_comment_filter(trim_mat_id, comment_type, 'shorttext', 'fulltext', 'comments', 'tag', 'tracktypelinks')
        for mat in trim_mat_xml.iter(tag='Material'):
            print(mat)
            if mat is not None:
                print('found mat in trim_mat_xml')
                Material = Event.findall('Material')
                for M in Material:                    
                    if M is not None:
                        M.clear()
                print('Adding mat to Event Material')
                Event.append(mat)
            # ET.dump(Event)

    presets = xml.find('.//Presets')
    if presets is not None :
        presets.clear()

    notes = ET.Element("Notes")
    notesList = service.get_notes(entity_id).findall('.//Note')
    if notesList is not None :
        for note in notesList:
            notes.append(note)
        xml.find('.//Placing').append(notes)
    placing_state = xml.find('.//StateName').text
    if placing_state is not None:
        print('calling update_tl_database on placing in state ' + placing_state)
    else:
        print('calling update_tl_database on placing')
    update_tl_database(entity_id, entity_type, action,xml)

except Exception as e:
    raise
