import SwiftUI

class CartManager: ObservableObject {
    @Published var items: [MenuItem] = []
    
    func addItem(_ item: MenuItem) {
        items.append(item)
    }
    
    func clearCart() {
        items.removeAll()
    }
    
    var totalPrice: Int {
        items.reduce(0) { $0 + $1.price }
    }
}

struct ContentView: View {
    @StateObject private var cartManager = CartManager()
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            MenuView(cartManager: cartManager)
                .tabItem {
                    Image(systemName: "line.3.horizontal")
                    Text("Меню")
                }
                .tag(0)
            
            CartView(cartManager: cartManager)
                .tabItem {
                    Image(systemName: "cart.fill")
                    Text("Корзина")
                }
                .tag(1)
            
            ProfileView()
                .tabItem {
                    Image(systemName: "person.fill")
                    Text("Профиль")
                }
                .tag(2)
        }
        .accentColor(Color(red: 1.0, green: 0.42, blue: 0.21)) // #ff6b35
    }
}

struct MenuView: View {
    @ObservedObject var cartManager: CartManager
    @State private var categories = ["Роллы", "Суши", "Сеты", "Супы", "Боули", "Закуски", "Напитки", "Соусы"]
    @State private var selectedCategory = "Роллы"
    
    let menuItems: [MenuItem] = [
        MenuItem(id: 1, name: "Филадельфия", description: "Лосось, сыр, огурец", price: 450, category: "Роллы", image: "🍣", isTop: true),
        MenuItem(id: 2, name: "Калифорния", description: "Краб, авокадо, огурец", price: 380, category: "Роллы", image: "🍱"),
        MenuItem(id: 3, name: "Лосось", description: "Свежий лосось", price: 120, category: "Суши", image: "🍣"),
        MenuItem(id: 4, name: "Тунец", description: "Свежий тунец", price: 130, category: "Суши", image: "🍣"),
        MenuItem(id: 5, name: "Сет №1", description: "20 штук", price: 1200, category: "Сеты", image: "🍱"),
        MenuItem(id: 6, name: "Кола", description: "0.5л", price: 100, category: "Напитки", image: "🥤"),
    ]
    
    var filteredItems: [MenuItem] {
        menuItems.filter { $0.category == selectedCategory }
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Header Section
                HStack(alignment: .center, spacing: 12) {
                    // Логотип WATTA SUSHI
                    HStack(spacing: 10) {
                        // Логотип ниндзя (черная голова с белым суши-роллом как повязкой)
                        ZStack {
                            // Черная голова ниндзя (круг)
                            Circle()
                                .fill(Color.black)
                                .frame(width: 40, height: 40)
                            
                            // Белый суши-ролл как повязка на голове (горизонтальная полоса)
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.white)
                                .frame(width: 32, height: 8)
                                .offset(y: -8)
                            
                            // Белые глаза-щели (две вертикальные линии)
                            HStack(spacing: 8) {
                                RoundedRectangle(cornerRadius: 1.5)
                                    .fill(Color.white)
                                    .frame(width: 3, height: 8)
                                RoundedRectangle(cornerRadius: 1.5)
                                    .fill(Color.white)
                                    .frame(width: 3, height: 8)
                            }
                            .offset(y: 2)
                        }
                        .frame(width: 40, height: 40)
                        
                        // Текст WATTA SUSHI
                        Text("WATTA SUSHI")
                            .font(.system(size: 20, weight: .bold, design: .default))
                            .foregroundColor(.black)
                            .tracking(0.5)
                    }
                    
                    Spacer()
                    
                    // UA Київ с флагом
                    HStack(spacing: 4) {
                        Text("🇺🇦")
                            .font(.system(size: 16))
                        Text("UA Київ")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.black)
                    }
                    
                    Spacer()
                    
