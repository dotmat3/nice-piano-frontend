import React, { useCallback, useRef } from "react";

import { isFlat } from "../../utils.js";

import "./Piano.scss";

const PianoNote = ({ className, pitch, handleMouseDown }) => {
  const onMouseDown = useCallback(
    () => handleMouseDown(pitch),
    [pitch, handleMouseDown]
  );

  return (
    <div className={className}>
      <button onMouseDown={onMouseDown} />
    </div>
  );
};

const Piano = ({
  startPitch,
  endPitch,
  activeNotes,
  onPlayNote,
  onStopNote,
}) => {
  if (!startPitch || !endPitch || startPitch < 21 || endPitch > 108)
    throw new Error("Invalid start or end pitch");

  const activeMousePitch = useRef(null);

  const handleMouseUp = useCallback(() => {
    onStopNote(activeMousePitch.current);
    activeMousePitch.current = null;
    document.removeEventListener("mouseup", handleMouseUp);
  }, [onStopNote, activeMousePitch]);

  const handleMouseDown = useCallback(
    (pitch) => {
      onPlayNote(pitch);
      activeMousePitch.current = pitch;
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onPlayNote, handleMouseUp]
  );

  const createPianoKeys = () => {
    const keys = [];
    for (let pitch = startPitch; pitch <= endPitch; pitch++) {
      const active = pitch in activeNotes;
      const className =
        "piano-key" +
        (active ? " active" : "") +
        (isFlat(pitch) ? " black-key" : " white-key");
      keys.push(
        <PianoNote
          key={pitch}
          className={className}
          pitch={pitch}
          handleMouseDown={handleMouseDown}
        />
      );
    }
    return keys;
  };

  return <div className="piano">{createPianoKeys()}</div>;
};

export default Piano;
