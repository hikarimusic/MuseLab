// src/script.js

const noteMap = {
    c: 0, cs: 1, db: 1, d: 2, ds: 3, eb: 3, e: 4, f: 5,
    fs: 6, gb: 6, g: 7, gs: 8, ab: 8, a: 9, as: 10, bb: 10, b: 11
};

// Percussion/Drum note mappings (MIDI note numbers)
const percussionMap = {
    xb: 35,   // Acoustic Bass Drum
    xbe: 36,  // Electric Bass Drum
    xs: 38,   // Acoustic Snare
    xse: 40,  // Electric Snare
    xss: 37,  // Side Stick
    xhc: 42,  // Closed Hi-Hat
    xhp: 44,  // Pedal Hi-Hat
    xh: 46,   // Open Hi-Hat
    xc1: 49,  // Crash Cymbal 1
    xc2: 57,  // Crash Cymbal 2
    xr1: 51,  // Ride Cymbal 1
    xr2: 59,  // Ride Cymbal 2
    xt: 50,   // High Tom
    xtm: 48,  // High-Mid Tom
    xtl: 47,  // Low-Mid Tom
    xta: 43,  // High Floor Tom
    xtb: 41,  // Low Floor Tom
    xhh: 39,  // Hand Clap
    xcw: 56,  // Cowbell
    xtb2: 54, // Tambourine
};

const instrumentMap = {
    'acoustic_grand_piano': 0, 'bright_acoustic_piano': 1, 'electric_grand_piano': 2,
    'honkytonk_piano': 3, 'electric_piano_1': 4, 'electric_piano_2': 5,
    'harpsichord': 6, 'clavinet': 7, 'celesta': 8, 'glockenspiel': 9,
    'music_box': 10, 'vibraphone': 11, 'marimba': 12, 'xylophone': 13,
    'tubular_bells': 14, 'dulcimer': 15, 'drawbar_organ': 16, 'percussive_organ': 17,
    'rock_organ': 18, 'church_organ': 19, 'reed_organ': 20, 'accordion': 21,
    'harmonica': 22, 'tango_accordion': 23, 'acoustic_guitar_nylon': 24,
    'acoustic_guitar_steel': 25, 'electric_guitar_jazz': 26, 'electric_guitar_clean': 27,
    'electric_guitar_muted': 28, 'overdriven_guitar': 29, 'distortion_guitar': 30,
    'guitar_harmonics': 31, 'acoustic_bass': 32, 'electric_bass_finger': 33,
    'electric_bass_pick': 34, 'fretless_bass': 35, 'slap_bass_1': 36,
    'slap_bass_2': 37, 'synth_bass_1': 38, 'synth_bass_2': 39,
    'violin': 40, 'viola': 41, 'cello': 42, 'contrabass': 43,
    'tremolo_strings': 44, 'pizzicato_strings': 45, 'orchestral_harp': 46,
    'timpani': 47, 'string_ensemble_1': 48, 'string_ensemble_2': 49,
    'synth_strings_1': 50, 'synth_strings_2': 51, 'choir_aahs': 52,
    'voice_oohs': 53, 'synth_choir': 54, 'orchestra_hit': 55,
    'trumpet': 56, 'trombone': 57, 'tuba': 58, 'muted_trumpet': 59,
    'french_horn': 60, 'brass_section': 61, 'synth_brass_1': 62,
    'synth_brass_2': 63, 'soprano_sax': 64, 'alto_sax': 65,
    'tenor_sax': 66, 'baritone_sax': 67, 'oboe': 68, 'english_horn': 69,
    'bassoon': 70, 'clarinet': 71, 'piccolo': 72, 'flute': 73,
    'recorder': 74, 'pan_flute': 75, 'blown_bottle': 76, 'shakuhachi': 77,
    'whistle': 78, 'ocarina': 79, 'lead_1_square': 80, 'lead_2_sawtooth': 81,
    'lead_3_calliope': 82, 'lead_4_chiff': 83, 'lead_5_charang': 84,
    'lead_6_voice': 85, 'lead_7_fifths': 86, 'lead_8_bass_lead': 87,
    'pad_1_new_age': 88, 'pad_2_warm': 89, 'pad_3_polysynth': 90,
    'pad_4_choir': 91, 'pad_5_bowed': 92, 'pad_6_metallic': 93,
    'pad_7_halo': 94, 'pad_8_sweep': 95, 'fx_1_rain': 96,
    'fx_2_soundtrack': 97, 'fx_3_crystal': 98, 'fx_4_atmosphere': 99,
    'fx_5_brightness': 100, 'fx_6_goblins': 101, 'fx_7_echoes': 102,
    'fx_8_scifi': 103, 'sitar': 104, 'banjo': 105, 'shamisen': 106,
    'koto': 107, 'kalimba': 108, 'bagpipe': 109, 'fiddle': 110,
    'shanai': 111, 'tinkle_bell': 112, 'agogo': 113, 'steel_drums': 114,
    'woodblock': 115, 'taiko_drum': 116, 'melodic_tom': 117, 'synth_drum': 118,
    'reverse_cymbal': 119, 'guitar_fret_noise': 120, 'breath_noise': 121,
    'seashore': 122, 'bird_tweet': 123, 'telephone_ring': 124,
    'helicopter': 125, 'applause': 126, 'gunshot': 127, 'percussion': 0
};

