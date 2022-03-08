#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <RCSwitch.h>

RCSwitch mySwitch = RCSwitch();
ESP8266WebServer server(80);
const int magnet_switch = 2;

void setup() {
  Serial.begin(115200);
  while (!Serial) {}
  WiFi.begin("ssid", "pass");  //Connect to the WiFi network
  while (WiFi.status() != WL_CONNECTED) {  
    delay(500);
    Serial.print(".");
  }

  Serial.println(WiFi.localIP());  //Print the local IP
  pinMode(magnet_switch, INPUT_PULLUP);
  mySwitch.enableTransmit(4);

  server.on("/rf", handlerRF);
  server.on("/status", handlerStatus);
  server.begin(); //Start the server
  Serial.println("Server listening");

}

void loop() {
  server.handleClient(); //Handling of incoming requests
}

bool isOpened() {
  return digitalRead(magnet_switch) == HIGH;
}

void sendResponse(DynamicJsonDocument doc) {
  String json;
  serializeJson(doc, json);
  server.send(200, "application/json", json);
}

bool isValidRequest() {
  if ( server.hasArg("plain") == false ) { //Check if body received
    server.send(400, "text/plain", "bad request");
    return false;
  }
  return true;
}

void handlerStatus() {
  if ( isValidRequest() ) {
    unsigned long exeTime= millis();
    const size_t bufferSize = 2 * (JSON_ARRAY_SIZE(2) + JSON_OBJECT_SIZE(6));
    DynamicJsonDocument requestArgs(bufferSize);
    deserializeJson(requestArgs, server.arg("plain"));

    DynamicJsonDocument doc(128);
    doc["success"] = true;
    doc["requestId"] = requestArgs["requestId"];
    doc["isOpened"] = isOpened();
    doc["time"] = millis()-exeTime;
    doc["free"] = ESP.getFreeHeap();
    doc["used"] = 53436-ESP.getFreeHeap();
      
    sendResponse(doc);

  }
}
bool performRF(long code) {
  mySwitch.send(code, 24);
  return true;
}

void handlerRF() {
  
  if ( isValidRequest() ) {
    unsigned long exeTime= millis();
    const size_t bufferSize = 2 * (JSON_ARRAY_SIZE(4) + JSON_OBJECT_SIZE(11));
    DynamicJsonDocument requestArgs(bufferSize);
    deserializeJson(requestArgs, server.arg("plain"));
    DynamicJsonDocument cmd = requestArgs["inputs"][0]["payload"]["commands"][0]["execution"][0];

    const char* action = cmd["command"];
    const int perc = cmd["params"]["openPercent"];
    const long RFCode = cmd["params"]["RFCode"];
    if ( strcmp(action, "action.devices.commands.OpenClose") == 0   ) {
      bool executed = false;
      String message;
      if ( perc == 100 ) {
        if ( !isOpened() ) {
          executed = performRF(RFCode);
          message = "Opening the door";
        } else {
          message = "Door is already open";
        }
      } else {
        if ( isOpened() ) {
          executed = performRF(RFCode);
          message = "Closing the door";
        } else {
          message = "Door is already close";
        }
      }

      DynamicJsonDocument doc(256);
      doc["success"] = executed;
      doc["requestId"] = requestArgs["requestId"];
      doc["message"] = message;
      doc["time"] = millis()-exeTime;
      doc["free"] = ESP.getFreeHeap();
      doc["used"] = 53436-ESP.getFreeHeap();
      
      sendResponse(doc);

    } else {
      server.send(400, "text/plain", "Invalid command");
    }

  }
}
