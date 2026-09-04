'use client';

import { useState } from 'react';

/** Exactly one layer: photo OR video (never both competing). */
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
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="svc-hero__img" src={poster} alt="" />
      )}
    </div>
  );
}
