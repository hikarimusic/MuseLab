let instruments = {};
let panners = {};
let isPlaying = false;
let tempoMap = [];
let scheduledNotes = [];
let audioContext = null;
let audioNeedsReset = false;
let playbackStartBeat = 0;
let totalBeats = 0;
let playbackStartTime = 0;
let playbackAnimationId = null;
let currentTempo = 120;
let endTimeout = null;

// Utility

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

function saveDraft(text) {
    try {
        localStorage.setItem('muselab.notation', text);
    } catch {}
}

function loadDraft() {
    try {
        return localStorage.getItem('muselab.notation');
    } catch {
        return null;
    }
}

function closePanels() {
    document.getElementById('savePanel').classList.remove('open');
    document.getElementById('guidePanel').classList.remove('open');
    document.getElementById('examplePanel').classList.remove('open');
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
        return;
    }
    closePanels();
    panel.classList.add('open');
}

// Notation

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
            if (parseFloat(startStr) < 0 && secName === Object.keys(sections)[0]) {
                showError(`Negative start "${startStr}" not allowed in first section "${secName}"`);
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

// Play

function updateRuler() {
    const ruler = document.getElementById('timelineRuler');
    if (totalBeats === 0) {
        ruler.style.display = 'none';
        return;
    }
    ruler.style.display = '';
    const percentage = (playbackStartBeat / totalBeats) * 100;
    ruler.style.left = `${percentage}%`;
}

function renderTimeline() {
    const notation = document.getElementById('notation').value;
    const sections = parseNotation(notation);
    const timelineSections = document.getElementById('timelineSections');
    timelineSections.innerHTML = '';
    if (Object.keys(sections).length === 0) {
        timelineSections.innerHTML = '<div class="timeline-empty">No sections</div>';
        totalBeats = 0;
        updateRuler();
        return;
    }
    totalBeats = Object.values(sections).reduce((sum, section) => sum + section.length, 0);
    Object.entries(sections).forEach(([name, section]) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'timeline-section';
        sectionDiv.style.width = `${(section.length / totalBeats) * 100}%`;
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
    });
    updateRuler();
}

function handleTimelineClick(e) {
    const timeline = document.getElementById('timeline');
    const rect = timeline.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    playbackStartBeat = Math.max(0, Math.min(totalBeats, percentage * totalBeats));
    updateRuler();
}

function buildTempoMap(sections) {
    const map = [];
    let beat = 0;
    let sec = 0;
    Object.values(sections).forEach(section => {
        const secPerBeat = 60 / section.tempo;
        map.push({ startBeat: beat, startSec: sec, secPerBeat });
        beat += section.length;
        sec += section.length * secPerBeat;
    });
    return map;
}

function findSegment(value, field) {
    let seg = tempoMap[0];
    for (const s of tempoMap) {
        if (value >= s[field]) seg = s;
        else break;
    }
    return seg;
}

function beatToSec(beat) {
    const seg = findSegment(beat, 'startBeat');
    return seg.startSec + (beat - seg.startBeat) * seg.secPerBeat;
}

function secToBeat(sec) {
    const seg = findSegment(sec, 'startSec');
    return seg.startBeat + (sec - seg.startSec) / seg.secPerBeat;
}

function animateRuler() {
    if (!isPlaying || !audioContext) {
        return;
    }
    const elapsedTime = audioContext.currentTime - playbackStartTime;
    const currentSec = beatToSec(playbackStartBeat) + elapsedTime;
    const currentBeat = Math.min(secToBeat(currentSec), totalBeats);
    const ruler = document.getElementById('timelineRuler');
    const percentage = (currentBeat / totalBeats) * 100;
    ruler.style.left = `${percentage}%`;
    playbackAnimationId = requestAnimationFrame(animateRuler);
}

