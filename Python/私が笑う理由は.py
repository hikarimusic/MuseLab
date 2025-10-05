from muselab import *

# piano()

song = Song()
song.add("C1", 72, key=Cs4, signature=(4,4), tempo=165)

# CM = [C2, C3, E3, G3]
# Dm = [D2, A2, D3, F3]
# Em = [E2, A2, E3, G3]
# FM = [F2, C3, F3, A3]
# GM = [G2, D3, G3, B3]
# Am = [A2, E3, A3, C4]

# CM5 = [G2, E3, G3, C4]
# Fsd = [Fs2, C3, Fs3, A3]


# Section C1

song["C1"].add("Vocal", Lead_1_Square)
song["C1"].add("Chord", SynthStrings_1)

song["C1"]["Vocal"].write(2, [1.0, 1.0, 1.0, 1.0, 1.0, 1.0,  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, .50, .50, 1.0,   1.0, 1.0, 1.0, 1.0],
                             [E4,  D4,  C4,  D4,  E4,  A4,   G4,  '',  E4,  D4,  C4,  D4,  E4,  E4,  C5,    B4,  '',  E4,  D4 ],
                             [wa,  ra,  u,   wa,  ke,  na+n, de,  '',  sa,  ga,  su,  mo,  no,  zya, na+ku, te,  '',  a,   ku ])

song.play()