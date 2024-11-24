import { io } from "socket.io-client";
import baseUrl from "./lib/baseurl";

const socket = io({
  path: baseUrl + "/socket.io/",
});

export default socket;
