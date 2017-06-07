'use strict';

var kill = require('tree-kill');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var Tail = require('tail').Tail;

const BUNDLE_LOCATION = sails.config.BUNDLE_LOCATION ? sails.config.BUNDLE_LOCATION : 'C:/p_2/ph-automation/phat/phat_package/phat_bundle/';

const linkFileNames= ['testcase.link', 'testcase_seq.link', 'testcase_seq_after.link', 'test_case.link', 'test_case_pre_seq.link', 'test_case_post_seq.link'];
const TEST_SCRIPTS_LOCATION = path.join(BUNDLE_LOCATION, 'test_scripts');
const BIN_FOLDER_LOCATION = path.join(BUNDLE_LOCATION, 'bin');
const NBI_CI_PLAT_LOCATION = path.join(BUNDLE_LOCATION, 'ci-plat-soap-ui/');

var pythonExecutableName = 'python3.5';
const isWin = /^win/.test(process.platform);
if(isWin) pythonExecutableName = 'python';


var legacy = {
    getNBIScripts: function (dir, done) {
    var results = [];

    fs.readdir(dir, function (err, list) {
        if (err)
            return done(err);

        var pending = list.length;

        if (!pending)
            return done(null, {
                label: path.basename(dir),
                type: 'folder',
                children: results,
                path: dir,
                value: dir,
                folder: path.basename(path.dirname(dir))
            });

        list.forEach(function (item) {
            item = path.resolve(dir, item);

            //if item is directory
            fs.stat(item, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    legacy.getNBIScripts(item, function (err, res) {
                      if(path.basename(item) != "reports" && !path.basename(item).startsWith("Prime-Home-NBI-documentation") && !path.basename(item).startsWith("PrimeHome")) //potential BUG: will skip test suites that start with the given two prefixes
                      {
                        results.push({
                            label: path.basename(item),
                            type: 'folder',
                            children: res,
                            path: item,
                            value: item,
                            folder: path.basename(path.dirname(item))
                        });
                      }
                        if (!--pending)
                            done(null, results);
                    });
                } else {

                    //if item is a file
                    if (path.basename(item) != "element.order" && path.basename(item) != "settings.xml" && path.basename(item).indexOf('.xml') > -1) {

                        fs.readFile(item,
                            function (err,data) {
                                 if (err) {
                                 return console.log(err);
                                 }

                                 //console.log(getTestCaseNameFromXMLString(data.toString()));
                                    results.push({
                                      label: getTestCaseNameFromXMLString(data.toString()),
                                      type: 'file',
                                      path: item,
                                        value: item,                                        
                                        folder: path.basename(path.dirname(item))
                                      }
                                      );
                                    if (!--pending)
                                      done(null, results);
                                        });
                    }
                    else {
                        if (!--pending)
                            done(null, results);
                    }
                }
            });
        });
    });
},
	directoryTreeToObj: function (dir, done) {
    let results = [];

    fs.readdir(dir, function (err, list) {
        if (err)
            return done(err);

        let pending = list.length;

        if (!pending)
            return done(null, {
                label: path.basename(dir),
                value: path.basename(dir),
                type: 'folder',
                children: results
            });

        list.forEach(function (item) {
            item = path.resolve(dir, item);

            //if item is directory
            fs.stat(item, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    legacy.directoryTreeToObj(item, function (err, res) {
                        results.push({
                            label: path.basename(item),
                            value: path.basename(item),
                            type: 'folder',
                            path:item,
                            children: res
                        });
                        if (!--pending)
                            done(null, results);
                    });
                }

                else { //if item is file

                        if(path.basename(item).indexOf(".xml") > -1 )
                        {
                            let typeAndLinkFile = legacy.getTestCaseTypeAndLinkFile(item);
                            results.push({
                                type: typeAndLinkFile.type,
                                label: path.basename(item),
                                path:item,
                                value: typeAndLinkFile.linkFilePath + "," + path.basename(item)
                            });
                        }

                        if (!--pending)
                            done(null, results);
                    }
            });
        });
    });
},
getTestCaseTypeAndLinkFile: function (testCaseWithPath)
{
    let folder = path.dirname(testCaseWithPath);

    /* Algo

    check which link files are present
    iterate through found link files and see which one contains the testcase
    return accordingly

    NOTE: can be done a little more efficiently but this algo is easier to understand

    */

    let linkFilesFound = [];

    for (let i=0; i<linkFileNames.length; i++)
    {
        let linkFileWithPath = path.join(path.dirname(testCaseWithPath), linkFileNames[i]);

        if(legacy.isFilePresentSync(linkFileWithPath))
        {
            linkFilesFound.push(linkFileWithPath);
        }
    }

    for (let j=0; j<linkFilesFound.length; j++)
    {
        let data = fs.readFileSync(linkFilesFound[j]);
        if(data.toString().indexOf(path.basename(testCaseWithPath)) > -1 )
        {
            //console.log(path.basename(testCaseWithPath) + " found in " + linkFilesFound[j])
            let typeVal = 'file';
            if(linkFilesFound[j].indexOf('seq') > -1) typeVal = 'file-seq';
            return {type: typeVal, linkFilePath:linkFilesFound[j]};
        }
    }

    let linkFilePathVal = "testcase.link";
    if(testCaseWithPath.indexOf('regression') > -1 ) linkFilePathVal = 'test_case.link';
    return {type:'file-new', linkFilePath:path.join(path.dirname(testCaseWithPath), linkFilePathVal)};
},

