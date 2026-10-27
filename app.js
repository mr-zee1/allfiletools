const form = document.querySelector('#convertForm');
const input = document.querySelector('#fileInput');
const title = document.querySelector('#fileTitle');
const sub = document.querySelector('#fileSub');
const zone = document.querySelector('#dropzone');
const button = document.querySelector('#convertBtn');
const status = document.querySelector('#status');
document.querySelector('#year').textContent = new Date().getFullYear();

input.addEventListener('change', () => {
  const f = input.files[0];
  title.textContent = f ? f.name : 'Choose a file or drop it here';
  sub.textContent = f ? `${(f.size / 1024 / 1024).toFixed(2)} MB` : 'Maximum file size: 100 MB';
  if (f) {
    const ext = f.name.split('.').pop().toLowerCase();
    const preferred = ({jpeg:'png',jpg:'png',png:'jpg',webp:'png',mp4:'mp3',mov:'mp4',mp3:'wav',wav:'mp3',docx:'pdf',pdf:'docx',xlsx:'csv',csv:'xlsx'})[ext];
    if (preferred) document.querySelector('#toFormat').value = preferred;
  }
  status.textContent = '';
});
['dragenter','dragover'].forEach(ev => zone.addEventListener(ev, e => {e.preventDefault(); zone.classList.add('drag');}));
['dragleave','drop'].forEach(ev => zone.addEventListener(ev, e => {e.preventDefault(); zone.classList.remove('drag');}));
zone.addEventListener('drop', e => {
  if (e.dataTransfer.files.length) {
    input.files = e.dataTransfer.files;
    input.dispatchEvent(new Event('change'));
  }
});
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!input.files[0]) return;
  button.disabled = true;
  button.textContent = 'Converting…';
  status.textContent = 'Please wait while your file is converted.';
  try {
    const data = new FormData(form);
    const response = await fetch('/api/convert', { method: 'POST', body: data });
    if (!response.ok) {
      const err = await response.json().catch(()=>({error:'Conversion failed.'}));
      throw new Error(err.error || 'Conversion failed.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `converted.${document.querySelector('#toFormat').value}`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    status.textContent = 'Done! Your converted file has been downloaded.';
  } catch (err) {
    status.textContent = err.message || 'Conversion failed. Please try another format.';
  } finally {
    button.disabled = false;
    button.innerHTML = 'Convert file <span>→</span>';
  }
});
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{}));