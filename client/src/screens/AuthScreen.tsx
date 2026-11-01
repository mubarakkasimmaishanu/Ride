import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, setAuthToken } from '../services/api';
import { KEYS, storage } from '../services/storage';
import { normalizeUser, useSession } from '../state/session';
import { useToast } from '../state/toast';
import { colors, font, radius, shadow } from '../theme';
import { formatPhone } from '../utils/format';
import { Button, PressableScale } from '../components/ui';

interface AuthScreenProps {
  onAuthenticated: (role?: 'passenger' | 'driver' | 'admin') => void;
}

type Mode = 'signup' | 'signin' | 'driver';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, restore } = useSession();
  const toast = useToast();

  const [mode, setMode] = useState<Mode>('signup');
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Shared fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Driver 3-step Union fields
  const [driverStep, setDriverStep] = useState<1 | 2 | 3>(1);
  const [nin, setNin] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [unionName, setUnionName] = useState<'NURTW' | 'RTEAN' | 'STATE_UNION'>('NURTW');
  const [unionCity, setUnionCity] = useState<'Zaria' | 'Kaduna' | 'Kano'>('Zaria');
  const [unionId, setUnionId] = useState('');
  const [vehicleMake, setVehicleMake] = useState('Toyota');
  const [vehicleModel, setVehicleModel] = useState('Corolla');
  const [vehicleColor, setVehicleColor] = useState('Silver');
  const [plateNumber, setPlateNumber] = useState('');
  const [capacity, setCapacity] = useState<3 | 4>(4);

  const rawDigits = (v: string) => v.replace(/\D/g, '');

  const handleQuickDemo = async (roleLabel: 'passenger' | 'driver' | 'admin', demoPhone: string) => {
    setQuickLoading(roleLabel);
    try {
      const u = await signIn(demoPhone, 'password123');
      toast(`Welcome back, ${u.fullName.split(' ')[0]}!`, 'success');
      onAuthenticated(u.role);
    } catch (err: any) {
      toast(err.message || 'Demo login failed', 'error');
    } finally {
      setQuickLoading(null);
    }
  };

  const handleSubmit = async () => {
    const cleanPhone = rawDigits(phone);
    if (cleanPhone.length < 10) {
      toast('Enter a valid 11-digit Nigerian phone number', 'error');
      return;
    }
    if (!password || password.length < 4) {
      toast('Enter your password (at least 4 characters)', 'error');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const u = await signIn(cleanPhone, password);
        toast(`Welcome back, ${u.fullName}!`, 'success');
        onAuthenticated(u.role);
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          toast('Please enter your full legal name', 'error');
          setLoading(false);
          return;
        }
        const u = await signUp({ fullName: fullName.trim(), phoneNumber: cleanPhone, password });
        toast(`Welcome to ride, ${u.fullName.split(' ')[0]}!`, 'success');
        onAuthenticated('passenger');
      } else {
        // Driver step handling
        if (driverStep === 1) {
          if (!fullName.trim() || !nin.trim()) {
            toast('Enter your legal name and 11-digit NIN', 'error');
            setLoading(false);
            return;
          }
          setDriverStep(2);
          setLoading(false);
          return;
        }
        if (driverStep === 2) {
          if (!licenseNumber.trim() || !unionId.trim()) {
            toast('Enter your license and Union membership number', 'error');
            setLoading(false);
            return;
          }
          setDriverStep(3);
          setLoading(false);
          return;
        }
        if (!plateNumber.trim()) {
          toast('Enter your vehicle registration plate number', 'error');
          setLoading(false);
          return;
        }
        const res = await api.register({
          fullName: fullName.trim(),
          phoneNumber: cleanPhone,
          password,
          role: 'driver',
          nin: nin.trim(),
          licenseNumber: licenseNumber.trim(),
          unionName,
          unionBranchCity: unionCity,
          unionMembershipNumber: unionId.trim(),
          vehicleMake,
          vehicleModel,
          vehicleColor,
          plateNumber: plateNumber.trim().toUpperCase(),
          passengerCapacity: capacity,
          hasAirConditioning: true,
        });
        setAuthToken(res.token);
        const u = normalizeUser({ ...res.user, walletBalance: 0 });
        await storage.set(KEYS.token, res.token);
        await storage.set(KEYS.user, JSON.stringify(u));
        await restore();
        toast('Driver application submitted for Union vetting!', 'success');
        onAuthenticated('driver');
      }
    } catch (err: any) {
      toast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Math.max(insets.top, 20) + 10,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/brand/logo-transparent.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeTitle}>
            {mode === 'signup'
              ? 'Create Your Account'
              : mode === 'signin'
              ? 'Welcome Back'
              : 'Driver Registration'}
          </Text>
          <Text style={styles.welcomeSub}>
            {mode === 'signup'
              ? 'Book verified corridor rides between Zaria, Kaduna & Kano'
              : mode === 'signin'
              ? 'Sign in to access your bookings, tickets and ride Cash'
              : 'Monetize empty seats with Union accreditation'}
          </Text>
        </View>

        {/* Segmented Auth Mode Switcher */}
        <View style={styles.segmentWrap}>
          {([
            ['signup', 'Sign Up'],
            ['signin', 'Sign In'],
            ['driver', 'Drive & Earn'],
          ] as const).map(([key, label]) => {
            const active = mode === key;
            return (
              <Pressable
                key={key}
                onPress={() => setMode(key)}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Main Form Card */}
        <View style={styles.formCard}>
          {/* Full Legal Name (Sign Up or Driver Step 1) */}
          {(mode === 'signup' || (mode === 'driver' && driverStep === 1)) && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Legal Name</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={18} color={colors.orange} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Sadiq Abubakar"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          )}

          {/* Phone Number (Sign In, Sign Up, or Driver Step 1) */}
          {(mode !== 'driver' || driverStep === 1) && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputBox}>
                <View style={styles.ngPrefix}>
                  <Text style={styles.ngFlag}>🇳🇬 +234</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={t => setPhone(formatPhone(t))}
                  keyboardType="phone-pad"
                  placeholder="0803 123 4567"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          )}

          {/* Password (Sign In, Sign Up, or Driver Step 1) */}
          {(mode !== 'driver' || driverStep === 1) && (
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  {mode === 'signin' ? 'Password' : 'Create Password'}
                </Text>
                {mode === 'signin' && (
                  <Pressable onPress={() => toast('Password reset link sent to registered phone', 'info')}>
                    <Text style={styles.forgotLink}>Forgot password?</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.orange} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textMuted}
                />
                <Pressable onPress={() => setShowPassword(p => !p)} hitSlop={10}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>
          )}

          {/* Driver Multi-Step Questionnaire */}
          {mode === 'driver' && (
            <View style={styles.driverStepsWrap}>
              <View style={styles.stepIndicatorRow}>
                {[1, 2, 3].map(s => (
                  <Pressable
                    key={s}
                    onPress={() => setDriverStep(s as 1 | 2 | 3)}
                    style={[styles.stepPill, driverStep === s && styles.stepPillActive]}
                  >
                    <Text style={[styles.stepPillText, driverStep === s && styles.stepPillTextActive]}>
                      Step {s}: {s === 1 ? 'NIN' : s === 2 ? 'Union' : 'Vehicle'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {driverStep === 1 && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>National Identity Number (11-digit NIN)</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="finger-print-outline" size={18} color={colors.orange} />
                    <TextInput
                      style={styles.input}
                      value={nin}
                      onChangeText={t => setNin(rawDigits(t).slice(0, 11))}
                      keyboardType="number-pad"
                      placeholder="e.g. 12345678901"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              )}

              {driverStep === 2 && (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Driver's License Number</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="card-outline" size={18} color={colors.orange} />
                      <TextInput
                        style={styles.input}
                        value={licenseNumber}
                        onChangeText={setLicenseNumber}
                        placeholder="e.g. KAD09848AA1"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Road Transport Union Affiliation</Text>
                    <View style={styles.chipRow}>
                      {(['NURTW', 'RTEAN', 'STATE_UNION'] as const).map(u => (
                        <Pressable
                          key={u}
                          onPress={() => setUnionName(u)}
                          style={[styles.choiceChip, unionName === u && styles.choiceChipActive]}
                        >
                          <Text style={[styles.choiceText, unionName === u && styles.choiceTextActive]}>
                            {u === 'NURTW' ? 'NURTW' : u === 'RTEAN' ? 'RTEAN' : 'State Union'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Primary Corridor Branch City</Text>
                    <View style={styles.chipRow}>
                      {(['Zaria', 'Kaduna', 'Kano'] as const).map(c => (
                        <Pressable
                          key={c}
                          onPress={() => setUnionCity(c)}
                          style={[styles.choiceChip, unionCity === c && styles.choiceChipActive]}
                        >
                          <Text style={[styles.choiceText, unionCity === c && styles.choiceTextActive]}>
                            {c} Branch
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Union Membership ID / Badge Number</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="shield-outline" size={18} color={colors.orange} />
                      <TextInput
                        style={styles.input}
                        value={unionId}
                        onChangeText={setUnionId}
                        placeholder="e.g. NURTW-KD-4821"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>
                </>
              )}

              {driverStep === 3 && (
                <>
                  <View style={styles.twoCol}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Make</Text>
                      <View style={styles.inputBox}>
                        <TextInput
                          style={styles.input}
                          value={vehicleMake}
                          onChangeText={setVehicleMake}
                          placeholder="Toyota"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                    </View>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Model</Text>
                      <View style={styles.inputBox}>
                        <TextInput
                          style={styles.input}
                          value={vehicleModel}
                          onChangeText={setVehicleModel}
                          placeholder="Corolla"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Color</Text>
                      <View style={styles.inputBox}>
                        <TextInput
                          style={styles.input}
                          value={vehicleColor}
                          onChangeText={setVehicleColor}
                          placeholder="Silver"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                    </View>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Plate Number</Text>
                      <View style={styles.inputBox}>
                        <TextInput
                          style={styles.input}
                          value={plateNumber}
                          onChangeText={setPlateNumber}
                          placeholder="KDT-123-AA"
                          placeholderTextColor={colors.textMuted}
                          autoCapitalize="characters"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Passenger Capacity</Text>
                    <View style={styles.chipRow}>
                      {([3, 4] as const).map(n => (
                        <Pressable
                          key={n}
                          onPress={() => setCapacity(n)}
                          style={[styles.choiceChip, capacity === n && styles.choiceChipActive]}
                        >
                          <Text style={[styles.choiceText, capacity === n && styles.choiceTextActive]}>
                            {n} Passenger Seats (Zero Overloading)
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Primary Action Button */}
          <Button
            title={
              loading
                ? 'Processing...'
                : mode === 'signup'
                ? 'Create Account & Continue'
                : mode === 'signin'
                ? 'Sign In to ride'
                : driverStep < 3
                ? `Continue to Step ${driverStep + 1}`
                : 'Submit Driver Application'
            }
            onPress={handleSubmit}
            loading={loading}
            variant="primary"
            iconRight="arrow-forward"
            style={{ marginTop: 6 }}
          />

          {/* Switch Mode Prompt */}
          <View style={styles.switchPromptRow}>
            <Text style={styles.switchPromptText}>
              {mode === 'signup'
                ? 'Already have an account?'
                : mode === 'signin'
                ? "Don't have an account yet?"
                : 'Already accredited?'}
            </Text>
            <Pressable
              onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              hitSlop={8}
            >
              <Text style={styles.switchPromptAction}>
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Subtle Testing Demo Switcher at Bottom */}
        <View style={styles.demoSection}>
          <View style={styles.demoDividerRow}>
            <View style={styles.demoLine} />
            <Text style={styles.demoDividerText}>QUICK DEMO TEST ACCESS</Text>
            <View style={styles.demoLine} />
          </View>

          <View style={styles.demoPillsRow}>
            <PressableScale
              onPress={() => handleQuickDemo('passenger', '08011112222')}
              disabled={Boolean(quickLoading)}
              style={styles.demoPill}
            >
              <Ionicons name="person" size={13} color={colors.orange} />
              <Text style={styles.demoPillText}>Rider (Amina)</Text>
            </PressableScale>

            <PressableScale
              onPress={() => handleQuickDemo('driver', '08033334444')}
              disabled={Boolean(quickLoading)}
              style={styles.demoPill}
            >
              <Ionicons name="car-sport" size={13} color={colors.orange} />
              <Text style={styles.demoPillText}>Driver (Ahmed)</Text>
            </PressableScale>

            <PressableScale
              onPress={() => handleQuickDemo('admin', '08000000000')}
              disabled={Boolean(quickLoading)}
              style={styles.demoPill}
            >
              <Ionicons name="shield-checkmark" size={13} color={colors.orange} />
              <Text style={styles.demoPillText}>Admin Ops</Text>
            </PressableScale>
          </View>
        </View>

        {/* Footer Terms */}
        <Text style={styles.footerTerms}>
          By continuing, you agree to ride's Safe Hub Policy & Terms of Service.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
    marginBottom: 14,
    ...shadow(2),
  },
  logo: {
    width: 110,
    height: 48,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: colors.orangeSoft,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: colors.orange,
    ...shadow(1),
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 20,
    gap: 14,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
    ...shadow(2),
  },
  fieldGroup: {
    gap: 5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  forgotLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.orange,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ngPrefix: {
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  ngFlag: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.orangeDeep,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.text,
    height: '100%',
  },
  driverStepsWrap: {
    gap: 12,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  stepPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.orangeBorder,
  },
  stepPillActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  stepPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stepPillTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.orangeSoft,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
  },
  choiceChipActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  choiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  choiceTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  switchPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  switchPromptText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  switchPromptAction: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.orange,
  },
  demoSection: {
    marginTop: 22,
    gap: 10,
  },
  demoDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  demoLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.orangeBorder,
  },
  demoDividerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textMuted,
  },
  demoPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.white,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
    ...shadow(1),
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  footerTerms: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
});
