import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faStop,
  faCircle,
  faCog,
  faSyncAlt,
} from "@fortawesome/free-solid-svg-icons";

import "./MenuBar.scss";

const MenuBar = ({
  isRecording,
  isPlayingRecording,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onResetRecording,
  onLoop,
}) => {
  const handleRecordingClick = () => {
    if (isRecording) onStopRecording();
    else onStartRecording();
  };

  const handlePlayRecordingClick = () => {
    if (isPlayingRecording) onResetRecording();
    else onPlayRecording();
  };

  return (
    <div className="menu-bar">
      <MenuItem onClick={handlePlayRecordingClick}>
        <FontAwesomeIcon
          icon={isPlayingRecording ? faStop : faPlay}
          color="var(--button-color)"
          size="2x"
        />
      </MenuItem>
      <MenuItem onClick={handleRecordingClick}>
        <FontAwesomeIcon
          icon={faCircle}
          color={
            isRecording ? "var(--rec-button-color)" : "var(--button-color)"
          }
          size="2x"
        />
      </MenuItem>
      <MenuItem onClick={onLoop}>
        <FontAwesomeIcon
          icon={faSyncAlt}
          color="var(--button-color)"
          size="2x"
        />
      </MenuItem>
      <MenuItem>
        <FontAwesomeIcon icon={faCog} color="var(--button-color)" size="2x" />
      </MenuItem>
    </div>
  );
};

const MenuItem = ({ onClick, children }) => {
  return (
    <button className="menu-item" onClick={onClick}>
      {children}
    </button>
  );
};

export default MenuBar;
