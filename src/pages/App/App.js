import React from "react";
import { Route, BrowserRouter as Router, Switch } from "react-router-dom";

import Home from "../Home";
import NotFound from "../NotFound";
import SignIn from "../SignIn";
import SignUp from "../SignUp";
import Room from "../Room";

import { Auth } from "aws-amplify";
import awsConfig from "../../auth";

Auth.configure(awsConfig);

import { transitions, positions, Provider as AlertProvider } from "react-alert";
import AlertTemplate from "../../components/Alert";

import "./App.scss";

const alertOptions = {
  position: positions.TOP_CENTER,
  timeout: 5000,
  offset: "130px",
  transition: transitions.SCALE,
  containerStyle: {
    zIndex: 10000,
  },
};

const App = () => {
  return (
    <AlertProvider template={AlertTemplate} {...alertOptions}>
      <Router>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/signin" exact component={SignIn} />
          <Route path="/signup" exact component={SignUp} />
          <Route path="/room/:id" exact component={Room} />
          <Route path="*" component={NotFound} />
        </Switch>
      </Router>
    </AlertProvider>
  );
};

export default App;
