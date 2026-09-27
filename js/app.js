const $ = id => document.getElementById(id);

// AI Engine Modes & Parameters
let selectedAiEngine = "midjourney"; // "midjourney", "flux", "standard"

const engineMap = {
  midjourney: { label: "Midjourney v6.1" },
  flux: { label: "Flux.1 / SDXL" },
  standard: { label: "Commercial Standard" }
};

// Resolution Configurations from 2K up to 8K
const resolutionMap = {
  "2K": { label: "2K QHD", prompt: "2k resolution, 2048x2048 high-definition" },
  "3K": { label: "3K", prompt: "3k resolution, 3072x3072 ultra-clear detail" },
  "4K": { label: "4K UHD", prompt: "4k resolution, 3840x2160 ultra-high-definition, hyper-detailed" },
  "6K": { label: "6K", prompt: "6k resolution, 6144x3456 cinema-grade fine detail" },
  "8K": { label: "8K Ultra", prompt: "8k resolution, 7680x4320 masterwork ultra-fine stock quality" }
};
let selectedResolution = "8K";

// Grain, Noise & Blur Texture Configurations
const grainEffectMap = {
  none: { label: "None", class: "", prompt: "smooth gradient finish, crystal clean surface" },
  blur: { label: "Soft Blur", class: "has-blur", prompt: "dreamy soft gaussian blur gradient, ethereal diffused aura glow, silky smooth transitions, atmospheric blur wallpaper" },
  grain: { label: "Film Grain", class: "has-grain", prompt: "authentic tactile film grain texture, analog 35mm film grain overlay, tactile surface, grainy aesthetic gradient wallpaper, subtle noise stippling" },
  noise: { label: "Heavy Noise", class: "has-noise", prompt: "heavy analog noise grain, lo-fi grit texture, gritty chromatic noise overlay, retro noise dithering, high-frequency noise wallpaper" },
  frosted: { label: "Frosted Blur", class: "has-frosted", prompt: "frosted glassmorphism blur, translucent frosted glass surface texture, diffused light refraction, milky frosted glass overlay" }
};
let selectedGrainEffect = "grain";

