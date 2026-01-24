// Prayer Times Widget
// Generated Code

const DEFAULT = {
  city: "Berlin",
  country: "Germany",
  method: 3,
  school: 1
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
let cityParam = DEFAULT.city;

if (args.widgetParameter) {
  const params = args.widgetParameter.split(",");
  if (params[0] && params[0].trim() !== "") {
    cityParam = params[0].trim();
  }
  
  let methodFound = false;

  for (let i = 1; i < params.length; i++) {
    let p = params[i].trim();
    if (p === "") continue;

    if (!isNaN(p)) {
      if (!methodFound) {
        DEFAULT.method = parseInt(p);
        methodFound = true;
      } else {
        DEFAULT.school = parseInt(p);
      }
      continue;
    }

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
  
  // 1. Prepare Rectangular Data (Current + 2)
  let rectList = await getRectangularSequence(now, cityParam, data);

  // 2. Prepare Standard Data (Next Prayer)
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
  } else if (family === 'accessoryRectangular') {
      // Lockscreen Rechteck
      renderRectangular(widget, rectList);
  } else if (family === 'accessoryCircular') {
      // Lockscreen Rund
      renderCircular(widget, next);
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

// 1. LOCKSCREEN RECTANGULAR
function renderRectangular(w, list) {
    // List contains 3 items: {name, time, icon}

    // Use a vertical stack for 3 rows
    const mainStack = w.addStack();
    mainStack.layoutVertically();
    mainStack.centerAlignContent(); // Vertically center in the widget

    for (let item of list) {
        const row = mainStack.addStack();
        row.layoutHorizontally();
        row.centerAlignContent(); // Align icon and text vertically

        // Icon
        const iconSym = SFSymbol.named(item.icon);
        const iconImg = row.addImage(iconSym.image);
        iconImg.imageSize = new Size(12, 12);
        iconImg.tintColor = Color.white();

        row.addSpacer(6);

        // Name
        const nameTxt = row.addText(mapName(item.name));
        nameTxt.font = Font.systemFont(13);
        nameTxt.textColor = Color.white();

        row.addSpacer(); // Push time to the right

        // Time
        const timeTxt = row.addText(item.time);
        timeTxt.font = new Font("Menlo", 13); // Monospace for alignment
        timeTxt.textColor = new Color("#ffffff", 0.8);

        // Add minimal spacing between rows
        mainStack.addSpacer(2);
    }
}

// 2. LOCKSCREEN CIRCULAR
function renderCircular(w, next) {
    const stack = w.addStack();
    stack.layoutVertically();
    stack.centerAlignContent();

    const t = stack.addText(next.time);
    t.font = Font.boldSystemFont(12);
    t.minimumScaleFactor = 0.5;
    t.textColor = Color.white();
    t.centerAlignText();

    const n = stack.addText(mapName(next.name));
    n.font = Font.systemFont(8);
    n.textColor = Color.white();
    n.centerAlignText();
}

// 3. HOMESCREEN SMALL
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

// 4. HOMESCREEN MEDIUM
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
  let s = String(DEFAULT.school);
  
  const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${c}&country=${co}&method=${m}&school=${s}`;
  const req = new Request(url);
  return (await req.loadJSON()).data;
}

async function getRectangularSequence(now, city, todayData) {
   const order = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
   let timings = todayData.timings;
   let nowMins = now.getHours() * 60 + now.getMinutes();

   function getMins(t) { return parseInt(t.split(':')[0])*60 + parseInt(t.split(':')[1]); }

   let idx = -1;
   for(let i=0; i<order.length; i++) {
       if (nowMins >= getMins(timings[order[i]].split(' ')[0])) {
           idx = i;
       }
   }

   let result = [];

   // Current
   if (idx === -1) {
       let yDate = new Date(now);
       yDate.setDate(now.getDate() - 1);
       let yData = await fetchPrayerData(yDate, city);
       result.push({ name: 'Isha', time: yData.timings['Isha'].split(' ')[0], icon: 'moon.stars.fill' });
   } else {
       result.push({ name: order[idx], time: timings[order[idx]].split(' ')[0], icon: getIcon(order[idx]) });
   }

   // +1
   if (idx + 1 < order.length) {
        result.push({ name: order[idx+1], time: timings[order[idx+1]].split(' ')[0], icon: getIcon(order[idx+1]) });
   } else {
        let tDate = new Date(now);
        tDate.setDate(now.getDate() + 1);
        let tData = await fetchPrayerData(tDate, city);
        result.push({ name: order[0], time: tData.timings[order[0]].split(' ')[0], icon: getIcon(order[0]) });
   }

   // +2
   if (idx + 2 < order.length) {
        result.push({ name: order[idx+2], time: timings[order[idx+2]].split(' ')[0], icon: getIcon(order[idx+2]) });
   } else {
        let tIdx = (idx + 2) - order.length;
        let tDate = new Date(now);
        tDate.setDate(now.getDate() + 1);
        let tData = await fetchPrayerData(tDate, city);
        result.push({ name: order[tIdx], time: tData.timings[order[tIdx]].split(' ')[0], icon: getIcon(order[tIdx]) });
   }

   return result;
}

function getIcon(name) {
   const map = {
       Fajr: 'sunrise.fill',
       Sunrise: 'sun.haze.fill',
       Dhuhr: 'sun.max.fill',
       Asr: 'sun.min.fill',
       Maghrib: 'sunset.fill',
       Isha: 'moon.stars.fill'
   };
   return map[name] || 'clock';
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
