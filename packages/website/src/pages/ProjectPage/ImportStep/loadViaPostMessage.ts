import type { OsmPatch } from 'osm-api';
import { safeFileName } from './downloadOsmPatch.js';

export const LEGACY_WIZARD_URL =
  window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:3000/#/upload'
    : '/#/upload';

export const iD_URL = 'https://kyle.kiwi/iD';

function waitForPostMessage(msg: string, source: Window, origin: string) {
  return new Promise<void>((resolve, reject) => {
    let isSettled = false;
    function onMessage(event: MessageEvent) {
      if (event.source !== source || event.origin !== origin) return;
      if (event.data !== msg) return;
      if (isSettled) return;
      isSettled = true;
      resolve();
      window.removeEventListener('message', onMessage);
    }
    window.addEventListener('message', onMessage);
    setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      reject(new Error('timed out while waiting for message from the new tab'));
      window.removeEventListener('message', onMessage);
    }, 10_000);
  });
}

export async function loadViaPostMessage(
  osmPatchFiles: Record<string, OsmPatch>,
  destination: string,
) {
  const { origin } = new URL(destination, window.location.href);
  const newWindow = window.open(destination, '_blank');
  if (!newWindow) {
    throw new Error('not permission to access the new tab');
  }

  // wait for the new tab to load and confirm that it's ready
  await waitForPostMessage('ready', newWindow, origin);

  const files: File[] = [];

  for (const name in osmPatchFiles) {
    const blob = new Blob([JSON.stringify(osmPatchFiles[name], null, 2)], {
      type: 'application/json',
    });
    const file = new File([blob], safeFileName(name), {
      type: blob.type,
      lastModified: Date.now(),
    });
    files.push(file);
  }

  // create the promise before postMessage incase the response is
  // instantaneous
  const onReceived = waitForPostMessage('received', newWindow, origin);
  newWindow.postMessage({ files }, origin);
  await onReceived;
}
