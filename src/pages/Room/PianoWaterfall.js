import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isFlat } from "../../utils";
import * as PIXI from "pixi.js";

import "./PianoWaterfall.scss";

const NOTE_SPEED = 2;
const NOTE_WIDTH = 30;
const NOTE_ROUNDNESS = 10;
const NOTE_INITIAL_HEIGHT = 10;

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
  const [app, setApp] = useState();
  const parentRef = useRef();
  const notesRef = useRef();
  notesRef.current = drawedNotes;

  const numberWhiteKeys = useMemo(() => {
    let count = 0;
    for (let pitch = startPitch; pitch <= endPitch; pitch++)
      if (!isFlat(pitch)) count++;
    return count;
  }, [startPitch, endPitch]);

  // Resize PIXI
  useEffect(() => {
    if (!app) return;
    const width = numberWhiteKeys * NOTE_WIDTH;
    const height = parentRef.current.offsetHeight;
    app.renderer.resize(width, height);
  }, [numberWhiteKeys, app]);

  const updatePixi = useCallback(
    (delta) => {
      for (const [index, note] of Object.entries(notesRef.current)) {
        if (note.pitch < startPitch || note.pitch > endPitch) continue;

        const flat = isFlat(note.pitch);

        // Note just created
        if (!note.entity) {
          note.entity = new PIXI.Graphics();
          const nPrevWhiteNotes =
            pitchMapping[note.pitch] - pitchMapping[startPitch];

          let x = nPrevWhiteNotes * NOTE_WIDTH;
          if (flat) x -= NOTE_WIDTH / 2;
          note.entity.x = x;
          note.entity.y = app.renderer.height;
          note.entity.lineHeight = NOTE_INITIAL_HEIGHT;
          app.stage.addChild(note.entity);
        }

        note.entity.clear();

        const width = flat ? NOTE_WIDTH - 10 : NOTE_WIDTH;

        note.entity.y -= delta * NOTE_SPEED;
        if (!note.ended) note.entity.lineHeight += delta * NOTE_SPEED;
        note.entity.beginFill(note.color);
        note.entity.drawRoundedRect(
          0,
          0,
          width,
          note.entity.lineHeight,
          NOTE_ROUNDNESS
        );
        note.entity.endFill();

        if (note.entity.y + note.entity.height < 0) removeNote(index);
      }
    },
    [startPitch, endPitch, removeNote, app]
  );

  // Setup and mount PIXI
  useEffect(() => {
    const parent = parentRef.current;
    const app = new PIXI.Application({
      backgroundAlpha: 0,
      antialias: true,
    });
    parent.appendChild(app.view);

    setApp(app);
    return () => {
      parent.removeChild(app.view);
    };
  }, []);

  // Start PIXI loop
  useEffect(() => {
    if (!app) return;
    const updatePixiLambda = (delta) => updatePixi(delta);
    app.ticker.add(updatePixiLambda);

    return () => {
      app.ticker.remove(updatePixiLambda);
    };
  }, [app, updatePixi]);

  return <div className="piano-waterfall" ref={parentRef}></div>;
};

export default PianoWaterfall;
