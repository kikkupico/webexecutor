import {makeSelectable, List} from 'material-ui/List';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

export var SelectableList = makeSelectable(List);

function wrapState(ComposedComponent) {
  return class SelectableList extends Component {
    static propTypes = {
      children: PropTypes.node.isRequired
    };

    componentWillMount() {
      this.setState({
        selectedIndex: this.props.selectedIndex,
      });
    }

    handleRequestChange = (event, index) => {
      this.setState({
        selectedIndex: index,
      }, this.props.onSelect(index));
    };

    render() {
      return (
        <ComposedComponent
          value={this.state.selectedIndex}
          onChange={this.handleRequestChange}
        >
          {this.props.children}
        </ComposedComponent>
      );
    }
  };
}

SelectableList = wrapState(SelectableList);