export const SET_MESSAGE = "setmessage";

export const setMessage = (message) => ({
  type: SET_MESSAGE,
  payload: { message },
});

export const uiReducer = (prevState, action) => {
  switch (action.type) {
    case SET_MESSAGE: {
      return { ...prevState, message: action.payload.message };
    }
  }
};
