import React, { useState } from "react";
import { Appbar, Menu, IconButton } from "react-native-paper";
import { Auth } from "aws-amplify";
import { Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const CustomHeader = () => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const navigation = useNavigation();

  const handleMenuToggle = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleSignOut = async () => {
    try {
      await Auth.signOut();
    } catch (error) {
      console.log("Error occurred while signing out:", error);
    }
  };

  const handleMyProfile = () => {
    navigation.navigate("MyProfile");
  }

  const iconColor = "black";
  const iconSize = 20;

  return (
    <Appbar.Header style={styles.header}>
      <Image
        source={require("../assets/LetrasMemorias.png")}
        style={styles.logo}
      />
      <View style={styles.menuView}>
        <Menu
          visible={isMenuVisible}
          onDismiss={handleMenuToggle}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={handleMenuToggle}
              color={iconColor}
            />
          }
        >
          <Menu.Item
            onPress={handleMyProfile}
            style={styles.menuItem}
            title="My Profile"
            leadingIcon={({ color, size }) => (
              <Ionicons name="person-circle-outline" size={iconSize} color={iconColor} style={styles.icon} />
            )}
          />
          <Menu.Item
            onPress={handleSignOut}
            style={styles.menuItem}
            title="Sign Out"
            leadingIcon={({ color, size }) => (
              <Ionicons name="exit-outline" size={iconSize} color={iconColor} style={styles.icon} />
            )}
          />
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
  menuView: {
    position: "absolute",
    right: 0,
  },
  menuItem: {
    backgroundColor: "white",
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginRight: 1,
  },
  icon: {
    marginRight: 2,
  },
});

export default CustomHeader;
