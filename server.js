const express = require('express');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_MB = Number(process.env.MAX_FILE_MB || 100);
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 }
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'AllFileTools' }));

const MIME_EXT = {
  pdf: 'application/pdf', txt: 'text/plain', html: 'text/html',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
  gif: 'image/gif', tif: 'image/tiff', bmp: 'image/bmp',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', avi: 'video/x-msvideo',
  csv: 'text/csv', odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet'
};
const imageExts = new Set(['png','jpg','jpeg','webp','gif','tif','bmp']);
const mediaExts = new Set(['mp3','wav','ogg','m4a','mp4','webm','mov','avi']);
const officeExts = new Set(['pdf','docx','xlsx','pptx','txt','csv','odt','ods','html']);

function run(command, args, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore','ignore','pipe'] });
    let err = '';
    child.stderr.on('data', d => err += d.toString());
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Conversion timed out.')); }, timeoutMs);
    child.on('error', e => { clearTimeout(timer); reject(e); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(err.slice(-1200) || `${command} failed. Is it installed?`));
    });
  });
}
function cleanTemp(file) { if (file) fs.promises.rm(file, { force: true }).catch(()=>{}); }

app.post('/api/convert', upload.single('file'), async (req, res) => {
  const input = req.file;
  if (!input) return res.status(400).json({ error: 'Please select a file.' });
  const to = String(req.body.to || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const from = path.extname(input.originalname).slice(1).toLowerCase();
  const work = path.join(os.tmpdir(), 'aft-' + crypto.randomUUID());
  const output = path.join(work, 'converted.' + to);
  try {
    if (!to || !MIME_EXT[to]) throw new Error('This output format is not supported yet.');
    if (from === to || (from === 'jpg' && to === 'jpeg') || (from === 'jpeg' && to === 'jpg')) {
      throw new Error('Choose a different output format.');
    }
    await fs.promises.mkdir(work, { recursive: true });

    if (imageExts.has(from) && imageExts.has(to)) {
      // ImageMagick is required for image conversion.
      await run('magick', [input.path, output], 60000);
    } else if (mediaExts.has(from) && mediaExts.has(to)) {
      // FFmpeg is required for audio/video conversion.
      await run('ffmpeg', ['-y', '-i', input.path, '-threads', '2', output], 180000);
    } else if (officeExts.has(from) && officeExts.has(to)) {
      // LibreOffice is required for document/spreadsheet/presentation conversion.
      const outDir = work;
      await run('libreoffice', ['--headless', '-env:UserInstallation=file://' + path.join(work, 'lo-profile'),
        '--convert-to', to, '--outdir', outDir, input.path], 120000);
      const generated = path.join(outDir, path.basename(input.originalname, path.extname(input.originalname)) + '.' + to);
      if (fs.existsSync(generated)) await fs.promises.rename(generated, output);
      else if (!fs.existsSync(output)) throw new Error('This document conversion is not supported by LibreOffice.');
    } else {
      throw new Error('These file types cannot be converted by this starter. Try an image, media, or office-document format.');
    }

    if (!fs.existsSync(output)) throw new Error('Conversion did not produce an output file.');
    res.setHeader('Content-Type', MIME_EXT[to] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="converted.${to}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(output, async () => {
      cleanTemp(input.path);
      await fs.promises.rm(work, { recursive: true, force: true }).catch(()=>{});
    });
  } catch (err) {
    cleanTemp(input.path);
    await fs.promises.rm(work, { recursive: true, force: true }).catch(()=>{});
    res.status(400).json({ error: err.message || 'Conversion failed.' });
  }
});
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large. Maximum size is ${MAX_MB} MB.` });
  }
  res.status(400).json({ error: err.message || 'Request failed.' });
});
app.listen(PORT, () => console.log(`AllFileTools running at http://localhost:${PORT}`));
