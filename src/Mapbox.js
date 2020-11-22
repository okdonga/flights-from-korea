import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { isCargo } from "./common";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN;

const MAP_PROPERTY = {
  lng: 126.7052,
  lat: 37.4563,
  zoom: 1,
};
function getUniqueFeatures(array, comparatorProperty) {
  const existingFeatureKeys = {};
  // Because features come from tiled vector data, feature geometries may be split
  // or duplicated across tile boundaries and, as a result, features may appear
  // multiple times in query results.
  const uniqueFeatures = array.filter(function (el) {
    if (existingFeatureKeys[el.properties[comparatorProperty]]) {
      return false;
    } else {
      existingFeatureKeys[el.properties[comparatorProperty]] = true;
      return true;
    }
  });

  return uniqueFeatures;
}

function Mapbox() {
  const mapContainer = useRef();
  const [map, setMap] = useState(null);
  const [features, setFeatures] = useState([]);
  const [countries, setCountries] = useState([]);
  const [countryToAirlineMapper, setCountryToAirlineMapper] = useState({});
  const [selectedCountry, setSelectedCountry] = useState("");
  const [searchWord, setSearchWord] = useState("");

  useEffect(() => {
    if (features.length > 0) {
      const uniqueFeatures = getUniqueFeatures(features, "country");
      setCountries(renderListings(uniqueFeatures, "country"));

      let countryToAirlineMapper = {};
      features.forEach((feature) => {
        const country = feature.properties.country;
        const airline = feature.properties.airline;
        if (countryToAirlineMapper[country]) {
          if (!countryToAirlineMapper[country].includes(airline)) {
            countryToAirlineMapper[country].push(airline);
          }
        } else {
          countryToAirlineMapper[country] = [airline];
        }
      });
      setCountryToAirlineMapper(countryToAirlineMapper);
    }
  }, [features]);

  useEffect(() => {
    if (selectedCountry) {
      const feature = features.find((feature) => {
        return feature.properties.country === selectedCountry;
      });

      let centerLngLat =
        feature.geometry.coordinates[feature.geometry.coordinates.length - 1];
      if (selectedCountry === "United States") {
        centerLngLat = [-97.22281391988629, 41.39781435396793];
      }

      map.flyTo({
        center: centerLngLat,
        zoom: 4,
        speed: 0.9, // make the flying slow
        essential: true,
      });
      // https://docs.mapbox.com/mapbox-gl-js/api/map/#map#flyto
    }
  }, [selectedCountry, features, map]);

  useEffect(() => {
    fetch("http://localhost:3000/data/flightlist.geojson")
      .then((res) => res.json())
      .then((response) => {
        setFeatures(response.features);
      })
      .catch((error) => console.log(error));

    const { lat, lng, zoom } = MAP_PROPERTY;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      // style: "mapbox://styles/mapbox/streets-v8",
      style: "mapbox://styles/okdong/ckhm2i8la0gmi19mi5unm5bcm",
      center: [lng, lat],
      zoom,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-left");
    const popup = new mapboxgl.Popup({
      closeButton: false,
    });

    function onMouseEnterLayer(e) {
      map.getCanvas().style.cursor = "pointer";
      const isCountrySelected =
        document.getElementsByClassName("selected").length > 0;
      if (!isCountrySelected) {
        const feature = e.features[0];
        map.setFilter("routesHighlighted", [
          "in",
          "country",
          feature.properties.country,
        ]);
      }

      const feature = e.features[0];
      popup
        .setLngLat(e.lngLat)
        .setText(
          feature.properties.airline +
            " (" +
            feature.properties.country +
            "," +
            feature.properties.airport +
            ")"
        )
        .addTo(map);
    }

    function onMouseLeaveLayer() {
      map.getCanvas().style.cursor = "";
      const isCountrySelected =
        document.getElementsByClassName("selected").length > 0;

      if (!isCountrySelected) {
        map.setFilter("routesHighlighted", ["in", "country", ""]);
      }

      popup.remove();
    }

    map.on("load", function () {
      map.addSource("routeSource", {
        type: "geojson",
        data: "./data/flightlist.geojson",
        lineMetrics: true,
      });

      map.addLayer({
        id: "routeLayer",
        type: "line",
        source: "routeSource",
        paint: {
          "line-width": 1,
          "line-color": "#fdae6b", // orange
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      });

      map.addLayer({
        id: "routesHighlighted",
        type: "line",
        source: "routeSource",
        paint: {
          "line-width": 1,
          "line-color": "#2553ee", // blue
        },
        filter: ["in", "country", ""],
      });

      setMap(map);
    });

    map.on("mouseenter", "routeLayer", onMouseEnterLayer);

    map.on("mouseleave", "routeLayer", onMouseLeaveLayer);

    map.on("click", function (e) {
      console.log(e.lngLat);
    });

    return () => {
      map.remove();
    };
  }, []);

  function renderListings(features, property) {
    return features.map((item) => {
      return item.properties[property];
    });
  }

  function onClickCountry(e) {
    const { code } = e.currentTarget.dataset;
    const classname = e.currentTarget.className;
    if (classname.split(" ")[1].includes("selected")) {
      map.setFilter("routesHighlighted", ["in", "country", ""]);
      setSelectedCountry("");
    } else {
      map.setFilter("routesHighlighted", ["in", "country", code]);
      setSelectedCountry(code);
    }
  }

  function onChangeSearchWord(e) {
    const searchWord = e.target.value;
    setSearchWord(searchWord);
  }

  function filterCountryList(searchWord) {
    return countries.filter((country) =>
      country.toLowerCase().includes(searchWord.toLowerCase())
    );
  }

  let filteredList = countries;
  if (searchWord) {
    filteredList = filterCountryList(searchWord.trim());
  }

  return (
    <React.Fragment>
      <div id="map" ref={(el) => (mapContainer.current = el)} />
      <div id="legend">
        <div>
          <label htmlFor="search">
            <input
              id="search"
              type="text"
              autoComplete="off"
              placeholder="🔎 Search by country"
              onChange={onChangeSearchWord}
              value={searchWord}
            />
          </label>
        </div>
        <CountryList
          countries={filteredList}
          selectedCountry={selectedCountry}
          onClickCountry={onClickCountry}
          countryToAirlineMapper={countryToAirlineMapper}
        />
      </div>
    </React.Fragment>
  );
}

function CountryList({
  countries,
  selectedCountry,
  onClickCountry,
  countryToAirlineMapper,
}) {
  return (
    <ul>
      {countries &&
        countries.map((country) => (
          <li
            className={`country-list ${
              selectedCountry === country ? "selected" : ""
            }`}
            data-code={country}
            key={country}
            onClick={onClickCountry}
          >
            <div className="country-name">{country}</div>
            <ul
              className={`airline-list ${
                selectedCountry === country ? "selected" : ""
              }`}
            >
              {countryToAirlineMapper[country].map((airline) => (
                <li key={airline} data-code={airline}>
                  {airline} {isCargo(airline) ? "📦" : "✈️"}
                </li>
              ))}
            </ul>
          </li>
        ))}
    </ul>
  );
}

export default Mapbox;
