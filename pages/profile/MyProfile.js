import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Storage } from "@aws-amplify/storage";
import { DataStore } from "@aws-amplify/datastore";
import { Auth } from "aws-amplify";
import { AppUser } from "../../src/models";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

const MyProfile = () => {
  const [dbUser, setDbUser] = useState(null);
  const [identityId, setIdentityId] = useState("");
  const [creationDate, setCreationDate] = useState(new Date());
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [profileImage, setProfileImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [isProfileImageChanged, setIsProfileImageChanged] = useState(false);
  const [isFullNameChanged, setIsFullNameChanged] = useState(false);
  const [isDateOfBirthChanged, setIsDateOfBirthChanged] = useState(false);

  useEffect(async () => {
    try {
      //Identity from DB
      const cognitoUser = await Auth.currentAuthenticatedUser();
      const identityId = cognitoUser.getSignInUserSession().getIdToken()
        .payload.sub;
      setIdentityId(identityId);
      //AppUser from DB
      const user = await DataStore.query(AppUser, (user) =>
        user.cognitoId("eq", identityId)
      );
      if (user[0]) {
        setDbUser(user[0]);
        setFullName(user[0].name);
        setDateOfBirth(new Date(user[0].dateOfBirth));
        setCreationDate(user[0].creationDate);
      }
      //code to get image from s3 bucket
      const response = await Storage.get(`profile-${identityId}.jpeg`);
      setProfileImage(response);
    } catch (error) {
      console.log("Error when loading data from profile: ", error);
    }
  }, []);

  const handleDateChange = (event, selectedDate) => {
    console.log("selectedDate: ", selectedDate);
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate != dateOfBirth) {
      setIsDateOfBirthChanged(true);
      setDateOfBirth(selectedDate);
    }
  };

  const showMode = () => {
    setShowDatePicker(true);
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Sorry, we need camera roll permissions to choose an image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      console.log("Loaded image uri: ", result.assets[0]);
      setIsProfileImageChanged(true);
      setProfileImage(result.assets[0]);
    }
  };

  const setLoading = (progress) => {
    const calculated = parseInt((progress.loaded / progress.total) * 100);
    updatePercentage(calculated); // due to s3 put function scoped
  };

  const updatePercentage = (number) => {
    setPercentage(number);
  };

  const uploadImage = async (filename, img) => {
    await Auth.currentCredentials();
    try {
      //code to put a file in s3 bucket
      const response = await Storage.put(filename, img, {
        level: "private",
        contentType: "image/jpeg",
        progressCallback(progress) {
          console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
          setLoading(progress);
        },
      });
      console.log("successful load of photo in S3: ", response);
      const url = await Storage.get(response.key);
      return url;
    } catch (error) {
      console.log("error while uploading image to s3: ", error);
      return error.response;
    }
  };

  const updateProfile = async () => {
    try {
      let s3Url;
      if (profileImage && isProfileImageChanged) {
        const response = await fetch(profileImage.uri);
        const blob = await response.blob();

        const fileName = `profile-${identityId}.jpeg`;
        console.log("fileName of profileImage: ", fileName);

        s3Url = await uploadImage(fileName, blob);
      }

      //update existing AppUser in DB
      if (dbUser && (isFullNameChanged || isDateOfBirthChanged)) {
        console.log("dbUser: ", dbUser);
        const userUpdated = await DataStore.save(
          AppUser.copyOf(dbUser, (updated) => {
            updated.name = fullName;
            updated.dateOfBirth = dateOfBirth.toISOString().slice(0, 10);
            return updated;
          })
        );
        console.log("userUpdated: ", userUpdated);
      }

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.log(`Error occurred while updating profile: `, error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <Text style={styles.welcomeText}>Hi ${fullName}!</Text>
      {percentage !== 0 && <Text style={styles.percentage}>{percentage}%</Text>}
      {profileImage ? (
        <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
      ) : (
        <Text style={styles.profileImagePlaceholder}>Update image profile</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={pickImageFromGallery}>
        <Text style={styles.buttonText}>Update image</Text>
      </TouchableOpacity>
      <View style={styles.dateOfBirthContainer}>
        <Ionicons
          name="person-circle"
          size={24}
          color="black"
          style={styles.icon}
        />
        <Text style={styles.dateOfBirthLabel}>Alias</Text>
        <TextInput
          style={styles.input}
          placeholder="Preferred Name"
          value={fullName}
          onChangeText={(text) => {
            setIsFullNameChanged(true);
            setFullName(text);
          }}
        />
      </View>
      <TouchableWithoutFeedback onPress={showMode}>
        <View style={styles.dateOfBirthContainer}>
          <Ionicons
            name="calendar"
            size={24}
            color="black"
            style={styles.icon}
          />
          <Text style={styles.dateOfBirthLabel}>Birthday</Text>
          <Text style={styles.dateOfBirthText}>
            {dateOfBirth.toLocaleDateString()}
          </Text>
        </View>
      </TouchableWithoutFeedback>
      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth}
          mode="date"
          display="default"
          dateFormat="dayofweek day month"
          onChange={handleDateChange}
        />
      )}
      <TouchableOpacity style={styles.button} onPress={updateProfile}>
        <Text style={styles.buttonText}>Update</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fcf6db",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#8a9c45",
    padding: 10,
    borderRadius: 5,
    marginBottom: 30,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    width: "61%", // Ajusta el ancho del TextInput al 80% del contenedor
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
    backgroundColor: "#fff", // Establece el color de fondo a blanco
  },
  dateOfBirthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dateOfBirthLabel: {
    marginRight: 5,
    fontWeight: "bold",
    marginBottom: 16,
  },
  dateOfBirthText: {
    fontSize: 16,
    width: "56%", // Ajusta el ancho del TextInput al 80% del contenedor
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 16,
    paddingHorizontal: 3,
    backgroundColor: "#fff",
    verticalAlign: "middle",
  },
  icon: {
    marginRight: 5,
    marginBottom: 16,
  },
});

export default MyProfile;
