import {
    Broom,
    Camera,
    Confetti,
    CookingPot,
    DeviceMobile,
    Drop,
    HouseLine,
    Leaf,
    Lightning,
    MicrophoneStage,
    Scissors,
    Thermometer,
    Truck,
    TShirt
} from 'phosphor-react-native';

export interface ServiceCategory {
    id: string;
    label: string;
    icon: any; // Phosphor Icon Component
    color: string;
    description: string;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
    // 1. Home Maintenance
    { 
        id: 'home-repair', 
        label: 'Home Repairs', 
        icon: HouseLine, 
        color: '#FF9800',
        description: 'General repairs, carpentry, furniture' 
    },
    { 
        id: 'electrician', 
        label: 'Electrician', 
        icon: Lightning, 
        color: '#FFC107',
        description: 'Wiring, generator, power issues' 
    },
    { 
        id: 'plumber', 
        label: 'Plumber', 
        icon: Drop, 
        color: '#2196F3',
        description: 'Pipe leaks, drainage, water pump' 
    },
    { 
        id: 'ac-repair', 
        label: 'AC & Ref', 
        icon: Thermometer, 
        color: '#00BCD4',
        description: 'AC servicing, fridge repair' 
    },
    
    // 2. Events & Hospitality (New Addition)
    { 
        id: 'catering', 
        label: 'Chefs & Bakers', 
        icon: CookingPot, 
        color: '#FF5722',
        description: 'Cooks, bakers, catering services' 
    },
    { 
        id: 'events-media', 
        label: 'Photo & Video', 
        icon: Camera, 
        color: '#9C27B0',
        description: 'Photographers, videographers' 
    },
    { 
        id: 'entertainment', 
        label: 'DJ & MC', 
        icon: MicrophoneStage, 
        color: '#673AB7',
        description: 'DJs, event hosts, entertainers' 
    },
    { 
        id: 'event-planning', 
        label: 'Event Planning', 
        icon: Confetti, 
        color: '#E91E63',
        description: 'Planners, ushers, decorators' 
    },

    // 3. Cleaning
    { 
        id: 'cleaning', 
        label: 'Cleaning', 
        icon: Broom, 
        color: '#4CAF50',
        description: 'House cleaning, laundry, fumigation' 
    },
    { 
        id: 'outdoor', 
        label: 'Gardening', 
        icon: Leaf, 
        color: '#8BC34A',
        description: 'Lawn care, compound cleaning' 
    },

    // 4. Logistics
    { 
        id: 'movers', 
        label: 'Movers', 
        icon: Truck, 
        color: '#3F51B5', // Indigo
        description: 'Relocation, haulage, item pickup' 
    },

    // 5. Personal & Tech
    { 
        id: 'personal-care', 
        label: 'Personal Care', 
        icon: Scissors, 
        color: '#E91E63',
        description: 'Barber, hair stylist, makeup' 
    },
    { 
        id: 'tech-repair', 
        label: 'Gadget Fix', 
        icon: DeviceMobile, 
        color: '#607D8B',
        description: 'Phone, laptop, tablet repair' 
    },

    // 6. Fashion
    { 
        id: 'fashion', 
        label: 'Tailoring', 
        icon: TShirt, 
        color: '#795548',
        description: 'Amendments, custom wear' 
    },
];

// Helper to get flatten list of services for fuzzy search if needed later
export const ALL_SERVICES_KEYWORDS = [
    "Electrician", "Wiring", "Generator",
    "Plumber", "Leak", "Pump",
    "AC", "Fridge", "Cooling",
    "Carpenter", "Furniture", "Door",
    "Painter", "Wall",
    "Cleaner", "Laundry", "Fumigation",
    "Mover", "Relocation", "Truck",
    "Barber", "Hair", "Makeup",
    "Phone", "Laptop", "Screen",
    "Tailor", "Sewing",
    "Chef", "Cook", "Baker", "Catering",
    "Photographer", "Videographer", "Camera",
    "DJ", "MC", "Host", "Music",
    "Event Planner", "Decorator", "Usher"
];