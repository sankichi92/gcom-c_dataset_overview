var App = require("users/sankichi92/gcom-c_lst_overview:src/App.js");

ui.root.clear();

var app = App.build();

ui.root.add(app.panel);
ui.root.add(app.map);

app.updateLSTLayer();
app.updatePointLayer();
app.updatePointValueLabel();
