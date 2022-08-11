var sstCollection = ee.ImageCollection("JAXA/GCOM-C/L3/OCEAN/SST/V3");

var SLOPE_COEFFICIENT = 0.0012;
var OFFSET = 10;

exports.minDate = function () {
  return sstCollection.first().date();
};

function daytimeOrNighttimePeriodMeanImage(
  satelliteDirection,
  startDate,
  endDate
) {
  return sstCollection
    .filter(ee.Filter.eq("SATELLITE_DIRECTION", satelliteDirection))
    .filterDate(startDate, endDate)
    .select("SST_AVE")
    .mean()
    .multiply(SLOPE_COEFFICIENT)
    .subtract(OFFSET);
}

exports.daytimeOrNighttimePeriodMeanImage = daytimeOrNighttimePeriodMeanImage;

exports.daytimeOrNighttimePeriodMeanPointValue = function (
  satelliteDirection,
  startDate,
  endDate,
  coords
) {
  return daytimeOrNighttimePeriodMeanImage(satelliteDirection, startDate, endDate)
    .sample({
      region: ee.Geometry.Point({ coords: [coords.lon, coords.lat] }),
      scale: 30,
    })
    .first()
    .get("SST_AVE");
};

exports.daytimeAndNighttimeBandsCollection = function () {
  return sstCollection.select("SST_AVE").map(function (image) {
    var celsius = ee.Image(
      image
        .multiply(SLOPE_COEFFICIENT)
        .subtract(OFFSET)
        .copyProperties(image, ["system:time_start"]) // For time series chart
    );

    return ee.Algorithms.If(
      ee.String(image.get("SATELLITE_DIRECTION")).equals("D"),
      celsius.rename("Daytime"),
      celsius.rename("Nighttime")
    );
  });
};
