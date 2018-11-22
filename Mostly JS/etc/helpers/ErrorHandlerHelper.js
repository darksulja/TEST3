/**
 * Example:
 * var eh = new ErrorHandlerHelper("Packaging", "TEST-PLPLAY-SD-0000010195AC", "PLACING");
 * eh.getError(101);
 * eh.getError(105,{outputDir:"/srv/the/dir/in/question", inputDir:"inDir", whatever:"WhatEver"});
 *
 * eh.updateVariables({outputDir:"/srv/the/dir/in/question", inputDir:"inDir", whatever:"WhatEver"});
 * eh.getError(105);
 *
 * This is a singleton. So once instantiated with a pipeline state, it will remain in that state even if re-newed.
 * The id can be changed by re-newing the helper or using setId(id)
 *
 * @param pipelineState  i.e. "Packaging"
 * @param id Either a PlacingId or a MaterialId
 * @param entityType either "MATERIAL" or "PLACING"
 */
var ErrorHandlerHelper = function (pipelineState, id, entityType) {
	var PLACING = "PLACING";
	var MATERIAL = "MATERIAL";
	var instance;

	if (typeof(gmoNBCFunc) === "undefined") {
		print("Loading nbc_gmo_functions");
		load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");
	}

	// rewrite the constructor
	ErrorHandlerHelper = function (pipelineState, id) {
		if (gmoNBCFunc.isVarUsable(instance)) {
			if( pipelineState !== instance.__pipelineState) {
				var err = "ErrorHandlerHelper already initialized for " + instance.getPipelineState()+". Please create another instance of the Error Handler Helper with the new pipeline state.";
				print(err);
				throw(err);
			}
			// If the id has change reinstansiate the placing helper, and re-get the template.
			if (id !== instance.__placingId) {
				print("ErrorHandlerHelper changing Placing ID from [" + instance.__placingId + "] to [" + id + "]");
				instance.__placingId = id;
				instance.__ph = new PlacingHelper(instance.__placingId);
				instance.placingXml = instance.__ph.getPlacingXml();
				instance.loadVariables();
				instance.retrieveTemplate(instance.__pipelineState);
			}
			// Todo initialize the material helper etc....
		}
		return instance;
	};

	// carry over the prototype
	ErrorHandlerHelper.prototype = this;

	// the instance
	instance = new ErrorHandlerHelper();

	// reset the constructor pointer
	instance.constructor = ErrorHandlerHelper;

	if (typeof(gmoNBCNLDFunc) === "undefined") {
		print("Loading gmoNBCNLDFunc");
		load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");
	}

	if (typeof(PlacingHelper) === "undefined") {
		print("Loading placingHelper");
		load("/opt/evertz/mediator/etc/runners/placingHelper.js");
	}

	if (typeof(JSCommons) === "undefined") {
		print("Loading JSCommons js ");
		load("/opt/evertz/mediator/etc/helpers/JSCommons.js");
	}

	if (typeof(JRAPI) === "undefined") {
		print("Loading jellyroll");
		load('/opt/evertz/mediator/lib/js/jellyrollApiCall.js');
	}

	var debug = false;

	this.__pipelineState = pipelineState;
	this.__templateId = "";
	this.__errorPrefix = "";
	this.__errorType = "ERROR";
	this.__errorSeverity = "CRITICAL";
	this.__template = {};
	this.__delimiterStart = "{{";
	this.__delimiterEnd = "}}";
	this.__JRAPI = new JRAPI();
	this.__isPlacing = entityType.toUpperCase() === "PLACING";
	if (this.__isPlacing) {
		this.__placingId = id;
		this.__ph = new PlacingHelper(this.__placingId);
		this.__placingXml = this.__ph.getPlacingXml();
	} else {
		this.__matId = id;
		// Todo Handle if its a material ID
		// Todo Create the TX Material helper if there is one, etc...
	}

	/**
	 * Return the pipeline state for this helper
	 * @returns {*}
	 */
	this.getPipelineState = function () {
		return this.__pipelineState;
	};

	this.setId = function (id) {
		if (this.__isPlacing ) {
			this.setPlacingId(id);
		} else {
			this.setMatId(id);
		}
	};

	/**
	 * Get the current placing Id being used.
	 * @returns {*}
	 */
	this.getPlacingId = function () {
		return this.__placingId;
	};

	/**
	 * Set the placing Id for the helper.
	 * Reloads the placing helper, the template variables and the template.
	 * @param id
	 */
	this.setPlacingId = function (id) {
		if (id !== instance.__placingId) {
			print("ErrorHandlerHelper.setPlacingId changing Placing ID from [" + this.__placingId + "] to [" + id + "]");
			this.__placingId = id;
			this.__ph = new PlacingHelper(this.__placingId);
			this.placingXml = this.__ph.getPlacingXml();
			this.loadVariables();
			this.retrieveTemplate(this.__pipelineState);
		}
	};

	/**
	 * Get the current material Id being used.
	 * @returns {*}
	 */
	this.getMaterialId = function () {
		return this.__matId;
	};

	/**
	 * Set the material Id for the helper.
	 * Reloads the material helper, the template variables and the template.
	 * @param id
	 */
	this.setMaterialId = function (id) {
		if (id !== instance.__matId) {
			print("ErrorHandlerHelper.setMaterialId changing Placing ID from [" + this.__matId + "] to [" + id + "]");
			this.__matId = id;
			// Todo initialize the material helper etc....

			this.loadVariables();
			this.retrieveTemplate(this.__pipelineState);
		}
	};

	/**
	 * Return the template retrieved from Mediator for the pipeine state passed the setter
	 * @returns {*}
	 */
	this.getTemplate = function () {
		return this.__template;
	};

	/**
	 * Set the helper up for the pipeline state passed and retrieve its output template from Mediator
	 * @param piplineState i.e. "Packaging" for "EHH_PACKAGING" if not passed this.__pipelineState will be used
	 */
	this.setTemplate = function (pipelineState) {
		if (!gmoNBCFunc.isVarUsable(pipelineState)) {
			pipelineState = this.__pipelineState;
		} else {
			this.__pipelineState = pipelineState;
		}

		switch (pipelineState) {
			case "Packaging" :
				this.__templateId = "EHH_PACKAGING";
				this.__errorPrefix = "PACK";
				break;
			case "Transcode" :
				this.__templateId = "EHH_TRANSCODE";
				this.__errorPrefix = "TRANS";
				break;
			case "Post Processing" :
				this.__templateId = "EHH_POSTPROCESSING";
				this.__errorPrefix = "POSTPR";
				break;
			case "Conform" :
				this.__templateId = "EHH_CONFORM";
				this.__errorPrefix = "CNF";
				break;
			case "Pre Processing" :
				this.__templateId = "EHH_PREPROCESSING";
				this.__errorPrefix = "PREPR";
				break;
			case "Transfer" :
				this.__templateId = "EHH_TRANSFER";
				this.__errorPrefix = "TRSNF";
				break;
			case "Auto QC" :
				this.__templateId = "EHH_ADAUTOQC";
				this.__errorPrefix = "ADQC";
				break;
			case "Restore" :
				this.__templateId = "EHH_RESTORE";
				this.__errorPrefix = "RST";
				break;
			case "Delivery" :
				this.__templateId = "EHH_DELIVERY";
				this.__errorPrefix = "DELV";
				break;
			case "VAST Validation" :
				this.__templateId = "EHH_VAST_VALIDATION";
				this.__errorPrefix = "VSTV";
				break;
		}

		this.retrieveTemplate();
	};

	/**
	 * Add the template vars defined in this.__templateVars and
	 * retrieve the output template that was setup with this.setTemplate()
	 */
	this.retrieveTemplate = function () {
		var templateSubmission = <Mapping></Mapping>;
		for (var key in this.__templateVars) {
			if (debug) print("Adding: key " + key + " Value " + this.__templateVars[key]);
			templateSubmission[key] = this.getTemplateValue(key, this.__templateVars[key]);
		}
		if (debug) print( "templateSubmission = "+ templateSubmission);

		// Make sure we have a replaceAll function
		if (typeof String.prototype.replaceAll !== 'function') {
			String.prototype.replaceAll = function (target, replacement) {
				return this.split(target).join(replacement);
			}
		}

		// Read the output template from the config editor
		var xmlText = <PharosCs>
						<CommandList>
						<Command subsystem="outputTemplate" method="populate">
							<ParameterList>
								<Parameter name="outputTemplate" value={this.__templateId}/>
								<Parameter name="outputData">
									<Value>
										{templateSubmission}
									</Value>
								</Parameter>
							</ParameterList>
						</Command>
						</CommandList>
						</PharosCs>;
		var wsRtn = wscall (xmlText)..PopulatedOutputTemplate.Output.toString();
		this.__temp = wsRtn;
		this.__template = this.__JRAPI.JSON.parse(wsRtn);
		return this.__template;
	};

	/**
	 * Return the field and key passed as an XML node for the template
	 * @param field
	 * @param value
	 */
	this.getTemplateValue = function(field, value) {

		if (typeof value == "string") {
			return <{field}>{JSCommons.encodeXML(value)}</{field}>;
		} else if (typeof value == "boolean" || typeof value == "number" ) {
			// Handle Boolean and numbers by converting toString()
			return <{field}>{JSCommons.encodeXML(value.toString())}</{field}>;
		} else if (typeof value == "object") {
			var mapParse = function(mapValue) {
				var rtnXML = <Map></Map>;

				for (var key in mapValue) {
					rtnXML.Map += <Key>{key}</Key>;

					if (typeof mapValue[key] == "object") {
						rtnXML.Map += <Value>{mapParse(mapValue[key])}</Value>;
					} else {
						rtnXML.Map += <Value>{JSCommons.encodeXML(String(mapValue[key]))}</Value>;
					}
				}
				return rtnXML;
			};

			var mapXML = mapParse(value);
			return <{field}>{mapXML}</{field}>;
		} else {
			throw new Error ("Cannot recognize type for ["+field+"] ["+value+"]");
		}
		return;
	};

	/**
	 * errorType: type of note (COMMENT, DELAY, ERROR, FIX or WARNING)
	 * @returns {*|string}
	 */
	this.getErrorType = function () {
		return this.__errorType;
	};

	/**
	 * Todo !?! See if these are defined as a tag, shorttext or something
	 * From gmoNBCNLDFunc.saveNote
	 * errorType: type of note (COMMENT, DELAY, ERROR, FIX or WARNING)
	 * @param errType
	 */
	this.setErrorType = function (errType) {
		this.__errorType = errType;
	};

	/**
	 * errSeverity: level of note (AVERAGE, CRITICAL, IMPORTANT, TRIVIAL and UNIMPORTANT)
	 * @returns {*|string}
	 */
	this.getErrorSeverity = function () {
		return this.__errorSeverity;
	};

	/**
	 * Todo !?! See if these are defined as a tag, shorttext or something
	 * From gmoNBCNLDFunc.saveNote
	 * errSeverity: level of note (AVERAGE, CRITICAL, IMPORTANT, TRIVIAL and UNIMPORTANT)
	 * @param errSeverity
	 */
	this.setErrorSeverity = function (errSeverity) {
		this.__errorSeverity = errSeverity;
	};

	/**
	 * Get the full text of the message for the error code passed.
	 * Requires the template to be set
	 * @param errCode - The Error code to retrieve the message for
	 * @returns {string} message
	 */
	this.getErrorMessage = function(errCode) {
		// Make sure the template has been read.
		if (this.__templateId === "") {
			this.setTemplate();
		}

		var errId = this.__errorPrefix + errCode;
		print("Using errId " + errId);
		if (gmoNBCFunc.isVarUsable(this.getTemplate()[errId])) {
			print("this.getTemplate()[errId] = " + this.getTemplate()[errId]);
			print("this.getTemplate()[errId].code = " + this.getTemplate()[errId].code);
			print("this.getTemplate()[errId].type = " + this.getTemplate()[errId].type);
			print("this.getTemplate()[errId].severity = " + this.getTemplate()[errId].severity);
			print("this.getTemplate()[errId].message = " + this.getTemplate()[errId].message);

			this.setErrorType(this.getTemplate()[errId].type);
			this.setErrorSeverity(this.getTemplate()[errId].severity);
			var message = this.getTemplate()[errId].message;
		} else {
			throw new Error("Error Handler Helper: No entry was found for error [" + errCode + "]");
		}

		return message;
	};

	/**
	 * Parse the message and replace the var names with the var contents.
	 * @param errCode
	 * @param message
	 * @param theArgs
	 * @returns {string}
	 */
	this.parseMessage = function(errCode, message, theArgs){
		var errId = this.__errorPrefix + errCode;
		var theMessage = "";
		var argIdx = 2; // Skip the errCode and message arguments
		var mArray = message.split(this.__delimiterStart);
		for each (var msgFrag in mArray) {
			if (debug) print("mFrag = "+msgFrag);
			var searchIdx = msgFrag.search(this.__delimiterEnd);
			if (searchIdx != -1) {
				if (debug) print(msgFrag.slice(0,searchIdx)+" == "+ theArgs[argIdx]);
				theMessage += theArgs[argIdx++];
				msgFrag = msgFrag.slice(searchIdx+2);
				theMessage += msgFrag;
			} else {
				theMessage += msgFrag;
			}
		}
		if( argIdx != theArgs.length) {
			print("Number of Arguments passed do not match the number of arguments in message ["+errId+"] - "+theArgs.length+" argument"+(theArgs.length==1?" was": "s were")+" passed, the message had "+argIdx);
		}
		if (debug) print("theMessage = "+theMessage);
		return theMessage;
	};

	/**
	 * Save a note to the placing or a comment to the material
	 * @param message
	 */
	this.saveNote = function (message) {
		print("Message being saved is ["+message+"]");
		if (this.__isPlacing) {
			/**
			 * NOTE: on saveNote
			 * It does not seem to be using the error type and severity passed in. Instead it uses what is in the note save in config editor
			 * I had to cereat a warning note called PackagingW and pass it in as the 3rd argument for the note to turn to a warning.
			 * So if we want warnings, etc, there will need to be new notes created in the config editor for each.
			 */
			print("Saving note to the placing ["+this.getPlacingId()+"] "+this.getErrorType()+", "+this.getErrorSeverity());
			gmoNBCFunc.saveNote("Placing",this.getPlacingId(),this.__pipelineState,this.getErrorType(),this.getErrorSeverity(),message);
		} else {
			print("Saving comment to the material ["+this.getMaterialId()+"]");
			gmoNBCFunc.addComments(this.getMaterialId(), this.__pipelineState, message);
		}
	};

	/**
	 * Update/Add a variable to the outputTemplate
	 * And re-read the template from Mediator with updated values.
	 * Example:
	 * this.updateVariables( {outputDir:"/srv/isilon/whatever", outputFile: "outputFile.ext"} );
	 *
	 * @param varObj A JSON obj containing all the keys, values being passed in.
	 */
	this.updateVariables = function (varObj) {
		var updated = false;
		// Update/Add any vars passed in:
		for (var arg in varObj) {
			print("arg = "+arg);
			print("Key: "+arg+" = "+varObj[arg]);

			if (varObj.hasOwnProperty(arg)){
				print("Key: "+arg+" = "+varObj[arg]);
				this.__templateVars[arg] = varObj[arg];
				updated = true;
			}
			if (debug) print("__templateVars = "+this.__JRAPI.JSON.stringify(this.__templateVars,null,2));
		}

		// Re-read the template to update the vars used in its messages
		if (updated) {
			print("Updated vars to template - re-loading from Mediator...");
			this.retrieveTemplate(this.__pipelineState);
		}
		if (debug) print("TEMPLATE == "+ this.getTemplate().toSource());
	};

	/**
	 * Get the error and the errors severity
	 *
	 * Example:
	 * getError(101);
	 * getError(105,{outputDir:"/srv/the/dir/in/question", outputFile: "outputFile.ext", whatever:"WhatEver"});
	 *
	 * updateVariables( {outputDir:"/srv/isilon/whatever", outputFile: "outputFile.ext"} );
	 * getError(105);
	 *
	 * @param errCode - The Error Code to throw
	 * @param varObj Variable number of params in a JSON object {var1:"1", var2:"2"}
	 *
	 * @returns A JSON object with the Error Message and Severity
	 * { message: "The Error Message, severity: "CRITICAL" }
	 */
	this.getError = function(errCode, varObj) {
		// Make sure the template has been read.
		if (this.__templateId === "") {
			this.setTemplate();
		}

		// Update the variables, if any were passed
		if( gmoNBCFunc.isVarUsable(varObj)) {
			// Update the vars if any were passed.
			// Note: This also re-loads the template with the new variables
			//this.updateVariables.apply(this, arguments);
			this.updateVariables(varObj);
		}

		var theMessage = this.getErrorMessage(errCode);

		if (debug) print("ErrorHandlerHelper() returning error ["+theMessage+"]");
		return( { message: theMessage, severity: this.getErrorSeverity()})
	};

	/**
	 * Load the template vars with the current placing helper and other info
	 */
	this.loadVariables = function () {

		// Todo handle if using a Material Id instead of Placing Id
		if (this.__isPlacing) {
			print("Loading vars for a placing");
			this.__templateVars = {
				placingName: this.__ph.getPlacingName(),
				placingState: this.__ph.getPlacingState(),
				numberOfParcels: this.__ph.numberOfParcels(),
				contentDest: this.__ph.getContentDest(),
				pubDef: this.__ph.getPubDef(),
				matchedProfile: this.__ph.getMatchedProfile(),
				startDate: this.__ph.getStartDate(),
				endDate: this.__ph.getEndDate(),
				//deliveryFilenames: this.__ph.getDeliveryFilenames(),
				//packageFileName: this.__ph.getPackageFileName(),
				profile: this.__ph.getProfile(),
				latestTrigger: this.__ph.getLatestTrigger(),
				isInternalReOrder: this.__ph.isInternalReOrder().toString(),
				settings: this.__ph.getSettings(),
				sourceMaterialId: this.__ph.getMainMaterial()
			};
		}

	};

	/**
	 * Show the variables for this class
	 */
	this.showVars = function () {
		print("Vars for ErrorHandlerHelper:");
		print("pipelineState  = "+this.__pipelineState);
		print("templateId     = "+this.__templateId);
		print("errorPrefix    = "+this.__errorPrefix);
		print("errorType      = "+this.getErrorType());
		print("errorSeverity  = "+this.getErrorSeverity());
		print("isPlacing      = "+this.__isPlacing);
		print("placingId      = "+this.getPlacingId());
//		print("matId          = "+this.__matId);
		print("template       = "+this.__JRAPI.JSON.stringify(this.getTemplate(),null,2));
		print("template vars  = "+this.__JRAPI.JSON.stringify(this.__templateVars,null,2));
	};

	/***********************************
	 * Start of script...
	 ***********************************/

	print("ErrorHandlerHelper() initialization for pipeline state ["+this.__pipelineState+"]");

	try {
		// Make sure all params were passed to the constructor
		if (!gmoNBCFunc.isVarUsable(pipelineState) || !gmoNBCFunc.isVarUsable(id)) {
			throw new Error("Please call ErrorHandlerHelper constructor with all it's arguments: Pipeline State, Placing or Material Id.");
		}

		// Load the vars from the placing helper we instantiated above
		this.loadVariables();

		// Setup the helper for the pipeline state passed.
		this.setTemplate(this.__pipelineState);
	} catch (e) {
		var err = "Unexpected Error caught in ErrorHandlerHelper ["+e.message+"]";
		print(err);
		throw(new Error(err));
	}

	return instance;
};