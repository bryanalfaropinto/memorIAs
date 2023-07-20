import React, { useEffect, useState, useContext } from "react";
import { Auth, Hub } from "aws-amplify";
import { CognitoHostedUIIdentityProvider } from "@aws-amplify/auth";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DataStore } from "@aws-amplify/datastore";
import { AppUser } from "../../src/models";
import AppContext from "../AppContext";

const Home = () => {
  const [userData, setUserData] = useState(null);
  const [customState, setCustomState] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState(false);
  const [isWaitingVerificationCode, setIsWaitingVerificationCode] =
    useState(false);
  // const [cognitoId, setCognitoId] = useState("");
  // const [dbUser, setDbUser] = useState(null);
  const [isDataStoreReady, setIsDataStoreReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { setIsInitialRegistration } = useContext(AppContext);

  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      await Auth.signIn(username, password);
    } catch (error) {
      console.log("Error logging in:", error);
      setErrorMessage(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      //await Auth.federatedSignIn({ provider: "Google" });
      await Auth.federatedSignIn({
        provider: CognitoHostedUIIdentityProvider.Google,
      });
    } catch (error) {
      console.log("Error logging in with Google:", error);
      setErrorMessage(error.message);
    }
  };

  const handleSignUp = async () => {
    try {
      await Auth.signUp({
        username: email,
        password: password,
        attributes: {
          email: email,
        },
      });
      setIsWaitingConfirmation(true);
      setIsInitialRegistration(true);
      setErrorMessage("");
    } catch (error) {
      console.log("Error signing up:", error);
      //[UsernameExistsException: An account with the given email already exists.]
      setErrorMessage(error.message);
    }
  };

  const handleConfirmation = async () => {
    try {
      await Auth.confirmSignUp(email, verificationCode);
      setErrorMessage("");
    } catch (error) {
      console.log("Error confirming sign up:", error);
      setErrorMessage(error.message);
    }
  };

  const queryUserByUserName = async (data) => {
    try {
      //console.log("DataStore configured. UserData: ", userData);
      if (data.username.startsWith("google_")) {
        console.log("Google sign in");
        //setCognitoId(data.signInUserSession.accessToken.payload.sub);
        await queryAppUserByCognitoId(
          data.signInUserSession.accessToken.payload.sub
        );
        navigation.navigate("Entry");
      } else {
        console.log("Cognito sign in");
        //setCognitoId(data.attributes.sub);
        await queryAppUserByCognitoId(data.attributes.sub);
        navigation.navigate("Entry");
      }
    } catch (error) {
      console.log("Error querying user by user name: ", error);
    }
  };

  useEffect(() => {
    if (userData && isDataStoreReady) {
      //console.log("useEffect: userData: ", userData);
      queryUserByUserName(userData);
    }
  }, [userData, isDataStoreReady]);

  const handleSignInEvent = async (data) => {
    try {
      // configure DataStore
      setUserData(data);

      await DataStore.clear();
      await DataStore.configure(); //syncExpressions can be added later when needed (Audios from User)
      await DataStore.start();
    } catch (error) {
      console.log("Error event after signing in: ", error);
    }
  };

  const handleSignOutEvent = async () => {
    setUserData(null);
    setCustomState(null);
    setUsername("");
    setEmail("");
    setPassword("");
    setErrorMessage("");
    setIsSignUp(false);
    setIsWaitingConfirmation(false);
    setIsDataStoreReady(false);
    console.log("Logged out successfully");
    try {
      await DataStore.clear();
      await DataStore.stop();
      console.log("DataStore cleared");
    } catch (error) {
      console.log("Error clearing DataStore: ", error);
    }
    navigation.navigate("Home");
  };

  const queryAppUserByCognitoId = async (cognitoId) => {
    const models = await DataStore.query(AppUser, (user) =>
      user.and((user) => [user.cognitoId.eq(cognitoId)])
    )
      .then((users) => {
        if (users.length === 0) {
          console.log(`User ${cognitoId} not found in database yet`);
          //setDbUser(null);
          setIsInitialRegistration(true);
        } else {
          console.log(`User ${cognitoId} found in database`);
          //setDbUser(users[0]);
          setIsInitialRegistration(false);
        }
      })
      .catch((error) => {
        console.log("Error retrieving user from database: ", error);
      });

    //console.log("models: ", models);
    return models;
  };

  const handleDataStoreReadyEvent = async () => {
    console.log("DataStore configured");
    setIsDataStoreReady(true);
  };

  useEffect(() => {
    const unsubscribeAuth = Hub.listen(
      "auth",
      ({ payload: { event, data } }) => {
        //handle auth events
        console.log("event auth: ", event);
        switch (event) {
          case "signIn":
            handleSignInEvent(data);
            break;
          case "signOut":
            handleSignOutEvent();
            break;
          case "customOAuthState":
            setCustomState(data);
            break;
          case "signUp":
            setUserData(null);
            setIsWaitingConfirmation(true);
            break;
          case "confirmSignUp":
            setIsWaitingConfirmation(false);
            navigation.navigate("Entry");
            break;
          case "signIn_failure":
            setErrorMessage(data.message);
            break;
          case "forgotPassword":
            setIsWaitingVerificationCode(true);
            break;
          case "forgotPasswordSubmit":
            Alert.alert("Success", "Password reset successfully!");
            setIsWaitingVerificationCode(false);
            setPassword("");
            setVerificationCode("");
            break;
        }
      }
    );

    const unsubscribeDataStore = Hub.listen("datastore", async (hubData) => {
      const { event, data } = hubData.payload;
      //console.log("data: ", data);
      let modelName = "";
      if (data) {
        const { model } = data;
        if (model) {
          modelName = model.name;
          //console.log(`event datastore "${event}" on model "${data.model.name}": `);
        }
      }
      if (event === "modelSynced" && modelName === "AppUser") {
        handleDataStoreReadyEvent();
      }
    });

    Auth.currentAuthenticatedUser()
      .then((currentUser) => setUserData(currentUser))
      .catch(() => console.log("Not signed in"));

    return () => {
      unsubscribeAuth();
      unsubscribeDataStore();
    };
  }, []);

  const handleForgotPassword = async () => {
    try {
      await Auth.forgotPassword(username);
      setErrorMessage("");
      console.log("Forgot password email sent");
    } catch (error) {
      setErrorMessage(error.message);
      console.log("Error sending forgot password email:", error);
    }
  };

  const renderSignUpForm = () => {
    if (isWaitingConfirmation) {
      return (
        <View style={styles.formContainer}>
          <Text style={styles.verificationText}>
            Please check your email for verification code.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Verification Code"
            value={verificationCode}
            onChangeText={(code) => setVerificationCode(code)}
          />
          <TouchableOpacity
            style={styles.loginButtonStyle}
            onPress={handleConfirmation}
          >
            <Text style={styles.loginButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={(text) => setPassword(text)}
        />
        <TouchableOpacity
          style={styles.loginButtonStyle}
          onPress={handleSignUp}
        >
          <Text style={styles.loginButtonText}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkText}
          onPress={() => setIsSignUp(false)}
        >
          <View style={styles.inlineContainer}>
            <Text>Already have an account? </Text>
            <Text style={styles.linkText}>Sign In</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const handlePasswordVerification = async () => {
    try {
      await Auth.forgotPasswordSubmit(username, verificationCode, password);
      setErrorMessage("");
    } catch (error) {
      console.log(
        "Error confirming verification code and new password:",
        error
      );
      setErrorMessage(error.message);
    }
  };

  const renderSignInForm = () => {
    if (isWaitingVerificationCode) {
      return (
        <View style={styles.formContainer}>
          <Text style={styles.verificationText}>
            Please check your email for verification code and enter it here
            along with new password.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Verification Code"
            value={verificationCode}
            onChangeText={(code) => setVerificationCode(code)}
          />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            secureTextEntry
            value={password}
            onChangeText={(pwd) => setPassword(pwd)}
          />
          <TouchableOpacity
            style={styles.loginButtonStyle}
            onPress={handlePasswordVerification}
          >
            <Text style={styles.loginButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={(text) => setUsername(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={(text) => setPassword(text)}
        />
        <TouchableOpacity style={styles.loginButtonStyle} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkText}
          onPress={() => setIsSignUp(true)}
        >
          <View style={styles.inlineContainer}>
            <Text>Need an account? </Text>
            <Text style={styles.linkText}>Sign Up</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkText}
          onPress={handleForgotPassword}
        >
          <View style={styles.inlineContainer}>
            <Text>Forgot your </Text>
            <Text style={styles.linkText}>Password?</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* {userData && <Text>{userData.username}</Text>} */}

      <Image
        source={require("../../assets/LogoMemorias.png")}
        style={styles.logo}
      />

      {errorMessage !== "" && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {isSignUp ? renderSignUpForm() : renderSignInForm()}

      <View style={styles.separatorContainer}>
        <Text style={styles.separatorText}>OR</Text>
      </View>

      <TouchableOpacity
        style={styles.googleLoginButtonStyle}
        onPress={handleGoogleSignIn}
      >
        <Image
          source={require("../../assets/icons8-google-96.png")}
          style={styles.googleIcon}
        />
        <Text style={styles.googleLoginButtonText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a9c32a",
    alignItems: "center",
    justifyContent: "center",
  },
  formContainer: {
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: "80%", // Ajusta el ancho del TextInput al 80% del contenedor
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
    backgroundColor: "#fff", // Establece el color de fondo a blanco
  },
  logo: {
    width: 220,
    height: 220,
    resizeMode: "contain",
  },
  loginButtonStyle: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  googleLoginButtonStyle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  loginButtonText: {
    color: "#000000",
    fontSize: 16,
  },
  googleLoginButtonText: {
    color: "#000000",
    fontSize: 16,
    marginLeft: 10,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  toggleText: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 10,
    textDecorationLine: "underline",
  },
  linkText: {
    color: "#ffffff",
    textDecorationLine: "underline",
  },
  inlineContainer: {
    flexDirection: "row",
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  separatorLine: {
    height: 1,
    backgroundColor: "#ccc",
    flex: 2,
  },
  separatorText: {
    marginHorizontal: 10,
  },
  verificationText: {
    color: "#ffffff",
    fontSize: 12,
    marginBottom: 10,
  },
});

export default Home;
