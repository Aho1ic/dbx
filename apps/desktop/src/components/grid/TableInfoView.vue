<script setup lang="ts">
import { computed, ref, watch, onMounted, type Component } from "vue";
import { useI18n } from "vue-i18n";
import { TableProperties, ListTree, KeyRound, Link2, RotateCcw, Code2, Copy, WrapText, Loader2, Search, X } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import type { ColumnInfo, ForeignKeyInfo, IndexInfo, QueryTab, TriggerInfo } from "@/types/database";
import * as api from "@/lib/api";
import { copyToClipboard } from "@/lib/clipboard";
import { useSqlHighlighter } from "@/composables/useSqlHighlighter";

type TableInfoTab = "columns" | "indexes" | "foreignKeys" | "triggers" | "ddl";

const props = defineProps<{
  tab: QueryTab;
}>();

const { t } = useI18n();
const { highlight } = useSqlHighlighter();

const activeTab = ref<TableInfoTab>(props.tab.tableInfoActiveTab ?? "columns");
const ddlContent = ref("");
const ddlLoading = ref(false);
const ddlWrap = ref(true);

const indexes = ref<IndexInfo[]>([]);
const indexesLoaded = ref(false);
const indexesLoading = ref(false);
const indexesError = ref("");
const foreignKeys = ref<ForeignKeyInfo[]>([]);
const foreignKeysLoaded = ref(false);
const foreignKeysLoading = ref(false);
const foreignKeysError = ref("");
const triggers = ref<TriggerInfo[]>([]);
const triggersLoaded = ref(false);
const triggersLoading = ref(false);
const triggersError = ref("");
const searchQuery = ref("");

const target = computed(() => props.tab.tableInfoTarget);
const columns = computed<ColumnInfo[]>(() => target.value?.columns ?? []);

watch(activeTab, (val) => {
  searchQuery.value = "";
  props.tab.tableInfoActiveTab = val;
});

const tabs = computed(
  () =>
    [
      {
        id: "columns" as const,
        label: t("grid.tableInfoColumns"),
        icon: ListTree,
        count: columns.value.length,
      },
      { id: "indexes" as const, label: t("grid.tableInfoIndexes"), icon: KeyRound, count: indexes.value.length },
      {
        id: "foreignKeys" as const,
        label: t("grid.tableInfoForeignKeys"),
        icon: Link2,
        count: foreignKeys.value.length,
      },
      { id: "triggers" as const, label: t("grid.tableInfoTriggers"), icon: RotateCcw, count: triggers.value.length },
      { id: "ddl" as const, label: "DDL", icon: Code2 },
    ] satisfies Array<{ id: TableInfoTab; label: string; icon: Component; count?: number }>,
);

async function selectTab(tab: TableInfoTab) {
  activeTab.value = tab;
  if (tab === "ddl") await fetchDdl();
  else if (tab === "indexes") await fetchIndexes();
  else if (tab === "foreignKeys") await fetchForeignKeys();
  else if (tab === "triggers") await fetchTriggers();
}

async function fetchDdl() {
  if (!props.tab.connectionId || !target.value) return;
  ddlLoading.value = true;
  try {
    ddlContent.value = await api.getTableDdl(props.tab.connectionId, props.tab.database || "", target.value.schema || props.tab.database || "", target.value.tableName);
  } catch (e: any) {
    ddlContent.value = `-- Error: ${e}`;
  } finally {
    ddlLoading.value = false;
  }
}

async function fetchIndexes() {
  if (!props.tab.connectionId || !target.value || indexesLoaded.value || indexesLoading.value) return;
  indexesLoading.value = true;
  indexesError.value = "";
  try {
    indexes.value = await api.listIndexes(props.tab.connectionId, props.tab.database || "", target.value.schema || props.tab.database || "", target.value.tableName);
    indexesLoaded.value = true;
  } catch (e: any) {
    indexesError.value = String(e?.message || e);
  } finally {
    indexesLoading.value = false;
  }
}