// Comprehensive Catalog of All Commercial Stock Background Types
const backgroundCatalog = [
  // 0. Radial Zoom Rays & Light Burst (Trending Motion Speed Category)
  { id: "Prismatic Radial Zoom Burst", label: "Radial Zoom Rays", group: "burst", icon: "💥" },
  { id: "Hyperdrive Warp Speed Rays", label: "Hyperdrive Warp", group: "burst", icon: "🚀" },
  { id: "Rainbow Starburst Flare Blast", label: "Starburst Flare", group: "burst", icon: "✨" },
  { id: "Dynamic Motion Speed Lines", label: "Motion Speed Lines", group: "burst", icon: "⚡" },
  { id: "Explosive Radiant Beam Flare", label: "Radiant Beam Flare", group: "burst", icon: "☀️" },
  { id: "Chromatic Velocity Laser Trails", label: "Laser Trails Blast", group: "burst", icon: "🌈" },

  // 1. Grain, Noise & Blur Gradients (Dedicated High-Converting Stock Category)
  { id: "Grainy Mesh Wallpaper", label: "Grainy Mesh", group: "grain", icon: "🌌" },
  { id: "Aesthetic Aura Grain Gradient", label: "Aura Grain Blur", group: "grain", icon: "✨" },
  { id: "Lo-Fi Analog Noise Gradient", label: "Lo-Fi Noise", group: "grain", icon: "📻" },
  { id: "Soft Gaussian Blur Gradient", label: "Soft Blur Aura", group: "grain", icon: "🌫️" },
  { id: "Frosted Glassmorphism Blur", label: "Frosted Blur", group: "grain", icon: "🧊" },
  { id: "Acid Film Grain Gradient", label: "Acid Film Grain", group: "grain", icon: "🎞️" },
  { id: "Grainy Sunset Noise Gradient", label: "Sunset Noise Grain", group: "grain", icon: "🌅" },
  { id: "Vibrant Grain Flow Gradient", label: "Vibrant Grain Flow", group: "grain", icon: "🌈" },

  // 2. Gradients
  { id: "Vibrant Mesh Gradient", label: "Mesh Gradient", group: "gradient", icon: "🌐" },
  { id: "Liquid Holographic Gradient", label: "Liquid Holographic", group: "gradient", icon: "💧" },
  { id: "Soft Pastel Aura Gradient", label: "Pastel Aura", group: "gradient", icon: "🌸" },
  { id: "Dark Chromatic Radial Gradient", label: "Dark Chromatic", group: "gradient", icon: "🌑" },
  { id: "Duotone Minimalist Gradient", label: "Duotone Minimal", group: "gradient", icon: "☯" },
  { id: "Abstract Fluid Wave Gradient", label: "Fluid Waves", group: "gradient", icon: "🌊" },
  { id: "Bioluminescent Dark Gradient", label: "Bioluminescent", group: "gradient", icon: "🌿" },
  { id: "Prismatic Iridescent Gradient", label: "Prismatic Spectrum", group: "gradient", icon: "💎" },
  { id: "Glassmorphic Frosted Gradient", label: "Frosted Glass", group: "gradient", icon: "🧊" },
  { id: "Cyberpunk Neon Gradient", label: "Cyberpunk Neon", group: "gradient", icon: "⚡" },
  { id: "Deep Cosmic Nebula Gradient", label: "Cosmic Nebula", group: "gradient", icon: "🌌" },
  { id: "Golden Sunset Warm Gradient", label: "Golden Sunset", group: "gradient", icon: "🌇" },
  { id: "Geometric Bauhaus Gradient", label: "Geometric Bauhaus", group: "gradient", icon: "📐" },
  { id: "Liquid Metallic Chrome", label: "Metallic Chrome", group: "gradient", icon: "🪞" },

  // 3. 3D & Spatial Studio Backdrops
  { id: "3D Podium Stage Backdrop", label: "3D Podium Stage", group: "3d", icon: "🏛" },
  { id: "Minimal Cyclorama Studio", label: "Cyclorama Studio", group: "3d", icon: "📸" },
  { id: "Architectural Arch & Sun Shadow", label: "Arch Sun Shadow", group: "3d", icon: "🏢" },
  { id: "Floating 3D Geometric Spheres", label: "3D Floating Spheres", group: "3d", icon: "🔮" },
  { id: "Flowing Silk Velvet Drape", label: "Silk Velvet Drape", group: "3d", icon: "🧣" },
  { id: "Window Shadow Caustics Wall", label: "Window Shadow Wall", group: "3d", icon: "🪟" },
  { id: "Neon Cyberpunk Tunnel Room", label: "Cyber Tunnel Room", group: "3d", icon: "🚪" },

  // 4. Textures & Material Surfaces
  { id: "Luxury Marble Gold Veins", label: "Marble Gold Veins", group: "texture", icon: "🏛" },
  { id: "Raw Concrete Grunge Plaster", label: "Concrete Plaster", group: "texture", icon: "🧱" },
  { id: "Natural Warm Wood Grain", label: "Natural Wood Grain", group: "texture", icon: "🪵" },
  { id: "Brushed Metallic Titanium", label: "Brushed Titanium", group: "texture", icon: "⚙" },
  { id: "Handcrafted Kraft Paper Fiber", label: "Kraft Paper Fiber", group: "texture", icon: "📜" },
  { id: "Terrazzo Mosaic Stone Pattern", label: "Terrazzo Mosaic", group: "texture", icon: "🪨" },
  { id: "Woven Linen Fabric Surface", label: "Woven Linen Fabric", group: "texture", icon: "🧵" },
  { id: "Vintage Distressed Denim", label: "Distressed Denim", group: "texture", icon: "👖" },

  // 5. Nature & Organic Elements
  { id: "Botanical Leaf Shadow Field", label: "Botanical Leaf Shadow", group: "nature", icon: "🍃" },
  { id: "Watercolor Gouache Splatter Wash", label: "Watercolor Wash", group: "nature", icon: "🎨" },
  { id: "Ocean Ripple Water Caustics", label: "Ocean Water Caustics", group: "nature", icon: "🏊" },
  { id: "Pastel Sunset Cloudscape", label: "Sunset Cloudscape", group: "nature", icon: "☁" },
  { id: "Ethereal Colored Powder Smoke", label: "Powder Smoke Blast", group: "nature", icon: "💨" },
  { id: "Desert Sand Dune Wind Ripples", label: "Sand Dune Ripples", group: "nature", icon: "🏜" },
  { id: "Deep Celestial Galaxy Aurora", label: "Celestial Galaxy", group: "nature", icon: "✨" },

  // 6. Pattern Gradients (50 Commercial Stock Categories)
  { id: "Geometric Gradient Pattern", label: "Geometric Pattern", group: "pattern", icon: "📐" },
  { id: "Abstract Gradient Pattern", label: "Abstract Pattern", group: "pattern", icon: "🎨" },
  { id: "Floral Gradient Pattern", label: "Floral Pattern", group: "pattern", icon: "🌸" },
  { id: "Botanical Gradient Pattern", label: "Botanical Pattern", group: "pattern", icon: "🌿" },
  { id: "Leaf Gradient Pattern", label: "Leaf Pattern", group: "pattern", icon: "🍃" },
  { id: "Wave Gradient Pattern", label: "Wave Pattern", group: "pattern", icon: "🌊" },
  { id: "Line Gradient Pattern", label: "Line Pattern", group: "pattern", icon: "〰️" },
  { id: "Grid Gradient Pattern", label: "Grid Pattern", group: "pattern", icon: "▦" },
  { id: "Dot Gradient Pattern", label: "Dot Pattern", group: "pattern", icon: "⚬" },
  { id: "Circle Gradient Pattern", label: "Circle Pattern", group: "pattern", icon: "⭕" },
  { id: "Organic Gradient Pattern", label: "Organic Pattern", group: "pattern", icon: "🦠" },
  { id: "Blob Gradient Pattern", label: "Blob Pattern", group: "pattern", icon: "🫧" },
  { id: "Spiral Gradient Pattern", label: "Spiral Pattern", group: "pattern", icon: "🌀" },
  { id: "Swirl Gradient Pattern", label: "Swirl Pattern", group: "pattern", icon: "🌪️" },
  { id: "Mesh Gradient Pattern", label: "Mesh Pattern", group: "pattern", icon: "🕸️" },
  { id: "Liquid Gradient Pattern", label: "Liquid Pattern", group: "pattern", icon: "💧" },
  { id: "Fluid Gradient Pattern", label: "Fluid Pattern", group: "pattern", icon: "🌊" },
  { id: "Ripple Gradient Pattern", label: "Ripple Pattern", group: "pattern", icon: "🔘" },
  { id: "Wavy Line Gradient Pattern", label: "Wavy Line Pattern", group: "pattern", icon: "〰️" },
  { id: "Seamless Gradient Pattern", label: "Seamless Pattern", group: "pattern", icon: "🔁" },
  { id: "Minimal Gradient Pattern", label: "Minimal Pattern", group: "pattern", icon: "▫️" },
  { id: "Modern Gradient Pattern", label: "Modern Pattern", group: "pattern", icon: "💎" },
  { id: "Retro Gradient Pattern", label: "Retro Pattern", group: "pattern", icon: "📻" },
  { id: "Psychedelic Gradient Pattern", label: "Psychedelic Pattern", group: "pattern", icon: "🍄" },
  { id: "Neon Gradient Pattern", label: "Neon Pattern", group: "pattern", icon: "⚡" },
  { id: "Holographic Gradient Pattern", label: "Holographic Pattern", group: "pattern", icon: "💿" },
  { id: "3D Gradient Pattern", label: "3D Pattern", group: "pattern", icon: "🧊" },
  { id: "Isometric Gradient Pattern", label: "Isometric Pattern", group: "pattern", icon: "📦" },
  { id: "Polygon Gradient Pattern", label: "Polygon Pattern", group: "pattern", icon: "🔺" },
  { id: "Hexagon Gradient Pattern", label: "Hexagon Pattern", group: "pattern", icon: "⬡" },
  { id: "Triangle Gradient Pattern", label: "Triangle Pattern", group: "pattern", icon: "▲" },
  { id: "Diamond Gradient Pattern", label: "Diamond Pattern", group: "pattern", icon: "💠" },
  { id: "Checkerboard Gradient Pattern", label: "Checkerboard Pattern", group: "pattern", icon: "🏁" },
  { id: "Stripe Gradient Pattern", label: "Stripe Pattern", group: "pattern", icon: "💈" },
  { id: "Zigzag Gradient Pattern", label: "Zigzag Pattern", group: "pattern", icon: "⚡" },
  { id: "Scallop Gradient Pattern", label: "Scallop Pattern", group: "pattern", icon: "🥟" },
  { id: "Arch Gradient Pattern", label: "Arch Pattern", group: "pattern", icon: "⛩️" },
  { id: "Tunnel Gradient Pattern", label: "Tunnel Pattern", group: "pattern", icon: "🕳️" },
  { id: "Radial Gradient Pattern", label: "Radial Pattern", group: "pattern", icon: "🎯" },
  { id: "Sunburst Gradient Pattern", label: "Sunburst Pattern", group: "pattern", icon: "☀️" },
  { id: "Star Gradient Pattern", label: "Star Pattern", group: "pattern", icon: "⭐" },
  { id: "Mandala Gradient Pattern", label: "Mandala Pattern", group: "pattern", icon: "☸️" },
  { id: "Moroccan Gradient Pattern", label: "Moroccan Pattern", group: "pattern", icon: "🕌" },
  { id: "Islamic Geometric Gradient Pattern", label: "Islamic Geometric", group: "pattern", icon: "✨" },
  { id: "Tribal Gradient Pattern", label: "Tribal Pattern", group: "pattern", icon: "🏺" },
  { id: "Boho Gradient Pattern", label: "Boho Pattern", group: "pattern", icon: "🪶" },
  { id: "Vintage Gradient Pattern", label: "Vintage Pattern", group: "pattern", icon: "📜" },
  { id: "Luxury Gradient Pattern", label: "Luxury Pattern", group: "pattern", icon: "👑" },
  { id: "Metallic Gradient Pattern", label: "Metallic Pattern", group: "pattern", icon: "🪙" },
  { id: "Glass Gradient Pattern", label: "Glass Pattern", group: "pattern", icon: "🪟" },
  { id: "Topographic Contour Map Lines", label: "Topographic Lines", group: "pattern", icon: "🗺" },
  { id: "Retro Halftone Dot Matrix", label: "Halftone Dot Matrix", group: "pattern", icon: "⚫" },
  { id: "Isometric Cyber Wireframe Grid", label: "Cyber Wireframe", group: "pattern", icon: "📐" },
  { id: "Subtle Microchip Circuit Tech", label: "Microchip Circuit", group: "pattern", icon: "💻" },
  { id: "Hexagonal Honeycomb Tech Mesh", label: "Honeycomb Mesh", group: "pattern", icon: "⬡" },
  { id: "Seamless Arabesque Geometric", label: "Arabesque Geometry", group: "pattern", icon: "💠" },
  { id: "Voronoi Cellular Organic Grid", label: "Voronoi Cellular", group: "pattern", icon: "🕸" }
];