let instruments = {};
let panners = {};
let isPlaying = false;
let scheduledNotes = [];
let audioContext = null;

function showError(msg) {
    const el = document.getElementById('error');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
}

function showStatus(msg) {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.style.display = 'block';
}

function hideStatus() {
    document.getElementById('status').style.display = 'none';
}

function parseNote(noteStr, keyOffset = 0, isPercussion = false) {
    if (!noteStr || noteStr === '.' || noteStr === '') return null;
    
    // Check if it's a percussion note
    const percLower = noteStr.toLowerCase();
    if (percussionMap[percLower] !== undefined) {
    return percussionMap[percLower];
    }
    
    const match = noteStr.toLowerCase().match(/^([a-g][sb]?)(\d+)$/);
    if (!match) return null;
    
    const [, note, octave] = match;
    const midiNote = (parseInt(octave) + 1) * 12 + noteMap[note];
    
    // Don't transpose percussion notes
    if (isPercussion) return midiNote;
    
    return midiNote - 60 + keyOffset; // Transpose relative to C4
}

function parseChord(chordStr, keyOffset = 0, isPercussion = false) {
    if (!chordStr || chordStr === '.' || chordStr === '') return null;
    const notes = chordStr.split('-');
    return notes.map(n => parseNote(n, keyOffset, isPercussion)).filter(n => n !== null);
}

function parseNotation(text) {
    const lines = text.split('\n').filter(l => l.trim());
    const sections = {};
    let currentSection = null;
    let currentTrack = null;
    let pendingRhythm = null;
    let pendingMelody = null;

    for (const line of lines) {
    if (line.match(/^[a-z0-9_]+:/i) && !line.includes('.')) {
        const [name, ...params] = line.split(/[\s:]+/).filter(p => p);
        const length = parseInt(params[0]) || 32;
        const keyStr = params[1] || 'c4';
        const tempo = parseInt(params[2]) || 120;
        
        // Parse key to get MIDI note value
        const keyMidi = parseNote(keyStr, 60); // Parse key, then add back C4
        
        sections[name] = {
        length, 
        key: keyMidi,
        tempo, 
        tracks: {}
        };
        currentSection = name;
        
        // Reset for new section
        currentTrack = null;
        pendingRhythm = null;
        pendingMelody = null;
    } else if (line.startsWith('- ') && line.includes(':') && !currentTrack) {
        const match = line.match(/- ([a-z0-9_]+):\s*([a-z0-9_]+)(?:\s+([\d.]+))?(?:\s+([\d.]+))?/i);
        if (match && currentSection) {
        const [, trackName, instrumentName, vol, pan] = match;
        const instrumentNum = instrumentMap[instrumentName.toLowerCase()] ?? 0;
        const isPercussion = instrumentName.toLowerCase() === 'percussion';
        sections[currentSection].tracks[trackName] = {
            instrument: instrumentNum,
            isPercussion: isPercussion,
            volume: vol !== undefined ? parseFloat(vol) : 0.8,
            pan: pan !== undefined ? parseFloat(pan) : 0.5,
            events: []
        };
        }
    } else if (line.match(/^[a-z0-9_]+\.[a-z0-9_]+:/i)) {
        const [trackPath, offsetStr] = line.split(':').map(s => s.trim());
        const [secName, trkName] = trackPath.split('.');
        currentSection = secName;
        currentTrack = trkName;
        
        if (sections[currentSection]?.tracks[currentTrack]) {
        sections[currentSection].tracks[currentTrack].startOffset = parseFloat(offsetStr) || 0;
        }
        
        pendingRhythm = null;
        pendingMelody = null;
    } else if (line.startsWith('- |') && currentSection && currentTrack) {
        const content = line.substring(3).split('|').map(s => s.trim()).filter(s => s);
        
        if (!pendingRhythm) {
        pendingRhythm = content;
        } else if (!pendingMelody) {
        pendingMelody = content;
        const track = sections[currentSection]?.tracks[currentTrack];
        const section = sections[currentSection];
        
        if (track && section) {
            const startOffset = track.startOffset || 0;
            const keyOffset = section.key;
            const isPercussion = track.isPercussion || false;
            let time = startOffset;
            let lastEvent = null;
            
            pendingRhythm.forEach((segment, segIdx) => {
            const rhythms = segment.split(/\s+/).filter(r => r);
            const melodies = pendingMelody[segIdx]?.split(/\s+/).filter(m => m) || [];
            
            rhythms.forEach((r, i) => {
                const duration = r === '.' ? 0 : parseFloat(r);
                const melody = melodies[i];
                
                if (melody === '-') {
                // Extend last note duration
                if (lastEvent) {
                    lastEvent.duration += duration;
                }
                } else if (melody && melody !== '.') {
                const notes = melody.includes('-') && !melody.toLowerCase().startsWith('x') ? 
                    parseChord(melody, keyOffset, isPercussion) : 
                    [parseNote(melody, keyOffset, isPercussion)];
                if (notes && notes[0] !== null) {
                    const event = {
                    time,
                    duration,
                    notes: notes.filter(n => n !== null),
                    lyric: null
                    };
                    track.events.push(event);
                    lastEvent = event;
                }
                }
                time += duration;
            });
            });
        }
        } else {
        const lyrics = content;
        const track = sections[currentSection]?.tracks[currentTrack];
        
        if (track && track.events.length > 0) {
            let eventIdx = 0;
            lyrics.forEach(segment => {
            const lyricsArr = segment.split(/\s+/).filter(l => l);
            lyricsArr.forEach(lyric => {
                if (eventIdx < track.events.length && lyric !== '.') {
                track.events[eventIdx].lyric = lyric;
                }
                eventIdx++;
            });
            });
        }
        
        pendingRhythm = null;
        pendingMelody = null;
        }
    }
    }
    return sections;
}