async function loadInstrument(programNumber, panValue = 0.5, isPerc = false, progress = '') {
    const key = `${isPerc ? 'perc' : programNumber}_${panValue}`;
    if (instruments[key]) return;
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    showStatus(`Loading ${instNames[programNumber]} ${progress}`);
    const panner = audioContext.createStereoPanner();
    panner.pan.value = panValue;
    panner.connect(audioContext.destination);
    let url;
    if (isPerc) {
        url = 'https://hikarimusic.github.io/MuseLab/Percussion/percussion-mp3.js';
    } 
    else {
        const instName = instNames[programNumber].toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/).join('_');
        url = `https://hikarimusic.github.io/MuseLab/FluidR3_GM/${instName}-mp3.js`;
    }
    try {
        instruments[key] = await Soundfont.instrument(audioContext, url, { destination: panner });
    } 
    catch (e) {
        console.warn(`Failed to load ${instNames[programNumber]}, using apiano`);
        instruments[key] = await Soundfont.instrument(audioContext, 'acoustic_grand_piano', { destination: panner });
    }
}

function prepareAudioContext() {
    if (audioContext && (audioNeedsReset || audioContext.state === 'closed')) {
        audioContext.close().catch(() => {});
        audioContext = null;
        instruments = {};
    }
    audioNeedsReset = false;
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext.resume().catch(() => {});
}

