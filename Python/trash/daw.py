import pygame
from muselab.core import *
import fluidsynth

class TrackData:
    def __init__(self):
        self.notes = []  # Each note is a tuple (start_time, note, length)
    
    def add_note(self, start_time, note, length):
        self.notes.append((start_time, note, length))

    def get_notes(self):
        return self.notes

class DAW:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((1200, 800))
        pygame.display.set_caption("Muselab DAW")
        self.clock = pygame.time.Clock()
        self.running = True
        self.song = Song()
        self.song.add("Section 1", 32)
        self.piano = Piano()
        self.tracks = []
        self.selected_track = None
        self.note_length = 1.0  # Default note length
        self.current_time = 0
        self.playing = False
        self.add_track("Initial Track", Acoustic_Grand_Piano)

    def add_track(self, name, instrument):
        self.song["Section 1"].add(name, instrument)
        track_data = TrackData()
        self.tracks.append({"name": name, "instrument": instrument, "data": track_data})

    def run(self):
        while self.running:
            self.handle_events()
            self.update()
            self.draw()
            self.clock.tick(60)
        pygame.quit()

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:
                    self.handle_click(event.pos)
            elif event.type == pygame.KEYDOWN:
                self.handle_keydown(event)
            elif event.type == pygame.KEYUP:
                self.handle_keyup(event)

    def handle_click(self, pos):
        x, y = pos
        if y > 250:  # Clicks below the piano
            track_index = (y - 300) // 50
            if track_index < len(self.tracks):
                self.selected_track = track_index
                instrument = self.tracks[self.selected_track]['instrument']
                self.piano.set_instrument(instrument)
        else:
            if 1000 < x < 1100 and 10 < y < 40:
                self.current_time = 0
                self.playing = not self.playing  # Toggle playback

    def handle_keydown(self, event):
        if event.key in (pygame.K_1, pygame.K_2, pygame.K_3, pygame.K_4):
            self.note_length = {pygame.K_1: 0.25, pygame.K_2: 0.5, pygame.K_3: 1.0, pygame.K_4: 2.0}[event.key]
        elif self.selected_track is not None:
            self.piano.play_key(event)
            if event.key in self.piano.key_to_note:
                note = self.piano.key_to_note[event.key]
                self.tracks[self.selected_track]['data'].add_note(self.current_time, note, self.note_length)
                self.current_time += self.note_length

    def handle_keyup(self, event):
        if self.selected_track is not None:
            self.piano.play_key(event)

    def update(self):
        if self.playing:
            self.current_time += 1 / 60  # Increment current time based on frame rate
            self.play_notes()

    def play_notes(self):
        print("playing", self.current_time)
        for track in self.tracks:
            for note in track['data'].get_notes():
                start_time, note_value, length = note
                print("time", start_time, start_time + length)
                if start_time <= self.current_time < start_time + length:
                    self.piano.fs.noteon(0, note_value, 100)
                else:
                    self.piano.fs.noteoff(0, note_value)

    def draw(self):
        self.screen.fill((30, 30, 30))
        self.draw_piano()
        self.draw_tracks()
        self.draw_buttons()
        pygame.display.flip()

    def draw_buttons(self):
        font = pygame.font.Font(None, 36)
        pygame.draw.rect(self.screen, (70, 70, 70), (1000, 10, 100, 30))
        label = font.render("Play" if not self.playing else "Stop", True, (255, 255, 255))
        self.screen.blit(label, (1010, 10))

    def draw_tracks(self):
        font = pygame.font.Font(None, 36)
        for i, track in enumerate(self.tracks):
            y = 300 + i * 50
            color = (50, 50, 150) if i == self.selected_track else (70, 70, 70)
            pygame.draw.rect(self.screen, color, (50, y, 1100, 40))
            label = font.render(f"{track['name']} - {track['instrument']}", True, (255, 255, 255))
            self.screen.blit(label, (60, y + 5))
            self.draw_notes(track['data'], y)

    def draw_notes(self, track_data, y):
        for note in track_data.get_notes():
            start_time, note_value, length = note
            x = 50 + start_time * 20  # Scale time to x-coordinate
            width = length * 20  # Scale length to width
            pygame.draw.rect(self.screen, (255, 255, 0), (x, y, width, 40))

    def draw_piano(self):
        self.piano.draw_piano(self.screen, y_offset=50)