                    // Иконки действий
                    HStack(spacing: 8) {
                        Button(action: {}) {
                            Image(systemName: "phone.fill")
                                .font(.system(size: 15))
                                .foregroundColor(.gray)
                                .frame(width: 38, height: 38)
                                .background(Color.gray.opacity(0.08))
                                .cornerRadius(10)
                        }
                        Button(action: {}) {
                            Image(systemName: "bell.fill")
                                .font(.system(size: 15))
                                .foregroundColor(.gray)
                                .frame(width: 38, height: 38)
                                .background(Color.gray.opacity(0.08))
                                .cornerRadius(10)
                        }
                        Button(action: {}) {
                            Image(systemName: "heart.fill")
                                .font(.system(size: 15))
                                .foregroundColor(.gray)
                                .frame(width: 38, height: 38)
                                .background(Color.gray.opacity(0.08))
                                .cornerRadius(10)
                        }
                        Button(action: {}) {
                            Image(systemName: "person.fill")
                                .font(.system(size: 15))
                                .foregroundColor(.gray)
                                .frame(width: 38, height: 38)
                                .background(Color.gray.opacity(0.08))
                                .cornerRadius(10)
                        }
                        Button(action: {}) {
                            Image(systemName: "line.3.horizontal")
                                .font(.system(size: 15))
                                .foregroundColor(.gray)
                                .frame(width: 38, height: 38)
                                .background(Color.gray.opacity(0.08))
                                .cornerRadius(10)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 12)
                .background(Color.white)
                .safeAreaInset(edge: .top) {
                    Color.clear.frame(height: 0)
                }
                
                // Навигационная панель с категориями (pill-shaped)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(categories, id: \.self) { category in
                            Button(action: {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                    selectedCategory = category
                                }
                            }) {
                                Text(category)
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(selectedCategory == category ? .white : .black)
                                    .padding(.horizontal, 22)
                                    .padding(.vertical, 11)
                                    .background(
                                        Group {
                                            if selectedCategory == category {
                                                LinearGradient(
                                                    gradient: Gradient(colors: [
                                                        Color(red: 1.0, green: 0.42, blue: 0.21),
                                                        Color(red: 1.0, green: 0.55, blue: 0.3)
                                                    ]),
                                                    startPoint: .leading,
                                                    endPoint: .trailing
                                                )
                                            } else {
                                                Color(red: 0.96, green: 0.96, blue: 0.96)
                                            }
                                        }
                                    )
                                    .cornerRadius(22)
                                    .shadow(
                                        color: selectedCategory == category 
                                        ? Color(red: 1.0, green: 0.42, blue: 0.21).opacity(0.35) 
                                        : Color.clear, 
                                        radius: 6, 
                                        x: 0, 
                                        y: 3
                                    )
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                }
                .background(Color.white)
                
                // Контент
                ScrollView {
                    VStack(spacing: 0) {
                        // Промо-баннер с супами
                        HStack(spacing: 0) {
                            // Левая часть - черный фон с текстом и градиентом
                            ZStack(alignment: .leading) {
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        Color.black,
                                        Color(red: 0.15, green: 0.15, blue: 0.15)
                                    ]),
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Користь")
                                        .font(.system(size: 32, weight: .bold))
                                        .foregroundColor(.white)
                                    Text("азіатських")
                                        .font(.system(size: 32, weight: .bold))
                                        .foregroundColor(.white)
                                    Text("супів")
                                        .font(.system(size: 32, weight: .bold))
                                        .foregroundColor(.white)
                                }
                                .padding(.leading, 24)
                            }
                            .frame(maxWidth: .infinity)
                            
