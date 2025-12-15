import { io } from "socket.io-client";
import baseUrl from "./lib/baseurl";

const socket = io(baseUrl, {
  path: "/socket.io",
  auth: {
    token: localStorage.getItem("token"),
  },
});
export default socket;
