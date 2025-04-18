import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function About() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-100" edges={["top"]}>
      <View className="p-4 ">
        <Text className="text-2xl font-semibold text-neutral-800">About</Text>
      </View>
    </SafeAreaView>
  );
}
