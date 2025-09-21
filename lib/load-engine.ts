/**
 * Pure TypeScript engine loader for Stockfish
 * This replaces the old CommonJS loadEngine with ES module compatible implementation
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

interface EngineQueue {
  cmd: string;
  cb?: (message: string) => void;
  stream?: boolean;
  message?: string;
  done?: boolean;
  discard?: boolean;
}

interface WorkerLike {
  onmessage?: (data: string) => void;
  postMessage: (message: string) => void;
  terminate: () => void;
}

interface Engine {
  send: (cmd: string, cb?: (message: string) => void, stream?: boolean) => void;
  quit: () => void;
  stream?: (line: string) => void;
  started: number;
  loaded?: boolean;
  ready?: boolean;
}

const debugging = false;

function spawnWorker(enginePath: string, options?: any): WorkerLike {
  const args = (options && options.args) || [];
  let engine: ChildProcess;

  function echo(data: Buffer) {
    let str = data.toString();
    if (debugging) {
      console.log("echo:", str);
    }
    
    // Trim off new lines
    if (str.slice(-1) === "\n") {
      str = str.slice(0, -1);
    }
    
    if (worker.onmessage) {
      worker.onmessage(str);
    }
  }

  const worker: WorkerLike = {
    postMessage: (str: string) => {
      if (debugging) {
        console.log("stdin:", str);
      }
      if (engine && engine.stdin) {
        engine.stdin.write(str + "\n");
      }
    },
    terminate: () => {
      if (engine) {
        engine.kill();
      }
    }
  };

  if (enginePath.slice(-3).toLowerCase() === ".js") {
    args.push(enginePath);
    const execPath = process.execPath;
    
    // Add Node.js flags for WASM support if needed
    const majorVersion = parseInt(process.version.substr(1, 2));
    if (majorVersion >= 14 && majorVersion < 19) {
      args.unshift("--experimental-wasm-threads");
      args.unshift("--experimental-wasm-simd");
    }
    
    engine = spawn(execPath, args, { stdio: "pipe" });
  } else {
    engine = spawn(enginePath, args, { stdio: "pipe" });
  }

  if (engine.stdout) {
    engine.stdout.on("data", echo);
  }
  
  if (engine.stderr) {
    engine.stderr.on("data", echo);
  }

  engine.on("error", (err) => {
    throw err;
  });

  return worker;
}

function newWorker(enginePath?: string, options?: any): WorkerLike | null {
  // For Node.js environment
  if (typeof global !== "undefined" && 
      typeof process !== "undefined" && 
      Object.prototype.toString.call(process) === "[object process]") {
    
    const defaultPath = enginePath || getDefaultEnginePath();
    return spawnWorker(defaultPath, options);
  }

  // For browser environment with Web Workers
  if (typeof Worker === "function") {
    const workerPath = enginePath || "stockfish.js";
    const webWorker = new Worker(workerPath);
    
    return {
      onmessage: undefined,
      postMessage: (message: string) => webWorker.postMessage(message),
      terminate: () => webWorker.terminate()
    };
  }

  return null;
}

function getFirstWord(line: string): string {
  const spaceIndex = line.indexOf(" ");
  if (spaceIndex === -1) {
    return line;
  }
  return line.substr(0, spaceIndex);
}

function determineQueueNum(line: string, queue: EngineQueue[]): number {
  if (queue.length === 0) return 0;
  
  const firstWord = getFirstWord(line);
  let cmdType: string;

  // bench and perft are blocking commands
  if (queue[0].cmd !== "bench" && queue[0].cmd !== "perft") {
    if (firstWord === "uciok" || firstWord === "option") {
      cmdType = "uci";
    } else if (firstWord === "readyok") {
      cmdType = "isready";
    } else if (firstWord === "bestmove" || firstWord === "info") {
      cmdType = "go";
    } else {
      cmdType = "other";
    }

    for (let i = 0; i < queue.length; i++) {
      const cmdFirstWord = getFirstWord(queue[i].cmd);
      if (cmdFirstWord === cmdType || 
          (cmdType === "other" && (cmdFirstWord === "d" || cmdFirstWord === "eval"))) {
        return i;
      }
    }
  }

  return 0;
}

export function loadEngine(enginePath?: string, options?: any): Engine {
  const worker = newWorker(enginePath, options);
  if (!worker) {
    throw new Error("Could not create worker for engine");
  }

  const engine: Engine = {
    started: Date.now(),
    send: () => {},
    quit: () => {}
  };
  
  const queue: EngineQueue[] = [];
  const evalRegex = /Total Evaluation[\s\S]+\n$/;

  worker.onmessage = (data: string) => {
    const line = data;
    let done = false;
    let queueNum = 0;
    
    // Handle multi-line responses
    if (line.indexOf("\n") > -1) {
      const lines = line.split("\n");
      for (const singleLine of lines) {
        if (singleLine.trim()) {
          worker.onmessage!(singleLine);
        }
      }
      return;
    }

    if (queue.length > 0) {
      queueNum = determineQueueNum(line, queue);
      const myQueue = queue[queueNum];
      
      if (!myQueue.message) {
        myQueue.message = "";
      }
      
      myQueue.message += line;

      // Pass to stream handler if available
      if (engine.stream) {
        engine.stream(line);
      }

      // Determine if stream is done
      if (line === "uciok") {
        done = true;
        engine.loaded = true;
      } else if (line === "readyok") {
        done = true;
        engine.ready = true;
      } else if (line.substr(0, 8) === "bestmove" && myQueue.cmd !== "bench") {
        done = true;
        myQueue.message = line; // Only keep the bestmove line
      } else if (myQueue.cmd === "d") {
        if (line.substr(0, 15) === "Legal uci moves" || line.substr(0, 6) === "Key is") {
          myQueue.done = true;
          done = true;
          if (line === "Key is") {
            myQueue.message = myQueue.message.slice(0, -7);
          }
        }
      } else if (myQueue.cmd === "eval") {
        if (evalRegex.test(myQueue.message)) {
          done = true;
        }
      } else if (line.substr(0, 8) === "pawn key") {
        done = true;
      } else if (line.substr(0, 12) === "Nodes/second") {
        done = true;
      } else if (line.substr(0, 15) === "Unknown command") {
        done = true;
      }

      if (done) {
        queue.splice(queueNum, 1);
        if (myQueue.cb && !myQueue.discard) {
          myQueue.cb(myQueue.message);
        }
      }
    }
  };

  engine.send = (cmd: string, cb?: (message: string) => void, stream?: boolean) => {
    cmd = String(cmd).trim();
    
    if (debugging) {
      console.log("debug (send):", cmd);
    }

    let noReply = false;
    
    // Only add to queue for commands that always print
    if (cmd !== "ucinewgame" && 
        cmd !== "flip" && 
        cmd !== "stop" && 
        cmd !== "ponderhit" && 
        cmd.substr(0, 8) !== "position" && 
        cmd.substr(0, 9) !== "setoption" && 
        cmd !== "stop") {
      
      queue.push({
        cmd,
        cb,
        stream
      });
    } else {
      noReply = true;
    }

    worker.postMessage(cmd);

    if (noReply && cb) {
      setTimeout(cb, 0);
    }
  };

  engine.quit = () => {
    worker.terminate();
  };

  return engine;
}

/**
 * Get default engine path
 */
export function getDefaultEnginePath(): string {
  // Try to find the engine in the src directory relative to the project root
  const projectRoot = process.cwd();
  const srcPath = path.join(projectRoot, "src", "stockfish.js");
  
  // For built/distributed versions, try relative to dist
  if (!fs.existsSync(srcPath)) {
    // Try relative to the current file's location
    const currentDir = path.dirname(require.main?.filename || __filename);
    return path.join(currentDir, "..", "src", "stockfish.js");
  }
  
  return srcPath;
}

export default loadEngine;