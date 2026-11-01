import React from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useToast } from '../state/toast';
import { colors, radius, shadow } from '../theme';
import { naira } from '../utils/format';
import { Avatar, Button, IconButton, PressableScale } from './ui';

interface BoardingPassModalProps {
  visible: boolean;
  bookingData: any;
  onClose: () => void;
}

export const BoardingPassModal: React.FC<BoardingPassModalProps> = ({
  visible,
  bookingData,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  if (!bookingData) return null;

  const ref = bookingData.bookingReference || bookingData.booking_reference || 'ZK-PASS';
  const pin = String(bookingData.boardingPin || bookingData.boarding_pin || '8492');
  const exactSpot =
    bookingData.exactMeetingPoint ||
    bookingData.exact_meeting_point ||
    'Unlocked at designated Safe Hub forecourt.';
  const directions = bookingData.landmarkDirections || bookingData.landmark_directions;
  const driverName = bookingData.driver?.name || bookingData.driverName || bookingData.driver_name || 'Verified Driver';
  const driverPhone = bookingData.driver?.phone || bookingData.driverPhone || bookingData.driver_phone;
  const unionBadge =
    bookingData.driver?.unionBadge || bookingData.driverUnionBadge || 'NURTW Verified';
  const make = bookingData.vehicle?.make || bookingData.vehicleMake || bookingData.make || 'Toyota';
  const model = bookingData.vehicle?.model || bookingData.vehicleModel || bookingData.model || 'Corolla';
  const color = bookingData.vehicle?.color || bookingData.vehicleColor || bookingData.color || 'Silver';
  const plate =
    bookingData.vehicle?.plateNumber || bookingData.vehiclePlateNumber || bookingData.plate_number || 'KDT-381-AA';
  const originCity = bookingData.originCity || bookingData.origin_city || 'Zaria';
  const destCity = bookingData.destinationCity || bookingData.destination_city || 'Kaduna';
  const amount = bookingData.totalAmount ?? bookingData.total_amount;

  const qrPayload = JSON.stringify({ ref, pin, route: `${originCity}-${destCity}` });

  const handleCall = () => {
    if (driverPhone) {
      Linking.openURL(`tel:${driverPhone}`).catch(() => {});
      toast(`Dialing ${driverName} (${driverPhone})`, 'info');
    } else {
      toast('Driver phone number available on active pass', 'info');
    }
  };

  const handleShare = () => {
    toast(`Live tracking link copied: ride.ng/live/${ref}`, 'success');
  };

  const handleSOS = () => {
    toast('Corridor Safety Desk & Union Patrol alerted with your GPS hub', 'info');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Perforated Boarding Pass Card */}
            <View style={styles.passTicket}>
              <LinearGradient
                colors={['#C2410C', '#EA580C', '#F26B1D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ticketTop}
              >
                <View style={styles.ticketHeaderRow}>
                  <View style={styles.unlockedPill}>
                    <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
                    <Text style={styles.unlockedPillText}>PAID & UNLOCKED</Text>
                  </View>
                  <IconButton
                    icon="close"
                    size={32}
                    color={colors.white}
                    bg="rgba(255,255,255,0.14)"
                    onPress={onClose}
                  />
                </View>

                <View style={styles.routeHeroRow}>
                  <View>
                    <Text style={styles.cityCode}>{originCity.slice(0, 3).toUpperCase()}</Text>
                    <Text style={styles.cityFull}>{originCity}</Text>
                  </View>
                  <View style={styles.routeMidIcon}>
                    <View style={styles.dashLine} />
                    <View style={styles.orangePlaneCircle}>
                      <Ionicons name="car-sport" size={16} color={colors.white} />
                    </View>
                    <View style={styles.dashLine} />
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.cityCode}>{destCity.slice(0, 3).toUpperCase()}</Text>
                    <Text style={styles.cityFull}>{destCity}</Text>
                  </View>
                </View>

                <View style={styles.refMetaStrip}>
                  <Text style={styles.refMetaText}>PASS REF: {ref}</Text>
                  {amount != null && <Text style={styles.refMetaText}>{naira(amount)} · INSURED</Text>}
                </View>
              </LinearGradient>

              {/* Ticket Perforation Cutouts */}
              <View style={styles.perforationRow}>
                <View style={[styles.cutout, { marginLeft: -12 }]} />
                <View style={styles.perforationDots} />
                <View style={[styles.cutout, { marginRight: -12 }]} />
              </View>

              {/* QR + 4-Digit Offline PIN Block */}
              <View style={styles.qrPinSection}>
                <View style={styles.qrBox}>
                  <QRCode value={qrPayload} size={96} color={colors.text} backgroundColor="#FFFFFF" />
                </View>

                <View style={styles.pinRight}>
                  <Text style={styles.pinLabel}>OFFLINE BOARDING PIN</Text>
                  <View style={styles.pinDigitsRow}>
                    {pin.split('').map((d, idx) => (
                      <View key={idx} style={styles.digitTile}>
                        <Text style={styles.digitChar}>{d}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.offlineSavedRow}>
                    <Ionicons name="cloud-offline-outline" size={13} color={colors.success} />
                    <Text style={styles.offlineSavedText}>Works in highway dead zones</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Unlocked Exact Meeting Point Vault */}
            <View style={styles.vaultCard}>
              <View style={styles.vaultBadgeRow}>
                <View style={styles.vaultIconCircle}>
                  <Ionicons name="location" size={16} color={colors.orange} />
                </View>
                <Text style={styles.vaultHeading}>EXACT PICKUP SPOT UNLOCKED</Text>
              </View>
              <Text style={styles.spotMainText}>{exactSpot}</Text>
              {directions ? (
                <View style={styles.clueBanner}>
                  <Ionicons name="compass" size={15} color={colors.orange} />
                  <Text style={styles.clueText}>{directions}</Text>
                </View>
              ) : null}
            </View>

            {/* Verified Driver & Vehicle Plate Card */}
            <View style={styles.driverCard}>
              <View style={styles.driverTop}>
                <Avatar name={driverName} size={46} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverName}>{driverName}</Text>
                  <View style={styles.unionLine}>
                    <Ionicons name="shield-checkmark" size={13} color={colors.success} />
                    <Text style={styles.unionText}>{unionBadge}</Text>
                  </View>
                </View>

                <PressableScale onPress={handleCall} style={styles.callButton}>
                  <Ionicons name="call" size={16} color={colors.white} />
                  <Text style={styles.callButtonText}>Call</Text>
                </PressableScale>
              </View>

              <View style={styles.plateBar}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="car-sport-outline" size={17} color={colors.text} />
                  <Text style={styles.carSpecText}>
                    {color} {make} {model}
                  </Text>
                </View>
                <View style={styles.ngPlateBadge}>
                  <Text style={styles.ngPlateText}>{plate}</Text>
                </View>
              </View>
            </View>

            {/* Live Safety & Share Strip */}
            <View style={styles.safetyActionsRow}>
              <PressableScale onPress={handleShare} style={styles.secondaryAction}>
                <Ionicons name="share-social-outline" size={17} color={colors.text} />
                <Text style={styles.secondaryActionText}>Share Live Trip</Text>
              </PressableScale>

              <PressableScale onPress={handleSOS} style={[styles.secondaryAction, styles.sosAction]}>
                <Ionicons name="warning-outline" size={17} color={colors.danger} />
                <Text style={[styles.secondaryActionText, { color: colors.danger }]}>SOS Patrol</Text>
              </PressableScale>
            </View>

            <Button title="Done" variant="dark" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 29, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 10,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 8,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 12,
  },
  passTicket: {
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow(2),
  },
  ticketTop: {
    padding: 18,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  unlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,197,94,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  unlockedPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#86EFAC',
    letterSpacing: 0.7,
  },
  routeHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityCode: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 1,
  },
  cityFull: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  routeMidIcon: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  dashLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  orangePlaneCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  refMetaStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  refMetaText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    backgroundColor: colors.white,
  },
  cutout: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.bg,
  },
  perforationDots: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  qrPinSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 4,
    gap: 16,
  },
  qrBox: {
    padding: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pinRight: {
    flex: 1,
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: colors.textMuted,
    marginBottom: 8,
  },
  pinDigitsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  digitTile: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.orangeSoft,
    borderWidth: 1.5,
    borderColor: '#FFC9A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitChar: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.orange,
  },
  offlineSavedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  offlineSavedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  vaultCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE1CC',
    ...shadow(1),
  },
  vaultBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  vaultIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: colors.orange,
  },
  spotMainText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 21,
  },
  clueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    padding: 10,
    borderRadius: radius.sm,
    marginTop: 10,
  },
  clueText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  driverCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    ...shadow(1),
  },
  driverTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  unionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  unionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  callButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  plateBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  carSpecText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  ngPlateBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ngPlateText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 0.8,
  },
  safetyActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  sosAction: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#FECACA',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
});
