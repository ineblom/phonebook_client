import { Tabs } from "expo-router";
import { Image, View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				tabBarShowLabel: true,
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="home"
				options={{
					title: "Home",
					tabBarIcon: ({ color }) => (
						<Ionicons name="home" size={24} color={color} />
					),
				}}
			/>

			<Tabs.Screen
				name="about"
				options={{
					title: "About",
					tabBarIcon: ({ color }) => (
						<Ionicons name="information-circle" size={24} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
