import React, { Component } from 'react';
import TextField from 'material-ui/TextField';
import Paper from 'material-ui/Paper';

export default class Console extends Component {

  render() {
    return <Paper><TextField name="console" className="console" fullWidth multiLine disabled value={this.props.content} /></Paper>
  }
}

