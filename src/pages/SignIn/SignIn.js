import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { useCallback } from "react/cjs/react.development";

import Header from "../../components/Header";

import { ReactComponent as PrimaryBGSVG } from "./assets/bg3.svg";

import "./SignIn.scss";

const SignIn = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [redirect, setRedirect] = useState(false);

  const handleLogin = useCallback(() => {
    setRedirect(true);
  }, []);

  if (redirect) return <Redirect to="/room/123" />;

  return (
    <div className="access sign-in">
      <Header />
      <PrimaryBGSVG className="bg" />
      <main>
        <div className="content">
          <h1>Sign in</h1>
          <div className="container">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
            />
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <p>
              Not registered yet? <Link to="signup">Sign up</Link>
            </p>
            <button onClick={handleLogin}>Login</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignIn;
