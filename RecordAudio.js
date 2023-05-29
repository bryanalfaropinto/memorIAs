import React, { useState, useContext, useRef } from "react";
import {
  StyleSheet,
  View,
  Button,
  Modal,
  TextInput,
  // Dimensions,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import Animated, {
  //   useSharedValue,
  //   useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";

import AppContext from "./AppContext";

const RecordAudio = () => {
  const { audioFolder, setAudioAdded } = useContext(AppContext);

  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState();
  const [fileUri, setFileUri] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  // const [windowWidth, setWindowWidth] = useState(
  //   Dimensions.get("window").width
  // );
  // const [animationValue, setAnimationValue] = useState(useSharedValue(0));

  const navigation = useNavigation();

  const meterIntervalRef = useRef(null);

  // const animatedStyle = useAnimatedStyle(() => {
  //   return {
  //     width: `${animationValue.value * 100}%`,
  //   };
  // });

  // useEffect(() => {
  //   const updateWindowWidth = () => {
  //     setWindowWidth(Dimensions.get("window").width);
  //   };

  //   Dimensions.addEventListener("change", updateWindowWidth);

  //   return () => {
  //     Dimensions.removeEventListener("change", updateWindowWidth);
  //   };
  // }, []);

  // useEffect(() => {
  //   if (isRecording) {
  //     startMetering();
  //   } else {
  //     stopMetering();
  //   }
  // }, [isRecording]);

  const startMetering = () => {
    if (recording) {
      meterIntervalRef.current = setInterval(async () => {
        const { isRecording, metering } = await recording.getStatusAsync();
        console.log("Metering: ", metering, " --- isRecording: ", isRecording);
        if (isRecording) {
          const intensity = interpolate(
            metering,
            [-160, 0],
            [0, 1],
            Animated.Extrapolate.CLAMP
          );
          console.log("Intensity: ", intensity);
          setAnimationValue(intensity);
        }
      }, 100);
    }
  };

  const stopMetering = () => {
    if (meterIntervalRef.current) {
      clearInterval(meterIntervalRef.current);
      meterIntervalRef.current = null;
    }
  };

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
    //console.log("File path:", fileInfo.uri);

    setIsRecording(false);
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

    setModalVisible(false);
    setAudioAdded(true);
    navigation.navigate("AudioList"); // Navega al componente AudioList
  }

  /* <View style={styles.recordingContainer}>
        <Animated.View style={[styles.animationBar, animatedStyle]} />
      </View> */

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
