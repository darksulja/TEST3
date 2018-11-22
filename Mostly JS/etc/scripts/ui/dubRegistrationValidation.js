/*
* @Author: Karthik Rengasamy
* @Description: Dub Cards Registration Validation Script
* @Date:   2017-03-18 11:38:25
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-07-26 13:56:25
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
const MATERIAL_TVD_PRODUCTION = "Material.TVDProduction#";
const MATERIAL_ASPECT_RATIO = "Material.AspectRatio";
const MATERIAL_TRANSFORMATION = "Material.Transformation";
const MATERIAL_VERSION_TYPE = "Material.VersionType";
const MATERIAL_TYPE = "Material.MaterialType";
const MATERIAL_TERRITORY_SUB_TYPE = "Material.TerritorySubType";
const MATERIAL_SEQUENCE = "Material.Sequence";
const MATERIAL_DUB_CARD_FILENAME = "Material.DubCardFilename";

//APPLICATION Constants
const OWNER_NBCU_GMO = "NBCU GMO";
const STATE_MACHINE_NBCU_GMO = "NBC GMO";
const STATE_ORDER_PLACED = "Order Placed";
const GRAPHIC_TRACK_TYPE = "Graphic";

//Options Constant
const SHORT_TEXT = "shorttext";
const TAG = "tag";

const MESSAGE = "DubCards.ErrorMessage";


//Form DataKey ==> Data Element Name MAPPING

const MAPPING = {
	MATERIAL_TVD_PRODUCTION : "TVD Production #",
	MATERIAL_TERRITORY_SUB_TYPE : "Territory Sub-Type",
	MATERIAL_SEQUENCE : "Sequence"
};


with (java) {
    _logger.info("Running Dub Cards Registration Validation Script");

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

     function isMaterialUniqueForCriteria(selectedMaterial, materialTVDProduction,
             materialAspectRatio, materialVersionType,materialSequence,materialTerritorySubType){
        //Criteria  = AspectRatio + Version Type + TVD #

        var reportName = "DubMaterialRegistrationValidationReport";
        var reportParameters = new CustomReportParameterList();
        var custReportParmeter = new CustomReportRuntimeParametersDefault();

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

        var territoryTypeReportParameter = new StringReportParameter();
        territoryTypeReportParameter.setName("territory_type_param");
        territoryTypeReportParameter.setValue(materialTerritorySubType);
        territoryTypeReportParameter.setOperator("is");

        var sequenceReportParameter = new StringReportParameter();
        sequenceReportParameter.setName("sequence_param");
        sequenceReportParameter.setValue(materialSequence);
        sequenceReportParameter.setOperator("is");

        reportParameters.add(aspectRatioReportParameter);
        reportParameters.add(tvdReportParameter);
        reportParameters.add(versionTypeReportParameter);
        reportParameters.add(territoryTypeReportParameter)
        reportParameters.add(sequenceReportParameter)

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

	var materialAspectRatio = _formData.getValue(MATERIAL_ASPECT_RATIO);

	var materialTransformation = _formData.getValue(MATERIAL_TRANSFORMATION);

    var materialVersionType = _formData.getValue(MATERIAL_VERSION_TYPE);

    var materialType = _formData.getValue(MATERIAL_TYPE);

    var materialTerritorySubType = _formData.getValue(MATERIAL_TERRITORY_SUB_TYPE);

    var materialSequence = _formData.getValue(MATERIAL_SEQUENCE);

    var dubCardFile = _formData.getValue(MATERIAL_DUB_CARD_FILENAME);

    if(isNullOrEmptyOrUndefined(materialTitle)){
        _validationResult.addError(MATERIAL_TITLE,"Please provide a Material Title");
        isValidationError = true;
    }

    if(isNullOrEmptyOrUndefined(materialTVDProduction)){
        _validationResult.addError(MATERIAL_TVD_PRODUCTION,"Please provide a TVD Production #");
        isValidationError = true;
    }

    if(isNullOrEmptyOrUndefined(materialAspectRatio) || "Unknown" == materialAspectRatio){
        _validationResult.addError(MATERIAL_ASPECT_RATIO,"Please select a Valid Aspect Ratio");
        isValidationError = true;
    }

    if(isNullOrEmptyOrUndefined(materialTransformation)){
        _validationResult.addError(MATERIAL_TRANSFORMATION,"Please select a Transformation");
        isValidationError = true;
    }

    if(isNullOrEmptyOrUndefined(materialVersionType)){
        _validationResult.addError(MATERIAL_VERSION_TYPE,"Please select a Mediator Version Type");
        isValidationError = true;
    }

    if(isNullOrEmptyOrUndefined(materialTerritorySubType)){
        _validationResult.addError(MATERIAL_TERRITORY_SUB_TYPE,"Please select a Territory Sub Type");
        isValidationError = true;
    }

    if(isNullOrEmptyOrUndefined(materialSequence)){
        _validationResult.addError(MATERIAL_SEQUENCE,"Please provide a Sequence Number for DubCard");
        isValidationError = true;
    }

    if(isNullOrEmptyOrUndefined(dubCardFile)){
      _validationResult.addError(MATERIAL_DUB_CARD_FILENAME,"Please provide a filename for Dub Card");
      isValidationError = true;
    }

    if(!isValidationError){
        var materialList = isMaterialUniqueForCriteria(materialId, materialTVDProduction,
             materialAspectRatio, materialVersionType,materialSequence,materialTerritorySubType)
        if(!isNullOrEmptyOrUndefined(materialList) && materialList.size()>=1){
            isValidationError = true;
            _validationResult.addError(MATERIAL_TVD_PRODUCTION,"Following Materials exists already for AspectRatio + Version Type + TVD # + Sequence + Territory Type ["+materialList.toArray().join()+"]");
            _validationResult.addError(MATERIAL_VERSION_TYPE,"Following Materials exists already for AspectRatio + Version Type + TVD # + Sequence + Territory Type ["+materialList.toArray().join()+"]");
            _validationResult.addError(MATERIAL_ASPECT_RATIO,"Following Materials exists already for AspectRatio + Version Type + TVD # + Sequence + Territory Type ["+materialList.toArray().join()+"]");
            _validationResult.addError(MATERIAL_SEQUENCE,"Following Materials exists already for AspectRatio + Version Type + TVD # + Sequence + Territory Type ["+materialList.toArray().join()+"]");
            _validationResult.addError(MATERIAL_TERRITORY_SUB_TYPE,"Following Materials exists already for AspectRatio + Version Type + TVD # + Sequence + Territory Type ["+materialList.toArray().join()+"]");
        }
    }

    _logger.info("Completed Dub Cards Registration Validation Script");
}
