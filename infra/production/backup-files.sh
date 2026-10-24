#!/bin/sh
# Archives Valley Ride's uploaded files (KYC documents, handover photos, agreements, invoices) to
# infra/production/backups. Runs daily in the "backup" service and before every "server deploy".
# The database is dumped separately by the server (/opt/backups/postgres/valleyride).
set -eu
stamp=$(date -u +%Y%m%dT%H%M%SZ)
tar -czf /backups/.partial -C /uploads .
mv /backups/.partial "/backups/uploads-$stamp.tar.gz"
find /backups -name 'uploads-*.tar.gz' -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete
echo "files backup complete: $stamp"
