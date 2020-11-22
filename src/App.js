import React from "react";
import Mapbox from "./Mapbox";
import "./custom.css";

function App() {
  return (
    <div className="App">
      <div className="title">
        <h1>Available Int'l Flights from Korea</h1>
        <small> (as of July 2020)</small>
      </div>

      <Mapbox />
    </div>
  );
}

export default App;
