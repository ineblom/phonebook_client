import { Text, View, TextInput } from "react-native";
import type { KeyboardTypeOptions } from "react-native";

type Props = {
	title: string;
	value: string;
	handleChangeText: (e: string) => void;
	otherStyles: string;
	keyboardType: string;
};

export default function FormField({
	title,
	value,
	handleChangeText,
	otherStyles,
	keyboardType,
}: Props) {
	const getKeyboardType = (): KeyboardTypeOptions => {
		if (keyboardType === "email-address") return "email-address";
		if (keyboardType === "numeric") return "numeric";
		if (keyboardType === "phone-pad") return "phone-pad";
		return "default";
	};

	return (
		<View className={`space-y-2 ${otherStyles}`}>

			<Text className="text-base text-neutral-700 font-medium">{title}</Text>

			<View
      className="border border-neutral-300 w-full h-16 px-4 bg-white rounded-2xl focus:border-secondary items-center flex-row">
				<TextInput
					value={value}
					onChangeText={handleChangeText}
					keyboardType={getKeyboardType()}
					secureTextEntry={keyboardType === "password"}
					className="flex-1"
          autoCapitalize="none"
          spellCheck={false}
				/>
			</View>
		</View>
	);
}
