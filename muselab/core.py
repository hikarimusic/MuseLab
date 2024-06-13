from mido import MidiFile, MidiTrack, Message, MetaMessage
from copy import deepcopy
import os

from muselab.symbol import *

class BaseMidi(dict):
    def __init__(self):
        super().__init__()

    def save(self, name):
        self.render()
        self.mid.save(name)

    def play(self):
        self.save('temp.mid')
        os.system("fluidsynth -a pulseaudio /usr/share/sounds/sf2/FluidR3_GM.sf2 temp.mid")
        # import pygame
        # freq = 44100
        # bitsize = -16
        # channels = 2
        # buffer = 1024
        # pygame.mixer.init(freq, bitsize, channels, buffer)
        # pygame.mixer.music.set_volume(0.1)
        # clock = pygame.time.Clock()
        # pygame.mixer.music.load('temp.mid')
        # pygame.mixer.music.play()
        # while pygame.mixer.music.get_busy():
        #     clock.tick(30)
    
    def view(self, terminal=False):
        self.save('temp.mid')
        if terminal == True:
            print(self.mid)
        os.system("musescore3 temp.mid")


class Track(BaseMidi):
    def __init__(self, info, instrument):
        super().__init__()
        self.info = deepcopy(info)
        self.info["instrument"] = instrument
        self.info["channel"] = 0
        if instrument == Percussion:
            self.info["instrument"] = 1
            self.info["channel"] = 9
            self.info["key"] = C4

    def write(self, start=0, rythm=[], melody=[], lyrics=[]):
        if not melody:
            raise ValueError("There must be three arguments: start, rythm, and melody.")
        if len(rythm) != len(melody):
            raise ValueError("The lengths of rythm and melody must be equal.")
        if lyrics:
            if len(rythm) != len(lyrics):
                raise ValueError("The lengths of rythm and lyrics must be equal.")
        else:
            lyrics = [None for i in range(len(rythm))]
        head = start
        keep = None
        for beat, note, word in zip(rythm, melody, lyrics):
            if note == '/':
                note = keep
            else:
                keep = note
            if not head in self:
                self[head] = []
            if not head+beat in self:
                self[head+beat] = []
            if isinstance(note, int):
                self[head].append(('note_on', note))
                self[head+beat].append(('note_off', note))
            elif isinstance(note, (tuple, list)):
                for nt in note:
                    self[head].append(('note_on', nt))
                for nt in note:
                    self[head+beat].append(('note_off', nt))
            if isinstance(word, str):
                self[head].append(('lyrics', word))
            head += beat
    
    def set(self, time, volume=None, pan=None):
        if not time in self:
            self[time] = []
        if volume:
            self[time].append(('volume_change', volume))
        if pan:
            self[time].append(('pan_change', pan))
        
    def render(self):
        order = list(self.keys())
        order = [od for od in order if od>=0 and od<=self.info["length"]]
        order.sort()
        self.mid = MidiFile()
        
        self.head(reset=True)
        track = MidiTrack()
        track.append(MetaMessage('time_signature', numerator=self.info["signature"][0], denominator=self.info["signature"][1], time=self.head(0)))
        track.append(MetaMessage('set_tempo', tempo=round(6e7/self.info["tempo"]), time=self.head(0)))
        track.append(MetaMessage('end_of_track', time=self.head(self.info["length"])))
        self.mid.tracks.append(track)

        self.head(reset=True)
        track = MidiTrack()
        track.append(MetaMessage('key_signature', key=to_key(self.info["key"]), time=self.head(0)))
        track.append(Message('program_change', channel=self.info["channel"], program=self.info["instrument"]-1, time=self.head(0)))
        for od in order:
            for event in self[od]:
                (msg, data) = event
                if msg == 'note_on':
                    data = data - C4 + self.info["key"]
                    track.append(Message('note_on', channel=self.info["channel"], note=data, velocity=80, time=self.head(od)))
                elif msg == 'note_off':
                    data = data - C4 + self.info["key"]
                    track.append(Message('note_off', channel=self.info["channel"], note=data, velocity=80, time=self.head(od)))
                elif msg == 'lyrics':
                    data = data.encode("utf-8").decode("latin1")
                    track.append(MetaMessage('lyrics', text=data, time=self.head(od))) 
                elif msg == 'volume_change':
                    data = int(128 * data - 0.1)
                    track.append(Message('control_change', channel=self.info["channel"], control=7, value=data, time=0))
                elif msg == 'pan_change':
                    data = int(64 * data + 64 - 0.1)
                    track.append(Message('control_change', channel=self.info["channel"], control=10, value=data, time=0))
        track.append(MetaMessage('end_of_track', time=self.head(self.info["length"])))
        self.mid.tracks.append(track)

    def head(self, od=None, reset=False):
        if reset == True:
            self.prev = 0
            return
        inter = round((od - self.prev) * 480)
        self.prev = od
        return inter


