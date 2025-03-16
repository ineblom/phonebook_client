import { Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Contacts from "expo-contacts";
import { useEffect, useState } from "react";

export default function AddContacts() {
	const [contacts, setContacts] = useState<Contacts.Contact[] | undefined>(
		undefined,
	);

	useEffect(() => {
		(async () => {
			const { status } = await Contacts.requestPermissionsAsync();
			if (status === "granted") {
				const { data } = await Contacts.getContactsAsync({
					fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
				});

				if (data.length > 0) {
					const contactsWithPhoneNumbers = data.filter(
						(contact) =>
							contact.phoneNumbers && contact.phoneNumbers.length > 0,
					);
					setContacts(contactsWithPhoneNumbers);
				}
			}
		})();
	}, []);

	return (
		<SafeAreaView className="bg-neutral-100 h-full">
			<View className="p-4 flex-1">
				<Text className="text-2xl text-neutral-700 font-semibold text-center">
					Add contacts
				</Text>
				<Text className="py-4 text-lg text-neutral-600 text-center">
					The last step is to upload your phone contacts. We use this data to
					build our network.
				</Text>

				<ScrollView className="flex-1 mt-2">
					{contacts ? (
						contacts.map((contact, index) => (
							<View 
								key={contact.id}
								className="bg-white p-4 mb-2 rounded-lg border border-neutral-200"
							>
								<Text className="text-lg font-medium text-neutral-800">
									{contact.name || "Unknown"}
								</Text>
								{contact.phoneNumbers?.[0]?.number && (
									<Text className="text-neutral-500 mt-1">
										{contact.phoneNumbers[0].number}
									</Text>
								)}
							</View>
						))
					) : (
						<View className="items-center justify-center py-10">
							<Text className="text-neutral-500">Loading contacts...</Text>
						</View>
					)}
				</ScrollView>
			</View>
		</SafeAreaView>
	);
}
