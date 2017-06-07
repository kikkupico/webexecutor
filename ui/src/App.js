import {io} from './SailsSockets'; // this should be imported first. may throw errors if imported later

import React, { Component } from 'react';
import TestRunViewer from './TestRunViewer';
import StatelessTreeControl from './StatelessTreeControl';
import {addExtraProps} from './StatelessTreeControl';
import {getChecked, getRepoStateFromRun} from './TestRepoAdapter_PHATUI';
import OtherRuns from './OtherRuns';
import ajax from './simpleAjax';
import SplitPane from 'react-split-pane';
import injectTapEventPlugin from 'react-tap-event-plugin';
import AppBar from 'material-ui/AppBar';
import RaisedButton from 'material-ui/RaisedButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {
  Step,
  Stepper,
  StepButton,
  StepContent,
} from 'material-ui/Stepper';
import TextField from 'material-ui/TextField';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip';
import {treeFilter} from './TreeHelpers';
import Environment from './Environment';
import EnvironmentNBI from './EnvironmentNBI';
import {List, ListItem} from 'material-ui/List';
import TestRunIcon from 'material-ui/svg-icons/av/play-arrow';
import {grey500} from 'material-ui/styles/colors';
import Divider from 'material-ui/Divider';
import Logo from 'material-ui/svg-icons/image/texture';
//import bluebird from 'bluebird';
import Console from './Console';
import LoadingIndicator from './LoadingIndicator';

import './App.css';

injectTapEventPlugin();

class App extends Component {
  state = {
    testRun: {status:"waiting", executor: "phat-ui"},
    serverRunID:undefined,
    executing: false,
    threads: 1,
    stepIndex:0,
    testRepo:{},
    initialRepo:{},
    propCont:{},
    searchString:"",
    loaded: false,
    isProploaded: false,
    activeTab:'Past Runs',
    executionName:'custom',    
    showOnlySelected: false,
    contentMode: "run creation",
    selectedMenu: 1,
    otherRuns: [],
    environment: {PH_SL_HOSTNAME:'ph-bxb-s1-sl-1', PH_CL_HOSTNAME:'ph-bxb-s1-cl-1', PH_CUSTOMER:'Master', devices:[]},
    consoleOutput: "",
    queues: [],
    loadingRun: false,
    executeReady: true,
    iterations:1
  }

  filterRepo = (e) => this.setState({testRepo:treeFilter(this.state.testRepo, e.target.value),searchString:e.target.value});

  toggleShowOnlySelected = () => this.setState({showOnlySelected:!this.state.showOnlySelected});

  setExecutionName = e => this.setState({executionName:e.target.value});

  setTab = t => this.setState({activeTab:t});

  setRun = (id) => { //if a run is subscribed to, delete the subscription; subscribe to new run
    if(this.state.testRun.id) {
      io.socket.delete('/testrun/'+this.state.testRun.id+'/subscription', (body, response) => {
        //console.log(`${body} ${response}`);
        return true;
      });
    }

    this.setState({loadingRun:true});

    io.socket.get('/testrun/'+id, (body, response) => {
                    ajax.get('http://localhost:1337/testrun?sort=createdAt DESC&limit=5&populate=name,status', {},
                    (runsData) => 
                    {
                    this.setState({testRun:body, testRepo:getRepoStateFromRun(body.executor==='phat-nbi'? this.getInitialRepoNBI(): this.getInitialRepoUI(), body), executionName:body.name, propCont:body.propCont, environment:body.environment},
                      ()=>this.setState({contentMode:'run viewing', consoleOutput:"", loadingRun:false}));
                    })
                });
  }

  setRepo = r => this.setState({testRepo:r, tests:this.getTestsFromRun()}); //TODO: remove the tests setting logic from here and put it in execute; redesign logic for enabling execution start

  setPropCont = r => this.setState({propCont:r});

  setEnvironment = e => this.setState({environment:e});

  componentWillMount() {

    fetch('http://localhost:1337/devices')
    .then(response=> response.json())
    .then(content=>this.setState({environment:{...this.state.environment, devices:content}}));


    fetch('http://localhost:1337/queues')
    .then(response=> response.json())
    .then(content=>this.setState({queues:content}));

    ajax.get('http://localhost:1337/testrepo/nbi',{},
            (data) => {this.setState({testRepoNBI:addExtraProps({path:"root", label:"ui test scripts", children:JSON.parse(data)}), initialRepoNBI:addExtraProps({path:"root", label:"nbi test scripts", children:JSON.parse(data)}), loaded:true})})

    ajax.get('http://localhost:1337/testrun?sort=createdAt DESC&limit=5&populate=name,status', {},
      (data) => 
      {
        this.setState({otherRuns:JSON.parse(data)},
          () => ajax.get('http://localhost:1337/testrepo/ui',{},
            (data) => {this.setState({testRepo:addExtraProps({path:"root", label:"ui test scripts", children:JSON.parse(data)}), initialRepo:addExtraProps({path:"root", label:"ui test scripts", children:JSON.parse(data)}), loaded:true})}))
      }
    );

    ajax.get('http://localhost:1337/testprop/get',{}, (data) => {
        this.setState({propCont:JSON.parse(data), isProploaded:true});
      });
  }

