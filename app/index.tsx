import { Link } from "expo-router";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
	return (
		<SafeAreaView className="bg-neutral-100 h-full">
			<View className="w-full items-center justify-between h-full px-4">
				<Text className="text-4xl py-16">Welcome to Phonebook</Text>
				<Link
					href="/(auth)/sign-in"
					className="bg-blue-600 text-white py-4 w-full max-w-sm text-xl text-center rounded-xl"
				>
					Sign In
				</Link>
			</View>
		</SafeAreaView>
	);
}
