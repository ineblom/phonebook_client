import { View } from "react-native";
import { Image, type ImageSource } from "expo-image";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

type Props = {
	imageSize: number;
	stickerSource: ImageSource;
};

export default function EmojiSticker({ imageSize, stickerSource }: Props) {
	const scale = useSharedValue(1);
	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);

	const doubleTap = Gesture.Tap()
		.numberOfTaps(2)
		.onStart(() => {
			if (scale.value !== 2) {
				scale.value = 2;
			} else {
				scale.value = 1;
			}
		});

	const drag = Gesture.Pan().onChange((event) => {
		translateX.value += event.changeX;
		translateY.value += event.changeY;
	});

	const containerStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{ translateX: translateX.value },
				{ translateY: translateY.value },
			],
		};
	});

	const imageStyle = useAnimatedStyle(() => {
		return {
			width: imageSize,
			height: imageSize,
			transform: [
				{ scale: withSpring(scale.value) }
			],
		};
	});

	return (
		<GestureDetector gesture={drag}>
			<Animated.View style={containerStyle}>
				<GestureDetector gesture={doubleTap}>
						<Animated.Image
							source={stickerSource}
							resizeMode="contain"
							style={imageStyle}
						/>
				</GestureDetector>
			</Animated.View>
		</GestureDetector>
	);
}
