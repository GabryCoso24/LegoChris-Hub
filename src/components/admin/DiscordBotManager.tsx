import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Cog,
  FilePen,
  FolderPlus,
  FolderTree,
  Plus,
  Power,
  RefreshCcw,
  Save,
  Square,
  Trash2,
  Workflow,
  Settings,
} from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type BotStatus = {
  running: boolean;
  pid: number | null;
  startedAt: number | null;
  uptimeMs: number;
  cpuPercent?: number | null;
  memoryBytes?: number | null;
  nodeMemoryBytes?: number | null;
  systemTotalMemoryBytes?: number | null;
  systemFreeMemoryBytes?: number | null;
  loadAvg1?: number;
  loadAvg5?: number;
  loadAvg15?: number;
  rootPath: string;
  entryScript: string;
  runtimeCommand?: string;
  pythonCommand?: string;
  pm2ProcessName?: string;
  pm2Installed?: boolean;
  pm2Status?: string;
  pm2Error?: string | null;
  processDetected?: boolean;
};

type BotConfig = {
  rootPath: string;
  entryScript: string;
  runtimeCommand: string;
  pm2ProcessName: string;
};

type BotLog = {
  ts: string;
  level: string;
  message: string;
};

type FileEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
  size: number;
  mtime: string;
};

type BotModule = {
  name: string;
  enabled: boolean;
  status?: "active" | "disabled" | "error";
};

type BuilderNodeType =
  | "trigger_command"
  | "function_define"
  | "return_values"
  | "variable_set"
  | "json_save"
  | "json_load"
  | "send_message"
  | "send_embed"
  | "add_role"
  | "remove_role"
  | "condition_text_contains"
  | "condition_select"
  | "loop_count"
  | "function_call"
  | "call_existing_command"
  | "log_console";

type BuilderNode = {
  id: string;
  type: BuilderNodeType;
  label: string;
  payload: string;
  x: number;
  y: number;
  prefix?: "/" | "!";
  config?: Record<string, string>;
};

type BuilderEdge = {
  id: string;
  from: string;
  to: string;
};

type BuilderFlowMeta = {
  name: string;
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  compiledFile?: string;
  module?: string;
  updatedAt?: string;
};

type SectionKey = "overview" | "files" | "terminal" | "modules" | "builder";
type BuilderMode = "visual" | "source";

type EditorFont = "JetBrains Mono" | "Fira Code" | "Consolas";

type AnsiStyle = {
  color?: string;
  backgroundColor?: string;
  fontWeight?: "normal" | "bold";
};

type AnsiSegment = {
  text: string;
  style: AnsiStyle;
};

const DATA_ROOT_OPTION = "__data_root__";
const NO_FILE_OPTION = "__no_file__";
const IMAGE_FILE_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

type NodeTemplate = {
  type: BuilderNodeType;
  label: string;
  payloadPlaceholder: string;
  category: string;
  description: string;
};

const ANSI_COLORS: Record<number, string> = {
  30: "#0f172a",
  31: "#ef4444",
  32: "#22c55e",
  33: "#f59e0b",
  34: "#60a5fa",
  35: "#a855f7",
  36: "#06b6d4",
  37: "#e5e7eb",
  90: "#6b7280",
  91: "#f87171",
  92: "#4ade80",
  93: "#fde047",
  94: "#93c5fd",
  95: "#c084fc",
  96: "#67e8f9",
  97: "#f8fafc",
};

const JAVASCRIPT_KEYWORDS = new Set([
  "import",
  "from",
  "as",
  "export",
  "default",
  "const",
  "let",
  "var",
  "function",
  "class",
  "return",
  "if",
  "else",
  "for",
  "while",
  "break",
  "continue",
  "try",
  "except",
  "finally",
  "switch",
  "case",
  "break",
  "await",
  "async",
  "in",
  "and",
  "or",
  "not",
  "null",
  "true",
  "false",
  "this",
  "new",
  "throw",
  "catch",
  "yield",
]);

const NODE_TEMPLATES: NodeTemplate[] = [
  { type: "trigger_command", label: "Trigger Command", payloadPlaceholder: "welcome", category: "Event", description: "Definisce il comando iniziale del flow. Puoi scegliere se il comando e slash oppure prefix." },
  { type: "function_define", label: "Define Function", payloadPlaceholder: "my_flow_fn", category: "Flow", description: "Crea una funzione richiamabile da altri blocchi. I blocchi collegati dopo questo nodo diventano il corpo della funzione." },
  { type: "return_values", label: "Return Values", payloadPlaceholder: "result,status", category: "Flow", description: "Restituisce uno o piu valori da una funzione. I valori possono essere nomi di variabili o valori letterali separati da virgola." },
  { type: "variable_set", label: "Set Variable", payloadPlaceholder: "welcome_user", category: "Data", description: "Crea o aggiorna una variabile. Supporta stringhe, numeri, booleani, JSON, liste e valore nullo." },
  { type: "json_save", label: "Save JSON", payloadPlaceholder: "data/settings.json", category: "Data", description: "Salva una variabile oppure l'intero stato delle variabili in un file JSON." },
  { type: "json_load", label: "Load JSON", payloadPlaceholder: "data/settings.json", category: "Data", description: "Carica un file JSON e lo salva in una variabile che poi puoi riutilizzare negli altri blocchi." },
  { type: "condition_text_contains", label: "If Text Contains", payloadPlaceholder: "vip", category: "Logic", description: "Controlla se il contenuto del comando o del messaggio contiene un testo specifico." },
  { type: "condition_select", label: "Select Case", payloadPlaceholder: "vip|mod|admin", category: "Logic", description: "Crea un controllo rapido su piu casi testuali. Se nessun caso corrisponde il flow si interrompe." },
  { type: "loop_count", label: "Loop Count", payloadPlaceholder: "3", category: "Flow", description: "Ripete l'azione successiva per un numero definito di volte." },
  { type: "function_call", label: "Call Function", payloadPlaceholder: "moderation_flow", category: "Flow", description: "Richiama una funzione definita nel builder e puo salvare i valori di ritorno in una o piu variabili." },
  { type: "call_existing_command", label: "Call Existing Command", payloadPlaceholder: "help", category: "Flow", description: "Invoca un comando prefix gia esistente nel bot." },
  { type: "log_console", label: "Log Console", payloadPlaceholder: "Avvio avvenuto", category: "Action", description: "Scrive un messaggio nella console del bot." },
  { type: "send_message", label: "Send Message", payloadPlaceholder: "Benvenuto!", category: "Action", description: "Invia un messaggio semplice. Puoi usare variabili con il formato {{nome_variabile}}." },
  { type: "send_embed", label: "Send Embed", payloadPlaceholder: "Contenuto embed", category: "Action", description: "Invia un embed Discord completamente configurabile: titolo, descrizione, colore, autore, footer, immagini, thumbnail, campi e timestamp." },
  { type: "add_role", label: "Add Role", payloadPlaceholder: "member", category: "Action", description: "Aggiunge un ruolo a un membro del server. Puoi scegliere il ruolo e decidere se applicarlo all'utente che interagisce, al proprietario del server o a un ID salvato in una variabile." },
  { type: "remove_role", label: "Remove Role", payloadPlaceholder: "member", category: "Action", description: "Rimuove un ruolo da un membro del server usando gli stessi target configurabili del blocco Add Role." },
];

const SECTIONS: Array<{ key: SectionKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "files", label: "Files" },
  { key: "terminal", label: "Risorse" },
  { key: "modules", label: "Modules" },
  { key: "builder", label: "Editor" },
];

const MEMBER_TARGET_OPTIONS = [
  { value: "author", label: "Utente che interagisce" },
  { value: "guild_owner", label: "Proprietario del server" },
  { value: "user_id_variable", label: "ID utente da variabile" },
] as const;

function sanitizeBuilderName(value: string) {
  return String(value || "generated_command")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "") || "generated_command";
}

function getDefaultBuilderNodes(): BuilderNode[] {
  return [];
}

function getDefaultBuilderEdges(): BuilderEdge[] {
  return [];
}

function getDefaultBuilderTargetPath(name: string) {
  return `src/utilities/generated/${sanitizeBuilderName(name)}.js`;
}

function moduleToScriptPath(moduleName: string) {
  const parts = String(moduleName || "")
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "src/index.js";
  }

  const [group, ...rest] = parts;
  if (group === "moderation" || group === "utilities") {
    const moduleParts = rest.length ? rest : ["index"];
    return `src/${group}/${moduleParts.join("/")}.js`;
  }

  return `src/${parts.join("/")}.js`;
}

function getParentDirectoryFromPath(relativePath: string) {
  const normalized = String(relativePath || "").replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  parts.pop();
  return parts.length ? parts.join("/") : ".";
}

function getNodeTemplate(type: BuilderNodeType) {
  return NODE_TEMPLATES.find((template) => template.type === type) || null;
}

function getDefaultNodeConfig(type: BuilderNodeType): Record<string, string> {
  switch (type) {
    case "variable_set":
      return { variableName: "welcome_user", valueType: "string", value: "LegoChris" };
    case "json_save":
      return { filePath: "data/settings.json", variableName: "" };
    case "json_load":
      return { filePath: "data/settings.json", targetVariable: "loaded_data" };
    case "send_embed":
      return {
        title: "Titolo embed",
        description: "Descrizione embed",
        color: "#f59e0b",
        footer: "",
        footerIconFolder: DATA_ROOT_OPTION,
        footerIconFile: "",
        footerIconUrl: "",
        authorName: "",
        authorIconFolder: DATA_ROOT_OPTION,
        authorIconFile: "",
        authorIconUrl: "",
        thumbnailFolder: DATA_ROOT_OPTION,
        thumbnailFile: "",
        thumbnailUrl: "",
        imageFolder: DATA_ROOT_OPTION,
        imageFile: "",
        imageUrl: "",
        componentMode: "none",
        buttonsJson: "[]",
        selectPlaceholder: "Scegli un'opzione",
        selectOptionsJson: "[]",
        selectMinValues: "1",
        selectMaxValues: "1",
        fieldsJson: "[]",
        timestamp: "false",
        timestampMode: "none",
        timestampValue: "",
      };
    case "add_role":
    case "remove_role":
      return { roleName: "Member", targetType: "author", targetVariable: "" };
    case "function_define":
      return { returnNames: "result,status" };
    case "function_call":
      return { assignTo: "result,status" };
    case "return_values":
      return { values: "result,status" };
    default:
      return {};
  }
}

function getNodeSummary(node: BuilderNode) {
  const config = node.config || {};
  switch (node.type) {
    case "variable_set":
      return `${config.variableName || node.payload} = ${config.value || ""} (${config.valueType || "string"})`;
    case "json_save":
      return `${config.variableName ? `salva ${config.variableName}` : "salva tutte le variabili"} -> ${config.filePath || node.payload}`;
    case "json_load":
      return `${config.filePath || node.payload} -> ${config.targetVariable || "loaded_data"}`;
    case "function_define":
      return `${node.payload || "function"} -> ${config.returnNames || "nessun ritorno"}`;
    case "function_call":
      return `${node.payload || "function"} => ${config.assignTo || "nessuna assegnazione"}`;
    case "return_values":
      return config.values || node.payload || "(ritorni)";
    case "send_embed":
      return `${config.title || "embed"} | ${config.color || "colore automatico"}`;
    case "add_role":
      return `+ ruolo ${config.roleName || node.payload || "member"} -> ${config.targetType || "author"}`;
    case "remove_role":
      return `- ruolo ${config.roleName || node.payload || "member"} -> ${config.targetType || "author"}`;
    default:
      return node.payload || "(vuoto)";
  }
}

function parseAnsiToSegments(input: string): AnsiSegment[] {
  const regex = /\x1b\[([0-9;]+)m/g;
  const segments: AnsiSegment[] = [];
  let cursor = 0;
  let style: AnsiStyle = {};

  const pushText = (text: string) => {
    if (!text) return;
    segments.push({ text, style: { ...style } });
  };

  let match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    pushText(input.slice(cursor, match.index));
    cursor = regex.lastIndex;

    const codes = match[1]
      .split(";")
      .map((value) => Number.parseInt(value, 10))
      .filter((n) => Number.isFinite(n));

    if (codes.length === 0) {
      style = {};
      continue;
    }

    for (const code of codes) {
      if (code === 0) {
        style = {};
      } else if (code === 1) {
        style.fontWeight = "bold";
      } else if (code >= 30 && code <= 37) {
        style.color = ANSI_COLORS[code];
      } else if (code >= 90 && code <= 97) {
        style.color = ANSI_COLORS[code];
      } else if (code >= 40 && code <= 47) {
        style.backgroundColor = ANSI_COLORS[code - 10];
      } else if (code >= 100 && code <= 107) {
        style.backgroundColor = ANSI_COLORS[code - 60];
      }
    }
  }

  pushText(input.slice(cursor));
  return segments;
}

