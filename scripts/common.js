const fs = require("fs");
const csv = require("csv-parser");

function csvToJsonGenerate(inputFile, outputFile, cb) {
  let result = {};
  fs.createReadStream(inputFile)
    .pipe(csv())
    .on("data", (data) => {
      const { key, value } = cb(data);
      result[key] = value;
    })
    .on("end", () => {
      fs.writeFileSync(outputFile, JSON.stringify(result));
    });
}

module.exports = {
  csvToJsonGenerate,
};
