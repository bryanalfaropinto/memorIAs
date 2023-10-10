import React, { useEffect, useState } from "react";
import Navigation from "./pages/Navigation";
import * as FileSystem from "expo-file-system";
import AppContext from "./pages/AppContext";
import "@azure/core-asynciterator-polyfill";
import awsmobile from "./src/aws-exports";
import * as WebBrowser from "expo-web-browser";
import { Amplify } from "aws-amplify";
import {
  Predictions,
  AmazonAIPredictionsProvider,
} from "@aws-amplify/predictions";

async function urlOpener(url, redirectUrl) {
  const { type, url: newUrl } = await WebBrowser.openAuthSessionAsync(
    url,
    redirectUrl
  );

  if (type === "success" && Platform.OS === "ios") {
    WebBrowser.dismissBrowser();
    return Linking.openURL(newUrl);
  }
}

const updatedConfig = {
  ...awsmobile,
  oauth: {
    ...awsmobile.oauth,
    urlOpener,
  },
};

Amplify.configure(updatedConfig);
Predictions.addPluggable(new AmazonAIPredictionsProvider());

const App = () => {
  const [audioFolder, setAudioFolder] = useState(
    FileSystem.documentDirectory + "memorIAs/"
  );

  const [idAudioAdded, setIdAudioAdded] = useState(null);
  const [audioAdded, setAudioAdded] = useState(false);
  const [isInitialRegistration, setIsInitialRegistration] = useState(false);

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
        audioAdded,
        idAudioAdded,
        isInitialRegistration,
        setAudioFolder,
        setAudioAdded,
        setIdAudioAdded,
        setIsInitialRegistration,
      }}
    >
      <Navigation />
    </AppContext.Provider>
  );
};

export default App;
