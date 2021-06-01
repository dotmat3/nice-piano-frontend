import React from "react";

const RoomSideBar = ({ roomName, onExit }) => {
  return (
    <>
      <div className="left-side-bar room-settings">
        <h1>{roomName}</h1>
      </div>
      <div className="overlay" onClick={onExit}></div>
    </>
  );
};

export default RoomSideBar;
