import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌍 Начало заполнения начальных данных...')

  // Создаём страну Украина
  const ukraine = await prisma.country.upsert({
    where: { code: 'UA' },
    update: {},
    create: {
      name: 'Україна',
      name_en: 'Ukraine',
      name_nl: 'Oekraïne',
      code: 'UA',
      flag: '🇺🇦',
      isActive: true
    }
  })

  console.log('✅ Страна создана:', ukraine.name)

  // Создаём города Украины
  const ukraineCitiesData = [
    {
      name: 'Київ',
      name_nl: 'Kiev',
      name_en: 'Kyiv',
      latitude: 50.4501,
      longitude: 30.5234,
      zoom: 12
    },
    {
      name: 'Львів',
      name_nl: 'Lviv',
      name_en: 'Lviv',
      latitude: 49.8397,
      longitude: 24.0297,
      zoom: 12
    },
    {
      name: 'Одеса',
      name_nl: 'Odessa',
      name_en: 'Odesa',
      latitude: 46.4825,
      longitude: 30.7233,
      zoom: 12
    },
    {
      name: 'Харків',
      name_nl: 'Kharkiv',
      name_en: 'Kharkiv',
      latitude: 49.9935,
      longitude: 36.2304,
      zoom: 12
    },
    {
      name: 'Дніпро',
      name_nl: 'Dnipro',
      name_en: 'Dnipro',
      latitude: 48.4647,
      longitude: 35.0462,
      zoom: 12
    }
  ]

  for (const cityData of ukraineCitiesData) {
    const city = await prisma.city.upsert({
      where: {
        name_countryId: {
          name: cityData.name,
          countryId: ukraine.id
        }
      },
      update: {
        name_nl: cityData.name_nl,
        name_en: cityData.name_en,
        latitude: cityData.latitude,
        longitude: cityData.longitude,
        zoom: cityData.zoom
      },
      create: {
        name: cityData.name,
        name_nl: cityData.name_nl,
        name_en: cityData.name_en,
        countryId: ukraine.id,
        latitude: cityData.latitude,
        longitude: cityData.longitude,
        zoom: cityData.zoom,
        isActive: true
      }
    })
    console.log('✅ Город создан:', city.name)
  }

  // Создаём страну Нидерланды
  const netherlands = await prisma.country.upsert({
    where: { code: 'NL' },
    update: {},
    create: {
      name: 'Нидерланды',
      name_en: 'Netherlands',
      name_nl: 'Nederland',
      code: 'NL',
      flag: '🇳🇱',
      isActive: true
    }
  })

  console.log('✅ Страна создана:', netherlands.name)

  // Создаём города Нидерландов
  const netherlandsCitiesData = [
    {
      name: 'Амстердам',
      name_nl: 'Amsterdam',
      name_en: 'Amsterdam',
      latitude: 52.3676,
      longitude: 4.9041,
      zoom: 12
    },
    {
      name: 'Роттердам',
      name_nl: 'Rotterdam',
      name_en: 'Rotterdam',
      latitude: 51.9244,
      longitude: 4.4777,
      zoom: 12
    },
    {
      name: 'Гаага',
      name_nl: 'Den Haag',
      name_en: 'The Hague',
      latitude: 52.0705,
      longitude: 4.3007,
      zoom: 12
    },
    {
      name: 'Утрехт',
      name_nl: 'Utrecht',
      name_en: 'Utrecht',
      latitude: 52.0907,
      longitude: 5.1214,
      zoom: 12
    },
    {
      name: 'Эйндховен',
      name_nl: 'Eindhoven',
      name_en: 'Eindhoven',
      latitude: 51.4416,
      longitude: 5.4697,
      zoom: 12
    }
  ]

  for (const cityData of netherlandsCitiesData) {
    const city = await prisma.city.upsert({
      where: {
        name_countryId: {
          name: cityData.name,
          countryId: netherlands.id
        }
      },
      update: {
        name_nl: cityData.name_nl,
        name_en: cityData.name_en,
        latitude: cityData.latitude,
        longitude: cityData.longitude,
        zoom: cityData.zoom
      },
      create: {
        name: cityData.name,
        name_nl: cityData.name_nl,
        name_en: cityData.name_en,
        countryId: netherlands.id,
        latitude: cityData.latitude,
        longitude: cityData.longitude,
        zoom: cityData.zoom,
        isActive: true
      }
    })
    console.log('✅ Город создан:', city.name)
  }

  console.log('🎉 Начальные данные успешно заполнены!')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
