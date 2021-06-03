import React from "react";

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
  setIsPlayingRecording,
  onOpenSettings,
  onOpenRecordings,
  onOpenUserInfo,
  username,
}) => {
  return (
    <header>
      <Logo />
      <div className="sections">
        <Section className="row recordings">
          <FontAwesomeIcon
            icon={isPlayingRecording ? faStop : faPlay}
            color="var(--primary)"
            size="lg"
            onClick={() => setIsPlayingRecording(!isPlayingRecording)}
          />
          <p>Sample 2</p>
          <FontAwesomeIcon
            icon={faList}
            color="var(--primary)"
            size="lg"
            onClick={onOpenRecordings}
          />
          <FontAwesomeIcon icon={faCircle} color="var(--primary)" size="lg" />
          <FontAwesomeIcon icon={faSyncAlt} color="var(--primary)" size="lg" />
        </Section>
        <Section className="row users">
          <UserProfile username={username} />
          <UserProfile username={"SkyLion"} />
          <UserProfile username={"DotMat"} />
          <span>+3</span>
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
