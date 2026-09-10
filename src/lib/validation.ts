import { z } from "zod";

const optionalHttpUrl = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Use uma URL com http:// ou https://.");

export const bannerSchema = z
  .object({
    internal_name: z.string().trim().min(2, "Informe o nome interno."),
    destination_url: optionalHttpUrl,
    alt_text: z.string().trim().max(180, "Use até 180 caracteres."),
    enabled: z.boolean(),
    open_new_tab: z.boolean(),
    publish_at: z.string(),
    unpublish_at: z.string(),
  })
  .refine(
    (value) =>
      !value.publish_at ||
      !value.unpublish_at ||
      new Date(value.unpublish_at) > new Date(value.publish_at),
    {
      message:
        "A data de encerramento precisa ser posterior à data de publicação.",
      path: ["unpublish_at"],
    },
  );

export type BannerInput = z.infer<typeof bannerSchema>;
