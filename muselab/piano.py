import pygame
import fluidsynth

class Piano:
    def __init__(self):
        super().__init__()
        self.white_key = [pygame.K_a, pygame.K_s, pygame.K_d, pygame.K_f, pygame.K_g, pygame.K_h, pygame.K_j, pygame.K_k, pygame.K_l, pygame.K_SEMICOLON, pygame.K_QUOTE, pygame.K_RETURN]
        self.black_key = [pygame.K_w, pygame.K_e, pygame.K_r ,pygame.K_t, pygame.K_y, pygame.K_u, pygame.K_i, pygame.K_o, pygame.K_p, pygame.K_LEFTBRACKET, pygame.K_RIGHTBRACKET]
        self.chord_key = [pygame.K_1, pygame.K_2, pygame.K_3, pygame.K_4, pygame.K_5, pygame.K_6, pygame.K_7, pygame.K_8]
        self.white_note = [0, 2, 4, 5, 7, 9, 11]
        self.black_note = [1, 3, -1, 6, 8, 10, -1]

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

    def play(self, driver="pulseaudio", soundfont="/usr/share/sounds/sf2/FluidR3_GM.sf2"):
        pygame.init()
        screen = pygame.display.set_mode((480, 200))
        pygame.display.set_caption("Virtual Piano")

        fs = fluidsynth.Synth()
        fs.start(driver)
        sfid = fs.sfload(soundfont)
        fs.program_select(0, sfid, 0, 0)

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

            screen.fill((0, 0, 0))
            self.draw_piano(screen)
            pygame.display.flip()

        pygame.quit()
        fs.delete()

def piano():
    myPiano = Piano()
    myPiano.play()

if __name__ == "__main__":
    piano()