isFilePresentSync: function (aPath) {
  try {
    return fs.statSync(aPath).isFile();
  } catch (e) {
    if (e.code === 'ENOENT') {
      return false;
    } else {
      throw e;
    }
  }
},

runPHAT: function (args, callback) {

        //algo
        // ASSUMPTION: custom link files are in place
        //run testcase executor with -custom_link arg

        //console.log(args["runPrefix"]);
        //console.log('socket: sequential run');
        sails.sockets.blast('update runs', PHATAdapterService.getQueueStatus());
        let spawn = require('child_process').spawn;
        let watcher = null;
        let watcherScheduled = false;
        let stopScheduled = false;
		let execsubType = 3;


		    /*if (customer='Master'){
				execsubType=1;
			}else{
				execsubType=3;
			}*/
        // Create a child process

        let child = spawn(pythonExecutableName, ["testcase_executor_new.py", args["type"], args["threads"], 
            execsubType, "-custom_link", args["runPrefix"]] , {cwd: BIN_FOLDER_LOCATION} );
        TestRun.update({id:args.runId},{pid:child.pid}).exec(function(err, updated) {
            sails.log(updated[0].id + ' updated with pid ' + child.pid);
            if(updated[0].status==='cancelled' ) { //for handling case where user clicks on 'Stop' immediately after starting execution
                kill(child.pid, 'SIGTERM', function( err ) {
                    if (err) {
                        sails.log('ERROR:Unable to stop process %s', child.pid);
                    }
                    else {
                        sails.log( 'Process %s has been killed', child.pid );
                    }
                });
            }            
        })
		/*socket.on('stop sequential run', function(msg) {
            if(stopScheduled == false)
            {
                stopScheduled = true;
                if(watcher)
                {
                    console.log("closing file watcher...");
                    watcher.close();
                    watcher = null;
                    watcherScheduled = false
                }
                tcname='NA';renable='NA';reporttype='NA';customer='NA';
                console.log("socket: stop sequential run");
                let kill = require('tree-kill');
                kill(child.pid,'SIGKILL');
            }
            }
        );*/

        child.stdout.on('data',
            function (data) {
                //sails.sockets.blast('update ui execution console', data.toString());
                TestRun.publishUpdate(args.runId, {title:'console update', content: data.toString()});
                /*let startedSearchString = 'Started executing ';
    			let startedSearchEndString = '\n';
    			let finishedSearchString = 'Finished executing ';
    			let finishedSearchEndString = '\n';

                if(data.toString().indexOf('Started executing') > -1 ) {                	
                	let testCaseNames = findTestCaseStatusFromLogLine(data.toString(), 
                    startedSearchString, startedSearchEndString);
                	//sails.log('Found matching string for start at ' + data.toString());
                	sails.log('The following testcase started: ' + testCaseNames);
                }

                if(data.toString().indexOf('Finished executing') > -1 ) {                	
                	let testCaseNames = findTestCaseStatusFromLogLine(data.toString(), 
                    finishedSearchString, finishedSearchEndString);
                	//sails.log('Found matching string for end at ' + data.toString());
                	sails.log('The following testcase ended: ' + testCaseNames);
                }*/

                /*if(watcher == null && watcherScheduled == false)
                {
                    watcherScheduled =  true;
                    getPHATFileWatcher(socket, function(phatWatcher)
                        {
                          watcher = phatWatcher;
                        });
                }*/
            }
        );

        child.stderr.on('data',
            function (data) {
                //duplicating the code for stdout here  (TODO: REMOVE THIS DUPLICATION)
                let logData = data.toString();
                //sails.sockets.blast('update ui execution console', logData);
                TestRun.publishUpdate(args.runId, {title:'console update', content: data.toString()});
                let startedSearchString = 'Started executing ';
    			let startedSearchEndString = '\n';
    			let finishedSearchString = 'Finished executing ';
    			let finishedSearchEndString = '\n';

                if(logData.indexOf('Started executing') > -1 ) {
                	let testCaseNamesStart = findTestCaseStatusFromLogLine(logData, startedSearchString, startedSearchEndString);                	
                	//console.log('Found matching string for start at ' + logData);
                	//console.log('The following testcases started:');
            		testCaseNamesStart.map((ts)=> {
            			//console.log(ts);
            			let testCaseName = ts.substring(ts.lastIndexOf('/')+1);
            		//	console.log(testCaseName);
            			//console.log(args.tests);
            			let testCaseId = _.find(args.tests, {'testCaseName': testCaseName}).id;
            		//	console.log('The following testcaseintestrun will be updated for start: ' + testCaseId);
            			TestInTestRun.update({id:testCaseId}, {status:'running'}).exec((err, updated) => {
            				if(err) { console.log('Error updating TestCaseInTestRun ' + testCaseId); return; }
            				TestRun.findOne({id:args.runId}).populate('tests').exec((err, foundRun)=>TestRun.publishUpdate(
                                foundRun.id, foundRun));
            			});
            			}
            		);
                }

                if(logData.indexOf('Finished executing') > -1 ) {                	
                	let testCaseNamesEnd = findTestCaseStatusFromLogLine(logData, finishedSearchString, finishedSearchEndString);                	
                	//console.log('Found matching string for end at ' + logData);
                	//console.log('The following testcases ended:');
                	testCaseNamesEnd.map((te)=>{
                		//console.log(te);
            			let testCaseName = te.substring(te.lastIndexOf('/')+1);
            		//	console.log(testCaseName);
            			//console.log(args.tests);
	        			let testCaseId = _.find(args.tests, {'testCaseName': testCaseName}).id;
	        		//	console.log('The following testcaseintestrun will be updated for end: ' + testCaseId);
	        			TestInTestRun.update({id:testCaseId}, {status:'completed'}).exec((err, updated) => {
            				if(err) { console.log('Error updating TestCaseInTestRun ' + testCaseId); return; }
            				TestRun.findOne({id:args.runId}).populate('tests').exec((err, foundRun)=>TestRun.publishUpdate(foundRun.id, foundRun));
            			});
            		}
                	);
                }

                if(logData.indexOf('Report generated for ') > -1 ) {                   
                    let reports = findTestCaseReportFromLogLine(logData);
                    //console.log('Found matching string for report at ' + logData);
                    //console.log('The following reports were found:');
                    reports.map((tr)=>{
                       // console.log(tr);
                        //let testCaseName = te.substring(te.lastIndexOf('/')+1);
                    //  console.log(testCaseName);
                        //console.log(args.tests);
                        let testCaseId = _.find(args.tests, {'testCaseName': tr.name}).id;
                          //console.log('The following testcaseintestrun will be updated for report: ' + testCaseId);
                        TestInTestRun.update({id:testCaseId}, {reportPath:tr.reportPath}).exec((err, updated) => {
                            if(err) { console.log('Error updating TestCaseInTestRun ' + testCaseId); return; }
                            TestRun.findOne({id:args.runId}).populate('tests').exec((err, foundRun)=>TestRun.publishUpdate(foundRun.id, foundRun));
                        });
                    }
                    );
                }
                /*
                if(watcher == null && watcherScheduled == false)
                {
                    watcherScheduled =  true;
                    getPHATFileWatcher(socket, function(phatWatcher)
                        {
                          watcher = phatWatcher;
                        });
                }*/
            }
        );

        child.on('exit', (code) => {

        	/*
            setTimeout(function(){
            socket.broadcast.emit('sequential run ended', {}); //UGLY HACK to wait for watcher to close; refactor later
            socket.emit('sequential run ended', {});
            if(watcher)
            {
                console.log("closing file watcher...");
                watcher.close();
                watcher = null;
                watcherScheduled = false
            }
            tcname='NA';renable='NA';reporttype='NA';customer='NA';
            console.log(`child process exited with code ${code}`);
            }, 6000);*/
            callback();
            //check if run was not cancelled by user and then update status to completed
            TestRun.findOne({id:args.runId}).populate('tests').exec((err, foundRun) => {
                if(foundRun.status !== 'cancelled') {
                    TestRun.update({id:args.runId}, {status:'completed'}).exec((err, updated) => {
                        TestRun.findOne({id:args.runId}).populate('tests').exec((err, foundRun) => {TestRun.publishUpdate(args.runId, foundRun); sails.sockets.blast('update runs', PHATAdapterService.getQueueStatus());});
                    });
                }
            });
		});
    },
    writePropFile: function(dirName, propFileName, propCont) {
        var propFileWithPath = path.join(dirName, propFileName);
        if(legacy.isFilePresentSync(propFileWithPath)) {
            fs.writeFileSync(propFileWithPath, propCont);

        } else {
            sails.log('Writing new ph.props' + propFileWithPath.toString());
            fs.writeFileSync(propFileWithPath, propCont);
        }
    },
    getPropFile: function (dirName, propFileName) {
        var propFileWithPath = path.join(dirName, propFileName);
        if(legacy.isFilePresentSync(propFileWithPath))
        {
            let data = fs.readFileSync(propFileWithPath);
            
            return data.toString()
        } else {
            sails.log(' File NOT present ..  ' + propFileWithPath.toString());
        }
    },

    runNBI: function (args, callback) {
        
        //python exec_nbi_auto.py -sl ph-bxb-s1-sl-1 -cl ph-bxb-s1-cl-1 -c Master -csv 471_masterNightly.csv -elist NBI-Regression -ssl true
        sails.sockets.blast('update runs', PHATAdapterService.getQueueStatus());

        let spawn = require('child_process').spawn;
        // Create a child process
        let child;

        let nbiLogFile = path.normalize(NBI_CI_PLAT_LOCATION +'/logs/PH-Regression-product-soapui-project.log_thread_1'+args.runId);

        fs.writeFile(nbiLogFile, '', ()=>sails.log('NBI log file created'));

        let pythonCommandArgs = ["exec_nbi_auto.py", "-sl", args["sl"], "-cl", args['cl'], "-c", args['customer'] , "-csv", args["csv"], "-elist", args['elist'], "-ssl", args['ssl'], "-logSuffix", args['runId']]
        //sails.log(JSON.stringify(pythonCommandArgs));
        //sails.log(JSON.stringify(args));
            
        child = spawn(pythonExecutableName, pythonCommandArgs, {cwd: NBI_CI_PLAT_LOCATION} );
        TestRun.update({id:args.runId},{pid:child.pid}).exec(function(err, updated) {            
            sails.log(updated[0].id + ' updated with pid ' + child.pid);
            
            if(updated[0].status==='cancelled' ) { //for handling case where user clicks on 'Stop' immediately after starting execution
                kill(child.pid, 'SIGTERM', function( err ) {
                    if (err) {
                        sails.log('ERROR:Unable to stop process %s', child.pid);
                    }
                    else {
                        sails.log( 'Process %s has been killed', child.pid );
                    }
                });
            }
        })        

        let tail = new Tail(nbiLogFile);
            
        let reportLine;
        let reportURL;
        let logLine;
        let testCaseName;
        let completedTestCaseDetails;

        tail.on('line',
            function (data) {
                let logData = data.toString();
                //TestRun.publishUpdate(args.runId, {title:'console update', content: logData}); // disabled for now as it is making browser hang
                if(data.toString().indexOf(' [SoapUIProTestCaseRunner] Created report') > -1 ) {
                    let reportLine = data.toString();
                    let reportDetails = findReportDetailsFromReportLine(reportLine);
                    sails.log('Report details found: ' + JSON.stringify(reportDetails));
                    TestRun.update({id:args.runId}, {summaryReport:reportDetails.reportURL}).exec((err, updated) => {
                            if(err) { console.log('Error updating TestRun ' + args.runId); return; }
                            TestRun.findOne({id:args.runId}).populate('tests').exec((err, foundRun)=>TestRun.publishUpdate(
                                foundRun.id, foundRun));
                        });
                    }
                if(data.toString().indexOf('Running TestCase') > -1 ) {
                    let logLine = data.toString();
                    //sails.log('Test Case Run status found at line ' + logLine)
                    let testCaseName = findTestCaseRunningFromLogLine(logLine);
                    //sails.log('Detected running status for ' + testCaseName);
                    //sails.log(args.tests);
                    //sails.log(testCaseName);

                    let testCaseId = _.find(args.tests, {'testCaseName': testCaseName}).id;
                    TestInTestRun.update({id:testCaseId}, {status:'running'}).exec((err, updated) => {
                            if(err) { console.log('Error updating TestCaseInTestRun ' + testCaseId); return; }
                            TestRun.findOne({id:args.runId}).populate('tests').exec((err, foundRun)=>TestRun.publishUpdate(
                                foundRun.id, foundRun));
                        });
                    }
                if(data.toString().indexOf('Finished running TestCase') > -1 ) {
                    let logLine = data.toString();
                    //sails.log('Test Case Run status found at line ' + logLine)
                    completedTestCaseDetails = findTestCaseCompletedFromLogLine(logLine);
                    //sails.log('Detected completed status for ' + completedTestCaseDetails.testCaseName + ' with status ' + completedTestCaseDetails.status);
                    //sails.log(args.tests);
                    //sails.log(testCaseName);

                    let testCaseId = _.find(args.tests, {'testCaseName': completedTestCaseDetails.testCaseName}).id;
                    //  console.log('The following testcaseintestrun will be updated for end: ' + testCaseId);
                    TestInTestRun.update({id:testCaseId}, {status:completedTestCaseDetails.status}).exec((err, updated) => {
                        if(err) { console.log('Error updating TestCaseInTestRun ' + testCaseId); return; }
                        TestRun.findOne({id:args.runId}).populate('tests').exec((err, foundRun)=>TestRun.publishUpdate(foundRun.id, foundRun));
                    });
                    }
            }
        );

        tail.on("error", function(error) {
          console.log('ERROR: ', error);
          tail.unwatch();
        });

        child.on('exit', (code) => {
            callback();
            //check if run was not cancelled by user and then update status to completed
            TestRun.findOne({id:args.runId}).populate('tests').exec((err, foundRun) => {
                if(foundRun.status !== 'cancelled') {
                    TestRun.update({id:args.runId}, {status:'completed'}).exec((err, updated) => {
                        TestRun.findOne({id:args.runId}).populate('tests').exec((err, foundRun) => {TestRun.publishUpdate(args.runId, foundRun); sails.sockets.blast('update runs', PHATAdapterService.getQueueStatus());});
                    });
                }
            });
        });
    }

}

