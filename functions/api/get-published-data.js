const onRequestGet = async (context) => {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=60"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    if (!env.R2_BUCKET) {
      throw new Error("R2_BUCKET binding not configured. Please add R2 bucket binding in Cloudflare Dashboard.");
    }
    const fileName = "site-data.json";
    const object = await env.R2_BUCKET.get(fileName);
    if (!object) {
      return new Response(JSON.stringify({ error: "No published data found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const data = await object.text();
    return new Response(data, {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Get published data error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to get published data" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};
export {
  onRequestGet
};
