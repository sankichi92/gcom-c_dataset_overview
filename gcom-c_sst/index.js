var App = require("users/sankichi92/gcom-c_lst_overview:gcom-c_sst/App.js");

ui.root.clear();

var app = App.build();

ui.root.add(app.panel);
ui.root.add(app.map);

app.updateSSTLayer();
app.updatePointLayer();
app.updatePointValueLabel();
app.updatePointChart();
