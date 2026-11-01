import React, { useCallback, useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, WalletTransaction } from '../services/api';
import { useToast } from '../state/toast';
import { colors, font, radius, shadow } from '../theme';
import { formatDay, formatTime, naira } from '../utils/format';
import { EmptyState, PressableScale, SectionTitle, Skeleton } from '../components/ui';

interface WalletScreenProps {
  balance: number;
  userName?: string;
  userRole?: 'passenger' | 'driver' | 'admin';
  onBalanceUpdated: (next: number) => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  balance,
  userName,
  userRole = 'passenger',
  onBalanceUpdated,
}) => {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [txs, setTxs] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState<number | null>(null);

  const loadTxs = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getWalletTransactions();
      setTxs(list);
    } catch {
      // silent fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTxs();
  }, [loadTxs]);

  const handleDeposit = async (amount: number) => {
    setDepositing(amount);
    try {
      const res = await api.depositToWallet(amount);
      onBalanceUpdated(res.balance);
      toast(`${naira(amount)} added to ${userRole === 'driver' ? 'earnings float' : 'ride Cash'}!`, 'success');
      loadTxs();
    } catch (err: any) {
      toast(err.message || 'Top-up failed', 'error');
    } finally {
      setDepositing(null);
    }
  };

  const headerTitle =
    userRole === 'driver' ? 'Driver Earnings' : userRole === 'admin' ? 'Platform Treasury' : 'ride Cash';
  const walletBadge =
    userRole === 'driver' ? 'DRIVER EARNINGS' : userRole === 'admin' ? 'OPERATIONS TREASURY' : 'NGN WALLET';
  const refundPillText =
    userRole === 'driver' ? 'Daily Settlement' : userRole === 'admin' ? 'Platform Escrow' : 'Instant Refund';
  const balanceLabel =
    userRole === 'driver' ? 'AVAILABLE FOR WITHDRAWAL' : userRole === 'admin' ? 'SETTLED ESCROW' : 'AVAILABLE BALANCE';

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={loadTxs} tintColor={colors.orange} />}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <Text style={font.h1}>{headerTitle}</Text>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/brand/logo-transparent.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Flagship Monochromatic Sunset Virtual Card */}
        <LinearGradient
          colors={['#C2410C', '#EA580C', '#F26B1D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.virtualCard}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.currencyBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.currencyText}>{walletBadge}</Text>
            </View>
            <View style={styles.shieldPill}>
              <Ionicons name="flash" size={11} color={colors.white} />
              <Text style={styles.shieldText}>{refundPillText}</Text>
            </View>
          </View>

          <Text style={styles.balanceCaption}>{balanceLabel}</Text>
          <Text style={styles.balanceHero}>{naira(balance)}</Text>

          <View style={styles.cardBottomRow}>
            <View style={styles.holderCol}>
              <Text style={styles.holderLabel}>
                {userRole === 'driver' ? 'ACCREDITED DRIVER' : userRole === 'admin' ? 'OPS OFFICER' : 'ACCOUNT HOLDER'}
              </Text>
              <Text style={styles.holderName}>{userName || 'ride Member'}</Text>
            </View>
            <Ionicons name="card" size={24} color="rgba(255,255,255,0.7)" />
          </View>
        </LinearGradient>

        {/* Structured 2x2 Quick Top-Up Grid */}
        <SectionTitle
          title={userRole === 'driver' ? 'Add Float / Top Up' : 'Add Funds'}
          style={{ marginTop: 22 }}
        />
        <View style={styles.topUpGrid}>
          <View style={styles.topUpRow}>
            {[2000, 5000].map(amt => {
              const busy = depositing === amt;
              return (
                <PressableScale
                  key={amt}
                  onPress={() => handleDeposit(amt)}
                  disabled={Boolean(depositing)}
                  style={[styles.topUpTile, busy && styles.topUpTileActive]}
                >
                  <Text style={[styles.topUpPlus, busy && { color: colors.white }]} numberOfLines={1}>
                    +{naira(amt)}
                  </Text>
                  <Text style={[styles.topUpCaption, busy && { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>
                    {busy ? 'Adding...' : 'Instant'}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
          <View style={styles.topUpRow}>
            {[10000, 20000].map(amt => {
              const busy = depositing === amt;
              return (
                <PressableScale
                  key={amt}
                  onPress={() => handleDeposit(amt)}
                  disabled={Boolean(depositing)}
                  style={[styles.topUpTile, busy && styles.topUpTileActive]}
                >
                  <Text style={[styles.topUpPlus, busy && { color: colors.white }]} numberOfLines={1}>
                    +{naira(amt)}
                  </Text>
                  <Text style={[styles.topUpCaption, busy && { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>
                    {busy ? 'Adding...' : 'Instant'}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* Monochromatic Orange Protection Strip */}
        <View style={styles.protectionCard}>
          <Ionicons name="shield-checkmark" size={17} color={colors.orange} />
          <Text style={styles.protectionText}>
            100% fare returns to wallet in 1 second if a driver cancels.
          </Text>
        </View>

        {/* Activity Ledger */}
        <SectionTitle title="Recent Activity" style={{ marginTop: 22 }} />
        {loading ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={58} r={14} />
            <Skeleton height={58} r={14} />
          </View>
        ) : txs.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No transactions yet"
            subtitle="Top up your wallet above for instant 1-tap ride checkout."
          />
        ) : (
          <View style={styles.txCard}>
            {txs.map((tx, idx) => {
              const isCredit = tx.transaction_type.startsWith('credit');
              return (
                <View
                  key={tx.id}
                  style={[styles.txRow, idx < txs.length - 1 && styles.txRowBorder]}
                >
                  <View
                    style={[
                      styles.txIcon,
                      { backgroundColor: isCredit ? colors.successSoft : colors.orangeSoft },
                    ]}
                  >
                    <Ionicons
                      name={isCredit ? 'arrow-down' : 'car-sport'}
                      size={16}
                      color={isCredit ? colors.success : colors.orange}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txDesc} numberOfLines={1}>
                      {tx.description || tx.transaction_type}
                    </Text>
                    <Text style={styles.txDate}>
                      {formatDay(tx.created_at)} · {formatTime(tx.created_at)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isCredit ? colors.success : colors.orangeDeep },
                    ]}
                  >
                    {isCredit ? '+' : '-'}
                    {naira(tx.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
    ...shadow(1),
  },
  logoImage: {
    width: 60,
    height: 24,
  },
  virtualCard: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    ...shadow(2),
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#86EFAC',
  },
  currencyText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.8,
  },
  shieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  shieldText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.white,
  },
  balanceCaption: {
    fontSize: 10.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1,
    marginTop: 18,
  },
  balanceHero: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 18,
  },
  holderCol: {
    gap: 2,
  },
  holderLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.8,
  },
  holderName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  topUpGrid: {
    gap: 10,
    marginTop: 4,
  },
  topUpRow: {
    flexDirection: 'row',
    gap: 10,
  },
  topUpTile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(1),
  },
  topUpTileActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  topUpPlus: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.orangeDeep,
  },
  topUpCaption: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  protectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.orangeSoft,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
  },
  protectionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  txCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
    ...shadow(1),
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  txRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.orangeSoft,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txDesc: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  txDate: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13.5,
    fontWeight: '900',
  },
});
