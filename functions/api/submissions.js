// Cloudflare Pages Function: /api/submissions

export async function onRequestGet(context) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const kv = context.env.SUBMISSIONS_KV;
    if (kv) {
      const data = await kv.get('submissions', { type: 'json' });
      return new Response(JSON.stringify(data || {}), { headers: corsHeaders });
    }
  } catch (err) {
    console.error('Error fetching submissions from KV:', err);
  }

  return new Response(JSON.stringify({}), { headers: corsHeaders });
}

export async function onRequestPost(context) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const body = await context.request.json();
    const kv = context.env.SUBMISSIONS_KV;

    if (kv && body.rollNumber) {
      let subs = (await kv.get('submissions', { type: 'json' })) || {};
      const roll = body.rollNumber;

      if (!subs[roll]) {
        subs[roll] = {
          rollNumber: roll,
          latest: body,
          history: [body]
        };
      } else {
        subs[roll].latest = body;
        subs[roll].history = subs[roll].history || [];
        subs[roll].history.push(body);
      }

      await kv.put('submissions', JSON.stringify(subs));
      return new Response(JSON.stringify({ success: true, count: Object.keys(subs).length }), { headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: false, reason: 'KV not bound or missing rollNumber' }), { headers: corsHeaders });
}

export async function onRequestDelete(context) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const kv = context.env.SUBMISSIONS_KV;
    if (kv) {
      await kv.put('submissions', JSON.stringify({}));
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: false }), { headers: corsHeaders });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
