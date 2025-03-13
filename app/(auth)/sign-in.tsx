import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignIn() {
  return (
    <SafeAreaView className="bg-neutral-100 h-full">
      <ScrollView>
        <View className="w-full h-full justify-center px-4 my-6">
          <Text className="text-2xl text-neutral-700 font-semibold">Sign in to phonebook</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}