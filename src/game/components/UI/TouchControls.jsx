// TouchControls.jsx — thin wrapper that renders the mobile virtual joystick + action pad.
import VirtualJoystick from "./VirtualJoystick";

export default function TouchControls({ input }) {
  return <VirtualJoystick input={input} />;
}
