var App = require("users/sankichi92/gcom-c_dataset_overview:src/lst/App.js");

ui.root.clear();

var app = App.build();

ui.root.add(app.panel);
ui.root.add(app.map);

app.updateLSTLayer();
app.updatePointLayer();
app.updatePointValueLabel();
app.updatePointChart();
