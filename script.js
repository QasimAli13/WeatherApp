let recentSearches = [];
let temperatureUnit = "C";
let currentTemperature = null;

let favoriteCities = JSON.parse(localStorage.getItem("favoriteCities")) || [];

const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");

const weatherContainer = document.getElementById("weather-container");

const recentList = document.getElementById("recent-list");

const favoriteList = document.getElementById("favorite-list");

async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not reach geocoding service");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`City "${city}" not found. Try another name.`);
  }

  return {
    name: data.results[0].name,
    country: data.results[0].country,
    latitude: data.results[0].latitude,
    longitude: data.results[0].longitude,
  };
}

async function getWeather(latitude, longitude) {
  const url =
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,apparent_temperature,` +
    `wind_speed_10m,relative_humidity_2m,pressure_msl,` +
    `visibility,weather_code` +
    `&hourly=temperature_2m,weather_code,` +
    `precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,` +
    `temperature_2m_min,sunrise,sunset` +
    `&timezone=auto`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not fetch weather data");
  }

  return await response.json();
}

function getWeatherCondition(code) {
  if (code === 0) return "☀️ Clear Sky";
  if (code <= 2) return "🌤️ Partly Cloudy";
  if (code === 3) return "☁️ Overcast";
  if (code <= 49) return "🌫️ Foggy";
  if (code <= 59) return "🌦️ Drizzle";
  if (code <= 69) return "🌧️ Rainy";
  if (code <= 79) return "❄️ Snowy";
  if (code <= 82) return "🌦️ Rain Showers";
  if (code === 95) return "⛈️ Thunderstorm";

  return "❓ Unknown";
}

function generateWeatherInsights(weatherData) {
  const current = weatherData.current;

  const temperature = current.temperature_2m;
  const windSpeed = current.wind_speed_10m;
  const humidity = current.relative_humidity_2m;
  const weatherCode = current.weather_code;

  const insights = [];

  if (temperature >= 35) {
    insights.push(
      "🌡️ Very hot weather. Stay hydrated and avoid prolonged sun exposure.",
    );
  } else if (temperature >= 30) {
    insights.push(
      "☀️ It's quite warm today. Stay hydrated if you're going outside.",
    );
  } else if (temperature <= 5) {
    insights.push(
      "🥶 Very cold weather. Wear warm clothing before going outside.",
    );
  }

  if (
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82)
  ) {
    insights.push(
      "🌧️ Rain is currently affecting the area. Consider carrying an umbrella.",
    );
  }

  if (weatherCode >= 95) {
    insights.push(
      "⛈️ Thunderstorm conditions detected. Avoid unnecessary outdoor activities.",
    );
  }

  if (windSpeed >= 40) {
    insights.push(
      "💨 Strong winds detected. Be careful when travelling outdoors.",
    );
  } else if (windSpeed >= 25) {
    insights.push(
      "🌬️ Moderate winds are present. Outdoor conditions may feel breezy.",
    );
  }

  if (humidity >= 80) {
    insights.push("💧 High humidity may make the temperature feel warmer.");
  }

  if (
    temperature >= 15 &&
    temperature <= 28 &&
    windSpeed < 25 &&
    humidity < 80 &&
    weatherCode <= 3
  ) {
    insights.push(
      "✨ Weather conditions look comfortable. A good time for outdoor activities.",
    );
  }

  if (insights.length === 0) {
    insights.push("🌤️ Weather conditions are fairly normal today.");
  }

  return insights;
}

function displayWeatherInsights(weatherData) {
  const insightsList = document.getElementById("insights-list");

  if (!insightsList) return;

  const insights = generateWeatherInsights(weatherData);

  insightsList.innerHTML = insights
    .map(
      (insight) => `
                <div class="insight-item">
                    ${insight}
                </div>
            `,
    )
    .join("");
}

function displayWeather(locationInfo, weatherData) {
  const current = weatherData.current;

  currentTemperature = current.temperature_2m;
  temperatureUnit = "C";
  const hourly = weatherData.hourly;
  const daily = weatherData.daily;

  const condition = getWeatherCondition(current.weather_code);

  weatherContainer.innerHTML = `
        <div class="weather-card">

            <div class="city-header">
                <div class="city-name">
                    ${locationInfo.name}, ${locationInfo.country}
                </div>

                <button
                    class="favorite-btn"
                    onclick="addFavorite('${locationInfo.name}')"
                    title="Add to favorites"
                >
                    ☆
                </button>
            </div>

           <div class="temperature">
    <span id="temperature-value">
        ${Math.round(current.temperature_2m)}°C
    </span>

    <button
        id="unit-toggle"
        onclick="toggleTemperatureUnit()"
    >
        °F
    </button>
</div>

            <div class="condition">
                ${condition}
            </div>

            <div class="details">
                <div class="detail-item">
                    Feels Like
                    <span>
                        ${Math.round(current.apparent_temperature)}°C
                    </span>
                </div>

                <div class="detail-item">
                    Wind
                    <span>
                        ${current.wind_speed_10m} km/h
                    </span>
                </div>

                <div class="detail-item">
                    Humidity
                    <span>
                        ${current.relative_humidity_2m}%
                    </span>
                </div>

                <div class="detail-item">
                    Pressure
                    <span>
                        ${Math.round(current.pressure_msl)} hPa
                    </span>
                </div>

                <div class="detail-item">
                    Visibility
                    <span>
                        ${(current.visibility / 1000).toFixed(1)} km
                    </span>
                </div>
            </div>

            <div class="hourly-section">
                <h3>Hourly Forecast</h3>

                <div class="hourly-list">
                    ${hourly.time
                      .slice(0, 12)
                      .map(
                        (time, index) => `
                                <div class="hourly-item">
                                    <span>
                                        ${new Date(time).getHours()}:00
                                    </span>

                                    <span>
                                        ${getWeatherCondition(
                                          hourly.weather_code[index],
                                        )}
                                    </span>

                                    <strong>
                                        ${Math.round(
                                          hourly.temperature_2m[index],
                                        )}°C
                                    </strong>

                                    <small>
                                        ${hourly.precipitation_probability[index]}% rain
                                    </small>
                                </div>
                            `,
                      )
                      .join("")}
                </div>
            </div>
            <div class="sun-section">
    <h3>Sunrise & Sunset</h3>

    <div class="sun-times">
        <div class="sun-item">
            🌅 Sunrise
            <strong>
                ${new Date(daily.sunrise[0]).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
            </strong>
        </div>

        <div class="sun-item">
            🌇 Sunset
            <strong>
                ${new Date(daily.sunset[0]).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
            </strong>
        </div>
    </div>
</div>

            <div class="daily-section">
                <h3>7-Day Forecast</h3>

                <div class="daily-list">
                    ${daily.time
                      .map(
                        (date, index) => `
                                <div class="daily-item">
                                    <span>
                                        ${new Date(date).toLocaleDateString(
                                          "en-US",
                                          {
                                            weekday: "short",
                                          },
                                        )}
                                    </span>

                                    <span>
                                        ${getWeatherCondition(
                                          daily.weather_code[index],
                                        )}
                                    </span>

                                    <strong>
                                        ${Math.round(
                                          daily.temperature_2m_max[index],
                                        )}°C
                                    </strong>

                                    <small>
                                        ${Math.round(
                                          daily.temperature_2m_min[index],
                                        )}°C
                                    </small>
                                </div>
                            `,
                      )
                      .join("")}
                </div>
            </div>

        </div>
    `;

  // This function must run after the weather HTML is created.
  displayWeatherInsights(weatherData);
}

function toggleTemperatureUnit() {
  if (currentTemperature === null) return;

  const temperatureElement = document.getElementById("temperature-value");

  const toggleButton = document.getElementById("unit-toggle");

  if (temperatureUnit === "C") {
    const fahrenheit = (currentTemperature * 9) / 5 + 32;

    temperatureElement.textContent = `${Math.round(fahrenheit)}°F`;

    toggleButton.textContent = "°C";

    temperatureUnit = "F";
  } else {
    temperatureElement.textContent = `${Math.round(currentTemperature)}°C`;

    toggleButton.textContent = "°F";

    temperatureUnit = "C";
  }
}
function updateRecentSearches(cityName) {
  recentSearches = recentSearches.filter((city) => city !== cityName);

  recentSearches.unshift(cityName);
  recentSearches = recentSearches.slice(0, 5);

  recentList.innerHTML = recentSearches
    .map(
      (city) => `
                <button
                    class="recent-tag"
                    onclick="searchCity('${city}')"
                >
                    ${city}
                </button>
            `,
    )
    .join("");
}

function updateFavoriteCities() {
  if (favoriteCities.length === 0) {
    favoriteList.innerHTML = `
            <p class="empty-favorites">
                No favorite cities yet.
            </p>
        `;

    return;
  }

  favoriteList.innerHTML = favoriteCities
    .map(
      (city) => `
                <div class="favorite-item">
                    <button
                        class="favorite-city"
                        onclick="searchCity('${city}')"
                    >
                        ${city}
                    </button>

                    <button
                        class="remove-favorite"
                        onclick="removeFavorite('${city}')"
                        aria-label="Remove ${city}"
                    >
                        ×
                    </button>
                </div>
            `,
    )
    .join("");
}

function addFavorite(cityName) {
  if (favoriteCities.includes(cityName)) {
    return;
  }

  favoriteCities.push(cityName);

  localStorage.setItem("favoriteCities", JSON.stringify(favoriteCities));

  updateFavoriteCities();
}

function removeFavorite(cityName) {
  favoriteCities = favoriteCities.filter((city) => city !== cityName);

  localStorage.setItem("favoriteCities", JSON.stringify(favoriteCities));

  updateFavoriteCities();
}

async function getCurrentLocationWeather() {
  if (!navigator.geolocation) {
    weatherContainer.innerHTML = `
            <p class="error-text">
                Location is not supported by your browser.
            </p>
        `;

    return;
  }

  weatherContainer.innerHTML = `
        <p class="loading-text">
            Getting your location...
        </p>
    `;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const weatherData = await getWeather(latitude, longitude);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        );

        if (!response.ok) {
          throw new Error("Could not determine your location.");
        }

        const data = await response.json();
        const address = data.address;

        const locationInfo = {
          name:
            address.city ||
            address.town ||
            address.village ||
            address.suburb ||
            "Your Location",

          country: address.country || "",
          latitude,
          longitude,
        };

        displayWeather(locationInfo, weatherData);
      } catch (error) {
        console.error(error);

        weatherContainer.innerHTML = `
                    <p class="error-text">
                        ${error.message}
                    </p>
                `;
      }
    },

    (error) => {
      console.error("Geolocation error:", error);

      let message = "Could not access your location.";

      if (error.code === 1) {
        message =
          "Location permission was denied. Please allow location access.";
      } else if (error.code === 2) {
        message = "Your location could not be determined.";
      } else if (error.code === 3) {
        message = "Location request timed out. Try again.";
      }

      weatherContainer.innerHTML = `
                <p class="error-text">
                    ${message}
                </p>
            `;
    },
  );
}

async function searchCity(cityName) {
  const city = cityName || cityInput.value.trim();

  if (!city) return;

  weatherContainer.innerHTML = `
        <p class="loading-text">
            Loading weather for ${city}...
        </p>
    `;

  try {
    const locationInfo = await getCoordinates(city);

    const weatherData = await getWeather(
      locationInfo.latitude,
      locationInfo.longitude,
    );

    displayWeather(locationInfo, weatherData);
    updateRecentSearches(locationInfo.name);

    cityInput.value = "";
  } catch (error) {
    weatherContainer.innerHTML = `
            <p class="error-text">
                ${error.message}
            </p>
        `;
  }
}

searchBtn.addEventListener("click", () => {
  searchCity();
});

locationBtn.addEventListener("click", getCurrentLocationWeather);

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchCity();
  }
});

updateFavoriteCities();
searchCity("Lahore");
