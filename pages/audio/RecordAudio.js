import React, { useState, useContext } from "react";
import {
  StyleSheet,
  View,
  Button,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Audio as ExpoAudio } from "expo-av";
import * as FileSystem from "expo-file-system";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { Auth } from "aws-amplify";
import { Storage } from "@aws-amplify/storage";
import { DataStore } from "@aws-amplify/datastore";
import { AppUser, Audio as AudioModel } from "../../src/models";
import AppContext from "../AppContext";

const RecordAudio = () => {
  const { audioFolder, setAudioAdded } = useContext(AppContext);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState();
  const [fileUri, setFileUri] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");

  const navigation = useNavigation();

  async function startRecording() {
    try {
      //console.log("Requesting submission... ");
      await ExpoAudio.requestPermissionsAsync();
      await ExpoAudio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      //console.log("Start recording... ");
      const recording = new ExpoAudio.Recording();
      await recording.prepareToRecordAsync(
        ExpoAudio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();
      setRecording(recording);
      setIsRecording(true);
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
    console.log("Initial File path:", fileInfo.uri);

    setIsRecording(false);
    setModalVisible(true);
  }

  const uploadAudioToStorage = async (filename, audioBlob) => {
    await Auth.currentCredentials();
    try {
      //code to put a file in s3 bucket
      const response = await Storage.put(filename, audioBlob, {
        level: "private",
        contentType: "audio/mpeg",
        progressCallback(progress) {
          console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
          const calculated = parseInt((progress.loaded / progress.total) * 100);
        },
      });
      console.log("successful load of audio file in S3: ", response); //key
      const { id } = await Auth.currentUserInfo();
      const url = await Storage.get(response.key);
      //console.log("presigned url in S3: ", url);
      const data = {
        CognitoId: id,
        Key: response.key,
        S3Url: url,
        Success: true,
      };
      return data;
    } catch (error) {
      console.log("error while uploading audio file to s3: ", error);
      const data = {
        ErrorMessage: error,
        Success: false,
      };
      return data;
    }
  };

  const uploadAudioToModel = async (
    fileUri,
    recordingTitle,
    s3Key,
    size,
    audioType
  ) => {
    try {
      //code to create new record in Audio model
      const user = await Auth.currentAuthenticatedUser();
      const cognitoId = user.getSignInUserSession().getIdToken().payload.sub;
      //AppUser from DB
      let users = await DataStore.query(AppUser, (user) =>
        user.cognitoId.eq(cognitoId)
      );
      let userId;
      if (users[0]) {
        userId = users[0].id;
      }
      const lazyAudio = await DataStore.save(
        new AudioModel({
          title: recordingTitle,
          s3Key: s3Key,
          expoFileSytemPath: fileUri,
          metadata: {
            size: size,
            type: audioType,
            userName: cognitoId,
          },
          appuserID: userId,
        })
      );
      console.log("New audio created: ", lazyAudio);
      const data = {
        AudioId: lazyAudio.id,
        Success: true,
      };
      return data;
    } catch (error) {
      console.log("Error occurred while creating new audio: ", error);
      const data = {
        ErrorMessage: error,
        Success: false,
      };
      return data;
    }
  };

  const uploadAudioToCloud = async (fileUri, recordingTitle) => {
    try {
      let upload1Success = false;
      //code to put a file in s3 bucket
      const s3AudioFolder = "audios";
      const audioName = fileUri.split("/").pop();
      //console.log("Audio name: ", audioName);
      const audioType = audioName.split(".").pop();
      //console.log("Audio type: ", audioType);
      const response = await fetch(fileUri, {
        method: "GET",
        headers: {
          "Content-Type": "audio/mpeg",
        },
      });
      //console.log("response when uploading to cloud: ", response);
      const blob = await response.blob();
      //console.log("Blob uploading: ", blob);
      const timestamp = new Date().getTime().toString();
      const audioSubFolder = `${audioName.slice(0, audioName.lastIndexOf("."))}_${timestamp}`;
      const s3FileName = `${s3AudioFolder}/${audioSubFolder}/${audioName}`;
      console.log("s3FileName: ", s3FileName);
      const data1 = await uploadAudioToStorage(s3FileName, blob);
      if (data1.Success) {
        upload1Success = true;
        //console.log("S3 upload: ", data1);
      }

      let upload2Success = false;
      //code to create new record in Audio model
      const data2 = await uploadAudioToModel(
        fileUri,
        recordingTitle,
        "private/" + data1.CognitoId + "/" + data1.Key,
        blob.size,
        audioType
      );
      if (data2.Success) {
        upload2Success = true;
        console.log("New audio model created: ", data2.AudioId);
      }

      if (upload1Success && upload2Success) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log("Error occurred while uploading audio to cloud: ", error);
      return false;
    }
  };

  async function saveRecording() {
    const newFileUri = `${audioFolder}${recordingTitle}.m4a`;

    try {
      await FileSystem.copyAsync({
        from: fileUri,
        to: newFileUri,
      });
      console.log("File copied from: ", fileUri, " --- to: ", newFileUri);

      const result = await uploadAudioToCloud(newFileUri, recordingTitle);
      console.log("Result of uploadAudioToCloud: ", result);

      if (result) {
        Alert.alert("Sucess", "Audio saved successfully");
      } else {
        Alert.alert("Error", "Audio not saved, try again");
      }
    } catch (error) {
      console.log("Error occurred while saving sound: ", error);
    }

    setModalVisible(false);
    setAudioAdded(true);
    navigation.navigate("AudioList"); // Navega al componente AudioList
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
    backgroundColor: "#fcf6db",
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
  recordingContainer: {
    height: 100,
    backgroundColor: "black",
    justifyContent: "flex-end",
  },
  animationBar: {
    height: 10,
    backgroundColor: "red",
    marginTop: 20,
  },
});
