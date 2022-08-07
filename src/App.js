var LSTData = require("users/sankichi92/gcom-c_lst_overview:src/LSTData.js");

var LST_LAYER_INDEX = 0;
var POINT_LAYER_INDEX = 1;

var POINT_COORDS_WIDGET_INDEX = 10;
var POINT_VALUE_WIDGET_INDEX = 11;

var App = function () {
  this.satelliteDirection = ui.url.get("sd", "D");
  this.startDate = ui.url.get("start", "2022-07-01");
  this.endDate = ui.url.get("end", "2022-07-08");
  this.coords = {
    // Tokyo
    lon: ui.url.get("lon", 139.839478),
    lat: ui.url.get("lat", 35.652832),
  };

  var self = this;

  this.map = ui.Map({
    center: this.coords,
    onClick: function (coords) {
      self.setCoords(coords);
      self.updatePointLayer();
      self.updatePointValueLabel();
    },
    style: { cursor: "crosshair" },
  });

  var headerStyle = {
    fontSize: "1.17em",
    fontWeight: "bold",
    margin: "8px 8px 0",
  };

  var dateSlider = ui.DateSlider({
    start: LSTData.minDate(),
    value: [this.startDate, this.endDate],
    period: 7,
    onChange: function (dateRange) {
      dateRange
        .start()
        .format("YYYY-MM-dd")
        .evaluate(function (startDate) {
          dateRange
            .end()
            .format("YYYY-MM-dd")
            .evaluate(function (endDate) {
              self.setDates(startDate, endDate);
            });
        });
      self.updateLSTLayer();
      self.updatePointValueLabel();
    },
    style: { stretch: "horizontal" },
  });

  this.panel = ui.Panel({
    widgets: [
      ui.Label({
        value: "GCOM-C LST Overview",
        style: { fontSize: "2em", fontWeight: "bold" },
      }),
      ui.Label({
        value:
          "Visualize LST (Land Surface Temperature) observed by GCOM-C (Global Change Observation Mission - Climate)." +
          "The map shows the daytime or nighttime mean value over the specified period." +
          "When you click the map, you can see the value and a time series chart on the point.",
      }),
      ui.Label({
        value:
          "気候変動観測衛星「しきさい（GCOM-C）」で観測した地表面温度（Land Surface Temperature）について、" +
          "指定した期間における日中または夜間の平均値を可視化する。" +
          "また、地図上でクリックすると、その地点の値や時系列のグラフが表示される。",
      }),
      ui.Label({
        value: "Satellite Direction",
        style: headerStyle,
      }),
      ui.Select({
        items: [
          { label: "Ascending (Nighttime)", value: "A" },
          { label: "Descending (Daytime)", value: "D" },
        ],
        value: this.satelliteDirection,
        onChange: function (satelliteDirection) {
          self.setSatelliteDirection(satelliteDirection);
          self.updateLSTLayer();
          self.updatePointValueLabel();
        },
        style: { stretch: "horizontal" },
      }),
      ui.Label({
        value: "Period (days)",
        style: headerStyle,
      }),
      ui.Slider({
        min: 1,
        max: 60,
        value: dateSlider.getPeriod(),
        step: 1,
        onChange: function (value) {
          dateSlider.setPeriod(value);
        },
        style: { stretch: "horizontal" },
      }),
      ui.Label({
        value: "Date",
        style: headerStyle,
      }),
      dateSlider,
      ui.Label({
        value: "Clicked Point Value",
        style: headerStyle,
      }),
      ui.Label({
        value: "Point: ",
        style: { margin: "4px 8px 0" },
      }),
      ui.Label({
        value: "Value: ",
        style: { margin: "4px 8px 8px" },
      }),
      ui.Label({
        value: "Dataset",
        style: headerStyle,
      }),
      ui.Label({
        value: "GCOM-C/SGLI L3 Land Surface Temperature",
        style: { margin: "4px 8px 8px" },
        targetUrl:
          "https://developers.google.com/earth-engine/datasets/catalog/JAXA_GCOM-C_L3_LAND_LST_V3",
      }),
      ui.Label({
        value: "Source Code",
        style: headerStyle,
      }),
      ui.Label({
        value: "GitHub: sankichi92/gcom-c_lst_overview",
        style: { margin: "4px 8px 8px" },
        targetUrl: "https://github.com/sankichi92/gcom-c_lst_overview/",
      }),
    ],
    style: { width: "400px" },
  });
};

App.prototype.setSatelliteDirection = function (satelliteDirection) {
  this.satelliteDirection = satelliteDirection;
  ui.url.set("sd", satelliteDirection);
};

App.prototype.setDates = function (startDate, endDate) {
  this.startDate = startDate;
  this.endDate = endDate;
  ui.url.set("start", startDate);
  ui.url.set("end", endDate);
};

App.prototype.setCoords = function (coords) {
  this.coords = coords;
  ui.url.set("lon", coords.lon);
  ui.url.set("lat", coords.lat);
};

App.prototype.updateLSTLayer = function () {
  var layer = ui.Map.Layer({
    eeObject: LSTData.periodMeanImage(
      this.satelliteDirection,
      this.startDate,
      this.endDate
    ),
    visParams: {
      min: -20,
      max: 60,
      palette: ["blue", "limegreen", "yellow", "darkorange", "red"],
    },
    name: "LST",
    opacity: 0.8,
  });

  this.map.layers().set(LST_LAYER_INDEX, layer);
};

App.prototype.updatePointLayer = function () {
  this.map.layers().set(
    POINT_LAYER_INDEX,
    ui.Map.Layer({
      eeObject: ee.Geometry.Point({
        coords: [this.coords.lon, this.coords.lat],
      }),
      name: "Point",
    })
  );

  var pointCoordsLabel = this.panel.widgets().get(POINT_COORDS_WIDGET_INDEX);
  pointCoordsLabel.setValue(
    "Point: (" + this.coords.lon + ", " + this.coords.lat + ")"
  );
};

App.prototype.updatePointValueLabel = function () {
  var pointValueLabel = this.panel.widgets().get(POINT_VALUE_WIDGET_INDEX);

  LSTData.periodMeanImage(this.satelliteDirection, this.startDate, this.endDate)
    .sample({
      region: ee.Geometry.Point({ coords: [this.coords.lon, this.coords.lat] }),
      scale: 30,
    })
    .first()
    .get("LST_AVE")
    .evaluate(function (value) {
      if (value) {
        pointValueLabel.setValue("Value: " + value.toFixed(2) + " ℃");
      } else {
        // 海などデータがない場合
        pointValueLabel.setValue("Value: N/A");
      }
    });
};

exports.build = function () {
  return new App();
};