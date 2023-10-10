import React from "react";

const AppContext = React.createContext({
  audioFolder: null,
  audioAdded: false,
  idAudioAdded: null,
  isInitialRegistration: false,
  setAudioFolder: () => {},
  setAudioAdded: () => {},
  setIdAudioAdded: () => {},
  setIsInitialRegistration: () => {},
});

export default AppContext;
