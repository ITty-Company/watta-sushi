package com.sushivatta.app

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex

@Composable
fun MainScreen() {
    var selectedTab by remember { mutableStateOf(0) }
    val cartManager = remember { CartManager() }
    
    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Головна") },
                    label = { Text("Головна") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.ShoppingCart, contentDescription = "Корзина") },
                    label = { Text("Корзина") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Профіль") },
                    label = { Text("Профіль") }
                )
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
            when (selectedTab) {
                0 -> MenuView(cartManager = cartManager)
                1 -> CartView(cartManager = cartManager)
                2 -> ProfileView()
            }
        }
    }
}

class CartManager {
    val items = mutableStateListOf<MenuItem>()
    
    fun addItem(item: MenuItem) {
        items.add(item)
    }
    
    fun clearCart() {
        items.clear()
    }
    
    fun totalPrice(): Int {
        return items.sumOf { it.price }
    }
}

data class MenuItem(
    val id: Int,
    val name: String,
    val description: String,
    val price: Int,
    val category: String,
    val emoji: String,
    val isTop: Boolean = false
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MenuView(cartManager: CartManager) {
    val categories = listOf("Роли", "Суші", "Сети", "Супи", "Боули", "Закуски", "Напої", "Соуси")
    var selectedCategory by remember { mutableStateOf("Роли") }
    
    val menuItems = listOf(
        MenuItem(1, "Филадельфия", "Лосось, сыр, огурец", 450, "Роли", "🍣", true),
        MenuItem(2, "Калифорния", "Краб, авокадо, огурец", 380, "Роли", "🍱"),
        MenuItem(3, "Лосось", "Свежий лосось", 120, "Суші", "🍣"),
        MenuItem(4, "Тунец", "Свежий тунец", 130, "Суші", "🍣"),
        MenuItem(5, "Сет №1", "20 штук", 1200, "Сети", "🍱"),
        MenuItem(6, "Кола", "0.5л", 100, "Напої", "🥤"),
    )
    
    val filteredItems = menuItems.filter { it.category == selectedCategory }
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 16.dp)
    ) {
        // Верхняя панель
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🍣", fontSize = 24.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("WATTA SUSHI", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🇷🇺", fontSize = 16.sp)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("RU Москва", fontSize = 14.sp, color = Color.Gray)
                }
                
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    IconButton(onClick = {}) {
                        Icon(Icons.Default.Phone, contentDescription = "Телефон", tint = Color.Gray)
                    }
                    IconButton(onClick = {}) {
                        Icon(Icons.Default.Notifications, contentDescription = "Уведомления", tint = Color.Gray)
                    }
                    IconButton(onClick = {}) {
                        Icon(Icons.Default.Favorite, contentDescription = "Избранное", tint = Color.Gray)
                    }
                    IconButton(onClick = {}) {
                        Icon(Icons.Default.Menu, contentDescription = "Меню", tint = Color.Gray)
                    }
                }
            }
        }
        
        // Категории
        item {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
            ) {
                items(categories) { category ->
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .width(70.dp)
                            .padding(vertical = 12.dp)
                            .then(
                                if (selectedCategory == category) {
                                    Modifier
                                } else {
                                    Modifier
                                }
                            )
                    ) {
                        Text(
                            text = getCategoryIcon(category),
                            fontSize = 24.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = category,
                            fontSize = 12.sp,
                            color = if (selectedCategory == category) Color(0xFFFF6B35) else Color.Gray,
                            fontWeight = if (selectedCategory == category) FontWeight.SemiBold else FontWeight.Normal
                        )
                    }
                }
            }
        }
        
        // Промо баннер
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
                    .padding(horizontal = 16.dp, vertical = 16.dp)
            ) {
                Card(
                    modifier = Modifier.fillMaxSize(),
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFF2C3E50)
                    ),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Користь азіатських супів",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            modifier = Modifier.weight(1f)
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("🍜", fontSize = 40.sp)
                            Text("🍲", fontSize = 40.sp)
                            Text("🥘", fontSize = 40.sp)
                        }
                    }
                }
            }
        }
        
        // Заголовок секции
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 16.dp)
            ) {
                Text(
                    text = "Доставка суші у Москві",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "В асортименті WATTA SUSHI представлені роли, суші, сети і напої на будь-який смак. Ми рекомендуємо обов'язково спробувати топ позиції нашого меню!",
                    fontSize = 14.sp,
                    color = Color.Gray,
                    lineHeight = 20.sp
                )
            }
        }
        
        // Заголовок категории
        item {
            Text(
                text = selectedCategory,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )
        }
        
        // Список товаров
        items(filteredItems) { item ->
            MenuItemCard(
                item = item,
                onAddToCart = { cartManager.addItem(item) }
            )
        }
    }
}

