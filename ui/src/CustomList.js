import React, { Component } from 'react';
import TextField from 'material-ui/TextField';
import {List, ListItem} from 'material-ui/List';

export default class CustomList extends Component {

  render() {
    return this.props.propCont ?
      <List>{
        this.state.propCont.toString().split('\n').map(
            (t,i)=>
            <div key={i}>
              <ListItem primaryText={t} />
            </div>
            )
      }
      </List> : <div>Empty Val</div>
  }
}

