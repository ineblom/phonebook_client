import { Stack } from "expo-router";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function AuthLayout() {
	return (
		<>
			<Stack>
				<Stack.Screen
					name="sign-in"
					options={{
						headerShown: false,
					}}
				/>
			</Stack>

			<StatusBar backgroundColor="#161622" style="light"/>
		</>
	);
}
