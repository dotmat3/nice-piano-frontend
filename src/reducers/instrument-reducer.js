export const SET_INSTRUMENT = "setinstrument";
export const SET_INSTRUMENTS_LIST = "setinstrumentslist";
export const SET_VOLUME = "setvolume";

export const setInstrument = (name, instrument) => ({
  type: SET_INSTRUMENT,
  payload: { name, instrument },
});

export const setInstrumentsList = (list) => ({
  type: SET_INSTRUMENTS_LIST,
  payload: { list },
});

export const setVolume = (value) => ({ type: SET_VOLUME, payload: { value } });

export const instrumentReducer = (prevState, action) => {
  switch (action.type) {
    case SET_INSTRUMENT: {
      const { name, instrument } = action.payload;
      return { ...prevState, instrument, instrumentName: name };
    }
    case SET_INSTRUMENTS_LIST: {
      return { ...prevState, instrumentsList: action.payload.list };
    }
    case SET_VOLUME: {
      return { ...prevState, volume: action.payload.value };
    }
  }
};