  newRunUI = () => this.setState({iterations:1, executeReady:true, searchString:"", testRun:{status:"waiting", executor:"phat-ui"}, contentMode:"run creation", executionName:"custom", testRepo:this.getInitialRepoUI(), consoleOutput:""})
  newRunNBI = () => this.setState({iterations:1, executeReady:true, searchString:"", testRun:{status:"waiting", executor:"phat-nbi"}, contentMode:"run creation", executionName:"custom", testRepo:this.getInitialRepoNBI(), consoleOutput:""})

  getTestsFromRun = () => Array.from(getChecked(this.state.testRepo, this.state.testRun.executor, new Set()));

  execute = () => {
    this.setState({executeReady:false});
    var type = 1;
    var tests = this.getTestsFromRun();
    if(tests[0].linkFilePath && tests[0].linkFilePath.indexOf('regression') > -1) type =2;
    this.setState({executing:true});

    for(let i=0;i<this.state.iterations;i++) {
      ajax.post('http://localhost:1337/testrun',{executor: this.state.testRun.executor, name:this.state.executionName, tests:tests, propCont:this.state.propCont, environment:this.state.environment},      (data) => {
                  console.log(JSON.parse(data).id); this.setState({serverRunID:JSON.parse(data).id});
                  io.socket.get('/testrun/'+JSON.parse(data).id, (body, response) => {
                    ajax.get('http://localhost:1337/testrun?sort=createdAt DESC&limit=5&populate=name,status', {},
                    (runsData) => 
                    {
                    this.setState({testRun:body, activeTab:'Run Viewer', otherRuns:JSON.parse(runsData)});
                    ajax.post('http://localhost:1337/testrun/'+JSON.parse(data).id+'/start?threads='+this.state.threads+'&type='+type,{},
                      (data) => {
                        this.setState({contentMode:"run viewing", consoleOutput:""});
                      })
                  })
                });
      });
    }    
  }

  getRuns = () => ajax.get('http://localhost:1337/testrun?sort=createdAt DESC&limit=5&populate=name,status', {},
                    (runsData) => this.setState({'otherRuns':JSON.parse(runsData)}));

  updateRunsLocal = () => {
    if(this.state.testRun.id)
    {
      let updatedRuns = this.state.otherRuns;
      for(let run of updatedRuns)
      {
        if(run.id === this.state.testRun.id) {
          run['status'] = this.state.testRun.status;
          this.setState({otherRuns:updatedRuns});
          break;
        }
      }
    }    
  }

  readyToRun = () => {
    return (this.state.testRun.status==='waiting' && this.getTestsFromRun()>0 );
  }

  getInitialRepoUI = () => JSON.parse(JSON.stringify(this.state.initialRepo));

  getInitialRepoNBI = () => JSON.parse(JSON.stringify(this.state.initialRepoNBI));

  cloneRun = () => this.setState({iterations:1, contentMode:'run creation', testRun:{...this.state.testRun, id:null}, searchString:"", executeReady:true}); 

  changeThreads = (e) => {    
    this.setState({threads:e.target.value});
  }

  changeIterations = (e) => {    
    this.setState({iterations:e.target.value});
  }

  setSelectedMenu = i => this.setState({selectedMenu:i}, console.log(i));

  componentDidMount() {
    io.socket.on('testrun',  (res) => {
      if(res.data.title && res.data.title==='console update') {
        this.setState({consoleOutput:this.state.consoleOutput+res.data.content});
      }
      else {
        if(res.data.status==='pass' || res.data.status === 'fail' || res.data.status === 'completed') this.setState({testRun:res.data, executing:false}, this.updateRunsLocal);
        else this.setState({testRun:res.data}, this.updateRunsLocal);
      }      
    });

    io.socket.on('update runs',  (res) => {
      this.getRuns();
      this.setState({queues:res});
    });
  }


