var palettes = require("users/gena/packages:palettes");
var legend = require("users/sankichi92/gcom-c_dataset_overview:lib/legend.js");
var laiData = require("users/sankichi92/gcom-c_dataset_overview:src/lai/laiData.js");

var LAI_LAYER_INDEX = 0;
var POINT_LAYER_INDEX = 1;
var MAP_DATE_SLIDER_WIDGET_INDEX = 0;

var SIDE_PANEL_CHART_WIDGET_INDEX = 6;

var DAY_MILLISECONDS = 86400000;

var laiVisParams = {
  min: 0,
  max: 7,
  palette: palettes.crameri.bamako[50].reverse(),
};

var App = function () {
  this.coords = {
    // https://www.geocoding.jp/?q=東京駅
    lon: ui.url.get("lon", 139.767125),
    lat: ui.url.get("lat", 35.681236),
  };

  var self = this;

  var onMapClick = function (coords) {
    self.coords = coords;
    self.updatePointLayer();
    self.updatePointChart();
    ui.url.set("lon", coords.lon);
    ui.url.set("lat", coords.lat);
  };

  var period = ui.url.get("period", 14);

  var linker = ui.Map.Linker([
    ui
      .Map({
        center: this.coords,
        onClick: onMapClick,
        style: { cursor: "crosshair" },
      })
      .setOptions("TERRAIN")
      .add(
        ui.DateSlider({
          start: laiData.minDate(),
          value: ui.url.get(
            "ldate",
            new Date(Date.now() - (365 / 2 - period) * DAY_MILLISECONDS)
              .toISOString()
              .substring(0, 10)
          ),
          period: period,
          onChange: function (dateRange) {
            self.updateLAILayer(0);
            dateRange
              .start()
              .format("YYYY-MM-dd")
              .evaluate(function (startDate) {
                ui.url.set("ldate", startDate);
              });
          },
          style: { position: "bottom-left" },
        })
      )
      .add(legend.palettePanel(laiVisParams, { position: "top-right" })),
    ui
      .Map({
        onClick: onMapClick,
        style: { cursor: "crosshair" },
      })
      .setOptions("TERRAIN")
      .add(
        ui.DateSlider({
          start: laiData.minDate(),
          value: ui.url.get(
            "rdate",
            new Date(Date.now() - period * DAY_MILLISECONDS)
              .toISOString()
              .substring(0, 10)
          ),
          period: period,
          onChange: function (dateRange) {
            self.updateLAILayer(1);
            dateRange
              .start()
              .format("YYYY-MM-dd")
              .evaluate(function (startDate) {
                ui.url.set("rdate", startDate);
              });
          },
          style: { position: "bottom-right" },
        })
      )
      .add(legend.palettePanel(laiVisParams, { position: "top-right" })),
  ]);

  this.splitPanel = ui.SplitPanel({
    firstPanel: linker.get(0),
    secondPanel: linker.get(1),
    wipe: true,
  });

  var headerStyle = {
    fontSize: "1.17em",
    fontWeight: "bold",
    margin: "8px 8px 0",
  };

  this.sidePanel = ui.Panel({
    widgets: [
      ui.Label({
        value: "GCOM-C LAI Overview",
        style: { fontSize: "2em", fontWeight: "bold" },
      }),
      ui.Label({
        value:
          "Visualize LAI (Leaf Area Index) observed by GCOM-C (Global Change Observation Mission - Climate)." +
          " The map shows mean values for different periods on the left and right to easily compare them." +
          " When you click the map, you can see a time series chart at the point.",
      }),
      ui.Label({
        value:
          "気候変動観測衛星「しきさい（GCOM-C）」で観測した葉面積指数（Leaf Area Index）を可視化する。" +
          "地図上の左右それぞれに異なる2つの期間の平均値が表示されており、比較することができる。" +
          "また、地図上をクリックすると、その地点の時系列推移を示すグラフが表示される。",
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
          [self.getLeftMap(), self.getRightMap()].forEach(function (map) {
            var dateSlider = map.widgets().get(MAP_DATE_SLIDER_WIDGET_INDEX);
            dateSlider.setPeriod(value);
            ui.url.set("period", value);
          });
        },
        style: { stretch: "horizontal" },
      }),
      ui.Label({
        value: "Clicked Point Chart",
        style: headerStyle,
      }),
      ui.Label({
        value: "[Click a point on the map]",
      }),
      ui.Label({
        value: "Dataset",
        style: headerStyle,
      }),
      ui.Label({
        value: "GCOM-C/SGLI L3 Leaf Area Index (V3)",
        style: { margin: "4px 8px 0" },
        targetUrl:
          "https://developers.google.com/earth-engine/datasets/catalog/JAXA_GCOM-C_L3_LAND_LAI_V3",
      }),
      ui.Label({
        value: "Official detail",
        style: { margin: "4px 8px 8px" },
        targetUrl:
          "https://suzaku.eorc.jaxa.jp/GCOM_C/data/update/Algorithm_LAI_en.html",
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

App.prototype.getLeftMap = function () {
  return this.splitPanel.getFirstPanel();
};

App.prototype.getRightMap = function () {
  return this.splitPanel.getSecondPanel();
};

App.prototype.updateLAILayer = function (splitPanelIndex) {
  // var map = this.splitPanel.getPanel(splitPanelIndex); // Error: Cannot read properties of undefined (reading 'firstPanel')
  var map = splitPanelIndex === 0 ? this.getLeftMap() : this.getRightMap();

  var dates = map.widgets().get(MAP_DATE_SLIDER_WIDGET_INDEX).getValue();
  var layer = ui.Map.Layer({
    eeObject: laiData.periodMeanImage(dates[0], dates[1]),
    visParams: laiVisParams,
    name: "LAI",
  });

  map.layers().set(LAI_LAYER_INDEX, layer);
};

App.prototype.updatePointLayer = function () {
  var self = this;
  [this.getLeftMap(), this.getRightMap()].forEach(function (map) {
    map.layers().set(
      POINT_LAYER_INDEX,
      ui.Map.Layer({
        eeObject: ee.Geometry.Point({
          coords: [self.coords.lon, self.coords.lat],
        }),
        name: "Point",
      })
    );
  });
};

App.prototype.updatePointChart = function () {
  var chart = ui.Chart.image
    .doySeriesByYear({
      imageCollection: laiData.correctedCollection(),
      bandName: "LAI_AVE",
      region: ee.Geometry.Point({ coords: [this.coords.lon, this.coords.lat] }),
      regionReducer: ee.Reducer.first(),
    })
    .setOptions({
      title:
        "LAI time series at (" + this.coords.lon + ", " + this.coords.lat + ")",
      hAxis: { title: "Day of year" },
      vAxis: { title: "LAI" },
      interpolateNulls: true,
    });

  this.sidePanel.widgets().set(SIDE_PANEL_CHART_WIDGET_INDEX, chart);
};

exports = App;
