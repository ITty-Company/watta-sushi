import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {CartProvider} from './src/context/CartContext';
import {MenuView} from './src/components/MenuView';
import {CartView} from './src/components/CartView';
import {ProfileView} from './src/components/ProfileView';

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: '#ff6b35',
              tabBarInactiveTintColor: '#666',
              tabBarStyle: {
                backgroundColor: '#fff',
                borderTopWidth: 1,
                borderTopColor: '#f0f0f0',
                paddingBottom: 8,
                paddingTop: 8,
                height: 60,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '500',
              },
            }}>
            <Tab.Screen
              name="Menu"
              component={MenuView}
              options={{
                tabBarLabel: 'Меню',
                tabBarIcon: ({color}) => (
                  <Text style={{fontSize: 20, color}}>☰</Text>
                ),
              }}
            />
            <Tab.Screen
              name="Cart"
              component={CartView}
              options={{
                tabBarLabel: 'Корзина',
                tabBarIcon: ({color}) => (
                  <Text style={{fontSize: 20, color}}>🛒</Text>
                ),
              }}
            />
            <Tab.Screen
              name="Profile"
              component={ProfileView}
              options={{
                tabBarLabel: 'Профиль',
                tabBarIcon: ({color}) => (
                  <Text style={{fontSize: 20, color}}>👤</Text>
                ),
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </CartProvider>
    </SafeAreaProvider>
  );
};

export default App;
