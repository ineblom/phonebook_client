import React from "react";
import type { ReactNode } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

interface LoadingWrapperProps {
  children: ReactNode;
  isLoading: boolean;
  showSpinner?: boolean;
  spinnerSize?: "small" | "large";
  spinnerColor?: string;
}

/**
 * A wrapper component that handles loading states
 * When loading, it disables interactions and applies opacity to children
 * Optionally shows a spinner overlay
 */
export default function LoadingWrapper({
  children,
  isLoading,
  showSpinner = false,
  spinnerSize = "small",
  spinnerColor = "#0091ff",
}: LoadingWrapperProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Render children with reduced opacity */}
      <View style={styles.contentWrapper}>{children}</View>

      {/* Optional loading spinner overlay */}
      {showSpinner && (
        <View style={styles.spinnerOverlay}>
          <ActivityIndicator size={spinnerSize} color={spinnerColor} />
        </View>
      )}

      {/* Invisible touch blocker when loading */}
      <View style={styles.touchBlocker} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  contentWrapper: {
    opacity: 0.6,
  },
  spinnerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  touchBlocker: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 5,
  },
}); 