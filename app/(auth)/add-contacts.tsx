import { Text, View } from "react-native";
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
					setContacts(data);
				}
			}
		})();
	}, []);

	return (
		<SafeAreaView className="bg-neutral-100 h-full">
			<View className="p-4">
				<Text className="text-2xl text-neutral-700 font-semibold text-center">
					Add contacts
				</Text>
				<Text className="py-8 text-lg">
					The last step is to upload your phone contacts. We use this data to
					build our network.
				</Text>
				{contacts?.map((contact) => (
					<Text key={contact.id}>
						{contact.name} - {contact.phoneNumbers?.[0].number}
					</Text>
				))}
			</View>
		</SafeAreaView>
	);
}
