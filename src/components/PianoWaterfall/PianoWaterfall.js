import React, { useEffect, useCallback } from "react";

import { BASES } from "../../constants";
import { getNoteFromMidiNumber } from "../../utils";

import "./PianoWaterfall.scss";

const drawNote = (ctx, x, y, height, width, color) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  // ctx.lineCap = "round";
  ctx.beginPath();
  // ctx.moveTo(x, y + width / 2);
  // ctx.lineTo(x + width / 2, y + height - width / 2);
  ctx.moveTo(x + width / 2, y);
  ctx.lineTo(x + width / 2, y + height);
  ctx.stroke();
};

const NOTE_WIDTH = 28;
const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 400;
const SLOW_FACTOR = 0.2;

const KEYBOARD_KEYS = 9 * 7;
const MAX_PITCH = 119;
const MIN_PITCH = 12;

const PianoWaterfall = ({ drawedNotes, removeNote }) => {
  const draw = useCallback(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    for (const [id, note] of Object.entries(drawedNotes)) {
      // pitch : 107 = x : offsetWidth
      const noteStr = getNoteFromMidiNumber(note.pitch);
      let pitch = parseInt(noteStr.substr(noteStr.length - 1, 1)) * 7;
      pitch += Object.keys(BASES).indexOf(noteStr.substr(0, 1));

      let x;
      if (noteStr.includes("b"))
        x = ((pitch - 1) * canvas.offsetWidth) / KEYBOARD_KEYS + NOTE_WIDTH / 2;
      else x = (pitch * canvas.offsetWidth) / KEYBOARD_KEYS;

      const millis = (Date.now() - note.created) * SLOW_FACTOR;
      let y = canvas.offsetHeight - millis;

      const ended = note.ended ? note.ended : Date.now();
      const end_millis = (Date.now() - ended) * SLOW_FACTOR;
      let end_y = canvas.offsetHeight - end_millis;

      let height = end_y - y;

      if (y + height < 0) removeNote(id);

      drawNote(
        ctx,
        x,
        y,
        height,
        noteStr.includes("b") ? NOTE_WIDTH - 4 : NOTE_WIDTH,
        note.color
      );
    }
  }, [drawedNotes]);

  useEffect(() => {
    const interval = setInterval(() => {
      window.requestAnimationFrame(draw);
    }, 10);

    return () => clearInterval(interval);
  }, [draw]);

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);

  return (
    <div className="piano-waterfall">
      <canvas
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          width: "100%",
          height: "100%",
          border: "1px solid lightgreen",
        }}
      />
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