class Section(BaseMidi):
    def __init__(self, info):
        super().__init__()
        self.info = deepcopy(info)
    
    def add(self, name, instrument=Acoustic_Grand_Piano):
        self[name] = Track(self.info, instrument)
    
    def render(self):
        self.mid = MidiFile()

        track = MidiTrack()
        track.append(MetaMessage('time_signature', numerator=self.info["signature"][0], denominator=self.info["signature"][1], time=0))
        track.append(MetaMessage('set_tempo', tempo=round(6e7/self.info["tempo"]), time=0))
        track.append(MetaMessage('end_of_track', time=self.info["length"]*480))
        self.mid.tracks.append(track)

        i = 0
        for trk_name, track in self.items():
            track.render()
            trk_1 = track.mid.tracks[1]
            trk_0 = MidiTrack()
            self.mid.tracks.append(trk_0)
            if track.info["channel"] == 9:
                channel = 9
            else:
                channel = i % 16
                i += 1
                if i%16 == 9: i += 1
            for msg in trk_1:
                if msg.type in ('program_change', 'control_change', 'note_on', 'note_off'):
                    trk_0.append(msg.copy(channel=channel))
                else:
                    trk_0.append(msg.copy())


class Song(BaseMidi):
    def __init__(self):
        super().__init__()
        self.info = {
            "length": 32,
            "key": C4,
            "signature": (4,4),
            "tempo": 120
        }

    def add(self, name, length, key=None, signature=None, tempo=None):
        if length: self.info["length"] = length
        if key: self.info["key"] = key 
        if signature: self.info["signature"] = signature
        if tempo: self.info["tempo"] = tempo
        self[name] = Section(self.info)
    
    def render(self):
        self.mid = MidiFile()
        track = MidiTrack()
        track.append(MetaMessage('end_of_track', time=0))
        self.mid.tracks.append(track)

        trk_lst = ['']
        head = 0
        for sec_name, section in self.items():
            for track in self.mid.tracks:
                track[-1] = MetaMessage('marker', text=sec_name, time=track[-1].time)
            
            trk = self.mid.tracks[0]
            #trk[-1] = MetaMessage('marker', text=sec_name, time=trk[-1].time)
            trk.append(MetaMessage('time_signature', numerator=section.info["signature"][0], denominator=section.info["signature"][1], time=0))
            trk.append(MetaMessage('set_tempo', tempo=round(6e7/self.info["tempo"]), time=0))
            trk.append(MetaMessage('end_of_track', time=section.info["length"]*480))

            for trk_name, track in section.items():
                track.render()
                trk_1 = track.mid.tracks[1]
                if not trk_name in trk_lst:
                    if len(trk_lst) == 9:
                        trk_lst.append('')
                    trk_lst.append(trk_name)
                    trk_0 = MidiTrack()
                    self.mid.tracks.append(trk_0)
                    trk_0.append(trk_1[0].copy(time=0))
                    trk_0.append(MetaMessage('marker', text=sec_name, time=head))
                else:
                    trk_0 = self.mid.tracks[trk_lst.index(trk_name)]
                    #trk_0[-1] = MetaMessage('marker', text=sec_name, time=trk_0[-1].time)
                trk_idx = trk_lst.index(trk_name)
                if track.info["channel"] == 9:
                    channel = 9
                else:
                    channel = trk_idx % 16
                for msg in trk_1:
                    if msg.type in ('program_change', 'control_change', 'note_on', 'note_off'):
                        trk_0.append(msg.copy(channel=channel))
                    else:
                        trk_0.append(msg.copy())
            
            for track in self.mid.tracks:
                if track[-1].type == 'marker':
                    track[-1] = MetaMessage('end_of_track', time=track[-1].time+section.info["length"] * 480)

            head += section.info["length"] * 480