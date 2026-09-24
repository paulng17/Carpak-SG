/**
 * Vercel Serverless Function: /api/carparks
 * Proxies LTA DataMall CarParkAvailabilityv2 with paging and normalization.
 */

export async function carparksHandler(req, res) {
  // 1. Validate credential before making any upstream call
  const key = process.env.LTA_ACCOUNT_KEY ? process.env.LTA_ACCOUNT_KEY.trim() : '';
  if (!key) {
    return res.status(503).json({
      error: 'LTA_ACCOUNT_KEY is not set. Add it in Vercel and redeploy.',
    });
  }

  // 2. Upstream paging through LTA DataMall
  const maxPages = 10;
  const pageSize = 500;
  const allRecords = [];
  let isPartial = false;

  for (let page = 0; page < maxPages; page++) {
    const skip = page * pageSize;
    const url =
      skip === 0
        ? 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2'
        : `https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2?$skip=${skip}`;

    let upstreamRes;
    try {
      upstreamRes = await fetch(url, {
        method: 'GET',
        headers: {
          AccountKey: key,
          accept: 'application/json',
        },
      });
    } catch (err) {
      if (page === 0) {
        return res.status(502).json({
          error: 'Failed to connect to LTA DataMall',
          status: 502,
          message: err instanceof Error ? err.message : 'Network error',
        });
      } else {
        isPartial = true;
        break;
      }
    }

    // Check response.ok before reading body (LTA sends empty body on 401)
    if (!upstreamRes.ok) {
      if (page === 0) {
        return res.status(upstreamRes.status).json({
          error: 'Upstream LTA error',
          status: upstreamRes.status,
          message: upstreamRes.statusText || 'Non-2xx reply from LTA DataMall',
        });
      } else {
        isPartial = true;
        break;
      }
    }

    let data;
    try {
      data = await upstreamRes.json();
    } catch {
      if (page === 0) {
        return res.status(502).json({
          error: 'Invalid JSON payload from LTA DataMall',
          status: 502,
          message: 'Failed to parse JSON body from upstream',
        });
      } else {
        isPartial = true;
        break;
      }
    }

    const items = Array.isArray(data?.value) ? data.value : [];
    allRecords.push(...items);

    // Stop paging if this page returned fewer than 500 records
    if (items.length < pageSize) {
      break;
    }
  }

  // 3. Filter by CarParkID query param if supplied
  const query = req.query || {};
  const carParkIdParam = query.CarParkID || query.carparkid || query.carParkId;
  let targetIdSet = null;
  if (carParkIdParam && typeof carParkIdParam === 'string' && carParkIdParam.trim()) {
    targetIdSet = new Set(
      carParkIdParam
        .split(',')
        .map((id) => id.trim().toLowerCase())
        .filter(Boolean)
    );
  }

  // 4. Transform and clean records
  const simplifiedList = [];

  for (const item of allRecords) {
    // Skip if missing CarParkID (not an error)
    if (!item || !item.CarParkID) {
      continue;
    }

    const idStr = String(item.CarParkID).trim();
    if (targetIdSet && !targetIdSet.has(idStr.toLowerCase())) {
      continue;
    }

    // Guard AvailableLots: omit if missing, non-numeric or negative
    if (item.AvailableLots === undefined || item.AvailableLots === null || item.AvailableLots === '') {
      continue;
    }
    const lotsNum = Number(item.AvailableLots);
    if (!Number.isFinite(lotsNum) || lotsNum < 0) {
      continue;
    }
    const availableLots = Math.round(lotsNum);

    // Parse lat and lng from Location string ("lat lng" separated by space)
    let lat = undefined;
    let lng = undefined;
    if (typeof item.Location === 'string' && item.Location.trim()) {
      const parts = item.Location.trim().split(/\s+/);
      if (parts.length >= 2) {
        const parsedLat = Number(parts[0]);
        const parsedLng = Number(parts[1]);
        if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
          lat = parsedLat;
          lng = parsedLng;
        }
      }
    }

    const record = {
      CarParkID: idStr,
      Development: String(item.Development || ''),
      Area: String(item.Area || ''),
      Agency: String(item.Agency || ''),
      LotType: String(item.LotType || ''),
      AvailableLots: availableLots,
    };

    if (lat !== undefined && lng !== undefined) {
      record.lat = lat;
      record.lng = lng;
    }

    simplifiedList.push(record);
  }

  // Set caching header: LTA refreshes every minute
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  if (isPartial) {
    return res.status(200).json({
      value: simplifiedList,
      partial: true,
    });
  }

  return res.status(200).json({
    value: simplifiedList,
  });
}

export default carparksHandler;