async function loadInstrument(programNumber, panValue = 0.5, isPercussion = false) {
    const key = `${isPercussion ? 'perc' : programNumber}_${panValue}`;
    if (instruments[key]) return { instrument: instruments[key], panner: panners[key] };
    
    if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    showStatus(`Loading ${isPercussion ? 'percussion' : 'instrument ' + programNumber}...`);
    
    // Create panner node
    const panner = audioContext.createStereoPanner();
    panner.pan.value = (panValue - 0.5) * 2; // Convert 0-1 to -1 to 1
    panner.connect(audioContext.destination);
    
    try {
    let instrument;
    if (isPercussion) {
        // Point to a real GM percussion bundle (host your own or use a known host)
        const percUrl = 'https://hikarimusic.github.io/MuseLab/Percussion/percussion-mp3.js';
        instrument = await Soundfont.instrument(audioContext, 'percussion', {
        nameToUrl: () => percUrl,  // must return the full .js bundle URL
        destination: panner
        });
    } else {
        const names = ['acoustic_grand_piano', 'bright_acoustic_piano', 'electric_grand_piano', 'honkytonk_piano', 
        'electric_piano_1', 'electric_piano_2', 'harpsichord', 'clavinet', 'celesta', 'glockenspiel', 
        'music_box', 'vibraphone', 'marimba', 'xylophone', 'tubular_bells', 'dulcimer', 'drawbar_organ', 
        'percussive_organ', 'rock_organ', 'church_organ', 'reed_organ', 'accordion', 'harmonica', 'tango_accordion',
        'acoustic_guitar_nylon', 'acoustic_guitar_steel', 'electric_guitar_jazz', 'electric_guitar_clean', 
        'electric_guitar_muted', 'overdriven_guitar', 'distortion_guitar', 'guitar_harmonics', 'acoustic_bass',
        'electric_bass_finger', 'electric_bass_pick', 'fretless_bass', 'slap_bass_1', 'slap_bass_2', 'synth_bass_1',
        'synth_bass_2', 'violin', 'viola', 'cello', 'contrabass', 'tremolo_strings', 'pizzicato_strings', 
        'orchestral_harp', 'timpani', 'string_ensemble_1', 'string_ensemble_2', 'synth_strings_1', 'synth_strings_2',
        'choir_aahs', 'voice_oohs', 'synth_choir', 'orchestra_hit', 'trumpet', 'trombone', 'tuba', 'muted_trumpet',
        'french_horn', 'brass_section', 'synth_brass_1', 'synth_brass_2', 'soprano_sax', 'alto_sax', 'tenor_sax',
        'baritone_sax', 'oboe', 'english_horn', 'bassoon', 'clarinet', 'piccolo', 'flute', 'recorder', 'pan_flute',
        'blown_bottle', 'shakuhachi', 'whistle', 'ocarina', 'lead_1_square', 'lead_2_sawtooth', 'lead_3_calliope',
        'lead_4_chiff', 'lead_5_charang', 'lead_6_voice', 'lead_7_fifths', 'lead_8_bass_lead', 'pad_1_new_age',
        'pad_2_warm', 'pad_3_polysynth', 'pad_4_choir', 'pad_5_bowed', 'pad_6_metallic', 'pad_7_halo', 'pad_8_sweep',
        'fx_1_rain', 'fx_2_soundtrack', 'fx_3_crystal', 'fx_4_atmosphere', 'fx_5_brightness', 'fx_6_goblins',
        'fx_7_echoes', 'fx_8_scifi', 'sitar', 'banjo', 'shamisen', 'koto', 'kalimba', 'bagpipe', 'fiddle', 'shanai',
        'tinkle_bell', 'agogo', 'steel_drums', 'woodblock', 'taiko_drum', 'melodic_tom', 'synth_drum', 'reverse_cymbal',
        'guitar_fret_noise', 'breath_noise', 'seashore', 'bird_tweet', 'telephone_ring', 'helicopter', 'applause', 'gunshot'];
        
        const instName = names[programNumber] || 'acoustic_grand_piano';
        const meloUrl = `https://hikarimusic.github.io/MuseLab/FluidR3_GM/${instName}-mp3.js`;
        instrument = await Soundfont.instrument(audioContext, instName, {
        nameToUrl: () => meloUrl,
        destination: panner
        });
    }
    
    instruments[key] = instrument;
    panners[key] = panner;
    return { instrument, panner };
    } catch (e) {
    console.warn(`Failed to load instrument, using piano`);
    const piano = await Soundfont.instrument(audioContext, 'acoustic_grand_piano', {
        destination: panner
    });
    instruments[key] = piano;
    panners[key] = panner;
    return { instrument: piano, panner };
    }
}

