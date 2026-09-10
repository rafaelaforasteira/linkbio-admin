export type Banner = { id:string; internal_name:string; image_url:string; image_path:string|null; destination_url:string|null; alt_text:string|null; sort_order:number; enabled:boolean; publish_at:string|null; unpublish_at:string|null; open_new_tab:boolean; created_at:string; updated_at:string; deleted_at:string|null };
export type BannerStatus = "published" | "scheduled" | "ended" | "hidden";
