/*
* @Author: Karthik Rengasamy
* @Date:   2017-03-26 17:54:12
* @Last Modified by:   Karthik Rengasamy
* @Last Modified time: 2017-04-16 22:54:35
*/

ProfileHelper = function() {
	
	if ((this instanceof ProfileHelper) === false) {
		throw new Error("Please call constructor with new() keyword");
	}
	
	if(typeof(gmoNBCFunc)==="undefined"){
		print("Loading nbcgmo_fun")
		load("/opt/evertz/mediator/etc/runners/nbcgmo_fun.js");		
	}

	if(typeof(gmoNBCNLDFunc)==="undefined"){
		print("Loading nbcgmo_nld_fun")
		load("/opt/evertz/mediator/etc/runners/nbcgmo_nld_fun.js");	
	}

	this.__profile = "";
	this.__profiles = "";

	/**
	 * Sets the profile.
	 *
	 * @param  {<string>}  profile  The profile
	 */
	this.setProfile = function(profile){
		this.__profile = profile;
	}

	/**
	 * { Initialize Profile Helper }
	 */
	this.initialize = function(){
		this.__profiles = this.__searchProfile();
		print("\ProfileHelper() initialized");
	}

	/**
	 * { gets ALL Profiles }
	 *
	 * @return  {<xml>}  { List of profiles }
	 */
	this.__searchProfile = function(){

		var payload = <PharosCs>
		 		<CommandList>
		   			<Command subsystem="trackType" method="searchProfile"/>
		 		</CommandList>
			</PharosCs>
		return wscall(payload)..Profile
	}

	/**
	 * Gets the profile.
	 *
	 * @return  {<xml>}  The profile.
	 */
	this.getProfile = function(){
		for each (profile in this.__profiles){
			if(profile.Name.toString() == this.__profile){
				return profile;
			}
		}
		return ;
	}

	this.getProfileAsString = function() {
		return this.__profile;
	}

	/**
	 * Gets the track types of a given profile.
	 *
	 * @return  {Array}  The track types.
	 */
	this.getTrackTypes = function(){
		var profileDefinition = this.getProfile()
		if(gmoNBCFunc.isVarUsable(profileDefinition)){
			var trackTypes = [];
			for each (trackType in profileDefinition..TrackType){
				trackTypes.push(trackType.Name.toString())
			}
			return trackTypes;
		}
		return ;
	}

	this.getTrackType = function(trackTypeName){
		return wscall(<PharosCs>
			  <CommandList>
			    <Command subsystem="trackType" method="get">
			      <ParameterList>
			        <Parameter name="trackTypeName" value={trackTypeName}/>
			      </ParameterList>
			    </Command>
			  </CommandList>
			</PharosCs>)..TrackType;
	}
	/**
	 * [isSubset To Check if arr2 is an subset of arr1 ]
	 * @param  {[Array]}  arr1 [1,3,4,5,6,6,7]
	 * @param  {[Array]}  arr2 [3,4,5]
	 * @return {Boolean}   
	 */
	this.isSubset = function(arr1, arr2){
		return arr2.every(function (val) { return arr1.indexOf(val) >= 0; });
	}

	/**
	 * Determines if matched profile.
	 *
	 * @param   {string}   sourceTrackTypes  The source Material track types
	 * @return  {boolean}  True if matched profile, False otherwise.
	 */
	this.isMatchedProfile = function(sourceTrackTypes){
		var profileTrackTypes = this.getTrackTypes();
		print("Profile Track Types :["+profileTrackTypes+"]")
		print("Source Track Types  :["+sourceTrackTypes+"]")
		if(gmoNBCFunc.isVarUsable(profileTrackTypes)){
			return this.isSubset(sourceTrackTypes,profileTrackTypes);
		}
		return false;
	}

	/*
	*	Checks for Track Types that are MISSING or not in a specified state. This compares agaist the profile set by this.setProfile()
	*	@param {xml} entityTrackTypeLinkXmlList - List of Track Type Link Xmls (suggested user materialHelper.getTrackTypeLinkXmlList() )
	*   @param {string} requiredState - State to compare Track Type Links to
	*	@return {array} of objects with key pair of <TrackType> : <State>
	*
	*   Example below using Ready as a state to compare to. The absence of a Track Type indicates that it matched the required state
	*
	*
	*	[  { Video: "Spot Check Required" }, {Stereo English (US) : "Auto QC"}, {MOS : "MISSING"} ]
	*
	**/
	this.evaluateTrackTypesAgainstSetProfile = function(entityTrackTypeLinkXmlList, requiredState) {

		const MISSING = "MISSING";
		var unavailableTrackTypes = [];
		var profileTrackTypes = this.getTrackTypes();
			
		for each(var profileTrackType in profileTrackTypes) {
	
			var trackTypeStateMap = {};
			var entityTrackTypeLinkXmlNode = entityTrackTypeLinkXmlList.(TrackTypeName.toString() === profileTrackType);
			
			// Does the Track Type even exist against the entity?
			if  (entityTrackTypeLinkXmlNode.length() === 0) {
				
				trackTypeStateMap[profileTrackType] = MISSING;
				unavailableTrackTypes.push(trackTypeStateMap);			
	
			} else {
				
				var entityTrackTypeLinkState = entityTrackTypeLinkXmlNode.StateName.toString();
					
				if (entityTrackTypeLinkState !== requiredState ) {
					
					trackTypeStateMap[profileTrackType] = entityTrackTypeLinkState;
					unavailableTrackTypes.push(trackTypeStateMap);

				}

			}		

		}
		
		return unavailableTrackTypes;
	}
	this.isProfileHasSideCarAudioReq = function(){
		var profile = this.getProfile();
		if(gmoNBCFunc.isVarUsable(profile)){
			var sideCarAudioProfile = profile..TrackTypeGroup.(Name.toString().indexOf("NLD - Side Car")>-1).Name.toString();
			print("SideCar Audio Profile is ["+sideCarAudioProfile+"]")
			if(gmoNBCFunc.isVarUsable(sideCarAudioProfile)){
				return true;
			}
		}
		return false;
	}

	this.getSideCarTrackTypesForProfile = function(){
		var trackTypes = [];

		for each (trackType in profile..TrackTypeGroup.(Name.toString().indexOf("NLD - Side Car")>-1)..TrackType.Name){
			trackTypes.push(trackType.toString())
		}
		return trackTypes;
	}

    /**
     * Gets the amount of audio channels from a given material. NLD Mono and MOS
     * count as one audio channel instead of two.
     *
     * @param   {placingXml}    Placing XML
     * @param   {matId}         Material ID
     * @param   {stagingMedia}  Name of the staging media to search
     * @return  {int}           The amount of audio channels in the material
     */
	this.getAudioChannelsForProfile = function() {
		var audioChannels = 0;
		var matchedProfileTrackTypes = this.getTrackTypes();

		for each (var trackTypeName in matchedProfileTrackTypes) {
            // We can't assume that trackdef[0] will always exist, so check first.
			trackTypeName = trackTypeName.toString();
            var trackClass = this.getTrackType(trackTypeName).ClassId.toString();
			if (gmoNBCFunc.isVarUsable(trackClass)){
				if(trackClass == "AUDIO"){
	                if (this.__profile.indexOf("NLDM") == 0) {
	                    (trackTypeName.indexOf("Mono") > -1 || trackTypeName.indexOf("MOS") > -1)
	                        ? audioChannels += 1
	                        : audioChannels += 2
	                }
	                else { audioChannels += 2 }
				}
			}
		}
		return audioChannels;
	}

	this.getTrackType = function(trackTypeName){
		return wscall(<PharosCs>
			  <CommandList>
			    <Command subsystem="trackType" method="get">
			      <ParameterList>
			        <Parameter name="trackTypeName" value={trackTypeName}/>
			      </ParameterList>
			    </Command>
			  </CommandList>
			</PharosCs>)..TrackType;
	}	

	this.getSideCarAudioGroups = function(){
		var surroundLanguageGroup = [];
        var stereoLanguageGroup = [];
		var trackTypes = this.getSideCarTrackTypesForProfile();
		var audioGroups = [];
		for each (trackType in trackTypes){
			if(trackType.indexOf("Surround")>-1){
                var language = trackType.replace("/","").match(/(\w* \w* )(.*)/i)[2]; 
                if(gmoNBCFunc.contains(surroundLanguageGroup,language)){
                    continue;
                }
                var fileTag = ph.getTrackType(trackType)..FileTag.toString();
                surroundLanguageGroup.push(language);
                audioGroups.push(fileTag);
            }else{
				var language = trackType.replace("/","").match(/(\w* \w* )(.*)/i); 
				if(typeof language != "undefined" && language!=null){
					language = language[2];
				}else{
					print("Non Language Track Type");
					language = trackType;
				}				
                if(gmoNBCFunc.contains(stereoLanguageGroup,language)){
                    continue;
                }
                var fileTag = ph.getTrackType(trackType)..FileTag.toString();
                stereoLanguageGroup.push(language);
                audioGroups.push(fileTag);
            }
		}
		print("AudioGroups ["+audioGroups+"]" );
		return audioGroups;
	}

	/**
	 * Gets the Audio Profile Helper Object 
	 * @param profile The profile to find the Audio Profile
	 * @return  {<Preset>}  The AudioProfile Helper object.
	 */
	 this.getAudioProfile = function(profile){
	 	if(!gmoNBCFunc.isVarUsable(profile)){
	 		profile = this.__profile;
	 	}

	 	var audioProfileHelper = new AudioProfileHelper(profile);

	 	if(!gmoNBCFunc.isVarUsable(audioProfileHelper) || !audioProfileHelper.getPreset().exists()){
	 		throw new Error("Audio Profile [" + profile + "] was not found. The preset for this profile must be configured.");
	 	}

	 	return audioProfileHelper;
	 }


}

