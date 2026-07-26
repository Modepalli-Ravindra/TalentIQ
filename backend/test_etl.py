import os, sys
sys.path.insert(0, 'backend')
from dotenv import load_dotenv
load_dotenv('backend/.env')

from supabase import create_client
from app.etl.repository import JobRepository
from app.etl.sync_service import JobSyncService

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
client = create_client(url, key)
repo = JobRepository(client)
service = JobSyncService(repo)

import asyncio
report = asyncio.run(service.sync(max_pages=2))
print(f'Status: {report.status}')
print(f'Fetched: {report.total_fetched}')
print(f'Imported: {report.imported}')
print(f'Updated: {report.updated}')
print(f'Duplicates: {report.duplicates}')
print(f'Failed: {report.failed}')
print(f'Errors: {report.errors}')
print(f'Time: {report.execution_time_seconds}s')
