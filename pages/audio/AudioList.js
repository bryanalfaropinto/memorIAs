import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Audio as AudioExpo } from "expo-av";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { Auth } from "aws-amplify";
import { AppUser, Audio as AudioModel } from "../../src/models";
import { DataStore } from "@aws-amplify/datastore";
import { Storage } from "@aws-amplify/storage";

import AppContext from "../AppContext";

const AudioList = () => {
  const { audioFolder, idAudioAdded, setIdAudioAdded } = useContext(AppContext);

  const [audioRecentlyAdded, setAudioRecentlyAdded] = useState(null);
  const [audioListDatabase, setAudioListDatabase] = useState([]);
  const [isPlaying, setIsPlaying] = useState(null);
  const [currentSound, setCurrentSound] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingAudios, setDownloadingAudios] = useState({});

  const cellWidthPercentage = 30;

  useEffect(() => {
    console.log("ejecutando fetchAudioMetadata useEffect x carga inicial");
    fetchAudioMetadata();
  }, []);

  useEffect(() => {
    console.log("idAudioAdded: ", idAudioAdded);
    if (idAudioAdded) {
      const sub = DataStore.observeQuery(AudioModel, (a) =>
        a.id.eq(idAudioAdded)
      ).subscribe((items) => {
        if (items.items.length > 0) {
          //console.log("items.items: ", items.items[0]);
          setAudioRecentlyAdded(items.items[0]);
        }
      });
      return () => {
        sub.unsubscribe();
      };
    }
    setIdAudioAdded(null);
  }, [idAudioAdded]);

  useEffect(() => {
    console.log("audioRecentlyAdded useEffect: ", audioRecentlyAdded);
    if (audioRecentlyAdded) {
      const audioList = [...audioListDatabase];
      //console.log("audioListDatabase audioRecentlyAdded: ", audioList);
      if (audioRecentlyAdded.createdAt) {
        const idx = audioList.findIndex((a) => a.id === audioRecentlyAdded.id);
        console.log("audioList[idx]: ", audioList[idx]);
        if (idx === -1) {
          audioList.push(audioRecentlyAdded);
        } else {
          audioList[idx] = audioRecentlyAdded;
        }
        audioList.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
        setAudioListDatabase(audioList);
        //console.log("audioListDatabase: ", audioListDatabase);
      }
    }
    setAudioRecentlyAdded(null);
  }, [audioRecentlyAdded]);

  useEffect(() => {
    //console.log("audioListDatabase useEffect: ", audioListDatabase);
    console.log(
      "audioListDatabase.length useEffect: ",
      audioListDatabase ? audioListDatabase.length : 0
    );
  }, [audioListDatabase]);

  const loadUserId = async () => {
    try {
      const userAuth = await Auth.currentAuthenticatedUser();
      //console.log("userAuth: ", userAuth);
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
    try {
      const userId = await loadUserId();
      console.log("userId in fetchAudioPathListFromDB: ", userId);
      let audios = await DataStore.query(AudioModel, (a) =>
        a.appuserID.eq(userId)
      );
      audios.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));

      setAudioListDatabase(audios);
      return audios;
    } catch (error) {
      console.log(
        `Error occurred while querying audios from AudioExpo Model: `,
        error
      );
    }
  };

  const fetchAudioMetadata = async () => {
    if (audioListDatabase.length === 0) {
      //load list of audios as per AudioExpo Model from DB
      const audioListReturn = await fetchAudioPathListFromDB(); //sets audioListDatabase object
      const audiosList =
        audioListDatabase.length > 0
          ? [...audioListDatabase]
          : [...audioListReturn];

      //set metadata objects (audios list ui) based on list of audios coming from DB
      for (const audioItemDB of audiosList) {
        try {
          const existingLocalAudioInfo = await FileSystem.getInfoAsync(
            //audioItemDB.expoUrl
            audioItemDB.expoFileSytemPath
          );
          if (!existingLocalAudioInfo.exists) {
            //download file from cloud storage to local expo file system

            //while downloading
            setDownloadingAudios((prevDownloadingAudios) => ({
              ...prevDownloadingAudios,
              [audioItemDB.id]: true,
            }));

            const parts = audioItemDB.s3Key.split("/"); //private/us-east-1%3A7ce737f6-1373-4b93-a4c2-cbf72b697202/audios/27Julio2023_2_1690481711096/27Julio2023_2.m4a
            const secondIndex = parts.findIndex(
              (part, index) => index > 0 && part === "audios"
            );
            const s3Key = parts.slice(secondIndex).join("/");
            console.log("s3Key n: ", s3Key);

            const responseUrl = await Storage.get(s3Key, {
              level: "private",
              validateObjectExistence: true,
            });

            //console.log("responseUrl: ", responseUrl);
            if (responseUrl) {
              const finalFileUri =
                audioFolder +
                audioItemDB.title +
                "." +
                audioItemDB.metadata.type;

              const result = await FileSystem.downloadAsync(
                responseUrl,
                finalFileUri,
                {
                  cache: false,
                  headers: {
                    "Content-Type": "audio/mpeg",
                  },
                }
              );
              console.log("file downloaded and created in Uri: ", result);

              const downloadedAudioInfo = await FileSystem.getInfoAsync(
                finalFileUri
              );
              console.log("downloadedAudioInfo: ", downloadedAudioInfo);
            }

            //when download is finished
            setDownloadingAudios((prevDownloadingAudios) => ({
              ...prevDownloadingAudios,
              [audioItemDB.id]: false,
            }));
          }
        } catch (error) {
          console.log(
            "Error occurred while fetching Audio from local Expo: ",
            error
          );
        }
      }
    } else {
      //if audio is added, refresh audio list
      const audioList = [...audioListDatabase];
      audioList.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
      setAudioListDatabase(audioList);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAudioMetadata();
    setRefreshing(false);
  };

  async function playSound(filePath) {
    try {
      console.log("filePath to play: ", filePath);
      const playableSound = await FileSystem.getInfoAsync(filePath);
      console.log("playableSound: ", playableSound);

      const { sound } = await AudioExpo.Sound.createAsync({
        uri: playableSound.uri,
        overrideFileExtensionAndroid: "m4a",
      });
      //console.log("sound: ", sound);

      setCurrentSound(sound);
      await sound.playAsync();
      setIsPlaying(filePath);

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          setIsPlaying(null);
          await sound.unloadAsync();
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
      const parts = key.split("/");
      const reducedKey = parts.slice(2).join("/");
      console.log("reducedKey: ", reducedKey);
      const return1 = await Storage.remove(reducedKey, { level: "private" });
      //console.log("return1: ", return1);
      //remove record from DB
      const return2 = await DataStore.delete(AudioModel, id);
      //console.log("return2: ", return2);
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
        console.log("key deleted from cloud: ", key);
        await FileSystem.deleteAsync(filePath);
        const indexToRemove = audioListDatabase.findIndex((i) => {
          return i.id === id;
        });
        const elementToRemove = audioListDatabase[indexToRemove];
        const localAudioList = audioListDatabase.filter(
          (item) => item != elementToRemove
        );
        setAudioListDatabase(localAudioList);
        //setAudioAdded(true);
        setIsPlaying(null);
      }
    } catch (error) {
      console.log("Error occurred while deleting sound: ", error);
    }
  }

  return (
    <View style={styles.container}>
      {audioListDatabase && audioListDatabase.length > 0 ? (
        <FlatList
          data={audioListDatabase}
          keyExtractor={(item, index) => item.id}
          renderItem={({ item }) => {
            return (
              <View style={styles.row}>
                <View style={[styles.cell, { flex: cellWidthPercentage }]}>
                  <Text style={[styles.itemTextBold]}>{item.title}</Text>
                </View>
                <View style={[styles.cell, { flex: cellWidthPercentage * 2 }]}>
                  <Text style={styles.itemText}>
                    Size: {item.metadata.size} bytes {"\n"}
                    Date: {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {downloadingAudios[item.id] ? (
                  <ActivityIndicator size="small" color="blue" />
                ) : (
                  <>
                    <View
                      style={[
                        styles.cell,
                        { flex: 1 - 2 * cellWidthPercentage },
                      ]}
                    >
                      {!isPlaying || isPlaying !== item.expoFileSytemPath ? (
                        <TouchableOpacity
                          onPress={() => playSound(item.expoFileSytemPath)}
                        >
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
                      style={[
                        styles.cell,
                        { flex: 1 - 2 * cellWidthPercentage },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          confirmDeleteAudio(
                            item.id,
                            item.s3Key,
                            item.expoFileSytemPath
                          )
                        }
                      >
                        <View style={styles.iconContainer}>
                          <FontAwesome5 name="trash-alt" size={20} />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
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
