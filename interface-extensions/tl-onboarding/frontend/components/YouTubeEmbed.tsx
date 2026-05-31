import React from 'react';

interface YouTubeEmbedProps {
    videoId: string;
    title?: string;
}

export function YouTubeEmbed({ videoId, title = 'YouTube video' }: YouTubeEmbedProps) {
    const src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
    return (
        <figure className="tl-youtube-wrap">
            <div className="tl-youtube-frame">
                <iframe
                    src={src}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                />
            </div>
            {title && (
                <figcaption className="tl-youtube-caption">{title}</figcaption>
            )}
        </figure>
    );
}
