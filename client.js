var socket = io.connect(document.URL);
var chatName = "Web Chat";
var tab = "&nbsp;&nbsp;&nbsp;&nbsp;";
var pseudoColor = new Date().getHours()+" : "+new Date().getMinutes()+" : "+new Date().getSeconds()+"JE";
var isValid = false;
var users = {};
var writtingUsers = [];
var currentWrittingTimeout = 0;

/**
* command definition: *."name": {
* 	"regex": regular expression,
* 	"exec": function(command line is given in parameters),
* 	"replaceMessage": true/false,(if true the exec function returns a new message which will replace the users message)
* 	"condition"(optional): function(returns true or false) => if false the command will not be interpreted,
* 	"man": description
* }
*/
var commands={
	"[BIP]": {
		"regex": "\[BIP\]",
		"exec": function(){
			var sound=document.getElementById("sound");
			sound.load();
			sound.play();
		},
		"replaceMessage": false,
		"condition": function(){
			return questions.sound.options[questions.sound.a]==true;
		},
		"man": "envoie un signal sonore au reste du monde."
	},
	"clear": {
		"regex": "^clear$",
		"exec": function(){
			var div=document.getElementById("messages");
			div.innerHTML="";
		},
		"replaceMessage": true,
		"man": "efface les messages de l'écran."
	},
	"exec": {
		"regex": "^exec .+$",
		"exec": function(args){
			args = args.replace(/^exec +/gi,"");
			addText("résultat : " + eval(args));
		},
		"replaceMessage": true,
		"man": "exécute un code javascript.<br/>"+tab+"exemple:<br/>"+tab+tab+"exec 1+1 => renvoie 2"
	},
	"[HOUR]": {
		"regex": "^\[HOUR(:.+)?\]$",
		"exec": function(args){
			args = args.replace(/\[HOUR:/gi,"");
			args = args.replace(/\]/gi,"");
			args = args.toLowerCase();
			if(questions.hour.options[args]){
				questions.hour.a = args;
			}else if(args===""){
				questions.hour.a = undefined;
				isValid = false;
				init();
			}else{
				addText("commande inconnue");
			}
		},
		"replaceMessage": true,
		"man": "change le format d'heure.<br/>"+tab+tab+"[HOUR]: commande générique le format d'heure vous sera demandé.<br/>"+tab+tab+"[HOUR:format]: modification du format d'heure en passant le nom du format en paramètre "+ getOptions("hour")+"."
	},
	"man": {
		"regex": "^man( .+)?$",
		"exec": function(args){
			args=args.replace(/^man ?/g,"");
			var message="";
			if(args!==""){
				for(var i in commands){
					if(i===args){
						message+="<p>Manuel: <br/><br/>";message+=i+" : "+commands[i].man;message+="</p><br/><br/>";
					}
				}if(message===""){
					message+="commande inconnue";
				}
			}else{
				message="<p>Manuel: <br/><br/>";message+="version : 4.2<br/><br/>";message+="description : Ceci est un chat révolutionnaire, utilisant les derniéres propriétés HTML5. Grâce à son design épuré, intuitif et riche en couleurs vous pourrez profiter des derniéres innovations technologiques dignes des meilleures applications webs.<br/><br  />";
				message+="voici la liste des commandes possibles :<br/><br/>";
				for(var i in commands){
					message+=tab;
					message+=i;
					message+="<br/>";
				}
				message+="</p><br/><br/>";
			}
			addText(message);
		},
		"replaceMessage": true,
		"man": "manuel du petit geek (tu t'attendais à ce que ce soit quoi?!)"
	}
};
var questions = {
	"pseudo": {"q": "Quel est ton nom manant?","a": undefined},
	"sound": {"q": "Veux-tu activer les sons?","a": undefined,options: {'o': true,'n': false}},
	"hour": {"q": "Quel format d'heure veux-tu utiliser?","a": undefined,
		options: {
			'binaire': function(){
				return new Date().getHours().toString(2)+" : "+new Date().getMinutes().toString(2)+" : "+new Date().getSeconds().toString(2);
			},
			'hexadecimal': function(){
				return new Date().getHours().toString(16)+" : "+new Date().getMinutes().toString(16)+" : "+new Date().getSeconds().toString(16);
			},
			'normal': function(){
				return new Date().getHours()+" : "+new Date().getMinutes()+" : "+new Date().getSeconds();
			}
		}
	}
};


