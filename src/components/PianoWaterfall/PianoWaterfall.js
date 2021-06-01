import React, { useEffect, useCallback, useRef } from "react";

import { BASES } from "../../constants";
import { getNoteFromMidiNumber } from "../../utils";

import "./PianoWaterfall.scss";

const drawNote = (ctx, x, y, height, width, color) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y);
  ctx.lineTo(x + width / 2, y + height);
  ctx.stroke();
};

const NOTE_WIDTH = 28;
const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 400;
const SLOW_FACTOR = 0.2;

const KEYBOARD_KEYS = 9 * 7;

const PianoWaterfall = ({ drawedNotes, removeNote }) => {
  const notesRef = useRef(null);
  notesRef.current = drawedNotes;

  const draw = useCallback(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const [index, note] of Object.entries(notesRef.current)) {
      // pitch : 107 = x : offsetWidth
      const noteStr = getNoteFromMidiNumber(note.pitch);
      let pitch = parseInt(noteStr.substr(noteStr.length - 1, 1)) * 7;
      pitch += Object.keys(BASES).indexOf(noteStr.substr(0, 1));

      let x;
      if (noteStr.includes("b"))
        x = ((pitch - 1) * canvas.offsetWidth) / KEYBOARD_KEYS + NOTE_WIDTH / 2;
      else x = (pitch * canvas.offsetWidth) / KEYBOARD_KEYS;

      const now = Date.now();
      const millis = (now - note.created) * SLOW_FACTOR;
      let y = canvas.offsetHeight - millis;

      const ended = note.ended ? note.ended : now;
      const end_millis = (now - ended) * SLOW_FACTOR;
      let end_y = canvas.offsetHeight - end_millis;

      let height = end_y - y;

      if (y + height < 0) removeNote(index);

      drawNote(
        ctx,
        x,
        y,
        height,
        noteStr.includes("b") ? NOTE_WIDTH - 4 : NOTE_WIDTH,
        note.color
      );
    }

    window.requestAnimationFrame(draw);
  }, [removeNote]);

  const animationFrameHandle = useRef(null);

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    animationFrameHandle.current = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrameHandle.current);
    };
  }, [draw]);

  return (
    <div className="piano-waterfall">
      <canvas
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default PianoWaterfall;
