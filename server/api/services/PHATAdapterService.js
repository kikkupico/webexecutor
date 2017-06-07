'use strict';
var ps = require('ps-node');
var kill = require('tree-kill');
const dir = require('node-dir');
const path = require('path');
const async = require('async');
const fs = require('fs');
const Promise = require("bluebird");
var asyncFunction = require('asyncawait/async');
var awaitResult = require('asyncawait/await');

var fsAsync = Promise.promisifyAll(require("fs"));

const legacy = require('./LegacyPHATFunctions');

//const dirTree = require('directory-tree');
//const testRepo = dirTree(testRepoFolder,['.xml']);

const BUNDLE_LOCATION = sails.config.BUNDLE_LOCATION ? sails.config.BUNDLE_LOCATION : 'C:/p_2/ph-automation/phat/phat_package/phat_bundle/';

const testRepoFolder = path.join(BUNDLE_LOCATION, 'test_scripts');
const testBinFolder = path.join(BUNDLE_LOCATION, 'bin');
const NBI_TEST_SCRIPTS_LOCATION = path.join(BUNDLE_LOCATION, 'ci-plat-soap-ui/project');
const NBI_CI_PLAT_LOCATION = path.join(BUNDLE_LOCATION, 'ci-plat-soap-ui/');

var testRepo = [];
var nbiTestRepo = [];
var devices = [];

const getDevices = asyncFunction (() => {
	return awaitResult (fsAsync.readFileAsync(path.join(NBI_CI_PLAT_LOCATION, '/config/properties/ph-regression-new-master.properties'))); 
});

getDevices()
.then(data => {
	let deviceModelRegex = /device\.devType\d*\.deviceDatamodelName=.*/gi;
	devices=data.toString().match(deviceModelRegex).map(s=>{return {id:s.substring(7, s.indexOf('.deviceDatamodelName')), dataModel:s.substring(s.indexOf('=')+1)}});
	//console.log(devices);
	});

const addToExecutionQueue = (task, callback) => {
	TestRun.findOne({id:task.rid}).exec(function(err, foundRun) {
		if(foundRun.status==='cancelled') {
			sails.log('Task cancelled');
			callback();			
		}
		else {
			TestRun.update({id:task.rid},{status:'running'}).exec((err, updated)=> {
			TestRun.find({id:task.rid}).populate('tests').exec((err, foundRuns)=> {

				if(foundRuns[0].executor && foundRuns[0].executor==='phat-nbi') {
					runNBI(task.rid, callback);
					return true;
				}
				else {
					writeCustomLinkFilesNew(testRepoFolder, task.rid, foundRuns[0].tests, ()=> {
						legacy.writePropFile(testBinFolder, task.rid+'_ph.properties', foundRuns[0].propCont);
						legacy.runPHAT({type:task.paramType, threads:task.paramThreads, runPrefix:task.rid,
							tests: foundRuns[0].tests, runId:task.rid}, callback);
						});
					return true;
				}
			});
		});
		}
	});
}

var queues = [];

const getQueue = sl => {
	let existingQueues = queues.filter(q=>q.sl===sl);
	if(existingQueues.length > 0) return existingQueues[0].queue;
	else {
		let newQueueItem = {sl: sl, queue: async.queue(addToExecutionQueue,1)}
		queues.push(newQueueItem);
		return newQueueItem.queue;
	}
}


//var q = async.queue(addToExecutionQueue, 1);

legacy.getNBIScripts(path.join(NBI_TEST_SCRIPTS_LOCATION, 'PH-Regression-product-soapui-project'), function (err, res) {
            if (err)
                console.error(err);
            nbiTestRepo = res;
        });

legacy.directoryTreeToObj(testRepoFolder, function (err, res) {
            if (err)
                console.error(err);
            testRepo = res;
        });

