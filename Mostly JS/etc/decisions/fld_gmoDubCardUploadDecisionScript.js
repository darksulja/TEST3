importPackage(Packages.com.pharos.foldermonitor); // Gives us access to foldermonitor classes and "constants" (eg: WorkBundle.STATUS_FILE_REMOVED)
importPackage(Packages.com.pharos.poxclient); // Gives us access to FileUtils etc
importPackage(Packages.com.pharos.moxb.containers); // Gives us access to TextList and Text classes
importPackage(Packages.com.pharos.subsystem.job); // Gives us access to JobDescription class
importPackage(Packages.java.io); // Gives us access to File class etc (if reqd)
importPackage(Packages.com.pharos.core.domain.job);

load('/opt/evertz/mediator/etc/runners/lookup.js');
load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
load("/opt/evertz/mediator/etc/runners/FolderMonitorHelper.js");

const UPLOADABLE_STATES = ["Order Placed"];
const READY_STATES = ["Ready"];
const VALID_EXTENSIONS = ["jpg", "png", "tif"];
const CHECK_BASENAME_AS_WELL = false;
/**
 * [makeIdentifierFromFile description]
 * @param  [String] monitoredFolder
 * @param  [String] path
 * @param  [String] filename
 * @param  [map] workBundleMap
 * @return [String]
 */
function makeIdentifierFromFile(monitoredFolder, path, filename, workBundleMap) {
  logger.info("");
  logger.info("makeIdentifierFromFile()");
  var uFile = new gmoNBCFunc.usefulFileObj(String(path) + "/" + String(filename));
  var fmh = new FolderMonitorHelper();
  fmh.setFile(uFile);
  fmh.setExtensionTypes(VALID_EXTENSIONS);
  fmh.setIdentifier();
  return fmh.getIdentifier();
}

/**
 * isWorkBundleReady
 * @param [Object] - workBundle
 *
**/
function isWorkBundleReady(/*WorkBundle*/ workBundle) {
  try {
    logger.info("");
    logger.info("isWorkBundleReady()");
    wsLogin(lookup.system["login"].ip,'wsuser','wspass');


    var sFilename = String(workBundle.fileItemMap.values().iterator().next().filename);
    var sPath = workBundle.info.path + "/";
    var sFileObj = new gmoNBCFunc.usefulFileObj(sPath + sFilename);
    var bActionWorkbundle = false;
    var fmh = new FolderMonitorHelper();
    fmh.setFile(sFileObj);
    fmh.setUploadableStates(UPLOADABLE_STATES);

    var sFilename = String(workBundle.fileItemMap.values().iterator().next().filename);
    var materialId = gmoNBCFunc.getMaterialsFromDataElements('shorttext', 'Dub Card Filename', sFilename);
    var materialHelper = new gmoNBCFunc.materialHelper(materialId);
    var currentState = materialHelper.getStateOfTtl(‘Graphic’);

    if (materialId && materialHelper && currentState == UPLOADABLE_STATES) {
      bActionWorkbundle = true;
    }

    // Do upload
    if (bActionWorkbundle) {
      // Build a Job Description and exit successfully
      logger.info("Creating Job Description for Identifier [" + String(workBundle.identifier) + "]");
      assignJobDescriptionToWorkBundle(workBundle, materialId[0]);
    } else {
      // Move file to failed folder and write a file specific log
      var failedDir = '/srv/dc-delivery/DubCardsFailed/';
      var errorMessage = 'Material [' + materialId[0] + '] not in State [Order Placed], not valid to upload';

      logErrorToDisk(errorMessage, failedDir, sFilename);
      gmoNBCFunc.moveFile(sPath + sFilename, failedDir);
    }
  } catch (e) {
    logger.info(e);
    return false;
  } finally {
    logger.info("");
    wsLogout();
    return bActionWorkbundle;
  }
}

function assignJobDescriptionToWorkBundle(workBundle, filename, matId) {
  logger.debug('In assignJobDescriptionToWorkBundle');
  // example: mimic what the default (non-skeleton) jobDescription code does
  if (workBundle.jobDescription == null ) {
    workBundle.jobDescription = new JobDescription();
  }

  logger.debug("Making sure we use the new function");
  workBundle.jobDescription.setProperty('FileName', workBundle.info.path + "/" + filename);
  workBundle.jobDescription.setProperty('MatId', matId);
  workBundle.jobDescription.setProperty('TrackTypeName', 'Graphic');
}

/**
 * [logErrorToDisk outputs an error message to a file on disk when the workflow fails.]
 * @param {[string]} err [Error message]
 * @param {[string]} dir [Directory where the file should be written]
 * @param {[string]} file [filename]
*/
function logErrorToDisk(err, dir, file) {
  var fullPath = dir + file + gmoNBCFunc.makeIsoFormattedDate(0) + ".log";
  var errorMessage = String(file + " : " + err + " : " + gmoNBCFunc.makeIsoFormattedDate(0) );

  logger.info("Logging error to disk: " + fullPath + " | With message: " + errorMessage);

  // Create the logs folder if needed
  if (!fileExists(dir)) {
    makedir(dir);
  }

  // Always overwrite the file.
  overwrite(errorMessage, fullPath);
}
