const http = require("http");

 class LightExpress {
  constructor(opts) {
    this.opts = opts;

    this.routes = [];
    this.get = this.add.bind(this, "GET");
    this.post = this.add.bind(this, "POST");
    this.handler = this.handler.bind(this);
    // this.static = this.static.bind(this, "GET");
  }
  add(method, route, fn) {
    this.routes.push({ method: method, route: route, fn: fn });
    return this;
  }

  listen() {
    this.server = http.createServer(this.handler);
    this.server.listen.apply(this.server, arguments);
    return this;
  }

  find(method, url) {
    const arrOfRoutes = this.routes;
    for (let i = 0; i < arrOfRoutes.length; i++) {
      if (arrOfRoutes[i].route === url && arrOfRoutes[i].method === method) {
        return arrOfRoutes[i].fn;
        break;
      }
    }
    return (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.writeHead(404);
      res.end(JSON.stringify({ titile: "page not found" }));
    };
  }

  bodyJsonDecode(data) {
    return JSON.parse(data);
  }

  bodyUrlDecode(data) {
    let bodyData = {};
    data.split("&").forEach((element) => {
      const el = element.split("=");
      bodyData[el[0]] = decodeURIComponent(el[1]);
    });
    return bodyData;
  }

  bodyDataDecode(req, result) {
    const contentType = {};
    Object.keys(req.headers).forEach((elem) => {
      contentType[elem.toLowerCase()] = req.headers[elem];
    });

    switch (contentType["content-type"]) {
      case "application/json":
        return this.bodyJsonDecode(result);
        break;

      case "application/x-www-form-urlencoded":
        return this.bodyUrlDecode(result);
        break;

      default:
        return {
          error: `router don't know mime type: ${contentType}`,
        };
        break;
    }
  }

  bodyLoad(req) {
    return new Promise((resolve, reject) => {
      try {
        let result = "";
        req.on("data", (d) => {
          result += d;
        });
        req.on("end", () => {
          resolve(this.bodyDataDecode(req, result));
        });
        req.on("error", (err) => {
          throw new Error(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  handler(req, res) {
    res.setHeader("Content-Type", "application/json");
    const result = this.find(req.method, req.url);
    switch (req.method) {
      case "POST":
        this.bodyLoad(req).then((data) => {
          req.body = data;
          return result(req, res);
        });
        break;
      case "GET":
      default:
        return result(req, res);
        break;
    }
  }
}
exports = LightExpress;
//module.exports = new LightExpress();
//export default () => new LightExpress();
//exports  = LightExpress