                            // Правая часть - белый фон с изображениями супов
                            ZStack(alignment: .trailing) {
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        Color.white,
                                        Color(red: 0.98, green: 0.98, blue: 0.98)
                                    ]),
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                                
                                HStack(spacing: -12) {
                                    // Первый суп (Pho) - сверху
                                    ZStack {
                                        Circle()
                                            .fill(Color.white)
                                            .frame(width: 105, height: 105)
                                            .shadow(color: Color.black.opacity(0.15), radius: 12, x: 0, y: 6)
                                        
                                        Text("🍜")
                                            .font(.system(size: 65))
                                    }
                                    .overlay(
                                        Circle()
                                            .stroke(
                                                LinearGradient(
                                                    gradient: Gradient(colors: [
                                                        Color(red: 1.0, green: 0.65, blue: 0.0),
                                                        Color(red: 1.0, green: 0.42, blue: 0.21)
                                                    ]),
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                ),
                                                lineWidth: 3
                                            )
                                    )
                                    .offset(y: -15)
                                    
                                    // Второй суп (Miso) - по центру
                                    ZStack {
                                        Circle()
                                            .fill(Color.white)
                                            .frame(width: 105, height: 105)
                                            .shadow(color: Color.black.opacity(0.15), radius: 12, x: 0, y: 6)
                                        
                                        Text("🍲")
                                            .font(.system(size: 65))
                                    }
                                    .overlay(
                                        Circle()
                                            .stroke(
                                                LinearGradient(
                                                    gradient: Gradient(colors: [
                                                        Color(red: 1.0, green: 0.65, blue: 0.0),
                                                        Color(red: 1.0, green: 0.42, blue: 0.21)
                                                    ]),
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                ),
                                                lineWidth: 3
                                            )
                                    )
                                    
                                    // Третий суп (Tom Yum) - снизу
                                    ZStack {
                                        Circle()
                                            .fill(Color.white)
                                            .frame(width: 105, height: 105)
                                            .shadow(color: Color.black.opacity(0.15), radius: 12, x: 0, y: 6)
                                        
                                        Text("🥘")
                                            .font(.system(size: 65))
                                    }
                                    .overlay(
                                        Circle()
                                            .stroke(
                                                LinearGradient(
                                                    gradient: Gradient(colors: [
                                                        Color(red: 1.0, green: 0.65, blue: 0.0),
                                                        Color(red: 1.0, green: 0.42, blue: 0.21)
                                                    ]),
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                ),
                                                lineWidth: 3
                                            )
                                    )
                                    .offset(y: 15)
                                }
                                .padding(.trailing, 24)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .frame(height: 210)
                        .cornerRadius(20)
                        .shadow(color: Color.black.opacity(0.15), radius: 16, x: 0, y: 8)
                        .padding(.horizontal, 16)
                        .padding(.top, 16)
                        .clipped()
                        
                        // Индикаторы карусели
                        HStack(spacing: 6) {
                            Circle()
                                .fill(Color(red: 1.0, green: 0.65, blue: 0.0))
                                .frame(width: 8, height: 8)
                            Circle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 8, height: 8)
                            Circle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 8, height: 8)
                            Circle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 8, height: 8)
                        }
                        .padding(.top, 12)
                        .padding(.bottom, 16)
                        
                        // Секция с описанием доставки
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Доставка суші у Києві")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(.black)
                            
                            Text("В асортименті WATTA SUSHI представлені роли, суші, сети і напої на будь-який смак. Ми рекомендуємо обов'язково спробувати топ позиції нашого меню!")
                                .font(.system(size: 15))
                                .foregroundColor(.gray)
                                .lineSpacing(4)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 16)
                        .padding(.top, 20)
                        .padding(.bottom, 24)
                        
                        // Список товаров
                        VStack(alignment: .leading, spacing: 12) {
                            ForEach(filteredItems) { item in
                                NavigationLink {
                                    MenuItemDetailView(item: item, cartManager: cartManager)
                                } label: {
                                    MenuItemCard(item: item, onAddToCart: {
                                        cartManager.addItem(item)
                                    })
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .padding(.top, 8)
                        .padding(.bottom, 16)
                        .background(Color.white)
                    }
                }
            }
            .background(Color.white)
            .ignoresSafeArea(edges: [.top, .bottom])
            .navigationBarHidden(true)
        }
    }
    
    func categoryEmoji(_ category: String) -> String {
        switch category {
        case "Роллы": return "🍣"
        case "Суши": return "🍱"
        case "Сеты": return "🍱"
        case "Супы": return "🍲"
        case "Боули": return "🥣"
        case "Закуски": return "🦐"
        case "Напитки": return "🥤"
        case "Соусы": return "🍶"
        default: return "🍣"
        }
    }
}

struct MenuItem: Identifiable {
    let id: Int
    let name: String
    let description: String
    let price: Int
    let category: String
    let image: String
    var isTop: Bool = false
}