module.exports =  {
	getQueueStatus: () => {
		return queues.map(q => {return { id:q.sl, size:q.queue.length()+q.queue.running()}}).filter(q => q.size > 0);
	},
	listDevices: function() {
		return devices;
	},

	testRepoUI: function() {		
		return testRepo;
	},

	testRepoNBI: function() {		
		return nbiTestRepo;
	},

	getPropCont: function() {
		return legacy.getPropFile(testBinFolder, 'ph.properties');
	},

	run: function(rid, paramThreads, paramType) {		
		TestRun.findOne({id:rid}).exec(function(err, foundRun) { //TODO: remove repetitve code
			if(foundRun.executor==='phat-nbi') {
				let q = getQueue(foundRun.environment.PH_SL_HOSTNAME);
				TestRun.update({id:rid},{status:'Queued at position ' + JSON.stringify(q.length()+1)}).exec(function(err, updated) {
					if (err) {sails.log(`Error updating TestRun${rid} while attempting to run`); return false;}
					else {
						q.push({rid:rid, paramThreads:paramThreads, paramType:paramType}, ()=>/*sails.log('Execution completed for ' + rid)*/sails.sockets.blast('update runs', PHATAdapterService.getQueueStatus()));
						TestRun.findOne({id:rid}).populate('tests').exec((err, updatedFoundRun)=>TestRun.publishUpdate(rid, updatedFoundRun));
						sails.sockets.blast('update runs', PHATAdapterService.getQueueStatus());
					}
				});
			}
			else {
				let slLine = foundRun.propCont.match(/PH_SL_HOSTNAME=.*/)[0];
				let sl = slLine.substring(slLine.indexOf('=')+1);
				//sails.log(sl);
				let q = getQueue(sl);
				TestRun.update({id:rid},{status:'Queued at position ' + JSON.stringify(q.length()+1)}).exec(function(err, updated) {
					if (err) {sails.log(`Error updating TestRun${rid} while attempting to run`); return false;}
					else {
						q.push({rid:rid, paramThreads:paramThreads, paramType:paramType}, ()=>/*sails.log('Execution completed for ' + rid)*/sails.sockets.blast('update runs', PHATAdapterService.getQueueStatus()));
						TestRun.findOne({id:rid}).populate('tests').exec((err, updatedFoundRun)=>TestRun.publishUpdate(rid, updatedFoundRun));
						sails.sockets.blast('update runs', PHATAdapterService.getQueueStatus());
					}
				})
			}
		})
	},

	stop: function(rid) {
		TestRun.findOne({id:rid}).exec( (err, foundRun) => {
			sails.log(foundRun.status);
			let endStatus = foundRun.status.indexOf('running') > -1 || foundRun.status.indexOf('waiting') > -1 || foundRun.status.toLowerCase().indexOf('queued') > -1 ? 'cancelled' : 'completed';
			sails.log(endStatus);
			if(foundRun.pid) {
				kill(foundRun.pid, 'SIGTERM', function( err ) {
				    if (err) {
				        sails.log('ERROR:Unable to stop process %s', foundRun.pid);
				    }
				    else {
				        sails.log( 'Process %s has been killed', foundRun.pid );
				    }
				});
			}
			TestRun.update({id:rid},{status:endStatus}).exec((err, updated) => {
				TestRun.findOne({id:rid}).populate('tests').exec((err, updatedFoundRun)=>TestRun.publishUpdate(rid, updatedFoundRun));
				sails.sockets.blast('update runs', PHATAdapterService.getQueueStatus());
				return updated[0];
			});
		});
	}
}

