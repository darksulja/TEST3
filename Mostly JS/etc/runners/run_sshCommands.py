#!/usr/bin/python
import logging
import sys
import paramiko
import json
from evertz.mediator.ws import MediatorHttpClientV1

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

runner_env = sys.argv[1].split('+')
host = runner_env[0]
skey = runner_env[1]
jobid = runner_env[2]

try:
    # Connect to Mediator with the arguements passed in from command line.
    mediator = MediatorHttpClientV1(host, skey)

    # Get job properties from Mediator.
    job = mediator.get_job(jobid)
    props = job['Job']['Description']['Properties']
    logger.debug('Job Properties: ' + json.dumps(props, indent=2, sort_keys=True))

    # SSH Connection details.
    host_name = props.get('Hostname')
    port = int(props.get('Port', 22))
    user_name = props.get('Username')
    password = props.get('Password')

    # Command to run on the SSH host.
    command = props.get('Command')

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    # Check if a user/password was specified for the connection
    if user_name is not None and password is not None:
        # Use the username and password to authenticate.
        ssh.connect(host_name, port=port,
                    username=user_name,
                    password=password)
        logger.info("Connecting to SSH Host [{0}:{1}] with Username [{2}] \
            Password [{3}]".format(host_name, port, user_name, password))
    else:
        # Assume password-less authentication is supported and attempt to connect.
        ssh.connect(host_name, port=port)
        logger.info("Connecting to SSH Host [{0}:{1}]".format(host_name, port))

    # Run the specified command.
    if command is not None:
        logger.info("Running command [{0}]".format(command))
        stdin, stdout, stderr = ssh.exec_command(command)

    # Determine if any error was recieved from running the command.
    error_msg = stderr.read().rstrip()
    if error_msg != "":
        raise Exception("Error received when running command [{0}]. [{1}]".format(command, error_msg))
    else:
        logger.info("No error when running command [{0}]. [{1}]".format(command, stdout.read().rstrip()))
        mediator.mediator_update_progress(jobid, 100)
        mediator.mediator_update_status_map(jobid, "JOB__STATUS", "Job Completed Successfully")

    ssh.close()

except Exception as e:
    # An error occurred, update Mediator with the error
    logger.error("An error has occurred [{}]".format(e.message))
    mediator.mediator_update_progress(jobid, 100)
    mediator.mediator_update_status_map(jobid, "JOB__STATUS", e.message)
    mediator.mediator_update_status_map(jobid, "JOB__ERRROR", e.message)

