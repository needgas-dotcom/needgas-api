export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/orders' && request.method === 'POST') {
      try {
        const body = await request.json();

        await env.DB.prepare(`
          INSERT INTO orders (
            order_ref, customer_name, customer_phone, customer_email,
            delivery_address, suburb, postal_code, gps_location,
            items, order_type, cylinder_brand, safety_status,
            ask_for, drop_location, gate_code, driver_notes,
            equipment_check, equipment_items, equipment_notes,
            photo_attached, gps_captured,
            subtotal, delivery_fee, collection_fee, total_amount,
            payment_method, status
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).bind(
          body.orderRef || null,
          body.customerName || null,
          body.customerPhone || null,
          body.customerEmail || null,
          body.deliveryAddress || null,
          body.suburb || null,
          body.postalCode || null,
          body.gpsCaptured ? 'Yes' : 'No',
          JSON.stringify(body.items || []),
          body.orderType || null,
          body.cylinderBrand || null,
          body.safetyStatus || null,
          body.askFor || null,
          body.dropLocation || null,
          body.gateCode ? 'Provided' : null,
          body.driverNotes || null,
          body.equipmentCheck || null,
          body.equipmentItems || null,
          body.equipmentNotes || null,
          body.photoAttached ? 'Yes' : 'No',
          body.gpsCaptured ? 'Yes' : 'No',
          body.subtotal || 0,
          body.deliveryFee || 0,
          body.collectionFee || 0,
          body.totalAmount || 0,
          body.paymentMethod || null,
          'ORDER RECEIVED'
        ).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.pathname === '/orders' && request.method === 'GET') {
      const phone = url.searchParams.get('phone');
      if (!phone) {
        return new Response(JSON.stringify({ success: false, error: 'Phone number required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const { results } = await env.DB.prepare(
          'SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC'
        ).bind(phone).all();

        return new Response(JSON.stringify({ success: true, orders: results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('NeedGas API - not found', { status: 404, headers: corsHeaders });
  }
};
