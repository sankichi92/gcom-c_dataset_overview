var palettes = require("users/gena/packages:palettes");
var legend = require("users/sankichi92/gcom-c_dataset_overview:lib/legend.js");
var chlaData = require("users/sankichi92/gcom-c_dataset_overview:src/chla/chlaData.js");

var CHLA_LAYER_INDEX = 0;
var POINT_LAYER_INDEX = 1;

var DATE_SLIDER_WIDGET_INDEX = 6;
var POINT_CHART_WIDGET_INDEX = 8;

var DAY_MILLISECONDS = 86400000;

var chlaVisParams = {
  min: -2,
  max: 2,
  palette: palettes.crameri.hawaii[50].reverse(),
};

var App = function () {
  this.coords = {
    // https://www.geocoding.jp/?q=東京駅
    lon: ui.url.get("lon", 139.767125),
    lat: ui.url.get("lat", 35.681236),
  };

  var self = this;

  this.map = ui
    .Map({
      center: this.coords,
      onClick: function (coords) {
        self.coords = coords;
        self.updatePointLayer();
        self.updatePointChart();
        ui.url.set("lon", coords.lon);
        ui.url.set("lat", coords.lat);
      },
      style: { cursor: "crosshair" },
    })
    .setOptions("HYBRID")
    .add(
      legend.palettePanel(
        { min: "10^-2", max: "10^2", palette: chlaVisParams.palette },
        { position: "bottom-right" }
      )
    );

  var period = ui.url.get("period", 28);

  var headerStyle = {
    fontSize: "1.17em",
    fontWeight: "bold",
    margin: "8px 8px 0",
  };

  this.panel = ui.Panel({
    widgets: [
      ui.Label({
        value: "GCOM-C CHLA Overview",
        style: { fontSize: "2em", fontWeight: "bold" },
      }),
      ui.Label({
        value:
          "Visualize CHLA (Chlorophyll-a Concentration) observed by GCOM-C (Global Change Observation Mission - Climate)." +
          " The map shows mean values over the specified period." +
          " When you click the map, you can see  a time series chart at the point.",
      }),
      ui.Label({
        value:
          "気候変動観測衛星「しきさい（GCOM-C）」で観測したクロロフィルa 濃度について、指定した期間の平均値を可視化する。" +
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
        start: chlaData.minDate(),
        value: ui.url.get(
          "date",
          new Date(Date.now() - period * DAY_MILLISECONDS)
            .toISOString()
            .substring(0, 10)
        ),
        period: period,
        onChange: function (dateRange) {
          self.updateCHLALayer();
          dateRange
            .start()
            .format("YYYY-MM-dd")
            .evaluate(function (startDate) {
              ui.url.set("date", startDate);
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
        value: "GCOM-C/SGLI L3 Chlorophyll-a Concentration (V3) ",
        style: { margin: "4px 8px 0" },
        targetUrl:
          "https://developers.google.com/earth-engine/datasets/catalog/JAXA_GCOM-C_L3_OCEAN_CHLA_V3",
      }),
      ui.Label({
        value: "Official detail",
        style: { margin: "4px 8px 8px" },
        targetUrl:
          "https://suzaku.eorc.jaxa.jp/GCOM_C/data/update/Algorithm_IWPR_en.html",
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

App.prototype.updateCHLALayer = function () {
  var dates = this.getStartAndEndDates();

  var layer = ui.Map.Layer({
    eeObject: chlaData.periodMeanImage(dates[0], dates[1]).log10(),
    visParams: chlaVisParams,
    name: "CHLA",
  });

  this.map.layers().set(CHLA_LAYER_INDEX, layer);
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
};

App.prototype.updatePointChart = function () {
  var chart = ui.Chart.image
    .series({
      imageCollection: chlaData.celsiusCollection(),
      region: ee.Geometry.Point({ coords: [this.coords.lon, this.coords.lat] }),
      reducer: ee.Reducer.first(),
    })
    .setSeriesNames(["CHLA"])
    .setOptions({
      title:
        "CHLA time series at (" +
        this.coords.lon +
        ", " +
        this.coords.lat +
        ")",
      legend: { position: "none" },
      hAxis: { title: null },
      vAxis: { title: "CHLA (mg/m^3)", logScale: true },
      interpolateNulls: true,
    });

  this.panel.widgets().set(POINT_CHART_WIDGET_INDEX, chart);
};

exports = App;
