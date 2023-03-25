import React from "react";
import "../../css/error.css";

function ErrorPage(props) {
  return (
    <div className="error">
      <div className="message">{props.message}</div>
    </div>
  );
}

export default ErrorPage;