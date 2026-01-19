// Prayer Times Widget
// Generated Code

// --- STANDARD KONFIGURATION ---
const DEFAULT = {
  city: "Berlin",
  country: "Germany",
  method: 3
};

// --- FARBPALETTE ---
const COLORS = {
  "grün": "#10b981",
  "green": "#10b981",
  "emerald": "#10b981",
  "blau": "#3b82f6",
  "blue": "#3b82f6",
  "türkis": "#06b6d4",
  "cyan": "#06b6d4",
  "rot": "#ef4444",
  "red": "#ef4444",
  "pink": "#ec4899",
  "magenta": "#d946ef",
  "lila": "#8b5cf6",
  "purple": "#8b5cf6",
  "orange": "#f97316",
  "gelb": "#eab308",
  "yellow": "#eab308",
  "grau": "#6b7280",
  "gray": "#6b7280"
};

// Fallback Farbe
let THEME_COLOR_HEX = "#10b981";

// --- PARAMETER LOGIC ---
// Unterstützte Formate: "Stadt", "Stadt, Farbe", "Stadt, Methode", "Stadt, Farbe, Methode"
// Beispiele: "Berlin", "Berlin, Pink", "Berlin, 5", "Berlin, Pink, 5"
/*
 * BERECHNUNGSMETHODEN (API CODES)
 * -------------------------------
 * Verwende diese Nummern für den Parameter 'method' in der Konfiguration
 * oder als drittes Argument im Widget-Parameter (z.B. "Berlin, Grün, 3").
 *
 * 0  - Shia Ithna-Ashari
 * 1  - University of Islamic Sciences, Karachi
 * 2  - Islamic Society of North America (ISNA)
 * 3  - Muslim World League (MWL) -> Standard für Europa/Deutschland
 * 4  - Umm Al-Qura University, Makkah
 * 5  - Egyptian General Authority of Survey
 * 7  - Institute of Geophysics, University of Tehran
 * 8  - Gulf Region
 * 9  - Kuwait
 * 10  - Qatar
 * 11  - Majlis Ugama Islam Singapura, Singapore
 * 12  - Union Organization islamic de France (UOIF)
 * 13  - Diyanet İşleri Başkanlığı, Turkey -> Standard für Türkische Community
 * 14  - Spiritual Administration of Muslims of Russia
 * 15  - Moonsighting Committee Worldwide
 */

let cityParam = DEFAULT.city;

if (args.widgetParameter) {
  const params = args.widgetParameter.split(",");
  
  // 1. Stadt (immer an erster Stelle)
  if (params[0] && params[0].trim() !== "") {
    cityParam = params[0].trim();
  }
  
  // Weitere Parameter flexibel parsen (Farbe oder Methode)
  for (let i = 1; i < params.length; i++) {
    let p = params[i].trim();
    if (p === "") continue;
    
    // Check: Ist es eine Zahl? -> Methode ID
    if (!isNaN(p)) {
      DEFAULT.method = parseInt(p);
      continue;
    }
    
    // Check: Ist es eine Farbe?
    let lowerC = p.toLowerCase();
    if (COLORS[lowerC]) {
      THEME_COLOR_HEX = COLORS[lowerC];
    } else if (lowerC.startsWith("#")) {
      THEME_COLOR_HEX = lowerC;
    }
  }
}

// Colors
const THEME_COLOR = new Color(THEME_COLOR_HEX);
// SAFE Darkening Logic using Hex String Reconstruction
// Avoids "expected string but got number" error in some versions
const BG_TOP = getDarkVariant(THEME_COLOR_HEX, 0.2); 
const BG_BOT = getDarkVariant(THEME_COLOR_HEX, 0.1); 

// Init Widget
const widget = new ListWidget();
const gradient = new LinearGradient();
gradient.colors = [BG_TOP, BG_BOT];
gradient.locations = [0, 1];
widget.backgroundGradient = gradient;

try {
  let now = new Date();
  let data = await fetchPrayerData(now, cityParam);
  let timings = data.timings;
  
  const ishaStr = timings['Isha'].split(' ')[0];
  const [h, m] = ishaStr.split(':').map(Number);
  const ishaDate = new Date(now);
  ishaDate.setHours(h, m, 0, 0);
  
  let isNextDay = false;
  if (now > ishaDate) {
     const tomorrow = new Date(now);
     tomorrow.setDate(tomorrow.getDate() + 1);
     data = await fetchPrayerData(tomorrow, cityParam);
     timings = data.timings;
     isNextDay = true;
  }
  
  const hijri = data.date.hijri;
  let next;
  if (isNextDay) {
     next = { name: 'Fajr', time: timings['Fajr'].split(' ')[0] };
  } else {
     next = getNextPrayerToday(timings);
  }
  
  // --- RESPONSIVE UI ---
  const family = config.widgetFamily || "medium";
  
  if (family === 'small') {
      renderSmall(widget, next, timings);
  } else {
      renderMedium(widget, next, timings, hijri, cityParam);
  }
  
  widget.refreshAfterDate = new Date(Date.now() + 60 * 60 * 1000);

} catch (e) {
  widget.addText("Err: " + e.message).textColor = Color.red();
}

Script.setWidget(widget);
Script.complete();

if (config.runsInApp) {
    if ("medium" === "small") {
        widget.presentSmall();
    } else {
        widget.presentMedium();
    }
}

// --- RENDER FUNCTIONS ---

