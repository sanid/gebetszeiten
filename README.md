# 🕌 Gebetszeiten.live

[gebetszeiten.live](https://gebetszeiten.live):

Eine moderne, responsive Web-Anwendung zur Anzeige präziser islamischer Gebetszeiten für jeden Standort weltweit. Entwickelt mit einem "Mobile-First"-Ansatz, speichert die App Benutzereinstellungen lokal und benötigt kein komplexes Backend.

## ✨ Funktionen

* **📍 Automatische Standorterkennung:** Nutzt Browser-Geolocation oder IP-Fallback, um den Standort des Nutzers zu ermitteln.
* **🔍 Manuelle Suche:** Integrierte Suche für Städte weltweit (via OpenStreetMap/Nominatim).
* **⏱️ Live Countdown:** Zeigt die verbleibende Zeit bis zum nächsten Gebet an.
* **📅 Monatsübersicht:** Vollständiger Kalender mit Navigation zwischen den Monaten.
* **⚙️ Anpassbare Berechnungsmethoden:** Unterstützung verschiedener Berechnungsmethoden (z.B. Muslim World League, ISNA, Diyanet, etc.).
* **🌙 Intelligente Status-Anzeige:**
    * Hervorhebung des aktuellen Gebetszeitraums.
    * Spezielle Logik für **Fajr**: Der Status wechselt nach Sonnenaufgang direkt zum nächsten Gebet (Dhuhr), da das Fajr-Gebet mit dem Sonnenaufgang endet.
* **📱 PWA-Optimiert:** Optimiert für mobile Geräte (App-Icon, Theme-Color, Touch-Events) und kann zum Startbildschirm hinzugefügt werden.
* **💾 Datensparsamkeit:** Speichert Standort und Einstellungen im `localStorage` des Browsers.

## 🛠️ Technologien

Das Projekt wurde als **Single-File-Application** entwickelt, um maximale Portabilität und Einfachheit zu gewährleisten.

* **HTML5 & Vanilla JavaScript (ES6+):** Keine Frameworks, reiner Code.
* **Tailwind CSS (via CDN):** Für modernes, responsives Styling und Dark-Mode Ästhetik.
* **FontAwesome:** Für Icons.
* **APIs:**
    * [Aladhan API](https://aladhan.com/prayer-times-api): Für Gebetsdaten und Hijri-Kalender.
    * [Nominatim (OpenStreetMap)](https://nominatim.org/): Für Geocoding und Ortssuche.
    * [ipwho.is](https://ipwho.is/): Als Fallback für die Standorterkennung.

## ⚙️ Konfiguration

Die App erlaubt dem Nutzer, die Berechnungsmethode zu ändern. Standardmäßig ist die **Muslim World League** eingestellt. Dies kann über das Zahnrad-Icon ⚙️ geändert werden.

Unterstützte Methoden u.a.:
* Muslim World League
* ISNA (North America)
* Umm Al-Qura (Makkah)
* Diyanet (Türkei)
* und viele mehr.

## 📄 Lizenz

Dieses Projekt ist unter der MIT Lizenz veröffentlicht. Fühle dich frei, es zu nutzen und anzupassen.

---

**Hinweis:** Die Gebetszeiten basieren auf mathematischen Berechnungen der Aladhan API. Für exakte lokale Zeiten (insbesondere im Ramadan) wird empfohlen, sich zusätzlich an den Zeiten der lokalen Moschee zu orientieren.
