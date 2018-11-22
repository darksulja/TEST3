/*
* @Author: Karthik Rengasamy
* @Description: Territory Master Validation Script
* @Date:   2017-03-18 11:38:25
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-05-31 01:32:29
*/

var java = JavaImporter(
    Packages.java.lang.Integer,
    Packages.java.util.ArrayList,
    Packages.com.pharos.core.domain,
    Packages.com.pharos.core.domain.list,
    Packages.com.pharos.core.domain.utils,
    Packages.com.pharos.core.domain.reports,
    Packages.com.pharos.core.domain.reports.parameters
);

//Declaring Constants - Form Data Keys
const MATERIAL_MAT_ID = "Material.MatId";
const MATERIAL_TITLE = "Material.Title";
const MATERIAL_ORIGINAL_NAME= "Material.OriginalFileName";
const MATERIAL_TVD_PRODUCTION = "Material.TVDProduction#";
const MATERIAL_AUDIO_PROFILE = "Material.AudioProfile";
const MATERIAL_ASPECT_RATIO = "Material.AspectRatio";
const MATERIAL_INSERT_TYPE = "Material.InsertType";
const MATERIAL_PRIMARY_LANGUAGE = "Material.PrimaryLanguage";

const MESSAGE = "TerritoryMaster.ErrorMessage";

//Options Constant 

