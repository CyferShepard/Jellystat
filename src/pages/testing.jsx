import { Routes, Route } from "react-router-dom";
import Sessions from "./debugTools/sessions";

const TestingRoutes = () => {
  return (
    <Routes>
      <Route path="/sessions" element={<Sessions />} />
    </Routes>
  );
};

export default TestingRoutes;
