'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { preferStillHeroVideo } from '@/lib/prefer-lite-motion';

function rasterPoster(src: string) {
  return Boolean(src) && !/\.svg(\?|#|$)/i.test(src);
}

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
    setAllowMotionVideo(!preferStillHeroVideo());
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
      ) : rasterPoster(poster) ? (
        <Image
          className="svc-hero__img"
          src={poster}
          alt=""
          fill
          sizes="(max-width: 860px) 100vw, 1600px"
          quality={55}
          loading="eager"
          fetchPriority="high"
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
