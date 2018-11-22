
var gmoNBCBatonFunc = {
	/**
	 * Add a comment to a Material Object
	 * @param [materialObj] [Material Domain Object]
	 * @param [commentType] [The Comment Type]
	 * @param [commentDetail] [The Comment Detail to be added(message)]
	 * @param [trackTypeName] [Track Type to add the comment to - Defaults "Video"]
	 * @param [startTc] [Start Timecode of the Comment - Defaults to be excluded]
	 * @param [endTc] [End Timecode of the Comment - Defaults to be excluded]
	 * @param [grade] [0-5 defaults to 0]
	 * @return [materialObj] [Updated Material Object]
	 */
	addComment	: function(materialObj, commentType, commentDetail, trackTypeName, frameRate, startTc, endTc, trackIncode, grade) {
		if (arguments.length < 3) throw new Error("Not enough arguments for addComment()");
		//Set Defaults for optional arguments.
		if (typeof trackTypeName === "undefined") var trackTypeName = "Video";

		//var trackIncodeFrameLabel = FrameLabel.parseText(frameRate, trackIncode);

		if(commentDetail.length>=495){
			//Trimming Comment to be 495 Characters
		    commentDetail = commentDetail.substring(0,495);
		}

		if (typeof(startTc) === "undefined") {
			var startTc = "00:00:00:00";
		} /*else if (startTc != ("00:00:00:00")) {
			var startTcFrameLabel = FrameLabel.parseText(frameRate, startTc);
			startTc = startTcFrameLabel.subtract(trackIncodeFrameLabel);
		}*/
		if (typeof endTc === "undefined"){
			var endTc = "00:00:00:00";
		} /*else if (endTc != ("00:00:00:00")) {
			var endTcFrameLabel = FrameLabel.parseText(frameRate, endTc);
			endTc = endTcFrameLabel.subtract(trackIncodeFrameLabel);
		}*/

		if (typeof grade === "undefined") var grade = 0;

		var timeAdded = CalendarTime.parseDate(FrameRate.DF30, new Date()).toString();
		
		var commentXml = <Comment>
			<TimeAdded>{timeAdded}</TimeAdded>
			<CommentTypeName>{commentType}</CommentTypeName>
			<Detail>{commentDetail}</Detail>
			<Grade>{grade}</Grade>
			<FrameRate>{frameRate}</FrameRate>
			<StartTc rate={frameRate}>{startTc}</StartTc>
			<EndTc rate={frameRate}>{endTc}</EndTc>
		</Comment>;

		materialObj.Material.TrackTypeLink.(TrackTypeName == trackTypeName).Comment += commentXml;

		return materialObj;
	},

	/**
	 * Add a comment to a Material Object
	 * @param [batonStreamId] [Id of the stream returned from Baton]
	 * @return [Returns Track Type Name for Track Definition that matches the position.]
	 * NO LONGER USED IN PLACE OF createTrackDefPositionMap IN nbcgmo_fun.js.
	 */
	getTrackType : function(batonStreamId, tracksXml) {
		var trackPosition = parseInt(batonStreamId,10) - 1;
		var trackDefinition = tracksXml.TrackDefinition.(Position == trackPosition);
		return trackDefinition.TrackTypeName.toString();
	},

	batonTcToSmpteTc : function(batonTimecode, frameRate) {
		var millisString = batonTimecode.substring(9);
		var notMillisString = batonTimecode.substring(0,9) + "00";
		var millisAOT = AmountOfTime.parseMillis(frameRate,millisString);
		var notMillisAOT = AmountOfTime.parseText(frameRate,notMillisString);
		var totalAOT = notMillisAOT.add(millisAOT);
		return totalAOT.toString();
	}

}
