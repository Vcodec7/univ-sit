'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface PhotoGalleryProps {
  images: string[];
  hideTitle?: boolean;
}

function isUsableSrc(src: string) {
  const u = String(src || '').trim();
  if (!u || u === '/' || u === '#' || /^javascript:/i.test(u) || u.startsWith('data:')) return false;
  return u.startsWith('/') || /^https?:\/\//i.test(u);
}

export default function PhotoGallery({ images, hideTitle = false }: PhotoGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [failed, setFailed] = useState<Record<string, true>>({});
  const list = (images || []).filter((img) => isUsableSrc(img) && !failed[img]);

  if (list.length === 0) return null;

  return (
    <div style={{ marginTop: hideTitle ? 0 : '2rem' }}>
      {!hideTitle ? (
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)' }}>Галерея</h3>
      ) : null}
      <div
        className="gallery-container"
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '1rem',
          paddingBottom: '1rem',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {list.map((img, idx) => (
          <div
            key={`${img}-${idx}`}
            onClick={() => setSelectedImage(img)}
            style={{
              flex: '0 0 80%',
              maxWidth: '250px',
              aspectRatio: '4/3',
              scrollSnapAlign: 'start',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            }}
            className="gallery-thumb"
          >
            <Image
              src={img}
              alt=""
              fill
              sizes="250px"
              style={{ objectFit: 'cover' }}
              onError={() => setFailed((prev) => ({ ...prev, [img]: true }))}
            />
          </div>
        ))}
      </div>

      {selectedImage ? (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 14000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              color: 'white',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              padding: '0.5rem',
              cursor: 'pointer',
              border: 0,
            }}
          >
            <X size={24} />
          </button>
          <Image
            src={selectedImage}
            alt=""
            width={1600}
            height={900}
            sizes="90vw"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
