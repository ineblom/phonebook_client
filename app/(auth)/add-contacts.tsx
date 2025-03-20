import {
  Text,
  View,
  ScrollView,
  TouchableHighlight,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Contacts from "expo-contacts";
import { useEffect, useState, useCallback } from "react";
import { api_addContacts, type ContactData } from "@/api/requests";
import { useRouter } from "expo-router";
import LoadingWrapper from "@/components/LoadingWrapper";

export default function AddContacts() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contacts.Contact[] | undefined>(
    undefined,
  );
  const [permissionStatus, setPermissionStatus] =
    useState<Contacts.PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { status } = await Contacts.getPermissionsAsync();
      setPermissionStatus(status);

      if (status !== Contacts.PermissionStatus.GRANTED) {
        setIsLoading(false);
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
    } catch (err) {
      setError("Failed to load contacts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestContactsPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

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
    } catch (err) {
      setError("Failed to request permission. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [updateContacts]);

  useEffect(() => {
    updateContacts();
  }, [updateContacts]);

  const handleSubmit = async () => {
    if (!contacts) {
      return;
    }

    setIsLoading(true);
    setError(null);
    const contactsData: ContactData[] = [];

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const phoneNumber = contact.phoneNumbers?.[0];
      if (phoneNumber) {
        contactsData.push({
          name: contact.name,
          country_code: phoneNumber.countryCode || "",
          number: phoneNumber.digits || "",
        });
      }
    }

    const { error } = await api_addContacts(contactsData);
    if (error) {
      setError(error instanceof Error ? error.message : "Failed to add contacts");
      setIsLoading(false);
      return;
    }

    router.replace("/(tabs)/explore");

    setIsLoading(false);
  };

  const renderContactsList = () => {
    if (!contacts) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="text-neutral-500 mt-4">Loading contacts...</Text>
        </View>
      );
    }

    return (
      <View className="flex-1 gap-4">
        <ScrollView className="rounded-lg">
          {contacts.length > 0 ? (
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
              <Text className="text-neutral-500">No contacts found</Text>
            </View>
          )}
        </ScrollView>

        <TouchableHighlight
          onPress={handleSubmit}
          className="rounded-xl overflow-hidden"
        >
          <View className="bg-primary py-4 items-center">
            <Text className="text-white text-xl font-semibold">Submit</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  };

  const renderRequestAccess = () => {
    if (permissionStatus === null) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="text-neutral-500 mt-4">Checking permissions...</Text>
        </View>
      );
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

  const renderError = () => {
    return (
      <View className="bg-red-100 p-3 rounded-lg mb-2">
        <Text className="text-red-700 text-center">{error}</Text>
      </View>
    );
  };

  const renderContent = () => {
    if (permissionStatus === Contacts.PermissionStatus.GRANTED) {
      return renderContactsList();
    }

    return renderRequestAccess();
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

        {error && renderError()}
        <LoadingWrapper
          isLoading={isLoading}
          showSpinner={true}
          spinnerColor="#0091ff"
        >
          {renderContent()}
        </LoadingWrapper>
      </View>
    </SafeAreaView>
  );
}