// Curated Real CSS Gradient Palettes Available as Visual Swatch Buttons
const gradientPresets = {
  "Prismatic Rainbow Burst": "radial-gradient(circle at 50% 50%, #ffffff 0%, #fffbe6 4%, rgba(255, 235, 130, 0.95) 9%, rgba(255, 90, 40, 0.85) 18%, rgba(225, 29, 72, 0.5) 30%, transparent 65%), repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.85) 0deg 0.8deg, transparent 0.8deg 2.6deg, rgba(255,255,255,0.5) 2.6deg 3.2deg, transparent 3.2deg 5.8deg), conic-gradient(from 270deg at 50% 50%, #00f2fe 0deg, #3b82f6 40deg, #8b5cf6 75deg, #ec4899 110deg, #ff0844 145deg, #f97316 180deg, #facc15 215deg, #22c55e 255deg, #06b6d4 295deg, #00f2fe 360deg)",
  "Hyperdrive Warp Speed": "radial-gradient(circle at 50% 50%, #ffffff 0%, rgba(254, 240, 138, 0.95) 8%, rgba(249, 115, 22, 0.85) 18%, rgba(219, 39, 119, 0.6) 35%, transparent 70%), repeating-conic-gradient(from 15deg at 50% 50%, #00f2fe 0deg 4deg, #0f172a 4deg 8deg, #ec4899 8deg 12deg, #0f172a 12deg 16deg, #f59e0b 16deg 20deg, #0f172a 20deg 24deg, #10b981 24deg 28deg, #0f172a 28deg 32deg)",
  "Solar Starburst Flare": "radial-gradient(circle at 50% 50%, #ffffff 0%, #fef08a 8%, #f97316 22%, #dc2626 50%, #450a0a 85%, #050505 100%), repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.8) 0deg 1deg, transparent 1deg 3.5deg, rgba(255,200,50,0.6) 3.5deg 4.2deg, transparent 4.2deg 7deg)",
  "Neon Cyber Zoom Blast": "radial-gradient(circle at 50% 50%, #ffffff 0%, #38bdf8 10%, #d946ef 35%, #0f172a 75%, #020617 100%), repeating-conic-gradient(from 0deg at 50% 50%, rgba(0,242,254,0.9) 0deg 1deg, transparent 1deg 3deg, rgba(247,37,133,0.9) 3deg 4deg, transparent 4deg 6deg)",
  "Geometric Holographic Grid": "linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(135deg, #00f2fe 0%, #4facfe 40%, #ff0844 100%)",
  "Checkerboard Cyber Neon": "repeating-conic-gradient(rgba(255,255,255,0.25) 0% 25%, transparent 0% 50%) 50% / 28px 28px, linear-gradient(135deg, #f72585 0%, #7209b7 50%, #4cc9f0 100%)",
  "Luxury Gold Mandala": "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,215,0,0.35) 0deg 10deg, transparent 10deg 20deg), linear-gradient(135deg, #18181b 0%, #27272a 50%, #f59e0b 100%)",
  "Islamic Arabesque Emerald": "repeating-conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.2) 0deg 45deg, transparent 45deg 90deg) 0 0 / 24px 24px, linear-gradient(135deg, #022c22 0%, #059669 45%, #34d399 100%)",
  "Psychedelic Wave Spiral": "repeating-radial-gradient(circle at 50% 50%, transparent 0 10px, rgba(255,255,255,0.25) 10px 12px, transparent 12px 24px), linear-gradient(135deg, #ff0844 0%, #ffb199 40%, #8b5cf6 80%, #06b6d4 100%)",
  "Sunset Peach to Magenta": "linear-gradient(135deg, #ff758c 0%, #ff7eb3 40%, #7928ca 100%)",
  "Cyberpunk Cyan & Hot Pink": "linear-gradient(135deg, #00f2fe 0%, #4facfe 40%, #ff0844 100%)",
  "Cosmic Violet & Indigo": "radial-gradient(circle at 20% 30%, #c084fc 0%, #6366f1 45%, #0f172a 100%)",
  "Emerald Mint to Sapphire": "linear-gradient(135deg, #34d399 0%, #06b6d4 45%, #3b82f6 100%)",
  "Midnight Obsidian & Gold": "linear-gradient(135deg, #18181b 0%, #27272a 50%, #f59e0b 100%)",
  "Nordic Frost & Lavender": "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 45%, #a855f7 100%)",
  "Pastel Rainbow Fade": "linear-gradient(135deg, #fbcfe8 0%, #fde68a 33%, #a7f3d0 66%, #bae6fd 100%)",
  "Warm Amber & Terracotta": "linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #b91c1c 100%)",
  "Electric Blue & Lime": "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #84cc16 100%)",
  "Neon cyan-magenta": "linear-gradient(135deg, #00f5d4 0%, #7b2cbf 50%, #f72585 100%)",
  "Purple gradient": "linear-gradient(135deg, #e879f9 0%, #a855f7 50%, #4c1d95 100%)",
  "Cool blue-violet": "linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #4338ca 100%)",
  "Bioluminescent Green": "linear-gradient(135deg, #022c22 0%, #059669 45%, #34d399 100%)",
  "Velvet Rose & Plum": "linear-gradient(135deg, #be185d 0%, #7e22ce 50%, #3b0764 100%)",
  "Solar Flare Orange": "linear-gradient(135deg, #fef08a 0%, #f97316 50%, #dc2626 100%)",
  "Deep Ocean Abyss": "linear-gradient(135deg, #082f49 0%, #0369a1 50%, #38bdf8 100%)",
  "Black and gold": "linear-gradient(135deg, #09090b 0%, #27272a 60%, #eab308 100%)",
  "Silver metallic": "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 50%, #475569 100%)",
  "Earth tone": "linear-gradient(135deg, #d97706 0%, #78350f 50%, #451a03 100%)",
  "Monochrome": "linear-gradient(135deg, #e4e4e7 0%, #71717a 50%, #18181b 100%)"
};

const pools = {
  style: [
    "Minimal", "Modern", "Corporate", "Luxury", "Editorial", "Geometric", "Organic",
    "Abstract", "Futuristic", "Technology", "3D", "Isometric", "Flat Vector", "Line Art",
    "Liquid", "Glassmorphism", "Neon", "Retro", "Vintage", "Memphis", "Bauhaus",
    "Scandinavian", "Swiss", "Brutalist", "Playful", "Architectural", "Holographic"
  ],
  composition: [
    "Center", "Left aligned", "Right aligned", "Top weighted", "Bottom weighted", "Diagonal",
    "Radial", "Circular", "Spiral", "Grid", "Broken grid", "Asymmetric", "Symmetric",
    "Rule of thirds", "Golden ratio", "Full frame", "Corner focused", "Floating",
    "Layered", "Overlapping", "Stacked", "Scattered", "Clustered", "Isolated subject",
    "Negative-space dominant", "Dense"
  ],
  shape: [
    "Circle", "Square", "Rectangle", "Triangle", "Polygon", "Hexagon", "Blob", "Wave",
    "Spiral", "Arc", "Ring", "Capsule", "Organic shape", "Geometric mesh", "Grid",
    "Ribbon", "Fold", "Starburst", "Dot", "Line", "Prism", "Liquid droplet"
  ],
  color: Object.keys(gradientPresets),
  background: backgroundCatalog.map(x => x.id),
  lighting: [
    "Flat", "Soft light", "Hard light", "Rim light", "Backlight", "Top light", "Side light",
    "Studio light", "Ambient", "Glow", "Neon glow", "Long shadow", "Soft shadow",
    "Prismatic caustics", "Dramatic"
  ],
  texture: [
    "Smooth", "Grain", "Paper", "Fabric", "Concrete", "Metallic", "Glass", "Plastic",
    "Liquid", "Noise", "Mesh", "Matte", "Glossy", "Frosted glass", "Velvet sheen"
  ],
  density: [
    "Minimal", "Low", "Medium", "High", "Maximum detail"
  ],
  position: [
    "Center", "Upper-left", "Upper-right", "Lower-left", "Lower-right", "Left third",
    "Right third", "Top third", "Bottom third", "Diagonal", "Distributed", "Edge cropped"
  ],
  orientation: [
    "Square", "Portrait", "Landscape", "Wide Banner", "Ultra-wide", "Vertical Poster",
    "Social Media", "Website Hero", "Presentation"
  ]
};

// Aspect ratio mapping for Midjourney
const orientationArMap = {
  "Square": "--ar 1:1",
  "Portrait": "--ar 4:5",
  "Landscape": "--ar 16:9",
  "Wide Banner": "--ar 21:9",
  "Ultra-wide": "--ar 32:9",
  "Vertical Poster": "--ar 9:16",
  "Social Media": "--ar 4:5",
  "Website Hero": "--ar 16:9",
  "Presentation": "--ar 16:9",
  "Auto": "--ar 16:9"
};

// State
let selectedBackgroundFilter = "ALL";
let selectedBgCategory = "all";
let selectedPaletteFilter = "ALL";
let activeGradientCss = gradientPresets["Sunset Peach to Magenta"];
let activeInspectedItem = null;
let history = JSON.parse(localStorage.getItem("stockDiversityHistory") || "[]");
let current = [];

