import React, { useState, useEffect } from "react";
import { Auth } from "aws-amplify";
import { Storage } from "@aws-amplify/storage";
import { DataStore } from "@aws-amplify/datastore";
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
  ScrollView,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Formik, useFormikContext } from "formik";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Yup from "yup";
import { AppUser } from "../../src/models";
import CustomHeader from "../CustomHeader";

const MyProfile = () => {
  const [defaultBirthday, setDefaultBirthday] = useState(new Date());
  const [isFullNameChanged, setIsFullNameChanged] = useState(false);
  const [isProfileImageChanged, setIsProfileImageChanged] = useState(false);
  const [isDateOfBirthChanged, setIsDateOfBirthChanged] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [dbUser, setDbUser] = useState(null);
  const [identityId, setIdentityId] = useState("");

  const initialValues = {
    fullName: "",
    profileImageUri: "",
    dateOfBirth: defaultBirthday,
  };

  const validationSchema = Yup.object().shape({
    fullName: Yup.string().required("Alias is required"),
    dateOfBirth: Yup.date()
      .required("Birthday is required")
      .test("valid-date", "Birthday must be a valid date", (date) => {
        return date < defaultBirthday;
      }),
  });

  const uploadImage = async (filename, img) => {
    await Auth.currentCredentials();
    try {
      //code to put a file in s3 bucket
      const response = await Storage.put(filename, img, {
        level: "private",
        contentType: "image/jpeg",
        progressCallback(progress) {
          console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
          const calculated = parseInt((progress.loaded / progress.total) * 100);
          setPercentage(calculated);
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

  const handleFormSubmit = async (values) => {
    console.log("submit: ", values);

    try {
      let update = false;
      let s3Url;
      console.log(
        `isProfileImageChanged "${isProfileImageChanged}" - isFullNameChanged "${isFullNameChanged}" - isDateOfBirthChanged "${isDateOfBirthChanged}"`
      );
      if (values.profileImageUri !== "" && isProfileImageChanged) {
        const response = await fetch(values.profileImageUri);
        const blob = await response.blob();
        const fileName = `profile-${identityId}.jpeg`;
        s3Url = await uploadImage(fileName, blob);
        setIsProfileImageChanged(false);
        update = true;
      }
      //update existing AppUser in DB
      if (dbUser && (isFullNameChanged || isDateOfBirthChanged)) {
        const originalUser = await DataStore.query(AppUser, dbUser.id);
        const newDate = values.dateOfBirth.toISOString().slice(0, 10);
        //console.log("new date: ", newDate);
        const userUpdated = await DataStore.save(
          AppUser.copyOf(originalUser, (updated) => {
            updated.name = values.fullName;
            updated.birthday = newDate;
          })
        );
        setDbUser(userUpdated);
        setIsDateOfBirthChanged(false);
        setIsFullNameChanged(false);
        update = true;
      }
      if (update) {
        console.log("successfully updated profile");
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        Alert.alert("Info", "No changes - Profile not updated!");
      }
    } catch (error) {
      console.log(`Error occurred while updating profile: `, error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values, actions) => {
        handleFormSubmit(values);
      }}
    >
      <View style={styles.container}>
        <FormikForm
          setIsProfileImageChanged={setIsProfileImageChanged}
          setIsFullNameChanged={setIsFullNameChanged}
          setIsDateOfBirthChanged={setIsDateOfBirthChanged}
          percentage={percentage}
          dbUser={dbUser}
          setDbUser={setDbUser}
          identityId={identityId}
          setIdentityId={setIdentityId}
        />
      </View>
    </Formik>
  );
};

const FormikForm = ({
  setIsProfileImageChanged,
  setIsFullNameChanged,
  setIsDateOfBirthChanged,
  percentage,
  dbUser,
  setDbUser,
  identityId,
  setIdentityId,
}) => {
  const [imageVersion, setImageVersion] = useState(0);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localFullName, setLocalFullName] = useState("");
  const [localBirthday, setLocalBirthday] = useState(new Date());

  const {
    values,
    setFieldValue,
    handleChange,
    handleSubmit,
    touched,
    errors,
  } = useFormikContext();

  useEffect(() => {
    async function fetchData() {
      try {
        //Identity from DB
        const cognitoUser = await Auth.currentAuthenticatedUser();
        const cognitoId = cognitoUser.getSignInUserSession().getIdToken()
          .payload.sub;
        setIdentityId(cognitoId);

        //AppUser from DB
        let users = await DataStore.query(AppUser, (user) =>
          user.cognitoId.eq(cognitoId)
        );
        if (users[0]) {
          setDbUser(users[0]);
          setFieldValue("fullName", users[0].name);
          setLocalFullName(users[0].name);
          const dateFromDB = new Date(users[0].birthday);
          dateFromDB.setHours(24, 0, 0, 0); //to avoid -1 day when changing to locale
          setFieldValue("dateOfBirth", dateFromDB);
          setLocalBirthday(dateFromDB);
        }

        //code to get image from s3 bucket
        const profileFileName = `profile-${cognitoId}.jpeg`;
        const responseUrl = await Storage.get(profileFileName, {
          level: "private",
        });

        //download image from s3 bucket and copy to cache directory from expo file system
        if (responseUrl) {
          const response = await fetch(responseUrl, {
            method: "GET",
            headers: {
              "Content-Type": "image/jpeg",
            },
          });
          const fileUri = FileSystem.cacheDirectory + profileFileName;
          const { uri } = await FileSystem.downloadAsync(response.url, fileUri);
          setFieldValue("profileImageUri", uri);
        }
      } catch (error) {
        console.log("Error when loading data from profile: ", error);
      }
    }
    fetchData();
  }, []);

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
      //copy file from image picker cache folder to cache folder
      let toFolder = FileSystem.cacheDirectory + `profile-${identityId}.jpeg`;
      await FileSystem.copyAsync({
        from: result.assets[0].uri,
        to: toFolder,
      })
        .then(() => {
          setFieldValue("profileImageUri", toFolder);
          setImageVersion((prevVersion) => prevVersion + 1);
          setImageTimestamp(Date.now());
          setIsProfileImageChanged(true);
        })
        .catch((error) => {
          console.log(
            "Error when copying from image picker folder to cache folder: ",
            error
          );
        });
    }
  };

  const handleFullNameChange = (text) => {
    setLocalFullName(text);
    if (text !== dbUser.name) {
      setFieldValue("fullName", text);
      setIsFullNameChanged(true);
    } else {
      setIsFullNameChanged(false);
    }
  };

  const showMode = () => {
    setShowDatePicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    try {
      selectedDate.setHours(0, 0, 0, 0);
      setShowDatePicker(Platform.OS === "ios");
      if (event.type === "set") {
        let dbDate = new Date(dbUser.birthday);
        dbDate.setHours(24, 0, 0, 0);
        let dbDateString = dbDate.toLocaleDateString();
        let selDate = selectedDate.toLocaleDateString();
        console.log(
          `selected date - "${selDate}" vs. dbBirthday - "${dbDateString}"`
        );
        if (selDate !== dbDateString) {
          setFieldValue("dateOfBirth", selectedDate);
          setLocalBirthday(selectedDate);
          setIsDateOfBirthChanged(true);
        } else {
          setIsDateOfBirthChanged(false);
        }
      }
    } catch (error) {
      console.log("Error when handling date change: ", error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      style={styles.mainContainer}
    >
      <CustomHeader />
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Hi {localFullName}!</Text>
          {percentage !== 0 && (
            <Text style={styles.percentage}>{percentage}%</Text>
          )}
          {values.profileImageUri !== "" ? (
            <Image
              key={imageVersion}
              source={{
                uri: `${values.profileImageUri}?t=${imageTimestamp}`,
                cache: "reload",
              }}
              style={styles.profileImage}
            />
          ) : (
            <Image
              source={require("../../assets/neutral.png")}
              style={styles.profileImage}
            />
          )}
          <TouchableOpacity
            style={styles.buttonUpdateImage}
            onPress={pickImageFromGallery}
          >
            <Text style={styles.buttonTextUpdateImage}>Update image</Text>
          </TouchableOpacity>
          {touched.fullName && errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}
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
              value={localFullName}
              onChangeText={(text) => {
                handleChange("fullName", text);
                handleFullNameChange(text);
              }}
            />
          </View>
          {touched.dateOfBirth && errors.dateOfBirth && (
            <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
          )}
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
                {localBirthday.toLocaleDateString()}
              </Text>
            </View>
          </TouchableWithoutFeedback>
          {showDatePicker && (
            <DateTimePicker
              value={localBirthday}
              mode="date"
              display="default"
              dateFormat="dayofweek day month"
              onChange={handleDateChange}
            />
          )}
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Update</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default MyProfile;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#fcf6db",
  },
  container: {
    flex: 1,
    backgroundColor: "#fcf6db",
    width: "100%",
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingTop: 20,
    alignItems: "center",
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
  buttonUpdateImage: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 30,
  },
  buttonTextUpdateImage: {
    color: "#8a9c45",
    fontSize: 16,
    fontWeight: "normal",
  },
  dateOfBirthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  icon: {
    marginRight: 5,
    marginBottom: 16,
  },
  dateOfBirthLabel: {
    marginRight: 5,
    fontWeight: "bold",
    marginBottom: 16,
  },
  dateOfBirthText: {
    width: "56%", // Ajusta el ancho del TextInput al 80% del contenedor
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
    verticalAlign: "middle",
  },
  input: {
    width: "61%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "red",
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
});
