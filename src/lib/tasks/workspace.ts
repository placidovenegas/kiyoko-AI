import type { Json } from '@/types/database.types';
import type { Task } from '@/types';

export interface TaskPromptItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export type TaskDocumentWidth = 'default' | 'wide';
export type TaskDocumentDensity = 'comfortable' | 'compact';

export interface TaskReferenceFile {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface TaskWorkspacePageData {
  html: string;
  text: string;
  prompts: TaskPromptItem[];
  referenceFiles: TaskReferenceFile[];
  lastReviewedAt: string | null;
  icon: string | null;
  cover: string | null;
  documentWidth: TaskDocumentWidth;
  documentDensity: TaskDocumentDensity;
}

const EMPTY_DOCUMENT_HTML = '<p></p>';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function parsePromptItem(value: unknown): TaskPromptItem | null {
  if (!isRecord(value)) return null;

  const id = asString(value.id);
  const title = asString(value.title).trim();
  const content = asString(value.content).trim();
  const createdAt = asString(value.createdAt);

  if (!id || !title || !content || !createdAt) return null;

  return {
    id,
    title,
    content,
    createdAt,
  };
}

function parseReferenceFile(value: unknown): TaskReferenceFile | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const url = asString(value.url);
  const name = asString(value.name);
  const type = asString(value.type);
  const size = typeof value.size === 'number' ? value.size : 0;
  if (!id || !url || !name) return null;
  return { id, url, name, type, size };
}

export function createTaskSortOrder() {
  return Math.floor(Date.now() / 1000);
}

export function createEmptyTaskWorkspacePage(): TaskWorkspacePageData {
  return {
    html: EMPTY_DOCUMENT_HTML,
    text: '',
    prompts: [],
    referenceFiles: [],
    lastReviewedAt: null,
    icon: '📝',
    cover: 'linear-gradient(135deg, rgba(0,111,238,0.18), rgba(14,165,164,0.12))',
    documentWidth: 'default',
    documentDensity: 'comfortable',
  };
}

export function readTaskWorkspacePage(metadata: Task['metadata']): TaskWorkspacePageData {
  const empty = createEmptyTaskWorkspacePage();

  if (!isRecord(metadata)) return empty;
  const page = metadata.page;
  if (!isRecord(page)) return empty;

  const prompts = Array.isArray(page.prompts)
    ? page.prompts.map(parsePromptItem).filter((item): item is TaskPromptItem => item !== null)
    : [];

  const referenceFiles = Array.isArray(page.referenceFiles)
    ? page.referenceFiles.map(parseReferenceFile).filter((item): item is TaskReferenceFile => item !== null)
    : [];

  return {
    html: asString(page.html, EMPTY_DOCUMENT_HTML) || EMPTY_DOCUMENT_HTML,
    text: asString(page.text),
    prompts,
    referenceFiles,
    lastReviewedAt: asNullableString(page.lastReviewedAt),
    icon: asNullableString(page.icon) ?? '📝',
    cover: asNullableString(page.cover) ?? 'linear-gradient(135deg, rgba(0,111,238,0.18), rgba(14,165,164,0.12))',
    documentWidth: asString(page.documentWidth) === 'wide' ? 'wide' : 'default',
    documentDensity: asString(page.documentDensity) === 'compact' ? 'compact' : 'comfortable',
  };
}

export function writeTaskWorkspacePage(
  metadata: Task['metadata'],
  page: TaskWorkspacePageData,
): Exclude<Task['metadata'], null> {
  const nextMetadata: { [key: string]: Json | undefined } = isRecord(metadata)
    ? { ...metadata }
    : {};
  const prompts: Json[] = page.prompts.map((prompt) => ({
    id: prompt.id,
    title: prompt.title,
    content: prompt.content,
    createdAt: prompt.createdAt,
  }));

  const referenceFiles: Json[] = page.referenceFiles.map((f) => ({
    id: f.id,
    url: f.url,
    name: f.name,
    type: f.type,
    size: f.size,
  }));

  return {
    ...nextMetadata,
    page: {
      html: page.html || EMPTY_DOCUMENT_HTML,
      text: page.text,
      prompts,
      referenceFiles,
      lastReviewedAt: page.lastReviewedAt,
      icon: page.icon,
      cover: page.cover,
      documentWidth: page.documentWidth,
      documentDensity: page.documentDensity,
    },
  };
}
