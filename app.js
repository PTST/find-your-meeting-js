var floorMaps = require('./floorMap.json');
var locations = require('./locations.json');
var stairs = require('./up_down.json')
var fs = require('fs');
var PF = require('pathfinding');


console.time("timer")
if ((process.argv[2] !== void 0) && (process.argv[2].toUpperCase() == "HELP")) {
    console.log("Invoke with 'node app.js StartLocation EndLocation'")
    process.exit()
}

if (process.argv.length != 4) {
    if (process.argv.length > 4) {
        throw "Too many arguments! Use 'HELP' as argument for instructions"
    } else {
        throw "Too few arguments!"
    }
}

startLocation = process.argv[2].toUpperCase()
endLocation = process.argv[3].toUpperCase()
var paths = []

console.log(startLocation)
console.log(endLocation)

if (!(startLocation in locations)) {
    throw "Not a valid starting point!"
}
if (!(endLocation in locations)) {
    throw "Not a valid end point!"
}

if (startLocation == endLocation) {
    throw "Starting point cannot be the same as the end point"
}

startFloor = startLocation.substring(1, 2)
endFloor = endLocation.substring(1, 2)
finder = new PF.AStarFinder();

if (startFloor == endFloor) {
    path = getPath(
        locations[startLocation][0],
        locations[startLocation][1],
        locations[endLocation][0],
        locations[endLocation][1],
        floorMaps[parseInt(startFloor)]);
    console.log(path.length);
    console.timeEnd('timer');
} else {
    paths = multiFloor(
        startFloor,
        endFloor,
        locations[startLocation][0],
        locations[startLocation][1],
        locations[endLocation][0],
        locations[endLocation][1],
        floorMaps[parseInt(startFloor)]
    );
    console.log("Path length = " + (paths[0].length + paths[1].length));
    console.timeEnd('timer');
}


function getPath(startX, startY, endX, endY, array2d) {
    grid = new PF.Grid(array2d);
    path = finder.findPath(startX, startY, endX, endY, grid);
    return (path);
};

function multiFloor(startFloor, endFloor, startX, startY, endX, endY, array2d) {
    goingUp = (parseInt(endFloor) > parseInt(startFloor))
        // console.log(goingUp)
    var startFloorStairs = {}
    var endFloorStairs = {}
    if (goingUp) {
        startPattern = new RegExp(startFloor + "_\\d+_UP");
        endPattern = new RegExp(endFloor + "_\\d+_DOWN");
    } else {
        startPattern = new RegExp(startFloor + "_\\d+_DOWN");
        endPattern = new RegExp(endFloor + "_\\d+_UP");
    }

    Object.keys(stairs).forEach(function(key) {
        if (startPattern.test(key)) {
            startFloorStairs[key] = stairs[key];
        };
        if (endPattern.test(key)) {
            endFloorStairs[key] = stairs[key];
        };
    });


    var getContactPoint = /^\d+_(\d+)/
    Object.keys(startFloorStairs).forEach(function(key) {
        var contactPoint = getContactPoint.exec(key);
        var matchRegex = new RegExp("\\d+_" + contactPoint[1] + "_")
        var matchFound = false
        Object.keys(endFloorStairs).forEach(function(key2) {
            if (matchRegex.test(key2)) {
                matchFound = true
            }
        });
        if (!matchFound) {
            delete startFloorStairs[key]
        }
    });

    Object.keys(endFloorStairs).forEach(function(key) {
        var contactPoint = getContactPoint.exec(key);
        var matchRegex = new RegExp("\\d+_" + contactPoint[1] + "_")
        var matchFound = false
        Object.keys(startFloorStairs).forEach(function(key2) {
            if (matchRegex.test(key2)) {
                matchFound = true
            }
        });
        if (!matchFound) {
            delete endFloorStairs[key]
        }
    });



    Object.keys(startFloorStairs).forEach(function(key) {
        grid = new PF.Grid(floorMaps[parseInt(startFloor)]);
        path = finder.findPath(
            startX,
            startY,
            startFloorStairs[key][0],
            startFloorStairs[key][1],
            grid
        );
        if (path != null) {
            var key2 = key.replace(new RegExp("^\\d+", "i"), endFloor);
            if (goingUp) {
                key2 = key2.replace(/UP/i, "DOWN");
            } else {
                key2 = key2.replace(/DOWN/i, "UP");
            }
            grid2 = new PF.Grid(floorMaps[parseInt(endFloor)]);
            path2 = finder.findPath(
                endX,
                endY,
                endFloorStairs[key2][0],
                endFloorStairs[key2][1],
                grid2)
            if (path2 != null) {
                //console.log(path.length + " - " + path2.length)
                paths.push([path, path2])
            }
        };
    });
    var shortestIndex = 0
    var pathLength = Number.MAX_SAFE_INTEGER
    for (var i = 0; i < paths.length; i++) {
        // console.log(paths[i][0].length + " - " + paths[i][1].length)
        if ((paths[i][0].length + paths[i][1].length) < pathLength) {
            pathLength = (paths[i][0].length + paths[i][1].length);
            shortestIndex = i;
        };
    }
    return paths[shortestIndex]
};