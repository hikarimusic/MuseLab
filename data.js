const noteMap = {
    c:  0,  // C
    cs: 1,  // C#
    db: 1,  // Db
    d:  2,  // D
    ds: 3,  // D#
    eb: 3,  // Eb
    e:  4,  // E
    f:  5,  // F
    fs: 6,  // F#
    gb: 6,  // Gb
    g:  7,  // G
    gs: 8,  // G#
    ab: 8,  // Ab
    a:  9,  // A
    as: 10, // A#
    bb: 10, // Bb
    b:  11  // B
};

const percussionMap = {
    x:    26, // Silence
    hq:   27, // High-Q
    sl:   28, // Slap
    sp:   29, // Scratch Push
    spl:  30, // Scratch Pull
    st:   31, // Sticks
    sq:   32, // Square Click
    mc:   33, // Metronome Click
    mb:   34, // Metronome Bell
    bd:   35, // Acoustic Bass Drum
    b:    36, // Bass Drum
    ss:   37, // Side Stick
    s:    38, // Acoustic Snare
    hcl:  39, // Hand Clap
    se:   40, // Electric Snare
    tlf:  41, // Low Floor Tom
    hc:   42, // Closed Hi Hat
    thf:  43, // High Floor Tom
    hp:   44, // Pedal Hi-Hat
    tl:   45, // Low Tom
    h:    46, // Open Hi-Hat
    tlm:  47, // Low-Mid Tom
    thm:  48, // Hi-Mid Tom
    c1:   49, // Crash Cymbal 1
    th:   50, // High Tom
    r1:   51, // Ride Cymbal 1
    cc:   52, // Chinese Cymbal
    rb:   53, // Ride Bell
    tb:   54, // Tambourine
    sc:   55, // Splash Cymbal
    cw:   56, // Cowbell
    c2:   57, // Crash Cymbal 2
    vs:   58, // Vibraslap
    r2:   59, // Ride Cymbal 2
    bh:   60, // Hi Bongo
    bl:   61, // Low Bongo
    chm:  62, // Mute Hi Conga
    cho:  63, // Open Hi Conga
    cl:   64, // Low Conga
    tih:  65, // High Timbale
    til:  66, // Low Timbale
    agh:  67, // High Agogo
    agl:  68, // Low Agogo
    cab:  69, // Cabasa
    mar:  70, // Maracas
    ws:   71, // Short Whistle
    wl:   72, // Long Whistle
    gs:   73, // Short Guiro
    gl:   74, // Long Guiro
    cla:  75, // Claves
    wbh:  76, // Hi Wood Block
    wbl:  77, // Low Wood Block
    cum:  78, // Mute Cuica
    cuo:  79, // Open Cuica
    tm:   80, // Mute Triangle
    to:   81, // Open Triangle
    sh:   82, // Shaker
    jb:   83, // Jingle Bell
    bt:   84, // Bell Tree
    cast: 85, // Castanets
    sm:   86, // Mute Surdo
    so:   87  // Open Surdo
};

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

