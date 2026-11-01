import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { api } from './src/services/api';
import { KEYS, storage } from './src/services/storage';
import { SessionProvider, useSession } from './src/state/session';
import { ToastProvider, useToast } from './src/state/toast';
import { Booking, SafeHub, Trip } from './src/types';
import { colors, font, radius, shadow } from './src/theme';

import { SplashScreenView } from './src/screens/SplashScreenView';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { AccountScreen } from './src/screens/AccountScreen';

import { CorridorMapHero } from './src/components/CorridorMapHero';
import { CorridorSelector } from './src/components/CorridorSelector';
import { TripCard } from './src/components/TripCard';
import { BookingModal } from './src/components/BookingModal';
import { BoardingPassModal } from './src/components/BoardingPassModal';
import { WalletModal } from './src/components/WalletModal';
import { MyBookingsTab } from './src/components/MyBookingsTab';
import { DriverDashboard } from './src/components/DriverDashboard';
import { AdminDashboard } from './src/components/AdminDashboard';
import { AppTab, BottomTabBar } from './src/components/BottomTabBar';
import { EmptyState, TripCardSkeleton } from './src/components/ui';

SplashScreen.preventAutoHideAsync().catch(() => {});

type Stage = 'splash' | 'onboarding' | 'auth' | 'main';

