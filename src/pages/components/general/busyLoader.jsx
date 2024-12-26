import React from "react";
import "../../css/loading.css";

function BusyLoader() {
  return (
    <div className="loading busy">
      <div className="loading__spinner"></div>
    </div>
  );
}

export default BusyLoader;
