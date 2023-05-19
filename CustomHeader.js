import React, { useState } from "react";
import { Appbar, Menu, IconButton } from "react-native-paper";
import { Auth } from "aws-amplify";
import { useNavigation } from "@react-navigation/native";
import { Image, StyleSheet, View } from "react-native";

const CustomHeader = () => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const navigation = useNavigation();

  const handleMenuToggle = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleSignOut = async () => {
    try {
      await Auth.signOut();
      console.log("Logged out successfully");
      navigation.navigate("Home");
    } catch (error) {
      console.log("Error occurred while signing out:", error);
    }
  };

  return (
    <Appbar.Header style={styles.header}>
      <Image
        source={require("./assets/LetrasMemorias.png")}
        style={styles.logo}
      />
      <View style={styles.menu}>
        <Menu
          visible={isMenuVisible}
          onDismiss={handleMenuToggle}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={handleMenuToggle}
              color="white"
            />
          }
        >
          <Menu.Item onPress={handleSignOut} title="Sign Out" />
        </Menu>
      </View>
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#a9c32a",
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: "contain",
  },
  menu: {
    position: "absolute",
    right: 0,
  },
});

export default CustomHeader;
