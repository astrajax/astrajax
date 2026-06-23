/** Convert share links to embeddable PDF preview URLs. */
export function embedUrlForPdf(raw: string): string | null {
    const url = raw.trim();
    if (!url) return null;

    const driveId =
        url.match(/\/file\/d\/([^/]+)/)?.[1]
        ?? url.match(/[?&]id=([^&]+)/)?.[1];
    if (driveId) {
        return `https://drive.google.com/file/d/${driveId}/preview`;
    }

    if (/\.pdf(\?|$)/i.test(url)) {
        return url;
    }

    return null;
}
