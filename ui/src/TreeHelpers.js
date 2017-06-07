export function treeFilter (y, filterString) {
	let x = JSON.parse(JSON.stringify(y));
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

export function setHiddenIfNotChecked(x) {
	if(x.children) {
		x.children = x.children.map(setHiddenIfNotChecked);
		if(x.children.filter(c=>c.hidden===false).length > 0) { x.hidden = false; x.collapsed = false;}
		else x.hidden=true;
	}
	else if(x.checked === false) x.hidden = true;
	else x.hidden = false;
	return x;
}

export function unHideAll(x) {
	if(x.children) {
		x.children = x.children.map(unHideAll);		
	}
	
	x.hidden = false;
	return x;
}
