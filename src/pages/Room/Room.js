import React, { useCallback, useEffect, useState } from "react";
import { Redirect } from "react-router";

import socketio from "socket.io-client";
import { Piano as TonePiano } from "@tonejs/piano";
import { Auth, input } from "aws-amplify";

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
import Loading from "../../components/Loading/Loading";

// TODO: REMOVE THIS
const TEST_USERS = {
  dotmat: 3,
  skylion: 7,
  test: 10,
  test2: 22,
  dotmat1: 3,
  skylion1: 7,
  test1: 10,
  test12: 22,
  dotmat2: 3,
  skylion2: 7,
  test22: 10,
};

const TEST_RECORDINGS = [
  {
    name: "Sample 1",
    startTime: Date.now(),
    endTime: Date.now() + 100,
    notes: [
      { type: "note_on", pitch: 42, velocity: 0.5, time: 0 },
      { type: "note_off", pitch: 42, time: 100 },
    ],
  },
  {
    name: "Sample 2",
    startTime: Date.now(),
    endTime: Date.now() + 200,
    notes: [
      { type: "note_on", pitch: 42, velocity: 0.5, time: 0 },
      { type: "note_off", pitch: 42, time: 200 },
    ],
  },
  {
    name: "Sample 3",
    startTime: Date.now(),
    endTime: Date.now() + 300,
    notes: [
      { type: "note_on", pitch: 42, velocity: 0.5, time: 0 },
      { type: "note_off", pitch: 42, time: 100 },
      { type: "note_on", pitch: 42, velocity: 0.5, time: 100 },
      { type: "note_off", pitch: 42, time: 200 },
      { type: "note_on", pitch: 42, velocity: 0.5, time: 200 },
      { type: "note_off", pitch: 42, time: 300 },
    ],
  },
];

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

  if (loading) return <Loading />;

  return username ? <Room username={username} /> : <Redirect to="/signin" />;
};

