/*
* @Author: Karthik Rengasamy
* @Description: Audio Profile Validation Script
* @Date:   2017-03-18 11:38:25
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-04-26 16:07:55
*/

var java = JavaImporter(
    Packages.com.pharos.core.domain,
    Packages.com.pharos.core.domain.utils
);

//Declaring Constants - Form Data Keys



with (java) {

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
    
    _logger.info("Running Audio Profile Validation Script");

    _logger.info("Completed Audio Profile Validation Script");
}