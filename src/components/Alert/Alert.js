import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faExclamation,
  faInfo,
} from "@fortawesome/free-solid-svg-icons";

import Section from "../Section";

import "./Alert.scss";

const Alert = ({ style, options, message, close }) => (
  <Section className="alert" onClick={close} style={style}>
    {options.type === "info" && (
      <FontAwesomeIcon icon={faInfo} color="var(--primary)" size="lg" />
    )}
    {options.type === "success" && (
      <FontAwesomeIcon icon={faCheck} color="var(--primary)" size="lg" />
    )}
    {options.type === "error" && (
      <FontAwesomeIcon icon={faExclamation} color="var(--primary)" size="lg" />
    )}
    {message}
  </Section>
);

export default Alert;
