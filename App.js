import * as React from 'react';
import { useEffect } from 'react';
import { StyleSheet, View, Button, Modal, TextInput } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AudioList from './AudioList';

export default function App() {
  
  const [recording, setRecording] = React.useState();
  const [fileUri, setFileUri] = React.useState();
  //const [sound, setSound] = React.useState();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [recordingTitle, setRecordingTitle] = React.useState("");
  const [audioFolder, setAudioFolder] = React.useState();

  useEffect(() => {
    async function createAppFolder() {
      // Crea una carpeta para tus archivos de audio en la carpeta de documentos del dispositivo
      setAudioFolder(`${FileSystem.documentDirectory}memorIAs/`);
      
      try {
        const folderInfo = await FileSystem.getInfoAsync(audioFolder ? audioFolder : FileSystem.documentDirectory + 'memorIAs/');
        console.log('Folder Info - useEffect: ', folderInfo);

        if (!folderInfo.exists) {
          await FileSystem.makeDirectoryAsync(audioFolder);
        }
      }	catch (err) {
        console.error('Error creating app folder: ', err);
      }
    };
    createAppFolder();
  }, []);

  async function startRecording() {
    try {
      console.log('Requesting submission... ');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });
      console.log('Start recording... ');
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    console.log('Stopping recording....');
    setRecording(undefined);
    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();
    console.log('Recording stopped and stored at: ', uri);
    const fileInfo = await FileSystem.getInfoAsync(uri);
    setFileUri(fileInfo.uri);
    console.log('File path:', fileInfo.uri);

    setModalVisible(true);
  }

  /*async function requestPermission() {
    console.log('Requesting permission, platform: ', Platform.OS);
    if (Platform.OS === 'android') {
      console.log('Requesting permission for android');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Permiso de almacenamiento',
          message: 'Se necesita acceso al almacenamiento para guardar archivos',
          buttonNeutral: 'Preguntar luego',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Aceptar',
        },
      );
      console.log('Permiso concedido: ', granted);
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Permiso concedido');
      } else {
        console.log('Permiso denegado');
      }
    } else {
      const result = await Permissions.request(Permissions.WRITE_EXTERNAL_STORAGE);
      if (result === 'granted') {
        console.log('Permiso concedido');
      } else {
        console.log('Permiso denegado');
      }
    }
  }*/

  // Guarda el archivo de audio en la galería del dispositivo
  /*const saveToPhone = async (item) => {     
    // Remember, here item is a file uri which looks like this. file://..
    const currentPermissions = await MediaLibrary.getPermissionsAsync(true);
    console.log('Current Permissions: ', currentPermissions);
    
    //await requestPermission();

    // con este metodo intento obtener los permisos de la biblioteca de medios
    const permission = await MediaLibrary.requestPermissionsAsync(true);
    console.log('Permissions: ', permission);

    if (permission.granted) {
      try {
        const asset = await MediaLibrary.createAssetAsync(item);
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
        const path = assetInfo.localUri;
        console.log('Local path uri: ', path);
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log('Need Storage permission to save file');
      Alert.alert(
        'Permission denied',
        'You need to enable permissions in settings to continue',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => MediaLibrary.openSettingsAsync() },
        ],
        { cancelable: true }
      );
    }
  };*/

  async function saveRecording() {
    console.log('Recording title:', recordingTitle);
    //console.log('Save recording in directory: ', FileSystem.documentDirectory);

    const newFileUri = `${audioFolder}${recordingTitle}.m4a`; //`${FileSystem.documentDirectory}${recordingTitle}.m4a`;

    try {

      await FileSystem.copyAsync({
        from: fileUri,
        to: newFileUri
      });

      console.log('File copied from: ', fileUri, ' --- to: ', newFileUri);

      /*const filePath = `${audioFolder}${recordingTitle}.m4a`;
      await FileSystem.moveAsync({ 
        from: newFileUri,
        to: filePath
      });

      console.log('File moved from: ', newFileUri, ' --- to: ', filePath);
      */

      //saveToPhone(fileUri);

      /*const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: fileUri }
      );
      setSound(audioSound);*/

    } catch (error) {
      console.log('Error occurred while saving sound: ', error);
    }

    setModalVisible(false);
  }

  /*async function playSound() {
    try {
      await sound.playAsync();
    } catch (error) {
      console.log('Error occurred while playing sound: ', error);
    }
  }

  async function stopSound() {
    if (sound) {
      await sound.stopAsync();
    }
  }
  <Button title={!sound ? 'Stop sound' : 'Play sound'} onPress={!sound ? stopSound : playSound} />
  */

  return (
  <View style={styles.container}>
    <View style={styles.buttonContainer}>
      <Icon
        name={recording ? 'stop' : 'mic'}
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
          <Button
            title="Save"
            onPress={saveRecording}
          />
        </View>
      </Modal>
    </View>
    { audioFolder != undefined && <AudioList audioFolder={ audioFolder } /> }
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    justifyContent: 'space-around',
    width: '100%',
  },
  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    margin: 10,
    padding: 10,
    width: '80%',
  }
});
