"""Seed course content: one Spanish course, three units, twelve skills.

Kept as plain data so the seeder can generate every exercise type from the same
vocabulary -- adding a skill means adding one entry here, not 12 exercise rows.
Each word is (english, spanish, emoji); each sentence is (english, spanish).
"""
from __future__ import annotations

COURSE = {
    "title": "Spanish",
    "language_code": "es",
    "from_language": "English",
    "flag_emoji": "🇪🇸",
}

UNITS: list[dict] = [
    {
        "title": "Unit 1",
        "description": "Order food and drink",
        "color": "#58CC02",
        "skills": [
            {
                "title": "Basics 1",
                "icon": "star",
                "words": [
                    ("the man", "el hombre", "👨"),
                    ("the woman", "la mujer", "👩"),
                    ("the boy", "el niño", "👦"),
                    ("the girl", "la niña", "👧"),
                    ("the bread", "el pan", "🍞"),
                    ("the water", "el agua", "💧"),
                    ("the milk", "la leche", "🥛"),
                    ("the apple", "la manzana", "🍎"),
                ],
                "sentences": [
                    ("I am a man", "Yo soy un hombre"),
                    ("She is a woman", "Ella es una mujer"),
                    ("The boy eats bread", "El niño come pan"),
                    ("I drink water", "Yo bebo agua"),
                ],
            },
            {
                "title": "Greetings",
                "icon": "wave",
                "words": [
                    ("hello", "hola", "👋"),
                    ("goodbye", "adiós", "🚪"),
                    ("good morning", "buenos días", "🌅"),
                    ("good night", "buenas noches", "🌙"),
                    ("thank you", "gracias", "🙏"),
                    ("please", "por favor", "🙌"),
                    ("yes", "sí", "✅"),
                    ("no", "no", "❌"),
                ],
                "sentences": [
                    ("Hello, how are you?", "Hola, ¿cómo estás?"),
                    ("Good morning, Ana", "Buenos días, Ana"),
                    ("Thank you very much", "Muchas gracias"),
                    ("My name is Ana", "Me llamo Ana"),
                ],
            },
            {
                "title": "Travel",
                "icon": "plane",
                "words": [
                    ("the train", "el tren", "🚆"),
                    ("the car", "el coche", "🚗"),
                    ("the airport", "el aeropuerto", "✈️"),
                    ("the ticket", "el billete", "🎫"),
                    ("the hotel", "el hotel", "🏨"),
                    ("the map", "el mapa", "🗺️"),
                    ("the city", "la ciudad", "🏙️"),
                    ("the beach", "la playa", "🏖️"),
                ],
                "sentences": [
                    ("Where is the hotel?", "¿Dónde está el hotel?"),
                    ("I travel by train", "Yo viajo en tren"),
                    ("The city is big", "La ciudad es grande"),
                    ("I want a ticket", "Yo quiero un billete"),
                ],
            },
            {
                "title": "Food",
                "icon": "apple",
                "words": [
                    ("the rice", "el arroz", "🍚"),
                    ("the fish", "el pescado", "🐟"),
                    ("the cheese", "el queso", "🧀"),
                    ("the coffee", "el café", "☕"),
                    ("the egg", "el huevo", "🥚"),
                    ("the chicken", "el pollo", "🍗"),
                    ("the salad", "la ensalada", "🥗"),
                    ("the sugar", "el azúcar", "🍬"),
                ],
                "sentences": [
                    ("I eat rice", "Yo como arroz"),
                    ("The coffee is hot", "El café está caliente"),
                    ("We want fish", "Nosotros queremos pescado"),
                    ("The cheese is delicious", "El queso está delicioso"),
                ],
            },
            {
                "title": "Basics 2",
                "icon": "book",
                "words": [
                    ("to eat", "comer", "🍽️"),
                    ("to drink", "beber", "🥤"),
                    ("to read", "leer", "📖"),
                    ("to write", "escribir", "✍️"),
                    ("to speak", "hablar", "💬"),
                    ("to live", "vivir", "🏠"),
                    ("big", "grande", "🔼"),
                    ("small", "pequeño", "🔽"),
                ],
                "sentences": [
                    ("I speak Spanish", "Yo hablo español"),
                    ("You read a book", "Tú lees un libro"),
                    ("We live in Madrid", "Nosotros vivimos en Madrid"),
                    ("They write letters", "Ellos escriben cartas"),
                ],
            },
        ],
    },
    {
        "title": "Unit 2",
        "description": "Talk about people and animals",
        "color": "#CE82FF",
        "skills": [
            {
                "title": "Family",
                "icon": "family",
                "words": [
                    ("the mother", "la madre", "👩"),
                    ("the father", "el padre", "👨"),
                    ("the sister", "la hermana", "👧"),
                    ("the brother", "el hermano", "👦"),
                    ("the son", "el hijo", "🧒"),
                    ("the daughter", "la hija", "👧"),
                    ("the grandmother", "la abuela", "👵"),
                    ("the family", "la familia", "👪"),
                ],
                "sentences": [
                    ("My mother is a doctor", "Mi madre es médica"),
                    ("He is my brother", "Él es mi hermano"),
                    ("The family eats together", "La familia come junta"),
                    ("I have two sisters", "Yo tengo dos hermanas"),
                ],
            },
            {
                "title": "Animals",
                "icon": "paw",
                "words": [
                    ("the dog", "el perro", "🐶"),
                    ("the cat", "el gato", "🐱"),
                    ("the bird", "el pájaro", "🐦"),
                    ("the horse", "el caballo", "🐴"),
                    ("the cow", "la vaca", "🐮"),
                    ("the mouse", "el ratón", "🐭"),
                    ("the bear", "el oso", "🐻"),
                    ("the duck", "el pato", "🦆"),
                ],
                "sentences": [
                    ("The dog drinks water", "El perro bebe agua"),
                    ("The cat is small", "El gato es pequeño"),
                    ("I have a bird", "Yo tengo un pájaro"),
                    ("The horse eats an apple", "El caballo come una manzana"),
                ],
            },
            {
                "title": "Colors",
                "icon": "palette",
                "words": [
                    ("red", "rojo", "🔴"),
                    ("blue", "azul", "🔵"),
                    ("green", "verde", "🟢"),
                    ("yellow", "amarillo", "🟡"),
                    ("black", "negro", "⚫"),
                    ("white", "blanco", "⚪"),
                    ("orange", "naranja", "🟠"),
                    ("purple", "morado", "🟣"),
                ],
                "sentences": [
                    ("The car is red", "El coche es rojo"),
                    ("I like the color blue", "Me gusta el color azul"),
                    ("The house is white", "La casa es blanca"),
                    ("She has a green dress", "Ella tiene un vestido verde"),
                ],
            },
            {
                "title": "Phrases",
                "icon": "chat",
                "words": [
                    ("how much", "cuánto", "💰"),
                    ("where", "dónde", "📍"),
                    ("when", "cuándo", "⏰"),
                    ("why", "por qué", "❓"),
                    ("I am sorry", "lo siento", "😔"),
                    ("excuse me", "perdón", "🙋"),
                    ("of course", "por supuesto", "👍"),
                    ("maybe", "quizás", "🤔"),
                ],
                "sentences": [
                    ("How much does it cost?", "¿Cuánto cuesta?"),
                    ("I do not understand", "Yo no entiendo"),
                    ("Can you help me?", "¿Puedes ayudarme?"),
                    ("See you tomorrow", "Hasta mañana"),
                ],
            },
        ],
    },
    {
        "title": "Unit 3",
        "description": "Get around town",
        "color": "#1CB0F6",
        "skills": [
            {
                "title": "Restaurant",
                "icon": "fork",
                "words": [
                    ("the menu", "el menú", "📋"),
                    ("the table", "la mesa", "🪑"),
                    ("the bill", "la cuenta", "🧾"),
                    ("the waiter", "el camarero", "🤵"),
                    ("the glass", "el vaso", "🥛"),
                    ("the spoon", "la cuchara", "🥄"),
                    ("the knife", "el cuchillo", "🔪"),
                    ("the plate", "el plato", "🍽️"),
                ],
                "sentences": [
                    ("The bill, please", "La cuenta, por favor"),
                    ("A table for two", "Una mesa para dos"),
                    ("I want the menu", "Yo quiero el menú"),
                    ("The waiter brings water", "El camarero trae agua"),
                ],
            },
            {
                "title": "Places",
                "icon": "pin",
                "words": [
                    ("the house", "la casa", "🏠"),
                    ("the school", "la escuela", "🏫"),
                    ("the market", "el mercado", "🏪"),
                    ("the park", "el parque", "🌳"),
                    ("the office", "la oficina", "🏢"),
                    ("the church", "la iglesia", "⛪"),
                    ("the museum", "el museo", "🏛️"),
                    ("the street", "la calle", "🛣️"),
                ],
                "sentences": [
                    ("The school is near", "La escuela está cerca"),
                    ("I go to the market", "Yo voy al mercado"),
                    ("The park is beautiful", "El parque es bonito"),
                    ("Where is the street?", "¿Dónde está la calle?"),
                ],
            },
            {
                "title": "Time",
                "icon": "clock",
                "words": [
                    ("today", "hoy", "📅"),
                    ("tomorrow", "mañana", "🌄"),
                    ("yesterday", "ayer", "🌇"),
                    ("now", "ahora", "⏱️"),
                    ("the week", "la semana", "🗓️"),
                    ("the month", "el mes", "📆"),
                    ("the year", "el año", "🎉"),
                    ("late", "tarde", "🕙"),
                ],
                "sentences": [
                    ("Today is Monday", "Hoy es lunes"),
                    ("I work tomorrow", "Yo trabajo mañana"),
                    ("The month is long", "El mes es largo"),
                    ("It is late", "Es tarde"),
                ],
            },
        ],
    },
]

