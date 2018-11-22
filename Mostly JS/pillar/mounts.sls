filesystem_mounts:
  /srv/dc-isilon:
    remote_device: den-nfsisilon2.dcgmo.data:/ifs/data/DC/GMO/Mediator/qa-mediator/
    mount_point: /srv/dc-isilon
    filesystem_type: nfs
    options: nfsvers=3,tcp,rw,hard,intr,timeo=600,retrans=2,rsize=131072,wsize=524288
  /srv/dc-dvs:
    remote_device: gmo-rts.dcgmo.data:/media/DVS-RT1/DC/Mediator/qa-mediator/
    mount_point: /srv/dc-dvs
    filesystem_type: nfs
    options: rw,noatime,nfsvers=3
  /srv/dc-dvs-all:
    remote_device: gmo-rts.dcgmo.data:/media/DVS-RT1/DC/
    mount_point: /srv/dc-dvs-all
    filesystem_type: nfs
    options: rw,noatime,nfsvers=3 
  /srv/tmp:
    remote_device: den-nfsisilon2.dcgmo.data:/ifs/data/DC/GMO/Mediator/qa-mediator/mediatorTemp/
    mount_point: /srv/tmp
    filesystem_type: nfs
    options: rw,noatime,nfsvers=3
  /srv/backups:
    remote_device: gmo-rts.dcgmo.data:/media/DVS-RT1/DC/Mediator/qa-mediator/backups/
    mount_point: /srv/backups
    filesystem_type: nfs
    options: rw,noatime,nfsvers=3
  /srv/public:
    remote_device: den-nfsisilon2.dcgmo.data:/ifs/data/DC/GMO/Mediator/qa-mediator/public/
    mount_point: /srv/public
    filesystem_type: nfs
    options: nfsvers=3,tcp,rw,hard,intr,timeo=600,retrans=2,rsize=131072,wsize=524288
  /srv/dc-delivery:
    remote_device: gmo-nas1.dcgmo.data:/ifs/data/IMOG/DIGITAL_DELIVERY/DC_INCOMING_GMO_QA
    mount_point: /srv/dc-delivery
    filesystem_type: nfs
    options: nfsvers=3,tcp,rw,hard,intr,timeo=600,retrans=2,rsize=131072,wsize=524288
  /srv/dc-delivery-01:
    remote_device: dendelivery1nfs.dcgmo.data:/delivery1
    mount_point: /srv/dc-delivery-01
    filesystem_type: nfs
    options: nfsvers=3,tcp,rw,hard,intr,timeo=600,retrans=2,rsize=131072,wsize=524288
  /srv/dc-delivery-02:
    remote_device: dendelivery2nfs.dcgmo.data:/delivery2
    mount_point: /srv/dc-delivery-02
    filesystem_type: nfs
    options: nfsvers=3,tcp,rw,hard,intr,timeo=600,retrans=2,rsize=131072,wsize=524288
  /srv/browse:
    remote_device: den-nfsisilon2.dcgmo.data:/ifs/data/DC/GMO/Mediator/qa-mediator/browse/
    mount_point: /srv/browse
    filesystem_type: nfs
    options: nfsvers=3,tcp,rw,hard,intr,timeo=600,retrans=2,rsize=131072,wsize=524288
  /srv/test-content:
    remote_device: den-nfsisilon2.dcgmo.data:/ifs/data/DC/GMO/Mediator/test-content
    mount_point: /srv/test-content
    filesystem_type: nfs
    options: nfsvers=3,tcp,rw,hard,intr,timeo=600,retrans=2,rsize=131072,wsize=524288
  /srv/dc-isilon-full:
    remote_device: den-nfsisilon2.dcgmo.data:/ifs/data/DC/
    mount_point: /srv/dc-isilon-full
    filesystem_type: nfs
    options: nfsvers=3,tcp,rw,hard,intr,timeo=600,retrans=2,rsize=131072,wsize=524288