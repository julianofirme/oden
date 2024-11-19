const { core } = Deno;

/**
 * Converts arguments into a string representation.
 * @param {...any} args - The arguments to convert to a string.
 * @returns {string} A string representation of the arguments.
 */
function argsToMessage(...args) {
  return args.map(arg => String(arg)).join(" "); 
}

/**
 * Log API
 * A global console object providing logging methods.
 */
globalThis.console = {
  /**
   * Logs messages to the console.
   * @param {...any} args - The messages or objects to log.
   */
  log: (...args) => {
    const message = argsToMessage(...args);
    core.print(`[OUT]: ${message}` + '\n', false); 
  },

  /**
   * Logs error messages to the console.
   * @param {...any} args - The error messages or objects to log.
   */
  error: (...args) => {
    const message = argsToMessage(...args);
    core.print(`[ERROR]: ${message}` + '\n', true);
  },
};

/**
 * File API
 * A global file object for file operations.
 */
globalThis.file = {
  /**
   * Writes contents to a file.
   * @param {string} path - The path of the file to write to.
   * @param {string} contents - The content to write into the file.
   * @returns {Promise<void>} A promise that resolves when the operation completes.
   */
  write: (path, contents) => {
    return core.ops.op_write_file(path, contents);
  },

  /**
   * Reads contents from a file.
   * @param {string} path - The path of the file to read.
   * @returns {Promise<string>} A promise that resolves with the file contents.
   */
  read: (path) => {
    return core.ops.op_read_file(path);
  },

  /**
   * Deletes a file.
   * @param {string} path - The path of the file to delete.
   * @returns {Promise<void>} A promise that resolves when the operation completes.
   */
  delete: (path) => {
    return core.ops.op_delete_file(path);
  } 
};

/**
 * Timers API
 * A global timer object for delay and cancel operations.
 */
const timers = new Map();
let timerIdCounter = 1;
globalThis.timer = {
  /**
   * Executes a callback after a specified delay.
   * @param {Function} callback - The function to execute after the delay.
   * @param {number} delay - The delay in milliseconds.
   * @param {...any} args - Arguments to pass to the callback.
   * @returns {number} A unique ID for the timer.
   */
  delay: (callback, delay, ...args) => {
    const id = timerIdCounter++;
    core.ops.op_set_timeout(delay).then(() => {
      if (timers.has(id)) { 
        callback(...args); 
        timers.delete(id);
      }
    });
    timers.set(id, true);
    return id;
  },

  /**
   * Cancels a pending timer by its ID.
   * @param {number} id - The ID of the timer to cancel.
   */
  cancel: (id) => {
    timers.delete(id); 
  }
};

/**
 * HTTP API
 * A global http object for HTTP operations, including creating a server.
 */
globalThis.http = {
  /**
   * Creates an HTTP server with basic routing and request handling.
   * @param {Object} options - The options to configure the HTTP server.
   * @param {number} options.port - The port to bind the server to.
   * @param {Object} options.routes - The routes to handle HTTP requests.
   * @param {Function} options.onError - A callback function to handle errors.
   * @returns {Promise<void>} A promise that resolves when the server starts.
   */
  createServer: async ({ port, routes, onError }) => {
    if (typeof routes !== 'object' || typeof onError !== 'function') {
      throw new Error('Invalid routes or onError callback');
    }
  
    try {
      const serverId = await core.ops.op_create_http_server(port);
  
      core.ops.op_on_http_request(serverId, async (request) => {
        const { method, url } = request;
  
        try {
          const routeHandler = routes[method]?.[url];
          const response = routeHandler
            ? await routeHandler(request)
            : {
                status: 404,
                body: 'Not Found',
                headers: { 'Content-Type': 'text/plain' },
              };
  
          core.ops.op_send_http_response(serverId, response);
        } catch (err) {
          onError(err, request);
          core.ops.op_send_http_response(serverId, {
            status: 500,
            body: 'Internal Server Error',
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      });
    } catch (err) {
      throw new Error(`Failed to create server: ${err.message}`);
    }
  },  

  /**
   * Sends an HTTP response to the client.
   * @param {Object} response - The response object to send.
   * @param {number} response.status - The HTTP status code.
   * @param {string} response.body - The response body content.
   * @param {Object} [response.headers] - Optional headers to send with the response.
   */
  sendResponse: (response) => {
    core.ops.op_send_http_response(response);
  },
};
