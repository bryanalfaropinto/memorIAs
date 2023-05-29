import React from "react";

const AppContext = React.createContext({
  audioFolder: null,
  audioList: [],
  audioAdded: false,
  isInitialRegistration: false,
  setAudioFolder: () => {},
  setAudioList: () => {},
  setAudioAdded: () => {},
  setIsInitialRegistration: () => {},
});

export default AppContext;
