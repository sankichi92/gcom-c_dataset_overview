var palettes = require("users/gena/packages:palettes");
var Legend = require("users/sankichi92/gcom-c_dataset_overview:lib/Legend.js");
var SSTData = require("users/sankichi92/gcom-c_dataset_overview:src/sst/SSTData.js");

var SST_LAYER_INDEX = 0;
var POINT_LAYER_INDEX = 1;

var DATE_SLIDER_WIDGET_INDEX = 6;
var POINT_COORDS_WIDGET_INDEX = 8;
var POINT_VALUE_WIDGET_INDEX = 9;
var POINT_CHART_WIDGET_INDEX = 10;

var DAY_MILLISECONDS = 86400000;

var sstVisParams = {
  min: -5,
  max: 35,
  palette: palettes.crameri.batlow[50],
};

var App = function () {
  this.coords = {
    // Tokyo
    lon: ui.url.get("lon", 139.839478),
    lat: ui.url.get("lat", 35.652832),
  };

  var self = this;

  this.map = ui
    .Map({
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
    })
    .add(Legend.createPanel(sstVisParams, { position: "bottom-right" }));

  var period = ui.url.get("period", 28);

  var headerStyle = {
    fontSize: "1.17em",
    fontWeight: "bold",
    margin: "8px 8px 0",
  };

  this.panel = ui.Panel({
    widgets: [
      ui.Label({
        value: "GCOM-C SST Overview",
        style: { fontSize: "2em", fontWeight: "bold" },
      }),
      ui.Label({
        value:
          "Visualize SST (Sea Surface Temperature) observed by GCOM-C (Global Change Observation Mission - Climate)." +
          " The map shows mean values over the specified period." +
          " When you click the map, you can see the value and a time series chart at the point.",
      }),
      ui.Label({
        value:
          "気候変動観測衛星「しきさい（GCOM-C）」で観測した海水面温度（Sea Surface Temperature）について、指定した期間の平均値を可視化する。" +
          "また、地図上をクリックすると、その地点の値や時系列のグラフが表示される。",
      }),
      ui.Label({
        value: "Period (days)",
        style: headerStyle,
      }),
      ui.Slider({
        min: 1,
        max: 90,
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
        start: SSTData.minDate(),
        value: ui.url.get(
          "start",
          new Date(Date.now() - 7 * DAY_MILLISECONDS)
            .toISOString()
            .substring(0, 10)
        ),
        period: period,
        onChange: function (dateRange) {
          self.updateSSTLayer();
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
        value: "GCOM-C/SGLI L3 Sea Surface Temperature (V3)",
        style: { margin: "4px 8px 8px" },
        targetUrl:
          "https://developers.google.com/earth-engine/datasets/catalog/JAXA_GCOM-C_L3_OCEAN_SST_V3",
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

App.prototype.getStartAndEndDates = function () {
  return this.panel.widgets().get(DATE_SLIDER_WIDGET_INDEX).getValue();
};

App.prototype.updateSSTLayer = function () {
  var dates = this.getStartAndEndDates();

  var layer = ui.Map.Layer({
    eeObject: SSTData.periodMeanImage(dates[0], dates[1]),
    visParams: sstVisParams,
    name: "SST",
  });

  this.map.layers().set(SST_LAYER_INDEX, layer);
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

  SSTData.periodMeanPointValue(dates[0], dates[1], this.coords).evaluate(
    function (value) {
      if (value) {
        pointValueLabel.setValue("Value: " + value.toFixed(2) + " ℃");
      } else {
        // 陸などデータがない場合
        pointValueLabel.setValue("Value: N/A");
      }
    }
  );
};

App.prototype.updatePointChart = function () {
  var chart = ui.Chart.image
    .doySeriesByYear({
      imageCollection: SSTData.celsiusCollection(),
      bandName: "SST_AVE",
      region: ee.Geometry.Point({ coords: [this.coords.lon, this.coords.lat] }),
      regionReducer: ee.Reducer.first(),
    })
    .setOptions({
      title:
        "SST time series at (" + this.coords.lon + ", " + this.coords.lat + ")",
      hAxis: { title: "Day of year" },
      vAxis: { title: "SST (℃)" },
      interpolateNulls: true,
    });

  this.panel.widgets().set(POINT_CHART_WIDGET_INDEX, chart);
};

exports.build = function () {
  return new App();
};
