/**
 * Theme copy mapping for dinner experiences
 * Provides descriptions and expectations for each theme
 */

export interface ThemeCopy {
  description: string;
  expectations: string[];
}

export const THEME_COPY: Record<string, ThemeCopy> = {
  "Italian Night": {
    description: "Experience authentic Italian cuisine in an intimate setting",
    expectations: [
      "Multi-course Italian menu",
      "Wine pairing available",
      "Family-style dining",
      "Chef's special pasta",
    ],
  },
  "Sushi Experience": {
    description: "Master the art of sushi with expert chefs",
    expectations: [
      "Fresh sashimi selection",
      "Hand-rolled sushi",
      "Traditional Japanese sake",
      "Omakase-style service",
    ],
  },
  "French Bistro": {
    description: "Classic French cuisine with a modern twist",
    expectations: [
      "Three-course French menu",
      "Wine from French regions",
      "Artisanal bread service",
      "Seasonal ingredients",
    ],
  },
  "Mexican Fiesta": {
    description: "Vibrant flavors and festive atmosphere",
    expectations: [
      "Authentic Mexican dishes",
      "Margarita welcome drink",
      "Live music ambiance",
      "Family-style sharing",
    ],
  },
  "Indian Spice Journey": {
    description: "Explore the rich flavors of Indian cuisine",
    expectations: [
      "Regional Indian specialties",
      "Spice level customization",
      "Traditional naan bread",
      "Chai tea service",
    ],
  },
  "Thai Street Food": {
    description: "Street food favorites in a refined setting",
    expectations: [
      "Authentic Thai flavors",
      "Fresh herbs and spices",
      "Vegetarian options",
      "Thai iced tea",
    ],
  },
  "Mediterranean Feast": {
    description: "Sun-soaked flavors from the Mediterranean",
    expectations: [
      "Mezze platter starter",
      "Grilled seafood options",
      "Olive oil tasting",
      "Fresh seasonal produce",
    ],
  },
  // Default fallback
  default: {
    description: "Join us for an unforgettable dining experience",
    expectations: [
      "Curated menu by chef",
      "Intimate group setting",
      "Seasonal ingredients",
      "Complimentary beverages",
    ],
  },
};

export function getThemeCopy(theme: string): ThemeCopy {
  return THEME_COPY[theme] || THEME_COPY.default!;
}
