export const SET_MIDI_ACCESS = "setmidiaccess";
export const SET_MIDI_INPUT = "setmidiinput";
export const SET_MIDI_OUTPUT = "setmidioutput";
export const SET_TRANSPOSITION = "settransposition";

export const setTransposition = (value) => ({
  type: SET_TRANSPOSITION,
  payload: { value },
});

export const setMidiAccess = (access) => ({
  type: SET_MIDI_ACCESS,
  payload: { access },
});
export const setMidiInput = (input) => ({
  type: SET_MIDI_INPUT,
  payload: { input },
});
export const setMidiOutput = (output) => ({
  type: SET_MIDI_OUTPUT,
  payload: { output },
});

export const midiReducer = (prevState, action) => {
  switch (action.type) {
    case SET_MIDI_ACCESS: {
      return { ...prevState, midiAccess: action.payload.access };
    }
    case SET_MIDI_INPUT: {
      return { ...prevState, currentInput: action.payload.input };
    }
    case SET_MIDI_OUTPUT: {
      return { ...prevState, currentOutput: action.payload.output };
    }
    case SET_TRANSPOSITION: {
      return { ...prevState, transposition: action.payload.value };
    }
  }
};
