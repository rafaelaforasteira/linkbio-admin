import type{Banner,BannerStatus}from"@/types/banner";
export function bannerStatus(b:Banner,now=new Date()):BannerStatus{if(!b.enabled)return"hidden";if(b.unpublish_at&&new Date(b.unpublish_at)<=now)return"ended";if(b.publish_at&&new Date(b.publish_at)>now)return"scheduled";return"published"}
export function formatDate(value:string|null){if(!value)return null;return new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",dateStyle:"short",timeStyle:"short"}).format(new Date(value))}
