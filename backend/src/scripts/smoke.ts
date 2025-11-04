/*
  Simple API smoke test.
  Env:
    - API_URL (default http://localhost:5000/api)
    - TOKEN (required)
    - FILE_PATH (optional: path to a file to upload)
*/
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

async function main() {
  const API_URL = process.env.API_URL || 'http://localhost:5000/api';
  const TOKEN = process.env.TOKEN;
  const FILE_PATH = process.env.FILE_PATH;
  if (!TOKEN) throw new Error('TOKEN is required in env');

  const api = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${TOKEN}` } });

  // Health details
  const health = await axios.get(`${API_URL}/health/details`).then(r => r.data).catch(e => ({ ok: false, error: e?.message }));
  console.log('Health:', health);

  // Files list (root)
  const files = await api.get('/files').then(r => r.data).catch(e => ({ error: e?.message }));
  console.log('Files (root):', { folders: files.folders?.length, files: files.files?.length });

  // Optional upload
  let fileId: string | undefined;
  if (FILE_PATH && fs.existsSync(FILE_PATH)) {
    console.log('Uploading file:', FILE_PATH);
    const fd = new FormData();
    fd.append('file', fs.createReadStream(FILE_PATH));
    const uploaded = await api.post('/files/upload', fd, { headers: fd.getHeaders() }).then(r => r.data);
    console.log('Uploaded:', uploaded.file?.id, uploaded.file?.name);
    fileId = uploaded.file?.id;
  }

  // Choose a test file if we didn't upload
  if (!fileId) {
    const pick = (files.files || [])[0];
    if (pick) fileId = pick.id || pick._id;
  }

  // Version + preview/download smoke (if have fileId)
  if (fileId) {
    const versions = await api.get(`/files/${fileId}/versions`).then(r => r.data);
    console.log('Versions count:', versions.versions?.length);

    // File preview
    const prev = await api.get(`/files/${fileId}/preview`).then(r => r.data);
    console.log('Preview mime:', prev.file?.mimeType, 'url:', prev.previewUrl ? 'ok' : 'missing');
    if (prev.previewUrl) {
      await fetch(prev.previewUrl).then(r => r.arrayBuffer());
    }

    if (versions.versions?.length > 0) {
      const v = versions.versions[0];
      // Version preview
      const vprev = await api.get(`/files/${fileId}/versions/${v.version_number}/preview`).then(r => r.data);
      if (vprev.previewUrl) {
        await fetch(vprev.previewUrl).then(r => r.arrayBuffer());
      }
      // Version download
      const vdl = await api.get(`/files/${fileId}/versions/${v.version_number}/download`).then(r => r.data);
      if (vdl.downloadUrl) {
        await fetch(vdl.downloadUrl, { method: 'GET' }).then(r => r.arrayBuffer());
      }
      // Restore (no rename)
      await api.post(`/files/${fileId}/versions/${v.version_number}/restore`);
      console.log('Restored to version', v.version_number);
    }
  }

  // Sync simulate (recent)
  await api.post('/sync/simulate', {});
  const syncStatus = await api.get('/sync/status').then(r => r.data);
  console.log('Sync status (non-synced):', syncStatus.files?.length);

  // Public share smoke (if fileId)
  if (fileId) {
    const link = await api.post(`/files/${fileId}/share/link`, { permission: 'view' }).then(r => r.data);
    if (link && link.shareId) {
      console.log('Public share created:', link.shareId);
      const pub = await axios.get(`${API_URL}/public/share/${link.shareId}`).then(r => r.data);
      console.log('Public share file:', pub.file?.name, 'perm:', pub.file?.permission);
    }
  }

  console.log('Smoke test complete.');
}

main().catch((e) => {
  console.error('Smoke test failed:', e?.response?.data || e?.message);
  process.exit(1);
});
