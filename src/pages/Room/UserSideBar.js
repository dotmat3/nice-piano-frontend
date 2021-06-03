import React, { useState, useCallback } from "react";

import { Auth } from "aws-amplify";
import { Redirect } from "react-router";

const UserSideBar = ({ username, onExit }) => {
  const [redirect, setRedirect] = useState(false);

  const handleSignOut = useCallback(async () => {
    await Auth.signOut();
    setRedirect(true);
  }, []);

  if (redirect) return <Redirect to="/" />;

  return (
    <>
      <div className="right-side-bar user">
        <h1>{username}</h1>
        <button className="sign-out" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
      <div className="overlay" onClick={onExit}></div>
    </>
  );
};

export default UserSideBar;