with (java) {
    _logger.info("Running Territory Master Registration Validation Script");

    /**
     * [isNullOrEmptyOrUndefined - Checks If a String is Null , Empty or  Undefined ]
     * @param  {[Any]}  
     * @return {Boolean} 
     */
    function isNullOrEmptyOrUndefined(val){
        if(val!=null && val!="" && val!=undefined && typeof val!="undefined" && val!="Please Select"){
            return false;
        }else {
            return true;
        }
    }

    function isFileNameAlreadyAssociatedToAnyMaterial(fileName,selectedMaterial){
        var reportName = "getMatIdFromFilenameTTLReportWithState"; 
        var reportParameters = new CustomReportParameterList();
        var custReportParmeter = new CustomReportRuntimeParametersDefault();

        var command = new Command("report","runReport");
        command.addParameter("reportName", reportName);
        command.addParameter("pageSize", new Integer(100));

        var fileNameReportParameter = new StringReportParameter();
        fileNameReportParameter.setName("fileName");
        fileNameReportParameter.setValue(fileName);
        fileNameReportParameter.setOperator("is");
        
        var stateNameReportParameter = new StringReportParameter();
        stateNameReportParameter.setName("stateName");
        stateNameReportParameter.setValue("");
        stateNameReportParameter.setOperator("is");
        
        reportParameters.add(fileNameReportParameter);
        reportParameters.add(stateNameReportParameter);

        custReportParmeter.setParameters(reportParameters);
        command.addParameter("reportParameters", custReportParmeter);

        var reportResults = _commandHelper.runCommand(command);
        if(reportResults && reportResults.getSuccess() == true){
            _logger.info("Processing Report Results");
            var results = reportResults.getOutput().getList().getList();
            var materialList = new ArrayList();
            if(results.size()>=1){
                for (var i = 0; i < results.size(); i++) {
                    var matId = results.get(i).get("MATERIAL__ID");
                    if(!isNullOrEmptyOrUndefined(matId) && matId !=selectedMaterial){
                        materialList.add(matId);
                    }
                }
                return materialList;
            }
        }
        return null;
    }

    function isMaterialUniqueForCriteria(selectedMaterial, materialTVDProduction,
             materialAspectRatio, materialPrimaryLanguage, materialInsertType){
        //Criteria  = AspectRatio + Insert Type + TVD # + Primary Language

        var reportName = "MaterialRegistrationValidationReport"; 
        var reportParameters = new CustomReportParameterList();
        var custReportParmeter = new CustomReportRuntimeParametersDefault();

        var materialVersionType = "";
        if(!isNullOrEmptyOrUndefined(materialInsertType)){
            if(materialInsertType.startsWith("Picture")){
                materialVersionType = "PI-FTEXTED";
            }else{
                materialVersionType = "FN-FTEXTED";
            }
        }

        var command = new Command("report","runReport");
        command.addParameter("reportName", reportName);
        command.addParameter("pageSize", new Integer(100));

        var aspectRatioReportParameter = new StringReportParameter();
        aspectRatioReportParameter.setName("aspect_ratio_param");
        aspectRatioReportParameter.setValue(materialAspectRatio);
        aspectRatioReportParameter.setOperator("is");
        
        var tvdReportParameter = new StringReportParameter();
        tvdReportParameter.setName("tvd_production_param");
        tvdReportParameter.setValue(materialTVDProduction);
        tvdReportParameter.setOperator("is");

        var versionTypeReportParameter = new StringReportParameter();
        versionTypeReportParameter.setName("version_type_param");
        var versionTypeList = new ArrayList();
        versionTypeList.add(materialVersionType);
        versionTypeReportParameter.setValues(versionTypeList);
        versionTypeReportParameter.setOperator("in");
        
        var fileNameReportParameter = new StringReportParameter();
        fileNameReportParameter.setName("file_name_param");
        fileNameReportParameter.setValue("");
        fileNameReportParameter.setOperator("is");
        
        var primaryLangReportParameter = new StringReportParameter();
        primaryLangReportParameter.setName("primary_language_param");
        primaryLangReportParameter.setValue(materialPrimaryLanguage);
        primaryLangReportParameter.setOperator("is");
        
        reportParameters.add(aspectRatioReportParameter);
        reportParameters.add(tvdReportParameter);
        reportParameters.add(versionTypeReportParameter);
        reportParameters.add(fileNameReportParameter);
        reportParameters.add(primaryLangReportParameter);

        custReportParmeter.setParameters(reportParameters);
        command.addParameter("reportParameters", custReportParmeter);

        var reportResults = _commandHelper.runCommand(command);
        if(reportResults && reportResults.getSuccess() == true){
            _logger.info("Processing Report Results");
            var results = reportResults.getOutput().getList().getList();
            var materialList = new ArrayList();
            if(results.size()>=1){
                for (var i = 0; i < results.size(); i++) {
                    var matId = results.get(i).get("MATERIAL__ID");
                    if(!isNullOrEmptyOrUndefined(matId) && matId !=selectedMaterial){
                        materialList.add(matId);
                    }
                }
                return materialList;
            }
        }
        return null;
    }

    var isValidationError = false;

    var materialId = _formData.getValue(MATERIAL_MAT_ID);

    var materialTitle = _formData.getValue(MATERIAL_TITLE);

    var materialTVDProduction = _formData.getValue(MATERIAL_TVD_PRODUCTION);

    var materialInsertType = _formData.getValue(MATERIAL_INSERT_TYPE);

    var materialOriginalFileName = _formData.getValue(MATERIAL_ORIGINAL_NAME);

    var materialAudioProfile = _formData.getValue(MATERIAL_AUDIO_PROFILE);

    var materialAspectRatio = _formData.getValue(MATERIAL_ASPECT_RATIO);

    var materialPrimaryLanguage = _formData.getValue(MATERIAL_PRIMARY_LANGUAGE);


    if(isNullOrEmptyOrUndefined(materialTitle)){
        _validationResult.addError(MATERIAL_TITLE,"Please provide a Material Title");
        isValidationError = true;
    }

    if(isNullOrEmptyOrUndefined(materialAspectRatio) || "Unknown" == materialAspectRatio){
        _validationResult.addError(MATERIAL_ASPECT_RATIO,"Please select a Valid Aspect Ratio");
        isValidationError = true;
    }

    if(isNullOrEmptyOrUndefined(materialInsertType)){
        _validationResult.addError(MATERIAL_INSERT_TYPE,"Please select a Valid Insert Type");
        isValidationError = true;
    }

    if(isNullOrEmptyOrUndefined(materialTVDProduction)){
        _validationResult.addError(MATERIAL_TVD_PRODUCTION,"Please provide a TVD Production #");
        isValidationError = true;
    }

    if(isNullOrEmptyOrUndefined(materialOriginalFileName)){
        _validationResult.addError(MATERIAL_ORIGINAL_NAME,"Please provide a File Name");
        isValidationError = true;
    }

    if(isNullOrEmptyOrUndefined(materialAudioProfile)){
        _validationResult.addError(MATERIAL_AUDIO_PROFILE,"Please select a Audio Profile");
        isValidationError = true;
    }

    if(isNullOrEmptyOrUndefined(materialPrimaryLanguage)){
        _validationResult.addError(MATERIAL_PRIMARY_LANGUAGE,"Please select a Primary Language");
        isValidationError = true;
    }

    //Validate If Material Already exists for File Name

    if(!isValidationError){
        var materialList = isFileNameAlreadyAssociatedToAnyMaterial(materialOriginalFileName,materialId);
        if(!isNullOrEmptyOrUndefined(materialList) && materialList.size()>=1){
             isValidationError = true;
            _validationResult.addError(MATERIAL_ORIGINAL_NAME,"Following Materials exists already with same File Name ["+materialList.toArray().join()+"]");
        }
    }

    if(!isValidationError){
        var materialList = isMaterialUniqueForCriteria(materialId, materialTVDProduction,
             materialAspectRatio, materialPrimaryLanguage, materialInsertType)
        if(!isNullOrEmptyOrUndefined(materialList) && materialList.size()>=1){
            isValidationError = true;
            _validationResult.addError(MATERIAL_TVD_PRODUCTION,"Following Materials exists already for AspectRatio + Insert Type + TVD # + Primary Language ["+materialList.toArray().join()+"]");
            _validationResult.addError(MATERIAL_INSERT_TYPE,"Following Materials exists already for AspectRatio + Insert Type + TVD # + Primary Language ["+materialList.toArray().join()+"]");
            _validationResult.addError(MATERIAL_PRIMARY_LANGUAGE,"Following Materials exists already for AspectRatio + Insert Type + TVD # + Primary Language ["+materialList.toArray().join()+"]");
            _validationResult.addError(MATERIAL_ASPECT_RATIO,"Following Materials exists already for AspectRatio + Insert Type + TVD # + Primary Language ["+materialList.toArray().join()+"]");
        }
    }

    if(!isValidationError){
         _logger.info("Running Territory Master Validation");
    }

    _logger.info("Completed Territory Master Registration Validation Script");
}