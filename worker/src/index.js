export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ── POST /api/submit ──
    if (path === '/api/submit' && request.method === 'POST') {
      try {
        const body = await request.json();
        const id = body.id || String(Date.now());

        const client = {
          id,
          name: body.name || '',
          wechat: body.wechat || '',
          phone: body.phone || '',
          education: body.education || '',
          targetDegree: body.targetDegree || '',
          koreanLevel: body.koreanLevel || '',
          englishLevel: body.englishLevel || '',
          targetSchools: body.targetSchools || [],
          enrollmentTime: body.enrollmentTime || '',
          concerns: body.concerns || [],
          submitTime: body.submitTime || new Date().toISOString().slice(0, 16).replace('T', ' '),
          status: 'new',
          notes: [],
        };

        await env.LIUXUE_DATA.put(`client:${id}`, JSON.stringify(client));

        const raw = await env.LIUXUE_DATA.get('clients:index');
        const index = raw ? JSON.parse(raw) : [];
        if (!index.includes(id)) {
          index.push(id);
          await env.LIUXUE_DATA.put('clients:index', JSON.stringify(index));
        }

        return new Response(JSON.stringify({ success: true, client }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // ── GET /api/clients ──
    if (path === '/api/clients' && request.method === 'GET') {
      try {
        const raw = await env.LIUXUE_DATA.get('clients:index');
        const index = raw ? JSON.parse(raw) : [];

        const clients = [];
        for (const id of index) {
          const data = await env.LIUXUE_DATA.get(`client:${id}`);
          if (data) clients.push(JSON.parse(data));
        }

        clients.sort((a, b) => (b.submitTime || '').localeCompare(a.submitTime || ''));

        return new Response(JSON.stringify(clients), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // ── PUT /api/clients/:id ──
    const putMatch = path.match(/^\/api\/clients\/(.+)$/);
    if (putMatch && request.method === 'PUT') {
      try {
        const id = putMatch[1];
        const raw = await env.LIUXUE_DATA.get(`client:${id}`);
        if (!raw) {
          return new Response(JSON.stringify({ error: '客户不存在' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const updates = await request.json();
        const client = { ...JSON.parse(raw), ...updates };
        await env.LIUXUE_DATA.put(`client:${id}`, JSON.stringify(client));

        return new Response(JSON.stringify({ success: true, client }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // ── DELETE /api/clients/:id ──
    if (putMatch && request.method === 'DELETE') {
      try {
        const id = putMatch[1];
        const raw = await env.LIUXUE_DATA.get(`client:${id}`);
        if (!raw) {
          return new Response(JSON.stringify({ error: '客户不存在' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        await env.LIUXUE_DATA.delete(`client:${id}`);
        const indexRaw = await env.LIUXUE_DATA.get('clients:index');
        const index = indexRaw ? JSON.parse(indexRaw) : [];
        await env.LIUXUE_DATA.put('clients:index', JSON.stringify(index.filter(clientId => clientId !== id)));

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },
};
