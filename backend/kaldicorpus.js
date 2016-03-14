"use strict";

//for corpus
exports.transcribeCorpusKaldi = function(req, res) {
	console.log('Kaldi recoie requete: '+req.params.corpusName);
	var fs = require('fs-extra');
	var socket = require('./websocket.js').getSocket();
	var calculs = require('./calculs.js');
	var lemmer =  require('lemmer');
	var corpus = req.params.corpusName;
	var corpusFolder = __dirname+'/../corpus/'+corpus+'/';
	var audioFilesFolder = __dirname+'/../corpus/'+corpus+'/wav-for-kaldi/';
	var textFilesFolder = __dirname+'/../corpus/'+corpus+'/txt/';
	var keywordsFolder = __dirname+'/../corpus/'+corpus+'/keywords/';
	var kaldiRoot = __dirname+'/lib/kaldi-trunk';
	var audioName;
	var lines = fs.readFileSync(corpusFolder+corpus+'.txt').toString().split('\n');
	var utt = __dirname+'/lib/kaldi-trunk/egs/online-nnet2/utt.txt';
	var audio_utt = __dirname+'/lib/kaldi-trunk/egs/online-nnet2/audio_utt.txt';
	res.send(202);
	//clear input
	clearTxt(utt);
	clearTxt(audio_utt);
	//begin transcribing
	createInput(0);

	//create liste audio input of kaldi
	function createInput(i){
	    var files = lines[i].toString().split(' ');
    	audioName = files[0];
    	if(i===0){
    		if (i===(lines.length-1)){
    			fs.appendFile(utt,'spk ', function (){
	    			fs.appendFile(utt, audioName+' ', function (){
		    			fs.appendFile(audio_utt,audioName+' '+audioFilesFolder+audioName+'\n', function (){
		    				transcribeByKaldi(sendResults);
		    			});
	    			});
	    		});
    		}
    		else
	    		fs.appendFile(utt,'spk ', function (){
	    			fs.appendFile(utt, audioName+' ', function (){
		    			fs.appendFile(audio_utt,audioName+' '+audioFilesFolder+audioName+'\n', function (){
		    				createInput(i+1)
		    			});
	    			});
	    		});
    	}else if (i===(lines.length-1)){
    		fs.appendFile(utt, audioName+' ', function (){
    			fs.appendFile(audio_utt,audioName+' '+audioFilesFolder+audioName+'\n', function (){
    				transcribeByKaldi(sendResults);
    			});
    		});
    	}else{
    		fs.appendFile(utt, audioName+' ', function (){
    			fs.appendFile(audio_utt,audioName+' '+audioFilesFolder+audioName+'\n', function (){
    				createInput(i+1);
    			});
    		});
    	}
    	
	};	

	function transcribeByKaldi(callback){
		//use chid process of node js to call an unix command that give the transcribed text in stdout. 
		//This stdout is the output of the function
		var exec = require('child_process').exec;
		var cmd1 = 'cd '+__dirname+'/lib/kaldi-trunk/egs/online-nnet2/';
		var cmd2 = './run.sh ';
		var start = new Date().getTime();
		exec(cmd1+' ; '+cmd2, function(stderr){
			console.log('transcibe done');
			var end = new Date().getTime();
			var timeExec = (end - start)/(1000*60);
			var output = __dirname+'/lib/kaldi-trunk/egs/online-nnet2/output.txt';
			var results = fs.readFileSync(output).toString().split('\n');
			callback(results,timeExec,0);
		}); 
	};

	function sendResults(results,time,i){
		console.log('Audio '+i)
		var result = results[i].substr(results[i].indexOf(' ',0)+1);
		console.log("*transcribed*: "+result);
		var txtName = (lines[i].toString().split(' '))[1];
		var originalText = fs.readFileSync(textFilesFolder+txtName,"UTF-8").toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"");
		//console.log('org: '+originalText);
		var resultTable = result.split(' ');
		var textTable = originalText.split(' ');
		var keywords = getKeywords(keywordsFolder+txtName);
		//send socket to client time by time
    	//simplifize
    	//lemmer.lemmatize(resultTable, function(err, transformResult){
    	lemmer.lemmatize(resultTable, function(err, transformResult){
			var resultSimplifize='';
			transformResult.forEach(function(word){
				resultSimplifize+=word+' ';
			});
			lemmer.lemmatize(textTable, function(err, transformText){
				var textSimplifize='';
				transformText.forEach(function(word){
					textSimplifize+=word+' ';
				});
				var campare = campareText(resultSimplifize, textSimplifize);
				var keywordsSimplifize = [];
				keywords.forEach(function(keyword){
					if (keyword!==''&&keyword!==' '){
						keywordsSimplifize.push(keyword.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(' ',''))
					}
				})
				//lemmatize keywords
				lemmer.lemmatize(keywordsSimplifize, function(err, transformKeywords){
					var keywordsSimplifize = [];
					keywords.forEach(function(keyword){
						if (keyword!==''&&keyword!==' '){
							keywordsSimplifize.push(keyword.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(' ',''))
						}
					})
					//var campare = campareText(result, originalText);
					var precisionRecall = calculs.precisionRecall(resultSimplifize.split(' '), transformKeywords);
					//var precisionRecall = calculs.precisionRecall(resultTable,keywordsSimplifize);
					if (i !== (lines.length-1)){
						socket.emit('send msg', {
							WER: calculs.werCalcul(campare,textSimplifize),
							//WER: calculs.werCalcul(campare, originalText),
							recall: precisionRecall.recall,
							timeExec: 0
						});
						var audio = results[i].substr(0,results[i].indexOf(' ',0));
						console.log(audio+' msg is send');
						sendResults(results,time,i+1);		
					} else {
						socket.emit('send last msg', {
							WER: calculs.werCalcul(campare,textSimplifize),
							//WER: calculs.werCalcul(campare, originalText),
							recall: precisionRecall.recall,
							timeExec: time
						});
						var audio = results[i].substr(0,results[i].indexOf(' ',0));
						console.log(audio+' msg is send');
					}
				});
			});
		});	
    }
};

//clear txt file
function clearTxt(filePath){
	var fs = require('fs');
	fs.truncate(filePath, 0, function(){console.log('done')});
}
//get keywords
function getKeywords (filePath){
	var fs = require('fs-extra');
	return fs.readFileSync(filePath).toString().split('\n');
}

//campare 2 strings and give to output the diff object that show the different btw 2 strings
function campareText(cibleText, originalText){
	var jsdiff = require('diff');
	var diffObject = jsdiff.diffWords(originalText, cibleText);
	return diffObject;
};