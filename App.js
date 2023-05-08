import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as FileSystem from "expo-file-system";
import { View, StyleSheet } from "react-native";

import AppContext from "./AppContext";
import RecordAudio from "./RecordAudio";
import AudioList from "./AudioList";

const Tab = createBottomTabNavigator();

export default function App() {
  const [audioFolder, setAudioFolder] = useState(
    FileSystem.documentDirectory + "memorIAs/"
  );
  const [audioAdded, setAudioAdded] = useState(false);
  const [audioList, setAudioList] = useState([]);

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

  const loadAudioList = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(audioFolder);
      //console.log("Folder Info loadAudioList: ", dirInfo);
      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(audioFolder);
        //console.log("Files in audioFolder: ", files);
        setAudioList(files);
      }
    } catch (error) {
      console.log(
        `Error occurred while reading directory audioFolder ${audioFolder}: `,
        error
      );
    }
  };

  useEffect(() => {
    loadAudioList();
  }, []);

  useEffect(() => {
    console.log("Updated audioList: ", audioList); //se ejecuta al inicio, cuando se carga la lista de audios vacía y luego cuando se hace la primera carga de audios loadAudioList()
  }, [audioList]);

  useEffect(() => {
    if (audioAdded) {
      console.log("cambió el valor de audioAdded a true");
      loadAudioList();
    }
  }, [audioAdded]);

  return (
    <AppContext.Provider
      value={{
        audioFolder,
        audioList,
        audioAdded,
        setAudioFolder,
        setAudioList,
        setAudioAdded,
      }}
    >
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen
            name="Record Audio"
            component={RecordAudio}
            options={{
              tabBarLabel: "Record Audio",
              tabBarIcon: ({ color, size }) => (
                <View style={styles.iconContainer}>
                  <MaterialIcons name="mic" color={color} size={size} />
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Audios List"
            component={AudioList}
            options={{
              tabBarLabel: "Audios List",
              tabBarIcon: ({ color, size }) => (
                <View style={styles.iconContainer}>
                  <MaterialIcons name="audiotrack" color={color} size={size} />
                </View>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: 50,
  },
});
