import React from "react";
import { formatTime } from "../../utils";

const Recording = ({ name, date, duration }) => {
  return (
    <div className="recording">
      <p>{name}</p>
      <p>
        {date.toLocaleDateString("en-US")} | {formatTime(new Date(duration))}
      </p>
    </div>
  );
};

const RecordingsSideBar = ({ onExit }) => {
  return (
    <>
      <div className="right-side-bar recordings">
        <h1>Recordings</h1>
        {[...Array(7)].map((_, index) => (
          <Recording
            key={index}
            name={"Sample " + index}
            date={new Date()}
            duration={300000 * Math.random()}
          />
        ))}
      </div>
      <div className="overlay" onClick={onExit}></div>
    </>
  );
};

export default RecordingsSideBar;
