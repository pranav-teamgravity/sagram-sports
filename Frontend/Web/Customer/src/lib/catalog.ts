// Mock catalogue for the landing page. Replace with API calls once the backend exists.

export type Sport = "football" | "cricket" | "basketball";
export type KitPattern = "solid" | "stripes" | "hoops" | "sash" | "halves";
export type Size = "S" | "M" | "L" | "XL" | "XXL";

export interface Kit {
  primary: string;
  secondary: string;
  /** Colour of printed name and number */
  print: string;
  pattern: KitPattern;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  team: string;
  sport: Sport;
  season: string;
  price: number;
  /** Original price when on offer */
  mrp?: number;
  kit: Kit;
  sizes: Size[];
  customisable: boolean;
  isNew?: boolean;
  /** Real product photography. Without it the jersey is drawn from `kit` as a placeholder. */
  photos?: JerseyPhotos;
}

/**
 * Angle shots of one jersey on a transparent background, all the same height,
 * ordered as the jersey turns: frames[0] is the front.
 */
export interface JerseyPhotos {
  frames: string[];
  /** Frame shown while hanging on the rack (a side-on angle) */
  rack: number;
  /**
   * Mirror the rack frame. On the rack every jersey faces left (front towards the viewer's left);
   * set this when the chosen side shot faces right.
   */
  rackMirror?: boolean;
  /** Frame shown when the pointer is over it on the rack (turned towards the viewer) */
  hover: number;
  /** Frames offered as thumbnails in the 360° viewer */
  thumbs: number[];
}

export interface Team {
  slug: string;
  name: string;
  kit: Pick<Kit, "primary" | "secondary">;
}

export const SPORTS: { slug: Sport | "retro"; name: string; blurb: string; count: number }[] = [
  { slug: "football", name: "Football", blurb: "Club and national team kits", count: 142 },
  { slug: "cricket", name: "Cricket", blurb: "IPL, test and ODI shirts", count: 68 },
  { slug: "basketball", name: "Basketball", blurb: "Vests and shooting shirts", count: 24 },
  { slug: "retro", name: "Retro", blurb: "Classic kits from the 80s and 90s", count: 37 },
];

export const TEAMS: Team[] = [
  { slug: "india", name: "India", kit: { primary: "#1c4fa0", secondary: "#ff7f00" } },
  { slug: "brazil", name: "Brazil", kit: { primary: "#ffd500", secondary: "#009c3b" } },
  { slug: "argentina", name: "Argentina", kit: { primary: "#75aadb", secondary: "#ffffff" } },
  { slug: "portugal", name: "Portugal", kit: { primary: "#c8102e", secondary: "#046a38" } },
  { slug: "germany", name: "Germany", kit: { primary: "#ffffff", secondary: "#111111" } },
  { slug: "kerala-blasters", name: "Kerala Blasters", kit: { primary: "#ffd100", secondary: "#1c3f94" } },
  { slug: "barcelona", name: "Barcelona", kit: { primary: "#a50044", secondary: "#004d98" } },
  { slug: "real-madrid", name: "Real Madrid", kit: { primary: "#ffffff", secondary: "#c9a227" } },
  { slug: "mumbai-indians", name: "Mumbai Indians", kit: { primary: "#004ba0", secondary: "#d1ab3e" } },
  { slug: "chennai-super-kings", name: "Chennai Super Kings", kit: { primary: "#fdb913", secondary: "#0b3d91" } },
];

