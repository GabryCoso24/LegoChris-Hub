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
  Terminal,
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
  rootPath: string;
  entryScript: string;
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
  pythonCommand: string;
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

type TerminalFont = "JetBrains Mono" | "Fira Code" | "Cascadia Code";

type AnsiStyle = {
  color?: string;
  backgroundColor?: string;
  fontWeight?: "normal" | "bold";
};

type AnsiSegment = {
  text: string;
  style: AnsiStyle;
};

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

const PYTHON_KEYWORDS = new Set([
  "import",
  "from",
  "as",
  "def",
  "class",
  "return",
  "if",
  "elif",
  "else",
  "for",
  "while",
  "break",
  "continue",
  "try",
  "except",
  "finally",
  "await",
  "async",
  "with",
  "in",
  "and",
  "or",
  "not",
  "None",
  "True",
  "False",
  "pass",
  "yield",
  "match",
  "case",
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
  { key: "terminal", label: "Terminal" },
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
  return [
    { id: "n1", type: "trigger_command", label: "Trigger Command", payload: "welcome", x: 130, y: 80, prefix: "/" },
    { id: "n2", type: "send_message", label: "Send Message", payload: "Benvenuto!", x: 500, y: 260 },
  ];
}

function getDefaultBuilderEdges(): BuilderEdge[] {
  return [{ id: "e1", from: "n1", to: "n2" }];
}

function getDefaultBuilderTargetPath(name: string) {
  return `cogs/generated/${sanitizeBuilderName(name)}.py`;
}

function moduleToCogPath(moduleName: string) {
  return `cogs/${String(moduleName || "").replace(/\./g, "/")}.py`;
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
        url: "",
        footer: "",
        footerIconUrl: "",
        authorName: "",
        authorIconUrl: "",
        authorUrl: "",
        thumbnailUrl: "",
        imageUrl: "",
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

function highlightPythonLine(line: string) {
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
    } else if (PYTHON_KEYWORDS.has(value)) {
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

export default function DiscordBotManager() {
  const [section, setSection] = useState<SectionKey>("overview");
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [config, setConfig] = useState<BotConfig>({
    rootPath: "",
    entryScript: "bot.py",
    pythonCommand: "python",
    pm2ProcessName: "legochris-discord-bot",
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

  const [command, setCommand] = useState("python --version");
  const [commandOutput, setCommandOutput] = useState("");
  const [commandError, setCommandError] = useState("");
  const [commandBusy, setCommandBusy] = useState(false);
  const [terminalFont, setTerminalFont] = useState<TerminalFont>("Cascadia Code");
  const [terminalFontSize, setTerminalFontSize] = useState(13);

  const [modules, setModules] = useState<BotModule[]>([]);
  const [modulesBusy, setModulesBusy] = useState(false);
  const [flows, setFlows] = useState<BuilderFlowMeta[]>([]);

  const [flowName, setFlowName] = useState("welcome_flow");
  const [builderMode, setBuilderMode] = useState<BuilderMode>("visual");
  const [builderTargetPath, setBuilderTargetPath] = useState("cogs/generated/welcome_flow.py");
  const [builderSource, setBuilderSource] = useState("");
  const [builderSourceBusy, setBuilderSourceBusy] = useState(false);
  const [compileResult, setCompileResult] = useState("");
  const [compileBusy, setCompileBusy] = useState(false);

  const [nodes, setNodes] = useState<BuilderNode[]>(getDefaultBuilderNodes());
  const [edges, setEdges] = useState<BuilderEdge[]>(getDefaultBuilderEdges());
  const [selectedNodeId, setSelectedNodeId] = useState("n1");
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

  const ansiSegments = useMemo(() => parseAnsiToSegments(commandOutput || ""), [commandOutput]);

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

  const templateGroups = useMemo(() => {
    return NODE_TEMPLATES.reduce<Record<string, typeof NODE_TEMPLATES>>((acc, template) => {
      if (!acc[template.category]) acc[template.category] = [];
      acc[template.category].push(template);
      return acc;
    }, {});
  }, []);

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
      setStatus(await statusRes.json());

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

  const executeTerminalCommand = async () => {
    if (!command.trim()) return;
    setCommandBusy(true);
    setCommandError("");
    try {
      const res = await fetch(API_ENDPOINTS.botTerminalExec, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, cwd: currentDir }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Errore esecuzione comando");
      setCommandOutput([data.stdout, data.stderr].filter(Boolean).join("\n") || "(nessun output)");
      await refreshStatus();
    } catch (err: any) {
      setCommandError(err.message || "Errore esecuzione comando");
    } finally {
      setCommandBusy(false);
    }
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
    const nextName = "welcome_flow";
    const nextNodes = getDefaultBuilderNodes();
    setFlowName(nextName);
    setBuilderTargetPath(getDefaultBuilderTargetPath(nextName));
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
    const nextNodes = Array.isArray(flow.nodes) && flow.nodes.length ? flow.nodes : getDefaultBuilderNodes();
    const nextEdges = Array.isArray(flow.edges) ? flow.edges : getDefaultBuilderEdges();
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
    const targetPath = moduleToCogPath(moduleName);
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

  return (
    <div className="discord-panel-shell">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg discord-soft">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Discord Bot Control</h2>
          <p className="text-sm text-foreground/60">PM2 logs reali, editor Python singolo, terminale tematizzato e builder blueprint-like</p>
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
                placeholder="Entry script (es: bot.py)"
              />
              <input
                className="px-3 py-2 rounded border border-border bg-background text-sm"
                value={config.pythonCommand}
                onChange={(e) => setConfig((prev) => ({ ...prev, pythonCommand: e.target.value }))}
                placeholder="Python command"
              />
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
                  <div key={`${line.ts}-${i}`}>
                    [{new Date(line.ts).toLocaleTimeString("it-IT")}] {line.level.toUpperCase()} {line.message}
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
                placeholder="Nuovo path (es: cogs/new.py)"
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
                    {highlightPythonLine(line).map((token, i) => (
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
            <div className="flex items-center gap-2 mb-3 text-sm font-medium"><Terminal className="w-4 h-4" />Mini Terminal (cwd: {currentDir})</div>
            <div className="flex gap-2 mb-3">
              <input
                className="flex-1 px-3 py-2 rounded border border-border bg-background font-mono text-sm"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && executeTerminalCommand()}
                placeholder="Scrivi comando shell..."
              />
              <button className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50" disabled={commandBusy} onClick={executeTerminalCommand}>Esegui</button>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-foreground/70">Terminal Font</label>
              <Select value={terminalFont} onValueChange={(value) => setTerminalFont(value as TerminalFont)}>
                <SelectTrigger className="h-9 px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-border bg-card text-foreground custom-scrollbar">
                  <SelectItem value="Cascadia Code">Cascadia Code</SelectItem>
                  <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                  <SelectItem value="Fira Code">Fira Code</SelectItem>
                </SelectContent>
              </Select>
              <label className="text-xs text-foreground/70">Size</label>
              <input
                type="number"
                className="w-16 px-2 py-1.5 text-xs rounded border border-border bg-background"
                min={11}
                max={22}
                value={terminalFontSize}
                onChange={(e) => setTerminalFontSize(Math.min(22, Math.max(11, Number(e.target.value) || 13)))}
              />
            </div>
            {commandError && <div className="mt-2 text-xs text-destructive">{commandError}</div>}
          </div>

          <div
            className="discord-surface h-[450px] overflow-auto rounded-lg p-3 whitespace-pre-wrap custom-scrollbar border border-border"
            style={{
              fontFamily: terminalFont,
              fontSize: `${terminalFontSize}px`,
              background: "linear-gradient(180deg, #20150f 0%, #140f0b 55%, #0f0b09 100%)",
              color: "#ffd7af",
            }}
          >
            {ansiSegments.length === 0 ? (
              <span className="text-[#9f8c76]">Output comando...</span>
            ) : (
              ansiSegments.map((segment, i) => (
                <span key={`ansi-${i}`} style={segment.style}>{segment.text}</span>
              ))
            )}
          </div>
        </div>
      )}

      {section === "modules" && (
        <div className="space-y-4">
          <div className="discord-surface p-4 rounded-lg border border-border bg-background/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium"><Cog className="w-4 h-4" />Moduli (cogs)</div>
            <div className="text-xs text-foreground/60">Lista stato sola lettura</div>
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
            {modules.length === 0 && <div className="px-4 py-5 text-sm text-foreground/60">Nessun modulo trovato in cogs/</div>}
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
                  placeholder="Target cog path (es: cogs/moderation/welcome.py)"
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
                      {highlightPythonLine(line).map((token, i) => (
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
                  <div>Questa modalita permette di modificare qualsiasi cog esistente direttamente dentro l'editor.</div>
                  <div>Puoi aprire un cog dalla colonna sinistra, modificarlo qui e salvarlo sul path target.</div>
                  <div>Se vuoi partire dai nodi visuali, usa "Genera Codice dai Nodi" e poi rifinisci il Python in questa vista.</div>
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
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">URL titolo</label>
                        <input
                          className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                          value={selectedNode.config?.url || ""}
                          onChange={(e) => updateSelectedNodeConfig("url", e.target.value)}
                          placeholder="https://..."
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
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">URL autore</label>
                        <input
                          className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                          value={selectedNode.config?.authorUrl || ""}
                          onChange={(e) => updateSelectedNodeConfig("authorUrl", e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">Icona autore</label>
                        <input
                          className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                          value={selectedNode.config?.authorIconUrl || ""}
                          onChange={(e) => updateSelectedNodeConfig("authorIconUrl", e.target.value)}
                          placeholder="https://..."
                        />
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
                        <label className="text-xs text-foreground/65 mb-1 block">Icona footer</label>
                        <input
                          className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                          value={selectedNode.config?.footerIconUrl || ""}
                          onChange={(e) => updateSelectedNodeConfig("footerIconUrl", e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-foreground/65 mb-1 block">Thumbnail</label>
                        <input
                          className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                          value={selectedNode.config?.thumbnailUrl || ""}
                          onChange={(e) => updateSelectedNodeConfig("thumbnailUrl", e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-foreground/65 mb-1 block">Immagine grande</label>
                      <input
                        className="w-full px-2 py-2 rounded border border-border bg-background text-xs"
                        value={selectedNode.config?.imageUrl || ""}
                        onChange={(e) => updateSelectedNodeConfig("imageUrl", e.target.value)}
                        placeholder="https://..."
                      />
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
