import requests
r=requests.get('https://api.github.com/repos/Joedgan12/Momentum-Physics-Modeling/actions/runs?per_page=20', headers={'User-Agent':'list-runs'})
print('status', r.status_code)
data=r.json()
for run in data.get('workflow_runs',[])[:10]:
    print(run['id'], run['name'], run['event'], run['status'], run['conclusion'], run['head_sha'][:7])
