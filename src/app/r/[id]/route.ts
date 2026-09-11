import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function safeHeader(value: string | null) {
  return value ? value.slice(0, 500) : null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const now = new Date().toISOString();
  let destination: URL;
  let supabase: ReturnType<typeof createAdminClient>;

  try {
    supabase = createAdminClient();
    const { data } = await supabase
      .from("banners")
      .select("id,destination_url")
      .eq("id", id)
      .eq("enabled", true)
      .is("deleted_at", null)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .or(`unpublish_at.is.null,unpublish_at.gt.${now}`)
      .maybeSingle();

    if (!data?.destination_url)
      return new Response("Banner não encontrado.", { status: 404 });
    destination = new URL(data.destination_url);
    if (!["http:", "https:"].includes(destination.protocol))
      return new Response("Destino inválido.", { status: 404 });
  } catch (error) {
    console.error("Falha ao localizar banner para redirecionamento.", error);
    return new Response("Banner não encontrado.", { status: 404 });
  }

  try {
    const { error } = await supabase.from("banner_clicks").insert({
      banner_id: id,
      referrer: safeHeader(request.headers.get("referer")),
      user_agent: safeHeader(request.headers.get("user-agent")),
    });
    if (error) console.error("Falha ao registrar clique de banner.", error);
  } catch (error) {
    console.error("Falha ao registrar clique de banner.", error);
  }

  return Response.redirect(destination, 307);
}