struct MenuItemDetailView: View {
    let item: MenuItem
    @ObservedObject var cartManager: CartManager
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Изображение
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    Color.gray.opacity(0.05),
                                    Color.gray.opacity(0.15)
                                ]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 220, height: 220)
                        .shadow(color: Color.black.opacity(0.12), radius: 18, x: 0, y: 8)
                    
                    Text(item.image)
                        .font(.system(size: 120))
                }
                .padding(.top, 24)
                
                // Информация
                VStack(alignment: .leading, spacing: 16) {
                    Text(item.name)
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(.black)
                    
                    Text(item.description)
                        .font(.system(size: 16))
                        .foregroundColor(.gray)
                        .lineSpacing(4)
                    
                    HStack {
                        Text("\(item.price) Р")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(Color(red: 1.0, green: 0.42, blue: 0.21))
                        
                        Spacer()
                    }
                }
                .padding(.horizontal, 24)
                
                Spacer(minLength: 12)
                
                Button(action: {
                    cartManager.addItem(item)
                }) {
                    Text("Добавить в корзину")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(red: 1.0, green: 0.42, blue: 0.21))
                        .cornerRadius(16)
                        .shadow(color: Color(red: 1.0, green: 0.42, blue: 0.21).opacity(0.4), radius: 10, x: 0, y: 4)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 32)
            }
        }
        .background(Color.white)
        .navigationTitle(item.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct MenuItemCard: View {
    let item: MenuItem
    let onAddToCart: () -> Void
    @State private var isPressed = false
    
    var body: some View {
        HStack(spacing: 16) {
            // Изображение слева с градиентом
            ZStack(alignment: .topLeading) {
                ZStack {
                    // Красивый градиентный фон
                    LinearGradient(
                        gradient: Gradient(colors: [
                            Color(red: 1.0, green: 0.42, blue: 0.21).opacity(0.1),
                            Color(red: 1.0, green: 0.65, blue: 0.0).opacity(0.05)
                        ]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    
                    Text(item.image)
                        .font(.system(size: 65))
                }
                .frame(width: 110, height: 110)
                .cornerRadius(16)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    Color(red: 1.0, green: 0.42, blue: 0.21).opacity(0.3),
                                    Color.clear
                                ]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
                
                // Топ бейдж с градиентом
                if item.isTop {
                    HStack(spacing: 4) {
                        Text("⚡")
                            .font(.system(size: 12))
                        Text("Топ")
                            .font(.system(size: 10, weight: .bold))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 1.0, green: 0.42, blue: 0.21),
                                Color(red: 1.0, green: 0.55, blue: 0.3)
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(12)
                    .shadow(color: Color(red: 1.0, green: 0.42, blue: 0.21).opacity(0.4), radius: 4, x: 0, y: 2)
                    .padding(8)
                }
            }
            
            // Информация справа
            VStack(alignment: .leading, spacing: 8) {
                Text(item.name)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.black)
                    .lineLimit(1)
                
                Text(item.description)
                    .font(.system(size: 14))
                    .foregroundColor(.gray)
                    .lineLimit(2)
                
                Spacer()
                
                HStack {
                    Text("\(item.price) Р")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(Color(red: 1.0, green: 0.42, blue: 0.21))
                    
                    Spacer()
                    
                    Button(action: {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                            isPressed = true
                        }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                                isPressed = false
                            }
                        }
                        onAddToCart()
                    }) {
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        gradient: Gradient(colors: [
                                            Color(red: 1.0, green: 0.42, blue: 0.21),
                                            Color(red: 1.0, green: 0.55, blue: 0.3)
                                        ]),
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 40, height: 40)
                                .shadow(color: Color(red: 1.0, green: 0.42, blue: 0.21).opacity(0.4), radius: 6, x: 0, y: 3)
                            
                            Text("+")
                                .font(.system(size: 24, weight: .light))
                                .foregroundColor(.white)
                        }
                        .scaleEffect(isPressed ? 0.9 : 1.0)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 4)
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.08), radius: 12, x: 0, y: 4)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.gray.opacity(0.1), lineWidth: 1)
        )
        .padding(.horizontal, 16)
        .padding(.vertical, 6)
    }
}

struct CartView: View {
    @ObservedObject var cartManager: CartManager
    
    var body: some View {
        NavigationStack {
            VStack {
                if cartManager.items.isEmpty {
                    Spacer()
                    VStack(spacing: 20) {
                        Image(systemName: "cart")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        Text("Корзина пуста")
                            .font(.title2)
                            .foregroundColor(.gray)
                    }
                    Spacer()
                } else {
                    List {
                        ForEach(cartManager.items) { item in
                            HStack {
                                Text(item.image)
                                    .font(.title)
                                VStack(alignment: .leading) {
                                    Text(item.name)
                                        .font(.headline)
                                    Text("\(item.price) Р")
                                        .foregroundColor(Color(red: 1.0, green: 0.42, blue: 0.21))
                                }
                                Spacer()
                            }
                        }
                    }
                    
                    VStack(spacing: 15) {
                        HStack {
                            Text("Итого:")
                                .font(.title2)
                            Spacer()
                            Text("\(cartManager.totalPrice) Р")
                                .font(.title)
                                .foregroundColor(Color(red: 1.0, green: 0.42, blue: 0.21))
                        }
                        .padding()
                        
                        Button(action: {
                            cartManager.clearCart()
                        }) {
                            Text("Оформить заказ")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color(red: 1.0, green: 0.42, blue: 0.21))
                                .cornerRadius(12)
                        }
                        .padding(.horizontal)
                    }
                    .background(Color.white)
                }
            }
            .navigationTitle("Корзина")
        }
    }
}

struct ProfileView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Image(systemName: "person.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.gray)
                
                Text("Профиль")
                    .font(.title)
                
                List {
                    Section("Информация") {
                        HStack {
                            Text("Имя")
                            Spacer()
                            Text("Пользователь")
                                .foregroundColor(.gray)
                        }
                        HStack {
                            Text("Телефон")
                            Spacer()
                            Text("+7 (999) 123-45-67")
                                .foregroundColor(.gray)
                        }
                        HStack {
                            Text("Адрес")
                            Spacer()
                            Text("Москва")
                                .foregroundColor(.gray)
                        }
                    }
                    
                    Section("Заказы") {
                        NavigationLink("История заказов") {
                            Text("История заказов")
                        }
                    }
                }
            }
            .navigationTitle("Профиль")
        }
    }
}

#Preview {
    ContentView()
}
