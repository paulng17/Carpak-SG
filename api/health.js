/**
 * Vercel Serverless Function: /api/health
 * Reports key configuration status and LTA connectivity without exposing the key.
 */

export async function healthHandler(req, res) {
  const key = process.env.LTA_ACCOUNT_KEY ? process.env.LTA_ACCOUNT_KEY.trim() : '';

  if (!key) {
    return res.status(503).json({
      keyConfigured: false,
      ltaAnswered: false,
      error: 'LTA_ACCOUNT_KEY is not set. Add it in Vercel and redeploy.',
    });
  }

  try {
    const upstreamRes = await fetch(
      'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
      {
        method: 'GET',
        headers: {
          AccountKey: key,
          accept: 'application/json',
        },
      }
    );

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        keyConfigured: true,
        ltaAnswered: false,
        upstreamStatus: upstreamRes.status,
        recordCount: 0,
        message: upstreamRes.statusText || 'Upstream error from LTA DataMall',
      });
    }

    const data = await upstreamRes.json();
    const count = Array.isArray(data?.value) ? data.value.length : 0;

    return res.status(200).json({
      keyConfigured: true,
      ltaAnswered: true,
      upstreamStatus: upstreamRes.status,
      recordCount: count,
    });
  } catch (err) {
    return res.status(502).json({
      keyConfigured: true,
      ltaAnswered: false,
      upstreamStatus: null,
      recordCount: 0,
      message: err instanceof Error ? err.message : 'Failed to connect to LTA DataMall',
    });
  }
}

export default healthHandler;
