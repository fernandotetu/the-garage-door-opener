class ExecutionHandler {
  performRF(action, perc, RFCode) {
    if (action == "action.devices.commands.OpenClose") {
      let message;
      let executed = false;

      if (perc == 100) {
        if (!this.isOpened()) {
          this.sendRF(RFCode);
          message = "Opening the door";
          executed = true;
        } else {
          message = "Door is already open";
        }
      } else {
        if (this.isOpened()) {
          this.sendRF(RFCode);
          message = "Closing the door";
          executed = true;
        } else {
          message = "Door is already close";
        }
      }

      return {
        success: executed,
        message: message,
      };
    }
  }
}

class NodeMCU extends ExecutionHandler {
   
    constructor(){
    
    }

  isOpened() {
    return digitalRead(D2) == 1; ;
  }

  sendRF(code) {
    require("RcSwitch").connect(6, D4, 3).send(code, 28);
  }
}
exports = NodeMCU;
