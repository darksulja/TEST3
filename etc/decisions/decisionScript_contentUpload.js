importPackage(Packages.com.pharos.poxclient);
importPackage(Packages.com.pharos.moxb.containers);
importPackage(Packages.com.pharos.subsystem.job);
importPackage(Packages.java.io);
load("/usr/local/pharos/lib/js/shellfun.js");

function makeIdentifierFromFile(monitoredFolder, path, filename, workBundleMap) {

    // identifier = <file name>@<file path>
    logger.info("Running makeIdentifierFromFile Function for Filename [" + filename + "] path [" + path + "]");    

    // In AWS the folder comes as part of the filename.
    if (filename.substr(0,6) == "manual") {
        logger.info("File has been dropped in the manual folder, don't use the folder monitor to upload.");
        return "";
    }

    logger.info("The identifier is " + (filename) + "@" + (path));

    // The returned value of this function is stored in the workBundle object  
    return filename + "@" + path;    
}

function isWorkBundleReady(workBundle) {
    logger.info("No checks done on the material. Returning true from isWorkBundleReady");
    return true;

}
