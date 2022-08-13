var LSTData = require("users/sankichi92/gcom-c_dataset_overview:src/lst/LSTData.js");
var palettes = require("users/gena/packages:palettes");

var LST_LAYER_INDEX = 0;
var POINT_LAYER_INDEX = 1;

var SATELLITE_DIRECTION_SELECT_WIDGET_INDEX = 4;
var DATE_SLIDER_WIDGET_INDEX = 8;
var POINT_COORDS_WIDGET_INDEX = 10;
var POINT_VALUE_WIDGET_INDEX = 11;
var POINT_CHART_WIDGET_INDEX = 12;

var DAY_MILLISECONDS = 86400000;

var App = function () {
  this.coords = {
    // Tokyo
    lon: ui.url.get("lon", 139.839478),
    lat: ui.url.get("lat", 35.652832),
  };

  var self = this;

  this.map = ui.Map({
    center: this.coords,
    onClick: function (coords) {
      self.coords = coords;
      self.updatePointLayer();
      self.updatePointValueLabel();
      self.updatePointChart();
      ui.url.set("lon", coords.lon);
      ui.url.set("lat", coords.lat);
    },
    style: { cursor: "crosshair" },
  });

  var period = ui.url.get("period", 7);

  var headerStyle = {
    fontSize: "1.17em",
    fontWeight: "bold",
    margin: "8px 8px 0",
  };

  this.panel = ui.Panel({
    widgets: [
      ui.Label({
        value: "GCOM-C LST Overview",
        style: { fontSize: "2em", fontWeight: "bold" },
      }),
      ui.Label({
        value:
          "Visualize LST (Land Surface Temperature) observed by GCOM-C (Global Change Observation Mission - Climate)." +
          "The map shows daytime or nighttime mean values over the specified period." +
          "When you click the map, you can see the value and a time series chart at the point.",
      }),
      ui.Label({
        value:
          "気候変動観測衛星「しきさい（GCOM-C）」で観測した地表面温度（Land Surface Temperature）について、" +
          "指定した期間における日中または夜間の平均値を可視化する。" +
          "また、地図上をクリックすると、その地点の値や時系列のグラフが表示される。",
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
        value: ui.url.get("sd", "D"),
        onChange: function (satelliteDirection) {
          self.updateLSTLayer();
          self.updatePointValueLabel();
          ui.url.set("sd", satelliteDirection);
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
        value: period,
        step: 1,
        onChange: function (value) {
          var dateSlider = self.panel.widgets().get(DATE_SLIDER_WIDGET_INDEX);
          dateSlider.setPeriod(value);
          ui.url.set("period", value);
        },
        style: { stretch: "horizontal" },
      }),
      ui.Label({
        value: "Date",
        style: headerStyle,
      }),
      ui.DateSlider({
        start: LSTData.minDate(),
        value: ui.url.get(
          "start",
          new Date(Date.now() - 7 * DAY_MILLISECONDS)
            .toISOString()
            .substring(0, 10)
        ),
        period: period,
        onChange: function (dateRange) {
          self.updateLSTLayer();
          self.updatePointValueLabel();
          dateRange
            .start()
            .format("YYYY-MM-dd")
            .evaluate(function (startDate) {
              ui.url.set("start", startDate);
            });
        },
        style: { stretch: "horizontal" },
      }),
      ui.Label({
        value: "Clicked Point Information",
        style: headerStyle,
      }),
      ui.Label({
        value: "Coordinates: ",
        style: { margin: "4px 8px 0" },
      }),
      ui.Label({
        value: "Value: ",
        style: { margin: "4px 8px 8px" },
      }),
      ui.Label({
        value: "[Click a point on the map]",
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
        value: "GitHub: sankichi92/gcom-c_dataset_overview",
        style: { margin: "4px 8px 8px" },
        targetUrl: "https://github.com/sankichi92/gcom-c_dataset_overview/",
      }),
    ],
    style: { width: "400px" },
  });
};

App.prototype.getSatelliteDirection = function () {
  return this.panel
    .widgets()
    .get(SATELLITE_DIRECTION_SELECT_WIDGET_INDEX)
    .getValue();
};

App.prototype.getStartAndEndDates = function () {
  return this.panel.widgets().get(DATE_SLIDER_WIDGET_INDEX).getValue();
};

App.prototype.updateLSTLayer = function () {
  var dates = this.getStartAndEndDates();

  var layer = ui.Map.Layer({
    eeObject: LSTData.daytimeOrNighttimePeriodMeanImage(
      this.getSatelliteDirection(),
      dates[0],
      dates[1]
    ),
    visParams: {
      min: -20,
      max: 60,
      palette: palettes.crameri.batlow[50],
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
    "Coordinates: (" + this.coords.lon + ", " + this.coords.lat + ")"
  );
};

App.prototype.updatePointValueLabel = function () {
  var dates = this.getStartAndEndDates();
  var pointValueLabel = this.panel.widgets().get(POINT_VALUE_WIDGET_INDEX);

  LSTData.daytimeOrNighttimePeriodMeanPointValue(
    this.getSatelliteDirection(),
    dates[0],
    dates[1],
    this.coords
  ).evaluate(function (value) {
    if (value) {
      pointValueLabel.setValue("Value: " + value.toFixed(2) + " ℃");
    } else {
      // 海などデータがない場合
      pointValueLabel.setValue("Value: N/A");
    }
  });
};

App.prototype.updatePointChart = function () {
  var chart = ui.Chart.image
    .series({
      imageCollection: LSTData.daytimeAndNighttimeBandsCollection(),
      region: ee.Geometry.Point({ coords: [this.coords.lon, this.coords.lat] }),
      reducer: ee.Reducer.first(),
    })
    .setOptions({
      title:
        "LST time series at (" + this.coords.lon + ", " + this.coords.lat + ")",
      hAxis: { title: null },
      vAxis: { title: "LST (℃)" },
      interpolateNulls: true,
    });

  this.panel.widgets().set(POINT_CHART_WIDGET_INDEX, chart);
};

exports.build = function () {
  return new App();
};
