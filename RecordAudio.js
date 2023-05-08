import React, { useState, useContext } from "react";
import { StyleSheet, View, Button, Modal, TextInput } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";

import AppContext from "./AppContext";

const RecordAudio = () => {
  const [recording, setRecording] = useState();
  const [fileUri, setFileUri] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");

  const { audioFolder, setAudioAdded } = useContext(AppContext);
  //console.log("audioFolder en RecordAudio.js: ", audioFolder);

  const navigation = useNavigation();

  async function startRecording() {
    try {
      //console.log("Requesting submission... ");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      //console.log("Start recording... ");
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();
      setRecording(recording);
      //console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    //console.log("Stopping recording....");
    setRecording(undefined);
    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();
    //console.log("Recording stopped and stored at: ", uri);
    const fileInfo = await FileSystem.getInfoAsync(uri);
    setFileUri(fileInfo.uri);
    //console.log("File path:", fileInfo.uri);

    setModalVisible(true);
  }

  async function saveRecording() {
    const newFileUri = `${audioFolder}${recordingTitle}.m4a`;

    try {
      await FileSystem.copyAsync({
        from: fileUri,
        to: newFileUri,
      });
      console.log("File copied from: ", fileUri, " --- to: ", newFileUri);
    } catch (error) {
      console.log("Error occurred while saving sound: ", error);
    }

    setAudioAdded(true);
    setModalVisible(false);
    navigation.navigate("Audios List"); // Navega al componente AudioList
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Icon
          name={recording ? "stop" : "mic"}
          size={50}
          color="black"
          onPress={recording ? stopRecording : startRecording}
        />
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.modal}>
            <TextInput
              style={styles.input}
              placeholder="Enter recording title"
              onChangeText={setRecordingTitle}
            />
            <Button title="Save" onPress={saveRecording} />
          </View>
        </Modal>
      </View>
    </View>
  );
};

export default RecordAudio;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    marginVertical: 20,
    justifyContent: "space-around",
    width: "100%",
  },
  modal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    margin: 10,
    padding: 10,
    width: "80%",
  },
});
