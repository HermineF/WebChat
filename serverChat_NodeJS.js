Array.prototype.unset = function(val){
    var index = this.indexOf(val)
    if(index > -1){
        this.splice(index,1)
    }
}

var http = require("http");
var fs = require('fs');
var url = require("url");

var users={};

var requests={
	"/sound.wav": {file:'./sound.wav',responseCode:200,contentType:"text/html"},
	"/favicon.ico": {file:'./logo.png',responseCode:200,contentType:"image/png"},
	"/logo.png": {file:'./logo.png',responseCode:200,contentType:"image/png"},
	"/client.js": {file:'./client.js',responseCode:200,contentType:"text/javascript"},
	"/main.css": {file:'./main.css',responseCode:200,contentType:"text/css"},
	"/index.html": {file:'./index.html',responseCode:200,contentType:"text/html"},
	"/": {file:'./index.html',responseCode:200,contentType:"text/html"},

	"404": {file:'./404.html',responseCode:404,contentType:"text/html"}
};

var server = http.createServer(function(req, res) {
	var page = url.parse(req.url).pathname;
    if(!requests[page]){
		page = "404"
	}
	fs.readFile(requests[page].file, function(error, content) {
		res.writeHead(requests[page].responseCode, {"Content-Type": requests[page].contentType});
		res.end(content);
	});
});

function isPseudoValid(msg){
	for(var i in users){
		if(users[i].pseudo == msg){
			socket.emit('invalidPseudo', {'name':"server",msg:"Ce pseudo est déjà utilisé par quelqu'un."});
			return false;
		}
	}
	return true;
}

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
	socket.emit('connection', {'name':"server",msg:'Tu es bien connecté !'});

	//Envoi des messages aux autres utilisateurs
	socket.on('message',function(message){
		if(socket.pseudo){
			var regex = /^\[TO:.+\]/gi;
			if(regex.test(message)){
				//envoi du message à une personne/groupe de personnes en particulier
				var temp = message.replace(/^\[TO:/gi,"").replace(/\].*/gi,"");
				var usersToSendMessage = temp.split(",");
				for(var i in usersToSendMessage){
					if(users[usersToSendMessage[i]]){
						users[usersToSendMessage[i]].socket.emit({'name':socket.pseudo, 'msg':message});
					}else{
						socket.emit('message', {'name':"server",msg:'Je ne connais personne du nom de '+usersToSendMessage[i]});
					}
				}
			}else{
				socket.broadcast.emit('message', {'name':socket.pseudo, 'msg':message});
			}
		}
	});
	socket.on('pseudo',function(msg){
		if(!isPseudoValid(msg)){return;}
		
		socket.pseudo = msg;
		
		var usersList = "";
		if(users.length == 0){
			usersList = "Il n'y a personne avec toi pour le moment";
		}else if(users.length == 1){
			usersList = "Il n'y a que "+users[0].pseudo+" avec toi";
		}else if(users.length <= 10){
			for(var i=0; i< users.length; i++){if(i!=0){usersList+=", ";}usersList+=users[i].pseudo;}
			usersList += " sont aussi connectés";
		}else{
			usersList += users.length+" personnes sont aussi connectés";
		}
		socket.emit('message', {'name':"server",msg:usersList});
		
		users[socket.pseudo]={pseudo : socket.pseudo, socket: socket};
		socket.broadcast.emit('message', {'name':"server", msg:socket.pseudo +' vient de nous rejoindre'});
	});
	//Prévient les autres qu'on quitte le chat
	socket.on('died',function(){
		console.log(socket.pseudo+" s'est déconnecté");
		socket.broadcast.emit('message', {'name':"server", msg:socket.pseudo +' nous a quitté'});
		delete users[socket.pseudo];
	});
	socket.on('writing',function(user){
		socket.broadcast.emit('writing',user);
	});
	socket.on('stopWriting',function(user){
		socket.broadcast.emit('stopWriting',user);
	});
});

server.listen(1337);

