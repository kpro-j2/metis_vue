const STORAGE_KEY = 'metis.api.parts';
const SCALER_IPS_KEY = 'metis.scaler.ips';

function readRegistry() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const data = JSON.parse(raw);
    if (data && typeof data === 'object') {
      return data;
    }
    return {};
  } catch (_e) {
    return {};
  }
}

function writeRegistry(registry) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
}

function normalizeUri(uri) {
  if (!uri) {
    return '';
  }
  return String(uri).trim().replace(/\/$/, '');
}

export function listPartApis() {
  return readRegistry();
}

export function getPartApi(partKey) {
  const registry = readRegistry();
  const uri = registry[partKey];
  return typeof uri === 'string' ? normalizeUri(uri) : '';
}

export function setPartApi(partKey, uri) {
  const key = String(partKey || '').trim();
  if (!key) {
    throw new Error('partKey is required');
  }
  const registry = readRegistry();
  registry[key] = normalizeUri(uri);
  writeRegistry(registry);
  return registry;
}

export function clearPartApi(partKey) {
  const registry = readRegistry();
  delete registry[partKey];
  writeRegistry(registry);
  return registry;
}

export function getScalerIps() {
  try {
    const raw = localStorage.getItem(SCALER_IPS_KEY);
    if (!raw) {
      return [];
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return [];
    }
    return data
      .map((v) => String(v || '').trim())
      .filter((v) => v.length > 0);
  } catch (_e) {
    return [];
  }
}

export function setScalerIps(ips) {
  const cleaned = Array.isArray(ips)
    ? ips.map((v) => String(v || '').trim()).filter((v) => v.length > 0)
    : [];
  localStorage.setItem(SCALER_IPS_KEY, JSON.stringify(cleaned));
  return cleaned;
}
