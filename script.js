let instruments = {};
let panners = {};
let isPlaying = false;
let scheduledNotes = [];
let audioContext = null;
let playbackStartBeat = 0;
let totalBeats = 0;
let playbackStartTime = 0;
let playbackAnimationId = null;
let currentTempo = 120;
let endTimeout = null;

function showError(msg) {
    const el = document.getElementById('error');
    el.textContent = msg;
    el.classList.add('visible');
}

function hideError() {
    document.getElementById('error').classList.remove('visible');
}

function showStatus(msg) {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.classList.add('visible');
}

function hideStatus() {
    document.getElementById('status').classList.remove('visible');
}

function parsePitch(pitchStr, key, isPerc) {
    if (isPerc) {
        if (!(pitchStr.toLowerCase() in percMap)) return null;
        return percMap[pitchStr.toLowerCase()];
    }
    const match = pitchStr.toLowerCase().match(/^([a-g][sb]?)(\d*)$/);
    if (!match) return null;
    const [, pitch, octave] = match;
    const midiPitch = (parseInt(octave || '4') + 1) * 12 + pitchMap[pitch];
    return midiPitch - 60 + key;
}

function buildEvents(track, start, slots, key) {
    let time = start;
    let lastEvent = null;
    let lastPitches = null;
    let lastOctave = '4';
    const overlaps = e => e.time + e.duration > start;
    while (track.events.length && overlaps(track.events.at(-1))) {
        track.events.pop();
    }
    slots.forEach(slot => {
        if (!/^\d*\.?\d+$/.test(slot.duration)) {
            showError(`Invalid duration "${slot.duration}" at beat ${time}`);
            return;
        }
        const duration = parseFloat(slot.duration);
        let pitches = slot.pitches;
        if (pitches === '-') {
            if (lastEvent) lastEvent.duration += duration;
            pitches = null;
        }
        else if (pitches === '=') {
            pitches = lastPitches;
        }
        else if (pitches === '.') {
            pitches = null;
        }
        else {
            let prev = null;
            pitches = pitches.split('-').map((n, i) => {
                if (track.isPerc) return parsePitch(n, key, true);
                const octave = n.match(/\d+$/)?.[0];
                if (i === 0) {
                    if (octave) lastOctave = octave;
                    else n += lastOctave;
                }
                else if (!octave && prev !== null) {
                    let p = parsePitch(n + '0', key);
                    if (p !== null)  {
                        while (p <= prev) p += 12;
                    }
                    return prev = p;
                }
                return prev = parsePitch(n, key);
            });
            if (pitches.includes(null)) {
                showError(`Invalid pitch "${slot.pitches}" at beat ${time}`);
                pitches = null;
            }
        }
        const lyric = slot.lyric === '.' ? null : slot.lyric;
        if (duration > 0 && pitches?.length) {
            const event = {time, duration, pitches, lyric};
            track.events.push(event);
            lastEvent = event;
            lastPitches = pitches;
        }
        time += duration;
    });
}

