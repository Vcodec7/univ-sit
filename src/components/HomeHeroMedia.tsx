'use client';

import { useState } from 'react';

export default function HomeHeroMedia({
  poster,
  video,
  wantVideo,
}: {
  poster: string;
  video: string;
  wantVideo: boolean;
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = wantVideo && Boolean(video) && !videoFailed;

  return (
    <div className="svc-hero__media">
      {/* Poster is always painted so video mode never shows an empty box. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="svc-hero__img" src={poster} alt="" />
      {showVideo ? (
        <video
          className="svc-hero__video"
          src={video}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoFailed(true)}
        />
      ) : null}
    </div>
  );
}
