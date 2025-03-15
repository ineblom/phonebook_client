import {
	api_cancelVerification,
	api_requestVerification,
	api_verify,
} from "@/api/requests";
import FormField from "@/components/FormField";
import LoadingWrapper from "@/components/LoadingWrapper";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useRouter } from "expo-router";
import React from "react";
import { useState } from "react";
import {
	Text,
	TouchableHighlight,
	View,
	TouchableOpacity,
	TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {storage } from "@/utils/storage";

export default function SignIn() {
	const router = useRouter();
	const [form, setForm] = useState({
		number: "+46730922943",
		code: "",
	});
	const [errorMessage, setErrorMessage] = useState<string | undefined>(
		undefined,
	);
	const [loading, setLoading] = useState<boolean>(false);
	const [verifyId, setVerifyId] = useState<string>("");

	const sendCode = async () => {
		if (!form.number) {
			setErrorMessage("Please enter a phone number");
			return;
		}

		setLoading(true);
		try {
			const response = await api_requestVerification(form.number);
			setVerifyId(response.id);

			await storage.set("phone_number", form.number);

			setErrorMessage("");
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: "Failed to request verification",
			);
		} finally {
			setLoading(false);
		}
	};

	const verify = async () => {
		setLoading(true);
		try {
			const response = await api_verify(verifyId, form.code);

			await storage.set("auth_token", response.token);

			router.replace("/(auth)/add-contacts");

			setErrorMessage("");
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: "Failed to request verification",
			);
		} finally {
			setLoading(false);
		}
	};

	const cancelVerification = async () => {
		setForm({ ...form, code: "" });

		setLoading(true);
		try {
			await api_cancelVerification(verifyId);

			setErrorMessage("");
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: "Failed to request verification",
			);
		} finally {
			setLoading(false);
			setVerifyId("");
		}
	};

	const renderErrorMessage = () => {
		if (!errorMessage) return null;

		return (
			<View className="justify-between flex-row items-center p-4 bg-red-100 rounded-xl border border-red-500 mt-4">
				<Text className="text-lg text-red-500 flex-1">
					ERROR: {errorMessage}
				</Text>
				<TouchableOpacity
					onPress={() => setErrorMessage("")}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<Ionicons name="close" size={20} color="#EF4444" />
				</TouchableOpacity>
			</View>
		);
	};

	const renderVerificationInput = () => {
		return (
			<View className="pt-6 gap-4">
				<Text className="text-lg">
					Verification message sent to {form.number}.
				</Text>
				<FormField
					title="Code"
					value={form.code}
					handleChangeText={(e) => setForm({ ...form, code: e })}
					otherStyles=""
					keyboardType="numeric"
				/>
				<TouchableHighlight
					className="rounded-xl overflow-hidden"
					onPress={verify}
				>
					<View className="bg-primary py-4 items-center">
						<Text className="text-white text-xl font-semibold">Verify</Text>
					</View>
				</TouchableHighlight>

				<TouchableWithoutFeedback onPress={cancelVerification}>
					<View className="items-center">
						<Text className="text-neutral-500">Cancel</Text>
					</View>
				</TouchableWithoutFeedback>
			</View>
		);
	};

	const renderPhoneInput = () => {
		return (
			<View className="gap-4">
				<FormField
					title="Phone Number"
					value={form.number}
					handleChangeText={(e) => setForm({ ...form, number: e })}
					otherStyles="mt-6"
					keyboardType="phone-pad"
				/>

				<TouchableHighlight
					className="w-full rounded-xl overflow-hidden"
					onPress={sendCode}
				>
					<View className="bg-primary py-4 items-center">
						<Text className="text-white text-xl font-semibold">Send code</Text>
					</View>
				</TouchableHighlight>

				<Link className="text-neutral-500 text-center" href="/">
					Go back
				</Link>
			</View>
		);
	};

	const renderContent = () => {
		if (verifyId) {
			return renderVerificationInput();
		}
		return renderPhoneInput();
	};

	return (
		<SafeAreaView className="bg-neutral-100 h-full">
			<View className="p-4 relative">
				<Text className="text-2xl text-neutral-700 font-semibold text-center">
					Sign in using phone number.
				</Text>

				{renderErrorMessage()}
				<LoadingWrapper isLoading={loading} showSpinner={true}>
					{renderContent()}
				</LoadingWrapper>
			</View>
		</SafeAreaView>
	);
}
