import { storage } from "@/utils/storage";
import { useRouter } from "expo-router";
import { View, Text, TouchableHighlight } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
}

export default function Index() {
  const router = useRouter();

  const signIn = () => {
    const token = storage.getString("auth_token");

    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          storage.delete("auth_token");
          router.push("/(auth)/sign-in");
        } else {
          router.push("/(auth)/add-contacts");
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
        storage.delete("auth_token");
        router.push("/(auth)/sign-in");
      }
    } else {
      router.push("/(auth)/sign-in");
    }
  };

  return (
    <SafeAreaView className="bg-neutral-100 h-full">
      <View className="w-full items-center justify-between h-full p-4">
        <Text className="text-4xl py-16">Welcome to Phonebook</Text>

        <TouchableHighlight
          onPress={signIn}
          className="w-full rounded-xl overflow-hidden"
        >
          <View className="bg-primary py-4 items-center">
            <Text className="text-white text-xl">Sign In</Text>
          </View>
        </TouchableHighlight>
      </View>
    </SafeAreaView>
  );
}
