import React from "react";
import type { ReactNode } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

interface LoadingWrapperProps {
  children: ReactNode;
  isLoading: boolean;
  size?: "small" | "large";
  color?: string;
}

export function LoadingWrapper({
  children,
  isLoading,
  size = "large",
  color = "#0000ff",
}: LoadingWrapperProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
