import React from 'react';
import './tree-view.css';

export default class MinimalTree extends React.Component {
	state = {
		collapsed: this.props.collapsed || true,
		checked: this.props.checked || false
		}

	toggleCollapse = () => this.setState({collapsed:!(this.state.collapsed)});

	toggleChecked = () => {		
		this.setState({checked:!(this.state.checked)}, ()=>this.state.checked ? this.props.onCheck(this.props.value) : this.props.onUncheck(this.props.value));		
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.checked !== this.props.checked) {			
			this.setState({checked:nextProps.checked}, ()=>this.state.checked ? this.props.onCheck(this.props.value) : this.props.onUncheck(this.props.value));			
		}
		if(nextProps.collapsed !== this.props.collapsed) {			
			this.setState({collapsed:nextProps.collapsed});
		}
	}

	render() {
			return <div className={this.props.className}>
					{(this.props.children && this.props.children.length) ?
						<span className={this.state.collapsed ? 'tree-view_arrow-collapsed tree-view_arrow':'tree-view_arrow'} onClick={this.toggleCollapse}/>
						: <span className="tree-view_children spacer"></span>} 
					<input
			            type="checkbox"
			            checked={this.state.checked}
			            onChange={this.toggleChecked} />
					<span>{this.props.label}</span>
					{(this.props.children && this.props.children.length) ?
					 <div>
						{
							this.props.children.map(
							(t,i)=>
							<MinimalTree
							collapsed={this.props.collapsed}
							onCheck={this.props.onCheck}
							onUncheck={this.props.onUncheck}
							value={{linkFileAndName:t.value, type:t.type}}
							checked={this.state.checked}
							className={this.state.collapsed ? "tree-view_children tree-view_children-collapsed" : "tree-view_children"}
							key={t.path} label={t.label} children={t.children} />
							)
						}
					</div>
					:""}
				   </div>		
	}
}