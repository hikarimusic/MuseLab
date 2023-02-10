# MuseLab
Compose Music by Coding: generating MIDI from Python script

## Quick Start

* Install MuseLab following [setup.md](https://github.com/hikarimusic/MuseLab/setup.md)

* Create a file ``mysong.py`` and paste the following code:

```py
from muselab import *

song = Song()
song.add("Part 1", length=16, key=F4, signature=(3, 4), tempo=120)
song["Part 1"].add("Piano", Acoustic_Grand_Piano)
song["Part 1"]["Piano"].write(2.0,
    [.75, .25, 1.0, 1.0, 1.0, 2.0, .75, .25, 1.0, 1.0, 1.0, 2.0],
    [ G3,  G3,  A3,  G3,  C4,  B3,  G3,  G3,  A3,  G3,  D4,  C4],
    ['祝','你','生','日','快','樂','祝','你','生','日','快','樂']
)
song.save("mysong.mid")
song.view()
```
* Run the file by ``python3 mysong.py``. Then you can view the music score, and the MIDI file will be saved as ``mysong.mid``:

![image](https://github.com/hikarimusic/MuseLab/doc/asset/mysong.png)

## More About

* The detailed documentation is coming soon!

* The following is a more advanced example, which composes and arranges the first part of **Lemon (米津玄師)**. You can learn most things of MuseLab by examining the following example:

```py
from muselab import *

song = Song()
song.add("A1", 36, key=B3, signature=(4,4), tempo=87)

# Section A1

song["A1"].add("Vocal", Lead_6_Voice)
song["A1"].add("Guitar 1", Electric_Guitar_Clean)
song["A1"].add("Guitar 2", Electric_Guitar_Clean)
song["A1"].add("Drum", Percussion)
song["A1"].add("Piano", Acoustic_Grand_Piano)

song["A1"]["Vocal"].write(3.5,  [.25, .25, .50, .25, .75, .50, .50, .25, .75, .50, .50, .25, .75, .50, 1.0],
                                [ C4,  D4,  E4,  C4,  A3,  D4,  B3,  G3,  E3,  B3,  A3,  G3,  C3,  G3,  E3],
                                ['ゆ','め','な','ら','ば','ど','れ','ほ','ど','よ','かっ','た','で','しょ','う'])
song["A1"]["Vocal"].write(11.5, [.25, .25, 1.0, .50, .25, .25, 1.0, .50, .25, .25, .75, .25, .50, .25, .25, 1.0],
                                [ D3,  E3,  F3,  C4,  B3,  C4,  G3,  F3,  E3,  F3, Fs3, Fs3,  C4,  B3,  A3, Gs3],
                                ['い','ま','だ','に','あ','な','た','の','こ','と','を','ゆ','め','に','み','る'])
song["A1"]["Vocal"].write(19.5, [.25, .25, .50, .25, .75, .50, .50, .25, .75, .50, .50, .25, .75, .50, 1.0],
                                [ C4,  D4,  E4,  C4,  A3,  D4,  B3,  G3,  E3,  B3,  A3,  G3,  C3,  G3,  E3],
                                ['わ','す','れ','た','も','の','を','と','り','に','か','え','る','よう','に'])
song["A1"]["Vocal"].write(27.5, [.25, .25, 1.0, .50, .25, .25, .50, .50, .50, .50, .75, .25, .25, .50, .25, 1.0],
                                [ D3,  E3,  F3,  G3,  F3,  G3,  E3,  G3,  C4,  E4,  D4,  D4,  D4,  C4,  C4,  C4],
                                ['ふ','る','び','た','お','も','い','で','の','ほ','こ','り','を','','は','らう'])

song["A1"]["Guitar 1"].write(20, [.50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50],
                                 [ E5,  C5,  G5,  C5,  B4,  D5,  G5,  B4,  C5,  D5,  G5,  C5,  C5,  D5,  E5,  C5])
song["A1"]["Guitar 1"].write(28, [.50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50],
                                 [ D5,  C5,  G5,  C5,  C5,  D5,  G5,  C5,  B4,  D5,  G5,  C5,  C5,  D5,  G5,  C5])

song["A1"]["Guitar 2"].write(20, [.50, .50, .50, .50, .50, .50, 1.0, .50, .50, .50, .50, .50, .50, 1.0],
                                 [ C4,  G3,  E4,  G3,  D4,  G3,  C4,  F4,  G3,  D4,  G3,  E4,  G3,  C4])
song["A1"]["Guitar 2"].write(28, [.50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50, .50],
                                 [ F4,  C4,  D4,  G3,  E4,  G3,  C4,  G3,  B3,  G3,  B3,  G3,  C4,  G3,  C4,  G3])

song["A1"]["Drum"].write(20, [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
                             [ '', Xhc,  '', Xhc,  '', Xhc,  '', Xhc,  '', Xhc,  '', Xhc,  '', Xhc,  '', Xhc])

song["A1"]["Piano"].write(4,  [             2.0,              2.0,              2.0,              2.0],
                              [(A2, A3, C4, E4), (G2, G3, B3, D4), (F2, F3, G3, C4), (C2, C3, E3, G3)])
song["A1"]["Piano"].write(12, [             2.0,              2.0,                 2.0,              2.0],
                              [(F2, C3, F3, A3), (C2, C3, E3, G3), (Ds2, A2, Ds3, Fs3), (E2, B2, E3, Gs3)])
song["A1"]["Piano"].write(20, [             2.0,              2.0,              2.0,              2.0],
                              [(A2, A3, C4, E4), (G2, G3, B3, D4), (F2, F3, G3, C4), (C3, G3, C4, E4)])
song["A1"]["Piano"].write(28, [             2.0,              2.0,              2.0,              2.0],
                              [(F2, C3, G3, C4), (C2, C3, E3, G3), (G2, D2, G3, B3), (C2, C3, G3, C4)])

song.view()
```