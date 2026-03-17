// pages/api/versi-config.js
import { VERSI_CONFIG } from '../../lib/license';

export default function handler(req, res) {
  return res.json(VERSI_CONFIG);
}