async function play() {
    const notation = document.getElementById('notation').value;
    const sections = parseNotation(notation);
    
    if (Object.keys(sections).length === 0) {
    showError('No valid sections found');
    return;
    }

    document.getElementById('playBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'flex';
    isPlaying = true;

    const firstSection = Object.values(sections)[0];
    const secondsPerBeat = 60 / firstSection.tempo;

    // Load all instruments with their pan values
    const instrumentsToLoad = new Map();
    Object.values(sections).forEach(section => {
    Object.values(section.tracks).forEach(track => {
        const key = `${track.isPercussion ? 'perc' : track.instrument}_${track.pan}`;
        instrumentsToLoad.set(key, { 
        instrument: track.instrument, 
        pan: track.pan,
        isPercussion: track.isPercussion || false
        });
    });
    });

    for (const [key, { instrument: inst, pan, isPercussion }] of instrumentsToLoad) {
    await loadInstrument(inst, pan, isPercussion);
    }

    hideStatus();

    // Find the earliest start time across all sections
    let minStartTime = 0;
    let sectionOffset = 0;
    
    Object.values(sections).forEach(section => {
    const secondsPerBeat = 60 / section.tempo;
    Object.values(section.tracks).forEach(track => {
        track.events.forEach(event => {
        const absoluteTime = sectionOffset + event.time * secondsPerBeat;
        minStartTime = Math.min(minStartTime, absoluteTime);
        });
    });
    sectionOffset += section.length * (60 / section.tempo);
    });

    // Shift all times so the earliest note starts at 0
    const timeShift = -minStartTime;
    let totalEndMs = 0;
    
    Object.entries(sections).forEach(([sectionName, section]) => {
    const secondsPerBeat = 60 / section.tempo;
    const sectionStartSec = totalEndMs / 1000;
    
    Object.entries(section.tracks).forEach(([trackName, track]) => {
        const key = `${track.isPercussion ? 'perc' : track.instrument}_${track.pan}`;
        const { instrument } = instruments[key] ? { instrument: instruments[key] } : {};
        
        if (!instrument) return;
        
        track.events.forEach(event => {
        const startTimeSec = sectionStartSec + event.time * secondsPerBeat + timeShift;
        const duration = event.duration * secondsPerBeat;
        
        const timeout = setTimeout(() => {
            if (isPlaying) {
            event.notes.forEach(note => {
                instrument.play(note, audioContext.currentTime, { duration, gain: track.volume });
            });
            }
        }, startTimeSec * 1000);
        
        scheduledNotes.push(timeout);
        });
    });
    
    totalEndMs += section.length * secondsPerBeat * 1000;
    });

    setTimeout(() => {
    if (isPlaying) stop();
    }, totalEndMs + timeShift * 1000);
}

function stop() {
    isPlaying = false;
    scheduledNotes.forEach(timeout => clearTimeout(timeout));
    scheduledNotes = [];
    
    document.getElementById('playBtn').style.display = 'flex';
    document.getElementById('stopBtn').style.display = 'none';
}

document.getElementById('playBtn').addEventListener('click', play);
document.getElementById('stopBtn').addEventListener('click', stop);