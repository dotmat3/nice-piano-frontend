import React, { useState } from "react";
import { formatTime } from "../../utils";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ConfirmationAlert = ({
  title,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="confirmation-alert">
      <h3 className="confirmation-title"> {title} </h3>
      <div className="button-row">
        <button onClick={onCancel} className="cancel-button">
          {cancelText}
        </button>
        <button onClick={onConfirm} className="confirm-button">
          {confirmText}
        </button>
      </div>
    </div>
  );
};

const Recording = ({ name, date, duration, onDeleteRecording, ...props }) => {
  const [showAlert, setShowAlert] = useState(false);

  const toggleAlert = () => {
    setShowAlert((prev) => !prev);
  };

  const onDeleteConfirm = () => {
    toggleAlert();
    onDeleteRecording(date);
  };

  return (
    <div {...props} className={"recording " + props.className}>
      <div className="recording-info">
        <div className="recording-text">
          <p>{name}</p>
          <p>
            {new Date(date).toLocaleDateString("en-US")} |{" "}
            {formatTime(new Date(duration))}
          </p>
        </div>
        <FontAwesomeIcon
          icon={faTrashAlt}
          color="var(--primary)"
          size="lg"
          onClick={toggleAlert}
        />
      </div>
      {showAlert && (
        <ConfirmationAlert
          title="Are you sure you want to delete this recording?"
          confirmText="Confirm"
          cancelText="Cancel"
          onCancel={toggleAlert}
          onConfirm={onDeleteConfirm}
        ></ConfirmationAlert>
      )}
    </div>
  );
};

const RecordingsSideBar = ({
  recordings,
  onRecordingSelected,
  onDeleteRecording,
  onExit,
}) => {
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
              onDeleteRecording={onDeleteRecording}
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
