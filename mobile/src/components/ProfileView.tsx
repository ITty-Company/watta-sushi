import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

export const ProfileView: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.title}>Профиль</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Информация</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Имя</Text>
          <Text style={styles.value}>Пользователь</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Телефон</Text>
          <Text style={styles.value}>+7 (999) 123-45-67</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Адрес</Text>
          <Text style={styles.value}>Москва</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Заказы</Text>
        <View style={styles.row}>
          <Text style={styles.label}>История заказов</Text>
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#000',
  },
  value: {
    fontSize: 16,
    color: '#666',
  },
  arrow: {
    fontSize: 20,
    color: '#666',
  },
});

