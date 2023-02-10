# Setup 

Create a virtual environment:

```sh
python3 -m venv .muselab
```

Activate the virtual environment:

```sh
source .muselab/bin/activate
```

Clone the repository:

```sh
git clone https://github.com/hikarimusic/MuseLab.git
```

Install the dependency:

```sh
cd MuseLab
```
```sh
pip install -r requirements.txt
```

Install MuseScore (to view the generated MIDI file):

```
sudo apt-get install musescore3
```

(Optional) Install Pygame to play the music in terminal:

```sh
sudo apt-get install python-pygame
```
```sh
sudo apt-get install timidity
```

Edit files in VSCode:

```sh
code .
```

Select interpreter in VSCode:
* Press **Ctrl+Shift+P** to open the comand palette
* Type ``Python: Select Interpreter`` and press enter
* Select the virtual environment: ``~/.muselab/bin/python3``