  render() {
    const muiTheme = getMuiTheme({
 /* tabs: {
      backgroundColor: "#efefef",
      textColor: "#999",
      selectedTextColor: "#000",
    },*/
});

    const testRepoReady = this.getTestsFromRun().length > 0;

    if(this.state.loaded)
    return (
      <MuiThemeProvider muiTheme={muiTheme}>
      <div className="niceFont">       
      <SplitPane pane1Style={{backgroundColor:"#fff", overflow:"auto"}} split="vertical" minSize={300} defaultSize={"20%"} pane2Style={{backgroundColor:"#fafafa", overflow:"auto"}} >
        <div>
        <div className="logo"><h3><Logo className="logo-icon" color="#999" />{" "}PHAT Central</h3></div>
        <Divider />
        <List>
          <ListItem onClick={this.newRunUI} leftIcon={<TestRunIcon color={grey500}/>} className={this.state.contentMode==='run creation' && this.state.testRun.executor==='phat-ui' ? "selectedItemInList":""} primaryText="UI Test Runner" value={1} secondaryText="Click here to create and execute a new run" />          
          <ListItem onClick={this.newRunNBI} leftIcon={<TestRunIcon color={grey500}/>} className={this.state.contentMode==='run creation' && this.state.testRun.executor==='phat-nbi' ? "selectedItemInList":""} primaryText="NBI Test Runner" value={1} secondaryText="Click here to create and execute a new run" />
        </List>
        <Divider />
        <OtherRuns otherRuns={this.state.otherRuns} selected={this.state.testRun.id} onClick={this.setRun} />
        </div>

        {this.state.contentMode === 'run creation' ? 
        <div><AppBar title="Runner" className="sub-appbar" iconElementLeft={<span />} > <QueueViewer queues={this.state.queues} /> </AppBar>
        <div className="like-content">        
         <Stepper
          activeStep={this.state.stepIndex}
          linear={false}
          orientation="vertical"
          >
          <Step completed={ testRepoReady }>
            <StepButton onTouchTap={() => this.setState({stepIndex: 0})}>
              Select Tests
            </StepButton>
            <StepContent>             
              <TextField
              name="repo-filter"
              type="text"
              value={this.state.searchString}
              hintText="Search..."
              onChange={this.filterRepo}
              />
              <StatelessTreeControl onChange={this.setRepo} data={this.state.testRepo} />
            </StepContent>
          </Step>
          <Step>
            <StepButton onTouchTap={() => this.setState({stepIndex: 1})}>
              Select Environment
            </StepButton>
            <StepContent>
            {
              this.state.testRun.executor==='phat-nbi' ? 
              <EnvironmentNBI devices={this.state.devices} environment={this.state.environment} isProploaded={this.state.isProploaded} onChange={this.setEnvironment} />
              :
              <Environment propCont={this.state.propCont} isProploaded={this.state.isProploaded} onChange={this.setPropCont} />
            }            
            <br />
            </StepContent>
          </Step>
        </Stepper>
        <br />
        <div className="like-content">          
          <TextField
            type='number'
            min={1}
            max={24}
            value={this.state.threads}
            floatingLabelText="Threads"
            onChange={this.changeThreads}
          /><br />
          <TextField
            value={this.state.executionName}
            onChange={this.setExecutionName}
            floatingLabelText="Execution Name"
          /><br />
          <TextField
            type='number'
            min={1}
            max={5}
            value={this.state.iterations}
            floatingLabelText="Iterations"
            onChange={this.changeIterations}
          />
          <br />
          <RaisedButton label={'Execute'} primary={true} disabled={!testRepoReady || !this.state.executeReady} onClick={this.execute} />
        </div>
        </div>
        </div>
        :        
        <div> {this.state.loadingRun ? <AppBar title={<LoadingIndicator />} className="sub-appbar" iconElementLeft={<span />} ></AppBar> :
          <div>
          <AppBar title="Run Viewer" className="sub-appbar" iconElementLeft={<span />} >
            <QueueViewer queues={this.state.queues} />          
          </AppBar>
          <div className="like-content">
            <div  >
              <TestRunViewer cloneRun={this.cloneRun} testRun={this.state.testRun} /></div>
              <br />
              <br />
              <Console content={this.state.consoleOutput} />
          </div>
          </div>
          }
        </div>         
      }
      </SplitPane>
      </div>
      </MuiThemeProvider>
    );
  else return null
  }
}

export default App;

class QueueViewer extends React.Component {
  render() {
    return (
    <div className="execution-queue">
          {
            this.props.queues.map((q,i) =>
              <Chip key={i} className="execution-queue-chip">
                <Avatar size={32}>{q.size}</Avatar>
                {q.id}
              </Chip>
              )
          }          
          </div> )
  }
}