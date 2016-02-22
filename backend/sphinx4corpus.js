//for corpus
exports.transcribeCorpusSphinx = function(req, res) {
	console.log('Sphinx recoie requete: '+req.params.corpusName);
	var fs = require('fs-extra');
	var async = require('async');
	var corpus = req.params.corpusName;
	var corpusFolder = __dirname+'/../corpus/'+corpus+'/';
	var audioFilesFolder = __dirname+'/../corpus/'+corpus+'/wav-for-sphinx/';
	var textFilesFolder = __dirname+'/../corpus/'+corpus+'/txt/';
	var txtName;
	var audioName;
	var lines = fs.readFileSync(corpusFolder+corpus+'.txt').toString().split('\n');
	var resultF = [];

	function analize(i){
	    var files = lines[i].toString().split(' ');
    	txtName = files[1];
    	audioName = files[0];
    	console.log('Sphinx-4 transcribes file '+audioName+'>>>>>');
		transcribeBySphinx(audioName,txtName,i);
	};	

    //transcribe by sphinx function that give the transcribed text in outpout
	function transcribeBySphinx(audioName,txtName,i){
		var java = require('java');
		//java.classpath.push(__dirname+"/../target/sphinx-4-lib-1.0-SNAPSHOT-jar-with-dependencies.jar");
		java.classpath.push(__dirname+'/lib/speechtotext.jar');
		var S2T = java.import('AppTestSpeechReco');
		var appSpeech = new S2T();
		var result = appSpeech.transcribeSync(audioFilesFolder+audioName);
		process.nextTick(function(){
			var originalText = fs.readFileSync(textFilesFolder+txtName,"UTF-8").toLowerCase();
			console.log(originalText);
			console.log('trans: '+result);
			//send socket to client time by time
	    	console.log('Sphinx-4 sends transcript of file '+audioName+'>>>>>');
	    	//var socket = require('./websocket.js').sendMsg({compareObject: campareText(result, originalText)});
	    	resultF.push(campareText(result,originalText));
	    	console.log(resultF);
			console.log('Sphinx-4 is done with '+audioName+'>>>>>');
			if ((i+1) !== lines.length) analize(i+1);
			else res.json(resultF);
		});
		//callback(audioName,txtName,i);
		//add sphinx-4 librairie

		//Configuration
		/*var Configuration = java.import("edu.cmu.sphinx.api.Configuration");
		var FileInputStream = java.import("java.io.FileInputStream");
		var SpeechResult = java.import("edu.cmu.sphinx.api.SpeechResult");
		var Recognizer = java.import("edu.cmu.sphinx.api.StreamSpeechRecognizer");

		var configuration = new Configuration();


		// Set path to acoustic model.
		configuration.setAcousticModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us");
		// Set path to dictionary.
		configuration.setDictionaryPathSync("resource:/edu/cmu/sphinx/models/en-us/cmudict-en-us.dict");
		// Set language model.
		configuration.setLanguageModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us.lm.bin");

		//try{
		  var recognizer = new Recognizer(configuration);
		//}
		//catch (e){
		//  console.log(e.cause.getMessageSync());
		//}

		var resultFinal = "";
		console.log(1);
		var fileInputStream = new FileInputStream(filePath);
		console.log(2);
		recognizer.startRecognitionSync(fileInputStream);
		console.log(3);
		var result;
		while ((result = recognizer.getResultSync()) !== null) {
		  resultFinal = resultFinal + result.getHypothesisSync() + ' ';
		  console.log(result.getHypothesisSync());
		  console.log(4);
		}

		recognizer.stopRecognitionSync();
		console.log(5);*/
		//return result;
	};

	analize(0);  
};



//get the path of data necessary when it's an audio, recorded audio or text
function getData(typeData, clientName){
	var fs = require('fs-extra');
	var filePath = 'error';
	switch (typeData){
		case "audio":
			if (fs.existsSync(__dirname+'/../upload_audio/'+clientName+'.wav-convertedforsphinx.wav'))
				filePath = __dirname+'/../upload_audio/'+clientName+'.wav-convertedforsphinx.wav';
			break;
		case "micro":
			if (fs.existsSync(__dirname+'/../recorded_audio/'+clientName+'.wav-convertedforsphinx.wav'))
				filePath = __dirname+'/../recorded_audio/'+clientName+'.wav-convertedforsphinx.wav';
			break;
		case "text":
			if (fs.existsSync(__dirname+'/../upload_text/'+clientName+'.txt'))
				filePath = __dirname+'/../upload_text/'+clientName+'.txt';
			break;
		default:
			break;
	};
	return filePath;
};

//campare 2 strings and give to output the diff object that show the different btw 2 strings
function campareText(cibleText, originalText){
	var jsdiff = require('diff');
	var diffObject = jsdiff.diffWords(originalText, cibleText);
	return diffObject;
};