async function play() {
    const notation = document.getElementById('notation').value;
    const sections = parseNotation(notation);
    if (Object.keys(sections).length === 0) {
        showError('No sections found');
        return;
    }
    const resumed = prepareAudioContext();
    await Promise.race([resumed, new Promise(r => setTimeout(r, 1000))]);
    if (audioContext.state !== 'running') {
        audioNeedsReset = true;
        showError('Audio was interrupted. Tap Play again.');
        return;
    }
    document.getElementById('playBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'flex';
    isPlaying = true;
    const needed = new Map();
    for (const section of Object.values(sections)) {
        for (const track of Object.values(section.tracks)) {
            const key = `${track.isPerc ? 'perc' : track.inst}_${track.pan}`;
            if (!needed.has(key)) needed.set(key, track);
        }
    }
    let loaded = 0;
    for (const track of needed.values()) {
        loaded++;
        await loadInstrument(track.inst, track.pan, track.isPerc || false, `(${loaded}/${needed.size})`);
    }
    hideStatus();
    tempoMap = buildTempoMap(sections);
    const startSec = beatToSec(playbackStartBeat);
    let sectionBeatStart = 0;
    Object.values(sections).forEach(section => {
        Object.values(section.tracks).forEach(track => {
            const key = `${track.isPerc ? 'perc' : track.inst}_${track.pan}`;
            const instrument = instruments[key];
            if (!instrument) return;
            track.events.forEach(event => {
                const eventBeat = sectionBeatStart + event.time;
                if (eventBeat < playbackStartBeat) return;
                const eventSec = beatToSec(eventBeat);
                const delay = eventSec - startSec;
                const duration = beatToSec(eventBeat + event.duration) - eventSec;
                const timeout = setTimeout(() => {
                    if (isPlaying) {
                        event.pitches.forEach(pitch => {
                            instrument.play(pitch, audioContext.currentTime, { duration, gain: track.gain });
                        });
                    }
                }, delay * 1000);
                scheduledNotes.push(timeout);
            });
        });
        sectionBeatStart += section.length;
    });
    const endTime = beatToSec(sectionBeatStart) - startSec;
    endTimeout = setTimeout(() => {
        if (isPlaying) stop(true);
    }, endTime * 1000);
    playbackStartTime = audioContext.currentTime;
    animateRuler();
}

function stop(autoStop = false) {
    isPlaying = false;
    scheduledNotes.forEach(timeout => clearTimeout(timeout));
    scheduledNotes = [];
    if (endTimeout) {
        clearTimeout(endTimeout);
        endTimeout = null;
    }
    if (playbackAnimationId) {
        cancelAnimationFrame(playbackAnimationId);
        playbackAnimationId = null;
    }
    if (autoStop) {
        playbackStartBeat = 0;
    }
    updateRuler();
    document.getElementById('playBtn').style.display = 'flex';
    document.getElementById('stopBtn').style.display = 'none';
}

// Save

function writeLen(value, bytes) {
    const out = [];
    if (bytes < 0) {
        out.push(value & 0x7f);
        while ((value >>>= 7) > 0) out.unshift((value & 0x7f) | 0x80);
    }
    else {
        for (let i = bytes-1; i >= 0; i--) out.push((value >>> (8 * i)) & 0xff);
    }
    return out;
}

function encodeTrack(events) {
    events.sort((a, b) => a.tick - b.tick || a.order - b.order);
    const data = [];
    let lastTick = 0;
    events.forEach(e => {
        data.push(...writeLen(e.tick - lastTick, -1), ...e.bytes);
        lastTick = e.tick;
    });
    data.push(0x00, 0xff, 0x2f, 0x00);
    return [...new TextEncoder().encode('MTrk'), ...writeLen(data.length, 4), ...data];
}

function buildMidi(sections) {
    const PPQ = 480;
    const keySharps = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5];
    const enc = new TextEncoder();
    const offsets = {};
    let offset = 0;
    Object.entries(sections).forEach(([name, section]) => {
        offsets[name] = offset;
        offset += section.length;
    });
    const groupMap = new Map();
    Object.entries(sections).forEach(([secName, section]) => {
        Object.entries(section.tracks).forEach(([trkName, track]) => {
            if (!groupMap.has(trkName)) {
                groupMap.set(trkName, {name: trkName, inst: track.inst, isPerc: track.isPerc, isMain: false, parts: []});
            }
            const group = groupMap.get(trkName);
            group.parts.push({secName, track});
            if (track.events.some(e => e.lyric)) group.isMain = true;
        });
    });
    const groups = [...groupMap.values()].sort((a, b) => b.isMain - a.isMain || a.inst - b.inst);
    const data = [];
    data.push(...enc.encode('MThd'), ...writeLen(6, 4),
        ...writeLen(1, 2),
        ...writeLen(groups.length + 1, 2),
        ...writeLen(PPQ, 2));
    const conductor = [];
    Object.entries(sections).forEach(([name, section]) => {
        const tick = Math.round(offsets[name] * PPQ);
        conductor.push({tick, order: 0, bytes: [0xff, 0x51, 0x03, ...writeLen(Math.round(60000000 / section.tempo), 3)]});
        const text = enc.encode(name);
        conductor.push({tick, order: 2, bytes: [0xff, 0x06, ...writeLen(text.length, -1), ...text]});
    });
    data.push(...encodeTrack(conductor));
    let nextChannel = 0;
    groups.forEach(group => {
        let ch = 9;
        if (!group.isPerc) {
            ch = nextChannel;
            nextChannel = (nextChannel + 1) % 16;
            if (nextChannel === 9) nextChannel = 10;
        }
        const text = enc.encode(group.name);
        const events = [{tick: 0, order: 0, bytes: [0xff, 0x03, ...writeLen(text.length, -1), ...text]}];
        let lastSf, lastInst;
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        group.parts.forEach(({secName, track}) => {
            const tick = Math.round(offsets[secName] * PPQ);
            if (!track.isPerc) {
                const sf = keySharps[((sections[secName].key % 12) + 12) % 12];
                const inst = clamp(track.inst, 0, 127);
                if (sf !== lastSf) events.push({tick, order: 0, bytes: [0xff, 0x59, 0x02, sf & 0xff, 0x00]});
                if (inst !== lastInst) events.push({tick, order: 0, bytes: [0xc0 | ch, inst]});
                lastSf = sf;
                lastInst = inst;
            }
            events.push({tick, order: 0, bytes: [0xb0 | ch, 7, clamp(Math.round(track.gain * 100), 0, 127)]});
            events.push({tick, order: 0, bytes: [0xb0 | ch, 10, clamp(Math.round((track.pan + 1) * 63.5), 0, 127)]});
            track.events.forEach(e => {
                const on = Math.round((offsets[secName] + e.time) * PPQ);
                const off = Math.round((offsets[secName] + e.time + e.duration) * PPQ);
                e.pitches.forEach(p => {
                    const pitch = clamp(p, 0, 127);
                    events.push({tick: on, order: 3, bytes: [0x90 | ch, pitch, 100]});
                    events.push({tick: off, order: 1, bytes: [0x80 | ch, pitch, 0]});
                });
                if (e.lyric) {
                    const text = enc.encode(e.lyric);
                    events.push({tick: on, order: 2, bytes: [0xff, 0x05, ...writeLen(text.length, -1), ...text]});
                }
            });
        });
        data.push(...encodeTrack(events));
    });
    return new Uint8Array(data);
}





