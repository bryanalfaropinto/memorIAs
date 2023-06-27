import React, { useEffect, useState } from "react";
import Navigation from "./pages/Navigation";
import * as FileSystem from "expo-file-system";
import AppContext from "./pages/AppContext";
import "@azure/core-asynciterator-polyfill";

const App = () => {

  const [audioFolder, setAudioFolder] = useState(
    FileSystem.documentDirectory + "memorIAs/"
  );
  const [audioAdded, setAudioAdded] = useState(false);
  const [audioList, setAudioList] = useState([]);
  const [isInitialRegistration, setIsInitialRegistration] = useState(false);
  const [userAudios, setUserAudios] = useState([]);

  const createAppFolder = async () => {
    try {
      const folderInfo = await FileSystem.getInfoAsync(audioFolder);
      //console.log('audioFolder => ', audioFolder, ' --- Folder Info - useEffect: ', folderInfo);

      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(audioFolder);
      }
    } catch (err) {
      console.error("Error creating app folder: ", err);
    }
  };

  useEffect(() => {
    createAppFolder();
  }, []);

  return (
    <AppContext.Provider
      value={{
        audioFolder,
        audioList,
        audioAdded,
        isInitialRegistration,
        userAudios,
        setAudioFolder,
        setAudioList,
        setAudioAdded,
        setIsInitialRegistration,
        setUserAudios,
      }}
    >
      <Navigation />
    </AppContext.Provider>
  );
};

export default App;