async function fetchForeignKeys() {
  if (!props.tab.connectionId || !target.value || foreignKeysLoaded.value || foreignKeysLoading.value) return;
  foreignKeysLoading.value = true;
  foreignKeysError.value = "";
  try {
    foreignKeys.value = await api.listForeignKeys(props.tab.connectionId, props.tab.database || "", target.value.schema || props.tab.database || "", target.value.tableName);
    foreignKeysLoaded.value = true;
  } catch (e: any) {
    foreignKeysError.value = String(e?.message || e);
  } finally {
    foreignKeysLoading.value = false;
  }
}

async function fetchTriggers() {
  if (!props.tab.connectionId || !target.value || triggersLoaded.value || triggersLoading.value) return;
  triggersLoading.value = true;
  triggersError.value = "";
  try {
    triggers.value = await api.listTriggers(props.tab.connectionId, props.tab.database || "", target.value.schema || props.tab.database || "", target.value.tableName);
    triggersLoaded.value = true;
  } catch (e: any) {
    triggersError.value = String(e?.message || e);
  } finally {
    triggersLoading.value = false;
  }
}

watch(
  () => [props.tab.connectionId, props.tab.database, target.value?.schema, target.value?.tableName],
  () => {
    ddlContent.value = "";
    indexes.value = [];
    indexesLoaded.value = false;
    indexesError.value = "";
    foreignKeys.value = [];
    foreignKeysLoaded.value = false;
    foreignKeysError.value = "";
    triggers.value = [];
    triggersLoaded.value = false;
    triggersError.value = "";
    selectTab(activeTab.value);
  },
);

onMounted(() => {
  selectTab(activeTab.value);
});

const filteredColumns = computed(() => {
  if (!searchQuery.value) return columns.value;
  const q = searchQuery.value.toLowerCase();
  return columns.value.filter((c) => c.name.toLowerCase().includes(q) || c.data_type.toLowerCase().includes(q) || (c.column_default ?? "").toLowerCase().includes(q) || (c.comment ?? "").toLowerCase().includes(q));
});

const filteredIndexes = computed(() => {
  if (!searchQuery.value) return indexes.value;
  const q = searchQuery.value.toLowerCase();
  return indexes.value.filter((i) => i.name.toLowerCase().includes(q) || i.columns.some((c) => c.toLowerCase().includes(q)));
});

const filteredForeignKeys = computed(() => {
  if (!searchQuery.value) return foreignKeys.value;
  const q = searchQuery.value.toLowerCase();
  return foreignKeys.value.filter((fk) => fk.name.toLowerCase().includes(q) || fk.column.toLowerCase().includes(q) || fk.ref_table.toLowerCase().includes(q) || fk.ref_column.toLowerCase().includes(q));
});

const filteredTriggers = computed(() => {
  if (!searchQuery.value) return triggers.value;
  const q = searchQuery.value.toLowerCase();
  return triggers.value.filter((trg) => trg.name.toLowerCase().includes(q));
});

const filteredDdlContent = computed(() => {
  if (!ddlContent.value) return "";
  const html = highlight(ddlContent.value);
  if (!searchQuery.value) return html;

  const escaped = searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return html.replace(/>([^<]*)</g, (_, text) => {
    return `>${text.replace(regex, "<mark>$1</mark>")}<`;
  });
});

function copyDdl() {
  copyToClipboard(ddlContent.value);
}

function toggleDdlWrap() {
  ddlWrap.value = !ddlWrap.value;
}
</script>

