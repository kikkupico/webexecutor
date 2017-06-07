import React, { Component } from 'react';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Circle from 'material-ui/svg-icons/image/lens';
import {orange500, lightGreen500, red900, } from 'material-ui/styles/colors';
import ReportIcon from 'material-ui/svg-icons/action/assessment';
import IconButton from 'material-ui/IconButton';
import RaisedButton from 'material-ui/RaisedButton';
import CircularProgress from 'material-ui/CircularProgress';
import {Grid, Row, Col} from 'react-bootstrap';
import moment from 'moment-timezone';
import ajax from './simpleAjax';
import Chip from 'material-ui/Chip';

export default class TestRunViewer extends Component {

  stopRun = () => {
     ajax.post('http://localhost:1337/testrun/'+this.props.testRun.id+'/stop',{},(data) => {
      console.log(data.toString());
     });
  }

  render() {
    const statusColors = {completed:lightGreen500, FAILED: red900, FINISHED:lightGreen500, waiting:"#666"}
    const stopButton = this.props.testRun.status==='running' || this.props.testRun.status==='waiting' || this.props.testRun.status.toLowerCase().indexOf('queued') > -1 ? <RaisedButton secondary={true} label="Stop" onClick={this.stopRun} /> : null;
    const summaryReportIcon = this.props.testRun.summaryReport ?  <IconButton target="_blank" href={'http://localhost:1337/'+this.props.testRun.summaryReport}><ReportIcon /></IconButton> : null;
    return this.props.testRun.tests ?     
    <Grid fluid style={{border:"thin solid #ddd"}}>    
    <br />
    <Row>
    <Col md={1}>
    <CircularProgress
          mode="determinate"
          value={this.props.testRun.tests.filter(t=>t.status==='completed' || t.status==='FAILED' || t.status==='FINISHED' ).length/this.props.testRun.tests.length*100}
          size={80}
          thickness={5}
        />
      </Col>
      <Col md={4}>
      <h3>{this.props.testRun.name}</h3>
      <div style={{fontSize:"0.8em"}}>{this.props.testRun.executor==='phat-nbi' ? this.props.testRun.environment.PH_SL_HOSTNAME: this.props.testRun.propCont.match(/PH_SL_HOSTNAME=.*/)[0].substring(this.props.testRun.propCont.match(/PH_SL_HOSTNAME=.*/)[0].indexOf('=')+1)}</div>
      </Col>      
      <Col md={2}>
      <h3><Chip>{this.props.testRun.status}</Chip></h3>
      <div style={{fontSize:"0.8em"}}>{moment(this.props.testRun.updatedAt).format('MMMM Do YYYY, h:mm:ss a')}</div>
      </Col>
      <Col md={2}>
      <br />
      <RaisedButton label="clone" onClick={this.props.cloneRun} />
      {stopButton}
      </Col>    
      <Col md={1}>
      <br />      
      {summaryReportIcon}
      </Col>
      </Row>
      <br />
      <Row>
      <Col md={12}>
    <div><List> {
      this.props.testRun.tests.map(
        (t,i)=>
        {
          const statusIcon = t.status === 'running' ? <Circle color={orange500} className="blink_me"/> : <Circle color={statusColors[t.status]} />;
          const reportIcon = t.reportPath ?  <IconButton target="_blank" href={t.reportPath.replace('/opt/CTATReports','http://localhost:1337/reports')}><ReportIcon /></IconButton> : null;
          return <div key={i}>
          <ListItem primaryText={t.testCaseName} leftIcon={statusIcon} rightIconButton={reportIcon}>            
          </ListItem>
          <Divider />
          </div>
        }
        
        )
    } </List></div></Col></Row>
    <br /><br /></Grid> 
    :
     <div> Empty Test Run </div>
  }
}


/*
<span>{t.status === 'completed' ? <Label bsStyle="default"> completed</Label> : t.status === 'running' ? <Label bsStyle="warning">Running</Label> : <Label>{t.status}</Label>}</span>
          {t.reportPath ? <a target="_blank" href={t.reportPath.replace('/opt/CTATReports','http://localhost:1337/reports')} >Report</a>:" "}

<div>State: {this.props.testRun.status} </div>
          */

