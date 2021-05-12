import React, { useCallback, useEffect, useState } from "react";

import SoundfontPlayer from "soundfont-player";
import socketio from "socket.io-client";

import Piano from "../../components/Piano";
import PianoWaterfall from "../../components/PianoWaterfall";
import MenuBar from "../../components/MenuBar";

import { formatTime, parseMidiMessage } from "../../utils";

import "./App.scss";

const ac = new AudioContext();
const DEFAULT_INSTRUMENT = "acoustic_grand_piano";
const INSTRUMENTS_PATH =
  "https://raw.githubusercontent.com/danigb/soundfont-player/master/names/musyngkite.json";
const SUSTAIN_DELAY = 1000;

const App = () => {
  const [socket, setSocket] = useState(null);
  const [instrument, setInstrument] = useState(null);
  const [instrumentName, setInstrumentName] = useState("");
  const [instrumentsList, setInstrumentsList] = useState([]);
  const [activeNotes, setActiveNotes] = useState({});

  // Volume
  const [volume, setVolume] = useState(1);

  // Sustain
  const [sustain, setSustain] = useState(false);

  // Transpose
  const [transposition, setTransposition] = useState(0);

  // Midi Input/Output
  const [midiAccess, setMidiAccess] = useState(null);
  const [currentInput, setCurrentInput] = useState("none");
  const [currentOutput, setCurrentOutput] = useState("none");

  const [message, setMessage] = useState("🎵 Play some notes...");

  // Recording
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [startRecordingTime, setStartRecordingTime] = useState(null);
  const [endRecordingTime, setEndRecordingTime] = useState(null);
  const [looping, setLooping] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(null);
  const [track, setTrack] = useState([]);

  // Metrics
  const [latency, setLatency] = useState(null);

  const startTimer = (startTime) => {
    const interval = setInterval(() => {
      const date = new Date(Date.now() - startTime);
      setMessage(formatTime(date));
    }, 1000);
    setRecordingTimer(interval);

    return interval;
  };

  const onPlayNote = useCallback(
    (pitch, velocity, emitEvent) => {
      if (velocity === null || velocity === undefined) velocity = 1;

      const note = instrument.play(pitch, ac.currentTime, {
        gain: velocity,
        sustain: volume,
        loop: 1,
      });
      setActiveNotes((prev) => {
        return { ...prev, [pitch.toString()]: note };
      });

      if (isRecording) {
        if (track.length === 0) {
          const startTime = Date.now();
          setStartRecordingTime(startTime);
          startTimer(startTime);
          setTrack((prev) => [
            ...prev,
            { type: "note_on", pitch, velocity, time: 0 },
          ]);
        } else {
          const delta = Date.now() - startRecordingTime;
          setTrack((prev) => [
            ...prev,
            { type: "note_on", pitch, velocity, time: delta },
          ]);
        }
      }

      if (emitEvent) socket.emit("note_on", { pitch, velocity });
    },
    [socket, volume, isRecording, startRecordingTime, instrument, track]
  );

  const onStopNote = useCallback(
    (pitch, emitEvent) => {
      if (emitEvent) socket.emit("note_off", { pitch });

      setActiveNotes((prev) => {
        if (pitch in prev) {
          const note = prev[pitch];
          if (sustain) setTimeout(() => note.stop(), SUSTAIN_DELAY * volume);
          else note.stop();
          delete prev[pitch];
        }
        return { ...prev };
      });

      if (isRecording) {
        const delta = Date.now() - startRecordingTime;
        setTrack((prev) => [
          ...prev,
          { type: "note_off", pitch, velocity: 0, time: delta },
        ]);
      }
    },
    [socket, isRecording, startRecordingTime]
  );

  const handleMidiMessage = useCallback(
    (msg) => {
      const { command, pitch, velocity } = parseMidiMessage(msg);

      if (command !== 9 && command !== 8) return;

      const transposedPitch = pitch + transposition * 12;

      if (command === 8 || velocity === 0) onStopNote(transposedPitch, true);
      else if (command === 9) onPlayNote(transposedPitch, velocity, true);
    },
    [transposition, onPlayNote, onStopNote]
  );

  const onStartRecording = () => {
    console.debug("Recording started...");
    setTrack([]);
    setStartRecordingTime(null);
    setEndRecordingTime(null);
    setMessage("00:00:00");
    setIsRecording(true);
  };

  const onStopRecording = () => {
    console.debug("Recording ended...", track);
    setIsRecording(false);
    setEndRecordingTime(Date.now());
    clearInterval(recordingTimer);
    setRecordingTimer(null);
    setMessage("🎵 Play some notes...");
  };

  const onPlayRecording = useCallback(() => {
    console.debug("Playing recording...", track);
    setIsPlayingRecording(true);

    const beginTime = Date.now();
    const timer = startTimer(beginTime);

    const lastEvent = track[track.length - 1];

    for (const event of track) {
      const now = Date.now();
      const { type, pitch, velocity, time } = event;

      const timeout = beginTime + time - now;

      setTimeout(() => {
        if (type === "note_on") onPlayNote(pitch, velocity, true);
        else onStopNote(pitch, true);

        // Is the last event
        if (event === lastEvent) {
          const recordingDuration = endRecordingTime - startRecordingTime;
          const durationUntilLastEvent = Date.now() - beginTime;
          setTimeout(() => {
            clearInterval(timer);

            // Handle loop or stop
            if (looping) onPlayRecording();
            else {
              setMessage("🎵 Play some notes...");
              setIsPlayingRecording(false);
            }
          }, recordingDuration - durationUntilLastEvent);
        }
      }, timeout);
    }
  }, [
    track,
    looping,
    endRecordingTime,
    startRecordingTime,
    onPlayNote,
    onStopNote,
  ]);

  const onResetRecording = () => {
    console.debug("Stopping recoring...");
    setMessage("Stopping recording...");
    setIsPlayingRecording(false);
  };

  const changeInstrument = async (name) => {
    console.debug("Creating virtual instrument...", name);
    const options = { from: "MusyngKite" };
    const instrument = await SoundfontPlayer.instrument(ac, name, options);
    console.debug("Created virtual instrument");
    setInstrumentName(name);
    setInstrument(instrument);
  };

  useEffect(() => {
    console.debug("Creating socket...");
    const address = "wss://151.15.81.174:5000";
    const socket = socketio.connect(address, { transports: ["websocket"] });
    setSocket(socket);
    console.debug("Connecting...");

    socket.on("connect", async () => {
      console.debug("Connected");

      console.debug("Getting instruments list...");
      const response = await fetch(INSTRUMENTS_PATH);
      const data = await response.json();
      setInstrumentsList(data);
      console.debug("Done");

      // Set initial instrument
      await changeInstrument(DEFAULT_INSTRUMENT);

      const access = await navigator.requestMIDIAccess();
      setMidiAccess(access);

      // Set initial MIDI input
      const inputs = Array.from(access.inputs.values());
      if (inputs.length > 0) setCurrentInput(inputs[0].id);
    });

    socket.on("ping", () => socket.emit("pong"));
    socket.on("latency", setLatency);
  }, []);

  useEffect(() => {
    if (!socket || !instrument) return;

    const handleNoteOn = (data) => onPlayNote(data.pitch, data.velocity);
    const handleNoteOff = (data) => onStopNote(data.pitch);

    socket.on("note_on", handleNoteOn);
    socket.on("note_off", handleNoteOff);

    return () => {
      socket.off("note_on", handleNoteOn);
      socket.off("note_off", handleNoteOff);
    };
  }, [socket, instrument, isRecording]);

  useEffect(() => {
    if (!midiAccess || !currentInput) return;

    console.debug("Updating input-output devices", currentInput, currentOutput);

    // Clear callbacks for all devices
    for (let input of midiAccess.inputs.values())
      input.onmidimessage = () => {};

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
      for (let input of midiAccess.inputs.values())
        input.onmidimessage = () => {};
    };
  }, [currentInput, currentOutput, midiAccess, handleMidiMessage]);

  return (
    <div className={"App" + (isRecording ? " recording" : "")}>
      <header>
        <div style={{ display: "flex" }}>
          <div>
            <p className="message">{message}</p>
            <p className="latency">
              Loop: {looping ? "ON" : "OFF"} | Latency: {latency} ms
            </p>
          </div>
          <div>
            <div style={{ display: "flex", marginTop: "5px" }}>
              <p style={{ fontSize: "16px" }}>Midi input</p>
              <select
                value={currentInput}
                onChange={(e) => setCurrentInput(e.currentTarget.value)}
              >
                {midiAccess &&
                  Array.from(midiAccess.inputs.values()).map((device) => (
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
                value={currentOutput}
                onChange={(e) => setCurrentOutput(e.currentTarget.value)}
              >
                {midiAccess &&
                  Array.from(midiAccess.outputs.values()).map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                <option value="none">None</option>
              </select>
            </div>
            <div style={{ display: "flex", marginTop: "5px" }}>
              <p style={{ fontSize: "16px" }}>Instrument</p>
              <select
                value={instrumentName}
                onChange={(e) => changeInstrument(e.currentTarget.value)}
              >
                {instrumentsList.map((instr, index) => (
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
                value={transposition}
                onChange={(e) => setTransposition(e.currentTarget.value)}
              />
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "5px",
                alignItems: "center",
              }}
            >
              <p style={{ fontSize: "16px" }}>Sustain</p>
              <input
                type="checkbox"
                value={sustain}
                onChange={(e) => setSustain(e.currentTarget.value)}
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
                value={volume}
                onChange={(e) => setVolume(e.currentTarget.value)}
              />
            </div>
          </div>
        </div>
        <MenuBar
          isRecording={isRecording}
          isPlayingRecording={isPlayingRecording}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onPlayRecording={onPlayRecording}
          onResetRecording={onResetRecording}
          onLoop={() => setLooping(!looping)}
        />
      </header>
      <PianoWaterfall octaves={9} />
      <Piano
        octaves={9}
        activeNotes={activeNotes}
        onPlayNote={onPlayNote}
        onStopNote={onStopNote}
      />
    </div>
  );
};

export default App;
