const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
app.use(express.static(__dirname + "/musicAngular/dist/musicAngular"));
const server = app.listen(8000);
const io = require("socket.io")(server);
const audio_formats = [".wav", ".mp3", ".ogg", ".flac"];
var player_data = {
    file: "Track 1.mp3",
    position: 0,
    playing: false,
    player: null,
    playlist: []
}
function filewalker(dir, done) {
    let results = [];
    fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function(file){
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat){
                // If directory, execute a recursive call
                if (stat && stat.isDirectory()) {
                    // Add directory to array [comment if you need to remove the directories from the array]
                    // results.push(file);
                    filewalker(file, function(err, res){
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    // results.push(file);
                    if(audio_formats.includes(path.extname(file))) {
                        results.push(path.relative(__dirname + "/musicAngular/dist/musicAngular/assets", file));
                    }
                    if (!--pending) done(null, results);
                }
            });
        });
    });
};
app.get("/filelist", function(req, res) {
    filewalker("./musicAngular/dist/musicAngular/assets", function(err, data) {
        if(err) {
            res.json({message: "Error"});
        }
        else {
            res.json({
                message: "Success",
                data: data.sort()
            });
        }
    });
});
io.on("connection", (socket) => {
    socket.emit("player-data", player_data);
    socket.on("update-player", data => {
        player_data = data;
        socket.broadcast.emit("player-data", player_data);
    });
});