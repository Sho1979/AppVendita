import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import MainCalendarPage from '../pages/MainCalendarPage';
import SettingsPage from '../pages/SettingsPage';
// import { TagTestPage } from '../pages/TagTestPage';
import LeaderboardPage from '../pages/LeaderboardPage';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 4, // Riduce il padding
          paddingTop: 4, // Riduce il padding
          height: 30, // Dimezza l'altezza
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 8, // Riduce la dimensione del font
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Calendario"
        component={MainCalendarPage}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size * 0.7 }}>📅</Text>
          ),
        }}
      />
      {/* Tag Test nascosto dalla tab bar per non incidere sulla UX */}
      <Tab.Screen
        name="Classifica"
        component={LeaderboardPage}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size * 0.7 }}>🏆</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Impostazioni"
        component={SettingsPage}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size * 0.7 }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
