// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RecordLike = any;

export function cellStr(record: RecordLike, fieldName: string): string {
    const field = record.parentTable.getFieldByNameIfExists(fieldName);
    if (!field) return '';
    const v = record.getCellValue(field);
    if (v == null) return '';
    return String(v);
}

export function cellNum(record: RecordLike, fieldName: string): number | null {
    const field = record.parentTable.getFieldByNameIfExists(fieldName);
    if (!field) return null;
    const v = record.getCellValue(field);
    if (typeof v === 'number') return v;
    return null;
}

export function cellBool(record: RecordLike, fieldName: string): boolean {
    const field = record.parentTable.getFieldByNameIfExists(fieldName);
    if (!field) return false;
    return Boolean(record.getCellValue(field));
}

export function cellSelectName(record: RecordLike, fieldName: string): string | null {
    const field = record.parentTable.getFieldByNameIfExists(fieldName);
    if (!field) return null;
    const v = record.getCellValue(field) as { name?: string } | null;
    return v?.name ?? null;
}

export interface CellAttachment {
    url: string;
    filename: string;
}

export function cellUrl(record: RecordLike, fieldName: string): string {
    const field = record.parentTable.getFieldByNameIfExists(fieldName);
    if (!field) return '';
    const v = record.getCellValue(field);
    if (typeof v === 'string') return v;
    return '';
}

export function cellAttachments(record: RecordLike, fieldName: string): CellAttachment[] {
    const field = record.parentTable.getFieldByNameIfExists(fieldName);
    if (!field) return [];
    const v = record.getCellValue(field) as Array<{ url?: string; filename?: string }> | null;
    if (!v?.length) return [];
    return v
        .filter(a => a?.url)
        .map(a => ({ url: a.url!, filename: a.filename ?? 'slides.pdf' }));
}

export function cellLinkedIds(record: RecordLike, fieldName: string): string[] {
    const field = record.parentTable.getFieldByNameIfExists(fieldName);
    if (!field) return [];
    const v = record.getCellValue(field) as Array<{ id: string }> | null;
    return v?.map(x => x.id) ?? [];
}
