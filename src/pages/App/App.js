import React, { useCallback, useEffect, useReducer } from "react";

import socketio from "socket.io-client";
import SoundfontPlayer from "soundfont-player";

import Piano from "../../components/Piano";
import PianoWaterfall from "../../components/PianoWaterfall";
import MenuBar from "../../components/MenuBar";

import { Piano as TonePiano } from "@tonejs/piano";

import {
  formatTime,
  parseMidiMessage,
  getNoteFromMidiNumber,
} from "../../utils";

import "./App.scss";
import {
  combineReducers,
  instrumentReducer,
  noteReducer,
  webSocketReducer,
  metricsReducer,
  midiReducer,
  recordingReducer,
  setRecordingTimer,
  uiReducer,
  startPlayingRecording,
  stopPlayingRecording,
} from "../../reducers";
import {
  addNote,
  removeNote,
  setSocket,
  setInstrument,
  setInstrumentsList,
  setLatency,
  setMidiAccess,
  setMidiInput,
  setMidiOutput,
  setTransposition,
  setVolume,
  removeDrawedNote,
  toggleLooping,
  startRecording,
  stopRecording,
  setMessage,
} from "../../reducers";
import { AUDIO_CONTEXT } from "../../constants";

const DEFAULT_INSTRUMENT = "acoustic_grand_piano";
const INSTRUMENTS_PATH =
  "https://raw.githubusercontent.com/danigb/soundfont-player/master/names/musyngkite.json";

const REDUCERS = [
  noteReducer,
  instrumentReducer,
  webSocketReducer,
  metricsReducer,
  midiReducer,
  recordingReducer,
  uiReducer,
];
const INITIAL_STATE = {
  socket: null,
  instrument: null,
  instrumentName: "",
  instrumentsList: [],
  activeNotes: {},
  drawedNotes: {},

  volume: 1,

  transposition: 0,

  midiAccess: null,
  currentInput: "none",
  currentOutput: "none",

  message: "🎵 Play some notes...",

  isPlayingRecording: false,
  isRecording: false,
  startRecordingTime: null,
  endRecordingTime: null,
  looping: false,
  recordingTimer: null,
  track: [],

  latency: null,
};

const connect = () =>
  new Promise((resolve) => {
    const address = process.env.REACT_APP_SOCKET_ADDRESS;
    const socket = socketio.connect(address, { transports: ["websocket"] });
    socket.once("connect", () => resolve(socket));
  });

const changeInstrument = async (name) => {
  console.debug("Creating virtual instrument...", name);
  const options = { from: "MusyngKite" };
  const instrument = await SoundfontPlayer.instrument(
    AUDIO_CONTEXT,
    name,
    options
  );
  console.debug("Created virtual instrument");
  return instrument;
};

