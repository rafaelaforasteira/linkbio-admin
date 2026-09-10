"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Banner, BannerStatus as Status } from "@/types/banner";
import { bannerStatus, formatDate } from "@/lib/banners";
import {
  deleteBanner,
  duplicateBanner,
  reorderBanners,
  toggleBanner,
} from "@/app/admin/actions";

type Filter = "all" | Status;
type RowAction = "toggle" | "duplicate" | "delete";

const labels: Record<Status, string> = {
  published: "No ar",
  scheduled: "Programado",
  ended: "Encerrado",
  hidden: "Inativo",
};

function Dialog({
  type,
  banner,
  onClose,
  onConfirm,
  pending,
}: {
  type: "delete" | "preview";
  banner: Banner;
  onClose: () => void;
  onConfirm?: () => void;
  pending?: boolean;
}) {
  return (
    <dialog
      ref={(node) => {
        if (node && !node.open) node.showModal();
      }}
      className={`confirm-dialog ${type === "preview" ? "image-dialog" : ""}`}
      onCancel={onClose}
    >
      <button className="dialog-close" onClick={onClose} aria-label="Fechar">
        <X />
      </button>
      {type === "preview" ? (
        <>
          <div className="image-dialog-head">
            <ImageIcon />
            <div>
              <h2>{banner.internal_name}</h2>
              <p>Visualização da arte do banner</p>
            </div>
          </div>
          <img
            src={banner.image_url}
            alt={banner.alt_text || banner.internal_name}
          />
        </>
      ) : (
        <>
          <div className="dialog-icon">
            <Trash2 />
          </div>
          <h2>Excluir banner?</h2>
          <p>
            Tem certeza que deseja excluir “{banner.internal_name}”? Ele deixará
            de aparecer no gerenciamento da Link Bio.
          </p>
          <div>
            <button className="button" onClick={onClose} disabled={pending}>
              Cancelar
            </button>
            <button
              className="button button-danger-solid"
              onClick={onConfirm}
              disabled={pending}
            >
              {pending ? "Excluindo..." : "Excluir banner"}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}

function operationalText(banner: Banner, status: Status) {
  if (status === "hidden") return "Ocultado manualmente";
  if (status === "scheduled")
    return `Entra em ${formatDate(banner.publish_at)}`;
  if (status === "ended")
    return `Encerrado em ${formatDate(banner.unpublish_at)}`;
  if (!banner.publish_at && !banner.unpublish_at) return "Sempre ativo";
  return `${formatDate(banner.publish_at) || "Disponível agora"} até ${formatDate(banner.unpublish_at) || "sem encerramento"}`;
}

function BannerRow({
  banner,
  index,
  dragEnabled,
  mockMode,
  onMockAction,
}: {
  banner: Banner;
  index: number;
  dragEnabled: boolean;
  mockMode: boolean;
  onMockAction: (action: RowAction, banner: Banner) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id, disabled: !dragEnabled });
  const [pending, startTransition] = useTransition();
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState<"delete" | "preview" | null>(null);
  const status = bannerStatus(banner);

  function run(action: RowAction, task: () => Promise<void>, message: string) {
    if (mockMode) {
      onMockAction(action, banner);
      setMenu(false);
      setDialog(null);
      toast.success(message);
      return;
    }
    startTransition(async () => {
      try {
        await task();
        toast.success(message);
        setMenu(false);
        setDialog(null);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Não foi possível concluir.",
        );
      }
    });
  }

  return (
    <>
      <article
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.55 : 1,
        }}
        className="banner-row card"
      >
        <button
          className="drag"
          {...attributes}
          {...listeners}
          disabled={!dragEnabled}
          title={
            dragEnabled
              ? "Arraste para alterar a ordem"
              : "Para reorganizar, selecione Todos"
          }
          aria-label={
            dragEnabled
              ? `Arraste ${banner.internal_name} para alterar a ordem`
              : "Reordenação disponível no filtro Todos"
          }
        >
          <GripVertical />
        </button>
        <span className="position">{String(index + 1).padStart(2, "0")}</span>
        <button
          className="thumbnail-button"
          onClick={() => setDialog("preview")}
          aria-label={`Visualizar arte de ${banner.internal_name}`}
        >
          <img src={banner.image_url} alt="" />
        </button>
        <div className="banner-info">
          <div className="banner-name">
            <strong>{banner.internal_name}</strong>
            <span className={`status ${status}`}>{labels[status]}</span>
          </div>
          <small className="schedule-text">
            {operationalText(banner, status)}
          </small>
          <small
            className="destination"
            title={banner.destination_url || "Banner sem link"}
          >
            <b>Destino</b>
            {banner.destination_url || "Sem link de destino"}
          </small>
          <small className="updated">
            Atualizado em {formatDate(banner.updated_at)}
          </small>
        </div>
        <div className="row-actions">
          <Link href={`/admin/banners/${banner.id}`}>
            <Pencil />
            Editar
          </Link>
          <button
            className="toggle-action"
            onClick={() =>
              run(
                "toggle",
                () => toggleBanner(banner.id, !banner.enabled),
                banner.enabled ? "Banner desativado." : "Banner ativado.",
              )
            }
            disabled={pending}
          >
            {banner.enabled ? <EyeOff /> : <Eye />}
            {banner.enabled ? "Desativar" : "Ativar"}
          </button>
          <div className="action-menu">
            <button
              onClick={() => setMenu(!menu)}
              aria-label="Mais ações"
              aria-expanded={menu}
            >
              <MoreHorizontal />
            </button>
            {menu && (
              <div className="menu-popover">
                <button
                  onClick={() => {
                    setMenu(false);
                    setDialog("preview");
                  }}
                >
                  <ImageIcon />
                  Visualizar
                </button>
                <button
                  onClick={() =>
                    run(
                      "duplicate",
                      () => duplicateBanner(banner.id),
                      "Banner duplicado.",
                    )
                  }
                  disabled={pending}
                >
                  <Copy />
                  Duplicar
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    setMenu(false);
                    setDialog("delete");
                  }}
                >
                  <Trash2 />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </article>
      {dialog && (
        <Dialog
          type={dialog}
          banner={banner}
          pending={pending}
          onClose={() => setDialog(null)}
          onConfirm={() =>
            run("delete", () => deleteBanner(banner.id), "Banner excluído.")
          }
        />
      )}
    </>
  );
}