// Backfill older history
history.forEach(d => {
  if (!d.cssGradient) d.cssGradient = generateCssGradient(d.color, d.background, d.style);
  if (!d.resolution) d.resolution = "8K";
  if (!d.grainEffect) d.grainEffect = "grain";
  if (!d.title) d.title = generateTitle(d);
  if (!d.keywords) d.keywords = generateKeywords(d);
  if (!d.negativePrompt) d.negativePrompt = generateNegativePrompt(d);
});

function generateCssGradient(colorName, bgName, styleName) {
  let baseGradient = gradientPresets[colorName] || "";
  if (!baseGradient) {
    let hash = 0;
    const str = (colorName || "") + (bgName || "") + (styleName || "");
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 45 + (Math.abs(hash >> 3) % 80)) % 360;
    const h3 = (h2 + 50) % 360;
    baseGradient = `linear-gradient(135deg, hsl(${h1}, 85%, 65%) 0%, hsl(${h2}, 80%, 55%) 50%, hsl(${h3}, 85%, 45%) 100%)`;
  }

  if (bgName) {
    if (bgName.includes("Burst") || bgName.includes("Zoom") || bgName.includes("Rays") || bgName.includes("Warp") || bgName.includes("Starburst") || bgName.includes("Laser Trails")) {
      return "radial-gradient(circle at 50% 50%, #ffffff 0%, #fffbe6 4%, rgba(255, 235, 130, 0.95) 9%, rgba(255, 90, 40, 0.85) 18%, rgba(225, 29, 72, 0.5) 30%, transparent 65%), repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.85) 0deg 0.8deg, transparent 0.8deg 2.6deg, rgba(255,255,255,0.5) 2.6deg 3.2deg, transparent 3.2deg 5.8deg), conic-gradient(from 270deg at 50% 50%, #00f2fe 0deg, #3b82f6 40deg, #8b5cf6 75deg, #ec4899 110deg, #ff0844 145deg, #f97316 180deg, #facc15 215deg, #22c55e 255deg, #06b6d4 295deg, #00f2fe 360deg)";
    }

    // Dynamic Pattern Gradient Overlays
    if (bgName.includes("Checkerboard")) return `repeating-conic-gradient(rgba(255,255,255,0.22) 0% 25%, transparent 0% 50%) 50% / 28px 28px, ${baseGradient}`;
    if (bgName.includes("Dot")) return `radial-gradient(circle, rgba(255,255,255,0.35) 18%, transparent 19%) 0 0 / 18px 18px, ${baseGradient}`;
    if (bgName.includes("Grid")) return `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px) 0 0 / 22px 22px, ${baseGradient}`;
    if (bgName.includes("Stripe")) return `repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 10px, transparent 10px 20px), ${baseGradient}`;
    if (bgName.includes("Zigzag")) return `repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 8px, transparent 8px 16px), repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 8px, transparent 8px 16px), ${baseGradient}`;
    if (bgName.includes("Hexagon") || bgName.includes("Honeycomb")) return `repeating-conic-gradient(from 30deg at 50% 50%, rgba(255,255,255,0.15) 0deg 60deg, transparent 60deg 120deg) 0 0 / 28px 28px, ${baseGradient}`;
    if (bgName.includes("Diamond")) return `repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 16px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 16px), ${baseGradient}`;
    if (bgName.includes("Wave") || bgName.includes("Ripple")) return `radial-gradient(ellipse at 50% 0%, transparent 40%, rgba(255,255,255,0.25) 42%, transparent 45%) 0 0 / 36px 20px, radial-gradient(ellipse at 50% 100%, transparent 40%, rgba(255,255,255,0.25) 42%, transparent 45%) 18px 0 / 36px 20px, ${baseGradient}`;
    if (bgName.includes("Line")) return `repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0 2px, transparent 2px 14px), ${baseGradient}`;
    if (bgName.includes("Circle")) return `radial-gradient(circle, transparent 20%, rgba(255,255,255,0.25) 22%, transparent 24%) 0 0 / 32px 32px, ${baseGradient}`;
    if (bgName.includes("Arch") || bgName.includes("Tunnel")) return `repeating-radial-gradient(circle at 50% 100%, transparent 0 12px, rgba(255,255,255,0.2) 12px 14px, transparent 14px 26px), ${baseGradient}`;
    if (bgName.includes("Spiral") || bgName.includes("Swirl") || bgName.includes("Mandala") || bgName.includes("Sunburst") || bgName.includes("Radial") || bgName.includes("Star")) return `repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.22) 0deg 8deg, transparent 8deg 16deg), ${baseGradient}`;
    if (bgName.includes("Islamic Geometric") || bgName.includes("Moroccan") || bgName.includes("Tribal") || bgName.includes("Boho") || bgName.includes("Scallop")) return `repeating-conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.18) 0deg 45deg, transparent 45deg 90deg) 0 0 / 24px 24px, ${baseGradient}`;
    if (bgName.includes("Triangle") || bgName.includes("Polygon")) return `repeating-linear-gradient(60deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 20px), repeating-linear-gradient(-60deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 20px), ${baseGradient}`;
    if (bgName.includes("3D") || bgName.includes("Isometric")) return `linear-gradient(30deg, rgba(255,255,255,0.15) 1px, transparent 1px) 0 0 / 30px 18px, linear-gradient(150deg, rgba(255,255,255,0.15) 1px, transparent 1px) 0 0 / 30px 18px, ${baseGradient}`;
    if (bgName.includes("Floral") || bgName.includes("Botanical") || bgName.includes("Leaf") || bgName.includes("Organic") || bgName.includes("Blob")) return `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 40%) 0 0 / 30px 30px, radial-gradient(circle at 70% 70%, rgba(255,255,255,0.2) 0%, transparent 35%) 0 0 / 30px 30px, ${baseGradient}`;
    if (bgName.includes("Neon") || bgName.includes("Holographic") || bgName.includes("Psychedelic")) return `repeating-conic-gradient(from 0deg at 50% 50%, rgba(0,242,254,0.3) 0deg 15deg, rgba(247,37,133,0.3) 15deg 30deg, transparent 30deg 45deg), ${baseGradient}`;
    if (bgName.includes("Luxury") || bgName.includes("Metallic") || bgName.includes("Vintage")) return `linear-gradient(135deg, rgba(255,215,0,0.25) 0%, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%, rgba(255,215,0,0.25) 100%), ${baseGradient}`;
    if (bgName.includes("Glass")) return `linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.2) 100%), ${baseGradient}`;
    if (bgName.includes("Seamless") || bgName.includes("Geometric") || bgName.includes("Pattern")) return `repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 16px), ${baseGradient}`;

    if (bgName.includes("Radial") || bgName.includes("Cosmic") || bgName.includes("Aura") || bgName.includes("Podium")) {
      return baseGradient.replace("linear-gradient(135deg,", "radial-gradient(circle at 40% 40%,");
    }

    if (bgName.includes("Mesh") || bgName.includes("Grain Flow")) return "radial-gradient(circle at 75% 25%, #f43f5e 0%, #a855f7 35%, #06b6d4 75%, #0f172a 100%)";
    if (bgName.includes("Aura") || bgName.includes("Aesthetic")) return "radial-gradient(circle at 45% 40%, #fdba74 0%, #f472b6 35%, #818cf8 70%, #1e1b4b 100%)";
    if (bgName.includes("Lo-Fi") || bgName.includes("Sunset Noise")) return "linear-gradient(135deg, #18181b 0%, #3f3f46 25%, #e11d48 60%, #fb923c 100%)";
    if (bgName.includes("Soft Gaussian") || bgName.includes("Blur")) return "radial-gradient(circle at 30% 30%, #67e8f9 0%, #a78bfa 45%, #ec4899 85%, #312e81 100%)";
    if (bgName.includes("Frosted Glass") || bgName.includes("Glassmorphism") || bgName.includes("Frosted Blur")) return "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(203,213,225,0.2) 50%, rgba(148,163,184,0.3) 100%), linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)";
    if (bgName.includes("Acid Film")) return "linear-gradient(135deg, #a3e635 0%, #06b6d4 40%, #d946ef 80%, #172554 100%)";
    if (bgName.includes("Marble")) return "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 40%, #eab308 50%, #f1f5f9 100%)";
    if (bgName.includes("Concrete")) return "linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)";
    if (bgName.includes("Wood")) return "linear-gradient(135deg, #78350f 0%, #b45309 45%, #d97706 100%)";
    if (bgName.includes("Titanium")) return "linear-gradient(135deg, #94a3b8 0%, #cbd5e1 50%, #64748b 100%)";
    if (bgName.includes("Paper")) return "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #d97706 100%)";
    if (bgName.includes("Leaf") || bgName.includes("Botanical")) return "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)";
    if (bgName.includes("Water") || bgName.includes("Ocean")) return "linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #bae6fd 100%)";
    if (bgName.includes("Topographic")) return "linear-gradient(135deg, #0f172a 0%, #334155 50%, #64748b 100%)";
    if (bgName.includes("Circuit")) return "linear-gradient(135deg, #09090b 0%, #064e3b 50%, #10b981 100%)";
    if (bgName.includes("Podium") || bgName.includes("Studio")) return "radial-gradient(circle at 50% 60%, #cbd5e1 0%, #64748b 70%, #1e293b 100%)";
    if (bgName.includes("Silk")) return "linear-gradient(135deg, #831843 0%, #db2777 50%, #be185d 100%)";
  }

  return baseGradient;
}