const App = () => {
  const [state, dispatch] = useReducer(
    combineReducers(REDUCERS),
    INITIAL_STATE
  );

  const playNote = useCallback(
    (pitch, velocity, emitEvent) => {
      // const note = state.instrument.play(pitch, AUDIO_CONTEXT.currentTime, {
      //   gain: velocity,
      //   sustain: state.volume,
      //   loop: state.instrumentName !== "acoustic_grand_piano",
      // });
      const noteStr = getNoteFromMidiNumber(pitch);
      state.instrument.keyDown({ note: noteStr, velocity });
      const color = emitEvent
        ? noteStr.includes("b")
          ? "#06f"
          : "#09f"
        : noteStr.includes("b")
        ? "#ba8900"
        : "#fcba03";
      dispatch(addNote(pitch, velocity, color));
      if (emitEvent) state.socket.emit("note_on", { pitch, velocity });
    },
    [state.socket, state.instrument, state.instrumentName, state.volume]
  );

  const stopNote = useCallback(
    (pitch, emitEvent) => {
      dispatch(removeNote(pitch));
      if (emitEvent) state.socket.emit("note_off", { pitch });
    },
    [state.socket]
  );

  /* RECORDING TIMER */
  const startTimer = (startTime) => {
    const interval = setInterval(() => {
      const date = new Date(Date.now() - startTime);
      dispatch(setMessage(formatTime(date)));
    }, 1000);
    dispatch(setRecordingTimer(interval));
    return interval;
  };

  useEffect(() => {
    if (state.isRecording && state.track && state.track.length == 1)
      startTimer(Date.now());
  }, [state.isRecording, state.track]);

  const handleMidiMessage = useCallback(
    (msg) => {
      const { command, pitch, velocity } = parseMidiMessage(msg);

      if (command == 11 && pitch == 64) {
        if (velocity == 1) state.instrument.pedalDown();
        else state.instrument.pedalUp();
      }

      if (command !== 9 && command !== 8) return;

      const transposedPitch = pitch + state.transposition * 12;

      if (command === 8 || velocity === 0) stopNote(transposedPitch, true);
      else if (command === 9) playNote(transposedPitch, velocity, true);
    },
    [state.transposition, state.instrument, playNote, stopNote]
  );

  const onStartRecording = () => {
    console.debug("Recording started...");
    dispatch(startRecording());
  };

  const onStopRecording = () => {
    console.debug("Recording ended...");
    dispatch(stopRecording());
  };

  const onPlayRecording = useCallback(() => {
    const { track, startRecordingTime, endRecordingTime, looping } = state;
    console.debug("Playing recording...", track);

    dispatch(startPlayingRecording());
    const beginTime = Date.now();
    const timer = startTimer(beginTime);
    const lastEvent = track[track.length - 1];
    for (const event of track) {
      const now = Date.now();
      const { type, pitch, velocity, time } = event;
      const timeout = beginTime + time - now;
      setTimeout(() => {
        if (type === "note_on") playNote(pitch, velocity, true);
        else stopNote(pitch, true);

        // Is the last event
        if (event === lastEvent) {
          const recordingDuration = endRecordingTime - startRecordingTime;
          const durationUntilLastEvent = Date.now() - beginTime;
          setTimeout(() => {
            clearInterval(timer);
            dispatch(setRecordingTimer(null));

            // Handle loop or stop
            if (looping) onPlayRecording();
            else {
              dispatch(setMessage("🎵 Play some notes..."));
              dispatch(stopPlayingRecording());
            }
          }, recordingDuration - durationUntilLastEvent);
        }
      }, timeout);
    }
  }, [
    state.track,
    state.startPlayingRecording,
    state.endRecordingTime,
    state.looping,
  ]);

  const onResetRecording = () => {
    console.debug("Stopping recoring...");
    dispatch(setMessage("Stopping recording..."));
    dispatch(stopPlayingRecording());
  };

  useEffect(() => {
    console.debug("Creating socket...");
    connect().then(async (socket) => {
      console.debug("Connected");
      dispatch(setSocket(socket));

      socket.on("ping", () => socket.emit("pong"));
      socket.on("latency", (value) => dispatch(setLatency(value)));

      console.debug("Getting instruments list...");
      const response = await fetch(INSTRUMENTS_PATH);
      const data = await response.json();
      dispatch(setInstrumentsList(data));
      console.debug("Done");

      // Set initial instrument
      // const instrument = await changeInstrument(DEFAULT_INSTRUMENT);
      // dispatch(setInstrument(DEFAULT_INSTRUMENT, instrument));

      // create the piano and load 5 velocity steps
      const piano = new TonePiano({ velocities: 5 });
      //connect it to the speaker output
      piano.toDestination();
      await piano.load();
      dispatch(setInstrument(DEFAULT_INSTRUMENT, piano));

      const access = await navigator.requestMIDIAccess();
      dispatch(setMidiAccess(access));

      // Set initial MIDI input
      const inputs = Array.from(access.inputs.values());
      if (inputs.length > 0) dispatch(setMidiInput(inputs[0].id));
    });
  }, []);

  useEffect(() => {
    if (!state.socket) return;

    const handlePlayNote = ({ pitch, velocity }) =>
      playNote(pitch, velocity, false);
    const handleStopNote = ({ pitch }) => stopNote(pitch, false);

    state.socket.on("note_on", handlePlayNote);
    state.socket.on("note_off", handleStopNote);

    return () => {
      state.socket.off("note_on", handlePlayNote);
      state.socket.off("note_off", handleStopNote);
    };
  }, [state.socket, playNote, stopNote]);

  useEffect(() => {
    const { currentInput, currentOutput, midiAccess } = state;
    if (!midiAccess || !currentInput) return;

    console.debug("Updating input-output devices", currentInput, currentOutput);

    // Clear callbacks for all devices
    for (let input of midiAccess.inputs.values()) input.onmidimessage = null;

    // Search output device
    let outputDevice = null;
    for (let output of midiAccess.outputs.values())
      if (output.id === currentOutput) outputDevice = output;

    // Set input device
    for (let input of midiAccess.inputs.values())
      if (input.id === currentInput)
        input.onmidimessage = (msg) => {
          // Send output
          if (outputDevice && msg.data[0] !== 254) outputDevice.send(msg.data);

          handleMidiMessage(msg);
        };

    return () => {
      for (let input of midiAccess.inputs.values()) input.onmidimessage = null;
    };
  }, [
    state.currentInput,
    state.currentOutput,
    state.midiAccess,
    handleMidiMessage,
  ]);

  return (
    <div className={"App" + (state.isRecording ? " recording" : "")}>
      <header>
        <div style={{ display: "flex" }}>
          <div>
            <p className="message">{state.message}</p>
            <p className="latency">
              Loop: {state.looping ? "ON" : "OFF"} | Latency: {state.latency} ms
            </p>
          </div>
          <div>
            <div style={{ display: "flex", marginTop: "5px" }}>
              <p style={{ fontSize: "16px" }}>Midi input</p>
              <select
                value={state.currentInput}
                onChange={(e) => dispatch(setMidiInput(e.currentTarget.value))}
              >
                {state.midiAccess &&
                  Array.from(state.midiAccess.inputs.values()).map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                <option value="none">None</option>
              </select>
            </div>
            <div style={{ display: "flex", marginTop: "5px" }}>
              <p style={{ fontSize: "16px" }}>Midi output</p>
              <select
                value={state.currentOutput}
                onChange={(e) => dispatch(setMidiOutput(e.currentTarget.value))}
              >
                {state.midiAccess &&
                  Array.from(state.midiAccess.outputs.values()).map(
                    (device) => (
                      <option key={device.id} value={device.id}>
                        {device.name}
                      </option>
                    )
                  )}
                <option value="none">None</option>
              </select>
            </div>
            <div style={{ display: "flex", marginTop: "5px" }}>
              <p style={{ fontSize: "16px" }}>Instrument</p>
              <select
                value={state.instrumentName}
                onChange={(e) => {
                  const name = e.currentTarget.value;
                  changeInstrument(name).then((instrument) =>
                    dispatch(setInstrument(name, instrument))
                  );
                }}
              >
                {state.instrumentsList.map((instr, index) => (
                  <option key={index} value={instr}>
                    {instr}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", marginTop: "5px" }}>
              <p style={{ fontSize: "16px" }}>Transposition</p>
              <input
                type="number"
                value={state.transposition}
                onChange={(e) =>
                  dispatch(setTransposition(e.currentTarget.value))
                }
              />
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "5px",
                alignItems: "center",
              }}
            >
              <p style={{ fontSize: "16px" }}>Volume</p>
              <input
                type="number"
                value={state.volume}
                onChange={(e) => dispatch(setVolume(e.currentTarget.value))}
              />
            </div>
          </div>
        </div>
        <MenuBar
          isRecording={state.isRecording}
          isPlayingRecording={state.isPlayingRecording}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onPlayRecording={onPlayRecording}
          onResetRecording={onResetRecording}
          onLoop={() => dispatch(toggleLooping())}
        />
      </header>
      <PianoWaterfall
        drawedNotes={state.drawedNotes}
        removeNote={(id) => dispatch(removeDrawedNote(id))}
      />
      <Piano
        octaves={9}
        activeNotes={state.activeNotes}
        onPlayNote={(pitch, velocity) => playNote(pitch, velocity, true)}
        onStopNote={(pitch) => stopNote(pitch, true)}
      />
    </div>
  );
};

export default App;