module.exports = legacy;

function findTestCaseStatusFromLogLine(logLine, searchString, searchEndString) {

	let newLogline = logLine;

	let foundTestCases = [];
    
	while(newLogline.indexOf(searchString) > -1)
	{				
		let testCaseNameStart = newLogline.indexOf(searchString) + searchString.length;
    	let testCaseNameEnd =  newLogline.indexOf(searchEndString, testCaseNameStart);
    	let testCaseName = newLogline.substring(testCaseNameStart, testCaseNameEnd).replace(/^\s+|\s+$/g, '');

    	//console.log(`Start: ${testCaseNameStart}  End: ${testCaseNameEnd}  TestcaseName: ${testCaseName}`);
    	//console.log('Found testcase ' + testCaseName +' when searching for ' + searchString);
    	//console.log(`blah ${testCaseName}`);
    	//console.log('Found testcase blah');
    	foundTestCases.push(testCaseName);
    	//console.log(`Found testcase ${testCaseName} when searching for ${searchString}`)
    	newLogline = newLogline.substring(testCaseNameEnd);
	}

	let uniq = Array.from(new Set(foundTestCases));
    return uniq;
}

function findTestCaseReportFromLogLine(logLine) {

    /*Report generated for ../test_scripts/sanity/product/Validate-LoginPage.xml at /opt/CTATReports/ph-bxb-s1-sl-1/Sanity-2017_05_11-17_16_28/Validate-LoginPage.html
    */

    let newLogline = logLine;

    let foundTestCases = [];
    let searchString = 'Report generated for';
    let searchEndString = '.html';

    while(newLogline.indexOf(searchString) > -1)
    {
        let nameAndReportStart = newLogline.indexOf(searchString) + searchString.length;
        let nameAndReportEnd =  newLogline.indexOf(searchEndString, nameAndReportStart);

        let nameAndReport = newLogline.substring(nameAndReportStart,nameAndReportEnd+5);
        let testCaseName = nameAndReport.split(' at ')[0];
        testCaseName = testCaseName.substring(testCaseName.lastIndexOf('/')+1);
        let reportPath = nameAndReport.split(' at ')[1]

        foundTestCases.push({name:testCaseName, reportPath:reportPath});
        //console.log(`Found testcase ${testCaseName} when searching for ${searchString}`)
        newLogline = newLogline.substring(nameAndReportEnd);
    }

    let uniq = Array.from(new Set(foundTestCases));
    return uniq;
}