function pick(arr, used = []) {
  let a = arr.filter(x => !used.includes(x));
  return a.length ? a[Math.floor(Math.random() * a.length)] : arr[Math.floor(Math.random() * arr.length)];
}

// Generate High-Converting Commercial Stock Title
function generateTitle(d) {
  const cat = $("category").value.trim() || "Commercial Background";
  const grainWord = d.grainEffect && d.grainEffect !== "none" ? `${grainEffectMap[d.grainEffect]?.label || ""} ` : "";
  return `${d.style} ${grainWord}${d.background} with ${d.color} Palette, ${d.shape} Geometry & Usable Copy Space`;
}

// Generate 45-50 Ranked Commercial SEO Keywords
function generateKeywords(d) {
  const currentEffect = d.grainEffect || selectedGrainEffect || "grain";
  const isBurst = (d.background && (d.background.includes("Burst") || d.background.includes("Zoom") || d.background.includes("Rays") || d.background.includes("Warp"))) ||
                  (d.color && d.color.includes("Burst")) ||
                  ($("category").value.includes("Burst") || $("category").value.includes("Zoom"));

  const isPattern = (d.background && (d.background.includes("Pattern") || backgroundCatalog.find(b => b.id === d.background)?.group === "pattern")) ||
                    ($("category").value.includes("Pattern"));

  const burstTags = isBurst ? [
    "radial zoom blur", "light rays burst", "starburst background", "motion blur streaks",
    "speed lines", "hyperdrive warp", "rainbow light rays", "velocity lines", "explosion of light",
    "prismatic burst", "neon laser streaks", "central flare", "sunburst flare", "futuristic speed lines",
    "dynamic energy burst", "chromatic aberration", "radiant light explosion"
  ] : [];

  const patternTags = isPattern ? [
    "seamless pattern", "gradient pattern", "geometric pattern", "repeating pattern", "tileable pattern",
    "surface pattern design", "textile pattern", "fabric print", "wallpaper pattern", "wrapping paper",
    "decorative pattern", "abstract pattern", "vector pattern", "continuous pattern", "symmetric pattern",
    "modern pattern", "ornamental pattern", "print ready pattern"
  ] : [];

  const grainTags = {
    grain: ["grainy gradient", "film grain", "grain texture", "35mm film grain", "grainy wallpaper", "tactile texture", "analog grain", "grain backdrop", "noise stippling"],
    noise: ["noise texture", "lo-fi noise", "analog noise", "retro noise", "noise gradient", "gritty texture", "dithering", "noise wallpaper", "high frequency noise"],
    blur: ["blur gradient", "gaussian blur", "soft blur", "aura gradient", "diffused glow", "blur wallpaper", "ethereal blur", "soft focus backdrop", "gradient blur"],
    frosted: ["frosted glass", "glassmorphism", "frosted blur", "translucent glass", "milky glass", "frosted texture", "glass backdrop", "diffused refraction"],
    none: ["clean gradient", "smooth backdrop", "vector gradient", "minimal gradient"]
  }[currentEffect] || [];

  const base = [
    d.background.toLowerCase(),
    d.style.toLowerCase(),
    d.color.toLowerCase(),
    d.shape.toLowerCase(),
    d.composition.toLowerCase(),
    d.lighting.toLowerCase(),
    d.texture.toLowerCase(),
    d.density.toLowerCase(),
    ...burstTags,
    ...patternTags,
    ...grainTags,
    "background",
    "backdrop",
    "wallpaper",
    "abstract",
    "commercial stock",
    "copy space",
    "usable space",
    "graphic design",
    "digital art",
    "creative asset",
    "banner",
    "marketing",
    "web banner",
    "presentation backdrop",
    "contemporary",
    "minimalist",
    "high resolution",
    `${(d.resolution || "8K").toLowerCase()} resolution`,
    "ultra hd",
    "studio lighting",
    "smooth surface",
    "elegant",
    "modern design",
    "clean background",
    "vector geometric",
    "royalty free",
    "commercial use",
    "print ready",
    "social media background",
    "desktop wallpaper",
    "textured background",
    "vibrant tones",
    "visual concept",
    "poster backdrop",
    "artistic design",
    "commercial stock photography",
    "creative studio",
    "curated stock",
    "decorative pattern",
    "futuristic backdrop",
    "aesthetic background",
    "professional finish"
  ];

  // Extract split words from background, color, and category
  const words = (d.background + " " + d.color + " " + $("category").value).toLowerCase().split(/[\s,&-]+/);
  const combined = [...base, ...words].filter(w => w && w.length > 2);
  const unique = Array.from(new Set(combined)).slice(0, 50);
  return unique.join(", ");
}

// Generate Commercial Rejection Shield / Negative Prompt
function generateNegativePrompt(d) {
  const eff = (d && d.grainEffect) || selectedGrainEffect;
  const isBurst = d && d.background && (d.background.includes("Burst") || d.background.includes("Zoom") || d.background.includes("Rays") || d.background.includes("Warp"));
  const isPattern = d && d.background && (d.background.includes("Pattern") || backgroundCatalog.find(b => b.id === d.background)?.group === "pattern");

  if (isBurst) {
    return "watermark, signature, logo, text typo, jpeg compression artifacts, distorted geometry, ugly seams, oversaturated color banding, cropped frame, copyrighted character, poor lighting";
  } else if (isPattern) {
    return "broken seams, non-repeating tile boundaries, misaligned grid lines, blurred pattern edges, watermark, signature, logo, text typo, jpeg compression artifacts, ugly seams, oversaturated color banding, cropped frame, copyrighted character, poor lighting";
  } else if (eff === "grain" || eff === "noise") {
    return "blurry out of focus lens, watermark, signature, logo, text typo, jpeg compression artifacts, distorted shapes, ugly seams, oversaturated color banding, cropped frame, copyrighted character, poor lighting";
  } else if (eff === "blur") {
    return "harsh gritty noise, pixelated noise artifacts, watermark, signature, logo, text typo, jpeg compression artifacts, ugly seams, oversaturated color banding, cropped frame, copyrighted character, poor lighting";
  }
  return "blurry, low resolution, watermark, signature, logo, text typo, jpeg artifacts, noise grain artifacts, distorted shapes, ugly seams, oversaturated banding, cropped frame, copyrighted character, poor lighting";
}

