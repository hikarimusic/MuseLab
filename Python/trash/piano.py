import pygame
import fluidsynth
import importlib.util
import sys
import os
from mido import MidiFile

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
        self.song = None
        self.sections = []
        self.section_buttons = []

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

    def draw_piano(self, screen):
        white_key_width = 40
        black_key_width = 25
        white_key_height = 200
        black_key_height = 120

        for i, key in enumerate(self.white_key):
            x = i * white_key_width
            if key in self.pressed_keys:
                pygame.draw.rect(screen, (200, 200, 200), (x, 0, white_key_width, white_key_height))
            else:
                pygame.draw.rect(screen, (255, 255, 255), (x, 0, white_key_width, white_key_height))
            pygame.draw.rect(screen, (0, 0, 0), (x, 0, white_key_width, white_key_height), 1)
            if (self.keyboard_off+i)%7 == 0:
                pygame.draw.circle(screen, (255, 0, 0), (x + white_key_width // 2, white_key_height - 20), 5)

        for i, key in enumerate(self.black_key):
            x = (i + 1) * white_key_width - black_key_width // 2
            if self.black_note[(self.keyboard_off+i)%7] < 0:
                continue
            if key in self.pressed_keys:
                pygame.draw.rect(screen, (100, 100, 100), (x, 0, black_key_width, black_key_height))
            else:
                pygame.draw.rect(screen, (0, 0, 0), (x, 0, black_key_width, black_key_height))

    def draw_buttons(self, screen):
        button_width = 100
        button_height = 50
        start_y = 220  # Just below the piano

        for i, section in enumerate(self.sections):
            x = (i % 4) * (button_width + 10)  # 4 buttons per row
            y = start_y + (i // 4) * (button_height + 10)
            pygame.draw.rect(screen, (0, 0, 255), (x, y, button_width, button_height))
            font = pygame.font.Font(None, 36)
            text = font.render(section, True, (255, 255, 255))
            text_rect = text.get_rect(center=(x + button_width / 2, y + button_height / 2))
            screen.blit(text, text_rect)
            self.section_buttons.append((section, (x, y, button_width, button_height)))

    def play_section(self, section_name):
        if self.song:
            section = self.song.get(section_name, None)
            if section:
                section.render()
                self.play_midi(section.mid)

    def play_midi(self, midifile):
        fs = fluidsynth.Synth()
        fs.start(driver="alsa")
        sfid = fs.sfload("/usr/share/sounds/sf2/FluidR3_GM.sf2")
        fs.program_select(0, sfid, 0, 0)
        
        for msg in midifile.play():
            if msg.type == 'note_on':
                fs.noteon(0, msg.note, msg.velocity)
            elif msg.type == 'note_off':
                fs.noteoff(0, msg.note)
            elif msg.type == 'control_change':
                fs.cc(0, msg.control, msg.value)
            elif msg.type == 'program_change':
                fs.program_change(0, msg.program)
            elif msg.type == 'pitchwheel':
                fs.pitch_bend(0, msg.pitch)

    def load_song(self, song_path):
        spec = importlib.util.spec_from_file_location("song", song_path)
        song_module = importlib.util.module_from_spec(spec)
        sys.modules["song"] = song_module
        spec.loader.exec_module(song_module)
        self.song = song_module.song
        self.sections = list(self.song.keys())

    def play(self, driver="pulseaudio", soundfont="/usr/share/sounds/sf2/FluidR3_GM.sf2"):
        pygame.init()
        screen = pygame.display.set_mode((640, 480))
        pygame.display.set_caption("Virtual Piano with Sections")

        fs = fluidsynth.Synth()
        fs.start(driver)
        sfid = fs.sfload(soundfont)
        fs.program_select(0, sfid, 0, 5)

        self.keyboard_off = 0
        self.semitone_off = 0
        self.pressed_keys = set()
        self.update_keys()
        running = True

        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if self.instrument_input_mode:
                        if event.key == pygame.K_BACKQUOTE:
                            try:
                                instrument = int(self.instrument_number)
                                if instrument == 128:
                                    fs.program_select(0, sfid, 128, 0)
                                    self.keyboard_off = -14
                                    self.update_keys()
                                else:
                                    fs.program_select(0, sfid, 0, instrument)
                                    self.keyboard_off = 0
                                    self.update_keys()
                                self.instrument_input_mode = False
                                self.instrument_number = ''
                            except ValueError:
                                pass
                        elif event.key == pygame.K_BACKSPACE:
                            self.instrument_number = self.instrument_number[:-1]
                        else:
                            char = event.unicode
                            if char.isdigit():
                                self.instrument_number += char
                    else:
                        if event.key in self.key_to_note:
                            note = self.key_to_note[event.key] + self.semitone_off
                            fs.noteon(0, note, 100)  # Channel 0, Note, Velocity
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
                                fs.noteon(0, k+self.semitone_off, 100)
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
                        fs.noteoff(0, note)  # Channel 0, Note
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
                            fs.noteoff(0, k+self.semitone_off)
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    pos = pygame.mouse.get_pos()
                    for section, rect in self.section_buttons:
                        if rect[0] < pos[0] < rect[0] + rect[2] and rect[1] < pos[1] < rect[1] + rect[3]:
                            self.play_section(section)

            screen.fill((0, 0, 0))
            self.draw_piano(screen)
            self.draw_buttons(screen)
            if self.instrument_input_mode:
                font = pygame.font.Font(None, 36)
                text = font.render(f'Instrument: {self.instrument_number}', True, (255, 255, 255))
                screen.blit(text, (10, 10))
            pygame.display.flip()

        pygame.quit()
        fs.delete()

def piano():
    myPiano = Piano()
    song_path = input("Enter the path to your song file (e.g., song.py): ")
    if os.path.exists(song_path):
        myPiano.load_song(song_path)
    else:
        print("Song file not found.")
    myPiano.play()

if __name__ == "__main__":
    piano()
