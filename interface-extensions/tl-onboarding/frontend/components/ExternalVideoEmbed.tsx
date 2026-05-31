import React from 'react';
import { embedUrlForVideo } from '../utils/videoUrl';

interface ExternalVideoEmbedProps {
    url: string;
    title?: string;
}

export function ExternalVideoEmbed({ url, title }: ExternalVideoEmbedProps) {
    const parsed = embedUrlForVideo(url);

    if (!parsed) {
        return (
            <p className="tl-video-missing">
                Video link not set or not recognised. Paste a Google Drive share link in{' '}
                <strong>Video URL</strong> on this record in Airtable.
            </p>
        );
    }

    return (
        <figure className="tl-youtube-wrap tl-video-wrap">
            <div className="tl-youtube-frame">
                {parsed.kind === 'direct' ? (
                    <video
                        src={parsed.embedUrl}
                        controls
                        playsInline
                        preload="metadata"
                        title={title ?? 'Video'}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    />
                ) : (
                    <iframe
                        src={parsed.embedUrl}
                        title={title ?? 'Video'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                    />
                )}
            </div>
            {title && (
                <figcaption className="tl-youtube-caption">{title}</figcaption>
            )}
        </figure>
    );
}