const MainShell: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const { user, signIn, restore, refresh, setBalance } = useSession();
  const toast = useToast();

  const [stage, setStage] = useState<Stage>('splash');
  const [activeTab, setActiveTab] = useState<AppTab>('explore');

  // Ride Discovery State
  const [trips, setTrips] = useState<Trip[]>([]);
  const [safeHubs, setSafeHubs] = useState<SafeHub[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Search Filters
  const [corridor, setCorridor] = useState({ origin: 'Zaria', dest: 'Kaduna' });
  const [seats, setSeats] = useState(1);
  const [hasAC, setHasAC] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  // Modals
  const [bookingTrip, setBookingTrip] = useState<Trip | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [passData, setPassData] = useState<any | null>(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const fetchHubs = useCallback(async () => {
    try {
      const hubs = await api.getSafeHubs();
      setSafeHubs(hubs);
    } catch {
      // retry on next refresh
    }
  }, []);

  const fetchTrips = useCallback(
    async (origin: string, dest: string, minSeats: number, ac: boolean, priceCap?: number, isPull = false) => {
      if (isPull) setRefreshing(true);
      else setLoadingTrips(true);
      setNetworkError(null);
      try {
        const list = await api.searchTrips({
          originCity: origin,
          destinationCity: dest,
          minSeats,
          hasAC: ac,
          maxPrice: priceCap,
        });
        setTrips(list);
      } catch (err: any) {
        setNetworkError(err.message || 'Connection issue');
      } finally {
        setLoadingTrips(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Bootstrap data in background while Splash animates
  useEffect(() => {
    fetchHubs();
    fetchTrips(corridor.origin, corridor.dest, seats, hasAC, maxPrice);
  }, []);

  const handleSplashFinished = async () => {
    // Restore cached credentials in background so user session is immediately ready
    await restore().catch(() => {});
    // Per requirement: Logo splash screen first on every app load, then the 3 onboarding screens
    setStage('onboarding');
  };

  const handleOnboardingComplete = async () => {
    await storage.set(KEYS.onboarded, '1');
    if (user) {
      setStage('main');
      setActiveTab(user.role === 'driver' ? 'driver' : user.role === 'admin' ? 'admin' : 'explore');
    } else {
      setStage('auth');
    }
  };

  const handleSelectCorridor = (origin: string, dest: string) => {
    setCorridor({ origin, dest });
    fetchTrips(origin, dest, seats, hasAC, maxPrice);
  };

  const handleChangeSeats = (n: number) => {
    setSeats(n);
    fetchTrips(corridor.origin, corridor.dest, n, hasAC, maxPrice);
  };

  const handleToggleAC = () => {
    const next = !hasAC;
    setHasAC(next);
    fetchTrips(corridor.origin, corridor.dest, seats, next, maxPrice);
  };

  const handleToggleBudget = () => {
    const next = maxPrice ? undefined : 3000;
    setMaxPrice(next);
    fetchTrips(corridor.origin, corridor.dest, seats, hasAC, next);
  };

  const handleBookingSuccess = (confirmed: any) => {
    setShowBookingModal(false);
    setPassData(confirmed);
    setShowPassModal(true);
    toast('Seat confirmed! Exact Safe Hub spot unlocked.', 'success');
    refresh();
    fetchTrips(corridor.origin, corridor.dest, seats, hasAC, maxPrice);
  };

  const handleQuickPersona = async (role: 'passenger' | 'driver' | 'admin') => {
    const phone =
      role === 'passenger' ? '08011112222' : role === 'driver' ? '08033334444' : '08000000000';
    try {
      await signIn(phone, 'password123');
      await storage.set(KEYS.onboarded, '1');
      setStage('main');
      setActiveTab(role === 'driver' ? 'driver' : role === 'admin' ? 'admin' : 'explore');
      toast(`Live as ${role.toUpperCase()}`, 'success');
    } catch (err: any) {
      toast(err.message || 'Switch failed', 'error');
    }
  };

  const isDesktopWeb = Platform.OS === 'web' && width >= 540;
  const showSideShowcase = Platform.OS === 'web' && width >= 980;

  const appViewport = (
    <View
      style={[
        styles.mobileViewport,
        isDesktopWeb && styles.desktopPillar,
      ]}
    >
      <StatusBar
        style={
          stage === 'onboarding' || stage === 'splash' || (stage === 'main' && activeTab === 'explore')
            ? 'light'
            : 'dark'
        }
      />

      {stage === 'splash' && <SplashScreenView onFinish={handleSplashFinished} />}

      {stage === 'onboarding' && <OnboardingScreen onComplete={handleOnboardingComplete} />}

      {stage === 'auth' && (
        <AuthScreen
          onAuthenticated={authRole => {
            const role = authRole || user?.role;
            setStage('main');
            setActiveTab(role === 'driver' ? 'driver' : role === 'admin' ? 'admin' : 'explore');
            fetchHubs();
            fetchTrips(corridor.origin, corridor.dest, seats, hasAC, maxPrice);
          }}
        />
      )}

      {stage === 'main' && (
        <View style={styles.mainContainer}>
          {activeTab === 'explore' && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.exploreScroll}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => fetchTrips(corridor.origin, corridor.dest, seats, hasAC, maxPrice, true)}
                  tintColor={colors.orange}
                />
              }
            >
              {/* Interactive Bolt/Uber Corridor Map Header */}
              <CorridorMapHero
                origin={corridor.origin}
                dest={corridor.dest}
                rideCount={trips.length}
                user={user}
                onOpenWallet={() => setActiveTab('wallet')}
                onOpenAccount={() => setActiveTab('account')}
              />

              {/* Floating Route Search & Filter Card */}
              <CorridorSelector
                selectedCorridor={corridor}
                onSelectCorridor={handleSelectCorridor}
                seats={seats}
                onChangeSeats={handleChangeSeats}
                hasAC={hasAC}
                onToggleAC={handleToggleAC}
                maxPrice={maxPrice}
                onToggleBudget={handleToggleBudget}
              />

              {/* Available Rides Feed */}
              <View style={styles.feedSection}>
                <View style={styles.feedHeaderRow}>
                  <Text style={font.h3}>Available Rides</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{trips.length} departures</Text>
                  </View>
                </View>

                {loadingTrips ? (
                  <View style={{ gap: 12 }}>
                    <TripCardSkeleton />
                    <TripCardSkeleton />
                  </View>
                ) : networkError ? (
                  <EmptyState
                    icon="cloud-offline-outline"
                    tone="danger"
                    title="Connection interrupted"
                    subtitle={networkError}
                    actionLabel="Retry Search"
                    onAction={() => fetchTrips(corridor.origin, corridor.dest, seats, hasAC, maxPrice)}
                  />
                ) : trips.length === 0 ? (
                  <EmptyState
                    icon="car-outline"
                    title="No matching departures"
                    subtitle="Try swapping route direction, reducing seats, or clearing price filters."
                    actionLabel="Reset Filters"
                    onAction={() => {
                      setSeats(1);
                      setHasAC(false);
                      setMaxPrice(undefined);
                      fetchTrips(corridor.origin, corridor.dest, 1, false, undefined);
                    }}
                  />
                ) : (
                  trips.map(trip => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      onBook={t => {
                        setBookingTrip(t);
                        setShowBookingModal(true);
                      }}
                    />
                  ))
                )}
              </View>
            </ScrollView>
          )}

          {activeTab === 'trips' && (
            <MyBookingsTab
              onOpenBoardingPass={(b: Booking) => {
                setPassData(b);
                setShowPassModal(true);
              }}
              onBrowseRides={() => setActiveTab('explore')}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletScreen
              balance={user?.walletBalance || 0}
              userName={user?.fullName}
              userRole={user?.role}
              onBalanceUpdated={setBalance}
            />
          )}

          {activeTab === 'driver' && (
            <DriverDashboard
              safeHubs={safeHubs}
              onTripCreated={() => fetchTrips(corridor.origin, corridor.dest, seats, hasAC, maxPrice)}
            />
          )}

          {activeTab === 'admin' && <AdminDashboard />}

          {activeTab === 'account' && (
            <AccountScreen
              onRoleSwitched={role => {
                setActiveTab(role === 'driver' ? 'driver' : role === 'admin' ? 'admin' : 'explore');
              }}
              onReplayIntro={() => setStage('splash')}
              onSignedOut={() => {
                setStage('auth');
                setActiveTab('explore');
              }}
              onOpenWallet={() => setActiveTab('wallet')}
              onOpenTrips={() => setActiveTab('trips')}
              onOpenDriverHub={() => setActiveTab('driver')}
              onOpenAdminConsole={() => setActiveTab('admin')}
            />
          )}

          {/* Clean Bottom Navigation Bar */}
          <BottomTabBar
            activeTab={activeTab}
            role={user?.role}
            onSelect={setActiveTab}
          />
        </View>
      )}

      {/* Checkout Bottom Sheet */}
      <BookingModal
        visible={showBookingModal}
        trip={bookingTrip}
        currentUser={user}
        onClose={() => setShowBookingModal(false)}
        onSuccess={handleBookingSuccess}
        onOpenWalletDeposit={() => {
          setShowBookingModal(false);
          setShowWalletModal(true);
        }}
      />

      {/* Digital QR & 4-Digit Offline Boarding Pass */}
      <BoardingPassModal
        visible={showPassModal}
        bookingData={passData}
        onClose={() => setShowPassModal(false)}
      />

      {/* Quick Top-Up Sheet */}
      <WalletModal
        visible={showWalletModal}
        balance={user?.walletBalance || 0}
        onClose={() => setShowWalletModal(false)}
        onBalanceUpdated={setBalance}
      />
    </View>
  );

  if (!isDesktopWeb) {
    return appViewport;
  }

  // Studio Desktop Web Wrapper (matches warm peach backdrop from onboarding reference)
  return (
    <View style={styles.desktopStage}>
      {showSideShowcase && (
        <View style={styles.sidePanel}>
          <View style={styles.sideLogoCard}>
            <Image
              source={require('./assets/brand/logo-transparent.png')}
              style={{ width: 148, height: 66 }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.sideTitle}>
            Fast inter-city rides for{'\n'}
            <Text style={{ color: colors.orange }}>Zaria, Kaduna & Kano.</Text>
          </Text>
          <Text style={styles.sideBody}>
            Verified drivers, fixed fares, and instant seat reservations.
          </Text>

          <Text style={styles.sideOverline}>QUICK PREVIEW CONTROLS</Text>
          <View style={styles.sideBtnWrap}>
            <Pressable style={styles.sideChip} onPress={() => setStage('splash')}>
              <Ionicons name="sparkles" size={14} color={colors.orange} />
              <Text style={styles.sideChipText}>Flash Screen</Text>
            </Pressable>
            <Pressable style={styles.sideChip} onPress={() => setStage('onboarding')}>
              <Ionicons name="images-outline" size={14} color={colors.orange} />
              <Text style={styles.sideChipText}>Onboarding</Text>
            </Pressable>
            <Pressable style={styles.sideChip} onPress={() => handleQuickPersona('passenger')}>
              <Ionicons name="person-outline" size={14} color={colors.orange} />
              <Text style={styles.sideChipText}>Rider (Amina)</Text>
            </Pressable>
            <Pressable style={styles.sideChip} onPress={() => handleQuickPersona('driver')}>
              <Ionicons name="car-sport-outline" size={14} color={colors.orangeDeep} />
              <Text style={styles.sideChipText}>Driver (Ahmed)</Text>
            </Pressable>
            <Pressable style={styles.sideChip} onPress={() => handleQuickPersona('admin')}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.charcoal} />
              <Text style={styles.sideChipText}>Admin Ops</Text>
            </Pressable>
          </View>
        </View>
      )}

      {appViewport}
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ToastProvider>
          <MainShell />
        </ToastProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  desktopStage: {
    flex: 1,
    backgroundColor: '#FAF5F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    paddingHorizontal: 20,
  },
  sidePanel: {
    maxWidth: 380,
  },
  sideLogoCard: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    ...shadow(2),
  },
  sideTitle: {
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.7,
  },
  sideBody: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 12,
  },
  sideOverline: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textMuted,
    marginTop: 26,
    marginBottom: 10,
  },
  sideBtnWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sideChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    ...shadow(1),
  },
  sideChipText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
  },
  mobileViewport: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  desktopPillar: {
    maxWidth: 480,
    height: '100%',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#FED7AA',
    ...shadow(2),
  },
  mainContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  exploreScroll: {
    paddingBottom: 40,
  },
  feedSection: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  feedSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: colors.orangeSoft,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.orange,
  },
});
