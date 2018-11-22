class ValidationError(Exception):
    def __init__(self, message, field=None, value=None):
        super(ValidationError, self).__init__(message)
        self.field = field
        self.value = value
        self.message = message

    def __str__(self):
        return self.message

class Models:
    def __init__(self):
        self.materialSave = {
            "materialType": {
                "values": [
                    "Art",
                    "Bug",
                    "Closed Caption",
                    "Commercial",
                    "Descriptive Audio",
                    "Descriptive Video Service",
                    "Document",
                    "Dub",
                    "Edit Log",
                    "Episodic",
                    "Font File",
                    "Footage",
                    "Graphic",
                    "Logo",
                    "Music",
                    "Music Cue",
                    "Original Audio",
                    "Photography",
                    "Podcast",
                    "Print",
                    "Promotion",
                    "QC Report",
                    "Script",
                    "SFX",
                    "Shoot Report",
                    "Short",
                    "Subtitle",
                    "Theatrical",
                    "Transcript",
                    "Unknown",
                    "Voiceover"
                ]
            },
            "versionType": {
                "values": ["TEXTED", "TEXTLESS", "TATEND"]
            },
            "aspectRatio": {
                "values": ["Unknown", "4:3", "14:9", "16:9"]
            },
            "trackTypeLinks": {
                "values": [
                   'Document',
                    'Image',
                    'Unknown',
                    'Video',
                    'MOS',
                    'Mono Audio Description English (US)',
                    'Mono Booth Commentator English (US)',
                    'Mono Dialogue English (US)',
                    'Mono Effects',
                    'Mono English (US)',
                    'Mono Ground Commentator English (US)',
                    'Mono M&E',
                    'Mono Mix Minus',
                    'Mono Voiceover English (US)',
                    'Stereo English (US)',
                    'Surround C/LFE English (US)',
                    'Surround Front English (US)',
                    'Surround Rear English (US)',
                    'Audio Description English (US)',
                    'Stereo Dialogue English (US)',
                    'Stereo Effects',
                    'Stereo Foley & Effects',
                    'Stereo M&E',
                    'Stereo Mix Minus',
                    'Stereo Mix Minus Narration',
                    'Stereo Music',
                    'Stereo Spanish',
                    'Stereo TLMD M&E',
                    'Stereo French',
                    'OriginalAudio',
                    'Graphic'
                ]
            }
        }

        # placingSave does not use any tags (for now).
        self.placingSave = {
        }