if (gmoNBCFunc === undefined) {
	print("Loading /usr/local/pharos/etc/scripts/nbcgmo_fun.js");
	load("/usr/local/pharos/etc/scripts/nbcgmo_fun.js");
} else {
	print("Object [ gmoNBCFunc ] already lodaded");
}

var TextlessHandler = function() {
	this.textedMaterialId = "";
	this.textlessMaterialId = "";
	this.textedMaterialHelper;
	this.textlessMaterialHelper;
	this.textedSegmentList;
	this.textlessSegmentList;
	this.textlessFilterName = "";
	
	// Fixed Settings
	this.__TEXTED_SEGMENT_GROUP = "Texted Data";
	this.__TEXTLESS_SEGMENT_GROUP = "Textless Data";
	this.__MAIN_MATERIAL_STREAM = "nld video";
	this.__VIDEO_EVENT_TYPE = "Video";
	this.__TEXTED_DESCRIPTION = "Texted Override";
	this.__TEXTED_CG_TEXT = "Texted Override";
	this.__TEXTLESS_DESCRIPTION = "Textless Override";
	this.__TEXTLESS_CG_TEXT = "Textless Override";
	this.__ONE_FRAME = 1;
	
	this.setTextlessFilterName = function(uName) {
		this.textlessFilterName = uName;
	}

	this.getTextlessFilterName = function() {
		return this.textlessFilterName;
	}
	
	this.refresh = function() {
		this.setTextedMatId(this.textedMaterialId);
		this.setTextlessMatId(this.textlessMaterialId);
	}

    this.getTextedMatId = function() {
        return this.textedMaterialId;
    }
	
	this.setTextedMatId = function(matId) {
		this.textedMaterialId = matId;
		this.textedMaterialHelper = new gmoNBCFunc.materialHelper(matId);
		this.textedSegmentList = this.textedMaterialHelper.getSegmentsByGroup(this.__TEXTED_SEGMENT_GROUP, true);

        // We need the MatId in each segment so we can use it in the component templates.
        for each (var segment in this.textedSegmentList.Segment){
            segment.Material.MatId = <MatId>{matId}</MatId>;
        }
	}

    this.getTextlessMatId = function() {
        return this.textlessMaterialId;
    }
	
	this.setTextlessMatId = function(matId) {
		this.textlessMaterialId = matId;
		this.textlessMaterialHelper = new gmoNBCFunc.materialHelper(matId);
		this.textlessSegmentList = this.textlessMaterialHelper.getSegmentsByGroup(this.__TEXTLESS_SEGMENT_GROUP, true);

		// We need the MatId in each segment so we can use it in the component templates.
		for each (var segment in this.textlessSegmentList.Segment){
			segment.Material.MatId = <MatId>{matId}</MatId>;
		}
	}

    this.minusOneFrame = function(frame_label, frame_rate) {
        var label = FrameLabel.parseText(frame_rate, frame_label);
        var aot = AmountOfTime.parseFrames(frame_rate, this.__ONE_FRAME);
        return label.subtract(aot);
    }

    this.addOneFrame = function(frame_label, frame_rate) {
        var label = FrameLabel.parseText(frame_rate, frame_label);
        var aot = AmountOfTime.parseFrames(frame_rate, this.__ONE_FRAME);
        return label.add(aot);
    }

    /**
     *	Get the list of all textless segments, currently no need to compare against anything, adding for completeness.
	 *  This will return a JS array instead of an XMLList like the @getMatechedTextedSegments() function.
     * @returns {Array} - List of matched textless segments.
     */
    this.getMatchedTextlessSegments = function(){
		var matchingSegmentList = [];

		for each (var textlessSegment in this.textlessSegmentList.Segment){
            matchingSegmentList.push(textlessSegment);
		}

        return matchingSegmentList;
	}

    /**
	 *	Get the list of all texted segments used for inseration within the bounds of the segment to check against
     * @param segment - Segment to check within the bounds of.
	 * @returns {Array} - List of matched texted segments.
     */
    this.getMatchedTextedSegments = function(segment){

		var matchingSegmentList = [];

		// Timecodes from the segment to check against.
        var segmentIncodeAsFrames = FrameLabel.parseText(segment.MarkerIn.FrameRate, segment.MarkerIn.Absolute.toString()).asFrames();
        var segmentOutcodeAsFrames = FrameLabel.parseText(segment.MarkerOut.FrameRate, segment.MarkerOut.Absolute.toString()).asFrames();
        if (debug) output("getMatchedSegments(): Segment Incode [" + segment.MarkerIn.Absolute.toString() + "] Frames [" + segmentIncodeAsFrames + "]");
        if (debug) output("getMatchedSegments(): Segment Outcode [" + segment.MarkerOut.Absolute.toString() + "] Frames [" + segmentOutcodeAsFrames + "]");

        // Loop over all of the texted segments to find the ones in range of the segment were checking.
        for each (var textedSegment in this.textedSegmentList.Segment) {
            var textedSegmentIncodeAsFrames = FrameLabel.parseText(textedSegment.MarkerIn.FrameRate, textedSegment.MarkerIn.Absolute.toString()).asFrames();
            if (textedSegmentIncodeAsFrames >= segmentIncodeAsFrames
				&& textedSegmentIncodeAsFrames <= segmentOutcodeAsFrames) {

            	// We found a texted segment within the other segment. Add it to the list.
                matchingSegmentList.push(textedSegment);
            }
        }

        return matchingSegmentList;
	}

	this.getMatchedSegments = function(segment){
		var textedSegments = this.getMatchedTextedSegments(segment);
		var textlessSegments = this.getMatchedTextlessSegments();
		print("Texted Segments [" + textedSegments.length + "] Textless Segments [" + textlessSegments.length + "]");

		// Empty list to add any matched Texted/Textless Segments to.
		var matchedSegmentObjList = [];

		// Loop over each texted segment and compare to see if we can find a matching textless segemnt
		for each (var textedSegment in textedSegments){
			var textedSegmentFrameRate = textedSegment.MarkerIn.FrameRate.toString();
			var textedSegmentIncode = FrameLabel.parseText(textedSegmentFrameRate, textedSegment.MarkerIn.Absolute.toString());
            var textedSegmentOutcode = FrameLabel.parseText(textedSegmentFrameRate, textedSegment.MarkerOut.Absolute.toString());
            var textedSegmentDuration = gmoNBCFunc.calculateDuration(textedSegmentIncode, textedSegmentOutcode, textedSegmentFrameRate);
            var textedSegmentIndex = textedSegment.Index.toString();


            // Loop over each Textless Segment to see if we can find a match.
			for each (var textlessSegment in textlessSegments){
                var textlessSegmentFrameRate = textlessSegment.MarkerIn.FrameRate.toString();
                var textlessSegmentIncode = FrameLabel.parseText(textlessSegmentFrameRate, textlessSegment.MarkerIn.Absolute.toString());
                var textlessSegmentOutcode = FrameLabel.parseText(textlessSegmentFrameRate, textlessSegment.MarkerOut.Absolute.toString());
                var textlessSegmentDuration = gmoNBCFunc.calculateDuration(textlessSegmentIncode, textlessSegmentOutcode, textlessSegmentFrameRate);
                var textlessSegmentIndex = textlessSegment.Index.toString();

                if (debug) {
                    print("--------------------");
                    print("Checking the following segments;");
                    print("Texted Segment:    Index [" + textedSegmentIndex + "] Incode ["+textedSegmentIncode+"] Outcode ["+textedSegmentOutcode+"]");
                    print("Textless Segment:  Index [" + textlessSegmentIndex + "] Incode ["+textlessSegmentIncode+"] Outcode ["+textlessSegmentOutcode+"]");
                    print("--------------------")
				}

				if (textedSegmentIndex == textlessSegmentIndex
					&& textedSegmentDuration == textlessSegmentDuration){

					output("Matching texted, textless segment found.");
					var matchedSegmentObj = {};
					matchedSegmentObj["texted"] = textedSegment;
                    matchedSegmentObj["textless"] = textlessSegment;

                    matchedSegmentObjList.push(matchedSegmentObj);
                    break;

				}
			}
		}

        matchedSegmentObjList.sort(function(a,b) {
            return a["texted"].MarkerIn.Absolute.@nanos - b["texted"].MarkerIn.Absolute.@nanos;
        });

		return matchedSegmentObjList;
	}


	this.minusOneFrame_FromFrameLabel = function(frame_label, frame_rate) {
		var label = FrameLabel.parseText(frame_rate, frame_label);
		var aot = AmountOfTime.parseFrames(frame_rate, this.__ONE_FRAME);
		return label.subtract(aot);
	}

	this.addOneFrame_FromFrameLabel = function(frame_label, frame_rate) {
		var label = FrameLabel.parseText(frame_rate, frame_label);
		var aot = AmountOfTime.parseFrames(frame_rate, this.__ONE_FRAME);
		return label.add(aot);
	}	

	this.eventContainsTextedMarkup = function(event) {
		var eventTrimAsFrames = AmountOfTime.parseText(event.FrameRate, event.EventTrim).asFrames();
		var eventOutcodeAsFrames = AmountOfTime.parseText(event.FrameRate, event.Outcode).asFrames();
		output("eventContainsTextedMarkup(): Event Incode [" + event.EventTrim + "] Frames [" + eventTrimAsFrames + "]");
		output("eventContainsTextedMarkup(): Event Outcode [" + event.Outcode + "] Frames [" + eventOutcodeAsFrames + "]");
		for each (var segment in this.textedSegmentList.Segment) {
			var segmentIncodeAsFrames = AmountOfTime.parseText(segment.MarkerIn.FrameRate, segment.MarkerIn.Absolute.toString()).asFrames();
			if (segmentIncodeAsFrames >= eventTrimAsFrames && segmentIncodeAsFrames <= eventOutcodeAsFrames) {
				output("eventContainsTextedMarkup(): Found Corresponding Texted Segment");
				return true;
			}
		}
		return false;
	}

	this.eventContainsTextedMarkupAndHasMatchingTextless = function(event) {
		output("eventContainsTextedMarkupAndHasMatchingTextless(): Checking to see whether Event has a Matching 'Texted' Segment applied");
		var eventTrimAsFrames = AmountOfTime.parseText(event.FrameRate, event.EventTrim).asFrames();
		var eventOutcodeAsFrames = AmountOfTime.parseText(event.FrameRate, event.Outcode).asFrames();
		output("eventContainsTextedMarkupAndHasMatchingTextless(): Event Incode [" + event.EventTrim + "] Frames [" + eventTrimAsFrames + "]");
		output("eventContainsTextedMarkupAndHasMatchingTextless(): Event Outcode [" + event.Outcode + "] Frames [" + eventOutcodeAsFrames + "]");
		for each (var segment in this.textedSegmentList.Segment) {
			var segmentIncodeAsFrames = AmountOfTime.parseText(segment.MarkerIn.FrameRate, segment.MarkerIn.Absolute.toString()).asFrames();
			if (segmentIncodeAsFrames >= eventTrimAsFrames && segmentIncodeAsFrames <= eventOutcodeAsFrames) {
				output("eventContainsTextedMarkupAndHasMatchingTextless(): Found Corresponding Texted Segment (Index [" + segment.Index + "]) - Checking to see if we have a matching Textless Segment");
				if (this.getCorrespondingTextlessSegment(segment.Index)) {
					output("eventContainsTextedMarkupAndHasMatchingTextless(): Found Matching Textless Segment");
					return true;
				} else {
					output("eventContainsTextedMarkupAndHasMatchingTextless(): Could Not Find Matching Textless Segment");
				}
			}
		}
		return false;
	}	

	this.getCorrespondingTextlessSegment = function(uTextedSegmentIndex) {
		// output("DEBUG: textlessSegmentList:\n" + this.textlessSegmentList);
		if (this.textlessSegmentList.Segment.(Index.toString() == uTextedSegmentIndex).length() == 1) {
			output("haveCorrespondingTextlessSegment(): Found Corresponding Textless Segment for Index [" + uTextedSegmentIndex + "]");
			if (this.getTextlessFilterName()) {
				if (this.textlessSegmentList.Segment.(Index.toString() == uTextedSegmentIndex && ShortTextList.ShortText.(ShortTextType.toString() == this.getTextlessFilterName()).Value.toString().toLowerCase() == "true").length() == 1) {
					output("haveCorrespondingTextlessSegment(): Found Corresponding Textless Segment Matching Textless Filter [" + this.getTextlessFilterName() + "]");

					return this.textlessSegmentList.Segment.(Index.toString() == uTextedSegmentIndex && ShortTextList.ShortText.(ShortTextType.toString() == this.getTextlessFilterName()).Value.toString().toLowerCase() == "true");
				} else {
					output("haveCorrespondingTextlessSegment(): Could Not Find Corresponding Textless Segment Matching Textless Filter [" + this.getTextlessFilterName() + "]");
					return null;
				}
			} else {
				return this.textlessSegmentList.Segment.(Index.toString() == uTextedSegmentIndex);
			}
		} else {
			return null;
		}
	}

	this.getCorrespondingTextedSegment = function(textlessSegmentId) {

		var uTextlessSegmentIndex = this.textlessSegmentList.Segment.(@id.toString() == textlessSegmentId ).Index.toString();
		// output("DEBUG: textedSegmentList:\n" + this.textedSegmentList);
		if (this.textedSegmentList.Segment.(Index.toString() == uTextlessSegmentIndex).length() == 1) {
			output("haveCorrespondingTextedSegment(): Found Corresponding Texted Segment for Index [" + uTextlessSegmentIndex + "]");
			if (this.getTextlessFilterName()) {
				if (this.textedSegmentList.Segment.(Index.toString() == uTextlessSegmentIndex)) {
					output("haveCorrespondingTextedSegment(): Found Corresponding Texted Segment Matching Textless Filter [" + this.getTextlessFilterName() + "]");
					// print("DEBUG: " + this.textedSegmentList.Segment.(Index.toString() == uTextlessSegmentIndex && ShortTextList.ShortText.ShortTextType.toString() == this.getTextlessFilterName() && ShortTextList.ShortText.Value.toString().toLowerCase() == "true"));
					return this.textedSegmentList.Segment.(Index.toString() == uTextlessSegmentIndex);
				} else {
					output("haveCorrespondingTextedSegment(): Could Not Find Corresponding Texted Segment Matching Textless Filter [" + this.getTextlessFilterName() + "]");
					return null;
				}
			} else {
				return this.textedSegmentList.Segment.(Index.toString() == uTextlessSegmentIndex);
			}
		} else {
			return null;
		}
		
	}

	this.getTextedSegmentForEvent = function(event) {
		var eventTrimAsFrames = AmountOfTime.parseText(event.FrameRate, event.EventTrim).asFrames();
		var eventOutcodeAsFrames = AmountOfTime.parseText(event.FrameRate, event.Outcode).asFrames();
		output("getTextedSegmentForEvent(): Event Incode [" + event.EventTrim + "] Frames [" + eventTrimAsFrames + "]");
		output("getTextedSegmentForEvent(): Event Outcode [" + event.Outcode + "] Frames [" + eventOutcodeAsFrames + "]");
		for each (var segment in this.textedSegmentList.Segment) {
			var segmentIncodeAsFrames = AmountOfTime.parseText(segment.MarkerIn.FrameRate, segment.MarkerIn.Absolute.toString()).asFrames();
			if (segmentIncodeAsFrames >= eventTrimAsFrames && segmentIncodeAsFrames <= eventOutcodeAsFrames) {
				return segment;
			}
		}
		return null;		
	}

	this.getTextedSegmentForEventWhichHasMatchingTextless = function(event) {
		var eventTrimAsFrames = AmountOfTime.parseText(event.FrameRate, event.EventTrim).asFrames();
		var eventOutcodeAsFrames = AmountOfTime.parseText(event.FrameRate, event.Outcode).asFrames();
		output("getTextedSegmentForEventWhichHasMatchingTextless(): Event Incode [" + event.EventTrim + "] Frames [" + eventTrimAsFrames + "]");
		output("getTextedSegmentForEventWhichHasMatchingTextless(): Event Outcode [" + event.Outcode + "] Frames [" + eventOutcodeAsFrames + "]");
		for each (var segment in this.textedSegmentList.Segment) {
			var segmentIncodeAsFrames = AmountOfTime.parseText(segment.MarkerIn.FrameRate, segment.MarkerIn.Absolute.toString()).asFrames();
			if (segmentIncodeAsFrames >= eventTrimAsFrames && segmentIncodeAsFrames <= eventOutcodeAsFrames) {
				output("getTextedSegmentForEventWhichHasMatchingTextless(): Found Corresponding Texted Segment (Index [" + segment.Index + "]) - Checking to see if we have a matching Textless Segment");
				if (this.getCorrespondingTextlessSegment(segment.Index)) {
					output("getTextedSegmentForEventWhichHasMatchingTextless(): Found Matching Textless Segment");
					return segment;
				} else {
					output("getTextedSegmentForEventWhichHasMatchingTextless(): Could Not Find Matching Textless Segment");
				}
			}
		}
		return null;		
	}

	// Hand in an event to split
	// Insert the Texted Segment
	// Retime the event outcode
	// Add the remainder of the event onto the end (if needed)
	this.insertTextedEventIntoMiddle = function(startEvent, textedEvent, textlessEvent) {
		// Shorten the start event
		var newEvents = new XMLList();
		// Adjust Timings for the Start Event
		var adjustedStartEventOutcode = this.minusOneFrame_FromFrameLabel(textedEvent.EventTrim.toString(), startEvent.FrameRate);
		var adjustedStartEventDuration = this.calculateDuration(startEvent.EventTrim.toString(), adjustedStartEventOutcode, startEvent.FrameRate);
		var adjustedStartEvent = gmoNBCNLDFunc.makeBaseEventXml(adjustedStartEventDuration, 
															startEvent.FrameRate,
															startEvent.Stream,
															startEvent.TrimMaterialId,
															startEvent.EventType,
															startEvent.Description,
															startEvent.CgText,
															startEvent.EventTrim.toString(),
															adjustedStartEventOutcode);
		newEvents = adjustedStartEvent; // Add to the Event XML List
		newEvents += textlessEvent// Add the textless Event
		
		// If the texted outcode is within the Outcode of the original start event then we need to add in the remainder of the start event
		if (textedEvent.Outcode.toString() != startEvent.Outcode.toString()) { // TODO: Should we evaluate the frame value (as an integer)?
			var endEventTrim = this.addOneFrame_FromFrameLabel(textedEvent.Outcode.toString(), startEvent.FrameRate);
			var endEventDuration = this.calculateDuration(endEventTrim, startEvent.Outcode.toString(), startEvent.FrameRate);
		
			var endEventWrapper = gmoNBCNLDFunc.makeBaseEventXml(endEventDuration, 
															startEvent.FrameRate,
															startEvent.Stream,
															startEvent.TrimMaterialId,
															startEvent.EventType,
															startEvent.Description,
															startEvent.CgText,
															endEventTrim,
															startEvent.Outcode.toString());
			newEvents += endEventWrapper;
		}
		
		print("insertTextedEventIntoMiddle(): New Event List:\n" + newEvents);
		return newEvents;
	}

	this.reworkParcelOffsets = function(wParcelXml) {
		var filterEventList = function(_evList, _stream) {
			var _rtnList = new XMLList();
			for each (_ev in _evList.Event) {
				if (_ev.Stream.toString() == _stream) {
					_rtnList += _ev;
				}
			}
			return <ParcelEventList>{_rtnList}</ParcelEventList>;
		}
		
		print("reworkParcelOffsets(): Retiming Parcel:");
		var parcelOffset;
		var previousOffset;
		var newAddition = "New Addition";
		var wEventList = wParcelXml.ParcelEventList; // Have to do this to keep functionallity the same (need .Event children)
		var wParcelFrameRate = wParcelXml.FrameRate.toString();
		
		for each (var ev in wEventList.Event) {
			// Used for logging
			previousOffset = ev.ParcelOffset.toString() === "" ? newAddition : ev.ParcelOffset;
			// Create Parcel Offsets - if first event (0 based counting) start at 00:00:00:00 otherwise add previous events duration
			parcelOffset = ev.childIndex() == 0 ? AmountOfTime.parseFrames(wParcelFrameRate, 0) : parcelOffset.add(AmountOfTime.parseText(FrameRate[gmoNBCNLDFunc.getPrevEvent(wEventList, ev.childIndex()).FrameRate.toString()], gmoNBCNLDFunc.getPrevEvent(wEventList, ev.childIndex()).Duration.toString()));
			
			// Change the Current Events Offset
			ev.ParcelOffset = parcelOffset.asText(FrameRate[wParcelFrameRate]);  
			ev.Duration.@rate = wParcelFrameRate;
			
			print(
				"\nEvent Index [" + ev.childIndex() + "]" +
				" Original Parcel Offset [" + previousOffset  + "]" +
				" New Parcel Offset [" + ev.ParcelOffset + "]" +
				" Duration [" + ev.Duration + "]" 
			);
		
		}
		wParcelXml.Duration = gmoNBCNLDFunc.getParcelDuration(<Placing><PlacingParcel>{wParcelXml}</PlacingParcel></Placing>);		
		return wParcelXml;
	}

	this.calculateDuration = function(inpoint, outpoint, frameRate) {
		var rtn = wscall(<PharosCs>
				<CommandList>
					<Command subsystem="timecode" method="calculateDuration">
					<ParameterList>
						<Parameter name="incode" value={inpoint}/>
						<Parameter name="outcode" value={outpoint}/>
						<Parameter name="frameRate" value={frameRate}/>
					</ParameterList>
					</Command>
				</CommandList>
				</PharosCs>);
		return rtn..Output.toString();
	}

	// Should input a filtered event list - only the Texted Material
	this.adjustEventListWithTextedSegments = function(eventList) {
		while (true) {
			var newEventList = new XMLList();
			for each (var ev in eventList.Event) {
				if (ev.Stream.toString() == this.__MAIN_MATERIAL_STREAM && ev.CgText.toString() != this.__TEXTLESS_CG_TEXT) {
					var eventIndex = parseInt(ev.childIndex());
					var eventsToAdd;
					if (this.eventContainsTextedMarkupAndHasMatchingTextless(ev)) {
						output("adjustEventListWithTextedSegments(): Event At Index [" + eventIndex + "] Found to Contain Appropriate Texted & Textless Segments");
						eventsToAdd = this.adjustEvent(ev);
					} else {
						eventsToAdd = ev;
					}				
				} else {
					eventsToAdd = ev;
				}
				newEventList += eventsToAdd;
			}
			break;
		}
		print("adjustEventListWithTextedSegments(): Final/New Event List:\n" + newEventList);
		return newEventList;
	}

	this.adjustEvent = function(uEvent) {
		var adjustedResultList = new XMLList(); // TODO: The fix is to only add the first and second events to the return event list if we are adjusting the third event.
		var returnFromAdjustment = new XMLList();
		output("adjustEvent(): Running");
		var textedSegmentToInsert = this.getTextedSegmentForEventWhichHasMatchingTextless(uEvent);
		var textedSegmentEventXml = this.buildTextedSegmentEventXml(textedSegmentToInsert); 
		// TODO This is Redundant now that wee are checking for the textless in 'eventContainsTextedMarkupAndHasMatchingTextless'
		if (this.getCorrespondingTextlessSegment(textedSegmentToInsert.Index)) { 
			var textlessSegmentEventXml = this.buildTextlessSegmentEventXml(this.getCorrespondingTextlessSegment(textedSegmentToInsert.Index));
		} else {
			var textlessSegmentEventXml = textedSegmentEventXml;
		}
		// Insert the Texted Segment
		// Build Texted Segment Event XML
		// Insert the Texted Segment
		print("adjustEvent(): Inserting New Events into Event List");
		returnFromAdjustment = this.insertTextedEventIntoMiddle(uEvent, textedSegmentEventXml, textlessSegmentEventXml);
		adjustedResultList += returnFromAdjustment[0];
		adjustedResultList += returnFromAdjustment[1];
		if (returnFromAdjustment.length() > 2) {
			output("adjustEvent(): We Have Added a Texted Segment and have remaining Event left over. Continuing to analyse it");
			output("DEBUG: Checking:\n" + returnFromAdjustment[2]);
			if (this.eventContainsTextedMarkupAndHasMatchingTextless(returnFromAdjustment[2])) {
				adjustedResultList += this.adjustEvent(returnFromAdjustment[2]);
			} else {
				// Add the Event as it stands into the Result List
				output("adjustEvent(): No More Texted Found - Adding Event to the Return List");
				adjustedResultList += returnFromAdjustment[2];
			}
		}
		output("adjustEvent(): Complete\n");
		return adjustedResultList;
	}

	this.buildTextedSegmentEventXml = function(mySegment) {
		return gmoNBCNLDFunc.makeBaseEventXml(	this.textedMaterialHelper.getSegmentDuration(mySegment.SegmentGroup.Name.toString(), mySegment.Index), 
												this.textedMaterialHelper.getMaterialFrameRate(), 
												this.__MAIN_MATERIAL_STREAM, 
												this.textedMaterialId, 
												this.__VIDEO_EVENT_TYPE, 
												this.__TEXTED_DESCRIPTION, 
												this.__TEXTED_CG_TEXT, 
												this.textedMaterialHelper.getSegmentIncode(mySegment.SegmentGroup.Name.toString(), mySegment.Index), 
												this.textedMaterialHelper.getSegmentOutcode(mySegment.SegmentGroup.Name.toString(), mySegment.Index),mySegment.@id.toString())
	}

	this.buildTextlessSegmentEventXml = function(mySegment) {
		return gmoNBCNLDFunc.makeBaseEventXml(	this.textlessMaterialHelper.getSegmentDuration(this.__TEXTLESS_SEGMENT_GROUP, mySegment.Index), 
												this.textlessMaterialHelper.getMaterialFrameRate(), 
												this.__MAIN_MATERIAL_STREAM, 
												this.textlessMaterialId, 
												this.__VIDEO_EVENT_TYPE, 
												this.__TEXTLESS_DESCRIPTION, 
												this.__TEXTLESS_CG_TEXT, 
												this.textlessMaterialHelper.getSegmentIncode(this.__TEXTLESS_SEGMENT_GROUP, mySegment.Index), 
												this.textlessMaterialHelper.getSegmentOutcode(this.__TEXTLESS_SEGMENT_GROUP, mySegment.Index),mySegment.@id.toString())
	}

}

print("Loaded [TextlessHander.js]");
