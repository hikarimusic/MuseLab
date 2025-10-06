// Note mappings
const noteMap = {
    c: 0, cs: 1, db: 1, d: 2, ds: 3, eb: 3, e: 4, f: 5,
    fs: 6, gb: 6, g: 7, gs: 8, ab: 8, a: 9, as: 10, bb: 10, b: 11
};

// Instrument shortcuts
const instrumentShortcuts = {
    apiano: 0, bpiano: 1, epiano: 2, hpiano: 3, ep1: 4, ep2: 5,
    harpsi: 6, clavi: 7, celesta: 8, glock: 9, mbox: 10, vibes: 11,
    marimba: 12, xylo: 13, bells: 14, dulcimer: 15, organ1: 16, organ2: 17,
    organ3: 18, church: 19, reed: 20, accord: 21, harmon: 22, tango: 23,
    aguitn: 24, aguits: 25, eguitj: 26, eguitc: 27, eguitm: 28, oguitar: 29,
    dguitar: 30, gharm: 31, abass: 32, ebassf: 33, ebassp: 34, fbass: 35,
    slap1: 36, slap2: 37, sbass1: 38, sbass2: 39, violin: 40, viola: 41,
    cello: 42, contra: 43, tremolo: 44, pizz: 45, harp: 46, timp: 47,
    strings1: 48, strings2: 49, sstrings1: 50, sstrings2: 51, choir: 52,
    oohs: 53, schoir: 54, ohit: 55, trumpet: 56, tbone: 57, tuba: 58,
    mtrumpet: 59, fhorn: 60, brass: 61, sbrass1: 62, sbrass2: 63,
    ssax: 64, asax: 65, tsax: 66, bsax: 67, oboe: 68, ehorn: 69,
    bassoon: 70, clarinet: 71, piccolo: 72, flute: 73, recorder: 74,
    pan: 75, bottle: 76, shaku: 77, whistle: 78, ocarina: 79,
    square: 80, saw: 81, calliope: 82, chiff: 83, charang: 84,
    voice: 85, fifths: 86, basslead: 87, pad1: 88, pad2: 89,
    pad3: 90, pad4: 91, pad5: 92, pad6: 93, pad7: 94, pad8: 95,
    rain: 96, sound: 97, crystal: 98, atmos: 99, bright: 100,
    goblins: 101, echoes: 102, scifi: 103, sitar: 104, banjo: 105,
    shamisen: 106, koto: 107, kalimba: 108, bagpipe: 109, fiddle: 110,
    shanai: 111, tbell: 112, agogo: 113, steel: 114, wood: 115,
    taiko: 116, mtom: 117, sdrum: 118, rcymbal: 119, gnoise: 120,
    bnoise: 121, sea: 122, bird: 123, phone: 124, heli: 125,
    applause: 126, gun: 127, perc: 128
};

// Percussion/Drum note mappings (shortcuts to MIDI)
const percussionMap = {
    xx: 26,   // Silence
    xhq: 27,  // High-Q
    xsl: 28,  // Slap
    xsp: 29,  // Scratch Push
    xspl: 30, // Scratch Pull
    xst: 31,  // Sticks
    xsq: 32,  // Square Click
    xmc: 33,  // Metronome Click
    xmb: 34,  // Metronome Bell
    xbd: 35,  // Acoustic Bass Drum
    xb: 36,   // Bass Drum
    xss: 37,  // Side Stick
    xs: 38,   // Acoustic Snare
    xhcl: 39,  // Hand Clap
    xse: 40,  // Electric Snare
    xtlf: 41, // Low Floor Tom
    xhc: 42, // Closed Hi Hat
    xthf: 43, // High Floor Tom
    xhp: 44,  // Pedal Hi-Hat
    xtl: 45,  // Low Tom
    xh: 46,   // Open Hi-Hat
    xtlm: 47, // Low-Mid Tom
    xthm: 48, // Hi-Mid Tom
    xc1: 49,  // Crash Cymbal 1
    xth: 50,  // High Tom
    xr1: 51,  // Ride Cymbal 1
    xcc: 52,  // Chinese Cymbal
    xrb: 53,  // Ride Bell
    xtb: 54,  // Tambourine
    xsc: 55,  // Splash Cymbal
    xcw: 56,  // Cowbell
    xc2: 57,  // Crash Cymbal 2
    xvs: 58,  // Vibraslap
    xr2: 59,  // Ride Cymbal 2
    xbh: 60,  // Hi Bongo
    xbl: 61,  // Low Bongo
    xchm: 62, // Mute Hi Conga
    xcho: 63, // Open Hi Conga
    xcl: 64,  // Low Conga
    xtih: 65, // High Timbale
    xtil: 66, // Low Timbale
    xagh: 67, // High Agogo
    xagl: 68, // Low Agogo
    xcab: 69, // Cabasa
    xmar: 70, // Maracas
    xws: 71,  // Short Whistle
    xwl: 72,  // Long Whistle
    xgs: 73,  // Short Guiro
    xgl: 74,  // Long Guiro
    xcla: 75, // Claves
    xwbh: 76, // Hi Wood Block
    xwbl: 77, // Low Wood Block
    xcum: 78, // Mute Cuica
    xcuo: 79, // Open Cuica
    xtm: 80,  // Mute Triangle
    xto: 81,  // Open Triangle
    xsh: 82,  // Shaker
    xjb: 83,  // Jingle Bell
    xbt: 84,  // Bell Tree
    xcast: 85, // Castanets
    xsm: 86,  // Mute Surdo
    xso: 87   // Open Surdo
};

