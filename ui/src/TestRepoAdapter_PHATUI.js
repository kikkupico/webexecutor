export function getChecked(x, executor, accum) {
	if(executor === 'phat-ui') {
		if(x.checked && x.type !=='folder') accum.add({linkFilePath:x.value.split(',')[0], testCaseName:x.value.split(',')[1]});
		if(x.children)
			for(let i=0; i<x.children.length; i++)
				accum = getChecked(x.children[i], executor, accum);
		return accum;
	}

	else if (executor==='phat-nbi') {
		if(x.checked && x.type !=='folder') accum.add({testSuiteName:x.folder, testCaseName:x.label});
		if(x.children)
			for(let i=0; i<x.children.length; i++)
				accum = getChecked(x.children[i], executor, accum);
		return accum;
	}

	else {
		console.log('ERROR: unknown executor');
		return [];
	}
}

export function getRepoStateFromRun(origRepo, run) {	
	let repo = JSON.parse(JSON.stringify(origRepo));
	repo.checked=false;
	if(run.tests)
	{		
		for(let y of run.tests) {
			let folder = run.executor==='phat-ui' ? y.linkFilePath.substring(0, y.linkFilePath.lastIndexOf('test') -1) : y.testSuiteName;
			let fileName = y.testCaseName;
			if(repo.path.indexOf(folder)>-1 && repo.path.indexOf(fileName)>-1) {
				repo.checked = true;				
				break;
				}
		}
	}	

	if(repo.children) repo.children = repo.children.map((x)=>getRepoStateFromRun(x,run));
	return repo;
}
