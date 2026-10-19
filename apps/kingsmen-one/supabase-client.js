/* Public browser configuration only. Never place a Supabase service-role key here. */
(() => {
  const url = "https://euhubhhnumtibbyufghm.supabase.co";
  const publishableKey = "sb_publishable_7snR7FHGsqbtdnevLT_qvA_GMvoIoMk";
  if (!window.supabase?.createClient) {
    window.kingsmenSupabase = null;
    return;
  }
  window.kingsmenSupabase = window.supabase.createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce"
    },
    global: { headers: { "X-Client-Info": "kingsmen-one-web" } }
  });
})();