<template>
  <div class="h-full flex flex-col bg-background min-w-0">
    <div class="flex items-center gap-2 px-3 py-1.5 border-b shrink-0 bg-muted/20">
      <TableProperties class="w-3.5 h-3.5 text-muted-foreground" />
      <span class="text-xs font-medium flex-1 min-w-0 truncate">{{ target?.tableName }}</span>
      <Button v-if="activeTab === 'ddl'" variant="ghost" size="icon" class="h-5 w-5" @click="copyDdl">
        <Copy class="w-3 h-3" />
      </Button>
      <Button v-if="activeTab === 'ddl'" variant="ghost" size="icon" class="h-5 w-5" :class="{ 'bg-accent': ddlWrap }" @click="toggleDdlWrap">
        <WrapText class="w-3 h-3" />
      </Button>
    </div>

    <div class="grid grid-cols-5 border-b bg-muted/30 shrink-0">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="h-9 min-w-0 px-1.5 text-[11px] text-muted-foreground border-b-2 border-transparent hover:bg-muted/50 hover:text-foreground"
        :class="{ 'border-primary text-foreground bg-muted/40': activeTab === tab.id }"
        :title="tab.label"
        @click="selectTab(tab.id)"
      >
        <component :is="tab.icon" class="mx-auto h-3.5 w-3.5" />
        <span class="block truncate">{{ tab.label }}</span>
      </button>
    </div>

    <div class="px-2 py-1.5 border-b shrink-0 bg-muted/30">
      <div class="relative">
        <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input v-model="searchQuery" :placeholder="t('grid.tableInfoSearch')" class="w-full h-7 pl-7 pr-6 text-xs bg-background rounded border border-border focus:outline-none focus:border-primary/50" @keydown.escape="searchQuery = ''" />
        <button v-if="searchQuery" class="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" @click="searchQuery = ''">
          <X class="w-3 h-3" />
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'columns'" class="flex-1 min-h-0 overflow-auto">
      <div v-if="searchQuery && filteredColumns.length === 0" class="p-6 text-center text-xs text-muted-foreground">
        {{ t("grid.tableInfoNoResults") }}
      </div>
      <table v-else class="w-full text-xs table-fixed">
        <thead class="sticky top-0 bg-muted/80 backdrop-blur text-muted-foreground">
          <tr class="border-b">
            <th class="text-left font-medium px-3 py-2 w-[28%]">{{ t("grid.columnName") }}</th>
            <th class="text-left font-medium px-3 py-2 w-[22%]">{{ t("grid.columnType") }}</th>
            <th class="text-left font-medium px-3 py-2 w-[22%]">{{ t("grid.tableInfoDefault") }}</th>
            <th class="text-left font-medium px-3 py-2 w-[28%]">{{ t("grid.columnComment") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="column in filteredColumns" :key="column.name" class="border-b hover:bg-muted/70">
            <td class="px-3 py-2 font-medium truncate" :title="column.name">
              <span class="inline-flex items-center gap-1.5 max-w-full">
                <KeyRound v-if="column.is_primary_key" class="h-3 w-3 text-amber-500 shrink-0" />
                <span class="truncate">{{ column.name }}</span>
              </span>
            </td>
            <td class="px-3 py-2 font-mono text-[11px] text-muted-foreground truncate" :title="column.is_nullable ? column.data_type : column.data_type + ' NOT NULL'">{{ column.data_type }}<span v-if="!column.is_nullable" class="ml-1 opacity-70">NOT NULL</span></td>
            <td class="px-3 py-2 font-mono text-[11px] text-muted-foreground truncate" :title="column.column_default ?? ''">
              {{ column.column_default ?? "" }}
            </td>
            <td class="px-3 py-2 text-[11px] text-muted-foreground truncate" :title="column.comment ?? ''">
              {{ column.comment ?? "" }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="activeTab === 'indexes'" class="flex-1 min-h-0 overflow-auto">
      <div v-if="indexesLoading" class="h-full flex items-center justify-center">
        <Loader2 class="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
      <div v-else-if="indexesError" class="p-3 text-xs text-destructive">{{ indexesError }}</div>
      <div v-else-if="searchQuery && filteredIndexes.length === 0" class="p-6 text-center text-xs text-muted-foreground">
        {{ t("grid.tableInfoNoResults") }}
      </div>
      <div v-else-if="indexes.length === 0" class="p-6 text-center text-xs text-muted-foreground">
        {{ t("grid.tableInfoEmpty") }}
      </div>
      <div v-else class="divide-y">
        <div v-for="index in filteredIndexes" :key="index.name" class="p-3 text-xs">
          <div class="font-medium truncate">{{ index.name }}</div>
          <div class="mt-1 flex flex-wrap gap-1">
            <span v-if="index.is_primary" class="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600">PK</span>
            <span v-if="index.is_unique" class="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-600">UNIQUE</span>
            <span v-if="index.index_type" class="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">{{ index.index_type }}</span>
          </div>
          <div class="mt-2 font-mono text-[11px] text-muted-foreground break-all">
            {{ index.columns.join(", ") }}
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'foreignKeys'" class="flex-1 min-h-0 overflow-auto">
      <div v-if="foreignKeysLoading" class="h-full flex items-center justify-center">
        <Loader2 class="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
      <div v-else-if="foreignKeysError" class="p-3 text-xs text-destructive">{{ foreignKeysError }}</div>
      <div v-else-if="searchQuery && filteredForeignKeys.length === 0" class="p-6 text-center text-xs text-muted-foreground">
        {{ t("grid.tableInfoNoResults") }}
      </div>
      <div v-else-if="foreignKeys.length === 0" class="p-6 text-center text-xs text-muted-foreground">
        {{ t("grid.tableInfoEmpty") }}
      </div>
      <div v-else class="divide-y">
        <div v-for="fk in filteredForeignKeys" :key="`${fk.name}:${fk.column}`" class="p-3 text-xs">
          <div class="font-medium truncate">{{ fk.name }}</div>
          <div class="mt-1 font-mono text-[11px] text-muted-foreground break-all">{{ fk.column }} -> {{ fk.ref_table }}.{{ fk.ref_column }}</div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'triggers'" class="flex-1 min-h-0 overflow-auto">
      <div v-if="triggersLoading" class="h-full flex items-center justify-center">
        <Loader2 class="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
      <div v-else-if="triggersError" class="p-3 text-xs text-destructive">{{ triggersError }}</div>
      <div v-else-if="searchQuery && filteredTriggers.length === 0" class="p-6 text-center text-xs text-muted-foreground">
        {{ t("grid.tableInfoNoResults") }}
      </div>
      <div v-else-if="triggers.length === 0" class="p-6 text-center text-xs text-muted-foreground">
        {{ t("grid.tableInfoEmpty") }}
      </div>
      <div v-else class="divide-y">
        <div v-for="trigger in filteredTriggers" :key="trigger.name" class="p-3 text-xs">
          <div class="font-medium truncate">{{ trigger.name }}</div>
          <div class="mt-1 text-[11px] text-muted-foreground">{{ trigger.timing }} {{ trigger.event }}</div>
        </div>
      </div>
    </div>

    <pre v-else-if="activeTab === 'ddl' && !ddlLoading" class="flex-1 min-w-0 text-xs font-mono p-3 overflow-auto ddl-code leading-5 select-text" :class="ddlWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'" v-html="filteredDdlContent"></pre>
    <div v-else class="flex-1 flex items-center justify-center">
      <Loader2 class="w-4 h-4 animate-spin text-muted-foreground" />
    </div>
  </div>
</template>

<style scoped>
.ddl-code :deep(.ddl-kw) {
  color: oklch(0.42 0.05 245);
  font-weight: 600;
}

.ddl-code :deep(.ddl-ident) {
  color: oklch(0.46 0.04 165);
}

.ddl-code :deep(.ddl-str) {
  color: oklch(0.5 0.07 40);
}

:global(.dark) .ddl-code :deep(.ddl-kw) {
  color: oklch(0.74 0.06 235);
}

:global(.dark) .ddl-code :deep(.ddl-ident) {
  color: oklch(0.78 0.05 155);
}

:global(.dark) .ddl-code :deep(.ddl-str) {
  color: oklch(0.78 0.07 55);
}
</style>
