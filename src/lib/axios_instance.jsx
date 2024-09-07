import Axios from "axios";
import baseUrl from "./baseurl";

const axios = Axios.create({ baseURL: baseUrl });

export default axios;
