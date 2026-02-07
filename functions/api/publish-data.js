const onRequestPost = async (context) => {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    if (!env.R2_BUCKET) {
      throw new Error("R2_BUCKET binding not configured. Please add R2 bucket binding in Cloudflare Dashboard.");
    }
    const body = await request.json();
    const { data } = body;
    if (!data) {
      return new Response(JSON.stringify({ error: "No data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const publishedData = {
      ...data,
      published_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const jsonContent = JSON.stringify(publishedData, null, 2);
    const fileName = "site-data.json";
    await env.R2_BUCKET.put(fileName, jsonContent, {
      httpMetadata: {
        contentType: "application/json"
      }
    });
    return new Response(
      JSON.stringify({
        success: true,
        message: "Data published successfully",
        published_at: publishedData.published_at,
        fileName
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Publish data error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Publish failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};
export {
  onRequestPost
};