function highlightJavaScriptLine(line: string) {
  const tokenRegex = /(#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b)/g;
  const parts: Array<{ text: string; className: string }> = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > cursor) {
      parts.push({ text: line.slice(cursor, match.index), className: "discord-editor-token-base" });
    }

    const value = match[0];
    let className = "discord-editor-token-base";
    if (value.startsWith("#")) {
      className = "discord-editor-token-comment";
    } else if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      className = "discord-editor-token-string";
    } else if (/^\d/.test(value)) {
      className = "discord-editor-token-number";
    } else if (JAVASCRIPT_KEYWORDS.has(value)) {
      className = "discord-editor-token-keyword";
    } else if (/^[A-Z][A-Za-z0-9_]*$/.test(value)) {
      className = "discord-editor-token-type";
    }

    parts.push({ text: value, className });
    cursor = match.index + value.length;
  }

  if (cursor < line.length) {
    parts.push({ text: line.slice(cursor), className: "discord-editor-token-base" });
  }

  return parts;
}

function renderAnsiText(text: string, keyPrefix: string) {
  const segments = parseAnsiToSegments(text || "");
  if (segments.length === 0) {
    return text;
  }

  return segments.map((segment, index) => (
    <span key={`${keyPrefix}-${index}`} style={segment.style}>
      {segment.text}
    </span>
  ));
}

