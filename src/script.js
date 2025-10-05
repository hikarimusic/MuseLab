let instruments = {};
let panners = {};
let isPlaying = false;
let scheduledNotes = [];
let audioContext = null;

function showError(msg) {
    const el = document.getElementById('error');
    el.textContent = msg;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 5000);
}

function showStatus(msg) {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.classList.add('visible');
}

function hideStatus() {
    document.getElementById('status').classList.remove('visible');
}

function parseNote(noteStr, keyOffset = 0, isPercussion = false) {
    if (!noteStr || noteStr === '.' || noteStr === '') return null;
    
    const percLower = noteStr.toLowerCase();
    if (percussionMap[percLower] !== undefined) {
        return percussionMap[percLower];
    }
    
    const match = noteStr.toLowerCase().match(/^([a-g][sb]?)(\d+)$/);
    if (!match) return null;
    
    const [, note, octave] = match;
    const midiNote = (parseInt(octave) + 1) * 12 + noteMap[note];
    
    if (isPercussion) return midiNote;
    
    return midiNote - 60 + keyOffset;
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
            
            const keyMidi = parseNote(keyStr, 60);
            
            sections[name] = {
                length, 
                key: keyMidi,
                tempo, 
                tracks: {}
            };
            currentSection = name;
            currentTrack = null;
            pendingRhythm = null;
            pendingMelody = null;
        } else if (line.startsWith('- ') && line.includes(':') && !currentTrack) {
            const match = line.match(/- ([a-z0-9_]+):\s*([a-z0-9_]+)(?:\s+([\d.]+))?(?:\s+([\d.]+))?/i);
            if (match && currentSection) {
                const [, trackName, instrumentName, vol, pan] = match;
                const instrumentNum = instrumentMap[instrumentName.toLowerCase()] ?? parseInt(instrumentName) ?? 0;
                const isPercussion = instrumentName.toLowerCase() === 'perc' || instrumentNum === 128;
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
    
    const panner = audioContext.createStereoPanner();
    panner.pan.value = (panValue - 0.5) * 2;
    panner.connect(audioContext.destination);
    
    try {
        let instrument;
        if (isPercussion) {
            const percUrl = 'https://hikarimusic.github.io/MuseLab/Percussion/percussion-mp3.js';
            instrument = await Soundfont.instrument(audioContext, 'percussion', {
                nameToUrl: () => percUrl,
                destination: panner
            });
        } else {
            const instName = instrumentCodeNames[programNumber] || 'acoustic_grand_piano';
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

// NEW: Save function
function saveFile() {
    const notation = document.getElementById('notation').value;
    
    if (!notation.trim()) {
        showError('Nothing to save');
        return;
    }
    
    const blob = new Blob([notation], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'composition.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('File saved!');
    setTimeout(hideStatus, 2000);
}

// Panel management
function closeAllPanels() {
    document.getElementById('guidePanel').classList.remove('open');
    document.getElementById('examplePanel').classList.remove('open');
}

// NEW: Helper function for toggling panels
function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    const otherPanelId = panelId === 'guidePanel' ? 'examplePanel' : 'guidePanel';
    const otherPanel = document.getElementById(otherPanelId);
    
    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
    } else {
        otherPanel.classList.remove('open');
        panel.classList.add('open');
    }
}

// Load example from file
async function loadExample(filepath) {
    try {
        const response = await fetch(filepath);
        if (!response.ok) {
            throw new Error('Example file not found');
        }
        const content = await response.text();
        document.getElementById('notation').value = content;
        closeAllPanels();
    } catch (error) {
        showError(`Could not load example: ${error.message}`);
    }
}

// Event listeners
document.getElementById('playBtn').addEventListener('click', play);
document.getElementById('stopBtn').addEventListener('click', stop);
document.getElementById('saveBtn').addEventListener('click', saveFile); // NEW

document.getElementById('guideBtn').addEventListener('click', () => {
    togglePanel('guidePanel'); // MODIFIED
});

document.getElementById('exampleBtn').addEventListener('click', () => {
    togglePanel('examplePanel'); // MODIFIED
});

// NEW: Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    
    // Ctrl/Cmd + S: Save
    if (modifier && e.key === 's') {
        e.preventDefault();
        saveFile();
        return;
    }
    
    // Ctrl/Cmd + E: Toggle Examples
    if (modifier && e.key === 'e') {
        e.preventDefault();
        togglePanel('examplePanel');
        return;
    }
    
    // Ctrl/Cmd + H: Toggle Guide
    if (modifier && e.key === 'h') {
        e.preventDefault();
        togglePanel('guidePanel');
        return;
    }
    
    // Ctrl/Cmd + Enter: Play/Stop
    if (modifier && e.key === 'Enter') {
        e.preventDefault();
        if (isPlaying) {
            stop();
        } else {
            play();
        }
        return;
    }
});

// Add click handlers to example items
document.querySelectorAll('.example-item').forEach(item => {
    item.addEventListener('click', () => {
        const filepath = item.getAttribute('data-file');
        loadExample(filepath);
    });
});

// Populate instrument list in guide
function populateGuide() {
    // Create reverse map for instrument shortcuts
    const midiToInstrumentShortcut = {};
    Object.entries(instrumentShortcuts).forEach(([shortcut, midi]) => {
        if (!midiToInstrumentShortcut[midi]) {
            midiToInstrumentShortcut[midi] = [];
        }
        midiToInstrumentShortcut[midi].push(shortcut);
    });
    
    // Populate instruments
    const instrumentListEl = document.getElementById('instrumentList');
    instrumentList.forEach((name, index) => {
        const shortcuts = midiToInstrumentShortcut[index];
        const p = document.createElement('p');
        if (shortcuts && shortcuts.length > 0) {
            const shortcutStr = shortcuts.map(s => `<code>${s}</code>`).join(', ');
            p.innerHTML = `${name}: ${shortcutStr} <span class="midi-num">(${index})</span>`;
        } else {
            p.innerHTML = `${name}: <span class="midi-num">(${index})</span>`;
        }
        instrumentListEl.appendChild(p);
    });
    
    // Populate notes (C0 to B8)
    const noteListEl = document.getElementById('noteList');
    const noteNames = ['c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs', 'a', 'as', 'b'];
    for (let octave = 0; octave <= 8; octave++) {
        noteNames.forEach((noteName, index) => {
            const midiNum = (octave + 1) * 12 + index;
            if (midiNum <= 127) {
                const p = document.createElement('p');
                p.innerHTML = `${noteName}${octave}: <code>${noteName}${octave}</code> <span class="midi-num">(${midiNum})</span>`;
                noteListEl.appendChild(p);
            }
        });
    }
    
    // Populate percussion with shortcuts
    const percussionListEl = document.getElementById('percussionList');
    
    // Create reverse map to find shortcuts for each MIDI number
    const midiToShortcut = {};
    Object.entries(percussionMap).forEach(([shortcut, midi]) => {
        if (!midiToShortcut[midi]) {
            midiToShortcut[midi] = [];
        }
        midiToShortcut[midi].push(shortcut);
    });
    
    // Display percussion with shortcuts
    Object.entries(percussionNames).forEach(([midiNum, name]) => {
        const shortcuts = midiToShortcut[midiNum];
        const p = document.createElement('p');
        if (shortcuts && shortcuts.length > 0) {
            const shortcutStr = shortcuts.map(s => `<code>${s}</code>`).join(', ');
            p.innerHTML = `${name}: ${shortcutStr} <span class="midi-num">(${midiNum})</span>`;
        } else {
            p.innerHTML = `${name}: <span class="midi-num">(${midiNum})</span>`;
        }
        percussionListEl.appendChild(p);
    });
}

// Initialize guide when page loads
populateGuide();