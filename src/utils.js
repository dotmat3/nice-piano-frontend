import { BASES } from "./constants";

export const split = (str) =>
  /^([a-gA-G])(#{1,}|b{1,}|x{1,}|)(-?\d*)(\/\d+|)\s*(.*)\s*$/.exec(str);

export const parse = (str) => {
  const m = split(str);
  if (!m || m[5]) return null;

  const base = BASES[m[1].toUpperCase()];
  let alt = m[2].replace(/x/g, "##").length;
  if (m[2][0] === "b") alt *= -1;
  const fifths = base[0] + 7 * alt;
  if (!m[3]) return [fifths];
  const oct = +m[3] + base[1] - 4 * alt;
  const dur = m[4] ? +m[4].substring(1) : null;
  return [fifths, oct, dur];
};

export const getMidiNumberFromNote = (note) => {
  if (
    (typeof note === "number" || typeof note === "string") &&
    note > 0 &&
    note < 128
  )
    return +note;
  const p = Array.isArray(note) ? note : parse(note);
  if (!p || p.length < 2) return null;
  return p[0] * 7 + p[1] * 12 + 12;
};

export const getNoteFromMidiNumber = (note) => {
  const name = CHROMATIC[note % 12];
  const oct = Math.floor(note / 12) - 1;
  return name + oct;
};

export const parseMidiMessage = (message) => {
  return {
    command: message.data[0] >> 4,
    channel: message.data[0] & 0xf,
    pitch: message.data[1],
    velocity: message.data[2] / 127,
  };
};

export const formatTime = (date) => {
  const hours =
    date.getUTCHours() < 10 ? "0" + date.getUTCHours() : date.getUTCHours();
  const minutes =
    date.getUTCMinutes() < 10
      ? "0" + date.getUTCMinutes()
      : date.getUTCMinutes();
  const seconds =
    date.getUTCSeconds() < 10
      ? "0" + date.getUTCSeconds()
      : date.getUTCSeconds();
  return hours + ":" + minutes + ":" + seconds;
};
