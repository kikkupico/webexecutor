import React, { Component } from 'react';
import TextField from 'material-ui/TextField';

import './App.css';
import CustomTextField from './CustomTextField';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';


export default class Environment extends Component {

  state = {
    open: false
  }

  // This func returns a single prop Val from PropCont var
  getPropertyFromPropCont(key) {
    var propContAr = this.props.propCont.toString().split('\n');
    for (var i = propContAr.length - 1; i >= 0; i--) {
      var propContValAr = propContAr[i].toString().split('=');
      if (propContValAr[0].toString().trim() === key) {
        return propContValAr[1].toString().trim();
      }
    }
    return 'Prop key Undefined';
  }

  // This func helps to sync the val between the CustomText Field to propCont
  onCustomTextChange = (key, val) => {
      //var presentVal = this.getPropertyFromPropCont(key);
      var changedPropCont = this.props.propCont.replace(new RegExp(`\\${key}.*`, "gm"), `${key}=${val}`);
      this.props.onChange(changedPropCont);
    }

    handlePropChange = (e) => {
        this.props.onChange(e.target.value);
    }

    handleOpen = () => {
      this.setState({open: true});
    };

    handleClose = () => {
      this.setState({open: false});
    };

    render() {

      const actions = [
        <FlatButton
          label="Close"
          primary={true}
          onTouchTap={this.handleClose}
        />,
      ];

    return (
      this.props.isProploaded ?      
      <div>
      <CustomTextField onChange={this.onCustomTextChange} propKey="PH_LOGIN_URL" label="Enter PH Login URL: "
        text={ this.getPropertyFromPropCont('PH_LOGIN_URL') }/><br />

      <CustomTextField onChange={this.onCustomTextChange} propKey="PH_SL_HOSTNAME" label="Enter PH SL Hostname: "
        text={ this.getPropertyFromPropCont('PH_SL_HOSTNAME') }/><br />

      <CustomTextField onChange={this.onCustomTextChange} propKey="PH_CL_HOSTNAME" label="Enter PH CL Hostname: "
        text={ this.getPropertyFromPropCont('PH_CL_HOSTNAME') }/><br />

      <CustomTextField onChange={this.onCustomTextChange} propKey="PH_CUSTOMER" label="Enter PH Customer: "
        text={ this.getPropertyFromPropCont('PH_CUSTOMER') }/><br />

      <FloatingActionButton mini={true} onTouchTap={this.handleOpen}>
        <ContentAdd />
        <Dialog
          title="PH Properties"
          actions={actions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose}
          autoScrollBodyContent={true}
        >
        <TextField name="allProps" multiLine={true} fullWidth={true}
            value={ this.props.propCont } onChange={this.handlePropChange}/>
        </Dialog>
      </FloatingActionButton>

      
      </div>      
      : <div>Null Content</div>

      //<CustomTable propCont={ this.state.propCont }/>
      //  value={ this.state.propCont } onChange={this.handlePropChange}/>
    );
  }
}

