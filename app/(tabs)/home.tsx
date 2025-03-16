import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  return (
    <SafeAreaView className="bg-neutral-100 h-full">
      <View className="p-4">
        <Text className="text-2xl font-semibold">Network</Text>
      </View>
    </SafeAreaView>
  )
}