'use client';

import { useEffect, useState } from 'react';
import { isLiteMotionDevice } from '@/lib/prefer-lite-motion';

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
  const [allowMotionVideo, setAllowMotionVideo] = useState(false);

  useEffect(() => {
    setAllowMotionVideo(!isLiteMotionDevice());
  }, []);

  const showVideo = wantVideo && Boolean(video) && !videoFailed && allowMotionVideo;

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
        <img
          className="svc-hero__img"
          src={poster}
          alt=""
          width={1600}
          height={900}
          decoding="async"
          fetchPriority="high"
        />
      )}
    </div>
  );
}
