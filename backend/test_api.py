import httpx
r = httpx.get('https://arbeitnow.com/api/job-board-api', follow_redirects=False, timeout=10)
print(f'Status: {r.status_code}, Location: {r.headers.get("location", "N/A")}')
