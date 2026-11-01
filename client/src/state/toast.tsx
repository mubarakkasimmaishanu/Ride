import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../theme';
import { haptic } from '../components/ui';

type Tone = 'success' | 'error' | 'info';
interface ToastMsg {
  id: number;
  text: string;
  tone: Tone;
}

const Ctx = createContext<(text: string, tone?: Tone) => void>(() => {});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback(
    (text: string, tone: Tone = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      haptic(tone === 'error' ? 'error' : tone === 'success' ? 'success' : 'light');
      setMsg({ id: Date.now(), text, tone });
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: Platform.OS !== 'web', bounciness: 8 }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }).start(() =>
          setMsg(null)
        );
      }, 3200);
    },
    [anim]
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const icon = msg?.tone === 'success' ? 'checkmark-circle' : msg?.tone === 'error' ? 'alert-circle' : 'information-circle';
  const iconColor = msg?.tone === 'success' ? colors.success : msg?.tone === 'error' ? colors.danger : colors.orange;

  return (
    <Ctx.Provider value={show}>
      {children}
      {msg && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { top: insets.top + 10 },
            {
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
            },
          ]}
        >
          <Ionicons name={icon as any} size={22} color={iconColor} />
          <Text style={styles.text}>{msg.text}</Text>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
};

export const useToast = () => useContext(Ctx);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.charcoal,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    zIndex: 9999,
    ...shadow(3),
  },
  text: { color: colors.white, fontWeight: '600', fontSize: 14, flex: 1, lineHeight: 19 },
});

// Silence unused import warning on platforms that tree-shake View
void View;