const ALL_SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    slug: "india-home-2026",
    name: "India home jersey",
    team: "India",
    sport: "football",
    season: "2026/27",
    price: 1499,
    kit: { primary: "#1c4fa0", secondary: "#ff7f00", print: "#ffffff", pattern: "solid" },
    sizes: ALL_SIZES,
    customisable: true,
    isNew: true,
  },
  {
    id: "p2",
    slug: "brazil-home-2024",
    name: "Brazil home jersey",
    team: "Brazil",
    sport: "football",
    // As labelled on the client's reference card.
    season: "2024/26",
    price: 1899,
    kit: { primary: "#f7d417", secondary: "#0b6b3a", print: "#0b5a32", pattern: "solid" },
    sizes: ALL_SIZES,
    customisable: true,
    isNew: true,
    // Sample angles (front, side, back-side, back) from the client's reference composite.
    photos: {
      frames: [0, 1, 2, 3].map((i) => `/jerseys/brazil/${i}.webp`),
      rack: 1,
      hover: 0,
      thumbs: [0, 1, 2, 3],
    },
  },
  {
    id: "p3",
    slug: "argentina-home-2022",
    name: "Argentina home jersey",
    team: "Argentina",
    sport: "football",
    // As labelled on the client's reference card.
    season: "2022/26",
    price: 1899,
    kit: { primary: "#0d1030", secondary: "#2a4fd6", print: "#ffffff", pattern: "solid" },
    sizes: ALL_SIZES,
    customisable: true,
    isNew: true,
    // Sample angles (front, side, back-side, back) from the client's reference composite.
    photos: {
      frames: [0, 1, 2, 3].map((i) => `/jerseys/argentina/${i}.webp`),
      rack: 1,
      hover: 0,
      thumbs: [0, 1, 2, 3],
    },
  },
  {
    id: "p4",
    slug: "kerala-blasters-home-2026",
    name: "Kerala Blasters home jersey",
    team: "Kerala Blasters",
    sport: "football",
    season: "2026/27",
    price: 1299,
    mrp: 1599,
    kit: { primary: "#ffd100", secondary: "#1c3f94", print: "#1c3f94", pattern: "solid" },
    sizes: ALL_SIZES,
    customisable: true,
    isNew: true,
  },
  {
    id: "p5",
    slug: "barcelona-third-2026",
    name: "Barcelona third jersey",
    team: "Barcelona",
    sport: "football",
    season: "2026/27",
    price: 2299,
    kit: { primary: "#16131f", secondary: "#4a22b0", print: "#d9b46a", pattern: "solid" },
    sizes: ALL_SIZES,
    customisable: true,
    // Sample angles from the client's reference composite; replace with the final 8-angle shoot.
    photos: {
      frames: [0, 1, 2, 3].map((i) => `/jerseys/barcelona/${i}.webp`),
      rack: 1,
      hover: 0,
      thumbs: [0, 1, 2, 3],
    },
  },
  {
    id: "p6",
    slug: "india-cricket-odi-2026",
    name: "India ODI jersey",
    team: "India",
    sport: "cricket",
    season: "2026",
    price: 1199,
    mrp: 1499,
    kit: { primary: "#0a3d91", secondary: "#ff7f00", print: "#ffffff", pattern: "sash" },
    sizes: ALL_SIZES,
    customisable: true,
  },
  {
    id: "p7",
    slug: "chennai-super-kings-2026",
    name: "Chennai Super Kings jersey",
    team: "Chennai Super Kings",
    sport: "cricket",
    season: "2026",
    price: 999,
    kit: { primary: "#fdb913", secondary: "#0b3d91", print: "#0b3d91", pattern: "halves" },
    sizes: ["M", "L", "XL"],
    customisable: true,
  },
  {
    id: "p8",
    slug: "germany-retro-1990",
    name: "Germany 1990 retro jersey",
    team: "Germany",
    sport: "football",
    season: "1990",
    price: 1699,
    kit: { primary: "#ffffff", secondary: "#111111", print: "#111111", pattern: "hoops" },
    sizes: ["S", "M", "L", "XL"],
    customisable: false,
  },
];

function football(
  id: string,
  team: string,
  price: number,
  kit: Kit,
  extra: Partial<Product> = {},
): Product {
  const slug = `${team.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-home-2026`;
  return {
    id,
    slug,
    name: `${team} home jersey`,
    team,
    sport: "football",
    season: "2026/27",
    price,
    kit,
    sizes: ALL_SIZES,
    customisable: true,
    ...extra,
  };
}

