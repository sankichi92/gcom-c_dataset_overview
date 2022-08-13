exports.createPanel = function (visParams, style) {
  return ui.Panel({
    widgets: [
      ui.Label({
        value: visParams.max,
        style: { margin: "4px auto" },
      }),
      ui.Thumbnail({
        image: ee.Image.pixelLonLat(),
        params: {
          region: ee.Geometry.Rectangle({
            coords: [0, 0, 5, 90],
            geodesic: false,
          }),
          bands: "latitude",
          min: 0,
          max: 90,
          palette: visParams.palette,
        },
        style: { margin: "0 auto" },
      }),
      ui.Label({
        value: visParams.min,
        style: { margin: "4px auto" },
      }),
    ],
    style: style,
  });
};
