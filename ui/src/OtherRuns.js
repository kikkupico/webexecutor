import React, { Component } from 'react';
//import {Label} from 'react-bootstrap';
import moment from 'moment-timezone';
import {SelectableList} from './SelectableList';
import {ListItem} from 'material-ui/List';
import ActionGrade from 'material-ui/svg-icons/action/grade';
import StarBorder from 'material-ui/svg-icons/toggle/star-border';
import Circle from 'material-ui/svg-icons/action/work';
import {pinkA200, orange500, lightGreen500} from 'material-ui/styles/colors';
import Subheader from 'material-ui/Subheader';


export default class OtherRuns extends Component {  

  componentWillReceiveProps(nextProps) {
    if(this.props.selected !== nextProps.selected) this.setState({selected:this.props.selected});
  }

  render() {
    return this.props.otherRuns.length ?
    <div><SelectableList onSelect={this.props.onSelect} >
          <Subheader>Recent Runs</Subheader>
    {
    this.props.otherRuns.map((t,i)=><div key={i}><OnePastRun noHighlight={this.props.noHighlight} selected={this.props.selected} t={t} value={i+1} onClick={this.props.onClick} /></div>)
    }
    </SelectableList></div>
    :
     <div> Loading...</div>
  }
}

class OnePastRun extends Component {

  sendRunId = (id) => { this.props.onClick(this.props.t.id); }
  state = {
    faved: false
  }  

  toggleFave = e => {e.stopPropagation(); this.setState({faved:!this.state.faved});}

  render() {
    const className = this.props.t.id===this.props.selected ? "selectedItemInList":"";
    const faveIcon = this.state.faved ?  <ActionGrade color={pinkA200} onClick={this.toggleFave} /> : <StarBorder onClick={this.toggleFave} />
    const statusIcon = this.props.t.status === 'completed' ? <Circle color={lightGreen500} /> : this.props.t.status === 'running' ? <Circle color={orange500} className="blink_me"/> : <Circle color="#E0E0E0" />;
    return (
        <ListItem className={className} onChange={this.props.handleRequestChange} value={this.props.value} secondaryText={moment(this.props.t.updatedAt).fromNow()} primaryText={this.props.t.name} leftIcon={statusIcon} rightIcon={faveIcon} onClick={this.sendRunId} ></ListItem>)
  }
}
