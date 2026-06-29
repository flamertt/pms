import { useMemo, useState } from "react";
import { PageHeader, Badge, ProgressBar } from "../../components/ui";
import { IconFolder, IconChevronRight, IconTasks } from "../../icons";
import { api } from "../../lib/api";
import { useData } from "../../lib/useData";
import type { Project, TaskStatus, Task } from "../../lib/types";

// Düğüm modeli — ağaç (binary/dallanan) yapısı.
interface TNode {
  id: string;
  label: string;
  sub?: string;
  color: string;
  children: TNode[];
}

// Yerleşim için hesaplanmış düğüm.
interface Placed extends TNode {
  x: number;
  y: number;
  depth: number;
  childrenPlaced: Placed[];
}

const LEVEL_H = 110;
const NODE_W = 150;
const GAP_X = 24;

// Proje ağacını veriden kur: Proje → Panolar → Görevler.
function buildTree(projectId: number, projects: Project[], statuses: TaskStatus[], allTasks: Task[]): TNode {
  const project = projects.find((p) => p.id === projectId);
  return {
    id: `p${projectId}`,
    label: project?.name ?? "Proje",
    sub: "Proje",
    color: project?.color ?? "var(--accent)",
    children: statuses.map((b) => {
      const tasks = allTasks.filter((t) => t.board_id === b.id && t.project_id === projectId);
      return {
        id: `b${b.id}`,
        label: b.name,
        sub: `${tasks.length} görev`,
        color: b.color,
        children: tasks.slice(0, 3).map((t) => ({
          id: `t${t.id}`,
          label: t.title,
          sub: `${t.credit} kredi`,
          color: "var(--faint)",
          children: [],
        })),
      };
    }),
  };
}

// Tidy-tree yerleşimi: yaprakları sırayla diz, iç düğümleri çocuklarının ortasına koy.
function layout(root: TNode): { placed: Placed; width: number; height: number } {
  let leafX = 0;
  let maxDepth = 0;

  function place(node: TNode, depth: number): Placed {
    maxDepth = Math.max(maxDepth, depth);
    const childrenPlaced = node.children.map((c) => place(c, depth + 1));
    let x: number;
    if (childrenPlaced.length === 0) {
      x = leafX * (NODE_W + GAP_X);
      leafX += 1;
    } else {
      x = (childrenPlaced[0].x + childrenPlaced[childrenPlaced.length - 1].x) / 2;
    }
    return { ...node, x, y: depth * LEVEL_H, depth, childrenPlaced };
  }

  const placed = place(root, 0);
  const width = Math.max(leafX, 1) * (NODE_W + GAP_X);
  const height = (maxDepth + 1) * LEVEL_H;
  return { placed, width, height };
}

function flatten(n: Placed): Placed[] {
  return [n, ...n.childrenPlaced.flatMap(flatten)];
}

export function ProjectTree() {
  const [openId, setOpenId] = useState<number | null>(null);
  const { data, loading } = useData(
    () => Promise.all([api.listProjects(), api.listStatuses(), api.listTasks(), api.listUsers()]),
    []
  );
  const projects = data?.[0] ?? [];
  const statuses = data?.[1] ?? [];
  const tasks = data?.[2] ?? [];
  const users = data?.[3] ?? [];

  return (
    <>
      <PageHeader title="Proje Ağacı" subtitle="Projeye tıkla, ağaç açılsın" />
      {loading ? (
        <div style={{ color: "var(--muted)" }}>Yükleniyor…</div>
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 18 }}>
        {projects.map((p) => {
          const taskCount = tasks.filter((t) => t.project_id === p.id).length;
          const members = users.filter((u) => p.member_ids.includes(u.id));
          const open = openId === p.id;
          return (
            <div
              key={p.id}
              className="card card-hover"
              onClick={() => setOpenId(open ? null : p.id)}
              style={{ padding: 20, cursor: "pointer", borderColor: open ? "var(--accent)" : undefined, display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <div style={{ width: 44, height: 44, flex: "none", borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconFolder size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
                    <IconTasks size={13} /> {taskCount} görev · {members.length} üye
                  </div>
                </div>
                <span style={{ color: "var(--faint)", transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}>
                  <IconChevronRight size={20} />
                </span>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: "var(--muted)" }}>İlerleme</span>
                  <span style={{ fontWeight: 700 }}>{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress!} />
              </div>

              <Badge tone={open ? "accent" : "neutral"}>{open ? "Ağaç açık" : "Ağacı gör"}</Badge>
            </div>
          );
        })}
      </div>
      )}

      {openId != null && <TreeCanvas projectId={openId} projects={projects} statuses={statuses} tasks={tasks} />}
    </>
  );
}

function TreeCanvas({ projectId, projects, statuses, tasks }: { projectId: number; projects: Project[]; statuses: TaskStatus[]; tasks: Task[] }) {
  const { width, height, nodes } = useMemo(() => {
    const l = layout(buildTree(projectId, projects, statuses, tasks));
    return { width: l.width, height: l.height, nodes: flatten(l.placed) };
  }, [projectId, projects, statuses, tasks]);
  const PAD = 30;
  const project = projects.find((p) => p.id === projectId);

  return (
    <div className="card fade-in" style={{ padding: 20, overflow: "auto", marginTop: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginBottom: 12 }}>
        {project?.name} — ağaç görünümü
      </div>
      <svg width={width + PAD * 2} height={height + PAD} style={{ display: "block", minWidth: "100%" }}>
          {/* Bağlantı çizgileri (parent → child) */}
          {nodes.flatMap((n) =>
            n.childrenPlaced.map((c) => {
              const x1 = n.x + PAD + NODE_W / 2;
              const y1 = n.y + PAD + 56;
              const x2 = c.x + PAD + NODE_W / 2;
              const y2 = c.y + PAD;
              const my = (y1 + y2) / 2;
              return (
                <path
                  key={n.id + c.id}
                  d={`M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth={2}
                />
              );
            })
          )}

          {/* Düğümler */}
          {nodes.map((n) => (
            <g key={n.id} transform={`translate(${n.x + PAD}, ${n.y + PAD})`}>
              <rect
                width={NODE_W}
                height={56}
                rx={12}
                fill="var(--surface2)"
                stroke="var(--border)"
                strokeWidth={1.5}
              />
              <rect width={5} height={56} rx={2.5} fill={n.color} />
              <text x={16} y={24} fontSize={13} fontWeight={700} fill="var(--text)">
                {n.label.length > 17 ? n.label.slice(0, 16) + "…" : n.label}
              </text>
              {n.sub && (
                <text x={16} y={42} fontSize={11} fill="var(--faint)">
                  {n.sub}
                </text>
              )}
            </g>
          ))}
      </svg>
    </div>
  );
}
