import React, { Component } from 'react';
import StatelessTree from './StatelessTree';
import {FormControl, FormGroup} from 'react-bootstrap';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';
import Slider from 'material-ui/Slider';

const styles = {
  root: {
    display: 'flex',
    height: 124,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
};

export default class TreeControl extends Component {

	constructor() {
		super();		
		this.state = {			
			loaded:false,
			searchString:"",
			rootTree: {}
		}

		console.log()
	}
	
	onCheck = (x) => {
		this.setState({rootTree:setPropCascadingDFS(this.state.rootTree, "path", x, "checked", true)}, () => this.props.onChange(Array.from(getChecked(this.state.rootTree, new Set()))));		
	}

  	onUncheck = (x) => {
  		this.setState({rootTree:setPropCascadingDFS(this.state.rootTree, "path", x, "checked", false)}, () => this.props.onChange(Array.from(getChecked(this.state.rootTree, new Set()))));
  	}

	onCollapse = (x) => this.setState({rootTree:setPropDFS(this.state.rootTree, "path", x, "collapsed", true)});

	onUncollapse = (x) => this.setState({rootTree:setPropDFS(this.state.rootTree, "path", x, "collapsed", false)});

	componentWillMount() {			
		this.setState({rootTree:addExtraProps(this.props.data, this.props.checkedItems), loaded:true});
	}

	componentWillReceiveProps(nextProps) {
		console.log(nextProps.data !== this.props.data || nextProps.checkedItems !== this.props.checkedItems);
		if(nextProps.data !== this.props.data || nextProps.checkedItems !== this.props.checkedItems)
			this.setState({rootTree:addExtraProps(this.props.data, this.props.checkedItems), loaded:true});
	}

	filterRepo = (e) => {		
		this.setState({searchString:e.target.value}, ()=> {
			let filtered = treeFilter(this.state.rootTree, this.state.searchString);
			this.setState({rootTree:filtered});
		});
	}

	render() {		
	    return this.state.loaded ?
	    <div>
			<TextField
			name="repo-filter"
			type="text"            
			value={this.state.searchString}
			hintText="Search..."
			onChange={this.filterRepo}
			/>
		    <StatelessTree 
			    onCollapse={this.onCollapse}	    
			    onUncollapse={this.onUncollapse}
			    onCheck={this.onCheck}
			    onUncheck={this.onUncheck}
			    path="root"
			    label="test repo"
			    collapsed={this.state.rootTree.collapsed}
			    checked={this.state.rootTree.checked}
			    children={this.state.rootTree.children} 
		    />
	    </div>
	    :
	     <div> Loading </div>
	  }
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function treeFilter (x, filterString) {	
	if(x.children) {
		let filteredChildren=x.children.map((c)=>treeFilter(c, filterString));
		x.children = filteredChildren;
		if(filteredChildren.filter(y=>y.hidden===false).length > 0)
		{
			x.hidden = false;
			x.collapsed = false;
		}
		else {
			x.hidden = true;
			x.collapsed = true;
		}
	}
	else if(x.label.indexOf(filterString) > -1 ) x.hidden=false;
	else x.hidden=true;
	return x;
}

function addExtraProps(x, checkedItems) {
	x.checked = false;
	for(let y of checkedItems){
		let folder = y.linkFilePath.substring(0, y.linkFilePath.lastIndexOf('test') -1);
		let fileName = y.testCaseName;		
		if(x.path.indexOf(folder)>-1 && x.path.indexOf(fileName)>-1) {
			x.checked = true;
			break;
		}
	}
		
	x.hidden = false;
	x.path==='root' ? x.collapsed = false : x.collapsed = true;
	if(x.children) x.children.map((x)=>addExtraProps(x,checkedItems));
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

function getChecked(x, accum) {	 
	if(x.checked && x.type !=='folder') accum.add(x.value);
	if(x.children)
		for(let i=0; i<x.children.length; i++)
			accum = getChecked(x.children[i], accum);
	return accum;
}