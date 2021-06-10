import React from "react";

import Header from "../../components/Header";

import { ReactComponent as PrimaryBGSVG } from "./assets/bg1.svg";
import { ReactComponent as SecondaryBGSVG } from "./assets/bg2.svg";

import { ReactComponent as BirdSVG } from "./assets/bird.svg";
import { ReactComponent as MultiplayerSVG } from "./assets/feature1.svg";
import { ReactComponent as MIDISVG } from "./assets/feature2.svg";
import { ReactComponent as RecordingSVG } from "./assets/feature3.svg";

import "./Home.scss";

const Home = () => {
  return (
    <div className="home">
      <Header />
      <PrimaryBGSVG className="primary-bg" />
      <main>
        <h1>
          <span>Play</span> piano
          <br />
          with your friends
        </h1>
        <BirdSVG />
      </main>
      <div className="container">
        <SecondaryBGSVG className="secondary-bg" />
        <div id="about" className="features">
          <div className="feature">
            <MultiplayerSVG />
            <div>
              <h3>Multiplayer</h3>
              <p>Play with your friends in a private room</p>
            </div>
          </div>
          <div className="feature">
            <MIDISVG />
            <div>
              <h3>MIDI support</h3>
              <p>Play your MIDI piano or use the virtual keyboard</p>
            </div>
          </div>
          <div className="feature">
            <RecordingSVG />
            <div>
              <h3>Recordings</h3>
              <p>Record your sessions and construct your personal library</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
