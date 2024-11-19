http.createServer({
  port: "8080",
  routes: {
    GET: {
      "/": async () => {
        return {
          status: 200,
          body: "Hello, this is the GET home page!",
          headers: { "Content-Type": "text/plain" },
        };
      },
      "/about": async () => {
        return {
          status: 200,
          body: "This is the about page",
          headers: { "Content-Type": "text/plain" },
        };
      },
    },
    POST: {
      "/submit": async (request) => {
        const body = await request.json();
        return {
          status: 200,
          body: `Received data: ${JSON.stringify(body)}`,
          headers: { "Content-Type": "application/json" },
        };
      },
    },
  },
  onError: (err, request) => {
    console.error(`Error processing request for ${request.url}:`, err);
  },
}).then(() => {
  console.log("Server is running on port 8080");
}).catch((err) => {
  console.error("Failed to start server:", err);
});