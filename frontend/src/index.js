import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import AppFreePeriods from "./App-FreePeriods";
import { SpeedInsights } from "@vercel/speed-insights/react";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppFreePeriods />
    <SpeedInsights />
  </React.StrictMode>,
);
