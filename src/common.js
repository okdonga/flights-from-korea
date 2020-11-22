const CARGO_LIST = [
  "ATLAS AIR",
  "FEDEX",
  "UPS AIRLINES",
  "POLAR AIR CARGO",
  "OMNI AIR EXPRESS",
  "SOUTHERN AIR",
  "AEROLOGIC",
  "CARGOLUX",
  "AIRBRIDGE CARGO",
  "VOLGA DNEPR A/L",
];

export const isCargo = (airline) => {
  return airline.includes("CARGO") || CARGO_LIST.includes(airline);
};
