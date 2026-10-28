import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data');
const FILE = path.join(DIR, 'vapid.json');

function read() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return null; }
}

export function getVapidKeys() {
  let k = read();
  if (k && k.publicKey && k.privateKey) return k;
  return null;
}

export async function ensureVapidKeys() {
  let k = getVapidKeys();
  if (k) return k;
  const { default: webpush } = await import('web-push');
  k = webpush.generateVAPIDKeys();
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify({ ...k, subject: process.env.VAPID_SUBJECT || 'mailto:admin@smarthome.local' }));
  } catch {}
  return k;
}

export function getPublicKey() {
  const k = read();
  return (k && k.publicKey) || process.env.VAPID_PUBLIC_KEY || null;
}