PRODUCTS.push(
  football(
    "p9",
    "Manchester United",
    2199,
    { primary: "#d6131c", secondary: "#1b1b1b", print: "#ffffff", pattern: "solid" },
    {
      // Sample angles from the client's reference composite; replace with the final 8-angle shoot.
      photos: {
        frames: [0, 1, 2, 3, 4, 5, 6].map((i) => `/jerseys/manchester-united/${i}.webp`),
        // The set has no left-side shot, so its right-side shot is mirrored to face the same way as the others.
        rack: 6,
        rackMirror: true,
        hover: 2,
        thumbs: [0, 2, 6, 5],
      },
    },
  ),
  football(
    "p10",
    "Manchester City",
    2199,
    { primary: "#6cabdd", secondary: "#ffffff", print: "#ffffff", pattern: "solid" },
    {
      slug: "manchester-city-home-2025",
      season: "2025/26",
      // Sample angles (front, side, back-side, back) from the client's reference composite.
      photos: {
        frames: [0, 1, 2, 3].map((i) => `/jerseys/manchester-city/${i}.webp`),
        rack: 1,
        hover: 0,
        thumbs: [0, 1, 2, 3],
      },
    },
  ),
  football("p11", "AC Milan", 2099, { primary: "#fb090b", secondary: "#111111", print: "#ffffff", pattern: "stripes" }),
  football("p12", "Juventus", 2099, { primary: "#ffffff", secondary: "#111111", print: "#d4af37", pattern: "stripes" }),
  football("p13", "Inter Milan", 2099, { primary: "#0068a8", secondary: "#111111", print: "#ffffff", pattern: "stripes" }),
  football("p14", "Bayern Munich", 2299, { primary: "#dc052d", secondary: "#ffffff", print: "#ffffff", pattern: "hoops" }),
  football("p15", "Paris Saint-Germain", 2299, { primary: "#004170", secondary: "#da291c", print: "#ffffff", pattern: "sash" }),
  football("p16", "Netherlands", 1899, { primary: "#ff6200", secondary: "#111111", print: "#111111", pattern: "solid" }),
  football(
    "p17",
    "Chelsea",
    2199,
    { primary: "#0a3cb4", secondary: "#ffffff", print: "#ffffff", pattern: "solid" },
    {
      mrp: 2599,
      slug: "chelsea-home-2025",
      season: "2025/26",
      // Sample angles (front, side, back-side, back) from the client's reference composite.
      photos: {
        frames: [0, 1, 2, 3].map((i) => `/jerseys/chelsea/${i}.webp`),
        rack: 1,
        hover: 0,
        thumbs: [0, 1, 2, 3],
      },
    },
  ),
  football("p18", "France", 1899, { primary: "#1c2a5b", secondary: "#ed2939", print: "#ffffff", pattern: "solid" }),
  football("p19", "Japan", 1799, { primary: "#0b1f6b", secondary: "#e8e8e8", print: "#ffffff", pattern: "halves" }),
  football(
    "p20",
    "Liverpool",
    2199,
    { primary: "#b5121b", secondary: "#ffffff", print: "#ffffff", pattern: "solid" },
    {
      slug: "liverpool-home-2025",
      season: "2025/26",
      // Sample angles (front, side, back-side, back) from the client's reference composite.
      photos: {
        frames: [0, 1, 2, 3].map((i) => `/jerseys/liverpool/${i}.webp`),
        rack: 1,
        hover: 0,
        thumbs: [0, 1, 2, 3],
      },
    },
  ),
);

PRODUCTS.push(
  football(
    "p21",
    "Real Madrid",
    2299,
    { primary: "#f4f4f2", secondary: "#123f36", print: "#123f36", pattern: "solid" },
    {
      slug: "real-madrid-home-2025",
      season: "2025/26",
      // Sample angles (front, side, back-side, back) from the client's reference composite.
      photos: {
        frames: [0, 1, 2, 3].map((i) => `/jerseys/real-madrid/${i}.webp`),
        rack: 1,
        hover: 0,
        thumbs: [0, 1, 2, 3],
      },
    },
  ),
  football(
    "p22",
    "Portugal",
    1899,
    { primary: "#8fe3cf", secondary: "#0b7f6e", print: "#0b5d50", pattern: "solid" },
    {
      slug: "portugal-home-2025",
      season: "2025/26",
      // Sample angles (front, side, back-side, back) from the client's reference composite.
      photos: {
        frames: [0, 1, 2, 3].map((i) => `/jerseys/portugal/${i}.webp`),
        rack: 1,
        hover: 0,
        thumbs: [0, 1, 2, 3],
      },
    },
  ),
);

export const NEW_ARRIVALS = PRODUCTS.filter((p) => p.isNew);
export const BEST_SELLERS = ["p6", "p4", "p5", "p7", "p2", "p8"].map(
  (id) => PRODUCTS.find((p) => p.id === id)!,
);

/** Jerseys offered in the hero name-and-number preview */
export const HERO_KITS = ["p1", "p4", "p5", "p6"].map(
  (id) => PRODUCTS.find((p) => p.id === id)!,
);

export const FREE_DELIVERY_FROM = 999;
