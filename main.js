/* Wetterstationen Euregio Beispiel */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778,
    zoom: 11,
};

// Karte initialisieren
let map = L.map("map").setView([ibk.lat, ibk.lng], ibk.zoom);

// thematische Layer
let overlays = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    windspeed: L.featureGroup(),
    snowheight: L.featureGroup(),
    wind: L.featureGroup().addTo(map),
}

// Layer control
L.control.layers({
    "Relief avalanche.report": L.tileLayer(
        "https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
        attribution: `© <a href="https://sonny.4lima.de">Sonny</a>, <a href="https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b">EU-DEM</a>, <a href="https://lawinen.report/">avalanche.report</a>, all licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>`
    }).addTo(map),
    "OpenStreetMap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "OpenTopoMap": L.tileLayer.provider("OpenTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery"),
}, {
    "Wetterstationen": overlays.stations,
    "Temperatur": overlays.temperature,
    "Windgeschwindigkeit": overlays.windspeed,
    "Schneehöhe": overlays.snowheight,
    "Wind": overlays.wind,
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

// Wetterstationen
async function loadStations(url) {
    let response = await fetch(url);
    let jsondata = await response.json();

    // Wetterstationen mit Icons und Popups
    console.log(jsondata);
    //console.log(jsondata.name == 'Hafelekar')
    L.geoJSON(jsondata, {
        pointToLayer: function (feature, latlng) {
            //console.log(feature);
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: `icons/wifi.png`,
                    iconAnchor: [16, 37], //halbe Bildbreite und ganze Bildhöhe
                    popupAnchor: [0, -35] // Damit Popup nicht Icon überdeckt
                })
            })
        }, onEachFeature: function (feature, layer) {
            let pointInTime = new Date(feature.properties.date);
            layer.bindPopup(`
                    <h4> ${feature.properties.name} (${feature.geometry.coordinates[2]}m) </h4>
                    <ul>
                        <li> Lufttemperatur (°C) ${feature.properties.LT !== undefined ? feature.properties.LT : "-"} </li>  <!-- sonst ist Null auch - -->
                        <li> relative Luftfeuchte (%) ${feature.properties.RH || "-"} </li>
                        <li> Windgeschwindigkeit (km/h) ${feature.properties.WG || "-"} </li>
                        <li> Schneehöhe (cm) ${feature.properties.HS || "-"} </li>
                    </ul>
                    <span> ${pointInTime.toLocaleString()} </span>
                `)
        }
    }).addTo(overlays.stations)
    showTemperature(jsondata);
    showWindspeed(jsondata);
    showSnowheight(jsondata);
    showWinddir(jsondata);
}
loadStations("https://static.avalanche.report/weather_stations/stations.geojson");


function showTemperature(jsondata) {
    L.geoJSON(jsondata, {
        filter: function (feature) {
            if (feature.properties.LT > -50 && feature.properties.LT < 50) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.LT, COLORS.temperature);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color: ${color}"> ${feature.properties.LT.toFixed(1)}°C </span>`
                }),
            })
        },
    }).addTo(overlays.temperature);
}

function showWindspeed(jsondata) {
    L.geoJSON(jsondata, {
        filter: function (feature) {
            if (feature.properties.WG > 0 && feature.properties.WG < 500) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.WG, COLORS.wind);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${feature.properties.WG.toFixed(2)}km/h</span>`
                }),
            })
        },
    }).addTo(overlays.windspeed);
}

function showSnowheight(jsondata) {
    L.geoJSON(jsondata, {
        filter: function (feature) {
            if (feature.properties.HS > 0 && feature.properties.HS < 5000) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.HS, COLORS.snow);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color: ${color}"> ${feature.properties.HS.toFixed(0)}cm </span>`
                }),
            })
        },
    }).addTo(overlays.snowheight);
}


function showWinddir(jsondata) {
    L.geoJSON(jsondata, {
        filter: function (feature) {
            if (feature.properties.WR > 0 && feature.properties.WR < 361) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.WG, COLORS.wind);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color: ${color}"> ${feature.properties.WR.toFixed(0)}° </span>
                    <i class="fa-solid fa-arrow-up"style="color:${COLORS.wind}; transform: rotate(${feature.properties.WR}deg);"></i>`
                }),
            })
        },
    }).addTo(overlays.wind);
}

console.log(COLORS);

function getColor(value, ramp) {
    for (let rule of ramp) {
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }
}

let testColor = getColor(-5, COLORS.temperature);
console.log("TestColor für temp -5", testColor);

    // Change default options
    L.control.rainviewer({ 
        position: 'bottomleft',
        nextButtonText: '>',
        playStopButtonText: 'Play/Stop',
        prevButtonText: '<',
        positionSliderLabelText: "Hour:",
        opacitySliderLabelText: "Opacity:",
        animationInterval: 500,
        opacity: 0.5
    }).addTo(map);
