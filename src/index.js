var App = function (
  map,
  lstCollection,
  startDate,
  endDate,
  satelliteDirection
) {
  this.map = map;
  this.lstCollection = lstCollection;
  this.startDate = startDate;
  this.endDate = endDate;
  this.satelliteDirection = satelliteDirection;
};

App.prototype.setLayer = function () {
  var image = this.lstCollection
    .filterDate(this.startDate, this.endDate)
    .filter(ee.Filter.eq("SATELLITE_DIRECTION", this.satelliteDirection))
    .select("LST_AVE")
    .mean()
    .multiply(0.02)
    .add(-273.15);

  var visParams = {
    min: -20,
    max: 60,
    palette: ["blue", "limegreen", "yellow", "darkorange", "red"],
  };

  var layer = ui.Map.Layer(image, visParams, "LST");

  this.map.layers().set(0, layer);
};

App.prototype.setSatelliteDirection = function (satelliteDirection) {
  this.satelliteDirection = satelliteDirection;
  this.setLayer();
};

App.prototype.setPeriod = function (startDate, endDate) {
  this.startDate = startDate;
  this.endDate = endDate;
  this.setLayer();
};

var buildPanel = function (
  defaultSatelliteDirection,
  onSatelliteDirectionChange,
  startDate,
  defaultDate,
  defaultPeriod,
  onDateChange
) {
  var headerStyle = {
    fontSize: "1.17em",
    fontWeight: "bold",
    margin: "8px 8px 0",
  };
  var inputStyle = { stretch: "horizontal" };

  var dateSlider = ui.DateSlider({
    start: startDate,
    value: defaultDate,
    period: defaultPeriod,
    onChange: onDateChange,
    style: inputStyle,
  });

  var panel = ui.Panel({
    widgets: [
      ui.Label({
        value: "GCOM-C LST Overview",
        style: { fontSize: "2em", fontWeight: "bold" },
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
      ui.Label({
        value: "Satellite Directtion",
        style: headerStyle,
      }),
      ui.Select({
        items: [
          { label: "Ascending (Nighttime)", value: "A" },
          { label: "Descending (Daytime)", value: "D" },
        ],
        value: defaultSatelliteDirection,
        onChange: onSatelliteDirectionChange,
        style: inputStyle,
      }),
      ui.Label({
        value: "Date",
        style: headerStyle,
      }),
      dateSlider,
      ui.Label({
        value: "Period (days)",
        style: headerStyle,
      }),
      ui.Slider({
        min: 1,
        max: 90,
        value: defaultPeriod,
        step: 1,
        onChange: function (value) {
          dateSlider.setPeriod(value);
        },
        style: inputStyle,
      }),
    ],
    style: { width: "400px" },
  });

  return panel;
};

var lstCollection = ee.ImageCollection("JAXA/GCOM-C/L3/LAND/LST/V3");
var today = ee.Date(Date.now());
var defaultPeriod = 7;

var app = new App(
  Map,
  lstCollection,
  today.advance(-defaultPeriod, "days"),
  today,
  "A"
);

var panel = buildPanel(
  app.satelliteDirection,
  function (satelliteDirection) {
    app.setSatelliteDirection(satelliteDirection);
  },
  lstCollection.first().date(),
  app.startDate,
  defaultPeriod,
  function (dateRange) {
    app.setPeriod(dateRange.start(), dateRange.end());
  }
);

Map.drawingTools().setShown(false);
ui.root.insert(0, panel);
app.setLayer();
