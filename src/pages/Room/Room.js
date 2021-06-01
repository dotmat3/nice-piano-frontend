import React, { useEffect, useState } from "react";

import Section from "../../components/Section";
import RoomHeader from "./RoomHeader";
import PianoWaterfall from "./PianoWaterfall";
import Piano from "../../components/Piano";

import { ReactComponent as PrimaryBGSVG } from "./assets/bg3.svg";

import SettingsSideBar from "./SettingsSideBar";
import RecordingsSideBar from "./RecordingsSideBar";
import RoomSideBar from "./RoomSideBar";

import "./Room.scss";
import "./SideBar.scss";

const notes = {};

const Room = () => {
  const [showSettingsSideBar, setShowSettingsSideBar] = useState(false);
  const [showRecordingsSideBar, setShowRecordingsSideBar] = useState(false);
  const [showRoomSideBar, setShowRoomSideBar] = useState(false);

  const [roomName] = useState("BellaRoom");

  const generateRandomNotes = (n) => {
    let lastTime = 0;
    for (let i = 0; i < n; i++) {
      const time = lastTime + Math.random() * 100;
      setTimeout(() => {
        const note = {
          pitch: (i % 119) + 12,
          created: Date.now(),
          ended: Date.now() + 100,
          color: "#09f",
        };
        notes[i] = note;
      }, time);
      lastTime = time;
    }
  };

  useEffect(() => generateRandomNotes(1000), []);

  return (
    <div className="room">
      <RoomHeader
        isPlayingRecording={false}
        onOpenSettings={() => setShowSettingsSideBar(true)}
        onOpenRecordings={() => setShowRecordingsSideBar(true)}
      />
      <main>
        <Section className="room-name" onClick={() => setShowRoomSideBar(true)}>
          {roomName}
        </Section>
        <PianoWaterfall drawedNotes={notes} removeNote={() => {}} />
        <Piano
          octaves={9}
          activeNotes={{}}
          onPlayNote={() => {}}
          onStopNote={() => {}}
          hideNotes
        />
      </main>
      <PrimaryBGSVG className="bg" />
      {showSettingsSideBar && (
        <SettingsSideBar onExit={() => setShowSettingsSideBar(false)} />
      )}
      {showRecordingsSideBar && (
        <RecordingsSideBar onExit={() => setShowRecordingsSideBar(false)} />
      )}
      {showRoomSideBar && (
        <RoomSideBar
          roomName={roomName}
          onExit={() => setShowRoomSideBar(false)}
        />
      )}
    </div>
  );
};

export default Room;
