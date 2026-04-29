import { View } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

const supported = isLiquidGlassAvailable();

const GlassCard = ({
  style,
  children,
  glassEffectStyle = 'regular',
  tintColor,
  isInteractive = false,
  fallbackColor = 'white',
  ...rest
}) => {
  if (supported) {
    return (
      <GlassView
        style={style}
        glassEffectStyle={glassEffectStyle}
        tintColor={tintColor}
        isInteractive={isInteractive}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }
  return (
    <View style={[{ backgroundColor: fallbackColor }, style]} {...rest}>
      {children}
    </View>
  );
};

export default GlassCard;
