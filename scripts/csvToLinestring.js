const fs = require("fs");
const csv = require("csv-parser");
const airportCodes = require("../public/data/airportCodes.json");
const airlineInfo = require("../public/data/airlineInfo.json");
const countryCodes = require("../public/data/countryCodes.json");
const ICAO = {
  INCHEON: "RKSI",
};

/**
 * callsign: the identifier of the flight displayed on ATC screens (usually the first three letters are reserved for an airline: AFR for Air France, DLH for Lufthansa, etc.)
    number: the commercial number of the flight, when available (the matching with the callsign comes from public open API)
    icao24: the transponder unique identification number;
    registration: the aircraft tail number (when available);
    typecode: the aircraft model type (when available);
    origin: (ICAO) a four letter code for the origin airport of the flight (when available);
    destination: a four letter code for the destination airport of the flight (when available);
    firstseen: the UTC timestamp of the first message received by the OpenSky Network;
    lastseen: the UTC timestamp of the last message received by the OpenSky Network;
    day: the UTC day of the last message received by the OpenSky Network;
    latitude_1, longitude_1, altitude_1: the first detected position of the aircraft;
    latitude_2, longitude_2, altitude_2: the last detected position of the aircraft.
 */

let results = {
  type: "FeatureCollection",
  features: [],
};

let counter = {};

function isValid(data) {
  // has destination
  // is from incheon
  // destination is not korea
  return (
    data["origin"] === ICAO.INCHEON &&
    data["destination"] &&
    airportCodes[data["destination"]].country !== "KR"
  );
}

function roundCoordinates(lngLat) {
  return lngLat.map((coordinate) => roundDecimal(coordinate));
}

function roundDecimal(coordinate, decimalPlace = 4) {
  return parseFloat(coordinate).toFixed(decimalPlace);
}

function generate() {
  fs.createReadStream("./raw_data/flightlist_20200701_20200731.csv")
    .pipe(csv())
    .on("data", (data) => {
      const uniqueKey = data["callsign"] + "_" + data["destination"];

      if (isValid(data) && !counter[uniqueKey]) {
        counter[uniqueKey] = true;
        const originCoordinates = [data["longitude_1"], data["latitude_1"]];
        const origin = data["origin"];
        const destination = data["destination"];
        const countryISOCode = airportCodes[data["destination"]].country;
        const country = countryCodes[countryISOCode];
        const airport = airportCodes[data["destination"]].airport;
        const icao = data["callsign"].slice(0, 3);
        const airline = airlineInfo[icao];

        if (!airline) {
          return;
        }

        let destinationLongitude = +data["longitude_2"];
        if (destinationLongitude < -20) {
          // 20th meridian (north atlantic ocean)
          destinationLongitude += 360;
        }

        const destinationCoordinates = [
          "" + destinationLongitude,
          data["latitude_2"],
        ];

        const feature = {
          type: "Feature",
          properties: {
            origin,
            destination,
            airline,
            airport,
            country,
          },
          geometry: {
            type: "LineString",
            coordinates: [
              roundCoordinates(originCoordinates),
              roundCoordinates(destinationCoordinates),
            ],
          },
        };

        results.features.push(feature);
      }
    })
    .on("end", () => {
      fs.writeFileSync(
        "./public/data/flightlist.geojson",
        JSON.stringify(results)
      );
    });
}

module.exports = {
  generate,
};