export function BannerList({
  initial,
  mockMode = false,
}: {
  initial: Banner[];
  mockMode?: boolean;
}) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const counts = useMemo(
    () => ({
      all: items.length,
      published: items.filter((item) => bannerStatus(item) === "published")
        .length,
      scheduled: items.filter((item) => bannerStatus(item) === "scheduled")
        .length,
      hidden: items.filter((item) => bannerStatus(item) === "hidden").length,
      ended: items.filter((item) => bannerStatus(item) === "ended").length,
    }),
    [items],
  );
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (filter === "all" || bannerStatus(item) === filter) &&
          item.internal_name
            .toLowerCase()
            .includes(search.toLowerCase().trim()),
      ),
    [items, filter, search],
  );
  const dragEnabled = filter === "all" && !search;

  function mockAction(action: RowAction, banner: Banner) {
    setItems((current) => {
      if (action === "delete")
        return current.filter((item) => item.id !== banner.id);
      if (action === "toggle")
        return current.map((item) =>
          item.id === banner.id
            ? {
                ...item,
                enabled: !item.enabled,
                updated_at: new Date().toISOString(),
              }
            : item,
        );
      const copy = {
        ...banner,
        id: `${banner.id}-copy-${Date.now()}`,
        internal_name: `${banner.internal_name} — cópia`,
        enabled: false,
        sort_order: current.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return [...current, copy];
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (!dragEnabled || !event.over || event.active.id === event.over.id)
      return;
    const before = items;
    const next = arrayMove(
      items,
      items.findIndex((item) => item.id === event.active.id),
      items.findIndex((item) => item.id === event.over?.id),
    ).map((item, index) => ({ ...item, sort_order: index }));
    setItems(next);
    if (mockMode) {
      toast.success("Ordem atualizada no preview.");
      return;
    }
    try {
      await reorderBanners(next.map((item) => item.id));
      toast.success("Ordem atualizada.");
    } catch (error) {
      setItems(before);
      toast.error(
        error instanceof Error ? error.message : "Erro ao reordenar.",
      );
    }
  }

  const emptyText = search
    ? `Nenhum banner encontrado para “${search}”.`
    : filter === "all"
      ? "Ainda não existem banners."
      : "Nenhum banner encontrado neste filtro.";
  return (
    <>
      <div className="banner-summary">
        <span>
          <b>{counts.published}</b> no ar agora
        </span>
        <span>
          <b>{counts.scheduled}</b> programado
          {counts.scheduled === 1 ? "" : "s"}
        </span>
        <span>
          <b>{counts.hidden}</b> inativo{counts.hidden === 1 ? "" : "s"}
        </span>
      </div>
      <div className="banner-toolbar">
        <div className="filters">
          {(["all", "published", "scheduled", "hidden", "ended"] as const).map(
            (value) => (
              <button
                key={value}
                className={filter === value ? "active" : ""}
                onClick={() => setFilter(value)}
              >
                {value === "all" ? "Todos" : labels[value]}{" "}
                <b>{counts[value]}</b>
              </button>
            ),
          )}
        </div>
        <label className="search">
          <Search />
          <span className="sr-only">Buscar banner</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar banner..."
          />
        </label>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visible} strategy={verticalListSortingStrategy}>
          <div className="banner-list">
            {visible.map((banner) => (
              <BannerRow
                key={banner.id}
                banner={banner}
                index={items.indexOf(banner)}
                dragEnabled={dragEnabled}
                mockMode={mockMode}
                onMockAction={mockAction}
              />
            ))}
            {!visible.length && (
              <div className="filtered-empty">{emptyText}</div>
            )}
          </div>
        </SortableContext>
      </DndContext>
      {!dragEnabled && (
        <p className="filter-note">
          Para reorganizar os banners, selecione “Todos” e limpe a busca.
        </p>
      )}
    </>
  );
}