function encodeWav(buffer) {
    const ch = buffer.numberOfChannels, sr = buffer.sampleRate, n = buffer.length;
    const bytes = n * ch * 2;
    const view = new DataView(new ArrayBuffer(44 + bytes));
    const str = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); view.setUint32(4, 36 + bytes, true); str(8, 'WAVE');
    str(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, ch, true); view.setUint32(24, sr, true);
    view.setUint32(28, sr * ch * 2, true); view.setUint16(32, ch * 2, true); view.setUint16(34, 16, true);
    str(36, 'data'); view.setUint32(40, bytes, true);

    const chans = Array.from({ length: ch }, (_, i) => buffer.getChannelData(i));
    let peak = 0;
    for (const c of chans) for (let i = 0; i < n; i++) { const a = Math.abs(c[i]); if (a > peak) peak = a; }
    const scale = peak > 1 ? 1 / peak : 1;

    let o = 44;
    for (let i = 0; i < n; i++) {
        for (let c = 0; c < ch; c++) {
            const s = Math.max(-1, Math.min(1, chans[c][i] * scale));
            view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
            o += 2;
        }
    }
    return new Uint8Array(view.buffer);
}

// ---- Render the whole composition offline and return a WAV Blob ----
// Notes are scheduled in small chunks while rendering runs (via ctx.suspend),
// so the audio graph stays small and progress can be reported.
async function buildAudio(sections, { sampleRate = 44100, tail = 2, step = 1, onProgress = () => {} } = {}) {
    tempoMap = buildTempoMap(sections);
    const totalLen = Object.values(sections).reduce((s, sec) => s + sec.length, 0);
    const seconds = beatToSec(totalLen) + tail;          // tail lets the last notes ring out
    const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);

    // 1. Collect the tracks that will actually make sound, and the instruments they need
    const active = [];
    const needed = new Map();
    let sectionBeatStart = 0;
    for (const section of Object.values(sections)) {
        for (const track of Object.values(section.tracks)) {
            if (track.gain === 0 || !track.events.length) continue;   // muted / solo'd out
            const key = `${track.isPerc ? 'perc' : track.inst}_${track.pan}`;
            if (!needed.has(key)) needed.set(key, track);
            active.push({ track, key, offset: sectionBeatStart });
        }
        sectionBeatStart += section.length;
    }

    // 2. Load instruments (loading phase = first 30% of the progress bar)
    const players = {};
    let loaded = 0;
    for (const [key, track] of needed) {
        onProgress(0.3 * loaded / needed.size, `Loading ${instNames[track.inst]} (${loaded + 1}/${needed.size})`);
        const panner = ctx.createStereoPanner();
        panner.pan.value = track.pan;
        panner.connect(ctx.destination);
        let url;
        if (track.isPerc) {
            url = 'https://hikarimusic.github.io/MuseLab/Percussion/percussion-mp3.js';
        }
        else {
            const instName = instNames[track.inst].toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/).join('_');
            url = `https://hikarimusic.github.io/MuseLab/FluidR3_GM/${instName}-mp3.js`;
        }
        try {
            players[key] = await Soundfont.instrument(ctx, url, { destination: panner });
        } catch {
            players[key] = await Soundfont.instrument(ctx, 'acoustic_grand_piano', { destination: panner });
        }
        loaded++;
    }

    // 3. Build a time-sorted list of every note
    const jobs = [];
    for (const { track, key, offset } of active) {
        for (const event of track.events) {
            const beat = offset + event.time;
            const start = beatToSec(beat);
            const duration = beatToSec(beat + event.duration) - start;
            for (const pitch of event.pitches) {
                jobs.push({ player: players[key], pitch, start, duration, gain: track.gain });
            }
        }
    }
    jobs.sort((a, b) => a.start - b.start);

    let next = 0;
    const scheduleBefore = t => {
        while (next < jobs.length && jobs[next].start < t) {
            const j = jobs[next++];
            j.player.play(j.pitch, j.start, { duration: j.duration, gain: j.gain });
        }
    };

    // 4. Schedule the first chunk, then pause every `step` seconds to add the next one
    const margin = 0.1;                                   // schedule a little ahead of the playhead
    scheduleBefore(step + margin);
    for (let t = step; t < seconds; t += step) {
        ctx.suspend(t).then(() => {
            scheduleBefore(t + step + margin);
            onProgress(0.3 + 0.7 * t / seconds, `Rendering ${Math.round(100 * t / seconds)}%`);
            ctx.resume();
        });
    }

    onProgress(0.3, 'Rendering 0%');
    const buffer = await ctx.startRendering();
    onProgress(1, 'Encoding WAV...');
    await new Promise(r => setTimeout(r, 0));             // let the status repaint before encoding
    return encodeWav(buffer);
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

