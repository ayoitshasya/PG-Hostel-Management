// This is the entry point of the whole React app - it's the first JS file
// that runs in the browser. Its only job is to find the empty <div id="root">
// in index.html and "mount" our React component tree into it.
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";

// createRoot + render is React 18/19's way of starting a React app
// (replaces the older ReactDOM.render API).
createRoot(document.getElementById("root")).render(
  // StrictMode is a dev-only helper: it doesn't render any UI, but it makes
  // React intentionally double-invoke some functions (like component bodies
  // and effects) in development so that accidental side effects/bugs show up
  // early. It has no effect on the production build.
  <React.StrictMode>
    {/* AuthProvider wraps the ENTIRE app so that every component, no matter
        how deep in the tree, can read "who is logged in" via useContext
        without having to pass that info down manually through every layer
        (this pattern is called prop drilling, and Context avoids it). */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);