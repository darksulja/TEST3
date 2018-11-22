# filesystem_mounts:
#   example_nfs_mount:
#     remote_device: 10.95.170.1:/srv/nfs
#     mount_point: /mnt/example_nfs
#     filesystem_type: nfs
#     # options: hard,intr,noexec,rw,nobootwait,_netdev  # optional - recommended left as default, as a minimum you should include 'hard,intr,noexec,rw,nobootwait,_netdev'
#   example_cifs_mount:
#     remote_device: //10.95.170.1/cifs
#     mount_point: /mnt/example_cifs
#     filesystem_type: cifs
#     # options: username=evertz,password=SuperSecretPassword,domain=eu.evertz.tv,soft,rw  # optional - probably required for authentication unless guest access is being allowed defaults to 'soft,guest,iocharset=utf8,rw'