function getTestCaseNameFromXMLString(xmlString) { //does not parse XML; extract name with simple string match; may break; have to test
    var nameStartPos = xmlString.indexOf('name="') + 6;
    var nameEndPos = xmlString.indexOf('"', nameStartPos);
    return xmlString.substring(nameStartPos, nameEndPos);
}

function findReportDetailsFromReportLine(reportLine) {
    var searchString = 'INFO  [SoapUIProTestCaseRunner] Created report at file:';
    var searchEndString = 'index.html'
    var reportURLStart = reportLine.indexOf(searchString) + searchString.length;
    var reportURLEnd =  reportLine.indexOf(searchEndString, reportURLStart) + searchEndString.length;

    var reportFullPath = reportLine.substring(reportURLStart, reportURLEnd);
    var reportDirName = path.basename(path.dirname(reportFullPath));
    var reportURL = 'nbi_reports/' + reportDirName + '/index.html';
    return {reportFullPath, reportDirName, reportURL}
}


function findTestCaseRunningFromLogLine(logLine) {
    var searchString = 'Running TestCase [';
    var searchEndString = ']';
    var testCaseNameStart = logLine.indexOf(searchString) + searchString.length;
    var testCaseNameEnd =  logLine.indexOf(searchEndString, testCaseNameStart);
    var testCaseName = logLine.substring(testCaseNameStart, testCaseNameEnd);

    return testCaseName;
}


function findTestCaseCompletedFromLogLine(logLine) {
    var searchString = 'Finished running TestCase [';
    var searchEndString = ']';
    var statusString = 'status: ';
    var statusStringEnd = '\n';
    var status;

    var testCaseNameStart = logLine.indexOf(searchString) + searchString.length;
    var testCaseNameEnd =  logLine.indexOf(searchEndString, testCaseNameStart);
    var testCaseName = logLine.substring(testCaseNameStart, testCaseNameEnd);

    var statusStart = logLine.indexOf(statusString, testCaseNameStart);
    var statusEnd = logLine.indexOf(statusStringEnd, statusStart);
    if(logLine.indexOf('\n') > -1)
        status = logLine.substring(statusStart + statusString.length, statusEnd);
    else
        status = logLine.substring(statusStart + statusString.length);

    return {testCaseName, status};
}