const Room = ({ username }) => {
  const [showSettingsSideBar, setShowSettingsSideBar] = useState(false);
  const [showRecordingsSideBar, setShowRecordingsSideBar] = useState(false);
  const [showRoomSideBar, setShowRoomSideBar] = useState(false);
  const [showUserSideBar, setShowUserSideBar] = useState(false);

  const [ready, setReady] = useState(0);

  const [roomName] = useState("BellaRoom");
  const [socket, setSocket] = useState(null);
  const [instrument, setInstrument] = useState(null);
  const [midiAccess, setMidiAccess] = useState(null);
  const [midiInput, setMidiInput] = useState("None");
  const [midiOutput, setMidiOutput] = useState("None");
  const [transposition, setTransposition] = useState(0);
  const [hideNotes, setHideNotes] = useState(true);

  const [notes, setNotes] = useState({ activeNotes: {}, drawedNotes: {} });
  const [users] = useState(TEST_USERS);

  const [recordings] = useState(TEST_RECORDINGS);
  const [currentRecording, setCurrentRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [looping, setLooping] = useState(false);

  const [timers, setTimers] = useState([]);

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
      setNotes((prev) => ({
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
      }));

      if (isRecording) {
        setCurrentRecording((prev) => {
          const startTime = prev.startTime ? prev.startTime : Date.now();
          const time = Date.now() - startTime;
          const notes = [
            ...prev.notes,
            { type: "note_on", pitch, velocity, time },
          ];
          return { ...prev, startTime, notes };
        });
      }

      if (emitEvent) socket.emit("note_on", { pitch, velocity });
    },
    [socket, instrument, isRecording]
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

        return {
          activeNotes: newActiveNotes,
          drawedNotes: newDrawedNotes,
        };
      });

      if (isRecording) {
        setCurrentRecording((prev) => {
          const time = Date.now() - prev.startTime;
          return {
            ...prev,
            notes: [
              ...prev.notes,
              {
                type: "note_off",
                pitch,
                velocity: 0,
                time,
              },
            ],
          };
        });
      }

      if (emitEvent) socket.emit("note_off", { pitch });
    },
    [socket, instrument, isRecording]
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
      setReady((prev) => prev + 1);

      ws.on("ping", () => ws.emit("pong"));
    });
  }, []);

  useEffect(() => {
    console.debug("Loading piano sounds...");
    const piano = new TonePiano({ velocities: 5 });
    piano.toDestination();
    piano.load().then(() => {
      setInstrument(piano);
      setReady((prev) => prev + 1);
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
      const prevMidiInput = localStorage.getItem("prev-midi-input");
      if (prevMidiInput && inputs.find((input) => prevMidiInput === input.id))
        setMidiInput(prevMidiInput);
      else if (inputs.length > 0) setMidiInput(inputs[0].id);

      setReady((prev) => prev + 1);
    });
  }, []);

  useEffect(() => {
    if (!socket || !instrument) return;

    const handlePlayNote = ({ pitch, velocity }) =>
      playNote(pitch, velocity, false);
    const handleStopNote = ({ pitch }) => stopNote(pitch, false);

    socket.on("note_on", handlePlayNote);
    socket.on("note_off", handleStopNote);

    return () => {
      socket.off("note_on", handlePlayNote);
      socket.off("note_off", handleStopNote);
    };
  }, [socket, instrument, playNote, stopNote]);

  useEffect(() => {
    if (!midiAccess || !midiInput || !instrument || !socket) return;

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
  }, [
    midiInput,
    midiOutput,
    midiAccess,
    socket,
    instrument,
    handleMidiMessage,
  ]);

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

  const onPlayRecording = useCallback(() => {
    if (!currentRecording) return;

    setIsPlayingRecording(true);
    const track = currentRecording.notes;
    const beginTime = Date.now();

    const timers = [];
    for (const event of track) {
      const now = Date.now();
      const { type, pitch, velocity, time } = event;
      const timeout = beginTime + time - now;

      const timer = setTimeout(() => {
        if (type === "note_on") playNote(pitch, velocity, true);
        else stopNote(pitch, true);
      }, timeout);

      timers.push(timer);
    }

    setTimers((prev) => [...prev, ...timers]);

    const duration = currentRecording.endTime - currentRecording.startTime;
    const lastTimer = setTimeout(() => {
      // Handle loop or stop
      if (looping) onPlayRecording();
      else setIsPlayingRecording(false);
    }, beginTime + duration - Date.now());

    setTimers((prev) => [...prev, lastTimer]);
  }, [currentRecording, looping, playNote, stopNote]);

  const onResetRecording = useCallback(() => {
    timers.forEach(clearTimeout);
    Object.keys(notes.activeNotes).forEach((pitch) => stopNote(pitch, true));
    setIsPlayingRecording(false);
  }, [timers, notes, stopNote]);

  const onStopRecording = useCallback(() => {
    setCurrentRecording((prev) => ({ ...prev, endTime: Date.now() }));
    setIsRecording(false);
  }, []);

  const onStartRecording = useCallback(() => {
    setIsRecording(true);
    setCurrentRecording({
      name: "New Sample",
      startTime: null,
      endTime: null,
      notes: [],
    });
  }, []);

  if (ready < 3) return <Loading progress={Math.floor((ready * 100) / 3)} />;

  return (
    <div className="room">
      <RoomHeader
        isPlayingRecording={isPlayingRecording}
        onPlayRecording={onPlayRecording}
        onResetRecording={onResetRecording}
        onStopRecording={onStopRecording}
        onStartRecording={onStartRecording}
        isRecording={isRecording}
        isLooping={looping}
        onToggleLooping={() => setLooping(!looping)}
        onOpenSettings={() => setShowSettingsSideBar(true)}
        onOpenRecordings={() => setShowRecordingsSideBar(true)}
        onOpenUserInfo={() => setShowUserSideBar(true)}
        currentRecording={currentRecording}
        username={username}
        users={users}
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
          hideNotes={hideNotes}
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
          hideNotes={hideNotes}
          setHideNotes={setHideNotes}
          onExit={() => setShowSettingsSideBar(false)}
        />
      )}
      {showRecordingsSideBar && (
        <RecordingsSideBar
          recordings={recordings}
          onRecordingSelected={(value) => setCurrentRecording(value)}
          onExit={() => setShowRecordingsSideBar(false)}
        />
      )}
      {showRoomSideBar && (
        <RoomSideBar
          roomName={roomName}
          users={users}
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
