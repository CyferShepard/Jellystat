import React from "react";
export default class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }
  
    static getDerivedStateFromError(error) {
      // Update state to indicate an error has occurred
      return { hasError: true };
    }
  
    componentDidCatch(error, errorInfo) {
      // You can log the error or perform other actions here
      console.error(error, errorInfo);
    }
  
    render() {
      if (this.state.hasError) {
        // Render an error message or fallback UI
        return <></>;
      }
  
      // Render the child components as normal
      return this.props.children;
    }
  }
  