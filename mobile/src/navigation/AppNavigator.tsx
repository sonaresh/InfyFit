import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MealScanScreen from '../screens/MealScanScreen';
import ProductScannerScreen from '../screens/ProductScannerScreen';
import WorkoutPlannerScreen from '../screens/WorkoutPlannerScreen';
import CoachScreen from '../screens/CoachScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OfflineSyncScreen from '../screens/OfflineSyncScreen';
import { palette } from '../theme';

export type RootStackParamList = {
  Tabs: undefined;
  OfflineSync: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: palette.card,
        borderTopColor: palette.border
      },
      tabBarActiveTintColor: palette.primary,
      tabBarInactiveTintColor: palette.textSecondary,
      tabBarIcon: ({ color, size }) => {
        const iconName = (() => {
          switch (route.name) {
            case 'Meals':
              return 'fast-food';
            case 'Products':
              return 'barcode';
            case 'Workouts':
              return 'barbell';
            case 'Coach':
              return 'sparkles';
            case 'Settings':
              return 'settings';
            default:
              return 'ellipse';
          }
        })();
        return <Ionicons name={iconName as never} color={color} size={size} />;
      }
    })}
  >
    <Tab.Screen name="Meals" component={MealScanScreen} />
    <Tab.Screen name="Products" component={ProductScannerScreen} />
    <Tab.Screen name="Workouts" component={WorkoutPlannerScreen} />
    <Tab.Screen name="Coach" component={CoachScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const linking = {
  prefixes: ['infyfit://'],
  config: {
    screens: {
      Tabs: {
        path: '',
        screens: {
          Meals: 'meals',
          Products: 'products',
          Workouts: 'workouts',
          Coach: 'coach',
          Settings: 'settings'
        }
      },
      OfflineSync: 'offline-sync'
    }
  }
};

const AppNavigator = () => {
  const scheme = useColorScheme();
  return (
    <NavigationContainer linking={linking} theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="OfflineSync"
          component={OfflineSyncScreen}
          options={{
            title: 'Offline Queue',
            headerStyle: { backgroundColor: palette.card },
            headerTintColor: palette.textPrimary
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
