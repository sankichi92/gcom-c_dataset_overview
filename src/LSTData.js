var lstCollection = ee.ImageCollection("JAXA/GCOM-C/L3/LAND/LST/V3");

var SLOPE_COEFFICIENT = 0.02;
var KELVIN_TO_CELSIUS = 273.15;

exports.minDate = function () {
  return lstCollection.first().date();
};

exports.celsiusImageCollection = function (satelliteDirection) {
  return lstCollection
    .filter(ee.Filter.eq("SATELLITE_DIRECTION", satelliteDirection))
    .select("LST_AVE")
    .map(function (image) {
      return image
        .multiply(SLOPE_COEFFICIENT)
        .subtract(KELVIN_TO_CELSIUS)
        .copyProperties(image, ["system:time_start"]); // For time series chart
    });
};

exports.periodMeanImage = function (satelliteDirection, startDate, endDate) {
  return lstCollection
    .filter(ee.Filter.eq("SATELLITE_DIRECTION", satelliteDirection))
    .filterDate(startDate, endDate)
    .select("LST_AVE")
    .mean()
    .multiply(SLOPE_COEFFICIENT)
    .subtract(KELVIN_TO_CELSIUS);
};