ACHIEVEMENTS = [
    {
        "code": "wildfire",
        "title": "Wildfire",
        "description": "Reach a day streak",
        "icon": "flame",
        "metric": "streak",
        "tiers": [3, 7, 14, 30, 50],
    },
    {
        "code": "sage",
        "title": "Sage",
        "description": "Earn XP",
        "icon": "sage",
        "metric": "total_xp",
        "tiers": [100, 250, 500, 1000, 2500],
    },
    {
        "code": "scholar",
        "title": "Scholar",
        "description": "Learn new words",
        "icon": "scholar",
        "metric": "words",
        "tiers": [10, 25, 50, 100, 200],
    },
    {
        "code": "champion",
        "title": "Champion",
        "description": "Earn crowns",
        "icon": "crown",
        "metric": "crowns",
        "tiers": [1, 5, 10, 20, 40],
    },
    {
        "code": "sharpshooter",
        "title": "Sharpshooter",
        "description": "Finish lessons with no mistakes",
        "icon": "target",
        "metric": "perfect_lessons",
        "tiers": [1, 5, 10, 25, 50],
    },
]

# Leaderboard rivals -- the brief allows social features to be seeded.
# (username, display name, avatar, weekly XP)
RIVALS = [
    ("sofia", "Sofia", "🦄", 240),
    ("mateo", "Mateo", "🚀", 205),
    ("priya", "Priya", "🌸", 190),
    ("liam", "Liam", "🎸", 150),
    ("chen", "Chen", "🎯", 120),
    ("amara", "Amara", "🌟", 95),
    ("noah", "Noah", "🏀", 70),
    ("yuki", "Yuki", "🍣", 45),
    ("elena", "Elena", "🎨", 20),
]
