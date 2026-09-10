"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, LoaderCircle, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import type { Banner } from "@/types/banner";
import { bannerSchema, type BannerInput } from "@/lib/validation";
import { saveBanner } from "@/app/admin/actions";
import { BrandMark } from "@/components/brand-mark";
import { useRouter } from "next/navigation";

function localDate(iso: string | null) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function BannerForm({
  banner,
  previewMode = false,
}: {
  banner?: Banner;
  previewMode?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState(banner?.image_url || "");
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BannerInput>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      internal_name: banner?.internal_name || "",
      destination_url: banner?.destination_url || "",
      alt_text: banner?.alt_text || "",
      enabled: banner?.enabled ?? true,
      open_new_tab: banner?.open_new_tab ?? false,
      publish_at: localDate(banner?.publish_at || null),
      unpublish_at: localDate(banner?.unpublish_at || null),
    },
  });
  const imageRegister = register("internal_name");

  function acceptFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 8 MB.");
      return;
    }
    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (fileRef.current) fileRef.current.files = transfer.files;
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  }

  async function submit() {
    if (!formRef.current) return;
    if (previewMode) {
      toast.success(
        banner ? "Alterações simuladas." : "Banner simulado criado.",
      );
      router.push("/admin/banners");
      return;
    }
    setBusy(true);
    try {
      await saveBanner(new FormData(formRef.current));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o banner.",
      );
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} className="banner-form" onSubmit={handleSubmit(submit)}>
      <input type="hidden" name="id" value={banner?.id || ""} />
      <input
        type="hidden"
        name="existing_image_url"
        value={banner?.image_url || ""}
      />
      <input
        type="hidden"
        name="existing_image_path"
        value={banner?.image_path || ""}
      />
      <div className="form-panel card">
        <section>
          <h2>Informações</h2>
          <div>
            <label className="label" htmlFor="internal_name">
              Nome interno *
            </label>
            <input className="field" id="internal_name" {...imageRegister} />
            <span className="helper">
              Esse nome aparece apenas no painel administrativo.
            </span>
            {errors.internal_name && (
              <span className="form-error">{errors.internal_name.message}</span>
            )}
          </div>
          <div>
            <label className="label">Imagem {banner ? "" : "*"}</label>
            <div
              className={`upload ${dragging ? "dragging" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                acceptFile(event.dataTransfer.files[0]);
              }}
            >
              <UploadCloud />
              <strong>Arraste uma imagem aqui</strong>
              <span>ou</span>
              <button
                type="button"
                className="button"
                onClick={() => fileRef.current?.click()}
              >
                Selecionar arquivo
              </button>
              <small>PNG, JPG, WEBP ou AVIF · máximo 8 MB</small>
              {fileName && <em>{fileName}</em>}
            </div>
            <input
              ref={fileRef}
              className="sr-only"
              id="image"
              name="image"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              required={!banner}
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />
          </div>
          <div>
            <label className="label" htmlFor="destination_url">
              Link de destino (opcional)
            </label>
            <input
              className="field"
              id="destination_url"
              placeholder="https://"
              {...register("destination_url")}
            />
            {errors.destination_url && (
              <span className="form-error">
                {errors.destination_url.message}
              </span>
            )}
          </div>
          <label className="check">
            <input type="checkbox" {...register("open_new_tab")} />
            Abrir link em nova aba
          </label>
          <div>
            <label className="label" htmlFor="alt_text">
              Texto alternativo
            </label>
            <input className="field" id="alt_text" {...register("alt_text")} />
            <span className="helper">
              Descreva brevemente o conteúdo da imagem para acessibilidade.
            </span>
          </div>
        </section>
        <fieldset>
          <legend>Publicação</legend>
          <label className="check">
            <input type="checkbox" {...register("enabled")} />
            Banner ativo
          </label>
          <p className="helper">
            Se a entrada estiver no futuro, o banner continuará programado mesmo
            estando ativo.
          </p>
          <div className="date-grid">
            <div>
              <label className="label" htmlFor="publish_at">
                Programar entrada
              </label>
              <input
                className="field"
                id="publish_at"
                type="datetime-local"
                {...register("publish_at")}
              />
            </div>
            <div>
              <label className="label" htmlFor="unpublish_at">
                Programar saída
              </label>
              <input
                className="field"
                id="unpublish_at"
                type="datetime-local"
                {...register("unpublish_at")}
              />
              {errors.unpublish_at && (
                <span className="form-error">
                  {errors.unpublish_at.message}
                </span>
              )}
            </div>
          </div>
          <p className="helper">
            Horário de Brasília. Deixe vazio para publicar imediatamente ou não
            definir encerramento.
          </p>
        </fieldset>
        <div className="form-buttons">
          <Link className="button" href="/admin/banners">
            Cancelar
          </Link>
          <button className="button button-primary" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />
                Enviando e salvando...
              </>
            ) : banner ? (
              "Salvar alterações"
            ) : (
              "Salvar banner"
            )}
          </button>
        </div>
      </div>
      <aside className="preview-panel">
        <span>Prévia</span>
        <div className="phone">
          <div className="phone-speaker" />
          <div className="phone-brand">
            <BrandMark compact />
          </div>
          <div className="phone-head serif">
            Referência em
            <br />
            Semijoias
          </div>
          {preview ? (
            <div className="preview-image">
              <img src={preview} alt="Prévia do banner" />
              <button
                type="button"
                onClick={() => {
                  setPreview(banner?.image_url || "");
                  setFileName("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
                aria-label="Remover nova imagem"
              >
                <X />
              </button>
            </div>
          ) : (
            <div className="preview-empty">
              <ImagePlus />
              Sua arte aparecerá aqui inteira, sem cortes.
            </div>
          )}
        </div>
      </aside>
    </form>
  );
}