class Piano:
    def __init__(self):
        super().__init__()
        self.white_key = [pygame.K_a, pygame.K_s, pygame.K_d, pygame.K_f, pygame.K_g, pygame.K_h, pygame.K_j, pygame.K_k, pygame.K_l, pygame.K_SEMICOLON, pygame.K_QUOTE, pygame.K_RETURN]
        self.black_key = [pygame.K_w, pygame.K_e, pygame.K_r ,pygame.K_t, pygame.K_y, pygame.K_u, pygame.K_i, pygame.K_o, pygame.K_p, pygame.K_LEFTBRACKET, pygame.K_RIGHTBRACKET]
        self.chord_key = [pygame.K_1, pygame.K_2, pygame.K_3, pygame.K_4, pygame.K_5, pygame.K_6, pygame.K_7, pygame.K_8]
        self.white_note = [0, 2, 4, 5, 7, 9, 11]
        self.black_note = [1, 3, -1, 6, 8, 10, -1]
        self.instrument_input_mode = False
        self.instrument_number = ''
        self.fs = fluidsynth.Synth()
        self.fs.start(driver="pulseaudio")
        self.sfid = self.fs.sfload("/usr/share/sounds/sf2/FluidR3_GM.sf2")
        self.fs.program_select(0, self.sfid, 0, 0)
        self.keyboard_off = 0
        self.semitone_off = 0
        self.pressed_keys = set()
        self.update_keys()

    def set_instrument(self, instrument):
        self.fs.program_select(0, self.sfid, 0, instrument)

    def update_keys(self):
        self.key_to_note = {}
        for i, key in enumerate(self.white_key):
            key_off = self.keyboard_off + i
            self.key_to_note[key] = 60 + 12*(key_off//7) + self.white_note[key_off%7]
        for i, key in enumerate(self.black_key):
            key_off = self.keyboard_off + i
            if self.black_note[key_off%7] > 0:
                self.key_to_note[key] = 60 + 12*(key_off//7) + self.black_note[key_off%7]
        
        self.key_to_chord = {}
        for i, key in enumerate(self.chord_key):
            self.key_to_chord[key] = []
            for j in [0,2,4,7]:
                key_off = i + j
                self.key_to_chord[key].append(48 + 12*(key_off//7) + self.white_note[key_off%7])

    def draw_piano(self, screen, y_offset=0):
        white_key_width = 40
        black_key_width = 25
        white_key_height = 200
        black_key_height = 120

        for i, key in enumerate(self.white_key):
            x = i * white_key_width
            if key in self.pressed_keys:
                pygame.draw.rect(screen, (200, 200, 200), (x, y_offset, white_key_width, white_key_height))
            else:
                pygame.draw.rect(screen, (255, 255, 255), (x, y_offset, white_key_width, white_key_height))
            pygame.draw.rect(screen, (0, 0, 0), (x, y_offset, white_key_width, white_key_height), 1)
            if (self.keyboard_off+i)%7 == 0:
                pygame.draw.circle(screen, (255, 0, 0), (x + white_key_width // 2, y_offset + white_key_height - 20), 5)

        for i, key in enumerate(self.black_key):
            x = (i + 1) * white_key_width - black_key_width // 2
            if self.black_note[(self.keyboard_off+i)%7] < 0:
                continue
            if key in self.pressed_keys:
                pygame.draw.rect(screen, (100, 100, 100), (x, y_offset, black_key_width, black_key_height))
            else:
                pygame.draw.rect(screen, (0, 0, 0), (x, y_offset, black_key_width, black_key_height))

    def play_key(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key in self.key_to_note:
                note = self.key_to_note[event.key] + self.semitone_off
                self.fs.noteon(0, note, 100)  # Channel 0, Note, Velocity
                self.pressed_keys.add(event.key)
            elif event.key in self.key_to_chord:
                chord = [x for x in self.key_to_chord[event.key]]
                if pygame.key.get_mods() & pygame.KMOD_SHIFT:
                    if chord[2] - chord[0] == 6:
                        chord[2] += 1
                    elif chord[1] - chord[0] == 3:
                        chord[1] += 1
                    else:
                        chord[1] -= 1
                for k in chord:
                    self.fs.noteon(0, k+self.semitone_off, 100)
            elif event.key == pygame.K_MINUS:
                if pygame.key.get_mods() & pygame.KMOD_SHIFT:
                    self.semitone_off -= 12
                else:
                    self.semitone_off -= 1
            elif event.key == pygame.K_EQUALS:
                if pygame.key.get_mods() & pygame.KMOD_SHIFT:
                    self.semitone_off += 12
                else:
                    self.semitone_off += 1
            elif event.key == pygame.K_TAB:
                if pygame.key.get_mods() & pygame.KMOD_SHIFT:
                    self.keyboard_off -= 1
                else:
                    self.keyboard_off += 1
                self.update_keys()
            elif event.key == pygame.K_BACKQUOTE:
                self.instrument_input_mode = True
        elif event.type == pygame.KEYUP:
            if event.key in self.key_to_note:
                note = self.key_to_note[event.key] + self.semitone_off
                self.fs.noteoff(0, note)  # Channel 0, Note
                self.pressed_keys.discard(event.key)
            elif event.key in self.key_to_chord:
                chord = [x for x in self.key_to_chord[event.key]]
                if pygame.key.get_mods() & pygame.KMOD_SHIFT:
                    if chord[2] - chord[0] == 6:
                        chord[2] += 1
                    elif chord[1] - chord[0] == 3:
                        chord[1] += 1
                    else:
                        chord[1] -= 1
                for k in chord:
                    self.fs.noteoff(0, k+self.semitone_off)

if __name__ == "__main__":
    daw = DAW()
    daw.run()
