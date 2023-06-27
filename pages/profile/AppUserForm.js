import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Storage } from "@aws-amplify/storage";
import { DataStore } from "@aws-amplify/datastore";
import { Auth } from "aws-amplify";
import { AppUser } from "../../src/models";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import AppContext from "../AppContext";
import { Formik, useFormikContext } from "formik";
import * as Yup from "yup";

const AppUserForm = () => {
  const [defaultBirthday, setDefaultBirthday] = useState(new Date());
  const { setIsInitialRegistration } = useContext(AppContext);

  const initialValues = {
    fullName: "",
    profileImageUri: "",
    percentage: 0,
    dateOfBirth: defaultBirthday,
  };

  const uploadImage = async (filename, img, setFieldValue) => {
    await Auth.currentCredentials();
    try {
      //code to put a file in s3 bucket
      const response = await Storage.put(filename, img, {
        level: "private",
        contentType: "image/jpeg",
        progressCallback(progress) {
          console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
          //setLoading(progress);
          const calculated = parseInt((progress.loaded / progress.total) * 100);
          setFieldValue("percentage", calculated); // due to s3 put function scoped
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

  const handleFormSubmit = async (values, actions) => {
    console.log("submit: ", values);
    //console.log("actions: ", actions.setFieldValue("dateOfBirth", new Date("1995-12-17T03:24:00")));

    try {
      const cognitoUser = await Auth.currentAuthenticatedUser();
      const identityId = cognitoUser.getSignInUserSession().getIdToken()
        .payload.sub;
      console.log("identityId: ", identityId);

      let s3Url;
      if (values.profileImageUri !== "") {
        const response = await fetch(values.profileImageUri);
        const blob = await response.blob();
        const fileName = `profile-${identityId}.jpeg`;
        s3Url = await uploadImage(fileName, blob, actions.setFieldValue);
      }

      //load new user to DB
      const dateOfBirthAWS = values.dateOfBirth.toISOString();
      console.log(
        "dateOfBirth: ",
        dateOfBirthAWS.slice(0, dateOfBirthAWS.indexOf("T"))
      );

      const fullName = values.fullName;
      await DataStore.save(
        new AppUser({
          cognitoId: identityId,
          name: fullName,
          birthday: dateOfBirthAWS.slice(0, dateOfBirthAWS.indexOf("T")),
          photo: s3Url,
        })
      );

      actions.setFieldValue("fullName", "");
      actions.setFieldValue("dateOfBirth", defaultBirthday);
      actions.setFieldValue("profileImageUri", "");
      actions.setFieldValue("percentage", 0);

      setIsInitialRegistration(false);

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.log(`Error occurred while updating profile: `, error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const validationSchema = Yup.object().shape({
    fullName: Yup.string().required("Alias is required"),
    dateOfBirth: Yup.date()
      .required("Birthday is required")
      .test("valid-date", "Birthday must be a valid date", (date) => {
        return date < defaultBirthday;
      }),
  });

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values, actions) => {
        handleFormSubmit(values, actions);
      }}
    >
      <View style={styles.container}>
        <Text style={styles.welcomeText}>Welcome!</Text>
        <FormikForm />
      </View>
    </Formik>
  );
};

const FormikForm = () => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    values,
    setFieldValue,
    handleChange,
    handleBlur,
    handleSubmit,
    touched,
    errors,
  } = useFormikContext();

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    setFieldValue("dateOfBirth", selectedDate);
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
      setFieldValue("profileImageUri", result.assets[0].uri);
    }
  };

  return (
    <View style={styles.formContainer}>
      {values.percentage !== 0 && (
        <Text style={styles.percentage}>{values.percentage}%</Text>
      )}
      {values.profileImageUri !== "" ? (
        <Image
          source={{ uri: values.profileImageUri }}
          style={styles.profileImage}
        />
      ) : (
        <Image
          source={require("../../assets/neutral.png")}
          style={styles.profileImage}
        />
      )}
      <TouchableOpacity
        style={styles.buttonSaveImage}
        onPress={pickImageFromGallery}
      >
        <Text style={styles.buttonTextSaveImage}>Choose image</Text>
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
          value={values.fullName}
          onChangeText={handleChange("fullName")}
          onBlur={handleBlur("fullName")}
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
            {values.dateOfBirth.toLocaleDateString()}
          </Text>
        </View>
      </TouchableWithoutFeedback>
      {showDatePicker && (
        <DateTimePicker
          value={values.dateOfBirth}
          mode="date"
          display="default"
          dateFormat="dayofweek day month"
          onChange={handleDateChange}
        />
      )}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fcf6db",
    paddingHorizontal: 20,
    width: "100%",
  },
  formContainer: {
    alignItems: "center",
    justifyContent: "center",
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
  buttonSaveImage: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 30,
  },
  buttonTextSaveImage: {
    color: "#8a9c45",
    fontSize: 16,
    fontWeight: "normal",
  },
  percentage: {
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
    marginBottom: 5,
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
  icon: {
    marginRight: 5,
    marginBottom: 16,
  },
  errorText: {
    color: "red",
  },
});

export default AppUserForm;