function getFileName() {
    const input = document.getElementById('fileName');
    let name = input.value.trim()
        .replace(/\.(mid|midi|wav|txt)$/i, '')      // drop an extension the user typed
        .replace(/[\\/:*?"<>|]/g, '_');              // characters not allowed in file names
    if (!name) name = 'composition';
    return name;
}

let isSaving = false;

async function save(format) {
    if (isSaving) return;
    const notation = document.getElementById('notation').value;
    if (!notation.trim()) {
        showError('Nothing to save');
        return;
    }
    hideError();
    const name = getFileName();
    try { localStorage.setItem('muselab.fileName', name); } catch {}
    const buttons = document.querySelectorAll('.save-option');
    isSaving = true;
    buttons.forEach(b => b.classList.add('busy'));
    try {
        let data, type, ext;
        if (format === 'text') {
            data = notation;
            type = 'text/plain';
            ext = 'txt';
        }
        else if (format === 'midi') {
            data = buildMidi(parseNotation(notation));
            type = 'audio/midi';
            ext = 'mid';
        }
        else if (format === 'wave') {
            data = await buildAudio(parseNotation(notation), {
                onProgress: (fraction, message) => showStatus(message)
            });
            type = 'audio/wav';
            ext = 'wav';
        }
        else {
            showError(`Unknown format "${format}"`);
            return;
        }
        downloadBlob(new Blob([data], { type }), `${name}.${ext}`);
        showStatus(`Saved ${name}.${ext}`);
        setTimeout(hideStatus, 2000);
        closePanels();
    }
    catch (e) {
        hideStatus();
        showError(`Could not save ${format}: ${e.message}`);
    }
    finally {
        isSaving = false;
        buttons.forEach(b => b.classList.remove('busy'));
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
        closePanels();
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
document.getElementById('saveBtn').addEventListener('click', () => {
    togglePanel('savePanel');
});

document.querySelectorAll('.save-option').forEach(btn => {
    btn.addEventListener('click', () => save(btn.dataset.format));
});

function updateSaveLabels() {
    const name = getFileName();
    document.querySelectorAll('.save-option').forEach(btn => {
        btn.querySelector('.example-desc').textContent = `${name}.${btn.dataset.ext}`;
    });
}

document.getElementById('fileName').addEventListener('input', (e) => {
    updateSaveLabels();
    try { localStorage.setItem('muselab.fileName', e.target.value); } catch {}
});

try {
    const savedName = localStorage.getItem('muselab.fileName');
    if (savedName) document.getElementById('fileName').value = savedName;
} catch {}
updateSaveLabels();

document.getElementById('guideBtn').addEventListener('click', () => {
    togglePanel('guidePanel');
});

document.getElementById('exampleBtn').addEventListener('click', () => {
    togglePanel('examplePanel');
});

document.getElementById('timeline').addEventListener('click', handleTimelineClick);

document.getElementById('notation').addEventListener('input', (e) => {
    saveDraft(e.target.value);
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
        togglePanel('savePanel');
        return;
    }

    if (e.key === 'Escape') {
        closePanels();
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

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (isPlaying) stop();
        if (audioContext && audioContext.state === 'running') {
            audioContext.suspend().catch(() => {});
        }
    }
});

document.querySelectorAll('#exampleList .example-item').forEach(item => {
    item.addEventListener('click', () => {
        const filepath = item.getAttribute('data-file');
        loadExample(filepath);
    });
});


document.getElementById('notation').value = loadDraft() ?? `a1: 10 90 d4
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