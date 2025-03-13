import { Tabs } from "expo-router";
import { Image, View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons"

export default function TabsLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true
      }}
    >
      <Tabs.Screen name="home" options={{
        title: "Home",
        headerShown: false,
        tabBarIcon: ({color, focused}) => (
          <Ionicons name="home" size={24} color={color}/>
        )
      }}/>

      <Tabs.Screen name="about" options={{
        title: "About",
        headerShown: false,
        tabBarIcon: ({color, focused}) => (
          <Ionicons name="information-circle" size={24} color={color}/>
        )
      }}/>
    </Tabs>
  )
}