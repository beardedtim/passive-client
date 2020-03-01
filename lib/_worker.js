const config = {
  method: "POST"
};

self.onmessage = function(e) {
  const { data } = e;
  // if the leader is trying to configure us
  if (data.type === "CONFIG") {
    // set the config
    for (const [key, value] of Object.entries(data.payload)) {
      config[key] = value;
    }
  }

  // If we have set the url
  if (config.api_url) {
    // tell that api_url we did something
    fetch(config.api_url, {
      method: config.method,
      body: JSON.stringify(data)
    })
      .then(x => x.json())
      .then(self.postMessage);
  }
};
