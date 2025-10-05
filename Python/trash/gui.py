import pygame
import fluidsynth
from mido import MidiFile

class MidiViewer:
    def __init__(self, midi_file):
        pygame.init()
        self.screen = pygame.display.set_mode((1200, 800))
        pygame.display.set_caption("MIDI Viewer")
        self.clock = pygame.time.Clock()

        self.midi_file = MidiFile(midi_file)
        self.fs = fluidsynth.Synth()
        self.fs.start(driver="pulseaudio")
        self.sfid = self.fs.sfload("/usr/share/sounds/sf2/FluidR3_GM.sf2")
        self.fs.program_select(0, self.sfid, 0, 0)

        self.tracks = []
        self.tempo = 500000  # Default tempo (microseconds per beat)
        self.ticks_per_beat = self.midi_file.ticks_per_beat
        self.load_midi()

        self.running = True
        self.playing = False

        self.scroll_x = 0
        self.scroll_speed = 20

    def load_midi(self):
        for i, track in enumerate(self.midi_file.tracks):
            events = []
            absolute_time = 0
            for msg in track:
                absolute_time += msg.time
                if msg.type == 'set_tempo':
                    self.tempo = msg.tempo
                if not msg.is_meta:
                    events.append((absolute_time, msg))
            self.tracks.append(events)

    def play_midi(self):
        self.fs.noteoff(0, 0)  # Stop any previous notes
        self.playing = True
        pygame.mixer.music.load(self.midi_file.filename)
        pygame.mixer.music.play()

    def ticks_to_ms(self, ticks):
        return (ticks / self.ticks_per_beat) * (self.tempo / 1000)

    def draw_midi(self):
        self.screen.fill((255, 255, 255))
        y_offset = 50
        track_height = 100
        note_height = 10
        pixels_per_ms = 0.01

        for i, track in enumerate(self.tracks):
            y = y_offset + i * track_height
            pygame.draw.line(self.screen, (0, 0, 0), (0, y), (1200, y), 1)
            pygame.draw.line(self.screen, (0, 0, 0), (0, y + track_height - 1), (1200, y + track_height - 1), 1)

            active_notes = {}
            for time, msg in track:
                x = (time * pixels_per_ms) - self.scroll_x
                if msg.type == 'note_on' and msg.velocity > 0:
                    if msg.note not in active_notes:
                        active_notes[msg.note] = (x, y + (127 - msg.note) * note_height)
                elif msg.type == 'note_off' or (msg.type == 'note_on' and msg.velocity == 0):
                    if msg.note in active_notes:
                        note_start_x, note_y = active_notes[msg.note]
                        note_length = x - note_start_x
                        pygame.draw.rect(self.screen, (0, 0, 255), (note_start_x, note_y, note_length, note_height))
                        del active_notes[msg.note]

        pygame.display.flip()

    def run(self):
        while self.running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_SPACE:
                        self.play_midi()
                    elif event.key == pygame.K_LEFT:
                        self.scroll_x = max(self.scroll_x - self.scroll_speed, 0)
                    elif event.key == pygame.K_RIGHT:
                        self.scroll_x += self.scroll_speed

            self.draw_midi()
            self.clock.tick(30)

        pygame.quit()
        self.fs.delete()

if __name__ == "__main__":
    midi_file_path = "temp.mid"
    viewer = MidiViewer(midi_file_path)
    viewer.run()
