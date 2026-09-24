import net from 'net';

/**
 * Validates if an IP address is a private, loopback, or cloud-metadata address
 */
export const isPrivateOrInternalIP = (ip) => {
  if (!ip) return false;

  // IPv4 Loopback
  if (ip.startsWith('127.')) return true;

  // IPv6 Loopback & unspecified
  if (ip === '::1' || ip === '::' || ip === '0.0.0.0') return true;

  // Private IPv4 ranges
  // 10.0.0.0 - 10.255.255.255
  if (ip.startsWith('10.')) return true;

  // 172.16.0.0 - 172.31.255.255
  const parts = ip.split('.').map(Number);
  if (parts.length === 4) {
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0 - 192.168.255.255
    if (parts[0] === 192 && parts[1] === 168) return true;
    // Carrier-grade NAT (100.64.0.0/10)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    // Link-local & Cloud Metadata (169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true;
  }

  // IPv6 link-local & unique local
  if (ip.toLowerCase().startsWith('fe80:') || ip.toLowerCase().startsWith('fc00:') || ip.toLowerCase().startsWith('fd00:')) {
    return true;
  }

  return false;
};

/**
 * Validates URLs against SSRF vulnerabilities
 * @param {string} urlString
 * @param {boolean} allowLocalPreview - whether to permit the local preview server port
 */
export const validateSafeUrl = (urlString, allowLocalPreview = false) => {
  if (!urlString || typeof urlString !== 'string') {
    return { isValid: false, reason: 'URL string is required' };
  }

  try {
    const parsed = new URL(urlString);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check if it's our designated local preview server
    if (allowLocalPreview) {
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
        // Allow local preview port 5000 or 5173
        if (port === '5000' || port === '5173' || port === '3000') {
          return { isValid: true, url: parsed.toString() };
        }
      }
    }

    // Prohibit localhost and known internal hostnames
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return { isValid: false, reason: 'Access to localhost and internal hostnames is prohibited' };
    }

    // If hostname is directly an IP address, verify it
    if (net.isIP(hostname)) {
      if (isPrivateOrInternalIP(hostname)) {
        return { isValid: false, reason: 'Access to private or link-local IP addresses is prohibited' };
      }
    }

    return { isValid: true, url: parsed.toString() };
  } catch (err) {
    return { isValid: false, reason: `Malformed URL: ${err.message}` };
  }
};
