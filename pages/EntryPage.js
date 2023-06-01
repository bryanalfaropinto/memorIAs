import React, { useEffect, useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as FileSystem from "expo-file-system";
import { View, StyleSheet } from "react-native";

import RecordAudio from "./audio/RecordAudio";
import AudioList from "./audio/AudioList";
import CustomHeader from "./CustomHeader";
import AppContext from "./AppContext";
import AppUserForm from "./profile/AppUserForm";

const Tab = createBottomTabNavigator();

const EntryPage = () => {
  const { audioFolder, isInitialRegistration, setAudioList } =
    useContext(AppContext);

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

  const iconColorSelected = "#000000";
  const iconColorUnselected = "#808080";

  if (isInitialRegistration) {
    return (
      <View style={styles.mainContainer}>
        <CustomHeader />
        <View style={styles.content}>
          <AppUserForm />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <CustomHeader />
      <View style={styles.content}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: "#000000",
            tabBarInactiveTintColor: "#808080",
          }}
        >
          <Tab.Screen
            name="RecordAudio"
            component={RecordAudio}
            options={{
              tabBarLabel: "Record Audio",
              tabBarIcon: ({ color, size }) => (
                <View style={styles.iconContainer}>
                  <MaterialIcons
                    name="mic"
                    color={color}
                    size={size}
                    onLayout={() => {
                      color = iconColorSelected;
                    }}
                    onPress={() => {
                      if (color === iconColorSelected) {
                        color = iconColorUnselected;
                      } else {
                        color = iconColorSelected;
                      }
                    }}
                  />
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
                  <MaterialIcons
                    name="audiotrack"
                    color={color}
                    size={size}
                    onLayout={() => {
                      color = iconColorSelected;
                    }}
                    onPress={() => {
                      if (color === iconColorSelected) {
                        color = iconColorUnselected;
                      } else {
                        color = iconColorSelected;
                      }
                    }}
                  />
                </View>
              ),
            }}
          />
        </Tab.Navigator>
      </View>
    </View>
  );
};

export default EntryPage;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
  },
  tabBar: {
    backgroundColor: "#a9c32a",
    borderTopColor: "transparent",
    elevation: 0,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: 50,
  },
});
