This is a JS percussion SoundFont that is compatible with [MIDI.js](https://github.com/mudcube/MIDI.js) and [soundfont-player](https://github.com/danigb/soundfont-player).

## Usage

The drum names are listed in [drums.json](https://github.com/notochord/percussion-soundfont.js/blob/master/drums.json). There are some issues with inconsistent hyphenation but it's officially that way on the [MIDI website](https://www.midi.org/specifications-old/item/gm-level-1-sound-set) so.

### With [MIDI.js](https://github.com/mudcube/MIDI.js)

I recommend against trying to make this work with MIDI.js for two reasons:

* MIDI.js can only handle one SoundFont at a time, so you're stuck either using drums or other instruments (you might be able to change soundfontUrl between plugin loads, I haven't tried too hard to hack it).
* I don't think it's possible to tell MIDI.js to play an instrument whose name isn't General MIDI. If the name of the instrument in this repo really needs to change to the name of a GM instrument let me know and we can probably make that happen.

```javascript
MIDI.soundfontUrl = 'https://notochord.github.io/percussion-soundfont.js/';
MIDI.loadPlugin({
    instrument: "percussion",
    onsuccess: function() { }
});
```

### With [soundfont-player](https://github.com/danigb/soundfont-player)

```javascript
Soundfont.instrument(new AudioContext(), 'https://notochord.github.io/percussion-soundfont.js/percussion-mp3.js')
  .then(drums => drums.play(64));
```

## Credits

This is an adaptation of the [GeneralUser](http://www.schristiancollins.com/generaluser.php) SoundFont, and was converted to JS by [letoribo](https://github.com/letoribo) in [this repository](https://github.com/letoribo/General-MIDI-Percussion-soundfonts-for-MIDI.js-).
I just put the files in this repo for safekeeping, but [letoribo](https://github.com/letoribo) gets all the credit for the actual conversion.
Check out their project [drums.herokuapp.com](https://drums.herokuapp.com/)!
