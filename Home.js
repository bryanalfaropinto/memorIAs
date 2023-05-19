import React, { useEffect, useState } from "react";
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

import awsmobile from "./src/aws-exports";

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
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
    }
  };

  useEffect(() => {
    const unsubscribe = Hub.listen("auth", ({ payload: { event, data } }) => {
      console.log("event", event);
      switch (event) {
        case "signIn":
          setUserData(data);
          console.log(data); // Imprimir información sobre el usuario que inició sesión
          if (data.signInUserSession.identityProvider === "Google") {
            console.log("Google sign in");
          } else {
            console.log("Cognito sign in");
          }
          navigation.navigate("Entry");
          break;
        case "signOut":
          setUserData(null);
          setCustomState(null);
          break;
        case "customOAuthState":
          setCustomState(data);
          break;
      }
    });

    Auth.currentAuthenticatedUser()
      .then((currentUser) => setUserData(currentUser))
      .catch(() => console.log("Not signed in"));

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      {userData && <Text>{userData.username}</Text>}
      {customState && <Text>{customState}</Text>}

      <Image
        source={require("./assets/LogoMemorias.png")}
        style={styles.logo}
      />

      {errorMessage !== "" && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={(user) => {
          setUsername(user);
          setErrorMessage("");
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={(pass) => {
          setPassword(pass);
          setErrorMessage("");
        }}
      />

      <TouchableOpacity style={styles.loginButtonStyle} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.googleLoginButtonStyle}
        onPress={handleGoogleSignIn}
      >
        <Image
          source={require("./assets/icons8-google-96.png")}
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
});

export default Home;
