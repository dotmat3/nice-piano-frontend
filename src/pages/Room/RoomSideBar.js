import React, { useCallback, useEffect, useState } from "react";

import UserProfile from "../../components/UserProfile";

const RoomSideBar = ({ roomId, users, onExit }) => {
  const [copiedURL, setCopiedURL] = useState(false);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    return () => {
      if (timer) {
        setCopiedURL(false);
        setTimer(null);
        clearTimeout(timer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyURL = useCallback(() => {
    setCopiedURL(true);
    navigator.clipboard.writeText(window.location.href);
    if (timer) {
      setTimer(null);
      clearTimeout(timer);
    }
    const timeout = setTimeout(() => setCopiedURL(false), 1000);
    setTimer(timeout);
  }, [timer]);

  return (
    <>
      <div className="left-side-bar room-settings">
        <h1>Room: {roomId}</h1>
        <button onClick={handleCopyURL}>
          {copiedURL ? "Copied" : "Copy url to clipboard"}
        </button>
        <div className="users-list">
          {users &&
            Object.entries(users).map(([name, latency]) => (
              <UserRow key={name} name={name} latency={latency} />
            ))}
        </div>
      </div>
      <div className="overlay" onClick={onExit}></div>
    </>
  );
};

const UserRow = ({ name, latency }) => {
  return (
    <div className="user-row">
      <UserProfile username={name} />
      <p>{latency ?? "N/A"} ms</p>
    </div>
  );
};

export default RoomSideBar;