function formatBytes(bytes: number | null | undefined) {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return "N/D";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  const precision = value >= 100 || index === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[index]}`;
}

function clampPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function buildDataMediaPath(folderValue: string | undefined, fileName: string | undefined) {
  const cleanFile = String(fileName || "").trim();
  if (!cleanFile || cleanFile === NO_FILE_OPTION) return "";

  const cleanFolder = String(folderValue || DATA_ROOT_OPTION).trim();
  if (!cleanFolder || cleanFolder === DATA_ROOT_OPTION) {
    return `data/${cleanFile}`;
  }

  return `data/${cleanFolder}/${cleanFile}`;
}

function parseDataMediaPath(mediaPath: string | undefined) {
  const raw = String(mediaPath || "").trim().replace(/\\/g, "/");
  if (!raw.startsWith("data/")) return null;
  const relative = raw.slice("data/".length);
  const parts = relative.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const fileName = parts[parts.length - 1] || "";
  const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : DATA_ROOT_OPTION;
  if (!fileName) return null;
  return { folder, fileName };
}

type EmbedButtonAction = {
  label: string;
  style: "primary" | "secondary" | "success" | "danger";
  functionName: string;
};

type EmbedSelectAction = {
  label: string;
  value: string;
  description: string;
  functionName: string;
};

function parseConfigArray<T>(raw: string | undefined, fallback: T[]): T[] {
  try {
    const parsed = JSON.parse(String(raw || "[]"));
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
}

export default function DiscordBotManager() {
  const [section, setSection] = useState<SectionKey>("overview");
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [config, setConfig] = useState<BotConfig>({
    rootPath: "/home/gabrycoso/LegoChrisBot_V2",
    entryScript: "src/index.js",
    runtimeCommand: "node",
    pm2ProcessName: "lc-bot",
  });
  const [configBusy, setConfigBusy] = useState(false);

  const [currentDir, setCurrentDir] = useState(".");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [newPathInput, setNewPathInput] = useState("");
  const [fileBusy, setFileBusy] = useState(false);
  const [pendingDeletePath, setPendingDeletePath] = useState<string | null>(null);
  const [editorFont, setEditorFont] = useState<EditorFont>("Consolas");
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [editorZoom, setEditorZoom] = useState(1);

  const [commandError, setCommandError] = useState("");
  const [statusUpdatedAt, setStatusUpdatedAt] = useState<number | null>(null);

  const [modules, setModules] = useState<BotModule[]>([]);
  const [modulesBusy, setModulesBusy] = useState(false);
  const [flows, setFlows] = useState<BuilderFlowMeta[]>([]);
  const [dataMediaFolders, setDataMediaFolders] = useState<string[]>([]);
  const [authorIconFiles, setAuthorIconFiles] = useState<string[]>([]);
  const [footerIconFiles, setFooterIconFiles] = useState<string[]>([]);
  const [thumbnailFiles, setThumbnailFiles] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<string[]>([]);

  const [flowName, setFlowName] = useState("");
  const [builderMode, setBuilderMode] = useState<BuilderMode>("visual");
  const [builderTargetPath, setBuilderTargetPath] = useState("");
  const [builderSource, setBuilderSource] = useState("");
  const [builderSourceBusy, setBuilderSourceBusy] = useState(false);
  const [compileResult, setCompileResult] = useState("");
  const [compileBusy, setCompileBusy] = useState(false);

  const [nodes, setNodes] = useState<BuilderNode[]>(getDefaultBuilderNodes());
  const [edges, setEdges] = useState<BuilderEdge[]>(getDefaultBuilderEdges());
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedTemplateType, setSelectedTemplateType] = useState<BuilderNodeType | null>(null);
  const [flowPickerValue, setFlowPickerValue] = useState("");
  const [modulePickerValue, setModulePickerValue] = useState("");
  const [pinDragFrom, setPinDragFrom] = useState<{ nodeId: string; side: "left" | "right" } | null>(null);
  const [wireMouse, setWireMouse] = useState<{ x: number; y: number } | null>(null);
  const [draggingNode, setDraggingNode] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [boardZoom, setBoardZoom] = useState(1);
  const [boardPan, setBoardPan] = useState({ x: 0, y: 0 });
  const [middlePanning, setMiddlePanning] = useState<{ startClientX: number; startClientY: number; startPanX: number; startPanY: number } | null>(null);
  const [showCreateFunction, setShowCreateFunction] = useState(false);
  const [newFunctionName, setNewFunctionName] = useState("");

  const editorInputRef = useRef<HTMLTextAreaElement | null>(null);
  const editorOverlayRef = useRef<HTMLDivElement | null>(null);
  const builderSourceInputRef = useRef<HTMLTextAreaElement | null>(null);
  const builderSourceOverlayRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  const statusText = useMemo(() => {
    if (!status) return "N/D";
    if (!status.pm2Installed) return "PM2 non trovato";
    return status.running ? "Online" : "Offline";
  }, [status]);

  const botCpuPercent = useMemo(() => clampPercent(status?.cpuPercent), [status]);

  const systemMemoryPercent = useMemo(() => {
    const total = Number(status?.systemTotalMemoryBytes || 0);
    const free = Number(status?.systemFreeMemoryBytes || 0);
    if (total <= 0) return 0;
    return clampPercent(((total - free) / total) * 100);
  }, [status]);

  const botMemoryPercent = useMemo(() => {
    const botMem = Number(status?.memoryBytes || 0);
    const total = Number(status?.systemTotalMemoryBytes || 0);
    if (botMem <= 0 || total <= 0) return 0;
    return clampPercent((botMem / total) * 100);
  }, [status]);

  const editorLines = useMemo(() => fileContent.split("\n"), [fileContent]);
  const builderSourceLines = useMemo(() => builderSource.split("\n"), [builderSource]);
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);
  const selectedTemplate = useMemo(
    () => (selectedTemplateType ? getNodeTemplate(selectedTemplateType) : null),
    [selectedTemplateType]
  );
  const savedFlowName = useMemo(() => {
    if (flowPickerValue && flows.some((flow) => flow.name === flowPickerValue)) {
      return flowPickerValue;
    }
    return "";
  }, [flowPickerValue, flows]);

  const callableOptions = useMemo(() => {
    const moduleNames = modules.map((m) => m.name);
    const flowNames = flows.map((f) => f.name);
    const localFunctions = nodes
      .filter((n) => n.type === "function_define")
      .map((n) => String(n.payload || "").trim())
      .filter(Boolean);
    return Array.from(new Set([...moduleNames, ...flowNames, ...localFunctions])).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [modules, flows, nodes]);

  const localFunctionOptions = useMemo(() => {
    return nodes
      .filter((n) => n.type === "function_define")
      .map((n) => String(n.payload || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [nodes]);

  const templateGroups = useMemo(() => {
    return NODE_TEMPLATES.reduce<Record<string, typeof NODE_TEMPLATES>>((acc, template) => {
      if (!acc[template.category]) acc[template.category] = [];
      acc[template.category].push(template);
      return acc;
    }, {});
  }, []);

  const sendEmbedButtons = useMemo<EmbedButtonAction[]>(() => {
    if (selectedNode?.type !== "send_embed") return [];
    return parseConfigArray<EmbedButtonAction>(selectedNode.config?.buttonsJson, []).map((item, index) => ({
      label: String(item?.label || `Pulsante ${index + 1}`),
      style: item?.style === "success" || item?.style === "danger" || item?.style === "secondary" ? item.style : "primary",
      functionName: String(item?.functionName || ""),
    }));
  }, [selectedNode?.id, selectedNode?.type, selectedNode?.config?.buttonsJson]);

  const sendEmbedSelectOptions = useMemo<EmbedSelectAction[]>(() => {
    if (selectedNode?.type !== "send_embed") return [];
    return parseConfigArray<EmbedSelectAction>(selectedNode.config?.selectOptionsJson, []).map((item, index) => ({
      label: String(item?.label || `Opzione ${index + 1}`),
      value: String(item?.value || `option_${index + 1}`),
      description: String(item?.description || ""),
      functionName: String(item?.functionName || ""),
    }));
  }, [selectedNode?.id, selectedNode?.type, selectedNode?.config?.selectOptionsJson]);

  const syncEditorScroll = () => {
    const input = editorInputRef.current;
    const overlay = editorOverlayRef.current;
    if (!input || !overlay) return;
    overlay.scrollTop = input.scrollTop;
    overlay.scrollLeft = input.scrollLeft;
  };

  const syncBuilderSourceScroll = () => {
    const input = builderSourceInputRef.current;
    const overlay = builderSourceOverlayRef.current;
    if (!input || !overlay) return;
    overlay.scrollTop = input.scrollTop;
    overlay.scrollLeft = input.scrollLeft;
  };

  const onEditorKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    if (event.key === "Tab") {
      event.preventDefault();
      const next = `${fileContent.slice(0, start)}\t${fileContent.slice(end)}`;
      setFileContent(next);
      requestAnimationFrame(() => {
        target.selectionStart = start + 1;
        target.selectionEnd = start + 1;
      });
      return;
    }

    if (event.key === "Enter") {
      const before = fileContent.slice(0, start);
      const currentLine = before.split("\n").pop() || "";
      const indent = currentLine.match(/^\s*/)?.[0] || "";
      const endsWithColon = /:\s*$/.test(currentLine);
      const extra = endsWithColon ? "\t" : "";
      const insertion = `\n${indent}${extra}`;
      event.preventDefault();
      const next = `${fileContent.slice(0, start)}${insertion}${fileContent.slice(end)}`;
      setFileContent(next);
      requestAnimationFrame(() => {
        const pos = start + insertion.length;
        target.selectionStart = pos;
        target.selectionEnd = pos;
      });
    }
  };

  const loadConfig = async () => {
    const res = await fetch(API_ENDPOINTS.botConfig);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Errore configurazione");
    setConfig(data);
  };

  const saveConfig = async () => {
    setConfigBusy(true);
    try {
      const res = await fetch(API_ENDPOINTS.botConfig, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore salvataggio configurazione");
      setConfig(data);
      await refreshStatus();
      await loadFiles(currentDir);
    } catch (err: any) {
      setStatusError(err.message || "Errore salvataggio configurazione");
    } finally {
      setConfigBusy(false);
    }
  };

  const refreshStatus = async () => {
    try {
      setStatusError(null);
      const [statusRes, logsRes] = await Promise.all([
        fetch(API_ENDPOINTS.botStatus),
        fetch(`${API_ENDPOINTS.botLogs}?limit=280`),
      ]);

      if (!statusRes.ok) {
        const statusData = await statusRes.json().catch(() => ({}));
        throw new Error(statusData?.error || `Status ${statusRes.status}`);
      }
      const latestStatus = await statusRes.json();
      setStatus(latestStatus);
      setStatusUpdatedAt(Date.now());

      if (logsRes.ok) {
        setLogs(await logsRes.json());
      }
    } catch (err: any) {
      setStatusError(err.message || "Errore caricamento stato bot");
    }
  };

  const runPowerAction = async (action: "start" | "stop" | "restart") => {
    const endpoint =
      action === "start"
        ? API_ENDPOINTS.botStart
        : action === "stop"
          ? API_ENDPOINTS.botStop
          : API_ENDPOINTS.botRestart;

    setBusyAction(action);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Errore ${action}`);
      await refreshStatus();
    } catch (err: any) {
      setStatusError(err.message || `Errore ${action}`);
    } finally {
      setBusyAction(null);
    }
  };

  const getParentDir = () => {
    if (currentDir === ".") return;
    const parts = currentDir.split("/").filter(Boolean);
    parts.pop();
    const parent = parts.length === 0 ? "." : parts.join("/");
    loadFiles(parent);
  };

  const loadFiles = async (dir: string) => {
    setFileBusy(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.botFiles}?path=${encodeURIComponent(dir)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore caricamento files");
      setCurrentDir(data.path || dir);
      setEntries(data.entries || []);
    } catch (err: any) {
      setCommandError(err.message || "Errore caricamento cartella");
    } finally {
      setFileBusy(false);
    }
  };

  const loadDataMediaFolders = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.botFiles}?path=${encodeURIComponent("data")}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore caricamento cartelle data");

      const folders = Array.isArray(data?.entries)
        ? data.entries
            .filter((entry: FileEntry) => entry.type === "dir")
            .map((entry: FileEntry) => String(entry.name || "").trim())
            .filter(Boolean)
            .sort((a: string, b: string) => a.localeCompare(b))
        : [];

      setDataMediaFolders(folders);
    } catch {
      setDataMediaFolders([]);
    }
  };

  const loadDataMediaFiles = async (folderValue: string | undefined, target: "authorIcon" | "footerIcon" | "thumbnail" | "image") => {
    const folder = String(folderValue || DATA_ROOT_OPTION);
    const relativePath = folder && folder !== DATA_ROOT_OPTION ? `data/${folder}` : "data";

    try {
      const res = await fetch(`${API_ENDPOINTS.botFiles}?path=${encodeURIComponent(relativePath)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore caricamento immagini data");

      const files = Array.isArray(data?.entries)
        ? data.entries
            .filter((entry: FileEntry) => entry.type === "file" && IMAGE_FILE_PATTERN.test(String(entry.name || "")))
            .map((entry: FileEntry) => String(entry.name || "").trim())
            .filter(Boolean)
            .sort((a: string, b: string) => a.localeCompare(b))
        : [];

      if (target === "authorIcon") {
        setAuthorIconFiles(files);
      } else if (target === "footerIcon") {
        setFooterIconFiles(files);
      } else if (target === "thumbnail") {
        setThumbnailFiles(files);
      } else {
        setImageFiles(files);
      }
    } catch {
      if (target === "authorIcon") {
        setAuthorIconFiles([]);
      } else if (target === "footerIcon") {
        setFooterIconFiles([]);
      } else if (target === "thumbnail") {
        setThumbnailFiles([]);
      } else {
        setImageFiles([]);
      }
    }
  };

  const openFile = async (relativePath: string) => {
    setFileBusy(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.botFile}?path=${encodeURIComponent(relativePath)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore apertura file");
      setSelectedFilePath(data.path || relativePath);
      setFileContent(data.content || "");
    } catch (err: any) {
      setCommandError(err.message || "Errore apertura file");
    } finally {
      setFileBusy(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFilePath) return;
    setFileBusy(true);
    try {
      const res = await fetch(API_ENDPOINTS.botFile, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedFilePath, content: fileContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore salvataggio file");
      await loadFiles(currentDir);
    } catch (err: any) {
      setCommandError(err.message || "Errore salvataggio file");
    } finally {
      setFileBusy(false);
    }
  };

  const createPath = async (type: "file" | "dir") => {
    if (!newPathInput.trim()) return;
    setFileBusy(true);
    try {
      const res = await fetch(API_ENDPOINTS.botFile, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: newPathInput.trim(), type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore creazione path");
      setNewPathInput("");
      await loadFiles(currentDir);
    } catch (err: any) {
      setCommandError(err.message || "Errore creazione path");
    } finally {
      setFileBusy(false);
    }
  };

  const deletePath = async (relativePath: string) => {
    setFileBusy(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.botFile}?path=${encodeURIComponent(relativePath)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore eliminazione path");
      if (selectedFilePath === relativePath) {
        setSelectedFilePath("");
        setFileContent("");
      }
      await loadFiles(currentDir);
    } catch (err: any) {
      setCommandError(err.message || "Errore eliminazione path");
    } finally {
      setFileBusy(false);
    }
  };

  const confirmDeletePath = async () => {
    if (!pendingDeletePath) return;
    await deletePath(pendingDeletePath);
    setPendingDeletePath(null);
  };

  const loadModules = async () => {
    setModulesBusy(true);
    try {
      const res = await fetch(API_ENDPOINTS.botModules);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore caricamento moduli");
      const modules = Array.isArray(data.modules)
        ? data.modules.map((mod: any) => ({
            name: String(mod?.name || ""),
            enabled: Boolean(mod?.enabled),
            status: mod?.status === "error" ? "error" : (mod?.enabled ? "active" : "disabled"),
          }))
        : [];
      setModules(modules);
    } catch (err: any) {
      setCommandError(err.message || "Errore caricamento moduli");
    } finally {
      setModulesBusy(false);
    }
  };

  const loadFlows = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.botBuilderFlows);
      const data = await res.json();
      if (!res.ok) return;
      const found = Array.isArray(data.flows) ? data.flows : [];
      setFlows(
        found
          .map((f: any) => ({
            name: String(f.name || ""),
            nodes: Array.isArray(f.nodes)
              ? f.nodes.map((node: any) => ({
                  ...node,
                  config: typeof node?.config === "object" && node.config ? node.config : {},
                }))
              : [],
            edges: Array.isArray(f.edges) ? f.edges : [],
            compiledFile: typeof f.compiled_file === "string" ? f.compiled_file : undefined,
            module: typeof f.module === "string" ? f.module : undefined,
            updatedAt: typeof f.updated_at === "string" ? f.updated_at : undefined,
          }))
          .filter((f) => f.name)
      );
    } catch {
      setFlows([]);
    }
  };

  const saveModules = async () => {
    setModulesBusy(true);
    try {
      const enabled = modules.filter((m) => m.enabled).map((m) => m.name);
      const res = await fetch(API_ENDPOINTS.botModules, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore salvataggio moduli");
      await loadModules();
    } catch (err: any) {
      setCommandError(err.message || "Errore salvataggio moduli");
    } finally {
      setModulesBusy(false);
    }
  };

  const resetBuilder = () => {
    const nextName = "";
    const nextNodes = getDefaultBuilderNodes();
    setFlowName(nextName);
    setBuilderTargetPath("");
    setBuilderSource("");
    setBuilderMode("visual");
    setNodes(nextNodes);
    setEdges(getDefaultBuilderEdges());
    setSelectedNodeId(nextNodes[0]?.id || "");
    setSelectedTemplateType(null);
    setFlowPickerValue("");
    setModulePickerValue("");
    setCompileResult("");
  };

  const loadFlowIntoBuilder = async (flow: BuilderFlowMeta) => {
    const nextNodes = Array.isArray(flow.nodes) ? flow.nodes : [];
    const nextEdges = Array.isArray(flow.edges) ? flow.edges : [];
    const targetPath = flow.compiledFile || getDefaultBuilderTargetPath(flow.name);

    setFlowName(flow.name);
    setFlowPickerValue(flow.name);
    setModulePickerValue("");
    setBuilderTargetPath(targetPath);
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeId(nextNodes[0]?.id || "");
    setSelectedTemplateType(null);
    setBuilderMode("visual");
    setCompileResult(`Flow caricato: ${flow.name}`);

    try {
      const res = await fetch(`${API_ENDPOINTS.botFile}?path=${encodeURIComponent(targetPath)}`);
      const data = await res.json();
      if (res.ok) {
        setBuilderSource(data.content || "");
      }
    } catch {
      // noop: il flow puo esistere anche senza file leggibile al momento
    }
  };

  const loadModuleIntoBuilder = async (moduleName: string) => {
    const targetPath = moduleToScriptPath(moduleName);
    setBuilderSourceBusy(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.botFile}?path=${encodeURIComponent(targetPath)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore apertura cog");
      setBuilderTargetPath(targetPath);
      setBuilderSource(data.content || "");
      setFlowName(moduleName.split(".").pop() || flowName);
      setFlowPickerValue("");
      setModulePickerValue(moduleName);
      setSelectedTemplateType(null);
      setBuilderMode("source");
      setCompileResult(`Cog caricato nel builder: ${moduleName}`);
    } catch (err: any) {
      setCompileResult(`Errore caricamento cog: ${err.message || "apertura fallita"}`);
    } finally {
      setBuilderSourceBusy(false);
    }
  };

  const saveBuilderSource = async () => {
    if (!builderTargetPath.trim()) {
      setCompileResult("Specifica un path per il cog.");
      return;
    }

    setBuilderSourceBusy(true);
    setCompileResult("");
    try {
      const res = await fetch(API_ENDPOINTS.botBuilderSaveSource, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: builderTargetPath.trim(),
          name: flowName,
          source: builderSource,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore salvataggio sorgente");

      const autoRestartMessage = data?.restarted
        ? " Bot riavviato automaticamente."
        : data?.restartError
          ? ` Riavvio automatico fallito: ${data.restartError}`
          : "";

      setCompileResult(`Codice salvato su ${data.path}.${autoRestartMessage}`);
      await Promise.all([loadModules(), loadFlows(), loadFiles(getParentDirectoryFromPath(data.path || builderTargetPath))]);
    } catch (err: any) {
      setCompileResult(`Errore salvataggio codice: ${err.message || "save fallita"}`);
    } finally {
      setBuilderSourceBusy(false);
    }
  };

  const deleteSavedFlow = async () => {
    const targetName = savedFlowName.trim();
    if (!targetName) {
      setCompileResult("Seleziona un workflow salvato da eliminare.");
      return;
    }

    setCompileBusy(true);
    setCompileResult("");
    try {
      const res = await fetch(`${API_ENDPOINTS.botBuilderDeleteFlow}?name=${encodeURIComponent(targetName)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore eliminazione workflow");

      await Promise.all([loadFlows(), loadModules(), loadFiles(getParentDirectoryFromPath(builderTargetPath || "."))]);
      resetBuilder();
      const autoRestartMessage = data?.restarted
        ? " Bot riavviato automaticamente."
        : data?.restartError
          ? ` Riavvio automatico fallito: ${data.restartError}`
          : "";
      setCompileResult(`Workflow eliminato: ${targetName}.${autoRestartMessage}`);
    } catch (err: any) {
      setCompileResult(`Errore eliminazione workflow: ${err.message || "delete fallita"}`);
    } finally {
      setCompileBusy(false);
    }
  };

  const addNodeFromTemplate = (templateType: BuilderNodeType, position?: { x: number; y: number }) => {
    const template = NODE_TEMPLATES.find((n) => n.type === templateType);
    if (!template) return;
    const id = `n_${Date.now()}`;
    setNodes((prev) => [
      ...prev,
      {
        id,
        type: template.type,
        label: template.label,
        payload: template.payloadPlaceholder,
        config: getDefaultNodeConfig(template.type),
        prefix: template.type === "trigger_command" ? "/" : undefined,
        x: position?.x ?? 120 + (prev.length % 4) * 290,
        y: position?.y ?? 80 + Math.floor(prev.length / 4) * 160,
      },
    ]);
    setSelectedNodeId(id);
    setSelectedTemplateType(null);
  };

  const removeNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
    if (selectedNodeId === id) setSelectedNodeId("");
    if (pinDragFrom?.nodeId === id) setPinDragFrom(null);
  };

  const connectNodes = (from: string, to: string) => {
    if (!from || !to || from === to) return;
    setEdges((prev) => {
      if (prev.some((e) => e.from === from && e.to === to)) return prev;
      return [...prev, { id: `e_${Date.now()}_${Math.random()}`, from, to }];
    });
  };

  const removeEdge = (id: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== id));
  };

  const startNodeDrag = (event: React.MouseEvent, nodeId: string) => {
    const board = boardRef.current;
    if (!board) return;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const rect = board.getBoundingClientRect();
    const worldX = (event.clientX - rect.left - boardPan.x) / boardZoom;
    const worldY = (event.clientY - rect.top - boardPan.y) / boardZoom;
    setDraggingNode({
      id: nodeId,
      offsetX: worldX - node.x,
      offsetY: worldY - node.y,
    });
  };

  const onBoardMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 1) return;
    event.preventDefault();
    setMiddlePanning({
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPanX: boardPan.x,
      startPanY: boardPan.y,
    });
  };

  const onBoardMouseMove = (event: React.MouseEvent) => {
    const board = boardRef.current;
    if (!board) return;

    if (middlePanning) {
      event.preventDefault();
      const dx = event.clientX - middlePanning.startClientX;
      const dy = event.clientY - middlePanning.startClientY;
      setBoardPan({ x: middlePanning.startPanX + dx, y: middlePanning.startPanY + dy });
      return;
    }

    const rect = board.getBoundingClientRect();
    if (pinDragFrom) {
      const x = (event.clientX - rect.left - boardPan.x) / boardZoom;
      const y = (event.clientY - rect.top - boardPan.y) / boardZoom;
      setWireMouse({ x, y });
    }

    if (!draggingNode) return;

    const worldX = (event.clientX - rect.left - boardPan.x) / boardZoom;
    const worldY = (event.clientY - rect.top - boardPan.y) / boardZoom;
    const x = worldX - draggingNode.offsetX;
    const y = Math.max(20, worldY - draggingNode.offsetY);

    setNodes((prev) => prev.map((n) => (n.id === draggingNode.id ? { ...n, x, y } : n)));
  };

  const onBoardDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes("application/x-builder-node")) {
      event.preventDefault();
    }
  };

  const onBoardDrop = (event: React.DragEvent<HTMLDivElement>) => {
    const templateType = event.dataTransfer.getData("application/x-builder-node") as BuilderNodeType;
    if (!templateType) return;
    event.preventDefault();

    const board = boardRef.current;
    if (!board) return;

    const rect = board.getBoundingClientRect();
    const worldX = (event.clientX - rect.left - boardPan.x) / boardZoom;
    const worldY = (event.clientY - rect.top - boardPan.y) / boardZoom;
    addNodeFromTemplate(templateType, { x: worldX - 130, y: worldY - 55 });
  };

  const onBoardMouseUp = () => {
    if (middlePanning) {
      setMiddlePanning(null);
      return;
    }
    if (draggingNode) setDraggingNode(null);
    if (pinDragFrom) {
      setPinDragFrom(null);
      setWireMouse(null);
    }
  };

  const updateSelectedNodePayload = (value: string) => {
    if (!selectedNode) return;
    setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, payload: value } : n)));
  };

  const updateSelectedNodeConfig = (key: string, value: string) => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) => (
        n.id === selectedNode.id
          ? { ...n, config: { ...(n.config || {}), [key]: value } }
          : n
      ))
    );
  };

  const updateSendEmbedFolder = (target: "authorIcon" | "footerIcon" | "thumbnail" | "image", folderValue: string) => {
    if (!selectedNode || selectedNode.type !== "send_embed") return;
    const folderKey = target === "authorIcon"
      ? "authorIconFolder"
      : target === "footerIcon"
        ? "footerIconFolder"
        : target === "thumbnail"
          ? "thumbnailFolder"
          : "imageFolder";
    const fileKey = target === "authorIcon"
      ? "authorIconFile"
      : target === "footerIcon"
        ? "footerIconFile"
        : target === "thumbnail"
          ? "thumbnailFile"
          : "imageFile";
    const urlKey = target === "authorIcon"
      ? "authorIconUrl"
      : target === "footerIcon"
        ? "footerIconUrl"
        : target === "thumbnail"
          ? "thumbnailUrl"
          : "imageUrl";

    const nextFolder = folderValue || DATA_ROOT_OPTION;
    updateSelectedNodeConfig(folderKey, nextFolder);
    updateSelectedNodeConfig(fileKey, "");
    updateSelectedNodeConfig(urlKey, "");
  };

  const updateSendEmbedFile = (target: "authorIcon" | "footerIcon" | "thumbnail" | "image", fileValue: string) => {
    if (!selectedNode || selectedNode.type !== "send_embed") return;
    const folderKey = target === "authorIcon"
      ? "authorIconFolder"
      : target === "footerIcon"
        ? "footerIconFolder"
        : target === "thumbnail"
          ? "thumbnailFolder"
          : "imageFolder";
    const fileKey = target === "authorIcon"
      ? "authorIconFile"
      : target === "footerIcon"
        ? "footerIconFile"
        : target === "thumbnail"
          ? "thumbnailFile"
          : "imageFile";
    const urlKey = target === "authorIcon"
      ? "authorIconUrl"
      : target === "footerIcon"
        ? "footerIconUrl"
        : target === "thumbnail"
          ? "thumbnailUrl"
          : "imageUrl";

    const normalizedFile = fileValue === NO_FILE_OPTION ? "" : fileValue;
    const folderValue = String(selectedNode.config?.[folderKey] || DATA_ROOT_OPTION);
    const mediaPath = buildDataMediaPath(folderValue, normalizedFile);

    updateSelectedNodeConfig(fileKey, normalizedFile);
    updateSelectedNodeConfig(urlKey, mediaPath);
  };

  const updateSendEmbedComponentMode = (value: "none" | "buttons" | "select") => {
    if (!selectedNode || selectedNode.type !== "send_embed") return;
    updateSelectedNodeConfig("componentMode", value);

    if (value === "buttons" && sendEmbedButtons.length === 0) {
      updateSelectedNodeConfig("buttonsJson", JSON.stringify([{ label: "Pulsante 1", style: "primary", functionName: "" }]));
    }

    if (value === "select" && sendEmbedSelectOptions.length === 0) {
      updateSelectedNodeConfig("selectOptionsJson", JSON.stringify([{ label: "Opzione 1", value: "option_1", description: "", functionName: "" }]));
      updateSelectedNodeConfig("selectMinValues", "1");
      updateSelectedNodeConfig("selectMaxValues", "1");
    }
  };

  const updateSendEmbedButtonsCount = (countValue: string) => {
    if (!selectedNode || selectedNode.type !== "send_embed") return;
    const count = Math.max(1, Math.min(5, Number.parseInt(countValue, 10) || 1));
    const next = [...sendEmbedButtons];

    while (next.length < count) {
      next.push({ label: `Pulsante ${next.length + 1}`, style: "primary", functionName: "" });
    }

    updateSelectedNodeConfig("buttonsJson", JSON.stringify(next.slice(0, count)));
  };

  const updateSendEmbedButtonItem = (index: number, patch: Partial<EmbedButtonAction>) => {
    if (!selectedNode || selectedNode.type !== "send_embed") return;
    const next = [...sendEmbedButtons];
    if (!next[index]) return;
    next[index] = { ...next[index], ...patch };
    updateSelectedNodeConfig("buttonsJson", JSON.stringify(next));
  };

  const updateSendEmbedSelectCount = (countValue: string) => {
    if (!selectedNode || selectedNode.type !== "send_embed") return;
    const count = Math.max(1, Math.min(8, Number.parseInt(countValue, 10) || 1));
    const next = [...sendEmbedSelectOptions];

    while (next.length < count) {
      const index = next.length + 1;
      next.push({ label: `Opzione ${index}`, value: `option_${index}`, description: "", functionName: "" });
    }

    const trimmed = next.slice(0, count);
    updateSelectedNodeConfig("selectOptionsJson", JSON.stringify(trimmed));

    const maxValues = Math.max(1, Math.min(count, Number.parseInt(String(selectedNode.config?.selectMaxValues || "1"), 10) || 1));
    const minValues = Math.max(1, Math.min(maxValues, Number.parseInt(String(selectedNode.config?.selectMinValues || "1"), 10) || 1));
    updateSelectedNodeConfig("selectMaxValues", String(maxValues));
    updateSelectedNodeConfig("selectMinValues", String(minValues));
  };

  const updateSendEmbedSelectItem = (index: number, patch: Partial<EmbedSelectAction>) => {
    if (!selectedNode || selectedNode.type !== "send_embed") return;
    const next = [...sendEmbedSelectOptions];
    if (!next[index]) return;
    next[index] = { ...next[index], ...patch };
    updateSelectedNodeConfig("selectOptionsJson", JSON.stringify(next));
  };

  const updateSelectedNodePrefix = (value: "/" | "!") => {
    if (!selectedNode) return;
    setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, prefix: value } : n)));
  };

  const startPinDrag = (nodeId: string, side: "left" | "right") => {
    setPinDragFrom({ nodeId, side });
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setWireMouse({ x: side === "right" ? node.x + 260 : node.x, y: node.y + 55 });
  };

  const endPinDrag = (targetNodeId: string) => {
    if (!pinDragFrom) return;
    if (pinDragFrom.nodeId === targetNodeId) {
      setPinDragFrom(null);
      return;
    }
    // Collegamento: da un nodo all'altro
    if (pinDragFrom.side === "right") {
      connectNodes(pinDragFrom.nodeId, targetNodeId);
    } else {
      connectNodes(targetNodeId, pinDragFrom.nodeId);
    }
    setPinDragFrom(null);
    setWireMouse(null);
  };

  const createNewFunction = async () => {
    if (!newFunctionName.trim()) {
      setCommandError("Nome funzione richiesto");
      return;
    }
    try {
      const safeFn = newFunctionName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_") || "new_function";
      const id = `n_${Date.now()}`;
      setNodes((prev) => [
        ...prev,
        {
          id,
          type: "function_define",
          label: "Define Function",
          payload: safeFn,
          config: getDefaultNodeConfig("function_define"),
          x: 140,
          y: 100 + Math.floor(prev.length / 2) * 120,
        },
      ]);
      setSelectedNodeId(id);
      setNewFunctionName("");
      setShowCreateFunction(false);
      setCommandError("");
    } catch (err: any) {
      setCommandError(err.message || "Errore creazione funzione");
    }
  };

  const compileFlow = async (previewOnly = false) => {
    setCompileBusy(true);
    setCompileResult("");
    try {
      const targetPath = builderTargetPath.trim() || getDefaultBuilderTargetPath(flowName);
      const flow = { name: flowName, nodes, edges, targetPath };
      const res = await fetch(API_ENDPOINTS.botBuilderCompile, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow, preview: previewOnly, outputPath: targetPath }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore compilazione flow");
      setBuilderTargetPath(data?.compiled?.file || targetPath);
      if (typeof data?.compiled?.source === "string") {
        setBuilderSource(data.compiled.source);
      }
      if (previewOnly) {
        setBuilderMode("source");
        setCompileResult(`Preview codice pronta per ${data?.compiled?.file || targetPath}`);
      } else {
        setCompileResult(`Flow compilato e salvato: ${data?.compiled?.file || targetPath}`);
        const autoRestartMessage = data?.restarted
          ? " Bot riavviato automaticamente."
          : data?.restartError
            ? ` Riavvio automatico fallito: ${data.restartError}`
            : "";
        if (autoRestartMessage) {
          setCompileResult(`Flow compilato e salvato: ${data?.compiled?.file || targetPath}.${autoRestartMessage}`);
        }
        await Promise.all([loadModules(), loadFlows(), loadFiles(getParentDirectoryFromPath(data?.compiled?.file || targetPath))]);
      }
    } catch (err: any) {
      setCompileResult(`Errore: ${err.message || "compile fallita"}`);
    } finally {
      setCompileBusy(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        await Promise.all([loadConfig(), refreshStatus(), loadFiles("."), loadModules(), loadFlows()]);
      } catch (err: any) {
        setStatusError(err.message || "Errore inizializzazione pannello");
      }
    };

    run();
    const interval = setInterval(() => {
      refreshStatus();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const container = logsContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (section === "modules") {
      void loadModules();
    }
  }, [section]);

  useEffect(() => {
    if (section !== "builder" || selectedNode?.type !== "send_embed") return;
    void loadDataMediaFolders();
  }, [section, selectedNode?.id]);

  useEffect(() => {
    if (section !== "builder" || selectedNode?.type !== "send_embed") return;
    void loadDataMediaFiles(String(selectedNode.config?.authorIconFolder || DATA_ROOT_OPTION), "authorIcon");
    void loadDataMediaFiles(String(selectedNode.config?.footerIconFolder || DATA_ROOT_OPTION), "footerIcon");
    void loadDataMediaFiles(String(selectedNode.config?.thumbnailFolder || DATA_ROOT_OPTION), "thumbnail");
    void loadDataMediaFiles(String(selectedNode.config?.imageFolder || DATA_ROOT_OPTION), "image");
  }, [section, selectedNode?.id, selectedNode?.config?.authorIconFolder, selectedNode?.config?.footerIconFolder, selectedNode?.config?.thumbnailFolder, selectedNode?.config?.imageFolder]);

  useEffect(() => {
    if (selectedNode?.type !== "send_embed") return;

    if (!selectedNode.config?.authorIconFile && selectedNode.config?.authorIconUrl) {
      const parsed = parseDataMediaPath(String(selectedNode.config.authorIconUrl));
      if (parsed) {
        updateSelectedNodeConfig("authorIconFolder", parsed.folder);
        updateSelectedNodeConfig("authorIconFile", parsed.fileName);
      }
    }

    if (!selectedNode.config?.footerIconFile && selectedNode.config?.footerIconUrl) {
      const parsed = parseDataMediaPath(String(selectedNode.config.footerIconUrl));
      if (parsed) {
        updateSelectedNodeConfig("footerIconFolder", parsed.folder);
        updateSelectedNodeConfig("footerIconFile", parsed.fileName);
      }
    }

    if (!selectedNode.config?.thumbnailFile && selectedNode.config?.thumbnailUrl) {
      const parsed = parseDataMediaPath(String(selectedNode.config.thumbnailUrl));
      if (parsed) {
        updateSelectedNodeConfig("thumbnailFolder", parsed.folder);
        updateSelectedNodeConfig("thumbnailFile", parsed.fileName);
      }
    }

    if (!selectedNode.config?.imageFile && selectedNode.config?.imageUrl) {
      const parsed = parseDataMediaPath(String(selectedNode.config.imageUrl));
      if (parsed) {
        updateSelectedNodeConfig("imageFolder", parsed.folder);
        updateSelectedNodeConfig("imageFile", parsed.fileName);
      }
    }
  }, [selectedNode?.id, selectedNode?.type, selectedNode?.config?.authorIconFile, selectedNode?.config?.authorIconUrl, selectedNode?.config?.footerIconFile, selectedNode?.config?.footerIconUrl, selectedNode?.config?.thumbnailFile, selectedNode?.config?.thumbnailUrl, selectedNode?.config?.imageFile, selectedNode?.config?.imageUrl]);

  return (
    <div className="discord-panel-shell">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg discord-soft">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Discord Bot Control</h2>
            <p className="text-sm text-foreground/60">PM2 logs reali, editor JavaScript singolo, monitor risorse live e builder blueprint-like</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {SECTIONS.map((item) => (
          <button
            key={item.key}
            className={`px-4 py-2 rounded-lg discord-soft border text-sm font-medium transition-colors ${
              section === item.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background/50 border-border hover:border-primary/50"
            }`}
            onClick={() => setSection(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {statusError && (
        <div className="mb-4 p-3 rounded-lg discord-soft border border-destructive/30 bg-destructive/10 text-destructive text-sm">{statusError}</div>
      )}

      {section === "overview" && (
        <div className="space-y-4">
          <div className="discord-surface p-4 rounded-lg border border-border bg-background/50">
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              <Settings className="w-4 h-4" /> Configurazione Runtime Bot
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="px-3 py-2 rounded border border-border bg-background text-sm"
                value={config.rootPath}
                onChange={(e) => setConfig((prev) => ({ ...prev, rootPath: e.target.value }))}
                placeholder="Root bot (es: C:/bots/my-discord-bot)"
              />
              <input
                className="px-3 py-2 rounded border border-border bg-background text-sm"
                value={config.entryScript}
                onChange={(e) => setConfig((prev) => ({ ...prev, entryScript: e.target.value }))}
                  placeholder="Entry script (es: index.js)"
              />
              <input
                className="px-3 py-2 rounded border border-border bg-background text-sm"
                  value={config.runtimeCommand}
                  onChange={(e) => setConfig((prev) => ({ ...prev, runtimeCommand: e.target.value }))}
                  placeholder="Runtime command (es: node)"
              />
                            <span className="text-xs text-foreground/60">Le modifiche aggiornano root, entrypoint e processo PM2 in tempo reale.</span>
                            <div className="flex items-center gap-2 text-sm font-medium"><FolderTree className="w-4 h-4" />{currentDir}</div>
              <input
                className="px-3 py-2 rounded border border-border bg-background text-sm"
                value={config.pm2ProcessName}
                onChange={(e) => setConfig((prev) => ({ ...prev, pm2ProcessName: e.target.value }))}
                placeholder="PM2 process name"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                className="flex items-center gap-2 px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
                onClick={saveConfig}
                disabled={configBusy}
              >
                <Save className="w-4 h-4" /> Salva Config
              </button>
              <span className="text-xs text-foreground/60">Le modifiche aggiornano root e processo PM2 in tempo reale.</span>
            </div>
          </div>

          <div className="discord-surface p-4 rounded-lg border border-border bg-background/50">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm text-foreground/60">Stato bot</div>
                <div className={`text-lg font-semibold ${status?.running ? "text-green-500" : "text-destructive"}`}>{statusText}</div>
                <div className="text-xs text-foreground/60">PM2: {status?.pm2Installed ? "installato" : "non trovato"}</div>
                <div className="text-xs text-foreground/60">Processo: {status?.pm2ProcessName || "-"}</div>
                <div className="text-xs text-foreground/60">Rilevato: {status?.processDetected ? "si" : "no"}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => runPowerAction("start")}
                  disabled={busyAction !== null}
                >
                  <Power className="w-4 h-4" /> Start
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80"
                  onClick={() => runPowerAction("restart")}
                  disabled={busyAction !== null}
                >
                  <RefreshCcw className="w-4 h-4" /> Restart
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/20"
                  onClick={() => runPowerAction("stop")}
                  disabled={busyAction !== null}
                >
                  <Square className="w-4 h-4" /> Stop
                </button>
              </div>
            </div>
          </div>

          <div className="discord-surface p-4 rounded-lg border border-border bg-background/50">
            <div className="text-sm font-medium mb-3">PM2 Logs Processo</div>
            <div ref={logsContainerRef} className="h-80 overflow-auto rounded-lg bg-[linear-gradient(180deg,#1b140f,#110d09)] text-[#ffd8b2] p-3 font-mono text-xs space-y-1 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="text-foreground/50">Nessun log disponibile</div>
              ) : (
                logs.map((line, i) => (
                  <div key={`${line.ts}-${i}`} className="whitespace-pre-wrap break-words">
                    <span className="text-foreground/60">[{new Date(line.ts).toLocaleTimeString("it-IT")}] </span>
                    <span className="font-semibold">{line.level.toUpperCase()} </span>
                    {renderAnsiText(line.message, `${line.ts}-${i}`)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {section === "files" && (
        <div className="space-y-4">
          <div className="discord-surface p-4 rounded-lg border border-border bg-background/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium"><FolderTree className="w-4 h-4" />{currentDir}</div>
              <div className="flex gap-2">
                {currentDir !== "." && (
                  <button className="px-3 py-1.5 text-xs rounded border border-border hover:border-primary/50" onClick={getParentDir}>
                    ← Indietro
                  </button>
                )}
                <button className="px-3 py-1.5 text-xs rounded border border-border hover:border-primary/50" onClick={() => loadFiles(currentDir)}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                className="flex-1 px-3 py-2 rounded border border-border bg-background text-sm"
                placeholder="Nuovo path (es: src/moderation/new-command.js)"
                value={newPathInput}
                onChange={(e) => setNewPathInput(e.target.value)}
              />
              <button className="px-3 py-2 rounded bg-muted hover:bg-muted/80" onClick={() => createPath("dir")}><FolderPlus className="w-4 h-4" /></button>
              <button className="px-3 py-2 rounded bg-muted hover:bg-muted/80" onClick={() => createPath("file")}><Plus className="w-4 h-4" /></button>
            </div>

            <div className="h-56 overflow-auto border border-border rounded-lg custom-scrollbar">
              {entries.map((entry) => (
                <div
                  key={entry.path}
                  className={`flex items-center justify-between px-3 py-2 text-sm border-b border-border/50 ${selectedFilePath === entry.path ? "bg-primary/10" : ""}`}
                >
                  <button
                    className="text-left flex-1 truncate"
                    onClick={() => (entry.type === "dir" ? loadFiles(entry.path) : openFile(entry.path))}
                  >
                    {entry.type === "dir" ? "📁" : "📄"} {entry.name}
                  </button>
                  <button className="text-destructive hover:text-destructive/80" onClick={() => setPendingDeletePath(entry.path)}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="discord-surface p-4 rounded-lg border border-border bg-background/50">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="text-sm font-medium truncate">{selectedFilePath || "Nessun file selezionato"}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs text-foreground/70">Font</label>
                <Select value={editorFont} onValueChange={(value) => setEditorFont(value as EditorFont)}>
                  <SelectTrigger className="h-9 px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                    <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                    <SelectItem value="Fira Code">Fira Code</SelectItem>
                    <SelectItem value="Consolas">Consolas</SelectItem>
                  </SelectContent>
                </Select>
                <label className="text-xs text-foreground/70">Size</label>
                <input
                  type="number"
                  className="w-16 px-2 py-1.5 text-xs rounded border border-border bg-background"
                  min={11}
                  max={22}
                  value={editorFontSize}
                  onChange={(e) => setEditorFontSize(Math.min(22, Math.max(11, Number(e.target.value) || 13)))}
                />
                <label className="text-xs text-foreground/70">Zoom</label>
                <div className="flex items-center gap-1">
                  <button
                    className="px-2 py-1.5 text-xs rounded border border-border hover:border-primary/50"
                    onClick={() => setEditorZoom((z) => Math.max(0.5, z - 0.1))}
                  >
                    −
                  </button>
                  <span className="text-xs text-foreground/70 w-8 text-center">{Math.round(editorZoom * 100)}%</span>
                  <button
                    className="px-2 py-1.5 text-xs rounded border border-border hover:border-primary/50"
                    onClick={() => setEditorZoom((z) => Math.min(2, z + 0.1))}
                  >
                    +
                  </button>
                </div>
                <button className="flex items-center gap-2 px-3 py-2 text-xs rounded bg-primary text-primary-foreground disabled:opacity-50" disabled={!selectedFilePath || fileBusy} onClick={saveFile}>
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>

            <div className="relative border border-border rounded-lg overflow-hidden h-[560px]">
              <div
                ref={editorOverlayRef}
                className="absolute inset-0 p-3 overflow-hidden pointer-events-none custom-scrollbar"
                style={{ fontFamily: editorFont, fontSize: `${editorFontSize * editorZoom}px`, lineHeight: "1.55", tabSize: 2 }}
                aria-hidden="true"
              >
                {editorLines.map((line, index) => (
                  <div key={`hl-${index}`} className="whitespace-pre-wrap break-words">
                    {highlightJavaScriptLine(line).map((token, i) => (
                      <span key={`tk-${index}-${i}`} className={token.className}>{token.text}</span>
                    ))}
                  </div>
                ))}
              </div>

              <textarea
                ref={editorInputRef}
                className="absolute inset-0 w-full h-full p-3 resize-none bg-transparent custom-scrollbar"
                style={{
                  fontFamily: editorFont,
                  fontSize: `${editorFontSize * editorZoom}px`,
                  lineHeight: "1.55",
                  tabSize: 2,
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                  caretColor: "hsl(var(--foreground))",
                }}
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                onKeyDown={onEditorKeyDown}
                onScroll={syncEditorScroll}
                spellCheck={false}
                placeholder="Seleziona un file dal pannello sopra"
              />
            </div>
          </div>
        </div>
      )}

      {section === "terminal" && (
        <div className="space-y-4">
          <div className="discord-surface p-4 rounded-lg border border-border bg-background/50">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div className="flex items-center gap-2 text-sm font-medium"><Settings className="w-4 h-4" />Monitor Risorse Bot</div>
              <div className="text-xs text-foreground/70">
                Ultimo aggiornamento: {statusUpdatedAt ? new Date(statusUpdatedAt).toLocaleTimeString("it-IT") : "-"}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <button
                className="px-3 py-2 rounded bg-primary text-primary-foreground text-xs"
                onClick={() => void refreshStatus()}
              >
                <span className="inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Aggiorna Ora</span>
              </button>
              <div className="text-xs text-foreground/60">Aggiornamento automatico ogni 15s</div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <div className="text-xs text-foreground/60 mb-1">CPU bot</div>
                <div className="text-xl font-semibold">{botCpuPercent.toFixed(1)}%</div>
                <div className="h-2 rounded bg-muted mt-2 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${botCpuPercent}%` }} />
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <div className="text-xs text-foreground/60 mb-1">RAM bot</div>
                <div className="text-xl font-semibold">{formatBytes(status?.memoryBytes ?? null)}</div>
                <div className="text-xs text-foreground/60 mt-1">{botMemoryPercent.toFixed(2)}% della RAM sistema</div>
                <div className="h-2 rounded bg-muted mt-2 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${botMemoryPercent}%` }} />
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <div className="text-xs text-foreground/60 mb-1">Stato processo</div>
                <div className={`text-xl font-semibold ${status?.running ? "text-green-500" : "text-destructive"}`}>{statusText}</div>
                <div className="text-xs text-foreground/60 mt-1">PID: {status?.pid ?? "-"}</div>
                <div className="text-xs text-foreground/60">Uptime: {Math.max(0, Math.floor((status?.uptimeMs || 0) / 1000))}s</div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 mt-3">
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <div className="text-xs text-foreground/60 mb-1">Memoria sistema</div>
                <div className="text-sm text-foreground/80">
                  Usata: {formatBytes((status?.systemTotalMemoryBytes || 0) - (status?.systemFreeMemoryBytes || 0))} / {formatBytes(status?.systemTotalMemoryBytes || null)}
                </div>
                <div className="text-xs text-foreground/60 mt-1">Libera: {formatBytes(status?.systemFreeMemoryBytes || null)}</div>
                <div className="h-2 rounded bg-muted mt-2 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${systemMemoryPercent}%` }} />
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <div className="text-xs text-foreground/60 mb-1">Load Average</div>
                <div className="text-sm text-foreground/80">1m: {(status?.loadAvg1 ?? 0).toFixed(2)}</div>
                <div className="text-sm text-foreground/80">5m: {(status?.loadAvg5 ?? 0).toFixed(2)}</div>
                <div className="text-sm text-foreground/80">15m: {(status?.loadAvg15 ?? 0).toFixed(2)}</div>
              </div>
            </div>

            {commandError && <div className="mt-2 text-xs text-destructive">{commandError}</div>}
          </div>
        </div>
      )}

      {section === "modules" && (
        <div className="space-y-4">
          <div className="discord-surface p-4 rounded-lg border border-border bg-background/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Cog className="w-4 h-4" />
              Moduli bot
            </div>
            <div className="text-xs text-foreground/60">
              {modulesBusy ? "Aggiornamento in corso..." : "Lista stato sola lettura"}
            </div>
          </div>

          <div className="discord-surface rounded-lg border border-border bg-background/40 overflow-hidden">
            {modules.map((mod) => (
              <div key={mod.name} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 last:border-b-0">
                <div className="min-w-0">
                  <div className="font-mono text-sm truncate">{mod.name}</div>
                  <div className="text-[11px] text-foreground/55">
                    {mod.status === "error"
                      ? "Il modulo risulta in errore e richiede controllo manuale"
                      : mod.status === "active"
                        ? "Modulo abilitato"
                        : "Modulo disabilitato"}
                  </div>
                </div>
                <span
                  className={`shrink-0 px-3 py-1.5 text-xs rounded-full border ${
                    mod.status === "error"
                      ? "border-destructive/40 bg-destructive/12 text-destructive"
                      : mod.status === "active"
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-border bg-background/60 text-foreground/70"
                  }`}
                >
                  {mod.status === "error" ? "Errore" : mod.status === "active" ? "Attivo" : "Disattivo"}
                </span>
              </div>
            ))}
            {modules.length === 0 && <div className="px-4 py-5 text-sm text-foreground/60">Nessun modulo trovato in src/modules</div>}
          </div>
        </div>
      )}

      {section === "builder" && (
        <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1.5fr)_380px] gap-4">
          <div className="discord-surface p-3 rounded-lg border border-border bg-background/50">
            <div className="text-sm font-semibold mb-2">Builder Control</div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] uppercase tracking-wide text-foreground/55 mb-1 block">Flow salvati</label>
                <Select
                  value={flowPickerValue}
                  onValueChange={(value) => {
                    setFlowPickerValue(value);
                    const flow = flows.find((item) => item.name === value);
                    if (flow) {
                      void loadFlowIntoBuilder(flow);
                    }
                  }}
                >
                  <SelectTrigger className="h-10 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                    <SelectValue placeholder="Seleziona flow..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border border-border bg-card text-foreground max-h-72 custom-scrollbar">
                    {flows.map((flow) => (
                      <SelectItem key={flow.name} value={flow.name}>
                        {flow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-foreground/55 mb-1 block">Cog esistenti</label>
                <Select
                  value={modulePickerValue}
                  onValueChange={(value) => {
                    setModulePickerValue(value);
                    void loadModuleIntoBuilder(value);
                  }}
                >
                  <SelectTrigger className="h-10 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                    <SelectValue placeholder="Apri cog nel builder..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border border-border bg-card text-foreground max-h-72 custom-scrollbar">
                    {modules.map((mod) => (
                      <SelectItem key={mod.name} value={mod.name}>
                        {mod.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                className="w-full px-3 py-2 rounded border border-border hover:border-primary/50 text-xs"
                onClick={resetBuilder}
              >
                Nuovo Flow
              </button>
            </div>

            <div className="text-sm font-semibold mb-2">Blueprint Palette</div>
            <div className="space-y-3 max-h-[860px] overflow-auto custom-scrollbar pr-1">
              {Object.entries(templateGroups).map(([group, templates]) => (
                <div key={group}>
                  <div className="text-[11px] uppercase tracking-wide text-foreground/55 mb-1">{group}</div>
                  <div className="space-y-1">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.type}
                        draggable
                        className={`w-full text-left px-3 py-2 rounded border bg-background/70 text-xs transition-colors ${selectedTemplateType === tpl.type ? "border-primary text-foreground" : "border-border hover:border-primary/50"}`}
                        onClick={() => setSelectedTemplateType(tpl.type)}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "copy";
                          event.dataTransfer.setData("application/x-builder-node", tpl.type);
                          setSelectedTemplateType(tpl.type);
                        }}
                      >
                        <div className="font-medium">{tpl.label}</div>
                        <div className="text-[11px] text-foreground/60 mt-1">Trascina nel canvas oppure clicca per vedere la spiegazione</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="discord-surface p-3 rounded-lg border border-border bg-background/50 overflow-hidden">
            <div className="space-y-3 mb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Workflow className="w-4 h-4" />
                  {builderMode === "visual" ? "Editor Visuale" : "Editor Codice"}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={builderMode} onValueChange={(value) => setBuilderMode(value as BuilderMode)}>
                    <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                      <SelectItem value="visual">Visuale no-code</SelectItem>
                      <SelectItem value="source">Codice completo</SelectItem>
                    </SelectContent>
                  </Select>
                  {builderMode === "visual" && (
                    <div className="flex items-center gap-1 border border-border rounded-lg px-1 py-1">
                      <button className="px-2 py-1 text-xs rounded hover:bg-muted" onClick={() => setBoardZoom((z) => Math.max(0.5, z - 0.1))}>-</button>
                      <span className="text-xs text-foreground/70 w-10 text-center">{Math.round(boardZoom * 100)}%</span>
                      <button className="px-2 py-1 text-xs rounded hover:bg-muted" onClick={() => setBoardZoom((z) => Math.min(2, z + 0.1))}>+</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] gap-2">
                <input
                  className="px-3 py-2 rounded border border-border bg-background text-xs"
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  placeholder="Flow name"
                />
                <input
                  className="px-3 py-2 rounded border border-border bg-background text-xs font-mono"
                  value={builderTargetPath}
                  onChange={(e) => setBuilderTargetPath(e.target.value)}
                  placeholder="Target module path (es: src/moderation/welcome.js)"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  className="px-3 py-2 rounded border border-border hover:border-primary/50 text-xs"
                  onClick={() => setBuilderTargetPath(getDefaultBuilderTargetPath(flowName))}
                >
                  Usa path generated
                </button>
                <button
                  className="px-3 py-2 rounded border border-border hover:border-primary/50 text-xs disabled:opacity-50"
                  onClick={() => compileFlow(true)}
                  disabled={compileBusy || nodes.length === 0}
                >
                  Genera Codice dai Nodi
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs disabled:opacity-50"
                  onClick={() => compileFlow(false)}
                  disabled={compileBusy || nodes.length === 0}
                >
                  <FilePen className="w-3.5 h-3.5" /> Applica Nodi al Cog
                </button>
                <button
                  className="px-3 py-2 rounded border border-border hover:border-primary/50 text-xs disabled:opacity-50"
                  onClick={saveBuilderSource}
                  disabled={builderSourceBusy || !builderSource.trim()}
                >
                  Salva Codice sul Cog
                </button>
                <button
                  className="px-3 py-2 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs disabled:opacity-50"
                  onClick={deleteSavedFlow}
                  disabled={compileBusy || !savedFlowName}
                >
                  Elimina Workflow
                </button>
              </div>
            </div>

            {builderMode === "visual" ? (
              <div
                ref={boardRef}
                className={`relative h-[860px] w-full min-w-0 rounded-lg border border-border overflow-hidden ${middlePanning ? "cursor-grabbing" : "cursor-default"}`}
                style={{ backgroundSize: "28px 28px", backgroundImage: "radial-gradient(hsl(var(--border)) 1px, transparent 1px)" }}
                onMouseDown={onBoardMouseDown}
                onMouseMove={onBoardMouseMove}
                onMouseUp={onBoardMouseUp}
                onMouseLeave={onBoardMouseUp}
                onDragOver={onBoardDragOver}
                onDrop={onBoardDrop}
                onAuxClick={(e) => e.preventDefault()}
              >
                <div
                  className="absolute inset-0 origin-top-left"
                  style={{ transform: `translate(${boardPan.x}px, ${boardPan.y}px) scale(${boardZoom})` }}
                >
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: 3600, height: 2200 }}>
                    {edges.map((edge) => {
                      const from = nodes.find((n) => n.id === edge.from);
                      const to = nodes.find((n) => n.id === edge.to);
                      if (!from || !to) return null;
                      const x1 = from.x + 260;
                      const y1 = from.y + 55;
                      const x2 = to.x;
                      const y2 = to.y + 55;
                      return <path key={edge.id} d={`M ${x1} ${y1} C ${x1 + 90} ${y1}, ${x2 - 90} ${y2}, ${x2} ${y2}`} stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" opacity="0.8" />;
                    })}

                    {pinDragFrom && (() => {
                      const from = nodes.find((n) => n.id === pinDragFrom.nodeId);
                      if (!from || !wireMouse) return null;
                      const x1 = pinDragFrom.side === "right" ? from.x + 260 : from.x;
                      const y1 = from.y + 55;
                      const x2 = wireMouse.x;
                      const y2 = wireMouse.y;
                      return <path d={`M ${x1} ${y1} C ${x1 + 90} ${y1}, ${x2 - 90} ${y2}, ${x2} ${y2}`} stroke="hsl(var(--primary))" strokeDasharray="6 4" strokeWidth="2" fill="none" opacity="0.85" />;
                    })()}
                  </svg>

                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      className={`absolute w-[260px] rounded-lg border p-2 shadow-md select-none ${selectedNodeId === node.id ? "border-primary ring-2 ring-primary/30 bg-card" : "border-border bg-card/90"}`}
                      style={{ left: node.x, top: node.y }}
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        setSelectedTemplateType(null);
                      }}
                    >
                      <div className="flex items-center justify-between cursor-move px-1.5 py-1 rounded bg-muted/35" onMouseDown={(e) => startNodeDrag(e, node.id)}>
                        <div className="text-xs font-semibold truncate">{node.label}</div>
                        <button className="text-[11px] text-destructive" onClick={() => removeNode(node.id)}>Rimuovi</button>
                      </div>

                      <div className="mt-2 text-[11px] uppercase tracking-wide text-foreground/65">Value</div>
                      <div className="mt-1 px-2 py-1 rounded border border-border bg-background text-xs font-mono truncate">{getNodeSummary(node)}</div>

                      <div className="absolute w-3 h-3 rounded-full bg-primary border border-primary-foreground left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab hover:scale-125 transition-transform" onMouseDown={() => startPinDrag(node.id, "left")} onMouseUp={() => endPinDrag(node.id)} title="Connessione In" />
                      <div className="absolute w-3 h-3 rounded-full bg-primary border border-primary-foreground right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-grab hover:scale-125 transition-transform" onMouseDown={() => startPinDrag(node.id, "right")} onMouseUp={() => endPinDrag(node.id)} title="Connessione Out" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative border border-border rounded-lg overflow-hidden h-[860px]">
                <div
                  ref={builderSourceOverlayRef}
                  className="absolute inset-0 p-3 overflow-hidden pointer-events-none custom-scrollbar bg-[linear-gradient(180deg,#1b140f,#110d09)]"
                  style={{ fontFamily: editorFont, fontSize: `${editorFontSize}px`, lineHeight: "1.55", tabSize: 2 }}
                  aria-hidden="true"
                >
                  {builderSourceLines.map((line, index) => (
                    <div key={`builder-hl-${index}`} className="whitespace-pre-wrap break-words">
                      {highlightJavaScriptLine(line).map((token, i) => (
                        <span key={`builder-tk-${index}-${i}`} className={token.className}>{token.text}</span>
                      ))}
                    </div>
                  ))}
                </div>

                <textarea
                  ref={builderSourceInputRef}
                  className="absolute inset-0 w-full h-full p-3 resize-none bg-transparent custom-scrollbar"
                  style={{
                    fontFamily: editorFont,
                    fontSize: `${editorFontSize}px`,
                    lineHeight: "1.55",
                    tabSize: 2,
                    color: "transparent",
                    WebkitTextFillColor: "transparent",
                    caretColor: "hsl(var(--foreground))",
                  }}
                  value={builderSource}
                  onChange={(e) => setBuilderSource(e.target.value)}
                  onScroll={syncBuilderSourceScroll}
                  spellCheck={false}
                  placeholder="Carica un cog esistente oppure genera il codice dai nodi per modificarlo qui."
                />
              </div>
            )}
            {compileResult && <div className="mt-3 text-sm text-foreground/70 whitespace-pre-wrap">{compileResult}</div>}
          </div>

          <div className="discord-surface p-3 rounded-lg border border-border bg-background/50 space-y-3">
            <div className="text-sm font-semibold">{builderMode === "visual" ? "Node Inspector" : "Source Inspector"}</div>
            {builderMode === "source" ? (
              <>
                <div className="text-xs"><span className="text-foreground/60">Target:</span> {builderTargetPath || "-"}</div>
                <div className="text-xs"><span className="text-foreground/60">Linee:</span> {builderSource.split("\n").length}</div>
                <div className="text-xs"><span className="text-foreground/60">Caratteri:</span> {builderSource.length}</div>
                <div className="p-2 rounded border border-border bg-background/60 text-xs text-foreground/70 space-y-2">
                  <div>Questa modalita permette di modificare qualsiasi modulo esistente direttamente dentro l'editor.</div>
                  <div>Puoi aprire un modulo dalla colonna sinistra, modificarlo qui e salvarlo sul path target.</div>
                  <div>Se vuoi partire dai nodi visuali, usa "Genera Codice dai Nodi" e poi rifinisci il JavaScript in questa vista.</div>
                </div>
              </>
            ) : !selectedNode && selectedTemplate ? (
              <>
                <div className="text-xs"><span className="text-foreground/60">Blocco selezionato:</span> {selectedTemplate.label}</div>
                <div className="p-2 rounded border border-border bg-background/60 text-xs text-foreground/70">
                  {selectedTemplate.description}
                </div>
                <div className="text-[11px] text-foreground/60">
                  Trascina questo blocco dentro il canvas per aggiungerlo al flow.
                </div>
              </>
            ) : !selectedNode ? (
              <div className="text-xs text-foreground/60">Seleziona un nodo per configurarlo.</div>
            ) : (
              <>
                <div className="text-xs"><span className="text-foreground/60">ID:</span> {selectedNode.id}</div>
                <div className="text-xs"><span className="text-foreground/60">Tipo:</span> {selectedNode.type}</div>
                <div className="p-2 rounded border border-border bg-background/60 text-xs text-foreground/70">
                  {getNodeTemplate(selectedNode.type)?.description || "Questo blocco non ha ancora una descrizione disponibile."}
                </div>

                {selectedNode.type === "function_call" || selectedNode.type === "call_existing_command" ? (
                  <div>
                    <label className="text-xs text-foreground/65 mb-2 block">Callable esistente</label>
                    <div className="space-y-2">
                      <Select value={selectedNode.payload} onValueChange={(value) => updateSelectedNodePayload(value)}>
                        <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                          {callableOptions.map((name) => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedNode.type === "function_call" && (
                        <button
                          className="w-full px-2 py-1.5 text-xs rounded border border-border hover:border-primary/50 text-foreground/70 hover:text-foreground"
                          onClick={() => setShowCreateFunction(true)}
                        >
                          + Crea Nuova Funzione
                        </button>
                      )}
                      {selectedNode.type === "function_call" && (
                        <div>
                          <label className="text-xs text-foreground/65 mb-1 block">Salva ritorni in variabili</label>
                          <input
                            className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                            value={selectedNode.config?.assignTo || ""}
                            onChange={(e) => updateSelectedNodeConfig("assignTo", e.target.value)}
                            placeholder="result,status"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedNode.type === "variable_set" ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Nome variabile</label>
                      <input
                        className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                        value={selectedNode.config?.variableName || selectedNode.payload}
                        onChange={(e) => updateSelectedNodeConfig("variableName", e.target.value)}
                        placeholder="welcome_user"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Tipo valore</label>
                      <Select value={selectedNode.config?.valueType || "string"} onValueChange={(value) => updateSelectedNodeConfig("valueType", value)}>
                        <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                          <SelectItem value="string">stringa</SelectItem>
                          <SelectItem value="number">numero</SelectItem>
                          <SelectItem value="boolean">booleano</SelectItem>
                          <SelectItem value="json">json</SelectItem>
                          <SelectItem value="list">lista</SelectItem>
                          <SelectItem value="null">null</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Valore</label>
                      <textarea
                        className="w-full min-h-24 px-2 py-2 rounded border border-border bg-background text-xs resize-none custom-scrollbar"
                        value={selectedNode.config?.value || ""}
                        onChange={(e) => updateSelectedNodeConfig("value", e.target.value)}
                        placeholder='Es: {"user":"LegoChris"} oppure true oppure 42'
                      />
                    </div>
                  </div>
                ) : selectedNode.type === "json_save" ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">File JSON</label>
                      <input
                        className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                        value={selectedNode.config?.filePath || selectedNode.payload}
                        onChange={(e) => updateSelectedNodeConfig("filePath", e.target.value)}
                        placeholder="data/settings.json"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Variabile da salvare</label>
                      <input
                        className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                        value={selectedNode.config?.variableName || ""}
                        onChange={(e) => updateSelectedNodeConfig("variableName", e.target.value)}
                        placeholder="Lascia vuoto per salvare tutte le variabili"
                      />
                    </div>
                  </div>
                ) : selectedNode.type === "json_load" ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">File JSON</label>
                      <input
                        className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                        value={selectedNode.config?.filePath || selectedNode.payload}
                        onChange={(e) => updateSelectedNodeConfig("filePath", e.target.value)}
                        placeholder="data/settings.json"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Variabile destinazione</label>
                      <input
                        className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                        value={selectedNode.config?.targetVariable || ""}
                        onChange={(e) => updateSelectedNodeConfig("targetVariable", e.target.value)}
                        placeholder="loaded_data"
                      />
                    </div>
                  </div>
                ) : selectedNode.type === "send_embed" ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Titolo</label>
                      <input
                        className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                        value={selectedNode.config?.title || ""}
                        onChange={(e) => updateSelectedNodeConfig("title", e.target.value)}
                        placeholder="Titolo embed"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Descrizione</label>
                      <textarea
                        className="w-full min-h-20 px-2 py-2 rounded border border-border bg-background text-xs resize-none custom-scrollbar"
                        value={selectedNode.config?.description || selectedNode.payload || ""}
                        onChange={(e) => updateSelectedNodeConfig("description", e.target.value)}
                        placeholder="Descrizione embed"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">Colore</label>
                        <input
                          className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                          value={selectedNode.config?.color || ""}
                          onChange={(e) => updateSelectedNodeConfig("color", e.target.value)}
                          placeholder="#f59e0b"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">Autore</label>
                        <input
                          className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                          value={selectedNode.config?.authorName || ""}
                          onChange={(e) => updateSelectedNodeConfig("authorName", e.target.value)}
                          placeholder="Nome autore"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">Cartella icona autore (data)</label>
                        <Select
                          value={selectedNode.config?.authorIconFolder || DATA_ROOT_OPTION}
                          onValueChange={(value) => updateSendEmbedFolder("authorIcon", value)}
                        >
                          <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                            <SelectValue placeholder="Seleziona cartella" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                            <SelectItem value={DATA_ROOT_OPTION}>data (root)</SelectItem>
                            {dataMediaFolders.map((folder) => (
                              <SelectItem key={`author-icon-folder-${folder}`} value={folder}>{folder}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">Footer</label>
                        <input
                          className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                          value={selectedNode.config?.footer || ""}
                          onChange={(e) => updateSelectedNodeConfig("footer", e.target.value)}
                          placeholder="Testo footer"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">File icona autore</label>
                        <Select
                          value={selectedNode.config?.authorIconFile || NO_FILE_OPTION}
                          onValueChange={(value) => updateSendEmbedFile("authorIcon", value)}
                        >
                          <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                            <SelectValue placeholder="Seleziona immagine" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                            <SelectItem value={NO_FILE_OPTION}>Nessuna</SelectItem>
                            {authorIconFiles.map((fileName) => (
                              <SelectItem key={`author-icon-file-${fileName}`} value={fileName}>{fileName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">Cartella icona footer (data)</label>
                        <Select
                          value={selectedNode.config?.footerIconFolder || DATA_ROOT_OPTION}
                          onValueChange={(value) => updateSendEmbedFolder("footerIcon", value)}
                        >
                          <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                            <SelectValue placeholder="Seleziona cartella" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                            <SelectItem value={DATA_ROOT_OPTION}>data (root)</SelectItem>
                            {dataMediaFolders.map((folder) => (
                              <SelectItem key={`footer-icon-folder-${folder}`} value={folder}>{folder}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">File icona footer</label>
                        <Select
                          value={selectedNode.config?.footerIconFile || NO_FILE_OPTION}
                          onValueChange={(value) => updateSendEmbedFile("footerIcon", value)}
                        >
                          <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                            <SelectValue placeholder="Seleziona immagine" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                            <SelectItem value={NO_FILE_OPTION}>Nessuna</SelectItem>
                            {footerIconFiles.map((fileName) => (
                              <SelectItem key={`footer-icon-file-${fileName}`} value={fileName}>{fileName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">Cartella thumbnail (data)</label>
                        <Select
                          value={selectedNode.config?.thumbnailFolder || DATA_ROOT_OPTION}
                          onValueChange={(value) => updateSendEmbedFolder("thumbnail", value)}
                        >
                          <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                            <SelectValue placeholder="Seleziona cartella" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                            <SelectItem value={DATA_ROOT_OPTION}>data (root)</SelectItem>
                            {dataMediaFolders.map((folder) => (
                              <SelectItem key={`thumb-folder-${folder}`} value={folder}>{folder}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">File thumbnail</label>
                        <Select
                          value={selectedNode.config?.thumbnailFile || NO_FILE_OPTION}
                          onValueChange={(value) => updateSendEmbedFile("thumbnail", value)}
                        >
                          <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                            <SelectValue placeholder="Seleziona immagine" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                            <SelectItem value={NO_FILE_OPTION}>Nessuna</SelectItem>
                            {thumbnailFiles.map((fileName) => (
                              <SelectItem key={`thumb-file-${fileName}`} value={fileName}>{fileName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">Cartella immagine (data)</label>
                        <Select
                          value={selectedNode.config?.imageFolder || DATA_ROOT_OPTION}
                          onValueChange={(value) => updateSendEmbedFolder("image", value)}
                        >
                          <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                            <SelectValue placeholder="Seleziona cartella" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                            <SelectItem value={DATA_ROOT_OPTION}>data (root)</SelectItem>
                            {dataMediaFolders.map((folder) => (
                              <SelectItem key={`image-folder-${folder}`} value={folder}>{folder}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">File immagine grande</label>
                        <Select
                          value={selectedNode.config?.imageFile || NO_FILE_OPTION}
                          onValueChange={(value) => updateSendEmbedFile("image", value)}
                        >
                          <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                            <SelectValue placeholder="Seleziona immagine" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                            <SelectItem value={NO_FILE_OPTION}>Nessuna</SelectItem>
                            {imageFiles.map((fileName) => (
                              <SelectItem key={`image-file-${fileName}`} value={fileName}>{fileName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="text-[11px] text-foreground/60">
                      Carica prima le immagini nella cartella data/ del bot (anche in sottocartelle), poi selezionale dai menu.
                    </div>
                    <div className="rounded border border-border/70 bg-background/40 p-2 space-y-2">
                      <label className="text-xs text-foreground/65 mb-1 block">Componenti interattivi</label>
                      <Select
                        value={selectedNode.config?.componentMode || "none"}
                        onValueChange={(value) => updateSendEmbedComponentMode(value as "none" | "buttons" | "select")}
                      >
                        <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                          <SelectItem value="none">Nessuno</SelectItem>
                          <SelectItem value="buttons">Pulsanti</SelectItem>
                          <SelectItem value="select">Select Menu</SelectItem>
                        </SelectContent>
                      </Select>

                      {(selectedNode.config?.componentMode || "none") === "buttons" && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                              <label className="text-xs text-foreground/65 mb-1 block">Numero pulsanti</label>
                              <Select
                                value={String(Math.max(1, sendEmbedButtons.length || 1))}
                                onValueChange={updateSendEmbedButtonsCount}
                              >
                                <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                                  {[1, 2, 3, 4, 5].map((count) => (
                                    <SelectItem key={`btn-count-${count}`} value={String(count)}>{count}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {sendEmbedButtons.map((button, index) => (
                            <div key={`send-embed-button-${index}`} className="rounded border border-border/60 p-2 space-y-2">
                              <div className="text-[11px] text-foreground/60">Pulsante {index + 1}</div>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <input
                                  className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                                  value={button.label}
                                  onChange={(e) => updateSendEmbedButtonItem(index, { label: e.target.value })}
                                  placeholder="Etichetta"
                                />
                                <Select
                                  value={button.style}
                                  onValueChange={(value) => updateSendEmbedButtonItem(index, { style: value as EmbedButtonAction["style"] })}
                                >
                                  <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                                    <SelectItem value="primary">Primary</SelectItem>
                                    <SelectItem value="secondary">Secondary</SelectItem>
                                    <SelectItem value="success">Success</SelectItem>
                                    <SelectItem value="danger">Danger</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={button.functionName || NO_FILE_OPTION}
                                  onValueChange={(value) => updateSendEmbedButtonItem(index, { functionName: value === NO_FILE_OPTION ? "" : value })}
                                >
                                  <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                                    <SelectValue placeholder="Funzione azione" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                                    <SelectItem value={NO_FILE_OPTION}>Nessuna funzione</SelectItem>
                                    {localFunctionOptions.map((name) => (
                                      <SelectItem key={`btn-action-${index}-${name}`} value={name}>{name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {(selectedNode.config?.componentMode || "none") === "select" && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                              <label className="text-xs text-foreground/65 mb-1 block">Placeholder select</label>
                              <input
                                className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                                value={selectedNode.config?.selectPlaceholder || "Scegli un'opzione"}
                                onChange={(e) => updateSelectedNodeConfig("selectPlaceholder", e.target.value)}
                                placeholder="Scegli un'opzione"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-foreground/65 mb-1 block">Numero opzioni</label>
                              <Select
                                value={String(Math.max(1, sendEmbedSelectOptions.length || 1))}
                                onValueChange={updateSendEmbedSelectCount}
                              >
                                <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                                    <SelectItem key={`select-count-${count}`} value={String(count)}>{count}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                              <label className="text-xs text-foreground/65 mb-1 block">Min selezioni</label>
                              <Select
                                value={String(Math.max(1, Number.parseInt(String(selectedNode.config?.selectMinValues || "1"), 10) || 1))}
                                onValueChange={(value) => {
                                  const minValue = Math.max(1, Number.parseInt(value, 10) || 1);
                                  const maxCurrent = Math.max(minValue, Number.parseInt(String(selectedNode.config?.selectMaxValues || "1"), 10) || 1);
                                  updateSelectedNodeConfig("selectMinValues", String(minValue));
                                  updateSelectedNodeConfig("selectMaxValues", String(maxCurrent));
                                }}
                              >
                                <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                                  {Array.from({ length: Math.max(1, sendEmbedSelectOptions.length || 1) }, (_, i) => i + 1).map((count) => (
                                    <SelectItem key={`select-min-${count}`} value={String(count)}>{count}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs text-foreground/65 mb-1 block">Max selezioni</label>
                              <Select
                                value={String(Math.max(1, Number.parseInt(String(selectedNode.config?.selectMaxValues || "1"), 10) || 1))}
                                onValueChange={(value) => {
                                  const maxValue = Math.max(1, Number.parseInt(value, 10) || 1);
                                  const minCurrent = Math.min(maxValue, Number.parseInt(String(selectedNode.config?.selectMinValues || "1"), 10) || 1);
                                  updateSelectedNodeConfig("selectMaxValues", String(maxValue));
                                  updateSelectedNodeConfig("selectMinValues", String(Math.max(1, minCurrent)));
                                }}
                              >
                                <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                                  {Array.from({ length: Math.max(1, sendEmbedSelectOptions.length || 1) }, (_, i) => i + 1).map((count) => (
                                    <SelectItem key={`select-max-${count}`} value={String(count)}>{count}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {sendEmbedSelectOptions.map((option, index) => (
                            <div key={`send-embed-select-option-${index}`} className="rounded border border-border/60 p-2 space-y-2">
                              <div className="text-[11px] text-foreground/60">Opzione {index + 1}</div>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <input
                                  className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                                  value={option.label}
                                  onChange={(e) => updateSendEmbedSelectItem(index, { label: e.target.value })}
                                  placeholder="Label"
                                />
                                <input
                                  className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                                  value={option.value}
                                  onChange={(e) => updateSendEmbedSelectItem(index, { value: e.target.value })}
                                  placeholder="value_univoco"
                                />
                              </div>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <input
                                  className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                                  value={option.description}
                                  onChange={(e) => updateSendEmbedSelectItem(index, { description: e.target.value })}
                                  placeholder="Descrizione opzionale"
                                />
                                <Select
                                  value={option.functionName || NO_FILE_OPTION}
                                  onValueChange={(value) => updateSendEmbedSelectItem(index, { functionName: value === NO_FILE_OPTION ? "" : value })}
                                >
                                  <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                                    <SelectValue placeholder="Funzione azione" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                                    <SelectItem value={NO_FILE_OPTION}>Nessuna funzione</SelectItem>
                                    {localFunctionOptions.map((name) => (
                                      <SelectItem key={`select-action-${index}-${name}`} value={name}>{name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Campi embed in JSON</label>
                      <textarea
                        className="w-full min-h-24 px-2 py-2 rounded border border-border bg-background text-xs resize-none custom-scrollbar"
                        value={selectedNode.config?.fieldsJson || "[]"}
                        onChange={(e) => updateSelectedNodeConfig("fieldsJson", e.target.value)}
                        placeholder='[{"name":"Info","value":"Contenuto","inline":false}]'
                      />
                    </div>
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Timestamp</label>
                      <Select
                        value={selectedNode.config?.timestampMode || ((selectedNode.config?.timestamp || "false") === "true" ? "auto" : "none")}
                        onValueChange={(value) => {
                          updateSelectedNodeConfig("timestampMode", value);
                          updateSelectedNodeConfig("timestamp", value === "auto" ? "true" : "false");
                        }}
                      >
                        <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                          <SelectItem value="none">Nessuno</SelectItem>
                          <SelectItem value="auto">Automatico</SelectItem>
                          <SelectItem value="custom">Data custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(selectedNode.config?.timestampMode || ((selectedNode.config?.timestamp || "false") === "true" ? "auto" : "none")) === "custom" && (
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">Valore timestamp</label>
                        <input
                          className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                          value={selectedNode.config?.timestampValue || ""}
                          onChange={(e) => updateSelectedNodeConfig("timestampValue", e.target.value)}
                          placeholder="2026-03-27T14:30:00+01:00"
                        />
                      </div>
                    )}
                  </div>
                ) : selectedNode.type === "add_role" || selectedNode.type === "remove_role" ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Ruolo</label>
                      <input
                        className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                        value={selectedNode.config?.roleName || selectedNode.payload || ""}
                        onChange={(e) => updateSelectedNodeConfig("roleName", e.target.value)}
                        placeholder="Member oppure 123456789012345678"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">A chi applicarlo</label>
                      <Select value={selectedNode.config?.targetType || "author"} onValueChange={(value) => updateSelectedNodeConfig("targetType", value)}>
                        <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                          {MEMBER_TARGET_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {(selectedNode.config?.targetType || "author") === "user_id_variable" && (
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">Variabile con ID utente</label>
                        <input
                          className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                          value={selectedNode.config?.targetVariable || ""}
                          onChange={(e) => updateSelectedNodeConfig("targetVariable", e.target.value)}
                          placeholder="target_user_id"
                        />
                      </div>
                    )}
                  </div>
                ) : selectedNode.type === "function_define" ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Nome funzione</label>
                      <input
                        className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                        value={selectedNode.payload}
                        onChange={(e) => updateSelectedNodePayload(e.target.value)}
                        placeholder="moderation_flow"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Nomi valori di ritorno</label>
                      <input
                        className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                        value={selectedNode.config?.returnNames || ""}
                        onChange={(e) => updateSelectedNodeConfig("returnNames", e.target.value)}
                        placeholder="result,status"
                      />
                    </div>
                  </div>
                ) : selectedNode.type === "return_values" ? (
                  <div>
                    <label className="text-xs text-foreground/65 mb-1 block">Valori da ritornare</label>
                    <textarea
                      className="w-full min-h-24 px-2 py-2 rounded border border-border bg-background text-xs resize-none custom-scrollbar"
                      value={selectedNode.config?.values || selectedNode.payload}
                      onChange={(e) => updateSelectedNodeConfig("values", e.target.value)}
                      placeholder='Es: user_id, status, "ok"'
                    />
                  </div>
                ) : selectedNode.type === "trigger_command" ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Prefisso Comando</label>
                      <Select value={selectedNode.prefix || "/"} onValueChange={(value) => updateSelectedNodePrefix(value as "/" | "!")}>
                        <SelectTrigger className="h-9 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                          <SelectItem value="/">/ (slash command)</SelectItem>
                          <SelectItem value="!">! (prefix command)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Nome Comando</label>
                      <input
                        className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                        value={selectedNode.payload}
                        onChange={(e) => updateSelectedNodePayload(e.target.value)}
                        placeholder="welcome"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-foreground/65 mb-1 block">Payload</label>
                    <input
                      className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                      value={selectedNode.payload}
                      onChange={(e) => updateSelectedNodePayload(e.target.value)}
                      placeholder="Valore nodo"
                    />
                  </div>
                )}

                <div className="p-2 rounded border border-border bg-background/60">
                  <div className="text-[11px] uppercase tracking-wide text-foreground/60 mb-1">Connessioni</div>
                  <div className="max-h-40 overflow-auto custom-scrollbar pr-1 space-y-1">
                    {edges
                      .filter((e) => e.from === selectedNode.id || e.to === selectedNode.id)
                      .map((edge) => (
                        <div key={edge.id} className="flex items-center justify-between text-xs">
                          <span>{edge.from} -{">"} {edge.to}</span>
                          <button className="text-destructive" onClick={() => removeEdge(edge.id)}>x</button>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="text-[11px] text-foreground/60">
                  Modalita blueprint: trascina dal pallino di uscita al pallino di ingresso, il filo segue il mouse in tempo reale.
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Creazione Funzione */}
      {showCreateFunction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Crea Nuova Funzione</h2>
              <p className="text-xs text-foreground/60 mt-1">Aggiungi una nuova funzione/modulo callable</p>
            </div>
            <input
              type="text"
              className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
              placeholder="Nome funzione (es: moderation_flow)"
              value={newFunctionName}
              onChange={(e) => setNewFunctionName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createNewFunction()}
              autoFocus
            />
            {commandError && <div className="text-xs text-destructive">{commandError}</div>}
            <div className="flex gap-2">
              <button
                className="flex-1 px-3 py-2 rounded border border-border hover:border-primary/50 text-sm"
                onClick={() => {
                  setShowCreateFunction(false);
                  setNewFunctionName("");
                  setCommandError("");
                }}
              >
                Annulla
              </button>
              <button
                className="flex-1 px-3 py-2 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90"
                onClick={createNewFunction}
              >
                Crea
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeletePath && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-lg w-full space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Conferma eliminazione</h2>
              <p className="text-xs text-foreground/60 mt-1">
                Stai per eliminare questo elemento dal file manager del bot.
              </p>
            </div>
            <div className="rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-3">
              <div className="text-[11px] uppercase tracking-wide text-foreground/55 mb-1">Path da eliminare</div>
              <div className="font-mono text-sm break-all text-destructive">{pendingDeletePath}</div>
            </div>
            <div className="text-xs text-foreground/65">
              Se confermi, il file o la cartella verranno rimossi definitivamente.
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 px-3 py-2 rounded-lg border border-border hover:border-primary/50 text-sm"
                onClick={() => setPendingDeletePath(null)}
                disabled={fileBusy}
              >
                Annulla
              </button>
              <button
                className="flex-1 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm hover:opacity-90 disabled:opacity-50"
                onClick={confirmDeletePath}
                disabled={fileBusy}
              >
                Elimina davvero
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
