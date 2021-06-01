import React, { useCallback, useEffect, useRef } from "react";

import { BASES } from "../../constants";
import { getNoteFromMidiNumber } from "../../utils";

import "./PianoWaterfall.scss";

const SLOW_FACTOR = 0.2;
const KEYBOARD_KEYS = 9 * 7;

const drawNote = (ctx, x, y, height, width, color) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y);
  ctx.lineTo(x + width / 2, y + height);
  ctx.stroke();
};

const PianoWaterfall = ({ drawedNotes, removeNote }) => {
  const canvasRef = useRef(null);
  const notesRef = useRef(null);
  const animationFrameHandle = useRef(null);

  notesRef.current = drawedNotes;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const [index, note] of Object.entries(notesRef.current)) {
      // pitch : 107 = x : offsetWidth
      const noteStr = getNoteFromMidiNumber(note.pitch);
      let pitch = parseInt(noteStr.substr(noteStr.length - 1, 1)) * 7;
      pitch += Object.keys(BASES).indexOf(noteStr.substr(0, 1));

      const noteWidth = canvas.offsetWidth / (9 * 7);

      let x;
      if (noteStr.includes("b"))
        x = ((pitch - 1) * canvas.offsetWidth) / KEYBOARD_KEYS + noteWidth / 2;
      else x = (pitch * canvas.offsetWidth) / KEYBOARD_KEYS;

      const now = Date.now();
      const millis = (now - note.created) * SLOW_FACTOR;
      const y = canvas.offsetHeight - millis;

      const ended = note.ended ? note.ended : now;
      const end_millis = (now - ended) * SLOW_FACTOR;
      const end_y = canvas.offsetHeight - end_millis;

      const height = end_y - y;

      if (y + height < 0) removeNote(index);

      drawNote(
        ctx,
        x,
        y,
        height,
        noteStr.includes("b") ? noteWidth - 4 : noteWidth,
        note.color
      );
    }

    window.requestAnimationFrame(draw);
  }, [removeNote]);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.onresize = resizeCanvas;
    resizeCanvas();

    return () => (window.onresize = null);
  }, [canvasRef]);

  useEffect(() => {
    animationFrameHandle.current = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrameHandle.current);
    };
  }, [draw]);

  return (
    <div className="piano-waterfall">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default PianoWaterfall;
