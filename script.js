let recentSearches = [];

const cityInput        = document.getElementById("city-input");
const searchBtn        = document.getElementById("search-btn");
const weatherContainer = document.getElementById("weather-container");
const recentList       = document.getElementById("recent-list");

async function getCoordinates(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;
    const response = await fetch(url);

    if (!response.ok) throw new Error("Could not reach geocoding service");

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error(`City "${city}" not found. Try another name.`);
    }

    return {
        name:      data.results[0].name,
        country:   data.results[0].country,
        latitude:  data.results[0].latitude,
        longitude: data.results[0].longitude
    };
}


async function getWeather(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Could not fetch weather data");

    return await response.json();
}

function getWeatherCondition(code) {
    if (code === 0)  return "☀️ Clear Sky";
    if (code <= 2)   return "🌤️ Partly Cloudy";
    if (code === 3)  return "☁️ Overcast";
    if (code <= 49)  return "🌫️ Foggy";
    if (code <= 59)  return "🌦️ Drizzle";
    if (code <= 69)  return "🌧️ Rainy";
    if (code <= 79)  return "❄️ Snowy";
    if (code <= 82)  return "🌦️ Rain Showers";
    if (code === 95) return "⛈️ Thunderstorm";
    return "❓ Unknown";
}

function displayWeather(locationInfo, weatherData) {
    const current   = weatherData.current;
    const condition = getWeatherCondition(current.weather_code);

    weatherContainer.innerHTML = `
        <div class="weather-card">
            <div class="city-name">
                ${locationInfo.name}, ${locationInfo.country}
            </div>
            <div class="temperature">
                ${Math.round(current.temperature_2m)}°C
            </div>
            <div class="condition">${condition}</div>
            <div class="details">
                <div class="detail-item">
                    Wind Speed
                    <span>${current.wind_speed_10m} km/h</span>
                </div>
                <div class="detail-item">
                    Humidity
                    <span>${current.relative_humidity_2m}%</span>
                </div>
            </div>
        </div>
    `;
}

function updateRecentSearches(cityName) {
    recentSearches = recentSearches.filter(c => c !== cityName);
    recentSearches.unshift(cityName);
    recentSearches = recentSearches.slice(0, 5);

    recentList.innerHTML = recentSearches.map(city => `
        <button class="recent-tag" onclick="searchCity('${city}')">
            ${city}
        </button>
    `).join("");
}
async function searchCity(cityName) {
    const city = cityName || cityInput.value.trim();

    if (!city) return;

    weatherContainer.innerHTML = `
        <p class="loading-text">Loading weather for ${city}...</p>
    `;

    try {
        const locationInfo = await getCoordinates(city);

        const weatherData = await getWeather(
            locationInfo.latitude,
            locationInfo.longitude
        );

        displayWeather(locationInfo, weatherData);
        updateRecentSearches(locationInfo.name);

       
        cityInput.value = "";

    } catch (error) {
        weatherContainer.innerHTML = `
            <p class="error-text">${error.message}</p>
        `;
    }
}

searchBtn.addEventListener("click", () => searchCity());


cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchCity();
});

searchCity("Lahore");