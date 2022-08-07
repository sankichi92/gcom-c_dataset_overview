var Builder = function (lstCollection, startDate, endDate, satelliteDirection) {
  this.lstCollection = lstCollection;
  this.startDate = startDate;
  this.endDate = endDate;
  this.satelliteDirection = satelliteDirection;
};

Builder.prototype.buildImage = function () {
  return this.lstCollection
    .filterDate(this.startDate, this.endDate)
    .filter(ee.Filter.eq("SATELLITE_DIRECTION", this.satelliteDirection))
    .select("LST_AVE")
    .mean()
    .multiply(0.02) // 傾斜係数
    .subtract(273.15); // ケルビン→摂氏
};

Builder.prototype.buildLayer = function () {
  print(this);

  return ui.Map.Layer({
    eeObject: this.buildImage(),
    visParams: {
      min: -20,
      max: 60,
      palette: ["blue", "limegreen", "yellow", "darkorange", "red"],
    },
    name: "LST",
    opacity: 0.8,
  });
};

exports.Builder = Builder;
