import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { v4 as uuidv4 } from "uuid";

import AppContext from "./AppContext";

const AudioList = () => {
  const { audioFolder, audioList, audioAdded, setAudioList, setAudioAdded } =
    useContext(AppContext);
  //console.log("audioFolder en AudioList.js: ", audioFolder);
  //console.log("audioList en AudioList.js: ", audioList);
  //console.log("audioAdded en AudioList.js: ", audioAdded);

  const [audioMetadata, setAudioMetadata] = useState({});
  const [isPlaying, setIsPlaying] = useState(null);
  const [currentSound, setCurrentSound] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const cellWidthPercentage = 30; // Porcentaje de ancho deseado para cada celda

  const loadAudioList = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(audioFolder);
      //console.log("Folder Info loadAudioList: ", dirInfo);
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
        const key = uuidv4();
        //console.log(`Audio Metadata Item "${item}": `, size, date, time);
        //metadata[key] = { size, date, time, filePath };
        metadata[key] = { filename: item, size, date, time, filePath, key };
      } catch (error) {
        console.log(
          `Error occurred while getting audio info from ${filePath}: `,
          error
        );
      }
    }
    setAudioMetadata(metadata);
    //console.log("AudioMetadata en fetchAudioMetadata: ", metadata);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAudioList();
    await fetchAudioMetadata();
    setRefreshing(false);
  };

  useEffect(() => {
    console.log(
      "ejecutando fetchAudioMetadata useEffect x carga inicial: ",
      audioMetadata
    );
    fetchAudioMetadata();
  }, []);

  useEffect(() => {
    if (audioAdded) {
      console.log(
        "ejecutando loadAudioList useEffect x cambio audioAdded: ",
        audioList
      );
      loadAudioList();
    }
    setAudioAdded(false);
  }, [audioAdded]);

  useEffect(() => {
    console.log(
      "ejecutando fetchAudioMetadata useEffect x cambio audioList: ",
      audioList
    );
    fetchAudioMetadata();
  }, [audioList]);

  async function playSound(filePath) {
    try {
      const { sound, status } = await Audio.Sound.createAsync({
        uri: filePath,
      });
      setCurrentSound(sound);
      await sound.playAsync();
      setIsPlaying(filePath);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(null);
        }
      });
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

  const confirmDeleteAudio = (filePath) => {
    // Mostrar ventana de confirmación
    Alert.alert(
      "Confirm deletion",
      "Are you sure you want to delete the audio?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteSound(filePath),
        },
      ]
    );
  };

  async function deleteSound(filePath) {
    try {
      await FileSystem.deleteAsync(filePath);
      setAudioAdded(true); // Para que se actualice la lista de audios
      setIsPlaying(null);
    } catch (error) {
      console.log("Error occurred while deleting sound: ", error);
    }
  }

  return (
    <View style={styles.container}>
      {audioList.length > 0 &&
      audioMetadata &&
      Object.keys(audioMetadata).length > 0 ? (
        <FlatList
          data={Object.values(audioMetadata)} // Utilizar Object.values para obtener un array de los valores de audioMetadata
          keyExtractor={(item, index) => item.key.toString()} // Utilizar item.key como key
          renderItem={({ item }) => {
            //console.log("Item: ", item);
            return (
              <View style={styles.row}>
                <View style={[styles.cell, { flex: cellWidthPercentage }]}>
                  <Text style={[styles.itemTextBold]}>{item.filename}</Text>
                </View>
                <View style={[styles.cell, { flex: cellWidthPercentage * 2 }]}>
                  <Text style={styles.itemText}>
                    Size: {item.size} bytes {"\n"}
                    Date: {item.date}
                  </Text>
                </View>
                <View
                  style={[styles.cell, { flex: 1 - 2 * cellWidthPercentage }]}
                >
                  {!isPlaying || isPlaying !== item.filePath ? ( // Comprobar si no se está reproduciendo o el audio en reproducción no coincide con el actual
                    <TouchableOpacity onPress={() => playSound(item.filePath)}>
                      <View style={styles.iconContainer}>
                        <FontAwesome5 name="play-circle" size={20} />
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => stopSound()}>
                      <View style={styles.iconContainer}>
                        <FontAwesome5 name="stop-circle" size={20} />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                <View
                  style={[styles.cell, { flex: 1 - 2 * cellWidthPercentage }]}
                >
                  <TouchableOpacity
                    onPress={() => confirmDeleteAudio(item.filePath)}
                  >
                    <View style={styles.iconContainer}>
                      <FontAwesome5 name="trash-alt" size={20} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
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
    alignItems: "center", // Centrar elementos verticalmente
    borderBottomWidth: 1,
    borderBottomColor: "gray",
    paddingVertical: 10,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 5,
    alignItems: "center", // Centrar elementos horizontalmente
  },
  itemText: {
    fontSize: 12,
  },
  itemTextBold: {
    fontSize: 13,
    fontWeight: "bold",
  },
  iconContainer: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingHorizontal: 5,
    width: 30, // Ajustar el ancho deseado del contenedor del ícono
    height: 30, // Ajustar el alto deseado del contenedor del ícono
  },
});

export default AudioList;
