import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

interface MeshBackgroundProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  isDark?: boolean;
}

export const MeshBackground: React.FC<MeshBackgroundProps> = ({ style, children, isDark = false }) => {
  const primary = isDark ? '#031745' : '#FFFFFF';
  const secondary = isDark ? '#050A17' : '#F8F9FA';
  const accent = isDark ? '#0050B4' : '#F0F4FF';

  return (
    <View style={[styles.container, { backgroundColor: primary }, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={secondary} stopOpacity="0.8" />
            <Stop offset="50%" stopColor={accent} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={primary} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={accent} stopOpacity="0.4" />
            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grad1)" />
        <Rect width="100%" height="100%" fill="url(#grad2)" />
      </Svg>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