// Generate Prompt formatted for Target AI Engine
function makePrompt(d) {
  let cat = $("category").value.trim() || "Commercial Stock Background";
  const resInfo = resolutionMap[d.resolution || selectedResolution] || resolutionMap["8K"];
  const grainInfo = grainEffectMap[d.grainEffect || selectedGrainEffect] || grainEffectMap["grain"];
  
  const isBurst = (d.background && (d.background.includes("Burst") || d.background.includes("Zoom") || d.background.includes("Rays") || d.background.includes("Warp"))) ||
                  (d.color && d.color.includes("Burst")) ||
                  ($("category").value.includes("Burst") || $("category").value.includes("Zoom"));

  const isPattern = (d.background && (d.background.includes("Pattern") || backgroundCatalog.find(b => b.id === d.background)?.group === "pattern")) ||
                    ($("category").value.includes("Pattern"));

  const burstPrompt = isBurst 
    ? "dynamic radial zoom blur, explosion of vibrant multi-colored light rays bursting outwards from blazing central white-hot flare core, hyper-speed motion blur streaks, chromatic aberration, glowing rainbow spectrum light trails, neon pink, electric cyan, fiery amber and bright lime laser streaks, futuristic velocity lines, cinematic volumetric starburst, "
    : "";

  const patternPrompt = isPattern 
    ? "seamless repeating tileable pattern, intricate geometric symmetry, clean vector line precision, wallpaper and fabric surface textile motif, modern repeating print, commercial decorative pattern, " 
    : "";

  const basePrompt = `${cat}, ${burstPrompt}${patternPrompt}${d.background.toLowerCase()} background, ${d.style.toLowerCase()} style, ${grainInfo.prompt}, ${d.composition.toLowerCase()} composition, ${d.shape.toLowerCase()} elements, ${d.color.toLowerCase()} palette, ${d.lighting.toLowerCase()} lighting, ${d.texture.toLowerCase()} surface finish, ${d.density.toLowerCase()} visual density, subject placed ${d.position.toLowerCase()}, ${d.orientation.toLowerCase()} orientation, ${$("copySpace").checked ? "usable copy space for commercial text, " : ""}${$("vector").checked ? "clean editable vector geometry, EPS/SVG-friendly, " : ""}commercial stock photography, ${resInfo.prompt}, clean high-quality finish, studio grade, no logos, no watermark, no copyrighted characters`;

  if (selectedAiEngine === "midjourney") {
    const ar = orientationArMap[d.orientation] || "--ar 16:9";
    const tileFlag = (isPattern || d.background.includes("Seamless")) ? " --tile" : "";
    return `${basePrompt} ${ar}${tileFlag} --v 6.1 --stylize 250 --quality 2`;
  } else if (selectedAiEngine === "flux") {
    return `${basePrompt}, photorealistic clarity, clean dynamic range, studio stock finish, raw aesthetic`;
  }
  return basePrompt;
}

function similarity(a, b) {
  const keys = ["style", "composition", "shape", "color", "background", "lighting", "texture", "density", "position", "orientation"];
  let same = keys.reduce((n, k) => n + (a[k] === b[k] ? 1 : 0), 0);
  return Math.round((same / keys.length) * 100);
}

function updateActiveSelectionTag() {
  const parts = [];
  parts.push(engineMap[selectedAiEngine]?.label || "Midjourney");
  parts.push(selectedResolution);
  parts.push(grainEffectMap[selectedGrainEffect]?.label || "Film Grain");
  if (selectedBackgroundFilter !== "ALL") {
    const item = backgroundCatalog.find(x => x.id === selectedBackgroundFilter);
    parts.push(item ? item.label : selectedBackgroundFilter);
  }
  if (selectedPaletteFilter !== "ALL") parts.push(selectedPaletteFilter.split(" to ")[0].split(" & ")[0]);
  
  $("activeSelectionTag").textContent = `Active: ${parts.join(" • ")}`;
}

function generate() {
  const n = Math.min(50, Math.max(1, +$("batch").value || 10));
  const threshold = +$("threshold").value;
  current = [];
  let attempts = 0;

  while (current.length < n && attempts < n * 100) {
    attempts++;
    
    const bgVal = selectedBackgroundFilter !== "ALL" ? selectedBackgroundFilter : pick(pools.background);
    const colorVal = selectedPaletteFilter !== "ALL" ? selectedPaletteFilter : pick(pools.color);

    const d = {
      resolution: selectedResolution,
      grainEffect: selectedGrainEffect,
      style: $("style").value === "Auto Diversity" ? pick(pools.style) : $("style").value,
      composition: pick(pools.composition),
      shape: pick(pools.shape),
      color: colorVal,
      background: bgVal,
      lighting: pick(pools.lighting),
      texture: pick(pools.texture),
      density: pick(pools.density),
      position: pick(pools.position),
      orientation: $("orientation").value === "Auto" ? pick(pools.orientation) : $("orientation").value
    };

    const compare = [...current, ...history.slice(-100)];
    const maxSim = compare.length ? Math.max(...compare.map(x => similarity(d, x))) : 0;

    if (maxSim <= threshold || attempts > n * 70) {
      d.similarity = maxSim;
      d.id = `D-${Date.now().toString().slice(-5)}-${current.length + 1}`;
      d.title = generateTitle(d);
      d.prompt = makePrompt(d);
      d.negativePrompt = generateNegativePrompt(d);
      d.keywords = generateKeywords(d);
      d.cssGradient = generateCssGradient(d.color, d.background, d.style);
      current.push(d);
    }
  }

  history = [...current, ...history].slice(0, 300);
  localStorage.setItem("stockDiversityHistory", JSON.stringify(history));
  
  switchTab("cards");
  render();
  renderHistory();
  showToast(`✦ Generated ${current.length} stock concepts with 50 SEO tags!`);
}

function render() {
  $("empty").style.display = current.length ? "none" : "grid";
  $("cardsCountBadge").textContent = current.length;
  $("results").innerHTML = current.map(d => {
    const isBurst = (d.background && (d.background.includes("Burst") || d.background.includes("Zoom") || d.background.includes("Rays") || d.background.includes("Warp"))) || (d.color && d.color.includes("Burst"));
    const isPattern = (d.background && (d.background.includes("Pattern") || backgroundCatalog.find(b => b.id === d.background)?.group === "pattern")) || (d.color && d.color.includes("Pattern"));
    const burstClass = isBurst ? "has-burst" : "";
    const grainClass = grainEffectMap[d.grainEffect || selectedGrainEffect]?.class || "";
    const grainLabel = grainEffectMap[d.grainEffect || selectedGrainEffect]?.label || "Film Grain";
    return `
    <article class="card">
      <div class="gradient-banner ${burstClass} ${grainClass}" style="background: ${d.cssGradient};" onclick="openInspector('${d.id}')" title="Click to Inspect Fullscreen Mockup">
        <span class="gradient-banner-badge">${esc(d.background)}</span>
        <div class="gradient-banner-actions">
          <button type="button" class="mini-copy-btn" onclick="event.stopPropagation(); copyCss('${d.id}')" title="Copy CSS Code">CSS</button>
          <button type="button" class="mini-copy-btn" onclick="event.stopPropagation(); copyPrompt('${d.id}')" title="Copy Prompt">Prompt</button>
        </div>
      </div>
      <h4 class="card-title-stock" title="${esc(d.title)}">${esc(d.title)}</h4>
      <div class="card-head">
        <span class="id">${d.id}</span>
        <span class="score">${d.similarity || 0}% sim</span>
      </div>
      <div class="dna">
        <b>SIZE:</b> ${esc(d.resolution || '8K')}<br>
        <b>GRAIN:</b> ${esc(grainLabel)}<br>
        <b>BG:</b> ${esc(d.background)}<br>
        <b>COLOR:</b> ${esc(d.color)}
      </div>
      <div class="prompt" title="Click to copy prompt" onclick="copyPrompt('${d.id}')">${esc(d.prompt)}</div>
      
      <!-- Card Action Buttons -->
      <div class="card-actions-bar">
        <button type="button" class="card-act-btn accent" onclick="copyPrompt('${d.id}')" title="Copy AI Prompt">📋 Copy Prompt</button>
        <button type="button" class="card-act-btn" onclick="copyKeywords('${d.id}')" title="Copy 50 SEO Keywords">🏷️ Copy Tags (50)</button>
        <button type="button" class="card-act-btn" onclick="openInspector('${d.id}')" title="Open Live Mockup Canvas">👁️ Inspect</button>
      </div>

      <div class="tags">
        <span class="tag res-tag">${esc(d.resolution || '8K')}</span>
        ${isBurst ? '<span class="tag burst-tag">Zoom Rays</span>' : ''}
        ${isPattern ? '<span class="tag pattern-tag">Pattern</span>' : ''}
        <span class="tag grain-tag">${esc(grainLabel)}</span>
        <span class="tag">${esc(d.orientation)}</span>
      </div>
    </article>
  `;
  }).join("");
}

