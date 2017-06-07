import React, { Component } from 'react';
import MinimalTree from './MinimalTree';
import {FormControl, FormGroup} from 'react-bootstrap';

import ajax from './simpleAjax';

export default class TestRepo extends Component {

	constructor() {
		super();
		this.selectedTests = new Set();
		this.state = {
			repo: [],
			filteredRepo: [],
			loaded:false,
			searchString:""
		}

		console.log()
	}
	
	onCheck = (x) => {
	    //console.log('Adding... ' + x + " to ");
	    //console.log(this.selectedTests);
	    if(x.type!='folder' && !this.selectedTests.has(x.linkFileAndName)) {
	    	//console.log('Not has...')	    	
	    	this.selectedTests.add(x.linkFileAndName);
	    	//console.log(this.selectedTests);
	    	this.props.onChange(Array.from(this.selectedTests));	    	
	    }
	}

  	onUncheck = (x) => {
  		//console.log('removing... ' + x);
  		if(this.selectedTests.has(x.linkFileAndName)) {
  			//console.log('Has...')
	    	this.selectedTests.delete(x.linkFileAndName);
	    	//console.log(this.selectedTests);
	    	this.props.onChange(Array.from(this.selectedTests));	
	    }
	}

	componentWillMount() {
		ajax.get('http://localhost:1337/testrepo/ui',{}, (data) => {
			data = data.replaceAll("\"name\":", "\"label\":");
			this.setState({repo:JSON.parse(data), filteredRepo:JSON.parse(data), loaded:true});			
		});
	}

	filterRepo = (e) => {		
		this.setState({searchString:e.target.value}, ()=> {
			let filtered = treeFilter({label:'test repo', children:this.state.repo}, this.state.searchString);
			this.setState({filteredRepo:filtered ? filtered.children: [] });
		});
	}

	render() {
	    return this.state.loaded ?
	    <div>
	    <form>
        <FormGroup>        
          <FormControl
            type="text"            
            value={this.state.searchString}
            placeholder="Search..."
            onChange={this.filterRepo}
          />                  
        </FormGroup>
      </form>
	    <MinimalTree onCheck={this.onCheck} onUncheck={this.onUncheck} label="test repo" collapsed={this.state.searchString.length ? false: true} children={this.state.filteredRepo} />
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
		let filteredChildren=x.children.map((c)=>treeFilter(c, filterString)).filter(t=>t !== null && t);
		if(filteredChildren.length > 0) return ({label:x.label, path:x.path, children:filteredChildren});			
	}
	else if(x.label.indexOf(filterString) > -1 ) return x;
	else return null;
}