import React, { useEffect } from "react";
import { db } from "./firebase";

function App() {
  useEffect(() => {
    console.log("Firestore DB:", db);
  }, []);

  return (
    <div>
      <h1>Firebase + React Test</h1>
    </div>
  );
}

export default App;