function parseNotation(text) {
    const lines = text.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));
    const sections = {};
    let currentSection = null, currentTrack = null, currentStart = null, currentSlots = null;
    let lastLength = '32', lastTempo = '120', lastKey = 'c4';
    for (const line of lines) {
        if (!line.startsWith('-') && !line.includes('.')) {
            const [name, lengthStr, tempoStr, keyStr] = line.split(/[\s:]+/).filter(p => p);
            if (lengthStr !== undefined && !/^[1-9]\d*$/.test(lengthStr)) {
                showError(`Invalid length "${lengthStr}" in section "${name}"`);
                break;
            }
            if (tempoStr !== undefined && !/^[1-9]\d*$/.test(tempoStr)) {
                showError(`Invalid tempo "${tempoStr}" in section "${name}"`);
                break;
            }
            if (keyStr !== undefined && !/^[a-g][sb]?\d*$/i.test(keyStr)) {
                showError(`Invalid key "${keyStr}" in section "${name}"`);
                break;
            }
            const length = parseFloat(lastLength = lengthStr ?? lastLength);
            const tempo = parseFloat(lastTempo = tempoStr ?? lastTempo);
            const key = parsePitch(lastKey = keyStr ?? lastKey, 60);
            sections[name] = {length, tempo, key, tracks: {}};
            currentSection = name;
            currentTrack = null;
        } 
        else if (line.startsWith('-') && !currentTrack) {
            const [name, instStr, gainStr, panStr] = line.substring(1).split(/[\s:]+/).filter(p => p);
            if (!sections[currentSection]) {
                showError(`No section for track "${name}"`);
                break;
            }
            if (instStr !== undefined && !(instStr.toLowerCase() in instMap)) {
                showError(`Invalid instrument "${instStr}" for track "${name}"`);
                break;
            }
            if (gainStr !== undefined && !/^\d*\.?\d+s?$/.test(gainStr)) {
                showError(`Invalid gain "${gainStr}" for track "${name}"`);
                break;
            }
            if (panStr !== undefined && !/^-?\d*\.?\d+$/.test(panStr)) {
                showError(`Invalid pan "${panStr}" for track "${name}"`);
                break;
            }
            const inst = instMap[(instStr ?? 'apiano').toLowerCase()];
            const isPerc = inst === 128;
            const gain = parseFloat(gainStr ?? 1);
            const pan  = parseFloat(panStr ?? 0);
            const solo = /s$/i.test(gainStr ?? '');
            sections[currentSection].tracks[name] = {inst, isPerc, gain, pan, solo, events: []};
        } 
        else if (!line.startsWith('-')) {
            const [trackPath, startStr] = line.split(/[\s:]+/).filter(t => t);
            const [secName, trkName] = trackPath.split('.');
            if (!sections[secName]?.tracks[trkName]) {
                showError(`Track "${secName}.${trkName}" not found`);
                break;
            }
            if (startStr !== undefined && !/^-?\d*\.?\d+$/.test(startStr)) {
                showError(`Invalid start "${startStr}" for track "${secName}.${trkName}"`);
                break;
            }
            currentSection = secName;
            currentTrack = trkName;
            currentStart = parseFloat(startStr ?? 0);
            currentSlots = [];
        } 
        else {
            const tokens = line.substring(1).split(/[\s|]+/).filter(t => t);
            if (tokens.length === 0) continue;
            const section = sections[currentSection];
            const track = section.tracks[currentTrack];
            const first = tokens.find(t => t !== '.' && t !== '-' && t != '=') ?? tokens[0];
            let field;
            if (/^\d*\.?\d+$/.test(first)) {
                field = 'duration';
            } 
            else if (/^[a-g][sb]?\d$/i.test(first.split('-')[0]) || track.isPerc) {
                field = 'pitches';
            } 
            else {
                field = 'lyric';
            }
            if (currentSlots.length === 0) {
                const duration = '1';
                const pitches = track.isPerc ? 'b' : 'c4';
                const lyric = null;
                currentSlots = tokens.map(() => ({ duration, pitches, lyric}));
            }
            tokens.slice(0, currentSlots.length).forEach((t, i) => {
                currentSlots[i][field] = t;
            });
            buildEvents(track, currentStart, currentSlots, section.key);
        }
    }
    for (const sec of Object.values(sections)) {
        const tracks = Object.values(sec.tracks);
        if (tracks.some(t => t.solo)) {
            tracks.forEach(t => { if (!t.solo) t.gain = 0; });
        }
    }
    return sections;
}

function renderTimeline() {
    const notation = document.getElementById('notation').value;
    const sections = parseNotation(notation);
    const timelineSections = document.getElementById('timelineSections');
    
    timelineSections.innerHTML = '';
    
    if (Object.keys(sections).length === 0) {
        timelineSections.innerHTML = '<div class="timeline-empty">No sections</div>';
        totalBeats = 0;
        return;
    }
    
    totalBeats = Object.values(sections).reduce((sum, section) => sum + section.length, 0);
    
    let beatOffset = 0;
    Object.entries(sections).forEach(([name, section]) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'timeline-section';
        sectionDiv.style.width = `${(section.length / totalBeats) * 100}%`;
        sectionDiv.dataset.sectionName = name;
        sectionDiv.dataset.startBeat = beatOffset;
        sectionDiv.dataset.endBeat = beatOffset + section.length;
        
        const bg = document.createElement('div');
        bg.className = 'timeline-section-bg';
        sectionDiv.appendChild(bg);
        
        const label = document.createElement('div');
        label.className = 'timeline-section-label';
        label.textContent = name;
        sectionDiv.appendChild(label);
        
        const beats = document.createElement('div');
        beats.className = 'timeline-section-beats';
        beats.textContent = section.length;
        sectionDiv.appendChild(beats);
        
        timelineSections.appendChild(sectionDiv);
        beatOffset += section.length;
    });
    
    updateRulerPosition();
}

