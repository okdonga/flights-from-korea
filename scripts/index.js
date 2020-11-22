const csvToJson = require("./common.js");
const csvToLinestring = require("./csvToLinestring");

function generateCountryCode() {
  csvToJson.csvToJsonGenerate(
    "./raw_data/isolist.csv",
    "./public/data/countryCodes.json",
    function (data) {
      const key = data["Code"];
      const value = data["Name"];
      return { key, value };
    }
  );
}

function generateAirportCode() {
  csvToJson.csvToJsonGenerate(
    "./raw_data/airports.csv",
    "./public/data/airportCodes.json",
    function (data) {
      const { name, ident: code, iso_country } = data;
      return {
        key: code,
        value: {
          airport: name,
          country: iso_country,
        },
      };
    }
  );
}

// generateAirportCode();

function generateAirlineCode() {
  csvToJson.csvToJsonGenerate(
    "./raw_data/callsign.csv",
    "./public/data/airlineInfo.json",
    function (data) {
      const airline = data["OPERATOR"];
      const icao = data[Object.keys(data)[0]];
      return {
        key: icao.trim(),
        value: airline,
      };
    }
  );
}

// generateAirlineCode();

function generateGeojson() {
  csvToLinestring.generate();
}

generateGeojson();