@Composable
fun getCategoryIcon(category: String): String {
    return when (category) {
        "Роли" -> "🍣"
        "Суші" -> "🍱"
        "Сети" -> "🍱"
        "Супи" -> "🍲"
        "Боули" -> "🥣"
        "Закуски" -> "🦐"
        "Напої" -> "🥤"
        "Соуси" -> "🍶"
        else -> "🍣"
    }
}

@Composable
fun MenuItemCard(item: MenuItem, onAddToCart: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = MaterialTheme.shapes.medium
    ) {
        Column {
            // Изображение с бейджем
            Box(modifier = Modifier.fillMaxWidth()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(item.emoji, fontSize = 80.sp)
                    }
                }
                
                if (item.isTop) {
                    Surface(
                        modifier = Modifier
                            .padding(12.dp)
                            .zIndex(1f),
                        color = Color(0xFFFF6B35),
                        shape = MaterialTheme.shapes.small
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("⚡", fontSize = 14.sp)
                            Text("Топ продажів", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        }
                    }
                }
            }
            
            // Информация о товаре
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Text(
                    text = item.name,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = item.description,
                    fontSize = 14.sp,
                    color = Color.Gray
                )
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${item.price} ₽",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFFF6B35)
                    )
                    FloatingActionButton(
                        onClick = onAddToCart,
                        modifier = Modifier.size(40.dp),
                        containerColor = Color(0xFFFF6B35),
                        contentColor = Color.White
                    ) {
                        Text("+", fontSize = 24.sp, fontWeight = FontWeight.Light)
                    }
                }
            }
        }
    }
}

@Composable
fun CartView(cartManager: CartManager) {
    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            text = "Корзина",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(16.dp)
        )
        
        if (cartManager.items.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text("🛒", fontSize = 64.sp)
                    Text("Корзина пуста", fontSize = 20.sp, color = Color.Gray)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(cartManager.items) { item ->
                    Card {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(item.emoji, fontSize = 32.sp)
                            Spacer(modifier = Modifier.width(16.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(item.name, fontWeight = FontWeight.Bold)
                                Text("${item.price} ₽", color = Color(0xFFFF6B35), fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Итого:", fontSize = 20.sp)
                        Text(
                            "${cartManager.totalPrice()} ₽",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFFF6B35)
                        )
                    }
                    
                    Button(
                        onClick = { cartManager.clearCart() },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B35))
                    ) {
                        Text("Оформить заказ", fontSize = 16.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun ProfileView() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Text("👤", fontSize = 80.sp)
        Text("Профиль", fontSize = 28.sp, fontWeight = FontWeight.Bold)
        
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                ProfileRow("Имя", "Пользователь")
                Divider()
                ProfileRow("Телефон", "+7 (999) 123-45-67")
                Divider()
                ProfileRow("Адрес", "Москва")
            }
        }
        
        Card(modifier = Modifier.fillMaxWidth()) {
            TextButton(
                onClick = { },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("История заказов")
            }
        }
    }
}

@Composable
fun ProfileRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label)
        Text(value, color = Color.Gray)
    }
}
