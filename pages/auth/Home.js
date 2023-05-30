import React, { useEffect, useState, useContext } from "react";
import { Amplify, Auth, Hub } from "aws-amplify";
import { CognitoHostedUIIdentityProvider } from "@aws-amplify/auth";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { DataStore } from "@aws-amplify/datastore";
import { AppUser } from "../../src/models";

import awsmobile from "../../src/aws-exports";
import AppContext from "../AppContext";

async function urlOpener(url, redirectUrl) {
  const { type, url: newUrl } = await WebBrowser.openAuthSessionAsync(
    url,
    redirectUrl
  );

  if (type === "success" && Platform.OS === "ios") {
    WebBrowser.dismissBrowser();
    return Linking.openURL(newUrl);
  }
}

const updatedConfig = {
  ...awsmobile,
  oauth: {
    ...awsmobile.oauth,
    urlOpener,
  },
};

Amplify.configure(updatedConfig);

const Home = () => {
  const [userData, setUserData] = useState(null);
  const [customState, setCustomState] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);
  const [isCognitoSignIn, setIsCognitoSignIn] = useState(false);

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

  useEffect(() => {
    const unsubscribe = Hub.listen("auth", ({ payload: { event, data } }) => {
      console.log("event", event);
      switch (event) {
        case "signIn":
          setUserData(data);
          if (data.username.startsWith("google_")) {
            console.log("Google sign in");
            setIsGoogleSignIn(true);
          } else {
            console.log("Cognito sign in");
            setIsCognitoSignIn(true);
          }
          navigation.navigate("Entry");
          break;
        case "signOut":
          setUserData(null);
          setCustomState(null);
          setUsername("");
          setEmail("");
          setPassword("");
          setErrorMessage("");
          setIsSignUp(false);
          setIsWaitingConfirmation(false);
          console.log("Logged out successfully");
          navigation.navigate("Home");
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
      }
    });

    Auth.currentAuthenticatedUser()
      .then((currentUser) => setUserData(currentUser))
      .catch(() => console.log("Not signed in"));

    return unsubscribe;
  }, []);

  const handleForgotPassword = async () => {
    try {
      await Auth.forgotPassword(email);
      console.log("Forgot password email sent");
    } catch (error) {
      console.log("Error sending forgot password email:", error);
    }
  };

  const queryAppUserByCognitoId = async (cognitoId) => {
    const models = await DataStore.query(AppUser, (user) =>
      user.and((user) => [
        user.cognitoId.eq(cognitoId)
      ])
    )
      .then((users) => {
        if (users.length === 0) {
          console.log(`User ${cognitoId} not found in database yet`);
          setIsInitialRegistration(true);
        } else {
          console.log(`User ${cognitoId} found in database`);
          setIsInitialRegistration(false);
        }
      })
      .catch((error) => {
        console.log("Error retrieving user from database: ", error);
      });

    //console.log("models: ", models);
    return models;
  };

  //retrieve user from database (AppUser model) using DataStore and a query by cognitoId field
  useEffect(() => {
    if (userData) {
      //console.log("userData Home: ", userData);
      if (isCognitoSignIn) {
        queryAppUserByCognitoId(userData.attributes.sub);
      }
      else {
        if (isGoogleSignIn) {
          queryAppUserByCognitoId(userData.signInUserSession.accessToken.payload.sub);
        }
      }
    }
  }, [userData]);

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

  const renderSignInForm = () => {
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {userData && <Text>{userData.username}</Text>}

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
