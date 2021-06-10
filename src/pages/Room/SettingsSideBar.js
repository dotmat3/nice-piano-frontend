import React from "react";

const SettingsSideBar = ({
  midiAccess,
  midiInput,
  setMidiInput,
  midiOutput,
  setMidiOutput,
  transposition,
  setTransposition,
  hideNotes,
  setHideNotes,
  onExit,
}) => {
  const handleMidiInputChange = (e) => {
    const id = e.currentTarget.value;
    localStorage.setItem("prev-midi-input", id);
    setMidiInput(id);
  };

  return (
    <>
      <div className="right-side-bar settings">
        <h1>Settings</h1>
        <label>MIDI Input</label>
        <select value={midiInput} onChange={handleMidiInputChange}>
          {midiAccess &&
            Array.from(midiAccess.inputs.values()).map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          <option value="none">None</option>
        </select>
        <label>MIDI Output</label>
        <select
          value={midiOutput}
          onChange={(e) => setMidiOutput(e.currentTarget.value)}
        >
          {midiAccess &&
            Array.from(midiAccess.outputs.values()).map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          <option value="none">None</option>
        </select>
        <label>Hide notes label</label>
        <input
          type="checkbox"
          checked={hideNotes}
          onChange={() => setHideNotes(!hideNotes)}
        />
        <label>Transpose</label>
        <input
          type="number"
          value={transposition}
          onChange={(e) => setTransposition(e.currentTarget.value)}
        />
      </div>
      <div className="overlay" onClick={onExit}></div>
    </>
  );
};

export default SettingsSideBar;
