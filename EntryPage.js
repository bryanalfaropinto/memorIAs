import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as FileSystem from "expo-file-system";
import { View, StyleSheet } from "react-native";

import AppContext from "./AppContext";
import RecordAudio from "./RecordAudio";
import AudioList from "./AudioList";
import CustomHeader from "./CustomHeader";

const Tab = createBottomTabNavigator();

const EntryPage = () => {

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

  const loadAudioList = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(audioFolder);
      console.log("Folder Info loadAudioList: ", dirInfo);
      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(audioFolder);
        console.log("Files in audioFolder: ", files);
        setAudioList(files);
      }
    } catch (error) {
      console.log(
        `Error occurred while reading directory audioFolder ${audioFolder}: `,
        error
      );
    }
  };

  const fetchAudioList = async () => {
    await createAppFolder();
    await loadAudioList();
  };

  useEffect(() => {
    fetchAudioList();
  }, []);

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
      <CustomHeader />
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen
          name="RecordAudio"
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
          name="AudioList"
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
    </AppContext.Provider>
  );
};

export default EntryPage;

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: 50,
  },
});