const writeALinkFileAsync = (item, next) => {
	const openAFile = (item, next) => {
		fs.open(path.join(path.dirname(item.linkFilePath),item.prefix+"_"+path.basename(item.linkFilePath)), "w", function (err, fd) {
			if(err) return next(err);
			//console.log('File opened');
			next(null, item, fd);
		});
	}

	const writeAFile = (item, fd, next) => {
		//console.log(item);
		let filteredItems = item.data.filter(f=>path.normalize(f.linkFilePath)===path.normalize(item.linkFilePath));

	    if(filteredItems.length > 0) {
			//console.log(`${filteredItems[0].linkFilePath} will be written with...`);
			let fileContent = filteredItems.map((i)=>{return i.testCaseName}).join("\r");
			//console.log(fileContent);
			fs.write(fd, fileContent+"\r", 0, "utf-8", (err) => {
				if(err) return next(err);
			//	console.log('File written');
				next(null, fd);
			});
		}
		else next(null, fd);
	}

	const closeAFile = (fd, next) => {
		fs.close(fd, function(err) {
			//console.log('File closed');
			next(null, true)
		});
	}

	async.waterfall([
		function(then) {
			//console.log(`Initiating...${item.linkFilePath}`)
			then(null, item)
		},
		openAFile,
		writeAFile,
		closeAFile
		],

		function(err, result) {
			//console.log('All done');
			next();
		}
		)
}


const writeCustomLinkFilesNew = (folder, prefix, tests, then) => {
	dir.files(folder,
		function(err, files) {
		    if (err) throw err;
		    let fileItems = files.filter(file => file.endsWith('.link') && path.basename(file).startsWith('test')).map(file => { return {linkFilePath:file, prefix:prefix, data:tests}});
		    async.map(fileItems, writeALinkFileAsync, then);
	});
}

const runNBI = function(rid, cb) {
	TestRun.update({id:rid},{status:'running'}).exec((err, updated)=> {
		TestRun.findOne({id:rid}).populate('tests').exec((err, foundRun)=> {
			TestRun.publishUpdate(foundRun.id, foundRun);		
			fsAsync.readFileAsync(path.join(NBI_CI_PLAT_LOCATION, '/config/csv/masterNightly.csv')).bind({foundRun:foundRun})
			.then(data=> {return fsAsync.writeFileAsync(path.join(NBI_CI_PLAT_LOCATION, '/config/csv/'+rid+'_masterNightly.csv'), data.toString().replace('ph-regression-new-master.properties', rid+'_ph-regression-new-master.properties'))} )
			.then(res=> {return fsAsync.readFileAsync(path.join(NBI_CI_PLAT_LOCATION, '/config/properties/ph-regression-new-master.properties'))} )
			.then(data=> {
				let content = data.toString().replace('regressionTestSuite_new_master.txt', rid+'_regressionTestSuite_new_master.txt');
				foundRun.environment.devices.map(d => {
					//sails.log(d);
					if(d.enabled && content.indexOf(`${d.id}.enabled=false`)>-1)
					{
						//sails.log('enabling device ' + JSON.stringify(d));
						content=content.replace(`${d.id}.enabled=false`, `${d.id}.enabled=true`);
					}

					if(!(d.enabled) && content.indexOf(`${d.id}.enabled=true`)>-1 ) {
						//sails.log('disabling device ' + JSON.stringify(d));
						content=content.replace(`${d.id}.enabled=true`, `${d.id}.enabled=false`);
					}
				})
				return fsAsync.writeFileAsync(path.join(NBI_CI_PLAT_LOCATION,'/config/properties/'+rid+'_ph-regression-new-master.properties'), content)
			})
			.then(data=> {
				let content = foundRun.tests.map(t=>t.testSuiteName+'\r\n '+t.testCaseName).join('\r\n')+'\r\n';
				return fsAsync.writeFileAsync(path.join(NBI_CI_PLAT_LOCATION,'/config/controller/'+rid+'_regressionTestSuite_new_master.txt'), content)
			})
			.then(results=> {				
				legacy.runNBI({
					tests:foundRun.tests, runId:rid, sl:foundRun.environment.PH_SL_HOSTNAME, cl:foundRun.environment.PH_CL_HOSTNAME, 
					customer: foundRun.environment.PH_CUSTOMER, csv: foundRun.id+'_masterNightly.csv', ssl:"true", elist:'NBI-Regression'}, cb);
				TestRun.update({id:rid}, {status:'running'}).exec((err, updated) => {
					TestRun.findOne({id:rid}).populate('tests').exec((err, foundRun)=>TestRun.publishUpdate(foundRun.id, foundRun));
				});
			});
		});
	});
}
