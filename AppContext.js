import React from "react";

const AppContext = React.createContext({
  audioFolder: null,
  audioList: [],
  audioAdded: false,
  setAudioFolder: () => {},
  setAudioList: () => {},
  setAudioAdded: () => {},
});

export default AppContext;
