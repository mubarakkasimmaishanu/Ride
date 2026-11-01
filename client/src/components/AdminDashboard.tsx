import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useToast } from '../state/toast';
import { colors, font, radius, shadow } from '../theme';
import { naira } from '../utils/format';
import { Avatar, Badge, Button, EmptyState, SectionTitle, Skeleton } from './ui';

export const AdminDashboard: React.FC = () => {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [stats, drivers] = await Promise.all([
        api.getAdminAnalytics(),
        api.getPendingDrivers(),
      ]);
      setAnalytics(stats);
      setPendingDrivers(drivers);
    } catch (err: any) {
      toast(err.message || 'Could not load admin telemetry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerify = async (driverId: string, status: 'approved' | 'rejected') => {
    setActioningId(driverId);
    try {
      await api.verifyDriver(driverId, status, `Reviewed and ${status} by Platform Admin`);
      toast(
        status === 'approved'
          ? 'Driver accredited & cleared to publish corridor trips!'
          : 'Driver application rejected',
        status === 'approved' ? 'success' : 'info'
      );
      loadAdminData();
    } catch (err: any) {
      toast(err.message || 'Verification failed', 'error');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={loadAdminData} tintColor={colors.orange} />}
      >
        <Text style={font.h1}>Operations Console</Text>
        <Text style={[font.bodySm, { marginBottom: 16 }]}>
          Corridor revenue, safety telemetry & Road Transport Union vetting
        </Text>

        {loading && !analytics ? (
          <View style={styles.kpiGrid}>
            <Skeleton width="48%" height={96} r={18} />
            <Skeleton width="48%" height={96} r={18} />
          </View>
        ) : (
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: colors.successSoft }]}>
                <Ionicons name="trending-up" size={18} color={colors.success} />
              </View>
              <Text style={styles.kpiVal}>{naira(analytics?.bookings?.grossBookingVolume)}</Text>
              <Text style={styles.kpiLabel}>Gross Booking Volume</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: colors.orangeSoft }]}>
                <Ionicons name="pie-chart" size={18} color={colors.orange} />
              </View>
              <Text style={[styles.kpiVal, { color: colors.orange }]}>
                {naira(analytics?.bookings?.platformCommission)}
              </Text>
              <Text style={styles.kpiLabel}>Platform Revenue (10%)</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name="car-sport" size={18} color={colors.charcoal} />
              </View>
              <Text style={styles.kpiVal}>{analytics?.trips?.active ?? 0}</Text>
              <Text style={styles.kpiLabel}>Active Corridor Trips</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: colors.orangeSoft }]}>
                <Ionicons name="shield-checkmark" size={18} color={colors.orangeDeep} />
              </View>
              <Text style={styles.kpiVal}>
                {analytics?.users?.approvedDrivers ?? 0} / {analytics?.users?.totalDrivers ?? 0}
              </Text>
              <Text style={styles.kpiLabel}>Accredited Union Drivers</Text>
            </View>
          </View>
        )}

        <View style={styles.queueHeader}>
          <SectionTitle title="Union Accreditation Queue" style={{ marginBottom: 0 }} />
          <Badge label={`${pendingDrivers.length} Pending`} tone={pendingDrivers.length ? 'orange' : 'success'} />
        </View>

        {pendingDrivers.length === 0 ? (
          <EmptyState
            icon="checkmark-done-circle-outline"
            tone="orange"
            title="All Union Slips Verified"
            subtitle="Every pending NURTW and RTEAN driver application across Zaria, Kaduna, and Kano has been reviewed."
          />
        ) : (
          pendingDrivers.map(d => (
            <View key={d.id} style={styles.vettingCard}>
              <View style={styles.driverRow}>
                <Avatar name={d.full_name} size={46} ring />
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverName}>{d.full_name}</Text>
                  <Text style={styles.driverSub}>{d.phone_number} · NIN: {d.nin}</Text>
                  <Text style={styles.driverSub}>License: {d.license_number}</Text>
                </View>
              </View>

              <View style={styles.unionCredBox}>
                <View style={styles.unionCredHeader}>
                  <Ionicons name="shield-checkmark" size={15} color={colors.orangeDeep} />
                  <Text style={styles.unionCredTitle}>ROAD TRANSPORT UNION CREDENTIALS</Text>
                </View>
                <View style={styles.credGrid}>
                  <View style={styles.credCell}>
                    <Text style={styles.credLabel}>Union</Text>
                    <Text style={styles.credVal}>{d.union_name}</Text>
                  </View>
                  <View style={styles.credCell}>
                    <Text style={styles.credLabel}>Branch</Text>
                    <Text style={styles.credVal}>{d.union_branch_city}</Text>
                  </View>
                  <View style={styles.credCell}>
                    <Text style={styles.credLabel}>Badge ID</Text>
                    <Text style={[styles.credVal, { color: colors.orange }]}>
                      {d.union_membership_number}
                    </Text>
                  </View>
                  <View style={styles.credCell}>
                    <Text style={styles.credLabel}>Vehicle</Text>
                    <Text style={styles.credVal}>
                      {d.make} {d.model} ({d.plate_number})
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.btnRow}>
                <Button
                  title="Approve & Accredit"
                  variant="primary"
                  size="md"
                  icon="checkmark-circle"
                  loading={actioningId === d.id}
                  onPress={() => handleVerify(d.id, 'approved')}
                  style={{ flex: 2 }}
                />
                <Button
                  title="Reject"
                  variant="outline"
                  size="md"
                  disabled={actioningId === d.id}
                  onPress={() => handleVerify(d.id, 'rejected')}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 110 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    ...shadow(1),
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  kpiLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vettingCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    gap: 14,
    ...shadow(1),
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverName: { fontSize: 16, fontWeight: '800', color: colors.text },
  driverSub: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginTop: 1 },
  unionCredBox: {
    backgroundColor: colors.orangeSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 12,
  },
  unionCredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  unionCredTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: colors.orangeDeep,
  },
  credGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  credCell: { width: '47%' },
  credLabel: { fontSize: 10.5, fontWeight: '600', color: colors.textSecondary },
  credVal: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 1 },
  btnRow: { flexDirection: 'row', gap: 10 },
});