function renderHistory() {
  $("historyInfo").textContent = `${history.length}`;
  $("uniqueCount").textContent = history.length;
  $("diversityBar").style.width = Math.min(100, (history.length / 3)) + "%";

  $("historyBody").innerHTML = history.slice(0, 80).map((d, i) => {
    const isBurst = (d.background && (d.background.includes("Burst") || d.background.includes("Zoom") || d.background.includes("Rays") || d.background.includes("Warp"))) || (d.color && d.color.includes("Burst"));
    const isPattern = (d.background && (d.background.includes("Pattern") || backgroundCatalog.find(b => b.id === d.background)?.group === "pattern")) || (d.color && d.color.includes("Pattern"));
    const burstClass = isBurst ? "has-burst" : "";
    const grainClass = grainEffectMap[d.grainEffect || 'grain']?.class || "";
    const grainLabel = grainEffectMap[d.grainEffect || 'grain']?.label || "Film Grain";
    return `
    <tr>
      <td>${i + 1}</td>
      <td><span class="history-thumb ${burstClass} ${grainClass}" onclick="openInspector('${d.id}')" style="background: ${d.cssGradient || generateCssGradient(d.color, d.background, d.style)}" title="Inspect Mockup"></span></td>
      <td title="${esc(d.title || '')}">${esc((d.title || d.prompt?.split(",")[0] || "").slice(0, 35))}...</td>
      <td><span class="tag res-tag">${esc(d.resolution || '8K')}</span></td>
      <td><span class="tag grain-tag">${esc(grainLabel)}</span> ${isBurst ? '<span class="tag burst-tag">Zoom Rays</span>' : ''} ${isPattern ? '<span class="tag pattern-tag">Pattern</span>' : ''}</td>
      <td>${esc(d.background)}</td>
      <td>${esc(d.style)}</td>
      <td>${esc(d.color)}</td>
      <td><button type="button" class="small ghost" onclick="copyKeywords('${d.id}')" title="Copy 50 SEO Tags">Copy 50 Tags</button></td>
      <td>${d.similarity || 0}%</td>
      <td><button type="button" class="small ghost" onclick="openInspector('${d.id}')">Inspect</button></td>
    </tr>
  `;
  }).join("");
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

// Toast notification helper
let toastTimeout;
function showToast(message) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

// Tab Switching
function switchTab(tab) {
  if (tab === "cards") {
    $("tabCardsBtn").classList.add("active");
    $("tabHistoryBtn").classList.remove("active");
    $("cardsView").classList.add("active");
    $("historyView").classList.remove("active");
  } else {
    $("tabHistoryBtn").classList.add("active");
    $("tabCardsBtn").classList.remove("active");
    $("historyView").classList.add("active");
    $("cardsView").classList.remove("active");
  }
}

$("tabCardsBtn").onclick = () => switchTab("cards");
$("tabHistoryBtn").onclick = () => switchTab("history");

// AI Engine Selector Listener
function initAiEngineChips() {
  document.querySelectorAll(".engine-chip").forEach(chip => {
    chip.onclick = () => {
      document.querySelectorAll(".engine-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedAiEngine = chip.dataset.engine;
      $("aiEngineLabel").textContent = engineMap[selectedAiEngine]?.label || selectedAiEngine;
      updateActiveSelectionTag();
      // Re-format current batch prompts if exists
      current.forEach(d => { d.prompt = makePrompt(d); });
      render();
      showToast(`Switched target AI engine to ${engineMap[selectedAiEngine]?.label}!`);
    };
  });
}

// Build Resolution Chips Listener
function initResolutionChips() {
  document.querySelectorAll(".res-chip").forEach(chip => {
    chip.onclick = () => {
      document.querySelectorAll(".res-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedResolution = chip.dataset.res;
      $("resolution").value = selectedResolution;
      $("resLabel").textContent = resolutionMap[selectedResolution]?.label || selectedResolution;
      updateActiveSelectionTag();
      generate();
    };
  });
}

// Render Background Buttons based on selected category tab
function renderBackgroundButtons() {
  const container = $("backgroundButtons");
  const filtered = selectedBgCategory === "all" 
    ? backgroundCatalog 
    : backgroundCatalog.filter(x => x.group === selectedBgCategory);

  $("bgCountBadge").textContent = `${filtered.length} Types`;

  container.innerHTML = `
    <button type="button" class="gradient-style-btn ${selectedBackgroundFilter === 'ALL' ? 'active' : ''}" data-bg-id="ALL">
      <span>✨</span> All Types
    </button>
  ` + filtered.map(b => `
    <button type="button" class="gradient-style-btn ${b.id === selectedBackgroundFilter ? 'active' : ''}" data-bg-id="${b.id}">
      <span>${b.icon}</span> ${b.label}
    </button>
  `).join("");

  container.querySelectorAll(".gradient-style-btn").forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll(".gradient-style-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedBackgroundFilter = btn.dataset.bgId;
      updateActiveSelectionTag();
      generate();
    };
  });
}

// Build Background Matrix & Category Tabs
function initBackgroundStudio() {
  document.querySelectorAll(".bg-filter-tab").forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll(".bg-filter-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      selectedBgCategory = tab.dataset.group;
      renderBackgroundButtons();
    };
  });

  renderBackgroundButtons();

  const paletteContainer = $("gradientPaletteButtons");
  const palettes = Object.entries(gradientPresets);
  paletteContainer.innerHTML = palettes.map(([name, css]) => `
    <button type="button" class="gradient-palette-btn ${name === selectedPaletteFilter ? 'active' : ''}" 
      data-palette-name="${esc(name)}" 
      style="background: ${css};" 
      title="${esc(name)}">
      <span class="palette-check">✓</span>
    </button>
  `).join("");

  paletteContainer.querySelectorAll(".gradient-palette-btn").forEach(btn => {
    btn.onclick = () => {
      paletteContainer.querySelectorAll(".gradient-palette-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedPaletteFilter = btn.dataset.paletteName;
      activeGradientCss = gradientPresets[selectedPaletteFilter];
      updateActiveSelectionTag();
      generate();
    };
  });
}

// Fullscreen Mockup Inspector Modal Logic
// Texture Effect Chips Listener
function initTextureChips() {
  document.querySelectorAll(".texture-chip").forEach(chip => {
    chip.onclick = () => {
      document.querySelectorAll(".texture-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedGrainEffect = chip.dataset.grain;
      $("grainEffect").value = selectedGrainEffect;
      $("grainLabel").textContent = grainEffectMap[selectedGrainEffect]?.label || selectedGrainEffect;
      updateActiveSelectionTag();
      generate();
      showToast(`✦ Texture updated to ${grainEffectMap[selectedGrainEffect]?.label}!`);
    };
  });
}

// Fullscreen Mockup Inspector Modal Logic
window.openInspector = function(id) {
  const item = current.find(x => x.id === id) || history.find(x => x.id === id);
  if (!item) return;
  activeInspectedItem = item;

  $("modalDesignId").textContent = item.id;
  $("modalStockTitle").textContent = item.title || generateTitle(item);
  
  const isBurst = (item.background && (item.background.includes("Burst") || item.background.includes("Zoom") || item.background.includes("Rays") || item.background.includes("Warp"))) || (item.color && item.color.includes("Burst"));
  const burstClass = isBurst ? "has-burst" : "";
  const grainClass = grainEffectMap[item.grainEffect || selectedGrainEffect]?.class || "";
  $("modalCanvas").className = `modal-canvas clean ${burstClass} ${grainClass}`;
  $("modalCanvas").style.background = item.cssGradient || generateCssGradient(item.color, item.background, item.style);
  
  document.querySelectorAll(".mockup-btn").forEach(b => b.classList.toggle("active", b.dataset.mockup === "clean"));

  $("modalPromptText").textContent = item.prompt;
  $("modalNegPromptText").textContent = item.negativePrompt || generateNegativePrompt(item);

  const tags = (item.keywords || generateKeywords(item)).split(", ");
  $("modalTagsCloud").innerHTML = tags.map(t => `<span class="seo-tag">${esc(t)}</span>`).join("");

  $("inspectorModal").classList.add("open");
  $("inspectorModal").setAttribute("aria-hidden", "false");
};

window.closeInspector = function() {
  $("inspectorModal").classList.remove("open");
  $("inspectorModal").setAttribute("aria-hidden", "true");
};

// Mockup View Switcher in Modal
document.querySelectorAll(".mockup-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".mockup-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const mode = btn.dataset.mockup;
    const isBurst = (activeInspectedItem?.background && (activeInspectedItem.background.includes("Burst") || activeInspectedItem.background.includes("Zoom") || activeInspectedItem.background.includes("Rays") || activeInspectedItem.background.includes("Warp"))) || (activeInspectedItem?.color && activeInspectedItem.color.includes("Burst"));
    const burstClass = isBurst ? "has-burst" : "";
    const grainClass = grainEffectMap[activeInspectedItem?.grainEffect || selectedGrainEffect]?.class || "";
    $("modalCanvas").className = `modal-canvas ${mode} ${burstClass} ${grainClass}`;
  };
});

