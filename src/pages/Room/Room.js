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

import { generateColor, parseMidiMessage, hslToHex, isFlat } from "../../utils";

import "./Room.scss";
import "./SideBar.scss";

const ProtectedRoom = () => {
  const roomId = useParams().id;

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

  return username ? (
    <Room username={username} />
  ) : (
    <Redirect to={`/signin?room=${roomId}`} />
  );
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

  const [recordings, setRecordings] = useState([]);
  const [currentRecording, setCurrentRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [looping, setLooping] = useState(false);

  const [timers, setTimers] = useState([]);

  const [startPitch, setStartPitch] = useState(21);
  const [endPitch, setEndPitch] = useState(108);

  useEffect(() => {
    const resizePiano = () => {
      const width = window.innerWidth;

      if (width > 1650) {
        setStartPitch(21);
        setEndPitch(108);
        return;
      }

      if (width > 1350) {
        setStartPitch(36);
        setEndPitch(108);
        return;
      }

      if (width > 1150) {
        setStartPitch(36);
        setEndPitch(96);
        return;
      }

      if (width > 950) {
        setStartPitch(36);
        setEndPitch(84);
        return;
      }

      if (width > 750) {
        setStartPitch(48);
        setEndPitch(84);
        return;
      }

      if (width > 550) {
        setStartPitch(48);
        setEndPitch(72);
        return;
      }

      setStartPitch(60);
      setEndPitch(72);
      return;
    };

    resizePiano();
    window.onresize = resizePiano;

    return () => (window.onresize = null);
  }, []);

  const playNote = useCallback(
    (pitch, velocity, user) => {
      instrument.keyDown({ midi: pitch, velocity });

      const [h, s, l] = generateColor(user);
      const color = isFlat(pitch) ? hslToHex(h, 40, l) : hslToHex(h, s, l);

      const created = performance.now();
      setNotes((prev) => {
        const index = pitch + "_" + user;
        let newNote, newDrawedNotes;
        if (index in prev.activeNotes) {
          newNote = {
            ...prev.activeNotes[index],
            count: prev.activeNotes[index].count + 1,
          };
          newDrawedNotes = prev.drawedNotes;
        } else {
          newNote = { created, count: 1 };
          newDrawedNotes = {
            ...prev.drawedNotes,
            [pitch + "_" + created]: {
              pitch,
              created,
              color,
              ended: null,
            },
          };
        }

        return {
          activeNotes: { ...prev.activeNotes, [index]: newNote },
          drawedNotes: newDrawedNotes,
        };
      });

      if (isRecording) {
        setCurrentRecording((prev) => {
          const recordingTime = prev.recordingTime ?? Date.now();
          const time = Date.now() - recordingTime;
          const notes = [
            ...prev.notes,
            { type: "note_on", pitch, velocity, time },
          ];
          return { ...prev, recordingTime, notes };
        });
      }

      if (user === username) socket.emit("note_on", { pitch, velocity });
    },
    [socket, instrument, isRecording, username]
  );

  const stopNote = useCallback(
    (pitch, user) => {
      instrument.keyUp({ midi: pitch });

      setNotes((prev) => {
        let newActiveNotes = { ...prev.activeNotes },
          newDrawedNotes = { ...prev.drawedNotes };

        const index = pitch + "_" + user;

        if (index in newActiveNotes) {
          const updatedNote = {
            ...newActiveNotes[index],
            count: newActiveNotes[index].count - 1,
          };
          newActiveNotes[index] = updatedNote;
          if (newActiveNotes[index].count == 0) {
            const { created } = newActiveNotes[index];
            newDrawedNotes[pitch + "_" + created].ended = performance.now();
            delete newActiveNotes[index];
          }
        }

        return {
          activeNotes: newActiveNotes,
          drawedNotes: newDrawedNotes,
        };
      });

      if (isRecording) {
        setCurrentRecording((prev) => {
          const time = Date.now() - prev.recordingTime;
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
      alert.error("Connection with the websocket failed")
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

  // Get user recordings
  useEffect(() => {
    if (!socket) return;

    socket.emit("getRecordings");
    socket.once("recordingsList", setRecordings);
  }, [socket]);

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
        if (type === "note_on") playNote(pitch, velocity, username);
        else stopNote(pitch, username);
      }, timeout);

      timers.push(timer);
    }

    setTimers((prev) => [...prev, ...timers]);

    const duration = currentRecording.endTime - currentRecording.recordingTime;
    const lastTimer = setTimeout(() => {
      // Handle loop or stop
      if (looping) onPlayRecording();
      else setIsPlayingRecording(false);
    }, beginTime + duration - Date.now());

    setTimers((prev) => [...prev, lastTimer]);
  }, [currentRecording, looping, playNote, stopNote, username]);

  const onResetRecording = useCallback(() => {
    timers.forEach(clearTimeout);
    Object.keys(notes.activeNotes).forEach((index) =>
      stopNote(parseInt(index.split("_")[0]), username)
    );
    setIsPlayingRecording(false);
  }, [timers, notes, stopNote, username]);

  const onStopRecording = useCallback(() => {
    setIsRecording(false);
    if (!currentRecording.recordingTime) {
      setCurrentRecording(null);
      return;
    }

    const endTime = Date.now();
    const newRecording = { ...currentRecording, endTime };
    setCurrentRecording(newRecording);
    if (socket) {
      console.debug("Sending recording to the server");
      socket.emit("saveRecording", newRecording);
      socket.once("recordingSaved", () => {
        setRecordings((prev) => [...prev, newRecording]);
        alert.success("Recording saved with success");
      });
      socket.once("recordingSaveError", (msg) => alert.error(msg));
    }
  }, [socket, currentRecording, alert]);

  const onStartRecording = useCallback(() => {
    setIsRecording(true);
    setCurrentRecording({
      name: "New Sample",
      recordingTime: null,
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

  const handleRecordingDelete = useCallback(
    (deleteRecordingTime) => {
      setRecordings((prev) =>
        prev.filter(
          ({ recordingTime }) => recordingTime !== deleteRecordingTime
        )
      );
      socket.emit("deleteRecording", deleteRecordingTime);
      socket.once("recordingDeleted", () => {
        setCurrentRecording(null);
        alert.success("Recording successfully deleted");
      });
      socket.once("recordingDeleteError", (error) => {
        alert.error(error);
      });
    },
    [alert, socket]
  );

  const handleRecordingNameUpdate = useCallback(() => {
    if (!socket) return;

    const { name, recordingTime } = currentRecording;
    console.debug("Updating recording name");
    socket.emit("updateRecordingName", { name, recordingTime });
    socket.once("recordingUpdated", () => {
      alert.success("Name updated with success");
      setRecordings((prev) =>
        prev.map((recording) => {
          if (recording.recordingTime === recordingTime)
            return { ...recording, name };
          return recording;
        })
      );
    });
    socket.once("recordingUpdateError", (msg) => alert.error(msg));
  }, [socket, currentRecording, alert]);

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
        onChangeName={(name) =>
          setCurrentRecording((prev) => ({ ...prev, name }))
        }
        onUpdateName={handleRecordingNameUpdate}
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
          startPitch={startPitch}
          endPitch={endPitch}
        />
        <Piano
          startPitch={startPitch}
          endPitch={endPitch}
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
          onDeleteRecording={handleRecordingDelete}
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
