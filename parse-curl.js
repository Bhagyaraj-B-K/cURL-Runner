// parse-curl.js - classic script format
(function (global) {
  function shellwordsSplit(str) {
    const result = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = null;

    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (inQuotes) {
        if (c === quoteChar) {
          inQuotes = false;
          quoteChar = null;
        } else {
          current += c;
        }
      } else {
        if (c === '"' || c === "'") {
          inQuotes = true;
          quoteChar = c;
        } else if (/\s/.test(c)) {
          if (current.length) {
            result.push(current);
            current = "";
          }
        } else {
          current += c;
        }
      }
    }
    if (current.length) result.push(current);
    return result;
  }

  function rewriteArgs(args) {
    return args.flatMap((arg) =>
      arg.startsWith("-X") && arg.length > 2 ? ["-X", arg.slice(2)] : [arg]
    );
  }

  function parseHeaderField(field) {
    const index = field.indexOf(":");
    if (index === -1) return [field, ""];
    return [field.slice(0, index).trim(), field.slice(index + 1).trim()];
  }

  function isURL(str) {
    return /^https?:\/\//.test(str);
  }

  global.parseCurlCommand = function (cmd) {
    let command = "";
    let i = 0;

    while (i < cmd.length) {
      const char = cmd[i];

      if (char === "\\") {
        const nextChar = cmd[i + 1];
        const nextNextChar = cmd[i + 2];

        // Handle \n or \r\n line continuation
        if (nextChar === "\n") {
          i += 2; // skip both
          command += " "; // replace with space
          continue;
        } else if (nextChar === "\r" && nextNextChar === "\n") {
          i += 3;
          command += " ";
          continue;
        } else {
          i += 1;
          command += " ";
        } 
      } else {
        command += char;
        i += 1;
      }
    }
    const args = rewriteArgs(shellwordsSplit(command));
    const result = {
      method: "GET",
      headers: {},
      body: null,
    };

    let currentFlag = "";

    for (const arg of args) {
      switch (true) {
        case isURL(arg):
          result.url = arg;
          break;
        case ["-A", "--user-agent"].includes(arg):
          currentFlag = "user-agent";
          break;
        case ["-H", "--header"].includes(arg):
          currentFlag = "header";
          break;
        case ["-d", "--data", "--data-ascii"].includes(arg):
          currentFlag = "data";
          break;
        case ["-u", "--user"].includes(arg):
          currentFlag = "user";
          break;
        case ["-I", "--head"].includes(arg):
          result.method = "HEAD";
          break;
        case ["-X", "--request"].includes(arg):
          currentFlag = "method";
          break;
        case ["-b", "--cookie"].includes(arg):
          currentFlag = "cookie";
          break;
        case arg === "--compressed":
          result.headers["Accept-Encoding"] =
            result.headers["Accept-Encoding"] || "deflate, gzip";
          break;
        case !!arg:
          switch (currentFlag) {
            case "header": {
              const [key, value] = parseHeaderField(arg);
              result.headers[key] = value;
              break;
            }
            case "user-agent":
              result.headers["User-Agent"] = arg;
              break;
            case "data":
              if (["GET", "HEAD"].includes(result.method)) {
                result.method = "POST";
              }
              result.headers["Content-Type"] =
                result.headers["Content-Type"] ||
                "application/x-www-form-urlencoded";
              result.body = result.body ? `${result.body}&${arg}` : arg;
              break;
            case "user":
              result.headers["Authorization"] = "Basic " + btoa(arg);
              break;
            case "method":
              result.method = arg;
              break;
            case "cookie":
              result.headers["Cookie"] = arg;
              break;
          }
          currentFlag = "";
          break;
      }
    }

    if (!result.url) {
      throw new Error("No URL found in curl command");
    }

    return result;
  };
})(self);