const instrumentMap = {
    apiano:    0,   // Acoustic Grand Piano
    bpiano:    1,   // Bright Acoustic Piano
    epiano:    2,   // Electric Grand Piano
    hpiano:    3,   // Honkytonk Piano
    epiano1:   4,   // Electric Piano 1
    epiano2:   5,   // Electric Piano 2
    harpsi:    6,   // Harpsichord
    clavinet:  7,   // Clavinet
    celesta:   8,   // Celesta
    glocken:   9,   // Glockenspiel
    mbox:      10,  // Music Box
    vibes:     11,  // Vibraphone
    marimba:   12,  // Marimba
    xylo:      13,  // Xylophone
    bells:     14,  // Tubular Bells
    dulcimer:  15,  // Dulcimer
    organ1:    16,  // Drawbar Organ
    organ2:    17,  // Percussive Organ
    organ3:    18,  // Rock Organ
    church:    19,  // Church Organ
    reed:      20,  // Reed Organ
    accord:    21,  // Accordion
    harmon:    22,  // Harmonica
    tango:     23,  // Tango Accordion
    aguitn:    24,  // Acoustic Guitar (Nylon)
    aguits:    25,  // Acoustic Guitar (Steel)
    eguitj:    26,  // Electric Guitar (Jazz)
    eguitc:    27,  // Electric Guitar (Clean)
    eguitm:    28,  // Electric Guitar (Muted)
    oguitar:   29,  // Overdriven Guitar
    dguitar:   30,  // Distortion Guitar
    gharm:     31,  // Guitar Harmonics
    abass:     32,  // Acoustic Bass
    ebassf:    33,  // Electric Bass (Finger)
    ebassp:    34,  // Electric Bass (Pick)
    fbass:     35,  // Fretless Bass
    slap1:     36,  // Slap Bass 1
    slap2:     37,  // Slap Bass 2
    sbass1:    38,  // Synth Bass 1
    sbass2:    39,  // Synth Bass 2
    violin:    40,  // Violin
    viola:     41,  // Viola
    cello:     42,  // Cello
    contra:    43,  // Contrabass
    tremolo:   44,  // Tremolo Strings
    pizz:      45,  // Pizzicato Strings
    harp:      46,  // Orchestral Harp
    timp:      47,  // Timpani
    strings1:  48,  // String Ensemble 1
    strings2:  49,  // String Ensemble 2
    sstrings1: 50,  // Synth Strings 1
    sstrings2: 51,  // Synth Strings 2
    choir:     52,  // Choir Aahs
    oohs:      53,  // Voice Oohs
    schoir:    54,  // Synth Choir
    ohit:      55,  // Orchestra Hit
    trumpet:   56,  // Trumpet
    tbone:     57,  // Trombone
    tuba:      58,  // Tuba
    mtrumpet:  59,  // Muted Trumpet
    fhorn:     60,  // French Horn
    brass:     61,  // Brass Section
    sbrass1:   62,  // Synth Brass 1
    sbrass2:   63,  // Synth Brass 2
    ssax:      64,  // Soprano Sax
    asax:      65,  // Alto Sax
    tsax:      66,  // Tenor Sax
    bsax:      67,  // Baritone Sax
    oboe:      68,  // Oboe
    ehorn:     69,  // English Horn
    bassoon:   70,  // Bassoon
    clarinet:  71,  // Clarinet
    piccolo:   72,  // Piccolo
    flute:     73,  // Flute
    recorder:  74,  // Recorder
    pan:       75,  // Pan Flute
    bottle:    76,  // Blown Bottle
    shaku:     77,  // Shakuhachi
    whistle:   78,  // Whistle
    ocarina:   79,  // Ocarina
    square:    80,  // Lead 1 (Square)
    saw:       81,  // Lead 2 (Sawtooth)
    calliope:  82,  // Lead 3 (Calliope)
    chiff:     83,  // Lead 4 (Chiff)
    charang:   84,  // Lead 5 (Charang)
    voice:     85,  // Lead 6 (Voice)
    fifths:    86,  // Lead 7 (Fifths)
    basslead:  87,  // Lead 8 (Bass + Lead)
    pad1:      88,  // Pad 1 (New Age)
    pad2:      89,  // Pad 2 (Warm)
    pad3:      90,  // Pad 3 (Polysynth)
    pad4:      91,  // Pad 4 (Choir)
    pad5:      92,  // Pad 5 (Bowed)
    pad6:      93,  // Pad 6 (Metallic)
    pad7:      94,  // Pad 7 (Halo)
    pad8:      95,  // Pad 8 (Sweep)
    rain:      96,  // FX 1 (Rain)
    sound:     97,  // FX 2 (Soundtrack)
    crystal:   98,  // FX 3 (Crystal)
    atmos:     99,  // FX 4 (Atmosphere)
    bright:    100, // FX 5 (Brightness)
    goblins:   101, // FX 6 (Goblins)
    echoes:    102, // FX 7 (Echoes)
    scifi:     103, // FX 8 (Sci-Fi)
    sitar:     104, // Sitar
    banjo:     105, // Banjo
    shamisen:  106, // Shamisen
    koto:      107, // Koto
    kalimba:   108, // Kalimba
    bagpipe:   109, // Bagpipe
    fiddle:    110, // Fiddle
    shanai:    111, // Shanai
    tbell:     112, // Tinkle Bell
    agogo:     113, // Agogo
    steel:     114, // Steel Drums
    wood:      115, // Woodblock
    taiko:     116, // Taiko Drum
    mtom:      117, // Melodic Tom
    sdrum:     118, // Synth Drum
    rcymbal:   119, // Reverse Cymbal
    gnoise:    120, // Guitar Fret Noise
    bnoise:    121, // Breath Noise
    sea:       122, // Seashore
    bird:      123, // Bird Tweet
    phone:     124, // Telephone Ring
    heli:      125, // Helicopter
    applause:  126, // Applause
    gun:       127, // Gunshot
    perc:      128  // Percussion
};

