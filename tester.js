#!/usr/bin/env node

//var params = getParams({booleans: ["no-multi-threading"]});
var params = require("util").parseArgs({strict: false, allowPositionals: false}).values;
var score;
var depthFound;
var enginePath = params.enginePath ?? require("path").join(__dirname, "src", "stockfish.js");
var execPath = params.execPath ?? process.execPath;
var minDepth = Number((params.minDepth || params["min-depth"]) ?? 20);
var minScore = Number((params.minScore || params["min-score"]) ?? 500);
var testCompletedCorrectly = false;
var spawnArgs = [];

if (enginePath) {
    spawnArgs.push(enginePath);
}

highlight("Starting: " + execPath + (spawnArgs.length ? " " + spawnArgs.join(" ") : ""));

var stockfish = require("child_process").spawn(execPath, spawnArgs, {stdio: "pipe", env: process.env, encoding: "utf8", detached: true, shell: true});

function getParams(options, argv)
{
    var i,
        params = {_: []},
        last,
        len,
        match;
    
    if (Array.isArray(options)) {
        args = options;
        options = {};
    }
    
    options = options || {};
    
    if (!options.booleans) {
        options.booleans = [];
    }
    
    argv = argv || process.argv;
    
    len = argv.length;
    
    for (i = 2; i < len; i += 1) {
        if (argv[i][0] === "-") {
            if (argv[i][1] === "-") {
                last = argv[i].substr(2);
                match = last.match(/([^=]*)=(.*)/);
                if (match) {
                    last = match[1];
                    params[last] = match[2];
                    last = "";
                } else {
                    params[last] = true;
                }
            } else {
                /// E.g., -hav should indicate h, a, and v as TRUE.
                argv[i].split("").slice(1).forEach(function oneach(letter)
                {
                    params[letter] = true;
                    last = letter;
                });
            }
        } else if (last) {
            params[last] = argv[i];
            last = "";
        } else {
            params._.push(argv[i]);
            last = "";
        }
        /// Handle booleans.
        if (last && options.booleans.indexOf(last) > -1) {
            last = "";
        }
    }
    
    return params;
}

function good(mixed)
{
    console.log("\u001B[32m" + mixed + "\u001B[0m");
}

function highlight(mixed)
{
    console.log("\u001B[33m" + mixed + "\u001B[0m");
}

function error(mixed)
{
    console.error("\u001B[31m" + mixed + "\u001B[0m");
    throw new Error(mixed);
}


function write(str)
{
    highlight("STDIN: " + str);
    stockfish.stdin.write(str + "\n");
}

stockfish.on("error", function (err)
{
    throw err;
});

stockfish.stdout.on("data", function onstdout(data)
{
    if (typeof data !== "string") {
        data = data.toString();
    }
    
    process.stdout.write(data);
    
    if (data.indexOf("uciok") > -1) {
        good("**Found uciok**");
        write("ucinewgame");
        write("isready");
        write("position startpos moves f2f4 e7e5 g1f3 d8h4");
        write("eval");
        write("d");
        if (!params["no-multi-threading"]) {
            write("setoption name Threads value 5");
        }
    }
    
    if (data.indexOf("score cp ") > -1) {
        score = Number(data.match(/score cp ([-\d.]+)/)[1]);
    }
    if (data.indexOf("depth ") > -1) {
        depthFound = Number(data.match(/depth ([\d]+)/)[1]);
    }
    
    if (data.indexOf("Checkers:") > -1) {
        if (data.indexOf("Checkers: h4") > -1) {
            good("**Found Checkers**");
            /// Make sure ponder works.
            write("go ponder");
            setTimeout(function ()
            {
                write("stop");
            }, 3000);
        } else {
            error("Cannot find valid legal uci moves.");
        }
    }
    
    if (data.indexOf("bestmove") > -1) {
        if (data.indexOf("bestmove f3h4") > -1) {
            good("**Found bestmove**");
            if (score < minScore) {
                error("Bad score. Got " + score + "; expected >= " + minScore);
            }
            if (depthFound < minDepth) {
                error("Bad depth. Got " + depthFound + "; expected >= " + minDepth);
            }
            write("quit");
            testCompletedCorrectly = true;
        } else {
            error("Did not find expected move (h4).");
        }
    }
});

stockfish.on("exit", function (code)
{
    if (code) {
        error("Exited with code: " + code);
    }
});

setTimeout(function ()
{
    error("Timeout");
}, 1000 * 5).unref();

process.on("exit", function ()
{
    if (!testCompletedCorrectly) {
        error("Test did not complete correctly.");
    }
});

write("uci");
