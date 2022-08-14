/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var laiCollection = ee.ImageCollection("JAXA/GCOM-C/L3/LAND/LAI/V3");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var SLOPE_COEFFICIENT = 0.001;

function minDate() {
  return laiCollection.first().date();
}

function correctedCollection() {
  return laiCollection.select("LAI_AVE").map(function (image) {
    return image
      .multiply(SLOPE_COEFFICIENT)
      .copyProperties(image, ["system:time_start"]);
  });
}

function periodMeanImage(startDate, endDate) {
  return correctedCollection().filterDate(startDate, endDate).mean();
}

function periodMeanPointValue(startDate, endDate, coords) {
  return periodMeanImage(startDate, endDate)
    .sample({
      region: ee.Geometry.Point({ coords: [coords.lon, coords.lat] }),
      scale: 30,
    })
    .first()
    .get("LAI_AVE");
}

exports.minDate = minDate;
exports.correctedCollection = correctedCollection;
exports.periodMeanImage = periodMeanImage;
exports.periodMeanPointValue = periodMeanPointValue;
