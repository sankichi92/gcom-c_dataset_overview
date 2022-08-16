/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var chlaCollection = ee.ImageCollection("JAXA/GCOM-C/L3/OCEAN/CHLA/V3");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var SLOPE = 0.0016;

function minDate() {
  return chlaCollection.first().date();
}

function celsiusCollection() {
  return chlaCollection.select("CHLA_AVE").map(function (image) {
    return image.multiply(SLOPE).copyProperties(image, ["system:time_start"]);
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
    .get("CHLA_AVE");
}

exports.minDate = minDate;
exports.celsiusCollection = celsiusCollection;
exports.periodMeanImage = periodMeanImage;
exports.periodMeanPointValue = periodMeanPointValue;
