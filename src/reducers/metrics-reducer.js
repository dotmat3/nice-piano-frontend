export const SET_LATENCY = "setlatency";

export const setLatency = (value) => ({
  type: SET_LATENCY,
  payload: { value },
});

export const metricsReducer = (prevState, action) => {
  switch (action.type) {
    case SET_LATENCY: {
      return { ...prevState, latency: action.payload.value };
    }
  }
};
