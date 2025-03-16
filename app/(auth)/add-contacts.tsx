import {
	Text,
	View,
	ScrollView,
	TouchableHighlight,
	Linking,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Contacts from "expo-contacts";
import { useEffect, useState, useCallback } from "react";

export default function AddContacts() {
	const [contacts, setContacts] = useState<Contacts.Contact[] | undefined>(
		undefined,
	);
	const [permissionStatus, setPermissionStatus] =
		useState<Contacts.PermissionStatus | null>(null);

	const updateContacts = useCallback(async () => {
		const { status } = await Contacts.getPermissionsAsync();
		setPermissionStatus(status);

		if (status !== Contacts.PermissionStatus.GRANTED) {
			return;
		}

		const { data } = await Contacts.getContactsAsync({
			fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
		});

		if (data.length > 0) {
			const contactsWithPhoneNumbers = data.filter(
				(contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0,
			);
			setContacts(contactsWithPhoneNumbers);
		}
	}, []);

	const requestContactsPermission = useCallback(async () => {
		const { status, canAskAgain } = await Contacts.requestPermissionsAsync();

		if (status === Contacts.PermissionStatus.GRANTED) {
			updateContacts();
		} else if (status === Contacts.PermissionStatus.DENIED && !canAskAgain) {
			Alert.alert(
				"Contacts Access Required",
				"Please enable contacts access in settings under Contacts -> Full Access",
				[
					{
						text: "Cancel",
					},
					{
						text: "Open Settings",
						onPress: () => Linking.openSettings(),
					},
				],
			);
		}

		setPermissionStatus(status);
	}, [updateContacts]);

	useEffect(() => {
		updateContacts();
	}, [updateContacts]);

	const contactsList = () => {
		return (
			<ScrollView className="flex-1 rounded-lg">
				{contacts ? (
					contacts.map((contact) => (
						<View
							key={contact.id}
							className="bg-white p-4 rounded-lg border border-neutral-200 mb-2"
						>
							<Text className="text-lg font-medium text-neutral-800">
								{contact.name || "Unknown"}
							</Text>

							<Text className="text-neutral-500 mt-1">
								{`${contact.phoneNumbers?.[0].countryCode?.toUpperCase()} ${contact.phoneNumbers?.[0].number}`}
							</Text>
						</View>
					))
				) : (
					<View className="items-center justify-center py-10">
						<Text className="text-neutral-500">Loading contacts...</Text>
					</View>
				)}
			</ScrollView>
		);
	};

	const renderContent = () => {
		if (permissionStatus === Contacts.PermissionStatus.GRANTED) {
			return contactsList();
		}

		return (
			<View className="flex-1 items-center justify-center">
				<View className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 w-full max-w-md">
					<Text className="text-xl font-semibold text-neutral-800 text-center mb-3">
						Contact Access Required
					</Text>
					<Text className="text-neutral-600 text-center mb-6">
						We need access to your contacts to help you connect with people you
						know. Your privacy is important to us.
					</Text>
					<TouchableHighlight
						onPress={requestContactsPermission}
						className="rounded-xl overflow-hidden mb-2"
					>
						<View className="bg-primary py-4 items-center">
							<Text className="text-white font-semibold">Request Access</Text>
						</View>
					</TouchableHighlight>
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView className="bg-neutral-100 h-full">
			<View className="p-4 flex-1 gap-4">
				<Text className="text-2xl text-neutral-700 font-semibold text-center">
					Add contacts
				</Text>
				<Text className="text-lg text-neutral-600 text-center">
					The last step is to upload your phone contacts. We use this data to
					build our network.
				</Text>

				{renderContent()}

				{permissionStatus === Contacts.PermissionStatus.GRANTED && (
					<TouchableHighlight
						onPress={() => {}}
						className="rounded-xl overflow-hidden"
					>
						<View className="bg-primary py-4 items-center">
							<Text className="text-white text-xl font-semibold">Submit</Text>
						</View>
					</TouchableHighlight>
				)}
			</View>
		</SafeAreaView>
	);
}
