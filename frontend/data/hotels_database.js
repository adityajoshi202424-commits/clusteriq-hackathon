/**
 * ClusterIQ Hotels Database - 48 Properties Across 4 Uttarakhand Cities
 * Structured review intelligence data for city search, comparison, and aspect filtering.
 * Sources modeled: Booking.com, MakeMyTrip, Goibibo, Google, TripAdvisor
 */
window.HOTELS_DATABASE = {
  cities: [
    { id: "mussoorie", name: "Mussoorie", state: "Uttarakhand", tagline: "Queen of the Hills", hotelCount: 12, avgPrice: 9500 },
    { id: "nainital", name: "Nainital", state: "Uttarakhand", tagline: "Lake District of India", hotelCount: 12, avgPrice: 7800 },
    { id: "bhimtal", name: "Bhimtal", state: "Uttarakhand", tagline: "Hidden Kumaon Gem", hotelCount: 12, avgPrice: 5200 },
    { id: "dehradun", name: "Dehradun", state: "Uttarakhand", tagline: "Gateway to the Garhwal", hotelCount: 12, avgPrice: 6500 }
  ],
  hotels: [
    // ===== MUSSOORIE (12 Hotels) =====
    {
      id: "welcomhotel_savoy", city: "mussoorie", name: "Welcomhotel by ITC Hotels, The Savoy",
      category: "Luxury Heritage (5-Star)", address: "Library Bazar, Gandhi Chowk, Mussoorie",
      price_range: { min: 22000, max: 45000 }, rating: 4.5, total_reviews: 842,
      hero_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 88, pos: 142, neg: 18, total: 195 },
        room: { score: 82, pos: 128, neg: 24, total: 188 },
        view: { score: 79, pos: 105, neg: 22, total: 162 },
        staff: { score: 85, pos: 138, neg: 20, total: 190 },
        cleanliness: { score: 90, pos: 148, neg: 12, total: 178 },
        value: { score: 52, pos: 62, neg: 55, total: 145 },
        location: { score: 91, pos: 155, neg: 10, total: 180 }
      },
      platforms: {
        booking_com: { rating: 8.8, price: 24500, review_count: 312 },
        makemytrip: { rating: 4.4, price: 22800, review_count: 285 },
        goibibo: { rating: 4.3, price: 23200, review_count: 245 }
      },
      top_reviews: [
        { text: "Victorian Gothic architecture and misty winter views of the Doon valley took our breath away. Central heating was spotless. Royal Afghan dinner was divine.", platform: "TripAdvisor", rating: 5.0, date: "2026-01-18" },
        { text: "Heritage property but check-in pe peak rush mein 45 min wait karna pada. Restaurant service slow.", platform: "MakeMyTrip", rating: 3.0, date: "2025-05-24" },
        { text: "Breakfast buffet is huge with live counter for dosas and fresh mountain bakery. Cleanliness 10/10.", platform: "Booking.com", rating: 4.5, date: "2025-06-15" }
      ]
    },
    {
      id: "jw_marriott", city: "mussoorie", name: "JW Marriott Mussoorie Walnut Grove Resort & Spa",
      category: "Ultra Luxury Resort (5-Star)", address: "Village Siya, Kempty Fall Road, Mussoorie",
      price_range: { min: 28000, max: 55000 }, rating: 4.6, total_reviews: 1120,
      hero_image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 92, pos: 185, neg: 12, total: 220 },
        room: { score: 90, pos: 178, neg: 15, total: 215 },
        view: { score: 88, pos: 168, neg: 18, total: 210 },
        staff: { score: 91, pos: 180, neg: 14, total: 218 },
        cleanliness: { score: 93, pos: 190, neg: 10, total: 220 },
        value: { score: 48, pos: 55, neg: 60, total: 140 },
        location: { score: 35, pos: 45, neg: 82, total: 180 }
      },
      platforms: {
        booking_com: { rating: 9.1, price: 32500, review_count: 420 },
        makemytrip: { rating: 4.6, price: 29800, review_count: 380 },
        goibibo: { rating: 4.5, price: 30500, review_count: 320 }
      },
      top_reviews: [
        { text: "Unparalleled luxury in the Himalayas. Heated indoor pool overlooking pine valley is paradise. Teppanyaki dinner outstanding.", platform: "TripAdvisor", rating: 5.0, date: "2026-02-14" },
        { text: "Peak season weekend mein Kempty road pe traffic jam bohot zyada tha. 2.5 hours to reach from Dehradun toll.", platform: "MakeMyTrip", rating: 4.0, date: "2025-05-18" },
        { text: "Breakfast buffet with Garhwali dishes like chainssoo was delicious. Safe parking and EV charger on site.", platform: "Booking.com", rating: 5.0, date: "2025-06-20" }
      ]
    },
    {
      id: "jaypee_residency", city: "mussoorie", name: "Jaypee Residency Manor",
      category: "Luxury Resort (5-Star)", address: "Barlow Ganj, Mussoorie",
      price_range: { min: 16000, max: 32000 }, rating: 4.4, total_reviews: 765,
      hero_image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 78, pos: 95, neg: 25, total: 155 },
        room: { score: 80, pos: 100, neg: 22, total: 148 },
        view: { score: 94, pos: 145, neg: 6, total: 160 },
        staff: { score: 75, pos: 88, neg: 28, total: 142 },
        cleanliness: { score: 72, pos: 82, neg: 30, total: 138 },
        value: { score: 68, pos: 72, neg: 32, total: 130 },
        location: { score: 45, pos: 52, neg: 62, total: 140 }
      },
      platforms: {
        booking_com: { rating: 8.2, price: 18500, review_count: 280 },
        makemytrip: { rating: 4.3, price: 17200, review_count: 265 },
        goibibo: { rating: 4.2, price: 17800, review_count: 220 }
      },
      top_reviews: [
        { text: "360-degree hilltop view of Doon Valley and snow peaks is breathtaking. Indoor heated pool kept kids entertained in January.", platform: "MakeMyTrip", rating: 5.0, date: "2026-01-30" },
        { text: "Barlowganj location means you need cabs to visit Mall Road shopping. Taxi charges extra.", platform: "TripAdvisor", rating: 3.5, date: "2025-12-19" }
      ]
    },
    {
      id: "fortune_resort_grace", city: "mussoorie", name: "Fortune Resort Grace (Member ITC)",
      category: "Upper Upscale (4-Star)", address: "Library Bazaar, Mussoorie",
      price_range: { min: 8500, max: 16000 }, rating: 3.9, total_reviews: 520,
      hero_image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 72, pos: 68, neg: 24, total: 110 },
        room: { score: 65, pos: 58, neg: 30, total: 105 },
        view: { score: 70, pos: 62, neg: 25, total: 102 },
        staff: { score: 68, pos: 60, neg: 28, total: 108 },
        cleanliness: { score: 60, pos: 52, neg: 34, total: 100 },
        value: { score: 55, pos: 48, neg: 38, total: 98 },
        location: { score: 85, pos: 82, neg: 12, total: 105 }
      },
      platforms: {
        booking_com: { rating: 7.6, price: 9800, review_count: 195 },
        makemytrip: { rating: 3.9, price: 8900, review_count: 180 },
        goibibo: { rating: 3.8, price: 9200, review_count: 145 }
      },
      top_reviews: [
        { text: "Location is excellent near Library Bazaar. Rooms are clean but slightly dated. Food quality is decent.", platform: "Google", rating: 4.0, date: "2025-08-12" },
        { text: "Parking ki bohot dikkat thi. Weekend pe koi jagah nahi mili.", platform: "MakeMyTrip", rating: 3.0, date: "2025-10-19" }
      ]
    },
    {
      id: "claridges_nabha", city: "mussoorie", name: "The Claridges Nabha Residence",
      category: "Heritage Boutique (4-Star)", address: "Airfield, Barlowganj, Mussoorie",
      price_range: { min: 11000, max: 22000 }, rating: 4.3, total_reviews: 310,
      hero_image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 80, pos: 48, neg: 10, total: 72 },
        room: { score: 85, pos: 52, neg: 8, total: 70 },
        view: { score: 82, pos: 50, neg: 9, total: 68 },
        staff: { score: 78, pos: 45, neg: 12, total: 65 },
        cleanliness: { score: 84, pos: 50, neg: 8, total: 68 },
        value: { score: 62, pos: 35, neg: 20, total: 60 },
        location: { score: 40, pos: 22, neg: 32, total: 58 }
      },
      platforms: {
        booking_com: { rating: 8.4, price: 13500, review_count: 115 },
        makemytrip: { rating: 4.3, price: 12200, review_count: 108 },
        goibibo: { rating: 4.2, price: 12800, review_count: 87 }
      },
      top_reviews: [
        { text: "Heritage charm at its best. The colonial architecture and mountain views are stunning.", platform: "TripAdvisor", rating: 4.5, date: "2025-11-05" }
      ]
    },
    {
      id: "sterling_mussoorie", city: "mussoorie", name: "Sterling Mussoorie",
      category: "Leisure Resort (4-Star)", address: "Radha Bhawan Estate, Circular Road, Mussoorie",
      price_range: { min: 6500, max: 14000 }, rating: 3.8, total_reviews: 445,
      hero_image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 58, pos: 42, neg: 30, total: 92 },
        room: { score: 55, pos: 40, neg: 32, total: 88 },
        view: { score: 72, pos: 55, neg: 18, total: 85 },
        staff: { score: 62, pos: 45, neg: 26, total: 82 },
        cleanliness: { score: 50, pos: 35, neg: 35, total: 80 },
        value: { score: 65, pos: 48, neg: 24, total: 78 },
        location: { score: 55, pos: 38, neg: 30, total: 75 }
      },
      platforms: {
        booking_com: { rating: 7.2, price: 7800, review_count: 168 },
        makemytrip: { rating: 3.7, price: 7200, review_count: 155 },
        goibibo: { rating: 3.6, price: 7500, review_count: 122 }
      },
      top_reviews: [
        { text: "Good value for money but maintenance could be better. View from balcony is nice.", platform: "Google", rating: 3.5, date: "2025-07-22" }
      ]
    },
    {
      id: "hotel_sungrace", city: "mussoorie", name: "Hotel SunGrace",
      category: "Midscale Boutique (3-Star)", address: "Hill Crest, Charleville, Mussoorie",
      price_range: { min: 3800, max: 7500 }, rating: 4.1, total_reviews: 280,
      hero_image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 72, pos: 35, neg: 12, total: 58 },
        room: { score: 68, pos: 32, neg: 14, total: 55 },
        view: { score: 75, pos: 38, neg: 10, total: 52 },
        staff: { score: 80, pos: 42, neg: 8, total: 55 },
        cleanliness: { score: 70, pos: 34, neg: 12, total: 52 },
        value: { score: 82, pos: 45, neg: 8, total: 58 },
        location: { score: 55, pos: 25, neg: 20, total: 48 }
      },
      platforms: {
        booking_com: { rating: 7.8, price: 4500, review_count: 105 },
        makemytrip: { rating: 4.0, price: 4200, review_count: 98 },
        goibibo: { rating: 3.9, price: 4350, review_count: 77 }
      },
      top_reviews: [
        { text: "Great value for money! Staff is very friendly and helpful. Clean rooms with decent mountain view.", platform: "Google", rating: 4.5, date: "2025-09-08" }
      ]
    },
    {
      id: "hotel_vishnu_palace", city: "mussoorie", name: "Hotel Vishnu Palace",
      category: "Midscale Family (3-Star)", address: "Near Library Bus Stand, The Mall, Mussoorie",
      price_range: { min: 3200, max: 6500 }, rating: 3.6, total_reviews: 310,
      hero_image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 55, pos: 28, neg: 22, total: 62 },
        room: { score: 50, pos: 25, neg: 25, total: 60 },
        view: { score: 60, pos: 30, neg: 18, total: 55 },
        staff: { score: 58, pos: 28, neg: 20, total: 58 },
        cleanliness: { score: 48, pos: 22, neg: 24, total: 55 },
        value: { score: 72, pos: 38, neg: 12, total: 55 },
        location: { score: 92, pos: 52, neg: 3, total: 58 }
      },
      platforms: {
        booking_com: { rating: 7.0, price: 3800, review_count: 118 },
        makemytrip: { rating: 3.5, price: 3500, review_count: 110 },
        goibibo: { rating: 3.4, price: 3600, review_count: 82 }
      },
      top_reviews: [
        { text: "Location is unbeatable - right on Mall Road. Rooms are basic but clean enough. Value for money.", platform: "MakeMyTrip", rating: 3.5, date: "2025-06-10" }
      ]
    },
    {
      id: "tulip_inn", city: "mussoorie", name: "Tulip Inn Green Castle",
      category: "Midscale Mall Road (3-Star)", address: "The Mall Road, Near SDM Court, Mussoorie",
      price_range: { min: 3500, max: 7000 }, rating: 2.8, total_reviews: 265,
      hero_image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 40, pos: 18, neg: 26, total: 55 },
        room: { score: 35, pos: 15, neg: 28, total: 52 },
        view: { score: 55, pos: 25, neg: 18, total: 48 },
        staff: { score: 42, pos: 18, neg: 24, total: 50 },
        cleanliness: { score: 30, pos: 12, neg: 28, total: 48 },
        value: { score: 45, pos: 20, neg: 22, total: 45 },
        location: { score: 90, pos: 48, neg: 4, total: 55 }
      },
      platforms: {
        booking_com: { rating: 6.2, price: 4200, review_count: 98 },
        makemytrip: { rating: 2.8, price: 3800, review_count: 95 },
        goibibo: { rating: 2.7, price: 3900, review_count: 72 }
      },
      top_reviews: [
        { text: "Prime Mall Road location but rooms need serious renovation. Bathroom was musty.", platform: "Google", rating: 2.0, date: "2025-08-15" }
      ]
    },
    {
      id: "hotel_mall_palace", city: "mussoorie", name: "Hotel Mall Palace",
      category: "Budget Economy (2-Star)", address: "Main Mall Road, Mussoorie",
      price_range: { min: 2200, max: 4500 }, rating: 2.8, total_reviews: 195,
      hero_image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 35, pos: 12, neg: 22, total: 42 },
        room: { score: 30, pos: 10, neg: 24, total: 40 },
        view: { score: 45, pos: 18, neg: 20, total: 42 },
        staff: { score: 50, pos: 20, neg: 18, total: 40 },
        cleanliness: { score: 28, pos: 8, neg: 22, total: 35 },
        value: { score: 60, pos: 25, neg: 15, total: 42 },
        location: { score: 88, pos: 38, neg: 4, total: 45 }
      },
      platforms: {
        booking_com: { rating: 5.8, price: 2800, review_count: 72 },
        makemytrip: { rating: 2.7, price: 2500, review_count: 68 },
        goibibo: { rating: 2.6, price: 2600, review_count: 55 }
      },
      top_reviews: [
        { text: "Very basic accommodation. Good only if you need a bed near Mall Road at budget price.", platform: "Google", rating: 2.5, date: "2025-07-05" }
      ]
    },
    {
      id: "mosaic_mussoorie", city: "mussoorie", name: "Mosaic Hotels Mussoorie",
      category: "Premium Boutique (4-Star)", address: "Mall Road, Near Skating Rink, Mussoorie",
      price_range: { min: 7500, max: 15000 }, rating: 4.2, total_reviews: 380,
      hero_image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 78, pos: 58, neg: 14, total: 82 },
        room: { score: 80, pos: 62, neg: 12, total: 85 },
        view: { score: 76, pos: 55, neg: 15, total: 80 },
        staff: { score: 82, pos: 65, neg: 10, total: 85 },
        cleanliness: { score: 78, pos: 58, neg: 14, total: 80 },
        value: { score: 70, pos: 52, neg: 20, total: 78 },
        location: { score: 88, pos: 68, neg: 6, total: 80 }
      },
      platforms: {
        booking_com: { rating: 8.0, price: 8800, review_count: 142 },
        makemytrip: { rating: 4.1, price: 8200, review_count: 135 },
        goibibo: { rating: 4.0, price: 8500, review_count: 103 }
      },
      top_reviews: [
        { text: "Modern boutique feel with great Mall Road access. Rooftop dining has spectacular valley views.", platform: "TripAdvisor", rating: 4.5, date: "2025-10-12" }
      ]
    },
    {
      id: "hotel_padmini_nivas", city: "mussoorie", name: "Hotel Padmini Nivas",
      category: "Heritage Budget (3-Star)", address: "The Mall, Library End, Mussoorie",
      price_range: { min: 4000, max: 8500 }, rating: 3.5, total_reviews: 220,
      hero_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 62, pos: 25, neg: 14, total: 48 },
        room: { score: 58, pos: 22, neg: 16, total: 45 },
        view: { score: 68, pos: 28, neg: 12, total: 44 },
        staff: { score: 65, pos: 26, neg: 14, total: 42 },
        cleanliness: { score: 55, pos: 20, neg: 16, total: 40 },
        value: { score: 70, pos: 30, neg: 10, total: 42 },
        location: { score: 80, pos: 35, neg: 6, total: 45 }
      },
      platforms: {
        booking_com: { rating: 7.0, price: 5200, review_count: 82 },
        makemytrip: { rating: 3.4, price: 4500, review_count: 78 },
        goibibo: { rating: 3.3, price: 4800, review_count: 60 }
      },
      top_reviews: [
        { text: "Old-world charm with heritage architecture. Rooms could use updating but location is perfect.", platform: "Google", rating: 3.5, date: "2025-09-18" }
      ]
    },

    // ===== NAINITAL (12 Hotels) =====
    {
      id: "manu_maharani_nainital", city: "nainital", name: "The Manu Maharani",
      category: "Luxury Resort (5-Star)", address: "Mallital, Nainital",
      price_range: { min: 12000, max: 25000 }, rating: 4.5, total_reviews: 680,
      hero_image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 82, pos: 105, neg: 20, total: 150 },
        room: { score: 78, pos: 98, neg: 25, total: 145 },
        view: { score: 92, pos: 140, neg: 8, total: 155 },
        staff: { score: 80, pos: 102, neg: 22, total: 148 },
        cleanliness: { score: 76, pos: 92, neg: 28, total: 142 },
        value: { score: 58, pos: 62, neg: 42, total: 125 },
        location: { score: 88, pos: 120, neg: 12, total: 145 }
      },
      platforms: {
        booking_com: { rating: 8.5, price: 14500, review_count: 255 },
        makemytrip: { rating: 4.4, price: 13200, review_count: 240 },
        goibibo: { rating: 4.3, price: 13800, review_count: 185 }
      },
      top_reviews: [
        { text: "Lake view from the room is absolutely stunning at sunrise. Best hotel in Nainital for families.", platform: "TripAdvisor", rating: 5.0, date: "2025-11-22" },
        { text: "Overpriced for what you get. Food is average hotel fare. But the view makes up for it.", platform: "MakeMyTrip", rating: 3.5, date: "2025-08-10" }
      ]
    },
    {
      id: "shervani_hilltop", city: "nainital", name: "Shervani Hilltop",
      category: "Premium Resort (4-Star)", address: "Mallital, Nainital",
      price_range: { min: 8000, max: 18000 }, rating: 4.2, total_reviews: 520,
      hero_image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 75, pos: 72, neg: 22, total: 110 },
        room: { score: 72, pos: 68, neg: 24, total: 108 },
        view: { score: 85, pos: 95, neg: 12, total: 115 },
        staff: { score: 70, pos: 65, neg: 26, total: 105 },
        cleanliness: { score: 68, pos: 62, neg: 28, total: 102 },
        value: { score: 62, pos: 55, neg: 32, total: 98 },
        location: { score: 82, pos: 85, neg: 14, total: 108 }
      },
      platforms: {
        booking_com: { rating: 8.0, price: 10500, review_count: 195 },
        makemytrip: { rating: 4.1, price: 9200, review_count: 185 },
        goibibo: { rating: 4.0, price: 9800, review_count: 140 }
      },
      top_reviews: [
        { text: "Hilltop location offers panoramic Naini Lake views. Rooms are well-maintained and spacious.", platform: "Booking.com", rating: 4.5, date: "2025-10-05" }
      ]
    },
    {
      id: "naini_retreat", city: "nainital", name: "Naini Retreat - A Leisure Hotel",
      category: "Heritage Boutique (4-Star)", address: "Ayarpatta Slopes, Nainital",
      price_range: { min: 7500, max: 15000 }, rating: 4.3, total_reviews: 445,
      hero_image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 80, pos: 68, neg: 14, total: 95 },
        room: { score: 82, pos: 72, neg: 12, total: 92 },
        view: { score: 90, pos: 85, neg: 6, total: 95 },
        staff: { score: 78, pos: 65, neg: 16, total: 90 },
        cleanliness: { score: 80, pos: 68, neg: 14, total: 88 },
        value: { score: 72, pos: 60, neg: 20, total: 85 },
        location: { score: 65, pos: 48, neg: 25, total: 82 }
      },
      platforms: {
        booking_com: { rating: 8.3, price: 9200, review_count: 168 },
        makemytrip: { rating: 4.2, price: 8500, review_count: 158 },
        goibibo: { rating: 4.1, price: 8800, review_count: 119 }
      },
      top_reviews: [
        { text: "Colonial-era charm with modern amenities. The garden facing the lake is peaceful and beautiful.", platform: "TripAdvisor", rating: 4.5, date: "2025-12-08" }
      ]
    },
    {
      id: "vikram_vintage_inn", city: "nainital", name: "Vikram Vintage Inn",
      category: "Heritage Boutique (3-Star)", address: "Mallital, Nainital",
      price_range: { min: 5000, max: 12000 }, rating: 4.0, total_reviews: 380,
      hero_image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 70, pos: 52, neg: 20, total: 82 },
        room: { score: 68, pos: 48, neg: 22, total: 78 },
        view: { score: 78, pos: 62, neg: 14, total: 82 },
        staff: { score: 72, pos: 55, neg: 18, total: 80 },
        cleanliness: { score: 65, pos: 45, neg: 24, total: 75 },
        value: { score: 75, pos: 58, neg: 16, total: 78 },
        location: { score: 85, pos: 68, neg: 8, total: 80 }
      },
      platforms: {
        booking_com: { rating: 7.8, price: 6500, review_count: 142 },
        makemytrip: { rating: 3.9, price: 5800, review_count: 135 },
        goibibo: { rating: 3.8, price: 6200, review_count: 103 }
      },
      top_reviews: [
        { text: "Charming vintage property near the lake. Good value and the restaurant serves excellent local cuisine.", platform: "Google", rating: 4.0, date: "2025-09-25" }
      ]
    },
    {
      id: "hotel_arif_castles", city: "nainital", name: "Hotel Arif Castles",
      category: "Premium Midscale (3-Star)", address: "Tallital, Nainital",
      price_range: { min: 4500, max: 10000 }, rating: 4.1, total_reviews: 340,
      hero_image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 72, pos: 45, neg: 15, total: 72 },
        room: { score: 70, pos: 42, neg: 17, total: 70 },
        view: { score: 82, pos: 55, neg: 10, total: 72 },
        staff: { score: 75, pos: 48, neg: 14, total: 68 },
        cleanliness: { score: 68, pos: 40, neg: 18, total: 65 },
        value: { score: 78, pos: 52, neg: 12, total: 68 },
        location: { score: 80, pos: 52, neg: 10, total: 68 }
      },
      platforms: {
        booking_com: { rating: 7.9, price: 5800, review_count: 128 },
        makemytrip: { rating: 4.0, price: 5200, review_count: 118 },
        goibibo: { rating: 3.9, price: 5500, review_count: 94 }
      },
      top_reviews: [
        { text: "Clean rooms with lake view. Staff was very accommodating. Good breakfast spread.", platform: "MakeMyTrip", rating: 4.0, date: "2025-10-15" }
      ]
    },
    {
      id: "palace_belvedere", city: "nainital", name: "The Palace Belvedere",
      category: "Heritage Palace (4-Star)", address: "Ayarpatta, Nainital",
      price_range: { min: 9000, max: 20000 }, rating: 4.4, total_reviews: 290,
      hero_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 82, pos: 42, neg: 8, total: 62 },
        room: { score: 85, pos: 45, neg: 6, total: 60 },
        view: { score: 88, pos: 48, neg: 4, total: 58 },
        staff: { score: 80, pos: 42, neg: 8, total: 55 },
        cleanliness: { score: 82, pos: 44, neg: 6, total: 58 },
        value: { score: 55, pos: 28, neg: 22, total: 52 },
        location: { score: 60, pos: 30, neg: 18, total: 52 }
      },
      platforms: {
        booking_com: { rating: 8.4, price: 12500, review_count: 108 },
        makemytrip: { rating: 4.3, price: 10800, review_count: 102 },
        goibibo: { rating: 4.2, price: 11500, review_count: 80 }
      },
      top_reviews: [
        { text: "A genuine heritage palace with stunning period furniture. Worth the premium for history lovers.", platform: "TripAdvisor", rating: 5.0, date: "2025-11-18" }
      ]
    },
    {
      id: "hotel_himalaya", city: "nainital", name: "Hotel Himalaya",
      category: "Midscale Family (3-Star)", address: "Tallital, Nainital",
      price_range: { min: 3000, max: 6500 }, rating: 3.5, total_reviews: 420,
      hero_image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 55, pos: 35, neg: 28, total: 82 },
        room: { score: 50, pos: 30, neg: 30, total: 78 },
        view: { score: 62, pos: 40, neg: 22, total: 75 },
        staff: { score: 58, pos: 35, neg: 24, total: 72 },
        cleanliness: { score: 48, pos: 28, neg: 30, total: 70 },
        value: { score: 72, pos: 48, neg: 15, total: 72 },
        location: { score: 78, pos: 50, neg: 10, total: 68 }
      },
      platforms: {
        booking_com: { rating: 6.8, price: 3800, review_count: 158 },
        makemytrip: { rating: 3.4, price: 3200, review_count: 148 },
        goibibo: { rating: 3.3, price: 3500, review_count: 114 }
      },
      top_reviews: [
        { text: "Budget-friendly option near the lake. Don't expect luxury but it's clean enough for a short stay.", platform: "Google", rating: 3.5, date: "2025-07-20" }
      ]
    },
    {
      id: "moonlight_resort_nainital", city: "nainital", name: "Moonlight Resort",
      category: "Budget Resort (2-Star)", address: "Bhowali Road, Nainital",
      price_range: { min: 1800, max: 4000 }, rating: 3.2, total_reviews: 250,
      hero_image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 42, pos: 18, neg: 24, total: 52 },
        room: { score: 38, pos: 15, neg: 24, total: 48 },
        view: { score: 55, pos: 22, neg: 18, total: 45 },
        staff: { score: 52, pos: 22, neg: 20, total: 48 },
        cleanliness: { score: 35, pos: 12, neg: 22, total: 42 },
        value: { score: 68, pos: 32, neg: 12, total: 48 },
        location: { score: 40, pos: 15, neg: 22, total: 42 }
      },
      platforms: {
        booking_com: { rating: 6.0, price: 2200, review_count: 92 },
        makemytrip: { rating: 3.1, price: 1900, review_count: 88 },
        goibibo: { rating: 3.0, price: 2050, review_count: 70 }
      },
      top_reviews: [
        { text: "Very basic but cheap. Good for backpackers who just need a bed. Far from lake though.", platform: "Google", rating: 3.0, date: "2025-06-18" }
      ]
    },
    {
      id: "nainital_marriott", city: "nainital", name: "Grand Mercure Nainital",
      category: "Premium Business (4-Star)", address: "Mallital, Near Flats, Nainital",
      price_range: { min: 8500, max: 16000 }, rating: 4.3, total_reviews: 395,
      hero_image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 78, pos: 62, neg: 15, total: 88 },
        room: { score: 80, pos: 65, neg: 12, total: 85 },
        view: { score: 75, pos: 55, neg: 16, total: 82 },
        staff: { score: 82, pos: 68, neg: 10, total: 85 },
        cleanliness: { score: 85, pos: 70, neg: 8, total: 82 },
        value: { score: 55, pos: 38, neg: 30, total: 78 },
        location: { score: 72, pos: 52, neg: 18, total: 78 }
      },
      platforms: {
        booking_com: { rating: 8.2, price: 10200, review_count: 148 },
        makemytrip: { rating: 4.2, price: 9500, review_count: 140 },
        goibibo: { rating: 4.1, price: 9800, review_count: 107 }
      },
      top_reviews: [
        { text: "Professional service and clean rooms. Good chain hotel standards. Lake not directly visible from all rooms.", platform: "Booking.com", rating: 4.0, date: "2025-11-02" }
      ]
    },
    {
      id: "chevron_rosemount", city: "nainital", name: "Chevron Rosemount",
      category: "Heritage Retreat (4-Star)", address: "Balia Ravine, Mallital, Nainital",
      price_range: { min: 6500, max: 14000 }, rating: 4.1, total_reviews: 360,
      hero_image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 72, pos: 52, neg: 18, total: 78 },
        room: { score: 75, pos: 55, neg: 15, total: 78 },
        view: { score: 80, pos: 60, neg: 10, total: 75 },
        staff: { score: 70, pos: 50, neg: 20, total: 75 },
        cleanliness: { score: 72, pos: 52, neg: 18, total: 72 },
        value: { score: 68, pos: 48, neg: 20, total: 72 },
        location: { score: 75, pos: 52, neg: 15, total: 72 }
      },
      platforms: {
        booking_com: { rating: 7.9, price: 8200, review_count: 135 },
        makemytrip: { rating: 4.0, price: 7500, review_count: 128 },
        goibibo: { rating: 3.9, price: 7800, review_count: 97 }
      },
      top_reviews: [
        { text: "Heritage property with character. The old-world decor and gardens are charming. Good breakfast.", platform: "TripAdvisor", rating: 4.0, date: "2025-10-25" }
      ]
    },
    {
      id: "alps_resort_nainital", city: "nainital", name: "Alps Resort",
      category: "Budget Family (2-Star)", address: "Tallital Road, Nainital",
      price_range: { min: 2200, max: 5000 }, rating: 3.4, total_reviews: 280,
      hero_image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 52, pos: 22, neg: 20, total: 55 },
        room: { score: 48, pos: 20, neg: 22, total: 52 },
        view: { score: 58, pos: 25, neg: 18, total: 48 },
        staff: { score: 55, pos: 24, neg: 18, total: 48 },
        cleanliness: { score: 42, pos: 15, neg: 20, total: 42 },
        value: { score: 70, pos: 32, neg: 12, total: 48 },
        location: { score: 72, pos: 32, neg: 10, total: 45 }
      },
      platforms: {
        booking_com: { rating: 6.5, price: 2800, review_count: 105 },
        makemytrip: { rating: 3.3, price: 2500, review_count: 98 },
        goibibo: { rating: 3.2, price: 2600, review_count: 77 }
      },
      top_reviews: [
        { text: "Simple and affordable. Close to Tallital bus stand. Basic rooms but good for budget travelers.", platform: "MakeMyTrip", rating: 3.5, date: "2025-08-28" }
      ]
    },
    {
      id: "le_meridien_nainital", city: "nainital", name: "The Earl's Court",
      category: "Luxury Heritage (5-Star)", address: "Sher Ka Danda, Nainital",
      price_range: { min: 10000, max: 22000 }, rating: 4.5, total_reviews: 310,
      hero_image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 85, pos: 52, neg: 6, total: 65 },
        room: { score: 88, pos: 55, neg: 5, total: 65 },
        view: { score: 90, pos: 58, neg: 4, total: 65 },
        staff: { score: 82, pos: 50, neg: 8, total: 62 },
        cleanliness: { score: 88, pos: 55, neg: 5, total: 62 },
        value: { score: 60, pos: 32, neg: 20, total: 55 },
        location: { score: 55, pos: 28, neg: 22, total: 52 }
      },
      platforms: {
        booking_com: { rating: 8.6, price: 12800, review_count: 115 },
        makemytrip: { rating: 4.4, price: 11200, review_count: 110 },
        goibibo: { rating: 4.3, price: 11800, review_count: 85 }
      },
      top_reviews: [
        { text: "A hidden gem on the hilltop. The rooms are exquisite with antique furniture. Panoramic lake view.", platform: "TripAdvisor", rating: 5.0, date: "2025-12-15" }
      ]
    },

    // ===== BHIMTAL (12 Hotels) =====
    {
      id: "fishermans_lodge_bhimtal", city: "bhimtal", name: "Fishermen's Lodge",
      category: "Boutique Resort (4-Star)", address: "Mandir Marg, Bhimtal",
      price_range: { min: 8000, max: 15000 }, rating: 4.4, total_reviews: 280,
      hero_image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 85, pos: 48, neg: 6, total: 60 },
        room: { score: 80, pos: 42, neg: 8, total: 55 },
        view: { score: 92, pos: 52, neg: 3, total: 58 },
        staff: { score: 82, pos: 45, neg: 8, total: 55 },
        cleanliness: { score: 85, pos: 48, neg: 5, total: 58 },
        value: { score: 68, pos: 35, neg: 15, total: 52 },
        location: { score: 90, pos: 50, neg: 4, total: 55 }
      },
      platforms: {
        booking_com: { rating: 8.5, price: 9800, review_count: 105 },
        makemytrip: { rating: 4.3, price: 8800, review_count: 98 },
        goibibo: { rating: 4.2, price: 9200, review_count: 77 }
      },
      top_reviews: [
        { text: "Lakeside paradise. Fresh fish from Bhimtal lake cooked to perfection. Tranquil and beautiful.", platform: "TripAdvisor", rating: 5.0, date: "2025-10-28" }
      ]
    },
    {
      id: "the_birdcage_bhimtal", city: "bhimtal", name: "The Birdcage Resort",
      category: "Luxury Boutique (4-Star)", address: "Bhimtal Lake Road, Bhimtal",
      price_range: { min: 7000, max: 14000 }, rating: 4.3, total_reviews: 220,
      hero_image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 82, pos: 38, neg: 6, total: 48 },
        room: { score: 78, pos: 35, neg: 8, total: 45 },
        view: { score: 88, pos: 42, neg: 4, total: 48 },
        staff: { score: 80, pos: 38, neg: 6, total: 45 },
        cleanliness: { score: 82, pos: 38, neg: 6, total: 45 },
        value: { score: 65, pos: 28, neg: 14, total: 42 },
        location: { score: 85, pos: 40, neg: 5, total: 45 }
      },
      platforms: {
        booking_com: { rating: 8.3, price: 8500, review_count: 82 },
        makemytrip: { rating: 4.2, price: 7800, review_count: 78 },
        goibibo: { rating: 4.1, price: 8200, review_count: 60 }
      },
      top_reviews: [
        { text: "Eco-friendly resort with stunning lake views. Perfect for a quiet getaway from city noise.", platform: "Booking.com", rating: 4.5, date: "2025-09-15" }
      ]
    },
    {
      id: "imperial_bhimtal", city: "bhimtal", name: "Imperial Retreat",
      category: "Premium Resort (4-Star)", address: "Sattal Road, Bhimtal",
      price_range: { min: 6000, max: 12000 }, rating: 4.1, total_reviews: 310,
      hero_image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 75, pos: 48, neg: 14, total: 68 },
        room: { score: 72, pos: 45, neg: 16, total: 65 },
        view: { score: 80, pos: 52, neg: 10, total: 65 },
        staff: { score: 70, pos: 42, neg: 18, total: 62 },
        cleanliness: { score: 72, pos: 44, neg: 16, total: 62 },
        value: { score: 68, pos: 40, neg: 18, total: 60 },
        location: { score: 72, pos: 42, neg: 16, total: 60 }
      },
      platforms: {
        booking_com: { rating: 7.8, price: 7200, review_count: 118 },
        makemytrip: { rating: 4.0, price: 6500, review_count: 108 },
        goibibo: { rating: 3.9, price: 6800, review_count: 84 }
      },
      top_reviews: [
        { text: "Good resort with nice garden area. Food could be better but rooms are comfortable. Sattal nearby is a bonus.", platform: "MakeMyTrip", rating: 4.0, date: "2025-08-22" }
      ]
    },
    {
      id: "bhimtal_heights", city: "bhimtal", name: "Bhimtal Heights Resort",
      category: "Midscale Resort (3-Star)", address: "Tallital, Bhimtal",
      price_range: { min: 3500, max: 7500 }, rating: 3.8, total_reviews: 245,
      hero_image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 62, pos: 28, neg: 16, total: 52 },
        room: { score: 58, pos: 25, neg: 18, total: 48 },
        view: { score: 75, pos: 35, neg: 10, total: 48 },
        staff: { score: 65, pos: 30, neg: 14, total: 48 },
        cleanliness: { score: 60, pos: 26, neg: 16, total: 45 },
        value: { score: 72, pos: 34, neg: 10, total: 48 },
        location: { score: 68, pos: 30, neg: 14, total: 45 }
      },
      platforms: {
        booking_com: { rating: 7.2, price: 4500, review_count: 92 },
        makemytrip: { rating: 3.7, price: 3800, review_count: 85 },
        goibibo: { rating: 3.6, price: 4200, review_count: 68 }
      },
      top_reviews: [
        { text: "Decent mid-range option in Bhimtal. Lake view from terrace is good. Basic but clean rooms.", platform: "Google", rating: 3.5, date: "2025-07-14" }
      ]
    },
    {
      id: "lake_paradise_bhimtal", city: "bhimtal", name: "Lake Paradise Resort",
      category: "Family Resort (3-Star)", address: "Lake Side Road, Bhimtal",
      price_range: { min: 3000, max: 6500 }, rating: 3.6, total_reviews: 200,
      hero_image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 58, pos: 22, neg: 16, total: 42 },
        room: { score: 55, pos: 20, neg: 16, total: 40 },
        view: { score: 80, pos: 35, neg: 5, total: 42 },
        staff: { score: 62, pos: 24, neg: 14, total: 40 },
        cleanliness: { score: 55, pos: 20, neg: 16, total: 38 },
        value: { score: 75, pos: 32, neg: 8, total: 42 },
        location: { score: 82, pos: 35, neg: 5, total: 42 }
      },
      platforms: {
        booking_com: { rating: 7.0, price: 3800, review_count: 75 },
        makemytrip: { rating: 3.5, price: 3200, review_count: 70 },
        goibibo: { rating: 3.4, price: 3500, review_count: 55 }
      },
      top_reviews: [
        { text: "Right on the lake! Great location for boating. Rooms are simple but the view is unbeatable at this price.", platform: "MakeMyTrip", rating: 4.0, date: "2025-09-05" }
      ]
    },
    {
      id: "camp_mehi_bhimtal", city: "bhimtal", name: "Camp Mehi - Wilderness Stay",
      category: "Eco Camp (3-Star)", address: "Sattal Road, Near Bhimtal",
      price_range: { min: 2500, max: 5500 }, rating: 4.0, total_reviews: 180,
      hero_image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 78, pos: 32, neg: 6, total: 40 },
        room: { score: 62, pos: 22, neg: 12, total: 35 },
        view: { score: 85, pos: 38, neg: 4, total: 42 },
        staff: { score: 82, pos: 35, neg: 5, total: 40 },
        cleanliness: { score: 65, pos: 25, neg: 12, total: 38 },
        value: { score: 80, pos: 35, neg: 5, total: 42 },
        location: { score: 78, pos: 32, neg: 8, total: 40 }
      },
      platforms: {
        booking_com: { rating: 7.8, price: 3200, review_count: 68 },
        makemytrip: { rating: 3.9, price: 2800, review_count: 62 },
        goibibo: { rating: 3.8, price: 3000, review_count: 50 }
      },
      top_reviews: [
        { text: "Unique wilderness experience! Bonfire nights and nature walks are memorable. Food is home-cooked style.", platform: "TripAdvisor", rating: 4.5, date: "2025-10-18" }
      ]
    },
    {
      id: "green_oak_bhimtal", city: "bhimtal", name: "Green Oak Resort",
      category: "Nature Resort (3-Star)", address: "Mehragaon, Bhimtal",
      price_range: { min: 2800, max: 5800 }, rating: 3.7, total_reviews: 190,
      hero_image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 65, pos: 25, neg: 12, total: 42 },
        room: { score: 60, pos: 22, neg: 14, total: 40 },
        view: { score: 78, pos: 32, neg: 6, total: 40 },
        staff: { score: 68, pos: 28, neg: 10, total: 40 },
        cleanliness: { score: 62, pos: 24, neg: 14, total: 38 },
        value: { score: 72, pos: 30, neg: 10, total: 42 },
        location: { score: 58, pos: 22, neg: 16, total: 38 }
      },
      platforms: {
        booking_com: { rating: 7.2, price: 3500, review_count: 72 },
        makemytrip: { rating: 3.6, price: 3000, review_count: 65 },
        goibibo: { rating: 3.5, price: 3200, review_count: 53 }
      },
      top_reviews: [
        { text: "Peaceful and green surroundings. Good for nature lovers. A bit far from the main lake.", platform: "Google", rating: 3.5, date: "2025-08-12" }
      ]
    },
    {
      id: "pine_retreat_bhimtal", city: "bhimtal", name: "Pine Retreat Resort",
      category: "Budget Resort (2-Star)", address: "Naukuchiatal Road, Bhimtal",
      price_range: { min: 1500, max: 3500 }, rating: 3.3, total_reviews: 165,
      hero_image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 45, pos: 15, neg: 18, total: 38 },
        room: { score: 40, pos: 12, neg: 18, total: 35 },
        view: { score: 60, pos: 22, neg: 12, total: 35 },
        staff: { score: 55, pos: 20, neg: 14, total: 35 },
        cleanliness: { score: 38, pos: 10, neg: 16, total: 30 },
        value: { score: 72, pos: 28, neg: 8, total: 38 },
        location: { score: 42, pos: 14, neg: 18, total: 32 }
      },
      platforms: {
        booking_com: { rating: 6.0, price: 1800, review_count: 62 },
        makemytrip: { rating: 3.2, price: 1600, review_count: 58 },
        goibibo: { rating: 3.1, price: 1700, review_count: 45 }
      },
      top_reviews: [
        { text: "Budget stay near Naukuchiatal. Very basic rooms. Good only if you're on a tight budget.", platform: "Google", rating: 3.0, date: "2025-07-08" }
      ]
    },
    {
      id: "villa_retreat_bhimtal", city: "bhimtal", name: "Villa Retreat",
      category: "Boutique Villa (3-Star)", address: "Pangot Road, Bhimtal",
      price_range: { min: 4500, max: 9000 }, rating: 4.2, total_reviews: 175,
      hero_image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 78, pos: 30, neg: 5, total: 38 },
        room: { score: 82, pos: 32, neg: 4, total: 38 },
        view: { score: 85, pos: 35, neg: 3, total: 38 },
        staff: { score: 80, pos: 32, neg: 5, total: 38 },
        cleanliness: { score: 82, pos: 32, neg: 4, total: 35 },
        value: { score: 70, pos: 28, neg: 10, total: 38 },
        location: { score: 55, pos: 18, neg: 15, total: 35 }
      },
      platforms: {
        booking_com: { rating: 8.0, price: 5500, review_count: 65 },
        makemytrip: { rating: 4.1, price: 5000, review_count: 62 },
        goibibo: { rating: 4.0, price: 5200, review_count: 48 }
      },
      top_reviews: [
        { text: "Private villa feel with mountain views. Very clean and well-maintained. Perfect romantic getaway.", platform: "Booking.com", rating: 4.5, date: "2025-11-08" }
      ]
    },
    {
      id: "country_inn_bhimtal", city: "bhimtal", name: "Country Inn & Suites by Radisson",
      category: "Business Resort (4-Star)", address: "Kainchi Road, Bhimtal",
      price_range: { min: 6500, max: 12000 }, rating: 4.0, total_reviews: 350,
      hero_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 72, pos: 48, neg: 16, total: 72 },
        room: { score: 78, pos: 55, neg: 10, total: 70 },
        view: { score: 68, pos: 42, neg: 18, total: 65 },
        staff: { score: 75, pos: 50, neg: 14, total: 68 },
        cleanliness: { score: 80, pos: 55, neg: 8, total: 68 },
        value: { score: 58, pos: 35, neg: 25, total: 65 },
        location: { score: 55, pos: 30, neg: 24, total: 58 }
      },
      platforms: {
        booking_com: { rating: 7.8, price: 7500, review_count: 132 },
        makemytrip: { rating: 3.9, price: 6800, review_count: 125 },
        goibibo: { rating: 3.8, price: 7200, review_count: 93 }
      },
      top_reviews: [
        { text: "Standard Radisson quality. Clean rooms and professional staff. But the lake is not visible from property.", platform: "MakeMyTrip", rating: 4.0, date: "2025-09-20" }
      ]
    },
    {
      id: "zostel_bhimtal", city: "bhimtal", name: "Zostel Bhimtal",
      category: "Backpacker Hostel (Budget)", address: "Bhimtal Lake Road, Bhimtal",
      price_range: { min: 800, max: 2500 }, rating: 4.1, total_reviews: 420,
      hero_image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 65, pos: 42, neg: 20, total: 75 },
        room: { score: 52, pos: 30, neg: 28, total: 72 },
        view: { score: 82, pos: 58, neg: 8, total: 70 },
        staff: { score: 78, pos: 55, neg: 10, total: 72 },
        cleanliness: { score: 58, pos: 35, neg: 24, total: 68 },
        value: { score: 88, pos: 65, neg: 5, total: 72 },
        location: { score: 85, pos: 60, neg: 6, total: 70 }
      },
      platforms: {
        booking_com: { rating: 7.5, price: 1200, review_count: 158 },
        makemytrip: { rating: 4.0, price: 1000, review_count: 148 },
        goibibo: { rating: 3.9, price: 1100, review_count: 114 }
      },
      top_reviews: [
        { text: "Best hostel in Bhimtal! Lake views, great vibe, and amazing community kitchen. Perfect for solo travelers.", platform: "Google", rating: 4.5, date: "2025-10-02" }
      ]
    },
    {
      id: "riviera_bhimtal", city: "bhimtal", name: "Riviera Swiss Resort",
      category: "Family Resort (3-Star)", address: "Sat Tal Road, Bhimtal",
      price_range: { min: 3800, max: 7500 }, rating: 3.9, total_reviews: 210,
      hero_image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 68, pos: 28, neg: 12, total: 45 },
        room: { score: 65, pos: 26, neg: 14, total: 42 },
        view: { score: 72, pos: 30, neg: 10, total: 42 },
        staff: { score: 70, pos: 28, neg: 12, total: 42 },
        cleanliness: { score: 65, pos: 25, neg: 14, total: 40 },
        value: { score: 72, pos: 30, neg: 10, total: 42 },
        location: { score: 60, pos: 22, neg: 16, total: 38 }
      },
      platforms: {
        booking_com: { rating: 7.4, price: 4500, review_count: 78 },
        makemytrip: { rating: 3.8, price: 4000, review_count: 72 },
        goibibo: { rating: 3.7, price: 4200, review_count: 60 }
      },
      top_reviews: [
        { text: "Swiss-style cottages with good views. Kids enjoyed the play area. Food is average but portion size is generous.", platform: "MakeMyTrip", rating: 4.0, date: "2025-08-18" }
      ]
    },

    // ===== DEHRADUN (12 Hotels) =====
    {
      id: "taj_dehradun", city: "dehradun", name: "Taj City Centre Dehradun",
      category: "Luxury Business (5-Star)", address: "IT Park, Sahastradhara Road, Dehradun",
      price_range: { min: 12000, max: 28000 }, rating: 4.6, total_reviews: 520,
      hero_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 90, pos: 85, neg: 8, total: 105 },
        room: { score: 88, pos: 82, neg: 10, total: 102 },
        view: { score: 65, pos: 45, neg: 22, total: 82 },
        staff: { score: 92, pos: 88, neg: 5, total: 105 },
        cleanliness: { score: 92, pos: 90, neg: 5, total: 102 },
        value: { score: 55, pos: 42, neg: 35, total: 88 },
        location: { score: 58, pos: 40, neg: 28, total: 82 }
      },
      platforms: {
        booking_com: { rating: 9.0, price: 14500, review_count: 195 },
        makemytrip: { rating: 4.5, price: 13200, review_count: 185 },
        goibibo: { rating: 4.4, price: 13800, review_count: 140 }
      },
      top_reviews: [
        { text: "Taj standard of excellence. Impeccable service and world-class dining. Rooms are top-notch.", platform: "TripAdvisor", rating: 5.0, date: "2025-12-05" },
        { text: "Far from city center and railway station. Auto-rickshaw se IT Park aana kaafi mehnga pada.", platform: "MakeMyTrip", rating: 3.5, date: "2025-09-22" }
      ]
    },
    {
      id: "lemon_tree_dehradun", city: "dehradun", name: "Lemon Tree Premier Dehradun",
      category: "Premium Business (4-Star)", address: "Barlowganj Road, Dehradun",
      price_range: { min: 6500, max: 14000 }, rating: 4.2, total_reviews: 480,
      hero_image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 78, pos: 65, neg: 16, total: 95 },
        room: { score: 80, pos: 68, neg: 14, total: 92 },
        view: { score: 48, pos: 28, neg: 30, total: 72 },
        staff: { score: 82, pos: 70, neg: 12, total: 92 },
        cleanliness: { score: 82, pos: 72, neg: 10, total: 90 },
        value: { score: 72, pos: 58, neg: 18, total: 85 },
        location: { score: 68, pos: 48, neg: 20, total: 78 }
      },
      platforms: {
        booking_com: { rating: 8.0, price: 7800, review_count: 180 },
        makemytrip: { rating: 4.1, price: 7200, review_count: 168 },
        goibibo: { rating: 4.0, price: 7500, review_count: 132 }
      },
      top_reviews: [
        { text: "Reliable chain hotel with consistent quality. Pool is a great plus. Good for business travelers.", platform: "Booking.com", rating: 4.0, date: "2025-10-08" }
      ]
    },
    {
      id: "pacific_golf_dehradun", city: "dehradun", name: "Pacific Golf Resort & Spa",
      category: "Resort & Spa (4-Star)", address: "Sahastradhara Road, Dehradun",
      price_range: { min: 5500, max: 12000 }, rating: 4.0, total_reviews: 410,
      hero_image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 72, pos: 55, neg: 18, total: 85 },
        room: { score: 70, pos: 52, neg: 20, total: 82 },
        view: { score: 62, pos: 40, neg: 22, total: 72 },
        staff: { score: 68, pos: 48, neg: 22, total: 78 },
        cleanliness: { score: 72, pos: 52, neg: 18, total: 75 },
        value: { score: 65, pos: 45, neg: 22, total: 72 },
        location: { score: 55, pos: 32, neg: 28, total: 68 }
      },
      platforms: {
        booking_com: { rating: 7.6, price: 6800, review_count: 155 },
        makemytrip: { rating: 3.9, price: 6200, review_count: 142 },
        goibibo: { rating: 3.8, price: 6500, review_count: 113 }
      },
      top_reviews: [
        { text: "Big resort with golf course and spa. Rooms are comfortable but a bit dated. Good weekend getaway.", platform: "MakeMyTrip", rating: 4.0, date: "2025-08-30" }
      ]
    },
    {
      id: "ramada_dehradun", city: "dehradun", name: "Ramada by Wyndham Dehradun",
      category: "Business Hotel (4-Star)", address: "General Mahadev Singh Road, Dehradun",
      price_range: { min: 5000, max: 10000 }, rating: 3.9, total_reviews: 360,
      hero_image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 68, pos: 42, neg: 18, total: 68 },
        room: { score: 72, pos: 48, neg: 14, total: 65 },
        view: { score: 40, pos: 18, neg: 28, total: 55 },
        staff: { score: 70, pos: 45, neg: 16, total: 65 },
        cleanliness: { score: 75, pos: 50, neg: 12, total: 65 },
        value: { score: 65, pos: 40, neg: 20, total: 62 },
        location: { score: 72, pos: 45, neg: 16, total: 62 }
      },
      platforms: {
        booking_com: { rating: 7.4, price: 5800, review_count: 135 },
        makemytrip: { rating: 3.8, price: 5200, review_count: 128 },
        goibibo: { rating: 3.7, price: 5500, review_count: 97 }
      },
      top_reviews: [
        { text: "Standard business hotel. Clean and functional. Central location near Clock Tower is convenient.", platform: "Google", rating: 4.0, date: "2025-07-25" }
      ]
    },
    {
      id: "hotel_madhuban", city: "dehradun", name: "Hotel Madhuban Grand",
      category: "Heritage Business (4-Star)", address: "97 Rajpur Road, Dehradun",
      price_range: { min: 4500, max: 9500 }, rating: 4.1, total_reviews: 440,
      hero_image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 80, pos: 62, neg: 12, total: 85 },
        room: { score: 72, pos: 52, neg: 18, total: 80 },
        view: { score: 55, pos: 32, neg: 24, total: 65 },
        staff: { score: 78, pos: 58, neg: 14, total: 78 },
        cleanliness: { score: 70, pos: 48, neg: 18, total: 72 },
        value: { score: 78, pos: 60, neg: 12, total: 78 },
        location: { score: 85, pos: 68, neg: 6, total: 78 }
      },
      platforms: {
        booking_com: { rating: 7.8, price: 5200, review_count: 165 },
        makemytrip: { rating: 4.0, price: 4800, review_count: 155 },
        goibibo: { rating: 3.9, price: 5000, review_count: 120 }
      },
      top_reviews: [
        { text: "A Dehradun institution! Best North Indian restaurant in the hotel. Rajpur Road location is prime.", platform: "TripAdvisor", rating: 4.5, date: "2025-11-12" }
      ]
    },
    {
      id: "quatre_saisons", city: "dehradun", name: "Quatre Saisons - A Hill Side Retreat",
      category: "Boutique Hillside (4-Star)", address: "Sahastradhara Road, Near Tapkeshwar, Dehradun",
      price_range: { min: 5500, max: 11000 }, rating: 4.3, total_reviews: 290,
      hero_image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 82, pos: 45, neg: 6, total: 58 },
        room: { score: 85, pos: 48, neg: 5, total: 58 },
        view: { score: 80, pos: 42, neg: 8, total: 55 },
        staff: { score: 80, pos: 42, neg: 8, total: 55 },
        cleanliness: { score: 82, pos: 45, neg: 5, total: 55 },
        value: { score: 72, pos: 38, neg: 12, total: 52 },
        location: { score: 58, pos: 28, neg: 20, total: 50 }
      },
      platforms: {
        booking_com: { rating: 8.2, price: 6500, review_count: 108 },
        makemytrip: { rating: 4.2, price: 5800, review_count: 102 },
        goibibo: { rating: 4.1, price: 6200, review_count: 80 }
      },
      top_reviews: [
        { text: "Hidden gem in Dehradun! Hillside location with mountain air. Rooms are beautifully designed.", platform: "Booking.com", rating: 4.5, date: "2025-10-22" }
      ]
    },
    {
      id: "hotel_great_value", city: "dehradun", name: "Hotel Great Value",
      category: "Midscale Business (3-Star)", address: "Rajpur Road, Dehradun",
      price_range: { min: 3000, max: 6500 }, rating: 3.7, total_reviews: 380,
      hero_image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 62, pos: 38, neg: 22, total: 72 },
        room: { score: 58, pos: 35, neg: 24, total: 70 },
        view: { score: 35, pos: 15, neg: 28, total: 55 },
        staff: { score: 65, pos: 40, neg: 18, total: 68 },
        cleanliness: { score: 60, pos: 35, neg: 22, total: 65 },
        value: { score: 78, pos: 55, neg: 10, total: 72 },
        location: { score: 82, pos: 58, neg: 8, total: 72 }
      },
      platforms: {
        booking_com: { rating: 7.0, price: 3500, review_count: 142 },
        makemytrip: { rating: 3.6, price: 3200, review_count: 135 },
        goibibo: { rating: 3.5, price: 3300, review_count: 103 }
      },
      top_reviews: [
        { text: "Good value for money on Rajpur Road. Rooms are basic but clean. Restaurant food is decent.", platform: "Google", rating: 3.5, date: "2025-08-08" }
      ]
    },
    {
      id: "hotel_president_dehradun", city: "dehradun", name: "Hotel President Dehradun",
      category: "Budget Business (2-Star)", address: "Ashley Hall, Near ISBT, Dehradun",
      price_range: { min: 2000, max: 4500 }, rating: 3.3, total_reviews: 290,
      hero_image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 48, pos: 22, neg: 24, total: 55 },
        room: { score: 45, pos: 20, neg: 24, total: 52 },
        view: { score: 25, pos: 8, neg: 24, total: 40 },
        staff: { score: 55, pos: 28, neg: 20, total: 52 },
        cleanliness: { score: 42, pos: 18, neg: 24, total: 48 },
        value: { score: 72, pos: 38, neg: 10, total: 52 },
        location: { score: 78, pos: 42, neg: 8, total: 52 }
      },
      platforms: {
        booking_com: { rating: 6.2, price: 2500, review_count: 108 },
        makemytrip: { rating: 3.2, price: 2200, review_count: 102 },
        goibibo: { rating: 3.1, price: 2300, review_count: 80 }
      },
      top_reviews: [
        { text: "Near ISBT so convenient for buses. Very basic rooms. Just a place to sleep.", platform: "MakeMyTrip", rating: 3.0, date: "2025-06-28" }
      ]
    },
    {
      id: "fairfield_marriott_dehradun", city: "dehradun", name: "Fairfield by Marriott Dehradun",
      category: "Business Premium (4-Star)", address: "Rajpur Road, Near Jogiwala, Dehradun",
      price_range: { min: 6000, max: 12000 }, rating: 4.2, total_reviews: 380,
      hero_image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 78, pos: 52, neg: 12, total: 72 },
        room: { score: 82, pos: 58, neg: 8, total: 72 },
        view: { score: 42, pos: 20, neg: 28, total: 58 },
        staff: { score: 80, pos: 55, neg: 10, total: 70 },
        cleanliness: { score: 85, pos: 60, neg: 6, total: 70 },
        value: { score: 62, pos: 38, neg: 22, total: 65 },
        location: { score: 72, pos: 45, neg: 16, total: 65 }
      },
      platforms: {
        booking_com: { rating: 8.0, price: 7200, review_count: 142 },
        makemytrip: { rating: 4.1, price: 6500, review_count: 135 },
        goibibo: { rating: 4.0, price: 6800, review_count: 103 }
      },
      top_reviews: [
        { text: "Reliable Marriott quality. Modern rooms, great gym. Breakfast buffet is solid.", platform: "Booking.com", rating: 4.0, date: "2025-10-30" }
      ]
    },
    {
      id: "hotel_saffron_leaf", city: "dehradun", name: "Hotel Saffron Leaf",
      category: "Premium Heritage (4-Star)", address: "Rajpur Road, Dehradun",
      price_range: { min: 5000, max: 10000 }, rating: 4.0, total_reviews: 340,
      hero_image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 75, pos: 48, neg: 14, total: 68 },
        room: { score: 70, pos: 42, neg: 18, total: 65 },
        view: { score: 55, pos: 28, neg: 22, total: 55 },
        staff: { score: 72, pos: 45, neg: 16, total: 65 },
        cleanliness: { score: 68, pos: 40, neg: 18, total: 62 },
        value: { score: 70, pos: 42, neg: 16, total: 62 },
        location: { score: 80, pos: 52, neg: 8, total: 62 }
      },
      platforms: {
        booking_com: { rating: 7.6, price: 5800, review_count: 128 },
        makemytrip: { rating: 3.9, price: 5200, review_count: 118 },
        goibibo: { rating: 3.8, price: 5500, review_count: 94 }
      },
      top_reviews: [
        { text: "Good location on Rajpur Road. Rooms are spacious. The rooftop restaurant has a nice ambiance.", platform: "TripAdvisor", rating: 4.0, date: "2025-09-18" }
      ]
    },
    {
      id: "oyo_rajpur", city: "dehradun", name: "Treebo Trend Rajpur Heights",
      category: "Budget Tech Hotel (2-Star)", address: "Rajpur Road, Near Malsi, Dehradun",
      price_range: { min: 1800, max: 3500 }, rating: 3.4, total_reviews: 520,
      hero_image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 45, pos: 32, neg: 38, total: 95 },
        room: { score: 52, pos: 38, neg: 35, total: 92 },
        view: { score: 30, pos: 12, neg: 28, total: 52 },
        staff: { score: 55, pos: 40, neg: 32, total: 88 },
        cleanliness: { score: 58, pos: 42, neg: 28, total: 85 },
        value: { score: 75, pos: 60, neg: 15, total: 92 },
        location: { score: 70, pos: 50, neg: 18, total: 78 }
      },
      platforms: {
        booking_com: { rating: 6.5, price: 2200, review_count: 195 },
        makemytrip: { rating: 3.3, price: 1900, review_count: 185 },
        goibibo: { rating: 3.2, price: 2000, review_count: 140 }
      },
      top_reviews: [
        { text: "Budget hotel with app-managed check-in. Room was clean on arrival. Good for a transit stay.", platform: "Google", rating: 3.5, date: "2025-07-15" }
      ]
    },
    {
      id: "mussooree_haveli", city: "dehradun", name: "Mussoorie Haveli by Starter Stays",
      category: "Heritage Boutique (3-Star)", address: "Near Forest Research Institute, Dehradun",
      price_range: { min: 3500, max: 7000 }, rating: 4.0, total_reviews: 210,
      hero_image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      aspects: {
        food: { score: 72, pos: 28, neg: 8, total: 42 },
        room: { score: 75, pos: 30, neg: 8, total: 42 },
        view: { score: 68, pos: 26, neg: 10, total: 38 },
        staff: { score: 78, pos: 32, neg: 6, total: 40 },
        cleanliness: { score: 72, pos: 28, neg: 10, total: 40 },
        value: { score: 75, pos: 32, neg: 8, total: 42 },
        location: { score: 70, pos: 28, neg: 10, total: 38 }
      },
      platforms: {
        booking_com: { rating: 7.5, price: 4200, review_count: 78 },
        makemytrip: { rating: 3.9, price: 3800, review_count: 72 },
        goibibo: { rating: 3.8, price: 4000, review_count: 60 }
      },
      top_reviews: [
        { text: "Charming heritage property near FRI. Beautiful gardens and traditional Garhwali decor.", platform: "TripAdvisor", rating: 4.5, date: "2025-11-05" }
      ]
    }
  ]
};
