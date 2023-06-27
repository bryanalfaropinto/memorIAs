import React from "react";

const AppContext = React.createContext({
  audioFolder: null,
  audioAdded: false,
  isInitialRegistration: false,
  setAudioFolder: () => {},
  setAudioAdded: () => {},
  setIsInitialRegistration: () => {},
});

export default AppContext;
