import { getNoteFromMidiNumber } from "../utils";

export const ON_NOTE_PRESSED = "onnotepressed";
export const ON_NOTE_RELEASED = "onnotereleased";
export const REMOVE_DRAWED_NOTE = "removedrawednote";

export const addNote = (pitch, velocity, color) => ({
  type: ON_NOTE_PRESSED,
  payload: { pitch, velocity, color },
});

export const removeNote = (pitch) => ({
  type: ON_NOTE_RELEASED,
  payload: { pitch },
});

export const removeDrawedNote = (index) => ({
  type: REMOVE_DRAWED_NOTE,
  payload: { index },
});

export const noteReducer = (prevState, action) => {
  switch (action.type) {
    case ON_NOTE_PRESSED: {
      const {
        isRecording,
        activeNotes,
        drawedNotes,
        track,
        startRecordingTime,
      } = prevState;
      const { pitch, velocity, color } = action.payload;

      const created = Date.now();
      const newActiveNotes = {
        ...activeNotes,
        [pitch]: { created },
      };
      const newDrawedNotes = {
        ...drawedNotes,
        [pitch + "_" + created]: { pitch, created, color, ended: null },
      };

      let newStartRecordingTime = startRecordingTime,
        newTrack = { ...track };

      if (isRecording) {
        if (track.length === 0) {
          newStartRecordingTime = Date.now();
          newTrack.push({ type: "note_on", pitch, velocity, time: 0 });
        } else {
          const delta = Date.now() - startRecordingTime;
          newTrack.push({ type: "note_on", pitch, velocity, time: delta });
        }
      }

      return {
        ...prevState,
        activeNotes: newActiveNotes,
        drawedNotes: newDrawedNotes,
        startRecordingTime: newStartRecordingTime,
        track: newTrack,
      };
    }
    case ON_NOTE_RELEASED: {
      const {
        isRecording,
        startRecordingTime,
        activeNotes,
        drawedNotes,
        track,
      } = prevState;
      const { pitch } = action.payload;

      let newActiveNotes = { ...activeNotes },
        newDrawedNotes = { ...drawedNotes };

      // This is a side-effect but it will not do anything strange (I think)
      if (pitch in newActiveNotes) {
        const { created } = newActiveNotes[pitch];
        // note.stop();
        const noteStr = getNoteFromMidiNumber(pitch);
        prevState.instrument.keyUp({ note: noteStr });

        newDrawedNotes[pitch + "_" + created].ended = Date.now();
      }

      delete newActiveNotes[pitch];

      let newTrack = { ...track };

      if (isRecording) {
        const delta = Date.now() - startRecordingTime;
        newTrack.push({
          type: "note_off",
          pitch,
          velocity: 0,
          time: delta,
        });
      }

      return {
        ...prevState,
        activeNotes: newActiveNotes,
        drawedNotes: newDrawedNotes,
        track: newTrack,
      };
    }
    case REMOVE_DRAWED_NOTE: {
      const { drawedNotes } = prevState;
      const { index } = action.payload;

      if (!Object.keys(drawedNotes).includes(index)) return prevState;

      let newDrawedNotes = { ...drawedNotes };
      delete newDrawedNotes[index];

      return {
        ...prevState,
        drawedNotes: newDrawedNotes,
      };
    }
  }
};
