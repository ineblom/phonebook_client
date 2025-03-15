import { Stack } from "expo-router";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function AuthLayout() {
	return (
		<>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="sign-in" />
				<Stack.Screen name="add-contacts" />
			</Stack>

			<StatusBar backgroundColor="#161622" style="light" />
		</>
	);
}
