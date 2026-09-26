export function downloadFile(json: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(json)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  // eslint-disable-next-line unicorn/prefer-dom-node-append
  document.body.appendChild(a);
  a.click();
  requestAnimationFrame(() => {
    a.remove();
    URL.revokeObjectURL(url);
  });
}