function addText(text){
	var div = document.getElementById("messages");
	var msg="<div class='row clearfix'><div class='column full'>";
	msg += text;
	msg += "</div></div>";
	div.innerHTML = div.innerHTML + msg;
	document.getElementById("body").scrollTop = document.getElementById("body").scrollHeight;
}
function addMessage(message){
	var div = document.getElementById("messages");
	input = message.msg ? message.msg: message;
	if(typeof(input)!== "undefined" && input !== "" && input !== "undefined"){
		var hour = "";
		if(questions.hour.a){
			hour=questions.hour.options[questions.hour.a]();
		}
		var msg="<div class='row clearfix'>";
		if(message.name){
			msg+="<div class='column two-thirds'><span class='user' style='color:"+getColor(message.name)+";'>"+message.name+"</span>"+input+"</div><div class='column third hour'>"+hour+"</div>";
			notify(message);
		}else{
			var pseudo = questions.pseudo.a;
			msg+="<div class='column two-thirds me'><span class='user' style='color:"+getColor(pseudoColor)+";'>Je</span>"+input+"</div><div class='column third hour'>"+hour+"</div>";
		}
		msg+="</div>";
		div.innerHTML = div.innerHTML+msg;
	}
	document.getElementById("body").scrollTop = document.getElementById("body").scrollHeight;
}
function interpretCommand(message){
	for(var i in commands){
		var regex = new RegExp(commands[i].regex,"gi");
		if(regex.test(message)){
			//test des conditions
			if((typeof(commands[i].condition)=== "undefined")
				||(
					(typeof(commands[i].condition) === "function" && commands[i].condition() == true) 
					|| typeof(commands[i].condition) !== "function" && commands[i].condition
				)
			){
				var msg = commands[i].exec(message);
				if(commands[i].replaceMessage){
					return msg;
				}else{
					return message;
				}
			}
		}
	}
	return message;
}
function getColor(str){
	if(users[str]){
		return users[str];
	}
	var result='#'+Math.floor(Math.random()*16777215).toString(16);
	users[str]=result;
	return result;
}
function keypress(e,textarea){
	var code = (e.keyCode ? e.keyCode: e.which);
	if(code == 13){
		sendRequest();currentWrittingTimeout = 0;
	}else if(isValid){
		if(currentWrittingTimeout == 0){
			socket.emit("writing",questions.pseudo.a);
		}
		currentWrittingTimeout = 10;
		setTimeout(function(){checkWritingState();},500);
	}
}
function checkWritingState(){
	if(currentWrittingTimeout==0){
		socket.emit("stopWriting",
		questions.pseudo.a);
	}else{
		currentWrittingTimeout--;
		setTimeout(function(){checkWritingState();},500);
	}
}
function focus(){
	document.getElementById("request").focus();
}
function init(){
	for(var i in questions){
		if(typeof(questions[i].a)==="undefined"){
			addMessage({
				name: chatName,
				msg: getQuestion(i)
			});
			return;
		}
	}
	// si on a répondu à toutes les questions on peut s'enregistrer;
	isValid=true;
	addMessage({
		name: chatName,
		msg: "C'est bon j'ai fini avec mes questions tu peux y aller."
	});
	socket.emit("pseudo",questions.pseudo.a);
}
function getQuestion(i){
	var question = questions[i].q;
	question += getOptions(i);
	return question;
}
function getOptions(i){
	var options = "";
	if(typeof(questions[i].options) !== "undefined"){
		options += "(";
		var counter = 0;
		for(var j in questions[i].options){
			if(counter>0){
				options+="/";
			}
			options += j;
			counter++;
		}
		options += ")";
	}
	return options;
}
function setAnswer(msg){
	addMessage(msg);
	for(var i in questions){
		if(typeof(questions[i].a) === "undefined"){
			// on vérifie la réponse.
			if(typeof(questions[i].options) === "undefined" || typeof(questions[i].options[msg])!== "undefined"){
				questions[i].a=msg;
				return true;
			}else{
				return false;
			}
		}
	}
	return false;
}
function sendRequest(){
	var message = document.getElementById("request").value;
	if(message!=""){
		if(!isValid){
			if(!setAnswer(message)){
				addMessage({
					"name": chatName,
					"msg": "Réponse incorrecte."
				});
			}
			init();
		}else{
			message = interpretCommand(message);
			if(typeof(message) !== "undefined" && message !== "" && message !== "undefined"){
				socket.emit("message",message);
				addMessage(message);
			}
		}
		document.getElementById("request").value="";
	}
}
function notify(message){
	var havePermission = window.webkitNotifications.checkPermission();
	if(havePermission == 0){
		if(isValid && !document.hasFocus()){
			var notification = window.webkitNotifications.createNotification('logo.png',message.name,message.msg);
			notification.show();
		}
	}else{
		window.webkitNotifications.requestPermission();
	}
}
function getWritingUsers(){
	var result="";
	if(writtingUsers.length == 1){
		result += writtingUsers[0] + " est en train d'écrire.";
	}else if(writtingUsers.length > 1){
		for(var i=0; i<writtingUsers.length; i++){
			if(i>0){
				result+=", ";
			}
			result += writtingUsers[i];
		}
		result+=" sont en train d'écrire.";
	}
	return result;
}

socket.on("message",function(message){
	if(isValid){
		addMessage(message);
	}
	focus();
});
socket.on("connection",function(message){
	addMessage(message);
	init();
});
socket.on("writing",function(user){
	var i = -1;
	for(var j=0; j<writtingUsers.length; j++){
		if(writtingUsers[j] === user){
			i=j;
		}
	}
	if(i === -1){
		writtingUsers.push(user);
		var div = document.getElementById("info");
		div.innerHTML = getWritingUsers();
	}
});
socket.on("stopWriting",function(user){
	var temp=[];
	for(var j=0; j<writtingUsers.length; j++){
		if(writtingUsers[j] !== user){
			temp = writtingUsers[j];
		}
	}
	writtingUsers = temp;
	var div = document.getElementById("info");
	div.innerHTML = getWritingUsers();
});
socket.on("invalidPseudo",function(message){
	addMessage(message);
	questions.pseudo.a = undefined;
	isValid = false;
	init();
});
window.onclick = function(){
	focus();
}
window.onbeforeunload = function(){
	socket.emit('died');
<<<<<<< HEAD
};
=======
};
>>>>>>> bf8ddc7ca542d09b404ee8cfa309ebec3fbb79b7
