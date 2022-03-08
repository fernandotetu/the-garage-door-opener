const wifi = require("Wifi");
const LightExpress = require("light-express");
const NodeMcu = require("node-mcu");

wifi.connect("campus_avancado", { password: "awp0610#" });

const node = new NodeMcu();

const server = new LightExpress();
server.post("/rf", (req, res) => {
  const cmd = req.body.inputs[0].payload.commands[0].execution[0];
  const result = node.performRF(
    cmd.command,
    cmd.params.openPercent,
    cmd.params.RFCode
  );
  if (result) {
    result.requestId = req.body.requestId;
    res.end(JSON.stringify(result));
  } else {
    res.writeHead(400);
    res.end("Invalid command");
  }
});

server.post("/status", (req, res) => {
  const data = req.body;
  const result = {
    requestId: data.requestId,
    isOpened: node.isOpened(),
  };
  res.end(JSON.stringify(result));
});

server.listen(80);
