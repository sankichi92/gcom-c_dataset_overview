var Builder = function (lstCollection, startDate, endDate, satelliteDirection) {
  this.lstCollection = lstCollection;
  this.startDate = startDate;
  this.endDate = endDate;
  this.satelliteDirection = satelliteDirection;
};

Builder.prototype.build = function () {
  print(this);

  var image = this.lstCollection
    .filterDate(this.startDate, this.endDate)
    .filter(ee.Filter.eq("SATELLITE_DIRECTION", this.satelliteDirection))
    .select("LST_AVE")
    .mean()
    .multiply(0.02) // 傾斜係数
    .add(-273.15); // ケルビン→摂氏

  var visParams = {
    min: -20,
    max: 60,
    palette: ["blue", "limegreen", "yellow", "darkorange", "red"],
  };

  return ui.Map.Layer(image, visParams, "LST");
};

exports.Builder = Builder;
