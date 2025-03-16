import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function About() {
	return (
		<SafeAreaView className="bg-neutral-100">
			<View>
				<Text>About</Text>
			</View>
		</SafeAreaView>
	);
}
