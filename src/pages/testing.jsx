import { Routes, Route } from "react-router-dom";
import Sessions from "./debugTools/sessions";
import PlayMethodStats from "./components/statistics/playbackMethodStats";
// import PlaybackMethodStats from "./components/statCards/playback_method_stats";

const TestingRoutes = () => {
  return (
    <Routes>
      <Route path="/sessions" element={<Sessions />} />
      <Route path="/stats" element={<PlayMethodStats />} />
      {/* <Route path="/statsstream" element={<PlaybackMethodStats />} /> */}
    </Routes>
  );
};

export default TestingRoutes;
