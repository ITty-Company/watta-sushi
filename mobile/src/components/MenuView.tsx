import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useCart, MenuItem} from '../context/CartContext';
import {MenuItemCard} from './MenuItemCard';

const categories = [
  'Роллы',
  'Суши',
  'Сеты',
  'Супы',
  'Боули',
  'Закуски',
  'Напитки',
  'Соусы',
];

const menuItems: MenuItem[] = [
  {
    id: 1,
    name: 'Филадельфия',
    description: 'Лосось, сыр, огурец',
    price: 450,
    category: 'Роллы',
    image: '🍣',
    isTop: true,
  },
  {
    id: 2,
    name: 'Калифорния',
    description: 'Краб, авокадо, огурец',
    price: 380,
    category: 'Роллы',
    image: '🍱',
  },
  {
    id: 3,
    name: 'Лосось',
    description: 'Свежий лосось',
    price: 120,
    category: 'Суши',
    image: '🍣',
  },
  {
    id: 4,
    name: 'Тунец',
    description: 'Свежий тунец',
    price: 130,
    category: 'Суши',
    image: '🍣',
  },
  {
    id: 5,
    name: 'Сет №1',
    description: '20 штук',
    price: 1200,
    category: 'Сеты',
    image: '🍱',
  },
  {
    id: 6,
    name: 'Кола',
    description: '0.5л',
    price: 100,
    category: 'Напитки',
    image: '🥤',
  },
];

export const MenuView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('Роллы');
  const {addItem} = useCart();

  const filteredItems = menuItems.filter(
    item => item.category === selectedCategory,
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
          <View style={styles.logoContainer}>
          <View style={styles.ninjaLogo}>
            <View style={styles.ninjaHead} />
            <View style={styles.ninjaBand} />
            <View style={styles.ninjaEyes}>
              <View style={styles.ninjaEye} />
              <View style={styles.ninjaEye} />
            </View>
          </View>
          <Text style={styles.logoText}>NINJA SUSHI</Text>
        </View>

        <View style={styles.locationContainer}>
          <Text style={styles.flag}>🇺🇦</Text>
          <Text style={styles.location}>UA Київ</Text>
        </View>

        <View style={styles.actionsContainer}>
          {['phone', 'bell', 'heart', 'person', 'menu'].map((icon, idx) => (
            <TouchableOpacity key={idx} style={styles.actionButton}>
              <Text style={styles.actionIcon}>•</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}>
        {categories.map(category => {
          const isActive = category === selectedCategory;
          return (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.categoryButton,
                isActive && styles.categoryButtonActive,
              ]}>
              <Text
                style={[
                  styles.categoryText,
                  isActive && styles.categoryTextActive,
                ]}>
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}>
        {/* Promo Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerText}>Користь</Text>
            <Text style={styles.bannerText}>азіатських</Text>
            <Text style={styles.bannerText}>супів</Text>
          </View>
          <View style={styles.bannerRight}>
            <View style={styles.soupContainer}>
              <View style={styles.soupCircle}>
                <Text style={styles.soupEmoji}>🍜</Text>
              </View>
              <View style={[styles.soupCircle, styles.soupCenter]}>
                <Text style={styles.soupEmoji}>🍲</Text>
              </View>
              <View style={[styles.soupCircle, styles.soupBottom]}>
                <Text style={styles.soupEmoji}>🥘</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Carousel Indicators */}
        <View style={styles.indicators}>
          <View style={[styles.indicator, styles.indicatorActive]} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
        </View>

        {/* Description */}
        <View style={styles.description}>
          <Text style={styles.descriptionTitle}>
            Доставка суші у Києві
          </Text>
          <Text style={styles.descriptionText}>
            В асортименті Ninja Sushi представлені роли, суші, сети і напої на
            будь-який смак. Ми рекомендуємо обов'язково спробувати топ
            позиції нашого меню!
          </Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuItems}>
          {filteredItems.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              onAddToCart={() => addItem(item)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ninjaLogo: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  ninjaHead: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
  },
  ninjaBand: {
    position: 'absolute',
    top: 8,
    left: 4,
    width: 32,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  ninjaEyes: {
    position: 'absolute',
    top: 18,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  ninjaEye: {
    width: 3,
    height: 8,
    borderRadius: 1.5,
    backgroundColor: '#fff',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 0.5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flag: {
    fontSize: 16,
  },
  location: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 15,
    color: '#666',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
  },
  categoryButtonActive: {
    backgroundColor: '#ff6b35',
    shadowColor: '#ff6b35',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  categoryTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  banner: {
    flexDirection: 'row',
    height: 210,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  bannerLeft: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    paddingLeft: 24,
  },
  bannerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 38,
  },
  bannerRight: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  soupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -12,
  },
  soupCircle: {
    width: 105,
    height: 105,
    borderRadius: 52.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffa500',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    marginLeft: -12,
  },
  soupCenter: {
    marginTop: 0,
  },
  soupBottom: {
    marginTop: 15,
  },
  soupEmoji: {
    fontSize: 65,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 16,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  indicatorActive: {
    backgroundColor: '#ffa500',
  },
  description: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  descriptionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  menuItems: {
    marginTop: 8,
  },
});

