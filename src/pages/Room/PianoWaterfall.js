import React, {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";

import { isFlat } from "../../utils";

import "./PianoWaterfall.scss";

const SLOW_FACTOR = 0.2;
const NOTE_WIDTH = 30;

// FPS variables
let lastTime = null;
let lastShown = 0;
let lastDelta = 0;

const drawNote = (ctx, x, y, height, width, color) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y);
  ctx.lineTo(x + width / 2, y + height);
  ctx.stroke();
};

// Pre-compute map pitch -> n. white keys before
const pitchMapping = (() => {
  const mapping = {};
  let count = 0;
  for (let pitch = 21; pitch <= 108; pitch++) {
    mapping[pitch] = count;
    if (!isFlat(pitch)) count++;
  }
  return mapping;
})();

const PianoWaterfall = ({ drawedNotes, removeNote, startPitch, endPitch }) => {
  const canvasRef = useRef(null);
  const notesRef = useRef(null);
  const animationFrameHandle = useRef(null);
  const [showFPS, setShowFPS] = useState(false);

  const numberWhiteKeys = useMemo(() => {
    let count = 0;
    for (let pitch = startPitch; pitch <= endPitch; pitch++)
      if (!isFlat(pitch)) count++;
    return count;
  }, [startPitch, endPitch]);

  notesRef.current = drawedNotes;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const [index, note] of Object.entries(notesRef.current)) {
      if (note.pitch < startPitch || note.pitch > endPitch) continue;

      const nPrevWhiteNotes =
        pitchMapping[note.pitch] - pitchMapping[startPitch];

      const flat = isFlat(note.pitch);

      let x = nPrevWhiteNotes * NOTE_WIDTH;
      if (flat) x -= NOTE_WIDTH / 2;

      const now = performance.now();
      const millis = (now - note.created) * SLOW_FACTOR;
      const y = canvas.height - millis;

      const ended = note.ended ? note.ended : now;
      const end_millis = (now - ended) * SLOW_FACTOR;
      const end_y = canvas.height - end_millis;

      const height = end_y - y;

      if (y + height < 0) removeNote(index);

      drawNote(
        ctx,
        x,
        y,
        height,
        flat ? NOTE_WIDTH - 10 : NOTE_WIDTH,
        note.color
      );
    }

    if (showFPS) {
      const now = performance.now();
      if (lastTime) {
        if (now - lastShown > 100) {
          lastDelta = Math.ceil(1000 / (now - lastTime));
          lastShown = now;
        }
        ctx.font = "20px Arial";
        ctx.fillStyle = "magenta";
        ctx.fillText(lastDelta, 10, canvas.height - 10);
      }
      lastTime = now;
    }

    animationFrameHandle.current = window.requestAnimationFrame(draw);
  }, [removeNote, startPitch, endPitch, showFPS]);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = numberWhiteKeys * NOTE_WIDTH;
      canvas.height = canvas.parentElement.offsetHeight;
    };

    window.onresize = resizeCanvas;
    resizeCanvas();

    return () => (window.onresize = null);
  }, [numberWhiteKeys]);

  useEffect(() => {
    animationFrameHandle.current = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrameHandle.current);
    };
  }, [draw]);

  // Show/Hide FPS
  useEffect(() => {
    const toggleFPS = (e) => {
      if (e.key == "F") setShowFPS((fps) => !fps);
    };

    document.addEventListener("keydown", toggleFPS);
    return () => {
      document.removeEventListener("keydown", toggleFPS);
    };
  }, []);

  return (
    <div className="piano-waterfall">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default PianoWaterfall;
