import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';
import { PressableScale } from './ui';

interface CorridorSelectorProps {
  selectedCorridor: { origin: string; dest: string };
  onSelectCorridor: (origin: string, dest: string) => void;
  seats: number;
  onChangeSeats: (seats: number) => void;
  hasAC: boolean;
  onToggleAC: () => void;
  maxPrice?: number;
  onToggleBudget?: () => void;
}

const CITIES = ['Zaria', 'Kaduna', 'Kano'] as const;

const QUICK_ROUTES = [
  { origin: 'Zaria', dest: 'Kaduna', label: 'Zaria ➔ Kaduna', price: 'From ₦1.8k' },
  { origin: 'Zaria', dest: 'Kano', label: 'Zaria ➔ Kano', price: 'From ₦3.0k' },
  { origin: 'Kaduna', dest: 'Kano', label: 'Kaduna ➔ Kano', price: 'From ₦4.5k' },
];

export const CorridorSelector: React.FC<CorridorSelectorProps> = ({
  selectedCorridor,
  onSelectCorridor,
  seats,
  onChangeSeats,
  hasAC,
  onToggleAC,
  maxPrice,
  onToggleBudget,
}) => {
  const { origin, dest } = selectedCorridor;

  const handleSelectOrigin = (city: string) => {
    if (city === dest) {
      onSelectCorridor(city, origin);
    } else {
      onSelectCorridor(city, dest);
    }
  };

  const handleSelectDest = (city: string) => {
    if (city === origin) {
      onSelectCorridor(dest, city);
    } else {
      onSelectCorridor(origin, city);
    }
  };

  const handleSwap = () => {
    onSelectCorridor(dest, origin);
  };

  return (
    <View style={styles.container}>
      {/* 3 Quick Corridor Monochromatic Buttons */}
      <View style={styles.quickRoutesRow}>
        {QUICK_ROUTES.map(route => {
          const active =
            (origin === route.origin && dest === route.dest) ||
            (origin === route.dest && dest === route.origin);
          return (
            <PressableScale
              key={route.label}
              onPress={() => onSelectCorridor(route.origin, route.dest)}
              style={[styles.quickRouteBtn, active && styles.quickRouteBtnActive]}
            >
              <Text style={[styles.quickRouteLabel, active && styles.quickRouteLabelActive]} numberOfLines={1}>
                {route.label}
              </Text>
              <Text style={[styles.quickRoutePrice, active && styles.quickRoutePriceActive]}>
                {route.price}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      {/* Direct City Selection Card */}
      <View style={styles.routeCard}>
        {/* Origin Row */}
        <View style={styles.cityRow}>
          <Text style={styles.cityRowLabel}>From</Text>
          <View style={styles.cityChipsWrap}>
            {CITIES.map(city => {
              const active = origin === city;
              return (
                <Pressable
                  key={city}
                  onPress={() => handleSelectOrigin(city)}
                  style={[styles.cityChip, active && styles.cityChipActive]}
                >
                  <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>
                    {city}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Swap Bar */}
        <View style={styles.swapBar}>
          <View style={styles.swapLine} />
          <PressableScale onPress={handleSwap} style={styles.swapBtn}>
            <Ionicons name="swap-vertical" size={15} color={colors.orange} />
            <Text style={styles.swapText}>Swap</Text>
          </PressableScale>
          <View style={styles.swapLine} />
        </View>

        {/* Destination Row */}
        <View style={styles.cityRow}>
          <Text style={styles.cityRowLabel}>To</Text>
          <View style={styles.cityChipsWrap}>
            {CITIES.map(city => {
              const active = dest === city;
              return (
                <Pressable
                  key={city}
                  onPress={() => handleSelectDest(city)}
                  style={[styles.cityChip, active && styles.cityChipActive]}
                >
                  <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>
                    {city}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Filter Row: Seats + AC + Budget */}
      <View style={styles.filterRow}>
        <View style={styles.seatGroup}>
          <Ionicons name="person" size={13} color={colors.orange} />
          <Text style={styles.filterLabel}>Seats</Text>
          {[1, 2, 3, 4].map(n => {
            const active = seats === n;
            return (
              <Pressable
                key={n}
                onPress={() => onChangeSeats(n)}
                style={[styles.seatBtn, active && styles.seatBtnActive]}
              >
                <Text style={[styles.seatText, active && styles.seatTextActive]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.toggleGroup}>
          <Pressable
            onPress={onToggleAC}
            style={[styles.filterChip, hasAC && styles.filterChipActive]}
          >
            <Ionicons name="snow" size={13} color={hasAC ? colors.white : colors.orange} />
            <Text style={[styles.filterChipText, hasAC && styles.filterChipTextActive]}>AC</Text>
          </Pressable>

          {onToggleBudget && (
            <Pressable
              onPress={onToggleBudget}
              style={[styles.filterChip, Boolean(maxPrice) && styles.filterChipActive]}
            >
              <Ionicons
                name="flash"
                size={13}
                color={maxPrice ? colors.white : colors.orange}
              />
              <Text style={[styles.filterChipText, Boolean(maxPrice) && styles.filterChipTextActive]}>
                ≤ ₦3k
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  quickRoutesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickRouteBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
    alignItems: 'center',
    ...shadow(1),
  },
  quickRouteBtnActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  quickRouteLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  quickRouteLabelActive: {
    color: colors.white,
  },
  quickRoutePrice: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.orangeDeep,
  },
  quickRoutePriceActive: {
    color: '#FED7AA',
  },
  routeCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
    ...shadow(1),
    marginBottom: 10,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityRowLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    width: 44,
  },
  cityChipsWrap: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  cityChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cityChipActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  cityChipText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
  },
  cityChipTextActive: {
    color: colors.white,
  },
  swapBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  swapLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderWarm,
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.orangeSoft,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
    marginHorizontal: 8,
  },
  swapText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.orange,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  seatGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.white,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginRight: 2,
  },
  seatBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatBtnActive: {
    backgroundColor: colors.orange,
  },
  seatText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  seatTextActive: {
    color: colors.white,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
  },
  filterChipActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.white,
  },
});
