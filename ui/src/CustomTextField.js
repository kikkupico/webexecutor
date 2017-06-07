import React, { Component } from 'react';
import TextField from 'material-ui/TextField';

export default class CustomTextfield extends Component {

  state = {
    text:this.props.text
  }

  onChange = (e) => {
  	  //console.log("Text Val Before Custom Set: "+this.state.text)
      this.setState({ text:e.target.value }/*,() => {console.log("Text Val After Custom Set: "+this.state.text)}*/);
      this.props.onChange(this.props.propKey, e.target.value);
  }

  componentWillReceiveProps(nextProps) {
  	//console.log(nextProps);
  	if (nextProps.text !== this.props.text ) {
  		this.setState({text: nextProps.text})
  	}
  }

  render() {
    return (
      <TextField name={this.props.propKey} onChange={this.onChange} floatingLabelText={this.props.label} 
      value={ this.state.text } />
    );
  }
}

