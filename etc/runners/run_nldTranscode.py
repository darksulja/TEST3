#!/usr/bin/python

""" Created on July 2018 for the NBC Cable MAM Project
@author: Dat Loi """

import sys
import logging
from Helpers.NLDHelper import NLDHelper
from Helpers.MaterialHelper import MaterialHelper
from Helpers.S3Helper import S3Helper, S3HelperException
from evertz.public import MediatorWSHTTPClient
from evertz.public import RenderXTranscodeJob, RenderXTimelineItem, RenderXConfig, RenderXClipEvent, RenderXCivolutionWatermarkEvent, RenderXRestClient, RenderXRecordEvent

SRC_MEDIA_ACCESS_NAME = 'mediator-pmam-dev'

def send_renderx_job(src_file, dst_file, output_def, renderx_ip, update_func, cloudian_cred=None):
    """
        A function for creating a renderX job. Returns the message from the renderX. 

        Input:
            src_file - A string for local path or a dictionary for an s3 bucket 
            dst_file - A string for local path or a dictionary for an s3 bucket 
            output_def - A string for the renderx profile to use 
            renderx_ip - A string for the ip for the renderX
            cloudian_cred - A string for the endpoints for the cloudian profile 
        Output: 
            result - A string representation of the RenderX job result
    """
    
    # Create the job and configuration for the Job.
    renderx_job = RenderXTranscodeJob()
    renderx_config = RenderXConfig()
    
    # Add the config to the job.
    renderx_job.add_config(renderx_config)
 
    # This calls into Mediator to fetch an external object of type 'renderXOutputDefinition' by that name.
    # This method can be called multiple times if multiple output definitions are being used by the job.
    renderx_config.add_output_def_by_name(output_def, med_client)
     
     
    # Here we create our timeline item and add it to the job.
    # The timeline will contain all the events, and the time at which those events should happen (relative to the target file(s).
    # If no frame value is set, then it will start from 0.
    renderx_timeline_item = RenderXTimelineItem()
    renderx_timeline_item.set_frame(0) # this is not needed as it defaults to 0
     
    # Add the timeline item to the job. We can continue to add to this timeline object below as its all a reference to the same object.
    renderx_job.add_timeline_item(renderx_timeline_item)

    # Add the cloudian credientials 
    if cloudian_cred: 
        renderx_config.set_aws_config(endpoint=cloudian_cred, profile='default')
     
    # A clip event is simple a clip to be used a source for the job, this can optionally include audio layout/mapping
    # And even include external audio and a layout specific to that.
    renderx_clip = RenderXClipEvent()
     
    # Here we add a file to the clip event (the main video file), and can (optionally) specify the duration and incode/cue time.
    # Not specifying the duration/cue will play the clip from the start for the entire duration.
    renderx_clip.set_clip_file(file_name=src_file)
     
    # Add the clip to the timeline.
    renderx_timeline_item.add_event(renderx_clip)
    
    renderx_record = RenderXRecordEvent()
    renderx_record.add_record(file_name=dst_file, output_def_name=output_def)
     
    # Add the record to the timeline.
    renderx_timeline_item.add_event(renderx_record)
     

     
    # This would be the IP/Port of the RenderX you are attempting to connect with.
    # A later example will show how to parse a job created by Mediator that allocates the Apparatus for you.
    renderx_rest_client = RenderXRestClient(renderx_ip, 9002)
    result = renderx_rest_client.submit_job_and_wait_for_completion(renderx_job.get_payload(), update_callback=update_func)
     
    # The result is an object, and we can view the resultant message by accessing that property.
    return result.message


def get_transcode_preset(placing):
    """ 
    Takes the placingId and returns a list of the presets of the type transcode. 
    Placing Dict -> List of Dict 
    """
    presets_list = placing["Placing"]["PlacingPublicationList"]["PlacingPublication"][0]["PublicationDefinition"]["Presets"]["Preset"]
    return [ preset for preset in presets_list if preset["PresetType"] == "Transcode" ]

if __name__ == '__main__':
    # Get the requried information for the job and the create helper object 
    nldHelper = NLDHelper()
    host, skey, job_id = sys.argv[1].split('+')
    med_client = MediatorWSHTTPClient(host, skey)
    job = med_client.job.get(job_id)

    # Get the Preset options and MatID.
    placingId = nldHelper.get_placing_id(job)
    placing = nldHelper.placing_get(placingId, ['destination'])
    matId = placing['Placing']['MainMatId']
    material = MaterialHelper(med_client, matId, False)
    transcode_preset = get_transcode_preset(placing)[0]
    
    if (not len(transcode_preset)):
        med_client.job.update_status_map(job_id, {'JOB__ERROR': "No Transcode Preset Found."})
        raise Error("No Transcode Preset Found.")


    #Get all variables for the transcode preset 
    renderx_ip = [ shorttext["Value"] for shorttext in transcode_preset["ShortTextList"]["ShortText"]
                    if shorttext["ShortTextType"] == "NLD Transcoded RenderX Ip" ][0]
    output_def = [ shorttext["Value"] for shorttext in transcode_preset["ShortTextList"]["ShortText"]
                    if shorttext["ShortTextType"] == "NLD Transcoded RenderX Profile" ][0]

    
    media = material.get_track("Main")
    src_path = media["TrackDefinition"][0]["TrackFile"]["Path"]
    src_file = media["TrackDefinition"][0]["TrackFile"]["Name"]

    dst_path = src_path.replace("Main", "Transcode")
    dst_file = src_file

    # Initialize an S3 Helper object to work with the S3/Cloudian storage.
    s3_media_access_provider = med_client.media_access.get_access(SRC_MEDIA_ACCESS_NAME)['S3MediaAccessProvider']
    s3_endpoint = s3_media_access_provider['EndPoint']
    
    # We can optionally provide it an update callback function, and polling time as well.
    def update_callback_example(progress, status):
        if progress:
            med_client.job.update_status_map(job_id, {"JOB__PROGRESS" : int(progress)})

    renderx_output = send_renderx_job({"s3": {"uri": "s3://{0}/{1}/{2}".format(SRC_MEDIA_ACCESS_NAME, src_path, src_file)}}, 
                                      {"s3": {"uri": "s3://{0}/{1}/{2}".format(SRC_MEDIA_ACCESS_NAME, dst_path, dst_file)}}, 
                                      output_def, 
                                      renderx_ip, 
                                      update_callback_example,
                                      s3_endpoint)

    sys.exit(0)
