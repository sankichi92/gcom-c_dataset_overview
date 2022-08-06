var SidePanel = require("users/sankichi92/gcom-c_lst_overview:src/SidePanel.js");
var LSTLayer = require("users/sankichi92/gcom-c_lst_overview:src/LSTLayer.js");

ui.root.clear();

var map = ui.Map({
  center: { lat: 35.652832, lon: 139.839478 }, // 東京
});

var lstCollection = ee.ImageCollection("JAXA/GCOM-C/L3/LAND/LST/V3");

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
    map.layers().set(0, layerBuilder.build());
  },
  lstCollection.first().date(),
  function (dateRange) {
    layerBuilder.startDate = dateRange.start();
    layerBuilder.endDate = dateRange.end();
    map.layers().set(0, layerBuilder.build());
  }
);

ui.root.add(panel);
ui.root.add(map);
