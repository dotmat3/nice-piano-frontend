export const TOGGLE_LOOPING = "togglelooping";
export const START_RECORDING = "startrecording";
export const STOP_RECORDING = "stoprecording";
export const SET_RECORDING_TIMER = "setrecordingtimer";
export const START_PLAYING_RECORDING = "startplayingrecording";
export const STOP_PLAYING_RECORDING = "stopplayingrecording";

export const toggleLooping = () => ({ type: TOGGLE_LOOPING });
export const startRecording = () => ({ type: START_RECORDING });
export const stopRecording = () => ({ type: STOP_RECORDING });
export const setRecordingTimer = (timer) => ({
  type: SET_RECORDING_TIMER,
  payload: { timer },
});
export const startPlayingRecording = () => ({ type: START_PLAYING_RECORDING });
export const stopPlayingRecording = () => ({ type: STOP_PLAYING_RECORDING });

export const recordingReducer = (prevState, action) => {
  switch (action.type) {
    case TOGGLE_LOOPING: {
      return { ...prevState, looping: !prevState.looping };
    }
    case START_RECORDING: {
      return {
        ...prevState,
        track: [],
        startRecordingTime: null,
        endRecordingTime: null,
        message: "00:00:00",
        isRecording: true,
      };
    }
    case STOP_RECORDING: {
      clearInterval(prevState.recordingTimer);
      return {
        ...prevState,
        recordingTimer: null,
        endRecordingTime: Date.now(),
        message: "🎵 Play some notes...",
        isRecording: false,
      };
    }
    case SET_RECORDING_TIMER: {
      return { ...prevState, recordingTimer: action.payload.timer };
    }
    case START_PLAYING_RECORDING: {
      return { ...prevState, isPlayingRecording: true };
    }
    case STOP_PLAYING_RECORDING: {
      return { ...prevState, isPlayingRecording: false };
    }
  }
};
