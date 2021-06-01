import React from "react";

const SettingsSideBar = ({ onExit }) => {
  return (
    <>
      <div className="right-side-bar settings">
        <h1>Settings</h1>
        <label>MIDI Input</label>
        <select>
          <option>Midi device</option>
          <option>Another Midi device</option>
          <option>Not a Midi device</option>
        </select>
        <label>MIDI Output</label>
        <select>
          <option>Midi device</option>
          <option>Another Midi device</option>
          <option>Not a Midi device</option>
        </select>
        <label>Volume</label>
        <input type="range" />
        <label>Transpose</label>
        <input type="number" />
      </div>
      <div className="overlay" onClick={onExit}></div>
    </>
  );
};

export default SettingsSideBar;
