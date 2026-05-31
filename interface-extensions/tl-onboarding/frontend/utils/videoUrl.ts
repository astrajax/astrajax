/** Convert share links to embeddable preview URLs. */
export function embedUrlForVideo(raw: string): { embedUrl: string; kind: 'drive' | 'youtube' | 'direct' } | null {
    const url = raw.trim();
    if (!url) return null;

    const ytMatch = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    );
    if (ytMatch) {
        return {
            kind: 'youtube',
            embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0`,
        };
    }

    const driveId =
        url.match(/\/file\/d\/([^/]+)/)?.[1]
        ?? url.match(/[?&]id=([^&]+)/)?.[1];
    if (driveId) {
        return {
            kind: 'drive',
            embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
        };
    }

    if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
        return { kind: 'direct', embedUrl: url };
    }

    return null;
}
