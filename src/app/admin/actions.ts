"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bannerSchema } from "@/lib/validation";
import { fromZonedTime } from "date-fns-tz";

async function adminClient(){const client=await createClient();const{data}=await client.auth.getUser();if(!data.user)throw new Error("Sessão expirada.");return client}
const text=(data:FormData,key:string)=>String(data.get(key)||"").trim();
const iso=(value:string)=>value?fromZonedTime(value,"America/Sao_Paulo").toISOString():null;

export async function saveBanner(data:FormData){
  const id=text(data,"id");const existingImage=text(data,"existing_image_url");const parsed=bannerSchema.safeParse({internal_name:text(data,"internal_name"),destination_url:text(data,"destination_url"),alt_text:text(data,"alt_text"),enabled:data.get("enabled")==="on",open_new_tab:data.get("open_new_tab")==="on",publish_at:text(data,"publish_at"),unpublish_at:text(data,"unpublish_at")});
  if(!parsed.success)throw new Error(parsed.error.issues[0]?.message||"Revise os campos.");
  const supabase=await adminClient();let imageUrl=existingImage;let imagePath:string|null=text(data,"existing_image_path")||null;const file=data.get("image");
  if(file instanceof File&&file.size){if(file.size>8*1024*1024)throw new Error("A imagem deve ter no máximo 8 MB.");if(!["image/png","image/jpeg","image/webp","image/avif"].includes(file.type))throw new Error("Envie PNG, JPG, WEBP ou AVIF.");const ext=file.name.split(".").pop()?.toLowerCase()||"jpg";imagePath=`${crypto.randomUUID()}.${ext}`;const{error:uploadError}=await supabase.storage.from("banners").upload(imagePath,file,{contentType:file.type});if(uploadError)throw new Error("Não foi possível enviar a imagem.");imageUrl=supabase.storage.from("banners").getPublicUrl(imagePath).data.publicUrl}
  if(!imageUrl)throw new Error("Selecione uma imagem.");
  const payload={internal_name:parsed.data.internal_name,image_url:imageUrl,image_path:imagePath,destination_url:parsed.data.destination_url||null,alt_text:parsed.data.alt_text||null,enabled:parsed.data.enabled,open_new_tab:parsed.data.open_new_tab,publish_at:iso(parsed.data.publish_at),unpublish_at:iso(parsed.data.unpublish_at)};
  if(id){const{error}=await supabase.from("banners").update(payload).eq("id",id);if(error)throw new Error("Não foi possível salvar as alterações.")}else{const{data:max}=await supabase.from("banners").select("sort_order").is("deleted_at",null).order("sort_order",{ascending:false}).limit(1).maybeSingle();const{error}=await supabase.from("banners").insert({...payload,sort_order:(max?.sort_order??-1)+1});if(error)throw new Error("Não foi possível criar o banner.")}
  revalidatePath("/");revalidatePath("/admin");revalidatePath("/admin/banners");redirect("/admin/banners?saved=1")
}
export async function toggleBanner(id:string,enabled:boolean){const supabase=await adminClient();const{error}=await supabase.from("banners").update({enabled}).eq("id",id);if(error)throw new Error("Não foi possível alterar o banner.");revalidatePath("/");revalidatePath("/admin/banners")}
export async function duplicateBanner(id:string){const supabase=await adminClient();const{data,error}=await supabase.from("banners").select("*").eq("id",id).single();if(error||!data)throw new Error("Banner não encontrado.");const{data:max}=await supabase.from("banners").select("sort_order").is("deleted_at",null).order("sort_order",{ascending:false}).limit(1).maybeSingle();const{error:createError}=await supabase.from("banners").insert({...data,id:undefined,internal_name:`${data.internal_name} — cópia`,enabled:false,sort_order:(max?.sort_order??-1)+1,created_at:undefined,updated_at:undefined});if(createError)throw new Error("Não foi possível duplicar.");revalidatePath("/admin/banners")}
export async function deleteBanner(id:string){const supabase=await adminClient();const{error}=await supabase.from("banners").update({deleted_at:new Date().toISOString(),enabled:false}).eq("id",id);if(error)throw new Error("Não foi possível excluir.");revalidatePath("/");revalidatePath("/admin/banners")}
export async function reorderBanners(ids:string[]){const supabase=await adminClient();const results=await Promise.all(ids.map((id,sort_order)=>supabase.from("banners").update({sort_order}).eq("id",id)));if(results.some(r=>r.error))throw new Error("Não foi possível salvar a nova ordem.");revalidatePath("/");revalidatePath("/admin/banners")}
export async function logout(){const supabase=await createClient();await supabase.auth.signOut();redirect("/login")}