function updateRulerPosition() {
    const ruler = document.getElementById('timelineRuler');
    if (totalBeats === 0) {
        ruler.style.left = '0px';
        return;
    }
    
    const percentage = (playbackStartBeat / totalBeats) * 100;
    ruler.style.left = `${percentage}%`;
}

function animateRuler() {
    if (!isPlaying || !audioContext) {
        return;
    }
    
    const elapsedTime = audioContext.currentTime - playbackStartTime;
    const elapsedBeats = (elapsedTime / 60) * currentTempo;
    const currentBeat = Math.min(playbackStartBeat + elapsedBeats, totalBeats);
    
    const ruler = document.getElementById('timelineRuler');
    const percentage = (currentBeat / totalBeats) * 100;
    ruler.style.left = `${percentage}%`;
    
    playbackAnimationId = requestAnimationFrame(animateRuler);
}

function handleTimelineClick(e) {
    const timeline = document.getElementById('timeline');
    const rect = timeline.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    playbackStartBeat = Math.max(0, Math.min(totalBeats, percentage * totalBeats));
    updateRulerPosition();
}

async function loadInstrument(programNumber, panValue = 0.5, isPerc = false) {
    const key = `${isPerc ? 'perc' : programNumber}_${panValue}`;
    if (instruments[key]) return { instrument: instruments[key], panner: panners[key] };
    
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    showStatus(`Loading ${instNames[programNumber]}...`);
    
    const panner = audioContext.createStereoPanner();
    panner.pan.value = panValue;
    panner.connect(audioContext.destination);
    
    try {
        let instrument;
        if (isPerc) {
            const percUrl = 'https://hikarimusic.github.io/MuseLab/Percussion/percussion-mp3.js';
            instrument = await Soundfont.instrument(audioContext, 'percussion', {
                nameToUrl: () => percUrl,
                destination: panner
            });
        } else {
            const instName = instNames[programNumber]
                .toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/).join('_');
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
    currentTempo = firstSection.tempo;

    const instrumentsToLoad = new Map();
    Object.values(sections).forEach(section => {
        Object.values(section.tracks).forEach(track => {
            const key = `${track.isPerc ? 'perc' : track.inst}_${track.pan}`;
            instrumentsToLoad.set(key, { 
                inst: track.inst, 
                pan: track.pan,
                isPerc: track.isPerc || false
            });
        });
    });

    for (const [key, { inst, pan, isPerc }] of instrumentsToLoad) {
        await loadInstrument(inst, pan, isPerc);
    }

    hideStatus();

    // Start playback animation
    playbackStartTime = audioContext.currentTime;
    animateRuler();

    // Calculate beat offset for each section
    const sectionBeatOffsets = {};
    let beatOffset = 0;
    Object.entries(sections).forEach(([name, section]) => {
        sectionBeatOffsets[name] = beatOffset;
        beatOffset += section.length;
    });

    let minStartTime = 0;
    
    // Calculate minimum start time considering all tracks
    Object.entries(sections).forEach(([sectionName, section]) => {
        const secondsPerBeat = 60 / section.tempo;
        const sectionBeatStart = sectionBeatOffsets[sectionName];
        
        Object.values(section.tracks).forEach(track => {
            track.events.forEach(event => {
                const eventBeat = sectionBeatStart + event.time;
                const absoluteTime = eventBeat * secondsPerBeat;
                minStartTime = Math.min(minStartTime, absoluteTime);
            });
        });
    });

    const timeShift = -minStartTime;
    
    // Convert playbackStartBeat to time offset
    const startBeatOffset = playbackStartBeat;
    let totalEndBeat = 0;
    
    Object.entries(sections).forEach(([sectionName, section]) => {
        const secondsPerBeat = 60 / section.tempo;
        const sectionBeatStart = sectionBeatOffsets[sectionName];
        
        Object.entries(section.tracks).forEach(([trackName, track]) => {
            const key = `${track.isPerc ? 'perc' : track.inst}_${track.pan}`;
            const { instrument } = instruments[key] ? { instrument: instruments[key] } : {};
            
            if (!instrument) return;
            
            track.events.forEach(event => {
                const eventBeat = sectionBeatStart + event.time;
                
                if (eventBeat >= startBeatOffset) {
                    const startTimeSec = (eventBeat - startBeatOffset) * secondsPerBeat + timeShift;
                    const duration = event.duration * secondsPerBeat;
                    
                    const timeout = setTimeout(() => {
                        if (isPlaying) {
                            event.pitches.forEach(pitch => {
                                instrument.play(pitch, audioContext.currentTime, { duration, gain: track.gain });
                            });
                        }
                    }, startTimeSec * 1000);
                    
                    scheduledNotes.push(timeout);
                }
            });
        });
        
        totalEndBeat = sectionBeatStart + section.length;
    });

    // Calculate end time based on total duration minus start offset
    const endTime = (totalEndBeat - startBeatOffset) * (60 / firstSection.tempo) + timeShift;
    
    endTimeout = setTimeout(() => {
        if (isPlaying) stop(true); // true = auto-stop at end
    }, endTime * 1000);
}

function stop(autoStop = false) {
    isPlaying = false;
    scheduledNotes.forEach(timeout => clearTimeout(timeout));
    scheduledNotes = [];
    
    // Clear the end timeout
    if (endTimeout) {
        clearTimeout(endTimeout);
        endTimeout = null;
    }
    
    // Stop ruler animation
    if (playbackAnimationId) {
        cancelAnimationFrame(playbackAnimationId);
        playbackAnimationId = null;
    }
    
    // If auto-stopped at end, reset ruler to start; otherwise keep current position
    if (autoStop) {
        playbackStartBeat = 0;
    }
    updateRulerPosition();
    
    document.getElementById('playBtn').style.display = 'flex';
    document.getElementById('stopBtn').style.display = 'none';
}

// ---------- MIDI export ----------

function writeVarLen(value, out) {
    const bytes = [value & 0x7f];
    while ((value >>>= 7) > 0) {
        bytes.unshift((value & 0x7f) | 0x80);
    }
    out.push(...bytes);
}

function metaEvent(type, dataBytes) {
    const out = [0xff, type];
    writeVarLen(dataBytes.length, out);
    out.push(...dataBytes);
    return out;
}

function encodeTrack(events, endTick) {
    // order: 0 = setup, 1 = note off, 2 = meta/lyric, 3 = note on
    events.sort((a, b) => a.tick - b.tick || a.order - b.order);
    const data = [];
    let lastTick = 0;
    events.forEach(e => {
        writeVarLen(e.tick - lastTick, data);
        data.push(...e.bytes);
        lastTick = e.tick;
    });
    writeVarLen(Math.max(0, endTick - lastTick), data);
    data.push(0xff, 0x2f, 0x00); // end of track
    const len = data.length;
    return [0x4d, 0x54, 0x72, 0x6b, // "MTrk"
        (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff,
        ...data];
}

function buildMidi(sections) {
    const PPQ = 480;
    const enc = new TextEncoder();
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    // Beat offset of each section
    const offsets = {};
    let offset = 0;
    Object.entries(sections).forEach(([name, section]) => {
        offsets[name] = offset;
        offset += section.length;
    });
    const songEndBeat = offset;

    // Events may start before beat 0 (pickups), so shift everything forward
    let minBeat = 0;
    Object.entries(sections).forEach(([name, section]) => {
        Object.values(section.tracks).forEach(track => {
            track.events.forEach(e => {
                minBeat = Math.min(minBeat, offsets[name] + e.time);
            });
        });
    });
    const shift = -minBeat;
    const toTick = beat => Math.max(0, Math.round((beat + shift) * PPQ));

    let endTick = toTick(songEndBeat);
    Object.entries(sections).forEach(([name, section]) => {
        Object.values(section.tracks).forEach(track => {
            track.events.forEach(e => {
                endTick = Math.max(endTick, toTick(offsets[name] + e.time + e.duration));
            });
        });
    });

    // Conductor track: tempo changes and section markers
    const conductor = [];
    conductor.push({tick: 0, order: 0, bytes: metaEvent(0x03, [...enc.encode('Conductor')])});
    Object.entries(sections).forEach(([name, section]) => {
        const tick = toTick(offsets[name]);
        const mpq = Math.round(60000000 / (section.tempo || 120));
        conductor.push({tick, order: 0, bytes: [0xff, 0x51, 0x03, (mpq >> 16) & 0xff, (mpq >> 8) & 0xff, mpq & 0xff]});
        conductor.push({tick, order: 2, bytes: metaEvent(0x06, [...enc.encode(name)])});
    });

    // Group tracks with the same name across sections into one MIDI track
    const groups = new Map();
    Object.entries(sections).forEach(([sectionName, section]) => {
        Object.entries(section.tracks).forEach(([trackName, track]) => {
            const key = track.isPerc ? `${trackName}#perc` : trackName;
            if (!groups.has(key)) groups.set(key, {name: trackName, isPerc: track.isPerc, parts: []});
            groups.get(key).parts.push({sectionName, track});
        });
    });

    // Assign channels: percussion on channel 10 (index 9), others skip it
    let nextChannel = 0;
    const midiTracks = [encodeTrack(conductor, endTick)];
    groups.forEach(group => {
        let channel;
        if (group.isPerc) {
            channel = 9;
        } else {
            channel = nextChannel;
            nextChannel = (nextChannel + 1) % 16;
            if (nextChannel === 9) nextChannel = 10;
        }

        const events = [{tick: 0, order: 0, bytes: metaEvent(0x03, [...enc.encode(group.name)])}];
        group.parts.forEach(({sectionName, track}) => {
            const sectionTick = toTick(offsets[sectionName]);
            if (!track.isPerc) {
                events.push({tick: sectionTick, order: 0, bytes: [0xc0 | channel, clamp(track.inst | 0, 0, 127)]});
            }
            events.push({tick: sectionTick, order: 0, bytes: [0xb0 | channel, 10, clamp(Math.round((track.pan + 1) * 63.5), 0, 127)]});

            const velocity = clamp(Math.round((isNaN(track.gain) ? 1 : track.gain) * 100), 1, 127);
            track.events.forEach(e => {
                const beat = offsets[sectionName] + e.time;
                const on = toTick(beat);
                const off = Math.max(on + 1, toTick(beat + e.duration));
                if (e.lyric) {
                    events.push({tick: on, order: 2, bytes: metaEvent(0x05, [...enc.encode(e.lyric)])});
                }
                e.pitches.forEach(n => {
                    const pitch = clamp(n, 0, 127);
                    events.push({tick: on, order: 3, bytes: [0x90 | channel, pitch, velocity]});
                    events.push({tick: off, order: 1, bytes: [0x80 | channel, pitch, 0]});
                });
            });
        });
        midiTracks.push(encodeTrack(events, endTick));
    });

    const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, // "MThd", length 6
        0, 1,                                                // format 1
        (midiTracks.length >> 8) & 0xff, midiTracks.length & 0xff,
        (PPQ >> 8) & 0xff, PPQ & 0xff];
    return new Uint8Array([...header, ...midiTracks.flat()]);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function saveFile() {
    const notation = document.getElementById('notation').value;

    if (!notation.trim()) {
        showError('Nothing to save');
        return;
    }

    downloadBlob(new Blob([notation], { type: 'text/plain' }), 'composition.txt');

    const sections = parseNotation(notation);
    if (Object.keys(sections).length === 0) {
        showError('No valid sections found, MIDI not saved');
        return;
    }
    try {
        const midi = buildMidi(sections);
        downloadBlob(new Blob([midi], { type: 'audio/midi' }), 'composition.mid');
    } catch (e) {
        showError(`Could not create MIDI: ${e.message}`);
        return;
    }

    showStatus('Files saved!');
    setTimeout(hideStatus, 2000);
}

function closeAllPanels() {
    document.getElementById('guidePanel').classList.remove('open');
    document.getElementById('examplePanel').classList.remove('open');
}

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

async function loadExample(filepath) {
    try {
        const response = await fetch(filepath);
        if (!response.ok) {
            throw new Error('Example file not found');
        }
        const content = await response.text();
        document.getElementById('notation').value = content;
        renderTimeline();
        closeAllPanels();
    } catch (error) {
        showError(`Could not load example: ${error.message}`);
    }
}

function populateGuide() {
    const midiToInstrumentShortcut = {};
    Object.entries(instMap).forEach(([shortcut, midi]) => {
        if (!midiToInstrumentShortcut[midi]) {
            midiToInstrumentShortcut[midi] = [];
        }
        midiToInstrumentShortcut[midi].push(shortcut);
    });
    
    const instrumentListEl = document.getElementById('instrumentList');
    Object.entries(instNames).forEach(([index, name]) => {
        index = Number(index);
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
    
    const pitchListEl = document.getElementById('pitchList');
    const pitchSequence = [
        { names: ['c'], display: 'C', offset: 0 },
        { names: ['cs', 'db'], display: ['C#', 'Db'], offset: 1 },
        { names: ['d'], display: 'D', offset: 2 },
        { names: ['ds', 'eb'], display: ['D#', 'Eb'], offset: 3 },
        { names: ['e'], display: 'E', offset: 4 },
        { names: ['f'], display: 'F', offset: 5 },
        { names: ['fs', 'gb'], display: ['F#', 'Gb'], offset: 6 },
        { names: ['g'], display: 'G', offset: 7 },
        { names: ['gs', 'ab'], display: ['G#', 'Ab'], offset: 8 },
        { names: ['a'], display: 'A', offset: 9 },
        { names: ['as', 'bb'], display: ['A#', 'Bb'], offset: 10 },
        { names: ['b'], display: 'B', offset: 11 }
    ];
    
    for (let octave = 0; octave <= 8; octave++) {
        pitchSequence.forEach(pitchInfo => {
            const midiNum = (octave + 1) * 12 + pitchInfo.offset;
            if (midiNum <= 127) {
                if (Array.isArray(pitchInfo.display)) {
                    // Show both sharp and flat on separate lines
                    pitchInfo.names.forEach((pitchName, idx) => {
                        const p = document.createElement('p');
                        p.innerHTML = `${pitchInfo.display[idx]}${octave}: <code>${pitchName}${octave}</code> <span class="midi-num">(${midiNum})</span>`;
                        pitchListEl.appendChild(p);
                    });
                } else {
                    // Single pitch name
                    const p = document.createElement('p');
                    p.innerHTML = `${pitchInfo.display}${octave}: <code>${pitchInfo.names[0]}${octave}</code> <span class="midi-num">(${midiNum})</span>`;
                    pitchListEl.appendChild(p);
                }
            }
        });
    }
    
    const percussionListEl = document.getElementById('percussionList');
    const midiToShortcut = {};
    Object.entries(percMap).forEach(([shortcut, midi]) => {
        if (!midiToShortcut[midi]) {
            midiToShortcut[midi] = [];
        }
        midiToShortcut[midi].push(shortcut);
    });
    
    Object.entries(percNames).forEach(([midiNum, name]) => {
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

// Event listeners
document.getElementById('playBtn').addEventListener('click', play);
document.getElementById('stopBtn').addEventListener('click', () => stop());
document.getElementById('saveBtn').addEventListener('click', saveFile);

document.getElementById('guideBtn').addEventListener('click', () => {
    togglePanel('guidePanel');
});

document.getElementById('exampleBtn').addEventListener('click', () => {
    togglePanel('examplePanel');
});

document.getElementById('timeline').addEventListener('click', handleTimelineClick);

document.getElementById('notation').addEventListener('input', () => {
    hideError();
    clearTimeout(window.timelineUpdateTimeout);
    window.timelineUpdateTimeout = setTimeout(() => {
        renderTimeline();
    }, 500);
});

document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    
    if (modifier && e.key === 's') {
        e.preventDefault();
        saveFile();
        return;
    }
    
    if (modifier && e.key === 'e') {
        e.preventDefault();
        togglePanel('examplePanel');
        return;
    }
    
    if (modifier && e.key === 'g') {
        e.preventDefault();
        togglePanel('guidePanel');
        return;
    }
    
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

document.querySelectorAll('.example-item').forEach(item => {
    item.addEventListener('click', () => {
        const filepath = item.getAttribute('data-file');
        loadExample(filepath);
    });
});

// Initialize
document.getElementById('notation').value = `a1: 10 90 d4
- main: flute 1 0
- chord: strings1 .5 0
- drum: perc .5 0

a1.main: 0
- | .25 .25 .25 .25 | .5 .5 .25 .5 .75 .5 .25 .25 .25 .25 | .5 .5 .25 .5 .75 1.5 |
- |  f5   e   d   c |  g  g   g  a   g  .   f   e   d   c |  d  d   d  e   e   . |
a1.chord: 1
- |        2        2 |        2        2 |
- | a2-a-c-e f2-f-a-c | g2-g-b-d c3-g-c-e |
a1.drum: 1
- | 1 1 .5 .5 1 | 1 1 .5 .5 1 |
- | b s  b  b s | b s  b  b s |`;
populateGuide();
renderTimeline();