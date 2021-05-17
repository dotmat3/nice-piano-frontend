export const combineReducers = (reducers) => (prevState, action) =>
  reducers.reduce((acc, fn) => ({ ...acc, ...fn(acc, action) }), prevState);

export * from "./note-reducer";
export * from "./instrument-reducer";
export * from "./web-socket-reducer";
export * from "./metrics-reducer";
export * from "./midi-reducer";
export * from "./recording-reducer";
export * from "./ui-reducer";