// Full percussion names
const percussionNames = {
    26: "Silence",
    27: "High-Q",
    28: "Slap",
    29: "Scratch Push",
    30: "Scratch Pull",
    31: "Sticks",
    32: "Square Click",
    33: "Metronome Click",
    34: "Metronome Bell",
    35: "Acoustic Bass Drum",
    36: "Bass Drum",
    37: "Side Stick",
    38: "Acoustic Snare",
    39: "Hand Clap",
    40: "Electric Snare",
    41: "Low Floor Tom",
    42: "Closed Hi Hat",
    43: "High Floor Tom",
    44: "Pedal Hi-Hat",
    45: "Low Tom",
    46: "Open Hi-Hat",
    47: "Low-Mid Tom",
    48: "Hi-Mid Tom",
    49: "Crash Cymbal 1",
    50: "High Tom",
    51: "Ride Cymbal 1",
    52: "Chinese Cymbal",
    53: "Ride Bell",
    54: "Tambourine",
    55: "Splash Cymbal",
    56: "Cowbell",
    57: "Crash Cymbal 2",
    58: "Vibraslap",
    59: "Ride Cymbal 2",
    60: "Hi Bongo",
    61: "Low Bongo",
    62: "Mute Hi Conga",
    63: "Open Hi Conga",
    64: "Low Conga",
    65: "High Timbale",
    66: "Low Timbale",
    67: "High Agogo",
    68: "Low Agogo",
    69: "Cabasa",
    70: "Maracas",
    71: "Short Whistle",
    72: "Long Whistle",
    73: "Short Guiro",
    74: "Long Guiro",
    75: "Claves",
    76: "Hi Wood Block",
    77: "Low Wood Block",
    78: "Mute Cuica",
    79: "Open Cuica",
    80: "Mute Triangle",
    81: "Open Triangle",
    82: "Shaker",
    83: "Jingle Bell",
    84: "Bell Tree",
    85: "Castanets",
    86: "Mute Surdo",
    87: "Open Surdo"
};

// Instrument display names and code names
const instrumentList = [
    "Acoustic Grand Piano",
    "Bright Acoustic Piano",
    "Electric Grand Piano",
    "Honkytonk Piano",
    "Electric Piano 1",
    "Electric Piano 2",
    "Harpsichord",
    "Clavinet",
    "Celesta",
    "Glockenspiel",
    "Music Box",
    "Vibraphone",
    "Marimba",
    "Xylophone",
    "Tubular Bells",
    "Dulcimer",
    "Drawbar Organ",
    "Percussive Organ",
    "Rock Organ",
    "Church Organ",
    "Reed Organ",
    "Accordion",
    "Harmonica",
    "Tango Accordion",
    "Acoustic Guitar (Nylon)",
    "Acoustic Guitar (Steel)",
    "Electric Guitar (Jazz)",
    "Electric Guitar (Clean)",
    "Electric Guitar (Muted)",
    "Overdriven Guitar",
    "Distortion Guitar",
    "Guitar Harmonics",
    "Acoustic Bass",
    "Electric Bass (Finger)",
    "Electric Bass (Pick)",
    "Fretless Bass",
    "Slap Bass 1",
    "Slap Bass 2",
    "Synth Bass 1",
    "Synth Bass 2",
    "Violin",
    "Viola",
    "Cello",
    "Contrabass",
    "Tremolo Strings",
    "Pizzicato Strings",
    "Orchestral Harp",
    "Timpani",
    "String Ensemble 1",
    "String Ensemble 2",
    "Synth Strings 1",
    "Synth Strings 2",
    "Choir Aahs",
    "Voice Oohs",
    "Synth Choir",
    "Orchestra Hit",
    "Trumpet",
    "Trombone",
    "Tuba",
    "Muted Trumpet",
    "French Horn",
    "Brass Section",
    "Synth Brass 1",
    "Synth Brass 2",
    "Soprano Sax",
    "Alto Sax",
    "Tenor Sax",
    "Baritone Sax",
    "Oboe",
    "English Horn",
    "Bassoon",
    "Clarinet",
    "Piccolo",
    "Flute",
    "Recorder",
    "Pan Flute",
    "Blown Bottle",
    "Shakuhachi",
    "Whistle",
    "Ocarina",
    "Lead 1 (Square)",
    "Lead 2 (Sawtooth)",
    "Lead 3 (Calliope)",
    "Lead 4 (Chiff)",
    "Lead 5 (Charang)",
    "Lead 6 (Voice)",
    "Lead 7 (Fifths)",
    "Lead 8 (Bass + Lead)",
    "Pad 1 (New Age)",
    "Pad 2 (Warm)",
    "Pad 3 (Polysynth)",
    "Pad 4 (Choir)",
    "Pad 5 (Bowed)",
    "Pad 6 (Metallic)",
    "Pad 7 (Halo)",
    "Pad 8 (Sweep)",
    "FX 1 (Rain)",
    "FX 2 (Soundtrack)",
    "FX 3 (Crystal)",
    "FX 4 (Atmosphere)",
    "FX 5 (Brightness)",
    "FX 6 (Goblins)",
    "FX 7 (Echoes)",
    "FX 8 (Sci-Fi)",
    "Sitar",
    "Banjo",
    "Shamisen",
    "Koto",
    "Kalimba",
    "Bagpipe",
    "Fiddle",
    "Shanai",
    "Tinkle Bell",
    "Agogo",
    "Steel Drums",
    "Woodblock",
    "Taiko Drum",
    "Melodic Tom",
    "Synth Drum",
    "Reverse Cymbal",
    "Guitar Fret Noise",
    "Breath Noise",
    "Seashore",
    "Bird Tweet",
    "Telephone Ring",
    "Helicopter",
    "Applause",
    "Gunshot"
];

