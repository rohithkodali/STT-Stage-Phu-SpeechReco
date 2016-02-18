angular.module('myApp.factories', []).
	factory('toolSelectedFactory', function(){
		var selectedTool =  {
			tool:"",
			link:"",
			getSelectedTool: function(){
				return selectedTool.tool;
			},
			setSelectedTool: function(toolName){
				selectedTool.tool = toolName;
			},
			setTranscribeLink: function(){
				switch (selectedTool.tool) {
		        	case "Sphinx-4" :
		          		selectedTool.link = '/transcribe/sphinx4';
		          		break;
		        	case "Kaldi" :
		          		selectedTool.link = '/transcribe/kaldi';
		          		break;
		          	case "pocketSphinx" :
		          		selectedTool.link = '/transcribe/pocketsphinx';
		          		break;
		        	default:
		          		selectedTool.link = '/transcribe/';
		          		break;
	    		};
			},
			getTranscribeLink: function(){
				return selectedTool.link;
			}
		};
		return selectedTool;
	}).
	factory('mySocket', function (socketFactory) {
	  	var myIoSocket = io.connect(location.href.substr(0,location.href.lastIndexOf('/')+1));

		mySocket = socketFactory({
			ioSocket: myIoSocket
		});

		return mySocket;
	}).
	factory('clientDistinct', function(){
		var client = {
			name: "unknown",
			setNameClient: function(name){
				client.name = name;
			},
			getNameClient: function(){
				return client.name;
			},
		};
		return client;
	})
;