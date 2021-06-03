import React, { useCallback, useEffect, useState } from "react";
import { Redirect } from "react-router";

import socketio from "socket.io-client";
import { Piano as TonePiano } from "@tonejs/piano";
import { Auth } from "aws-amplify";

import Section from "../../components/Section";
import RoomHeader from "./RoomHeader";
import PianoWaterfall from "./PianoWaterfall";
import Piano from "../../components/Piano";

import { ReactComponent as PrimaryBGSVG } from "./assets/bg3.svg";

import SettingsSideBar from "./SettingsSideBar";
import RecordingsSideBar from "./RecordingsSideBar";
import RoomSideBar from "./RoomSideBar";
import UserSideBar from "./UserSideBar";

import { getNoteFromMidiNumber, parseMidiMessage } from "../../utils";

import "./Room.scss";
import "./SideBar.scss";

const ProtectedRoom = () => {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setUsername(user.username);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return <h1>Loading...</h1>;

  return username ? <Room username={username} /> : <Redirect to="/signin" />;
};

const Room = ({ username }) => {
  const [showSettingsSideBar, setShowSettingsSideBar] = useState(false);
  const [showRecordingsSideBar, setShowRecordingsSideBar] = useState(false);
  const [showRoomSideBar, setShowRoomSideBar] = useState(false);
  const [showUserSideBar, setShowUserSideBar] = useState(false);

  const [roomName] = useState("BellaRoom");
  const [socket, setSocket] = useState(null);
  const [instrument, setInstrument] = useState(null);
  const [midiAccess, setMidiAccess] = useState(null);
  const [midiInput, setMidiInput] = useState("None");
  const [midiOutput, setMidiOutput] = useState("None");
  const [transposition, setTransposition] = useState(0);

  const [notes, setNotes] = useState({ activeNotes: {}, drawedNotes: {} });

  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  const playNote = useCallback(
    (pitch, velocity, emitEvent) => {
      const noteStr = getNoteFromMidiNumber(pitch);
      instrument.keyDown({ note: noteStr, velocity });
      const color = emitEvent
        ? noteStr.includes("b")
          ? "#06f"
          : "#09f"
        : noteStr.includes("b")
        ? "#ba8900"
        : "#fcba03";
      const created = Date.now();
      setNotes((prev) => {
        return {
          activeNotes: { ...prev.activeNotes, [pitch]: { created } },
          drawedNotes: {
            ...prev.drawedNotes,
            [pitch + "_" + created]: {
              pitch,
              created,
              color,
              ended: null,
            },
          },
        };
      });

      if (emitEvent) socket.emit("note_on", { pitch, velocity });
    },
    [socket, instrument]
  );

  const stopNote = useCallback(
    (pitch, emitEvent) => {
      const noteStr = getNoteFromMidiNumber(pitch);
      instrument.keyUp({ note: noteStr });

      setNotes((prev) => {
        let newActiveNotes = { ...prev.activeNotes },
          newDrawedNotes = { ...prev.drawedNotes };

        if (pitch in newActiveNotes) {
          const { created } = newActiveNotes[pitch];

          newDrawedNotes[pitch + "_" + created].ended = Date.now();
          delete newActiveNotes[pitch];
        }
        return { activeNotes: newActiveNotes, drawedNotes: newDrawedNotes };
      });

      if (emitEvent) socket.emit("note_off", { pitch });
    },
    [socket, instrument]
  );

  const handleMidiMessage = useCallback(
    (msg) => {
      const { command, pitch, velocity } = parseMidiMessage(msg);

      if (command == 11 && pitch == 64) {
        if (velocity == 1) instrument.pedalDown();
        else instrument.pedalUp();
      }

      if (command !== 9 && command !== 8) return;

      const transposedPitch = pitch + transposition * 12;

      if (command === 8 || velocity === 0) stopNote(transposedPitch, true);
      else if (command === 9) playNote(transposedPitch, velocity, true);
    },
    [transposition, instrument, playNote, stopNote]
  );

  useEffect(() => {
    console.debug("Connecting to websocket...");
    const address = process.env.REACT_APP_SOCKET_ADDRESS;
    const ws = socketio.connect(address, { transports: ["websocket"] });
    ws.once("connect", () => {
      console.debug("Websocket connected");
      setSocket(ws);

      ws.on("ping", () => ws.emit("pong"));
    });
  }, []);

  useEffect(() => {
    console.debug("Loading piano sounds...");
    const piano = new TonePiano({ velocities: 5 });
    piano.toDestination();
    piano.load().then(() => {
      setInstrument(piano);
      console.debug("Piano sounds loaded");
    });
  }, []);

  useEffect(() => {
    console.debug("Requesting MIDI access...");
    navigator.requestMIDIAccess().then((access) => {
      setMidiAccess(access);
      console.debug("MIDI access granted");

      // Set initial MIDI input
      const inputs = Array.from(access.inputs.values());
      if (inputs.length > 0) setMidiInput(inputs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handlePlayNote = ({ pitch, velocity }) =>
      playNote(pitch, velocity, false);
    const handleStopNote = ({ pitch }) => stopNote(pitch, false);

    socket.on("note_on", handlePlayNote);
    socket.on("note_off", handleStopNote);

    return () => {
      socket.off("note_on", handlePlayNote);
      socket.off("note_off", handleStopNote);
    };
  }, [socket, playNote, stopNote]);

  useEffect(() => {
    if (!midiAccess || !midiInput) return;

    console.debug("Updating input-output devices", midiInput, midiOutput);

    // Clear callbacks for all devices
    for (const input of midiAccess.inputs.values()) input.onmidimessage = null;

    // Search output device
    let outputDevice = null;
    for (const output of midiAccess.outputs.values())
      if (output.id === midiOutput) outputDevice = output;

    // Set input device
    for (const input of midiAccess.inputs.values())
      if (input.id === midiInput)
        input.onmidimessage = (msg) => {
          // Send output
          if (outputDevice && msg.data[0] !== 254) outputDevice.send(msg.data);

          handleMidiMessage(msg);
        };

    return () => {
      for (const input of midiAccess.inputs.values())
        input.onmidimessage = null;
    };
  }, [midiInput, midiOutput, midiAccess, handleMidiMessage]);

  // const generateRandomNotes = useCallback(
  //   (n) => {
  //     let lastTime = 0;
  //     for (let i = 0; i < n; i++) {
  //       const time = lastTime + Math.random() * 500;
  //       const pitch = (i % 119) + 12;
  //       setTimeout(() => playNote(pitch, 0.5), time);
  //       setTimeout(() => stopNote(pitch), time + 100);
  //       lastTime = time + 100;
  //     }
  //   },
  //   [playNote, stopNote]
  // );

  // useEffect(() => {
  //   if (!instrument) return;

  //   setTimeout(() => generateRandomNotes(1000), 1000);
  // }, [instrument]);

  const handleRemoveNote = useCallback((index) => {
    setNotes((prev) => {
      const newDrawedNotes = { ...prev.drawedNotes };
      delete newDrawedNotes[index];
      return { activeNotes: prev.activeNotes, drawedNotes: newDrawedNotes };
    });
  }, []);

  return (
    <div className="room">
      <RoomHeader
        isPlayingRecording={isPlayingRecording}
        setIsPlayingRecording={setIsPlayingRecording}
        onOpenSettings={() => setShowSettingsSideBar(true)}
        onOpenRecordings={() => setShowRecordingsSideBar(true)}
        onOpenUserInfo={() => setShowUserSideBar(true)}
        username={username}
      />
      <main>
        <Section className="room-name" onClick={() => setShowRoomSideBar(true)}>
          {roomName}
        </Section>
        <PianoWaterfall
          drawedNotes={notes.drawedNotes}
          removeNote={handleRemoveNote}
        />
        <Piano
          octaves={9}
          activeNotes={notes.activeNotes}
          onPlayNote={(pitch, velocity) => playNote(pitch, velocity, true)}
          onStopNote={(pitch) => stopNote(pitch, true)}
          hideNotes
        />
      </main>
      <PrimaryBGSVG className="bg" />
      {showSettingsSideBar && (
        <SettingsSideBar
          midiAccess={midiAccess}
          midiInput={midiInput}
          setMidiInput={setMidiInput}
          midiOutput={midiOutput}
          setMidiOutput={setMidiOutput}
          transposition={transposition}
          setTransposition={setTransposition}
          onExit={() => setShowSettingsSideBar(false)}
        />
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
      {showUserSideBar && (
        <UserSideBar
          onExit={() => setShowUserSideBar(false)}
          username={username}
        />
      )}
    </div>
  );
};

export default ProtectedRoom;