const instrumentCodeNames = [
    "acoustic_grand_piano", "bright_acoustic_piano", "electric_grand_piano", "honkytonk_piano",
    "electric_piano_1", "electric_piano_2", "harpsichord", "clavinet", "celesta", "glockenspiel",
    "music_box", "vibraphone", "marimba", "xylophone", "tubular_bells", "dulcimer", "drawbar_organ",
    "percussive_organ", "rock_organ", "church_organ", "reed_organ", "accordion", "harmonica", "tango_accordion",
    "acoustic_guitar_nylon", "acoustic_guitar_steel", "electric_guitar_jazz", "electric_guitar_clean",
    "electric_guitar_muted", "overdriven_guitar", "distortion_guitar", "guitar_harmonics", "acoustic_bass",
    "electric_bass_finger", "electric_bass_pick", "fretless_bass", "slap_bass_1", "slap_bass_2",
    "synth_bass_1", "synth_bass_2", "violin", "viola", "cello", "contrabass", "tremolo_strings",
    "pizzicato_strings", "orchestral_harp", "timpani", "string_ensemble_1", "string_ensemble_2",
    "synth_strings_1", "synth_strings_2", "choir_aahs", "voice_oohs", "synth_choir", "orchestra_hit",
    "trumpet", "trombone", "tuba", "muted_trumpet", "french_horn", "brass_section", "synth_brass_1",
    "synth_brass_2", "soprano_sax", "alto_sax", "tenor_sax", "baritone_sax", "oboe", "english_horn",
    "bassoon", "clarinet", "piccolo", "flute", "recorder", "pan_flute", "blown_bottle", "shakuhachi",
    "whistle", "ocarina", "lead_1_square", "lead_2_sawtooth", "lead_3_calliope", "lead_4_chiff",
    "lead_5_charang", "lead_6_voice", "lead_7_fifths", "lead_8_bass_lead", "pad_1_new_age", "pad_2_warm",
    "pad_3_polysynth", "pad_4_choir", "pad_5_bowed", "pad_6_metallic", "pad_7_halo", "pad_8_sweep",
    "fx_1_rain", "fx_2_soundtrack", "fx_3_crystal", "fx_4_atmosphere", "fx_5_brightness", "fx_6_goblins",
    "fx_7_echoes", "fx_8_scifi", "sitar", "banjo", "shamisen", "koto", "kalimba", "bagpipe", "fiddle",
    "shanai", "tinkle_bell", "agogo", "steel_drums", "woodblock", "taiko_drum", "melodic_tom",
    "synth_drum", "reverse_cymbal", "guitar_fret_noise", "breath_noise", "seashore", "bird_tweet",
    "telephone_ring", "helicopter", "applause", "gunshot"
];

// Create instrument map from code names and shortcuts
const instrumentMap = {};
instrumentCodeNames.forEach((name, index) => {
    instrumentMap[name] = index;
});
// Add shortcuts to instrument map
Object.entries(instrumentShortcuts).forEach(([shortcut, index]) => {
    instrumentMap[shortcut] = index;
});