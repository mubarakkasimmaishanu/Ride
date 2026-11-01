import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useToast } from '../state/toast';
import { colors, radius, shadow } from '../theme';
import { naira } from '../utils/format';
import { Button, IconButton, PressableScale } from './ui';

interface WalletModalProps {
  visible: boolean;
  balance: number;
  onClose: () => void;
  onBalanceUpdated: (newBalance: number) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  visible,
  balance,
  onClose,
  onBalanceUpdated,
}) => {
  const insets = useSafeAreaInsets();
  const [depositing, setDepositing] = useState(false);
  const toast = useToast();

  const handleDeposit = async (amount: number) => {
    setDepositing(true);
    try {
      const res = await api.depositToWallet(amount);
      onBalanceUpdated(res.balance);
      toast(`${naira(amount)} credited to ride Cash!`, 'success');
      onClose();
    } catch (err: any) {
      toast(err.message || 'Top-up failed', 'error');
    } finally {
      setDepositing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Top up ride Cash</Text>
              <Text style={styles.sub}>Current balance: {naira(balance)}</Text>
            </View>
            <IconButton icon="close" size={34} bg={colors.orangeSoft} color={colors.orange} onPress={onClose} />
          </View>

          <View style={styles.grid}>
            <View style={styles.amtRow}>
              {[2000, 5000].map(amt => (
                <PressableScale
                  key={amt}
                  onPress={() => handleDeposit(amt)}
                  disabled={depositing}
                  style={styles.amtCard}
                >
                  <Text style={styles.amtVal} numberOfLines={1}>+{naira(amt)}</Text>
                  <Text style={styles.amtSub} numberOfLines={1}>Instant Credit</Text>
                </PressableScale>
              ))}
            </View>
            <View style={styles.amtRow}>
              {[10000, 20000].map(amt => (
                <PressableScale
                  key={amt}
                  onPress={() => handleDeposit(amt)}
                  disabled={depositing}
                  style={styles.amtCard}
                >
                  <Text style={styles.amtVal} numberOfLines={1}>+{naira(amt)}</Text>
                  <Text style={styles.amtSub} numberOfLines={1}>Instant Credit</Text>
                </PressableScale>
              ))}
            </View>
          </View>

          <Button title="Cancel" variant="ghost" size="md" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
    ...shadow(3),
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.orangeBorder,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sub: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  grid: {
    gap: 10,
  },
  amtRow: {
    flexDirection: 'row',
    gap: 10,
  },
  amtCard: {
    flex: 1,
    backgroundColor: colors.orangeSoft,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
  },
  amtVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.orangeDeep,
  },
  amtSub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
});
