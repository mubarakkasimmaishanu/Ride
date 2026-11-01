import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trip, User } from '../types';
import { api } from '../services/api';
import { KEYS, storage } from '../services/storage';
import { colors, radius, shadow } from '../theme';
import { formatTime, naira } from '../utils/format';
import { Badge, Button, IconButton } from './ui';

interface BookingModalProps {
  visible: boolean;
  trip: Trip | null;
  currentUser: User | null;
  onClose: () => void;
  onSuccess: (bookingData: any) => void;
  onOpenWalletDeposit: () => void;
}

type PayMethod = 'wallet' | 'paystack';

export const BookingModal: React.FC<BookingModalProps> = ({
  visible,
  trip,
  currentUser,
  onClose,
  onSuccess,
  onOpenWalletDeposit,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [method, setMethod] = useState<PayMethod>('wallet');
  const [paystackChannel, setPaystackChannel] = useState<'card' | 'transfer' | 'ussd'>('card');
  const [reservation, setReservation] = useState<{ reservationId: string; seats: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && trip) {
      setSelectedSeats(1);
      setReservation(null);
      setError(null);
      setSecondsLeft(600);
      const bal = currentUser?.walletBalance || 0;
      setMethod(bal >= trip.pricePerSeat ? 'wallet' : 'paystack');
    }
  }, [visible, trip, currentUser?.walletBalance]);

  useEffect(() => {
    if (!reservation) return;
    const t = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [reservation]);

  if (!trip) return null;

  const totalAmount = selectedSeats * trip.pricePerSeat;
  const walletBalance = currentUser?.walletBalance || 0;
  const enoughWallet = walletBalance >= totalAmount;

  const cacheOfflinePass = async (pass: any) => {
    try {
      const existingRaw = await storage.get(KEYS.passes);
      const list = existingRaw ? JSON.parse(existingRaw) : [];
      const next = [pass, ...list.filter((p: any) => p.bookingReference !== pass.bookingReference)].slice(0, 20);
      await storage.set(KEYS.passes, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  };

  const handleConfirm = async () => {
    if (method === 'wallet' && !enoughWallet) {
      onOpenWalletDeposit();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let activeResv = reservation;
      if (!activeResv || activeResv.seats !== selectedSeats) {
        const held = await api.reserveSeats(trip.id, selectedSeats);
        activeResv = { reservationId: held.reservationId, seats: held.seats };
        setReservation(activeResv);
        setSecondsLeft(600);
      }

      const confirmed =
        method === 'wallet'
          ? await api.payWithWallet(activeResv.reservationId)
          : await api.payWithPaystack(
              activeResv.reservationId,
              `PSTK-${paystackChannel.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`
            );

      const enriched = {
        ...confirmed,
        originCity: trip.route.originCity,
        destinationCity: trip.route.destinationCity,
        originHubName: trip.originHub.name,
        destinationHubName: trip.destinationHub.name,
        departureTime: trip.departureTime,
        seatsBooked: selectedSeats,
      };
      await cacheOfflinePass(enriched);
      onSuccess(enriched);
    } catch (err: any) {
      setError(err.message || 'Could not complete booking');
    } finally {
      setSubmitting(false);
    }
  };

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');

  // Visual seat layout: totalSeats (3 or 4)
  const totalCarSeats = trip.totalSeats;
  const alreadyBooked = trip.bookedSeats;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Select your seats</Text>
              <Text style={styles.subtitle}>
                {trip.route.originCity} → {trip.route.destinationCity} · Departs {formatTime(trip.departureTime)}
              </Text>
            </View>
            <IconButton icon="close" size={36} bg={colors.surfaceAlt} onPress={onClose} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {reservation && (
              <View style={styles.lockBanner}>
                <Ionicons name="time" size={16} color={colors.orange} />
                <Text style={styles.lockBannerText}>
                  Seats reserved for you · Expires in <Text style={{ fontWeight: '800' }}>{mins}:{secs}</Text>
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Interactive Car Cabin Seat Selector */}
            <View style={styles.cabinCard}>
              <View style={styles.cabinLeft}>
                <Text style={styles.sectionOverline}>CABIN SEAT LAYOUT</Text>
                <Text style={styles.cabinTitle}>
                  {selectedSeats} Passenger {selectedSeats === 1 ? 'Seat' : 'Seats'}
                </Text>
                <Text style={styles.cabinHint}>
                  Max {trip.totalSeats} riders · Zero overloading
                </Text>

                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() => setSelectedSeats(s => Math.max(1, s - 1))}
                    disabled={selectedSeats <= 1 || submitting}
                    style={[styles.stepCircle, selectedSeats <= 1 && { opacity: 0.35 }]}
                  >
                    <Ionicons name="remove" size={18} color={colors.text} />
                  </Pressable>
                  <Text style={styles.stepNum}>{selectedSeats}</Text>
                  <Pressable
                    onPress={() => setSelectedSeats(s => Math.min(trip.availableSeats, s + 1))}
                    disabled={selectedSeats >= trip.availableSeats || submitting}
                    style={[styles.stepCircle, styles.stepCircleOrange, selectedSeats >= trip.availableSeats && { opacity: 0.35 }]}
                  >
                    <Ionicons name="add" size={18} color={colors.white} />
                  </Pressable>
                </View>
              </View>

              {/* Top-Down Car Interior Diagram */}
              <View style={styles.carDiagram}>
                <View style={styles.windshield} />
                {/* Front Row: Driver + Front Passenger */}
                <View style={styles.carRow}>
                  <View style={[styles.carSeat, styles.carSeatDriver]}>
                    <Ionicons name="speedometer-outline" size={13} color={colors.textMuted} />
                  </View>
                  {(() => {
                    const taken = alreadyBooked >= totalCarSeats;
                    const chosen = !taken && selectedSeats >= 1;
                    return (
                      <Pressable
                        disabled={taken}
                        onPress={() => setSelectedSeats(1)}
                        style={[
                          styles.carSeat,
                          taken ? styles.carSeatTaken : chosen ? styles.carSeatSelected : styles.carSeatOpen,
                        ]}
                      >
                        <Text style={[styles.carSeatLabel, chosen && { color: colors.white }]}>1</Text>
                      </Pressable>
                    );
                  })()}
                </View>

                {/* Rear Row */}
                <View style={styles.carRow}>
                  {Array.from({ length: Math.max(2, totalCarSeats - 1) }).map((_, i) => {
                    const seatIndex = i + 2; // 2..totalCarSeats
                    const openOrdinal = seatIndex;
                    const isUnavailable = openOrdinal > trip.availableSeats;
                    const isChosen = !isUnavailable && selectedSeats >= openOrdinal;
                    return (
                      <Pressable
                        key={i}
                        disabled={isUnavailable}
                        onPress={() => setSelectedSeats(openOrdinal)}
                        style={[
                          styles.carSeat,
                          styles.carSeatRear,
                          isUnavailable
                            ? styles.carSeatTaken
                            : isChosen
                            ? styles.carSeatSelected
                            : styles.carSeatOpen,
                        ]}
                      >
                        <Text style={[styles.carSeatLabel, isChosen && { color: colors.white }]}>
                          {isUnavailable ? '×' : openOrdinal}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Meeting Point Privacy Vault Notice */}
            <View style={styles.privacyCard}>
              <View style={styles.privacyIconWrap}>
                <Ionicons name="shield-checkmark" size={17} color={colors.charcoal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyTitle}>{trip.originHub.name}</Text>
                <Text style={styles.privacyDesc}>
                  Exact micro-spot, plate number & driver phone unlock immediately upon payment.
                </Text>
              </View>
            </View>

            {/* Payment Method Picker */}
            <Text style={[styles.sectionOverline, { marginTop: 4, marginBottom: 8 }]}>PAYMENT METHOD</Text>

            <Pressable
              onPress={() => setMethod('wallet')}
              style={[styles.payCard, method === 'wallet' && styles.payCardSelected]}
            >
              <View style={[styles.payIcon, { backgroundColor: colors.orangeSoft }]}>
                <Ionicons name="wallet" size={20} color={colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.payTitle}>ride Cash Wallet</Text>
                  <Badge label="Instant" tone="success" />
                </View>
                <Text style={styles.paySub}>
                  Available: {naira(walletBalance)}{' '}
                  {!enoughWallet && <Text style={{ color: colors.danger, fontWeight: '700' }}>· Needs top-up</Text>}
                </Text>
              </View>
              {!enoughWallet ? (
                <Pressable onPress={onOpenWalletDeposit} style={styles.topUpMini}>
                  <Text style={styles.topUpMiniText}>+ Top Up</Text>
                </Pressable>
              ) : (
                <Ionicons
                  name={method === 'wallet' ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={method === 'wallet' ? colors.orange : colors.textMuted}
                />
              )}
            </Pressable>

            <Pressable
              onPress={() => setMethod('paystack')}
              style={[styles.payCard, method === 'paystack' && styles.payCardSelected]}
            >
              <View style={[styles.payIcon, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name="card" size={20} color={colors.charcoal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>Paystack Checkout</Text>
                <Text style={styles.paySub}>Card · Bank Transfer · USSD (*737#, *901#)</Text>
              </View>
              <Ionicons
                name={method === 'paystack' ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={method === 'paystack' ? colors.orange : colors.textMuted}
              />
            </Pressable>

            {method === 'paystack' && (
              <View style={styles.channelRow}>
                {([
                  ['card', 'card-outline', 'Debit Card'],
                  ['transfer', 'swap-horizontal-outline', 'Transfer'],
                  ['ussd', 'keypad-outline', 'USSD *737#'],
                ] as const).map(([key, ic, label]) => {
                  const active = paystackChannel === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setPaystackChannel(key)}
                      style={[styles.channelChip, active && styles.channelChipActive]}
                    >
                      <Ionicons name={ic as any} size={14} color={active ? colors.white : colors.textSecondary} />
                      <Text style={[styles.channelText, active && { color: colors.white }]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Fare Summary */}
            <View style={styles.summaryBox}>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>
                  Seat fare ({selectedSeats} × {naira(trip.pricePerSeat)})
                </Text>
                <Text style={styles.sumVal}>{naira(totalAmount)}</Text>
              </View>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>₦150 Accident Micro-Insurance</Text>
                <Text style={[styles.sumVal, { color: colors.success }]}>Included</Text>
              </View>
              <View style={styles.sumDivider} />
              <View style={styles.sumRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalVal}>{naira(totalAmount)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom CTA */}
          <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}>
            <Button
              title={
                method === 'wallet' && !enoughWallet
                  ? `Top Up Wallet to Pay ${naira(totalAmount)}`
                  : `Confirm & Pay ${naira(totalAmount)}`
              }
              onPress={handleConfirm}
              loading={submitting}
              variant="primary"
              icon="lock-open-outline"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 29, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 10,
    ...shadow(3),
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollBody: {
    padding: 20,
    gap: 12,
  },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.orangeSoft,
    padding: 10,
    borderRadius: radius.md,
  },
  lockBannerText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.orange,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    padding: 12,
    borderRadius: radius.md,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  cabinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  cabinLeft: {
    flex: 1,
  },
  sectionOverline: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: colors.textMuted,
  },
  cabinTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  cabinHint: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleOrange: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  stepNum: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  carDiagram: {
    width: 112,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 10,
    borderWidth: 2,
    borderColor: '#FED7AA',
    gap: 8,
  },
  windshield: {
    height: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: colors.orangeSoft,
  },
  carRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },
  carSeat: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  carSeatRear: {
    height: 30,
  },
  carSeatDriver: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  carSeatOpen: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  carSeatSelected: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  carSeatTaken: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
  },
  carSeatLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.orangeSoft,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  privacyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  privacyDesc: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  payCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    backgroundColor: colors.white,
  },
  payCardSelected: {
    borderColor: colors.orange,
    backgroundColor: '#FFFBF8',
  },
  payIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  paySub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  topUpMini: {
    backgroundColor: colors.orangeDeep,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  topUpMiniText: {
    color: colors.white,
    fontSize: 11.5,
    fontWeight: '800',
  },
  channelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  channelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  channelChipActive: {
    backgroundColor: colors.charcoal,
    borderColor: colors.charcoal,
  },
  channelText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  summaryBox: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
    gap: 6,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sumLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  sumVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  sumDivider: {
    height: 1,
    backgroundColor: '#FED7AA',
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.orange,
  },
  stickyFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.white,
  },
});
