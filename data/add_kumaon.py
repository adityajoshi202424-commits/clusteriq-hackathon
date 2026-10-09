import json
import os

new_hotels = [
    {
        "id": "manu_maharani_nainital",
        "name": "The Manu Maharani",
        "category": "Luxury Resort (5-Star)",
        "location": "Mallital, Nainital",
        "distance_to_mall_road_m": 800,
        "total_rooms": 67,
        "price_range": "₹12,000 - ₹25,000",
        "platforms": ["MakeMyTrip", "TripAdvisor"],
        "hero_image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
    },
    {
        "id": "fishermans_lodge_bhimtal",
        "name": "Fishermen's Lodge",
        "category": "Boutique Resort (4-Star)",
        "location": "Mandir Marg, Bhimtal",
        "distance_to_mall_road_m": 0,
        "total_rooms": 20,
        "price_range": "₹8,000 - ₹15,000",
        "platforms": ["MakeMyTrip", "Google"],
        "hero_image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
    },
    {
        "id": "kumaon_mandal_haldwani",
        "name": "KMVN Tourist Rest House",
        "category": "Budget Economy (2-Star)",
        "location": "Kathgodam, Haldwani",
        "distance_to_mall_road_m": 0,
        "total_rooms": 30,
        "price_range": "₹1,500 - ₹3,500",
        "platforms": ["MakeMyTrip", "Google"],
        "hero_image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    }
]

new_reviews = [
    {
        "hotel_id": "manu_maharani_nainital",
        "platform": "TripAdvisor",
        "date": "2026-02-10",
        "rating": 4.5,
        "reviewer_type": "Family",
        "text": "The pool was amazing and the breakfast buffet was huge! Quality of the rooms is definitely 5-star, but the price is very expensive. Parking in Nainital is tough.",
        "url": "https://www.tripadvisor.in"
    },
    {
        "hotel_id": "manu_maharani_nainital",
        "platform": "MakeMyTrip",
        "date": "2026-01-15",
        "rating": 5.0,
        "reviewer_type": "Couple",
        "text": "Premium quality experience. Breakfast near the pool is highly recommended. Worth the high price. Value for money.",
        "url": "https://www.makemytrip.com"
    },
    {
        "hotel_id": "fishermans_lodge_bhimtal",
        "platform": "Google",
        "date": "2026-01-20",
        "rating": 4.0,
        "reviewer_type": "Friends",
        "text": "Great view of Bhimtal lake. Price is reasonable compared to Nainital hotels. Breakfast could have more options, but the overall quality of stay was excellent.",
        "url": "https://maps.google.com"
    },
    {
        "hotel_id": "kumaon_mandal_haldwani",
        "platform": "MakeMyTrip",
        "date": "2026-02-05",
        "rating": 3.0,
        "reviewer_type": "Solo",
        "text": "Cheap and affordable price. No pool, but the breakfast was decent for a budget property. Cleanliness quality is average.",
        "url": "https://www.makemytrip.com"
    }
]

try:
    with open('c:/Users/USER/Desktop/geu tbi/data/build_dataset.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the end of HOTELS array and insert new hotels before the closing bracket
    hotel_end_str = "    }\n]"
    hotel_insert_idx = content.find(hotel_end_str)
    
    if hotel_insert_idx != -1:
        new_hotels_str = "    },\n    " + ",\n    ".join([json.dumps(h, indent=4).replace('\\n', '\n').replace('    ', '        ').replace('{\n        ', '{\n        ') for h in new_hotels]) + "\n]"
        content = content[:hotel_insert_idx] + new_hotels_str + content[hotel_insert_idx + len(hotel_end_str):]
    
    # Do the same for REVIEWS array
    review_end_str = "    }\n]"
    review_insert_idx = content.find(review_end_str, content.find('REVIEWS = ['))
    if review_insert_idx != -1:
        new_reviews_str = "    },\n    " + ",\n    ".join([json.dumps(r, indent=4).replace('\\n', '\n').replace('    ', '        ').replace('{\n        ', '{\n        ') for r in new_reviews]) + "\n]"
        content = content[:review_insert_idx] + new_reviews_str + content[review_insert_idx + len(review_end_str):]
    
    with open('c:/Users/USER/Desktop/geu tbi/data/build_dataset.py', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Successfully added Nainital, Bhimtal, Haldwani data.")
except Exception as e:
    print("Error:", e)
