# Weather-Dashboard
A modern, cross-platform weather application rearchitected from a legacy web app to a high-performance React Native (Expo) mobile experience.

## Key Features & Rearchitecture
- **Cross-Platform Mobile App:** Rebuilt the legacy jQuery frontend into a modern React Native application using the **Expo** framework for iOS and Android deployment.
- **Real-time Autocomplete:** Implemented a robust city search with real-time suggestions using the **OpenWeatherMap Geocoding API**, significantly improving search accuracy and user experience.
- **Intelligent Notifications:** Integrated `expo-notifications` to support daily weather summaries and instant alerts for sudden condition changes.
- **Automated Background Tasks:** Developed a background fetch service using `expo-task-manager` that periodically monitors local weather and pushes alerts for severe conditions (storms, air quality).
- **Secure API Management:** Sanitized legacy code by moving sensitive API keys to environment variables and configuring a secure build-time injection.
- **CI/CD Optimization:** Configured Netlify for automated builds of the Expo web export, upgrading the environment to **Node.js 22** for optimal performance.

## How to Use
1. **Search:** Enter a city name (e.g., "Fresno").
2. **Select:** Tap the correct city from the real-time autocomplete dropdown.
3. **Alerts:** Enable notifications to receive daily summaries and severe weather warnings.

## Deployment & Links 
- **Live Web App:** [https://weather-dashboard-mso.netlify.app/](https://weather-dashboard-mso.netlify.app/)
- **Built With:**
  - React Native (Expo)
  - TypeScript
  - Axios (Data Fetching)
  - OpenWeatherMap API (One Call 3.0 & Geocoding)
  - Netlify (CI/CD)

## Screenshots
*Coming soon*

---
*Project originally developed in 2020; overhauled and modernized in 2026.*
