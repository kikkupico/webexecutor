import React, { Component } from 'react';
import StatelessTree from './StatelessTree';

export default class StatelessTreeControl extends Component {
	
	onCheck = (x) => this.props.onChange(setPropCascadingDFS(this.props.data, "path", x, "checked", true));

  	onUncheck = (x) => this.props.onChange(setPropCascadingDFS(this.props.data, "path", x, "checked", false));
	
	onCollapse = (x) => this.props.onChange(setPropDFS(this.props.data, "path", x, "collapsed", true));

	onUncollapse = (x) => this.props.onChange(setPropDFS(this.props.data, "path", x, "collapsed", false));

	/*filterRepo = (e) => {
		this.setState({searchString:e.target.value}, ()=> this.props.onChange(treeFilter(this.props.data, this.state.searchString)));
	}*/

	render() {
		return <StatelessTree 
			    onCollapse={this.onCollapse}	    
			    onUncollapse={this.onUncollapse}
			    onCheck={this.onCheck}
			    onUncheck={this.onUncheck}
			    path="root"
			    label="test repo"
			    collapsed={this.props.data.collapsed}
			    checked={this.props.data.checked}
			    children={this.props.data.children}
		    />	    
	  }
}

export function addExtraProps(x) {
	x.checked = false;	
	x.hidden = false;
	x.path==='root' ? x.collapsed = false : x.collapsed = true;
	if(x.children) x.children.map(addExtraProps);
	return x;
}

function setPropDFS(x, key, keyVal, prop, value) {
	//console.log(`Finding node with ${key}=${keyVal} to set ${prop}=${value}`)
	if(x[key]===keyVal) 
	{
		x[prop]=value;
		//console.log(x)
		return x;
	}

	else {
		if(x.children) {
			x.children.map(t=>setPropDFS(t, key, keyVal, prop, value));
			//console.log(x)
			return x;
		}
		else
		{
			//console.log('Node not found');
			return x;
		}
	}
}

function setPropCascadingDFS(x, key, keyVal, prop, value) {
	//console.log(`Finding node with ${key}=${keyVal} to set ${prop}=${value}`)
	if(x[key]===keyVal) setPropCascadingNoFilter(x, prop, value);

	else {
		if(x.children) {
			x.children.map(t=>setPropCascadingDFS(t, key, keyVal, prop, value));
			//console.log(x)
			return x;
		}
		else
		{
			//console.log('Node not found');
			return x;
		}
	}
}

function setPropCascadingNoFilter(x, prop, value) {
	if(x.hidden === false){
		x[prop]=value;
		if(x.children) x.children.map(t=>setPropCascadingNoFilter(t, prop, value));
	}	
	return x;
}
