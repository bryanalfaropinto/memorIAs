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
import { Audio as AudioExpo } from "expo-av";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { Auth } from "aws-amplify";
import { AppUser, Audio as AudioModel } from "../../src/models";
import { DataStore } from "@aws-amplify/datastore";
import { Storage } from "@aws-amplify/storage";
import { v4 as uuidv4 } from "uuid";

import AppContext from "../AppContext";

const AudioList = () => {
  const { audioFolder, audioAdded, setAudioAdded } = useContext(AppContext);

  const [audioMetadata, setAudioMetadata] = useState({});
  const [isPlaying, setIsPlaying] = useState(null);
  const [currentSound, setCurrentSound] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const cellWidthPercentage = 30; // Porcentaje de ancho deseado para cada celda

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
        "ejecutando fetchAudioMetadata useEffect x cambio audioAdded: ",
        audioMetadata
      );
      fetchAudioMetadata();
    }
    setAudioAdded(false);
  }, [audioAdded]);

  const loadUserId = async () => {
    try {
      const userAuth = await Auth.currentAuthenticatedUser();
      let users = await DataStore.query(AppUser, (u) =>
        u.cognitoId.eq(userAuth.attributes.sub)
      );
      return users[0].id;
    } catch (error) {
      console.log("Error occurred while loading userId: ", error);
    }
    return "";
  };

  const fetchAudioPathListFromDB = async () => {
    //code to load list of audios as per AudioExpo Model from DB
    const list = [];
    try {
      const userId = await loadUserId();
      //console.log("userId in fetchAudioPathListFromDB: ", userId);
      let audios = await DataStore.query(AudioModel, (a) =>
        a.appuserID.eq(userId)
      );
      //console.log("query in fetchAudioPathListFromDB: ", audios);
      for (const item of audios) {
        //console.log("item title: ", item.title);
        list.push({
          id: item.id,
          path: item.expoFileSytemPath,
          name: item.title,
          key: item.s3Key,
          expoUrl: item.expoFileSytemPath,
          type: item.metadata.type,
          size: item.metadata.size,
          updatedAt: item.createdAt,
        });
      }
      return list;
    } catch (error) {
      console.log(
        `Error occurred while querying audios from AudioExpo Model: `,
        error
      );
    }
    return list;
  };

  const fetchAudioMetadata = async () => {
    //load list of audios as per AudioExpo Model from DB
    const audioListDB = await fetchAudioPathListFromDB();
    //console.log("audioListDB: ", audioListDB);
    const metadata = {};
    //set metadata objects (audios list ui) based on list of audios coming from DB
    for (const audioItemDB of audioListDB) {
      try {
        const existingLocalAudioInfo = await FileSystem.getInfoAsync(
          audioItemDB.expoUrl
        );
        if (!existingLocalAudioInfo.exists) {
          //download file from cloud storage to local expo file system
          const credentials = await Auth.currentCredentials();
          const s3Key = audioItemDB.key;
          console.log("s3Key: ", s3Key);
          const responseUrl = await Storage.get(s3Key, {
            level: "private",
          });

          if (responseUrl) {
            const response = await fetch(responseUrl, {
              method: "GET",
              headers: {
                "Content-Type": "audio/mpeg",
              },
            });
            const finalFileUri =
              audioFolder + audioItemDB.name + "." + audioItemDB.type;
            const { uri } = await FileSystem.downloadAsync(
              response.url,
              finalFileUri
            );
            console.log("file downloaded and created in Uri: ", uri);
            const downloadedAudioInfo = await FileSystem.getInfoAsync(uri);
            console.log("downloadedAudioInfo: ", downloadedAudioInfo);
          }
        }
        //set local file system path to metadata object
        const createdAt = new Date(audioItemDB.updatedAt).toLocaleDateString();
        const key = uuidv4();
        metadata[key] = {
          dbId: audioItemDB.id,
          filename: audioItemDB.name,
          size: audioItemDB.size,
          date: createdAt,
          path: audioItemDB.path,
          s3Key: audioItemDB.key,
          key,
        };
      } catch (error) {
        console.log(
          "Error occurred while fetching Audio from local Expo: ",
          error
        );
      }
    }
    setAudioMetadata(metadata);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAudioMetadata();
    setRefreshing(false);
  };

  async function playSound(filePath) {
    try {
      console.log("filePath to play: ", filePath);
      const { sound, status } = await AudioExpo.Sound.createAsync({
        uri: filePath,
        headers: {
          "Content-Type": "audio/m4a",
        },
        overrideFileExtensionAndroid: "m4a",
      });
      //console.log("sound: ", sound);
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

  const confirmDeleteAudio = (id, key, filePath) => {
    // Mostrar ventana de confirmación
    Alert.alert(
      "Confirm deletion",
      "Are you sure you want to delete the Audio?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteSound(id, key, filePath),
        },
      ]
    );
  };

  const deleteFromCloud = async (id, key) => {
    try {
      console.log("deleting from cloud: ", id, key);
      //remove file from Storage
      const return1 = await Storage.remove(key, { level: "private" });
      console.log("return1: ", return1);
      //remove record from DB
      const return2 = await DataStore.delete(AudioModel, id);
      console.log("return2: ", return2);
      if (return1.$metadata.httpStatusCode === 204 && return2.length > 0)
        return true;
      else return false;
    } catch (error) {
      console.log("Error occurred while deleting from cloud: ", error);
    }
  };

  async function deleteSound(id, key, filePath) {
    try {
      const deletedFromCloud = await deleteFromCloud(id, key);
      if (deletedFromCloud) {
        await FileSystem.deleteAsync(filePath);
        setAudioAdded(true); // Para que se actualice la lista de audios
        setIsPlaying(null);
      }
    } catch (error) {
      console.log("Error occurred while deleting sound: ", error);
    }
  }

  return (
    <View style={styles.container}>
      {audioMetadata && Object.keys(audioMetadata).length > 0 ? (
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
                  {!isPlaying || isPlaying !== item.path ? ( // Comprobar si no se está reproduciendo o el AudioExpo en reproducción no coincide con el actual
                    <TouchableOpacity onPress={() => playSound(item.path)}>
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
                    onPress={() =>
                      confirmDeleteAudio(item.dbId, item.s3Key, item.path)
                    }
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
        <Text style={styles.noAudioText}>
          No audios created. Start creating your memories!
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fcf6db",
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
  noAudioText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 20,
    backgroundColor: "#fcf6db",
    borderRadius: 5,
    width: "100%",
  },
});

export default AudioList;
