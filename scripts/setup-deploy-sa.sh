#!/usr/bin/env bash
# One-time setup: create the GitHub Actions deploy service account for
# fibo-49d58, grant it Firebase admin, and store its key as the
# FIREBASE_SERVICE_ACCOUNT secret on jakeflavin/fibo.
#
# Requires: firebase CLI (logged in) and gh CLI (logged in).
set -euo pipefail

PROJECT=fibo-49d58
REPO=jakeflavin/fibo
SA_NAME=github-deploy
SA_EMAIL="$SA_NAME@$PROJECT.iam.gserviceaccount.com"

# Access token from the firebase CLI's stored session (its own public
# OAuth client constants, same as firebase-tools uses internally).
TOKEN=$(node -e "
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync(process.env.HOME + '/.config/configstore/firebase-tools.json', 'utf8'));
const body = new URLSearchParams({
  grant_type: 'refresh_token',
  refresh_token: cfg.tokens.refresh_token,
  client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
  client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
});
fetch('https://oauth2.googleapis.com/token', { method: 'POST', body })
  .then(r => r.json())
  .then(j => { if (!j.access_token) { console.error(JSON.stringify(j)); process.exit(1); } process.stdout.write(j.access_token); });
")

api() { curl -sS -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" "$@"; }

echo "→ creating service account $SA_EMAIL"
api -X POST "https://iam.googleapis.com/v1/projects/$PROJECT/serviceAccounts" \
  -d "{\"accountId\": \"$SA_NAME\", \"serviceAccount\": {\"displayName\": \"GitHub Actions deploy\"}}" \
  | grep -q '"email"\|already exists' || true

echo "→ granting roles/firebase.admin"
POLICY=$(api -X POST "https://cloudresourcemanager.googleapis.com/v1/projects/$PROJECT:getIamPolicy" -d '{}')
UPDATED=$(node -e "
const policy = $POLICY;
const role = 'roles/firebase.admin';
const member = 'serviceAccount:$SA_EMAIL';
let b = policy.bindings.find(b => b.role === role);
if (!b) { b = { role, members: [] }; policy.bindings.push(b); }
if (!b.members.includes(member)) b.members.push(member);
process.stdout.write(JSON.stringify({ policy }));
")
api -X POST "https://cloudresourcemanager.googleapis.com/v1/projects/$PROJECT:setIamPolicy" \
  -d "$UPDATED" > /dev/null

echo "→ creating key + storing as GitHub secret FIREBASE_SERVICE_ACCOUNT"
KEY=$(api -X POST "https://iam.googleapis.com/v1/projects/$PROJECT/serviceAccounts/$SA_EMAIL/keys" -d '{}')
node -e "
const key = $KEY;
process.stdout.write(Buffer.from(key.privateKeyData, 'base64').toString('utf8'));
" | gh secret set FIREBASE_SERVICE_ACCOUNT --repo "$REPO"

echo "✓ done — pushes to main will now deploy"
