export const SET_SOCKET = "setsocket";

export const setSocket = (socket) => ({
  type: SET_SOCKET,
  payload: { socket },
});

export const webSocketReducer = (prevState, action) => {
  switch (action.type) {
    case SET_SOCKET: {
      return { ...prevState, socket: action.payload.socket };
    }
  }
};
