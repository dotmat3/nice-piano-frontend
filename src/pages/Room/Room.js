import React, { useCallback, useEffect, useState } from "react";
import { Redirect, useParams } from "react-router";

import socketio from "socket.io-client";
import { Piano as TonePiano } from "@tonejs/piano";
import { Auth } from "aws-amplify";
import { useAlert } from "react-alert";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShare } from "@fortawesome/free-solid-svg-icons";

import Section from "../../components/Section";
import RoomHeader from "./RoomHeader";
import PianoWaterfall from "./PianoWaterfall";
import Piano from "../../components/Piano";
import Loading from "../../components/Loading/Loading";

import { ReactComponent as PrimaryBGSVG } from "./assets/bg3.svg";

import SettingsSideBar from "./SettingsSideBar";
import RecordingsSideBar from "./RecordingsSideBar";
import RoomSideBar from "./RoomSideBar";
import UserSideBar from "./UserSideBar";

import {
  generateColor,
  getNoteFromMidiNumber,
  parseMidiMessage,
} from "../../utils";

import "./Room.scss";
import "./SideBar.scss";

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
  const roomId = useParams().id;
  const alert = useAlert();

  const [showSettingsSideBar, setShowSettingsSideBar] = useState(false);
  const [showRecordingsSideBar, setShowRecordingsSideBar] = useState(false);
  const [showRoomSideBar, setShowRoomSideBar] = useState(false);
  const [showUserSideBar, setShowUserSideBar] = useState(false);

  const [ready, setReady] = useState(0);

  const [socket, setSocket] = useState(null);
  const [instrument, setInstrument] = useState(null);
  const [midiAccess, setMidiAccess] = useState(null);
  const [midiInput, setMidiInput] = useState("None");
  const [midiOutput, setMidiOutput] = useState("None");
  const [transposition, setTransposition] = useState(0);
  const [hideNotes, setHideNotes] = useState(true);

  const [notes, setNotes] = useState({ activeNotes: {}, drawedNotes: {} });
  const [users, setUsers] = useState({});

  const [recordings] = useState(TEST_RECORDINGS);
  const [currentRecording, setCurrentRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [looping, setLooping] = useState(false);

  const [timers, setTimers] = useState([]);

  const playNote = useCallback(
    (pitch, velocity, user) => {
      const noteStr = getNoteFromMidiNumber(pitch);
      instrument.keyDown({ note: noteStr, velocity });

      const [h, s, l] = generateColor(user);
      const color = noteStr.includes("b")
        ? `hsl(${h}, 40%, ${l}%)`
        : `hsl(${h}, ${s}%, ${l}%)`;

      const created = performance.now();
      setNotes((prev) => ({
        activeNotes: { ...prev.activeNotes, [pitch + "_" + user]: { created } },
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
          const startTime = prev.startTime ? prev.startTime : performance.now();
          const time = performance.now() - startTime;
          const notes = [
            ...prev.notes,
            { type: "note_on", pitch, velocity, time },
          ];
          return { ...prev, startTime, notes };
        });
      }

      if (user === username) socket.emit("note_on", { pitch, velocity });
    },
    [socket, instrument, isRecording, username]
  );

  const stopNote = useCallback(
    (pitch, user) => {
      const noteStr = getNoteFromMidiNumber(pitch);
      instrument.keyUp({ note: noteStr });

      setNotes((prev) => {
        let newActiveNotes = { ...prev.activeNotes },
          newDrawedNotes = { ...prev.drawedNotes };

        const index = pitch + "_" + user;

        if (index in newActiveNotes) {
          const { created } = newActiveNotes[index];

          newDrawedNotes[pitch + "_" + created].ended = performance.now();

          delete newActiveNotes[index];
        }

        return {
          activeNotes: newActiveNotes,
          drawedNotes: newDrawedNotes,
        };
      });

      if (isRecording) {
        setCurrentRecording((prev) => {
          const time = performance.now() - prev.startTime;
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

      if (user === username) socket.emit("note_off", { pitch });
    },
    [socket, instrument, isRecording, username]
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

      if (command === 8 || velocity === 0) stopNote(transposedPitch, username);
      else if (command === 9) playNote(transposedPitch, velocity, username);
    },
    [transposition, instrument, playNote, stopNote, username]
  );

  // Handle socket events
  useEffect(() => {
    console.debug("Connecting to websocket...");
    const address = process.env.REACT_APP_SOCKET_ADDRESS;
    const ws = socketio.connect(address, { transports: ["websocket"] });
    ws.once("connect", () => {
      console.debug("Websocket connected");
      ws.emit("joinRoom", { username, roomId });
      ws.on("ping", () => ws.emit("pong"));

      // Register user events
      ws.on("latency", ({ username, latency }) => {
        setUsers((users) => ({ ...users, [username]: latency }));
      });

      ws.on("userDisconnected", (username) => {
        setUsers((users) => {
          const newUsers = { ...users };
          delete newUsers[username];
          return newUsers;
        });
      });

      ws.on("newUser", (username) => {
        setUsers((users) => ({ ...users, [username]: null }));
      });

      setSocket(ws);
      setReady((prev) => prev + 1);
    });
    ws.once("connect_error", () =>
      alert.error("Connection with the websocket failed", { timeout: 0 })
    );
  }, [roomId, username, alert]);

  // Handle instrument loading
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

  // Handle MIDI access
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

  // Handle Socket incoming events
  useEffect(() => {
    if (!socket || !instrument) return;

    const handlePlayNote = ({ pitch, velocity, username }) =>
      playNote(pitch, velocity, username);
    const handleStopNote = ({ pitch, username }) => stopNote(pitch, username);

    socket.on("note_on", handlePlayNote);
    socket.on("note_off", handleStopNote);

    return () => {
      socket.off("note_on", handlePlayNote);
      socket.off("note_off", handleStopNote);
    };
  }, [socket, instrument, playNote, stopNote]);

  // Handle MIDI messages
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

  // Random notes
  // const timerRef = useRef(null);
  // const generateRandomNote = useCallback(() => {
  //   const pitch = Math.floor(21 + Math.random() * (108 - 21));
  //   playNote(pitch, 0.5, username);
  //   setTimeout(() => stopNote(pitch, username), Math.random() * 50);
  // }, [playNote, stopNote, username]);

  // useEffect(() => {
  //   if (!instrument) return;

  //   timerRef.current = setInterval(() => generateRandomNote(), 50);
  //   return () => {
  //     clearInterval(timerRef.current);
  //   };
  // }, [instrument, generateRandomNote]);

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
    const beginTime = performance.now();

    const timers = [];
    for (const event of track) {
      const now = performance.now();
      const { type, pitch, velocity, time } = event;
      const timeout = beginTime + time - now;

      const timer = setTimeout(() => {
        if (type === "note_on") playNote(pitch, velocity, username);
        else stopNote(pitch, username);
      }, timeout);

      timers.push(timer);
    }

    setTimers((prev) => [...prev, ...timers]);

    const duration = currentRecording.endTime - currentRecording.startTime;
    const lastTimer = setTimeout(() => {
      // Handle loop or stop
      if (looping) onPlayRecording();
      else setIsPlayingRecording(false);
    }, beginTime + duration - performance.now());

    setTimers((prev) => [...prev, lastTimer]);
  }, [currentRecording, looping, playNote, stopNote, username]);

  const onResetRecording = useCallback(() => {
    timers.forEach(clearTimeout);
    Object.keys(notes.activeNotes).forEach((index) =>
      stopNote(index.split("_")[0], username)
    );
    setIsPlayingRecording(false);
  }, [timers, notes, stopNote, username]);

  const onStopRecording = useCallback(() => {
    setCurrentRecording((prev) => ({ ...prev, endTime: performance.now() }));
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

  const handlePlayNote = useCallback(
    (pitch) => playNote(pitch, 0.5, username),
    [playNote, username]
  );

  const handleStopNote = useCallback(
    (pitch) => stopNote(pitch, username),
    [stopNote, username]
  );

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
        <Section
          className="row details"
          onClick={() => setShowRoomSideBar(true)}
        >
          <span>Room Details</span>
          <FontAwesomeIcon icon={faShare} color="var(--primary)" size="lg" />
        </Section>
        <PianoWaterfall
          drawedNotes={notes.drawedNotes}
          removeNote={handleRemoveNote}
          startPitch={21}
          endPitch={108}
        />
        <Piano
          startPitch={21}
          endPitch={108}
          activeNotes={notes.activeNotes}
          onPlayNote={handlePlayNote}
          onStopNote={handleStopNote}
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
          roomId={roomId}
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
