import React from 'react';
import './tree-view.css';

export default class StatelessTree extends React.Component {

	toggleCollapse = () => this.props.collapsed ? this.props.onUncollapse(this.props.path) : this.props.onCollapse(this.props.path);

	toggleChecked = () => this.props.checked ? this.props.onUncheck(this.props.path) : this.props.onCheck(this.props.path);
	
	render() {
		var folderIcon = "fa fa-folder-o";

		if(!this.props.collapsed) folderIcon = "fa fa-folder-open-o";
		
		if(this.props.value) 
			{
				if(this.props.value.type === 'file') folderIcon = "fa fa-file-o"; 
			else 
			{
				if(this.props.value.type === 'file-seq') folderIcon = "fa fa-flash";
				else if(this.props.value.type === 'file-new') folderIcon = "fa fa-asterisk";
			}
		}

		if(!this.props.hidden)
			return <div className={this.props.className}>
					{(this.props.children && this.props.children.length) ?
						<span className={this.props.collapsed ? 'tree-view_arrow-collapsed tree-view_arrow':'tree-view_arrow'} onClick={this.toggleCollapse}/>
						: <span className="tree-view_children spacer"></span>}
					{this.props.checkable ? <input
			            type="checkbox"
			            checked={this.props.checked}
			            onChange={this.toggleChecked} /> : ""}
					<span>{" "}<i className={folderIcon}></i>{" "}{this.props.label}</span>
					{(this.props.children && this.props.children.length) ?
					 <div>
						{
							this.props.children.map(
							(t,i)=>
							<StatelessTree							
							checkable={true}
							collapsed={t.collapsed}
							onCheck={this.props.onCheck}
							onUncheck={this.props.onUncheck}
							onCollapse={this.props.onCollapse}
							onUncollapse={this.props.onUncollapse}							
							checked={t.checked}
							className={this.props.collapsed ? "tree-view_children tree-view_children-collapsed" : "tree-view_children"}
							path={t.path}
							key={t.path}
							label={t.label}
							children={t.children}
							hidden={t.hidden}							
							/>
							)
						}
					</div>
					:""}
				   </div>
	   else return null;
	}
}