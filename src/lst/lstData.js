/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var lstCollection = ee.ImageCollection("JAXA/GCOM-C/L3/LAND/LST/V3");
/***** End of imports. If edited, may not auto-convert in the playground. *****/


var SLOPE_COEFFICIENT = 0.02;
var KELVIN_TO_CELSIUS = 273.15;

function minDate() {
  return lstCollection.first().date();
}

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

function daytimeOrNighttimePeriodMeanPointValue(
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
}

function daytimeAndNighttimeBandsCollection() {
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
}

exports.minDate = minDate;
exports.daytimeOrNighttimePeriodMeanImage = daytimeOrNighttimePeriodMeanImage;
exports.daytimeOrNighttimePeriodMeanPointValue =
  daytimeOrNighttimePeriodMeanPointValue;
exports.daytimeAndNighttimeBandsCollection = daytimeAndNighttimeBandsCollection;