const instrumentNames = {
    0: "Acoustic Grand Piano",
    1: "Bright Acoustic Piano",
    2: "Electric Grand Piano",
    3: "Honkytonk Piano",
    4: "Electric Piano 1",
    5: "Electric Piano 2",
    6: "Harpsichord",
    7: "Clavinet",
    8: "Celesta",
    9: "Glockenspiel",
    10: "Music Box",
    11: "Vibraphone",
    12: "Marimba",
    13: "Xylophone",
    14: "Tubular Bells",
    15: "Dulcimer",
    16: "Drawbar Organ",
    17: "Percussive Organ",
    18: "Rock Organ",
    19: "Church Organ",
    20: "Reed Organ",
    21: "Accordion",
    22: "Harmonica",
    23: "Tango Accordion",
    24: "Acoustic Guitar (Nylon)",
    25: "Acoustic Guitar (Steel)",
    26: "Electric Guitar (Jazz)",
    27: "Electric Guitar (Clean)",
    28: "Electric Guitar (Muted)",
    29: "Overdriven Guitar",
    30: "Distortion Guitar",
    31: "Guitar Harmonics",
    32: "Acoustic Bass",
    33: "Electric Bass (Finger)",
    34: "Electric Bass (Pick)",
    35: "Fretless Bass",
    36: "Slap Bass 1",
    37: "Slap Bass 2",
    38: "Synth Bass 1",
    39: "Synth Bass 2",
    40: "Violin",
    41: "Viola",
    42: "Cello",
    43: "Contrabass",
    44: "Tremolo Strings",
    45: "Pizzicato Strings",
    46: "Orchestral Harp",
    47: "Timpani",
    48: "String Ensemble 1",
    49: "String Ensemble 2",
    50: "Synth Strings 1",
    51: "Synth Strings 2",
    52: "Choir Aahs",
    53: "Voice Oohs",
    54: "Synth Choir",
    55: "Orchestra Hit",
    56: "Trumpet",
    57: "Trombone",
    58: "Tuba",
    59: "Muted Trumpet",
    60: "French Horn",
    61: "Brass Section",
    62: "Synth Brass 1",
    63: "Synth Brass 2",
    64: "Soprano Sax",
    65: "Alto Sax",
    66: "Tenor Sax",
    67: "Baritone Sax",
    68: "Oboe",
    69: "English Horn",
    70: "Bassoon",
    71: "Clarinet",
    72: "Piccolo",
    73: "Flute",
    74: "Recorder",
    75: "Pan Flute",
    76: "Blown Bottle",
    77: "Shakuhachi",
    78: "Whistle",
    79: "Ocarina",
    80: "Lead 1 (Square)",
    81: "Lead 2 (Sawtooth)",
    82: "Lead 3 (Calliope)",
    83: "Lead 4 (Chiff)",
    84: "Lead 5 (Charang)",
    85: "Lead 6 (Voice)",
    86: "Lead 7 (Fifths)",
    87: "Lead 8 (Bass + Lead)",
    88: "Pad 1 (New Age)",
    89: "Pad 2 (Warm)",
    90: "Pad 3 (Polysynth)",
    91: "Pad 4 (Choir)",
    92: "Pad 5 (Bowed)",
    93: "Pad 6 (Metallic)",
    94: "Pad 7 (Halo)",
    95: "Pad 8 (Sweep)",
    96: "FX 1 (Rain)",
    97: "FX 2 (Soundtrack)",
    98: "FX 3 (Crystal)",
    99: "FX 4 (Atmosphere)",
    100: "FX 5 (Brightness)",
    101: "FX 6 (Goblins)",
    102: "FX 7 (Echoes)",
    103: "FX 8 (Sci-Fi)",
    104: "Sitar",
    105: "Banjo",
    106: "Shamisen",
    107: "Koto",
    108: "Kalimba",
    109: "Bagpipe",
    110: "Fiddle",
    111: "Shanai",
    112: "Tinkle Bell",
    113: "Agogo",
    114: "Steel Drums",
    115: "Woodblock",
    116: "Taiko Drum",
    117: "Melodic Tom",
    118: "Synth Drum",
    119: "Reverse Cymbal",
    120: "Guitar Fret Noise",
    121: "Breath Noise",
    122: "Seashore",
    123: "Bird Tweet",
    124: "Telephone Ring",
    125: "Helicopter",
    126: "Applause",
    127: "Gunshot",
    128: "Percussion"
};
