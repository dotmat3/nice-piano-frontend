import React, { useCallback } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faStop,
  faCircle,
  faSlidersH,
  faSyncAlt,
  faList,
} from "@fortawesome/free-solid-svg-icons";

import Logo from "../../components/Logo";
import Section from "../../components/Section";
import UserProfile from "../../components/UserProfile";

import "./RoomHeader.scss";

const RoomHeader = ({
  isPlayingRecording,
  isRecording,
  isLooping,
  onPlayRecording,
  onResetRecording,
  onStartRecording,
  onStopRecording,
  onToggleLooping,
  onOpenSettings,
  onOpenRecordings,
  onOpenUserInfo,
  currentRecording,
  onChangeName,
  onUpdateName,
  users,
  username,
}) => {
  const inputText = isRecording
    ? "Recording..."
    : currentRecording
    ? currentRecording.name
    : "Start to record...";

  const disabled = isRecording || !currentRecording;

  const handleChangeRecordingName = useCallback(
    (e) => onChangeName(e.currentTarget.value),
    [onChangeName]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        onUpdateName();
        e.target.blur();
      }
    },
    [onUpdateName]
  );

  return (
    <header>
      <Logo />
      <div className="sections">
        <Section className="row recordings">
          <FontAwesomeIcon
            icon={isPlayingRecording ? faStop : faPlay}
            color="var(--primary)"
            size="lg"
            onClick={() =>
              isPlayingRecording ? onResetRecording() : onPlayRecording()
            }
          />
          <input
            type="text"
            value={inputText}
            disabled={disabled}
            onChange={handleChangeRecordingName}
            onKeyDown={handleKeyDown}
          />
          <FontAwesomeIcon
            icon={faList}
            color="var(--primary)"
            size="lg"
            onClick={onOpenRecordings}
          />
          <FontAwesomeIcon
            icon={faCircle}
            color={isRecording ? "var(--primary)" : "var(--tertiary)"}
            size="lg"
            onClick={() =>
              isRecording ? onStopRecording() : onStartRecording()
            }
          />
          <FontAwesomeIcon
            icon={faSyncAlt}
            color={isLooping ? "var(--primary)" : "var(--tertiary)"}
            size="lg"
            onClick={onToggleLooping}
          />
        </Section>
        <Section className="row users">
          {users &&
            Object.keys(users)
              .slice(0, 3)
              .map((name, index) => (
                <UserProfile key={index} username={name} />
              ))}
          {users && Object.keys(users).length > 3 && (
            <span>+ {Object.keys(users).length - 3}</span>
          )}
        </Section>
        <Section className="row settings">
          <FontAwesomeIcon
            icon={faSlidersH}
            color="var(--primary)"
            size="lg"
            onClick={onOpenSettings}
          />
        </Section>
        <UserProfile username={username} onClick={onOpenUserInfo} />
      </div>
    </header>
  );
};

export default RoomHeader;
