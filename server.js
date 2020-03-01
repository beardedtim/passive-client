import express from "express";

const server = express();

server.use(
  express.static("./", {
    extensions: ["html"]
  })
);

server.post("/", (req, res) => {
  res.json({ data: true });
});

server.listen(5000);
