import React, { Component } from 'react';
import './App.css';
import CustomTextField from './CustomTextField';
import Toggle from 'material-ui/Toggle';


export default class EnvironmentNBI extends Component {


  // This func helps to sync the val between the CustomText Field to propCont
  onCustomTextChange = (key, val) => {
      let newEnv = this.props.environment;
      newEnv[key]=val;
      this.props.onChange(newEnv);
    }

    setDevices = device => {
      let newEnv = this.props.environment;      
      newEnv.devices.filter(iteratedDevice => iteratedDevice.id === device.id)[0].enabled = device.enabled;
      this.props.onChange(newEnv);
    }
 
    render() {

      const devices  = this.props.environment.devices;

    return (
      this.props.isProploaded ?
      <div>
      <CustomTextField onChange={this.onCustomTextChange} propKey="PH_SL_HOSTNAME" label="Enter PH SL Hostname: "
        text={ this.props.environment['PH_SL_HOSTNAME'] }/><br />

      <CustomTextField onChange={this.onCustomTextChange} propKey="PH_CL_HOSTNAME" label="Enter PH CL Hostname: "
        text={ this.props.environment['PH_CL_HOSTNAME'] }/><br />

      <CustomTextField onChange={this.onCustomTextChange} propKey="PH_CUSTOMER" label="Enter PH Customer: "
        text={ this.props.environment['PH_CUSTOMER'] }/><br /><br />
      {devices.map(device => <DeviceToggle key={device.id} device={device}  onChange={this.setDevices} />)}
      </div>
      : <div>Loading...</div>

      //<CustomTable propCont={ this.state.propCont }/>
      //  value={ this.state.propCont } onChange={this.handlePropChange}/>
    );
  }
}

class DeviceToggle extends Component {

  toggleDevice = (e, val) => {
    let newDevice = this.props.device;
    newDevice.enabled = val;
    this.props.onChange(newDevice);
  }

  render() {
    return <Toggle key={this.props.device.id} defaultToggled={this.props.device.enabled} labelPosition="right" label={this.props.device.dataModel} style={{width:"33%"}} onToggle={this.toggleDevice} />
  }
}