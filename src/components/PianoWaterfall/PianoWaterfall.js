import React from "react";

import { BASES } from "../../constants";

import "./PianoWaterfall.scss";

const PianoWaterfall = ({ octaves }) => {
  const notes = [
    { start: Date.now(), duration: 1, pitch: 42, velocity: 0.7 },
    { start: Date.now() + 1, duration: 1, pitch: 43, velocity: 0.9 },
    { start: Date.now() + 2, duration: 1, pitch: 43, velocity: 0.9 },
  ];

  return (
    <div className="piano-waterfall">
      {/* {[...Array(octaves)].map((octave, index) => (
        <PianoWaterfallOctave key={index} number={octave} notes={notes} />
      ))} */}
    </div>
  );
};

const PianoWaterfallOctave = ({ number, notes }) => {
  const naturalNotes = Object.keys(BASES);

  return (
    <div className="piano-waterfall-octave">
      <div className="piano-waterfall-octave-black">
        <PianoWaterfallColumn half />
        {naturalNotes.map((value) => (
          <PianoWaterfallColumn
            key={value + "b" + number}
            note={value + "b" + number}
          />
        ))}
        <PianoWaterfallColumn half />
      </div>
      <div className="piano-waterfall-octave-white">
        {naturalNotes.map((value) => (
          <PianoWaterfallColumn key={value + number} note={value + number} />
        ))}
      </div>
    </div>
  );
};

const PianoWaterfallColumn = ({ note, half }) => {
  if (half) return <div className="piano-waterfall-column hidden half" />;

  if (note.includes("Fb"))
    return <div className="piano-waterfall-column hidden" />;

  return (
    <div className="piano-waterfall-column">
      {<PianoWaterfallNote start={Math.random() * 100} duration={20} />}
    </div>
  );
};

const PianoWaterfallNote = ({ color, start, duration }) => {
  return (
    <div
      className="piano-waterfall-note"
      style={{ backgroundColor: color, top: start, height: duration }}
    />
  );
};

export default PianoWaterfall;