function renderSmall(w, next, timings) {
    w.setPadding(12, 12, 12, 12);
    
    const topStack = w.addStack();
    topStack.layoutVertically();
    topStack.centerAlignContent(); 
    
    const nextLabel = topStack.addText("NÄCHSTES GEBET: " + mapName(next.name).toUpperCase());
    nextLabel.font = Font.boldSystemFont(9);
    nextLabel.textColor = THEME_COLOR;
    nextLabel.centerAlignText();
    
    const nextTime = topStack.addText(next.time);
    nextTime.font = Font.boldSystemFont(32); 
    nextTime.textColor = Color.white();
    nextTime.centerAlignText();
    
    w.addSpacer(8);
    
    const listStack = w.addStack();
    listStack.layoutVertically();
    
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    
    for (let pName of prayers) {
        const pTime = timings[pName].split(' ')[0];
        const isActive = (pName === next.name);
        
        const row = listStack.addStack();
        row.layoutHorizontally();
        
        const nameT = row.addText(mapName(pName));
        nameT.font = isActive ? Font.boldSystemFont(9) : Font.systemFont(9);
        nameT.textColor = isActive ? THEME_COLOR : new Color("#888888");
        
        row.addSpacer();
        
        const timeT = row.addText(pTime);
        timeT.font = isActive ? Font.boldSystemFont(9) : Font.systemFont(9);
        timeT.textColor = isActive ? Color.white() : new Color("#cccccc");
        
        listStack.addSpacer(2);
    }
}

function renderMedium(w, next, timings, hijri, cityName) {
  const headerStack = w.addStack();
  headerStack.layoutHorizontally();
  headerStack.topAlignContent(); 
  
  const infoStack = headerStack.addStack();
  infoStack.layoutVertically();
  
  const cityText = infoStack.addText(String(cityName));
  cityText.font = Font.boldSystemFont(14);
  cityText.textColor = Color.white();
  
  const hijriText = infoStack.addText(`${hijri.day} ${hijri.month.en}`);
  hijriText.font = Font.systemFont(10);
  hijriText.textColor = THEME_COLOR;
  
  headerStack.addSpacer();
  
  const nextStack = headerStack.addStack();
  nextStack.layoutVertically();
  nextStack.bottomAlignContent(); 
  
  const nextLabel = nextStack.addText("NÄCHSTES GEBET: " + mapName(next.name).toUpperCase());
  nextLabel.font = Font.boldSystemFont(10);
  nextLabel.textColor = THEME_COLOR;
  nextLabel.rightAlignText();
  
  const nextTime = nextStack.addText(next.time);
  nextTime.font = Font.boldSystemFont(46);
  nextTime.textColor = Color.white();
  nextTime.rightAlignText();
  
  w.addSpacer();
  
  const listStack = w.addStack();
  listStack.layoutHorizontally();
  listStack.centerAlignContent();
  
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  
  for (let i = 0; i < prayers.length; i++) {
    const pName = prayers[i];
    const pTime = timings[pName].split(' ')[0];
    const isActive = (pName === next.name);
    addPrayerItem(listStack, pName, pTime, isActive);
    if (i < prayers.length - 1) listStack.addSpacer();
  }
}

// --- HELPERS ---

async function fetchPrayerData(dateObj, city) {
  const dateStr = `${dateObj.getDate()}-${dateObj.getMonth()+1}-${dateObj.getFullYear()}`;
  
  let c = encodeURI(String(city));
  let co = encodeURI(String(DEFAULT.country));
  let m = String(DEFAULT.method);
  
  const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${c}&country=${co}&method=${m}&school=1`;
  const req = new Request(url);
  return (await req.loadJSON()).data;
}

function getNextPrayerToday(timings) {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const order = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  for (let name of order) {
    const timeStr = timings[name].split(' ')[0];
    const [h, m] = timeStr.split(':').map(Number);
    const mins = h * 60 + m;
    if (mins > currentMins) return { name: name, time: timeStr };
  }
  return { name: 'Fajr', time: timings['Fajr'].split(' ')[0] };
}

function addPrayerItem(stack, name, time, isActive) {
  const itemStack = stack.addStack();
  itemStack.layoutVertically();
  itemStack.centerAlignContent();
  
  const nameTxt = itemStack.addText(mapName(name));
  nameTxt.font = isActive ? Font.boldSystemFont(9) : Font.systemFont(9);
  nameTxt.textColor = isActive ? THEME_COLOR : new Color("#888888");
  nameTxt.centerAlignText();
  itemStack.addSpacer(2);
  const timeStack = itemStack.addStack();
  if (isActive) {
    timeStack.backgroundColor = new Color("#ffffff", 0.15); 
    timeStack.cornerRadius = 4;
    timeStack.setPadding(2, 4, 2, 4);
  }
  const timeTxt = timeStack.addText(time);
  timeTxt.font = isActive ? Font.boldSystemFont(11) : Font.mediumSystemFont(11);
  timeTxt.textColor = isActive ? Color.white() : new Color("#cccccc");
}

function mapName(key) {
  const map = { "Fajr": "Fajr", "Sunrise": "Shuruk", "Dhuhr": "Dhuhr", "Asr": "Asr", "Maghrib": "Maghrib", "Isha": "Isha" };
  return map[key] || key;
}

function getDarkVariant(hex, factor) {
   let c = new Color(hex);
   let r = Math.floor(c.red * factor * 255);
   let g = Math.floor(c.green * factor * 255);
   let b = Math.floor(c.blue * factor * 255);
   let toHex = (n) => ("0" + n.toString(16)).slice(-2);
   return new Color("#" + toHex(r) + toHex(g) + toHex(b));
}
