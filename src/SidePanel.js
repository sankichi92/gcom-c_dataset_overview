exports.build = function (
  defaultSatelliteDirection,
  onSatelliteDirectionChange,
  dateSliderStart,
  onDateSliderChange
) {
  var headerStyle = {
    fontSize: "1.17em",
    fontWeight: "bold",
    margin: "8px 8px 0",
  };

  var dateSlider = ui.DateSlider({
    start: dateSliderStart,
    period: 7,
    onChange: onDateSliderChange,
    style: { stretch: "horizontal" },
  });

  var pointLabel = ui.Label({
    value: "Point: [Click a point on the map]",
    style: { margin: "4px 8px 0" },
  });

  var valueLabel = ui.Label({
    value: "Value: [Click a point on the map]",
    style: { margin: "4px 8px 8px" },
  });

  var panel = ui.Panel({
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
        value: defaultSatelliteDirection,
        onChange: onSatelliteDirectionChange,
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
      pointLabel,
      valueLabel,
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

  // DateSlider のコンストラクタに value を渡してもなぜかその通りの値にならないので、
  // setValue を呼んでコールバックを発火させることで無理やり LST レイヤーの状態と一致させている
  dateSlider.setValue(ee.Date(Date.now()).advance(-14, "days"));

  panel.setPointCoords = function (coords) {
    pointLabel.setValue("Point: (" + coords.lon + ", " + coords.lat + ")");
  };

  panel.setPointValue = function (value) {
    if (isNaN(value)) {
      valueLabel.setValue("Value: " + value);
    } else {
      valueLabel.setValue("Value: " + value.toFixed(2) + " ℃");
    }
  };

  return panel;
};
