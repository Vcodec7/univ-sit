'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, Film, Check } from 'lucide-react';

const PHOTO_TEMPLATES = [
  { src: '/brand/templates/section-events.svg', label: 'Афиша' },
  { src: '/brand/templates/section-spaces.svg', label: 'Площадки' },
  { src: '/brand/templates/section-clubs.svg', label: 'Клубы' },
  { src: '/brand/templates/afisha-family.svg', label: 'Вечер' },
];

type Props = {
  currentImage?: string | null;
  currentVideo?: string | null;
  heroKind?: string | null;
};

export default function BrandHeroMediaField({ currentImage, currentVideo, heroKind }: Props) {
  const photoId = useId();
  const videoId = useId();
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const defaultImg = currentImage || '/brand/templates/section-events.svg';
  const [photo, setPhoto] = useState(defaultImg);
  const [kind, setKind] = useState(heroKind === 'video' ? 'video' : 'image');
  const [videoName, setVideoName] = useState('');

  useEffect(() => {
    setPhoto(currentImage || '/brand/templates/section-events.svg');
  }, [currentImage]);

  return (
    <div className="settings-media">
      <input type="hidden" name="heroImageUrl" value={photo} />
      <p className="settings-media__label">Что на главной</p>
      <div className="settings-choice-row">
        <label className={`settings-choice${kind === 'image' ? ' is-on' : ''}`}>
          <input
            type="radio"
            name="heroMediaKind"
            value="image"
            checked={kind === 'image'}
            onChange={() => setKind('image')}
          />
          <ImagePlus size={18} aria-hidden />
          <span>Фото</span>
        </label>
        <label className={`settings-choice${kind === 'video' ? ' is-on' : ''}`}>
          <input
            type="radio"
            name="heroMediaKind"
            value="video"
            checked={kind === 'video'}
            onChange={() => setKind('video')}
          />
          <Film size={18} aria-hidden />
          <span>Видео</span>
        </label>
      </div>

      <div className="settings-media__grid">
        <div className="settings-media__card">
          <div className="settings-media__preview" style={{ backgroundImage: `url(${photo})` }}>
            <span>Фон-фото</span>
          </div>
          <p className="settings-media__hint">Шаблоны — свои картинки без чужих фото. Можно загрузить своё.</p>
          <div className="settings-media__thumbs">
            {PHOTO_TEMPLATES.map((t) => (
              <button
                key={t.src}
                type="button"
                className={`settings-media__thumb${photo === t.src ? ' is-on' : ''}`}
                onClick={() => setPhoto(t.src)}
                title={t.label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.src} alt="" />
                {photo === t.src ? <Check size={14} /> : null}
              </button>
            ))}
          </div>
          <label htmlFor={photoId} className="btn btn-secondary settings-media__btn">
            Своё фото
          </label>
          <input
            ref={photoRef}
            id={photoId}
            type="file"
            name="heroFile"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setPhoto(URL.createObjectURL(f));
            }}
          />
        </div>

        <div className="settings-media__card">
          <div className="settings-media__preview settings-media__preview--video">
            <Film size={28} />
            <span>{currentVideo ? 'Видео уже есть' : 'Видео не загружено'}</span>
          </div>
          <p className="settings-media__hint">Тихий ролик по кругу. Файл хранится отдельно: можно держать и фото, и видео.</p>
          <label htmlFor={videoId} className="btn btn-secondary settings-media__btn">
            {videoName || 'Выбрать mp4'}
          </label>
          <input
            ref={videoRef}
            id={videoId}
            type="file"
            name="heroVideoFile"
            accept="video/mp4,video/quicktime,.mp4,.mov"
            hidden
            onChange={(e) => setVideoName(e.target.files?.[0]?.name || '')}
          />
          <input
            name="heroVideoUrl"
            className="settings-input"
            defaultValue={currentVideo || ''}
            placeholder="Путь к видео, если уже загружено"
          />
        </div>
      </div>
    </div>
  );
}
