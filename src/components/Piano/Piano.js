import React, { useMemo } from "react";

import { BASES } from "../../constants";
import { getNoteFromMidiNumber, getMidiNumberFromNote } from "../../utils";

import "./Piano.scss";

const Piano = ({ octaves, activeNotes, onPlayNote, onStopNote, hideNotes }) => {
  if (!octaves || octaves < 1 || octaves > 9)
    throw new Error("Number of octaves not defined or outside valid range");

  return (
    <div className="piano">
      {[...Array(octaves)].map((_, index) => (
        <PianoOctave
          key={index}
          number={index}
          activeNotes={activeNotes}
          onPlayNote={onPlayNote}
          onStopNote={onStopNote}
          hideNotes={hideNotes}
        />
      ))}
    </div>
  );
};

const PianoOctave = ({
  number,
  activeNotes,
  onPlayNote,
  onStopNote,
  hideNotes,
}) => {
  if (number === undefined || number == null || number < 0 || number > 9)
    throw new Error(
      "The octave " + number + " doesn't exists in a piano: valid range [0:8]"
    );

  const notes = useMemo(() => Object.keys(BASES), []);

  const isNoteActive = (note) => {
    const midi = getMidiNumberFromNote(note);
    const res = Object.keys(activeNotes).find((index) =>
      index.startsWith(midi.toString())
    );
    return res;
  };

  return (
    <div className="piano-octave">
      <div className="piano-octave-white">
        {notes.map((value) => (
          <PianoNote
            key={value + number}
            note={value + number}
            active={isNoteActive(value + number)}
            onPlayNote={onPlayNote}
            onStopNote={onStopNote}
            hideNotes={hideNotes}
          />
        ))}
      </div>
      <div className="piano-octave-black">
        <PianoNote half />
        {notes.slice(1).map((value) => (
          <PianoNote
            key={value + "b" + number}
            note={value + "b" + number}
            active={isNoteActive(value + "b" + number)}
            onPlayNote={onPlayNote}
            onStopNote={onStopNote}
            hideNotes={true}
          />
        ))}
        <PianoNote half />
      </div>
    </div>
  );
};

const PianoNote = ({
  note,
  half,
  active,
  onPlayNote,
  onStopNote,
  hideNotes,
  ...props
}) => {
  if (half) return <button className="black hidden half" />;

  if (note.includes("Fb")) return <button className="black hidden" />;

  let noteName = note;
  if (typeof noteName === "number") noteName = getNoteFromMidiNumber(noteName);

  return (
    <button
      className={
        (noteName.includes("b") ? "black" : "white") + (active ? " active" : "")
      }
      data-key={noteName}
      onMouseDown={() => onPlayNote(getMidiNumberFromNote(noteName), 0.5)}
      onMouseUp={() => onStopNote(getMidiNumberFromNote(noteName))}
      onMouseLeave={() => {
        if (active) onStopNote(getMidiNumberFromNote(noteName));
      }}
      {...props}
    >
      {hideNotes ? null : noteName}
    </button>
  );
};

export default Piano;
