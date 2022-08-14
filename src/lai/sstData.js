/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var sstCollection = ee.ImageCollection("JAXA/GCOM-C/L3/OCEAN/SST/V3");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var SLOPE_COEFFICIENT = 0.0012;
var OFFSET = 10;

function minDate() {
  return sstCollection.first().date();
}

function celsiusCollection() {
  return sstCollection.select("SST_AVE").map(function (image) {
    return image
      .multiply(SLOPE_COEFFICIENT)
      .subtract(OFFSET)
      .copyProperties(image, ["system:time_start"]);
  });
}

function periodMeanImage(startDate, endDate) {
  return celsiusCollection().filterDate(startDate, endDate).mean();
}

function periodMeanPointValue(startDate, endDate, coords) {
  return periodMeanImage(startDate, endDate)
    .sample({
      region: ee.Geometry.Point({ coords: [coords.lon, coords.lat] }),
      scale: 30,
    })
    .first()
    .get("SST_AVE");
}

exports.minDate = minDate;
exports.celsiusCollection = celsiusCollection;
exports.periodMeanImage = periodMeanImage;
exports.periodMeanPointValue = periodMeanPointValue;
