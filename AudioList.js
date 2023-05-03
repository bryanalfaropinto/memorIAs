import React from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { FileSystem } from 'expo';

const AudioList = ({ audioFolder }) => {
  // código de la tabla aquí
  console.log("audioFolder en AudioList.js: ", audioFolder);
  const [audioList, setAudioList] = React.useState([]);

  const refreshAudioList = async () => {
    await loadAudioList();
  }

  async function loadAudioList() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(audioFolder ? audioFolder : FileSystem.documentDirectory + 'memorIAs/');
      console.log('Folder Info: ', dirInfo);
      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(audioFolder);
        setAudioList(files);
      }
    } catch (error) {
      console.log('Error occurred while reading directory: ', error);
    }
  }

  async function playSound(filePath) {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: filePath });
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

  async function renderAudioListItem({ item }) {
    const filePath = audioFolder + item;
    console.log("file path of audio: ", filePath);
    const { size, modificationTime } = await FileSystem.getInfoAsync(filePath);
    const date = new Date(modificationTime).toLocaleDateString();
    const time = new Date(modificationTime).toLocaleTimeString();

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
        <Text style={{ flex: 1 }}>{item}</Text>
        <Text>{size} bytes</Text>
        <Text>{date} {time}</Text>
        <Button title="Play sound" onPress={() => playSound(filePath)} />
      </View>
    );
  }


  return (
    <View style={{ flex: 1, padding: 10 }}>
      {audioList.length > 0 ? (
        <FlatList
          data={audioList}
          keyExtractor={(item) => item}
          renderItem={renderAudioListItem}
        />
      ) : (
        <Text>No hay audios grabados</Text>
      )}
    </View>
  );
}

export default AudioList;