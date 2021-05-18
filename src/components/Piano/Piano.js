import React from "react";

import { BASES } from "../../constants";
import { getNoteFromMidiNumber, getMidiNumberFromNote } from "../../utils";

import "./Piano.scss";

const Piano = ({ octaves, activeNotes, onPlayNote, onStopNote }) => {
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
        />
      ))}
    </div>
  );
};

const PianoOctave = ({ number, activeNotes, onPlayNote, onStopNote }) => {
  if (number === undefined || number == null || number < 0 || number > 9)
    throw new Error(
      "The octave " + number + " doesn't exists in a piano: valid range [0:8]"
    );

  let notes = Object.keys(BASES);

  // if (number === 0) {
  //   notes = ["A", "B"];
  // } else if (number === 8) {
  //   notes = ["C"];
  // }

  const isNoteActive = (note) => {
    const midi = getMidiNumberFromNote(note);
    const res = Object.keys(activeNotes).includes(midi.toString());
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
      date-key={noteName}
      onMouseDown={() => onPlayNote(getMidiNumberFromNote(noteName), 1)}
      onMouseUp={() => onStopNote(getMidiNumberFromNote(noteName))}
      onMouseLeave={() => onStopNote(getMidiNumberFromNote(noteName))}
      {...props}
    >
      {noteName.includes("b") ? null : noteName}
    </button>
  );
};

export default Piano;