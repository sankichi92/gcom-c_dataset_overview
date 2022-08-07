var SidePanel = require("users/sankichi92/gcom-c_lst_overview:src/SidePanel.js");
var LSTLayer = require("users/sankichi92/gcom-c_lst_overview:src/LSTLayer.js");

ui.root.clear();

var map = ui.Map({
  center: { lat: 35.652832, lon: 139.839478 }, // 東京
});

var lstCollection = ee.ImageCollection("JAXA/GCOM-C/L3/LAND/LST/V3");
print(lstCollection);

var layerBuilder = new LSTLayer.Builder(
  lstCollection,
  "2022-07-01", // この値は使われない。SidePanel.js のコメント参照
  "2022-07-08", // 同上
  "A"
);

var panel = SidePanel.build(
  layerBuilder.satelliteDirection,
  function (satelliteDirection) {
    layerBuilder.satelliteDirection = satelliteDirection;
    map.layers().set(0, layerBuilder.buildLayer());
  },
  lstCollection.first().date(),
  function (dateRange) {
    layerBuilder.startDate = dateRange.start();
    layerBuilder.endDate = dateRange.end();
    map.layers().set(0, layerBuilder.buildLayer());
  }
);

ui.root.add(panel);
ui.root.add(map);

map.onClick(function (coords) {
  panel.setPointCoords(coords);

  var point = ee.Geometry.Point(coords.lon, coords.lat);
  map.layers().set(1, ui.Map.Layer({ eeObject: point, name: "Point" }));

  layerBuilder
    .buildImage()
    .sample({ region: point, scale: 30 })
    .first()
    .getInfo(function (feature) {
      if (feature) {
        panel.setPointValue(feature.properties.LST_AVE);
      } else {
        // 海などデータがない場合
        panel.setPointValue("N/A");
      }
    });

  var ic = lstCollection
    .filter(
      ee.Filter.eq("SATELLITE_DIRECTION", layerBuilder.satelliteDirection)
    )
    .select("LST_AVE")
    .map(function (image) {
      return image
        .multiply(0.02) // 傾斜係数
        .subtract(273.15) // ケルビン→摂氏
        .copyProperties(image, ["system:time_start"]);
    });

  var chart = ui.Chart.image.series({
    imageCollection: ic,
    region: point,
    reducer: ee.Reducer.first(),
  });
  print(chart);
});
