var lstCollection = ee.ImageCollection("JAXA/GCOM-C/L3/LAND/LST/V3");

var SLOPE_COEFFICIENT = 0.02;
var KELVIN_TO_CELSIUS = 273.15;

exports.minDate = function () {
  return lstCollection.first().date();
};

function daytimeOrNighttimePeriodMeanImage(
  satelliteDirection,
  startDate,
  endDate
) {
  return lstCollection
    .filter(ee.Filter.eq("SATELLITE_DIRECTION", satelliteDirection))
    .filterDate(startDate, endDate)
    .select("LST_AVE")
    .mean()
    .multiply(SLOPE_COEFFICIENT)
    .subtract(KELVIN_TO_CELSIUS);
}

exports.daytimeOrNighttimePeriodMeanImage = daytimeOrNighttimePeriodMeanImage;

exports.daytimeOrNighttimePeriodMeanPointValue = function (
  satelliteDirection,
  startDate,
  endDate,
  coords
) {
  return daytimeOrNighttimePeriodMeanImage(
    satelliteDirection,
    startDate,
    endDate
  )
    .sample({
      region: ee.Geometry.Point({ coords: [coords.lon, coords.lat] }),
      scale: 30,
    })
    .first()
    .get("LST_AVE");
};

exports.daytimeAndNighttimeBandsCollection = function () {
  return lstCollection.select("LST_AVE").map(function (image) {
    var celsius = ee.Image(
      image
        .multiply(SLOPE_COEFFICIENT)
        .subtract(KELVIN_TO_CELSIUS)
        .copyProperties(image, ["system:time_start"]) // For time series chart
    );

    return ee.Algorithms.If(
      ee.String(image.get("SATELLITE_DIRECTION")).equals("D"),
      celsius.rename("Daytime"),
      celsius.rename("Nighttime")
    );
  });
};
