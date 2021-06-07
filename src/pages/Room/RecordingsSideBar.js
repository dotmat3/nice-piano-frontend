import React from "react";
import { formatTime } from "../../utils";

const Recording = ({ name, date, duration, ...props }) => {
  return (
    <div {...props} className={"recording " + props.className}>
      <p>{name}</p>
      <p>
        {new Date(date).toLocaleDateString("en-US")} |{" "}
        {formatTime(new Date(duration))}
      </p>
    </div>
  );
};

const RecordingsSideBar = ({ recordings, onRecordingSelected, onExit }) => {
  return (
    <>
      <div className="right-side-bar recordings">
        <h1>Recordings</h1>
        {recordings &&
          recordings.map((recording, index) => (
            <Recording
              key={index}
              name={recording.name}
              date={recording.recordingTime}
              duration={recording.endTime - recording.recordingTime}
              onClick={() => onRecordingSelected(recording)}
            />
          ))}
        {recordings && recordings.length == 0 && (
          <h3>No recordings available yet</h3>
        )}
      </div>
      <div className="overlay" onClick={onExit}></div>
    </>
  );
};

export default RecordingsSideBar;