// Modal Copy Handlers
$("modalCopyPromptBtn").onclick = async () => {
  if (!activeInspectedItem) return;
  await navigator.clipboard.writeText(activeInspectedItem.prompt);
  showToast("✓ Commercial AI Prompt copied!");
};

$("modalCopyNegBtn").onclick = async () => {
  if (!activeInspectedItem) return;
  await navigator.clipboard.writeText(activeInspectedItem.negativePrompt || generateNegativePrompt(activeInspectedItem));
  showToast("✓ Rejection Shield Negative Prompt copied!");
};

$("modalCopyTagsBtn").onclick = async () => {
  if (!activeInspectedItem) return;
  await navigator.clipboard.writeText(activeInspectedItem.keywords || generateKeywords(activeInspectedItem));
  showToast("✓ 50 SEO Stock Keywords copied!");
};

// Global Copy Helpers
window.copyCss = async function(id) {
  const item = current.find(x => x.id === id) || history.find(x => x.id === id);
  if (!item || !item.cssGradient) return;
  try {
    const cssCode = `background: ${item.cssGradient};`;
    await navigator.clipboard.writeText(cssCode);
    showToast("✓ CSS Background code copied!");
  } catch (err) {
    showToast("Error copying CSS.");
  }
};

window.copyPrompt = async function(id) {
  const item = current.find(x => x.id === id) || history.find(x => x.id === id);
  if (!item) return;
  try {
    await navigator.clipboard.writeText(item.prompt);
    showToast("✓ AI Stock Prompt copied!");
  } catch (err) {
    showToast("Error copying prompt.");
  }
};

window.copyKeywords = async function(id) {
  const item = current.find(x => x.id === id) || history.find(x => x.id === id);
  if (!item) return;
  try {
    const tags = item.keywords || generateKeywords(item);
    await navigator.clipboard.writeText(tags);
    showToast("✓ 50 SEO Keywords copied (Ready for Adobe Stock)!");
  } catch (err) {
    showToast("Error copying tags.");
  }
};

// Reset Filter Button
$("resetGradientFilter").onclick = () => {
  selectedBackgroundFilter = "ALL";
  selectedPaletteFilter = "ALL";
  selectedBgCategory = "all";
  selectedResolution = "8K";
  selectedGrainEffect = "grain";
  selectedAiEngine = "midjourney";
  $("resolution").value = "8K";
  $("grainEffect").value = "grain";
  $("resLabel").textContent = "8K Ultra";
  $("grainLabel").textContent = "Film Grain";
  $("aiEngineLabel").textContent = "Midjourney v6.1";
  document.querySelectorAll(".engine-chip").forEach(c => c.classList.toggle("active", c.dataset.engine === "midjourney"));
  document.querySelectorAll(".res-chip").forEach(c => c.classList.toggle("active", c.dataset.res === "8K"));
  document.querySelectorAll(".texture-chip").forEach(c => c.classList.toggle("active", c.dataset.grain === "grain"));
  document.querySelectorAll(".bg-filter-tab").forEach(t => t.classList.toggle("active", t.dataset.group === "all"));
  renderBackgroundButtons();
  document.querySelectorAll(".gradient-palette-btn").forEach(b => b.classList.remove("active"));
  updateActiveSelectionTag();
  generate();
  showToast("Filters reset to default.");
};

// Apply Active Gradient/Background to the App's Background
let isAppBgCustom = false;
$("applyAppBgBtn").onclick = () => {
  if (!isAppBgCustom) {
    document.body.style.setProperty("--custom-app-bg", activeGradientCss);
    document.body.classList.add("custom-gradient-bg");
    isAppBgCustom = true;
    $("applyAppBgBtn").textContent = "↺ Reset BG";
    showToast("🎨 Applied background to app backdrop!");
  } else {
    document.body.classList.remove("custom-gradient-bg");
    document.body.style.removeProperty("--custom-app-bg");
    isAppBgCustom = false;
    $("applyAppBgBtn").textContent = "🎨 Apply to App";
    showToast("↺ Reverted app background to default mesh.");
  }
};

// Standard Actions
$("generate").onclick = generate;

$("threshold").oninput = () => {
  $("thresholdOut").textContent = $("threshold").value + "%";
};

$("clearHistory").onclick = () => {
  if (confirm("Clear all local design history?")) {
    history = [];
    current = [];
    localStorage.removeItem("stockDiversityHistory");
    render();
    renderHistory();
    showToast("Design history cleared.");
  }
};

$("themeBtn").onclick = () => {
  const isDark = document.body.classList.toggle("dark");
  $("themeBtn").textContent = isDark ? "☼" : "☾";
  showToast(isDark ? "Dark mode active" : "Light mode active");
};

$("copyAll").onclick = async () => {
  if (!current.length) return showToast("Generate a batch first.");
  try {
    await navigator.clipboard.writeText(current.map(x => `TITLE: ${x.title}\nPROMPT: ${x.prompt}\nKEYWORDS: ${x.keywords}\nNEGATIVE: ${x.negativePrompt}`).join("\n\n---\n\n"));
    showToast(`✓ All ${current.length} prompts, titles & 50 tags copied!`);
  } catch (err) {
    showToast("Clipboard access denied.");
  }
};

$("promptBtn").onclick = () => {
  generate();
};

$("exportCsv").onclick = () => {
  if (!history.length) return showToast("No history to export.");
  const cols = ["id", "title", "resolution", "grainEffect", "style", "composition", "shape", "color", "background", "lighting", "texture", "density", "position", "orientation", "similarity", "prompt", "keywords", "negativePrompt", "cssGradient"];
  const csv = [
    cols.join(","),
    ...history.map(x => cols.map(c => `"${String(x[c] ?? "").replaceAll('"', '""')}"`).join(","))
  ].join("\n");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `stock-design-metadata-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("✓ CSV Export downloaded with 50 SEO Tags!");
};

// Category Preset Chip Buttons
document.querySelectorAll(".preset-chip").forEach(chip => {
  chip.onclick = () => {
    document.querySelectorAll(".preset-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    const cat = chip.dataset.cat;
    $("category").value = cat;

    if (chip.dataset.style && $("style")) {
      const matchOpt = Array.from($("style").options).find(opt => opt.value.toLowerCase() === chip.dataset.style.toLowerCase());
      if (matchOpt) $("style").value = matchOpt.value;
    }

    if (chip.dataset.grain) {
      selectedGrainEffect = chip.dataset.grain;
      $("grainEffect").value = selectedGrainEffect;
      $("grainLabel").textContent = grainEffectMap[selectedGrainEffect]?.label || selectedGrainEffect;
      document.querySelectorAll(".texture-chip").forEach(c => {
        c.classList.toggle("active", c.dataset.grain === selectedGrainEffect);
      });
    }

    if (cat.includes("Pattern")) {
      selectedBgCategory = "pattern";
      document.querySelectorAll(".bg-filter-tab").forEach(t => t.classList.toggle("active", t.dataset.group === "pattern"));
      renderBackgroundButtons();
    }

    updateActiveSelectionTag();
    generate();
  };
});

// Initialization
initTextureChips();
initAiEngineChips();
initResolutionChips();
initBackgroundStudio();
updateActiveSelectionTag();
render();
renderHistory();