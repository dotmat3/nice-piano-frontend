import React, { useCallback, useState, useMemo } from "react";
import { Link, Redirect } from "react-router-dom";

import Header from "../../components/Header";

import { ReactComponent as PrimaryBGSVG } from "./assets/bg3.svg";

import { useQuery } from "../../utils";

import { Auth } from "aws-amplify";

const SignUp = () => {
  const query = useQuery();
  console.log(query.get("room"));

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [redirect, setRedirect] = useState(false);

  const signUp = useCallback(
    async (e) => {
      e.preventDefault();

      if (password !== confirmPassword) {
        alert("Password and confirm password are different!");
        return false;
      }

      console.debug("Signup with username", username, "and password", password);

      try {
        const { user } = await Auth.signUp({ username, password });
        console.debug(user);
        setRedirect(true);
      } catch (error) {
        alert(error.message);
      }
    },
    [username, password, confirmPassword]
  );

  const signInURL = useMemo(
    () => (query.has("room") ? `/signin?room=${query.get("room")}` : "/signin"),
    [query]
  );

  if (redirect) return <Redirect to={signInURL} />;

  return (
    <div className="access sign-up">
      <Header />
      <PrimaryBGSVG className="bg" />
      <main>
        <div className="content">
          <h1>Sign up</h1>
          <div className="container">
            <form onSubmit={signUp}>
              <label>Username</label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
              />
              <label>Password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
              <label>Confirm Password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              />
              <p>
                Already registered? <Link to={signInURL}>Sign in</Link>
              </p>
              <button>Register</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUp;
