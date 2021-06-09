import React, { useState, useCallback, useEffect } from "react";
import { Link, Redirect } from "react-router-dom";

import Header from "../../components/Header";

import { ReactComponent as PrimaryBGSVG } from "./assets/bg3.svg";

import { useQuery } from "../../utils";

import { Auth } from "aws-amplify";

import "./SignIn.scss";

const SignIn = () => {
  const query = useQuery();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    try {
      Auth.currentAuthenticatedUser().then((user) => {
        setUsername(user.username);
        setRedirect(true);
      });
    } catch (err) {
      // Do nothing
    }
  }, []);

  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      if (loading) return;

      try {
        setLoading(true);
        await Auth.signIn({ username, password });
        setLoading(false);
        setRedirect(true);
      } catch (error) {
        setLoading(false);
        alert(error.message);
      }
    },
    [username, password, loading]
  );

  if (redirect)
    return <Redirect to={`/room/${query.get("room") ?? username}`} />;

  return (
    <div className="access sign-in">
      <Header />
      <PrimaryBGSVG className="bg" />
      <main>
        <div className="content">
          <h1>Sign in</h1>
          <div className="container">
            <form onSubmit={handleLogin}>
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
                autoComplete="password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
              <p>
                Not registered yet?{" "}
                <Link
                  to={
                    query.has("room")
                      ? `/signup?room=${query.get("room")}`
                      : "/signup"
                  }
                >
                  Sign up
                </Link>
              </p>
              <button>{loading ? "Validating..." : "Login"}</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignIn;
