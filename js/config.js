const MAP_W = 360;
const MAP_H = 200;
const TOP_BAR = 44;

const SPEED_OPTIONS = [0.5, 1, 2, 4];

const DEFAULT_BOT_COUNT = 10;
const MAX_BOTS = 20;

const BOT_START_ID = 2;

const WARMUP_SECONDS = 10;
const AI_SPAWN_MIN_DELAY = 1.5;
const AI_SPAWN_MAX_DELAY = 9.0;
const MIN_SPAWN_DISTANCE = 22;

const PLAYER_INITIAL_MONEY = 170;

const WATER = 0;
const LAND = 1;
const FOREST = 2;
const HILL = 3;

const NEUTRAL = 0;
const RED = 1;
const BLUE = 2;

const DEFAULT_PLAYER_NAME = "Player";
const DEFAULT_PLAYER_COLOR = "#d63434";

const CITY_BUILD_COST = 90;
const TROOP_COST = 55;
const TROOP_AMOUNT = 80;
const MIN_CITY_DISTANCE = 12;
const UNIT_MERGE_RANGE = 1.15;
const UNIT_MERGE_COOLDOWN = 1.5;
const FRONTLINE_CLICK_RADIUS = 45;
const FRONTLINE_LINE_WIDTH = 8;
const RETREAT_DISENGAGE_TIME = 0.8;
const RETREAT_DAMAGE_PER_SECOND = 2.0;
const RETREAT_SPEED_MULTIPLIER = 1.25;

const CITY_CAPTURE_RADIUS = 4.5;
const CITY_CAPTURE_TIME = 7;

const CITY_PASSIVE_EXPANSION_INTERVAL = 0.25;
const CITY_PASSIVE_EXPANSION_RADIUS = 25;
const CITY_PASSIVE_EXPANSION_POWER = 5.5;

const NEUTRAL_CLAIM_THRESHOLD = 8;
const ENEMY_CLAIM_THRESHOLD = 12;

const UNIT_ENGAGE_RANGE = 6;
const UNIT_DAMAGE = 4.5;
const AI_NEUTRAL_SEARCH_RADIUS = 55;
const AI_NEUTRAL_PRIORITY_CHANCE = 0.90;

const players = {};

const STORAGE_PLAYER_NAME_KEY = "warcell.playerName";
const STORAGE_PLAYER_COLOR_KEY = "warcell.playerColor";
const STORAGE_BOT_COUNT_KEY = "warcell.botCount";
const STORAGE_WARMUP_KEY = "warcell.warmup";

function resetPlayers(botCount, playerName = DEFAULT_PLAYER_NAME, playerColor = DEFAULT_PLAYER_COLOR) {
  for (const key of Object.keys(players)) {
    delete players[key];
  }

  players[NEUTRAL] = {
    id: NEUTRAL,
    name: "Neutral",
    color: "#9fb85d",
    dark: "#222",
    money: 0,
    isBot: false
  };

  players[RED] = {
  id: RED,
  name: playerName || DEFAULT_PLAYER_NAME,
  color: playerColor || DEFAULT_PLAYER_COLOR,
  dark: darkenHex(playerColor || DEFAULT_PLAYER_COLOR, 0.55),
  money: PLAYER_INITIAL_MONEY,
  isBot: false,
  eliminated: false
};

  for (let i = 0; i < botCount; i++) {
    const id = BOT_START_ID + i;
    const color = BOT_COLORS[i % BOT_COLORS.length];

    players[id] = {
      id,
      name: BOT_NAMES[i % BOT_NAMES.length],
      color,
      dark: darkenHex(color, 0.55),
      money: PLAYER_INITIAL_MONEY,
      isBot: true,
      eliminated: false
    };
  }
}

const BOT_COLORS = [
  "#367dff", "#34c759", "#ff9f0a", "#af52de", "#ff375f",
  "#64d2ff", "#ffd60a", "#bf5af2", "#30d158", "#ff453a",
  "#0a84ff", "#5e5ce6", "#ff7a00", "#00c7be", "#a2845e",
  "#ff2d55", "#8e8e93", "#32d74b", "#40c8e0", "#f5c542"
];

const BOT_NAMES = [
  "Bluvia", "Grevia", "Orania", "Purpia", "Crimson",
  "Cyanor", "Goldmark", "Violeta", "Emerald", "Scarlet",
  "Azure", "Indigo", "Amber", "Tealia", "Bronzia",
  "Rosehold", "Ironland", "Viridia", "Aquilon", "Sunreach"
];

function darkenHex(hex, amount) {
  const n = parseInt(hex.replace("#", ""), 16);

  const r = Math.floor(((n >> 16) & 255) * amount);
  const g = Math.floor(((n >> 8) & 255) * amount);
  const b = Math.floor((n & 255) * amount);

  return `rgb(${r}, ${g}, ${b})`;
}

resetPlayers(DEFAULT_BOT_COUNT);