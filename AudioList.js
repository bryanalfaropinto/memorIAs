import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";

import AppContext from "./AppContext";

const AudioList = () => {
  const { audioFolder, audioList, audioAdded, setAudioAdded } =
    useContext(AppContext);
  //console.log("audioFolder en AudioList.js: ", audioFolder);
  //console.log("audioList en AudioList.js: ", audioList);

  const [audioMetadata, setAudioMetadata] = useState({});
  const [isPlaying, setIsPlaying] = useState(null);
  const [currentSound, setCurrentSound] = useState(null);

  useEffect(() => {
    console.log("AudioList useEffect 1vez: ", audioMetadata);
    fetchAudioMetadata();
  }, []);

  const fetchAudioMetadata = async () => {
    const metadata = {};
    for (const item of audioList) {
      const filePath = audioFolder + item;
      try {
        const audioInfo = await FileSystem.getInfoAsync(filePath);
        //console.log("Audio Info en fetchAudioMetadata: ", audioInfo);
        const size = audioInfo.size;
        const date = new Date(audioInfo.modificationTime).toLocaleDateString();
        const time = new Date(audioInfo.modificationTime).toLocaleTimeString();
        console.log(`Audio Metadata Item "${item}": `, size, date, time);
        metadata[item] = { size, date, time };
      } catch (error) {
        console.log(
          `Error occurred while getting audio info from ${filePath}: `,
          error
        );
      }
    }
    setAudioMetadata(metadata);
  };

  useEffect(() => {
    console.log("AudioMetadata actualizado: ", audioMetadata);
  }, [audioMetadata]);

  useEffect(() => {
    if (audioAdded) {
      console.log(
        "AudioList useEffect al cambiar audioList por nuevo audio: ",
        audioList
      );
      if (audioList.length > 0 || audioList !== []) {
        fetchAudioMetadata();
      }
      setAudioAdded(false);
    }
  }, [audioList]);

  useEffect(() => {
    if (audioAdded) {
      console.log(
        "AudioAdded useEffect al cambiar por nuevo audio: ",
        audioList
      );
      if (audioList.length > 0 || audioList !== []) {
        fetchAudioMetadata();
      }
    }
  }, [audioAdded]);

  async function playSound(filePath) {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: filePath });
      setCurrentSound(sound);
      await sound.playAsync();
      setIsPlaying(filePath);
    } catch (error) {
      console.log("Error occurred while playing sound: ", error);
    }
  }

  async function stopSound() {
    try {
      await currentSound.stopAsync();
      setIsPlaying(null);
    } catch (error) {
      console.log("Error occurred while stopping sound: ", error);
    }
  }

  return (
    <View style={styles.container}>
      {audioList.length > 0 && audioMetadata ? (
        <FlatList
          data={audioList}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.cell}>
                <Text style={styles.itemText}>{item}</Text>
              </View>
              <View style={styles.cell}>
                {audioMetadata[item] && (
                  <Text style={styles.itemText}>
                    Size: {audioMetadata[item].size} bytes {"\n"}
                    Date: {audioMetadata[item].date} {audioMetadata[item].time}
                  </Text>
                )}
              </View>
              <View style={styles.cell}>
                {!isPlaying || isPlaying !== audioFolder + item ? ( // Comprobar si no se está reproduciendo o el audio en reproducción no coincide con el actual
                  <TouchableOpacity
                    onPress={() => playSound(audioFolder + item)}
                  >
                    <View style={styles.iconContainer}>
                      <FontAwesome5 name="play-circle" size={50} />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => stopSound()}>
                    <View style={styles.iconContainer}>
                      <FontAwesome5 name="stop-circle" size={50} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      ) : (
        <Text>No hay audios grabados</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cell: {
    flex: 1,
    padding: 5,
  },
  itemText: {
    fontSize: 16,
  },
  button: {
    padding: 10,
    backgroundColor: "#e53935",
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: 50,
  },
});

export default AudioList;
