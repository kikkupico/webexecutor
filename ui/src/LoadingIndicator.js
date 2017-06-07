import React from 'react';
import {ProgressBar} from 'react-bootstrap';

export default class LoadingIndicator extends React.Component {

  render() {
    return (
      <div><h4 style={{marginTop:"1em"}}>Loading <img className="loading-image" height="30" alt="..." src="loading.svg" /></h4>
      {this.props.value? <ProgressBar active now={this.props.value} />: ""}
      </div>
    );
  }
}

LoadingIndicator.propTypes = {
  value: React.PropTypes.number       
}

LoadingIndicator.defaultProps = {
  value:0
}
